# CONTEXT — the words this repo uses

Written in ASD-STE100 Simplified Technical English. Each word below has one
meaning in the code, in the interface and in the tickets. The decisions behind
them are in `.scratch/content-parity-log/map.md`.

## The two sites

- **Production** — the live Tuinmaximaal site. It is the reference. Each
  difference is a defect on the new site.
- **New site** — the Hyva site on `*.intern.systems`, not yet released. It is
  the cheap side to change.

## Pages and stores

- **Store** — one of the six Magento store views: `nl`, `be`, `be_fr`, `de`,
  `fr`, `uk`. The `be` and `be_fr` stores have the same host.
- **Page** — one content page in one or more stores. A page that production
  declares in Dutch is identified by its **NL url key**. A page that production
  declares only in another language has no NL url key, and it is identified by
  its store and its path. More than half of the pages are of the second kind.
- **Store page** — one page in one store. It has a production URL and a new-site
  URL. The new-site URL is a host swap of the production URL.
- **Store-page pair** — the unit of a parity comparison: production and the new
  site, for one store page.
- **Anchored page** — a page that production declares with an `nl-NL` hreflang
  alternate. It has an NL url key, so it can go beside the other stores.
- **Unanchored page** — a page with no `nl-NL` alternate. It is a page of its
  store, and it is comparable on axis A, because axis A needs no NL page. It is
  absent from axis B.
- **No NL page** and **no declared alternate** are two different things. The
  first says the store has content that NL does not have. The second says
  production does not say which NL page is the counterpart. The log must not name
  the second as the first.
- **Seed row** — one page in the seed list, with one **cell** for each of the six
  stores.
- **Cell** — one store page in a seed row, or `null`. A null cell says that the
  store does not have the page. A cell of a page that answers 404 is a different
  absence, and it is not null.
- **Provenance** — where a cell came from: the production sitemap, a crawl of the
  new site, or the hand-seeded store home pages. The NL store has cells that no
  sitemap declares, so the provenance is part of the data and not a comment.
- **Content page** and **product page** — production distinguishes them in the
  sitemap only by the count of hreflang alternates and by `changefreq`. A product
  page carries all six alternates. See ticket 50 for the rule.
- **Application page** — a page whose content boundary holds a mounted JavaScript
  application instead of content. It has no content unit, because its text is
  transient interface state and not something an editor writes. An application
  page is outside the log by definition, and it is named in a committed list with
  its reason. It is not a one-sided page: a one-sided page waits for somebody to
  rebuild or retire it, while an application page waits for nothing.
- **Not checked** — the list of pages that the log deliberately leaves out, each
  with the reason. An excluded page says why it is excluded; it is never silently
  absent.

## Extraction

- **Content boundary** — the `<main>` element. Content units outside `<main>`
  are chrome, and the log ignores them. If a page has no `<main>`, the
  extraction uses `<body>` with the chrome selector list, and it says so.
- **Content unit** — one block that an editor edits. The blocks are the tag list
  in ticket 02 (`h1-h6, p, li, blockquote, dt, dd, figcaption, th, td`), and an
  `a` or a `button` that stands alone. A unit folds the words of an `a` or a
  `button` inside it, because nobody edits a link apart from its sentence. A
  nested **block** still breaks a unit: an `li` gives way to a `p` inside it.
  See `docs/adr/0002-content-unit-is-the-editable-block.md`.
- **Chrome** — template furniture outside the content boundary. It is not
  editor work on this page, and the log never compares it.
- **Non-editorial region** — a region inside the content boundary whose text the
  catalogue or an extension makes. Nobody writes it, so a difference in it is not
  editor work. A **product grid** is one.
- **Legacy-only region** — a region inside the content boundary that an editor
  wrote and that the new site will not get. It is a scope decision, in the same
  manner as a legacy-only page. The promo banner is one.
- Both kinds of region are excluded at extraction and named in a committed list
  with the reason, so an excluded region says why. The log is blind to what
  changes inside one, and that is correct: neither kind can make editor work.
  See `docs/adr/0003-regions-are-excluded-at-extraction.md`.
- **Canonical viewport** — the one screen width the log reads a page at. Production
  sends the desktop and the mobile version of some blocks in the same HTML, and the
  extraction has no computed style, so it must choose. It chooses desktop. A
  consequence to state plainly: the log does not check the mobile version.
- **Raw text** — the text as the page sends it.
- **Normalised text** — the raw text after tier-1 normalisation only. Letter
  case and trailing punctuation stay. If they do not stay, the `casing` finding
  cannot exist.

One word is retired. **"Text element"** named an HTML element, and it carried the
rule that a node holding another node from the list is not one. The unit is not an
element any more: it folds the links inside it. Both the word and the rule are gone.

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
- **Detail** — what changed, when the two sides of text are equal. `h2 → h3` on a
  `heading-level` or a `tag-changed` finding, and null on every other class. It is
  part of the finding id, because without it two different demotions of the same
  words are one finding.
- **Difference** — any place the two sides do not agree. Wider than a finding:
  every finding is a difference, and a difference the content team has no power
  to change is not a finding. A canonical URL the store config generates is a
  difference and never a finding.
- **Display-only difference** — a difference the log renders but does not count.
  It has no id, no override and no place in a bar, and it is framed so that it
  cannot be read as actionable. The `<head>` panel is made of these.
- **Direction** — which side a one-sided difference is missing from. Content
  production has and the new site lost is a defect; content the new site invented
  is usually not. Every one-sided check names the two directions as two classes,
  and hides the invented side. It is a field on the class (`lost` or `added`), so
  the default and the colour both follow from it.
- **Anchor heading** — the nearest heading before an element in document order.
  It is how a finding says where it is on the page, and it is null for an element
  that precedes every heading. The code says `anchorHeading` in full, never
  `anchor`: on its own that word is the `<a>` element, which the extractor and the
  links check both talk about. Two meanings for one word is what this list exists
  to stop.

## The interface

- **Content view** — the whole store page in document order, production and the new
  site side by side, with a row for each content unit. It is the spine of the log:
  a matched row and a changed row are both in it, so the colour on a changed row
  carries a signal. Markdown is an export beside it and never the spine, because
  Markdown flattens the element identity the finding id needs.
- **Filter** — a narrowing of what is on screen, by class. It is session-only and it
  moves no bar, no denominator and no count. The content view narrows a page to a
  class and the dashboard narrows the page list to the same class; both say so with
  an amber strip for as long as the filter is on.
- **Dashboard** — every page of **one store** on one screen, sorted worst-first.
  It is the store's own page, at `/<store>/`, and it carries only that store's
  summaries and only that store's progress numbers. There is no all-stores
  dashboard: a store is the unit an editor is responsible for.
- **Doorway** — the root, `/`. It lists the stores and waits. It is not a dashboard
  and it holds no numbers, because there is no all-stores dashboard for it to be.
- **Store switcher** — the six store ids in the shell header, each a link to that
  store's dashboard. It never goes to the same page in another store: the stores
  translate the category url keys, so that page often does not exist.
- **Noise toggle** — the control that shows hidden classes and muted findings. It is
  **not** a filter: it belongs to the whole log, and *filter wissen* does not clear
  it. An editor who asked to see the muted rows did not ask a question about classes.

Three tab names are retired, and the content view is what replaced them.
**"Diff"** showed the differing rows only, so once every row was tinted the tint said
nothing. **"Content"** showed two blocks of flat Markdown and no diff. **"Outline"**
was production's elements indented by heading level, which the content view contains;
what is left of it is a heading jump-list beside the rows.

## Identity

- **Finding id** —
  `sha256(store | page | check | rule | prodNorm | newNorm [| detail])`, cut to 16
  base64url characters. It is content-addressed, page-scoped and store-scoped,
  and it expires on purpose when the text changes. `detail` joins the key only when
  the class has one, so the id of a class without a detail is unchanged.
- **`rule`** — the class id of the finding. There is no rule identifier that is
  more specific than the class. A consequence: if a re-check gives a finding a
  different class, the id changes and a dismissal detaches.

## Overrides

A finding has **no state**. It has overrides. An **override** is an editor's
event about a finding, a page class or a page. It is kept in Supabase, and the
table is append-only, so a reversal is a new event and not an edit.

An override is a **claim of fact** or a **judgement**. The difference decides
who wins against re-check.

- **Fix claim** — a claim of fact: "I corrected this." It **loses** to re-check,
  because re-check decides facts. Keyed on the finding id.
- **Dismissal** — a judgement: "these two exact strings are acceptable." It
  **beats** re-check, because re-check cannot decide what is acceptable. Keyed on
  content, thus on the finding id, so it expires when either side changes. This
  is correct behaviour: the judgement is stale, and the tool must ask again. A
  note is necessary.
- **Mute** — a judgement about a class on a page: "this class is never a defect
  here." Keyed on store, page and class. It persists. Muted findings stay visible
  behind a toggle.
- **Page review** — "a human looked at this whole page." Keyed on store and page.
  It covers what the tool cannot see: layout, tone, an image that agrees by name
  and shows something else. It never expires; it becomes **stale**.
- **Cleared** — the one action that revokes the last override on a key. There are
  no `un-` words.
- **Contradicted** — a fix claim that the current snapshot disagrees with. The
  finding is open again, and the interface says *claimed fixed, still differs*,
  with the name of the person who claimed it. It is derived, never kept.
- **Stale** — a page review made against a page whose findings changed after it.
  The interface says **"changed since review"**, not "needs review", because a
  page also becomes stale when an editor corrects things.
- **Editor** — a name that the browser keeps in `localStorage`. There is no
  login.

Two words are retired. **"Resolved"** hid the difference between a claim and a
judgement. **"Reopened"** describes nothing: a finding is in the snapshot or it
is not.

## Progress

- **Closed** — a finding that is absent from the snapshot, or dismissed, or
  claimed fixed and not contradicted.
- **Denominator** — the findings in **shown** classes on this snapshot. A mute
  takes findings out of it; a dismissal moves them into the numerator.
- **Absolute counts go next to each percentage.** The denominator moves at each
  crawl, so a percentage alone reads as a regression when the dataset only became
  larger.
- **Roll-up** — findings closed, over page, store and migration, summed over
  findings and never over pages. Fresh page reviews, over store and migration
  only. A class is a breakdown and never a bar: a class that grows across many
  pages means a rule misfires, not that editors are behind.
- Progress is **axis A only**. Axis B has its own tab and its own count.

## One-sided pages

- **Legacy-only page** — a store page on production that gives 404 on the new
  site.
- **New-only page** — a store page on the new site that gives 404 on production.

Neither can make a finding, because the comparison needs 200 on both sides. They
are scope decisions and not editor work, so they stay out of the progress bar and
have their own migration checklist.

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
