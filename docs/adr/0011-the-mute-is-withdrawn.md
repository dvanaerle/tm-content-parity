# The mute is withdrawn, and a dismissal is the only judgement

Supersedes [ADR 0008](0008-the-mute-key-carries-the-anchor-heading.md).

The `muted` override and the `page-class` scope leave the model. A dismissal — keyed on
the finding id, expiring the moment either text changes — is the only judgement an editor
can make about a difference. This reverses the refusal recorded in `PRD.md:457`
(*Remove Class Mute | refused*), and it reverses it for two reasons, in this order.

## The evidence: it was built, tried, and never adopted

The table holds **eleven** `muted` rows, every one of them on `nl`, every one of them
written by the same editor. **Ten were revoked by their own author**, most within twenty
seconds of the press. Six carry the notes `Test`, `Testring`, `Tesriyg`, `testing`. Four
predate ticket 88's note requirement and carry no note at all.

**One mute is live**: `nl` · `downloads` · `text-missing` · the content before the first
heading, made 2026-08-10 11:07. Its note reads `"Negeren"` — the name of the other
control. The single mute anybody ever left standing is annotated with the thing its author
was reaching for.

ADR 0008 hardened a key that has never been turned in anger. `WORKLIST.md:170` still
carries the open step *"00b — Make the first real mute. Nobody has made one yet."*

## The judgement: the mute acts beyond what was pressed

`muteCoverage()` counts what the **key** covers, not what the editor selected, so a mute
hides findings nobody has looked at — and, because it never expires, findings a future
crawl has not yet produced. That is the loss of control that made it unusable, and no
selection interface can fix it: the over-reach is in the key, not in the choosing.

The one job anybody wanted it for was suppressing a whole class, `heading-level` above
all. **A mute cannot do that.** Its key is store × page × class × section, so covering a
class across a store is hundreds of presses, each needing a note, none of them reaching a
page the next crawl finds. The feature that went unused was also the wrong tool for its
own use case.

That job belongs to **class visibility** (ADR 0005): one word, applied once, covering
every store and every future crawl. See ticket 86.

## What was considered and rejected

- **Keep the bulk mute, drop the single one** (or the reverse). Half a deprecation leaves
  the concept in the vocabulary while making it harder to reach — the worst of both.
- **Replace it with a never-expiring judgement under another name.** That is the mute with
  the serial numbers filed off. The re-asking a dismissal causes is accepted instead: an
  override you must re-affirm is an override you can still see.
- **Stop emitting `heading-level` altogether.** Refused: `CONTEXT.md` makes *never silently
  absent* the log's spine, and a class that is not produced is a difference nobody can
  count or recover without a re-crawl.
- **Convert the live mute to a dismissal**, honouring its `"Negeren"` note. Not possible
  honestly: a mute covers every finding of a class in a section, a dismissal names two
  exact strings. Converting invents N judgements from one press and attributes them to a
  person who made none of them. The findings go back on screen and are asked about again.
- **Tighten `supabase/schema.sql`.** Eleven rows contradict any constraint saying a mute is
  impossible, so it could only be added `NOT VALID` — a schema asserting a shape the table
  demonstrably held. A comment naming this ADR says the same thing without lying.

## Consequences

- **The denominator loses its subtraction.** `barOf()` computed
  `denominator = shown.length - muted`; nothing is now outside the count. Every difference
  in a shown class is either open work or work an editor closed. There is no longer any way
  to say *this is not work at all* — that is now a property of the **class**, not of a
  place on a page.
- **`nl`'s numbers move once.** Revoking the live mute returns its hidden findings to open.
  The count must be measured and stated before the change lands.
- **A fully decided difference offers only *Ongedaan maken*.** The mute used to be the last
  tool available where a dismissal was refused. That case is now correctly empty: if every
  page is decided, the work is done, and a second judgement on top of a colleague's is how
  two people disagree invisibly in an append-only table.
- **Nothing is deleted.** The eleven rows stay. ADR 0008 stays, superseded — its argument
  (a mute is a judgement, an id is an identity) is the reasoning that led here and is worth
  reading. Ticket 41 is parked rather than removed.
- **The anchor heading survives as a locator.** It is how a finding says where it is on the
  page, and that role never depended on the mute. It leaves the dashboard index, where the
  mute key was its only reader.
