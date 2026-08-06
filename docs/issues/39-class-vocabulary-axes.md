# 39 — The class vocabulary learns about axes

Type: task (prefactor)
Status: ready-for-agent
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

## Three questions to settle first

Ticket 11 did not see these. Settle them here, write the answer in this ticket,
and do not open them again in a later ticket.

1. **`restructured` is used by both axes.** Ticket 02 made it an axis A text
   class. Ticket 11 uses the same class for the heading outline cap. A record
   with one `axis` field cannot be in two axes. Also, `muteKey()` is
   `store|page|class`, so an editor who mutes `restructured` mutes it on both
   axes with one click. Give axis B its own class, or make `axis` a list. A
   separate class is the recommendation: the mute key makes one shared class a
   trap, and the two findings do not mean the same thing.
2. **`orphan-page` has no producer.** Ticket 04 found no page that is only in a
   non-NL store, and ticket 16 owns the crawl that could find one. Declare the
   class, build no producer, and say so in the ticket.
3. **Axis B reports must not go in `data/reports/`.** `web/src/lib/reports.mjs`
   reads that directory with one flat listing and gives every file to the axis A
   dashboard. A sibling directory keeps the two apart.

## The nine new classes

`missing-page`, `orphan-page`, `untranslated`, `alt-untranslated`,
`meta-untranslated`, `meta-presence`, `outline-shape` and `image-missing-store`
are shown. `image-store-variant` is hidden.

## Acceptance criteria

- [ ] `FINDING_CLASSES` holds ticket 33's table plus the nine axis B classes.
      Each record carries an axis.
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
the bar, the mute and the dismissal with no new code.
