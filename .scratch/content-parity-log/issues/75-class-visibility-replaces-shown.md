# 75 — Class visibility replaces the shown boolean

Type: task
Status: ready-for-agent
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

- [ ] `compare/vocabulary.mjs` carries one `visibility` field on every class, valued
      `work`, `information` or `diagnostic`. `shown` is gone, not deprecated.
- [ ] All twelve currently shown classes are `work`. The nine hidden ones are split,
      and the answer gives the reason for each of the nine in one line.
- [ ] **No class carries "excluded from comparison".** An excluded region leaves at
      extraction by ADR 0003, so it never reaches a class. A fourth value would claim
      the log can see inside one.
- [ ] The denominator is unchanged. Re-run the comparison and record the per-store
      totals beside the previous ones: expect **no movement at all**, on any store.
- [ ] `work` counts. `information` renders and does not count. `diagnostic` stays
      behind the noise toggle. Each of the three is checked on a page that has one.
- [ ] ~~A mute still takes findings out of the denominator, and~~ a dismissal still moves
      them into the numerator. — **the mute half is struck 2026-08-13, ADR 0011.** The
      count-neutrality this criterion tests is now against the dismissal alone; nothing
      leaves the denominator, so there is no subtraction left to preserve.
- [ ] The contract pins are updated: the class count stays 21, and the pinned set that
      used to be "the hidden classes" becomes the three visibility groups.
- [ ] The noise toggle's label still tells the truth about what it reveals. It now
      reveals two different kinds of thing.
- [ ] `CONTEXT.md`'s `Visibility` entry needs no edit. It was written for this ticket;
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
