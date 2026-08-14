# 131 — The tones say what you expect

Type: task
Status: resolved 2026-08-14 — built in `7f350dc`, merged in `8d18933`. The eighth tone shipped
as **`info`**, not `information`. This ticket names it both ways — `information` at the `info`
split above, `info` in the summary line — and the two live call sites (the `casing` class, the
`medium` priority) carry `visibility: 'work'`, so `information` would have asserted the
opposite of their visibility. The parity log records **`info`**.
Blocked by: None — can start immediately.
Parent: ../map.md

**What to build:** the palette's seven tone names become eight that tell a reader what they
will get. Four of them are broken today, and each is broken on its own terms rather than
because it differs from the styleguide.

- **`dark`** means *a total, which is not a judgement at all*, and it maps to the strong
  border. In a file whose premise is stated in bold — **a tone is a meaning, and not a hue** —
  `dark` is a hue. It becomes **`total`**.
- **`attention`** collides with a live glossary term. `CONTEXT.md` defines **Needs attention**
  as *a finding that is contradicted, and nothing else*; the tone means *something changed and
  an editor decides what to do about it*, which is far wider. Two scopes, one word, in a repo
  whose glossary opens by insisting each word has one meaning in the code, the interface and
  the tickets. It becomes **`caution`**.
- **`info`** carries two glossary terms at once: *done*, which is the bucket **Closed**, and
  *information the editor did not ask for*, which is the `information` value of the visibility
  enum (ADR 0005). One of them is a work state and the other is a property of a class. It
  splits into **`closed`** and **`information`**, both borrowing the glossary's own words.
  Two tones sharing one styleguide group is already how `severe` and `attention` work.
- **`neutral`** holds three meanings — *not work, or off, or carrying no judgement*. It keeps
  its name and loses two of them. "Off" is a control state that shadcn's own attributes
  already express.

**`severe` becomes `warning`**, which is the one rename that is about clarity rather than a
defect: amber is what a reader expects `warning` to be, so the generic word is the more
predictive one here.

**`lost` and `added` do not change, and the reason is the whole point of the exercise.** They
are not colour names — they are `CONTEXT.md`'s **Direction**, which side a one-sided
difference is missing from. `error` and `success` were considered and refused: `error` would
be an amber tone under a name that promises red, and `added` is not a success at all — new-only
content is a difference an editor still has to resolve, so green claiming *this went well*
would be a false statement in the interface. `closed` is the real success state and it is
blue, so `success` would mislead there too.

So the vocabulary is generic where the hues are free and domain-named where they are not:
**`warning`, `caution`, `info`, `neutral`** beside **`lost`, `added`, `closed`, `total`**.

**This is JavaScript only and it changes no pixel.** It runs first because 132 transcribes
these names into the stylesheet, and renaming after the move means writing every name twice.

- [x] The eight tones are named as above, and every call site names the new one. — `TONES` at
      `web/src/lib/palette.mjs:76-83`; the call-site sweep at `palette.test.mjs:106` holds it.
- [x] The docblock's tone table is rewritten: eight rows, each meaning stated once, and
      `neutral` reduced to one. — `palette.mjs:15-22`.
- [x] The table mapping a tone to its styleguide group covers all eight. —
      `palette.mjs:51-58`.
- [x] `severityTone()` answers with the new names. — `palette.mjs:246-249`.
- [x] `palette.test.mjs` pins the new vocabulary. Its existing assertions survive in the new
      words: the status tones never carry a direction hue, the two ambers print different
      pixels, the fix checkbox has two ticked colours and no direction, and a cell tint is
      `lost` or `added` and nothing else. — `palette.test.mjs:199`, `:207`, `:213`, `:219`.
- [x] A test fails if a tone outside the eight is used. — `palette.test.mjs:34` and `:51`, with
      the stale-name catcher at `:133` pinning `severe`, `attention` and `PILL.dark`.
- [x] Every screenshot baseline is unchanged. A moved baseline means a colour moved, which
      this ticket does not do. — taken from the commit's byte-identical colour-string
      assertion against `f66fd34`; the baselines were not re-run during this audit.
- [x] `CONTEXT.md` is not touched. Tone names are the palette's vocabulary and not the
      domain's, and the glossary stays free of implementation.

## Traps

- **`closed` and `information` deliberately borrow glossary words.** That is the allowed
  direction — the palette taking the domain's word — and it is the opposite of what
  `attention` was doing, which was taking a domain word for a wider meaning. Do not "fix"
  them into synonyms.
- **Do not rename `lost` or `added`.** The reasoning above is the ticket's substance and a
  later reader will find the generic names tempting again.
- The two ambers are a *pair* and the pairing is load-bearing. `warning` is the loud one and
  `caution` the quiet one everywhere except the bar fill, where the comment records that they
  run darker rather than lighter because with no ink on top the subtle step is invisible. That
  inversion survives the rename.
- The maps are deliberately sparse and irregular. The solid map's `caution` entry is not
  solid, the ink map holds four tones, the cell and word maps hold two. None of that is a bug
  to tidy while the names are being changed.
- `total` and not `rollup`. The glossary's word for a summed number is **Roll-up**, and the
  tone is worn by any total rather than only by a roll-up. If a later ticket wants every
  palette name to be a glossary word, that is the argument to have then.
