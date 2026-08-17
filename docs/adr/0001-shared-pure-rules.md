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

### A resident that arrived before its second reader, 2026-08-17

`HREFLANG_STORE` and `STORE_HREFLANG` are in `shared/stores.mjs`, beside `STORES`.
They were in `crawl/seed-list.mjs`.

This one is worth reading carefully, because on the day it moved it **failed
question 3**. Only `crawl/` read the map: `crawl/seed-list.mjs` counts the codes
and `crawl/sitemap-extract.mjs` filters by them. No stage imported backwards, so
the *at once* exception above did not apply either. It moved anyway, as the first
ticket of the language blocks feature, because the surface that gives it its
second reader derives the blocks in `web/` and `web/` cannot import `crawl/` — so
the move had to happen in some ticket, and doing it alone kept it a move with no
behaviour in it.

That is a deliberate stretch of this record and not a new rule. It holds only
where the second reader is specified and next: the ticket after it is what makes
the answer to question 3 true, and if that ticket were abandoned the map would
belong back in `crawl/`. Do not read this section as licence to move pure code to
`shared/` on the strength of a reader somebody might write. Line 61 above still
governs: `shared/` is not a place for pure code, it is a place for pure code that
two stages read.

The language fact moved alone. The hosts, the sitemap urls and the `fr/` prefix
are crawl concerns and they stayed, and no store record type was born to gather
the four together — a prefactor that needs one module should not open four.

The sitemap extractor kept a second flat copy of the same six codes, and that copy
is gone. That copy set the key order of an entry's `alternates` in
`data/sitemap-extract.json`, so the shared list keeps that order and
`shared/stores.test.mjs` states it, noting that object equality would not have
caught it. No count moved and the seed list regenerates with identical content.

### The two rows are closed, 2026-08-10

Ticket 54 opened `web/src/lib/reports.mjs`, which is the condition this record
set. `crawl/excluded-pages.mjs` is `shared/excluded-pages.mjs` and
`crawl/seed-rows.mjs` is `shared/seed-rows.mjs`. Nine importers changed and no
count moved, which is what a move must do.

`compare/vocabulary.mjs` and `compare/worddiff.mjs` are still where they were.
They break no arrow, so the rule above applies unchanged: they move when a change
has a reason to open them.

### A fifth resident, 2026-08-10

Ticket 56 needed the words for each rule that drops a URL from the seed list.
`crawl/seed-list.mjs` writes the rule **name** into `data/10-store-seeds.json`
and `web/` reads the name back to show the reason, so two stages read one pure
rule and `crawl/` cannot import `web/`. It is `shared/drop-rules.mjs`.

The merge that builds the *Not checked* list did **not** come with it. Only
`web/` needs it, so it is `web/src/lib/not-checked.mjs`. The first draft of that
ticket put both in `shared/`, and the rule above is what sent the second half
back: `shared/` is for pure code that two stages read, not for pure code.

### A fourth resident, 2026-08-10

`shared/page-key.mjs` was born here for the same reason `excluded-regions.mjs`
was. `crawl/seed-list.mjs` produces the page key and `compare/` asks whether
production declares a Dutch counterpart for it, so two stages read one pure rule
and `crawl/` cannot import `compare/`.

### A third resident, 2026-08-07

Ticket 63 needed a new list of the same shape: the regions that leave the log.
`crawl/` cuts them and `web/` lists them, so it passes all three questions and it
would have made `web/` reach into `crawl/` a third time. The exception above applies,
so it was **born in `shared/`** as `shared/excluded-regions.mjs` and never lived in
`crawl/`. The DOM work stays in `crawl/extract.mjs`, which keeps the list pure.

This is the first evidence the ticket asked for: the seam got a resident that was
not moved into it, but written into it. The two rows above are still open.

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
