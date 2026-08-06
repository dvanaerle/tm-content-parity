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

## Status

The repo is a scaffold. The scripts in `crawl/` are the baseline from the
`sitemap-content-overview` survey. They are moved here without changes, and
ticket 07 replaces them with the extractor v2.

The decisions are in `../../gitlab/devdva02/.scratch/content-parity-log/map.md`.
`CONTEXT.md` holds the words that the code uses.
