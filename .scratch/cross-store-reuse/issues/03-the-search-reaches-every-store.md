# 03 — The search reaches every store

Type: task
Status: ready-for-agent
Blocked by: 09 — a class must be able to open a result before a class label can be pressed to
open one.
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

- [ ] A search screen above the stores, with its **own URL**, so that Back restores it and a link
      carries it. It is not under a store route: a result that can return a `uk` row has stopped
      being a view of `nl`.
- [ ] The index loader generalises from *this block's two indices* to *an arbitrary set*. Six
      static files, fetched together. A partial read is an **error**, not a narrower search, as it
      is today.
- [ ] The **result shape does not change**: findings group into differences, and the store becomes
      a grouping inside a difference. Not a flat list of pages.
- [ ] Every result line says which store it is on.
- [ ] Class pills narrow an all-stores result.
- [ ] The **class label on a finding row is a link** to this screen, carrying that class and an
      empty query. Prior art is the repeat's own link, which writes a repeat's words and class as
      a screen; this is that gesture with the words left out.
- [ ] **Two presses, two verbs, one class.** The label on a row opens; the pill in the strip
      toggles. The label is a link and the pill stays a control, so a press that navigates never
      looks like a press that filters.
- [ ] *Include closed* keeps its present meaning and stays out of the filter strip.
- [ ] The notes half is searched too, per store, and stays its own block with its own freshness.
- [ ] The per-store search is **unchanged** — this store and its sibling, as today.
- [ ] The `CONTEXT.md` entry distinguishing a **search corpus** from a **repeat corpus**: reading
      may cross any store because reading moves no count; pressing may not.
- [ ] `npm test`.

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
