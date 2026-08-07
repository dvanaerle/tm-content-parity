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

**Status:** ready-for-agent

**Origin:** the grilling of 2026-08-07 on the content unit. It answers ticket
[27](27-category-page-product-listings.md), which this ticket resolves.

- [ ] A committed list of excluded regions. Each entry carries its selector, its
      reason from the vocabulary (`non-editorial` or `legacy-only`), the pages it was
      measured on, and the unit count it removes on each side.
- [ ] The first entry removes the product grid. One selector matches once on each
      host, on every category page, and matches nothing on a home page or a product
      page.
- [ ] **An exclusion above 20 content units throws.** No editable region on this
      site is that large, so a larger match is a bug and the crawl must fail. This is
      the guard that makes a wrong selector impossible to miss.
- [ ] The extraction records the regions removed and the units removed, beside the
      existing image diagnostic.
- [ ] The web build lists an excluded region with its reason, in the same manner as
      an excluded page. An excluded region says why; it is never silently absent.
- [ ] The nine phantom `text-added` rows on each category page are gone, and the
      toolbar differences with them.
- [ ] Ticket 27 is resolved, and the map records the decision.
