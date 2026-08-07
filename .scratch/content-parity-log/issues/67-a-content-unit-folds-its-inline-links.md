# 67 — A content unit folds its inline links

**What to build:** a paragraph is compared as a paragraph. Today one inline link
discards the whole block it sits in, and only the link words are compared.

Measured on ten production pages: 62 blocks and about 3,400 words of body copy are
never compared, on 10 of 10 pages. `/overkapping` loses 928 words. In one 190-word
paragraph the log compares 35 characters — 81% of the paragraph is invisible — and
that paragraph holds a product-spec regression: production says `6063-T6`, the new
site says `6036-T6`. Nobody can find that with the tool as it stands.

The rule that causes it is the leaf rule: a node that holds another node from the tag
list is skipped, because "the children speak". The list holds `a` and `button`, and
those are the only two tags that can break a paragraph. Headings already fold their
children, so this ticket makes the general case behave like the case that was right.

See `docs/adr/0001-content-unit-is-the-editable-block.md` for the decision and the
rejected alternatives.

**Blocked by:** 66.

**Status:** ready-for-agent

**Origin:** the grilling of 2026-08-07 on the content unit. The user's argument
decided it: the unit must be the thing that is edited, and content is edited one
block at a time in PageBuilder and in the WYSIWYG editor.

- [ ] A text block folds the words of an `a` or a `button` inside it. A nested
      **block** still breaks it: an `li` gives way to a `p` inside it.
- [ ] A folded link no longer makes a unit of its own. **Generalise the swallow
      set**, which only headings fill today, or every folded link is counted twice.
- [ ] A link still makes its link record. The links check compares targets and is
      not touched by this.
- [ ] `kind` is `cta` when the whole unit is one anchor or one button, whatever tag
      emitted it. Without this a CTA that moved between a bare anchor and a paragraph
      stops pairing, and one `copy` row becomes two one-sided rows.
- [ ] Pairing permits `cta` against `text`. The heading rule stays: a heading level
      is an editorial fact, a wrapper is not.
- [ ] The `/overkapping` paragraph is one unit on each side, and the `6036-T6`
      difference is reported.
- [ ] Tests for a nested anchor in a paragraph, for the position it takes, and for a
      CTA that is wrapped on one side only. The test that pins "an anchor inside a
      paragraph makes its own element" is inverted, not deleted quietly.
- [ ] The probes whose numbers are quoted in the code comments are re-run, and the
      comments are rewritten. The corpus they measured no longer exists.
- [ ] The override count from ticket 65 exists, and the dated note goes out with the
      change. The fold does not ship without it.

## Known and accepted

- Two changes in one paragraph become one finding with one id. Accepted, because the
  fix is one edit of one paragraph.
- A production block that the new site splits in two gives one `copy` row and one
  `text-added` row. Accepted for now. Many-to-one matching waits for a measurement,
  which this ticket makes possible for the first time.
- Findings that were hidden as a markup difference become shown copy differences. The
  shown count rises, and that is the log becoming honest, not a regression.
