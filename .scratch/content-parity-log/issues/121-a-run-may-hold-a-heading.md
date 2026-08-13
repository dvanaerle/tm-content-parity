# 121 — A run may hold a heading

Type: task
Status: ready-for-agent
Blocked by: 120
Parent: ../map.md
Spec: [119](119-spec-the-same-words-divided-differently.md)

**What to build:** a regrouping whose run includes a **heading** is reported as one row, and
the heading it swallowed is still in the heading jump-list and still anchors — so nobody
navigating the page loses a landmark because the other site inlined it.

The case: `be/laagste-prijs-garantie`, an accepted merge at `copy` 0.93. Production sends the
heading `"Hoe kan het dat Tuinmaximaal de laagsteprijsgarantie heeft?"` and the paragraph
after it; the new site sends **one paragraph** holding both. The row reads
`REGROUPED · h3 + p → p`.

This is the only slice with a **navigation** consequence rather than a counting one, which is
why it is not folded into 116 or 120.

## Why it is not just another run

Two rules meet here and neither anticipated the other.

The leftover matcher refuses to pair a heading with a non-heading — `mayPair()` treats
heading-ness as a hard wall — and that wall exists to stop a heading matching a paragraph on
fuzzy similarity. **It must not apply to `regrouped`**, because a change of structure is the
phenomenon itself, and verbatim total coverage carries none of the risk the wall was built
for. A heading that became body text is a real structural change where every word survived.

And what is left of the retired *Outline* tab is a **heading jump-list beside the rows**,
built from production's headings. If a heading is absorbed into a `regrouped` row that
collapses by default, the naive outcome is that the heading **disappears from the jump-list** —
navigation that depends on the new site's markup, which is backwards for a view whose spine is
production order.

## What must stay true

- **The jump-list is built from production's heading units**, regardless of which row absorbed
  them.
- **Jumping to an absorbed heading opens the regrouped row**, as `Clamp` already promises: *a
  jump to a row opens that row.*
- **The row still carries an `anchorHeading`**, even when the run contains the heading that
  would otherwise anchor it.
- **`detail` names the heading**: `h3 + p → p`. The detail is doing real work in this case — it
  is the only place the log says a heading became body text — and it is part of the finding id.
- The class stays `regrouped` and stays `information`. This is not promoted to work: no word
  was lost. Whether a heading becoming body text should *itself* be work is a separate
  question and not this ticket's to answer.

## Acceptance criteria

- [ ] `be/laagste-prijs-garantie` produces one `regrouped` row with detail `h3 + p → p`, and
      no `copy` for those units.
- [ ] The heading `"Hoe kan het dat Tuinmaximaal de laagsteprijsgarantie heeft?"` is still in
      that page's heading jump-list.
- [ ] Selecting it in the jump-list opens the regrouped row and scrolls to it, even though the
      row is collapsed by default.
- [ ] A regrouped row whose run crosses a heading boundary still reports an `anchorHeading`,
      and the answer says which heading it picks and why.
- [ ] The heading-versus-non-heading wall still applies to the **greedy** pass. A reworded
      demoted heading must not start pairing with a paragraph as a side effect of this ticket.
- [ ] Jump-list behaviour is tested at the `web/src/lib/view.test.mjs` seam;
      `landing.browser.test.mjs` is the prior art if a case genuinely needs a DOM.

## Traps

- **Do not relax `mayPair()` itself.** The wall is correct for fuzzy pairing. `regrouped` runs
  in an earlier pass on an exact test, so it simply must not consult it — a different thing
  from removing it.
- A run may hold a heading on **either** side: production's heading folded into a new-site
  paragraph (the case above) or a production paragraph split so that the new site promotes its
  first sentence to a heading. The measurement found `p → h2 + 4×li` shapes, so both occur.
- `heading-level` is `information` after [86](86-heading-level-becomes-information.md), so a
  reader who wants heading shape reads `detail` in both classes. Keep the two details
  formatted consistently.
