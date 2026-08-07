# 12 — Variant A with eight tabs: does the density hold?

Type: grilling
Status: resolved
Blocked by: 26
Parent: ../map.md

## Question

Variant A won with four tabs. It now needs eight — Diff, Outline, Links, Images,
Content (Markdown), Meta, Coverage, Tasks. Does it still read well, or does it need
a second level of navigation?

Ticket 11 added the eighth: the per-page half of the coverage axis — untranslated
text, alt language, meta and heading outline — is one more tab, on the pages that
exist. The presence checks are **not** here; they are a store-level view, and
ticket 23 owns them.

## Why this is a real question, not polish

The won prototype was judged on one page with 47 actionable findings in a single
Diff tab. Adding Links, Images and Meta adds three more finding sources, each with
its own status vocabulary. Two risks:

- **The count problem.** Every tab wants a badge. Eight badges compete, and the
  editor loses the answer to "what do I do next on this page". The Coverage badge
  is worse than the others, because ticket 11 gave that axis its own bar, which
  must never be summed with the parity bar.
- **Tasks stops being a tab.** If findings come from four sources, the Tasks tab is
  the only place that unifies them, so it is arguably the landing tab, not the last
  one.

A cheap third option worth drawing: drop tabs for a single scrolling page with
section anchors, which is closer to Variant C and may suit seven groups better than
tabs do.

## What to try

- Variant A as it stands, extended to eight tabs, with real Links, Images, Meta and
  Coverage data.
- The same, but Tasks first and pre-selected, with the other tabs as evidence.
- One scrolling review page with a sticky group nav, no tabs.
- Two bars in the summary strip, labelled, with absolute counts — parity and
  coverage. Ticket 11 forbids one combined number.

Include the page-level summary strip the prototype already has — raw versus
grouped versus actionable counts read well and should survive.

## Handed here by ticket 19

The store-level view needs a short **Not checked** list: the pages the log
deliberately leaves out, each with its reason, outside every bar and both axes.
Today it holds one row, `veranda-configurator`, an application page. It is not a
page row and it has no tabs — a row that can never close is what ticket 19
rejected.

## Re-scoped 2026-08-06 by ticket 26: this is no longer a prototype

**Type changed from `prototype` to `grilling`.** There is nothing left to
prototype: ticket 26 built the ledger with real data on all 124 comparable pages,
so the question is now a review of the real thing rather than a sketch of it.

What ticket 26 built and what it settles:

- **Seven tabs, not eight.** Diff, Outline, Links, Afbeeldingen, Content, Meta,
  Taken. Coverage is absent because Axis B has no data until ticket 24, and ticket
  11 forbids summing its bar with the parity bar — so it arrives as an eighth tab,
  not as extra rows in these.
- **Diff lands first**, not Tasks. The reasoning: the diff is what makes the log
  trustworthy, and an editor who lands on a task list has to take the tool's word
  for it. Ticket 28 reopens this from the other direction — at a median of 41
  findings, Diff is a wall.
- **Not every tab wants a badge.** Diff, Outline, Links, Afbeeldingen and Taken
  carry counts; Content and Meta do not, because neither has a count that means
  anything. The eight-competing-badges problem in this ticket did not materialise
  at five.
- **The noise toggle is one control in the tab bar**, showing the hidden total, so
  it reads as a property of the page rather than of the tab.
- **The index view now exists** — the dashboard, ticket 26. It is a flat sortable
  table, not the sitemap tree with roll-up this ticket asked for. Whether a tree
  is wanted is still open, and it is now a question about a built screen.
- **The Not checked list is built**, on the dashboard, with reasons, outside every
  bar. Ticket 19's requirement is met.

So what is left to judge, on real screens rather than on a mock-up:

- Does the Diff tab hold at 41 findings, and at `fotogalerij/zonwering`'s 401?
- Should Taken be the landing tab after all? Tied to ticket 28.
- Does the dashboard want the sitemap tree, or is worst-first enough?
- The page-level summary strip is four chips. The prototype's raw-versus-grouped-
  versus-actionable reading is gone, because ticket 02 removed `match-normalised`
  rows from the finding count. Is anything missing from it?

## Notes

Judge the built tool, not the prototype: `npm run dev` in
`tm-content-parity/web`, or the built copy in `dist/`. The old prototype at
`devdva02/.scratch/sitemap-content-overview/_prototype/index.html` is now
superseded and should not be the reference.

Resolve with `/grilling`.

## Answer

**Answered by ticket [36](36-merged-content-view.md). Closed as resolved in the
triage of 2026-08-07.** The density question is dead, because the thing that made
it dense is gone: **Diff is no longer a tab.** Ticket 36 merged Diff and Content
into one content view — the whole document in order, matched rows included — and
seven tabs became five: Inhoud, Links, Afbeeldingen, Meta, Taken.

That answers each open question of this ticket:

- **Does the Diff tab hold at 41 findings, and at 401?** There is no Diff tab.
  The content view holds `fotogalerij/zonwering` at 399 findings over 178 rows,
  and the filter re-renders there in **21 ms**. No virtualisation was needed.
- **Should Taken be the landing tab?** No. Inhoud lands, and it is the whole
  page rather than a wall of differences, which was the reason to move away from
  it. Ticket 28 is resolved and does not reopen this.
- **Is anything missing from the summary strip?** No. The filter is a pure
  module, `web/src/lib/view.mjs`, and a test pins that a filter never moves a
  count. The counts an editor reads are the ones ticket 09 defined.
- **The badges.** All tab badges count findings, so a row count never sits beside
  four finding counts. The eight-competing-badges problem did not materialise.

### The one remnant, and it is dropped

**Does the dashboard want a sitemap tree with roll-up, or is the flat sortable
table enough?** Nobody has asked for a tree since ticket 26 built the table, and
the table gained class filters and a store switcher in ticket 36 and ticket 38.
Worst-first ordering is what an editor uses.

**Dropped unless somebody asks for it.** This is not a deferral with an owner. If
the want comes back, it is a new ticket against a built screen, and it is cheap
to judge then because the screen exists.
