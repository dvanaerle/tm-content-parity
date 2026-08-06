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

**Status:** ready-for-agent

**Implements:** spec [32](32-scannable-log-and-six-stores.md), phases 3, 6 and 8.

- [ ] The storefront's 22 brand hexes are transcribed by hand into one Tailwind 4
      `@theme`. The storefront config cannot be imported — it is Tailwind 3
      CommonJS and needs a Hyvä Node package at require-time.
- [ ] Brand colour is spent on **chrome only**: header, navigation, focus rings,
      links.
- [ ] **Red and green are reserved for diff meaning and never for status.** The
      brand primary is dark green and the accent orange; status messages use
      amber and blue.
- [ ] Stock neutral greys carry the table surface. The storefront's neutral ramp
      is five steps with a hole where borders, zebra stripes and hover states
      live.
- [ ] A monospaced family is added for the comparison cells.
- [ ] The four overlapping colour maps collapse onto the `@theme`.
- [ ] A **browser-safe pure module** holds the word-level diff — two normalised
      strings in, a list of unchanged / removed / added spans out. No
      `node:crypto`, so an island imports it directly. **This is the one new test
      seam in the whole spec.**
- [ ] The algorithm is **word**-level over whitespace-split tokens with an LCS
      backbone. Character-level on Dutch compounds produces confetti.
- [ ] The diff is computed on normalised text and normalised text is what is
      rendered — tier 1 folds invisible differences deliberately, and diffing raw
      would paint differences the tool classifies as equal. Raw is reachable
      through a copy button.
- [ ] Two layers: a lost row's production cell red, an added row's new cell
      green, a changed row neutral with removed and added **tokens** coloured
      inside it.
- [ ] One diff component used in four places, including link findings — word-
      diffing two target URLs makes the changed path segment jump out.
- [ ] **The `<head>` panel** renders with the diff treatment and emits **no
      findings**; ticket 21 stays open. It is framed as display-only, with no
      override controls.
- [ ] Absolute URLs in meta are host-folded before comparison, reusing the
      existing link-key folding.
- [ ] Canonical is hidden **directionally**: hidden where production has none and
      the new site does (147 pages), kept and flagged where the new site lost one
      (2 pages).
- [ ] `h1` leaves the meta panel — the content view owns it, with position, level
      and a finding id.
- [ ] `noindex` stays visible.
- [ ] Tests: the word-diff module at the compare seam (identical strings, one-word
      substitution, head and tail insertion, empty on each side); host folding;
      **both** directions of the canonical rule.
