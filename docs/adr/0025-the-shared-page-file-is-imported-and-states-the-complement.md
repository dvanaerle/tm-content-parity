# The shared-page file is imported, and it states the complement

On the new site one Magento CMS record can be assigned to more than one store view.
`bedrijfsinformatie` is record 543 and it serves `nl` and `be`, so one edit corrects both
stores. The log learns that fact from a **committed file compiled by hand**, and not from
anything it crawls. This is the first fact in this repo that neither a sitemap nor a crawl
can produce, which is why it gets a record.

The file states the **complement**: the store pages whose new-site record is *not* shared
with their block sibling. Everything else inside a block is shared.

## Why the fact cannot be derived

Two store pages that share one record, and two store pages that are separate records
holding identical words, are **indistinguishable to a crawler**. Same words, same url key,
same hreflang alternate, same rendered HTML. Nothing in either response says which one it
is.

They behave oppositely the moment somebody fixes one. On a shared record, one edit corrects
both stores. On two records, one edit corrects one store and leaves the other exactly as it
was. So the distinction the crawl cannot see is precisely the distinction a fix claim needs,
and identical text is not evidence for it in either direction.

That is also why **sharedness is never inferred from identical text**. The inference runs
the wrong way round: identical words are what two separate records look like on the day
before they diverge, and a wrong guess writes a false claim into a store nobody looked at.
The words are the thing the file exists to stop being used as the answer.

There is no database access and no export. The file is read off the new site's admin grid
by a person.

## Why it states the complement

The positive list would be the longer one. Roughly 105 of `be`'s 131 pages share a record
with `nl`; the not-shared list is about 29 lines. A hand-kept file should be the short one,
because every line is a line somebody transcribed.

The complement is only **sound** because of a fact about where sharing happens: a record is
shared inside a language block or not at all, so a store page has exactly one possible
partner — its sibling store. `{nl, be}` and `{be_fr, fr}` are the two blocks; `de` and `uk`
are alone in their languages, so no page of theirs can be shared with anything. If a record
could ever serve `nl` and `de`, the complement would stop meaning what it says here and this
record would need reopening.

Two further conditions come from the corpus and not from the file, and they are what keep
the complement honest where the file is silent:

- A page with **no sibling page** is not shared, whatever the file says, because there is no
  partner to share with. The hand lists happen to carry those pages too — about 7 of `be`'s
  29 lines — but the rule does not depend on their doing so.
- A store outside a block is not shared.

## Why the new site, and not production

A correction lands on the new site. Production's record layout is history: it says where an
edit would have gone last year, not where the edit an editor is about to make will go. The
grid is filtered to **enabled** records for the same reason — a disabled record serves
nobody, so it cannot carry a correction to a second store.

## Why the file carries the date it was taken, and what an out-of-date file may not do

The file is a reading of a grid at a moment. It goes stale the way any transcription does,
and the failure that matters is one direction only: a page that has **become** two records
since the reading, which the complement would still call shared, so a claim would travel to
a store the edit never reached.

The date bounds that. A store page whose **first sighting in the run log is later than the
date on the file** reads as **not shared**: the grid reading cannot have seen it, so it
grants nothing. An out-of-date file therefore narrows what it permits as the corpus grows,
rather than quietly widening it.

The same rule, taken to its limit, decides the undated file. `TAKEN_ON` is `null` until a
grid reading exists, and an undated file makes **no page shared**. That is not an extra
mechanism; it is the only reading of *nothing may be later than no date* that does not grant
permission on the strength of an empty list. It matters because the file states the
complement: an empty positive list claims nothing, while an empty complement would claim
every page in both blocks is shared, which is the most permissive sentence in this feature
and would be asserted by a file nobody had filled in.

## The file states a fact about today, never a plan

An entry leaves the file the day the merge lands in Magento. Not the day it is decided, not
the day it is scheduled. Removing an entry because a merge is intended grants travel to a
store the correction cannot yet reach, and the log would then show one store's work as done
on the strength of an edit that went somewhere else.

## Only structural normalisation, and an unresolvable key fails the build

Every key in the file must resolve to a store page in the corpus. The **only**
normalisation applied on the way is structural: the leading `fr/` on a `be_fr` path, which
is a host artefact — `be` and `be_fr` share a host — and which the sibling pairing in
`web/src/lib/blocks.mjs` already strips for the same reason.

Nothing else is normalised, and a key that resolves to nothing **fails the suite and is
named**. The temptation is a suffix strip: both unresolvable keys found in the first reading
carried an `-n-v-t` suffix. Stripping it would resolve the key onto a live page and mark a
genuinely shared page as unshared — silently withdrawing a permission, which is the one
failure that looks like nothing at all. And the records those keys name are records to be
disabled, so the failure list doubles as housekeeping on the Magento side. That is worth
more than a guard that passes.

The build failure is a test over the committed file, in the manner of
`shared/drop-rules.test.mjs`'s committed-measurement block. `npm test` gates the build, and
the check needs the corpus, which is data on disk.

## Nothing is keyed on the Magento record id

The id is imported, it is rendered, and **nothing is keyed on it**. Every id in this repo is
content-addressed and expires on purpose. A record id is not: a page moved between store
views keeps its content and would expire every finding on it if the id were a term of
anything. The id is in the file so that a person can find the record in the grid again, and
for no other reason.

## Two files, and where they live

- `web/src/lib/not-shared-pages.mjs` — the **fact**: the entries and the date. Hand-edited,
  by a person, on the grid's rhythm and not the code's.
- `web/src/lib/shared-pages.mjs` — the **rule**: key resolution, the corpus conditions, the
  date guard, and the list of unresolvable keys.

They are two files because they have two authors and two edit rhythms, and because the
guard exists to catch a hand edit — the precedent is `data/10-store-seeds.json` against
`crawl/seed-list.mjs`, and not `shared/drop-rules.mjs`, whose four entries change when its
code does.

Both are in `web/` and **not** in `shared/`, which is the answer ADR 0001 gives: its third
question asks whether more than one stage needs the module, and only the web layer does. The
readings and the presses that will consume this are `web/src/lib/blocks.mjs`,
`web/src/lib/sibling.mjs` and `web/src/lib/bulk.mjs`. `shared/` is not a place for pure
code; it is a place for pure code that two stages read. The stretch ADR 0001 allows — a
resident that arrives before its second reader — does not apply, because the next reader is
in `web/` too.

## It is not a link

`links` is a **Check** in this repo, and it is a closed family with a finding id in it.
Nobody links anything here. The sibling is **derived** from what production declares, and
the sharing is **imported** from Magento. Neither is an editor's assertion about two pages,
and calling either one a link would take a word that already means something and give it a
second meaning — which is what `CONTEXT.md` exists to stop.

## What would make this obsolete

- **A store-view map that stays fresh.** The wide version of this — Magento as the
  authoritative page list — is parked in the cross-store-reuse spec, and its stated trigger
  to reopen is a map that has stayed fresh for a quarter. That version retires the file
  along with the carried-over provenance and the seed rule, and it is a much larger change
  than this one.
- **A record layout with no sharing in it.** If every store page becomes its own record, the
  file empties, the complement claims everything is shared, and this record's soundness
  argument inverts. That is the case to watch: an empty file must not be the way this ends.
  It ends by deleting the module.
- **Any export or database read.** The reason this is imported by hand is that no other
  route exists today. The reason it is imported *at all* is that the fact is not derivable,
  and that half does not expire.

## Alternatives

- **Derive it from identical text.** Refused above. It is the distinction the file exists to
  make, and text is the evidence that cannot make it.
- **State the positive list.** Sound, three times longer, hand-kept. Every line is a
  transcription risk and the common case would be the one being transcribed.
- **Take it from production's grid.** It answers where last year's edit went.
- **Normalise unresolvable keys.** Silently withdraws a permission, and throws away the
  housekeeping.
- **An editor-declared relation between two pages.** That is the *link* the spec refuses.
  The fact is Magento's, so an editor asserting it would be a second, unverifiable copy of
  a configuration that already exists.
- **No date on the file.** Then an out-of-date reading grants permissions it never saw, and
  it does so more widely the longer it sits.
