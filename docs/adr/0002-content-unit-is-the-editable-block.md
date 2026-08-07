# The content unit is the editable block

The extractor made one element for each **leaf** node in the ticket 02 tag list. A
node that held another node from the list was skipped, because "the children
speak". The list holds `a` and `button`, so one inline link discarded its whole
paragraph and only the link words were compared.

We decided that a **content unit** is the block an editor edits. A block folds its
inline `a` and `button` descendants into its own text. A nested *block* still
breaks it, so `li` and `td` keep giving way to a nested `p`.

## Why

A finding must map onto one decision. Content is edited in Magento PageBuilder and
in the WYSIWYG editor. In both, nobody edits an anchor apart from the sentence that
holds it: you retype the sentence and the link goes with it. A row smaller than the
edit describes no action that a person takes.

The old rule also lost content. Measured on ten production pages: 62 blocks and
about 3,400 words of body copy were never compared, on 10 of 10 pages. On
`/overkapping` one 190-word paragraph was compared as 35 characters, and it hid a
product-spec regression — production says `6063-T6`, the new site says `6036-T6`.

## Considered options

- **Split a block at each link boundary.** Rejected. It keeps rows small, but it
  makes sentence fragments that pair badly against reworded copy, and a fragment
  corresponds to nothing an editor can open.
- **Make the unit the whole WYSIWYG field.** Rejected. A `seo_block` holds many
  paragraphs. One 800-word finding tells the reader only that the block differs,
  and the reader must then read both sides to find where.
- **Keep the leaf rule and accept the loss.** Rejected. The loss is not a corner
  case: inline links are normal in this copy, so the hole is on every page.

## Consequences

- `TextElement` becomes `ContentUnit`. The `CONTEXT.md` definition that said "the
  children speak" is retired.
- `kind: 'cta'` is derived from content, not from the tag that emitted the unit. A
  unit is a CTA when its whole content is one anchor or one button. Without this, a
  CTA that moved between a bare `<a>` and a `<p>` stops pairing.
- `mayPair` permits `cta` against `text`. The kind now records which tag happened
  to emit the unit, and the two sites wrap the same copy differently. The heading
  rule stays, because a heading level is an editorial fact.
- **The finding id gets coarser, and overrides detach.** The id is
  content-addressed, so a folded block mints a new id. Dismissals and fix claims on
  the old anchor-level text detach, and `findingSetHash` flips on every affected
  page, so page reviews go stale together. This is correct by the rule already in
  `CONTEXT.md`: a dismissal is a judgement about two exact strings, and the
  judgement is stale when a string changes. Migration is not possible, because the
  old id keys text that is no longer a unit.
- Two changes in one paragraph become one finding. This is acceptable for the same
  reason the decision was taken: the fix is one edit of one paragraph.
- The interface must clamp a row. A folded paragraph is 20 to 24 wrapped lines, and
  the content view exists so that a difference is found by scanning.
- The word diff must trim the common prefix and suffix before it makes its table. A
  folded block is about 380 tokens on each side.
- A production block that the new site splits in two gives one `copy` row and one
  `text-added` row. Accepted for now. Many-to-one matching waits for a measurement.
