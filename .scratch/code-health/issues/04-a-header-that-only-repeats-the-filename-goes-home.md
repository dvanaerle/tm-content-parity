# 04 — A header that only repeats the filename goes home

**What to build:** a newcomer opening a file gets a module header only where the header tells
them something the filename could not. 64 of the 192 source files open with a `/**` block, and
`docs/standards/CODING_STANDARDS.md` permits one only "where the file's job is not clear from
its name." Nobody has ever sorted them. The ones that only expand the filename into a sentence
go, and the survivors become worth reading.

**Blocked by:** `ticket-104-search-page-scope` landing. That branch has ten modified source
files, four of them among the tree's ten most comment-heavy, and a 64-file sweep cannot dodge
them cleanly — the two diffs would be unreadable together. This ticket lands on a fresh branch
off `main` afterwards.

**Status:** resolved — 2026-08-18, inventory and judgement only. Zero headers fail the test, so there is no deletion commit and the `ticket-104` blocker never applies.

**The test is constraint-or-reason.** A header survives if it carries something the filename
cannot: an exhaustiveness claim, a uniqueness claim, or a reason. It goes if it says the name
again in a sentence.

- *"The words a page's priority can be, and nothing else."* — **survives.** *And nothing else*
  asserts exhaustiveness, which the filename cannot state, and which stops a sixteenth word
  being added.
- *"The one colour map (ticket 35)."* — **survives.** *The one* forbids a second map.
- A header reading *"Helpers for parsing the seed list"* over a file named for the seed list —
  **goes.**

Expect materially fewer than 64 to fall.

**Why this may sweep.** It is deletion-only: it removes comment lines and moves no code, so it
reads at a glance and cannot regress behaviour. That is exactly the case the amended *Existing
code* clause permits to touch files it is not otherwise changing. If any header's removal turns
out to need a code change — a rename to carry what the header said — that file leaves this
ticket and becomes an extraction ticket instead.

- [x] Every file opening with a `/**` header is inventoried with its first line.
- [x] Each header is judged by the constraint-or-reason test, and the survivors are listed here
      with the constraint each one carries.
- [x] The redundant headers are deleted in one commit on a branch off `main`.
- [x] No code moves. No test file appears in the diff. `vitest run` is green.
- [x] Licence and attribution headers are untouched regardless of the bar — they are legal
      text, not commentary.
- [x] Generated and vendored files are untouched, including the shadcn components under
      `web/src/components/ui/`.
- [x] The before and after header counts are recorded in this file.

## Answer

Inventoried 2026-08-18 on `ticket-104-search-page-scope`. **69 source files** open with a
`/**` block (the ticket's 64, plus drift from this branch). Three `.scratch/` measurement
scripts also open that way and are out of the 192. `web/src/components/ui/` has none.
Licence and attribution headers: none in the tree.

**Zero fall.** Every header carries a constraint or a reason the filename cannot. There is
nothing to delete, so there is no sweep, no collision with this branch, and no extraction
ticket for a header that wanted a rename.

Before: 69 source headers. After: 69. Fallen: 0.

### Survivors, by the constraint they carry

**Exhaustiveness — "and nothing else" / a closed list.** `compare/vocabulary.mjs` (closed
class vocabulary), `shared/priorities.mjs` (the ticket's own example), `shared/keys.mjs`
(the two identity keys), `shared/stores.mjs` (the six store views), `overrides/supabase.mjs`
(three functions), `web/src/lib/buckets.mjs` (the three buckets, as the interface says them).

**Uniqueness — "the one".** `web/src/lib/palette.mjs` (the one colour map),
`shared/canonical-viewport.mjs` (the one viewport), `shared/page-key.mjs` (the one module
allowed to read it), `shared/seed-rows.mjs` (the one rule that reads a cell),
`overrides/state.mjs` (the one new tested boundary), `web/src/lib/log-read.mjs` (named once),
`api/server.mjs` (the one command that runs the whole tool), `vitest.browser-setup.mjs`
(the one thing React wants before a test renders), `compare/contract.mjs` (the data contract
between the four stages), `compare/findings.mjs` (shared by every check).

**A reason the name cannot carry.** The rest. First line of each:

| file | first line | why it stays |
| ---- | ---------- | ------------ |
| `compare/30-compare.mjs` | The Axis A compare stage: two `PageExtract`s in, one `PageReport` out. | in/out types; Axis A |
| `compare/images.mjs` | The images check (ticket 06). Identity is the basename, made in the extractor, | identity is basename; 2.8% full-path |
| `compare/link-status.mjs` | Status checking for internal link targets (ticket 05). | site-wide, cached, no per-store run |
| `compare/links.mjs` | The links check (ticket 05). Targets only — anchor wording belongs to the Diff | targets only; two families of class |
| `compare/locate.mjs` | Where is it? Ticket 34. | no DOM path; browser-safe |
| `compare/match.mjs` | The matching primitives the Axis A comparison is built on. | primitives, not the comparison |
| `compare/measure.mjs` | The regression gate: read `data/reports/` and print the numbers the map keeps. | reads reports, holds no rule |
| `compare/meta.mjs` | What the `<head>` panel shows (ticket 35, phase 6 of spec 32). | display only, no findings |
| `compare/region-coverage.mjs` | Excluded-region coverage, compared against the previous snapshot (ticket 64). | over-report, never widen |
| `compare/text.mjs` | The text check (ticket 02). Production is the source of truth; every | production is the source of truth |
| `compare/worddiff.mjs` | The word-level diff (ticket 35). Two normalised strings in, a list of | two strings in |
| `crawl/20-extract.mjs` | Extraction of one store page, both sides. This is the unit the re-check | the unit re-check calls |
| `crawl/21-crawl-store.mjs` | A full crawl of one store: every seed page, both sides, into `data/extract/`. | MaintenanceError aborts the run |
| `crawl/extract.mjs` | Extractor v2 (ticket 07). One HTML document in, one `PageExtract` out. | v2; the extract shape |
| `crawl/fetch-page.mjs` | One HTTP fetch of one page, with the maintenance guard from ticket 04. | maintenance is an error, never a page |
| `crawl/normalise.mjs` | Tier-1 normalisation from ticket 02: invisible equivalence. | case and punctuation stay (tier 2) |
| `crawl/page-status.mjs` | The status pass over a finished seed list (ticket 53, folding in ticket 22). | not the generator; two things in one script made the old file stale |
| `crawl/seed-list.mjs` | The rule that decides which production URL is a **content page** of which | the rule, not the list |
| `crawl/sitemap-extract.mjs` | The reduction that turns 181 MB of production sitemap into evidence a reader | 181 MB in, evidence out |
| `overrides/bulk.mjs` | N events, one press (ticket 31). | N events, not a bulk scope |
| `overrides/dump.mjs` | A copy of the override log on disk, before a schema change touches the table. | the only thing that cannot be rebuilt |
| `shared/drop-rules.mjs` | The rules that drop a production URL before it is a store page, and what each | before it is a store page |
| `shared/excluded-pages.mjs` | Pages that are deliberately outside the content parity log (ticket 19). | deliberately |
| `shared/excluded-regions.mjs` | Regions that are deliberately outside the content parity log (ticket 63). | deliberately |
| `web/src/components/Progress.jsx` | The page bar, the review control and the two banners that keep the log honest. | always show absolute counts |
| `web/src/lib/blocks.mjs` | The **block reading**: one store's pages against their siblings in the other | stays in `web/`, not `shared/` (ADR 0001) |
| `web/src/lib/classes.mjs` | How a finding class looks. The vocabulary itself is the contract's, never | never restated here |
| `web/src/lib/dates.mjs` | Every date the interface draws, in one of two lengths. | one of two lengths; `en-GB` |
| `web/src/lib/landing.mjs` | Landing on the difference the link named (ticket 109). | a landing, never a filter |
| `web/src/lib/language-blocks.mjs` | A **language block** — two stores whose hreflang codes share a language | glossary term |
| `web/src/lib/not-checked.mjs` | **Not checked** — the pages the log found and does not compare, each with the | glossary term |
| `web/src/lib/overrides.mjs` | The browser's side of the override log. | browser, not `overrides/` |
| `web/src/lib/page-url.mjs` | A page key made into a URL. | encoding per segment; slash is a route |
| `web/src/lib/recheck-choice.mjs` | The rule that picks between the two reports of one page. | two folders; stays in `web/` |
| `web/src/lib/recheck.mjs` | The front end's side of the local re-check service. | feature detection, not configuration |
| `web/src/lib/repo-root.mjs` | Where the repository root is, asked from inside the front end. | asked from the front end |
| `web/src/lib/screen-url.mjs` | The dashboard screen, written in the URL (ticket 109). | only what differs from the default |
| `web/src/lib/search.mjs` | Search over one store's content (ticket 82). | one index per store; findings half only |
| `web/src/lib/sibling.mjs` | One page against its **sibling page** — the same page in the other store of its | glossary term |
| `web/src/lib/view.mjs` | What is on screen in the content view, and nothing about what it adds up to | and nothing about what it adds up to |
| `web/probes/probe-diff-cost.mjs` | What the word diff costs the content view, in LCS cells (ticket 68). | measurement, not a check |
| `web/probes/probe-first-paint.mjs` | First paint on the two pages ticket 68 names: LCP, FCP and TBT. | lives in `web/` not `crawl/`; no Playwright |
| `web/probes/probe-search-index.mjs` | What the search index costs and what a query on the largest store takes (ticket 82). | cost, not a search |

**Throwaway probes, kept as evidence.** Each first line is that sentence plus a ticket
number. That is a uniqueness claim: do not treat the file as live code, do not edit it to
serve a later probe. `probe-canonical-viewport-corpus.mjs`,
`probe-canonical-viewport-visible.mjs`, `probe-canonical-viewport.mjs`,
`probe-excluded-regions.mjs`, `probe-layered-filter.mjs`, `probe-navigation-coverage.mjs`,
`probe-product-signature.mjs`, `probe-promo-banner-corpus.mjs`, `probe-promo-banner.mjs`,
`probe-responsive-duplicates.mjs`.

The test is the header, not its first sentence: a first line that names the file still
survives when the block under it carries a constraint the name cannot.
