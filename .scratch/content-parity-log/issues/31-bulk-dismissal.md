# 31 — One reason, many findings

Type: build
Status: ready-for-agent
Blocked by: 30, 76, 81, 88
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
and ticket 76 answers the third.

**1. How the editor finds the other pages.** Answered:
[81](81-the-repeat-is-the-queue.md) builds the **repeat** — every finding in one store
with the same class, the same two texts and the same detail. That is the grouping key
this ticket asked for. It is the finding id with the page removed, and it stays within
one store, because the stores translate the text.

**2. Where the control lives.** Answered: on a repeat row in 81's list. The page ledger
knows one page and cannot host this. No new view is needed, because 81 built the view
that already holds many.

**3. Whether a mute is the better answer.** [76](76-the-coverage-curve-without-the-promo-banner.md)
measures it. The measurement of 2026-08-10 found 8,229 repeats in 22,990 shown
findings, 116 of them covering a quarter of the corpus — but the whole head of that
distribution was the promo banner, which ticket 64 has since excluded. **Read 76's
answer before building. It may still shrink this ticket to nothing.**

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

- [ ] The seam takes a target page per event, so an event can be aimed at a page that is
      not the one on screen. `useOverrides()` and `append()` both change, and the change
      is covered by a test that does not touch the network.
- [ ] Selecting a repeat and dismissing it writes one event per finding id, each with
      the same note and the same editor.
- [ ] The table gains no scope and no action. A test asserts the written events use the
      existing `finding` scope and `dismissed` action only.
- [ ] A failure part-way through reports how many were written and which page failed.
      The interface does not claim success.
- [ ] The interface states, before the press, how many findings the decision covers and
      that it covers those findings only.
- [ ] The bar and the denominator move by exactly the number of findings dismissed, and
      by nothing else.
- [ ] A mute is still available and still described honestly. If 76's answer says a mute
      is the better tool for most repeats, the interface says so at the point of choice.

### Bulk mute

- [ ] Selecting N pages, a class and a section writes N mute events, one per page, each
      with the same note and the same editor. The same seam serves both actions.
- [ ] The count of findings covered is stated before the press, as
      [88](88-the-mute-says-what-it-hides.md) requires for a single mute. A bulk mute is
      the press that most needs it.
- [ ] A note is mandatory, per 88.
- [ ] The two actions are not offered as one control. A dismissal expires and a mute does
      not, and an editor choosing between them is choosing between those two behaviours.
- [ ] Bulk mute is **not** offered as the answer for campaign copy. All 1,645 banner
      findings carry a null anchor heading, so it would mute the null section on about 330
      pages and take unrelated findings with it.
      [90](90-a-campaign-is-a-class-not-a-commit.md) owns that.

## Traps

- **Ticket 30 is `ready-for-human` and it is listed as a blocker.** Supabase already
  holds 45 events by ticket 65's count, so 30 may be effectively done and unmarked.
  Check its state before treating the edge as live, and record what you found.
- **A repeat can be large.** The old measurement's largest single tuple was 329
  findings. Thirty-nine inserts is not the worst case; several hundred is.
- **This is not a mute in disguise.** A mute is a judgement about a class on a page and
  it persists. A bulk dismissal is N judgements about exact strings and they expire.
  Offering one where the editor wanted the other is the failure this ticket can produce.

## Origin

Ticket 09 named the rule. Spec 29 carried the story. The code review of the spec-29
work found it unbuilt and found the seam that prevents it. The grilling session of
2026-08-10 supplied the grouping key.
