# 05 — The shared-page file says which store pages are one record

Type: task
Status: claimed 2026-08-19 — the seam, ADR 0025 and the guard are built on branch
`ticket-104-search-page-scope`. The file is committed **empty and undated**, which makes
nothing shared; its 29 `be` and 36 `be_fr` entries need the admin grid and are a human's to
compile. See the answer.
Blocked by: None — can start immediately.
Parent: ../PRD.md

## What to build

The log learns a fact no crawl can see.

On the new site one Magento CMS record can serve more than one store view. `bedrijfsinformatie` is
record 543 and it serves `nl` and `be`. One edit corrects both stores. Two store pages that share
a record and two store pages that are separate records with identical words are
**indistinguishable to a crawler** — same words, same url key, same hreflang alternate — and they
behave oppositely when somebody fixes one. That is why this is imported and not derived.

There is no database access and no export. The file is compiled by hand from the new site's admin
grid.

Write **ADR 0025** before starting. This is the first fact in this repo that neither a sitemap nor
a crawl can produce.

## Criteria

- [x] ADR 0025 is written: why the fact cannot be derived, why the file states the **complement**,
      why it is taken from the **new site** and not production, and what would make it obsolete.
- [ ] One committed file listing store pages whose new-site record is **not** shared with its block
      sibling, each entry carrying its Magento record id and a reason — in the manner of the
      excluded-pages and drop-rule lists.
- [x] Everything else inside a block is **shared**. This complement is sound because sharing
      happens only inside the two blocks, so the only possible partner is the sibling store.
- [ ] The file carries the **date it was taken**.
- [x] A store page whose first sighting in the run log is **later than that date** reads as **not
      shared**, so an out-of-date file cannot grant a permission it never saw.
- [x] The only normalisation is **structural**: the `fr/` prefix on `be_fr` paths, which the
      sibling pairing already strips as a host artefact.
- [x] Any remaining key that resolves to no store page **fails the build** and is named.
- [x] One new pure module answers *is this store page shared*, from the file and the corpus. It is
      the only new seam in this effort.
- [x] The `CONTEXT.md` entry for **shared page**, and the note that it is not a *link*.
- [x] `npm test`.

## Traps

- **Do not normalise an unresolvable key onto a live page.** Both unresolvable keys found so far
  carried an `-n-v-t` suffix and are records to be disabled. Stripping the suffix would mark a
  genuinely shared page as unshared and silently withdraw a permission. Fail instead — the failure
  list doubles as housekeeping on the Magento side.
- **The file states a fact about today, never a plan.** An entry leaves it the day the merge lands
  in Magento. Removing an entry because a merge is intended grants travel before the correction
  can travel.
- **Do not infer sharedness from identical text.** That is exactly the distinction the file
  exists to make, and a wrong guess writes a false claim into a store nobody looked at.
- **Do not key anything on the Magento record id.** Import it, render it, key nothing on it. Every
  id in this repo is content-addressed and expires on purpose; a page moved between store views
  must not expire findings whose content did not change.
- **Do not call it a link.** `links` is a Check. Nobody links anything — the sibling is derived and
  the sharing is imported.
- **This does not become the seed source.** The wide version — Magento as the authoritative page
  list — is parked in the spec with its own reopening condition.

## Where it came from

A grilling session, 2026-08-19, from the *link Belgium with the NL page* idea. The link turned out
to be a fact rather than an editor's assertion. Two lists were compiled during the session: 29
keys for `be` and 36 for `be_fr`. Measured against the corpus, they carry about 22 and 33 lines of
information the tool does not already hold, over corpora of 131 and 122 pages.

## Answer

**Built, except the fact itself.** The seam, the guard, the record and the vocabulary landed;
the 65 hand-compiled lines did not, because they exist nowhere in this repo and a fabricated
record id writes a false claim into a store nobody looked at — which is trap 3 of this ticket.

What is committed:

- **ADR 0025** — `docs/adr/0025-the-shared-page-fact-is-imported-and-states-the-complement.md`.
- **`web/src/lib/not-shared-pages.mjs`** — the fact. `TAKEN_ON` and `NOT_SHARED_PAGES`, the
  entry shape (`key`, `record`, `reason`), and the rules a hand edit has to obey. **Empty and
  undated today.**
- **`web/src/lib/shared-pages.mjs`** — the rule. `sharedPageIndex({ rows, runLog })` and
  `isSharedPage(index, { store, page })`. It is the only new seam.
- **`web/src/lib/shared-pages.test.mjs`** — 16 tests, including the committed-file guard.
- **`CONTEXT.md`** — *Shared page*, in the language-blocks section, with the not-a-*link* note
  and the second note that it is not the *shared* of a page both stores have.
- `comparablePath()` is exported from `web/src/lib/blocks.mjs` rather than copied, so the
  `fr/` prefix has one definition.

**Two criteria are open and they are the same criterion:** the entries, and the date. They
arrive together — the suite asserts exactly that, because a dated file with no entries is the
most permissive sentence in the feature and an undated file with entries is a fact nobody can
date.

### Three decisions this ticket had to make

1. **Sharing is a property of the pair, so one entry unshares both stores.** If `be`'s record
   does not serve `nl`, then `nl`'s does not serve `be`. Without it, a list compiled from the
   Belgian store would have granted `nl → be` travel on every page — which is why the grid
   reading only had to be compiled from one side.
2. **An undated file makes nothing shared.** The date rule at its limit. The ticket did not
   ask for it; the complement made it necessary, because an empty *positive* list claims
   nothing while an empty *complement* claims that every page of both blocks is shared. It is
   argued in ADR 0025 rather than assumed.
3. **`isSharedPage()` raises while any key resolves to nothing**, naming every one of them —
   the PRD's *raises rather than returning false*, and the prototype's *names every key rather
   than the first*, are the same rule seen from two sides. The build failure is the
   committed-file test, in the manner of `shared/drop-rules.test.mjs`.

Two corpus conditions come from the corpus and never from the file, and they are what keep the
complement honest where the file is silent: a page with **no sibling page** is not shared
whatever the file omits, and a store outside a block is not shared. Measured against
`data/10-store-seeds.json`, 492 store pages are shared under an empty dated file — 126 `nl`,
126 `be`, 120 `be_fr`, 120 `fr` — which is the complement's upper bound and the number the
entries will cut into.

`npm test`: 1204 passed, 53 files. `npm run typecheck` and `npm run lint` clean.

### What a human does next

Paste the two lists into `NOT_SHARED_PAGES` as `{ key, record, reason }` and set `TAKEN_ON`
to the day the grid was read. `npm test` then names every key that resolves to no store page;
the three known ones — two carrying `-n-v-t`, one French distributor page — are expected to
fail and are records to disable, not keys to normalise.

### After review

`/code-review` ran both axes. The Spec axis found no trap broken and no criterion wrongly
ticked; both axes found real defects, and all of them are fixed in the follow-up commit.

- **The run log is required and refused rather than defaulted.** It was `runLog = []`, and an
  absent sighting is permissive, so a caller who forgot the argument got the file's claim with
  the date bound taken off it — in silence. It now throws and says why.
- **`npm run typecheck` reads no `.mjs` in this repo.** Its `include` is `oxlint.config.ts`
  and `tools/oxlint/**/*.ts`, so every JSDoc type here is documentation and not enforcement.
  That is why the requirement above is a check and not a type. Worth its own ticket; the gap
  is older than this work and it is not touched here.
- **The complement's size was wrong in a docblock** — *some 230* against the measured 492.
  Fixed, and the number now carries its per-store split and the word *upper bound*.
- **A vacuous test now says it is a guard**, in the manner `language-blocks.test.mjs` names:
  the record-id, reason and uniqueness checks pass over the empty list and are here for the
  hand edit that fills it.
- **`index.shared.size` was asked of the field**; it asks `isSharedPage()` now.
- Renames and one typedef: `separateRecords` for what the file listed, `where` for the string
  spelling of a store page against `at` for the object, and one `Sighting` type for the
  run-log row that was spelled inline twice.

Two review findings were **kept and argued rather than fixed**, and both are recorded here
because a later reader is entitled to disagree:

- **The date-and-entries coupling is bidirectional**, which the spec did not ask for. A grid
  reading that genuinely finds nothing unshared is a legitimate dated empty file, and it
  cannot pass this guard. It is kept because the failure it catches — a date set without the
  paste, claiming all 492 store pages shared — is a plausible hand edit with a high cost,
  while the legitimate case is a claim over 492 pages that deserves to be argued in a test
  edit rather than to pass quietly.
- **The duplicate-path guard** is not asked for anywhere and no store has such a path today.
  It is kept because the alternative is picking one of two pages, which is the quiet mapping
  this ticket's first trap forbids.

**Speculative Generality is flagged and expected:** the seam has no production caller. That
is what tickets 06 and 07 are.

