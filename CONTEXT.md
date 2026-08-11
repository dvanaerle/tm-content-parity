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
- **Provenance** — where a cell came from, and which clause of the rule admitted
  it: `sitemap-daily`, `sitemap-low-alternates`, or `carried-over` for the 49
  store pages that no sitemap declares. The NL store has cells that no sitemap
  declares, so the provenance is part of the data and not a comment. The
  hand-seeded store home page is retired: all six store roots are in the
  sitemaps, measured on 2026-08-10.
- **Content page** and **product page** — production distinguishes them in the
  sitemap only by the count of hreflang alternates and by `changefreq`. A product
  page carries all six alternates. See ticket 50 for the rule.
- **Application page** — a page whose content boundary holds a mounted JavaScript
  application instead of content. It has no content unit, because its text is
  transient interface state and not something an editor writes. An application
  page is outside the log by definition, and it is named in a committed list with
  its reason. It is not a one-sided page: a one-sided page waits for somebody to
  rebuild or retire it, while an application page waits for nothing.
- **Not checked** — the list of pages that the log found and does not compare,
  each with the reason. A page on it says why; it is never silently absent, and
  it is counted in the store total. It has three kinds, because a reader acts on
  a decision and on an accident differently (ticket 56):
  - **Dropped by rule** — the seed rule never admitted the URL, so it never
    became a store page. The rule is a **name** in `data/10-store-seeds.json` and
    its words are in `shared/drop-rules.mjs`.
  - **Excluded page** — a store page whose key is in `shared/excluded-pages.mjs`.
    The crawler fetches nothing for it. An application page is of this kind.
  - **Not crawled** — the seed list has the page on both sides and no report
    exists. Nothing decided it; the fetch failed. It is the one kind that is not
    a decision, and the next crawl can still bring it in.

  Do not say "not compared" for any of these. **Uncompared** is taken, and it is
  a row inside a page and not a page (see below).

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

- **Tier 1** — invisible equivalence: every Unicode space, curly quotation marks,
  dashes, collapsed whitespace, and HTML entities in three forms: named,
  decimal and hexadecimal. The soft hyphen and the three zero-width characters
  fold to nothing. A browser draws nothing for them. Fold silently.
- **Tier 2** — visible difference: letter case, trailing punctuation. Report as
  a `casing` finding.
- **Check** — a family of comparisons: `text`, `links`, `images`, `meta`.
- **Class** — why the two sides are different. The class vocabulary is closed, and
  the class is also the mute key. See `compare/contract.mjs`.
- **Visibility** — what a class is for. One of three words, and each class has
  exactly one. **Work** is migration work: it counts. **Information** is a
  difference an editor may want to read: it is rendered and it does not count.
  **Diagnostic** tells the author of a rule what the rule saw: it stays behind the
  noise toggle. Visibility is not a second axis; it replaced a shown-or-hidden
  boolean, and the class stays the only axis. "Excluded from comparison" is not a
  visibility: an excluded region leaves at extraction and never reaches a class.
  See `docs/adr/0005-class-visibility-is-one-enum.md`.
- **Finding** — one actionable difference. The tool never makes a finding that
  it then hides. A row that is equal after tier-1 normalisation is not a
  finding.
- **Occurrence count** — how many times the same difference is on the page. It
  is not part of the finding id.
- **Repeat** — every finding in **one store** with the same class, the same two
  texts and the same detail. It is the unit of a bulk decision, and it is not a
  thing the data holds: it is a grouping the interface makes. A repeat never
  crosses a store, because the stores translate the text, so the same defect in
  six stores is six repeats and not one.
  A repeat is measured in **pages**, and there is no second number beside it. The
  page is a term of the finding id, so one page carries at most one finding of one
  repeat — measured over the corpus, 25,657 repeats and no exception. "How many
  findings" and "how many pages" are one number, and printing both would be the
  doubled figure this list exists to stop. **Occurrences** is the number that does
  differ, and it is a different question: the same difference more than once on a
  single page.
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
  site side by side, with a row for each content unit. It is the spine of the log,
  because most findings are one-sided and the question they ask is where the text
  belongs, which only document order answers. The word diff is a cell renderer
  inside it and not the interface. Markdown is an export beside it and never the
  spine, because Markdown flattens the element identity the finding id needs.
  See `docs/adr/0006-the-content-view-is-the-spine.md`.
- **Context marker** — one row that stands for a run of equal rows and says how
  many blocks it holds. It expands. The content view shows the differing rows by
  default and collapses the rest into markers, so position survives and nobody
  scrolls past agreement. In this state every visible row is a difference, so the
  **row tint carries no signal and it goes**; the class pill carries the class. The
  retired *Diff* tab is what happens without the marker and without that rule.
- **Clamp** — a row that shows some lines of each side, with a control that opens it.
  It is about length and not about findings: a row that agrees can be as tall as a row
  that differs. A clamp holds the two cells of a row at one height, because a row is
  read across. It shows the lines that hold the first difference, or the first lines
  when there is no difference. A clamp hides no finding and it moves no count. A jump
  to a row opens that row.
- **Uncompared** — a two-sided row that is too large for a word comparison. Both
  versions are shown in full, and neither one is coloured. It is a budget and not a
  judgement: the log says that the comparison did not run. It never says that somebody
  rewrote the text, because size is not similarity. The class stays `copy` and the
  score stays with it. "Uncompared" is not a class: the class vocabulary stays closed.
  See `docs/adr/0009-the-word-diff-runs-in-the-browser.md`.
- **Filter** — a narrowing of what is on screen, by class. It is session-only and it
  moves no bar, no denominator and no count. The content view narrows a page to a
  class and the dashboard narrows the page list to the same class; both say so with
  an amber strip for as long as the filter is on.
- **Dashboard** — one store's work on one screen, at `/<store>/`. It carries only
  that store's summaries and only that store's progress numbers. There is no
  all-stores dashboard: a store is the unit an editor is responsible for.
  It holds **two views over one derivation**, and one filter serves both.
  **Verschillen** is the store's repeats, worst-first by pages, and it answers
  *what do I decide next*; opening a row lists its pages, and a page name opens the
  whole content view for that page and never a fragment of it. **Pagina's** is the
  store's pages, worst-first, and it answers *which page do I open next*. There is
  no all-stores repeat view, for the reason there is no all-stores dashboard.
- **Doorway** — the root, `/`. It lists the stores and waits. It is not a dashboard
  and it holds no numbers, because there is no all-stores dashboard for it to be.
- **Store switcher** — the six store ids in the shell header, each a link to that
  store's dashboard. It never goes to the same page in another store: the stores
  translate the category url keys, so that page often does not exist.
- **Noise toggle** — the control that shows hidden classes and muted findings. It is
  **not** a filter: it belongs to the whole log, and *filter wissen* does not clear
  it. An editor who asked to see the muted rows did not ask a question about classes.

Four tab names are retired, and the content view is what replaced the first three.
**"Diff"** showed the differing rows only, so once every row was tinted the tint said
nothing. **"Content"** showed two blocks of flat Markdown and no diff. **"Outline"**
was production's elements indented by heading level, which the content view contains;
what is left of it is a heading jump-list beside the rows.

**"Taken"** was every finding of one page in one list, grouped by check. Each of its
three groups is a tab that shows the same findings with more context, so it was the
one reading of the work that had to strip the context to exist. The grouped reading
now lives on the dashboard as *Verschillen*, which groups **across** pages — where the
repetition is. Nothing it offered is unreachable: a text finding is a row of the
content view, a link and an image finding are rows of Links and Afbeeldingen, and all
four carry the same override control, the same class pill, the same detail and the
same section line.

One word is reserved. **"Fold"** has two meanings in this list and no more: a content
unit folds the words of an inline link, and tier 1 folds a character to nothing. A run
of equal rows **collapses**, and the row that stands for the run is a **context
marker**. Do not write "fold" for that, and do not write it for a clamp.

## Identity

- **Finding id** —
  `sha256(store | page | check | rule | prodNorm | newNorm [| detail])`, cut to 16
  base64url characters. It is content-addressed, page-scoped and store-scoped,
  and it expires on purpose when the text changes. `detail` joins the key only when
  the class has one, so the id of a class without a detail is unchanged.
- **`rule`** — the class id of the finding. There is no rule identifier that is
  more specific than the class. A consequence: if a re-check gives a finding a
  different class, the id changes and a dismissal detaches.

## History

- **Run log** — the record of which findings each observation saw. It is keyed on the
  finding id alone, and it holds three facts: when an id was first seen, whether it is
  in the current snapshot, and when it was last seen. It holds no text, no decision
  and no relation between two ids.
- The run log **never re-attaches**. It cannot say that a new finding is an old
  finding with edited text, and it must not try: a matcher that is wrong carries a
  dismissal onto text that nobody dismissed, and it fails silently. An expired id
  asks a question twice, which is the failure that is visible and cheap. See
  `docs/adr/0004-history-is-a-run-log-that-never-re-attaches.md`.
- **No longer seen** — an id that the current snapshot does not hold. It is not a
  decision and nobody made it.
- One word is refused. **"Changed"** named a finding that the tool believed to be an
  older finding with new text. The tool cannot know that. The history note is what is
  left of the idea.

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
- **Mute** — a judgement about a class in one place: "this class is never a defect
  here." Keyed on store, page, class and **anchor heading**, so it names a section.
  A **page-wide mute** is the same judgement with the heading left out; it stays
  available for a page whose headings are content, such as a gallery. A mute persists,
  and muted findings stay visible behind a toggle. A mute **says how many findings it
  hides before it is made**, and it needs a note: it is the one judgement that never
  expires, so it is the one that must be auditable. The anchor heading is in the mute
  key and not in the finding id, because a mute is a judgement and an id is an
  identity. See `docs/adr/0008-the-mute-key-carries-the-anchor-heading.md`.
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
- **Migration decision** — ~~an override on a one-sided page: **migrate**,
  **not migrated**, **replaced** or **redirected**~~. **Withdrawn from the vocabulary
  2026-08-11.** It never existed in the code: the override actions are
  `fixed | dismissed | muted | reviewed | cleared` and nothing else. The four values came
  from a superseded draft, were refused by the user — *usually, every page needs to be
  built*, so a verb per page names a decision already made — and their tickets are parked
  `wontfix` in `.scratch/content-parity-log/issues/.out-of-scope/` (20 and 84). Do not
  reason from this term. It is kept struck through rather than deleted because `PRD.md`
  stories 40 to 42 and 44 still refer to it.
- **Priority** and **Note** — two annotations on a page. Priority is one of a closed
  list of words; a note is free text. Both describe a page and neither describes a
  finding, because a finding carries its own decision. There is no **owner**: with a
  name in `localStorage` and no login, an owner field cannot mean what it says.
- **History note** — a line beside a new finding, saying that a finding of the same
  class closed on the same page in the same run, and what was decided about it. It
  is a display-only difference. It asserts no identity, it is never counted, and it
  is never offered as a decision to accept.
- **Editor** — a name that the browser keeps in `localStorage`. There is no
  login.

Two words are retired. **"Resolved"** hid the difference between a claim and a
judgement. **"Reopened"** describes nothing: a finding is in the snapshot or it
is not. "Resolved" stays retired, and the third bucket is named **Closed**, which
this list already defines.

## Progress

- **Bucket** — one of the three groups a finding is in. There are three and no more:
  **Open**, **Needs attention** and **Closed**. A bucket is a grouping of the derived
  states, and it is not a state itself. Nothing is stored on a finding to put it in
  one.
- **Open** — a finding that waits for a decision.
- **Needs attention** — a finding that is **contradicted**, and nothing else. A page
  review that went stale is a fact about a page, so it is a badge on the page and
  never a finding in this bucket. Two scopes in one bucket would count one thing
  twice.
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
are scope decisions and not editor work, so they stay out of the progress bar.

**There is no migration checklist, and none is planned.** One-sided pages are *shown* and
not *decided*: the `eenzijdig` chip, the store header sentence and a read-only aside naming
each page with its `skipReason`. The default answer for a legacy-only page is to build it,
which needs no vocabulary, so the checklist and its verbs were parked `wontfix` on
2026-08-11 — see `issues/.out-of-scope/20-one-sided-pages-checklist.md` for the reasoning and
the condition that would re-open it. Two cautions survive the park: this population is **not
a census**, because a page created on the new site since 2024 appears in no source at all, so
no "0 remaining" reading is ever true; and a legacy-only page that production **redirects** to
a surviving page is renamed rather than missing.

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
