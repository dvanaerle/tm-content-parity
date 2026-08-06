# AGENTS.md

## What this repo is

The content parity log for the Tuinmaximaal storefront. See `README.md` for the
layout and `CONTEXT.md` for the words the code uses. Read `CONTEXT.md` before
you name anything.

This repo is **not** the Magento storefront. The storefront is
`Desktop/gitlab/devdva02`, and it stays untouched.

## Where the decisions are

`Desktop/gitlab/devdva02/.scratch/content-parity-log/map.md` is the map, and
`issues/NN-*.md` next to it hold the detail. Do not decide again what a
resolved ticket decided. If you must go against a resolved ticket, say so in
the ticket.

## Rules

- **`compare/contract.mjs` is the contract.** `crawl/` writes it, `compare/`
  and `web/` read it. Change the contract in that file first, then the code.
- **Node ESM**, `.mjs`, no build step outside `web/`.
- **Vitest** for tests. `npm test`. The comparison rules are the crown jewels:
  a rule with no test is not a rule.
- **Write prose in ASD-STE100 Simplified Technical English.** Short sentences,
  one idea in each.
- **Comments explain why, not what.** No comment is the default.
- `crawl/probes/` holds one-time measurements that are kept as evidence. Read
  them for the numbers. Do not import them.
