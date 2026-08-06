# 21 — The Axis A meta check: what is a parity defect in the head?

Type: grilling
Status: open
Blocked by: —
Parent: ../map.md

## Question

What does the meta check compare on the **parity** axis, prod against new, within
one store, and which differences are defects?

`CHECKS` in `compare/contract.mjs` declares a `meta` check, but no class carries
`check: 'meta'`. Ticket 11 added two meta classes for the **coverage** axis
(`meta-presence`, `meta-untranslated`) and deliberately left the parity axis
alone, because a changed `<title>` or a lost canonical is a question with SEO
weight and ticket 11's session gathered no evidence for it.

## What to settle

- **Which fields.** `PageMeta` is `{ title, description, canonical, noindex, h1 }`.
  There is no hreflang, no og and no twitter field. Does the check need them, and
  therefore an extractor change?
- **`<title>`.** A title that differs is almost certainly intentional on a
  relaunch. Is it a finding, and shown or hidden?
- **`canonical`.** The value is the raw href, not tier1-normalised, unlike title,
  description and h1. A host swap therefore makes every canonical differ. What is
  the identity rule — the same `self` folding that `linkKey()` uses?
- **`noindex`.** A page that is indexable on production and `noindex` on the new
  site is a severe and silent defect. Is this the highest-value check here?
- **`h1`.** `h1` is in `PageMeta` and also in `elements` as a heading. Does the
  meta check read it, or does that duplicate a `copy` finding on the same text?
- **An absent field.** Production's `nieuwsbrief` page has no `<title>` at all —
  the only such page on either side. Is absent-on-both a finding?

## Notes

Resolve with `/grilling` and `/domain-modeling`.

Ticket 11 owns the coverage-axis meta classes. Do not re-open them here; this
ticket adds the parity-axis vocabulary beside them.
