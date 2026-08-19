# 04 — An image repeat crosses all six stores

Type: task
Status: ready-for-agent
Blocked by: 03 — the repeat corpus has no surface until an all-stores result exists to press on.
Parent: ../PRD.md

## What to build

One press decides `max.svg` everywhere.

A repeat may span a language block and no further. The stated reason is that the stores translate
the text, so the same defect in six stores is four repeats. That reason is true of `text` and
`meta`. It is **false of `images` and `links`**, whose two sides are basenames and URLs — the same
strings on every store, in every language.

After this ticket the repeat corpus is decided by the **check**: `images` and `links` span all six
stores, `text` and `meta` stay inside the block. `de` and `uk` are alone for the second group and
join the first.

Write **ADR 0024** before starting. This is the first thing in this repo to cross a language
block, and the block boundary has an ADR of its own that this one must answer rather than ignore.

## Criteria

- [ ] ADR 0024 is written: why the block's stated reason does not reach a filename, why the
      boundary still holds for `text` and `meta`, and why this is not parked ticket 45.
- [ ] The repeat key's first term becomes a function of the **check**, not of the block.
- [ ] An image finding present on six stores groups into **one** repeat; a text finding present on
      six stores still groups into **four**.
- [ ] A bulk dismissal over a six-store repeat writes **six ordinary events**, one per store, each
      carrying its own store off its own entry and never off the row.
- [ ] The press **states in which stores it wrote**, off its eligible entries.
- [ ] A finding a colleague already decided is skipped and counted, as today.
- [ ] The dismissal note stays **mandatory**, however wide the press.
- [ ] A `text` row from another language block is **shown, not tickable, and says why**.
- [ ] Nothing is keyed on this: no finding id, no scope, no column, no URL changes.
- [ ] The `CONTEXT.md` amendment to *Repeat*, in the manner ADR 0018 amended it — the claim and
      its corrected reason, dated.
- [ ] `npm test`.

## Traps

- **The table gains rows and never a column.** A repeat is a grouping the interface makes and has
  no identity to key on. This has been true since ticket 31 and does not change here.
- **Only the judgement travels here.** A fix claim crossing a store rests on a different fact
  entirely and is ticket 06. Do not widen it in this ticket.
- **Do not reuse the press seam's shape.** It already takes a flat entry list from ticket 138, so
  a six-store press is a longer list to the same code. If the arithmetic gains a case, something
  is being keyed on the block that should not be.
- **This is not parked ticket 45.** That ticket compares NL's image set against a store's, on axis
  B, and makes a new check. This makes no comparison at all — it groups axis-A findings that
  already exist and are already identical.
- **A wide press stays offered only over a narrowed result** — a term, a scope, a class pill —
  never over the bare *Repeats* list. ADR 0022's condition is unchanged by the corpus widening.
- **Do not let a store dropdown decide the repeat corpus.** Reading is a preference; pressing is a
  property of the check.

## Where it came from

A grilling session, 2026-08-19. The question was whether the block boundary or the check should
bound a cross-store repeat. The measured basis: the images check compares basenames with the path
stripped, and the asset convention in parked ticket 45 keeps filenames English and semantic, so a
basename is the same string on every store by design.
