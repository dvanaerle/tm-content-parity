# 05 — The search reaches the language block

**What to build:** a term typed on a block store's dashboard answers with repeats over the
**block**, in the same way the untouched *Repeats* list has since ticket 03. Today it answers
over one store, so the one surface an editor reaches a specific difference through is the one
surface where a decision does not cross.

**Why:** ticket 03 widened the **grouping** and left the **search's own data** where it was.
`repeatsInStore()` keys on `blockOf(store)?.language ?? store`, so a searched result is already
grouped as though the block were there — but `Search.jsx:527` fetches
`/search-index/${store}.json` and nothing else, so `be`'s findings are never in the array being
grouped. The two lists on one view therefore disagree:

| *Repeats* | source | spans the block |
| --------- | ------ | --------------- |
| untouched (class groups) | summaries, incl. `siblingPages` | yes |
| searched | `/search-index/<store>.json` | **no** |

An editor who types to reach a difference gets `nl`'s pages, presses, and is asked the same
question again on `be` — the exact double work ADR 0018 was written to end. Found 2026-08-18
while building the page → repeat link, which lands in the searched list and inherits its
narrowness.

**This is not a reversal of ADR 0018.** That ADR kept the search per store for a reason about
the **notes** half — "handed both stores' events, `nl`'s search answered with notes written on
`be` pages" — and `eventsOfStores()` is what narrows the log before it leaves the hook. The
**findings** half is per store only because the index is. This widens the findings and leaves
the notes exactly where 0018 put them.

**Blocked by:** nothing. 03 shipped.

**Status:** resolved — 2026-08-18, branch `ticket-104-search-page-scope`, in three commits.
The gate below was run first and it says build. ADR 0021 is the record; two things shipped
differently from the criteria and both are named under *Acceptance criteria*.

## The measurement gate — answered

Run with `.scratch/language-blocks/measure-05.mjs` on 2026-08-18, over the **emitted**
indexes under `dist/search-index/` rather than over the summaries: the index is what this
ticket changes, and it is not the same set. Counted, not modelled.

**1. The size of the hole.**

| store   | rows before | rows after | spanning | share | sibling findings reached |
| ------- | ----------- | ---------- | -------- | ----- | ------------------------ |
| `nl`    | 2,656       | 3,264      | 2,064    | 63.2% | 2,698                    |
| `be`    | 2,672       | 3,264      | 2,064    | 63.2% | 3,123                    |
| `be_fr` | 2,912       | 3,722      | 2,095    | 56.3% | 2,665                    |
| `fr`    | 2,905       | 3,722      | 2,095    | 56.3% | 2,676                    |
| `de`    | 2,789       | 2,789      | 0        | 0%    | 0                        |
| `uk`    | 2,947       | 2,947      | 0        | 0%    | 0                        |

The **share** is the answer to *what a search reaches*, which the ceiling could not give:
56–63% of the rows on the four block stores gain a sibling page, so a term landing on one row
hits a spanning one about that often. The ticket expected the corpus figure and the index
figure to differ and they do not — both are 11,162, because the index holds the same `work`
findings on the same comparable pages the summaries do. That is the one prediction this gate
corrected.

**2. What it costs.** Gzipped, per dashboard: `nl` 159 → 305 kB, `be` 145 → 305 kB, `be_fr`
158 → 315 kB, `fr` 157 → 315 kB; `de` (169 kB) and `uk` (153 kB) unchanged. The same shape
ADR 0018 priced at 148 → 283 kB, and cheaper in the way that matters: the index is fetched on
the **first keystroke**, so a visitor who never types pays none of it.

## Order of work

One ticket, three steps, and the first is a **prefactor** that stays green on its own.

1. **An index entry says which store it is on.** No visible change: the store lives on the
   index today and `searchStore()` reads it as `index.store` when it builds its pages. Until an
   entry carries its own, two indexes cannot be merged at all — see the first trap.
2. **The sibling's index is fetched and merged**, and a searched result is grouped over the
   block. This is the ticket's own change and the point at which a press starts writing in both
   stores.
3. **The scope and *which kind of nothing* are made to answer over the block**, which is where
   the two remaining assumptions about one store live.

Splitting these into three tickets was considered and rejected: step 1 is mechanical, step 3 is
meaningless without step 2, and a feature this size is one slice.

## Acceptance criteria

- [x] A term typed on `nl` answers with repeats holding `be` pages, and the same from `be`,
      `be_fr` and `fr`. `de` and `uk` are unchanged, and the test says so.
      *`indexOverBlock()` takes the sibling `siblingOf()` names, so the four block stores are
      one case and not four. `de` and `uk` pass `null` and get their own index back — pinned
      by identity in `search.test.mjs` and by the one fetch in `Search.browser.test.mjs`.*
- [x] A bulk press armed off a searched row writes in both stores, and names which stores its
      **own events** are in — off the entries it can act on, never off the row.
      *No code: the presses were widened by ticket 03 and read `bulk.mjs`' `storesOf(on)`. What
      is new is that a searched row can hand them two stores, and the browser test walks the
      tick and the press and reads `Written in be and nl` off the screen.*
- [x] The **notes half stays per store.** A search on `nl` never answers with a note written on
      a `be` page. This is ADR 0018's line and this ticket does not move it.
      *`eventsOfStores()` is untouched. The browser test puts a `be` page in the findings half
      and asserts the notes block never names it.*
- [x] The **page scope** narrows within the store it is typed in, or the ticket says plainly
      why it now crosses. — **It now crosses**, and here is the plain why: a scope narrows *the
      corpus a search runs over*, and that corpus is now two indexes. Listing one store's pages
      above a result holding both is the same disagreement between two halves of one screen
      that this whole ticket exists to close, and it has a sharpest form — `/pergola` on `nl`
      answering *check the spelling* about a page whose rows are directly beneath the sentence.
      A block is two stores and this is not an all-stores scope. `CONTEXT.md` and ADR 0021 both
      say it. **What is offered under the box does not cross**: a scope is a substring and
      cannot name a store, and the two stores of a block share nearly every key, so a list over
      both would be the same strings twice.
- [x] `which kind of nothing` still answers per page, and a page of the sibling store is not
      reported as "no such page".
      *`explainScope()` takes the block's page list and every `ScopedPage` carries its store.
      The one-sided, clean, no-open-work and no-match kinds are untouched — and `answered` is
      keyed on `store/page`, because `be/afhalen` answering must not make `nl/afhalen` read as
      matched.*
- [x] No bar, chip, roll-up, denominator or *Pages* count moves. The store's numbers are built
      from this store's pages alone, as ADR 0018 left them.
      *The sibling's pages reach `Search` and the hook and nothing else. Two counts **inside**
      the search moved and are named here rather than hidden: `result.pages` and
      `explainScope()`'s matched set were keyed on a bare page key, and `afhalen` is a page of
      both stores — the bare key counted two pages as one. Made correct, not made wider.*
- [x] `CONTEXT.md:438` is corrected: the search no longer "stays per store in both halves", and
      the entry says which half moved and which did not.
      *And the **Page scope** entry above it, which said a scope narrows within one store.*
- [x] The full suite passes. *1,046 tests, 49 files, plus `tsc --noEmit`.*

## Traps

- **Do not merge the two indexes by hand into one array.** An index entry carries no `store` —
  the store lives on the index, and `searchStore()` reads it as `index.store` when it builds
  its pages. Merging without giving an entry its own store files every `be` finding under `nl`,
  which is the bug that writes an event where the finding id does not exist.
- **Do not widen the log to widen the search.** `useStoreOverrides()` already tells `pages` and
  `siblingPages` apart on purpose. The thing that needs the sibling is the **index**.
- **Do not let this touch the numbers.** The sibling's findings reach the grouping and the
  presses, and nothing else. A denominator that grew is the failure ADR 0018 names.
- **Do not build a second definition of a repeat.** `repeatsInStore()` already keys on the
  block. Nothing in this ticket should call `blockOf()` a second time.

## What this leaves open

The page → repeat link (`searchForRepeat()` in `web/src/lib/screen-url.mjs`) is built and
lands in the searched list, so it inherits what this ticket decided: it now reaches the block.
Nothing was changed for it — it writes a term into the box and the box answers over two
indexes.

**A page key only the sibling has is not offered under the box.** `(be)pergola` typed on `nl`
scopes to it and reaches it; chosen from the suggestion list it cannot be, because that list is
this store's keys. The reason is in ADR 0021 and it is the cost of a scope being a substring
that cannot name a store. It is worth its own ticket only if an editor asks for it.

Ticket **06** — the wide press on the per-finding control, drawn in
`.scratch/language-blocks/06-prototype.md` — is the other answer to the same want, and it does
not depend on this one. It was numbered 05 for a day; the prototype file carries its new number.
