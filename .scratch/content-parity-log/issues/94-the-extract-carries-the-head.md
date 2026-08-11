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
- [ ] 2 The fields ticket 92 kept are captured — `keywords`, and `metaTitle` from
      `meta[name="title"]`. A field 92 refused is skipped, and this line says which.
- [ ] 3 `PageExtract` carries `extractVersion`, and the extractor writes the current
      value.
- [ ] 4 The compare stage refuses an extract below the current version with a named
      error that says what to do — re-crawl with `--force`.
- [ ] 5 A test proves the refusal fires on a fixture missing the new fields. Without
      it the guard is a line of code protecting against the failure of a line of code.

## Gate

`npm test`. `node compare/measure.mjs nl` now **refuses**, because every extract on
disk is stale. That is the ticket working, and it is why 95 comes next.
