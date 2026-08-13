# 112 — *Dempen…* leaves the interface

Type: build
Status: resolved
Blocked by: 111
Parent: ../map.md

**What to build:** there is no longer any way to make a mute. Both buttons go, and
everything written to explain the choice between two judgements goes with them, because
there is one judgement left.

The seam still exists after this ticket and is still tested. That is deliberate: this is
the visible half, it is small, and it lands on its own so the risky deletion in 113 and 114
is not mixed into a diff anybody has to look at on screen.

## What goes

- The single control's *Dempen…* action and the two forms behind it — *Deze sectie dempen*
  and *Hele pagina dempen*, with their counts.
- The bulk press *Dempen op N pagina's…* and its form. The floating selection bar ends with
  two presses: *Negeren op N pagina's…* and *Ongedaan maken op N pagina's*.
- The sentence explaining how the two judgements differ, and the *two eligibilities* line
  saying that one press skips a decided page while the other counts it. Both exist only to
  tell a mute from a dismissal.
- The refusal copy for a difference sitting before the first heading. It refused a mute; it
  has nothing left to refuse.

## Acceptance criteria

- [x] No screen offers a path to a `muted` event. Grep the components for the label and
      find nothing.
- [x] A difference whose every finding is already decided offers **only** *Ongedaan maken*,
      and the bar says why there is nothing to negeren. The mute used to be the last tool
      standing there; that case is now correctly empty and must not read as a broken screen.
- [x] The bar still names its difference, still counts over the ticked pages, still reports
      *N van M opgeslagen* on a partial failure.
- [x] The *no editor name* sentence still stands where the presses would be.
- [x] Both remaining presses are still covered by a mounted-and-clicked test in the
      `browser` project. Ticket 31 shipped a `BulkControl` referencing an undefined
      `MuteForm`; 628 unit tests passed and the dashboard island threw on press. Deleting
      from this file has the same hazard.
- [x] The seam is untouched. `bulkMute()`, `muteForms()` and `muteCoverage()` still exist
      and still pass their tests; they lose their callers, not their meaning. 114 removes
      them.

## Traps

- **The refusal copy is load-bearing elsewhere.** Check whether the before-first-heading
  wording is shared with anything that is not the mute before deleting it.
- **`sectionName()` has two readers.** The bulk form imports it from `mute.mjs` precisely so
  the two presses describe one concept in one wording. Only one of the two goes here.

## Answer

Both writers are gone and the seam is untouched. 681 tests pass across both projects, and
the Astro build completes.

### What went

- `OverrideControl.jsx` — the *Dempen…* action and `MuteForms` entire, with the `muteForms`
  import, the `'mute'` arm of `asking`, and the `findings` prop that existed only to count a
  mute before the press. `Ledger.jsx` stops passing it.
- `BulkControl.jsx` — the *Dempen op N pagina's…* press, `MuteForm`, `TwoEligibilities`, the
  `bulkMute` memo and the `bulkMute`/`sectionName` imports.
- `Choice` becomes `NothingToDismiss`. It was a **comparison** — *negeren vervalt zodra een
  van de twee teksten verandert; dempen vervalt niet* — and with one judgement left there is
  nothing to compare. What survives is the half that explains an absence, and it is now
  drawn only when `dismissal.covers === 0`, which is the case the criteria single out.
- `Repeats.jsx` — `NoMute`, `WHY_NO_MUTE`, the `refusesMute()` memo and the `refuses` prop
  down through `PageTable`.
- `Dashboard.jsx` — `findingsByPage` out of the `bulk` bag. Its only reader was `bulkMute()`.

### The two traps

- **The refusal copy was not shared.** The before-first-heading wording exists in three
  places and only the interface copy went. `WHY_NO_MUTE.headless` in `Repeats.jsx` was the
  mute's alone and is deleted; `refusalFor()` in `bulk.mjs` is seam and stays for 114; and
  `sectionName()`'s *in de inhoud vóór de eerste kop* is the honest **name** of a section,
  not a refusal, and is still read by `muteForms()`.
- **`sectionName()` kept the right reader.** `BulkControl.jsx` was one of two importers and
  is the one that went. `mute.mjs` still calls it internally at its own line 31, so the
  module is unchanged and `mute.test.mjs` still passes.

### One stale string beyond the list

`Progress.jsx`'s read-only banner said *Afvinken, negeren en dempen zijn uitgeschakeld*. It
names controls rather than states, so it belonged with the presses rather than with 113's
readers; it now reads *Afvinken en negeren*.

### The tests

The mute press's browser test, the refusal-mark test and the two-eligibilities test are
**deleted** rather than inverted: an assertion that a removed button is absent can never
fail again, and the criteria ask for a grep, not a test. What replaced them is positive —
the decided-throughout case now asserts the sentence *er is niets te negeren* is on the bar
beside the lone *Ongedaan maken*, which is the criterion about the screen not reading as
broken. The dismissal and the clearing are still each mounted, clicked and asserted on.

### What the review changed

- **The sentence says *afgehandeld*, not *beslist*.** `offersDismissal()` withholds the
  press on `fixed` as well as on the two judgements, so this line is drawn over a difference
  somebody merely ticked off as corrected. *Beslist* would call a claim of fact a judgement,
  which is the one distinction the control exists to keep. *Afgehandeld* is the word the row
  above already uses of the same findings and is true of both. The wording was inherited
  from the old `Choice` else-branch, where it was a fallback; this ticket promotes it to the
  case it names, which is what made the imprecision worth paying for.
- **Two stale comments.** `Covers` still cited `Choice` by name, and `Repeats.jsx` justified
  refusing the word *section* with a reason `CONTEXT.md` has already superseded.

**The interface no longer says a dismissal expires.** `vervalt` appears nowhere in
`web/src`: the fact was carried by the comparison, and the comparison went. That follows
from this ticket as written — the sentence *did* exist only to tell the two apart — but the
fact itself was never about the mute, and ADR 0011 leans on it. It is recorded in `Covers`'s
doc-comment rather than acted on. If it is wanted back it is a sentence of its own, not a
resurrection of the choosing.

### Still open

**111 has not been done.** Its acceptance criteria are unticked and it is a Supabase data
operation, not a source change. Nothing here depends on it: the derivation still resolves
mutes, `muteCoverage()` still answers, and *Ongedaan maken* still revokes the live mute
through `clearedEventFor()` — so the measurement 111 asks for is still available, and stays
available until 114. It must land before 114 all the same.
