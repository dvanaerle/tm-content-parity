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
| `overrides/` | What an editor's ticks add up to. `state.mjs` is pure and tested; `supabase.mjs` is the whole database surface, three functions wide. |
| `api/` | The local re-check service, which also serves `dist/`. |
| `web/` | Astro static build, with React islands for the interactive parts. |
| `data/` | Generated JSON. Not in git. |
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
node crawl/21-crawl-store.mjs nl     # ~2 min. --force to re-crawl
node compare/link-status.mjs nl      # ~3 min
node compare/30-compare.mjs nl       # seconds
npm start                            # build the front end and serve it on :4321
```

`data/` is not in git, so a fresh clone needs the first three commands before the
front end has anything to show.

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
images, meta and Markdown in one pass, for one URL. The numbered `0*.mjs`
scripts are the baseline from the `sitemap-content-overview` survey. They make
the seed data, and they do not follow the contract.

The decisions are in `.scratch/content-parity-log/map.md`.
`CONTEXT.md` holds the words that the code uses.
