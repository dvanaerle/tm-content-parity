# 138 — Suggest what should be a Custom Variable or a CMS Block

Type: grilling
Status: wontfix — **parked 2026-08-18**, on the measurement in this file. The idea is
sound and the corpus does not carry it: the content that wants to be reused is **chrome**,
and the log is a `<main>`-shaped instrument by definition. Parked before a line of it was
written, on the numbers below.
Parent: ../../map.md

## The question

Magento has **Custom Variables** and **CMS Blocks**. Both are store-view scoped, so one
entity can hold six values — `nl`, `be`, `be_fr`, `de`, `fr`, `uk`. That is useful for
content an editor writes once and shows in many places. Could the log suggest, on a view
of its own, which text should become one?

The goal behind it, in the user's words: *I want the content basically be more
maintainable.*

## The measurement

Production content units only, taken from `data/extract/<store>/*.json` on 2026-08-18.
Excludes the 42 `nl` extracts whose `status !== 200` and whose body is the 404 page —
they were the single largest repetition signal in the raw data, and they are noise.

| store | pages | units | distinct `norm` | on 2+ pages | 5+ | 10+ | 25+ | 50+ |
|---|---|---|---|---|---|---|---|---|
| nl    | 137 | 6461 | 4147 | 761 | 91  | 40 | 0 | 0 |
| be    | 129 | 5704 | 3987 | 390 | 82  | 40 | 0 | 0 |
| be_fr | 121 | 5275 | 3724 | 356 | 78  | 39 | 0 | 0 |
| de    | 133 | 5885 | 3943 | 602 | 108 | 41 | 1 | 0 |
| fr    | 122 | 5280 | 3724 | 358 | 77  | 38 | 0 | 0 |
| uk    | 128 | 5931 | 4139 | 408 | 87  | 41 | 1 | 0 |

**Nothing appears on 50+ pages, and nothing on 80% of pages, in any store.** The deepest
recurrence in `nl` is 17 pages of 137.

The 10+ tail in `nl` is 40 texts and it is not reusable content:

- **18 are `<a>` link labels** — `Fotogalerij` (17), `Montage` (16), `Toon alle blog
  artikelen` (16), `Sluiten` (16), `Lees meer` (15), `Stel nu samen` (12).
- **6 are section headings** — `Afmetingen` (14), `Kleuren` (10), `Veelgestelde vragen`
  (16). Table and section furniture.
- **Two genuine clusters, both on the same ~11 showroom pages** — the showroom contact
  card (`Openingstijden`, `(+31) 040-235 0528`, `Maandag t/m vrijdag`, `08:00 - 21:00
  uur`, … as ~11 separate one-line units) and the showroom FAQ (6 `h4` questions).

Block-shaped text — 60 characters or more — is thinner still. In `nl`: 267 such texts on
2+ pages, 141 on 3+, **7 on 5+ and 0 on 10+**. The two deepest are a benefits bullet list
(251 chars, 7 pages) and `Bovendien profiteert u bij Tuinmaximaal van: - Gratis snelle
levering …` (371 chars, 6 pages). Most 3-page long repeats are photo-gallery captions.

So the feature's entire output for the largest store is **two proposals**, and they are
recorded here, which is the whole of the value it would have delivered.

## Why it is parked

**1. The reusable content is chrome, and the log cannot see it.** Phone numbers, opening
hours, delivery promises, USP strips, warranty text — in Magento these are footer, header
and USP-bar content. `CONTEXT.md`: *"Chrome — template furniture outside the content
boundary. It is not editor work on this page, and the log never compares it."* The
measurement confirms it from the other side: **nothing** recurs site-wide inside `<main>`.
That is not a fact about this site's content, it is a fact about where the boundary is.
Chasing it means widening the content boundary, which is ADR 0003 and the boundary
definition both, for a report read once per store.

**2. The advice is unverifiable.** The log reads rendered HTML. A page that includes a CMS
Block and a page with the same text pasted in are byte-identical in the output. So no
decision could be offered on a suggestion: a "done, this is a Block now" tick would be a
**fix claim** that re-check can never contradict, and `CONTEXT.md` refuses exactly that
shape. It could only ever be advice — no id, no override, no bar — in the manner of a
block difference under ADR 0017.

**3. It is not a difference, so it fits nothing the log has.** Every output today is a
claim about production **against** the new site. A recurrence is a claim about production
against **itself**. It is not a `work` class, not `information`, not a display-only
difference.

**4. The multiplier argument does not survive the numbers.** The attractive version was:
*this text is on 40 pages, 22 of them carry an open `copy` finding, so one CMS Block is
one fix.* At a maximum depth of 17 pages and a median of 2, **`repeatsInStore()` is
already the better instrument** and it is built — a repeat groups the same difference
across pages and is the queue. A recurrence view would restate a shallower version of it.

**5. `Block` is the most overloaded word in the repo.** It already means three things: a
**content unit** *is* "one block that an editor edits", a nested **block** breaks a unit,
and a **language block** is two stores sharing a language. A fourth meaning is refused. If
this ever revives, the Magento construct is written `CMS Block` with the `CMS` always
attached, and bare `Block` stays taken.

## Re-open trigger

Two conditions, and the first is the one that matters.

**The rendered HTML does mark Page Builder blocks.** `crawl/lib-extract.mjs` has
`insideCmsBlock(node)` — an ancestor carrying `data-content-type="block"` — with its own
comment: *"the rendered HTML carries no block identifier, so this can only say yes or no —
never which block"*. That module is **orphaned; nothing imports it**. A yes/no is enough
for a different and better question than this ticket asked:

> Which content is a CMS Block on **production** and pasted inline on the **new site**?

That is a parity question, it is measurable from markup the crawler already fetches, it
needs no recurrence index, and its answer is maintenance debt being created right now
rather than a suggestion about content that already exists. If that is wanted, it is a new
ticket and not a revival of this one.

**Magento-side data would change everything.** `map.md` under *Not yet specified* already
holds this: *"Naming the CMS block behind a section. The rendered HTML carries no block
identifier, so a task cannot yet point at the right admin entity. Needs Magento-side
data."* With a read of `cms_block` and `core_variable` — codes, store-view values — the
tool could say which admin entity a section is, and the suggestion becomes a join against
what exists instead of a guess from repetition. That is the condition under which the
original question is worth asking again.

## Two things the measurement found that are worth more than this ticket

Both are outside this ticket's scope and neither is actioned here.

**Alias pages are inflating the counts.** 13 of 136 `nl` pages are near-duplicates of each
other at Jaccard ≥ 0.9 over their normalised unit sets:

| pages | identical units |
|---|---|
| `fotogalerij` ≈ `algemene-fotogalerij` ≈ `fotogalerij/zonwering` | 163, same order |
| `zonwering/buiten` ≈ `zonwering-buiten` | 108 |
| `zonwering/prijzen` ≈ `zonwering-prijzen` | 64 |
| `(home)` ≈ `home-nl` | 37 |

`de` adds 3 pairs, including `(de)boden-bambus` ≈ `(de)boeden-bambus` at 0.99, which looks
like a typo'd url key that both sides serve. If these are one piece of content at several
urls then ~10% of the `nl` corpus is counted two or three times — in the denominator, in
the bar, in the roll-up, and against the rule that *a repeat is measured in pages and
there is no second number beside it*. The seed rule `duplicate-in-store` dedupes **urls**,
not text, so nothing catches this today. **Wants its own ticket and a decision on whether
production canonicalises between them.**

**42 of 179 `nl` production extracts hold the 404 body.** `status !== 200`, body *"Dat kan
komen door een verouderde link…"*. Other stores have 0–1. `loadProductionExtracts()`
filters on status 200, so the built log is very likely clean — but anything reading
`sides.production.elements` without checking `status` gets 42 pages of phantom content in
one store. Worth one verification pass.

## Notes

The data needed for any revival is **already on disk, twice**: every `ContentUnit`
(`index, tag, kind, level, raw, norm`) of every page is in `data/extract/<store>/*.json`
and again in `data/reports/<store>__*.json` under `sides.production.elements`.
`loadProductionExtracts(store)` in `web/src/lib/reports.mjs` already returns
`Map<page, ContentUnit[]>` for a whole store. No crawl and no new producer stage would be
needed — the live constraint is payload, not disk: the `nl` dashboard is already 332 kB
gzip and the search index docblock forbids shipping unit text.

Nothing waits on this ticket. It is a leaf.
