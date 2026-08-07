# 63 — Regions are excluded at extraction, and the product grid is the first entry

**What to build:** a region inside the content boundary that is not editor work
leaves the log, visibly and with its reason. The first region is the product grid on
a category page.

A product grid comes from the catalogue. Nobody writes a tile title, a size filter
label or a result count, so a difference in one is not editor work. Production hides
its tile titles in a tag the extraction never read, while the new site holds the
whole tile in one anchor — so production looks as if it lost nine tiles that it
never had. Measured on `/overkapping`: exactly nine invisible titles on production,
and exactly nine phantom `text-added` rows.

The exclusion happens in the crawl, not in a check. Ticket 27 named the reason: the
extract carries no DOM path, so a check cannot say which region a unit came from.
The DOM exists only while the page is parsed.

See `docs/adr/0003-regions-are-excluded-at-extraction.md`, which also records why
the obvious wrapper selector is a trap.

**Blocked by:** None — can start immediately.

**Status:** resolved — 2026-08-07

**Origin:** the grilling of 2026-08-07 on the content unit. It answers ticket
[27](27-category-page-product-listings.md), which this ticket resolves.

- [x] A committed list of excluded regions. Each entry carries its selector, its
      reason from the vocabulary (`non-editorial` or `legacy-only`), the pages it was
      measured on, and the unit count it removes on each side.
      `shared/excluded-regions.mjs`. The entry holds `kind` for the vocabulary word
      and `reason` for the prose the web build shows, which is the ADR's three
      fields and the same shape `excluded-pages.mjs` uses. `validateRegions()`
      runs on the committed list at import, so a bad entry fails the process and
      never one page, and it runs again on a list a caller gives the extractor.
      The list is in `shared/` and not in `crawl/`: `crawl/` cuts the region and
      `web/` lists it, so ADR 0001 owns that shape.
- [x] The first entry removes the product grid. One selector matches once on each
      host, on every category page, and matches nothing on a home page or a product
      page.
- [x] **An exclusion above its cap throws.** The cap is per entry, it defaults to
      20 and no entry may declare above 100. It counts the whole entry on one page
      and not one match, it counts a nested match once, and the error names the
      store, the page and the side.
- [x] The extraction records the regions removed and the units removed, beside the
      existing image diagnostic. `diagnostics.regionsExcluded` and
      `diagnostics.unitsExcluded`, declared in `compare/contract.mjs` first.
- [x] The web build lists an excluded region with its reason, in the same manner as
      an excluded page. An excluded region says why; it is never silently absent.
- [x] The nine phantom `text-added` rows on each category page are gone, and the
      toolbar differences with them.
- [x] Ticket 27 is resolved, and the map records the decision.

## What changed against the ticket

**The flat cap of 20 could not ship.** This ticket asked for it, and ticket 27's own
first entry removes far more than 20 units, so the two criteria contradicted each
other. The cap is now **per entry with a default of 20**, and the list refuses an
entry whose cap is below its own recorded measurement.

A per-entry number written beside a measurement that is also written by hand is only
"type the number twice", so the cap has a **ceiling of 100** that no entry may
declare above. It is above the widest entry today (50) and below the
`.magezon-builder` near-miss (139 units on the same page). A region wider than the
ceiling needs a decision in the ADR, and not a larger number in the list.
`docs/adr/0003-regions-are-excluded-at-extraction.md` records the shape.

**Two limits of the cap, stated rather than hidden.** It counts content units only,
so a selector that takes few units and many links or images does not trip it. And
`measured` is the author's word: nothing checks it against a probe artefact. The
ceiling is what bounds the damage either way.

**The counts are 50 and 21, not 69 and 48.** Measured 2026-08-07 by
`crawl/probes/probe-excluded-regions.mjs`, on both hosts, on all three pages, with
the same number on all three. Ticket 27's numbers came from the grilling of the same
day and do not reproduce. **The cause is not established.** Two things moved in
between and neither is proven: the catalogue changed — the page said `1702
resultaten` in ticket 27 and `1320 resultaten` now — and ticket 61 folded three
invisible characters, which can drop a short unit below the two-character minimum.
Ticket 27 is corrected to the numbers a probe repeats today.

## Measured

`#amasty-shopby-product-list`, nl store, 2026-08-07:

| page | pageType | production | new site |
| --- | --- | --- | --- |
| `overkapping` | category | 1 match, −50 units | 1 match, −21 units |
| `carport` | category | 1 match, −50 units | 1 match, −21 units |
| `veranda` | category | 1 match, −50 units | 1 match, −21 units |
| `(home)`, `downloads`, `showroom-contact`, `betaalmethoden` | cms-page | no match | no match |
| a product page | product | no match | no match |

It takes 9 tile images and 19 links on production, and 9 images and 15 links on the
new site.

`showroom-contact` is worth one line: **production** gives it the body class
`catalog-category-view`, and the selector correctly matches nothing on it. That is
the ticket-27 argument in one page — `pageType` names a page kind, and the grid is a
region. Only the production side of that page counts as a control: the new site
answers 404 on it, so its "no match" proves nothing.

The probe compares each category page twice, before the cut and after it, so the
claim about findings is measured and not inferred from unit counts:

| page | findings | shown | `text-added` | rows gone | rows appeared |
| --- | --- | --- | --- | --- | --- |
| `overkapping` | 258 → 172 | 186 → 139 | 32 → 16 | 16 | **0** |
| `carport` | 283 → 202 | 177 → 135 | 53 → 37 | 16 | **0** |
| `veranda` | 280 → 194 | 179 → 132 | 51 → 35 | 16 | **0** |

**No row appeared on any of the three.** That is the half that matters: a cut that
moved the pairing would invent findings elsewhere, and it does not.

The sixteen that leave `/overkapping` are the **nine tile titles**, the pager
(`Pagina 147`, `U lees momenteel pagina 1`), the result count (`1320 resultaten`),
the sorter (`sort-descending`) and the three USP strip lines.

The finding totals move a little between runs, because the catalogue moves. The
three numbers that do not move are the units, the matches and the 16-and-0.

**The USP strip is still open, and the measurement narrowed it.** Ticket 27 left it
open because production's strip position was not measured. On the new site the strip
sits inside the grid container, so this entry takes it; on production it did not
appear as a finding either way on this page. It still needs its own measurement
before it gets its own entry. Do not add one blind.

## Not done here, on purpose

The corpus was **not** re-crawled and the reports were **not** rebuilt. Rebuilding
every report changes finding ids and detaches overrides, which is ticket
[67](67-a-content-unit-folds-its-inline-links.md)'s business and not a side effect
this ticket should cause. Until the next crawl the dashboard shows each entry as
removed on no page, and it names the three causes: the store does not have the
region, the selector does not match any more, or the snapshot is older than the
entry.
