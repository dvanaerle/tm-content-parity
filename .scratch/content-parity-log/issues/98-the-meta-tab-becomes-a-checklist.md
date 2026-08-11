# 98 — The Meta tab becomes a checklist an editor can tick

Type: build
Status: ready-for-agent
Blocked by: 97
Parent: 58-axis-a-meta-check.md

**What to build:** an editor opens the Meta tab and reads five named rows. Three of
them can be ticked off or muted like any other finding; two sit below a rule as
display only, and the note says they are not counted. The tab carries a badge, so a
head defect is visible without opening the tab.

**The tab keeps its five-row shape and does not become a `FindingTable`.** The head
has five known slots and an editor reads it as a checklist of slots, not as a list of
defects, so the field is the useful first column. The class pill is **not** on the
row: with the field fixed and both values side by side, a `META-CASING` pill next to
`…beschutting.` against `…beschutting` says nothing the cells do not. The class still
drives the dashboard filter, the mute key and the Taken tab, which keeps its pills.

```
                              Productie              Nieuwe site
Meta Title  [tick][menu]      Bedrijfsinformatie     Bedrijfsinformatie | Tuinmaximaal
Meta Keywords                 terrasoverkapping…     terrasoverkapping…
Meta Description [tick][menu] …beschutting.          …beschutting
Robots  [tick][menu]          index                  noindex
─────────────────────────────────────────────────────────────────
Alleen weergave, niet in de teller.
Canonical                     —                      https://…/bedrijfsinformatie
```

**The labels are English, and that is deliberate.** They name the Magento admin field
the editor goes to in order to fix it. They are the only English labels in a Dutch
interface, which is why ticket [100](100-the-glossary-names-the-display-only-rows.md)
writes the rule down.

If ticket 92 found keywords empty on both sides everywhere, **the Meta Keywords row
does not ship** and this ticket records the number that dropped it. The rule and the
note then stand above Canonical alone.

## Reading list

Read these and nothing else. If you need more, the ticket is wrong: say so and stop.

- `web/src/components/Ledger.jsx` — the panel and its rows
- `web/src/lib/classes.mjs` — `TONE`, `CHECK_LABEL`, and the comment that is wrong
- `web/src/components/OverrideControl.jsx`
- `34-position-and-ordering.md` — what "every finding says where it is" bought

## Slices

In build order. **Criterion 1 is your first failing test.** Show the red before you
write the implementation. Do not plan across all six.

- [ ] 1 Five rows in order — Meta Title, Meta Keywords, Meta Description, Robots,
      then a rule, then Canonical — with their labels read from the shared label
      module. That module's comment stops claiming it holds only Dutch labels.
- [ ] 2 Rows 1, 3 and 4 carry override controls **inline after the label**. No row is
      added for them.
- [ ] 3 The rule and the note above Canonical survive, and the note no longer
      mentions ticket 21. An absent control is not a statement: without the note the
      display-only rows differ from a `same` row only by a missing control, which
      reads as "nothing to do here" rather than "this is not counted".
- [ ] 4 The Meta tab carries a count badge. The content view is the body in document
      order, so the badge is the only place a head count can live.
- [ ] 5 ~~A meta finding rendered in **Taken** says **in de `<head>`** where a text
      finding says *onder «heading»*.~~ **Ticket 81 removed the Taken tab.** The want
      survives and it moves: a meta finding reached through the dashboard's
      *Verschillen* list says **in de `<head>`** where a text finding says
      *onder «heading»*. A silent blank would spend what ticket 34 bought.
- [ ] 6 Meta findings do **not** appear in the content view.

## The distortion, accepted

The page bar is `shown / production.elements`, and a head finding is not a body
element. A short page with two meta findings reads slightly worse than the arithmetic
deserves. It is small, and it is the price of one counter. Do not add a second
denominator to fix it.

## Gate

`npm test`, then `node compare/measure.mjs nl`. **No finding count moves** — this
ticket renders what ticket 97 already produced.
