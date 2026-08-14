# 83 — A page carries a priority and a note

Type: task
Status: resolved
Blocked by: None — can start immediately.
Parent: ../map.md

**What to build:** an editor marks a page **Hoog** and writes _Campagne-update_ beside
it, on one page or on twenty selected at once. They can then filter the store to the
high-priority pages, and the note is findable by search.

## The decision this ticket carries

Two annotations and no more: a **priority** from a closed list, and a free-text **note**.
Both describe a page. Neither describes a finding, because a finding carries its own
decision.

The proposal asked for user-defined columns — add, rename, reorder, hide, remove, and
edit the select options. That is a schema editor, and it is refused here. Rename and
reorder are mutations, and the overrides table has insert and select policies only: it
is append-only by design, which ticket 03 chose because omitting UPDATE and DELETE makes
it append-only for free. A schema editor also needs authentication to be safe, and there
is none — an editor is a name in `localStorage`.

**There is no owner field.** With any name typeable by anyone, an owner column invites an
accountability reading it cannot support. If ownership is wanted, that is an
authentication ticket.

## What it delivers

- Two new page-scope actions on the existing table. One event means one thing, so the
  latest-event-per-key derivation stays trivial.
- `PRIORITIES` as a closed list in `shared/`, not in the database. Same reason ticket 08
  gave for the class vocabulary: a browser island reads it without `node:crypto`, and a
  closed list in git cannot drift.
- Setting either value on several selected pages at once.
- Filtering the store by priority, combinable with the existing class filter.
- The note reaching search through [82](82-search-reaches-the-content.md).

## Acceptance criteria

- [x] Two actions exist on `scope: 'page'`, one carrying a priority value and one
      carrying free text. The table gains no new scope.
- [x] A cleared annotation is a new event, never an edit or a delete. The existing
      `cleared` action is reused if it fits; if it does not, say why in the answer.
- [x] `PRIORITIES` is a closed list in `shared/`, and a value outside it is refused
      before it reaches the database.
- [x] Setting a value on N selected pages writes N events, one per page, and a partial
      failure reports how many were written.
- [x] The store page can be filtered by priority, and the priority filter combines with
      the class filter.
- [x] Neither annotation moves any count. The bar, the denominator and the buckets are
      unchanged, and a test pins it.
- [x] No **owner** field appears, in the schema or the interface.
- [x] The derivation is pure and tested: two events on one page give the later value.

## Traps

- **A page note and a dismissal note are different things.** A dismissal note is
  mandatory and explains one judgement about two strings. A page note is optional and
  explains nothing in particular. Do not render them the same way, and do not let one
  read as the other.
- **The temptation is the third column.** The moment two annotations exist, a third looks
  free. It is not: a third is the schema editor this ticket refused, and it needs a new
  decision.
- The database is on the free plan and ticket 13 decided it stays there. Two actions add
  rows at the rate an editor types, which is nothing. A schema table would not have been.
- Bulk selection of pages already exists for [31](31-bulk-dismissal.md)'s seam work.
  Reuse it rather than adding a second selection mechanism.

## Answer

Two actions on the existing `page` scope, `prioritised` and `noted`. The table gains one
column (`priority`) and one generated slot (`annotation_slot`); it gains no scope, no second
selection mechanism and no owner field.

### `cleared` does not fit, and this is why

The criterion asked for the existing `cleared` action to be reused if it fits. It does not.

On `scope: 'page'`, `cleared` already means **withdraw the review** — it is the only thing it
has ever revoked there. With three annotation families now sharing that scope, a `cleared`
event could not say which of the three it aimed at without a fourth column added purely to
disambiguate it, and one action would mean three things.

So a cleared annotation is still **a new event, never an edit or a delete**, but it is the
value-carrying action carrying nothing: `prioritised` with a null priority, `noted` with an
empty note. `cleared` keeps its one meaning, and the clearing came out free — the derivation
reads the latest event on the key whatever its value is, so no branch was needed for it.

### The trap that was load-bearing

The page scope had **exactly one key** (`page|store|page|`) in both `eventKey()` and the
`overrides_current` view. A third page-scope action would therefore have been the newest
event on the _review's_ key, and `review()` returns null the moment that event is not a
`reviewed` — so annotating a page would have silently withdrawn the review of it. That was a
genuine red in the second slice, not a hypothetical.

`PAGE_KEY` in `overrides/state.mjs` gives each annotation its own key term and leaves the
review's as the empty string it has always been, so **no row already on disk changes key**
and `cleared` goes on keying to the review. `annotation_slot` mirrors it in SQL. Unlike
`anchor_heading_slot`, this divergence is _not_ accepted as harmless: that slot keys eleven
retired rows nothing looks up, and this one keys rows the app writes whenever an editor
annotates.

### Where the decisions landed

- `PRIORITIES` is `high | medium | low` in `shared/priorities.mjs`. **No `normal`** — absence
  is not a value, so a word for the state every page is already in would be a fourth thing
  to filter by that means "no filter".
- No check constraint lists those words. The list is closed in git; a list in two places is a
  list that can drift, and the copy that wins is the one nobody reads in a diff.
  `priorityEventFor()` is the only guard, and it is the only thing between a typo and a
  permanent row.
- The **priority filter belongs to the page list**, the way the sort does. A repeat is a
  difference across pages rather than a page, so on _Repeats_ the filter would narrow nothing
  while the link promised it did.
- The **selection is session state, not in the URL** — the one control here that ADR 0010
  does not reach. A selection is not a screen: a link carrying twenty ticked pages would be a
  press somebody else half-made. It is cleared when the filter or the view changes, so a
  press cannot reach pages that left the screen.
- The interface is English throughout (ADR 0014), so the values are English. The ticket's
  _Hoog_ and _Campagne-update_ are what a Dutch editor types, and `Hoog` is pinned as a
  refused value in three tests.

### Seams tested, and one not

Agreed with the user before any test was written: the derivation and its event builders, the
URL and view filters, the bulk press, and `searchNotes`. 717 tests pass; 823 pages build.

Two things are worth naming as deliberately untested. The **DOM** seam was not among the
agreed four, so the _page note is not drawn like a dismissal note_ rule is enforced by
`PageNote` / `NoteKind` being the single renderer and is not pinned by a browser test. And
there is **no test Supabase project** in this repo, so the SQL is unexercised — see below.

### One hand step, taken

`supabase/page-annotations.sql` was **applied by hand on 2026-08-14** and the annotations
write. Running `schema.sql` whole drops the log, so the live change was the separate file,
per the `mute-anchor-heading.sql` convention.

The hazard is named in the file, and the check it asks for was made: the action check is
written inline on the column, so Postgres named it, and `drop constraint if exists` against a
wrong name silently does nothing — leaving the old check to refuse every `prioritised` row
while the migration reports success. The name matched, so the widened check took.

The log was backed up before the change: 1127 rows, 545 of them carrying a note, via
`overrides/dump.mjs`. The migration touches no row — it adds two columns, widens two checks
and rebuilds a view — so the dump was proportion rather than necessity.
