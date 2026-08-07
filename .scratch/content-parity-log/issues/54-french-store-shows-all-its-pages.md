# 54 — The French store shows all of its pages

Type: task
Status: ready-for-agent
Assignee: —
Blocked by: 53
Parent: 50-content-page-discriminator.md

**What to build:** an editor responsible for the French store opens the French
dashboard and sees about 126 pages, where today they see 28. Each page is crawled
on both sides, compared, and browsable. This includes the pages that production
declares in French only, which have no Dutch counterpart and which the log has
never held.

This is the tracer bullet. One store through every layer. If the page list, the
contract, the crawl, the comparison and the dashboard all hold together on
French, nothing in ticket 55 is in doubt.

- [ ] The French store is crawled and compared on the new page list, and the
      dashboard shows every page in it.
- [ ] A page with no Dutch counterpart is comparable. Axis A is production against
      the new site in one store, so it needs no Dutch page. Such a page is absent
      from axis B, and that is correct: axis B does not compare words across
      languages.
- [ ] A page with no declared counterpart carries the finding that production
      declares no hreflang alternate for it. That is a defect of the sitemap
      metadata, not a content difference.
- [ ] The page identity in the contract holds a page that has no Dutch url key.
      Today the contract types the identity as the Dutch url key, and more than
      half of the new pages have none. **The contract changes before the code
      that reads it.**
- [ ] **The key of a page that has a Dutch url key does not change, byte for
      byte.** This is the whole of the safety story: every stored finding id, every
      mute and every review keys on the page value, and the override table is
      append-only by policy, so a reformatted key can never be repaired. Keep the
      existing 181 keys and nothing detaches. The new pages have no stored state,
      so they cannot be orphaned.
- [ ] **The key of a page with no Dutch url key uses a character that is already
      proven safe.** The home-page sentinel is written in parentheses and survives
      the Windows filesystem, the report filename, the static route and the link
      builders. A colon does not: it is the alternate-data-stream separator on
      NTFS, and it breaks the extract writer, the report writer and the static
      build. The unused store-scoped fallback in the old generator uses a colon.
      Do not ship it.
- [ ] Do not use a double underscore as a separator. The report filename replaces
      a slash with a double underscore and is not injective, so a page named with
      one already collides with a page path.
- [ ] Three places build a link or a fetch URL from the page value with no URL
      encoding. They work today by luck. Encode them.
- [ ] The French numbers are measured and recorded here: pages crawled, pages
      comparable, findings, and the median.
- [ ] French was 40% of its navigation and footer under the old rule. It must now
      reach the 88% that ticket 50 measured. The remaining 12% is the blog engine
      and the newsletter page, which are in no sitemap.
- [ ] `npm test` is green.

## The identity change is narrow. Measured, not assumed.

The page value is used in about 82 places. **Twelve must change.** The other 70
treat it as an opaque string: the hash and key functions, everything rendered to
an editor, every sort and lookup, and about 31 pure pass-throughs. Of the twelve,
one is the producer and is the real decision, four make the string safe for a
filename, three add the missing URL encoding, and four are cosmetic or already
generic. Five test files hold literal page keys and need updating.

**So there is no expand and contract.** That sequence exists to protect stored
keys during a format migration, and there is no migration here as long as
anchored keys keep their current string. Ticket 57 is therefore folded into this
ticket and ticket 55.

## Why French

The defect was found on the French store and French has the largest proportional
gain, from 28 pages to about 126. It is also one of the two stores that mark
content `never`, so it exercises the clause that the old rule missed. A store
that marks content `daily` would not test the new rule at all.
