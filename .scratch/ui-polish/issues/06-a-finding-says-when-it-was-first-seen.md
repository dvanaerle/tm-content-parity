# 06 — A finding says when it was first seen

**What to build:** unknown — this is a question and not yet a build. The polish audit asked for
`First seen 12 Aug 2026` on a finding row, in plain text rather than a pair of badges. Nothing in
the interface renders it: there is no such string anywhere, and the only dates on screen are a note
byline, the index build date and the snapshot footer. The **run log holds the fact** — it records
when an id was first seen, whether it is in the current snapshot, and when it was last seen — so the
data exists and the reading does not.

It is filed apart from the polish pass because rendering it is a **feature**, not polish, and it
needs an argument this session did not have.

**Blocked by:** nothing mechanical. It needs a decision before it needs a developer.

**Status:** needs-triage

**Parent:** ../PRD.md

## The question to answer first

**What would an editor do differently because of this date?** If the answer is *nothing*, it should
not be on the row.

The caution that made this `needs-triage` rather than `ready-for-agent`: a date on a row invites age
to be read as priority, and the run log is deliberately careful never to assert that. It "holds no
text, no decision and no relation between two ids", and it **never re-attaches** — an id is
content-addressed and expires when either side's text changes. So *first seen* does not mean *this
difference is three weeks old*. It means *this exact pair of strings was first observed three weeks
ago*, which is a narrower and less intuitive claim. An editor who reads the first meaning into the
second has been misled by the interface.

A reading that may survive that objection: **first seen in the current run** — that is, *this is
new since the last build* — which is a fact about the crawl rather than about the age of a defect,
and it is what somebody triaging a fresh snapshot actually wants.

## If it is taken

- [ ] Decide which reading is offered: the absolute date, *new in this run*, or both.
- [ ] Say in `CONTEXT.md` what the rendered date means, and specifically that it is not the age of
  the difference.
- [ ] Render it as plain text, per ADR 0019 — a date is a quantity and never a badge.
- [ ] Use the date helper from ticket 01. No second formatter.
- [ ] It moves no count, no bar and no denominator, and it is not sortable unless that is decided
  here as well.

## Traps

- **Do not let this become a re-attachment.** The run log cannot say that a new finding is an old
  finding with edited text, and a matcher that guesses carries a dismissal onto text nobody
  dismissed, silently. That refusal is ADR 0004 and this ticket must not erode it.
- **Do not add a second date to the same row.** *Last seen* answers a question nobody asked while
  the finding is in the current snapshot, which is the only time the row is drawn.
