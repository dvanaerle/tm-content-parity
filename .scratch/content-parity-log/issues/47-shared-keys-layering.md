# 47 — Where a shared identity key lives

Type: decision (ADR)
Status: ready-for-agent
Parent: ../map.md

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

- [ ] `docs/adr/` exists, with the decision as its first record. The directory is
      what `AGENTS.md` and `docs/agents/domain.md` already point at, and nothing has
      created it yet.
- [ ] The ADR names the rule for the **next** shared pure function, and not only the
      move for this one.
- [ ] `AGENTS.md`'s layering rule and the ADR agree. If the decision changes the
      rule, the rule is rewritten.
- [ ] The move is made, and the header comment of the moved file no longer explains
      itself by where it used to be.
- [ ] `npm test` is green and `npm run build` builds 180 pages. No number moves:
      this is a move, not a change of behaviour.

## Notes

Importers today, and there are only three: `crawl/extract.mjs`,
`crawl/extract.test.mjs` and `compare/meta.mjs`. `web/` is the fourth, through
`meta.mjs`, which is the hop that makes this a layering question and not a taste
one. The keys reach the links and images checks as part of the extract, and not by
import, so the blast radius of the move is those three files.
