# 94 — The extract carries the head, and a stale one refuses to compare

Type: build
Status: ready-for-agent
Blocked by: 92
Parent: 58-axis-a-meta-check.md

**What to build:** the extractor reads five things from the head and destroys one of
them — `noindex` is `/noindex/i.test(...)`, so the robots string is gone. After this
ticket an extract carries what the head actually said, and it carries a version
marker, so an extract written before the change cannot be compared and reported as
clean.

**The version marker is the important half.** Add a field to `PageMeta` without it
and an old extract yields `undefined`, which folds to `null` on both sides, and
`stateOf()` then calls it `same`. Every extract on disk goes stale the moment the
extractor changes, so both sides read stale and the head panel is **silently green**.
That is the worst shape a defect in this tool can take.

**Ticket 92's verdict decides the field list.** If it says `metaTitle` or `keywords`
is absent on both sides everywhere, that field is **not added**, and the number that
killed it is recorded here. Do not add a field on a guess.

## Ticket 92's verdict, measured 2026-08-14

Pasted from [92](92-measure-meta-title-and-keywords-presence.md)`## Answer`, which holds
the per-store tables and the probe path. **One field of the two is added.** Neither field
is absent, so neither dies the death this ticket predicted — and `metaTitle` dies anyway.

**`metaTitle`: DROP. Do not add it.** It is present on **1,539 of the 1,541** status-200
page-sides read (819 cells, six stores, both sides), so absence is not the reason. The
reason is that it is byte-identical to that page's own `<title>` on **1,539 of the 1,539**
page-sides that carry a value, and **differs on 0** — including 0 that differ only
invisibly, so the verdict does not rest on tier-1 folding. On the 722 comparable pairs it
holds on both sides at once, all 722. A field that can never disagree with a field
`PageMeta` already has is not a second field, and adding it would give the head panel two
rows that cannot say different things. `<title>` **is** Magento's Meta Title field on this
corpus, byte for byte.

**`keywords`: KEEP. Add it.** Present on **356 of 777** production page-sides (45.8%) and
**291 of 764** new ones (38.1%), carrying **224** and **176** distinct strings — a per-page
field, not one string pasted site-wide. Present-but-empty is **4** page-sides per side,
and it is one page (`install a veranda`) in four stores, so the empty-everywhere case that
would have dropped it does not hold. On the 722 comparable pairs the field **moves**: 54
pages lose it, 12 change it, 4 gain it, 270 agree, 382 have it on neither side.

**What this does to slice 2**, below: `keywords` is captured, `metaTitle` is not, and the
number that skipped it is the 1,539-of-1,539 duplication above.

Two things this verdict does **not** settle, both out of this ticket's scope: the classes
(ticket 97's), and whether the 54 losses become findings at all — ticket 98's design has
the Meta Keywords row carrying no override control, so on that design the row shows and
does not count.

## Reading list

Read these and nothing else. If you need more, the ticket is wrong: say so and stop.

- `compare/contract.mjs` — `PageMeta`, `PageExtract`
- `crawl/extract.mjs` and `crawl/extract.test.mjs`
- `compare/30-compare.mjs` — where an extract is loaded
- ticket 92's verdict, pasted above

No re-crawl happens here. This ticket is verified on fixtures; ticket
[95](95-recrawl-six-stores-with-the-new-head.md) runs the crawl.

## Slices

In build order. **Criterion 1 is your first failing test.** Run
`npm test -- crawl/extract.test.mjs` and show the red before you write the
implementation. Then the next criterion. Do not plan across all five.

- [ ] 1 `PageMeta` carries the raw `robots` content string. The derived `noindex`
      boolean stays beside it: the panel shows the string, the rule reads the boolean.
- [ ] 2 The fields ticket 92 kept are captured — `keywords`, and ~~`metaTitle` from
      `meta[name="title"]`~~. A field 92 refused is skipped, and this line says which:
      **92 refused `metaTitle`**, on 1,539 of 1,539 page-sides byte-identical to
      `<title>` and 0 differing. `keywords` is the one field this slice adds.
- [ ] 3 `PageExtract` carries `extractVersion`, and the extractor writes the current
      value.
- [ ] 4 The compare stage refuses an extract below the current version with a named
      error that says what to do — re-crawl with `--force`.
- [ ] 5 A test proves the refusal fires on a fixture missing the new fields. Without
      it the guard is a line of code protecting against the failure of a line of code.

## Gate

`npm test`. `node compare/measure.mjs nl` now **refuses**, because every extract on
disk is stale. That is the ticket working, and it is why 95 comes next.
