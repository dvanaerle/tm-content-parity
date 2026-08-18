# 133 — Every surface wears its tone, and the maps are gone

Type: task
Status: ready-for-agent
Blocked by: 132 — the tones and shapes every surface here asks for.
Parent: ../map.md

## If you are building one part, read only that part

**This ticket is three sessions.** Read this heading block, then **your part and nothing
else** — its reading list, its criteria, its traps. **Do not plan across all three.** Each
part is one commit and starts in a fresh context window.

| part | what | state |
|---|---|---|
| **A** | The dashboard wears its tone | after 132 |
| **B** | The ledger wears its tone | **landed** |
| **C** | The tone maps are gone | after B, and gated on it |

**C is a gate, not a step.** Part B's *no caller left* criterion is what lets C start. If A
and B are landed and any map still has a caller, the sequence is not ready to contract,
whatever the checkboxes say.

### The eight maps, once, so no part has to go looking

In `web/src/lib/palette.mjs` (249 lines), all keyed by `Tone`: **`PILL`** `:89`,
**`SOLID`** `:101`, **`FILL`** `:126`, **`BANNER`** `:146`, **`INK`** `:164`,
**`SURFACE`** `:177`, **`TOKEN`** `:193`, **`ACCENT`** `:206`.

**Surviving C:** `severityTone()` `:246`, the `Tone` typedef `:86` and the `TONES` array
`:75` it derives from (`classes.test.mjs:3` imports `Tone`), and `CHROME` `:215`, which is
not tone-keyed.

**Caller counts outside `palette.mjs`, measured 2026-08-17** — use these to know when part B
is finished, and re-run the count rather than trusting this table:

| map | callers | map | callers |
|---|---|---|---|
| `PILL` | 13 | `INK` | 13 |
| `BANNER` | 9 | `FILL` | 4 |
| `SURFACE` | 2 | `TOKEN` | 1 |
| `ACCENT` | 1 — **a comment, not code** | `SOLID` | **0** |

**`SOLID` has no callers at all** and can be deleted in C with no migration. **`ACCENT` has
no code caller either** — its one hit is a doc comment at `OverrideControl.jsx:205`, inside
the fix-checkbox tick map part B rewrites, which says *"`ACCENT` in `palette.mjs` holds the
same pair for the same reason."* C must not leave that sentence pointing at a deleted export.

### Gate, every part

```
npm test && npm run lint && npm run build
```

**No count, bar, denominator or roll-up moves in any part.** Nothing here reaches the
derivation.

> **Merged 2026-08-17.** This ticket absorbed **134 and 135**. The palette move is one
> expand-migrate-contract, and 133 and 134 were the same mechanical migration of the same
> mechanism split by surface, with 135 deleting the maps afterwards. **135 could never be
> verified on its own** — its own last trap says *if any surface still reads a map when this
> ticket starts, stop and finish that migration first*, which is a ticket admitting it is a
> phase. No measured number moves anywhere in the sequence, so there is no gate between the
> three to batch across.
>
> **132 stays a separate ticket.** It defines the CSS tone contract and carries the design
> decision, and it is the one part of the move that is reviewable as a decision rather than as
> a transcription. The filename keeps 133's slug so inbound links still resolve.
>
> **Restructured 2026-08-17.** Traps moved under their own part and each part gained a reading
> list, after ticket 104 part A cost 180k tokens finding a seam its ticket named no paths for.
> No criterion and no trap was changed, added or dropped — except the screenshot clauses,
> struck in place below with their reason.

## The batches are split by surface, and that is the point

The split is **by surface rather than by module**, so a review can be read against one screen
and the reviewer knows what they are looking at. That reason survives the merge — it is why
this is three commits and not one.

### There are no screenshot baselines in this repo — 2026-08-17

Every screenshot criterion below is struck, and this is why. Verified on 2026-08-17: **no
screenshot matcher is called anywhere** outside `node_modules`, `git ls-files` returns
**zero** committed images, and `.gitignore`'s last entry is `__screenshots__/` with the
comment *"What the browser vitest project writes when a **test fails**. It is an artefact of
one run, not evidence."*

This hits 133 harder than it hits 129, because **"no pixel moves" is this ticket's entire
claim** — it is a transcription, not a redesign, and part C's criterion *every baseline is
unchanged from before 131* was meant to prove the whole sequence end to end. It cannot, as
written. What replaces it: the browser suites pass per surface, `palette.test.mjs` pins the
vocabulary, and a human compares the screen before and after each part. **If you want the
original criterion back, visual regression testing needs its own ticket first** — and it
would be a reasonable thing to build before this sequence rather than after.

---

## A — The dashboard wears its tone

### Reading list — A

Read these and nothing else. If you need more, the ticket is wrong: say so and stop.

- `web/src/lib/palette.mjs` — the eight maps and the three survivors; lines in the heading
  block
- `web/src/lib/palette.test.mjs` (225 lines) — the vocabulary guard
- `web/src/styles/app.css` (381 lines) — what 132 defined, and the sentence C must strike
- `web/src/components/Dashboard.jsx` — `PRESSED_TONE =
  'aria-pressed:bg-brand aria-pressed:hover:bg-brand-dark'` at `:676` (**transcription 1**,
  with its rationale comment at `:659-676`); `INK.caution` / `INK.added` at `:702-703`
- `web/src/components/Chips.jsx` — `PILL[tone]` `:28`, `PILL[PRIORITY_TONE[priority]]` `:126`,
  and the sparkline's `FILL[severityTone(share)]` `:296` with its comment at `:288-292`
- `web/src/components/Repeats.jsx` — `INK.added` `:395`, `PILL[STATE[…].tone]` `:592`
- `web/src/components/Progress.jsx` — `INK.caution` `:37`, `PILL.closed` / `PILL.caution`
  `:65`, `BANNER[tone]` `:181`
- `web/src/lib/classes.mjs:126` — `classInfo()` returns `pill: PILL[tone]`, with `toneOf(cls)`
  just above it. This is where **transcription 2** originates

**`SearchBox.jsx` is in scope even though this part's list never named it** — found
2026-08-18, the same way `Diff.jsx` was found for part B. Its one `PILL.neutral` marks a
one-sided page in the suggestion list, the box is drawn by `Dashboard.jsx` and nothing else,
and it is on screen on the surface this part is reviewed against. It moved with the rest.

### What to build — A

The dashboard's two views stop holding colour strings. The dashboard, the repeats queue, the
chips and the progress marks ask for a tone and a shape, and the stylesheet decides what that
prints.

**Two of the three transcriptions live here**, and this is where the move pays for itself. The
pressed tone on the view switch carries a hard-coded variant prefix because a palette token
cannot carry one. The class-group headers and the class pills assemble their tone the same way.
As selectors, both are rules over the state the control already publishes.

**The sparkline is the interesting one.** 128 already moved its geometry to `calc()` over a
number; this part moves its fill from a per-row class string to the tone the row's share
answers with. `severityTone()` stays in JavaScript — it is a threshold with judgement in it,
and `palette.test.mjs` pins it — but what it answers with becomes an attribute rather than a
lookup.

- [x] The dashboard, the repeats queue, the chips and the progress marks emit a tone and a
      shape and hold no colour string.
- [x] The pressed state of the view switch and the pills is a selector over the state the
      control already publishes, and no variant prefix is transcribed by hand.
      **Read as the two transcriptions this part names**: the switch's `aria-pressed:`
      prefix became a `data-chrome` rule in `app.css`, and the pills' tone became a
      `data-tone` the stylesheet reads instead of a `PILL[tone]` lookup. The filter pills'
      pressed **ring** stays a class and is deliberately not moved — it is the brand's, it
      says *this filter is on* and makes no claim about a finding, and no prefix was ever
      transcribed around a palette value there. If the criterion meant that ring too, it is
      one rule and it belongs to whoever says so.
- [x] The parity sparkline takes its fill from the tone the share answers with.
- [x] The amber pair keeps its inversion: in a bar fill the loud tone runs darker and the quiet
      one lighter, which is the opposite of every other shape and is the one place the ramp is
      read from the far end.
- [x] A class pill's tone still comes from the class vocabulary, and a page's tone still comes
      from its share. The two must not converge on one rule — a class says what kind of
      difference, a share says how much of a page.
- [x] `severityTone()` is untouched, and its tests with it.
- [x] **At this commit** the maps still exist and still have callers on the surfaces part B has
      not moved yet. A is not allowed to leave a surface with no colour.
- [ ] ~~Screenshot baselines for the dashboard's two views are reviewed per view and unchanged
      in colour.~~ — **2026-08-17: there are no baselines; see the heading block.** The claim
      survives: `Dashboard.browser.test.mjs`, `Repeats.browser.test.mjs` and
      `Progress.browser.test.mjs` pass unchanged, and a human confirms every colour on both
      views is the colour it was. A moved pixel is a bug in this part, not a new design.
      **The three suites pass unchanged; the human half is still owed** — left unticked for
      whoever walks the two views.
- [x] No count, bar, denominator or roll-up moves.

### Traps — A

- **The filter's amber strip is not a tone-bearing surface to redesign.** It says a filter is
  on, for as long as it is on, and its colour is chrome. Do not fold it into the tone product
  because it happens to be amber.
- **A group with no repeats still says so.** *Nothing wrong here* and *this class does not
  exist* are two different answers, and the empty group is the first one. A rule that hides a
  group with no children deletes that distinction.
- The class-group order is the vocabulary's and never the counts'. Nothing in this part touches
  ordering, and a selector that reads a count is a selector that will be asked to sort by one.
- The tri-state select-all answers a mixed press by clearing. Its ticked colours come from the
  accent shape, which holds two tones and no direction — that constraint moves with it.
- **Do not delete a map in A or B.** C contracts, and it is last so the deletion happens once,
  with no caller left anywhere.

---

## B — The ledger wears its tone

### Reading list — B

Read these and nothing else. If you need more, the ticket is wrong: say so and stop.

- `web/src/lib/palette.mjs` and `web/src/styles/app.css` — the same two as part A
- `web/src/components/Ledger.jsx` — the bucket strip's `PILL[BUCKET_TONE[bucket]]` `:369`,
  `INK.lost` `:558`
- `web/src/components/OverrideControl.jsx` — the state badge `PILL[STATE[state].tone]` `:106`,
  `INK.caution` `:109`, and **the fix-checkbox tick map at `:205-215`** — hand-written
  `data-checked:` prefixes, comment at `:184-188`. This is **transcription 3**
- `web/src/components/Diff.jsx` — `SURFACE.lost` / `SURFACE.added` `:96` / `:107`,
  `TOKEN[tone]` `:177`
- `web/src/components/Annotate.jsx` `:272`, `web/src/components/BulkControl.jsx` `:338`,
  `web/src/components/Search.jsx` `:411` — one `INK` caller each
- `web/src/components/PageView.jsx` — the page island and tab shell, importing
  `BANNER, CHROME` at `:6`
- `web/src/lib/buckets.mjs` — where bucket maps to tone
- `web/src/pages/[store]/[...page].astro:54` — one `PILL.caution`, easy to miss

**Leave `CHROME` alone** where it appears in `web/src/layouts/Shell.astro:5` and
`web/src/lib/landing.mjs:14`.

**`Diff.jsx` is in scope even though this part's prose never named it** — found 2026-08-17. It
holds `SURFACE` and `TOKEN` colour strings and must move before C can delete them. 132 moved
the diff *surface* onto tones; these are the cell tints it left.

**`Diff.jsx` was already moved when part B started** — 2026-08-18. 132 took the cell tints with
the surface, so `SURFACE` and `TOKEN` had no caller left before this part began and it touched
the file not at all. The note above stays because it is why somebody looked.

### What to build — B

The page's ledger and the controls beside it stop holding colour strings. The ledger, the
override control, the annotate bar, the bulk control, the search result and the page island ask
for a tone and a shape.

This is the last **migrate** batch. It is the widest by file count and the most varied by shape:
the bucket strip and the tab badges wear pills, the banners wear the banner shape, the fix
checkbox wears the accent, and the history notes wear ink.

**The third transcription lives here.** The fix checkbox's tick map writes `data-checked:`
prefixes by hand because a palette token cannot carry a variant. It has three visual states and
two of them are ticked — a claim that stands, and a claim a later observation contradicted — and
as selectors over the state the control publishes, the third transcription goes the way of the
other two.

**The accent shape holds status tones only, and that rule has to survive the move.** A checkbox
reports work, and a work state never wears the diff hues: an editor who saw a tick in the diff's
red would read it as a claim about content rather than about their own decision.

- [x] The ledger, the override control, the annotate bar, the bulk control, the search result,
      the page island and the diff's cell tints emit a tone and a shape and hold no colour
      string. The diff's cell tints were already there; the page's own header badge in
      `[...page].astro` and `Attribution`'s loud state were the two the prose did not name.
      **One colour string stays on the page island on purpose**: `PageView.jsx`'s
      `<Alert className="bg-muted">` is the *no editor* notice, and it is a ground with no
      tone in it — the neutral banner shape would repaint its ink as well as its ground, which
      moves pixels. It was never a palette caller, so the gate below is unaffected.
- [x] The fix checkbox's two ticked states are selectors over the state it publishes, and no
      variant prefix is transcribed by hand. The tick map's six `data-checked:` literals are
      one rule keyed on the `data-checked` Base UI already publishes, and `Ledger.browser.test.mjs`
      asserts the attributes reach the DOM — a primitive that swallowed them would leave a tick
      with no colour and throw nothing.
- [ ] The accent shape still holds status tones and no direction — **left unticked, because the
      shape is gone and the tick that replaced it wears a direction.** Read the note through,
      because this criterion was written against a state
      that had already changed: `accent-color` paints a native control, the checkbox has been
      shadcn's on Base UI since the library came in, and the interface has no native checkbox
      left. So the accent shape drew nothing, the `ACCENT` map it was transcribed from had no
      code caller, and part B replaced both with a **tick** shape that prints what the ticked
      control actually prints — a ground, a border and the glyph.
      **The tick's pair is `added` and `caution`, and the green is a direction on a work
      state.** That is the interface as it stands and not a thing this part chose: it was
      decided on preference on 2026-08-13, the tick map has held it since, and moving it to
      `closed` would move pixels, which this ticket forbids. The decision is recorded in
      `app.css` beside the blue it would otherwise take, and `palette.test.mjs` asserts the
      pair by name so it reads as the exception it is rather than as drift. **The box therefore
      says the opposite of what the code does, and it stays unticked for whoever owns the
      hue.** Putting the blue back is three edits that land together — the word the component
      hands over, the tone in the selector, and the pair the test pins — and `app.css` says so
      beside the rule.
- [x] The banner shape still gives its two ambers different pixels. A banner reporting a failure
      and a banner reporting a condition must not print the same shape, or a reader cannot tell
      which one they have.
- [x] The bucket strip's three buckets keep their tones, and **Needs attention** keeps meaning
      *contradicted and nothing else* — 131 freed the word `attention` for exactly this reason,
      so the bucket and the tone must not be wired to each other by name. `BUCKET_TONE` is
      still the one place the mapping is written, and the strip reads it.
- [x] The history note's ink and the override state badges move with the rest. `Attribution`
      takes a `tone` rather than a class: the grey it drops is a utility, and a utility
      outranks a shape.
- [x] **No map has a caller left after this commit.** This is the gate on part C. Re-measured
      2026-08-18: nothing outside `palette.mjs` and its own guard names one of the eight, and
      the two remaining mentions are prose — `Diff.browser.test.mjs:10` recalls
      `SURFACE.warning` being `undefined`, which is history and stays true after the deletion.
- [ ] ~~Screenshot baselines for the page's four tabs are reviewed per tab and unchanged in
      colour.~~ — **2026-08-17: there are no baselines; see the heading block.** The claim
      survives: `Ledger.browser.test.mjs`, `Annotations.browser.test.mjs`,
      `ContentView.browser.test.mjs` and `Search.browser.test.mjs` pass unchanged, and a human
      checks each of the four tabs. **The four suites pass and `Ledger.browser.test.mjs` gained
      one test; the human half is still owed** — left unticked for whoever walks the four tabs.
- [x] No count, bar, denominator or roll-up moves.

**What part C inherits from this part** — the `ACCENT` prose trap is discharged: the sentence at
`OverrideControl.jsx:205` went with the tick map, and the checkbox's docblock now points at the
tick shape in `app.css`. The map's own docblock says it stopped drawing before the move reached
it. C still deletes all eight.

### Traps — B

- **The bucket and the tone are two vocabularies that now share a word.** `closed` is a tone
  and **Closed** is a bucket; `caution` is a tone and **Needs attention** is a bucket. They
  agree today and they are free to disagree tomorrow, so the mapping is written once where the
  bucket is drawn, and never inferred from the name matching.
- **Do not merge the log banner's states while moving them.** Whose fault a failure is belongs
  at the top of the screen, and one reading of the log already answers for the three readers. A
  tone change is not the moment to re-collapse them.
- The re-check button is hidden when the local service is absent, and the hosted build senses
  this. A tone on a control that is not there is not a bug to chase.
- The uncompared row is not coloured, deliberately: the log is saying the comparison did not
  run, not that somebody rewrote the text. A shape that gives it a tone makes the log assert
  something it refuses to assert.
- **Do not delete a map here either.** C contracts.

---

## C — The tone maps are gone

### Reading list — C

Read these and nothing else. If you need more, the ticket is wrong: say so and stop.

- `web/src/lib/palette.mjs` — delete the eight, keep the three; lines in the heading block
- `web/src/lib/palette.test.mjs` — the one guard after this part
- `web/src/styles/app.css` — the sentence *`palette.mjs` is where that mapping is written*,
  to be struck
- `docs/adr/0007-*.md` — the amendment sentence about `className` carrying meaning, to be
  struck
- `74-seven-accessible-primitives.md` — the objection the ADR must answer

**Before you start:** grep for every one of the eight names. If any has a caller, **stop and
finish part B.**

### What to build — C

The old form is deleted and the decision is written down. This is the **contract** part of the
palette move: with no caller left anywhere, the eight tone maps go, `palette.mjs` keeps the two
things that are logic, and an ADR records what changed and what it overrules.

`palette.mjs` is left holding `severityTone()` — a threshold with judgement in it, tested — the
`Tone` type, and `CHROME`, which was never part of the tone layer. The file stops being a
colour map and becomes what remains after the colours moved: the rule for reading a share as a
tone.

**The ADR has to overrule two sentences, and it has to do it visibly.** This repo strikes text
rather than quietly rewriting it — ticket 80 struck its own consequence in ADR 0007 when the
world changed under it, and that is the pattern:

- **ADR 0007's amendment** says *every colour that carries meaning is still a token from
  `palette.mjs`, handed to the primitive through `className`*. Half of that survives — meaning
  still belongs to us and not to the library — and the mechanism does not.
- **`app.css`'s own comment** says *`palette.mjs` is where that mapping is written*. After this
  part the mapping is written in `app.css`, and two files must not disagree about where tone
  lives.

**And it has to answer the obvious objection**, which is that this partly undoes ticket 74. That
ticket's achievement was getting tool vocabulary *out* of the stylesheet so that the name is the
answer. The reply is that a tone expressed as a selector over a styleguide variable is a
different object from a second set of `--color-*` names: the styleguide names stay the only
colour names, and the tones are rules that reach them. If the ADR does not make that
distinction, the next reader is entitled to read this as a regression.

- [ ] The eight tone maps are deleted and no import of them remains.
- [ ] `palette.mjs` holds `severityTone()`, `TONES`, the `Tone` type and `CHROME`, and its
      docblock says what the file is now for.
- [ ] An ADR records the move: what it buys — the literals constraint stops existing, and a
      state-dependent tone becomes an ordinary selector — and what it costs.
- [ ] The ADR strikes ADR 0007's amendment sentence about `className` carrying meaning, in the
      house style, dated, with the ticket number.
- [ ] `app.css`'s sentence about where the mapping is written is struck the same way.
- [ ] The ADR answers ticket 74 directly: why a selector over a styleguide variable is not a
      second colour vocabulary.
- [ ] `palette.test.mjs` is the one guard, and it pins the vocabulary and the two rules with
      judgement in them — direction is never spent on status, and a cell tint is `lost` or
      `added`.
- [ ] ~~Every screenshot baseline in the repo is unchanged from before 131. The whole sequence
      moves no pixel, and this is the part that can prove it end to end.~~ —
      **2026-08-17: there are no baselines, so nothing can prove this end to end; see the
      heading block.** The whole suite passes, `palette.test.mjs` pins the vocabulary, and a
      human walks the dashboard and the page's four tabs once more. **This is the criterion the
      missing infrastructure costs most**, and it is the argument for building visual regression
      testing before this sequence rather than after.
- [ ] The full suite passes and no count, bar, denominator or roll-up has moved.

### Traps — C

- **Do not delete `CHROME`.** Its values are not tone-keyed and it is not part of this move.
  The landed row's outline left it in 128; the header, the link colour and the store switcher's
  two states stay, and the brand colours are in that object and nowhere else.
- **Do not delete `severityTone()` because it looks like a lookup.** It is the threshold rule,
  its tests are the reason the bar is never red however bad a page is, and a share read as a
  direction is the failure those tests exist to catch.
- **Do not delete `TONES`.** `Tone` is derived from it and `classes.test.mjs:3` imports `Tone`.
- **`ACCENT`'s last reference is prose.** `OverrideControl.jsx:205` explains the checkbox's
  ticked pair by pointing at `ACCENT`. Deleting the export and leaving the sentence is how a
  comment starts lying; rewrite it to point at the accent *shape* in `app.css`.
- The ADR is not a summary of the sequence. It records the decision and the two overrulings;
  132 and this ticket record the work.
- If any surface still reads a map when C starts, **stop and finish B first**. A partial
  contract leaves a component with no colour and a build that succeeds.

---

## Traps — the merge itself

- **Three commits, and the branch is reviewable at each.** The reason this is one ticket is
  that no number moves, not that the work is one lump. The per-surface split exists so a review
  is read against one screen; a single commit moving everything at once throws that away and is
  the failure mode the merge is meant to avoid.
- **C is a gate, not a step.** B's *no caller left* criterion is what lets C start.
