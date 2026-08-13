# 75 — Class visibility replaces the shown boolean

Type: task
Status: resolved 2026-08-13 — built and measured; every criterion met and the denominator
moved on no store. The answer is under `## Comments` below rather than `## Answer`.
(Recorded as `done` until 2026-08-13; that word is not in the vocabulary
`docs/agents/triage-labels.md` sets, and a frontier scan reads it as neither open nor
resolved.)
Blocked by: None — can start immediately. **The sequencing question is settled: 114 landed
first, 2026-08-13.** So the second branch of the note below is the live one — the mute
criterion is already void, it is struck in place, and the count-neutrality this ticket
checks is against the dismissal alone. The note read: sequence it against 114, because its
criterion *"A mute still takes findings out of the denominator"* is a count-neutrality check
that ADR 0011 makes false; if 75 lands **before** 114 the criterion holds as written and
114 removes it; if **after**, the criterion is already void. Either order is fine; building
it without knowing which is not. Ticket 86 is blocked by this one and moves the denominator on purpose.
Parent: ../map.md

**What to build:** a class stops being shown or hidden and starts saying what it is
for. Three words: **work**, **information**, **diagnostic**. An editor can then be
shown a difference that is worth reading without it being counted as migration work,
and a rule author's diagnostic stops sitting in the same bucket as an editor's
information.

Every rule is in
[ADR 0005](../../../docs/adr/0005-class-visibility-is-one-enum.md). **Read it first.**

## The decision this ticket carries

It is **one field replacing one field**, and not a field beside it. Ticket 02 removed
a confidence axis with one sentence — the class is the only axis, ~~and it is also the
mute key~~ — and a second boolean beside an enum would put that axis back. A class that
is hidden and also work has no meaning. — **the mute clause is struck 2026-08-13, ADR
0011.** The class keys nothing now, and *one field replacing one field* does not depend on
it: the argument is that two switches on one class can disagree, which is true of the
visibility enum alone.

`shown: false` says two different things today and nothing says which. `text-added` is
hidden because content the new site invented is usually not a defect, and an editor
may want to read it. `redirect` is hidden because it tells the author of a rule what
the rule saw. The first is information. The second is a diagnostic.

## The migration must not move the bar

Every class that is `shown: true` today becomes `work`. Twelve of the 21 classes.
Each of the nine hidden classes is triaged once, in this ticket, in git, into
`information` or `diagnostic`.

So the denominator is unchanged on the day this lands, and the diff reads as a rename
plus a split of the false side. Any class whose move would change a count belongs in
its own ticket with its own measurement — [86](86-heading-level-becomes-information.md)
is the first of those.

## Acceptance criteria

- [x] `compare/vocabulary.mjs` carries one `visibility` field on every class, valued
      `work`, `information` or `diagnostic`. `shown` is gone, not deprecated.
- [x] All twelve currently shown classes are `work`. The nine hidden ones are split,
      and the answer gives the reason for each of the nine in one line.
- [x] **No class carries "excluded from comparison".** An excluded region leaves at
      extraction by ADR 0003, so it never reaches a class. A fourth value would claim
      the log can see inside one.
- [x] The denominator is unchanged. Re-run the comparison and record the per-store
      totals beside the previous ones: expect **no movement at all**, on any store.
- [x] `work` counts. `information` renders and does not count. `diagnostic` stays
      behind the noise toggle. Each of the three is checked on a page that has one.
- [x] ~~A mute still takes findings out of the denominator, and~~ a dismissal still moves
      them into the numerator. — **the mute half is struck 2026-08-13, ADR 0011.** The
      count-neutrality this criterion tests is now against the dismissal alone; nothing
      leaves the denominator, so there is no subtraction left to preserve.
- [x] The contract pins are updated: the class count stays 21, and the pinned set that
      used to be "the hidden classes" becomes the three visibility groups.
- [x] The noise toggle's label still tells the truth about what it reveals. It now
      reveals two different kinds of thing.
- [x] `CONTEXT.md`'s `Visibility` entry needs no edit. It was written for this ticket;
      check it still describes what shipped.

## Traps

- **This is not a wide refactor.** `shown` is read in about ten places — the
  vocabulary, the compare summary, the contract typedef and its pins, the state
  derivation, the filter module, and four components. One commit stays green. Do not
  build an expand-and-contract sequence for it.
- **`shown` also appears in `ReportSummary` as a count**, not as a flag. That field is
  a number of findings in counted classes, and renaming the class field does not
  rename it. Decide deliberately whether the count keeps its name and say which.
- A test pins the sorted list of hidden classes. It is the regression gate for this
  ticket, so rewrite it into the new shape rather than deleting it.

## Comments

**2026-08-13 — built. The denominator did not move, on any store, by any measure.**

`shown` is gone from `compare/vocabulary.mjs`; every class carries one `visibility`, and
`VISIBILITIES` is the closed list of three. One commit, green throughout, no
expand-and-contract.

### The migration, measured

Re-ran `node compare/30-compare.mjs` over the same 816 extracts (722 comparable) and
compared every report against the run before it, file by file:

| store | work (was `shown`) | information | diagnostic | total |
|---|---|---|---|---|
| nl | 4784 → **4784** | 2227 | 437 | 7448 |
| be | 4144 → **4144** | 2106 | 393 | 6643 |
| uk | 4647 → **4647** | 2153 | 438 | 7238 |
| de | 4600 → **4600** | 1788 | 446 | 6834 |
| fr | 5123 → **5123** | 1679 | 448 | 7250 |
| be_fr | 5164 → **5164** | 1690 | 458 | 7312 |
| **all six** | **28462 → 28462** | **11643** | **2620** | **42744** |

**No movement at all**, as required. Stronger than the totals: over all 816 reports,
**zero** `findingSetHash` values changed and **zero** `byClass` tallies changed. `work` is
exactly the twelve classes that were `shown: true`, so the hash filter reads the same set
under a new name — the argument for removing that filter is [118](118-the-finding-set-hash-ignores-visibility.md)'s
and was left alone here.

### The triage of the hidden side, one line each

The ticket says nine hidden classes; there are **ten**. Ticket 54 added
`no-declared-alternate` after this ticket was written, which is also why the pinned class
count is **22** and not the 21 the criterion names. Both numbers are the ticket being
older than the vocabulary, not a class appearing unexplained.

**`information` (5)** — a difference an editor may want to read:

- `text-added` — content the new site invented; ADR 0005 argues from this one.
- `extra-link` — the `added` side of the direction rule, on links.
- `image-added` — the `added` side of the direction rule, on images.
- `restructured` — it is what tells *moved* from *gone* (ADR 0006), which is a thing an
  editor reads and not a report about the rule. Triaged deliberately, as ADR 0005 asked.
- `price` — a number that differs is a real content difference and nobody's migration work.

**`diagnostic` (5)** — it tells the author of a rule what the rule saw:

- `redirect` — the target answers; ADR 0005 argues from this one.
- `tag-changed` — the same words in a different element, neither a heading: nothing moved
  for a reader, and what it reports is what the alignment saw.
- `campaign` — the finding exists because a promotional pattern matched on both sides.
- `image-campaign` — the same rule on images, and it follows `campaign` for that reason.
- `no-declared-alternate` — a sitemap defect with nothing on the page to read or change;
  it reports why the log could not place the page.

The direction rule survives as a rule: `lost` is always `work`, `added` is always
`information`, and the contract test reads `direction` rather than a list of names.

### The three behaviours, checked on a page that has all three

`be_fr/(be_fr)fr__galerie-generale`, with the derivation and the content view run over the
report as it is on disk:

- **work** (`copy`, `text-missing`, `heading-level`) — 451 findings, and the bar's
  denominator is 451. It counts, and nothing else does.
- **information** (`text-added`, `restructured`) — 40 rows drawn with *Ruis tonen* **off**,
  the same 40 with it on, and none of them in the denominator.
- **diagnostic** (`tag-changed`) — 0 rows with the toggle off, 3 with it on.
- The toggle's label reads **Ruis tonen (4)**, which is exactly the page's diagnostics.

### Three decisions this ticket had to make

**`ReportSummary.shown` is renamed to `work`, and `hidden` is replaced by `information`
and `diagnostic`.** The trap asked for this to be deliberate. Keeping `shown` was refused
because it becomes false on the day the enum lands: an `information` finding *is* shown and
is not in that number. Each count is now named after the visibility it counts, `total` is
their sum, and the dashboard's *verborgen (ruis)* chip and its `Verborgen` column read
`diagnostic` — the number that is actually behind the toggle. `data/reports/` is
gitignored and was rebuilt by the run above, so nothing on disk carries the old shape.

**The noise toggle now reveals one kind of thing, not two.** The criterion expected two.
It cannot be two once `information` renders by default, which the criterion above it
requires; what the toggle uncovers is the `diagnostic` classes alone, and *Ruis tonen* is a
truthful name for them. The visible consequence of this ticket is that **11,643 findings
that used to sit behind the toggle are now drawn by default** — that is the whole of what
the split bought, and it moves no count.

**The information row still carries an override control.** `CONTEXT.md`'s `Visibility`
entry needed no edit and describes what shipped, with one clause outstanding: *"it offers
no override control"*. [86](86-heading-level-becomes-information.md) claims that machinery
by name — context marker, no control, no class group in *Verschillen* — and asks for it to
be written generically off `visibility`, which it now can be. Building it here would also
have taken the control away from any existing dismissal on a class this ticket moved, which
is a measurement 86 is already committed to making. Two entries elsewhere in `CONTEXT.md`
said "shown classes" and now say `work`.
