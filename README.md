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
| `compare/` | Normalisation, element matching, finding ids, classification. |
| `api/` | The local re-check service. |
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

## Status

`crawl/extract.mjs` is the extractor v2 (ticket 07). It gives elements, links,
images, meta and Markdown in one pass, for one URL. The numbered `0*.mjs`
scripts are the baseline from the `sitemap-content-overview` survey. They make
the seed data, and they do not follow the contract.

The decisions are in `../../gitlab/devdva02/.scratch/content-parity-log/map.md`.
`CONTEXT.md` holds the words that the code uses.
