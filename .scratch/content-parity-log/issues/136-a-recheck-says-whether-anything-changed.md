# 136 — A re-check says whether anything changed

Type: task
Status: needs-triage
Blocked by: ui-polish 03, for the live region only — the visible outcome does not wait for it.
Parent: ../map.md

A re-check is the one action in this interface with a cost: it leaves the browser, crawls two live
pages and takes seconds. Today it answers in silence. The button reads *Re-checking…*, and then the
report is swapped in and **nothing says what happened**. A failure is loud — an amber alert saying
*The re-check did not run* — but the two successful outcomes are indistinguishable from each other
and from nothing at all. An editor who re-checks a page they have just fixed cannot tell whether
the fix landed or whether the crawl simply returned what it had.

The UX blueprint asked for four outcomes and this ticket takes three of them: *Re-checking…* (which
exists), **Updated**, and **No changes found**. The failure keeps the words it has.

## The thing to decide first, and it is not cosmetic

**What does "nothing changed" mean?** It cannot mean "the same observation": a re-check writes a new
observation id every time, so that answer is always *changed*. It cannot mean "the report bytes are
equal" either — a timestamp moves.

Use the **finding-set hash** that ticket 118 built and ADR 0013 records. It was made for page-review
staleness and it deliberately ignores visibility, which is exactly the property wanted here: a
re-check that changes nothing an editor could act on should say so even if the vocabulary was
re-triaged between builds. Same hash means *No changes found*; a different hash means *Updated*.

Say it in `CONTEXT.md` under **Re-check**, because it is a claim about what the log knows and not a
label.

## Criteria

- [ ] A successful re-check whose finding-set hash is unchanged says **No changes found**.
- [ ] A successful re-check whose finding-set hash differs says **Updated**, and the footer keeps
      flipping to *Re-check of {date}* as it does today.
- [ ] The failure alert is untouched.
- [ ] All three outcomes reach the **one** live region ui-polish 03 owns. This ticket consumes that
      region; it does not build one, and it must not add a second.
- [ ] The outcome is a **quiet line**, not a badge and not a banner. ADR 0019 spends amber on three
      states and a successful re-check is not one of them.
- [ ] `npm test`.

## Traps

- **Do not announce progress.** ui-polish 03 rules that the live region carries outcomes and never
  *Saving…*. *Re-checking…* stays a button label.
- **Do not compute a second hash.** If `finding-set hash` is not reachable from where the re-check
  resolves, move the call site — do not write a parallel comparison, because two definitions of
  *changed* is precisely what ADR 0013 exists to prevent.
- **Do not make *No changes found* sound like a failure.** It is the answer to a question, and on a
  page an editor has not touched it is the expected one.
- **This moves no count, no bar and no denominator.**

## Where it came from

`.scratch/ux-blueprint/TRIAGE.md`, section 34. The blueprint's fourth outcome, *Updated just now*,
is refused as written — a relative time needs a clock that keeps ticking, and this repo has one date
helper with two formats and no third.
