# 85 — The comparison scope is legible, and the exclusion list has an owner

Type: task
Status: wontfix — **parked 2026-08-20** by a read-through of the read-only half with a
content editor. Refused on its ratio and on its vocabulary, panel by panel, in
`## Why this is parked` below. Its predecessor half is
[142](142-an-exclusion-entry-is-drafted-against-a-live-measurement.md), parked 2026-08-19.
Blocked by: 75
Parent: ../../map.md
Narrowed: 2026-08-19. The drafting endpoint left this ticket and is now
[142](142-an-exclusion-entry-is-drafted-against-a-live-measurement.md), parked.
What was left here was the read-only half: the warning hoist, the per-entry store count, the
class-visibility panel, the named pull-request route, and the answer recording who owns the
exclusion list.

## Why this is parked

Every panel was read against its reader, and three of the four have none.

**The excluded-pages panel is a table for one row.** `shared/excluded-pages.mjs` holds
exactly one entry — `veranda-configurator`, and it is nl only, so five of six stores would
draw an empty panel. The criterion asks for a per-entry store count on a list where the
count is always `1 van 6`. The comma-joined aside at `Dashboard.jsx:424-427` is the correct
amount of interface for one entry.
*Re-open trigger:* the list reaches about a dozen entries, or one entry spans more than one
store.

**The excluded-regions panel speaks a language its reader does not.** `#campaign-banner`,
`.filter-content`, *Soort: alleen productie* — that is DOM vocabulary on a dashboard for
content editors, and an editor reading it learns nothing they can act on. The panel was
written selector-first because the committed entry is selector-first. The entries carry no
human name, so there is nothing else to lead with.
*Re-open trigger:* the list grows past a handful of entries, or an editor asks which
regions are cut.

**The class-visibility panel has no named reader.** All 32 classes on one screen with their
counts, grouped by `work`, `information` and `diagnostic` — but an editor does not decide
visibility, and the rule already reaches them where it matters, per row: an `information`
finding renders without an override control (`canDecide()`, ticket 86). A maintainer who
wants the enumeration reads `compare/vocabulary.mjs`. This was also the largest remaining
piece of work.
*Re-open trigger:* an editor asks twice why a finding offers no override control.

**The owner produces no artefact.** A `CODEOWNERS` line or an ADR paragraph naming a team
is ceremony while nothing pages anyone. The useful half was always criterion two — the
panel names the pull request, which is a destination. The ADR 0003 sentence *the list needs
an owner* stays inert, and this records that it is **deferred and not answered**, so no
later reader mistakes a moved ticket for a solved question.
*Re-open trigger:* an exclusion goes stale and nobody notices for a whole campaign.

### The one part that is not refused

**The warning hoist is worth building and should be split out.** It is the only piece with
a failure mode attached: a campaign changes, `#campaign-banner` anchors on option ids that
no longer exist, the entry matches nowhere, and the findings it was removing return to the
backlog with no announcement. The first signal is an editor wondering why their queue
tripled.

Its ratio is the opposite of 142's. The verdicts already exist and are already measured —
`stopped-matching` and the six others in `compare/region-coverage.mjs`, the mismatched-scope
guard, the per-side removal counts. Nothing new is computed. What is missing is that the
verdict renders as a row inside a list nobody scrolls to instead of a warning above it.

Two things it needs, and the second is why it is a ticket and not a patch:

- The hoist itself: a `stopped-matching` or zero-page entry stated above the list, saying
  the findings that entry was removing are back in the backlog, with the count when the
  previous snapshot allows one, and the named pull-request route.
- A **human name** on each entry in `shared/excluded-regions.mjs` — *De promotiebanner*,
  *Het productoverzicht*, *De filters* — with `validateRegions()` requiring it. Without it
  the warning has to lead with a selector, which is the objection that parked the regions
  panel above.

The trap in `## Traps` about the mismatched-scope guard carries over unchanged: a one-store
run against a whole-corpus snapshot reads as five stores that stopped matching, and a
warning must never be drawn from a comparison the guard refuses.

A prototype of the three warning shapes, against the real committed entries, is at
`../../prototypes/85-comparison-scope.md`. Its sections 2 to 5 describe the panels this
note refuses and are kept only as the evidence for refusing them.

> **About half of this is already built, verified 2026-08-13 in a triage sweep of every
> open ticket. Read the criteria against this note before building anything.**
>
> **Already in the tree.** The excluded-**regions** panel, read-only, with selector, kind,
> reason and per-side removal counts — `web/src/components/Dashboard.jsx:433-452`, with the
> kind wording in `REGION_KIND`. All seven coverage verdicts, worded in Dutch and measured
> against the previous snapshot — `Dashboard.jsx:529-575` (`RegionCoverage`,
> `REGION_VERDICT`), fed by `compare/region-coverage.mjs`, and the mismatched-scope guard is
> honoured (`REGION_VERDICT_REASON`, *Niet vergeleken*). The zero-match sentence, including
> the *the snapshot may be older than the entry* reading, at `Dashboard.jsx:444-448`. A
> missing snapshot degrades quietly rather than drawing an empty panel. Excluded **pages**
> appear with their reasons through `web/src/lib/not-checked.mjs:24-54` and
> `Dashboard.jsx:412-430`, grouped by kind.
>
> **What is left.** The excluded-pages entries are a comma-joined list inside the *Niet
> gecontroleerd* aside (`Dashboard.jsx:424-427`), not a panel with a per-entry store count.
> There is **no class-visibility panel at all** — `web/src/lib/classes.mjs:102-120` gives
> `classInfo()` per class, but nothing enumerates the classes with their visibility group
> and finding count. A `stopped-matching` or zero-page entry renders as a row inside the
> aside rather than being hoisted as a warning above the list, and it does not say how many
> findings are back in the backlog. No panel names the pull request as the route to edit.
> The **drafting endpoint does not exist**: `api/server.mjs` serves `/api/health` (:142) and
> the re-check routes (:144-178), and 404s everything else (:179) — no selector measurement,
> no `maxUnits` proposal, no 100 ceiling, no share-of-page or campaign-anchor warning, no
> three-page fetch. And no ADR or answer records an owner for the exclusion list;
> `shared/excluded-regions.mjs` still only states the need.

**What to build:** one place in the dashboard that answers "what is this comparison
looking at, and what is it deliberately blind to" — the excluded pages with their
reasons, the excluded regions with their coverage, and every finding class with its
visibility. And it says, on the day it happens, when an exclusion stopped matching.

## The decision this ticket carries

**The panels are read-only. Editing stays a pull request.**

The proposal asked for excluded regions and excluded pages to be managed from the
dashboard, with a free-text selector field, applied on the next crawl. That is refused,
and the reasons are all in ADR 0003 and ticket 19:

- A region leaves **at extraction**, from a committed list, because the extract carries
  no DOM path and a check cannot say "the third section down".
- Every entry needs a **measured unit count on at least three pages**, and
  `validateRegions()` refuses an entry that claims headroom it never measured. Nobody
  measures when a selector is typed into a browser.
- A selector **is** a pattern, and ticket 19 requires exact keys with reasons, never a
  pattern and never a detection rule.
- There is no authentication. A field that silently changes what the corpus measures is
  the last thing to put behind a name in `localStorage`.

## The part that is new: the list has an owner

`shared/excluded-regions.mjs` says in its own prose that the campaign anchor is
campaign-specific — the next campaign has different option ids, the entry stops matching,
the banner returns as findings — and that **the list needs an owner**. That sentence has
been true and inert since ticket 64.

This ticket makes it operational. The verdicts already exist: `unchanged`,
`stopped-matching`, `started-matching`, `narrowed`, `widened`, `new-entry`,
`left-the-list`. What is missing is that a reader has to go looking.

## The part that makes a commit cheap

Read-only does not have to mean laborious. The cost you feel when excluding a region is
not the pull request — it is writing a selector by hand and measuring three pages by
hand, which is precisely the work a panel can do for you.

So the panel **drafts** an entry. You paste a selector, it measures, it proposes a
`maxUnits`, and it hands you the entry to paste into the committed list.

The commit stays a commit. An exclusion changes what the corpus **measures**, and a
measurement that anyone can silently change is not a measurement.

**Drafting belongs to the local service, because no stage keeps markup.** A selector can
only be evaluated against HTML, and `data/` holds extracts and reports — `PageExtract.raw`
is the raw *text* of a content unit, not markup. So the panel cannot work from disk. It
fetches the pages it measures, live, through the local Node service, in the same manner as
*Hercontroleer*. The hosted build senses that no service answers `/api/health` and the
control is simply absent, which is the pattern ticket 10 already built and ticket 71
already reused.

That limit is a good one. ADR 0003 demands a measurement on **at least three pages**, so
three fetches is the requirement rather than a compromise, and measuring live is what the
validator's evidence is supposed to be.

## What it delivers

- An excluded-pages panel: page, reason, store, and the count of stores it applies to.
- An excluded-regions panel: selector, kind, reason, the pages it was removed on per
  store, and its coverage verdict against the previous snapshot.
- **An entry that matches nowhere is stated as a warning, not as a row.** The promo
  banner was removed on 446 of 448 pages. An entry at zero is either a stale anchor or a
  fixed site, and either way somebody must look.
- A class-visibility panel: all 21 classes, grouped by `work`, `information` and
  `diagnostic`, each with its finding count.

## Acceptance criteria

- [ ] The three panels are read-only. No input writes anything, anywhere.
- [ ] Each panel says how an entry is changed: a pull request against the committed list,
      named so a reader knows where to go.
- [ ] An exclusion entry whose coverage verdict is `stopped-matching`, or which was
      removed on zero pages, is surfaced as a warning above the list and not only as a
      row inside it.
- [ ] The warning states what it implies: the findings that entry was removing are back
      in the backlog, and the count is given if it is known.
- [ ] The class-visibility panel shows all 21 classes with their visibility and their
      finding count on the current snapshot.
- [ ] The three read-only panels read from the committed lists and the snapshot that
      already exist. They crawl nothing and they write nothing.
- [ ] The answer records who or what the owner of the exclusion list now is. A panel that
      shows staleness to nobody in particular has not solved the problem the ADR named.

## Traps

- **Coverage compares two runs of the same scope.** A one-store run against a
  whole-corpus snapshot reads as five stores that stopped matching, and the existing guard
  refuses it. Do not let a panel display a comparison the guard would refuse.
- **The crawl speaks Simplified Technical English and the dashboard speaks Dutch.** The
  snapshot stores verdicts, never sentences, and each side writes its own words from them.
  Keep that seam.
- **An extract written before ADR 0003 has no record of regions removed.** It reads as
  "no region cut here", which over-reports, and the dashboard must say the snapshot may be
  older than the entry rather than that the region stopped matching.
- The visibility panel is not a control. Once all 21 classes are on one screen with their
  counts, a toggle beside each will look obvious. It is a pull request, for the same
  reason as the rest of this ticket.
