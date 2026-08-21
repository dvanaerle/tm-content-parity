# A filename is outside the language block

Date: 2026-08-21

## Status

Accepted. Extends ADR 0018, which stands unchanged for `text` and `meta`.

## Context

ADR 0018 decided that a judgement may cross a language block, and drew the boundary there. Its
reason is one sentence: **the stores translate their text**, so the two stores of a block do
not translate it between them and the same defect on both is one difference, while the same
defect across blocks is four.

That reason is true of the `text` and `meta` checks. It is **not** true of `images` and
`links`.

The `images` check compares basenames with the path stripped. The `links` check compares
host-folded targets. Both sides of both checks are therefore the same string on every store,
in every language: `max.svg` is `max.svg` on `nl`, `de` and `uk` alike. The asset convention
recorded in parked ticket 45 is what makes it so by design — the path carries the locale
segment and the filename stays English and semantic.

So the log was asking an editor the same question up to six times and calling it four
questions. When the migration renamed `max.svg`, every store reported it, and the editor wrote
the same sentence four times over four rows that held one fact between them.

## Decision

**The repeat corpus is decided by the check, not by the language block.**

The first term of a repeat's key becomes a function of the check:

- `images` and `links`: a constant. A repeat spans all six stores, and one press decides
  `max.svg` everywhere.
- `text` and `meta`: the block's language where the store is in a block, and the store where
  it is not — exactly ADR 0018's answer, unchanged.

`de` and `uk` are each alone in their language. They join the first group and stay alone in the
second.

The rule is a set of **checks** and not a list of classes, so a class added to either check
inherits the corpus rather than arriving with one nobody chose. A class the vocabulary does not
name answers *false* and stays inside its block, which is the narrower of the two answers.

**On the screen above the stores, a tick is offered exactly where the check makes the two
sides one string.** An `images` or `links` row is pressed there; a `text` or `meta` row is
drawn, is not tickable, and says that the stores translate those words and the decision is a
store's own. That is not a second corpus rule — it is the same one, and the refusal exists
because `/search/?classes=copy` draws four blocks' rows in one list with a select-all over
them. One press there would be a judgement over words in four languages, which is the one
thing ADR 0018's boundary is for.

## Consequences

- **ADR 0018 is extended and not overturned.** Its boundary holds wherever its reason holds.
  What changes is that the reason is now *asked* rather than assumed to cover everything: the
  block was standing in for "the two sides are the same string", and on two of the four checks
  it was the wrong proxy.
- **Nothing is keyed on this.** No finding id, no scope, no column and no URL changes. A repeat
  is a grouping the interface makes and has no identity to key on — true since ticket 31 — so
  the override table gains rows and never a column. A dismissal still expires per store,
  because the store is a term of the finding id.
- **The press seam gained no case.** It has taken a flat list of `(store, page, finding)`
  entries since ticket 138, so a six-store press is a longer list to the same code: eligibility
  per entry, a colleague's decision skipped and counted, and the stores named off the eligible
  entries and never off the row. The note stays mandatory however wide the press. If this had
  needed a change there, something would have been keyed on the block that should not have
  been.
- **A row can now span four languages, so a row may declare none.** The two quoted strings on
  a six-store `images` row are a basename and a target, which are in no language, and the
  `lang` a row used to take off its first store would have told a screen reader that German
  content was Dutch. The question is now asked of the row's stores: one language between them
  and it is theirs, more than one and there is none to declare.
- **A wide press is still offered only over a narrowed result** (ADR 0022), and ticket 09 made
  a class pill alone a narrowed result. So the widest press this permits is one class over six
  stores — some 45 broken links per store, and hundreds on a hidden class. Every existing rule
  holds and the note stays mandatory. Nothing here caps it; a cap would be its own decision.
- **This is not a language-block axis** (ADR 0017), and it is less of one than ADR 0018 was: a
  constant is not a block. What widens is a **selection** over ordinary axis-A findings, and
  nothing is promoted to a finding.
- **This is not parked ticket 45.** That ticket compares NL's image set against a store's, on
  axis B, and makes a new check. This makes no comparison at all: it groups axis-A findings
  that already exist and are already identical. The two meet only in the asset convention 45
  records, which is the measured basis for a basename being one string.
- **The store dashboards are untouched.** A dashboard's *Repeats* view is fed its own store's
  pages and its block sibling's, so an `images` row there spans what it always spanned. The
  six-store grouping is visible on the screen that holds six stores' findings, which is the
  search above them; six stores of page summaries as island props was priced and refused by
  ticket 03.
