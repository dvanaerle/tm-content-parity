# 04, in plain words — one press decides `max.svg` everywhere

A reading companion to `04-an-image-repeat-crosses-all-six-stores.md`. It explains what
gets built and what changes on screen. The ticket stays the source of truth for the
criteria; this file chases none of its references.

## The situation today

The log compares six stores (`nl`, `be`, `be_fr`, `fr`, `de`, `uk`) against the Dutch
original and reports **findings** — one actionable difference each. A finding belongs to
one store, because the store is part of what identifies it.

When the same defect shows up in several stores, the interface groups those findings into
a **repeat** so an editor can decide them in one press instead of one by one. That
grouping currently stops at the **language block**: `nl`+`be` share Dutch, `be_fr`+`fr`
share French, and `de` and `uk` are each alone. So the same defect in six stores is four
repeats and four decisions.

The reason given for that limit is: the stores translate the text, so six stores hold six
different texts, and six different texts deserve six different judgements.

## The observation this ticket rests on

That reason is about **text**. It is true for the `text` and `meta` checks, whose two
sides are sentences.

It is not true for `images` and `links`. Their two sides are image basenames and URLs —
`max.svg`, `/downloads` — and nobody translates a filename. The images check strips the
path and compares basenames, and the asset convention keeps filenames English. So an
`images` or `links` finding is **literally the same string on all six stores**, in every
language.

Six identical strings do not need six judgements. They need one.

## What changes

The rule that decides how wide a repeat is stops asking "which language block?" and
starts asking "which check?".

| Check | Repeat spans |
| --- | --- |
| `images` | all six stores |
| `links` | all six stores |
| `text` | the language block, as today |
| `meta` | the language block, as today |

`de` and `uk`, alone today, join the six-store group for images and links.

Concretely, the grouping is `repeatsInStore()` in `web/src/lib/view.mjs:798`. It builds a
key out of five terms, and the first one is the language block, falling back to the store
where a store is alone in its language. That first term is the whole of what changes: it
becomes a function of the finding's **check** — one constant for `images` and `links`,
the block for `text` and `meta`. The other four terms (class, both sides, detail) are
untouched.

Nothing is compared that was not compared before. No new check, no new finding, no new
column, no changed URL. The findings already exist and are already identical — the
interface just stops splitting them into four piles.

## What an editor sees

- The *Repeats* list on a store shows an image repeat covering six stores where it
  previously showed four separate ones. More rows are folded together; the number of rows
  goes down, no new column appears.
- Dismissing that repeat writes **six separate dismissal events**, one per store, each
  tagged with its own store. A dismissal still expires per store, exactly as now — the
  press is wide, the records stay individual.
- After the press, the confirmation **names the stores it wrote to**. An editor who
  presses once should not have to guess how far it reached.
- Findings a colleague already decided are skipped, and counted as skipped, as today.
- The dismissal note stays **mandatory** no matter how wide the press.
- A `text` row from a different language block still appears in the list, but is **not
  tickable**, and says why it is not. Visible, not silently dropped.

## What this ticket is not

- **Not a new comparison.** There is a parked ticket (45) that would compare NL's whole
  image set against a store's and produce new findings. This ticket makes no comparison;
  it regroups findings that already exist.
- **Not a fix claim.** Saying "I fixed this in all six stores" rests on a different fact
  — whether one edit really corrected all six pages — and is ticket 06. Only the
  *dismissal* judgement travels here.
- **Not a preference.** A store dropdown may narrow what an editor **reads**. It may not
  decide how wide a press is. Reading is a preference; pressing is a property of the
  check.

## Two things to keep an eye on

**A repeat has no identity.** It is a grouping the interface computes on the fly, not a
row in a table. Widening it must not tempt anyone into storing one.

**The press can now be very wide.** A wide press is only offered over a narrowed result —
a search term, a scope, or a single class. Since a class on its own now counts as
narrowed, the widest possible press here is one whole class across six stores: roughly 45
broken links per store, and hundreds on a large class. Every existing rule still applies
and the note is still required. Nothing caps it, and adding a cap would be its own
decision.

## Before starting

Write a new ADR (next free number) recording why the language-block reason does not reach
a filename, why the boundary still holds for text and meta, and why this is not the
parked comparison ticket. Then amend the *Repeat* entry in `CONTEXT.md` the way ticket 03
amended it: keep the old claim struck through, state the corrected reason, and date it.

Where it came from: a grilling session on 2026-08-19, asking whether the language block or
the check should bound a cross-store repeat. The check won, on measured grounds.
