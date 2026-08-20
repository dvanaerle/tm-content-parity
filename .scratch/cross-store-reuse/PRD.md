# Cross-store reuse

Type: spec
Status: live — 2026-08-20: issues 01, 03 and 09 are resolved and 05 and 08 are superseded by
10; 02 and 04 are the open work; 06, 07 and 10 are parked behind issue 11. A PRD carries no
triage label (see `docs/agents/triage-labels.md`).
Parent: ../content-parity-log/map.md

Written in Simplified Technical English, spelled in UK English. The words are
`CONTEXT.md`'s. Where this spec needs a word that list does not have, it says so and
proposes one.

> **Revised 2026-08-19, second grilling session.** The shared-page half of this spec is
> rewritten. A store page relation is now **declared by an editor** and not imported from
> Magento, it is stated **affirmatively** and not as a complement, and the word **link** is
> un-refused for this one relation. *What the revision changed* at the bottom records what
> the first session decided, why it was reversed, and what survives of its argument. Tickets
> 05 and 08 are superseded by ticket 10; ADR 0025 is superseded by ADR 0026.

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
4. **A fix cannot cross a store, even where one edit made it.** On the new site a single
   Magento CMS record can be assigned to more than one store view, so one edit corrects
   both stores. The log refuses a fix claim on the sibling, for the stated reason that
   *correcting one store's page does not correct the other's*. That reason is sound in
   general and wrong for these pages, and the log has no way to be told which is which.

Point 4 is the narrow one, and it is the only one left standing after the rest of this
spec lands. **A dismissal already crosses the block.** A repeat is keyed on the language
block for all four checks, and a wide dismissal already writes one event per store and
says in which stores it wrote. So the repetition an editor still meets is not in judging;
it is in **claiming a fix they only made once**.

Point 4 has a second half that costs more than the repetition. Two store pages that are
one record can still render different words per store, through a custom variable or a
store-scoped block — `{{customVar code=zonweringUSP}}`, and the legal text. If the
migration flattened one of those, a store now shows another store's words. Nothing in the
log says where a store difference was deliberate, so nothing says where one went missing.

## Solution

Nine changes. Six need no new data. Three rest on one new thing an editor declares.

**Without new data:**

- Measure how many findings live only a day or two, so that churn is a known number
  before anything is built on top of it.
- Add a **rename** class, so that `max.svg → max-new.svg` is one measured finding
  instead of two findings and an editor's memory.
- Let the **repeat corpus** be decided by the check. `images` and `links` repeats span
  all six stores. `text` and `meta` stay inside the language block.
- Give the search an **all-stores** screen, so that finding a string once is enough.
- Let a **class be a query** and its label be pressable, so that *Broken link* on one row
  opens every broken link in every store.
- List **link candidates**: pages that are not linked and already render the same words,
  so that an editor knows which pairs are worth checking in Magento.

**With the link:**

- Let an editor **link** two store pages of one language block, with a press, to say that
  they are one page.
- Let a **fix claim** travel over a link, when the finding is also a repeat over that
  block.
- Name **store-scoped content**: a divergence on a linked page, which can only come from a
  store-scoped mechanism, and draw the new site's two stores against each other so that a
  store difference production has and the new site lost is visible.

The rule under all nine is one sentence: do not ask an editor a question they have
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

### The class as a query

33. As an editor, I want to press a class label on a finding and get every finding of that
    class, so that I stop retyping a word that is already in front of me.
34. As an editor, I want that press to reach every store, so that *Broken link* is one queue
    and not six.
35. As an editor, I want a class on its own to be a whole query, with nothing typed, so that
    a class I can name is a list I can open.
36. As an editor, I want to type words into a class query afterwards, so that a wide queue
    narrows without my starting again.
37. As an editor, I want a class query to have its own URL, so that Back works and the queue
    can be sent to a colleague.
38. As an editor, I want a class query to say how many findings on how many pages, so that I
    know the size of the queue before I work it.
39. As an editor, I want an `information` class to open in the same way as a `work` one, so
    that reading is never gated on being able to press.
40. As a maintainer, I want an empty box with no class and no scope to keep drawing nothing,
    so that the refusal that ships today is narrowed and not removed.

### The linked page

41. As a content manager, I want to press one control to say that two store pages of a
    language block are one page, so that I can record what I see in Magento's store-view
    tree without a clone of the repository.
42. As a content manager, I want to press the same control to unlink them again, so that a
    mistake and a Magento split are both one press to correct.
43. As a content manager, I want to link every paired page of a block in one press, so that
    the common case does not cost a hundred presses.
44. As a content manager, I want to work through the pairs as a list, so that I can hold
    Magento's admin open beside it and go down the page.
45. As an editor, I want the same control on the page I am reading, so that an exception I
    discover while working is one press away and not a trip to another screen.
46. As an editor, I want a page to be linked only after somebody pressed, so that silence
    never grants a permission.
47. As an editor, I want a link to say who made it and when, so that a colleague's claim
    carries a name.
48. As an editor, I want a reason to be offered and not demanded when I link, and to be
    expected when I unlink, so that the act which needs explaining is the one that asks for
    it.
49. As an editor, I want a link to reach only inside a language block, so that I am never
    offered a relation the rest of the log cannot use.
50. As an editor, I want a page with no sibling page to offer no link at all, so that the
    control is absent rather than refusing.
51. As a maintainer, I want the links to be append-only, so that a link is withdrawn by a
    later event and never by an edit.
52. As a maintainer, I want a link naming a page the corpus no longer holds to be
    housekeeping and not a failure, so that live data edited by several people cannot
    white-screen the log.
53. As a maintainer, I want a link to claim nothing about Magento, so that it can never be
    out of date with a configuration it never copied.

### The travelling fix claim

54. As an editor, I want to claim a fix once for two linked pages, so that one edit in
    Magento is one press.
55. As an editor, I want the claim to travel only where the finding is the same difference
    in both stores, so that a store-scoped difference is never claimed by accident.
56. As an editor, I want the press to say which stores it will write to before I press, so
    that nothing happens that I did not see.
57. As an editor, I want the claim to be contradicted per store by that store's own crawl,
    so that a wrong link announces itself on the store it wrongly closed.
58. As an editor, I want a press to skip a store a colleague already decided and tell me it
    did, so that a travelling claim cannot overwrite a judgement.
59. As an editor, I want each store's bar to keep counting its own findings, so that a
    store's percentage still describes that store.
60. As a maintainer, I want a linked page with no repeat to offer no travelling claim, so
    that the two conditions are visibly both required.
61. As a maintainer, I want a dismissal to behave exactly as it does today, so that only one
    thing changes at a time.
62. As a maintainer, I want unlinking to retract nothing already written, so that the link
    keeps no ledger of what it authorised.

### Store-scoped content and the sibling reading

63. As an editor, I want a divergence on a linked page to be named as store-scoped, so that
    I stop re-reading a difference that is there on purpose.
64. As an editor, I want store-scoped content to carry no decision, so that a deliberate
    store difference is never counted as work.
65. As an editor, I want to see production's two stores and the new site's two stores, so
    that I can tell a kept store difference from a lost one.
66. As an editor, I want the case where production diverges and the new site does not to be
    the row that stands out, so that a flattened variable is easy to find.
67. As an editor, I want this reading available before I trust a link, so that I can check
    whether two pages I linked really do render the same words on the new site.
68. As an editor, I want the tool never to name the variable, so that it does not claim
    knowledge it cannot have.
69. As an editor, I want a legal-text divergence to read as correct, so that the log does not
    ask me to fix the law.
70. As a maintainer, I want both readings to stay display-only, so that ADR 0017 holds.

### Link candidates

71. As a content manager, I want a list of pairs that are **not** linked and already render
    the same words, so that I know which pages are worth checking in Magento's store-view
    tree.
72. As a content manager, I want that list derived and never hand-kept, so that it cannot go
    stale against the crawl.
73. As a content manager, I want the list to be a reading and not a checklist, so that the
    tool does not pretend to track work it cannot see.
74. As a content manager, I want the list to warn that identical words are not evidence of
    one record, so that the list is read as a place to look and never as an answer.

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

### The class as a query

- Today the term decides what matched and the classes narrow the result afterwards, so an
  empty box with a pill on matches nothing. `searchStore()` skips an entry whose matched
  fields are empty, and with no term and no scope every entry's are. The class becomes a
  **selector** as well as a filter: with nothing typed, the classes on are the corpus and
  every finding they hold is a hit.
- **The refusal is narrowed, not removed.** Three things can open a result: words, a page
  scope, a class. None of them on, and nothing is drawn, exactly as today. The empty box
  keeps meaning the empty box.
- The narrowing itself is untouched. The pills still apply through `repeatsWithClasses()`
  after the grouping, for the reason already recorded there: a repeat's key holds its class,
  so no repeat is ever half-filtered. What changes is only which entries reach the grouping.
- **A matched field is not invented.** A finding selected by its class matched no field, so
  the row reports no field hits. What the row matched on is the pill, which is on screen.
- The label on a finding row becomes a press. Prior art is `searchForRepeat()`, which writes
  a repeat's words and class as a screen; this is the same gesture with the words left out.
  It targets the **all-stores** screen, which is what makes one press six stores.
- **Two presses, two verbs, one class.** The pill in the filter strip toggles. The label on
  a row opens. The label is a link and the pill stays a control, so a press that navigates
  never looks like a press that filters.
- **No new parameter.** `classes` is already in the URL contract and the all-stores screen
  carries the same screen shape, so a class query is that screen with `classes` set and
  `query` empty. The contract can already write and read it; only what it draws changes.
- **Visibility does not gate it.** An `information` class opens and its rows are read and
  never decided, as they are on every other screen. `canDecide()` keeps answering that per
  row, and no bar, denominator or roll-up moves. Search narrows and moves no count.
- A class query over six stores can be long — a hidden class runs to hundreds on one store
  alone. It is drawn and counted as any other result, and the count is a count of the
  result. Nothing here is a queue the tool tracks.

### The linked page

- **`linked page` is a proposed new term**, and the word **link** is un-refused for this one
  relation. `links` remains a Check and the two never meet: a Check is a family of
  comparisons with finding ids in it, and this is a relation between two store pages with no
  id at all. The refusal was prose in four documents and no test enforces it. The interface
  says *Link page* and *Unlink*, and never *share*, *merge* or *resolve*.
- **It is an editor's judgement and not a transcription.** A link says *somebody decided these
  two store pages are one page*. It is informed by the store-view tree in Magento's admin and
  it does not claim to copy it. This is the whole of the revision: because the link asserts
  nothing about Magento's configuration, there is no configuration for it to fall out of date
  with, and therefore **no record id, no reading, and no date guard**.
- **It is stated affirmatively.** Nothing is linked until somebody pressed. An empty table
  means nothing is linked, which is the least permissive sentence available and needs no rule
  to make it so. The complement, and every guard the complement needed, is gone.
- **Inside a language block only.** `{nl, be}` and `{be_fr, fr}`. A store page has exactly one
  possible partner, its sibling page, so a link is a property of the **pair** and one event
  links both sides. `de` and `uk` are each alone in their language and offer no link.
- **A page with no sibling page offers no link.** The control is absent rather than present
  and refusing, in the manner the sibling tab is absent rather than empty.
- **Symmetric, with no base store.** Neither store of a pair is canonical. A direction would
  be a claim Magento does not make, and the French block gives no candidate for which of
  `be_fr` and `fr` would hold it.
- **Append-only, on the same terms as `overrides`.** Row level security on, an insert policy
  and a select policy, no UPDATE policy and no DELETE policy — the absence of the policy is
  the protection. Two kinds and no third: `linked` and `unlinked`. Newest event per pair wins.
- **A new table named for what it holds.** `page_links`, not a name borrowed from Magento,
  because it holds no copy of Magento. It is its own table and not a scope on `overrides`,
  because it decides nothing about a finding: it has no bucket, no bar, no denominator and no
  `cleared` verb, and in that table it would read as a judgement about content.
- **A reason is optional on a link and expected on an unlink.** Linking is the common case and
  needs no defence; unlinking says *I know something you do not* and deserves a sentence. This
  is the one place the interface asks differently in the two directions, and the asymmetry is
  the point.
- **Anyone who can open the site can write here**, as with `overrides`: an editor is a name in
  `localStorage` and the anon key identifies the project and not a person. A link grants a
  permission, so this widens who can grant it. It is the price of the fact being kept by the
  people who know it, and ADR 0026 records it rather than leaving it to be discovered.
- **A link naming a store page the corpus no longer holds is a stray.** Housekeeping and not a
  failure: it grants nothing, because such a page has no sibling pairing, and the screen names
  it so somebody can tidy up. Live data edited by several people must not white-screen the log
  over one stale row.
- Two conditions come from the corpus and never from the links: a page with **no sibling page**
  is not linked, whatever a stray row says, and a store outside a block is not linked.

### The travelling fix claim

- A fix claim may be written for both stores of a block when **both** hold: the two store
  pages are **linked**, and the finding is a **repeat** over that block.
- The repeat condition is what handles a custom variable. If the two stores render the same two
  strings, the words come from one place. If they do not, no repeat exists and no claim travels.
- The residual risk is a variable that holds equal values today, and a link that was simply
  wrong. Both are bounded by the nature of the claim: **a fix claim loses to re-check**, so each
  store's next crawl contradicts it and names the editor. That is why this is safe for a claim
  of fact and would not be safe for a judgement.
- The press states the stores before it writes, off its own events. The write is two ordinary
  events, one per store, each carrying its own observation id.
- **Skipping is unchanged.** A store whose finding a colleague already decided is skipped and
  counted, exactly as a wide dismissal does today.
- **Denominators do not move.** Each store's bar keeps counting its own findings against its own
  reports. ADR 0018's promise that one store's findings never enter another's denominator holds
  untouched, and a travelling claim closes one finding in each store rather than one finding
  twice.
- **The dismissal is unchanged.** It already crosses the block on the strength of the repeat
  alone, and a link grants it no permission it does not have and removes none.
- **Unlinking retracts nothing.** Events already written stand. A link keeps no ledger of what it
  authorised, and a claim that was wrong is contradicted by the next crawl in the ordinary way —
  which is also true of a claim that was right, and would be wrongly retracted by any other rule.

### Store-scoped content and the sibling reading

- On a linked page a divergence between the block's two stores can only come from a store-scoped
  mechanism. That inference is sound only because somebody asserted the two pages are one, which
  is the link's whole contribution.
- **`store-scoped content`** is a proposed new term. It is a reading. It has no id, no override
  and no place in a bar, and it is never called a finding.
- The sibling tab gains a **second reading**, not a fifth comparison: production's two stores as
  today, and the new site's two stores beside it. The interesting row is production diverging
  where the new site does not, which is a store difference the migration lost. Where that produces
  a defect it is already an ordinary axis-A finding on the affected store, and that is where the
  decision stays.
- **This ships alongside the link and not after it.** Once a fix claim travels, *are these two
  really the same on the new site* stops being curiosity and becomes the check on whether a link
  was safe. Shipping the permission first and the check later leaves a window with no way to
  look.
- The tool never names the variable. Its value is server-side and appears in no HTML.
- Both readings are decided as values by the existing reading functions and rendered dumbly, in
  the manner already used for the block list and the sibling view.

### Link candidates

- Derived, never authored: the sibling pairs that are **not** linked and whose two stores already
  render the same words. The agreement share already measures that, asked both ways round. This
  is the old *merge candidates* list with its polarity inverted along with everything else.
- **It suggests where to look and never what is true.** Identical words are what two separate
  records look like on the day before they diverge, so the list carries that caution in the
  interface and offers no press that links from the list itself.
- A reading and not a backlog. The tool does not track whether anybody checked a candidate;
  linking the pair is what removes it from the list.

## Testing Decisions

A good test here states an external behaviour and would survive a rewrite of the thing under it.
It asserts over returned values, not over rendered markup or internal calls. The repo's habit is
that a module decides as values and a component renders them, and the tests follow that line.

**Three seams, of which one is new.** Two replace the pair that tickets 05 and 08 built, at the
same two layers and with the same shapes; the third is the travelling fix claim, and it goes into
the module that already decides which events a press writes.

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
- **The link derivation** is tested as a pure function over hand-written event lists, with no
  project, in the manner `state.mjs` is tested: a `linked` event links both sides of the pair; a
  later `unlinked` event withdraws it; the newest event per pair wins; no events link nothing.
- **The link rule** is tested as a pure function over a fabricated corpus: an unlinked pair is not
  linked; a linked pair is linked on both stores; a page with no sibling page is not linked
  whatever the events say; a store in no block is not linked; a row naming a page the corpus does
  not hold is reported as a stray and does not stop the rule answering.
- **The travelling fix claim** is tested at the press seam that already takes a flat entry list:
  linked and a repeat writes two events; linked but not a repeat writes one; a repeat but not
  linked writes one; a store a colleague already decided is skipped and counted; the reported
  stores come from the eligible entries.
- **The readings** are tested as values: a linked page with a divergence reads as store-scoped;
  an unlinked page with the same divergence does not; production diverging where the new site
  does not is the row that is marked.
- **Link candidates** are tested as values over a fabricated corpus: an unlinked pair rendering
  the same words is a candidate; a linked pair is not; a pair with no sibling pairing is not.
- **The class as a query** is tested at `searchStore()` as values: a class with an empty
  term returns that class's repeats; an empty term with no class and no scope returns
  nothing; a term and a class together narrow exactly as they do today; a row selected by
  class alone reports no matched fields.
- **The press** is tested as a pure function beside `searchForRepeat()`: a finding writes a
  screen carrying its class and an empty query, and the URL it makes reads back as that
  screen.
- Browser-level tests stay at the level the repo already uses them for — that a control exists,
  is reachable and is announced — and not for arithmetic that a pure test can state better.
  Here that is two cases: the class label on a row is reachable and announced as a link and the
  pill in the strip is still a control; and the link control is reachable, announced, and absent
  on a page with no sibling page.
- Every ticket ends with the suite green.

## Out of Scope

- **A merged page screen.** One screen showing both stores' findings for `/logo-update` is the
  screen this session sketched and it is real work: today a store page view holds only its own
  store's findings and the sibling tab holds no findings at all. The cross-store pressing already
  works on the repeats surface, so the link ships without it and the screen becomes its own ticket
  with evidence behind it.
- **A base store on a link.** No direction, no canonical side. See the decisions above.
- **A link that crosses a language block.** Magento imposes no such limit and this spec does. If a
  record is ever assigned to `nl` and `de`, this is the decision to reopen, and it is a decision
  about the whole log and not about this control.
- **Retracting claims on unlink.** A link keeps no ledger of what it authorised.
- **Magento write-back**, which the map already rules out. This spec reads no grid and writes
  nothing to Magento. A link is a statement in this log about how an editor will work, and the
  editor is the one who keeps it true.
- **Reusable-block and custom-variable mappings as authored data.** The log compares rendered
  text. A mapping would be a second copy of Magento's configuration with no way to detect drift.
  A parked ticket already refused this, and its reason was that the reusable content it measured
  was chrome. That reason is empirical, so if such content is found inside the content boundary
  the park deserves re-measuring — but the answer here is still a page note, which exists.
- **Promoting a block difference to a finding.** ADR 0017 holds. A difference between two stores
  is read and never decided, and the day that changes is its own ADR.
- **Inherited decisions.** A decision copied to another store is a new event in the name of the
  editor who pressed. There is no provenance column and no inheritance.
- **A status filter on any finding list.** A bucket counts and never filters.
- **The Magento import as the seed source.** The wide version would retire the carried-over
  provenance and anchor the pages that declare no alternate, and it would move the seed rule, the
  page key and the not-a-census caution together. It is parked, and the trigger to reopen it is a
  store-view map that has stayed fresh for a quarter.
- **An axis-B image comparison across stores.** Parked ticket 45. This spec makes no new
  comparison; it groups findings that already exist.
- **A locale-segment check** on asset paths. Ticket 45 names it as the defect worth catching and
  asks for a measurement first. It stays its own ticket.
- **The mute, in any form.** No standing rule silences a future finding.
- **A class query as a saved queue.** Pressing a class draws a list. The tool does not
  remember that it was drawn, does not count it down and does not call it work assigned to
  anybody. A bucket counts and never filters, and a screen is what is drawn and never a plan.

## Further Notes

**Measured against the corpus on 2026-08-19.** `be` holds 131 pages and 130 are compared;
`be_fr` holds 122 and all are compared. Sibling pairing was verified against the data and matches
`CONTEXT.md`: the Dutch block pairs 126 of 131, the French block 28 by declared alternate rising
to 120 of 122 once path equality is applied. That gives **492 store pages over the two blocks**
that a link could reach — 126 `nl`, 126 `be`, 120 `be_fr`, 120 `fr` — of which **none is linked
until somebody presses**. Roughly 105 of `be`'s 131 pages were estimated to share a record with
`nl`, which is why the bulk press exists: the common case must not cost a hundred presses.

**Two anomalies fell out of the pairing measurement** and belong to nobody yet: one French
gallery page is spelled `eclairaige` on production and so cannot path-match its Belgian sibling,
and one `afterpay` row is keyed without its host prefix.

**Order of work.** The churn measurement is free and should run first, because a corpus full of
one-day findings would change what is worth building. The rename class is next, because it
improves the search before the search widens. The repeat corpus and the all-stores search then
land together as the answer to the original complaint. The class as a query lands with the
all-stores search or immediately after it, because it is the same screen and the same URL
contract. The link half follows, and its first ticket is the link itself; the store-scoped reading
ships **with** it and not after it, because it is the check on whether a link was safe. Link
candidates come last, because the list is only interesting once linking is possible.

**Vocabulary this spec adds**, to be written into `CONTEXT.md` when the first ticket lands:
**linked page**, **store-scoped content**, the rename class and its label, **copied** in place of
*inherited*, **class query**, and the split between a **search corpus** and a **repeat
corpus**. It **retires shared page**, and it **un-refuses *link*** for the relation between two
store pages, while keeping `links` as a Check. It continues to refuse *resolve*, *ignore*,
*comment*, *source* and *type*, and it refuses *merge* and *share* for this relation.

**Three ADRs are expected**: the rename class, as the first class in a closed vocabulary whose
matcher is not textual equality; the check-decided repeat corpus, as the first thing in this repo
to cross a language block; and the linked page, as the first permission-granting relation in this
repo that an editor declares. The third is **ADR 0026**, and it supersedes ADR 0025.

**Where it came from, and what the revision changed.** Two grilling sessions, both on 2026-08-19,
from two ideas: *link Belgium with the NL page* and *global search*.

The first session turned the link into an **import**, on the grounds that the fact is Magento's
and not an editor's, and refused the word. Tickets 05 and 08 built that: a hand-compiled
complement, first as a committed file and then as a table with a dated reading. Ticket 08 was
right that the surface was wrong — the person who reads Magento's grid has no clone — and kept
the polarity that the file's shape had forced.

The second session reversed the import. The argument that broke it: with no record id and no
reading date the claim carried **no evidence**, and ADR 0025's own central argument is that **no
crawl can see record sharing**. So nothing in the system could ever contradict it, and calling it
an imported fact was a description of something that was operationally an editor's decision. The
honest model is the one the user asked for in the first place — an editor declares it, owns it,
and can withdraw it — and it needs no date, no id and no guard.

**What survives of ADR 0025's argument**, and is restated in 0026: sharing **cannot be derived**
from a crawl, because two pages that are one record and two pages that are separate records
holding identical words are indistinguishable in the response and behave oppositely the moment
somebody fixes one. **Identical text is never evidence** of one record, in either direction. That
is why link candidates are a place to look and never an answer, and why the travelling fix claim
keeps the repeat as a second condition rather than trusting the link alone.

**Two claims made early in the first session were wrong and were corrected in it**: that a fix
claim can never cross a store, which is false where one edit corrects both; and that a shared
record implies shared content, which is false where a custom variable is in play. **One claim made
in the first session was wrong and is corrected here**: that an editor asserting the relation would
be "a second, unverifiable copy of a configuration that already exists". It is not a copy of
anything — it is a decision about how the editor will work, and it is exactly as verifiable as the
next crawl makes the claims it authorises.
