# 68 — The content view survives a folded unit

**What to build:** a page of folded units is still read by scanning, and it still
paints quickly.

The content view exists so that a difference is found by scanning and not by reading.
Nothing clamps a row today. After ticket 67 a folded paragraph is about 1,250
characters in a cell that is roughly 40% of the width, so one row is 20 to 24 wrapped
lines and 450 to 550 pixels tall. A page carries up to 288 rows. A jump link to a row
lands inside a row that is taller than the screen, so the reader cannot tell where
they are.

The word diff costs more as well. It builds a full table over the tokens of each
side, per cell, in the browser. A folded block is about 380 tokens, so one row is a
table of roughly 145,000 cells, and there are hundreds of rows.

**Blocked by:** 67.

**Status:** ready-for-agent

**Origin:** the grilling of 2026-08-07 on the content unit, questions 7 and 8.

- [ ] A cell clamps to about three lines, with a control that opens it.
- [ ] A row that carries a finding opens by itself. The quiet rows stay short, and
      the rows that must be read are already open.
- [ ] The word diff trims the common prefix and the common suffix before it builds
      its table. One changed word in a long paragraph must cost almost nothing, and
      that is the common case.
- [ ] A cap for the genuinely rewritten paragraph, where a word-level diff has little
      value. Above the cap, report the unit as replaced.
- [ ] A jump to a row lands with the row's first line at the top of the screen.
- [ ] First paint on the worst page is measured before and after, and the number is
      written in the ticket.
