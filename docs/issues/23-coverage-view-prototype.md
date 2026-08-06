# 23 — The store-level Coverage view: how does a 181 × 6 matrix read?

Type: prototype
Status: closed — folded into 34
Blocked by: 11
Parent: ../map.md

> **Folded 2026-08-06** into [34 — The coverage matrix, and bulk
> muting](34-coverage-matrix-bulk-mute.md). The seed data is already on disk, so
> a prototype of the matrix and the real matrix would be almost the same thing.
> Build the simplest matrix and judge the real one. Every question below is an
> acceptance criterion on ticket 34.

## Question

Ticket 11 put the presence checks in a **store-level Coverage view**, separate
from the per-page ledger. Presence findings have nowhere else to live: to put them
in a page ledger means to render a ledger for a page that is absent.

What does that view look like, and does it stay readable at full size?

## The shape of the data

- 181 NL pages × 6 stores = 1086 cells. **635 are null** — the page is not in that
  store's sitemap.
- Only **20** rows hold all six stores. **53** rows are NL only.
- Per store: nl 181, be 126, de 45, uk 42, be_fr 29, fr 28.
- The DE tab opens with about **136** `missing-page` findings on day one. Ticket 11
  accepted this on purpose, and an editor clears it by muting.

## What to settle

- **One matrix, or one view per store?** Ticket 11 says the bar is per store and
  is never summed with the parity bar.
- **Does the matrix show muted cells?** A muted cell is a deliberate scope
  decision, and hiding it makes the view look complete when it is not.
- **Bulk muting.** Ticket 11 gives the UI a "mute for all stores" action that
  writes five events. Does the matrix need row-wise and column-wise bulk actions
  as well? 136 single clicks is not acceptable.
- **The route into the page ledger.** A cell that is not null must lead to that
  store page's ledger, including its Axis B tab.
- **`orphan-page`.** A page that exists only in a non-NL store is a finding
  against the **NL** store. Where does it appear in a matrix that is keyed on NL
  pages?

## Notes

Resolve with `mattpocock-skills:prototype`. Ticket 12 owns the per-page ledger and
its tabs; do not prototype the ledger here. The two views have different
primitives — a matrix, and a two-column diff.
