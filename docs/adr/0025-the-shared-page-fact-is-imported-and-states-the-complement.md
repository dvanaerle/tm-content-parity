# The shared-page fact is imported, and it states the complement

> **Withdrawn unbuilt, 2026-08-21.** No surface in this repo carries the shared-page fact any
> more. The code is deleted and no `record_layout` table was ever created, so the fact has
> never been held anywhere and no consumer was ever written. *What was withdrawn, and why*
> at the bottom says what went and what survives. **This record is kept, not superseded:**
> every argument about the fact itself still holds, and it is the argument anyone rebuilding
> this would otherwise have to make again.
>
> **Amended 2026-08-19 by ticket 08.** The fact no longer lives in a committed file. It is
> kept in the log's own append-only table, edited in the interface, because the person who
> reads the grid is not the person with a clone. Everything below survives except where it
> names the file — the struck sentences are marked, and *What ticket 08 overrules* at the
> bottom says what replaced them and what it cost. The argument that the fact **cannot be
> derived**, that the list states the **complement**, that it comes from the **new site**, and
> that an out-of-date reading **grants nothing**, is unchanged.

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

## Where the fact and the rule live

*Nowhere, since 2026-08-21. Both halves below are deleted; the section is kept because the
**split** is the reusable finding.*

~~`web/src/lib/not-shared-pages.mjs` — the **fact**: the entries and the date. Hand-edited, by
a person, on the grid's rhythm and not the code's.~~ *Struck 2026-08-19, ticket 08. The fact is
the `record_layout` table, derived by `overrides/record-layout.mjs`.*

- ~~`web/src/lib/shared-pages.mjs` — the **rule**: the corpus conditions, the date guard, and
  the entries that name a store page the corpus no longer holds.~~

The **split** survives the strike, and it is what made ticket 08 a small change: the fact and
the rule were already two things with two authors and two rhythms, so moving the fact left the
rule alone — `sharedPageIndex()` never knew where the entries came from. The precedent for the
split was `data/10-store-seeds.json` against `crawl/seed-list.mjs`, and it held.

The rule is in `web/` and **not** in `shared/`, which is the answer ADR 0001 gives: its third
question asks whether more than one stage needs the module, and only the web layer does. The
readings and the presses that consume it are `web/src/lib/blocks.mjs`,
`web/src/lib/sibling.mjs` and `web/src/lib/bulk.mjs`. `shared/` is not a place for pure code;
it is a place for pure code that two stages read.

## What ticket 08 overrules, 2026-08-19

The fact moved out of git and into the log. The user's reason was one sentence — *others also
needs to control it* — and it defeats the file: a committed module is a fine transcription
surface for a maintainer with a clone and a useless one for a content manager with a browser,
and the second is who keeps this fact.

**What survives is every argument above about the fact itself.** It still cannot be derived, it
is still the complement, it still comes from the new site's enabled records, it still states a
fact about today and never a plan, and an out-of-date reading still grants nothing. Nothing is
still keyed on the record id.

**What changed, and what each change cost:**

- **The file is deleted.** `record_layout` in Supabase is the only source. Two sources for one
  fact was refused for the reason ADR 0001 keeps refusing it: the copy that wins is the one
  nobody can read in a diff.
- **It is a new table and not a scope on `overrides`.** A fact is not a judgement. In that
  table it would have gained a bucket, a bar and a `cleared` verb, and a transcription of
  Magento's configuration would have read as somebody's decision.
- **Append-only, with no UPDATE and no DELETE policy**, exactly as `overrides` is. An entry is
  withdrawn by a later `shared` event. Ticket 83 refused a schema editor because the policies
  it needs are the ones this project deliberately does not have, and that reasoning is
  untouched.
- **The build guard is gone, and this is the real cost.** *An unresolvable key fails the build*
  cannot survive data that is not in git. Two things replace it, and together they are better
  than what they replace but not free: the interface **picks a store page out of the corpus**
  instead of taking a typed key, so the typo the guard existed to catch cannot be made; and an
  entry whose page has since left the corpus is named on the screen as housekeeping. What is
  lost is that nobody is *forced* to look. That the failure list was worth more as housekeeping
  than as a guard was already this record's finding; it is now only housekeeping.
- **A stray entry no longer refuses to answer.** Under the file, asking the rule anything while
  a key matched nothing raised. Live data edited by several people must not white-screen the log
  over one stale row, and a stray grants nothing anyway: a store page the corpus does not hold
  has no sibling pairing, so it was never in the complement. The dangerous case is a page
  **renamed** rather than removed, where the entry names the old key and the new key is
  unlisted — and the date guard closes that, because a new page key's first sighting is later
  than the reading.
- **Anyone who can open the site can now change a permission-granting fact.** There is no
  login; an editor is a name in `localStorage` and the anon key identifies the project, not a
  person. This widens the write from *whoever can push to git* to *whoever can open the site*.
  It is the cost of the thing being asked for, it is not mitigated by an owner column — ticket
  83 refused one, and a name anybody can type cannot carry an accountability reading — and it is
  recorded here rather than discovered later. The bound that still holds is the one that always
  did: **a fix claim loses to re-check**, so a wrong claim announces itself at the next crawl of
  that store.
- **The undated file's rule became the empty table's rule.** No reading event, nothing shared.
  The test that held the date and the entries to arriving together is gone with the file; what
  replaces it is that a reading is its own event, so a table with entries and no reading grants
  nothing rather than being refused.

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

## What was withdrawn, and why, 2026-08-21

Every surface this record described is deleted: the `record_layout` table's SQL, the pure
derivation and its port, the screen and its route, the link on the root, and the rule
`shared-pages.mjs`. 1,938 lines and 41 tests.

**Nothing was ever held.** The table was never created in the Supabase project — the SQL sat
in `supabase/` unapplied, absent from `schema.sql` and from the snapshot, and no backup under
`data/` ever carried a row. So this is not a migration and there is nothing to export. Ticket
08's own header had already recorded that its table "was never applied to a project".

**Nothing ever read it.** `sharedPageIndex()` and `isSharedPage()` had no callers. The two
tickets that would have consumed the fact — a fix claim travelling over a link, and a linked
page saying what is store-scoped — are both out of scope, so the feature collected a
permission-granting fact that no decision anywhere asked for.

**The refusal that stranded it is now settled.** Ticket 10 superseded ticket 08 and was then
parked, and it parked its own removal criteria with it — leaving this code in the tree with no
ticket owning it, which it said in as many words. Its re-open trigger was ticket 11 reporting a
meaningful flattening count or a meaningful double-claim count. Ticket 11 resolved 2026-08-21:
the double claim is **unmeasurable, and 0 of the 10 that survive**; the flattening is **111
units on 42 page pairs**, which is meaningful but is explicitly the half that needs no table,
no link and no editor input. So the refusal holds on its own terms, and the code it stranded
gets the decision it was owed.

**One cost is paid off rather than carried.** *Anyone who can open the site can now change a
permission-granting fact* was this record's frankest entry, and the argument ticket 10 was
refused partly for. Deleting the table retires it. Nothing in this repo now widens the write
on a permission from *whoever can push to git*.

**What survives, and is why this record is kept.** The fact still cannot be derived — identical
words are what two separate records look like the day before they diverge, and that inference
runs the wrong way in both directions. The complement is still the sound and the short list,
and still only sound because a record is shared inside a language block or not at all. It still
comes from the new site's enabled records and never production's. An out-of-date reading still
grants nothing, and no reading still means nothing is shared — an empty complement must never
read as *everything is shared*. Nothing may be keyed on a Magento record id. And it is still
not a *link*. Whoever builds this next inherits all of that.

**What would bring it back** is unchanged from *What would make this obsolete* above, read the
other way: a store-view map that stays fresh, or any export or database read, would remove the
reason the fact had to be transcribed by hand — which was always the expensive half, never the
part that expires.

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
- **Keeping the file as a baseline the table overlays** (considered 2026-08-19, ticket 08). It
  would have kept the `npm test` guard over the committed half. Refused: two sources for one
  fact, and a rule needed for what happens when they disagree.
- **Generating the file back out of the table** (same). Git would keep the history and the guard
  would still run. Refused as the most machinery of the three, and the file would go stale
  between exports — a second copy that is usually wrong is worse than no copy.
