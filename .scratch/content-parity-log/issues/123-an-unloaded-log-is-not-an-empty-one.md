# 123 — An unloaded log is not an empty one

**Renumbered from 101 on 2026-08-13.** Number 101 was already held by
[the image-campaign rule hides editorial images](101-the-image-campaign-rule-hides-editorial-images.md),
opened two days earlier, and one number cannot name two tickets. This file moved
because it is the later claimant, which is the rule the out-of-scope README
states from the other direction: a number is never reused. The work is unchanged.

Type: task
Status: resolved 2026-08-14
Blocked by: None — can start immediately.
Parent: ../map.md

**What to build:** an editor searches in the first moment after a store loads, or
searches while the override log cannot be reached, and the notes half of the result says
what is actually true — *still reading the log*, or *the log could not be read* — instead
of drawing an empty block. Today it draws the empty block, and an editor reads that as
*there are no notes about this*. That is a false statement wearing the same clothes as a
true one.

82 was careful that the snapshot half and the live half are never merged into one list.
It was not careful about the moment before the live half arrives: the findings half has
a loading branch and an error branch, and the notes half has neither. The store page
hands the events down as an empty array while they are in flight, and the readiness flag
sitting right beside them is never consulted.

This is a pre-existing bug and it ships early, because 105 makes it matter — once a
search is scoped to one page, the notes block is often the only thing on screen, and "no
notes on this page" becomes a claim an editor acts on.

- [x] The notes half of a search returns a value that names its state — reading, failed,
      or answered with its matches — rather than a bare array a caller has to guess at.
- [x] An empty notes block is drawn only when the log has actually been read.
- [x] A log that could not be read says so, and recovers without a page reload once it
      can be.
- [x] The findings half keeps answering while the notes half is still reading. A slow log
      does not hold up the half already in memory.
- [x] The two freshnesses stay on screen as 82 requires: the findings dated by the build,
      the notes read from the log just now.
- [x] The reading and failed states are assertable in a unit test, so a state nobody can
      reach by hand is still pinned.
- [x] For a log that has loaded, the notes drawn are identical to today's. This changes
      what is said when none match, not which ones match.
- [x] No new request, no new store, no re-read of the log. The readiness signal already
      exists beside the events and is threaded through.

## Traps

- **An empty array and an unread log are different things**, and the fix is only real if
  the type says so. Inferring the state from the array's length in the component puts the
  bug back one layer down.
- Do not touch the findings half's loading and error branches. They exist and they are
  correct.
- Telling a page note apart from a dismissal note on screen is **not** this ticket. That
  is 105, which is where the two first appear side by side.

## Answer

The notes half now answers with **one of three things**, and `notes` is on one of them.
`searchNotes()` in `web/src/lib/search.mjs` takes the whole read of the log instead of the
events alone, and returns `{ live, state: 'reading' }`, `{ live, state: 'failed', reason }`
or `{ live, state: 'answered', notes }`. Nothing else changed about which notes match:
`latestByKey()`, the fold and the sort are untouched, and the six tests that pin them pass
on the new shape.

**`notes` is absent from two of the three on purpose.** That is the ticket's first trap
answered in the type rather than in a comment: a caller that forgets to read the state gets
`undefined` and breaks where it stands, instead of quietly drawing an empty block. It is
also why the state is not a fourth field beside a still-present array — an array that is
sometimes meaningless is the same bug with a label on it.

### Where the lie was, exactly

Two places, one layer apart.

`useStoreOverrides()` handed out `events: events ?? []`. That module's own docblock opens
with the rule it broke — *a failed read is never an empty list; `events` stays `null` until
a read succeeds* — and the coercion was on the one field that hands the events to a reader
who wants the **words** and not the derived state. A state derived from no events is the
same state as one derived from none, so the coercion below it is right; a *list of what an
editor wrote* is not. It is now `events`, nullable, with `ready` beside it as before.

`Notes` in `Search.jsx` then drew `notes.length === 0 → null`. Three branches now, read off
the result's own state and never off a count.

### Two states that could have gone either way

- **No connection is `failed`, not a fourth state.** `LogBanner` distinguishes them at the
  top of the screen and says whose fault each one is, which is the right place for that
  distinction. Down here the truth about the notes half is the same either way: there is no
  log to read. `notConnectedReason` is the `reason`.
- **An error over a log that *was* read still answers.** A failed write leaves the last good
  read standing, and `LogBanner` already says it can be out of date. This follows it, for
  the reason the banner records: telling an editor "no notes" while their own dismissals are
  on screen is the same lie in the other direction.

### Recovery is the absence of a mechanism

Criterion 3 asked for recovery without a reload and the trap forbade a new request. Both
are met by **not latching**: the state is derived from the read on every call, so the moment
`ready` flips the same term is answered. There is no retry here, no second store and no
second fetch. A browser test drives the failed → answered transition to pin it.

### Three seams, and one test written the wrong way round

- `searchNotes()` — six new node cases in `search.test.mjs` for the three states, the
  recovery, the read-with-a-failed-write case and the empty answer.
- The `Notes` block — five new cases in `Search.browser.test.mjs`. Two of them drove the
  code (reading, failed); three were green when written and are kept as pins, each saying so
  in its own comment: the recovery, the findings half answering beside a reading log, and
  the read-but-empty log still drawing nothing.
- `useStoreOverrides()` — a new `overrides.browser.test.mjs`, one case, pinning `events` as
  `null` and not `[]` before a read succeeds. It needs no Supabase project: with nothing
  configured the port cannot be created, which is the unread state it asserts about.

**The browser tests were first written in bulk and thrown away.** Five cases were authored
against imagined behaviour and never run; the user stopped the work and the `/tdd` skill
names it — horizontal slicing tests the *shape* of a thing rather than its behaviour. They
were deleted, the `Notes` component was put back to the buggy `notes.length === 0` over the
new value, and the two that could drive code were re-driven one at a time. The first red is
worth quoting, because it is the bug verbatim: the assertion failed against a screen reading
*"3 findings on 3 pages … 2 pages have this name"* and nothing at all where the notes were.

742 tests pass. No count, bar or denominator moves — nothing here reaches the derivation,
and the notes drawn for a log that has loaded are the ones drawn before.

### What this leaves for 105

105's seventh criterion — *a scoped notes block never says "none" about a log it has not
read* — is now a property of the value it will narrow, not something it has to re-establish.
Scoping filters the `answered` branch and the other two are untouched by a scope. The two
kinds of note are still drawn by `NoteKind`, which this ticket did not touch, as its third
trap requires.
