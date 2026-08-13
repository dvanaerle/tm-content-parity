# 88 — The mute says what it hides, and it can name a section

Type: task
Status: resolved
Blocked by: None — can start immediately.
Parent: ../map.md

> **The subject of this ticket was withdrawn on 2026-08-13, and this ticket is why.**
> Nothing below is struck through: it was built, it shipped, and it did what it says.
> What it also did was make the mute reviewable for the first time — a count before the
> press, a mandatory note, a named section — and a reviewable feature is a measurable
> one. The measurement is the evidence in
> [ADR 0011](../../../docs/adr/0011-the-mute-is-withdrawn.md): eleven `muted` rows, all
> on `nl`, all by one editor, **ten revoked by their own author** and six of them noted
> `Test`. The note requirement this ticket added is what lets that sentence be written;
> four of the eleven predate it and carry no note at all. The one mute left standing was
> annotated `"Negeren"` — the name of the other control.
> This ticket is the half of the deprecation that earned it. Tickets 111 to 115 carry
> the withdrawal.

**What to build:** *Klasse dempen* stops being one press that silently hides half a
page. An editor mutes `text-missing` **under one heading**, sees how many findings that
covers before pressing, and writes why. The page-wide form is still there for a page
whose headings are its content.

Every rule is in
[ADR 0008](../../../docs/adr/0008-the-mute-key-carries-the-anchor-heading.md).
**Read it first.**

## Why this is urgent rather than merely wanted

The largest press available today hides **173 findings**, asks for no reason and records
no section. It persists for ever, so it is the least reviewable thing in the log.

And the migration is free **now**. Ticket 65 counted the table: 45 events, 14 keys, 5
live overrides, all dismissals, no live mute in any store. The table is append-only, so
a mute written under the old key can never be repaired — only superseded. Every mute an
editor makes before this ticket is a key that has to be carried for ever.

## What it delivers

- The mute key becomes `store | page | class | anchorHeading`.
- The control offers the section form first and the page-wide form second.
- Both forms state the finding count before the press.
- Both forms require a note.
- A null anchor heading is a real section, named honestly in Dutch as the content before
  the first heading.

## Acceptance criteria

- [x] The mute key holds the anchor heading, and the page-wide form is the same key with
      the heading absent. One key shape, not two mechanisms.
- [x] The control shows the exact number of findings each form covers, computed before
      the press, on the current snapshot.
- [x] A note is mandatory on a mute. The database refuses a mute without one, in the same
      manner as a dismissal, so the rule does not live in the browser alone.
- [x] Muting a section leaves the same class visible elsewhere on the page. Checked on
      `nl__terrasoverkapping`, where `(text-missing, «Gumax® Heavy Duty»)` covers 64 of
      88 and must leave 24 visible.
- [x] The page-wide form still works on `nl__fotogalerij/zonwering`, where the section
      form would offer 239 groups of about 1.7 findings.
- [x] A null anchor heading mutes only the null section, and the count makes clear it is
      not the whole page. On `nl__terrasoverkapping` that bucket holds 7 unrelated
      `text-missing` findings, so the count is the guard.
- [x] A muted finding still stays visible behind the noise toggle, and a mute still
      leaves the denominator.
- [x] The derivation is pure and tested: a section mute, a page-wide mute, both on one
      page, a mute whose heading no longer exists, and a mute on the null section.
- [x] The answer records how many live mutes existed before the change. If the count is
      still zero, say so, because that is what made the change free.

## Traps

- **The heading is in the mute key and not in the finding id.** Ticket 34 kept it out of
  the id and out of the grouping key, and this ticket does not change that. A mute may
  drift when a heading changes; an id may not.
- **A mute whose heading changed stops applying.** That is correct — the judgement was
  about a section that is no longer there, and the editor is asked again. Do not add a
  fallback that widens it to the page.
- **No automatic threshold.** It is tempting to hide the section form on a page with many
  headings. The count on the button does that job without a number to argue about.
- **Do not reach for this for the campaign banner.** All 1,645 banner findings carry a
  null anchor heading, spread one per page over about 330 files.
  [90](90-a-campaign-is-a-class-not-a-commit.md) is the right ticket for that.
- The class is still the mute key's third part, and the class is still the only axis.
  This ticket adds a place, not a second dimension of judgement.

## Answer

The mute key is `store | page | class | anchorHeading`, and *Klasse dempen* is gone.
In its place is *Dempen…*, which opens two forms — the section first, the page second
— each carrying the number of findings it covers, and neither pressable without a
note.

### The key has three states, and two of them look empty

`muteKey()` in `shared/mute-key.mjs` is the one place the key is written down, and
`eventKey()` in `overrides/state.mjs` uses it. The trap the ADR names is that
**absent** (the page-wide form) and **null** (the content before the first heading)
are both "no heading" in a payload, so they cannot both encode to nothing:

```
nl|terrasoverkapping|text-missing|#Gumax® Heavy Duty   a section
nl|terrasoverkapping|text-missing|*none                the content before the first heading
nl|terrasoverkapping|text-missing|*page                the page-wide form
```

The prefix on a named heading is what stops a heading spelled `*page` from landing in
the page-wide slot, and there is a test for exactly that. `anchor_heading_slot` in
`supabase/schema.sql` is a generated column holding the same expression in SQL, and
`overrides_current` keys on it, so the view and the derivation cannot drift.

`namesSection()` beside `muteKey()` is the one place the difference between an absent
heading and a null one is decided. The key, the port, the count and the undo button
all ask it, rather than each re-deciding it with an `undefined` check of its own.

### Why the key is in `shared/` and not in the contract

It went to `compare/contract.mjs` first, which is where `muteKey()` had always lived
and which AGENTS.md calls the contract. That **broke the whole interface**, and no
test caught it: `contract.mjs` imports `node:crypto` for `findingId()`, its own header
warns that "a Vite build of an island that reaches this file fails on that import",
and ticket 88 is the change that made the mute key run in the browser. The island
stopped hydrating, so every control in it died — including the *Je naam* field, which
has nothing to do with mutes.

The key is a pure rule that three stages read, so ADR 0001 puts it in `shared/`. It is
**not** re-exported from the contract: a second import path is the same trap again.
`shared/mute-key.test.mjs` asserts the file imports nothing, which is the only part of
this a unit test can hold.

The port is the other place the two nulls meet: `names_section` is the column that
tells them apart, and `overrides/supabase.test.mjs` exists only to hold that mapping
still. A row from before this ticket has no column and reads as the page-wide form,
which is what it was.

### Live mutes before the change: zero. It is still free

Measured against the live table on 2026-08-10, not quoted from ticket 65:

| | |
| --- | --- |
| live `page-class` keys | 4 |
| of those, `muted` | **0** — all four are `cleared` |
| `muted` rows in the history | 4, and **all four carry no note** |

So no key is orphaned. The four noteless mute events in the history are why
`mute-anchor-heading.sql` adds the widened note constraint `not valid`: the table is
append-only, a mute written before this ticket can never be repaired, and a validated
constraint would simply refuse to apply. The rule holds from the next row on.

### The two pages, on today's snapshot

`nl__terrasoverkapping` — 153 shown, 9 `page + class` groups, 36 heading groups. The
ADR's table reproduces exactly.

| press | covers |
| --- | --- |
| `text-missing` under «Gumax® Heavy Duty» | **64** |
| `text-missing`, page-wide | **86** |
| `text-missing` in the null section | **7** |

The section press leaves 22 findings visible, not the 24 the criterion predicted: the
page-wide total is 86 today where the ADR measured 88. Two findings left the snapshot
between the two measurements. The 64 and the 7 are unchanged, and the shape of the
judgement is what the criterion was about.

`nl__fotogalerij/zonwering` — 399 shown, 4 `page + class` groups, **239** heading
groups at 1.7 findings each, again exactly the ADR's numbers. The page-wide form is
untouched and is the only usable one there. Nothing hides the section form on that
page: the two counts on the two buttons say it without a threshold.

The largest press in the log is still there and still available: `uk__terrasoverkapping`,
`text-missing`, **173 findings**. It now reads *Hele pagina dempen — 173 bevindingen op
de hele pagina* and cannot be pressed without a reason.

### What was left alone

- The heading stays out of the finding id and out of the grouping key. Ticket 34 is
  untouched.
- A mute whose heading changed stops applying, and the editor is asked again. There is
  no fallback that widens it to the page — the derivation looks up the section key and
  the page key, and a heading the snapshot does not have matches neither.
- The class is still the only axis. The two forms are two places, not two dimensions.
- The campaign banner is not addressed here. Ticket 90 owns it.

No new precedence rule was invented. When a section mute and a page-wide mute both
reach a finding, the section is read first and a **cleared** section falls through to
the page-wide mute underneath it — the same fall-through a cleared dismissal already
has onto a class mute. The first draft stopped at the section instead, which let an
editor clear a section and then press *Hele pagina dempen* on a button that had
counted that section in, and watch it stay open for ever. The review caught it. Both
directions are tested.

### Where it lives

| file | what changed |
| --- | --- |
| `shared/mute-key.mjs` | the key's one home: `muteKey`, `namesSection`, the slot |
| `compare/contract.mjs` | `muteKey()` **left**, and a comment says where it went |
| `overrides/state.mjs` | the derivation reads both keys; `muteCoverage()` is new |
| `overrides/supabase.mjs` | `anchor_heading` and `names_section` cross the port |
| `supabase/schema.sql` | the columns, the slot, and the note constraint |
| `supabase/mute-anchor-heading.sql` | the same change applied to the **live** table |
| `web/src/lib/mute.mjs` | the two forms and the sentence each one says |
| `web/src/components/OverrideControl.jsx` | *Dempen…* replaces *Klasse dempen* |
| `web/src/lib/reports.mjs` | the dashboard index carries the heading, or it disagrees |

~~**`supabase/mute-anchor-heading.sql` has not been applied.** It is the one step that
is not code, and until it runs the browser will send a column the table does not have.~~

**Applied 2026-08-10, and superseded 2026-08-13 by ADR 0011.** This was the last open action
item on the ticket and it is closed twice over. The file carries both dates in its own header
and it is **kept, not deleted**: the eleven `page-class` rows in the live table were written
under the shape it applied, and a migration that ran is a fact about the table whether or not
the feature it served survived. `supabase/schema.sql` marks the same columns and constraints
retired rather than dropping them, for the reason ADR 0011 gives — eleven rows contradict any
constraint saying a mute is impossible.

The applying of it also exposed the defect the ticket's own answer records: the mute key had
been put in `compare/contract.mjs`, which imports `node:crypto`, so the React island stopped
building and every control in it died. The key moved to `shared/mute-key.mjs` per ADR 0001,
and ticket 114 deleted that file. The lesson outlived both: a green `npm test` says nothing
about the bundle.
