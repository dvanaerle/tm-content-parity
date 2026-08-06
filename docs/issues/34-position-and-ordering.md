# 34 — Where is it? Position for every finding

**What to build:** an editor reading a finding knows where to look. A finding
that says `hier` or `carports` names the heading it sits under and offers a link
that opens the live page scrolled to that text — on both sides.

Today a finding carries no position at all: id, store, page, check, class, the
two strings, an occurrence count and a score. Grouping actively destroys
position. So a one-word finding sends the editor hunting through the page by eye,
and `occurrences: 6` means it was six different places.

**Blocked by:** [33](33-directional-text-classes.md) — the spec forbids moving
the same rows twice, and phase 1's measurement must be settled against an
unmoved baseline before anything else changes the comparison.

**Status:** ready-for-agent

**Implements:** spec [32](32-scannable-log-and-six-stores.md), phase 2.

- [ ] Text elements, images and links come from **one** document-order walk, on a
      shared counter. They are three separate walks today, so their positions
      cannot be interleaved.
- [ ] Image and link records carry an `index`. For a deduplicated record it is
      the position of the **first** occurrence.
- [ ] Ticket 06's image rules are untouched: dedupe stays, the basename key
      stays, set comparison stays. `index` is additive and does **not** enter the
      finding id, so no id moves and no override detaches.
- [ ] A finding carries its **anchor heading** — the nearest heading before it in
      document order, null when it precedes every heading.
- [ ] Every finding row offers a link that scrolls the live page to its text, for
      production and for the new site.
- [ ] A finding with more than one occurrence says so on the row.
- [ ] **The row-ordering defect is fixed.** A new-only row currently sorts by its
      index in the *new* document compared against *production* indices — badly
      wrong wherever the documents differ in length, as on `fotogalerij` with 178
      production elements against 9. Anchor a new-only row to the production
      position of the nearest preceding matched pair.
- [ ] No DOM path and no per-position finding id.
- [ ] Tests at the existing extract and compare seams, including the asymmetric
      ordering case and the null anchor heading.
