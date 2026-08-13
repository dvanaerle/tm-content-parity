# 82 — Search reaches the content

Type: task
Status: resolved 2026-08-11 — built, and one acceptance criterion is left open for 83:
the page note it searches for does not exist yet. See the answer.
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

- [x] One index file per store is emitted by the build, holding the searchable fields
      and the finding ids — not the whole report.
- [x] Searching finds a finding by production text, by new-site text, by link text, by
      link target, by anchor heading and by page key. Each of the six has a test.
- [x] The result says how many findings on how many pages, and groups by page.
- [x] Closed findings are excluded by default, and an `inclusief afgesloten` option
      includes them.
- [ ] A page note matching the term is found, and the result makes clear that the note
      half is live while the finding half is from the snapshot.
      **The second half is done and the first waits on [83](83-a-page-carries-a-priority-and-a-note.md),**
      which is the ticket that creates a page note and already names "the note reaching
      search through 82" as its own scope. Notes are searched, live and apart from the
      snapshot — over the notes that exist today, which are the ones on override events.
- [x] No search dependency is added. The answer records the index size per store and the
      time a worst-case query takes on the largest store.
- [x] The dashboard's page-name box either becomes this search or is removed. Two search
      boxes on one screen is the duplication ticket 12 already cleaned up once.
- [x] No count moves, and the existing test for that rule passes unchanged.
- [x] The hosted build carries the index and needs no service for search to work.

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

## Answer

The box on the dashboard searches the content. `web/src/lib/search.mjs` holds the whole
of the rule — the index, the matching, the grouping and the notes — and its module
docblock carries the three decisions that are not visible in the code. The build writes
`/zoekindex/<store>.json`, the browser fetches it on the first keystroke, and a linear
pass answers. No dependency was added and none is warranted; the numbers are below.

### The six fields are four names over two columns

A finding has `prod` and `new`, and on a `links` check **those two hold the target** —
`linkKey()`'s host-folded string, not words. So which field a hit is reported under is
decided by the class's check: `SEARCH_FIELDS` is
`page, prodText, newText, linkTarget, linkText, anchorHeading`, and `matchedFields()`
splits on `FINDING_CLASSES[cls].check === 'links'`. The test for it caught the mistake on
its first run: without the split, typing a URL claimed a match in *production text*.

**`linkText` is the whole reason the index is emitted at build time.** Every other
searchable field is already in `loadSummaries()`'s array, which the dashboard has in
memory. The anchor text is on no finding — it is on `report.sides.*.links[].text`, in the
extract, which is the half a summary throws away. A browser cannot derive it. It costs
10.2 kB gzipped on `nl` and it is what a search is for: an editor types the words they
read on the page, and on a link those words are nowhere else.

Matching is a plain lowercased substring. That keeps the slash trap shut for free — a page
key is one opaque string and a substring never splits on it — and it is why `Bekijk deals
>` works as typed. That phrase finds nothing in this snapshot, because those words are not
in the NL store; the ticket's example was illustrative.

### One index per store, and what it costs

Measured by `web/probes/probe-search-index.mjs` on the emitted files, 2026-08-11:

| store | pages | findings | raw | gzip |
| --- | --- | --- | --- | --- |
| be | 122 | 5,412 | 1,540,803 | 232,553 |
| be_fr | 115 | 6,225 | 1,897,282 | 263,997 |
| de | 123 | 5,743 | 1,722,247 | 249,633 |
| fr | 117 | 6,175 | 1,861,608 | 263,715 |
| nl | 124 | 6,004 | 1,706,627 | 248,465 |
| uk | 121 | 5,944 | 1,671,459 | 243,933 |
| **total** | **722** | **35,503** | **10,400,026** | **1,502,296** |

About 250 kB gzipped a store, downloaded one store at a time, against the 228 kB
`loadSummaries()` index the `reports.mjs` comment records. Search roughly **doubles** a
store's payload rather than multiplying it, which is the trend the next person should
watch when tickets 50 and 55 grow the corpus.

The largest store by indexed findings is **`be_fr`** (6,225) and not `nl`, which the
ticket assumed. Worst case is the term that matches *everything*, because matching has no
early exit and is a constant across terms, so the only variable left is the grouping the
matches then pay for. Twenty timed runs, `searchStore()` end to end:

- `be_fr`, single letter `e` — 6,224 hits, 4,399 repeats: **37.8 ms** median.
- `nl`, single letter `e` — 5,996 hits, 4,149 repeats: **27.4 ms** median.
- A realistic term on either store: **3–4 ms**. A term that matches nothing: **~3 ms**,
  which is the pure scan over 6,000 entries.

A library would buy back tens of milliseconds on the one query shape nobody waits on. The
index size is the real cost, and no library reduces it.

### The two halves stay two halves

`searchStore()` answers about the snapshot and `searchNotes()` about the log, and they are
two functions rather than one merged list so that no caller can present two moments as
one by accident. On screen they are two blocks under two sentences: the findings dated by
`builtAt`, the notes marked as read from the log just now.

**The criterion about page notes is left open, and 83 closes it.** There is no page note
to find: `CONTEXT.md` has the vocabulary, but nothing writes one and `overrides` has no
column for it — and ticket 83 is the one that creates it, already naming "the note reaching
search through 82" as its own scope. Ticking this criterion here would have claimed a
subject that ships in 83.

What is built is the mechanism the criterion asks for, over the notes that exist today:
`note`, the sentence an editor gives when dismissing ~~or muting~~ (2026-08-13, ADR 0011),
and the one a page review can carry. They are filtered live from the events the store page has already loaded —
in memory, not indexed, exactly as the spec body says — through `latestByKey()`, so a
withdrawn note is never offered as a live reason. The day 83's column exists, its notes
are found by the same function with no change here.

The notes are shown whatever *inclusief afgesloten* says. A note is required when
dismissing, so nearly every note there is hangs off closed work; hiding them by default
would leave the option switching on a half of the answer that is empty until pressed.
*Active work by default* is a rule about which **findings** are offered as work.

### Two things that were nearly bugs

**A one-sided page is now out of the index.** Nineteen of them in this corpus still carry a
finding, and their ids are in no derived state the dashboard holds — `Repeats.jsx` is
written to *throw* on a missing one rather than quietly shrink a denominator, so a search
that returned them would have crashed the row it drew.

**The emitter streams.** `emptyIndex`/`addPage` exist because a full report carries both
extracts and reading a store's worth at once is the thing `loadSummaries()` refuses to do.
One test pins the streamed index equal to the one built from an array, so the streaming
path cannot grow a second, divergent merge.

`node compare/measure.mjs nl` still reads 6,004 shown findings on 124 comparable pages,
and the index's own numbers agree with it exactly. No count moved; 571 tests pass.

### What the review changed

`/code-review` ran two axes over the eight commits and found one hard breach and one real
capability loss. Both are fixed:

- **The doubled figure.** The result header printed *N bevindingen op M pagina's*
  unconditionally, and on a result holding **one** repeat those two numbers are provably
  the same — the pairing `CONTEXT.md` forbids, printed on the screen of the ticket that
  forbade it. The finding count is now drawn only when the result holds more than one
  difference; a single-difference result says what its own row says.
- **A clean page could no longer be reached by name.** Removing the page-name filter was
  sanctioned by the criterion, but a page with no open finding appears in no finding
  result, so typing its name found nothing at all. The result now carries a *pagina's
  heten zo* block, which is the by-page reading of the same term and the one place a clean
  page can appear.
- **`fields` was computed and never drawn.** Three docblock decisions defended output no
  component read. A repeat row reached by a search now says *in het linkdoel*, *in het
  kopje* and so on — which is the point of the field split, since a row can hold words
  that do not contain what was typed.
- `store` is now a prop from the route rather than dug out of row 0, which fetched
  `/zoekindex/undefined.json` on a store with no comparable page. A note links through its
  own `store`. `findingsIn()` in `view.mjs` is the one finding counter the repeats footer
  and a search result both ask.

Two findings were left standing on purpose. `search.mjs` holds a build-time half and a
browser half, which is a fair *Divergent Change* reading — but they are one feature and
splitting them would put the index's shape in one file and its only reader in another.
And the result groups by repeat and not by page: the trap asks for repeat **first**, then
page, and `repeat.on` is that second level.
