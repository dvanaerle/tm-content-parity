# 56 — An excluded page says why

Type: task
Status: ready-for-agent
Assignee: —
Blocked by: 54
Parent: 50-content-page-discriminator.md

**What to build:** an editor sees every page the log found, including the ones it
does not compare, and each of those says why. About 60 of the roughly 800 new
pages have nothing to compare: a form confirmation page, a gallery photo page, a
cookie toggle, a logout path. Comparing them would add findings for ever that no
editor can act on. Dropping them silently would break the rule that this log never
hides a page.

So they are counted and shown, and they are not compared.

- [ ] Every page found by the rule reaches the dashboard. Nothing is silently
      absent.
- [ ] A page that the log does not compare says which rule excluded it, in words
      an editor can read.
- [ ] The excluded pages are: gallery photo pages, form confirmation pages, form
      endpoints, store roots, cookie toggles, logout paths, and the ten British
      product pages the alternate clause admits. Ticket 50 measured about 60 in
      total, and a false-positive rate of 3% to 21% for each store before the
      exclusions.
- [ ] The exclusion list is a committed list with a reason for each entry, not a
      rule buried in the code. A wrong exclusion is then reversed by editing a
      list, and never by crawling again.
- [ ] An excluded page is counted in the store total. The dashboard must not show
      a total that hides them, because ticket 38 already found that an editor
      reads the comparable count as the size of the store.
- [ ] The existing excluded-page path in the front end carries these, rather than
      a second mechanism beside it. It holds one Dutch page today.
- [ ] `npm test` is green.

## Why this is not part of ticket 55

It hangs off ticket 54, not ticket 55, so it can be built while the five stores
are crawled. It changes what the dashboard shows, not what the crawl fetches.
