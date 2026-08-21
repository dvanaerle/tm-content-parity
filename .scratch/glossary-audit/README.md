# Glossary audit — Copy and Case or punctuation

Judges every `copy`, `casing` and `meta-casing` finding against
*Woordenlijst Tuinmaximaal januari 2026*, and says which side is right.

## Running it

```sh
python .scratch/glossary-audit/audit.py   # -> verdicts.json  (derived, gitignored)
python .scratch/glossary-audit/emit.py    # -> REPORT.md + dismiss-new-correct.sql
```

`audit.py` reads `data/reports/*.json` and the word list from `~/Downloads/`. It
re-runs in seconds against any later snapshot, which is the point of keeping it:
after a round of copy fixes it says whether they landed and what drifted since.

## What it can and cannot decide

The word list is a list of **nouns**, not a style guide. It settles a row only
where the two sides are the same words differing in case, punctuation or the ®
mark — `tier: "settled"`. On the 2026-08-19 snapshot that was 44 of 1,432
findings, and the other 1,388 are rewrites, prices and prose it has no opinion
on. The tier exists because the ungated version produced verdicts that could not
be defended: it "won" rows like `Sortiment ansehen` → `Lose Teile Lose Teile
Sortiment ansehen`, which is a duplication bug and not a glossary improvement.

Three rules earn their keep, each for a false positive:

- **Entries, not strings.** `Terrasoverkapping(en)` licenses both numbers, so a
  singular/plural swap is not a glossary matter.
- **Both-valid is not a verdict.** The list holds `Shading Panel` *and* `Gumax®
  Shading Panel`; when each side matches some entry exactly, it licenses both.
- **`Gumax BV` is the company.** The bare-brand rule is about the trademark, and
  the legal entity in the terms and conditions is correctly written without it.

## Why only half of it becomes SQL

`dismiss-new-correct.sql` carries the rows where the **new site** follows the list
and production does not. Those are dismissals — `CONTEXT.md`: a judgement, *"these
two exact strings are acceptable"* — which is exactly what they are.

The rows where **production** is right get no SQL. `fixed` is a claim of fact
("I corrected this"), nobody has, and re-check would contradict it. They are a CMS
work list in `REPORT.md` instead.

Each insert is guarded on `overrides_current`, so the file is re-runnable and
cannot overrule a decision an editor already made about the same finding. On the
2026-08-19 snapshot 22 statements write 20 rows: two were already dismissed by
hand, and the audit reached the same verdict independently.

## The finding worth acting on

The new site **contradicts itself across pages**. `Gumax® hor schuifdeur` and the
style names `Modern` / `Klassiek` each appear in *both* verdict lists — right on
one page, wrong on another. So these are not 44 independent decisions but a
handful of rules applied unevenly, and fixing them at the source would close more
findings than this SQL does. 20 rows against a work denominator of 17,831 is
0.11%; the classification is worth more than the row count.
