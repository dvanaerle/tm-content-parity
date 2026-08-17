# 105 — A scope reaches the notes

Type: task
Status: resolved 2026-08-17 — merged into 104 as part B. Not built; the work is unchanged and it moved.
Blocked by: 103, 123
Parent: ../map.md

**What to build:** an editor scopes to a page and the notes half narrows with the
findings half. `/downloads` answers about the downloads page in both blocks, not in one.

This is nearly free: every override event already carries its store and its page as
required fields, and the notes block already draws a page link from them. The scope is a
filter over data the screen has in hand.

It also rescues the one-sided case from 104. A one-sided page has no findings and can
never have any, so a note is the **only** thing search can truthfully say about it — and
today the notes block would not be narrowed to it.

Scoping is what first puts a page note and a dismissal note side by side on one screen,
which is exactly where 83's warning bites: they are different things and must not read as
each other. Today every note renders identically. That stops here.

- [ ] A scope narrows the notes block to notes written on the matching pages.
- [ ] A scope plus a second term narrows the notes by that term as well.
- [ ] An unscoped search returns exactly today's notes. This adds a narrowing and removes
      none.
- [ ] A note's kind is legible on sight — a note attached to a page reads differently from
      the sentence given when dismissing ~~or muting~~ a finding. — **2026-08-13, ADR 0011:
      a dismissal is the only judgement that takes a note.** The two kinds of note are still
      two.
- [ ] A one-sided page with a note shows that note, alongside 104's explanation of why
      there are no findings.
- [ ] The two halves keep their two freshnesses and stay two blocks. No merged list.
- [ ] The notes half keeps 123's honest states: a scoped notes block never says "none"
      about a log it has not read.
- [ ] Notes stay governed by the latest-per-key rule, so a withdrawn note is never offered
      as a live one.

## Traps

- **The scope filters notes by their own page, not by the page a finding is on.** An
  event records where it was written, and that is the field to narrow on.
- The notes are shown whatever *inclusief afgesloten* says, for the reason 82 records: a
  note is required when dismissing, so nearly every note hangs off closed work. Do not
  quietly make the option govern them.
- Ticket 83 adds page-scope notes with a priority. It needs no key-shape change and this
  ticket should not pre-empt its vocabulary — only make room for a second kind of note to
  be told apart.

## Answer

**Merged into [104](104-a-scoped-search-says-which-kind-of-nothing.md) as part B, 2026-08-17.**
Nothing here is withdrawn and nothing is built. This ticket and four others were five
tickets over one search box — one scope value, one load-time page list, one component
tree — and not one of them moves a count, a bar or a denominator. The runbook's rule is
*batch freely inside a gate*, and there was no gate between them to batch across. 104 now
carries the notes half as part B, with every criterion and every trap from this file
copied across, and lands as its own commit on 104's branch.

Read 104. This file is kept as the record of where the work was written.
