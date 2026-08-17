# 04 — A page shows its sibling

**What to build:** an editor clicks a diverging page in the block list and sees, in document order,
this page against its sibling page — where on the page the two stores stop agreeing. Ticket 02
answers *which page*; this answers *where on it*.

**Blocked by:** 02 — the sibling match and the unit-level comparison. It does not need 03.

**Status:** ready-for-agent

- [ ] A fifth tab on the store page shows this page against its sibling, both stores side by side, in
      document order.
- [ ] The tab is **absent — not empty** — on a page that has no sibling.
- [ ] It says which side it compares, and it is production, in the same words ticket 02 uses.
- [ ] A row carries **no override control, no finding id and no class pill**, and no decision is
      offered anywhere on the tab.
- [ ] Rows are not tinted by direction: `lost` and `added` are fields on a class, a block difference
      has no class, and neither store lost anything — they differ.
- [ ] A run of agreeing rows collapses into a **context marker** that says how many blocks it holds
      and expands, reusing the existing collapse predicate.
- [ ] A page that agrees entirely says so in the marker's own words, and does not read as though the
      comparison failed to run. Half of these pages are byte-identical.
- [ ] **Landing does not reach this tab**: there is no finding id to land on, and a link naming one
      must not open it.
- [ ] A row too large for a word comparison is **uncompared**, in the existing word and the existing
      meaning — both sides shown in full, neither coloured.
- [ ] The reading is decided as values in the pure layer and only rendered by the component.
- [ ] No count, bar, denominator or roll-up moves.
- [ ] The full suite passes, including the stopword guard.

## Traps

- **The tab is not a fifth check.** `Check` stays the closed family `text | links | images | meta`.
  The reserved "fifth tab" comment in the page's tab list refers to **axis B**; correct it, do not
  reuse it.
- **Do not name the tab after a store.** It is drawn on both stores of the block, so `BE` on `nl`'s
  page and `NL` on `be`'s page would be two labels for one tab. **Sibling** is the glossary's word
  and it is not a store name.
- **Do not write "fold" for the collapse.** That word is reserved for two other meanings; a run
  **collapses** and the row that stands for it is a **context marker**.
- **Do not offer a decision here** however natural it looks beside four tabs that all carry one. The
  decision that crosses a block is ticket 03, it is a decision about an axis-A finding, and it
  belongs on the tab that shows that finding.
- **Do not let the tab imply the sibling is wrong.** Neither store is the reference. The block list
  and this tab both compare two equals.
