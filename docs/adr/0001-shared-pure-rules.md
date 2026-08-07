# 0001 — A pure rule that both stages need lives in `shared/`

Date: 2026-08-07
Status: accepted
Ticket: `.scratch/content-parity-log/issues/47-shared-keys-layering.md`

## Context

`AGENTS.md` gives the direction of the layers. `crawl/` writes the contract.
`compare/` and `web/` read it. The arrow points one way.

Ticket 35 moved `linkKey()` and `imageKey()` out of `crawl/extract.mjs` into
`crawl/keys.mjs`. A React island must fold a hostname with the same function that
the links check uses. One folding, and not two that become different. That part
was correct. But `compare/meta.mjs` then imported `../crawl/keys.mjs`. And
`web/src/components/Ledger.jsx` imports `meta.mjs`. Thus `web/` reached into
`crawl/` through two hops, and the arrow pointed backwards.

`keys.mjs` is not a crawl step. It imports nothing. It touches no html and no
network. Both of its functions are rules from tickets 05 and 06. It was under
`crawl/` only because that is where it used to live.

## Decision

There is a third place, `shared/`, beside `crawl/` and `compare/`. A module goes
there when **all** of these are true:

1. It is pure. No network, no disk, no `node:` builtin, no html parser, and no
   clock or random source.
2. It imports nothing from `crawl/`, from `compare/`, from `web/`, from `api/` or
   from `overrides/`. `shared/` is a leaf. It may import another `shared/` module.
3. More than one stage needs it. One stage on its own keeps its rule in its own
   folder.

`shared/` is the only folder that both `crawl/` and `compare/` may import.
`shared/` sits under every stage and points at none of them.

`crawl/keys.mjs` moves to `shared/keys.mjs`. Its three importers change:
`crawl/extract.mjs`, `crawl/extract.test.mjs` and `compare/meta.mjs`.

The word **rule** in this record means a pure decision function. This is the sense
`AGENTS.md` already uses. It is not the `rule` field of a finding, which
`CONTEXT.md` defines as the class id.

### The next case

Ask the three questions above, in order. If each answer is yes, the module belongs
in `shared/`, whichever folder holds it today. **It moves when it is next
touched.** A module that qualifies is not a defect on its own. Do not open a
ticket to move one. Move it with the next change that has a reason to open the
file.

There is one exception to *when*, and not to *where*: a module that qualifies
**and** makes a stage import backwards moves at once. That is what happened to
`keys.mjs`.

Do not put a shared pure rule in `compare/` because `crawl/` is the only other
reader. That is the same inversion in the other direction, and this record already
rejected it.

If only one stage needs it, leave it where it is. `shared/` is not a place for
pure code. It is a place for pure code that two stages read.

### What qualifies today, and is not moved

Four modules pass the three questions now. None moves in this record.

| Module | Read by | Imports backwards? |
| --- | --- | --- |
| `compare/vocabulary.mjs` | `compare/`, `web/`, `overrides/` | no |
| `compare/worddiff.mjs` | `compare/`, `web/` | no |
| `crawl/excluded-pages.mjs` | `crawl/`, `web/` | **yes** |
| `crawl/seed-rows.mjs` | `crawl/`, `compare/`, `api/`, `web/` | **yes** |

The first two break no arrow: `web/` reading `compare/` is the direction the
layers already allow. They move when next touched.

The last two **do** break the arrow. `web/src/lib/reports.mjs` imports both.
Spec 50 rewrites `crawl/`, and it opens both files, so that is the change that
moves them. Ticket 47 scoped itself to `keys.mjs`, thus this record names the debt
rather than hiding it.

`api/server.mjs` imports `crawl/fetch-page.mjs` and `crawl/20-extract.mjs`. That
is **not** a back-arrow. The re-check service runs the crawl on demand, thus it is
a caller of the crawl stage and not a reader downstream of it.

## Consequences

- `AGENTS.md` names `shared/` in its layering rule. `README.md` lists the folder.
- One more top-level folder, with one file in it. The ticket asked whether the
  seam is real, and the test is whether it gets more residents. Four are named
  above.
- No behaviour changes. This record is a move and a rule. No count moves.

## Alternatives

- **Leave `keys.mjs` under `crawl/`.** Cheapest, and the back-arrow stays. It also
  gives the next shared rule no answer.
- **`compare/keys.mjs`.** Then `crawl/extract.mjs` imports from `compare/`. The
  arrow is still broken, in the other direction.
- **`rules/` as the folder name.** Rejected. `CONTEXT.md` gives `rule` a precise
  meaning already, and a folder would take the word a second time.
