# 53 — Every content page of every store is in the seed list

Type: task
Status: ready-for-agent
Assignee: —
Blocked by: 51, 52
Parent: 50-content-page-discriminator.md

**What to build:** the seed list holds every content page of every store. Today
it holds 28 French pages and the French store has about 110. It holds 45 German
pages and the German store has about 137. An editor of the French store can see
one page in four.

The cause is in ticket 50: the `nl`, `be` and `uk` stores mark their store-local
content `changefreq=daily`, and the `de`, `fr` and `be_fr` stores mark the same
kind of content `never`. The old filter kept `daily` only.

The new rule: a page is a content page when it carries **fewer than six hreflang
alternates**, or is marked `daily` in **any** of the six sitemaps, and does not
carry a product signature. A product page carries all six alternates; exactly
4,444 entries for each store do.

- [ ] The per-store page counts are measured and recorded here. Ticket 50 expects
      about 138 for `be`, 125 for `be_fr`, 137 for `de`, 126 for `fr` and 138 for
      `uk`.
- [ ] **The NL store keeps exactly 181 pages.** Ticket 50 matched all 181 rows:
      133 are found by the new rule, 48 are in no sitemap at all, and none are
      new. If NL moves, the rule is wrong.
- [ ] The 48 NL rows and the 1 UK row that no sitemap declares are carried over
      from the committed seed list. No rule can find them again: the generator
      that made them read an input that no longer exists.
- [ ] Each cell records where it came from: the sitemap, a crawl of the new site,
      or the hand-seeded store home pages.
- [ ] A page with no `nl-NL` alternate is a row of its own store. It is not
      dropped and it is not named as a page that NL does not have. Those are two
      different things, and `CONTEXT.md` now separates them.
- [ ] The generator prints every URL that leaves the list, and the list is
      recorded here.
- [ ] The generator stops loudly if a store yields no pages, or a count far from
      the numbers above. A silent short list is the defect this ticket fixes.
- [ ] The generator writes a page list and nothing else. It makes no live
      request. Ticket 38 ruled the status half of the old file stale, and every
      `prodOk` in it is zero.
- [ ] The rule is a module that a test can import. The old generator exports
      nothing, so no test has ever read it.
- [ ] Tests pin: the two clauses of the rule, both needed; the product signature;
      the four language groups `{nl, be}`, `{be_fr, fr}`, `{de}` and `{uk}`; the
      `be_fr` split by path inside the Belgian host; and the seed schema, which no
      test pins today.
- [ ] `npm test` is green.

## Two clauses, and why one is not enough

`changefreq` alone gives 32 French pages. The alternate count alone drops the 19
category pages, because a category page carries all six alternates and
`/terrasoverkapping` is the most important page on the site. Ticket 50 settled
that both clauses are kept.

## No branch for one store

The British store is the only store where the alternate clause admits product
pages: ten of them. Remove them with a general product signature — a digit, five
or more hyphens and a colour word in the last path part. The 27 known French
content pages score zero of 27 against each signature. **Do not add a branch for
the British store.** A per-store branch is the asymmetry that made ticket 50.
