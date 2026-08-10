# 53 — Every content page of every store is in the seed list

Type: task
Status: resolved
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

- [x] The per-store page counts are measured and recorded here. Ticket 50 expects
      about 138 for `be`, 125 for `be_fr`, 137 for `de`, 126 for `fr` and 138 for
      `uk`.
- [x] **The NL store keeps exactly 181 pages.** Ticket 50 matched all 181 rows:
      133 are found by the new rule, 48 are in no sitemap at all, and none are
      new. If NL moves, the rule is wrong.
- [x] The 48 NL rows and the 1 UK row that no sitemap declares are carried over
      from the committed seed list. No rule can find them again: the generator
      that made them read an input that no longer exists.
- [x] Each cell records where it came from: the sitemap, a crawl of the new site,
      or the hand-seeded store home pages.
- [x] A page with no `nl-NL` alternate is a row of its own store. It is not
      dropped and it is not named as a page that NL does not have. Those are two
      different things, and `CONTEXT.md` now separates them.
- [x] The generator prints every URL that leaves the list, and the list is
      recorded here.
- [x] The generator stops loudly if a store yields no pages, or a count far from
      the numbers above. A silent short list is the defect this ticket fixes.
- [x] The generator writes a page list and nothing else. It makes no live
      request. Ticket 38 ruled the status half of the old file stale, and every
      `prodOk` in it is zero.
- [x] **`prodStatus` and `prodRedirect` are measured again**, over every
      store-page pair of the new list. Folded in from ticket 22 — see below.
- [x] **The stale `prodMaintenance` flags are cleared.** Maintenance is a
      transient state of the moment a crawl ran. It is never a property of a
      page, so the flag does not persist in the seed data.
- [x] The rule is a module that a test can import. The old generator exports
      nothing, so no test has ever read it.
- [x] Tests pin: the two clauses of the rule, both needed; the product signature;
      the four language groups `{nl, be}`, `{be_fr, fr}`, `{de}` and `{uk}`; the
      `be_fr` split by path inside the Belgian host; and the seed schema, which no
      test pins today.
- [x] `npm test` is green.

## Two clauses, and why one is not enough

`changefreq` alone gives 32 French pages. The alternate count alone drops the 19
category pages, because a category page carries all six alternates and
`/terrasoverkapping` is the most important page on the site. Ticket 50 settled
that both clauses are kept.

## Folded in from ticket 22: measure production status again

Triage of 2026-08-07 folded [22](22-remeasure-prod-status.md) into this ticket
and into [51](51-runnable-tracked-seed-pipeline.md). 22 is not closed; it is
marked folded and points here.

Ticket 22 wanted the status half of the seed data measured again, over the 451
pairs that existed then. **This ticket rebuilds the list to about 800 pairs**, so
measuring the old list first would measure a list that is about to be thrown
away. The re-measurement rides on the rebuild.

What 22 said, and it still holds:

- All 451 `prodStatus` values are 0, because production was in maintenance mode
  for the whole of ticket 04's seed run. It is not a measurement.
- `prodMaintenance: true` is recorded on 177 of 181 NL rows and on nearly every
  row of the other five stores. Ticket 06 then made 362 requests with **0**
  maintenance responses, and ticket 38 made 538 with 0. The flag is stale.

**The status pass is not the generator.** The criterion above says the generator
writes a page list and makes no live request, and that stands: the status pass is
a second step over the finished list, and it writes its own output. Two things in
one script is what made the old file half list and half stale measurement.

The guard is [51](51-runnable-tracked-seed-pipeline.md)'s: the status pass uses
`maintenanceReason()` and `MaintenanceError` from `crawl/fetch-page.mjs`, so a
second maintenance window **aborts the run** instead of recording phantom
results.

## No branch for one store

The British store is the only store where the alternate clause admits product
pages: ten of them. Remove them with a general product signature — a digit, five
or more hyphens and a colour word in the last path part. The 27 known French
content pages score zero of 27 against each signature. **Do not add a branch for
the British store.** A per-store branch is the asymmetry that made ticket 50.

## Answer

**820 store pages over 550 rows**, against 451 over 181 rows. The seed list is a
page list and nothing else, and the status measurement is a second file beside
it.

| store | seed before | after | ticket 50 expected | delta |
|---|---|---|---|---|
| nl | 181 | **181** | 181 | 0 |
| be | 126 | **131** | ~138 | +5 |
| be_fr | 29 | **122** | ~125 | +93 |
| de | 45 | **134** | ~137 | +89 |
| fr | 28 | **123** | ~126 | +95 |
| uk | 42 | **129** | ~138 | +87 |

**NL is 181, to the page.** 133 are found by the rule and 48 are carried. Ticket
50 predicted exactly that, and it is the check that the rule is right rather than
merely larger.

Each store is 4 to 9 pages under ticket 50's estimate, and the whole of that gap
is the product signature. Ticket 50 estimated the counts before the signature was
built. The signature is now measured against production and not estimated.

### What was built

| File | What it is |
|---|---|
| `crawl/seed-list.mjs` | The rule. Pure, exported, tested. |
| `crawl/10-store-seeds.mjs` | The run. Reads the two committed inputs, writes the page list. No live request. |
| `crawl/page-status.mjs` | What the status pass visits and what it counts. Pure. |
| `crawl/11-page-status.mjs` | The status pass. 1,640 urls. |
| `crawl/probes/probe-product-signature.mjs` | The measurement the signature is derived from. |
| `crawl/seed-list.test.mjs`, `crawl/page-status.test.mjs` | 51 tests. |

`npm test` is green at **412 tests**, 51 of them new.

The generator is repeatable: a second run over the same two inputs gives the same
bytes. It reads its own previous output, because that is the only place the 49
carried rows exist.

### The product signature is measured, and ticket 50's wording of it is wrong

Ticket 50 says the signature is "a digit, five or more hyphens, and a colour
token in the last path segment". **That signature cannot do what ticket 50 says
it does.** `glazen-dakplaat-ongehard-2500mm-x-700mm` carries no colour word, so a
colour clause does not hold the glass panels out; and
`30000-terrasoverkappingen-en-schuifwanden-per-jaar` carries a digit and five
hyphens and is a content page in the committed NL list, so the digit-and-hyphen
clause alone takes NL below 181.

Nothing in the repository said which candidate is a product. So it was measured.
**Production names the two kinds on the `<body>`**: `catalog-product-view` against
`cms-page-view`. `crawl/probes/probe-product-signature.mjs` read all 876
candidates once:

| body | entries |
|---|---|
| `cms-page-view` | 653 |
| `catalog-category-view` | 111 |
| `catalog-product-view` | **105** |
| the six store home pages | 6 |
| 404 (`uk/measuring-tool`, which now redirects) | 1 |

The signature is two clauses on the last path segment, and it names **105 of 105
with no false positive over all 876**:

1. **A measurement** — a number joined to a unit of length. `2500mm`, `2500-mm`,
   `2-5m`, `50-metre`. A content page names no dimension.
2. **A colour beside a finish**, in either order. `spuitbus-mat-wit`,
   `spruhdose-matt-weiss`, `aerosol-blanc-mat`.

The colour alone is **not** the signature, and this is the case that decides it:
`co.uk/black-veranda` names a colour and production answers `cms-page-view`. A
content page may name a colour; it does not name a colour and a finish.

The 105 are 19 in each of `nl`, `be`, `be_fr`, `de` and `fr` — 16 glass roof
panels and 3 spray cans — and 10 in `uk`. **Ticket 50's ten British product pages
are confirmed** and they are 8 sun-shading sets and 2 rubber rolls. The signature
holds no store name; a test reads the source and fails if one appears.

### Every URL that left the list

**105 of 876, and every one of them by the product signature.** The run prints the list, and the
full 105 are at the end of this ticket. `data/10-store-seeds.md` holds them beside
the page table, and that file stays out of git. No URL left for any other reason: no candidate is on a host that is
not one of the five, no two locs of one store claim one page key, and the 876
candidates already carry ticket 50's first clause, which ticket 52 applied.

**Nothing that was in the old seed list is lost.** All 451 old cells are either in
the new set (402) or carried (49).

### The 49 carried rows, and what they turned out to be

48 NL and 1 UK, exactly as ticket 50 said. Their production status is now
measured, and it is the finding of this ticket that nobody asked for:

| production answers | carried rows |
|---|---|
| 404 | **39** |
| 301 or 302 | 7 |
| 200 | 3 |

**Every production 404 in the whole list is a carried row, and there are no
others.** So 39 of the 181 NL pages are *new-only pages* in the sense
`CONTEXT.md` gives the word: they are on the new site and production has no such
page. They are mostly `*/onderdelen*`. They stay in the list — ticket 50 says NL
must not move, and a one-sided page is a scope decision and not an absence — but
"NL has 181 content pages" was never true of production.

Of the 49, 47 came from the crawl of the new site and 2 — `nl/home-nl` and
`uk/home-nl` — were in the sitemap of 2026-08-06 and are in no sitemap of
2026-08-10. Both now redirect to their store root. All 49 carry one provenance,
`carried-over`, and this paragraph is the composition. Ticket 50 proposed
`new-site-crawl` for all 49, which is wrong for two of them.

### The status measurement, 2026-08-10

1,640 urls, both sides of all 820 store pages. `data/11-page-status.json` is
tracked, because ticket 22 exists precisely because 451 numbers were recorded and
nobody could check them.

| store | pairs | prod 200 | prod 3xx | prod 404 | new 200 | new 3xx | new 404 |
|---|---|---|---|---|---|---|---|
| nl | 181 | 135 | 7 | 39 | 165 | 2 | 14 |
| be | 131 | 131 | 0 | 0 | 121 | 2 | 8 |
| be_fr | 122 | 122 | 0 | 0 | 115 | 0 | 7 |
| de | 134 | 133 | 1 | 0 | 123 | 0 | 11 |
| fr | 123 | 123 | 0 | 0 | 117 | 0 | 6 |
| uk | 129 | 127 | 2 | 0 | 121 | 1 | 7 |

**Not one request failed, and not one maintenance page answered.** So ticket 22's
`prodStatus` column of 451 zeroes is answered: it was the maintenance window and
nothing else. The `prodMaintenance` flags are gone with the rest of the status
half — maintenance is a state of a moment and never a property of a page.

Production answers 200 on 771 of 820 store pages. The new site answers 200 on 762
and 404 on 53, which is axis A's real backlog and ticket 54's subject.

The pass stops on the first 500 or 503, and it also stops when a whole side of a
store answered nothing at all. A column of failures reads like a measurement.

### The page key: a parenthesis, never a colon

369 of the 550 rows have no `nl-NL` alternate and are a row of their own store.
Their key is `(store)path` — `(fr)heavy-duty-veranda`, `(be_fr)fr/pergola`.

The old generator's unused fallback used a colon. Ticket 54 says do not ship it,
and the producer is this ticket, so the decision is made here: **a colon is the
NTFS alternate-data-stream separator** and it breaks the extract writer, the
report writer and the static build. The parenthesis has carried `(home)` since
ticket 04 and survives all three. The schema check refuses a colon.

**The 181 anchored keys are byte-identical to the old ones.** Nothing detaches.

**All six store roots key to `(home)`, whatever they declare.** Measured: `be/`
and `de/` declare no alternate at all, and `be/fr/` and `fr/` declare each other
and no Dutch page. Only `nl/` and `co.uk/` carry an `nl-NL` alternate. So the
alternate rule alone would have made four one-store rows out of one page and
orphaned every finding stored against `(home)`. The store root is the home row by rule, which also retires the
hand-seeded `store-home` provenance that ticket 52 found stale: all six roots are
in the sitemaps.

### Two things ticket 50 says that the data does not

Both are recorded here rather than settled quietly, per `AGENTS.md`.

1. **The product signature.** See above. The stated form cannot produce the stated
   result; the measured form does.
2. **"`{nl, be}`, `{be_fr, fr}`, `{de}` alone, `{uk}` alone. No other pairing
   exists."** There are **sixteen** shapes of alternate block over the 771
   sitemap-found content pages. The two largest are the two ticket 50 names —
   `{be_fr, fr}` 178 and `{be, nl}` 152 — and they carry the store-local content,
   which is the claim that matters for the rule. But `{de, nl, uk}` holds `serre`,
   `wintergarten` and `pergola`, `{de, uk}` holds `showroom-berlin`, and
   `{be, de, nl, uk}` holds 56 pages. This changes no rule here. **Axis B must
   know it**, because it means a cluster is not always a Dutch page with
   translations.

A third thing is smaller: 187 content pages carry no alternate at all, of which
87 are `de` and 85 are `uk`. Ticket 50 says the `de` and `uk` stores carry no
alternates on store-local content, and that is true; it is not the whole of the
no-alternate set. 6 are `nl`, 5 are `be`, 3 are `fr` and 1 is `be_fr`.

### What this ticket did not do

- **The 283 clusters with no NL member are 369 one-store rows.** This ticket's own
  criterion says a page with no `nl-NL` alternate is a row of its own store, and
  that is what was built. Ticket 50 counted six clusters that hold more than one
  store — `pergola`, `heavy-duty-veranda` and four others — and those are now two
  or three rows each. An unanchored page is absent from axis B by definition
  (`CONTEXT.md`), so nothing is lost on axis A. Axis B may want them joined.
- **The excluded pages are not marked.** About 60 pages in the new set have no
  content to compare. That is ticket [56](56-an-excluded-page-says-why.md).
- **No store is crawled or compared on the new list.** That is tickets
  [54](54-french-store-shows-all-its-pages.md) and
  [55](55-five-stores-show-all-their-pages.md). `compare/contract.mjs` now says
  what the page key is instead of promising a Dutch url key; the twelve readers
  that hold a shape assumption are ticket 54's.

### What the review changed

Two axes, both run against the staged change.

- **The store list was born a second time.** `crawl/seed-list.mjs` declared its
  own `STORES`, and `compare/vocabulary.mjs` already owned one. `crawl/` cannot
  import `compare/`, so ADR 0001's three questions all answer yes and the list
  moved to `shared/stores.mjs`. `compare/vocabulary.mjs` re-exports it, so its
  readers are unchanged. The log's most load-bearing piece of vocabulary is one
  list again.
- **The cell field is `provenance`, not `source`.** `CONTEXT.md` gives the word,
  and `AGENTS.md` says to read `CONTEXT.md` before naming anything. The old name
  survived from the generator this ticket replaced. Nothing outside the generator
  read it. The seed list's own `source` block is renamed `inputs`, so one word
  does not name two things in one file.
- **Three statements about the store roots were wrong**, in a comment, in a test
  name and in this ticket. Corrected above, and the test now asserts all six
  roots instead of three.

**Two modules that ADR 0001 assigns to this spec did not move.**
`crawl/excluded-pages.mjs` and `crawl/seed-rows.mjs` qualify for `shared/` and
make `web/src/lib/reports.mjs` reach backwards into `crawl/`. The ADR says "Spec
50 rewrites `crawl/`, and it opens both files, so that is the change that moves
them". **This ticket opens neither**, and the ADR's own rule is that a module
moves with the change that has a reason to open the file. Ticket 54 opens
`reports.mjs`, and that is where the two belong.

### The 105 URLs, in full

Every one of them by the product signature.

- `.be/fr/aerosol-anthacite-mat`
- `.be/fr/aerosol-blanc-mat`
- `.be/fr/aerosol-noir-mat`
- `.be/fr/couper-une-plaque-de-toit-de-verre-2500mm-x-700mm-sur-mesure`
- `.be/fr/couper-une-plaque-de-toit-de-verre-3000mm-x-700mm-sur-mesure`
- `.be/fr/couper-une-plaque-de-toit-de-verre-3500mm-x-700mm-sur-mesure`
- `.be/fr/couper-une-plaque-de-toit-de-verre-4000mm-x-700mm-sur-mesure`
- `.be/fr/couper-une-plaque-de-toit-de-verre-opale-2500mm-x-700mm-sur-mesure`
- `.be/fr/couper-une-plaque-de-toit-de-verre-opale-3000mm-x-700mm-sur-mesure`
- `.be/fr/couper-une-plaque-de-toit-de-verre-opale-3500mm-x-700mm-sur-mesure`
- `.be/fr/couper-une-plaque-de-toit-de-verre-opale-4000mm-x-700mm-sur-mesure`
- `.be/fr/plaque-toit-en-verre-non-durcie-2500mm-x-700mm`
- `.be/fr/plaque-toit-en-verre-non-durcie-3000mm-x-700mm`
- `.be/fr/plaque-toit-en-verre-non-durcie-3500mm-x-700mm`
- `.be/fr/plaque-toit-en-verre-non-durcie-4000mm-x-700mm`
- `.be/fr/plaque-toit-en-verre-opale-non-durcie-2500mm-x-700mm`
- `.be/fr/plaque-toit-en-verre-opale-non-durcie-3000mm-x-700mm`
- `.be/fr/plaque-toit-en-verre-opale-non-durcie-3500mm-x-700mm`
- `.be/fr/plaque-toit-en-verre-opale-non-durcie-4000mm-x-700mm`
- `.be/glazen-dakplaat-2500mm-x700mm-op-maat-snijden`
- `.be/glazen-dakplaat-3000mm-x-700mm-op-maat-snijden`
- `.be/glazen-dakplaat-3500mm-x-700mm-op-maat-snijden`
- `.be/glazen-dakplaat-4000mm-x-700mm-op-maat-snijden`
- `.be/glazen-dakplaat-ongehard-2500mm-x-700mm`
- `.be/glazen-dakplaat-ongehard-3000mm-x-700mm`
- `.be/glazen-dakplaat-ongehard-3500mm-x-700mm`
- `.be/glazen-dakplaat-ongehard-4000mm-x-700mm`
- `.be/melkglas-dakplaat-ongehard-2500-mm-x-700-mm`
- `.be/melkglas-dakplaat-ongehard-3000-mm-x-700-mm`
- `.be/melkglas-dakplaat-ongehard-3500-mm-x-700-mm`
- `.be/melkglas-dakplaat-ongehard-4000-mm-x-700-mm`
- `.be/melkglazen-dakplaat-2500mm-x-700mm-op-maat-snijden`
- `.be/melkglazen-dakplaat-3000mm-x-700mm-op-maat-snijden`
- `.be/melkglazen-dakplaat-3500mm-x-700mm-op-maat-snijden`
- `.be/melkglazen-dakplaat-4000mm-x-700mm-op-maat-snijden`
- `.be/spuitbus-mat-antraciet`
- `.be/spuitbus-mat-wit`
- `.be/spuitbus-mat-zwart`
- `.co.uk/50-metre-roll-of-black-rubber-for-beams`
- `.co.uk/54-metre-roll-black-wall-rubber`
- `.co.uk/sun-shading-screen-housing-set-of-2-5m-matt-anthracite-2023`
- `.co.uk/sun-shading-screen-housing-set-of-2-5m-matt-white`
- `.co.uk/sun-shading-screen-housing-set-of-3-5m-matt-anthracite-2023`
- `.co.uk/sun-shading-screen-housing-set-of-3-5m-matt-white`
- `.co.uk/sun-shading-screen-housing-set-of-3m-matt-anthracite-2023`
- `.co.uk/sun-shading-screen-housing-set-of-3m-matt-white-2023`
- `.co.uk/sun-shading-screen-housing-set-of-4m-matt-anthracite-2023`
- `.co.uk/sun-shading-screen-housing-set-of-4m-matt-white-2023`
- `.de/glas-dachplatte-nicht-gehartet-2500mm-x-700mm`
- `.de/glas-dachplatte-nicht-gehartet-3000mm-x-700mm`
- `.de/glas-dachplatte-nicht-gehartet-3500mm-x-700mm`
- `.de/glas-dachplatte-nicht-gehartet-4000mm-x-700mm`
- `.de/glasdachplatte-2500mm-x-700mm-auf-mass-schneiden`
- `.de/glasdachplatte-3000mm-x-700mm-auf-mass-schneiden`
- `.de/glasdachplatte-3500mm-x-700mm-auf-mass-schneiden`
- `.de/glasdachplatte-4000mm-x-700mm-auf-mass-schneiden`
- `.de/milch-glasdachplatte-2500mm-x-700mm-auf-mass-schneiden`
- `.de/milch-glasdachplatte-3000mm-x-700mm-auf-mass-schneiden`
- `.de/milch-glasdachplatte-3500mm-x-700mm-auf-mass-schneiden`
- `.de/milch-glasdachplatte-4000mm-x-700mm-auf-mass-schneiden`
- `.de/milchglas-dachplatte-nicht-gehartet-2500mm-x-700mm`
- `.de/milchglas-dachplatte-nicht-gehartet-3000mm-x-700mm`
- `.de/milchglas-dachplatte-nicht-gehartet-3500mm-x-700mm`
- `.de/milchglas-dachplatte-nicht-gehartet-4000mm-x-700mm`
- `.de/spruhdose-matt-anthrazit`
- `.de/spruhdose-matt-schwarz`
- `.de/spruhdose-matt-weiss`
- `.fr/aerosol-anthacite-mat`
- `.fr/aerosol-blanc-mat`
- `.fr/aerosol-noir-mat`
- `.fr/couper-une-plaque-de-toit-de-verre-2500mm-x-700mm-sur-mesure`
- `.fr/couper-une-plaque-de-toit-de-verre-3000mm-x-700mm-sur-mesure`
- `.fr/couper-une-plaque-de-toit-de-verre-3500mm-x-700mm-sur-mesure`
- `.fr/couper-une-plaque-de-toit-de-verre-4000mm-x-700mm-sur-mesure`
- `.fr/couper-une-plaque-de-toit-de-verre-opale-2500mm-x-700mm-sur-mesure`
- `.fr/couper-une-plaque-de-toit-de-verre-opale-3000mm-x-700mm-sur-mesure`
- `.fr/couper-une-plaque-de-toit-de-verre-opale-3500mm-x-700mm-sur-mesure`
- `.fr/couper-une-plaque-de-toit-de-verre-opale-4000mm-x-700mm-sur-mesure`
- `.fr/plaque-toit-en-verre-non-durcie-2500mm-x-700mm`
- `.fr/plaque-toit-en-verre-non-durcie-3000mm-x-700mm`
- `.fr/plaque-toit-en-verre-non-durcie-3500mm-x-700mm`
- `.fr/plaque-toit-en-verre-non-durcie-4000mm-x-700mm`
- `.fr/plaque-toit-en-verre-opale-non-durcie-2500mm-x-700mm`
- `.fr/plaque-toit-en-verre-opale-non-durcie-3000mm-x-700mm`
- `.fr/plaque-toit-en-verre-opale-non-durcie-3500mm-x-700mm`
- `.fr/plaque-toit-en-verre-opale-non-durcie-4000mm-x-700mm`
- `.nl/glazen-dakplaat-2500mm-x700mm-op-maat-snijden`
- `.nl/glazen-dakplaat-3000mm-x-700mm-op-maat-snijden`
- `.nl/glazen-dakplaat-3500mm-x-700mm-op-maat-snijden`
- `.nl/glazen-dakplaat-4000mm-x-700mm-op-maat-snijden`
- `.nl/glazen-dakplaat-ongehard-2500mm-x-700mm`
- `.nl/glazen-dakplaat-ongehard-3000mm-x-700mm`
- `.nl/glazen-dakplaat-ongehard-3500mm-x-700mm`
- `.nl/glazen-dakplaat-ongehard-4000mm-x-700mm`
- `.nl/melkglas-dakplaat-ongehard-2500-mm-x-700-mm`
- `.nl/melkglas-dakplaat-ongehard-3000-mm-x-700-mm`
- `.nl/melkglas-dakplaat-ongehard-3500-mm-x-700-mm`
- `.nl/melkglas-dakplaat-ongehard-4000-mm-x-700-mm`
- `.nl/melkglazen-dakplaat-2500mm-x-700mm-op-maat-snijden`
- `.nl/melkglazen-dakplaat-3000mm-x-700mm-op-maat-snijden`
- `.nl/melkglazen-dakplaat-3500mm-x-700mm-op-maat-snijden`
- `.nl/melkglazen-dakplaat-4000mm-x-700mm-op-maat-snijden`
- `.nl/spuitbus-mat-antraciet`
- `.nl/spuitbus-mat-wit`
- `.nl/spuitbus-mat-zwart`
