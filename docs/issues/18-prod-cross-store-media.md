# 18 — Production serves NL images from the `.de` host

Type: task
Status: closed — out of scope
Blocked by: —
Parent: ../map.md

## Question

On the **nl** store, production serves **13 images** from `www.tuinmaximaal.de`.
Find the cause and fix it.

Graduated from ticket 06, which measured it.

## Why this is not a parity finding

The log's contract is "make the new site match production". Here production is the
side that is wrong, and the new site is not diverging from it — so the Images tab
must not report it, or the log starts giving two opposite instructions on one page.

Ticket 05 disclaimed cross-store media as the Images tab's problem; ticket 06
disclaimed it as a live production defect. This ticket is where it lands.

## What to do

- Find the 13 images in `_data/probe-images.json` — production srcs on an
  `www.tuinmaximaal.de` host, nl store.
- Establish whether the wrong host is stored in the CMS content, in a Magento base
  media url, or introduced by the Cloudflare Image Resizing rule.
- Check whether the same fault exists on the other five stores. The probe only
  measured nl.
- Check whether the new site inherited the same wrong hosts when the content was
  migrated. If it did, the Images tab sees matching basenames and reports nothing,
  so the defect is invisible to the log on both sides.

## Notes

Sibling of ticket 17 — a live defect found while charting, fixed outside the log.

## Closed: out of scope for this map

2026-08-06. This is a defect **on the storefront**, not work on the log. It is the
log's output, so a map ticket for it would never close by getting closer to the
destination. Recorded in [../storefront-defects.md](../storefront-defects.md) and
closed here. It needs an owner in the `devdva02` storefront work.
