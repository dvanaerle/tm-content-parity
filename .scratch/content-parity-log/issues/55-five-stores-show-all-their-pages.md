# 55 — The other five stores show all of their pages

Type: task
Status: ready-for-agent
Assignee: —
Blocked by: 54
Parent: 50-content-page-discriminator.md

**What to build:** every one of the six dashboards holds every record. An editor
of the German store sees about 137 pages where they see 45 today. An editor of the
British store sees about 138 where they see 42. This is the condition the whole
effort was asked for.

Ticket 54 proved the path on one store. This ticket repeats it on the other five
and corrects the numbers that the old page list produced.

- [ ] The `nl`, `be`, `be_fr`, `de` and `uk` stores are crawled and compared on
      the new page list, and each dashboard shows every page in it.
- [ ] The store page total is recorded. Ticket 50 expects about 800, against 451
      today, so the crawl is about 1,600 requests.
- [ ] **The NL baseline does not move.** Its 181 pages, and the numbers ticket 38
      recorded for it, must be the same. NL is the one store where the new rule
      finds nothing new, and that is the check that the rule did not over-collect.
- [ ] The link check runs once over all six stores, with no store named. It
      overwrites one global file, so a run for one store erases the store before
      it. Ticket 38 found this the hard way.
- [ ] Ticket 38's per-store table is re-measured and corrected, and so is its
      entry in the map. Its counts read the old page list, so every non-NL number
      in it is a floor and not a measurement. This is bookkeeping: it decides
      nothing and it does not reopen ticket 38.
- [ ] Ticket 49's measurement of the Belgian-French blind spot is re-checked. It
      was scoped to 29 pages and the store now holds about 125.
- [ ] The German and British stores reach the navigation coverage ticket 50
      measured: 90.6% and 88.5%. Each miss must be a page that is in no sitemap.
- [ ] The contract and `CONTEXT.md` agree, and the contract no longer promises
      that a page is identified by its Dutch url key. `CONTEXT.md` was corrected on
      2026-08-07 and the contract was not. This came from ticket 57, which is
      merged.
- [ ] `npm test` is green, and the regression gate passes for each store.

## Two defects to hand over, not to fix

Neither belongs in the map. Both are the log's output, so record them in the
storefront defect list in `devdva02`:

- The British footer links a page with a capital letter that the site serves in
  lower case. The lower-case page exists and is in all six sitemaps.
- The French store and the Belgian-French store spell the same gallery url key
  two ways. One of the two is a typing defect.
