# CONTEXT — the words this repo uses

Written in ASD-STE100 Simplified Technical English. Each word below has one
meaning in the code, in the interface and in the tickets. The decisions behind
them are in `devdva02/.scratch/content-parity-log/map.md`.

## The two sites

- **Production** — the live Tuinmaximaal site. It is the reference. Each
  difference is a defect on the new site.
- **New site** — the Hyva site on `*.intern.systems`, not yet released. It is
  the cheap side to change.

## Pages and stores

- **Store** — one of the six Magento store views: `nl`, `be`, `be_fr`, `de`,
  `fr`, `uk`. The `be` and `be_fr` stores have the same host.
- **Page** — one content page, identified by its **NL url key**. The other
  stores translate the category keys, but they keep the NL key for CMS pages,
  so the NL key is the only key that groups the six stores.
- **Store page** — one page in one store. It has a production URL and a new-site
  URL. The new-site URL is a host swap of the production URL.
- **Store-page pair** — the unit of a parity comparison: production and the new
  site, for one store page.

## Extraction

- **Content boundary** — the `<main>` element. Text elements outside `<main>`
  are chrome, and the log ignores them. If a page has no `<main>`, the
  extraction uses `<body>` with the chrome selector list, and it says so.
- **Text element** — one leaf node from the tag list in ticket 02
  (`h1-h6, p, li, blockquote, dt, dd, button, a, figcaption, th, td`). A node
  that contains another node from the list is not a text element: the children
  speak.
- **Raw text** — the text as the page sends it.
- **Normalised text** — the raw text after tier-1 normalisation only. Letter
  case and trailing punctuation stay. If they do not stay, the `casing` finding
  cannot exist.

## Comparison

- **Tier 1** — invisible equivalence: no-break spaces, curly quotation marks,
  dashes, HTML entities, collapsed whitespace. Fold silently.
- **Tier 2** — visible difference: letter case, trailing punctuation. Report as
  a `casing` finding.
- **Check** — a family of comparisons: `text`, `links`, `images`, `meta`.
- **Class** — why the two sides are different. The class vocabulary is closed,
  each class has a shown or hidden default, and the class is also the mute key.
  See `compare/contract.mjs`.
- **Finding** — one actionable difference. The tool never makes a finding that
  it then hides. A row that is equal after tier-1 normalisation is not a
  finding.
- **Occurrence count** — how many times the same difference is on the page. It
  is not part of the finding id.

## Identity

- **Finding id** —
  `sha256(store | page | check | rule | prodNorm | newNorm)`, cut to 16
  base64url characters. It is content-addressed, page-scoped and store-scoped,
  and it expires on purpose when the text changes.
- **`rule`** — the class id of the finding. There is no rule identifier that is
  more specific than the class. A consequence: if a re-check gives a finding a
  different class, the id changes and a dismissal detaches.

## Overrides

An **override** is an editor's judgement. It is kept in Supabase, and the table
is append-only.

- **Dismissal** — "these two exact strings are acceptable". Keyed on content,
  thus on the finding id. It expires when either side changes. This is correct
  behaviour: the judgement is stale, and the tool must ask again.
- **Mute** — "this class is never a defect here". Keyed on store, page and
  class. It persists. Muted findings stay visible behind a toggle.
- **Resolved** — not an override. A difference that is really corrected is not
  found by the next re-check, so there is nothing to keep.
- **Editor** — a name that the browser keeps in `localStorage`. There is no
  login.

## Axes

- **Axis A — parity.** Production against the new site, in one store.
- **Axis B — coverage.** NL against the five other stores. Translated text is
  different text on purpose, so axis B does not compare words.

The two axes have separate tabs and separate tasks. Do not mix them.

## Delivery

- **Snapshot** — one build of the log, uploaded to the webhost as static files.
- **Re-check** — a live crawl of one store-page pair, on demand, by the local
  Node service. The hosted build senses that the service is not there and hides
  the button.
