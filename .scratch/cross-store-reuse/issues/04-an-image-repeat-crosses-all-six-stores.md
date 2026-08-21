# 04 — An image repeat crosses all six stores

Type: task
Status: resolved 2026-08-21 — the corpus is `corpusOf()` in `web/src/lib/view.mjs` and the
press is on `/search/` (`AllStores.jsx`). ADR 0028 is written and `CONTEXT.md` is amended in
four places.
Blocked by: 03 — the repeat corpus has no surface until an all-stores result exists to press
on. Resolved 2026-08-20.
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

Write **a new ADR** before starting — the next free number at the time, not a number
reserved here. (0024 was reserved by this ticket, never written, and is now vacant for good;
see `docs/adr/README.md`.) This is the first thing in this repo to cross a language
block, and the block boundary has an ADR of its own that this one must answer rather than ignore.

## Criteria

- [x] The ADR is written: why the block's stated reason does not reach a filename, why the
      boundary still holds for `text` and `meta`, and why this is not parked ticket 45.
      It is **0028**, the next free number at the time.
- [x] The repeat key's first term becomes a function of the **check**, not of the block.
- [x] An image finding present on six stores groups into **one** repeat; a text finding present on
      six stores still groups into **four**.
- [x] A bulk dismissal over a six-store repeat writes **six ordinary events**, one per store, each
      carrying its own store off its own entry and never off the row.
- [x] The press **states in which stores it wrote**, off its eligible entries.
- [x] A finding a colleague already decided is skipped and counted, as today.
- [x] The dismissal note stays **mandatory**, however wide the press.
- [x] A `text` row from another language block is **shown, not tickable, and says why**.
- [x] Nothing is keyed on this: no finding id, no scope, no column, no URL changes.
- [x] The `CONTEXT.md` amendment to *Repeat*, in the manner ADR 0018 amended it — the claim and
      its corrected reason, dated.
- [x] `npm test`.

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
  Note what ticket 09 does to that sentence: a class pill **alone** is now a narrowed result, so
  the widest press this ticket can offer is a whole class over six stores — some 45 broken links
  per store, and hundreds on a hidden class. Every existing rule still holds and the note stays
  mandatory. Nothing here caps it; if a cap is ever wanted it is its own decision and its own
  ticket.
- **Do not let a store dropdown decide the repeat corpus.** Reading is a preference; pressing is a
  property of the check.

## Where it came from

A grilling session, 2026-08-19. The question was whether the block boundary or the check should
bound a cross-store repeat. The measured basis: the images check compares basenames with the path
stripped, and the asset convention in parked ticket 45 keeps filenames English and semantic, so a
basename is the same string on every store by design.

## What is delivered, and where it stops

**The corpus is one function.** `corpusOf(store, class)` in `web/src/lib/view.mjs` is the
first term of a repeat's key, and it is the whole of the change: `spansEveryStore()` beside it
answers off the class's **check**, so `images` and `links` key on a constant and `text` and
`meta` key on the block language as before. The rule is a set of two checks rather than a list
of classes, so the thirty-third class will inherit a corpus rather than needing an entry.

`bulk.mjs` was not touched, and that is the finding rather than an omission. Its test for this
ticket passed the moment it was written: the press has taken a flat `(store, page, finding)`
list since ticket 138, so six stores are a longer list to the same arithmetic. The test is kept
because *the arithmetic gained no case* is the ticket's own trap, and a later reader who adds a
case there should have something fail.

**The press is on `/search/` and nowhere new.** That is the screen holding six stores'
findings, so it is the only place a six-store row can exist. A dashboard's *Repeats* view is
fed its own store's pages and its sibling's, so the widest row it draws is the block-spanning
row it drew before — six stores of page summaries as island props was priced and refused by
ticket 03, and this ticket does not reopen it. `AllStores.jsx` therefore gained the four things
a press needs: the editor's name, the `bulk` seam, the log read with an editor in it, and

**`refusesPress`, which is the interesting half.** A `text` row on that screen is a legitimate
block repeat — pressed row by row it would write exactly what a dashboard writes — and it is
refused anyway, because `/search/?classes=copy` draws four blocks' rows in one list with a
select-all over them. One press there is a judgement over words in four languages, which is
user story 17 (*never asked to judge words I cannot read as one thing*) read the only way it
can be. Gating the select-all but not the tick would have been a third rule nobody could
state; gating on the check is the rule `CONTEXT.md` already holds.

The refusal is the **caller's**, and it hands over a *reason* rather than a flag — the same
difference is pressed on its dashboard and refused above the stores, and a list cannot draw a
refusal it has no words for. `Repeats` narrows the selection once off that function, so the
per-row tick, the table column and the result-wide select-all cannot disagree; a refusal
enforced only at the row would have left a select-all quietly ticking what the rows would not.

Three consequences a reader should not have to rediscover:

- **A row can now span four languages, so a row may declare none.** `rowLanguage()` used to
  take the `lang` off the repeat's first store, on the stated ground that a block's stores
  share a language. A six-store `images` row breaks that ground, and the two strings on it are
  a basename and a target, which are in no language. It now asks the row's stores and answers
  only where they agree.
- **`crossesBlock()` is `crossesStore()`.** The test — more than one store — never changed;
  the name had *block* in it because more than one store was only ever a block's two.
- **The stores sentence needed two reasons and an English list.** *These two stores share a
  language* is false under a six-store row, so `InWhichStores` reads the row's class and gives
  the check's reason instead. `join(' and ')` reads as *be and be_fr and de and fr and nl* at
  six, so it is a list now.

**What is not here.** The travelling fix claim (ticket 06) is untouched: only the judgement
crosses, and a fix claim rests on a different fact. No cap on a wide press — the widest this
permits is a whole class over six stores, every existing rule holds, the note stays mandatory,
and a cap would be its own decision and its own ticket.

## What it saves, measured

Over the corpus on disk, 2026-08-21. `measure-04.mjs` beside this ticket is the probe: it
reads the six built search indexes — every `work` finding in the log, which is exactly the
corpus a repeat is grouped over — and counts the rows under both keys.

- **17,831** work findings over the six stores, of which **7,367** are on `images` or `links`.
- Repeats keyed on the block: **9,472**. Keyed on the check: **8,449**.
- So **1,023 judgements** an editor stops making. That is a tenth of the queue, off one key
  term and no new data.
- Of the 2,773 repeats now keyed on the check, **1,273** are on more than one store, **428** are
  on more than two — which is the part that was impossible before — and **213** are on all six.

The 213 are the ticket's own case: `max.svg` renamed once, reported six times, decided once.

For scale beside ticket 03, which measured the same corpus at a different moment: that ticket's
block keying took the six stores' distinct decisions 16,881 → 12,722, and this takes the row
count a further 9,472 → 8,449. The two numbers are not the same quantity and should not be
added — 03 counted decisions over findings and this counts the rows an editor reads.
