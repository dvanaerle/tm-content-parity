# 33 — The class vocabulary: direction, and the changes the log cannot see

**What to build:** an editor opening any page can tell, without inspecting the
columns, whether production lost something or the new site invented something —
and a heading demoted from `h2` to `h3` stops being reported as identical.

Today `structure` is 61% of everything shown and says only "the element is on one
side only". A dropped paragraph and an invented one carry the same word, and the
invented ones are mostly a PageBuilder rebuild rather than a defect. Separately,
the pairing matches on normalised text while ignoring tag and kind, so **762
elements on 67 pages** match on text but differ in tag or heading level and are
rendered as *"gelijk"* — 467 of them a heading-level change.

After this ticket the log says less and means more: the invented side goes quiet,
and 467 real structural regressions appear for the first time, including the 16
pages where the new site dropped its `h1`.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

**Implements:** spec [32](32-scannable-log-and-six-stores.md), phase 1.

- [ ] `structure` is retired. `text-missing` (production has it, the new site
      does not) is **shown**; `text-added` (the new site has it, production does
      not) is **hidden**. Same directional split as `missing-link`/`extra-link`
      and `image-missing`/`image-added`.
- [ ] Two elements that match on normalised text but differ in tag or heading
      level stop being an exact match and become a finding: `heading-level`
      (**shown**) when either side is a heading, `tag-changed` (**hidden**)
      otherwise.
- [ ] A pair with the same text and the same tag is still an exact match and
      emits nothing.
- [ ] The closed class vocabulary goes from 18 to 21, each with its check, axis
      and shown/hidden default, and the browser reads it through the existing
      browser-safe module.
- [ ] The 0.6 pair threshold is **not** touched.
- [ ] **Measurement written into `map.md` between the two changes above**, not
      only at the end — the split and the new classes move the count in opposite
      directions and must not be measured as one number. Baseline to beat: 10,076
      findings, 8,573 shown, median 41 a page, 179 crawled, 124 comparable.
- [ ] The 434 cases where `kind` changes (mostly `a` → `h3`) are sampled and
      judged: if they are an extraction artefact, that is a bug fix in this
      ticket, not a class.
- [ ] Overrides keyed on `structure` detach. This is accepted and recorded, not
      migrated.
- [ ] Tests at the existing compare and contract seams. `structure` gone from the
      contract; finding ids for untouched classes unchanged.
