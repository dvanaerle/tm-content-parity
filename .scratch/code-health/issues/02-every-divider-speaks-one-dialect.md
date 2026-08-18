# 02 — Every divider speaks one dialect

**What to build:** an agent reading a long file meets section dividers written one way. The
tree has 27 of them in three dialects, and two of those pad a rule out to a fixed column, so
renaming a section leaves a broken alignment behind that no formatter repairs:

```
// --- Absolute checks on the new site -----------------------------------
// ------------------------------------------------------------------ the reading
// ---- match strategies (multiset intersection per page)
```

Only the third is permitted. `docs/standards/CODING_STANDARDS.md` says so under *What goes*,
and says why the other two are refused. This repo refuses two words for one thing throughout
`CONTEXT.md`; three punctuation styles for one job is the same defect.

**Blocked by:** none — can start immediately.

**Status:** resolved — 2026-08-18, on `ticket-104-search-page-scope`. Comment lines only.

**What this ticket is not.** A divider says the file has become two files, and the real remedy
is the split. That is not this ticket. The dividers cluster in `crawl/probes/` — 21 files,
3,484 lines of code, no test coverage — so splitting there needs its own decision and its own
risk assessment. This ticket makes the dialect consistent so it stops spreading while that
decision waits.

- [x] Every section divider in the tree reads `// ---- lowercase label`.
- [x] No divider pads a rule to the right of its label.
- [x] Labels are sentence case, never capitals, per `CONTEXT.md`.
- [x] No file modified on `ticket-104-search-page-scope` is touched.
- [x] `vitest run` is green. A test file appears in the diff only where the divider itself is
      in a test file, and no assertion in it changes.
- [x] No code moves — this ticket rewrites comment lines and nothing else.

## Handled on `ticket-104-search-page-scope` (2026-08-18)

The exclusion above ("No file modified on `ticket-104-search-page-scope` is touched") left two
files with nobody to fix them: both are heavily grown by that branch, so its own Comments review
brought them down to the bar instead, under *Existing code* — "bring a file down to this bar when
you are already changing it". Nine dividers, comment lines only, no code moved:

- `compare/compare.test.mjs` — `// --- ticket 116/120/121 …` → four dashes; `// --- Links ----…`,
  `Images`, `Position`, `The report` → `// ---- links`, `// ---- images`, `// ---- position`,
  `// ---- the report`.
- `web/src/styles/app.css` — `/* --- Brand ---…`, `/* --- Text ---…` → `/* ---- brand */`,
  `/* ---- text */`. The file's two newer dividers were already the permitted dialect, so it had
  been holding two at once.

Subtract these from this ticket's count when it runs; the rest of the tree is untouched.

## Answer

Converted 2026-08-18 on `ticket-104-search-page-scope`. Comment lines only: 7 files, 19
lines rewritten, no code moved. A grep for a padded rule (`--- label ---…`) returns nothing.

The remaining padded dialects, all now `// ---- lowercase label`:

| file | was | now |
| ---- | --- | --- |
| `compare/links.mjs` | `// --- Absolute checks… ----` / `// --- Comparative checks ----` | `// ---- absolute checks on the new site` / `// ---- comparative checks` |
| `crawl/probes/probe-92-meta-title-and-keywords.mjs` | five right-padded `the reading` / `the counts` / `the self-check` / `the run` / `reporting` | the same labels, four dashes, no pad |
| `crawl/probes/probe-images.mjs` | five right-padded (`maintenance`, `extraction`, `fetch`, `analysis`, `reporting`); three already permitted | all eight `// ---- …` |
| `crawl/probes/probe-fold-detachment.mjs` | `// --- the override log ----` / `the measurement` | four dashes, no pad |
| `crawl/probes/probe-118-review-staleness.mjs` | the same two, plus `// --- the report ----` | four dashes, no pad |
| `crawl/probes/probe-promo-banner-corpus.mjs` | `// --- The tables the ticket asks for ----` | `// ---- the tables the ticket asks for` |
| `crawl/probes/prototype-parity-data.mjs` | `// --- Noise control ----` | `// ---- noise control` |

`compare/links.mjs` is already on this branch, so it is the same *Existing code* exception as
`compare.test.mjs` and `app.css` above — converted here because the file was already being
changed, not because this ticket reached into the search-page diff. CSS keeps
`/* ---- label */`, which is the same dialect in the only comment form the stylesheet has.

Node vitest: 36 files, 948 tests, green. No test file is in this ticket's diff. The probe
split remains out of scope.
