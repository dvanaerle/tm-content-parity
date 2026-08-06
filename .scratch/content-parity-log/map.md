# Map: Content parity log

Labels: `wayfinder:map`

## Destination

A running, populated content parity log for the Tuinmaximaal storefront.
Production is the reference; the log shows every place the new Hyvä site differs
from it, per store view, and tracks the work to close each difference. Content
editors read it on a static webhost. A local Node service re-checks a page live,
so a fixed difference closes itself.

Done when an editor can open any page in the log, see a trustworthy list of
differences, act on it, press Recheck, and watch the count fall to zero.

## Notes

- **This map carries execution.** The wayfinder default is plan-only. It is
  overridden here: the destination is a working app, not a spec. Decision
  tickets still resolve one at a time, but the last tickets build the thing.
- **Domain**: Magento 2 Open Source, six store views. Production runs the old
  theme; the new environment runs Hyvä. See `CONTEXT.md` and `AGENTS.md` in
  `devdva02` for the ubiquitous language.
- **Write in ASD-STE100 Simplified Technical English.**
- **Skills to consult**: `mattpocock-skills:grilling` and
  `mattpocock-skills:domain-modeling` for decision tickets;
  `mattpocock-skills:prototype` for UI questions; `mattpocock-skills:research`
  for AFK research. `tuinmaximaal-copy` before any Dutch copy is touched.
  `tuinmaximaal-translator` for the be / be_fr / de / fr / uk stores.
- **Never resolve more than one ticket per session**, research tickets excepted.
- **The tool is the reference now, not the prototype.** Ticket 26 built it. To see
  it, from `Desktop/github/tm-content-parity`:

  ```
  node crawl/21-crawl-store.mjs nl     # ~2 min, 360 requests, --force to re-crawl
  node compare/link-status.mjs nl      # ~3 min, 2,623 unique targets
  node compare/30-compare.mjs nl       # seconds
  node compare/measure.mjs nl          # the regression gate, reads the reports
  cd web && npm run dev                # or npm run build for dist/
  ```

  `data/` is gitignored, so a fresh clone needs the three commands before the
  front end has anything to show.
- The baseline crawl lives in `devdva02/.scratch/sitemap-content-overview/`. Do not
  read that folder whole — it is about 56 MB, and read `index.md` first. Its
  `_prototype/` and `_scripts/` are **superseded** by the repo: judge the built
  tool instead.

## Decisions so far

Settled while charting, in the destination-naming session. No ticket holds them.

- **Production is the source of truth.** Every difference is a defect on the new
  site. The new site is unreleased, so it is the cheap side to change.
- **Status is derived from re-check**, not self-reported. ~~A manual checkbox
  overrides it and wins until cleared.~~ **Amended by ticket 09**: a manual
  *judgement* beats re-check, a manual *claim of fact* loses to it.
- **Overrides live in Supabase**, called straight from the browser. The webhost
  runs no server code, so this is the only way editor ticks are shared.
- **Front end is an Astro static build** — one real HTML page per site page,
  React islands for tabs, diff and tasks. Uploaded as static files.
- **Re-check is a local Node service**, one page on both sites, on demand. The
  hosted build feature-detects it and hides the button.
- **Two comparison axes, kept apart**: Axis A is parity per store, prod to new.
  Axis B is coverage, NL to the other stores. Separate tabs, separate tasks.
  **Extended by ticket 11**: separate *bars* too, and Axis B reads the new site
  only.
- **Six-store data model from day one; NL populated first.**
- **The content unit is every text element in document order.** The content
  outline and the diff are one structure, not two features.
- **Variant A won the UI prototype** — tabbed ledger, prod and new side by side.
  Tabs: Diff, Outline, Links, Images, Content (Markdown), Meta, Tasks.
- **Markdown is a reading and export artifact, never the diff spine.** It
  flattens element identity, which stable finding ids depend on.
- **The pipeline moves into a new `tm-content-parity` repo** in
  `Desktop/github`. The comparison rules stop being gitignored scratch files.
- **The log runs.** Ticket 26 joined the extractor to the front end, and the tool
  is browsable on the whole nl store. Everything after this is adjustment to a
  working thing, not construction of a missing one.
- **A storefront defect is not a map ticket.** The log's *output* belongs in
  `devdva02/docs/storefront-defects.md`, not on the route to the
  destination. Tickets 15, 17 and 18 were closed on that ground.
- **`tm-content-parity` is hosted on GitHub**, at `dvanaerle/tm-content-parity`.
  Settled outside a ticket; it removes the "where is it hosted" fog.

### Resolved tickets

- [01 — Finding identity: stable ids across re-crawls](issues/01-finding-identity.md)
  — Ids are content-addressed and deliberately expire. "Resolved" needs no stable
  id, because re-check removes a genuinely fixed finding; only dismissals must
  survive. Two override kinds: a **dismissal** keyed on content, which expires when
  either side changes, and a **mute** keyed on page-plus-class, which persists and
  covers rotating campaigns and prices. Id is
  `sha256(store | page | check | rule | prodNorm | newNorm)`, page-scoped, with the
  occurrence count excluded. No fuzzy re-attachment is needed.
  Found and fixed a real collision bug on the way.

- [02 — Comparison and normalisation rules](issues/02-comparison-rules.md)
  — A finding is an **actionable difference**; the tool never makes a finding it
  then hides. Normalisation splits in two: tier 1 (invisible — spaces, quotation
  marks, dashes, entities) folds silently, tier 2 (letter case, trailing
  punctuation) reports as a `casing` finding. The confidence axis is **removed**;
  `class` is the only axis and it is also ticket 01's mute key, so six named
  classes each carry a shown/hidden default: `copy`, `structure`, `casing` shown;
  `restructured`, `price`, `campaign` hidden. Campaign now needs the pattern on
  **both** sides, which kills the `Bekijk alle deals` misclassification;
  `restructured` needs the tag to differ across the sides, so wrong values in a
  specification table stay visible. Pair threshold 0.55 to **0.6**, never across
  heading levels. All anchors count, not only the CTAs. **`<main>` is the content
  boundary** — inside it the chrome list removes nothing, so it survives only as
  the `body` fallback, trimmed from 16 selectors to 9. The grouping key keeps
  letter case, or the `casing` finding cannot exist.

- [14 — Content outside `<main>` on the new site](issues/14-main-boundary-asymmetry.md)
  — Neither branch was right: the 8 elements are **not** content and **no** chrome
  selector is missing. The new site sends malformed HTML, and `node-html-parser`
  deletes the `<body>` and `<header>` while parsing, so the `header` selector
  cannot match what the parse already removed. All 8 (15 under the all-anchor
  rule) are chrome inside `header.page-header`. Fix the parse, not the boundary:
  `closeAllByClosing: true` takes the gap to **0 on 149 of 149** pages, recovers
  `<main>` on 4 more, and changes the `<main>` leaf count on **0** of 147 healthy
  production pages. `<main>` stays the boundary. `[class*="breadcrumb"]` is
  **restored** to the trimmed list — it leaks on 104 of 147 production pages.
  The boundary-suspect flag is **not** built; assert loudly on a missing `<body>`
  or `<main>` instead. A silent `?? root` fallback hid this for a whole crawl.
  Corrects two statements in ticket 02. Side finding graduated to ticket 15.

- [03 — Supabase: limits, access model and schema](issues/03-supabase-access-model.md)
  — Supabase fits. The anon key is meant to be public; RLS is the whole protection,
  and omitting UPDATE and DELETE policies makes the table append-only for free.
  Identify editors with a name in localStorage, not Anonymous Sign-In. Skip
  Realtime. No CORS allowlist needed. **Free projects pause after ~7 days idle and
  fail silently** — graduated to ticket 13.

- [04 — Seed lists for all six store views](issues/04-six-store-page-lists.md)
  — Built: **181 pages, 451 store-page pairs**, new-site status measured over 902
  requests. Per store: nl 181, be 126, de 45, uk 42, be_fr 29, fr 28. The scale
  expectation in the ticket was wrong — the sitemap yields **exactly** the hreflang
  counts, so hreflang missed nothing; the extra 48 NL pages come from the crawl.
  Row key is the NL url key from the `nl-NL` alternate, because `de`, `fr`, `uk` and
  `be_fr` translate the **category** keys while keeping the NL key for CMS pages.
  **No non-NL page lacks an NL counterpart** — all 446 cluster onto an NL page. The
  new-site url is a plain host swap, verified live. 26,645 rows excluded as
  `changefreq=never`, which covers PDPs, blog posts and gallery photos in one
  undifferentiated number. Found on the way: the new site serves **no sitemap**, no
  store home is in the production sitemap, and production was in **maintenance
  mode** all session, so `prodStatus` is not yet a measurement.

- [05 — Link checking rules](issues/05-link-checking-rules.md)
  — The Links tab compares **targets only**; anchor text belongs to the Diff tab.
  Status-check **internal hosts only** — the external surface is 28 hosts of YouTube,
  Maps and review platforms, all unfixable here. Seven classes, because `class` is the
  mute key: `broken-link` (absolute, fires even when production is broken too),
  `missing-link`, `link-target`, `leakage`, `cross-store-link` shown; `redirect` and
  `extra-link` hidden. Target identity folds the page's own two hosts to one token,
  lowercases the path, strips the trailing slash, **keeps** the query, **drops** the
  fragment. `leakage` needs the live-domain path to **exist as a new-site page**, which
  spares the `disclaimer` boilerplate and the `360tour` service; `cross-store-link` is
  **host**-based, not store-based, because be and be_fr share a host. HEAD then GET
  fallback, dedupe site-wide, concurrency 8. `rel`/`target`/`nofollow` out of scope.
  Measured site-wide: leakage on **36 of 415 pages** from four root causes, cross-store
  leakage **0**, and 7% of anchors non-navigational with **no** `javascript:` or
  protocol-relative hrefs. Side findings: 4 links to a stale
  `tuinmaximaalbe.intern.systems` host, and a redirect loop graduated to ticket 17.

- [06 — Image matching and alt text rules](issues/06-image-matching-rules.md)
  — **Full-path matching is dead at 2.8%** — production serves content images
  through Cloudflare Image Resizing and the two environments carry different catalog
  cache hashes. The key is the **basename, lowercased**, with only a true size suffix
  (`-1292x729`) stripped, never a bare `_N`, which on the gallery pages is the only
  thing separating two different photos. 357 pairs, 1 collision in 124 pages.
  `srcset` has **zero** instances on either site, so none is built; the new site's
  76 images with no `src` at all are **not images** for parity. `<main>` is the
  boundary, inherited from 14. Five classes: `image-missing`, `alt-lost`,
  `alt-changed` shown, `image-added`, `image-campaign` hidden. **Amends ticket 02**:
  campaign fires on **either** side for images, because one production banner sits
  in `<main>` on 123 of 124 pages and would otherwise be the largest source of
  findings in the dataset, all of it noise. Compare as a **set**, not a multiset —
  the new site emits 411 srcs twice per page. Empty alt is **parity only**, which
  dissolves the decorative question with no human judgement; 112 real `alt-lost`.
  No perceptual hash and **no** dimension check. Alt normalisation reuses 02, so a
  case-only alt difference fires the existing `casing` class. Alt translation handed
  to ticket 11; production's `.de` media graduated to ticket 18.

- [08 — Scaffold the tm-content-parity repo](issues/08-repo-scaffold.md)
  — The repo exists at `Desktop/github/tm-content-parity`, commit `a52aef6`, local
  only, tests green and the static build green. **`compare/contract.mjs` is the one
  data contract**: all 18 classes from 02, 05 and 06 with their shown or hidden
  default, `findingId()` and `muteKey()` from 01, and the `PageExtract` /
  `Finding` / `PageReport` shapes as JSDoc typedefs. `CONTEXT.md` holds the
  ubiquitous language. Three decisions the ticket did not give: **`rule` is the
  class id** (no finer identifier exists, so a re-classification detaches a
  dismissal — written down as a consequence), **Tailwind 4 through the Vite
  plugin** rather than the storefront's Tailwind 3, and the scratch scripts are
  **copied, not deleted**, because tickets 07, 15, 17 and 18 point at those paths.
  Two live copies of the crown jewels is a real hazard — **ticket 07 must delete
  the scratch copies** when it replaces the extractor. `_scripts/MOVED.md` marks
  the repo canonical meanwhile. Page keys with a slash render through an Astro
  rest route, verified with a fixture.

- [07 — Extractor v2: elements, links, images, meta, Markdown](issues/07-extractor-v2.md)
  — Built and committed, `tm-content-parity` `bb49230`, 53 tests green.
  `crawl/extract.mjs` gives the `PageExtract` in one pass; `crawl/normalise.mjs`
  holds tier 1 for the elements, the alt text and the meta alike;
  `crawl/fetch-page.mjs` carries ticket 04's maintenance guard;
  `extractStorePage()` in `crawl/20-extract.mjs` is the unit ticket 10 calls.
  Measured on the whole nl store, 362 requests: **361 pages extracted, 0 throws,
  boundary `main` on all of them** — the `body` fallback fired zero times,
  because ticket 14's parse recovered the 3 production pages that had no
  `<main>`. Three decisions the ticket did not give: percent encoding in a link
  query **folds** (one page sends `6039,6040` and `6039%2C6040` for one target),
  images are **deduplicated in the extractor** because the identity is made
  there, and the contract gains `PageDiagnostics` for the images that carry no
  identity. Link status checking stays out: it needs a cache across pages.
  **The compare stage must gate on `status === 200`** — a 404 page still
  extracts, because the 404 page has a `<main>`. Side finding graduated to
  ticket 19.

- [09 — Task lifecycle and progress model](issues/09-task-lifecycle.md)
  — A finding has **no stored state**; it has overrides, and an override is either
  a **claim of fact** or a **judgement**. That split answers precedence:
  `dismissed` and `muted` beat re-check, `fixed` loses to it and shows as
  **contradicted** — *claimed fixed, still differs*, attributed. The old "manual
  checkbox always wins" rule is amended above, because it hid the one case where a
  tick permanently buries a real defect. `fixed` exists because **re-check is
  local and the hosted build hides the button**, so an editor on a frozen snapshot
  needs a way to move the count. Four kinds on **one append-only table**, latest
  event per `(scope, key)` wins: `fixed`/`dismissed`/`cleared` on the finding id,
  `muted`/`cleared` on the mute key, `reviewed`/`cleared` on store-plus-page. No
  `in progress`, no `reopened`. Dismissal stays page-scoped; bulk is a UI action
  that writes N events, not a third key. Note **mandatory on `dismissed` only**.
  Bar = shown classes on this snapshot, closed = absent + dismissed +
  uncontradicted fixed; a **mute leaves the denominator**, a dismissal enters the
  numerator; always show absolute counts, because the denominator moves. A **page
  review goes stale, never expires** — "changed since review", not "needs review".
  Roll-up: findings closed over page/store/migration summed by finding, fresh
  reviews over store/migration, class as a breakdown, **axis A only**. The ticket's
  confidence-axis question was stale — ticket 02 removed that axis. One-sided pages
  ruled out of the bar and graduated to ticket 20. Retires the words "resolved" and
  "reopened".

- [11 — Axis B: cross-language coverage rules](issues/11-axis-b-coverage.md)
  — Axis B reads the **new site only**; production is never touched, which makes it
  the one axis buildable on the seed data as it stands. **Every store compares to
  NL**, including `fr` — NL is the only complete reference. Five checks: presence,
  untranslated text, alt language, meta, heading outline. **Link paths and element
  counts are removed** — ticket 04 proved the stores translate url keys, so a
  differing path is the normal case. Untranslated is **identical-string set
  membership**, not language detection and not element pairing: the extract carries
  no DOM path, and none is needed, so the check is immune to reordering. Skip under
  3 words after stripping; brand tokens in a committed list, not Supabase. **Three
  untranslated classes** because `class` is the mute key and a shared one would make
  an editor hide body copy to silence a `<title>`. A **null cell** is `missing-page`
  and an editor mutes the deliberate ones — `muteKey()` already carries the store;
  a **404 cell** is ticket 20, which keeps status logic out of this axis. An absent
  NL reference emits nothing. Outline is **one finding per divergent position**, or
  a per-page id expires on every unrelated heading edit; cap 0.5 to `restructured`.
  Images: `image-missing-store` shown, `image-store-variant` hidden. Nine classes,
  taking the contract from 18 to 27, and the class records gain an `axis` field.
  **Amends ticket 09**: Axis B gets its own bar, never summed with the parity bar.
  Renders in two places — a store-level Coverage view for presence, one more tab
  per page for the rest. Graduated tickets 21, 22, 23, 24; re-worded 12; unblocked
  16.

- [19 — Pages that plain `fetch` cannot read](issues/19-client-rendered-pages.md)
  — The premise was wrong and the correction is the answer: `veranda-configurator`
  is not a content page that `fetch` cannot read, it is an **application page** —
  `<main>` holds one PageBuilder block mounting `Dinoxi_ConfiguratorBff` — and 0
  elements is the correct extraction. Production answers **404** on it and on every
  other configurator key, and it is **nl only**, so the feared wall of findings was
  impossible twice over. An application page is a **page kind, out of the log by
  definition**, not ticket 20's business, because a ticket-20 row would never close.
  Exclusion is a **committed list of exact page keys with reasons**
  (`crawl/excluded-pages.mjs`), never a pattern and never a detection rule; the page
  stays visible in a **Not checked** list. **Browser rendering is ruled out for
  good** — no Playwright anywhere. The guard is **absolute emptiness, never a
  ratio**, and implementing it corrected the agreed shape: an **image-only `<main>`
  is a legitimate page**, so the invariant is no text *and* no image *and* no link
  on a 200 response. It throws, like ticket 14. Built and validated live: 58 tests
  green, 359 extractions, guard fired **0** times. Graduated ticket 25.

- [26 — Build the Axis A compare stage](issues/26-axis-a-compare-stage.md)
  — **The ticket that was missing from this map.** 02, 05 and 06 wrote the rules, 07
  built the extractor, 08 built the shell, and nothing joined them: `data/reports/`
  never existed, so the dashboard rendered its own *"run the comparison first"*
  message while thirteen tickets read as resolved. Built as
  `compare/{match,text,links,images,findings,link-status,30-compare}.mjs` plus
  `crawl/21-crawl-store.mjs`, and the front end is now the tool — a dashboard over
  every page and the Variant A ledger with real data. Commit `52387b1`, branch
  `axis-a-compare-and-log`, 101 tests green, 180 pages built.
  Measured on nl: **179 crawled, 124 comparable** — the same 124 ticket 06 counted
  from the other direction — **8,573 shown findings, median 41 a page, no page
  clean**. Six decisions the tickets did not give, of which two matter most:
  `restructured` never fires on unchanged text, so it means "the text differs *and*
  the element moved"; and `link-target` identifies an anchor by its text, only when
  that text is unique on both sides. The class vocabulary split into
  `compare/vocabulary.mjs` so a browser island can read it without `node:crypto`.
  Found and fixed a real extraction bug (below). Graduated tickets 27 and 28;
  re-scoped 12 from a prototype to a review.

- [29 — Make the log actionable (overrides and re-check)](issues/29-actionable-log.md)
  — **The log can now be worked, not only read.** An editor claims a fix, dismisses
  with a note, mutes a class on a page or marks a page reviewed; a manager gets a
  number that moves. `overrides/state.mjs` is the pure derivation and holds every
  precedence rule; `api/server.mjs` re-checks one page live and `npm start` runs
  the whole tool. 141 tests green, 180 pages built, the comparison numbers
  unmoved (179 crawled, 124 comparable, 8,573 shown) — ticket 28's warning
  against moving the same rows twice was respected. Five decisions the spec left
  implicit, of which two matter most: **the bar is computed over the current
  snapshot only**, so a corrected difference leaves both sides of the fraction and
  the absolute open count is the number that moves; and **observation ids sort
  chronologically by construction**, which is what lets "contradicted by a *later*
  observation" be a string comparison inside a pure function. A `DiffRow` gained
  a `finding` id, because a row is a position and a finding is grouped, and the
  browser cannot recompute the id. **The Supabase project is not yet wired**: the
  log runs in its designed not-connected state, and ticket 13 is still the one
  real risk.

- [28 — 41 findings on a median page, 61% of them `structure`](issues/28-structure-finding-volume.md)
  — **`structure` splits directionally** into `text-missing` (shown) and
  `text-added` (hidden), the split links and images already had and text never
  did. The threshold stays at 0.6, the bar is not re-based, and Diff stays the
  landing tab — because Diff and Content merge and it stops being a wall. Found
  while resolving, and bigger than the question: the pairing matches on text
  while **ignoring tag and kind**, so **762 elements on 67 pages match on text but
  differ in tag or heading level and are reported as identical**, 467 of them a
  heading-level change. A heading demoted from `h2` to `h3` is invisible to the
  log. Two new classes close it. So the ticket both removes findings and adds
  them. Specified as [32](issues/32-scannable-log-and-six-stores.md).

- [33 — The class vocabulary: direction, and the changes the log cannot see](issues/33-directional-text-classes.md)
  — **Phase 1 of spec 32 is built and measured.** `structure` is retired for
  `text-missing` (shown) and `text-added` (hidden), and an exact-text pair whose
  element changed is no longer silent: `heading-level` (shown) when either side is
  a heading, `tag-changed` (hidden) otherwise. 18 classes to 21, `classifyExactPair()`
  in `compare/text.mjs`, 161 tests green. The 0.6 threshold was not touched.

  **Measured in three steps, because the changes pull in opposite directions and
  one number would have hidden both.** Baseline reproduced exactly first
  (10,076 / 8,573 / median 41), then:

  | | findings | shown | median shown |
  |---|---|---|---|
  | baseline | 10,076 | 8,573 | 41 |
  | 1. the directional split | 10,076 | **7,010** | **34.5** |
  | 2. + the two new classes | **10,814** | **7,477** | **37** |
  | 3. + the heading-leaf bug fix | 10,796 | 7,456 | 37 |

  The split is a pure rename — the total does not move, and the whole reduction is
  hiding the invented side: the 5,049 `structure` findings were **3,486 lost** and
  **1,563 invented**. The new classes then add 738 findings, 467 of them shown.
  **179 crawled and 124 comparable held at every step.** `compare/measure.mjs` is
  the new command that prints these numbers, over `rollUp()` in
  `compare/findings.mjs`, so the gate and the page bar cannot count a class
  differently.

  Two things found while resolving. The `a` → `h3` group the ticket ordered
  sampled **was an extraction artefact and is fixed** (below). And **user story 24
  is not closed**: `heading-level` needs identical text, so it surfaces 6 pages
  where an `h1`'s own words moved tag, not the pages that lost the `h1` outright.
  Overrides keyed on `structure` detach, as spec 32 decision 4 accepted.

  **Reviewed on 2026-08-06** against the standards and the spec, and three things
  came back. A finding whose two sides of text are equal now carries a `detail`
  (`h2 → h3`) and the id includes it — without it an `h2` → `h3` and an `h2` → `h4`
  were one id, so a demotion that got worse kept the editor's dismissal. A
  one-sided class carries `direction`, so "lost is shown, invented is hidden" is
  one field rather than three names in three places. And the gate got tests. The
  numbers did not move: no page held two different tag changes of the same words.
  One question is left for a human — the ticket amended its own acceptance
  criterion to drop `axis`, and 39 owns the word.

- [34 — Where is it? Position for every finding](issues/34-position-and-ordering.md)
  — **Phase 2 of spec 32 is built, and the numbers did not move.** 179 crawled,
  124 comparable, 10,796 findings, 7,456 shown, median 37 — ticket 33's baseline to
  the finding. Position adds no rule, so movement would have been a defect.

  The extractor's three walks became **one walk on one counter**. Every record a
  node makes shares that node's position, so an anchor's words and its target
  agree about where they are; a deduplicated image keeps its **first** occurrence.
  `compare/locate.mjs` is the new browser-safe module and holds both answers: the
  nearest heading before a position, and a `#:~:text=` url that opens the live
  page scrolled to it. No DOM path — ticket 01 stands.

  | | |
  |---|---|
  | findings carrying an anchor heading | **9,174** of 10,796 |
  | findings with none, all above the first heading | 1,622 |
  | rows the ordering fix moves | **6,990**, on **109** of 124 pages |

  **The row-ordering defect was bigger than the ticket guessed.** A new-only row
  sorted on its index in the *new* document against *production* indices; it is
  now anchored to the production position of the nearest matched pair before it.
  Invisible today, because the Diff tab shows only the differing rows. Ticket 36
  makes it visible.

  Three decisions the ticket did not give. **`TextElement.index` is no longer the
  position in the `elements` array** — the shared counter runs over images and
  links too — so `DiffRow` carries the array position, which is what the contract
  always said it was. **`anchor` is out of the grouping key as well as out of the
  id**, or one rename under six headings would have become six findings. And the
  ordering rule needed two cases the ticket did not name: an addition above the
  first agreement sits just before that agreement, and a page the two sides agree
  nowhere on reads as production first, then the new site.

### Facts found while charting

- Production emits 9 `data-content-type` attributes on a page where the new site
  emits 246. Production holds this content as plain HTML; the new site rebuilt it
  in PageBuilder. **Section structure is not comparable between the two sites.**
  Element-level alignment is the only viable spine.
- All five new-site store hosts answer 200: `valanticnl`, `valanticbe`
  (`/fr/` for be_fr), `valanticde`, `valanticfr`, `valanticuk`, all on
  `.intern.systems`.
- Neither site sends CORS headers, and both send `X-Frame-Options: SAMEORIGIN`.
  A browser cannot fetch or iframe them. A local service is mandatory.
- `01-parse-sitemap.mjs` discards 22,466 URLs as `otherStore`. Every non-NL page
  is already in the production sitemap. (Superseded by ticket 04, which keeps them
  in `10-store-seeds.mjs`.)
- **Production can be in maintenance mode without warning.** It was, for the whole
  of ticket 04's session, answering the maintenance page on 446 of 451 urls — first
  as a 500 bootstrap exception, then as a 503. Any crawler must match both and fail
  loudly, or a whole run records phantom defects.
- Plain `fetch` is enough for both sites. Playwright is not needed to read
  content, which makes re-check fast. **True for every page in scope**, confirmed
  by ticket 19: the one exception, `veranda-configurator`, is an application page
  and is now excluded from the log, so browser rendering is ruled out for good.
- **An image-only content boundary is a legitimate page shape.** A photo page has
  no text element, so "0 text elements" can never mean "broken" on its own.
  Measured: **0** of 180 nl pages are image-or-link-only, and exactly one page —
  the configurator — holds nothing at all.
- **`fotogalerij` is the extreme of the parity axis**: production 178 text
  elements, 81 images and 13,939 markdown bytes against the new site's 9, 38 and
  156, both sides 200. Five more gallery pages share the shape, 66–178 against 9.
  Ticket 25.
- **Page status, nl store, measured by ticket 07**: production 139 × 200 and
  42 × 404; the new site 166 × 200 and 14 × 404. A 404 page still extracts,
  because the 404 page has a `<main>`.
- Production carries 50 images with **no `alt` attribute**; the new site carries
  none. The new site always writes the attribute, empty when it has nothing to
  say. Production's `nieuwsbrief` page has **no `<title>`** — the only page with
  none, on either side.
- On one page: 90 raw differences group to 61 findings, of which 47 are worth
  acting on. Link and image checks found a 404 and two lost alt texts.
- **Every page has exactly one `<main>`, with four exceptions.** Measured across
  181 pages, 288 requests, all HTTP 200. Production: 135 of 138. New: 149 of 150.
  No page has two. The exceptions are `faq/productinformatie`,
  `faq/wijzigingen-retour` and `tuinhuis-met-overkapping` on production, and
  `blog` on the new site, which is out of scope.
- **The chrome selector list is dead code inside `<main>`** — all 16 selectors
  remove zero text elements on both sites. At the `body` root it removes 23
  (production) and 34 (new), all of it true chrome. No over-stripping was found.
- **The claim that production runs the old theme is doubtful.** On one page,
  production sends Tailwind classes with Hyvä breakpoint prefixes, and both sites
  use the class `page-footer`. The class vocabulary is shared. Confirm before any
  decision depends on it. (The structural half of this claim was withdrawn by
  ticket 14 — see below.)
- **`node-html-parser` silently ate the `<body>` and `<header>` of the new site
  on 149 of 150 pages**, because the site sends malformed HTML. Every earlier
  statement about structure **outside** `<main>` was made with that broken parse
  and must not be trusted. Counts **inside** `<main>` are unaffected. Parse with
  `closeAllByClosing: true`.
- **The maintenance flag in the seed data is stale.** Ticket 06 measured 362
  requests with **0** maintenance responses, while `_data/10-store-seeds.json` still
  records `prodMaintenance: true` on 177 of 181 NL rows. Maintenance is a transient
  state of the moment a crawl ran, never a property of a page. Ticket 04's rule
  stands: detect it live and fail loudly.
- **Production runs Cloudflare Image Resizing; the new site does not.** 662 of
  1,793 in-main production images are `/cdn-cgi/image/…` rewrites. No environment
  path is comparable between the sites — not media, not catalog cache.
- **42 of 181 NL pages answer 404 on production and 200 on the new site** — the
  new-only `*/onderdelen` tree. Direct material for ticket 16.
- Ticket 14's parse fix holds under a second, larger measurement: 0 pages lost
  `<body>` or `<main>` across 362 requests.
- **The seed data is 1086 cells, of which 635 are null.** Only 20 of 181 rows hold
  all six stores; 53 rows are NL only. The small stores are deliberately smaller,
  and a null cell is the machine-readable form of that. New-site 404s per store:
  nl 14, be 8, be_fr 4, de 3, fr 3, uk 2.
- **The extractor is store-agnostic already.** Nothing in `extractPage()` or the
  contract is NL-specific, `STORES` lists all six, and the seeds carry the
  cross-language key. `data/extract/` holds **one** page. The gap is coverage of
  the crawl, not capability.
- **An element carries no DOM path.** `{ index, tag, kind, level, raw, norm }` is
  the whole record, so any check that needs to align two documents must do it from
  text or from the heading levels. Nothing else is available.
- **`CHECKS` declares a `meta` check that no class uses.** The meta vocabulary is
  empty on both axes. Ticket 11 adds the first two, on the coverage axis;
  ticket 21 owns the parity side.
- **`PageMeta` holds no hreflang**, no og and no twitter field.
- **All 451 `prodStatus` values in the seed data are 0**, and `prodMaintenance` is
  stale on nearly every row, because production was in maintenance mode for the
  whole seed run. Ticket 22 re-measures.
- **A `<style>` or `<script>` nested inside an `<a>` was extracted as content.**
  That anchor holds no other text element, so it is a leaf, and `structuredText`
  handed the CSS and the JavaScript over as copy: **151 elements on 23 of 179
  pages**, each a `structure` finding nobody can act on. Ticket 02 had measured that
  the chrome list removes no *element* inside `<main>` — true, and it never asked
  whether the text **inside** one bleeds into an ancestor that is in `TEXT_TAGS`.
  Fixed in ticket 26: `script`, `style` and `noscript` go before any text is read.
  `<template>` deliberately stays, because Alpine renders what is inside it.
- **A heading that wraps an anchor was extracted as the anchor.** The same leaf
  rule, one level up, and the second bug it has hidden. Production builds every FAQ
  question as `<h4 class="panel-title"><a data-toggle="collapse" …>`, so the anchor
  was the leaf and the heading level went in the bin: the element read as a `cta`
  with no level against a plain `<h3>` on the new site. **337 elements on 40 of 179
  pages.** Ticket 28 counted them as 434 `kind` changes and told ticket 33 to sample
  them before trusting `heading-level`, which was the right instinct — the class
  would have reported 330 findings naming the wrong production element. Fixed in
  ticket 33: **a heading is never a container.** `a` → `h3` became `h4` → `h3`, and
  the `kind` changes fell from 434 to 98. The rule is about headings and not about
  accordions because the leaf rule also lost content outright on
  `<h2>Bekijk onze <a>carports</a> nu</h2>` — the anchor was reported and the words
  around it disappeared. **Half of the leaf rule is still open, and has no owner:**
  a container that is not a heading and holds a heading plus loose text
  (`<td>Levertijd <h4>Vraag</h4></td>`) still drops the loose words, because the
  container is skipped for having a text tag inside it. Rescuing them means
  emitting the direct text nodes of a container as an element, which changes what
  an element is and moves the count on all 179 pages. Pinned by a test in
  `crawl/extract.test.mjs`. It also moved two of spec 32's head-of-document numbers:
  pages starting on a non-`h1` fell from 16 to **11**, and pages with no `h1` from 8
  to **3**, because production wraps some `h1`s in an anchor too.
- **762 tag changes are on 80 pages, not 67.** Re-measured by
  `crawl/probes/probe-tag-changes.mjs` while resolving ticket 33. Every other number
  in spec 32's table reproduced exactly — 3,659 exact-text pairs, 762 tag changes,
  467 level changes, 434 `kind` changes — so the page count is the one to distrust.
- **Ticket 02's headline example does not pair.** `Kleuren:` → `Verkrijgbaar in de
  volgende kleuren:` scores **0.33**, below the 0.6 threshold and below the
  prototype's 0.55 as well. It reports as two `structure` findings, each grouped to
  four occurrences. The grouping does the work the ticket wanted; the pairing never
  could. `Bekijk alle deals` → `Bekijk alle FAQs` scores 0.67 and does pair, so the
  fix ticket 02 cared about works end to end.
- **`casing` is 221 findings site-wide.** Ticket 02 left this open — "if letter case
  is different across the full site, the log fills with these findings. Watch this
  after the first full run." It does not. The class stays as decided.
- **A category page is three times as dense as a CMS page.** 17 category pages
  (14% of the store) carry 2,838 shown findings — 33% of the total — at 167 a page
  against 54. Their `<main>` holds a product grid, filter labels and a result count.
  Ticket 27. But `structure` is 59% of the volume with or without them, so ticket 28
  is a separate question.
- **`structure` is 61% of everything shown**, and it is what the log says when the
  pairing found nothing — a statement about the alignment, not about the sites.
  Ticket 28.

## Ready to build

- [32 — A scannable diff, class filters, six stores, and a design system](issues/32-scannable-log-and-six-stores.md)
  — the spec from the grilling session of 2026-08-06, `ready-for-agent`. Eight
  phases, and **phase 1 must be measured before phase 2 starts**. It retires
  `structure` for a directional `text-missing` / `text-added` pair, adds
  `heading-level` and `tag-changed` for the **762 tag changes on 80 pages the log
  reported as identical**, merges Diff and Content into one tinted
  content view, adds class filters and a store switcher over all six stores, gives
  every finding a position, and puts the storefront's 22 brand hexes into one
  Tailwind 4 `@theme`. Resolves ticket 28 and closes ticket 12's remaining
  questions.

  Broken into six build tickets. **33 and 34 are resolved and measured**, so 36
  is unblocked once 35 lands.

  ```
  33 ✓ ──> 34 ✓ ─┐
     └──> 35 ────┴──> 36 ──> 37
  38 (independent)
  ```

  - [35 — One visual language: brand tokens and a real diff](issues/35-diff-rendering-and-design-system.md)
  - [36 — The content view: the whole page, filtered, tickable](issues/36-merged-content-view.md)
  - [37 — Leesweergave: the page as a reader sees it](issues/37-leesweergave.md)
  - [38 — Six stores, not one](issues/38-six-stores.md)

  33 was **measured** before 34 and 35 — three times, because the split and the two
  new classes move the count in opposite directions. **The baseline for every later
  phase is 10,796 findings / 7,456 shown / median 37 / 179 crawled / 124
  comparable**, not 8,573. Take it with `node compare/measure.mjs nl`. Ticket 34
  held all five numbers exactly, which is what a phase that adds no rule must do.

- **Axis B: coverage, NL against the other five stores.** Ticket 11 resolved every
  rule and nothing was built. `/to-tickets` cut it into seven slices on
  2026-08-06. It **supersedes ticket 24** and **folds ticket 23** into 41.

  ```
  33 ✓ (spec 32) ──> 39 ──> 40 ──> 41
                      └──────────────> 42 ──> 43
         38 (spec 32) ┘        └──────────────> 44
                               └──> 45
  ```

  - [39 — The class vocabulary learns about axes](issues/39-class-vocabulary-axes.md)
    — the prefactor. Nothing changes on the screen.
  - [40 — Coverage: missing pages, from the seed file alone](issues/40-coverage-missing-pages.md)
    — the tracer bullet. **Needs no crawl**: the 635 null cells are on disk now.
  - [41 — The coverage matrix, and bulk muting](issues/41-coverage-matrix-bulk-mute.md)
  - [42 — Untranslated text](issues/42-untranslated-text.md) — the highest-value
    check on the axis.
  - [43 — Alt language and meta](issues/43-alt-language-and-meta.md)
  - [44 — Heading outline shape](issues/44-heading-outline-shape.md)
  - [45 — Images across stores](issues/45-images-across-stores.md)

  **Two edges cross into spec 32, and both are real.** Ticket 39 adds an `axis`
  to the same class table that ticket 33 rewrote, so 39 is **unblocked**: 33 landed
  and was measured, and it deliberately left `axis` alone so that 39 still has a
  ticket to resolve. There are 21 classes for it to reach, not 18. Ticket 44 is now
  the nearest owner for spec 32's user story 24, which 33 could not close — a page
  whose first heading is not an `h1` (11 pages) or that has no `h1` at all (3).
  Tickets 42 and 45 need the five stores crawled, which is
  ticket 38, not a ticket of their own —
  [46](issues/46-crawl-five-stores.md) asked for the same crawl and is closed as
  a duplicate.

- [31 — Bulk dismissal across pages](issues/31-bulk-dismissal.md) — the one user
  story in spec 29 that shipped as nothing, found by the code review of the
  spec-29 diff. Ticket 09 already gave the rule (bulk writes N page-scoped
  events, never a third key); what is missing is the grouping key for "the same
  difference on thirty pages", and a measurement that says whether a mute is the
  better answer. Resolve the measurement first — it can shrink the ticket to
  nothing.

- [30 — Wire the Supabase project to the built log](issues/30-wire-the-supabase-project.md)
  is `ready-for-human` and nearly done: the schema is applied, the two public
  values are in `web/.env.local`, and the built bundle carries the client. What
  is left is one click — claim a fix, reload, press Hercontroleer — which is the
  only end-to-end proof of the precedence rule against a real project.

## Not yet specified

- How a built snapshot reaches the webhosting: upload procedure, cadence, and
  who does it.
- Whether screenshots return, for a visual-diff tab. About 362 captures were
  deferred in the baseline.
- Naming the CMS block behind a section. The rendered HTML carries no block
  identifier, so a task cannot yet point at the right admin entity. Needs
  Magento-side data.
- How editors learn that a new snapshot is live, or that new findings appeared.
- Whether blogs re-enter scope once parity closes. 104 posts and 4 blog
  categories are excluded today.

## Out of scope

- **CRO recommendations** — the log says "make new match prod"; CRO advice says
  "make new beat prod". Opposite instructions on the same page destroy trust in
  the log. A separate effort, after parity closes.
- **Website management system / Magento write-back** — editing content from this
  tool needs write credentials, auth, an audit trail and a rollback story, and
  it has no finish line. Ruled out while charting.
- **Product detail pages** — the Magento catalogue owns them.
- **Blogs** — 104 posts and 4 categories would bury the 181 content pages.
- **Phase-2 SEO and copy rewrites** — the log reports; it does not rewrite.
- **Fixing the storefront defects the log finds.** Three were mis-scoped in while
  charting and are now closed:
  [15 — malformed header markup](issues/15-malformed-header-markup.md),
  [17 — the `faq/offerte` redirect loop](issues/17-faq-offerte-redirect-loop.md),
  [18 — production serving NL images from the `.de` host](issues/18-prod-cross-store-media.md).
  All three are real and all three are the log's **output**, so a ticket for them
  could never close by getting nearer the destination. Recorded with their evidence
  in `devdva02/docs/storefront-defects.md`; each needs an owner in the
  `devdva02` storefront work.
