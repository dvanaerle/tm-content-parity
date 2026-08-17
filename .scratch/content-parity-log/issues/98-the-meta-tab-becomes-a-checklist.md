# 98 — The Meta tab becomes a checklist an editor can tick

Type: build
Status: ready-for-agent
Blocked by: 97
Parent: 58-axis-a-meta-check.md

> **2026-08-13, [ADR 0011](../../../docs/adr/0011-the-mute-is-withdrawn.md):** the two
> mentions of the mute below are struck. *Like any other finding* now means ticked off or
> dismissed, and the class drives the dashboard filter and the Taken tab but keys nothing.
> Nothing else in this ticket is affected.

**What to build:** an editor opens the Meta tab and reads five named rows. Three of
them can be ticked off or ~~muted~~ dismissed like any other finding; two sit below a rule as
display only, and the note says they are not counted. The tab carries a badge, so a
head defect is visible without opening the tab.

**The tab keeps its five-row shape and does not become a `FindingTable`.** The head
has five known slots and an editor reads it as a checklist of slots, not as a list of
defects, so the field is the useful first column. The class pill is **not** on the
row: with the field fixed and both values side by side, a `META-CASING` pill next to
`…beschutting.` against `…beschutting` says nothing the cells do not. The class still
drives the dashboard filter ~~, the mute key~~ and the Taken tab, which keeps its pills.

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
the editor goes to in order to fix it. ~~They are the only English labels in a Dutch
interface, which is why ticket [100](100-the-glossary-names-the-display-only-rows.md)
writes the rule down.~~ — **2026-08-13, [ADR
0014](../../../docs/adr/0014-the-interface-speaks-english.md): the interface speaks English
on all six stores**, so these five stopped being exceptional. The rule is still worth
recording, and it changes shape: the five are not translated **even if a future reader
reverses ADR 0014**, because they are field names in another system rather than prose.
Slice 7 below carries it.

~~If ticket 92 found keywords empty on both sides everywhere, **the Meta Keywords row
does not ship** and this ticket records the number that dropped it. The rule and the
note then stand above Canonical alone.~~

**Measured 2026-08-14 by ticket
[92](92-measure-meta-title-and-keywords-presence.md)`## Answer`: the Meta Keywords row
ships.** Keywords is not empty everywhere. It is on **356 of 777** status-200 production
page-sides (45.8%) and **291 of 764** new ones (38.1%), carrying **224** and **176**
distinct strings — a per-page field, not one string pasted site-wide. Present-but-empty is
**4** page-sides per side, and it is one page (`install a veranda`) in `be_fr`, `de`, `fr`
and `uk`, so the empty-everywhere case does not hold. The row also has something to say:
on the 722 comparable pairs, **54 pages lose the field, 12 change it, 4 gain it**, 270
agree and 382 have it on neither side. The loss is 8 to 11 pages in every one of the six
stores, so it is a migration behaviour and not one editor.

Two consequences for the rows below. **`uk` is where this row will look emptiest** — 91 of
its 121 pairs have keywords on neither side, against `nl`'s 59 of 124 — so an editor of the
British store will meet a `—` on both sides more often than not, and slice 1's shape has to
survive that. And the row stays **display only** as designed: 92 named no class and slice 2
gives it no override control, so those 54 losses are shown and not counted.

Ticket 92's other verdict does not change this ticket's five rows, and is recorded here so
a reader does not go looking: **`metaTitle` was refused**, because `meta[name="title"]` is
byte-identical to `<title>` on 1,539 of 1,539 page-sides. The Meta Title row therefore
shows `<title>`, which on this corpus *is* Magento's Meta Title field, byte for byte.

## Reading list

Read these and nothing else. If you need more, the ticket is wrong: say so and stop.

- `web/src/components/Ledger.jsx` — the panel and its rows
- `web/src/lib/classes.mjs` — `TONE`, `CHECK_LABEL`, and the comment that is wrong
- `web/src/components/OverrideControl.jsx`
- `34-position-and-ordering.md` — what "every finding says where it is" bought
- `CONTEXT.md` § `Display-only difference` — slice 7 only, and read it last: the
  glossary describes the panel, so it is edited after the panel exists

## Slices

In build order. **Criterion 1 is your first failing test.** Show the red before you
write the implementation. Do not plan across all seven.

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
- [ ] 7 **The glossary describes the panel this ticket shipped** — two edits to
      `CONTEXT.md`, absorbed from ticket 100 on 2026-08-17. The `Display-only
      difference` entry ends *"The `<head>` panel is made of these"*, which was true
      when every head row was display only; after slices 1 to 3 three of the five rows
      make findings, so it names **Meta Keywords and Canonical** instead. And a new
      entry records the English-label rule: these five name the Magento admin field the
      editor goes to in order to fix the value, so they are not translated — not as an
      exception to the interface language, but because a field name in another system is
      an identifier and not prose. Prose only; no number moves.

## The distortion, accepted

The page bar is `shown / production.elements`, and a head finding is not a body
element. A short page with two meta findings reads slightly worse than the arithmetic
deserves. It is small, and it is the price of one counter. Do not add a second
denominator to fix it.

## Gate

`npm test`, then `node compare/measure.mjs nl`. **No finding count moves** — this
ticket renders what ticket 97 already produced.
