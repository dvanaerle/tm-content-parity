# 111 — The last mute is revoked, and the log says what came back

Type: build
Status: resolved 2026-08-13 — revoked, and the ticket's own premise refused: the mute had
drifted off its section and was hiding nothing, so no number moved.
Blocked by: none
Parent: ../map.md

**What to build:** the one live mute is taken back, and `nl`'s open count moves by a number
this ticket records. Nothing else changes.

This is first **because the mute still works**, and it is the only ticket in the sequence
that depends on that. Once ticket 114 has taken `page-class` out of the derivation there is
no longer anything that can answer *what was this hiding* — the findings simply reappear,
uncounted and unexplained. Measure while the feature is alive.

## The row

`nl` · `downloads` · `text-missing` · the content before the first heading. Written
2026-08-10 11:07, never cleared. Its note reads `"Negeren"`.

It is the only live mute in the table. Ten others were written and revoked by their own
author, most within twenty seconds; six of those carry the note `Test` or a typo of it. The
eleven rows stay on disk — the table is append-only and this ticket adds to it.

## Acceptance criteria

- [x] The findings the mute covers are counted **before** the revocation, per class and in
      total, and the number is recorded in this ticket's answer.
- [x] `nl`'s open count and its denominator are recorded before and after.
- [x] One `cleared` event is written on that key — store, page, class and the heading slot
      it was made under. A `cleared` event carries no note; the reason lives in this ticket
      and in ADR 0011.
- [x] The event is written through the same path an editor's clearing takes, not by a hand
      -written insert that could disagree with `clearedEventFor()` about the key.
- [x] After it: no `muted` row anywhere in the table is the latest event on its key. State
      that as a query result, not as an assumption.
- [x] The dashboard no longer draws *N gedempt (buiten de teller)* for any store.
- [x] No source file changes.

## Traps

- **The heading slot is part of the key.** This mute has `names_section: true` and a null
  `anchor_heading`, which is the content before the first heading — a real section, not the
  page-wide form. A clearing aimed at the page-wide key leaves it standing and the number
  will not move.
- **The count is not the repeat's size.** A mute covers every finding of its class in its
  section, including ones nobody has looked at. That gap is the whole reason ADR 0011 exists
  and it is the number worth recording.
- **Do not delete the row.** The append-only rule is the one this override model is built
  on. A revocation is a new event.

## Answer

The mute is revoked — row `712`, `2026-08-13T06:56:09.069Z` — and **`nl`'s numbers did
not move**. They did not move because on the snapshot in front of readers the mute was
already hiding nothing: it had drifted off the section it names.

Measured with a throwaway pair under `.scratch/revoke111/` — one script to read, name the
event, write it and read again, one to run the two after-the-fact queries — against
`data/reports/` at observation `2026-08-12T05:54:59.189Z-55445435` and the live table.
**They have since been deleted**, and were never committed: a one-time revocation cannot
be re-run, and they call the `page-class` half of `clearedEventFor()` that ticket 114
removes. What they did is written down here instead — the key, the counts, the event, the
row it became, and both queries — because this answer is the record and the script was
only ever the instrument.

### What it covered: zero, in every class

```
the snapshot: 191 findings, 0 of them before the first heading, 34 of class text-missing
findings the mute decides: 0 {}
of those, in a shown class: 0
muteCoverage() for its key: 0 {"class":"text-missing","anchorHeading":null}
```

The empty `{}` is the per-class breakdown, and it is empty because the total is zero.

The key is `nl|downloads|text-missing|*none` — the content before the first
heading. On this snapshot **every** finding on `nl/downloads` sits under a heading, while
`text-missing`'s 34 findings are spread across named sections. The mute was written
2026-08-10 against a
snapshot that is not retained (`data/reports/` is not versioned), so what it hid on the
day it was made cannot be recovered. What it hid on the day it was revoked is nothing.

This is ADR 0008's drift rule doing exactly what it says: a mute that named a heading
the snapshot no longer has reaches nothing, and there is no fallback to a wider key.
It is also, quietly, a second argument for ADR 0011 — the one live mute in the project's
history spent its last days deciding nothing, and no one could see that it was there.

### The numbers, before and after

| | open | denominator | muted | dismissed | fixed |
|---|---|---|---|---|---|
| `nl` before | 4632 | 4784 | 0 | 142 | 10 |
| `nl` after  | 4632 | 4784 | 0 | 142 | 10 |

`muted` reads 0 on both sides for the same reason the count is 0: `barOf()` counts
findings in the `muted` **state**, and no finding was in it. The denominator subtraction
`shown.length - muted` was therefore already a no-op **on this observation** — which is
why ticket 113 can expect to remove it without a number moving. That holds because the
key is now cleared and no press can make another; it was not true of the snapshot the
mute was written against.

### How the event was written

Through `clearedEventFor()`, not by hand. With nothing muted on the page there was no
real derived finding to press *ongedaan maken* on, so the script builds a **probe**
finding — class `text-missing`, `anchorHeading: null`, on `nl/downloads` — and runs it
through the real `derivePageState()` against the real events, which is the same thing an
editor would have in front of them. `clearedEventFor()` then names the key back:

```json
{"store":"nl","page":"downloads","editor":"d.aerle","scope":"page-class",
 "action":"cleared","class":"text-missing","anchorHeading":null}
```

and `toRow()` turned it into `names_section: true, anchor_heading: null` — the `*none`
slot, matching the `muted` row exactly. Written with `port.appendEvent()`, the same call
`useOverrides().append()` makes. No note, as the constraint allows and the model wants.

**The probe reaching `muted` is not by itself proof that the section key is the one that
decided it.** `derivePageState()` has two branches into `muted` — the section and the
page-wide form — and a page-wide mute would have lit the probe just the same. What proves
the aim is `muteKey()`, the one place the key is written down: the clearing and the mute
reduce to the same string, `nl|downloads|text-missing|*none`. For this run that was checked
by reading the printed row against the printed mute; the script now asserts it outright and
refuses to write if the two disagree, so the trap cannot be walked into on a re-run.

### The two queries

```
rows: 710
keys whose latest event is `muted`: 0

be     open  4067 /  4144  muted 0  pages drawing "gedempt": 0
be_fr  open  5164 /  5164  muted 0  pages drawing "gedempt": 0
de     open  4600 /  4600  muted 0  pages drawing "gedempt": 0
fr     open  5123 /  5123  muted 0  pages drawing "gedempt": 0
nl     open  4632 /  4784  muted 0  pages drawing "gedempt": 0
uk     open  4647 /  4647  muted 0  pages drawing "gedempt": 0
```

The first is `latestByKey()` over the **whole** table, not over `nl` — the same reduction
`overrides_current` performs. The second is `bar.muted > 0` per page over every store,
which is the exact condition `PageBar` in `Progress.jsx` draws *N gedempt (buiten de
teller)* on; `PageView.jsx` is that bar's only caller, so the sweep is the whole surface.
No page in any store meets it.

Nothing was deleted: 709 rows before, 710 after. The row's own id is `712` — the table's
sequence is not a row count and never was, since a refused insert still spends a number.
The eleven `muted` rows stay where they are, and ticket 114 may now take `page-class` out
of the derivation without a finding changing state under it **on this observation** — the
guarantee is that no key can be muted again, not that the derivation is dead code.
