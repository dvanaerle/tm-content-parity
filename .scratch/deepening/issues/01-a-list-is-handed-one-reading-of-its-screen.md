# 01 — A list is handed one reading of its screen

Type: spec
Status: ready-for-human
Written: 2026-08-21
Decided in: a grilling session against the architecture review of 2026-08-21 (candidate 1 of
four, the top recommendation)
Records: `docs/adr/0030-the-list-reading-states-what-a-press-may-cross.md`, and the **List
reading** entry in `CONTEXT.md`
Blocked by: none. It may share a slot with `cpl` 129 part B and `cross-store` 07 — no file in
common with either, checked 2026-08-21 against both reading lists.

**What to build:** every repeat list is told one thing about the screen it is on — the store it
is about — and derives the rest. Above the stores, a row of translated words refuses its press
with the sentence naming where to decide it instead; an `images` or `links` row offers one press
over six stores. On a store's screen, rows declare their language and stop naming the store the
editor is already looking at. Nothing an editor sees changes. What changes is that one function
decides all of it, and a plain test proves it.

**One ticket, not two.** Splitting the module from its cutover would ship a module nobody calls,
and splitting the two list entry points would need a synthesised reading that exists only to be
deleted. Both were considered and refused.

- [x] A list reading is constructed from the store the list is about, plus the finding index,
      whether a term was typed, and the two href builders — and derives what a press may cross,
      the list's language, and whether rows name their store.
- [x] It answers a row in one call: the press or its refusal sentence, the row's language,
      whether the row names its store, and the row's two hrefs.
- [x] Both list entry points take the reading as one prop and provide it internally; the three
      drawing levels below read it and no longer receive the seven props.
- [x] All three screens build a reading. No screen imports the context.
- [x] A list mounted without a reading throws.
- [x] Unit tests cover every case named under *Testing Decisions* seam 1, including the refusal
      asserted as a whole string.
- [x] The browser cases whose rule moved are deleted in this ticket, not deferred.
- [x] `spansEveryStore()` stays where it is; `openWorkIn` is untouched.
- [x] `oxlint` and the full test suite pass.

## Problem Statement

An editor sees the right thing on screen today. The cost is paid by whoever changes the rule
next.

A repeat list is drawn on three screens: a store's dashboard, a store's search, and the search
above the stores. What the list may do differs between them — the same `copy` difference is
pressed on its own dashboard and refused above the stores — and each screen says so by handing
the list the answers rather than the fact they follow from.

Four of those answers are the same kind of fact, and each is drilled four levels of drawing code
to reach the cell that uses it: whether the list crosses stores, whether it answers a typed
question, what language the quoted strings are in, and whether a press is refused with what
words. Beside them, the one fact of exactly the same kind that already sits at a seam — the
selection — is read by context.

So one rule is derived in five places from four spellings of one fact. The refusal sentence is
built above the stores; the language is built from the store on the search screen; the pressable
rows are filtered in the list; the row and the page table each take a narrowed copy of the
answer; and store-naming takes the crossing as a separate argument. The rule over the two
corpora moved twice in one month — one ticket split them, the next widened how far a press may
cross — and each move had to find all five.

The consequence an editor does feel: the press rule is provable only by mounting a repeat list
four levels above the code that decides it, so a 1,681-line browser test is the only witness
that a refusal says the right sentence.

## Solution

A screen states one fact about itself — **which store the list is about** — and the list derives
everything else from it.

`store` is a store id on a dashboard or a store's search, and **none** above the stores. That is
not a convenience: a named store *is* the language block and no store *is* all six, so the store
is the half-and-whole distinction of ADR 0021 written as one value. From it, one **list reading**
answers every row: what it may press and, where it may not, the sentence saying why and where
instead; what language its two quoted strings are in, or no answer where the row spans four;
whether it names its store; and where its class label and page link land.

The refusal stays the screen's. What moves is where the sentence is written.

## User Stories

1. As an editor above the stores, I want a row of translated words to refuse its press with a
   sentence naming where to decide it instead, so that a refusal tells me what to do and not
   only that I may not.
2. As an editor on a store's dashboard, I want the same `copy` difference to be pressable there,
   so that the screen I am responsible for lets me finish work.
3. As an editor, I want an `images` or `links` row above the stores to offer one press over all
   six stores, so that one string on six stores is one decision.
4. As an editor, I want a `text` or `meta` row above the stores to be four decisions, so that
   four texts are not settled by one press I could not have checked.
5. As an editor using a screen reader, I want a row's quoted strings to declare their language,
   so that German content is not read to me in Dutch.
6. As an editor using a screen reader, I want a row spanning four languages to declare none, so
   that I am not told a wrong language instead of no language.
7. As an editor, I want a row above the stores to name the store it is on, so that a wide list
   is still a list of specific things.
8. As an editor, I want a row on a store's dashboard not to repeat the store I am already
   looking at, so that the row says only what I do not know.
9. As an editor, I want a searched row to show the fields my term matched, so that a result
   explains why it is a result.
10. As an editor, I want an unsearched row not to show matched fields, so that a dashboard row
    does not carry two dead words.
11. As an editor, I want a class label on any row to take me to that class, so that narrowing to
    one class is one gesture from wherever I noticed it.
12. As an editor, I want a page link on any row to open that page at that difference, so that
    the list is a way in and not only a report.
13. As an editor, I want a refused row to draw no tick of its own, so that a selection cannot
    arm a press over rows that will refuse it.
14. As an editor, I want the count a press reports to exclude refused rows, so that the
    denominator is the work the press can actually do.
15. As an editor, I want every screen to agree about what a press may cross, so that the answer
    does not depend on which way I arrived.
16. As an agent changing how far a press may cross, I want exactly one place to change it, so
    that I cannot land the rule in four sites and miss the fifth.
17. As an agent, I want the press rule proven in a plain test of values, so that I do not mount
    a list four levels above the rule to find out whether the sentence is right.
18. As an agent, I want the refusal sentence asserted as a string in a unit test, so that a
    reworded refusal fails loudly rather than passing a DOM query that matched a substring.
19. As an agent reading `Repeats`, I want its interface to be four props, so that I can tell
    what the list needs from what a level below it needs.
20. As an agent reading `Row` or `PageTable`, I want them to ask about the repeat in front of
    them, so that no level of drawing code holds a slice of an answer a lower level contradicts.
21. As an agent reading `Search`, I want it to stop being a pass-through for eight props, so
    that its own arguments are visible among them.
22. As an agent, I want a list mounted without a reading to fail, so that a missing provider is
    a crash and not a plausible page.
23. As an agent, I want the language rule and the press rule in one module, so that the two
    halves of ADR 0028's reach are covered by one test file.
24. As an agent, I want the browser test to keep the DOM cases and lose the moved ones, so that
    a rule has one witness rather than two that can disagree.
25. As a reviewer, I want the reason the refusal is still the screen's written in an ADR, so
    that the argument survives the prop whose comment carried it.
26. As a reviewer, I want `spansEveryStore()` to stay a property of the check, so that the split
    of the view module is not pre-empted by this change.
27. As a reviewer, I want the dashboard untouched but for one prop, so that the diff is about
    the reading and not about four screens at once.
28. As a future explorer, I want **List reading** in the glossary, so that the next architecture
    review does not re-suggest the seam that now exists.

## Implementation Decisions

**A new module, `list reading`, in the browser lib beside the other readings.** It is
constructed once per screen and takes: the store the list is about (`string | null`), the
finding index, whether a term was typed, and the two href builders. It derives — and does not
receive — what a press may cross, the list's language, and whether rows name their store.

**`store: string | null` is the interface.** Every screen already holds it: the dashboard is a
store's, the store search takes one, and the search above the stores passes none. The three
facts currently derived from it in three different modules are derived once, here.

**One call per row.** The reading answers a repeat in a single call returning the press or its
refusal, the row's language, whether the row names its store, and the row's two hrefs. `Row` and
`PageTable` ask it about the repeat they are drawing rather than receiving pre-narrowed
`refusal` and `refused` values from above.

**The refusal is words, not a flag.** The reading returns the sentence, so a caller cannot
invent one and the list cannot draw a refusal it has no words for. This is the rule the old prop
kept, and it is kept.

**Delivery is a plain object provided as context.** The two list entry points take the reading as
one prop and provide it internally, in the manner the selection is already provided from inside
the same module. The three screens never import the context, so the context is not part of the
interface and cannot be read out of band. The levels between stop carrying what they never used.

**A missing provider throws.** A neutral default reading would render as *above the stores with
everything refused*, which is a real screen, so the bug would draw a plausible page rather than
fail. The selection may default because *nothing selected* is genuinely neutral.

**Props removed from the list entry points:** whether the list crosses stores, whether it was
searched, the list language, the press refusal, and the two href builders, plus the finding
index — all seven now reached through the reading. The repeats themselves, the bulk press, the
log-read flag and the build time stay props: they are the subject and the screen's own
capabilities, not facts about the list.

**Left alone deliberately.** `spansEveryStore()` stays where it is and is imported by the
reading: it is a property of the **check**, not of the screen, and it belongs to the separate
work of splitting the view module. `openWorkIn` stays exported from the drawing module, which is
wrong for an unrelated reason; touching it would pull a third screen into this diff.

## Testing Decisions

A good test here asserts what an editor or a screen reader would observe: the sentence a refusal
says, the language a row declares, whether a store is named, where a link goes. It does not
assert that a context was read, that a helper was called, or that a prop arrived.

**Two seams, one of them new.**

1. **The list reading, unit-tested as values.** The new seam and the only one added. Every case
   is a store (or none) and a repeat in, and a reading out. Prior art: the tests for
   `blockReading()` and `siblingReading()`, and the existing view-module test file — plain
   Vitest, no DOM.
2. **The existing browser seam at the two list entry points, thinned.** It keeps what needs a
   DOM: the ticks and the selection, remounting dropping a selection, the drawn budget, the
   refused row drawing no tick, and the press count excluding refused rows. Prior art: itself.

**Cases that must exist at seam 1:** a named store presses everything its check allows; no store
presses `images` and `links` and refuses `text` and `meta`; the refusal sentence is asserted as a
whole string, including the stores it names; a row over six stores declares no language; a row
over one language block declares that language; a named store's rows do not name their store and
an unnamed screen's rows do; the searched flag decides whether matched fields are drawn; both
href builders are exercised, including the absent class link.

**Cases that must be deleted from seam 2:** every browser case whose subject is one of the
above. They move in this ticket, not a later one — a browser case duplicating a unit test is
what makes the next reader distrust both.

**No test at `Row`, `RowList` or `PageTable`.** They read the reading, and a test reaching them
directly would be testing past the interface.

## Out of Scope

- Splitting the view module into a content-view half and a repeat half. That is candidate 2 of
  the review, and it gets easier after this, not harder.
- Moving `openWorkIn` out of the drawing module, and the dashboard's import of it.
- The page-reading and page-queue work of candidate 3, and the override hook's raw map.
- Giving the bulk press and the chips their own tests. Candidate 4 of the review claimed no
  deepening, and this change dissolves most of its reason.
- Any change to what a press may cross. The rule is unchanged; only where it is stated moves.
- Any change to the ordering of the list, the class pills' counts, or *Include closed*.

## Further Notes

The prop whose comment carries today's argument — *"the refusal is the caller's, because it is a
property of the screen and not of the row"* — is deleted by this change, which is why ADR 0030
exists: the argument is still true and needed a home that is not a comment on a deleted prop.

The measure of success is not the width of a signature. It is that the next move of the corpus
rule lands in one function with one test file, after two moves in one month that each had to
find five sites.
