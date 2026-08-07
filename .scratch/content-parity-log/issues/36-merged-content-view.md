# 36 — The content view: the whole page, filtered, tickable

**What to build:** one tab that is the page. Every element in document order,
production and the new site side by side, matched rows calm and changed rows
coloured — so a difference is found by scanning rather than by reading. The
editor narrows it to one class to do a pass of nothing but copy edits, and ticks
each row off as they go.

Today Diff and Content are two tabs that answer half a question each: Diff shows
only the differences, so after the tinting lands every row would be coloured and
the colour would carry no signal; Content shows two blocks of flat Markdown with
no diff at all. The only controls are one noise checkbox and the tab-per-check
split, so `copy` — 270 findings — stays buried under thousands.

**Blocked by:** nothing. Both edges are satisfied.
[35](35-diff-rendering-and-design-system.md) gives the rendering and is resolved.
[34](34-position-and-ordering.md) was required because the moment this view claims
to show the whole document in order, the new-only row-ordering defect becomes a
visible lie — and **that fix landed and is measured**: 6,990 rows move, on 109 of
124 pages.

34 was reopened on 2026-08-07 on a different criterion, the deep link. This view
does not use it. Do not read 34's open status as a block on this ticket.

**Status:** resolved — built on branch `axis-a-compare-and-log`.

**Implements:** spec [32](32-scannable-log-and-six-stores.md), phases 4 and 5,
minus Leesweergave.

- [x] Diff and Content merge into one tab. The element table is the spine;
      Markdown is demoted from a tab to an export. `web/src/components/ContentView.jsx`
      is the merged view, and the two Markdown sides are download links in its
      control bar. Markdown is never the diff spine — it flattens the element
      identity the finding id depends on.
- [x] **Matched rows are shown by default.** `terrasoverkapping` opens on all 235
      rows, not on the 168 that differ. The inverse control — *Alleen verschillen* —
      is a checkbox beside the class filter.
      *A class filter implies it, and the box says so.* `prepareRows` drops every
      matched row as soon as a class is on, so while a class pill is ticked the box
      is ticked and disabled (`onlyDifferencesState()`). An unticked box over a
      differences-only view is a control that lies about what is on screen.
      *Both numbers are under the default noise toggle.* The page has 288 rows in
      all; 53 of them carry a hidden class. Say which basis a row count is on: 235
      and 288 are the same page.
- [x] Outline is retired as a tab and returns as a sticky heading jump-list beside
      the content view. It is derived from the **rendered** rows (`outlineFrom()`),
      so a narrowed view never offers a jump to a row that is filtered away.
- [x] **Five tabs**: Inhoud, Links, Afbeeldingen, Meta, Taken. Inhoud lands first.
      Every badge counts findings, Inhoud's included: a row count beside four
      finding counts would put two numbers on one thing.
- [x] A multi-select class filter on the content view: session-only, and it moves
      no bar, no denominator and no count. `web/src/lib/view.mjs` is the whole
      filter and it is pure; `prepareRows()` returns rows, the classes the page
      carries and a row total, and a test pins that it returns nothing else. On
      the dashboard, `7455 verschillen open` is unchanged by any pill.
- [x] Filter state is visible while it is on — an amber strip reading *Je ziet 5
      van 235 regels. Dit is niet de hele pagina.* — and **Filter wissen** clears
      it in one action. The noise toggle is deliberately outside the filter: an
      editor who asked to see the muted rows did not ask a question about classes.
- [x] The dashboard's class pills are clickable with the same semantics. Ticking
      `casing` narrows 124 pages to 58 and moves nothing above the table.
      *The dashboard gets the amber strip too.* This ticket asked for it on the
      content view only, but "the same semantics" has to include the warning: a
      narrowed page list that looks like the whole log is read as the whole log,
      which is the same failure the strip exists to stop. One `FilterBanner`
      serves both, so the two cannot drift apart.
- [x] A **checkbox** replaces the "Opgelost" button only. *Negeren…* and *Klasse
      dempen* keep their menu; a dismissal carries a mandatory note and a checkbox
      cannot.
- [x] The checkbox has **three** visual states: unticked, ticked (`accent-info-ink`),
      and ticked-but-contradicted (`accent-attention-fill`). A contradicted claim
      stays ticked — the editor did claim it — and turns amber. A dismissal and a
      mute disable the box rather than tick it: ticking would say the editor
      corrected something they in fact accepted.
- [x] A tick on one row of a grouped finding ticks every row of it, visibly: the
      rows share one finding id, so one event moves them all, and the `×N` badge is
      on each of them with the count in its tooltip. No third override key.
- [x] The view holds at the extremes. `fotogalerij/zonwering`: 399 findings, 178
      rows, and a filter re-render measured at **21 ms**. The largest page in the
      store is `terrasoverkapping` at 288 rows, so no virtualisation is needed and
      none was added.

## Notes

**One new seam, tested; the components stay untested.** Spec 32's testing
decisions rule out React and Astro tests and put every rule with judgement in it
into a pure module. So `web/src/lib/view.mjs` holds the filter, the outline and the
dashboard's page selection, and `view.test.mjs` is 21 tests over them. The
components are pixels.

**`Annotations.jsx` is new and is not a feature.** The tag, the detail, the section
and the occurrence badge were about to exist twice — once in the content view and
once in the finding tables. Two copies of *where is this on the page* drift apart.

**The section label leaves the content row.** Ticket 34 gave each finding an anchor
heading so that a finding says where it is. A content row does not need it: the row
is in document order and its heading is a row a few lines above it, so the view shows
the structure itself. The label would repeat on every row under one heading and say
nothing. `Section` stays in `Annotations.jsx` and the finding tables keep it, because
a finding table has no document order to read the position from. 34 is not weakened —
the same fact is on screen, carried by the order instead of by a label.

**One class filter, in one place.** `ClassFilterPills` and `FilterBanner` in
`Chips.jsx` are the pills and the amber strip for both the content view and the
dashboard. The two were built as separate copies of the same affordance, and two
copies of *narrow to this class* drift.

**What this ticket did not touch.** Leesweergave is ticket 37. Ticket 34's deep
link is still what it was: this view does not use it.
