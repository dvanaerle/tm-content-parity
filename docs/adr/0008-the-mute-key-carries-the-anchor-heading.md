# The mute key carries the anchor heading, and a mute says what it hides

A mute is keyed on `store | page | class`. It is the only override that survives a
text change, which makes it the right tool for rotating content — and its key is
coarser than the judgement an editor is making. Measured over 448 reports and 22,990
shown findings:

| key | groups | median | p90 | max |
| --- | --- | --- | --- | --- |
| `page + class` | 2,101 | 4 | 25 | **173** |
| `page + class + anchorHeading` | 7,639 | 1 | 6 | 98 |

**88.8% of shown findings sit in a `page + class` pair that holds more than one
heading.** One press of *Klasse dempen* can hide 173 findings, it asks for no reason,
and it persists for ever.

We decided three things:

1. The mute key gains `anchorHeading`, so a mute can name a section.
2. **The page-wide form stays**, offered second.
3. A mute states how many findings it will hide **before** the press, and it
   **requires a note**.

## Why `anchorHeading`, which the finding id refuses

Ticket 34 kept `anchorHeading` out of the finding id and out of the grouping key, and
that decision is untouched. The reason it can be a mute key is that a mute is a
**judgement**, not an identity. An id must be stable or a dismissal detaches wrongly.
A mute may drift: if the heading above a section changes, the mute stops applying and
the editor is asked again, which is the same correct behaviour a dismissal has when its
text changes.

`anchorHeading` is also the only sub-page value available. An element carries no DOM
path — ticket 01 refused it and ticket 34 confirmed nothing else exists.

## Why the page-wide form stays

Two real pages decide this:

```
nl__terrasoverkapping        153 shown ·  9 page+class groups →  36 heading groups
   64  text-missing  «Gumax® Heavy Duty»
   25  link-target   «Gumax® Heavy Duty»

nl__fotogalerij/zonwering    399 shown ·  4 page+class groups → 239 heading groups
    8  text-missing  (geen kop)
    3  text-missing  «Fotogalerij terrasoverkapping»
```

On `terrasoverkapping` one heading carries 64 of the 88 `text-missing` findings, and a
section-scoped mute is exactly the judgement an editor means. On the gallery page the
headings are per-photo captions, so the same feature turns 4 decisions into **239**, at
1.7 findings each.

44.1% of `page + class` pairs hold one heading, where the two keys are identical. They
hold 11.2% of findings. 5.8% of pairs hold eleven headings or more, and there the
page-wide form is the only usable one.

So neither form is redundant. We rejected an automatic threshold that suppresses the
section form on noisy pages: a count on the button teaches the same lesson with no
number to argue about.

## Why the count and the note carry most of the value

The danger in today's control is not that it is page-wide. It is that it hides up to
173 findings **silently** and **anonymously**. A dismissal has required a note since
ticket 09 because it is a judgement; a mute is also a judgement and has never required
one. That was an omission, not a decision.

A mute with a stated count and a written reason is auditable. Without them, it is the
one override nobody can review later, and it is the one that hides the most.

## The migration is free today, and it will not stay free

Ticket 65 counted the table: 45 events, 14 keys, **5 live overrides — all dismissals,
all on `nl`. No mute is live in any store.** Changing the key orphans nothing right
now. The table is append-only, so a mute written under the old key can never be
repaired, only superseded. Do this before mutes accumulate.

## Consequences

- A null `anchorHeading` is a real key value: the content before the first heading. It
  is **16.7%** of all shown findings, and it is heterogeneous — on
  `nl__terrasoverkapping` the null bucket holds 7 unrelated `text-missing` findings.
  The count on the button is what stops a null-bucket mute from over-reaching, so it is
  load-bearing there and not a nicety.
- Headings are page-specific: 78–91% of them occur on exactly one page, and only 8 of
  1,706 appear on more than 20. Since the key already holds the page, a section mute
  cannot reach a sibling page by accident — and it also never generalises to one.
- **A mute cannot address the campaign banner.** All 1,645 shown findings matching the
  banner carry `anchorHeading: null`, spread one per page over about 330 files. That is
  a classification problem, not a judgement, and it belongs to the `campaign` class.
- The bar is unaffected in shape. A mute still takes findings out of the denominator,
  and a smaller mute simply takes fewer.
