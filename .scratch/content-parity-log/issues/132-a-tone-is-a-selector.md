# 132 — A tone is a selector

Type: task
Status: resolved 2026-08-18 — built in `66145d9`, corrected in `d449b73` and `cbe3837`, on
`ticket-104-search-page-scope`. Three criteria shipped differently. **A shape is `data-wears`
and not `data-shape`**, because `shape` reads as the noun shadcn owns; the stylesheet's own
prose records that line. **There are eight shapes, not the six this ticket counted** — `token`
and `surface` were maps too. And **only the diff emitted anything**: the content view holds
`CHROME.link` alone, which this ticket keeps out on purpose, and the annotation marks hold
`text-muted-foreground` and nothing tone-keyed, so neither had a tone to emit. Built ahead of
**128**, which is still `ready-for-agent`: 128 records a policy for ADR 0007 and 127 already
supplied the CSS this needed, so the blocker was documentary rather than technical.
Blocked by: 128 — the convention a state-dependent tone follows. 131 — the names this
transcribes.
Parent: ../map.md

**What to build:** the stylesheet learns the eight tones, and the diff wears them. This is
the **expand** half of the palette move: the CSS form arrives beside the JavaScript maps,
both work, and one surface moves over to prove the shape before the other two follow.

The reason for the move is one sentence in `palette.mjs`, and it is the root of every
workaround in the styling layer:

> Tailwind finds class names in the source text. Therefore each value in this file is a
> literal, and no value is assembled from parts.

That constraint is not satisfied by the move — it stops existing, because there is no class
name for Tailwind to find. And it is what forced three separate transcriptions: a pressed
tone with a hard-coded variant prefix, a tick map with `data-checked:` prefixes written by
hand, and a tab height behind a group-data modifier. None of those is a palette problem. All
three are the same problem: **a tone that depends on a state cannot be a literal, and
everything in the palette must be a literal.** As a selector it is ordinary.

**Shape and tone separate.** A tone becomes a small set of custom properties — the ground, the
ink, the solid step — and a shape becomes a rule that consumes them. Six shape tables over
eight tones stop being an enumeration of forty-two strings and become a product, with the
irregularities written as explicit overrides rather than hidden inside a pattern that pretends
to be regular.

**The diff moves first** because it is the smallest surface and because it is where the
assertion CSS cannot make itself has to live. A cell tint claims *this content is missing on
the other side*, which only `lost` and `added` claim. In JavaScript a map with two keys refuses
a third. A selector that does not match fails silently, so nothing stops somebody writing a
status tone on a diff cell and getting no colour and no error.

**`CHROME` and `severityTone()` stay where they are.** `CHROME`'s values are not tone-keyed —
it is a named-chrome map, not a shape over the tone vocabulary — and `severityTone()` is logic.
Keeping both out shrinks the blast radius of 133's migration without leaving anything behind.

- [x] `app.css` defines each of the eight tones and each of the shapes, in a layer, so a
      component asks for a tone and a shape rather than for a colour.
- [x] The stylesheet carries the reasoning that lived in `palette.mjs` — why `lost` and
      `added` are the only red and green, why a third loud hue must be the brand colour, why
      the word layer inverts, why the two ambers run one way in a fill and the other way in a
      banner. If that prose does not arrive, the move is a downgrade whatever the code looks
      like.
- [x] The irregularities are explicit rules and not casualties of the pattern: the solid shape
      keeps `caution` unsolid, the ink shape keeps its four tones, and the cell and word shapes
      keep their two.
- [x] The content view, the diff and the small annotation marks emit a tone and a shape, and
      hold no colour string.
- [x] `palette.test.mjs` reads the stylesheet and asserts: eight tones defined, every tone any
      component emits is one of the eight, no status tone's rule reaches a direction colour,
      and the two ambers do not print the same pixels.
- [x] A test fails if a diff cell carries anything but `lost` or `added`. This is the
      assertion the type used to make and CSS cannot.
- [x] The JavaScript maps still work and still have their callers. Nothing outside the diff
      surface has moved.
- [x] The diff's screenshot baselines are unchanged. Every colour on screen is the colour it
      was.

## Traps

- **Do not delete a map in this ticket.** Expand means both forms exist. **133 part C**
  contracts, and it is last in 133 for that reason. (133 absorbed 134 and 135 on 2026-08-17;
  the contract is that ticket's part C.)
- **Do not let the product flatten the sparse shapes.** A tidy eight-by-six grid would give
  the solid shape a solid `caution` and the cell shape six tones it must never have. The
  irregularity is the decision.
- **Do not put tone names into `@theme` as a second set of `--color-*` names.** That is exactly
  what ticket 74 removed, and its reasoning stands: a second vocabulary on top of a palette
  that already has one means only the mapping file can tell you what a name meant. Tones are
  *selectors* mapping to styleguide variables — a different object from a second set of colour
  names, and the ADR in **133 part C** has to say so.
- Use only what 127 permits. Attribute selectors, custom properties and cascade layers are all
  Widely Available; container **style** queries — the feature that looks made for this — are
  Newly Available 2026 and refused.
- The word layer sits inside the cell layer and has to stay legible against it. That is the
  only reason there are three weights of each direction colour, and a rule that reads the cell's
  tone from inside the word will get it wrong.
