# tm-content-parity

The content parity log for the Tuinmaximaal storefront.

Production is the reference. The log shows each place where the new Hyva site is
different from production, per store view, and it keeps the work to close each
difference. Content editors read the log on a static webhost. A local Node
service does a live re-check of one page, so a difference that is corrected
closes itself.

## Layout

| Folder | Contents |
| --- | --- |
| `crawl/` | Sitemap parse, fetch, extract. One pass gives elements, links, images, meta and Markdown. |
| `crawl/probes/` | One-time measurement scripts kept as evidence. Do not build on them. |
| `compare/` | Normalisation, element matching, finding ids, classification, position and deep links. |
| `shared/` | Pure decision functions that more than one stage needs. It imports from no stage. See ADR 0001. |
| `overrides/` | What an editor's ticks add up to. `state.mjs` is pure and tested; `supabase.mjs` is the whole database surface, three functions wide. |
| `api/` | The local re-check service, which also serves `dist/`. |
| `web/` | Astro static build, with React islands for the interactive parts. |
| `web/probes/` | The same, for the front end: what a page costs to render and to paint. Do not build on them. |
| `data/` | Generated JSON. Not in git, except `10-store-seeds.json`, which every stage reads, and the three evidence files. |
| `dist/` | The static build that goes to the webhost. Not in git. |
| `supabase/` | The schema and the policies for the override log. |

## Install

**Node 22.12.0 or newer**, for everything here and not only for `web/`: Astro 6
dropped Node 18 and 20, and the crawl scripts, the compare stage and the re-check
service share the one runtime. Both `engines` fields say so, but npm only warns on
a mismatch unless `engine-strict` is set — so read the warning.

```sh
npm install          # crawl, compare, api
npm install --prefix web   # the Astro front end
```

## Test

```sh
npm test
```

## Extract one page

```sh
node crawl/20-extract.mjs nl heavy-duty-terrasoverkapping
node crawl/20-extract.mjs nl carport <prodUrl> <newUrl>   # without the seed file
```

It writes `data/extract/<store>/<page>.json`: the two sides, in the
`PageExtract` shape from `compare/contract.mjs`.

## Run the whole tool

```sh
node crawl/21-crawl-store.mjs nl     # ~2 min. --force to re-crawl. One store.
node compare/link-status.mjs          # ~10 min over every store that is crawled
node compare/30-compare.mjs           # seconds
npm start                             # build the front end and serve it on :4321
```

Crawl each store you want in the log: `nl`, `be`, `be_fr`, `de`, `fr`, `uk`. A
failure is recorded per store, in `data/extract-failures-<store>.json`.

**`link-status.mjs` takes no store, and it refuses one.** It writes one file
keyed on the absolute URL, and it overwrites that file, so a per-store run would
erase the other stores and `30-compare.mjs` would then report no `broken-link`
and no `redirect` there. Given an argument, the script prints why and exits 2
(ticket 59).

`30-compare.mjs` takes an optional store and compares every crawled store without
one. The front end gives each store its own dashboard at `/<store>/`, and `/` lists
them.

`data/` is not in git, with four exceptions. `data/10-store-seeds.json` is
tracked, because every stage above reads it. The two sitemap evidence files and
the status measurement are tracked for the reason in the next sections. A fresh
clone has the seed list and needs the first three commands before the front end
has anything to show.

## The run log

`30-compare.mjs` also rewrites `history/run-log.jsonl`, the index that says when
each finding id was first seen, whether the last run that looked still saw it,
and when it was last seen. It holds no text and no decision, and it never
re-attaches one finding to another — ADR 0004 is every rule of it.

It is **in git while `data/` is not**, because it is the one artefact of a run
that cannot be rebuilt: the run that saw a finding first is over. Git history is
the archive the ADR chose in place of a file per run, which is why the file is
one JSON object per line and why a row that is still seen does not restate the
date — a run that finds nothing new rewrites the header and no row under it.

A run over one store leaves the other five stores' rows untouched. *Not looked
at* is not *no longer seen*. The grain is the store: a page that leaves the
corpus retires its rows on the next run of its store.

## The production sitemap evidence

```sh
node crawl/09-sitemaps.mjs   # ~2 min, 181 MB over the network
```

Each of the six stores serves a `sitemap.xml` of about 30 MB, and each file holds
the urls of all six stores. The run fetches all six, reduces them to the entries
the log reads, and writes two tracked files:

| File | Holds |
| --- | --- |
| `data/sitemap-extract.json` | One entry for each surviving loc: its hreflang alternates, and its `changefreq` in each of the six files. 876 entries, 289 KB. |
| `data/sitemap-manifest.json` | The record of the fetch: the url, the date, the HTTP status, the byte count and the loc count of each of the six. |

Both are in git, because the log's page counts are only checkable while the
production data they came from is checkable. 289 KB against 181 MB of source.

**The extract carries no date.** Its bytes are a function of the six source files
alone. So a second run over an unchanged production gives the same file, and the
git diff shows only the pages that moved. The date belongs to the manifest. The
manifest is the record of one fetch.

`crawl/sitemap-extract.mjs` is the reduction. It is pure, so `npm test` reads it.
`crawl/09-sitemaps.mjs` is the run.

**What survives the reduction**: a loc with fewer than six hreflang alternates, or
a loc that any one of the six files marks `changefreq=daily`. That is ticket 50's
rule without its product signature. An extract that had already applied the
signature could not be used to test it. So the extract holds candidates, and the
seed generator holds the rule.

**Four things stop the run, and each one writes nothing.** A short extract that
looks complete is the defect this evidence exists to stop.

| The host answers | Exit |
| --- | --- |
| 500 or 503 | 3 |
| 200 with a maintenance page | 3 |
| any other non-200 | 1 |
| 200 with no `<url>` block | 1 |

The first two are `maintenanceReason()` from `crawl/fetch-page.mjs`, the one
maintenance rule (ticket 04). All six fetches finish before the reduction starts,
so a failure at the sixth host cannot leave five files' worth of extract on disk.

## Rebuild the seed list

```sh
node crawl/10-store-seeds.mjs   # writes data/10-store-seeds.json and .md
```

This is not part of a normal run. The seed list is in git, so you only run this
to change what is in it.

Both inputs are tracked, so the run is repeatable from a fresh clone:
`data/sitemap-extract.json` is the production evidence, and the committed seed
list carries the 49 store pages that no sitemap declares. Those 49 cannot be made
again — the generator that first found them read an input that no longer exists —
so the generator reads its own previous output to keep them. It is stable: a
second run over the same two inputs gives the same bytes.

**The generator makes no live request.** It writes a page list and nothing else.
The rule is in `crawl/seed-list.mjs`, which is pure and which the tests read:

    (fewer than six hreflang alternates  OR  changefreq=daily in any of the six
    sitemaps)  AND NOT a product signature

It stops before it writes when a store yields no page, when a count is more than
15% from the measurement of 2026-08-10, or when its own output does not keep the
seed schema. A silent short list is the defect ticket 53 exists to fix.

## Measure production and the new site again

```sh
node crawl/11-page-status.mjs   # ~5 min, 1,640 urls
```

The status pass is a second step over the finished seed list, and it writes
`data/11-page-status.json`. Two things in one script is what made the old seed
file half page list and half stale measurement.

It stops with exit 3 on the first 500 or 503, because a status column measured
against a maintenance page is phantom. That is `maintenanceReason()` from
`crawl/fetch-page.mjs`, the one maintenance rule (ticket 04). It also stops when
a whole side of a store answered nothing at all, which is what a column of 451
zeroes looked like before anybody read it.

## The override log

Copy `web/.env.example` to `web/.env.local` and fill in the project URL and the
anon key. Keep the `PUBLIC_` prefix on both names: Astro only gives a variable to
the browser when it has that prefix, and every read and write is in the browser.
Both values are public by design: row level security is the whole protection, and
the `overrides` table has an insert policy and a select policy and **no** update
or delete policy, which is what makes it append-only.

Apply `supabase/schema.sql` in the project's SQL editor. That file **replaces**
the two-kind model it used to hold; ticket 09 gave three scopes and five actions
instead.

Without the two variables the log still reads normally. Only acting is disabled,
and the page says so — it never drops a click silently, and it never shows an
empty override list as "nobody has done anything".

## Status

`crawl/extract.mjs` is the extractor v2 (ticket 07). It gives elements, links,
images, meta and Markdown in one pass, for one URL.

`crawl/10-store-seeds.mjs` makes the seed data, and it does not follow the
contract. The six `0*.mjs` scripts beside it were the rest of that
`sitemap-content-overview` baseline. Ticket 51 deleted them: none was in a run
sequence, none could run, and they looked runnable. Git history holds them.

The decisions are in `.scratch/content-parity-log/map.md`.
`CONTEXT.md` holds the words that the code uses.
