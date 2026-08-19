# 142 — An exclusion entry is drafted against a live measurement

Type: task
Status: wontfix — **parked 2026-08-19** by the audit of every open `ready-for-agent` ticket.
Split out of ticket [85](../85-the-comparison-scope-is-legible.md), whose read-only half is
still open and is the load-bearing part. Not disproven: refused on its ratio. This is a live
fetching endpoint, a `maxUnits` proposer, a ceiling refusal, a share-of-page warning, a
campaign-anchor warning and a failed-fetch-is-not-a-zero guard — so that a human can then paste
the result into a file and open a pull request. **The exclusion list has two entries.** We add
to it perhaps once a campaign.
Its own environment also fights it: production has served the maintenance page on 446 of 451
URLs for a whole session, so the live measurement this exists to provide is the measurement
most likely to come back as *failed*.
85's own closing note is the tell — *the visibility panel is not a control; once all 21 classes
are on one screen with their counts, a toggle beside each will look obvious* — it knows the
read-only half carries the value.
**Re-open trigger:** the next campaign, or the third time somebody hand-writes a selector and
measures three pages by hand.
Blocked by: 85 — the read-only panels are where this would live.
Parent: ../../map.md

**What to build:** a drafting endpoint on the local service that measures a selector against
three live page pairs and gives back an exclusion entry ready to paste into
`shared/excluded-regions.mjs`. It writes nothing — not to the list, not to the database, not to
disk.

The `.magezon-builder` near-miss is why this was specified: that selector took **99.7%** of
`/downloads`, and a panel that would have shown that number before the entry was written is the
whole idea.

## Acceptance criteria

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

## Traps

- **The panel writes nothing.** A re-check writes to `data/rechecks/`; drafting writes nowhere,
  because a draft is not an observation of a page.
- **A failed fetch is not a zero.** Production's maintenance page makes this the likely case,
  not the edge case, and a zero that means *we could not look* would propose an entry that
  removes nothing.
- **The ceiling is a decision, not a number.** A region wider than 100 units needs a new
  decision in ADR 0003. Proposing 300 is not the endpoint's call to make.
- **Three pages is the evidence bar** `validateRegions()` demands. Two is not a draft, it is a
  guess.

## Where it came from

Ticket 85, and the audit of every open `ready-for-agent` ticket, 2026-08-19
(`.scratch/2026-08-19-ready-for-agent-audit.md`), whose verdict on 85 was *split*: keep the
read-only panels, park the drafting endpoint.
