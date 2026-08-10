# 83 — A page carries a priority and a note

Type: task
Status: ready-for-agent
Blocked by: None — can start immediately.
Parent: ../map.md

**What to build:** an editor marks a page **Hoog** and writes *Campagne-update* beside
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

- [ ] Two actions exist on `scope: 'page'`, one carrying a priority value and one
      carrying free text. The table gains no new scope.
- [ ] A cleared annotation is a new event, never an edit or a delete. The existing
      `cleared` action is reused if it fits; if it does not, say why in the answer.
- [ ] `PRIORITIES` is a closed list in `shared/`, and a value outside it is refused
      before it reaches the database.
- [ ] Setting a value on N selected pages writes N events, one per page, and a partial
      failure reports how many were written.
- [ ] The store page can be filtered by priority, and the priority filter combines with
      the class filter.
- [ ] Neither annotation moves any count. The bar, the denominator and the buckets are
      unchanged, and a test pins it.
- [ ] No **owner** field appears, in the schema or the interface.
- [ ] The derivation is pure and tested: two events on one page give the later value.

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
