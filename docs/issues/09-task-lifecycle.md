# 09 — Task lifecycle and progress model

Type: grilling
Status: resolved
Resolved: 2026-08-06
Blocked by: 01, 03
Parent: ../map.md

## Question

What are the states a finding moves through, who may move it, and what does
"done" mean for a page, a store and the whole migration?

This is the part that makes it a project log rather than a diff viewer.

## What to settle

- **The state set.** Open, resolved by re-check, resolved by hand, dismissed as a
  false positive, reopened. Is that the right set? Does "in progress" or "claimed"
  earn its place?
- **Precedence.** It is already settled that a manual override beats re-check and
  holds until cleared. Spell out the rest: what happens when re-check says
  resolved but a human said open, and what happens when a dismissed finding
  changes on prod.
- **Dismissal scope.** Does a dismissal apply to this finding on this page, to the
  same text anywhere on the site, or to a rule for a whole class? A repeated
  campaign string dismissed 40 times is a bad experience.
- **Progress definition.** What fills the progress bar? All findings, or only the
  ones above the noise threshold? The prototype counts high and medium confidence
  only, which means dismissing noise does not move the bar. Confirm that.
- **Roll-up.** Per page, per store, per finding class, and one number for the whole
  migration. Which of these does an editor actually need, and which does a manager
  need?
- **Attribution and notes.** "Who ticked this and why" is the audit trail that
  makes a dismissal trustworthy. Is a note mandatory on dismissal?
- **A page-level verdict.** Can an editor mark a whole page reviewed, separately
  from its findings being closed?

## Notes

Depends on ticket 01 for what an override attaches to, and on ticket 03 for what
Supabase can record without accounts.

Resolve with `/grilling` and `/domain-modeling`. The state names are domain
language and belong in the new repo's `CONTEXT.md`.

## Answer

**A finding has no stored state. It has overrides, and an override is either a
claim of fact or a judgement. That split decides every precedence question.**

### The stale premise in the ticket

The ticket asks to confirm that the progress bar counts high and medium
confidence only. **The confidence axis no longer exists** — ticket 02 removed it,
and `class` is the only axis, with a shown or hidden default on each of the 18
classes. The question is shown against hidden, not high against low.

### Why a stored state is needed at all

Ticket 01 argued that resolution needs no identity: correct the page, re-check
finds no difference, the finding is gone. That holds only for a person who can
run re-check. **Re-check is local; the hosted build hides the button.** An editor
on the webhost reads a frozen snapshot, so a difference they really corrected
still looks open until somebody rebuilds and uploads. An editor who corrects six
items and sees the count stay at six stops trusting the log.

So there is one manual action, and it is a **claim**, not a state machine. No
`in progress`: ceremony on a one-line copy correction. No `reopened`: nothing
reopens, because a finding is in the snapshot or it is not.

### Four override kinds, one table

Ticket 03 makes the table append-only by leaving out the UPDATE and DELETE
policies, so an override is never edited and never removed. A reversal is an
append.

| scope | key | actions |
| --- | --- | --- |
| `finding` | ticket 01's finding id | `fixed`, `dismissed`, `cleared` |
| `page-class` | ticket 01's mute key | `muted`, `cleared` |
| `page` | store + page | `reviewed`, `cleared` |

The latest event per `(scope, key)` wins —
`DISTINCT ON (scope, key) ORDER BY created_at DESC`, the read shape ticket 03
recommends. `fixed` and `dismissed` cannot both apply to one key, so latest-wins
needs no merge rule, and one `cleared` action replaces four `un-` verbs. The
history under the derived state answers "who dismissed this, and who cleared it".

### Precedence: a judgement beats re-check, a claim does not

This **amends a charting decision**. "A manual checkbox overrides re-check and
wins until cleared" was written when there was one checkbox. With the claim and
judgement split:

- **`dismissed` and `muted` win.** Re-check cannot evaluate acceptability.
- **`fixed` loses.** Re-check is the arbiter of fact. A snapshot that still gives
  the id makes the finding **contradicted** — open again, shown as
  *claimed fixed, still differs*, attributed to the person who claimed it.

Rule (a), the human always winning, is how the log fills with untruth: the one
case where somebody corrected the wrong store view is the exact case where their
tick hides the defect for good. `contradicted` is derived, never stored, so it
costs nothing and it is the signal that a correction did not land.

The other three conflicts dissolve without a rule. A dismissed finding whose
production text changes has a different id, so the dismissal does not apply and
the finding is new and open — ticket 01 already gives this. A finding re-check
no longer gives is gone, whatever anybody ticked.

### Dismissal scope: page-scoped, with bulk as a UI action

Ticket 01's keys stand. The ticket's worry — one campaign string dismissed 40
times — is mostly answered already, because `campaign` and `price` are hidden by
default. What is left is a real repeated string in a **shown** class, such as one
footer line that differs on 30 pages. The interface offers
"dismiss on all 30 pages", and **writes 30 events**. A third, site-wide key is
refused: it would carry its own lifetime rules and re-open the risk ticket 01
closed — a dismissal quietly absorbing a later regression — this time site-wide.

### A note is mandatory on `dismissed` only

A dismissal is the one action that asserts "this difference is acceptable". It is
the claim a reader challenges later, and the one that survives a re-crawl.
`fixed` proves itself at the next re-check, and `muted` is legible from its key.
A note demanded on all three trains editors to type `.` and destroys the signal
where it was needed.

### The progress bar

**Denominator: findings in shown classes, on this snapshot.
Numerator: absent + `dismissed` + `fixed` and not contradicted.**

- Hidden classes (`restructured`, `price`, `campaign`, `redirect`, `extra-link`,
  `image-added`, `image-campaign`) are in neither. They are noise by decision,
  and a bar that counts them never reaches zero, which equals no bar.
- **A mute removes findings from the denominator; a dismissal moves them to the
  numerator.** A mute says "not a defect here"; a dismissal says "I read this one
  and accepted it".
- **`fixed` counts as closed until it is contradicted.** This is what makes the
  button worth pressing on a frozen snapshot, where nothing can contradict it.
- **Always show the absolute counts next to the percentage.** The denominator
  moves at each crawl, so the bar is not monotonic. `47 of 61 closed` survives a
  moving denominator; `77%` reads as a regression when the dataset only got
  larger.

### Page review: it goes stale, it does not expire

An editor can mark a whole page **reviewed** while findings stay open. It answers
a different question — has a human looked at this page at all, including the
differences the tool cannot see: layout, tone, an image that matches by basename
but shows something else.

Store it against the crawl identifier of the snapshot it was made on, and **never
clear it automatically**. Compare the page's shown-class finding-set hash then
and now to derive freshness. "Nobody reviewed this page" and "somebody reviewed
it, then it changed" are different facts, and the second is the one a manager
needs. A page also goes stale when its finding set **shrinks**, so an editor
un-freshens their own review by correcting things: the interface must say
**"changed since review"**, never "needs review".

### Roll-up: three levels, two bars

- **Findings closed** — page, store, migration. Summed over **findings**, never
  over pages, or a page with one casing nit weighs as much as a page with forty.
- **Fresh page reviews** — store and migration only. The manager's number.
- **Per class is a breakdown, not a bar.** Its reader is whoever maintains the
  rules: a class spiking across pages means a rule misfires, not editor backlog.
  A filter on the store view.
- **Axis A only.** Axis B has its own tab and its own tasks, and ticket 11 has
  not defined it. One bar over both makes "done" undefinable.

### Pages that exist on only one side stay out of the bar

Measured: **42 of 181 NL pages give 404 on production and 200 on the new site**
(the new-only `*/onderdelen` tree), and **34 of 451 store-page pairs give 404 on
the new site**. Neither can make a finding, because ticket 07 gates the compare
stage on `status === 200` on both sides.

They are not content differences, they are **scope decisions** — somebody must
rule that `*/onderdelen` is intended, and that each legacy-only page is retired
or rebuilt. That is one judgement per page, not editor work. 76 undecidable rows
in a bar that must reach zero poison it from the first day. They get a separate
migration checklist with its own count, on its own tab. Graduated to ticket 20.

### Words retired

**"Resolved"**, because it hid the claim-against-judgement split that the
precedence rule turns on. **"Reopened"**, because nothing reopens.

The glossary is written into `tm-content-parity/CONTEXT.md`.

## Covered by the spec in ticket 29

2026-08-06. [29 — Spec: make the log actionable](29-actionable-log.md) is the build
instruction. It carries the user stories, the seam, the schema and the testing
decisions for the override log and the progress bar. Read 29 before starting; this ticket keeps the reasoning.
