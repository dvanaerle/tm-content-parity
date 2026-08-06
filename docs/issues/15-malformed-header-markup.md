# 15 — Malformed markup in the header on the new site

Type: task
Status: closed — out of scope
Blocked by: —
Parent: ../map.md

## Question

The new site sends **malformed HTML** on 149 of 150 pages. A `<div>` start tag
in the Mirasvit live-search `<template>`, inside `header.page-header`, is not
terminated. The next `>` in the bytes is the one that closes an HTML comment.

This is a true front-end defect in a Hyvä compatibility template. It is not a
parity finding, and it is not a defect in the parity tool. Ticket 14 found it
while it looked for something else.

Browsers repair the markup, so the page looks correct and QA cannot see it.
Strict parsers do not repair it: `node-html-parser` deletes the `<body>` and the
`<header>` elements, which is how ticket 14 found the defect.

The only page without the defect is `veranda-configurator`.

## Work

- Find the template that emits the unterminated tag. Start at the Mirasvit
  live-search block in the header.
- Correct the tag.
- Confirm that `node-html-parser` then finds one `<body>` and one `<header>` on
  every page.

Also look at the 3 production pages with no `<main>` that the parser can find —
`faq/productinformatie`, `faq/wijzigingen-retour` and `tuinhuis-met-overkapping`
— and the `blog` page on the new site. Ticket 14 showed that
`closeAllByClosing: true` recovers `<main>` on all 4, which says these pages have
malformed markup too. Find out if the cause is the same. If it is not, this
ticket needs a second fix.

## Why it is separate

This is a fix in `devdva02`, not in `tm-content-parity`. It is a defect on the
storefront that a person can see with a strict parser but not with a browser.
The parity tool works around it with `closeAllByClosing: true` and does not wait
for this ticket.

## Notes

Evidence and citations: `../research/14-main-boundary-asymmetry.md`.
Parser behaviour: `node-html-parser` 9.0.1, `dist/index.mjs` lines 4828-4870 and
4882-4901.

Search the Hyvä compatibility modules for the Mirasvit search template. See
`AGENTS.md` for the `*-hyva` composer variants and
`magento2-compat-module-fallback`.

## Closed: out of scope for this map

2026-08-06. This is a defect **on the storefront**, not work on the log. It is the
log's output, so a map ticket for it would never close by getting closer to the
destination. Recorded in [../storefront-defects.md](../storefront-defects.md) and
closed here. It needs an owner in the `devdva02` storefront work.
