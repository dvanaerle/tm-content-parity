# 78 — A closed finding leaves a history note

Type: task
Status: resolved 2026-08-18 — built on `ticket-104-search-page-scope`. **Three deviations**,
all recorded in ADR 0004. First, the wording of criterion 1: it asks for an id "last seen in
the observation that first saw this one", and read literally that names a row the run **still
saw** — a row that closed later and on its own. It is one run off from this ticket's opening
sentence, from ADR 0004 and from `CONTEXT.md`, which all say *closed in the same run*, so it
is built to those. Second, the index gains a fourth field. The question *which run ended this
id* had no field, and rebuilding the run sequence from the observations the rows name is
wrong: a run that retires an id without introducing one names itself nowhere, so it drops out
and its closures land on a finding that appeared a run later — which is what an editor fixing
the new site to match production produces. `retiredAt` is recorded instead. It is an
observation id, it holds no text and no decision, it is written on retired rows only, and the
40,825 rows on disk are byte for byte where ticket 77 left them. Third, **the note cannot show
the old text**: no text of a closed finding survives, in the index or in the overrides table,
and by ADR 0004 none may. It shows the reason the editor wrote, which is what trap 2 is about.
Two notes beside them. The wording is English and not "eerder op deze pagina" — ADR 0014
landed after this ticket was written and the stopword guard would refuse the Dutch — so the
shape is *earlier on this page*. And the index holds no closed row today, so the note is
unreachable on the built site until a run retires something; every criterion is pinned on
fixtures.
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

- [x] A finding shows a note when the run log says an id of the same class on the same
      page was last seen in the observation that first saw this one, and that id
      carried a dismissal or a fix claim.
- [~] The note names the decision, the editor and the date. It shows the **reason the editor
      wrote** and not the old text, because no old text survives — see the Status above.
- [x] A finding with no such predecessor shows nothing. Silence is the default.
- [x] Where several ids of one class closed in the same run on one page, the note says
      how many rather than picking one. Picking one is a match.
- [x] The note has no control of any kind, and no count changes when it appears.
      A test pins that the bar, the denominator and the tab badges are identical with
      and without notes.
- [x] The wording is checked against `CONTEXT.md`'s `History note` entry, and it does
      not use the word **Changed** or the word **was**.
- [x] A note is not written into the run log, into the overrides table, or into the
      report. It is derived at render time from two things that already exist. The index
      does gain a field — `retiredAt`, the run that stopped seeing a row — and that is an
      observation and not a note: it holds no text, no decision and no relation between two
      ids, which is the line ADR 0004 draws.

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

## Answer

- `compare/run-log.mjs` records `retiredAt` on a row the run stopped seeing, and
  `closingsOf()` / `closingsFor()` in `web/src/lib/run-log.mjs` read it at build time to
  answer *which ids stopped being seen in the run that first saw this finding*, same store,
  same page, same class. They return a **list of ids** and never a predecessor: the shape is
  where *asserts no identity* is kept, and no text is read, so there is nothing to make it
  more with.
- `derivePageState()` returns `history` **beside** `findings`, derived off the same
  latest-per-key map the decisions come from — so the note reads the derived current state, a
  dismissal an editor took back is not one, and no event list is walked a second way.
- `HistoryNote` in `web/src/components/Annotations.jsx` draws it on both tables, in the
  `<head>` panel's shape: the quietest ink, no control of any kind, and a title saying the
  decision belongs to the other id. `Attribution` writes the action, the editor and the day,
  so the note cannot come to spell a decision differently from the row above it.
- Where several closed at once the note counts them and names none. A pick is a match. The
  count is of the closures that **carry a decision**: a closure nobody decided about has
  nothing to report, so it is not in the count either.
- The visible line carries the framing, and not a `title`: it reads *what an editor decided
  about it*, because the row draws its own decision a few pixels below and a hover cannot be
  what tells the two apart.
- Nothing is written. The note is the index and the override log joined at render time.
