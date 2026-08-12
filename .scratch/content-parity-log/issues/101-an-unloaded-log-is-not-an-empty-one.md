# 101 — An unloaded log is not an empty one

Type: task
Status: ready-for-agent
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

- [ ] The notes half of a search returns a value that names its state — reading, failed,
      or answered with its matches — rather than a bare array a caller has to guess at.
- [ ] An empty notes block is drawn only when the log has actually been read.
- [ ] A log that could not be read says so, and recovers without a page reload once it
      can be.
- [ ] The findings half keeps answering while the notes half is still reading. A slow log
      does not hold up the half already in memory.
- [ ] The two freshnesses stay on screen as 82 requires: the findings dated by the build,
      the notes read from the log just now.
- [ ] The reading and failed states are assertable in a unit test, so a state nobody can
      reach by hand is still pinned.
- [ ] For a log that has loaded, the notes drawn are identical to today's. This changes
      what is said when none match, not which ones match.
- [ ] No new request, no new store, no re-read of the log. The readiness signal already
      exists beside the events and is threaded through.

## Traps

- **An empty array and an unread log are different things**, and the fix is only real if
  the type says so. Inferring the state from the array's length in the component puts the
  bug back one layer down.
- Do not touch the findings half's loading and error branches. They exist and they are
  correct.
- Telling a page note apart from a dismissal note on screen is **not** this ticket. That
  is 105, which is where the two first appear side by side.
