# 04 — A page shows its sibling

**What to build:** an editor clicks a diverging page in the block list and sees, in document order,
this page against its sibling page — where on the page the two stores stop agreeing. Ticket 02
answers *which page*; this answers *where on it*.

**Blocked by:** 02 — the sibling match and the unit-level comparison. It does not need 03.

**Status:** resolved — 2026-08-18, branch `ticket-104-search-page-scope`.

- [x] A fifth tab on the store page shows this page against its sibling, both stores side by side, in
      document order.
- [x] The tab is **absent — not empty** — on a page that has no sibling.
- [x] It says which side it compares, and it is production, in the same words ticket 02 uses.
- [x] A row carries **no override control, no finding id and no class pill**, and no decision is
      offered anywhere on the tab.
- [x] Rows are not tinted by direction: `lost` and `added` are fields on a class, a block difference
      has no class, and neither store lost anything — they differ.
- [x] A run of agreeing rows collapses into a **context marker** that says how many blocks it holds
      and expands, reusing the existing collapse predicate.
- [x] A page that agrees entirely says so in the marker's own words, and does not read as though the
      comparison failed to run. Half of these pages are byte-identical.
- [x] **Landing does not reach this tab**: there is no finding id to land on, and a link naming one
      must not open it.
- [x] A row too large for a word comparison is **uncompared**, in the existing word and the existing
      meaning — both sides shown in full, neither coloured.
- [x] The reading is decided as values in the pure layer and only rendered by the component.
- [x] No count, bar, denominator or roll-up moves.
- [x] The full suite passes, including the stopword guard.

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

## Comments

**2026-08-18 — built.**

**What it is.** `siblingReading()` in `web/src/lib/sibling.mjs` decides the whole reading
as values; `SiblingView.jsx` renders it and decides nothing. It is the block list's
reading one step down — the list answers *which page*, this answers *where on it* — and
it says so in the block list's own sentence about production being the reference side.

**The alignment is `diffRows()` with the classification dropped**, and both halves are
deliberate. Reused, because *which two blocks are the same block* must have one
definition in this repo — that function is where ticket 34's ordering defect was fixed,
and a second alignment here would be a second place for it to come apart. Dropped,
because a block difference has **no class**: `text-missing` and `text-added` name a
direction, `lost` and `added` are the tones a direction is drawn in, and neither store
lost anything.

**The collapse is shared and not copied.** A sibling row answers `collapses()` with
`class: null, finding: null, decidable: false` — fields rather than absences, because
those three answers can never be anything else here. `collapseRuns()` and
`collapseState()` are then the content view's own. The **context marker row** moved out of
`ContentView.jsx` into `Marker.jsx` and both tables draw it, so *agreeing* cannot drift
into *unchanged* on one of them; the width is the prop and the words are not.

**Landing is guaranteed by construction and not by a rule.** `landingFor()` resolves a
tab from the finding's **check**, `Check` is the closed family of four, and the sibling
tab is not one of them — so no link can open it. The test asks that against `CHECKS`
rather than against a second copy of the four names, so the day somebody adds a fifth
check it is that test which asks whether it should open a tab.

**Three judgement calls worth reading.**

1. **A sibling with no production report gets the tab, and it says *not compared*.** The
   ticket's rule is *absent on a page that has no sibling*, and that is what was built:
   no sibling, no tab. A page that **has** a sibling the log never crawled is a different
   fact, and the block list already spends `unmeasured` on it. Hiding the tab there would
   answer *there is no sibling*, which is false. So `measured` is a field on the reading
   and the tab states the block list's own sentence.
2. **The reading is worked out in the browser and not at build time**, unlike the
   dashboard's block panel. A re-check replaces this store's production extract in
   `PageView`'s state, and the comparison has to follow it — a reading frozen into the
   build would describe the page as it was crawled while the tab beside it shows the page
   as it is now. It costs nothing to a reader who never opens the tab: the panel is
   mounted only while its tab is selected.
3. **`DiffCells` grew one prop, `tinted`.** It is the whole of *not tinted by direction*.
   The word layer is untouched, because it says which words are on which side and not
   which side is wrong — and an **uncompared** block is therefore uncompared here in the
   existing word and the existing meaning, both sides in full and neither coloured.

**What the tab costs.** One more extract in a block page's props: production's, from the
sibling store. Measured on `nl` — 179 pages, 10.2 MB of report JSON, and the sibling
extracts add 1.4 MB, so 13% across the store and 55% on the worst page
(`winactie-terrasverwarmer`, a short page beside a long sibling). `de` and `uk` pay
nothing: they are in no block, the build reads no sibling reports for them, and their
pages carry no tab. Verified in `dist/`: `nl/carport` and `be/carport` draw the tab,
`de/carport` and `uk/carport` do not.

**What was not touched.** `pageKey()`, the seed list, the finding id, the class
vocabulary, `Check`, `CHECKS`, `bucketsOf()`, `PageBar` and every dashboard number — so
no count, bar, denominator or roll-up can have moved. The reserved *fifth tab* comment in
`Ledger.jsx` was **corrected** and not reused: axis B is still a tab of its own when it
arrives, and it is no longer the fifth.

Full suite 976 passing, including the stopword guard. `oxlint` clean, `oxfmt` clean on the
touched files. The static build completes: 823 pages.
