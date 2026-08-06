# 35 — One visual language: brand tokens and a real diff

**What to build:** the tool looks like Tuinmaximaal, and every difference in it
reads like a diff editor — lost content red, added content green, and the changed
**words** highlighted inside a changed sentence. The same rendering on content
rows, link findings, image findings and the `<head>` panel, so the four surfaces
cannot disagree about what red means.

Today there is no highlighting anywhere: two columns of plain text, a class pill
and a number, and the editor holds both strings in their head. There are also no
design tokens at all — Tailwind 4 with no config, stock palette, and four
overlapping ad-hoc colour maps that have already drifted apart.

The token work comes first inside this ticket and is the reason the two are one:
the diff needs exactly one red and one green, defined in exactly one place.

**Blocked by:** [33](33-directional-text-classes.md) — the tints are keyed on
direction, and direction is what 33 introduces.

**Status:** resolved — built on branch `axis-a-compare-and-log`.

**Implements:** spec [32](32-scannable-log-and-six-stores.md), phases 3, 6 and 8.

- [x] The storefront's 22 brand hexes are transcribed by hand into one Tailwind 4
      `@theme`. The storefront config cannot be imported — it is Tailwind 3
      CommonJS and needs a Hyvä Node package at require-time.
      `web/src/styles/app.css`. The 22 are the 12 primary, 3 secondary and 5
      neutral values plus the two container greys; `container.lighter` is
      `neutral.white` again and is counted once.
- [x] Brand colour is spent on **chrome only**: header, navigation, focus rings,
      links. `CHROME` in `web/src/lib/palette.mjs` is the only door to it, so a
      component that wears brand green has to say it is furniture.
- [x] **Red and green are reserved for diff meaning and never for status.** The
      brand primary is dark green and the accent orange; status messages use
      amber and blue.
- [x] Stock neutral greys carry the table surface. The storefront's neutral ramp
      is five steps with a hole where borders, zebra stripes and hover states
      live.
- [x] A monospaced family is added for the comparison cells. A system stack, not
      a webfont: the build is static and is read from outside the network.
- [x] The four overlapping colour maps collapse onto the `@theme`, through
      `web/src/lib/palette.mjs`. There were six, not four — the class tone table,
      the chip table, the finding-state table, the banner table and two inline
      tone pickers. Seven **tones** replace them, and a tone is a meaning rather
      than a hue.
- [x] A **browser-safe pure module** holds the word-level diff — two normalised
      strings in, a list of unchanged / removed / added spans out. No
      `node:crypto`, so an island imports it directly. **This is the one new test
      seam in the whole spec.** `compare/worddiff.mjs`; it imports nothing at all.
- [x] The algorithm is **word**-level over whitespace-split tokens with an LCS
      backbone. Character-level on Dutch compounds produces confetti.
- [x] The diff is computed on normalised text and normalised text is what is
      rendered — tier 1 folds invisible differences deliberately, and diffing raw
      would paint differences the tool classifies as equal. Raw is reachable
      through a copy button, which appears only where `raw` and `norm` differ.
- [x] Two layers: a lost row's production cell red, an added row's new cell
      green, a changed row neutral with removed and added **tokens** coloured
      inside it. The two never fire on one cell: a one-sided cell has nothing to
      diff against, and striking a whole paragraph through says it twice.
- [x] One diff component used in four places, including link findings — word-
      diffing two target URLs makes the changed path segment jump out.
      `web/src/components/Diff.jsx`.
- [x] **The `<head>` panel** renders with the diff treatment and emits **no
      findings**; ticket 21 stays open. It is framed as display-only, with no
      override controls.
- [x] Absolute URLs in meta are host-folded before comparison, reusing the
      existing link-key folding.
- [x] Canonical is hidden **directionally**: hidden where production has none and
      the new site does (147 pages), kept and flagged where the new site lost one
      (2 pages).
- [x] `h1` leaves the meta panel — the content view owns it, with position, level
      and a finding id.
- [x] `noindex` stays visible.
- [x] Tests: the word-diff module at the compare seam (identical strings, one-word
      substitution, head and tail insertion, empty on each side); host folding;
      **both** directions of the canonical rule. 13 for `wordDiff`, 10 for
      `metaRows`, in `compare/compare.test.mjs`.

## Decided while building

**A link target is a word list too, so the tokeniser splits on `/ ? & = #`
beside whitespace.** The checklist said whitespace-split. With whitespace alone a
target is one token, the diff says only "it changed", and the one thing the
checklist asked for — the changed **path segment** jumping out — cannot happen.

**A span carries its own separators.** The tokens are alternating runs of
separator and content, so joining one side's spans reproduces that side's string
character for character; a renderer that had to put the spaces back would be
guessing where they were. The highlight itself trims the edge whitespace, because
a box around a trailing space claims that a space changed.

**`linkKey()` moved to `crawl/keys.mjs`** with `imageKey()` beside it. The meta
panel is inside a React island and needs the folding; `extract.mjs` imports
`node-html-parser`, which has no business in a browser bundle. Same split, and
same reason, as `vocabulary.mjs` out of `contract.mjs`.

## Against the resolved text

Two colours moved that the checklist did not name, both forced by the rule that
red and green are diff meaning only:

- **`broken-link` is no longer red.** It was `bg-red-100`, and red now means "the
  new site lost this". A dead link is a defect on the new site's own terms, which
  is a status, so it takes the loudest **amber** instead. `leakage` and
  `cross-store-link` join it there and give up violet, which is retired.
- **"Done" is blue, not green.** The page bar fill, the `opgelost` pill and the
  dashboard's closed counts were all emerald. Progress is status. `contradicted`
  moves off red to amber for the same reason.

Neither needed a third loud hue: the brand orange stayed on chrome, and amber in
two weights carries the whole severity ramp.

## Fixed after the review

The two-axis code review of this ticket's commit found ten things. Seven are fixed
in `5ca7796`, `f25c0e3`, `3c1d9c5` and `651cd67`, and four of the seven change what
this ticket decided:

- **The meta cells painted a canonical this ticket calls equal.** `meta.mjs` folds
  the hostname before it compares and reports the raw value, and the panel diffed
  the two raw values. So on the 18 pages that differ by hostname alone the row said
  `same` and the cells still painted the hostname. `DiffCells` takes `equal` now,
  and `MetaTable` passes `state === 'same'`.
- **`BANNER.severe` and `BANNER.attention` were one string.** The error banner and
  the not-connected banner printed the same shape. `severe` takes the deeper amber
  ground. Amber in two weights still carries the ramp.
- **`palette.mjs` was not the only door to a colour.** `Shell.astro` wrote the brand
  literals, and four components reached past the map for ink. `INK` holds the three
  ink tones a caller asks for. The rendered html did not change.
- **18 of the 22 transcribed brand hexes are gone.** `@theme` makes a utility for
  each value it declares, so the 18 no component wears were dead CSS. The comment
  cites the storefront config for them.

Also fixed: `severityTone()` has tests, so does the reservation of red and green;
the five `null` tones in `SURFACE` and the two unread `CHROME` entries are deleted;
the new prose is in Simplified Technical English; and the probe keeps its `nu`.

**The monospaced family is for machine strings only.** The review read "a
monospaced family is added for the comparison cells" and found the content cells
proportional. That is the decision and not an oversight: a url, an image path and a
`<head>` value align character by character and are read for the one character that
changed, so they are mono. A content cell holds Dutch prose that an editor reads as
prose, and `font-mono text-xs` on a long paragraph costs more legibility than the
alignment returns. The word layer already shows which words changed.

Two findings stay open, and neither is this ticket's to close:

- `classInfo().direction` has no consumer. Folded into **ticket 39**, which owns
  that table.
- `compare/meta.mjs` imports `crawl/keys.mjs`, which inverts the layering
  `AGENTS.md` states. **Ticket 47** owns it, and it needs an ADR.

## Left for another ticket

**The two pages where the new site lost its canonical cannot be seen yet.**
`showroom-contact` and `vrijstaande-terrasoverkapping` both answer 404 on the new
site, so ticket 07 stops the comparison and the page renders *Niet te
vergelijken* with no Meta tab at all. The rule is real and tested in both
directions; what it needs is those two pages migrated, or ticket 20's decision
about one-sided pages.
