# A language block is a view and not an axis, and the word "axis" is refused

Two stores whose hreflang codes share a language are a **language block**: `{nl, be}` and
`{be_fr, fr}`. The log now compares them, on production, and shows the answer on each
store's dashboard. What it does **not** do is call the result an axis, a finding, or a
number — and this records why, because the pressure to do all three will come back.

## What a block is

A block is derived from `HREFLANG_STORE` and written down nowhere else. `nl-NL`/`nl-BE`
give `{nl, be}` and `fr-BE`/`fr-FR` give `{be_fr, fr}`; `de-DE` and `en-GB` are alone in
their languages, so **`de` and `uk` are in no block**. That is the whole answer to "may
`de` and `uk` be a block", and it cost no debate: each of them is the only store of its
language, so there is no second store whose words could be compared with theirs.

Derivation is the load-bearing part. A hand-written list of blocks would make the same two
blocks today and would be an invitation forever: somebody would add `{de, uk}` because
both are "the other ones", or `{de, nl, uk}` because the seed list mentions that shape.
Sixteen alternate shapes exist in the sitemap data and fifteen of them are cross-language.
The rule refuses them all without anybody having to argue.

**A block is not a pair.** A **store-page pair** is production against the new site for one
store page; a block is two stores on **one** side. The grilling that produced this work made
that collision before catching it, which is the reason this paragraph exists.

## Why "axis" is refused

Axis A is parity: production against the new site, in one store. Axis B is coverage: NL
against the five others, presence only, and parked. The block reading is neither, and the
tempting name for it is **axis C**. It is refused.

In this repo an **axis** is not a synonym for "a way of looking at the data". It means a
tab, a task, and in the end a **count**:

- Axis A has a progress bar, a denominator and a roll-up.
- Axis B was specified with its own tab and its own count before it was parked.
- **Ticket 11 forbids summing axis B's bar with axis A's** — and that rule exists *only
  because an axis has a bar*. It is meaningless about a thing with no bar.

So the word carries the bar with it. Call a block an axis and the bar follows, because
every other axis has one and a reader who finds the third without one will read the absence
as unfinished work. Then the block needs a denominator, which needs a definition of *done*,
which needs a decision an editor can make — and at the end of that chain a block difference
is a finding, which is the thing it must not be.

The axes are what an editor **works**. A block is what an editor **reads**.

## A block difference is a display-only difference

It has no id, no override and no place in a bar. It moves no count, no denominator and no
percentage. Nothing about it is `work`, and it is **never** called a finding: a finding is
actionable and carries a decision, and this carries none. The precedent is the **Meta tab**,
which shares the diff colours and withholds the override control for exactly this reason —
shared colours must not offer something an editor can complete.

No class was added. The vocabulary stays closed, and in particular the sibling-absent row
does **not** borrow axis B's `missing-page` or `orphan-page`: those were specified as
*counted* classes, and the row here is counted nowhere.

The ranking is a share, and it is **not a score on a finding**. It orders a list and nothing
else, it carries no tone on screen, and it is called **agreement** and never *identity* —
`CONTEXT.md` gives *identity* to the finding id, which is a different question.

## Why the surface is two store dashboards and not one block screen

A `/block/nl-be/` route would be one screen instead of two mirrored ones, and it is cheaper.
It is refused: it is a third kind of dashboard belonging to no store, and **ticket 38 settled
that a store is the unit an editor is responsible for**. So every block page appears on two
dashboards as two readings of one fact, and there is nothing to keep in sync **because a
block difference carries no decision**. That last clause is what makes the duplication safe;
if a block difference were ever decidable, this trade would have to be re-argued.

## What was considered and rejected

- **Axis C, with a bar.** The whole of the section above.
- **Merging `be_fr` and `fr` upstream**, in `pageKey()` or the seed list. It is the tidier
  model. It also expires every finding id on those two stores and breaks every existing link
  into them — to make a display-only view cheaper. The join lives in the derivation instead.
- **Excluding the legal pages.** They are among the least identical, and an exclusion buys
  almost nothing: they carry 4.5% of the Dutch block's difference volume and 8.6% of the
  French one's. Worse, it would exclude at **page** granularity what varies at **unit**
  granularity — the mistake ADR 0003 avoided by excluding *regions* rather than pages. The
  upgrade, if the list ever becomes unreadable, is detecting the ephemera at unit level:
  phone numbers, VAT and CCI numbers, host names, currency amounts.
- **Comparing the new-site side too.** The first version compares production only. The case
  where production agrees and the new site does not is real — 24 pages in the Dutch block, 4
  in the French — and it is a later question. It is also mostly the `untranslated` check's
  subject rather than this one's.
- **One direction of absence.** Rejected as a false economy: a page this store has and the
  sibling has not, and a page the sibling has and this store has not, are two different
  pieces of work. They are two kinds of row.
- **Calling the measure *identity*.** The PRD's own wording, refused for the reason above.

## Consequences

- **`HREFLANG_STORE` in `shared/` now passes ADR 0001's third question.** On the day ticket
  01 moved it, only `crawl/` read it, and that ADR's dated section says so plainly rather
  than claiming a reader that did not exist. `web/src/lib/blocks.mjs` is the second reader,
  and the stretch is closed.
- **The block reading stays in `web/`.** It fails ADR 0001's third question itself: only the
  web layer reads it. The vocabulary is the half that belongs in `shared/`.
- **Agreement is an answer with a word of its own.** 66 of the Dutch block's 125 measured
  pages and 48 of the French block's 120 are byte-identical, so a page that agrees is the
  common case. It says it agrees; it does not read as a comparison that failed to run.
- **The list is not a census and says so.** A page no sitemap declares is absent from it,
  and 48 of `nl`'s 181 cells are carried over for exactly that reason.
- **The original premise was wrong in a useful way.** The request predicted the divergence
  would be legal text. It is not. It is real editorial drift in the tail —
  `algemene-fotogalerij` at 6 of 163 units — and localisation ephemera above about 60%:
  phone numbers, company addresses, KvK and CCI numbers, and country-specific payment lists.
- **If a block difference is ever promoted to a finding, that promotion is its own ADR.**
  This work is the reason the promotion can stay refused, rather than a step toward it. The
  day it happens is the day the word "axis" becomes available. Not before.
