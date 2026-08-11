# 50 — The content page discriminator

**What to build:** a seed generator that finds every content page of every store.
Today it finds all of the Dutch pages and about one third of the French, German
and Belgian-French pages. The French store has about 110 content pages. The seed
list holds 28.

**Blocked by:** None.

**Status:** resolved 2026-08-10 — built by 55

**Type:** task

**Implements:** the seed list that spec [32](32-scannable-log-and-six-stores.md)
and ticket [38](38-six-stores.md) read.

## The question the ticket started from

The question was "one sitemap or six?". The answer is that the question was
wrong. All six production sitemaps were measured on 2026-08-07. Each one is a
`<urlset>` file of about 30 MB, and **each one holds the URLs of all six
stores**. The six files hold nearly the same URL set: `.be` and `.nl` differ by
11 URLs. There is no sitemap index. There is no `<lastmod>`. The `<priority>` is
`0.5` on every entry, so it holds no information.

The defect is different, and it is in the filter:

> **`changefreq=daily` is the wrong marker for a content page.** The `nl`, `be`
> and `uk` stores mark their store-local content `daily`. The `de`, `fr` and
> `be_fr` stores mark the same kind of content `never`. The convention is not
> the same in each store view.

This one inconsistency is the whole blind spot. The old generator read one file
and kept `changefreq=daily`, so it found 27 French pages of about 110.

## The measurements

Six sitemaps, fetched 2026-08-07. All six answered 200.

`changefreq=daily` locs, by the store of the loc. The row is the file:

| file | nl | be | be_fr | de | fr | uk | total |
|---|---|---|---|---|---|---|---|
| nl | 133 | 125 | 28 | 44 | 27 | 41 | 398 |
| be | 107 | 112 | 14 | 27 | 13 | 22 | 295 |
| be_fr | 14 | 15 | 18 | 14 | 18 | 13 | 92 |
| fr | 14 | 15 | 18 | 14 | 18 | 13 | 92 |
| de | 17 | 16 | 14 | 18 | 14 | 16 | 95 |
| uk | 41 | 39 | 21 | 35 | 21 | 128 | 285 |

Three readings of that table matter:

1. **The diagonal is not the maximum.** For `be`, `be_fr`, `de` and `fr` the NL
   file marks more of that store's pages `daily` than the store's own file does.
   So "read the store's own sitemap" is not the rule. It loses 72 pages,
   including the Belgian category pages `/veranda`, `/terrasoverkapping` and
   `/carport`.
2. **No file is the authority for any store.** Four pages are `daily` in neither
   the NL file nor the store's own file: `be/pergola`, `be/fr/heavy-duty-veranda`,
   `de/showroom-berlin` and `fr/heavy-duty-veranda`.
3. **The files differ in membership too, not only in the flag.**
   `be/pergola` is not in `nl.xml` at all.

### What the hreflang alternates say

- The alternate blocks are **byte-identical in all six files**. Zero of 503
  cluster locs differ. So one file is sufficient for the alternates, and a merge
  across files adds nothing.
- The alternates are **fully symmetric**. Of 4,471 `fr` locs with an `nl-NL`
  alternate, zero have a target that is absent, zero lack the `fr-FR` alternate
  back, and zero point at a different URL.
- **Exactly 4,444 locs for each store carry all six alternates.** Those are the
  product pages. A content page carries fewer than six.

### The language groups, derived from the file membership

`{nl, be}`, `{be_fr, fr}`, `{de}` alone, `{uk}` alone. No other pairing exists.
The `de` and `uk` stores carry **no alternates at all** on their store-local
content, so hreflang can never reach those pages.

## The rule

A loc is a content page of its store when:

    (alternates < 6  OR  changefreq=daily in any of the six files)
    AND NOT a product signature

The product signature is a digit, five or more hyphens, and a colour token in the
last path segment. The 27 known French content pages score 0 of 27 on each of
the three signatures. The signature also holds the glass panels
(`plaque-toit-en-verre-…-2500mm-x-700mm`) and the ten British product pages
(`/sun-shading-screen-housing-set-of-3m-matt-white`) out of the list.

Both clauses are necessary. `changefreq` alone gives 32 French pages.
`alternates < 6` alone drops the 19 category pages, because a category page
carries all six alternates.

**A product signature is a general rule, not a rule for one store.** The British
store is the only store where the second clause admits product pages. A
per-store branch is the asymmetry that made this ticket, so the ticket does not
add one.

## The result

| store | seed today | after | delta |
|---|---|---|---|
| nl | 181 | 181 | 0 |
| be | 126 | ~138 | +12 |
| be_fr | 29 | ~125 | +96 |
| de | 45 | ~137 | +92 |
| fr | 28 | ~126 | +98 |
| uk | 42 | ~138 | +96 |

The counts after the exclusion list are measured in the work, not predicted
here. The order of magnitude is certain: the store page count goes from 451 to
about 800.

**The NL baseline does not move.** All 181 NL seed rows were matched against the
new set: 133 are in it, 48 are not, and none are new. The 48 are in **no
sitemap at all** — `/blog`, `/nieuwsbrief`, `/contactformulier`,
`/klantenservice`, `/showrooms`, `/veranda-configurator`, `/home-nl` and 38
`*/onderdelen*` pages. They came from the crawl of the new site. One `uk` row is
absent from every sitemap for the same reason. So NL stays at 133 + 48 = 181.

**No sitemap rule can find those 49 rows.** They must be carried over from the
committed seed file. The generator that made them read `_data/03-merged.json`,
which does not exist, so they cannot be made again.

## Verification against the live stores

The navigation and the footer of three production stores were read. Each
internal path was looked for in the new set:

| store | paths | found | coverage |
|---|---|---|---|
| de | 53 | 48 | 90.6% |
| uk | 52 | 46 | 88.5% |
| fr | 52 | 46 | 88.5% |

The French store scored 40.4% under the old rule. The rule was derived from the
French store and it scores the same on two stores that it was not derived from.

Each miss is absent from all six sitemaps: `/blog` and its posts, `/newsletter`,
and `/Separate-parts`. The sitemap is complete for the pages an editor can
change. A navigation crawl is a floor and not an answer: 11 pages in the new set
are in no navigation and no footer.

## Resolved 2026-08-10

**Ticket [55](55-five-stores-show-all-their-pages.md) built it.** The seed generator
finds every content page of every store. The corpus is **816 store pages**, from 451,
and the French store holds **123** against the 28 this ticket opened on.

The items below were delivered by [51](51-runnable-tracked-seed-pipeline.md),
[54](54-french-store-shows-all-its-pages.md), 55 and [38](38-six-stores.md). They are
left unticked because this ticket did not tick them: the ticket that did holds the
answer. They are not open work here.

Four tickets re-triage against the new number rather than the old one:
[04](04-six-store-page-lists.md), [16](16-new-site-page-discovery.md),
[20](.out-of-scope/20-one-sided-pages-checklist.md) and
[25](25-fotogalerij-worst-case-page.md). That is in **What this ticket reopens** below,
and `map.md` § Working order carries it.

## What to build

- [ ] **Commit the input.** `_data/` was never committed and does not exist, so
      the generator cannot run. The consumers read `data/`, which `.gitignore`
      ignores, so `data/10-store-seeds.json` is untracked and cannot be made
      again. Commit a reduced extract of each sitemap — the surviving `<url>`
      blocks with their alternates, one merged block for each loc, about 290 KB
      for all six against 181 MB of source. Commit a manifest with the fetch
      URL, the date, the HTTP status, the byte count and the loc count. Then
      un-ignore `data/10-store-seeds.json`.
- [ ] **Change the contract first.** `compare/contract.mjs:95` types `page` as
      "the NL url key". More than half of the pages have no `nl-NL` alternate,
      so they have no NL url key and no identity the contract can hold.
- [ ] **Make the parse step a module.** The generator exports nothing and cannot
      be imported, so no test reads it. Split the pure step: sitemap XML in,
      seed rows out. Test the rule, the language groups, the product signature
      and the schema. A rule with no test is not a rule.
- [ ] **Drop the status probe.** The old generator makes 902 live requests. Every
      `prodOk` in the committed file is 0 and 446 of 451 cells say
      `prodMaintenance: true`. Ticket 38 verified production live and ruled the
      status half stale. The seed file becomes a page list and nothing else.
- [ ] **Record the provenance of each cell**: `sitemap-daily`,
      `sitemap-low-alternates`, `new-site-crawl` for the 49 carried rows, and
      `store-home`. The known difference between NL and the other stores then
      lives in the data and not in a code comment.
- [ ] **Report each dropped URL.** The sitemap is the truth, but a URL that
      leaves the list is an event. Print the list and record it here.
- [ ] **Fail loudly.** Abort with the histogram if a store yields zero pages, or
      a count far from the number in the table above. A silent short list is how
      this defect arrived.
- [ ] **Mark the excluded pages, do not drop them.** About 60 pages are in the
      new set but have no content to compare: 26 gallery photo pages, 11 form
      confirmation pages, 8 form endpoints, 3 store roots, 2 cookie toggles, 2
      logout paths and 10 British product pages. Each one goes in the dashboard
      and is counted, and each one says why it is not compared.
      `web/src/lib/reports.mjs:143` already holds an `excludedFor(store)` path.
- [ ] **A page with no NL counterpart is a row.** It is comparable on axis A,
      because axis A is production against the new site in one store and needs no
      NL page. It is absent from axis B. It carries the finding "production
      declares no hreflang alternate for this page".
- [ ] **Re-measure ticket 38.** Its per-store counts read the old seed file. Run
      `node compare/measure.mjs <store>` for each store and correct the table in
      [38](38-six-stores.md) and the entry in `map.md`. This is bookkeeping, not
      a second resolution. Run `compare/link-status.mjs` with no store argument:
      it overwrites one global file.

## What this ticket does not do

- **The cross-store view for editors.** The next ticket. An editor wants to see
  the six store views beside each other, and that is axis B. Everything ticket 38
  built is axis A. The first question for that ticket: **283 clusters have no NL
  member.** Is that a real difference between the store views, or a gap in the
  sitemap metadata? Axis B is not feasible until that is known.
- **A crawl-based source for the 49 rows.** They are carried over. A discovery
  crawl for the other five stores is a separate ticket.

## What this ticket reopens

[04 — six store page lists](04-six-store-page-lists.md) must be reopened.

- Its conclusion "the sitemap yields **exactly** the hreflang counts, so hreflang
  missed nothing" reads one file two ways. Both numbers come from the alternates
  of the NL `daily` locs. The agreement is a tautology and not proof.
- Its conclusion "**no** page exists in a non-NL store without an NL
  counterpart" is false. 283 clusters have no NL member. Six of them hold more
  than one store: `pergola` in `be`, `be_fr` and `fr`; `heavy-duty-veranda` in
  `be_fr`, `fr` and `uk`; `showroom-berlin` in `de` and `uk`; and three French
  pages in `be_fr` and `fr`.
- Its exclusion of 26,645 rows on `changefreq` is unsound for the reason above.

The stores-per-row table in 04 records 54/77/8/15/8/19. The committed file holds
53/77/8/15/8/20. The file on disk is not the file that 04 measured.

## Storefront defects found

Neither is a map ticket. Both go to `devdva02/docs/storefront-defects.md`.

- The British footer links `/Separate-parts`. The page is `/separate-parts`, and
  it is in all six sitemaps. A casing defect.
- The French store has the url key `/galerie/eclairaige`. The Belgian-French
  store has `/galerie/eclairage`. A typing defect in one of the two.

## Comments

Designed in a grilling session on 2026-08-07, 24 questions over eight rounds.
Four hypotheses were measured and refused:

1. "Each store view has its own sitemap." The six files hold all six stores and
   are ≥99% the same URL set.
2. "Read the store's own sitemap." It loses 72 real pages.
3. "The hreflang alternates hold the missing pages." An expansion adds exactly
   zero URLs.
4. "The alternates are asymmetric, so read them backwards." They are fully
   symmetric. The reverse direction holds no extra information.
