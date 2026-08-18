# A wide selection answers a narrowed question

A search result may be ticked whole, across every difference on it, in one press. The
control that does it is offered **only where the list is an answer to something** — a term,
a page scope, or a class pill — and never over the bare *Repeats* list. This records why the
condition is there, because it is the kind of restriction a later reader deletes as an
oversight.

## What changed, in one sentence

The selection stops being a property of one difference. `OneSelection` held
`{ key, ids }` — one repeat's ids at a time, so ticking in a second difference silently took
the selection away from the first — and it becomes a flat `Set<findingId>` over the whole
result. "Which difference" is no longer a term of the selection's identity, only of how the
ticks are drawn.

Nothing else moves. A press still writes N ordinary events, one per page, `scope: 'finding'`.
The unit selected is what it always was: a `(finding, page)` pair, which is one finding,
because the page is a term of the finding id. No scope is added, no column, no key.

## Why the narrowing is the condition

The bare *Repeats* list is every difference in the store — corpus-wide, 25,657 of them. A
select-all sitting on top of it is a press that dismisses a store, and the sentence an editor
would have to write in the note is *everything*, which is not a judgement about two strings.

A **narrowed** list is different in kind and not in size. `/faq zonwering` with two class
pills down is a set somebody characterised, and the note they write — `Links hebben geen ">"
meer.` — is true of that set because they chose it. That is what makes one note over 472
unlike string pairs honest rather than lazy: the query is the claim, and the note explains
it.

So the rule is not "hide the dangerous button." It is that a wide press needs a proposition
to be about, and only a narrowed result has one. The condition is nearly free in the code —
the flat row list is drawn under `searched` and nowhere else — but it is not free in the
vocabulary, and this is the file that says so.

## The block boundary is unchanged

A wide selection reaches this store and its sibling and stops, because that is the corpus the
search runs over (ADR 0021). It is not an all-stores press and this is not a step toward one:
*there is no all-stores repeat view*, and six stores is still four presses. The want that
argues for one — *stop asking me the same question six times* — is answered here by a factor
of 259, which is enough to leave ADR 0017's refusal standing.

## What was considered and rejected

- **Selecting differences as units.** A repeat is a grouping the interface makes and has no
  identity to key on. Ticking one would invent a selection unit that no event can be filed
  under, and the fan-out to pages would then be invisible at the moment of the press.
- **Ticking only what the press can act on.** Built once already and reversed —
  `Repeats.jsx` carries the note: one control refused what the other allowed. The ticks say
  *these pages*; eligibility lives in the press, which filters and then says what it did.
  A wide selection changes nothing about that and must not re-open it.
- **Batching the writes.** `appendEach` is sequential and stops at the first refusal, and its
  header explains why: `Promise.all` fires hundreds of inserts at a log that may already be
  refusing, `allSettled` returns a scatter of holes instead of a number an editor can read.
  At 472 events that is minutes, and the answer is progress and an abort, not a batch — a
  half-finished run is a legitimate outcome of an append-only table, and *N of M saved* is
  already the sentence for it.
- **Keeping the selection in the URL.** The scope and the class pills live there; a selection
  does not. A copied link that arrives with 472 rows pre-ticked is a press somebody else
  armed.
- **Shift-click range selection.** Refused. It is a second way to characterise a set, and it
  is the one way the note and the query cannot describe. Narrow with the query.

## Consequences

- **The selection straddles two clocks and always did.** It is built over the build-time
  snapshot; eligibility and the closed bar read the live log. A finding fixed since the last
  build is still selectable, one created since is unreachable. At four rows nobody notices;
  at 472 the confirmation names the snapshot date, which is the one place the staleness can
  do damage at scale.
- **The clearing is the destructive press, not the dismissal.** A dismissal cannot be pressed
  without a note, which is a real gate. A clearing revokes colleagues' judgements with one
  click and gets a typed-count confirmation above a threshold. The table is append-only:
  there is no revoke of a revoke.
