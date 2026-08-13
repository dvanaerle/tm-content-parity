# 39 — The class vocabulary learns about axes

Type: task (prefactor)
Status: needs-triage — **2026-08-13**. Was `ready-for-agent`. The conclusion may still be
right; the **argument for it is void**. This ticket recommends a separate class per axis
because *"`muteKey()` is `store|page|class`, so an editor who mutes `restructured` mutes it
on both axes"* — and ADR 0011 withdrew the mute, so no key over-reaches any more. Decide
the split on taxonomy, or do not split. An agent building it today would implement a
distinction justified by a feature that does not exist. Tickets 43 and 44 carry the same
argument and are parked the same way.
Blocked by: 33 — spec 32 rewrites the same class table
Parent: ../map.md

> **Sequenced behind ticket 33.** Spec 32 retires `structure` for a directional
> `text-missing` / `text-added` pair and adds `heading-level` and `tag-changed`.
> That is the same table this ticket adds an axis to. Ticket 33 must land and be
> **measured** first: spec 32 says phase 1 is measured before phase 2 starts, and
> a class table that changes twice makes the second change unmeasurable. Add the
> axis to whatever table ticket 33 leaves behind.

## What to build

Nothing changes on the screen. This ticket makes the next seven possible.

`compare/vocabulary.mjs` holds the class table. Each record has `check`, `shown`
and `meaning`. Ticket 11 adds nine more and says the records must also carry an
**axis**, because the two axes have separate tabs, separate bars and separate
task lists. A consumer must be able to ask for one axis.

Every consumer that exists today asks for axis A. The dashboard, the ledger, the
class pills and the page bar must behave exactly as they do now. If a number
moves on the nl store, this ticket is wrong.

The two tunable numbers from ticket 11 go into `compare/contract.mjs`, beside
ticket 02's 0.6 pair threshold, so that every tunable number is in one file:

- skip a text string of fewer than **3 words**, after you remove digits,
  punctuation and units
- **0.5** divergent positions is the `restructured` cap for the heading outline

## Four questions to settle first

Ticket 11 did not see these. Settle them here, write the answer in this ticket,
and do not open them again in a later ticket.

1. **`restructured` is used by both axes.** Ticket 02 made it an axis A text
   class. Ticket 11 uses the same class for the heading outline cap. A record
   with one `axis` field cannot be in two axes. ~~Also, `muteKey()` is
   `store|page|class`, so an editor who mutes `restructured` mutes it on both
   axes with one click.~~ Give axis B its own class, or make `axis` a list. ~~A
   separate class is the recommendation: the mute key makes one shared class a
   trap~~, and the two findings do not mean the same thing. — **struck 2026-08-13, ADR
   0011.** The two struck clauses were the whole mechanical argument, and they are void: no
   key over-reaches any more. **The first sentence survives untouched** — one `axis` field
   still cannot hold two axes — and *the two findings do not mean the same thing* is the
   taxonomic argument the re-triage has to decide on. Decide it on that, or do not split.
2. **`orphan-page` has no producer, and on 2026-08-11 it stopped being owed one.**
   Declare the class, build no producer, and say so in the ticket. The reason is no
   longer "no known instances": ticket [16](16-new-site-page-discovery.md) closed
   because **production is the source of truth**, so a page only the new site has is
   a deletion candidate on the one-sided-page checklist
   ([20](.out-of-scope/20-one-sided-pages-checklist.md)) and not a finding class. Do not build a
   producer for it on the strength of the older prose in tickets 11, 23, 24 or 41.
3. **Axis B reports must not go in `data/reports/`.** `web/src/lib/reports.mjs`
   reads that directory with one flat listing and gives every file to the axis A
   dashboard. A sibling directory keeps the two apart.
4. **`classInfo().direction` has no consumer.** From the ticket 35 review. Ticket
   33 added it, and its comment says the diff needs the direction and not the tone,
   because `text-added` is hidden by default and therefore grey while its cell must
   still be green. `Diff.jsx` does not read it: the cell tint comes from `prod ===
   null` or `next === null`. Delete it, or make `Diff.jsx` read it. There is one
   fact that decides this: the tint tests `null`, and `Cell` treats `''` as absent
   as well, so a side that is an empty string shows "niet aanwezig" in an **untinted**
   cell. Find out whether a normalised `''` can reach the diff. If it can, the
   direction is the correct key and `Diff.jsx` must read it. If it cannot, delete
   the field. Either way, add the test.

## The seven new classes

`missing-page`, `orphan-page`, `untranslated`, `alt-untranslated`,
`meta-untranslated`, `meta-presence` and `outline-shape` are shown.

**There were nine until 2026-08-13.** `image-missing-store` and
`image-store-variant` are **not declared**: ticket 45 is parked `wontfix` at
`.out-of-scope/45-images-across-stores.md`, so neither class will ever get a producer.
`orphan-page` is declared without one on purpose, because it is a class the coverage view
must leave room for; these two are a check that is refused. Do not add them on the
strength of the older prose in tickets 11, 23 or 24.

## Acceptance criteria

- [ ] `FINDING_CLASSES` holds ticket 33's table plus the seven axis B classes.
      Each record carries an axis.
- [ ] Neither image class is in the table.
- [ ] The three questions above have a written answer in this ticket.
- [ ] `npm test` is green, and the tests cover the axis filter.
- [ ] The nl dashboard counts do not move against **ticket 33's** measured
      baseline. Do not use the pre-33 numbers: ticket 33 moves them on purpose.
- [ ] No axis B class is visible anywhere in the interface yet.

## Notes

A wide change with a small blast radius: four files import `vocabulary.mjs`
(`compare/contract.mjs`, `overrides/state.mjs`, `web/src/lib/classes.mjs`,
`web/src/lib/reports.mjs`). Do it in one step.

`ObservedPage` in `compare/contract.mjs` is the seam that gives axis B the whole
override machinery for free. Anything axis B makes that satisfies that shape gets
the bar ~~, the mute~~ and the dismissal with no new code. — **2026-08-13, ADR 0011: the
machinery is one judgement smaller.**
