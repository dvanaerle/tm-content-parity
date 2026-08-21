"""Judge every Copy / Case-or-punctuation finding against the Tuinmaximaal glossary.

Input   the per-page reports in data/reports/ and the January 2026 word list.
Output  verdicts.json -- one row per finding, with the evidence that settled it.

The glossary is a list of NOUNS, not a style guide, so it settles a row only in
the one case where it can: a glossary term is what changed, and exactly one side
spells it the glossary's way. Everything else is out of scope and says so rather
than guessing, because a wrong verdict here becomes a wrong row in the log.

Three rules earn their keep, each for a false positive the naive version made:

  Entries, not strings.  `Terrasoverkapping(en)` licenses both numbers, so a
  singular/plural swap is not a glossary matter. Variants are grouped by the
  cell they came from and compared per entry.

  Both-valid is not a verdict.  The list holds `Shading Panel` AND `Gumax(R)
  Shading Panel`. When each side matches some entry exactly, the glossary
  permits both and the choice is an editor's.

  `Gumax BV` is the company.  The bare-brand rule is about the trademark, and
  the legal entity in the terms and conditions is correctly written without it.
"""

import collections
import glob
import json
import os
import re
import sys

import openpyxl

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))
XLSX = os.path.expanduser(
    os.path.join("~", "Downloads", "Woordenlijst Tuinmaximaal januari 2026 - All.xlsx")
)

# Which glossary column a store's copy is written in. Polish has no store yet.
LANG_OF_STORE = {"nl": "nl", "be": "nl", "uk": "en", "de": "de", "fr": "fr", "be_fr": "fr"}
LANGS = ["nl", "en", "de", "fr", "pl"]

# A label or heading is short. Case and word choice inside a long paragraph are
# grammar and editing, which a noun list cannot adjudicate.
SHORT = 90

# The brand mark on its own is not a term this audit reasons about by presence --
# the trademark rule below owns it, and as an entry it only produced noise.
BRAND_ONLY = {"Gumax®", "Gumax", "Tuinmaximaal"}


def norm(s):
    return re.sub(r"\s+", " ", (s or "").replace("\xa0", " ")).strip()


def variants(cell):
    """The forms one glossary cell licenses: plural brackets and / alternatives."""
    s = norm(cell)
    if not s:
        return []
    out = set()
    parts = [p.strip() for p in re.split(r"\s*/\s*", s)] if ("/" in s and "(" not in s) else [s]
    for p in parts:
        if not p:
            continue
        out.add(p)
        m = re.fullmatch(r"(.*?)\(([^()]{1,4})\)(.*)", p)
        if m:
            out.add(norm(m.group(1) + m.group(3)))
            out.add(norm(m.group(1) + m.group(2) + m.group(3)))
    return [v for v in out if len(v) >= 4]


def load_glossary():
    """{lang: [entry]}, longest first. An entry is one cell's licensed forms."""
    wb = openpyxl.load_workbook(XLSX, data_only=True)
    ws = wb["Blad1"]
    entries = {lang: [] for lang in LANGS}
    for n, row in enumerate(ws.iter_rows(min_row=4, values_only=True)):
        for i, lang in enumerate(LANGS):
            if not isinstance(row[i], str):
                continue
            forms = [v for v in variants(row[i]) if v not in BRAND_ONLY]
            if forms:
                entries[lang].append(
                    {
                        "row": n + 4,
                        "canonical": norm(row[i]),
                        # Longest first within the entry too, so the fullest form
                        # of a licensed pair is the one that claims the span.
                        "forms": sorted(set(forms), key=len, reverse=True),
                    }
                )
    # A longer entry that matches must suppress the shorter entries inside it, or
    # the two-word cell and the four-word cell containing it argue with each
    # other about a capital that only one of them governs.
    for lang in LANGS:
        entries[lang].sort(key=lambda e: len(e["forms"][0]), reverse=True)
    return entries


def scan(text, entries):
    """Longest-match-wins, per entry. -> {row: {"exact": bool, "form": str}}"""
    low = text.lower()
    taken = [False] * len(low)
    hits = {}
    for e in entries:
        for form in e["forms"]:
            fl = form.lower()
            start = 0
            while True:
                i = low.find(fl, start)
                if i < 0:
                    break
                if not any(taken[i : i + len(fl)]):
                    for j in range(i, i + len(fl)):
                        taken[j] = True
                    exact = text[i : i + len(fl)] == form
                    prev = hits.get(e["row"])
                    if prev is None:
                        hits[e["row"]] = {"exact": exact, "form": form, "term": e["canonical"]}
                    elif exact:
                        # Any exact occurrence is enough to call the entry spelled
                        # correctly on this side.
                        prev["exact"] = True
                start = i + 1
    return hits


def foreign_leak(text, lang, entries):
    """Glossary terms from another language, which is untranslated copy."""
    low = text.lower()
    own = {f.lower() for e in entries[lang] for f in e["forms"]}
    found = set()
    for other in LANGS:
        if other == lang:
            continue
        for e in entries[other]:
            for f in e["forms"]:
                if len(f) >= 8 and f.lower() in low and f.lower() not in own:
                    found.add(f)
    return found


def bare_brand(text):
    """Bare `Gumax` used as the trademark -- not the `Gumax BV` legal entity."""
    return len(re.findall(r"Gumax(?!®)(?!\s+B\.?V\.?\b)", text))


def judge(store, prod, new, entries):
    lang = LANG_OF_STORE[store]
    p, n = norm(prod), norm(new)
    short = len(p) <= SHORT and len(n) <= SHORT
    ev = []

    # Untranslated copy is the strongest signal there is: a French store showing
    # Dutch glossary terms is wrong whatever else the row says.
    leak_p, leak_n = foreign_leak(p, lang, entries), foreign_leak(n, lang, entries)
    if leak_n and not leak_p:
        ev.append(("untranslated", "production", sorted(leak_n)[0]))
    elif leak_p and not leak_n:
        ev.append(("untranslated", "new", sorted(leak_p)[0]))

    hp, hn = scan(p, entries[lang]), scan(n, entries[lang])

    # Both sides name some product exactly, but different ones. The list holds
    # both, so it licenses both and which one belongs here is an editor's call --
    # `Shading Panel` against `Gumax(R) Shading Panel` is not a spelling defect.
    exact_p = {r for r, h in hp.items() if h["exact"]}
    exact_n = {r for r, h in hn.items() if h["exact"]}
    both_valid = bool(short and exact_p and exact_n and exact_p != exact_n)

    for row in set(hp) | set(hn):
        a, b = hp.get(row), hn.get(row)
        if a and b:
            # Same entry both sides, spelled the glossary's way on only one.
            if a["exact"] != b["exact"] and short:
                ev.append(("case", "new" if b["exact"] else "production", a["term"]))
        elif short and not both_valid:
            hit = b or a
            side = "new" if b else "production"
            if hit["exact"]:
                ev.append(("term", side, hit["term"]))

    # The glossary writes the brand with the registered mark, never bare. Only
    # comparable when both sides still mention the brand -- a side that dropped
    # it entirely has not spelled it better, it has changed the sentence. And
    # only on a short label: in a paragraph the bare brand is usually nowhere
    # near the words that actually changed, so it would judge the wrong span.
    marks = (len(re.findall(r"Gumax®", p)), len(re.findall(r"Gumax®", n)))
    bare_p, bare_n = bare_brand(p), bare_brand(n)
    if short and (bare_p + marks[0]) and (bare_n + marks[1]) and bare_p != bare_n:
        ev.append(("trademark", "new" if bare_n < bare_p else "production", "Gumax(R)"))
    if short and bare_p and bare_n and bare_p == bare_n:
        ev.append(("trademark", "neither", "Gumax(R)"))

    sides = {side for _, side, _ in ev}
    if not ev:
        return ("both-valid" if both_valid else "out-of-scope"), ev
    if sides == {"neither"}:
        return "neither", ev
    real = sides - {"neither"}
    if len(real) == 1:
        return real.pop(), ev
    return "conflict", ev


def depunct(s):
    """The same words, ignoring case, the brand mark and edge punctuation."""
    s = s.replace("®", "").casefold()
    s = re.sub(r"[^\w\s]+", " ", s, flags=re.UNICODE)
    return re.sub(r"\s+", " ", s).strip()


def tier(prod, new, verdict, ev):
    """How far this row can be trusted.

    `settled` is the only tier a bulk write may touch. It means the two sides are
    the same words and differ only in case, punctuation or the brand mark -- which
    is the whole of what the glossary is authoritative about. Anything where the
    words themselves changed is an editing decision wearing a glossary term, and
    the audit says `review` rather than pretending to have settled it.
    """
    if verdict not in ("new", "production"):
        return "review"
    kinds = {e["kind"] for e in ev}
    same_words = depunct(prod) == depunct(new)
    if same_words and kinds <= {"case", "trademark"}:
        return "settled"
    return "review"


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    entries = load_glossary()
    rows = []
    for path in sorted(glob.glob(os.path.join(REPO, "data", "reports", "*.json"))):
        with open(path, encoding="utf-8") as fh:
            report = json.load(fh)
        for f in report.get("findings") or []:
            if f["class"] in ("copy", "casing", "meta-casing"):
                rows.append(f)

    out = []
    for r in rows:
        verdict, ev = judge(r["store"], r["prod"], r["new"], entries)
        out.append(
            {
                "id": r["id"],
                "store": r["store"],
                "page": r["page"],
                "check": r["check"],
                "class": r["class"],
                "prod": norm(r["prod"]),
                "new": norm(r["new"]),
                "anchorHeading": r.get("anchorHeading"),
                "verdict": verdict,
                "tier": tier(norm(r["prod"]), norm(r["new"]), verdict, [
                    {"kind": k, "side": s, "term": t} for k, s, t in ev
                ]),
                "evidence": [{"kind": k, "side": s, "term": t} for k, s, t in ev],
            }
        )

    with open(os.path.join(HERE, "verdicts.json"), "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=1)

    print("findings:", len(out))
    for k, v in collections.Counter(o["verdict"] for o in out).most_common():
        print("  %-14s %d" % (k, v))
    pairs = {(o["store"], o["class"], o["prod"], o["new"]): o for o in out}
    print("distinct pairs:", len(pairs))
    for k, v in collections.Counter(o["verdict"] for o in pairs.values()).most_common():
        print("  %-14s %d" % (k, v))
    print("settled (bulk-eligible):")
    for k, v in collections.Counter(
        o["verdict"] for o in out if o["tier"] == "settled"
    ).most_common():
        print("  %-14s %d findings" % (k, v))


if __name__ == "__main__":
    main()
