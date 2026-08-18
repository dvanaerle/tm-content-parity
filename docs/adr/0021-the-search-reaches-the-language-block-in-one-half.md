# The search reaches the language block, in one half

ADR 0018 ends with a paragraph called *The search stays per store, and the widening stops at
the hook*. Half of that is still true and half of it was an accident of where the data sat.
This records which half moved.

## What changed, in one sentence

`searchStore()` scans the store's search index **and its sibling's**, merged by
`indexOverBlock()`:

```js
indexOverBlock(own, sibling)   // one array, each entry carrying its own store
```

Nothing about the grouping changed. `repeatsInStore()` has keyed on
`blockOf(page.store)?.language ?? page.store` since ticket 03, so a searched result was
already *grouped* as though the block were there — and the array being grouped held one
store. The two lists on one dashboard therefore disagreed: the untouched *Repeats* list
spanned the block and the searched one could not, because `be`'s findings were never in it.
An editor who typed to reach a specific difference got `nl`'s pages, pressed, and was asked
the same question again on `be` — the exact double work ADR 0018 was written to end,
surviving on the one surface an editor is most likely to reach a difference through.

## Why this is not a reversal of 0018

0018 kept the search per store for a reason about the **notes** half, and that reason is
untouched:

> Handed both stores' events, `nl`'s search answered with notes written on `be` pages.

`eventsOfStores()` still narrows the log before it leaves `useStoreOverrides()`, and
`searchNotes()` still never sees a store it is not about. What was per store for a *reason*
stayed; what was per store because **the index file was** did not. The general rule 0018
left — *what crosses a block is a press and a row; anything given the log itself must be
narrowed first* — is what decides this rather than being bent by it. A searched row is a row.

## What it buys

Measured 2026-08-18 over the **emitted** indexes under `dist/search-index/`, with
`.scratch/language-blocks/measure-05.mjs`. Ticket 03's gate asked its question of
`loadSummaries()`; this one asks it of the files a browser actually downloads, because the
index is what this ticket changes and it is not the summaries.

| store   | rows before | rows after | spanning | share | sibling findings reached |
| ------- | ----------- | ---------- | -------- | ----- | ------------------------ |
| `nl`    | 2,656       | 3,264      | 2,064    | 63.2% | 2,698                    |
| `be`    | 2,672       | 3,264      | 2,064    | 63.2% | 3,123                    |
| `be_fr` | 2,912       | 3,722      | 2,095    | 56.3% | 2,665                    |
| `fr`    | 2,905       | 3,722      | 2,095    | 56.3% | 2,676                    |
| `de`    | 2,789       | 2,789      | 0        | 0%    | 0                        |
| `uk`    | 2,947       | 2,947      | 0        | 0%    | 0                        |

**The share is the number to read**, and it is the one the ticket asked for over its own
ceiling. 11,162 findings sitting in a spanning repeat is a fact about the whole corpus and
says nothing about what a *search* reaches, because a term reaches a subset. 56–63% of the
**rows** gain a sibling page, so a term landing on one row hits a spanning one about that
often. The corpus figure and the index figure coincide at 11,162 — the index holds the same
`work` findings on the same comparable pages the summaries do — which is worth writing down
because the ticket expected them to differ.

`de` and `uk` are each the only store of their language and do not move at all.

## What it costs

**A block store's search downloads its sibling's index**, gzipped as emitted:

| store   | own    | sibling | total  |
| ------- | ------ | ------- | ------ |
| `nl`    | 162 kB | +148 kB | 310 kB |
| `be`    | 148 kB | +162 kB | 310 kB |
| `be_fr` | 159 kB | +159 kB | 319 kB |
| `fr`    | 159 kB | +159 kB | 319 kB |
| `de`    | 171 kB | —       | 171 kB |
| `uk`    | 156 kB | —       | 156 kB |

The same shape ADR 0018 priced for the second summaries read — 148 kB → 283 kB — and the
same trade: a store pays for a block only if it is in one. It is also cheaper than that one
in the way that matters, because the index is fetched **on the first keystroke** and not on
paint, so a visitor who never types pays nothing at all. That is why the second read here
could be deferred where 0018's could not: a search has no selection to be uncertain about.

**The `store` field costs about 3 kB gzipped per store** — `nl` was 159 kB before it and is
162 kB after — which is what a repeated short string compresses to. `de` and `uk` pay that
and nothing else, so *unchanged* above is *unchanged apart from this*.

**The scan doubles on a block store, and stays a scan.** `web/probes/probe-search-index.mjs`
is the measurement that says a linear pass needs no search library, and this ticket is the
first thing to move the number it reports. On `nl` merged with `be` — 3,850 entries becoming
7,166 — the median of 20 runs of the query that matches nearly everything goes 16 ms → 26 ms,
and the one that matches nothing 2.0 ms → 3.9 ms. Both are inside a keystroke, and the
conclusion that ticket 82 reached still holds at twice the corpus. A later reader adding a
dependency re-runs the probe first, as its own header has always said.

**A sibling that did not answer is an error and not a narrower search.** Both fetches are
one promise. A half-read block quietly answering over one store is the bug this ADR closes,
and it would be worse for arriving with nothing on screen saying so.

## What crosses and what does not

**The findings half crosses. The notes half does not.** Above.

**The page scope crosses**, and it is the one thing here that contradicts a sentence
`CONTEXT.md` used to carry — *a scope narrows within one store, because there is no
all-stores surface to scope across*. A block is not all stores, and a scope narrows **the
corpus a search runs over**: the corpus is now two indexes, so `/pergola` on `nl` reaches
`be`'s page, each line saying which store it is on. The alternative was refused for being
incoherent rather than for being narrow — a scope listing one store's pages above a result
holding both is the same disagreement between two halves of one screen that this ticket
exists to close, and `/pergola` answering *check the spelling* about a page whose rows sit
directly beneath the sentence is the sharpest form of it.

**What is offered under the box does not cross.** A scope is a substring and cannot name a
store, and the two stores of a block share nearly every page key, so a suggestion list over
both would be the same strings twice. The gap this leaves is a key only the sibling has —
`(be)pergola` is not offered on `nl` — and it is typed rather than chosen, which is what an
unofferable scope has always cost.

**The by-name page block does not cross.** It is the **page list's** answer to the same
typing, the page list is this store's, and it is narrowed exactly as the page list is.

**No number moves.** The bar, the chips, the roll-up, the denominators and *Pages* are built
from this store's pages alone, exactly as ADR 0018 left them. The sibling's findings reach
the grouping and the presses and nothing else. Two counts inside the search were keyed on a
bare page key and are now keyed on `store/page` — `afhalen` is a page of both stores, and
the bare key counted two pages as one. That is a count made **correct**, not a count made
wider.

## The trap that made step 1 its own step

An index entry carried no store: the store lived on the **index**, and `searchStore()` read
it as `index.store` when it built its pages. Merging two arrays without giving an entry its
own store files every `be` finding under `nl` — and a press then writes an event against a
finding id that does not exist in the store it is filed under. So `IndexEntry` gained a tenth
field first, `addPage()` takes it off the **report** and never off the accumulator it is
adding to, and that commit is green on its own with no visible change.

The same trap one layer down: the two stores of a block carry the **same page keys**. Every
map from a page to something inside the search is keyed on `store/page` for that reason.

## What was considered and rejected

- **Merging the two arrays and leaving the store on the index.** The trap above, and the
  reason the prefactor exists.
- **Widening the log to widen the search.** `useStoreOverrides()` tells `pages` and
  `siblingPages` apart on purpose, and the thing that needed the sibling was the **index**.
  Widening the log would have undone 0018's one narrowing to buy something it does not sell.
- **Calling `blockOf()` a second time.** `repeatsInStore()` is the only reader of what a
  block is in the grouping, and `siblingOf()` — the same derivation the dashboard's page list
  already goes through — is what resolves the second file. This ticket adds no second reading
  of the hreflang codes.
- **An all-stores index.** Ticket 38 settled that there is no all-stores surface. Nothing
  here takes a list of stores: `indexOverBlock()` takes one sibling, because `siblingOf()`
  answers with one store or with nothing.
- **Ticket 06's wide press instead.** The per-finding control offering the same widening on
  the page is the other answer to the same want, and it does not depend on this one. Both
  were kept because they are reached from different places: this is for an editor who types,
  and that is for one already reading a page.
