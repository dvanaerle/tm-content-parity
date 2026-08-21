# 03 — A repeat list counts before it narrows

Type: spec
Status: ready-for-agent
Written: 2026-08-21
Decided in: the grilling of candidate 2, 2026-08-21
Blocked by: 02. It needs `repeat-list.mjs` to exist, and it edits the same three screens.

**What to build:** one entry point for the repeat list, which enforces the rule three callers
currently keep by remembering it — **a pill counts a class over the whole corpus, and the rows
are the narrowed list.** Nothing an editor sees changes. What changes is that the ordering of six
functions stops being an unstated part of the interface, and the dashboard stops importing a
derivation from a drawing module.

## Problem

The repeat pipeline is six functions whose *order* is part of the interface and unenforced:
`repeatsInStore → repeatsWithClasses → repeatsWithWorkLeft → repeatsByOpenWork →
groupRepeatsByClass`, with `classCountsByOpenWork` counted off a different point in that chain
than the rows are. It is composed correctly in three places today, and the correctness is a
comment.

The part that is easiest to get wrong is the pill: it counts **before** the narrowing, because a
pill that fell to its own count when you pressed it would be a control that lies about what it
holds. ADR 0029's *the same list the rows come from* means the same corpus and the same log — not
the same narrowing — and the interface does not say so anywhere.

The pipeline also spans a screen and a component: two stages run in `Dashboard.jsx`, three run
in a hook inside `Repeats.jsx`, and `openWorkIn` is exported from that drawing module for the
dashboard to import so the pills can read the log.

## Solution

**Two stages, not one call.** `repeatsInStore(repeats)` stays public: it is the corpus builder,
memoised on the pages, and `searchStore()` needs its output to attach what a term matched.
Everything after it goes behind one entry:

`repeatList({ repeats, classes, openOf, includeClosed })` → `{ rows, groups, classCounts, total,
shown, findings, closedPages }`

`classCounts` is counted over the un-narrowed input; `rows` and `groups` are narrowed. *Count
before, list after* becomes impossible to get wrong. `total` and `shown` are returned because the
dashboard needs both and today gets them by keeping two lists.

**One entry over all of it is refused.** The three current memo lifetimes differ — grouping on
the pages, narrowing on the classes, the reading on the log's arrival — and collapsing them would
re-group every page each time a class pill is pressed.

**The held reading stays a hook.** `useWorstFirst` keeps its `useState`/`useEffect`, keeps
`byFinding` out of its dependencies so a decision does not move a row out from under the editor,
and calls `repeatList(…)` with the held accessor. The hook holds; the function derives. That is
what keeps the new entry plain-Vitest testable.

**`openWorkIn` moves into `repeat-list.mjs`,** with `closedPagesIn`. Once the pills come back
from `repeatList`, the dashboard has no reason to hold an opinion about open work: the import
disappears rather than moving, and a screen stops importing from a drawing module.

**`searchStore()` is untouched.** It maps over `repeatsInStore()`'s output to attach match
information — an intermediate the pipeline has no name for — and routing it through one entry
would need an option flag half the callers pass, or a second entry. Reuse-not-rewrite is already
the rule recorded in that module and it stays true.

## Tests

Seam: `repeat-list.mjs`, in plain Vitest. Prior art: the cases inherited from `view.test.mjs` by
ticket 02, which is also where the pipeline is currently composed by hand — **those cases are
rewritten against the entry point**, because as they stand they prove the shape this ticket
deletes. Everything else moves untouched.

- [ ] `repeatList(…)` returns rows, groups, class counts, totals, findings and closed pages from
      one call.
- [ ] A test proves the pill count does not move when the classes narrow, and that the rows do.
- [ ] A test proves the order is worst-first on **open** findings, and that *Include closed*
      changes both the rows and the closed-page reading.
- [ ] `repeatsWithWorkLeft`, `repeatsByOpenWork`, `groupRepeatsByClass` and
      `classCountsByOpenWork` are no longer exported. The repeat half is four exports:
      `repeatsInStore`, `repeatsWithClasses`, `findingsIn`, `repeatList`.
- [ ] `useWorstFirst` keeps the held reading and calls the entry once.
- [ ] `openWorkIn` and `closedPagesIn` live in `repeat-list.mjs`; `Dashboard.jsx` imports nothing
      from `Repeats.jsx`.
- [ ] The dashboard's pill counts and both screens' lists are unchanged, proven by the existing
      browser tests passing unedited.
- [ ] ADR 0029 gains a short *where the rule is stated* amendment naming the entry point as its
      one enforcement point.
- [ ] `oxlint` and the full test suite pass.
