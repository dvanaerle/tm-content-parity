# A tone is a selector, and not a class name

An element says what it **wears** and what **tone** it is in, and `app.css` decides what
that prints. The eight maps of Tailwind class names in `web/src/lib/palette.mjs` — `PILL`,
`SOLID`, `FILL`, `BANNER`, `INK`, `SURFACE`, `TOKEN`, `ACCENT` — are deleted, and
`palette.mjs` keeps the three things that were never a colour: the vocabulary (`TONES` and
the `Tone` type), the threshold that reads a share as a tone (`severityTone()`), and
`CHROME`, which was never part of the tone layer.

Tickets 132 and 133 did the work: 132 defined the CSS contract, 133 moved every surface
onto it, and this is the part that deletes the old form.

## What changed, in one sentence

`<Badge className={PILL[tone]}>` becomes `<Badge data-wears="pill" data-tone={tone}>`.
The colour moves from a lookup in JavaScript to a rule in the stylesheet, and no pixel
moves with it.

## Why

`palette.mjs` held its values under one constraint, stated in its own docblock: *Tailwind
finds class names in the source text, therefore each value is a literal, and no value is
assembled from parts.* That is a true statement about Tailwind and it was the right way to
hold a colour map. It has two costs, and both were being paid.

- **A tone that depends on a state cannot be a literal.** The interface had three
  hand-written transcriptions because of it: the view switch's pressed ground spelled out
  as `aria-pressed:bg-brand aria-pressed:hover:bg-brand-dark`, the fix checkbox's tick map
  spelling `data-checked:` around each of six palette values, and a tab height behind a
  group-data modifier. None of them was a palette problem. All three were the same problem,
  and as selectors over state the control already publishes they are ordinary rules.
- **The constraint stops existing rather than being satisfied.** There is no class name in
  the new form for Tailwind to find, so the rule it was obeying has nothing left to bind.
  That is the thing worth having: not a workaround for the literals rule, but a mechanism
  the rule does not reach.

What it costs is stated below and it is real: a shape that has to beat a primitive's own
utilities has to live in the utilities layer, and a wrong tone is now silent.

## What this overrules

- **ADR 0007's amendment sentence** — *every colour that carries meaning is still a token
  from `palette.mjs`, handed to the primitive through `className`* — is struck there,
  dated, with this ticket's number. Half of it survives and it is the half that was the
  decision: **meaning is ours and not the library's.** Only the mechanism changed. The
  bullet under it, which recorded that `className` carrying colour was in tension with
  shadcn's own guidance, is struck with it: the tension is gone, because `className` no
  longer carries colour anywhere in this interface.
- **`app.css`'s own sentence** — *`palette.mjs` is where that mapping is written* — is
  struck the same way. The mapping is written in `app.css` now. Two files must not
  disagree about where tone lives, and the one that draws is the one to read.

## This is not a second colour vocabulary, which is ticket 74's objection

Ticket 74 rewrote `app.css` against the Figma styleguide and deleted a tool-specific set of
`--color-*` names — `attention-ink`, `severe`, `brand-sand` and the rest. Its achievement
was that **the name is the answer**: with one set of colour names, you no longer need a
mapping file to learn that `attention-ink` meant `Warning/on-warning`. Moving tone into the
stylesheet looks like walking that back, and a reader is entitled to check.

It does not, and the distinction is precise: **a tone is a rule that reaches a styleguide
variable, and not a name for a colour.**

- No `--color-*` name is added by this move. The twelve styleguide groups stay the only
  colour names in the interface.
- A tone sets `--tone-*` properties that *point at* those variables — `--tone-ground:
  var(--color-warning-subtle)` — and a shape reads the properties. Follow either one and
  you arrive at a styleguide name in one hop, in the same file.
- The tone words are not colour names and never were. They are `CONTEXT.md`'s vocabulary:
  `lost` and `added` are **Direction**, `closed` is a bucket. Ticket 131 settled which
  eight, and this move did not touch them.

The failure ticket 74 removed was two sets of names for one colour. What is here is one set
of names, and eight rules that spend them.

## What was considered and rejected

- **Container style queries.** The feature that looks made for this: a shape could ask
  *what tone am I inside?* Refused on ADR 0015 — Newly Available, not Widely Available.
  Attribute selectors, custom properties and cascade layers all clear the floor.
- **A shadcn variant per tone.** It puts the definition of a tone in the library's
  vocabulary, which is the option ADR 0007 rejected on the merits and still rejects. A
  `destructive` variant would also smuggle red onto a status.
- **Keeping both forms.** The expand-migrate-contract had both live for two commits on
  purpose, and stopping there is the failure mode: two ways to colour a badge, one of them
  the one somebody copies.
- **A `tone` prop on every component instead of an attribute.** It reintroduces the
  literals problem one layer up — the component still has to turn the prop into something —
  and it makes every wrapper the place tone is decided.

## Consequences

- **A wrong tone is silent.** A map with two keys refused a third and a typo was
  `undefined` at the call site; a selector that matches nothing draws nothing and throws
  nothing. `palette.test.mjs` is the answer and is now the one guard: it reads the tone
  rules out of `app.css`, asserts they are exactly the eight words, asserts every tone
  publishes a ground and an ink, and sweeps every `.jsx`, `.mjs` and `.astro` file for a
  tone or a shape the stylesheet has no rule for.
- **Two rules with judgement in them moved and are still tested.** Direction is never spent
  on status — no status tone may reach for `danger` or `success` at any weight — and the two
  ambers must print different pixels, because one reports a failure and the other reports a
  condition.
- **Two shapes live in `@layer utilities` and give something up for it.** A shape belongs in
  `components`, so a component can depart from it with an ordinary utility class. The view
  switch's pressed ground and the fix checkbox's tick exist to *outrank* a primitive's own
  utilities, which a components-layer rule cannot do however specific it is, so they sit in
  `utilities` and stop being departed-from by a class. That is the trade the hand-written
  variant prefixes were making already, less visibly.
- **`palette.mjs` stops being a colour map.** It is the tone vocabulary, one threshold with
  judgement in it, and the chrome. A reader looking for a hue goes to `app.css`; a reader
  looking for what a tone means goes to `palette.mjs` or to `CONTEXT.md`.
- **ADR 0007's two remaining mentions of a deleted map are records of registry edits, and
  their reason survives.** `ui/progress.jsx` gained a `trackClassName` and an
  `indicatorClassName` because the page bar's fill had nowhere to go, and the sparkline
  stays hand-rolled. Both are still true; the token spelling in them (`FILL.secondary`,
  `FILL[severityTone(share)]`) is history, and a `shadcn add progress` still overwrites the
  file.
- **The claim this decision cannot prove is *no pixel moved*.** It is a transcription and
  not a redesign, and this repo has no screenshot baselines — so the evidence is the browser
  suites, `palette.test.mjs`, and a human looking at the screen. A decision that promises no
  visible change and cannot demonstrate it is the argument for visual regression testing,
  and the tickets record what was walked.
