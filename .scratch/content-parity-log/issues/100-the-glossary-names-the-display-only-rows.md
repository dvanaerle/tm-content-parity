# 100 — The glossary names the display-only rows, and the English labels

Type: build
Status: resolved 2026-08-17 — merged into 98 as slice 7. Not built; the work is unchanged and it moved.
Blocked by: 98
Parent: 58-axis-a-meta-check.md

**What to build:** two edits to `CONTEXT.md`, so the glossary stops describing a panel
that no longer exists and records the one rule about it that a later reader would
otherwise undo.

The `Display-only difference` entry ends *"The `<head>` panel is made of these"*. That
was true when every head row was display only. After ticket 98 three of the five rows
make findings, so the sentence is false and points a reader at the wrong model of the
panel.

The English labels need writing down for the opposite reason: they look like an
oversight. Without a recorded rule the next reader translates **Meta Title, Meta
Keywords, Meta Description, Robots, Canonical** into Dutch to match the tabs — and is
not wrong to try.

## Reading list

Read these and nothing else. If you need more, the ticket is wrong: say so and stop.

- `CONTEXT.md` § `Display-only difference`
- `web/src/lib/classes.mjs` — where the labels now live
- `98-the-meta-tab-becomes-a-checklist.md` — the shipped panel, which is what the
  glossary must describe

## Slices

- [ ] 1 `Display-only difference` names **Meta Keywords and Canonical** instead of
      claiming the `<head>` panel is made of these.
- [ ] 2 A new entry records the English-label rule: these five name the Magento admin
      field the editor goes to in order to fix the value, so they are not translated.

If ticket 92 dropped the keywords row, criterion 1 names Canonical alone.

## Gate

`npm test`. No number moves — this ticket changes prose.

## Answer

**Merged into [98](98-the-meta-tab-becomes-a-checklist.md) as slice 7, 2026-08-17.**
Nothing here is withdrawn and nothing is built. This ticket was two prose edits to
`CONTEXT.md`, blocked by 98, describing the panel 98 builds — its own gate says *no number
moves; this ticket changes prose*. A glossary entry for a panel is not separable from the
panel: 98 lands the five rows and then, in the same pass, makes the glossary describe them.
A separate ticket only creates a window in which `CONTEXT.md` is wrong about the interface.

**One premise here has changed and slice 7 carries the corrected version.** This ticket
argues the labels need writing down because *they look like an oversight — the only English
labels in a Dutch interface*. [ADR
0014](../../../docs/adr/0014-the-interface-speaks-english.md) made the whole interface
English on 2026-08-13, so that reason is spent. The rule survives on a better footing: the
five are field names in Magento, so they are identifiers and not prose, and they stay
untranslated even if a future reader reverses ADR 0014.

Read 98. This file is kept as the record of where the work was written.
