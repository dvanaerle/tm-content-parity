# The list reading states what a press may cross

Date: 2026-08-21

## Status

Accepted and implemented: decided in a grilling session against the architecture review of
2026-08-21, and built by `.scratch/code-health/issues/05`. It narrows nothing in ADR 0021,
which stands: *reading may cross any store; pressing may not.*

## Context

Three screens draw a repeat list: a store's dashboard through `ClassGroups`, a store's search
through `Repeats`, and the search above the stores through `Search`. What the list may do is
not a property of the list. It is a property of the screen — the same `copy` difference is
pressed on its own dashboard and refused above the stores — and until now each screen said so
by handing the list the answers.

Ten props carried them, and four of them are the same kind of fact: `acrossStores`, `searched`,
`language`, `refusesPress`. Each was drilled four levels, `Repeats` → `RowList` → `Row` →
`PageTable`, through levels that only pass them on. Beside them, the one fact of exactly the
same kind that already sat at a seam — the selection — was read by context.

The cost was not the width of the signature. It was that the same rule was derived in five
places from four different spellings of one fact:

- `AllStores.jsx` built the refusal sentence from `spansEveryStore()`.
- `Search.jsx` built the language from `store ? STORE_LANGUAGE[store] : null`.
- `Repeats.jsx` filtered the pressable rows from `refusesPress`.
- `Row` and `PageTable` each took a narrowed copy of the answer, `refusal` and `refused`.
- `namesStore()` took `acrossStores` as a separate argument.

Every one of them is a reading of one fact: **which store this list is about**. ADR 0021 split
the search corpus from the repeat corpus into a half and a whole; a named store *is* that half
and no store *is* that whole. The rule over the two moved twice in a month — ticket 03 split
them, ticket 04 widened how far a press may cross — and each move had to find all five sites.

## Decision

### The screen names its store; it does not carry the words of a refusal

A screen builds one **list reading** and gives it to the list. It is constructed from the store
the list is about — `string` on a dashboard or a store's search, `null` above the stores — plus
the things that are genuinely the screen's own: the finding index, whether a term was typed, and
where a class label and a page link should land.

The reading derives the rest. What a row may press and, where it may not, the sentence saying
why and where instead. What language the row's two quoted strings are in, or no answer where the
row spans four. Whether the row names its store.

**The refusal is still the screen's.** That has not been reversed and it is the reason the
reading exists: a screen that names its store has said everything about itself the list needs,
and it has said it in one word instead of four answers. What moved is where the sentence is
written, not who decides that there is one.

### One reading per row, and never a partial copy

The reading answers a row in one call. `Row` and `PageTable` ask it about the repeat in front
of them rather than receiving a pre-narrowed `refusal` or `refused` from above, so no level of
the drawing code holds a slice of the answer that a level below could contradict.

### It arrives by context, and the context is not part of the interface

`Repeats` and `ClassGroups` take the reading as one prop and provide it internally, in the
manner `FlatSelection` already provides the selection. The three screens never import the
context, so they cannot read the reading out of band, and the levels in between stop carrying
what they never used.

**A missing reading throws.** A neutral default would render as *above the stores with
everything refused*, which is a real screen — so the bug would draw a plausible page instead of
failing. The selection can default because *nothing selected* is genuinely neutral; *nothing
readable* is not.

**And a missing store throws for the same reason.** `listReading()` requires the store to be
stated, `null` included. Defaulting it to none would reinstate one level up exactly the bug the
throwing provider prevents: a screen that forgot to name its store would build a valid wide
reading and draw that plausible page. *No store* is a screen, not the absence of an answer.

## Consequences

- **The store is the interface.** `store: string | null` is the whole of the corpus
  distinction, so the next move of the rule ADR 0021 and ADR 0028 govern lands in one function
  with one test file, and not in five sites that must be found. The reading answers **whether
  the list spans stores** as well, so no screen reads that off the store a second time; and it
  holds the screen's page link, so the header blocks above a list are handed it rather than
  taking a builder of their own beside the reading that already has one.
- **The press policy leaves the browser.** Whether a repeat may be pressed, what the refusal
  says, and which stores it names are decided as values, so they are proven in a plain Vitest
  file. The browser test keeps what needs a DOM — the ticks, the remounting, the drawn budget —
  and loses the cases whose rule now has a test where it lives. Both halves land in one ticket:
  a browser case duplicating a unit test is what makes the next reader distrust both.
- **`spansEveryStore()` stays where it is.** It is a property of the **check** and not of the
  screen, so the reading imports it from `view.mjs` rather than absorbing it. That is the right
  relationship and it survives the split of `view.mjs`, which is separate work.
- **`openWorkIn` is untouched.** The dashboard goes on importing it from `Repeats.jsx`, which is
  a drawing module used as a library and is wrong for a different reason. Fixing it here would
  pull a third screen into this change for no reason of this change's.
- **A refusal is words and not a flag, still.** The list cannot draw a refusal it has no
  sentence for, which is the rule the old `refusesPress` prop kept and the reading keeps: the
  reading returns the sentence, and a boolean would let a caller invent one.
- **The alternative refused: a policy passed in.** Keeping `refusesPress` as a function on the
  reading would have removed the drilling and left the duplication, since the sentence — not the
  plumbing — is what was written twice.
