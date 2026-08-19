# 05 — The shared-page file says which store pages are one record

Type: task
Status: ready-for-agent
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

- [ ] ADR 0025 is written: why the fact cannot be derived, why the file states the **complement**,
      why it is taken from the **new site** and not production, and what would make it obsolete.
- [ ] One committed file listing store pages whose new-site record is **not** shared with its block
      sibling, each entry carrying its Magento record id and a reason — in the manner of the
      excluded-pages and drop-rule lists.
- [ ] Everything else inside a block is **shared**. This complement is sound because sharing
      happens only inside the two blocks, so the only possible partner is the sibling store.
- [ ] The file carries the **date it was taken**.
- [ ] A store page whose first sighting in the run log is **later than that date** reads as **not
      shared**, so an out-of-date file cannot grant a permission it never saw.
- [ ] The only normalisation is **structural**: the `fr/` prefix on `be_fr` paths, which the
      sibling pairing already strips as a host artefact.
- [ ] Any remaining key that resolves to no store page **fails the build** and is named.
- [ ] One new pure module answers *is this store page shared*, from the file and the corpus. It is
      the only new seam in this effort.
- [ ] The `CONTEXT.md` entry for **shared page**, and the note that it is not a *link*.
- [ ] `npm test`.

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
