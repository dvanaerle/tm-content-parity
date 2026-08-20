# 03 — The search reaches every store

Type: task
Status: resolved 2026-08-20 — `/search/` (`web/src/pages/search.astro`, `AllStores.jsx`), on
`main`. The corpus split is in `CONTEXT.md` and ADR 0021 is amended.
Blocked by: 09 — a class must be able to open a result before a class label can be pressed to
open one. Resolved 2026-08-20.
Parent: ../PRD.md

## What to build

One screen that searches all six stores.

Today the search reads this store's index and its language-block sibling's. An editor who finds
`max.svg` on `nl` cannot see from there that `de`, `fr` and `uk` hold it too, so they open each
store and search again. Six stores are four searches, and the same false positive is written up
four times.

This ticket widens **reading** only. Nothing about what may be pressed changes; that is ticket 04.

It also makes the class label on a finding row a **press**. *Broken link* on an `nl` row lands on
this screen, filtered to `broken-link`, with nothing typed — six stores, one queue. That is the
gesture the original complaint was describing, and it is reading, not deciding.

## Criteria

- [x] A search screen above the stores, with its **own URL**, so that Back restores it and a link
      carries it. It is not under a store route: a result that can return a `uk` row has stopped
      being a view of `nl`.
- [x] The index loader generalises from *this block's two indices* to *an arbitrary set*. Six
      static files, fetched together. A partial read is an **error**, not a narrower search, as it
      is today.
- [x] The **result shape does not change**: findings group into differences, and the store becomes
      a grouping inside a difference. Not a flat list of pages.
- [x] Every result line says which store it is on.
- [x] Class pills narrow an all-stores result.
- [x] The **class label on a finding row is a link** to this screen, carrying that class and an
      empty query. Prior art is the repeat's own link, which writes a repeat's words and class as
      a screen; this is that gesture with the words left out.
- [x] **Two presses, two verbs, one class.** The label on a row opens; the pill in the strip
      toggles. The label is a link and the pill stays a control, so a press that navigates never
      looks like a press that filters.
- [x] *Include closed* keeps its present meaning and stays out of the filter strip.
- [x] The notes half is searched too, per store, and stays its own block with its own freshness.
- [x] The per-store search is **unchanged** — this store and its sibling, as today.
- [x] The `CONTEXT.md` entry distinguishing a **search corpus** from a **repeat corpus**: reading
      may cross any store because reading moves no count; pressing may not.
- [x] `npm test`.

## Traps

- **No status filter.** A bucket counts and never filters. Closed stays a disclosure that names
  how many it holds — a filter would make a row vanish the moment an editor ticked it fixed.
- **The word is `class`, not `type`.** *Type* names nothing here; `Check` and `class` are the two
  real words and they are different questions.
- **Do not offer a wide press on this screen yet.** Until ticket 04 lands, the corpus rule is
  unchanged, and a press that reached six stores would write judgements over translated text.
- **Do not add a store dropdown that narrows the repeat corpus.** A control may narrow what is
  *read*. What may be *pressed* is a property of the check and never a preference.
- **No backend.** Six static index files and a static build.
- **Do not repair the empty-box refusal here.** Until ticket 09 lands, a pill with an empty box
  legitimately returns nothing, on this screen as on any other. Patching that in passing would
  write a second answer to what a class filter means, in the one place there has only ever been
  one.
- **Scope suggestions stay this store's keys** where the per-store search offers them. A scope is
  a substring and cannot name a store.

## Where it came from

A grilling session, 2026-08-19, from the *global search* idea. The reading half and the deciding
half were separated deliberately: reading is cheap and safe to widen, deciding is neither.

## What is delivered, and where it stops

The screen is `/search/`. `AllStores.jsx` holds it, `Search.jsx` draws the answer on both
screens, and the loader is `useSearchIndex(stores)` in `web/src/lib/search-index.mjs`.

Four things a reader should not have to rediscover:

- **The index is the corpus and the page list both.** The screen has no page summaries: six
  stores of them is seven megabytes of island prop against a corpus already in six static
  files. So `pagesOfIndex()` reads the flat entries back as the store pages they came off, and
  the log is derived over that — which is why the entry gained an eleventh field,
  `observationId`. Without it a fix claim made against an older crawl reads as `fixed` rather
  than `contradicted`, and open work would sit behind *Include closed*.
- **Two page-list blocks stay on the store screens.** Which pages a scope reached and which
  pages hold the term in their name are the **page list's** answers, and a clean page is in no
  index. A scope still narrows above the stores; the four kinds of nothing are not classified
  there.
- **The class label is a link and it left the trigger.** An anchor inside a button is neither
  valid nor clickable — the trap ticket 138 hit from the other side — so the label and the two
  readings beside it are now a sibling of the row's `CollapsibleTrigger`, which is marked
  `data-row="difference"` so the two kinds of trigger in the list are told apart by name.
- **The screen presses nothing.** `bulk` is withheld rather than switched off: there is nothing
  there to press with, so `Repeats` draws no tick, no select-all and no bar. The scope
  suggestions are also absent, because a scope is a substring of a page key and the keys are a
  store's.

## What it costs, measured

Built 2026-08-20 over the corpus on disk.

- The eleventh index field is **+17%** on each file: `nl` goes 876 KB → 1.1 MB, and the six
  together 5.2 MB → 6.2 MB. Gzipped, `nl` is 137 KB — an observation id repeats once per
  finding of a page and compresses to nearly nothing, which is why the flat field was taken
  over a per-page map on the index.
- The screen itself is **16 KB of HTML**. It ships the store names and no content units, so
  the widest reading in the log is the cheapest page in it: a store dashboard carries its own
  summaries and this carries none. An editor who was already searching has the two indexes
  of their block in cache and pays for four.
