# 08 — Scaffold the tm-content-parity repo

Type: task
Status: resolved
Resolved: 2026-08-06
Assignee: d.aerle
Blocked by: 01, 02
Parent: ../map.md

## Question

Nothing to decide once the data contract is settled by 01 and 02. Create the repo
and move the pipeline out of gitignored scratch.

## Target layout

```
Desktop/github/tm-content-parity/
  crawl/       sitemap parse, fetch, extract   (moved from .scratch/_scripts)
  compare/     normalisation, matching, finding ids, classification
  api/         local recheck service
  web/         Astro + React islands + Tailwind
  data/        generated JSON (gitignored)
  dist/        static build, uploaded to the webhosting
```

## What to do

- Create the repo and move the baseline scripts in. They stop being throwaway
  scratch files: the comparison rules are the crown jewels and must not sit in a
  gitignored folder.
- Astro with a static adapter, one pre-rendered HTML page per site page per store,
  React islands for the interactive parts. No SPA.
- Tailwind. The prototype uses the Play CDN; the real build compiles it.
- The data contract between `compare/` and `web/`, following 01 and 02.
- Keep `devdva02` untouched. It is a Magento storefront; this is a separate
  product.

## Carry over from the prototype

Variant A won: a tabbed ledger with production and the new site side by side.
Tabs: Diff, Outline, Links, Images, Content (Markdown), Meta, Tasks. The prototype
is `devdva02/.scratch/sitemap-content-overview/_prototype/index.html`.

Useful pieces to rewrite properly, not copy: the word-level `wordDiff`, the
per-column `InlineDiff` (each column shows only its own edits), the `×n`
occurrence badge, and the hide-likely-noise toggle.

Prototype code was written with no tests and minimal error handling. Rewrite it.

## Answer

The repo is at `Desktop/github/tm-content-parity`, commit `a52aef6`. `npm test`
passes (14 tests) and `npm run build --prefix web` builds to `dist/`.

### What is there

| Path | Contents |
| --- | --- |
| `crawl/` | The baseline pipeline, moved without changes. Ticket 07 replaces it. |
| `crawl/probes/` | The one-time measurement scripts, kept as evidence. Do not import them. |
| `compare/contract.mjs` | The data contract. |
| `compare/contract.test.mjs` | 14 Vitest tests on the id and the class table. |
| `api/README.md` | Empty on purpose. Ticket 10 builds the service. |
| `web/` | Astro 5, static output, React 19 islands, Tailwind 4 through `@tailwindcss/vite`. |
| `supabase/schema.sql` | The append-only override log from ticket 03. |
| `CONTEXT.md` | The ubiquitous language. |
| `AGENTS.md` | How to work in the repo. |

### The data contract

`compare/contract.mjs` is one module, and it is the only contract. It holds:

- `FINDING_CLASSES` — all 18 classes from tickets 02, 05 and 06, each with its
  check and its shown or hidden default. ~~The class is the mute key, so the
  table is also the interface vocabulary.~~ — **2026-08-13, [ADR
  0011](../../../docs/adr/0011-the-mute-is-withdrawn.md): the class keys nothing, and the
  table is still the interface vocabulary** — it is what the pills, the filters and the
  visibility enum all read.
- `findingId()` — `sha256(store|page|check|rule|prodNorm|newNorm)`, cut to 16
  base64url characters. A test holds the collision bug down: 200 findings that
  are different only in a number give 200 different ids.
- ~~`muteKey()` — store, page and class. It holds no content.~~ — **deleted 2026-08-13, ADR
  0011.** It moved to `shared/mute-key.mjs` per ADR 0001, gained the anchor heading in ticket
  88, and ticket 114 removed the file entirely.
- The shapes, as JSDoc typedefs: `PageExtract` (what `crawl/` gives),
  `Finding`, and `PageReport` (what `web/` reads, one file per store page).

### Three decisions that the ticket did not give

- **`rule` is the class id.** Ticket 01 puts `check` and `rule` in the id, but
  no rule identifier that is more specific than the class exists. A
  consequence, written in `CONTEXT.md`: if a re-check gives a finding a
  different class, the id changes and the dismissal detaches.

  **First paid on 2026-08-06.** Ticket 33 retired `structure`, so every override
  keyed on it — a `fixed`, `dismissed` or `reviewed` event on one of the 5,049
  `structure` findings, ~~and any mute on `<store>|<page>|structure`~~ — matches
  nothing any more. (The mute clause is spent, 2026-08-13, ADR 0011.) Nothing was migrated and no alias was added, per spec 32
  decision 4. It cost nothing because the Supabase project is still not wired
  (ticket 13), and that is the only reason it was cheap. **A future
  re-classification of a class with real override data behind it is not this
  cheap**, and the next one needs a migration story before it lands.
- **Tailwind 4 through the Vite plugin**, not the Tailwind 3 setup of
  `devdva02`. This repo shares no design tokens with the storefront, and the
  Astro 5 Tailwind integration is deprecated.
- **The scripts are copied, not deleted from scratch.** Tickets 07, 15, 17 and
  18 point at the scratch paths, and `_data/` next to them was made with them.
  `_scripts/MOVED.md` says that the repo is canonical and that the copies must
  not be changed. Two copies of the crown jewels is a real hazard: ticket 07
  must delete the copies in scratch when it replaces the extractor.

### Facts found

- `web/` builds an empty log without failing when `data/reports/` is absent, so
  a fresh clone works. Verified with a fixture: a page key with a slash in it
  (`overkappingen/veranda`) renders to `dist/nl/overkappingen/veranda/index.html`
  through the `[...page]` rest route.
- The repo has no remote. It is local only.
