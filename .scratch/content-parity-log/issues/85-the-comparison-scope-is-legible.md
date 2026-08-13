# 85 — The comparison scope is legible, and the exclusion list has an owner

Type: task
Status: ready-for-agent
Blocked by: 75
Parent: ../map.md

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

### The drafting panel

- [ ] Drafting is an endpoint on the local service. The hosted build makes no request for
      it and shows no control, because nothing answers `/api/health` there.
- [ ] A selector and three page keys give back the unit counts on both sides for those
      three pages, fetched live. Three is what `validateRegions()` demands as evidence.
- [ ] The panel reports the counts per side and per page, so a `legacy-only` entry's zero
      on the new site is visible as the evidence for its own kind, as ticket 64 recorded.
- [ ] It proposes a `maxUnits` above the widest page it measured, and it refuses to
      propose one above the ceiling of 100. A region wider than the ceiling needs a new
      decision in ADR 0003 and not a larger number.
- [ ] It warns when the selector removes a large share of a page's units. The
      `.magezon-builder` near-miss took 99.7% of `/downloads`, and a panel that would have
      shown that number is the point of this feature.
- [ ] It warns when a selector anchors on something campaign-shaped, such as an option id
      or a year, because that is the anchor that stops matching.
- [ ] The output is the entry text, ready to paste. **The panel writes nothing** — not to
      the list, not to the database, not to disk. A re-check writes to `data/rechecks/`;
      drafting writes nowhere, because a draft is not an observation of a page.
- [ ] The measurement runs on live production and live new-site URLs for the same page, so
      the two sides are cut by one definition, as ADR 0003's third bar for a new entry
      requires.
- [ ] Production has served a maintenance page on 446 of 451 URLs for a whole session, so
      a failed fetch reports as a failed measurement and never as a count of zero.
- [ ] A missing snapshot reports nothing rather than failing the build, as the coverage
      loader already does.
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
