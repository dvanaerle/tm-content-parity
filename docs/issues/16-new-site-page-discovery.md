# 16 — Discovering non-NL pages that only exist on the new site

Type: grilling
Status: open
Blocked by: —
Parent: ../map.md

## Question

How does the log find a page that exists on the new site in a non-NL store, and
nowhere on production?

## Why this is now a sharp question

Ticket 04 built the seed list from the production sitemap and closed one half of
this. On the production side there is nothing to find: all 446 non-NL sitemap urls
cluster onto an NL page, so no page exists in a non-NL store without an NL
counterpart. hreflang missed nothing.

The new-site side stayed open, and 04 removed the cheap way to close it:

- **The new site serves no sitemap.** `/sitemap.xml`, `/sitemap/sitemap.xml` and
  `/pub/sitemap.xml` all 404 on all five hosts.
- The NL baseline found **48 pages** this way — by crawling the new site, not by
  reading the sitemap. That is 27% of the NL list, so the gap is not small.
- No store's home page is in the production sitemap either, which is a hint that
  the sitemap is a weaker seed than it looks.

For the other five stores there is no equivalent crawl and no seed for one.

## What to settle

- Is a per-store link crawl of the new site worth its cost, or does the NL crawl
  plus hreflang cover enough?
- What the crawl seeds from, given that no store home page is in the production
  sitemap either.

**Settled by ticket 11, no longer open here.** A page that exists only in a non-NL
store **is** a finding: class `orphan-page`, shown, raised against the **NL**
store, not against the store that holds it. This ticket keeps the hard half, which
is discovery: the new site serves no sitemap, so a page that nothing links to is a
crawl problem, not a rules problem.

Ticket 04 found no orphan in the production data — hreflang clustering resolved all
446 non-NL pages onto an NL key, with zero uses of the store-scoped fallback key.
The rule therefore has no known instances yet. That is a reason to measure, not a
reason to close.

## Answer

<!-- record the decision here when done -->
