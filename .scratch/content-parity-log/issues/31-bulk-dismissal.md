# 31 — One reason, many findings

Type: build
Status: resolved 2026-08-12 - built, and one acceptance criterion refused. See the answer.
Blocked by: 81, 88 — 30 and 76 are resolved
Parent: ../map.md

**What to build:** an editor decides once about a difference that is on thirty pages.
They select the repeat, write one reason, and the log records thirty decisions — one for
each finding, each with the editor's name.

**Two actions, one seam.** A bulk **dismissal** and a bulk **mute** are both blocked by
the same thing, and they have different selection units:

| | bulk dismissal | bulk mute |
| --- | --- | --- |
| unit | a **repeat** — identical text, one store | pages × class × section |
| survives a text change | no | yes |
| covers a page found next crawl | no | no |

Neither covers a page that appears later, and tickets 54 and 55 take the corpus from 451
to about 800 store-pages. Say that where the editor presses the button.

Spec 29 carried the story and shipped it as nothing:

> I want to dismiss the same difference on all thirty pages that carry it, so that one
> footer line is one decision.

## What was open, and what answered it

This ticket had three open questions. The grilling session of 2026-08-10 answered two
and ticket 81's measurement answered the third. **All three are closed.**

**1. How the editor finds the other pages.** Answered:
[81](81-the-repeat-is-the-queue.md) builds the **repeat** — every finding in one store
with the same class, the same two texts and the same detail. That is the grouping key
this ticket asked for. It is the finding id with the page removed, and it stays within
one store, because the stores translate the text.

**2. Where the control lives.** Answered: on a repeat row in 81's list. The page ledger
knows one page and cannot host this. No new view is needed, because 81 built the view
that already holds many.

**3. Whether a mute is the better answer.** Answered, and the answer is a warning.
[81](81-the-repeat-is-the-queue.md) measured the 816 reports on disk, after ticket 64
removed the promo banner that used to be the whole head of the distribution: the
largest repeat in the largest store is on **22 pages**, and **79–91% of every store's
repeats are singletons**. A bulk tool would idle. Ticket 76 closed on those numbers
without a second measurement. **This ticket is not shrunk to nothing, but it is smaller
than its opening sentence claims — thirty pages is not a case that occurs.** Say the
real size where the editor presses the button.

## What blocks it in the code

Two places in `web/src/lib/overrides.mjs`:

- `useOverrides()` reads **one page**: `port.readEvents({ store, page })`.
- `append()` takes the store and the page from the current report, so a caller cannot
  aim an event at another page.

A cross-page action has no path today. This is a change to the seam and not to a
component.

## What must stay true

- **No third key.** Ticket 09 is explicit: bulk writes N page-scoped events. The table
  gets N rows. Do not add a site-wide scope, and do not add a "repeat" scope — a repeat
  is a grouping the interface makes and it has no identity to key on.
- **A note is mandatory on `dismissed`.** One note, copied to all N rows, is correct;
  the SQL constraint refuses a row without one anyway.
- **Every row carries the editor.** Attribution is per row.
- **A partial failure must be loud.** N inserts can fail after the third. "23 of 30
  saved" is the honest report, and the log never drops a click silently.
- **The decision does not persist past the text.** Each of the N dismissals is keyed on
  a finding id, so each expires when its own text changes. Dismissing a repeat of 329
  findings does not stop the 330th appearing next crawl on a new page. Say this where
  the editor presses the button.

## Acceptance criteria

- [x] The seam takes a target page per event, so an event can be aimed at a page that is
      not the one on screen. **`useOverrides()` and `append()` did not change - see the
      refusal below.** `overrides/bulk.mjs` is the seam, and `overrides/bulk.test.mjs`
      covers it against a fake port.
- [x] Selecting a repeat and dismissing it writes one event per finding id, each with
      the same note and the same editor.
- [x] The table gains no scope and no action. `bulk.test.mjs` pins the vocabulary from
      both builders, and pins the dismissal to `finding` + `dismissed` alone.
- [x] A failure part-way through reports how many were written and which page failed.
      The interface does not claim success - and the report is drawn on **any** shortfall,
      not only on a named page, because a press can write nothing and name nothing.
- [x] The interface states, before the press, how much the decision covers and that it
      covers that only. It states it in **pages**, once: `CONTEXT.md`'s *Repeat* entry
      forbids the second unit, and the first draft of this control printed both.
- [x] The bar and the denominator move by exactly the number of findings dismissed, and
      by nothing else. A finding a colleague already decided is skipped and the skip is
      stated, so a press never overwrites a `fixed` claim with somebody else's judgement.
- [x] A mute is still available and still described honestly. 76 does **not** say a mute
      is the better tool - it says a bulk tool idles - so what the interface states at the
      point of choice is the measured size and the difference in expiry, which is the
      choice actually being made.

### Bulk mute

- [x] Selecting N pages, a class and a section writes N mute events, one per page, each
      with the same note and the same editor. The same seam serves both actions.
- [x] The count of findings covered is stated before the press, through the same
      `muteCoverage()` a single mute's button uses, summed per page. The gap between it and
      the difference's own size is stated too, because that gap is the warning.
- [x] A note is mandatory, per 88. Both builders return no events without one, and the
      `override_note` constraint covers `muted` as well as `dismissed`.
- [x] The two actions are not offered as one control, and they are not offered on one
      eligibility either: a repeat with nothing left to dismiss still offers the mute,
      which is the judgement that does not expire.
- [x] Bulk mute is **not** offered as the answer for campaign copy. A null anchor heading
      refuses the press and says why. *Unknown section* is a **second** refusal with its own
      sentence - merging the two would have told an editor their content sits before the
      first heading when the truth was a stale list.

## Traps

- **Ticket 30 was listed as a blocker and it is resolved.** That trap read "30 may be
  effectively done and unmarked" — it was. Checked 2026-08-12: the project holds **511**
  override rows written by more than one editor, up from the 45 ticket 65 counted. The
  edge is live. Nothing here waits on Supabase.
- **A repeat can be large.** The old measurement's largest single tuple was 329
  findings. Thirty-nine inserts is not the worst case; several hundred is.
- **This is not a mute in disguise.** A mute is a judgement about a class on a page and
  it persists. A bulk dismissal is N judgements about exact strings and they expire.
  Offering one where the editor wanted the other is the failure this ticket can produce.

## Origin

Ticket 09 named the rule. Spec 29 carried the story. The code review of the spec-29
work found it unbuilt and found the seam that prevents it. The grilling session of
2026-08-10 supplied the grouping key.

## Answer - 2026-08-12

Built. Both actions live on a repeat row in ticket 81's list, below the page list it opens,
because those are the pages the decision covers and an editor reads them before deciding
about them. The header row could not host them anyway: it is entirely a collapsible
trigger.

- `overrides/bulk.mjs` - `appendEach()`, the N-event write. Sequential, and it stops at the
  first refusal, which is the only shape that yields a report readable in one sentence.
  Nothing is rolled back: the table is append-only, so the rows that were written are
  decisions that were made.
- `web/src/lib/bulk.mjs` - `bulkDismissal()` and `bulkMute()`: what a press would write and
  what it covers, so the sentence above the button and the events behind it cannot drift.
- `web/src/components/BulkControl.jsx` - the two presses, each with its own note field.
- `useStoreOverrides()` writes now, and only in bulk. The page ledger stays the only place
  a single finding is decided.

### One acceptance criterion is refused

> *`useOverrides()` and `append()` both change.*

Neither did, and neither should have. The control belongs on a repeat row - this ticket's
own second open question settles that, and the page ledger "knows one page and cannot host
this". So the hook that had to learn to write is `useStoreOverrides()`, which could not
write at all. `append()` needed no change either: its defaults were already spread
**before** the caller's fields, so a caller could always aim an event at another page. That
is now a documented guarantee instead of an accident.

What the criterion was protecting - *an event can be aimed at a page that is not the one on
screen, proven without a network* - holds, and `overrides/bulk.test.mjs` is where it is
proven. An `appendMany` was briefly added to `useOverrides()` as well and then removed: no
page view calls it, and a page-scoped event list is the wrong home for foreign-page rows.

### What the size warning says, and why it is on screen at all

Ticket 81 measured 816 reports: the largest repeat in the largest store is on **22 pages**,
and **79-91%** of every store's repeats are singletons. Ticket 76 closed on those numbers
with *the bulk-dismissal verdict for ticket 31 is no*.

This is built anyway, smaller than its opening sentence and saying so. Thirty pages is not
a case that occurs, so the control states the real distribution where the press is made
rather than implying a tool that mostly idles. It is still worth building: the seam was the
blocker, `useStoreOverrides()` was read-only, and a 22-page repeat is 22 decisions an
editor otherwise makes 22 times.

### Not built

No page-wide bulk mute. ADR 0008 keeps the page-wide form second, for a page whose headings
are its content; across N pages it would hide a whole class on all of them from one press,
which is the largest press in the log multiplied. A page like that is a judgement to make
one page at a time.

### Two things the code review caught, worth keeping in the record

- **The doubled figure.** The first draft printed *N bevindingen op N pagina's* off one
  variable. `CONTEXT.md`'s *Repeat* entry forbids exactly that: the page is a term of the
  finding id, so the two are one number. It says pages, once.
- **A press that claimed success.** Closing the form on `failedOn === null` cleared it after
  a press that wrote nothing and named no page - the no-name case, reachable because the
  name field is on the same screen. Success is now `written === total` and no error.
