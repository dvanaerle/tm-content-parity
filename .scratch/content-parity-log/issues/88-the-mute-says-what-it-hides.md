# 88 — The mute says what it hides, and it can name a section

Type: task
Status: ready-for-agent
Blocked by: None — can start immediately.
Parent: ../map.md

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

- [ ] The mute key holds the anchor heading, and the page-wide form is the same key with
      the heading absent. One key shape, not two mechanisms.
- [ ] The control shows the exact number of findings each form covers, computed before
      the press, on the current snapshot.
- [ ] A note is mandatory on a mute. The database refuses a mute without one, in the same
      manner as a dismissal, so the rule does not live in the browser alone.
- [ ] Muting a section leaves the same class visible elsewhere on the page. Checked on
      `nl__terrasoverkapping`, where `(text-missing, «Gumax® Heavy Duty»)` covers 64 of
      88 and must leave 24 visible.
- [ ] The page-wide form still works on `nl__fotogalerij/zonwering`, where the section
      form would offer 239 groups of about 1.7 findings.
- [ ] A null anchor heading mutes only the null section, and the count makes clear it is
      not the whole page. On `nl__terrasoverkapping` that bucket holds 7 unrelated
      `text-missing` findings, so the count is the guard.
- [ ] A muted finding still stays visible behind the noise toggle, and a mute still
      leaves the denominator.
- [ ] The derivation is pure and tested: a section mute, a page-wide mute, both on one
      page, a mute whose heading no longer exists, and a mute on the null section.
- [ ] The answer records how many live mutes existed before the change. If the count is
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
