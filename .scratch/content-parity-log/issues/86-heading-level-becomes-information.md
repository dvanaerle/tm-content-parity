# 86 — Heading level becomes information

Type: task
Status: resolved 2026-08-13 — built on branch `the-class-pills-survive-a-search`. The
context-marker collapse is 79's to wire; the predicate it reads landed here. See the answer.
Blocked by: ~~75, 118~~ — both landed
Parent: ../map.md
Spec: [119](119-spec-the-same-words-divided-differently.md)

**What to build:** a demoted heading stops being counted as migration work and becomes a
difference an editor can read. `h2 → h3` on a migrated page is a heading-hierarchy
question, and heading hierarchy is SEO work that the log has always said is somebody
else's phase.

## Why it is its own ticket

[75](75-class-visibility-replaces-shown.md) is deliberately count-neutral: every shown
class becomes `work`, so the denominator does not move on the day the enum lands. This
ticket is the first move that **does** move it, and it is separated for exactly that
reason — ticket 33 found that one number hiding two opposite movements is how a
measurement stops meaning anything.

`heading-level` carried **1,215 shown findings, 5.3% of shown**, in the measurement of
2026-08-10: 469 on `nl`, 442 on `be`, 143 on `de`, 59 on `fr`, 57 on `be_fr`, 45 on `uk`.
**That measurement is over 448 reports and the disk now holds 816**, so those numbers are
history. Ticket 76 was to have restated them and closed without doing so — the pre-64
corpus it needed is gone. **This ticket measures its own before-value**: count
`heading-level` shown findings over `data/reports/` as it stands, per store and as a
share of shown, and record it here before the enum change lands. That number is the one
to move.

## What must stay true

- **The class does not go.** It becomes `information`: rendered, not counted. Deleting it
  would throw away a real difference nobody has decided about.
- **`detail` stays in the finding id.** The `h2 → h3` string joins the id because without
  it two different demotions of the same words are one finding. Ticket 33 decided that and
  this ticket does not touch it.
- **The bar is not re-based.** Ticket 29 fixed it to the current snapshot, so the
  denominator simply becomes smaller and the percentage jumps. Absolute counts beside the
  percentage are what stop that reading as progress.

## Acceptance criteria

- [x] `heading-level` carries `visibility: 'information'`.
- [x] The per-store totals are recorded before and after, in this ticket's answer,
      **and nothing else moves.** Any other class that changes count is a defect in this
      diff.
- [x] The percentage jump is stated in the answer per store, so the next reader of the
      dashboard is not surprised by it.
- [x] A `heading-level` difference is still visible to an editor, still carries its
      `detail`, and no longer carries an override control that implies it is work.
- [x] Existing dismissals ~~and mutes~~ on `heading-level` findings are left alone. The
      events are append-only, they stay on disk, and the answer says what the interface does
      with a dismissal on a class that is no longer counted. — **the mutes half is struck
      2026-08-13, ADR 0011**; there are no live mutes to leave alone, and the eleven
      historical rows are already left alone by the port.
- [x] The answer says where heading hierarchy is handled instead, or states plainly that
      it is not handled anywhere yet. An unowned hand-off is worse than a stated gap.
- [~] **The information-row behaviour is driven by `visibility` and not by this class.** A row
      whose class is `information` collapses into a context marker, carries no override
      control, and forms no class group in *Verschillen* — because it is a finding you can link
      to and cannot decide. Written generically, this is the machinery
      [116](116-a-merged-paragraph-is-one-row.md) inherits for free; written as a special case
      for `heading-level`, it has to be built twice. Added 2026-08-13.

## Traps

- **This is a scope decision dressed as a one-line change.** The line is one word in the
  vocabulary. The consequence is that 1,215 differences leave the work everybody is
  measured on, and that belongs in the answer in words, not only in a table.
- **`tag-changed` is the neighbouring class** and it is hidden today. It also carries a
  `detail`. Check whether the argument here applies to it before somebody notices the
  inconsistency later.
- ~~A mute on `heading-level` for a page took findings out of the denominator. After this
  ticket the class is out of the denominator anyway, so the mute now records a judgement
  with no effect. That is harmless and it should not be silently deleted.~~
  — **history from 2026-08-13, ADR 0011: the mute is withdrawn and this trap is spent.**
  It called its own ending: a judgement with no effect is a judgement not worth having, and
  the ADR reached the same conclusion about every mute rather than only these. *It should
  not be silently deleted* is what ticket 115 acted on — the eleven `muted` rows stay on
  disk, and the withdrawal is written down rather than performed quietly.
  **This ticket is not blocked by that sequence and its build must still land in its own
  commit.** Two denominator movements in one number is the thing it exists to avoid. ADR
  0011 expected one of its own — revoking the last live mute should have returned its
  hidden findings to open — and ticket 111 measured **no movement**, because the mute had
  drifted off the section it names and was hiding nothing. So this ticket's number starts
  from a denominator nothing has moved, which is the cleanest case it could have asked for.

## Comments

**2026-08-13 — the before-value this ticket asked for, measured.**

This ticket required its own before-value because the 1,215 / 5.3% figure was taken over 448
reports. Measured over `data/reports/` as it stands (816 files, 722 `comparable: true`):

| store | `heading-level` | pages with ≥1 | shown findings | shown after |
|---|---|---|---|---|
| nl | 573 | 74 | 4784 | 4211 |
| be | 542 | 70 | 4144 | 3602 |
| uk | 498 | 65 | 4647 | 4149 |
| de | 450 | 62 | 4600 | 4150 |
| fr | 392 | 60 | 5123 | 4731 |
| be_fr | 391 | 61 | 5164 | 4773 |
| **all six** | **2846** | **392 / 722** | **28462** | **25616** |

**2,846 findings = exactly 10.00% of all shown findings**, on 392 of 722 comparable pages,
median 5.5 per page carrying it, max 26. Every finding has a non-null `detail`; `occurrences`
is 1 throughout. 19 distinct transitions, and **`h4 → h3` alone is 2,012 (70.7%)** — FAQ
accordion items in every store, i.e. one component levelling its own headings. The next
largest are `p → h3` 274, `h2 → li` 145 (gallery captions), `h2 → h3` 134, `h3 → h2` 94.
`h2 → li`, `td → h3` and `h3 → a` are words that were never really headings.

**Nobody has ever decided one of these.** Of 682 live override events, **zero** sit on a
`heading-level` finding and **zero** on a `tag-changed` finding — checked page-scoped and
page-agnostically. The class has been shown for months and skipped. That is the evidence this
ticket was waiting for, and it is stronger than the volume number.

Acceptance criterion five is therefore vacuous and should be answered as such: there are no
dismissals or mutes on `heading-level` to leave alone.

**Two decisions from the grilling of 2026-08-13, recorded here so they are not re-litigated:**

- **The class keeps its name.** Merging it into `tag-changed` was designed and refused. The
  detachment cost was zero either way (no overrides exist on either class), so there was
  nothing to buy, and `detail` alone would leave a reader unable to say *which* differences are
  heading shape. This ticket's own words — *"the class does not go"* — stand. The trap about
  `tag-changed` is answered: the argument does apply to it, and it is already hidden, so
  nothing needs doing.
- **An `h1` carve-out was designed and refused.** ADR 0005 allows one visibility per class, so
  it would need a second class; measured, it would fire on 30 findings of which 11 are `p → h1`
  (the new site *adding* a page title, an improvement) and would miss the 4 pages that gain a
  second `h1` and `uk/(uk)privacy-policy`, which loses its only `h1` while the text also
  changes. Acceptance criterion six — *say where heading hierarchy is handled instead* — is
  answered by **[117](117-the-page-keeps-one-h1.md)**, which carries the 14 affected pages and
  is deliberately `needs-triage`, because it may be right to hand that list to whoever owns SEO
  rather than build a permanent check.

**Now blocked by [118](118-the-finding-set-hash-ignores-visibility.md).** `findingSetHash()`
filters on `shown`, so flipping this class would print "changed since review" on all 392 pages
carrying one, on a day when no page changed. 118 removes that filter first.
— **unblocked: 75 and 118 both landed.**

---

## Answer — built 2026-08-13

`heading-level` carries `visibility: 'information'`. One word in `compare/vocabulary.mjs`,
and 2,846 differences left the number everybody is measured on.

### The denominator, before and after

Measured over `data/reports/` as it stands — 816 files, 722 `comparable: true` — by
recomputing `summarise()` over the findings on disk with the new vocabulary. **No report was
rewritten to take this measurement**, so nothing but the one word could have moved it.

| store | work before | work after | `heading-level` | share of the store's work | the bar reads |
|---|---|---|---|---|---|
| nl | 4784 | 4211 | 573 | 11.98% | **× 1.136** |
| be | 4144 | 3602 | 542 | 13.08% | **× 1.151** |
| uk | 4647 | 4149 | 498 | 10.72% | **× 1.120** |
| de | 4600 | 4150 | 450 | 9.78% | **× 1.108** |
| fr | 5123 | 4731 | 392 | 7.65% | **× 1.083** |
| be_fr | 5164 | 4773 | 391 | 7.57% | **× 1.082** |
| **all six** | **28462** | **25616** | **2846** | **10.00%** | **× 1.111** |

The before-column is the figure this ticket measured for itself, and it landed on it exactly.
`information` went the other way by the same amount, 11,643 → 14,489, which is the sentence
*"it is not deleted"* in numbers.

**Nothing else moved**, and it is reproducible rather than asserted:

    node crawl/probes/probe-86-heading-level-denominator.mjs

The probe prints the table above and **exits non-zero** if any class tally moves. For all 722
comparable pages, every entry of `summary.byClass` and `summary.total` recomputes identical to
what is on disk — 0 pages of drift, 0 classes whose corpus tally changed by one finding. That
is not luck, it is the shape of the change: visibility is a term of no finding field and of no
id, so only the three tallies named after the visibilities can move — which is also why
`data/reports/` did not have to be rebuilt to measure this, and was not.

One thing the probe reports and deliberately does **not** fail on: 686 pages carry a stored
`findingSetHash` that no longer matches. That is **ticket 118's landing** — the reports on disk
were written by a build that still filtered on `shown`, and nothing has re-crawled since ADR
0013 removed the filter. `probe-118-review-staleness.mjs` owns that number. This ticket cannot
move that hash at all, because `findingSetHash()` no longer reads `FINDING_CLASSES`;
`contract.test.mjs` pins it by re-importing the module with every class flipped at once.

### The percentage jump, stated

The jump is given above as a factor rather than as two percentages, and that is the exact
statement, not a hedge: **the numerator cannot move.** Zero of the 682 live override events
sit on a `heading-level` finding, so no closed count changes and the whole movement is the
denominator shrinking. A `nl` bar reading 40% before reads **45.4%** after, on a day when not
one difference was corrected. **Read the absolute counts beside it** — ticket 29 fixed the bar
to the current snapshot and ticket 09 puts the numbers next to every percentage for exactly
this morning.

### What an editor sees

A `heading-level` difference is still a row of the content view, in document order, with its
class pill and its finding id, so a link can still be sent to it. What it has lost is the
override control: `CONTEXT.md` says an `information` finding is *a finding you can link to and
cannot decide*, and a dismissal saying "these two exact strings are acceptable" answers a
question nobody is asking. Its pill is neutral now rather than a severity tone, which
`toneOf()` already derived from the visibility — and the dead `heading-level` entry in that
tone table was removed, because a tone that cannot be reached is a tone the next reader would
trust.

**Where the `detail` is, said exactly**, because the first draft of this answer said it
loosely and a review caught it. The finding carries `detail` in the data and in its id, and
that is untouched. On screen the content view has never printed the `detail` string: it prints
each side's **tag** beside its words, so `h4 → h3` is read as `h4` on the left and `h3` on the
right. That is `Annotations.jsx`'s own decision and it predates this ticket — *"the content
view needs no such thing: it prints the tag of each unit next to the words"*. What did change
is that the two surfaces which printed the string — a Links/Afbeeldingen row and a *Verschillen*
repeat — no longer show this class at all, for the reason below. So the difference is still
legible, and the literal arrow is not; if that turns out to be the wrong trade, the fix is one
`<Detail>` in the content-view cell and it is not blocked by anything here.

Two consequences worth naming because nobody asked for them by name:

- **It leaves *Verschillen* entirely**, and it leaves search with it. `loadSummaries()` keeps
  the work classes only, so the class forms no group — not even the empty one that says *the
  rule ran and found none*, because an empty group is owed to work and to nothing else.
- **It stays out from behind *Ruis tonen*.** `information` is not noise. The 2,846 findings are
  drawn by default and counted nowhere, which is the state ADR 0005 designed the middle value
  for.

### Acceptance criterion five is vacuous, as predicted

There are no dismissals on `heading-level` to leave alone, and there are no mutes to leave
alone either — the mute is withdrawn (ADR 0011) and its eleven historical rows are already
left where they are. Nothing detached, because nothing was attached. Had anything been
attached it would have survived regardless: `findingId()` never took visibility as a term, and
`contract.test.mjs` pins that across a flip of every class at once.

### Where heading hierarchy is handled instead

**Nowhere yet, and that is a stated gap and not a hand-off.** No ticket owns heading hierarchy
as a check. [117](117-the-page-keeps-one-h1.md) carries the 14 pages whose `h1` moved and is
deliberately `needs-triage`, because it may be right to hand that list to whoever owns SEO
rather than build a permanent check. The 2,846 differences remain readable on the pages they
sit on, so the evidence is not lost — only the claim that somebody is behind on it.

`h4 → h3` alone is 2,012 of the 2,846: FAQ accordion items in every store, one component
levelling its own headings. Whoever picks up heading hierarchy should start there, because
it is one fix and not two thousand.

### Criterion eight, half built — and this is the one thing to read before closing

The behaviour is driven by `visibility` and by no class name. The rule is `canDecide()` in
`web/src/lib/classes.mjs` — beside `toneOf()`, which is the interface's other rule derived from
the visibility — and `prepareRows()` applies it to every row as `ContentRow.decidable`, beside
the `equal` field ticket 68 put there, which is where ticket 48 requires it. It went to
`classes.mjs` rather than to `view.mjs` because two of its three callers are the Links and
Afbeeldingen tabs, and those have no rows at all. It reads the visibility, so `regrouped`
inherits it with no edit — which was the point of writing it generically. Two of the three
behaviours are wired to it:

- **No override control** — `Ledger.jsx` gates the one closure all three tabs share, and the
  content view gates its wrapper on `row.decidable`. Both reviewers read that as one rule
  stated twice; it is kept, and the reason is written at the call site. The closure is the
  behavioural gate, because Links and Afbeeldingen share it and have no rows; the row field
  gates the `mt-1` wrapper, which the cell had to decide about anyway and previously decided
  with `row.finding`. Without it an information row draws an empty div, and reading the field
  rather than calling the rule again is what stops 79's marker and this cell disagreeing about
  which rows hold a decision.
- **No class group in *Verschillen*** — already generic. `groupRepeatsByClass()` reads
  `isWork(cls) || byClass.has(cls)`, so it needed no edit at all; there is now a test pinning
  that it draws no empty `heading-level` group.
- **Collapses into a context marker** — **the context marker does not exist in the code.**
  [79](79-the-content-view-opens-on-the-differences.md) owns it and is still
  `ready-for-agent`; [48](48-open-and-done-board.md) specifies that its predicate is *one
  tested rule in `web/src/lib/view.mjs`*. So the predicate is what landed here, in that exact
  place, and 79 wires the marker to it: `collapse = equal || closed || !decidable`. The marker
  itself was **not** built — it is 79's scope, and taking it would have put two features in
  the commit this ticket insists stands alone.

  A question for 79 and 48, surfaced by writing this: 48's predicate is *"no open work"*, and
  whether an `information` finding is *open* is a definition neither ticket settled.
  `decidable` answers it for them — it is not open work, because it is not work — but 48
  should say so in its own words rather than inherit it silently. 48 also names
  `heading-level` as its example of a row that agrees about every word and must **not**
  collapse; that example is now on the other side of its own rule, and `CONTEXT.md`'s
  *Context marker* entry has been corrected to `copy`/`casing`.

### Also recorded

- `CONTEXT.md` — **Decidable** named under *Visibility*, and the *Context marker* entry
  corrected as above.
- ADR 0005 — the consequence bullet that predicted this move now carries what it cost: the
  re-measured 10.00%, the zero detachments, and that the hash had to move first.
- ADR 0006 — its table still lists `heading-level` at 1,215 / 5.3% among the shown classes, and
  the row is **left standing** with a note. Its decision is unaffected and in fact strengthened:
  taking this class out of `work` makes the three one-sided classes a larger share of the work,
  not a smaller one. The row is also the evidence for the other thing that ADR relies on — that
  a row with two equal sides deserves a position in the view — which is what this ticket kept
  when it refused to delete the class.
- [48](48-open-and-done-board.md) — its third acceptance criterion named `heading-level` as a
  row that must **not** collapse, and that example is now on the other side of its own rule.
  The class is struck from it, `tag-changed` is left as the example that still holds, and a new
  criterion asks 48 to say **in words** whether an `information` finding is *open* — its
  predicate is *"no open work"* and it never defined the case, because when it was written every
  shown class was work. This ticket answered it in code and should not be the only place it is
  answered.
- `crawl/probes/probe-86-heading-level-denominator.mjs` — the measurement above, committed, so
  criterion 2 is repeatable and not a claim.
- The trap about `tag-changed` was already answered in the grilling of 2026-08-13: the
  argument does apply to it, and it is already `diagnostic`, so nothing needed doing. It keeps
  its override control, because `canDecide()` gates `information` and nothing wider — a
  diagnostic row is what a rule saw, and that is not this ticket's subject.
