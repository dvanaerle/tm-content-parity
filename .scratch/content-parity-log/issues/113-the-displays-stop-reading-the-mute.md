# 113 — The displays stop reading the mute, and the toggle gets its name back

Type: build
Status: resolved
Blocked by: 112
Parent: ../map.md

**What to build:** nothing on screen consults the muted state any more. The progress bar
counts open against closed with nothing outside it, the noise toggle is *Ruis tonen* and
does one job, and the dashboard index stops carrying a field whose only reader was the
mute key.

This is the middle of an outside-in removal: 112 took the writers, this takes the readers,
114 takes the thing they were reading. Every step is green because nothing is deleted until
it has no callers.

## What changes

- **The progress bar.** The *N gedempt (buiten de teller)* line goes, and the denominator
  stops subtracting. `CONTEXT.md` is already level with this: a difference in a shown class
  is either open work or work an editor closed, and whether something is work at all is a
  property of the **class** and never of a place on a page.
- **The noise toggle** becomes *Ruis tonen*: the classes whose visibility is `diagnostic`,
  and nothing else. Every predicate that kept a row when `noise || (shown && state !==
  'muted')` loses its second clause. A landing no longer turns the toggle on because its
  target is muted.
- **The search** stops excluding `muted` from *still work*.
- **The dashboard index** drops `anchorHeading` from its finding entries. `reports.mjs`
  states its own reason for carrying it — *"because ticket 88 put it in the mute key.
  Without it a section mute would read on the dashboard as a mute of the whole class"* — and
  that failure cannot occur once mutes do not exist.

## Acceptance criteria

- [x] The bar draws open, needs-attention and closed, and no fourth number. The denominator
      is the shown findings on the snapshot, full stop.
- [x] The toggle reads *Ruis tonen* and shows only `diagnostic` classes. Its independence
      from the tab — each borrowed by a landing and released on its own — still holds, and
      its browser test still passes.
- [x] `anchorHeading` is gone from the index payload, and the index gets smaller. Record
      the gzipped size of `nl`'s index before and after; the comment that justified the
      field also documented the payload as the costly one.
- [x] The anchor heading is **untouched as a locator**. A finding on a page still says
      *onder "…"* with its jump links, from the page's own report. If that line changes,
      this ticket is wrong.
- [x] No screen changes what it draws for any finding that is not muted — and after 111
      there are none.
- [x] The derivation still produces `muted`. It has no readers after this and that is the
      point; 114 deletes it.

## Traps

- **`state !== 'muted'` is not the same as `shown`.** The predicates are two conditions and
  only one of them goes. A row that is hidden by class must stay hidden by class.
- **The landing's toggle-borrowing has its own browser test**, and it uses a muted target to
  prove the toggle and the tab are released separately. That test needs a new subject —
  a `diagnostic` class — not deletion. Losing it would lose the rule.
- **Two size numbers, one direction.** The index shrinks here and `nl`'s open count rose in
  111. Do not report them together; ticket 86's reasoning applies — one number hiding two
  movements is how a measurement stops meaning anything.

## Answer

Nothing on screen consults the muted state. 688 tests pass across both projects and the
Astro build completes — 823 pages. The derivation still produces `muted` and now has no
reader; 114 deletes it.

### What went

- **`barOf()` in `overrides/state.mjs`.** The `muted` count and the subtraction, so
  `denominator = shown.length` and the returned bag has six fields where it had seven. The
  rule doc above it says *nothing leaves the denominator* in place of the mute's bullet.
  `deriveStoreState`'s `totals` drops the same key — it sums by iterating its own keys, so
  it and `barOf` had to move together or the roll-up would have summed `undefined`.
- **`Progress.jsx`** — the *N gedempt (buiten de teller)* span.
- **`Ledger.jsx`** — `&& finding.state !== 'muted'` from the row filter *and* from
  `hiddenCount`, which is the same predicate written twice. The label is *Ruis tonen*.
- **`view.mjs`** — the same second clause in `prepareRows`, and the two doc lines that
  described the toggle as showing muted rows.
- **`landing.mjs`** — `needsNoise` is `Boolean(tab) && !target.shown`.
- **`search.mjs`** — `isActive` is now `state !== 'dismissed' && state !== 'fixed'`. Turning
  it negative is what stops it excluding a fourth state, and it now reads as the mirror of
  `barOf`'s `closed = dismissed + fixed`, which is what its comment always claimed it was.
- **`reports.mjs`** — `anchorHeading` off the index entries, its typedef and the bullet that
  justified it.

### The index, and the one number

`nl`'s finding index, 4,784 shown findings, measured by gzipping
`loadSummaries('nl')`'s findings the way the comment above it was measured:

| | raw | gzipped |
| --- | --- | --- |
| before | 1,137,376 | **185,506** |
| after | 855,376 | **165,556** |

**19,950 bytes off the gzip, 10.8%.** Ticket 86's rule is why that is the only number in
this section: `nl`'s open count also moved, in 111 and again here as the bar stops
subtracting, and one figure covering two movements measures nothing. Confirmed on the built
output rather than on the loader alone — `dist/nl/index.html` contains no `anchorHeading`.

### The anchor heading is still a locator

`[...page].astro` reads `loadReports()`, not `loadSummaries()`, so *onder "…"* comes from
the page's own report and no part of this diff touches it. `dist/nl/downloads/index.html`
still carries the field. `mute.mjs`'s `sectionName()` and `Annotations.jsx` are untouched.

### The traps

- **The two conditions.** Every predicate kept `shown` and lost only the state clause, and
  `view.test.mjs` still asserts both directions of the class case — a `text-added` row
  appears only with the toggle on. The test that used to prove a muted row sat behind the
  toggle now asserts the opposite and says why: a decision never moves a row behind it.
- **The browser test kept its rule and got a new subject.** `landing.browser.test.mjs`
  proves the tab and the toggle are borrowed and released separately, and `askedForBoth` is
  now documented as a `redirect` finding — `check: 'links'` and a class the tool does not
  show, so it still needs both controls. `useLanding` takes `asked` as data and never asked
  why, so the three cases are unchanged and still pass.
- **Dropping `anchorHeading` cannot change a dismissal.** `clearedEventFor()` only reads it
  when `state === 'muted'`, so the dashboard's bulk clear over `dismissed` rows is
  untouched.

### What dropping the index field does reach, named honestly

Two things read `anchorHeading` off the summaries index, and both are mute-only. Neither is
a screen and neither is reachable, but *"nothing else reads it"* would have been too strong:

- **`derivePageState()`** builds the section mute key from `finding.anchorHeading ?? null`,
  so on the dashboard every summary finding now keys to the headless slot. That is exactly
  the failure the deleted comment named — a section mute reading as a mute of the whole
  class — and it is unreachable for the reason the ticket gives: 111 confirmed by query that
  no `muted` row is the latest event on any key, so there is no section mute to mis-key.
- **`bulkMute()`** now sees `undefined` for every entry, lands them all in `unknown` and
  refuses whatever it is handed. That is the function obeying its own documented rule —
  *undefined* means *I do not know which section this is* and must never become *null* — not
  a fault introduced here. It has had no component caller since 112 and its tests build
  `byFinding` by hand, so nothing goes red. Said so in a comment at the seam, because a
  green suite is not evidence about a function only fixtures call. 114 deletes it.

### Prose the change falsified, fixed with it

The review caught four comments that this diff made untrue. They are listed because in this
codebase a stale rationale is a defect:

- **`docs/adr/0005`** — not superseded, and it still asserted *"a mute still takes findings
  out of the denominator"*. Amended in place, pointing at 0011. This one matters most: 0005
  is live doctrine, and the amendment is what makes class visibility the **only** answer to
  *is this work*, which is the claim 0011 rests on.
- **`search.mjs`'s decision 2** — *"`linkText` is the whole reason this index is emitted at
  build time. Every other searchable field is already in `loadSummaries()`'s finding
  index."* No longer true, because this ticket took `anchorHeading` out of that index while
  leaving it a searchable field. Now names both reasons and says why the locator stays.
- **`reports.mjs`'s cost sentence** — re-measured, since the group it prices is the one
  whose payload changed: 4,784 shown findings, 69 kB → 166 kB gzipped, replacing a reading
  of 6,004 findings and 118 kB → 228 kB from a different snapshot.
- **`state.mjs`'s review rationale** — *"so muting something does not stale every review"*.

### One judgement call

`OverrideControl.jsx` keeps `muted: { label: 'gedempt' }` and keeps offering *Ongedaan
maken* on a muted finding. That is not a display of the mute so much as the way back out of
one, and removing it would leave a mute — if one existed — with a blank badge and no undo.
It is seam-adjacent and it goes in 114 with the rest.

### One review finding refused

`isActive` restating `barOf`'s closed set in a second file was raised as duplication, with a
shared `isClosed()` as the fix. Refused: it is a two-term predicate, `barOf` needs
`dismissed` and `fixed` counted separately for its own fields and so would not call the
helper, and a module exported to unify two comparisons is the speculative generality the
same checklist warns about. The coupling that matters is the comment, and it is explicit.
