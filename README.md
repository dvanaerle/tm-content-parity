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
| `data/` | Generated JSON. Not in git, except `10-store-seeds.json`, which every stage reads, and the two sitemap evidence files. |
| `dist/` | The static build that goes to the webhost. Not in git. |
| `supabase/` | The schema and the policies for the override log. |

## Install

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

`data/` is not in git, with three exceptions. `data/10-store-seeds.json` is
tracked, because every stage above reads it. The two sitemap evidence files are
tracked for the reason in the next section. A fresh clone has the seed list and
needs the first three commands before the front end has anything to show.

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

**Neither input is in the tree, and this generator still cannot run.** The script
needs `data/sitemap-prod.xml` and `data/03-merged.json`. It names the absent one
and exits 2. Ticket 52 committed the sitemap half as `data/sitemap-extract.json`,
which is a different shape and a different file name, so the generator does not
read it yet — ticket 53 rewrites the generator against the extract, and carries
over the 48 Dutch rows that no sitemap declares.

**The tracked seed list is not reproducible from this tree**, and it is not a
clean measurement. It is the run of 2026-08-06, made while production was in
maintenance mode, so its `prodStatus` column is phantom and it still carries the
`prodMaintenance` flags that the generator no longer writes. It is in git because
every stage above needs a page list to read, not because it is right. Ticket 53
rebuilds it.

The generator asks production for every url, and it stops with exit 3 on the
first 500 or 503, because a status column measured against a maintenance page is
phantom. That is `maintenanceReason()` from `crawl/fetch-page.mjs`, the one
maintenance rule (ticket 04).

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
