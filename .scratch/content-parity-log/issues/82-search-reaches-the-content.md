# 82 — Search reaches the content

Type: task
Status: ready-for-agent
Blocked by: 81
Parent: ../map.md

**What to build:** an editor types `Bekijk deals >` and sees every finding that holds
those words, across every page of the store, with the pages they are on. Today the only
search is a box that matches a page name.

## The decision this ticket carries

**One index per store, emitted at build time, scanned linearly.** No search library. A
store holds a few thousand shown findings — `nl` holds 6,747 — and a linear pass over
that many objects is fast enough that a dependency would be paid for nothing. If it
ever gets slow, a measurement says so.

**Per store only.** Ticket 38 settled that there is no all-stores surface, and a
cross-store search is the back door to one.

The index covers what the build knows: the page, the production text, the new-site text,
the link text, the link target and the anchor heading. Page notes live in Supabase and
are **not** in the index — they are filtered in memory from the data the store page
already loads.

## What must stay true

- **Two sources, two freshnesses.** The index is as old as the last build; the notes are
  live. A single result list that mixes them must not present both halves as one moment.
- **Active work by default**, with an option to include what is closed.
- **Search narrows; it moves no count.** The rule ticket 36 pinned holds here.

## Acceptance criteria

- [ ] One index file per store is emitted by the build, holding the searchable fields
      and the finding ids — not the whole report.
- [ ] Searching finds a finding by production text, by new-site text, by link text, by
      link target, by anchor heading and by page key. Each of the six has a test.
- [ ] The result says how many findings on how many pages, and groups by page.
- [ ] Closed findings are excluded by default, and an `inclusief afgesloten` option
      includes them.
- [ ] A page note matching the term is found, and the result makes clear that the note
      half is live while the finding half is from the snapshot.
- [ ] No search dependency is added. The answer records the index size per store and the
      time a worst-case query takes on the largest store.
- [ ] The dashboard's page-name box either becomes this search or is removed. Two search
      boxes on one screen is the duplication ticket 12 already cleaned up once.
- [ ] No count moves, and the existing test for that rule passes unchanged.
- [ ] The hosted build carries the index and needs no service for search to work.

## Traps

- **The index must not become the report.** A report holds both extracts and is large.
  Shipping searchable text plus ids is a fraction of it; shipping the report twice is
  not.
- **Search is where a repeat and a finding get confused.** A term matching one repeat of
  329 findings should not read as 329 unrelated results. Group by repeat first, then by
  page, and reuse [81](81-the-repeat-is-the-queue.md)'s derivation rather than writing a
  second grouping.
- A page key can hold a slash. Matching on the key must not split on it.
- The corpus grows to about 800 store-pages under tickets 50 and 55, and the thin stores
  roughly triple. Record the index size so the next person can see the trend.
