# 04 — Seed lists for all six store views

Type: task
Status: needs-triage
Assignee: d.aerle

> **Reopened 2026-08-07 by [50](50-content-page-discriminator.md).** Three
> conclusions below are unsound. The `changefreq=daily` filter is not a marker of
> a content page: `de`, `fr` and `be_fr` mark their content `never`, so this
> ticket found 27 French pages of about 110. "The sitemap yields exactly the
> hreflang counts" reads one file two ways, so the agreement is a tautology. "No
> page exists in a non-NL store without an NL counterpart" is false: 283 clusters
> have no NL member. The stores-per-row table here says 54/77/8/15/8/19; the
> committed file says 53/77/8/15/8/20, so the file on disk is not the file this
> ticket measured. Ticket 50 holds the measurements.
Blocked by: —
Parent: ../map.md

## Question

Nothing to decide. Produce a per-store list of pages to compare, for all six
store views, with product detail pages stripped per store.

The discussion on Axis B (ticket 11) cannot start until the page lists exist.

## What to do

`_scripts/01-parse-sitemap.mjs` currently keeps NL non-PDP pages and discards
**22,466 URLs** as `otherStore`. Every non-NL page is already in the production
sitemap — one flat 30 MB file, 27,043 `<loc>` entries, all stores in one urlset.

- Keep all six stores instead of NL only.
- Strip PDPs per store. The current `pdp` filter counted 4,444, but that ran
  before the store filter, so the per-store PDP patterns need checking against
  each domain.
- Keep blogs and gallery detail pages excluded, as the baseline does.
- Map each production URL to its new-site counterpart host:

  | Store | Production | New site |
  | --- | --- | --- |
  | nl | `www.tuinmaximaal.nl` | `valanticnl.intern.systems` |
  | be | `www.tuinmaximaal.be` | `valanticbe.intern.systems` |
  | be_fr | `www.tuinmaximaal.be/fr/` | `valanticbe.intern.systems/fr/` |
  | de | `www.tuinmaximaal.de` | `valanticde.intern.systems` |
  | fr | `www.tuinmaximaal.fr` | `valanticfr.intern.systems` |
  | uk | `www.tuinmaximaal.co.uk` | `valanticuk.intern.systems` |

- Record the per-store counts and the exclusion counts, as the baseline does in
  `_data/03-merged.json` under `excluded`.

## Expected scale

hreflang counterparts found in the baseline, as a rough cross-check: be 125,
de 44, uk 41, be_fr 28, fr 27, against 181 NL pages. Expect the sitemap to yield
more than hreflang did, because hreflang misses pages that exist only in one
store.

## Answer

Done. `_scripts/10-store-seeds.mjs` builds the list; it writes
`_data/10-store-seeds.json` (the data) and `store-seeds.md` (a readable table),
both in `.scratch/sitemap-content-overview/`.

### Counts

The list holds **181 pages** and **451 store-page pairs**. New-site status is a
real measurement, taken over 902 requests.

| Store | Pages | New 200 | New 404 | New redirect |
| --- | --- | --- | --- | --- |
| nl | 181 | 165 | 14 | 2 |
| be | 126 | 116 | 8 | 2 |
| be_fr | 29 | 25 | 4 | 0 |
| de | 45 | 42 | 3 | 0 |
| fr | 28 | 25 | 3 | 0 |
| uk | 42 | 40 | 2 | 0 |

Excluded: **26,645** product detail pages, blog posts and gallery photos, all in
one number, because `changefreq=never` marks all of them and the sitemap gives no
way to tell them apart. 0 rows on an unknown host.

Store coverage, over the 181 pages: 54 pages exist in one store only, 77 in two,
8 in three, 15 in four, 8 in five, 19 in all six.

### The scale expectation in this ticket was wrong

The sitemap yields **exactly** the hreflang counts, not more: be 125, de 44,
uk 41, be_fr 28, fr 27, before the home pages were added by hand. The sitemap and
hreflang are the same set, so hreflang missed nothing. The extra 48 NL pages come
from the new-site crawl, not from the sitemap.

### How pages are identified

Stores do not share url keys. `be` reuses the NL Dutch keys, but `de`, `fr`, `uk`
and `be_fr` translate the **category** keys (`terrassenueberdachung`, `verandas`,
`patio-cover`) while keeping the NL key for CMS pages. hreflang is the only thing
that links them, so the row key is the NL url key taken from the `nl-NL`
alternate. Six NL pages declare no hreflang; an NL page is its own key regardless.

**No page exists in a non-NL store without an NL counterpart.** Every one of the
446 non-NL sitemap urls clusters onto an NL page. This narrows the fog item about
pages that only exist in one non-NL store: on the production sitemap side there
are none. The new-site side is still unknown, because the new site serves no
sitemap.

### The new-site url is a plain host swap

Verified live: the path carries over verbatim, including the translated keys and
the `/fr/` prefix for be_fr. No key mapping table is needed.

### Facts found on the way

- **The new site serves no sitemap.** `/sitemap.xml`, `/sitemap/sitemap.xml` and
  `/pub/sitemap.xml` all 404 on all five hosts. Discovering non-NL pages that
  exist only on the new site needs a crawl, and there is no cheap seed for it.
- **No store's home page is in the production sitemap**, not even NL. The NL one
  reached the baseline through the crawl. All six are now seeded by hand.
- **Production was in maintenance mode during this session**, so `prodStatus` is
  not a measurement — 446 of 451 urls answered with the maintenance page. It moved
  from a 500 bootstrap exception to a proper 503 while the work ran. The script now
  matches both and prints a loud warning instead of recording a bare 5xx. Re-run
  for real production status.
- Five production urls redirect at the edge and so survive maintenance:
  `home-nl` to the store root on nl and uk, and the three
  `verlichting/onderdelen*` pages to `lighting-system/onderdelen*` on nl.
- Two new-site urls redirect away from the page: `dak-offerte-aanvragen` to the
  store root, and `faq/offerte` into `freequote/payment/index/data/offerte/`,
  both on nl and be. These are parity defects, not list problems.
- `showroom-contact` and `vrijstaande-terrasoverkapping` 404 on the new site in
  **all six** stores. `afterpay` 404s in four.
