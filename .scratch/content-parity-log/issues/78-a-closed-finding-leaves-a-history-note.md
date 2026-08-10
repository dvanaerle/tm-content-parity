# 78 — A closed finding leaves a history note

Type: task
Status: ready-for-agent
Blocked by: 77
Parent: ../map.md

**What to build:** production edits a line that an editor dismissed last month. The
old finding closes and a new one appears, and the new one carries a line saying that a
finding of the same class closed on this page in this run, and what was decided about
it. The editor gets the context without the tool claiming the two are the same finding.

## The decision this ticket carries

This is what is left of the idea the proposal called **Changed**, and the word is
refused. The proposal wanted a label chosen by how strong the historical relation
looked. That is a matcher with a threshold, and
[ADR 0004](../../../docs/adr/0004-history-is-a-run-log-that-never-re-attaches.md)
refuses it.

A **history note** is a display-only difference. It has no id, no override and no
place in a bar, and it asserts no identity. It reports what the run log saw: an id of
this class on this page stopped being seen in the run that first saw this one.

## What must stay true

- **It is never offered as a decision to accept.** A human matcher with an accept
  button is the same matcher with a slower threshold. No button copies the old note
  onto the new finding.
- **It is framed so it cannot be read as actionable.** The `<head>` panel already
  established how a display-only difference looks; follow it.
- **It never claims the two findings are the same.** The wording says what closed, not
  what changed. "Changed" and "was" are both wrong; "eerder op deze pagina" is the
  shape.
- **No count moves.** Not the bar, not the denominator, not a tab badge.

## Acceptance criteria

- [ ] A finding shows a note when the run log says an id of the same class on the same
      page was last seen in the observation that first saw this one, and that id
      carried a dismissal or a fix claim.
- [ ] The note names the decision, the editor and the date, and shows the old text.
- [ ] A finding with no such predecessor shows nothing. Silence is the default.
- [ ] Where several ids of one class closed in the same run on one page, the note says
      how many rather than picking one. Picking one is a match.
- [ ] The note has no control of any kind, and no count changes when it appears.
      A test pins that the bar, the denominator and the tab badges are identical with
      and without notes.
- [ ] The wording is checked against `CONTEXT.md`'s `History note` entry, and it does
      not use the word **Changed** or the word **was**.
- [ ] A note is not written into the run log, into the overrides table, or into the
      report. It is derived at render time from two things that already exist.

## Traps

- **The most likely defect is a helpful one.** Somebody will want a "hergebruik deze
  reden" button because it saves typing. It buries a real defect under a decision
  nobody made about the text in front of them. If the want returns, it is a new
  decision in ADR 0004 and not a small feature.
- **A dismissal note is free text an editor wrote.** It may name the old wording. That
  is fine and it is the point, but it means the note can contradict the current text
  on screen, and the framing has to survive that.
- The overrides table is append-only and the note reads the derived current state, not
  the raw events. Do not walk the event list a second way here.
