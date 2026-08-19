# Cross-store reuse

Type: spec
Status: ready-for-agent
Parent: ../content-parity-log/map.md

Written in Simplified Technical English, spelled in UK English. The words are
`CONTEXT.md`'s. Where this spec needs a word that list does not have, it says so and
proposes one.

## Problem Statement

An editor decides the same thing many times.

The log has six stores. A finding id is content-addressed and its first term is the
store, so the same difference in six stores is six ids and six decisions. That is
correct, and for translated text it is also necessary: the words differ, so the
judgement differs.

For text that is **not** translated it is pure repetition. An image basename is the
same string on every store. A link target is the same string on every store. When the
migration renames `max.svg`, every store reports it, and an editor answers the same
question up to six times with the same sentence.

Four things make this worse than the count suggests.

1. **The search reaches one store and its sibling.** An editor who finds `max.svg` on
   `nl` cannot see from there that `de`, `fr` and `uk` hold it too. They must open each
   store and search again. Six stores are four searches.
2. **A rename is only half visible.** A renamed image makes two findings: `image-missing`
   on the old name, which is `work` and is in the search index, and `image-added` on the
   new name, which is `information` and is not. So a search for the new name finds
   nothing, in any store. The one image change an editor most wants to trace is the one
   the log describes worst.
3. **A repeat stops at the language block.** A bulk decision may span `{nl, be}` or
   `{be_fr, fr}` and no further. The stated reason is that the stores translate the text.
   That reason is true of `text` and `meta`. It is not true of `images` and `links`,
   whose two sides are filenames and URLs.
4. **Some store pages are one page.** On the new site a single Magento CMS record is
   assigned to more than one store view. `bedrijfsinformatie` is record 543 and it serves
   `nl` and `be`. One edit corrects both stores. The log does not know this, so it asks
   for a fix claim twice, and an editor who corrects the record once must claim it twice
   or leave one store looking undone.

Point 4 has a second half that costs more than the repetition. A shared record can still
render different words per store, through a custom variable or a store-scoped block —
`{{customVar code=zonweringUSP}}`, and the legal text. If the migration flattened one of
those, a store now shows another store's words. Nothing in the log says where a store
difference was deliberate, so nothing says where one went missing.

## Solution

Eight changes. Four need no new data. Four need one small committed file.

**Without new data:**

- Measure how many findings live only a day or two, so that churn is a known number
  before anything is built on top of it.
- Add a **rename** class, so that `max.svg → max-new.svg` is one measured finding
  instead of two findings and an editor's memory.
- Let the **repeat corpus** be decided by the check. `images` and `links` repeats span
  all six stores. `text` and `meta` stay inside the language block.
- Give the search an **all-stores** screen, so that finding a string once is enough.

**With the file:**

- Add a committed list of store pages whose new-site record is **not** shared. Its
  complement says which pages are **shared**.
- Let a **fix claim** travel between the stores of a shared page, when the finding is a
  repeat over that block.
- Name **store-scoped content**: a divergence on a shared page, which can only come from
  a store-scoped mechanism.
- Draw the **new site's** two stores against each other beside production's, so that a
  store difference production has and the new site lost is visible.

The rule under all eight is one sentence: do not ask an editor a question they have
already answered, and do not pretend two questions are one when they are not.

## User Stories

### The measurement

1. As a maintainer, I want to know how many findings have a lifespan of one or two days,
   so that I know whether decision churn is a bigger problem than decision repetition.
2. As a maintainer, I want to know which pages produce short-lived findings, so that I can
   see whether a store-scoped mechanism is behind them.
3. As a maintainer, I want that measurement to read the run log already on disk, so that
   it costs no crawl and no new data.
4. As a maintainer, I want the number recorded in the ticket, so that a later reader knows
   what the corpus looked like when these decisions were made.

### The rename class

5. As an editor, I want a renamed image to be one finding that names both filenames, so
   that I decide once instead of reading two rows and joining them myself.
6. As an editor, I want to search for the **new** filename and find the finding, so that I
   can trace an asset I only know by its new name.
7. As an editor, I want the rename to be decidable, so that I can dismiss it with a note
   when the rename was intentional.
8. As an editor, I want the arrow between the two names to be part of what the finding is,
   so that a second rename asks me again instead of inheriting my first answer.
9. As an editor, I want a rename to carry no direction, so that it is not tinted as a loss
   or an addition, because nothing was lost and nothing was added.
10. As an editor, I want the two single-sided findings to disappear when a rename claims
    them, so that one change is one row.
11. As a maintainer, I want the pairing to refuse anything but one-to-one, so that a reader
    can verify the claim at a glance.
12. As a maintainer, I want the pairing to require both arity and position, so that an
    unrelated image swap is not reported as a rename.
13. As a maintainer, I want equal `alt` text to raise the row's score and not to gate the
    rule, so that the common empty-`alt` case still pairs.
14. As a maintainer, I want the class to be the thirty-third in a closed vocabulary, with a
    label, a meaning and a visibility, so that it cannot arrive half-defined.

### The repeat corpus

15. As an editor, I want an image finding on `nl` to tell me it is also on `de`, `fr` and
    `uk`, so that I know the size of what I am deciding.
16. As an editor, I want to dismiss an image repeat across all six stores in one press, so
    that one judgement is one action.
17. As an editor, I want a text repeat to stay inside its language block, so that I am
    never asked to judge words I cannot read as one thing.
18. As an editor, I want each press to say in which stores it wrote, so that I can see what
    I did.
19. As an editor, I want a press to skip a finding a colleague already decided, and to tell
    me it did, so that a wide press cannot quietly overwrite a judgement.
20. As an editor, I want the dismissal note to stay mandatory however wide the press, so
    that a wide judgement still says why.
21. As a maintainer, I want the write to stay N ordinary per-store events, so that the
    override table gains rows and never a column.
22. As a maintainer, I want no finding id, scope or column to change, so that no existing
    decision expires.

### The all-stores search

23. As an editor, I want one screen that searches every store, so that I stop repeating a
    search five times.
24. As an editor, I want the results grouped by difference, with the store inside, so that
    the result is still a proposition I can press on.
25. As an editor, I want the screen to have its own URL, so that Back works and a link can
    be shared.
26. As an editor, I want to search a filename, an anchor's words, a URL target or a heading,
    so that the fields I already search do not narrow.
27. As an editor, I want to search notes as well as findings, so that a colleague's reason
    is findable.
28. As an editor, I want to see which store each result is on, so that a merged list is
    never ambiguous.
29. As an editor, I want a result I cannot press on to say why, so that a `text` row from
    another language block does not look like a bug.
30. As an editor, I want class pills to narrow an all-stores result, so that the narrowing I
    know works here too.
31. As an editor, I want *Include closed* to keep meaning what it means, so that nothing
    silently vanishes.
32. As a maintainer, I want the screen to need no backend, so that it stays a static build.

### The shared-page file

33. As a maintainer, I want a committed list of store pages whose new-site record is not
    shared, so that the log knows a fact no crawl can see.
34. As a maintainer, I want the list to carry the date it was taken, so that its age is
    visible where it is used.
35. As a maintainer, I want a key that resolves to no page to fail the build, so that a
    typo cannot silently grant permission.
36. As a maintainer, I want the only normalisation to be the structural one, so that a stale
    record is reported and not quietly mapped onto a live page.
37. As a maintainer, I want the build to list unresolvable keys, so that the check doubles as
    housekeeping on the Magento side.
38. As a maintainer, I want an absent page to be read as **not shared** when it is newer than
    the file's date, so that an out-of-date file cannot grant a permission it never saw.
39. As a maintainer, I want the file to state a fact about today and never a plan, so that a
    page is not treated as shared before the merge lands.

### The travelling fix claim

40. As an editor, I want to claim a fix once for a page whose record serves two stores, so
    that one edit is one claim.
41. As an editor, I want the claim to travel only where the finding is the same in both
    stores, so that a store-scoped difference is never claimed by accident.
42. As an editor, I want the claim to be contradicted per store by that store's own crawl,
    so that a wrong claim announces itself.
43. As an editor, I want the press to say which stores it will write to before I press, so
    that nothing happens that I did not see.
44. As an editor, I want a dismissal to behave exactly as it does today, so that only one
    thing changes at a time.
45. As a maintainer, I want a shared page with no repeat to offer no travelling claim, so
    that the two conditions are visibly both required.

### Store-scoped content and the sibling reading

46. As an editor, I want a divergence on a shared page to be named as store-scoped, so that
    I stop re-reading a difference that is there on purpose.
47. As an editor, I want store-scoped content to carry no decision, so that a deliberate
    store difference is never counted as work.
48. As an editor, I want to see production's two stores and the new site's two stores, so
    that I can tell a kept store difference from a lost one.
49. As an editor, I want the case where production diverges and the new site does not to be
    the row that stands out, so that a flattened variable is easy to find.
50. As an editor, I want the tool never to name the variable, so that it does not claim
    knowledge it cannot have.
51. As an editor, I want a legal-text divergence to read as correct, so that the log does not
    ask me to fix the law.
52. As a maintainer, I want both readings to stay display-only, so that ADR 0017 holds.

### Merge candidates

53. As a content manager, I want a list of pages that are two records and identical words, so
    that I know which pages are safe to merge in Magento.
54. As a content manager, I want that list derived and never hand-kept, so that it cannot go
    stale against the crawl.
55. As a content manager, I want the list to be a reading and not a checklist, so that the
    tool does not pretend to track work it cannot see.
56. As a content manager, I want the list to warn that a merge removes the ability to diverge
    later, so that a legal page is not merged by mistake.

## Implementation Decisions

### The rename class

- One new class in the closed class vocabulary, taking it from 32 to 33. It carries a key,
  a label in sentence case, a meaning and a visibility, in the same module as every other
  class. A class arriving without a label fails the suite (ADR 0019).
- **Visibility is `work`.** The workflow is to dismiss an intentional rename, and only a
  `work` class offers a decision. It follows that the class is in the search index, which is
  what makes the new filename findable. It also follows that the denominator grows when this
  ships. Absolute counts sit beside the percentage already, which is exactly why.
- **The detail is the arrow**, in the manner of `heading-level`'s `h2 → h3`. The detail joins
  the finding id, so a second rename is a new finding and does not inherit the first answer.
- **No direction.** `lost` and `added` are the tones of a one-sided class. A rename is neither.
- The pairing runs inside the existing image comparison, over the two sides' image records for
  one page. It is a rule over one page's data and not a match between finding ids over time, so
  the run log's no-re-attachment rule is untouched.
- **The test is arity and position, both required, one-to-one only.** Exactly one unclaimed
  `image-missing` and exactly one unclaimed `image-added`, at the same index in document order.
  Equal `alt` raises the row's score; it does not gate the pairing.
- **The rename resolves before the singles are emitted**, in the manner of the regrouped merge,
  so that no image record is on two rows.
- The comparison keeps its basename key. The asset convention recorded in parked ticket 45 is
  what makes that key language-independent: the path carries the locale segment and the filename
  is always English and semantic.

### The repeat corpus

- The repeat key's first term stops being *the block* and becomes *a function of the check*.
  For `images` and `links` it is a constant, so a repeat spans all six stores. For `text` and
  `meta` it is the block language, exactly as today. `de` and `uk` remain alone for the second
  group and join the first.
- **Nothing is keyed on this.** A repeat is a grouping the interface makes. No finding id, no
  scope, no column and no URL changes. The table gains rows and never a column.
- A bulk press keeps taking the flat list of `(store, page, finding)` entries that ticket 138
  moved it to. A six-store press is a longer list to the same code. Every existing rule holds:
  eligibility per entry, skip a colleague's decision and count it, name the stores off the
  eligible entries and never off the row.
- **Only the judgement travels here.** A wide dismissal and a wide clearing are unchanged in
  kind. The fix claim's own widening is a separate decision, below, and rests on a different
  fact.
- The **search corpus** and the **repeat corpus** become two different things and need two
  words. Reading may cross any store, because reading moves no count. Pressing may cross only
  where the check makes the two sides the same string.

### The all-stores search

- A new screen with its own URL, above the stores. The per-store search keeps its present
  default of this store and its sibling.
- The index loader generalises from *this block's two indices* to *an arbitrary set of them*.
  Six static index files, fetched together; a partial read is an error and not a narrower
  search, as it is today.
- **The result shape does not change.** Findings group into differences, and the store becomes a
  grouping inside a difference. A flat list would lose the proposition a wide press needs.
- **No status filter.** A bucket counts and never filters. Closed stays a disclosure that names
  how many it holds. *Include closed* is unchanged and stays out of the filter strip.
- *Type* is not a word here. The control is **class** pills, as everywhere.
- A row the current corpus rule makes unpressable is shown, is not tickable, and says why.

### The shared-page file

- One committed file, in the manner of the excluded-pages and drop-rule lists: an entry per
  line with its Magento record id and its reason.
- It states the **complement**. It lists store pages whose new-site record is **not** shared
  with its block sibling. Everything else in the block is shared. This is sound because sharing
  happens only inside the two blocks, so the only possible partner is the sibling store.
- It is taken from the **new site's** Magento, filtered to **enabled** records, because the new
  site is where a correction lands.
- It carries the **date** it was taken. A store page whose first sighting in the run log is
  later than that date is read as **not shared**, so an out-of-date file cannot grant a
  permission it never saw.
- **Only structural normalisation.** The `fr/` prefix on `be_fr` paths is a host artefact and is
  stripped, as the sibling pairing already strips it. Nothing else is normalised. Every remaining
  key must resolve to a store page in the corpus or the build fails and names it.
- One new pure module answers *is this store page shared*, from the file and the corpus. It is
  the only new seam in this spec.
- The file describes today. An entry leaves it when the merge lands in Magento, never before.

### The travelling fix claim

- A fix claim may be written for both stores of a block when **both** hold: the store page's
  new-site record is shared, and the finding is a repeat over that block.
- The repeat condition is what handles a custom variable. If the two stores render the same two
  strings, the words come from the record. If they do not, no repeat exists and no claim travels.
- The residual risk is a variable that holds equal values today. It is bounded by the nature of
  the claim: a fix claim loses to re-check, so each store's next crawl contradicts it and names
  the editor. That is why this is safe for a claim of fact and would not be safe for a judgement.
- The press states the stores before it writes, off its own events. The write is two ordinary
  events, one per store, each carrying its own observation.
- **The dismissal is unchanged.** Sharing grants it no permission it does not already have, and
  removes none.

### Store-scoped content and the sibling reading

- On a shared page a divergence between the block's two stores can only come from a store-scoped
  mechanism. That inference is sound only because the record is one, which is the file's whole
  contribution.
- **`store-scoped content`** is a proposed new term. It is a reading. It has no id, no override
  and no place in a bar, and it is never called a finding.
- The sibling tab gains a **second reading**, not a fourth comparison: production's two stores as
  today, and the new site's two stores beside it. The interesting row is production diverging
  where the new site does not, which is a store difference the migration lost. Where that produces
  a defect it is already an ordinary axis-A finding on the affected store, and that is where the
  decision stays.
- The tool never names the variable. Its value is server-side and appears in no HTML.
- Both readings are decided as values by the existing reading functions and rendered dumbly, in
  the manner already used for the block list and the sibling view.

### Merge candidates

- Derived, never authored: the store pages in the not-shared file whose two stores already render
  the same words. The agreement share already measures that, asked both ways round.
- A reading and not a backlog. The tool does not track whether a merge happened; removing the
  entry from the file is what says so.
- The list carries a caution: two records rendering the same words today can be merged only if
  they never need to diverge later.

## Testing Decisions

A good test here states an external behaviour and would survive a rewrite of the thing under it.
It asserts over returned values, not over rendered markup or internal calls. The repo's habit is
that a module decides as values and a component renders them, and the tests follow that line.

- **The rename class** is tested at the image comparison's pure entry point: two sides' image
  records in, findings out. Cases: a clean one-to-one rename pairs; two missing and one added
  do not pair; a missing and an added at different positions do not pair; equal `alt` raises the
  score and unequal `alt` still pairs; the two singles are absent when a pair is made; a
  duplicated `src` makes one finding. Prior art is the existing contract tests and the regrouped
  tests, which are the same shape.
- **The class vocabulary** is covered by the existing guard that fails a class without a label,
  a meaning or a visibility. No new test is needed for that; the new class must simply pass it.
- **The repeat corpus** is tested at the repeat grouping function: an image finding on six stores
  groups into one repeat; a text finding on six stores groups into four; `de` and `uk` join an
  image repeat and stay alone in a text one.
- **The bulk presses** are tested at the existing press seam, which takes a flat entry list.
  Cases: a six-store selection writes six events with the correct store on each; a colleague's
  decision is skipped and counted; the reported stores come from eligible entries and not from
  the row. Prior art is the existing bulk tests.
- **The search** is tested at the pure search function over a fabricated multi-store index:
  results carry their store; grouping into differences survives the merge; an unpressable row is
  marked as such.
- **The shared-page module** is tested as a pure function: a listed page is not shared; an
  unlisted page in a block is shared; a page newer than the file's date is not shared; an
  unresolvable key raises rather than returning false.
- **The travelling fix claim** is tested at the press seam: both conditions true writes two
  events; shared but not a repeat writes one; a repeat but not shared writes one.
- **The readings** are tested as values: a shared page with a divergence reads as store-scoped;
  an unshared page with the same divergence does not.
- Browser-level tests stay at the level the repo already uses them for — that a control exists,
  is reachable and is announced — and not for arithmetic that a pure test can state better.
- Every ticket ends with the suite green.

## Out of Scope

- **Reusable-block and custom-variable mappings as authored data.** The log compares rendered
  text. A mapping would be a second copy of Magento's configuration with no way to detect drift.
  A parked ticket already refused this, and its reason was that the reusable content it measured
  was chrome. That reason is empirical, so if such content is found inside the content boundary
  the park deserves re-measuring — but the answer here is still a page note, which exists.
- **Promoting a block difference to a finding.** ADR 0017 holds. A difference between two stores
  is read and never decided, and the day that changes is its own ADR.
- **An editor-declared link between pages.** Nobody links anything. The sibling is derived, and
  the sharing is imported.
- **Inherited decisions.** A decision copied to another store is a new event in the name of the
  editor who pressed. There is no provenance column and no inheritance.
- **A status filter on any finding list.** A bucket counts and never filters.
- **Magento write-back**, which the map already rules out. This spec reads one grid and writes
  nothing.
- **The Magento import as the seed source.** The wide version would retire the carried-over
  provenance and anchor the pages that declare no alternate, and it would move the seed rule, the
  page key and the not-a-census caution together. It is parked, and the trigger to reopen it is a
  store-view map that has stayed fresh for a quarter.
- **An axis-B image comparison across stores.** Parked ticket 45. This spec makes no new
  comparison; it groups findings that already exist.
- **A locale-segment check** on asset paths. Ticket 45 names it as the defect worth catching and
  asks for a measurement first. It stays its own ticket.
- **The mute, in any form.** No standing rule silences a future finding.

## Further Notes

**Measured against the corpus on 2026-08-19.** `be` holds 131 pages and 130 are compared;
`be_fr` holds 122 and all are compared. The two not-shared lists carry about 22 lines of new
information for the Dutch block and about 33 for the French, the rest being pages the corpus
already knows are unpaired. By complement, roughly 105 of `be`'s 131 pages share a record with
`nl`. Sibling pairing was verified against the data and matches `CONTEXT.md`: the Dutch block
pairs 126 of 131, the French block 28 by declared alternate rising to 120 of 122 once path
equality is applied.

**Three keys did not resolve, and each was informative.** Two carried an `-n-v-t` suffix and are
records to be disabled. Three more — one French distributor page and two withdrawal-form pages —
exist only on the `fr` store or only on the new site. This is why an unresolvable key must stop
the build rather than be normalised away.

**Two anomalies fell out of the pairing measurement** and belong to nobody yet: one French
gallery page is spelled `eclairaige` on production and so cannot path-match its Belgian sibling,
and one `afterpay` row is keyed without its host prefix.

**Order of work.** The churn measurement is free and should run first, because a corpus full of
one-day findings would change what is worth building. The rename class is next, because it
improves the search before the search widens. The repeat corpus and the all-stores search then
land together as the answer to the original complaint. The shared-page half follows, and its first
ticket is the file and its validation, because nothing else can be trusted until an unresolvable
key stops the build.

**Vocabulary this spec adds**, to be written into `CONTEXT.md` when the first ticket lands:
**shared page**, **store-scoped content**, the rename class and its label, **copied** in place of
*inherited*, and the split between a **search corpus** and a **repeat corpus**. It continues to
refuse *link* for a page relation, *resolve*, *ignore*, *comment*, *source* and *type*.

**Three ADRs are expected**: the rename class, as the first class in a closed vocabulary whose
matcher is not textual equality; the check-decided repeat corpus, as the first thing in this repo
to cross a language block; and the shared-page file, as the first fact here that neither a sitemap
nor a crawl can produce.

**Where it came from.** A grilling session on 2026-08-19, from two ideas: *link Belgium with the
NL page* and *global search*. The session changed both. The link became an import, because the
fact is Magento's and not an editor's. The global search kept its shape and gained a rule about
what may be pressed as against what may be read. Two claims made early in the session were wrong
and were corrected in it: that a fix claim can never cross a store, which is false where the
record is shared; and that a shared record implies shared content, which is false where a custom
variable is in play.
