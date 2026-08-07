# 47 — Where a shared identity key lives

Type: decision (ADR)
Status: resolved
Parent: ../map.md
Decision: `docs/adr/0001-shared-pure-rules.md`

From the two-axis review of ticket 35. It is a decision and not a move: the fix is
three lines, and the reason to write it down is that the next shared pure function
must not need this conversation again.

## The problem

`AGENTS.md` states the direction of the layers:

> **`compare/contract.mjs` is the contract.** `crawl/` writes it, `compare/` and
> `web/` read it.

Ticket 35 moved `linkKey()` and `imageKey()` out of `crawl/extract.mjs` into
`crawl/keys.mjs`, so that a React island can fold a hostname with the same function
the links check uses. That part is right: one folding, not two that become
different. But the import it created runs the wrong way. `compare/meta.mjs` imports
`../crawl/keys.mjs`, and `web/src/components/Ledger.jsx` imports `meta.mjs`, so
`web/` now reaches into `crawl/` through two hops.

`crawl/keys.mjs` is not a crawl step. It imports nothing, it touches no html and no
network, and both of its functions are rules from tickets 05 and 06 — the same kind
of rule as everything in `compare/`. It is under `crawl/` because that is where it
used to live, and for no other reason.

## What to decide

Where a pure rule that **both** stages need belongs, and say it in a way that
answers the next case as well. `vocabulary.mjs` and `worddiff.mjs` are the same
shape and both sit in `compare/`, which is evidence but not a decision: `compare/`
reading its own files is not the same as `crawl/` reading them.

Three candidates, and the recommendation is the third:

1. **Leave it.** Cheapest, and it makes `AGENTS.md` false. Rejected unless the ADR
   rewrites the rule in `AGENTS.md` to match.
2. **`compare/keys.mjs`.** Then `crawl/extract.mjs` imports from `compare/`, which is
   the same inversion in the other direction.
3. **A named shared place** for pure rules with no stage: both stages import from it
   and it imports from neither. It already has three residents in waiting
   (`keys.mjs`, `vocabulary.mjs`, `worddiff.mjs`), which is the test of whether it is
   a real seam or one file with a big name.

## Acceptance criteria

- [x] `docs/adr/` exists, with the decision as its first record. The directory is
      what `AGENTS.md` and `docs/agents/domain.md` already point at, and nothing has
      created it yet.
- [x] The ADR names the rule for the **next** shared pure function, and not only the
      move for this one.
- [x] `AGENTS.md`'s layering rule and the ADR agree. If the decision changes the
      rule, the rule is rewritten.
- [x] The move is made, and the header comment of the moved file no longer explains
      itself by where it used to be.
- [x] `npm test` is green and `npm run build` builds 180 pages. No number moves:
      this is a move, not a change of behaviour.

## Outcome

Candidate 3. The shared place is **`shared/`**, and ADR 0001 gives three questions
that decide the next case: pure, imports no stage, and more than one stage needs
it. `crawl/keys.mjs` is now `shared/keys.mjs`, and the three importers point at it.

The directory is **not** called `rules/`. `CONTEXT.md` already gives `rule` a
meaning — the class id of a finding — and a folder of that name would take the word
a second time.

`vocabulary.mjs` and `worddiff.mjs` stay in `compare/` for now. Their position
breaks no arrow, because `web/` reading `compare/` is the allowed direction. The
ADR records that they belong in `shared/` and move when next touched.

**The review found two more back-arrows, and this ticket did not know about them.**
`web/src/lib/reports.mjs` imports `crawl/excluded-pages.mjs` and
`crawl/seed-rows.mjs`. Both are pure, and `seed-rows.mjs` says in its own header
that four stages read it. So `keys.mjs` was not the only thing that made
`AGENTS.md` false, and the first draft of the ADR said it was. The ADR now names
both, with the reason they wait: spec 50 rewrites `crawl/` and opens both files.
`AGENTS.md` states the arrow as a direction to keep, and not as a fact about the
tree today. `api/server.mjs` reading `crawl/` is **not** a back-arrow — the
re-check service calls the crawl stage.

**270 tests green.** The build makes **455** pages, and not the 180 in the
criterion above. That number is from before ticket 38 crawled the other five
stores, and `map.md` records 455 as the count today. No number moves. The evidence
is the diff: every executable line of `keys.mjs` is unchanged, and the only edits
are four import paths and two comments.

## Notes

Importers today, and there are only three: `crawl/extract.mjs`,
`crawl/extract.test.mjs` and `compare/meta.mjs`. `web/` is the fourth, through
`meta.mjs`, which is the hop that makes this a layering question and not a taste
one. The keys reach the links and images checks as part of the extract, and not by
import, so the blast radius of the move is those three files.
