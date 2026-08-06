# AGENTS.md

## What this repo is

The content parity log for the Tuinmaximaal storefront. See `README.md` for the
layout and `CONTEXT.md` for the words the code uses. Read `CONTEXT.md` before
you name anything.

This repo is **not** the Magento storefront. The storefront is
`Desktop/gitlab/devdva02`, and it stays untouched.

## Where the decisions are

`.scratch/content-parity-log/map.md` is the map, and `issues/NN-*.md` next to it
hold the detail. Do not decide again what a resolved ticket decided. If you must
go against a resolved ticket, say so in the ticket.

The map and the tickets moved here from `devdva02` on 2026-08-06. They are in
**this** repo now, and `.scratch/` here is **not** gitignored, so they are under
version control with the code they describe. `docs/agents/issue-tracker.md` gives
the layout.

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

## Agent skills

### Issue tracker

Issues and PRDs live as local markdown files under `.scratch/<feature>/`. External MRs are not a triage surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (`needs-triage` / `needs-info` / `ready-for-agent` / `ready-for-human` / `wontfix`), recorded as a `Status:` line in each issue file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
