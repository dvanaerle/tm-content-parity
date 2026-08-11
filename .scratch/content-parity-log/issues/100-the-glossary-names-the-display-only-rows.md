# 100 — The glossary names the display-only rows, and the English labels

Type: build
Status: ready-for-agent
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
