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
- **Spell in UK English**: `behaviour`, `honouring`, `normalisation`. It has been a
  convention by usage since the first ticket and it was written nowhere; ticket 124
  wrote it down, because the interface now spells in the same place the docs do.
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
  node compare/link-status.mjs         # ~10 min, 9,119 unique targets over six stores
  node compare/30-compare.mjs          # seconds
  node compare/measure.mjs nl          # the regression gate, reads the reports
  cd web && npm run dev                # or npm run build for dist/
  ```

  Crawl each of `nl be be_fr de fr uk`. **`link-status.mjs` takes no store**: it
  overwrites one global file, so a per-store run would erase the other stores
  (ticket 38). Ticket [59](issues/59-link-status-overwrite.md) made the script
  refuse the argument and exit 2, so this sentence describes a guard rather than
  being the guard.

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
  _judgement_ beats re-check, a manual _claim of fact_ loses to it.
- **Overrides live in Supabase**, called straight from the browser. The webhost
  runs no server code, so this is the only way editor ticks are shared.
- **Front end is an Astro static build** — one real HTML page per site page,
  React islands for tabs, diff and tasks. Uploaded as static files.
- **Re-check is a local Node service**, one page on both sites, on demand. The
  hosted build feature-detects it and hides the button.
- **Two comparison axes, kept apart**: Axis A is parity per store, prod to new.
  Axis B is coverage, NL to the other stores. Separate tabs, separate tasks.
  **Extended by ticket 11**: separate _bars_ too, and Axis B reads the new site
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
- **A storefront defect is not a map ticket.** The log's _output_ belongs in
  `devdva02/docs/storefront-defects.md`, not on the route to the
  destination. Tickets 15, 17 and 18 were closed on that ground.
- **`tm-content-parity` is hosted on GitHub**, at `dvanaerle/tm-content-parity`.
  Settled outside a ticket; it removes the "where is it hosted" fog.
- **The content unit is the editable block, not a leaf element.** A block folds the
  inline links inside it, because a finding must map onto one edit and content is
  edited one block at a time. The word "text element" is retired.
  `docs/adr/0002-content-unit-is-the-editable-block.md`.
- **A region leaves the log at extraction, from a committed list with a size cap.**
  Two reasons and two words: **non-editorial** (nobody writes it) and **legacy-only**
  (nobody will migrate it). An exclusion above its cap throws, because the obvious
  wrapper selector on production would have removed 358 of 359 units on one page. The
  cap is per entry, it defaults to 20, an entry cannot declare a cap below its own
  recorded measurement, and no entry may declare one above 100.
  `docs/adr/0003-regions-are-excluded-at-extraction.md`.
- **Excluded-region coverage is compared against the previous snapshot.** An entry
  that stopped matching is **one line**, and never 4,000 rows the reader must infer
  it from. The comparison stores the verdict and not the sentence, because the crawl
  and the dashboard speak two languages, and it compares only two runs of the same
  scope. Ticket 64, which needs it: its anchor is campaign-specific by construction.

From the grilling of 2026-08-10, which read a product proposal against the code. Five
ADRs, and each one amends a resolved ticket rather than replacing it.

- **Finding history is a run log, and it never re-attaches.** Ids stay
  content-addressed and expire, so ticket 01 stands. A committed index keyed on the
  finding id alone records first seen and last seen, and **git history is the archive**.
  The word **"Changed"** is refused: a label chosen by how strong a historical relation
  looks is a matcher with a threshold, and a wrong match carries a dismissal onto text
  nobody dismissed, silently. What is left of the idea is a display-only **history
  note**. See `docs/adr/0004-history-is-a-run-log-that-never-re-attaches.md`.
- **A class says what it is for, in one field.** `work`, `information`, `diagnostic`,
  replacing the shown-or-hidden boolean. It is **not** a second axis: ticket 02 removed
  that, and the class stays the only axis ~~and the mute key~~ — **2026-08-13, ADR 0011:
  it keys nothing now, and the conclusion is unaffected.** `shown: false` said two
  things at once — information for an editor, and a diagnostic for a rule author. The
  migration is defined so the denominator does not move on the day it lands.
  "Excluded from comparison" is not a value, because a region leaves at extraction.
  See `docs/adr/0005-class-visibility-is-one-enum.md`.
- **The content view is the spine, and the word diff is a cell renderer.** Measured:
  **82% of shown findings are one-sided** — `text-missing` 49.3%, `missing-link` 21.0%,
  `image-missing` 12.1% — and `copy`, the only class with a score, is **3.4%**. A word
  diff of a string against nothing is a deletion block, and the unanswered question is
  position: gone, or moved. The view opens on the differences with runs of equal rows
  collapsed into a **context marker**, because a comparable page holds a median of 37
  shown findings, 151 at p90 and 399 at worst. The row tint goes in that state, because
  a tint on every visible row says nothing — which is why ticket 12 retired the _Diff_
  tab. See `docs/adr/0006-the-content-view-is-the-spine.md`.
- **shadcn on Base UI is taken for behaviour only.** Seven primitives, for focus traps
  and keyboard menus. `web/src/lib/palette.mjs` keeps meaning, and `Chips.jsx` and
  `Diff.jsx` are not rebuilt out of library parts. Two runtime dependencies become about
  nine, bounded by the list of seven.
  See `docs/adr/0007-shadcn-is-taken-for-behaviour-only.md`.
- **The mute key carries the anchor heading, and a mute says what it hides.** One press
  of _Klasse dempen_ can hide **173 findings** today, with no reason asked and no author
  to review, for ever. Measured: `page + class` gives 2,101 groups at a median of 4 and
  a p90 of 25; adding the heading gives 7,639 groups at a median of 1. **The page-wide
  form stays**, because on a gallery page the headings are per-photo captions and the
  section form turns 4 decisions into 239. The count is stated before the press and a
  note becomes mandatory. The heading is in the mute key and not in the finding id,
  because a mute is a judgement and an id is an identity.
  See `docs/adr/0008-the-mute-key-carries-the-anchor-heading.md`.
  **Superseded 2026-08-13 by ADR 0011 — the whole subject is withdrawn**, and this entry is
  kept because it is the argument that led there. It is not struck: it was built, and the
  count-before-the-press and the mandatory note are what made the eleven `muted` rows
  readable enough to judge. The 173 is still the sharpest statement of the over-reach, and
  the over-reach turned out to be in the key rather than in the choosing, which is why
  narrowing it did not save it. See the last entry in this list.
- **The word diff runs in the browser, with a trim and a cap.** ADR 0006 made it a cell
  renderer; this says where it runs. Measured over 448 reports: 14.8 million LCS cells,
  and **78% of them are rows that already agree** — 8,461 exact matches that the content
  view diffed because it passed no `equal` prop, and they are the longest rows. Trimming
  the common prefix and suffix makes one changed word almost free, and a cap of **50,000
  cells** bounds the tail at 13 rows of 11,847 and no `copy` row. Above the cap the cell
  is **uncompared**: both versions in full, no colour, class still `copy`, no count
  moved. Writing the spans at compare time was refused, because a report is already 11 MB
  across NL and the payload is on the same first-paint path.
  See `docs/adr/0009-the-word-diff-runs-in-the-browser.md`.
- **Axis B is out of scope for this work.** Every decision above is axis A. Axis B keeps
  its own tab and its own bar and is never summed, per ticket 11. This is written down
  so the silence in the proposal is not read as a decision.
- **Two proposed removals were refused, and both became different tickets.** ~~Class mute
  is not removed — it is the only override that survives a text change, and its problem
  was the key, so the key narrows.~~ **The first refusal is reversed, 2026-08-13, ADR 0011
  — see the entry at the end of this list.** The key did narrow, in ticket 88, and
  narrowing it is what made the feature reviewable enough to measure: eleven `muted` rows,
  ten revoked by their own author. _The only override that survives a text change_ was
  true and was not enough. The hard-coded campaign exclusion is not handed to
  editors as search-and-dismiss: it was **4,055 findings, 11.8% of the corpus**, and a
  dismissal expires whenever the campaign copy changes. The durable answer is that the
  campaign rule fires one-sided, so a campaign classifies itself with no commit — the
  current selector anchors on this campaign's option ids and needs a new commit every
  campaign.
- **The one-sided campaign rule is refused, and the region entry stays.** Ticket 89
  measured it over the 816 reports on disk: 938 shown `text-missing`/`copy` findings
  carry `PROMO` on production and not on the new side, **880 banner and 58 editorial**
  — 26 of them the price label `Nu vanaf`, 22 the substring in _ideal_ / _ideale_, and
  four of them `copy` rows with real lost sentences. Worse, the pattern is Dutch: it
  matches **0** banner lines in `de`, `fr` and `be_fr` and one per page in `uk`, which
  is the objection ADR 0003 already sustained. And it cannot reach links: the banner
  makes **1,175 shown link findings** against 880 text ones, so a text rule removes
  less than half of it. The one-sided image rule shows the failure mode already — 24
  of its 530 findings are `ontwerp_je_ideale_overkapping.jpg`, hidden unnoticed. The
  hand-written entry is kept as the primary mechanism. See
  [89](issues/89-what-a-one-sided-campaign-rule-would-catch.md).
- **The campaign anchor is an id, and the per-campaign commit is gone.** The banner block
  is editable in the Magento admin, so production marks it with `id="campaign-banner"` and
  the entry anchors on that instead of on the option ids `6039,6040`. Measured **identical
  to the retired selector in matches, units, links and images on 48 page-store pairs** —
  2 matches on production, 8 units in nl and 7 in the other five, 0 on the new site. That
  is 48 pairs and **not** the 816-page corpus: the corpus-wide probe last ran against the
  old selector. The entry's reason now names no campaign, no percentage and no year, and a test
  refuses one. This is the outcome ticket 90 wanted by a mechanism it did not propose: not
  a class, not a commit, a hook. The text rule stays refused on 89's evidence. Two things
  it does **not** solve, both of them 89's findings: the `IMAGE_CAMPAIGN` collateral is
  live, and a committed entry that matches **nothing** still fails silently at the crawl
  and is only reported one run later by ticket 64's coverage line. See
  [90](issues/90-a-campaign-is-a-class-not-a-commit.md).
- **A term composes with the class pills; it does not replace them.** A search used to
  answer over every class as though the pills had never been pressed, and the amber strip
  sat behind a `!searching` guard — so the editor's answer to _which kind of difference am
  I working on_ was discarded the moment they asked a second question. The classes now
  reach `searchStore()` and are applied through `repeatsWithClasses()`, **after** the
  grouping, so a search row is still a repeat. The strip is one `ClassFilterBanner` for all
  three narrowed lists. The term itself stays out of the strip — it becomes a filter in
  [104 part C](issues/104-a-scoped-search-says-which-kind-of-nothing.md) (written as ticket
  106, merged into 104 on 2026-08-17), for the page scope, and this is
  the strip that scope chip needed somewhere to live. `CONTEXT.md`'s **Filter** entry now
  admits a search. See
  [102](issues/102-the-class-pills-survive-a-search.md).
- **The mute is withdrawn, and a dismissal is the only judgement.** This reverses the
  refusal three entries above — _class mute is not removed_ — and `PRD.md`'s _Corrections to
  the superseded draft_ table carries the reversal beside the refusal. Two reasons, in this order. **The evidence**: the table holds
  eleven `muted` rows, every one on `nl`, every one by the same editor, **ten revoked by
  their own author**, six noted `Test` or a misspelling of it; the one left standing was
  annotated `"Negeren"`, the name of the other control. Nobody ever made the first real
  mute. **The judgement**: `muteCoverage()` counted what the **key** covers and not what the
  editor selected, so a press hid findings nobody had looked at and findings the next crawl
  had not yet produced — an over-reach in the key that no selection interface can fix. And
  the one job it was wanted for, a whole class, it could never do: hundreds of presses,
  each needing a note, none reaching a page the next crawl finds. That job is **class
  visibility** (ADR 0005), and it is ticket 86. The refusal was not unsound when it was
  made; ticket 88 hardened the mute, and a reviewable feature is a measurable one, so 88 is
  what produced the evidence against it. **Nothing is deleted**: the eleven rows stay, ADR
  0008 stays superseded rather than wrong, and ticket 41 is parked in
  `issues/.out-of-scope/` rather than removed. The denominator loses its subtraction —
  nothing is now outside the count, and _this is not work at all_ is a property of the class
  and not of a place on a page. Five tickets carry it:
  [111](issues/111-revoke-the-last-mute.md) revoked the last mute by hand,
  [112](issues/112-dempen-leaves-the-interface.md) took both presses out of the interface,
  [113](issues/113-the-displays-stop-reading-the-mute.md) stopped the displays reading the
  state, [114](issues/114-the-mute-leaves-the-derivation.md) took the symbols out of the
  derivation and the port, and
  [115](issues/115-the-record-is-squared-with-the-decision.md) squared the record with the
  decision. See `docs/adr/0011-the-mute-is-withdrawn.md`.

- **The stylesheet may use Baseline Widely Available, and nothing newer.** The log had no
  written browser floor at all — no `browserslist`, no `.browserslistrc`, no build target,
  and the only stated floor was Node's, which does not run a stylesheet. The real floor was
  Tailwind v4's `@property` and `color-mix()`, so **Chrome 111 / Safari 16.4 / Firefox 128
  by accident of a dependency**. The policy is written as a **rule and not a version list**,
  because a list rots: `:has()` crossed into Widely Available in June 2026 and
  `content-visibility` will not until about 2028, so any list is wrong within months and
  looks authoritative while it is. The version triple is the **mechanism's** floor, not the
  policy — a feature can clear it and still be years from Widely Available — so if Tailwind
  v5 moves it, the mechanism moves and the policy does not. **No `browserslist` key was
  added**: nothing in this toolchain reads one, and a machine-readable declaration no
  machine reads is a lie with a schema. One **exception mechanism**, costing a sentence
  naming the feature and the reason; `overscroll-behavior` is the first, because its
  *limited availability* label turns entirely on a scroll container with no scrollable
  overflow while `contain` on an element that does scroll has worked since Chrome 63. The
  refused features are named with their status so nobody re-derives them, and `@scope`
  carries its own sentence: an unsupporting browser drops **every rule inside the block**,
  so it fails destructively where the rest of the list fails cosmetically. **Container size
  queries are permitted** — Widely Available since August 2025, and already in the tree
  through shadcn's `card.jsx` and `field.jsx` — which is the answer ticket 87 needs.
  Nothing on screen moved. See
  [ADR 0015](../../docs/adr/0015-the-css-floor-is-baseline-widely-available.md) and
  [127](issues/127-the-log-names-its-browser-floor.md). It unblocks
  [128](issues/128-the-carve-out-reaches-for-css-and-primitives-first.md).

- **Both of ticket 58's meta figures were stale, and neither moved the way it was
  estimated to.** Ticket 21 measured 130 meta findings and about 150 `no-route` findings
  over **373** comparable pages on 2026-08-07; step 03 took the corpus to **722**, so two
  build tickets were waiting on numbers a week out of date. Measured again: meta is **197
  findings, all of them `work`**, and `no-route` is **85 findings over six stores, not
  ~150**. The share of `work` rose from 0.54% to **0.90%** — that is ticket 21's method
  reproduced against today's log, and it is **not** the figure the gate will print: all 197
  are `work`, so when the producer lands the denominator moves with the numerator and
  `measure.mjs` reads 197 / 22,200 = **0.89%**. **Neither raw count is the reason the share
  rose** — meta rose 52% with the corpus while ticket 86 took 2,846
  `heading-level` findings *out* of the denominator, and both movements push the ratio the
  same way. Two findings beyond the counts: **`robots-index-lost` fires twice, not once**
  — `de/(de)erfolg-probepaket` is new and is the severe direction, a page production
  serves indexable that the new site serves `noindex`, invisible for the seven days
  between the two measurements, which is the argument for the class — and **`check:
  'meta'` is not empty today**, holding 349 `diagnostic` `no-declared-alternate`
  findings, so ticket 97 adds head rows to a check that already fires rather than creating
  the fourth check. The four `lost`/`added` classes still fire zero times and
  `meta-casing` is still exactly 4, all a dropped trailing full stop on a description. The
  probe counts as `summariseReports()` does, over comparable reports only, so its
  denominator is the one `measure.mjs` prints and not `data/snapshot.json`'s 40,966. See
  [91](issues/91-measure-meta-classes-on-todays-corpus.md); the meta table and the gate
  baseline are pasted into [97](issues/97-the-meta-producer-one-finding-per-row.md) and
  the `no-route` table into [93](issues/93-no-route-leaves-the-log.md).

### Resolved tickets

Each entry is the record of what that ticket decided **on the day it resolved**, in the
present tense of that day. Two standing corrections apply across all of them and are not
repeated in each:

- **The mute is withdrawn, 2026-08-13, [ADR
  0011](../../docs/adr/0011-the-mute-is-withdrawn.md).** Wherever an entry below says that
  `class` is the mute key, that a mute leaves the denominator, or that `muted` is one of
  five derived states, read it as the record and not as the model. There are four states,
  the class keys nothing, and nothing is outside the count. Tickets **01**, **02**, **05**,
  **06**, **08**, **09**, **11**, **29**, **31** and **33** all argue from the mute key
  somewhere, and none of their conclusions turned on it alone.
- **`WORKLIST.md` was deleted, 2026-08-13, commit `926d46f`.** Every `WORKLIST.md step NN`
  pointer below is dead. The file is recoverable with
  `git show 926d46f^:.scratch/content-parity-log/WORKLIST.md`.
- **A page carries two annotations, and the page scope now has three keys.** Ticket
  [83](issues/83-a-page-carries-a-priority-and-a-note.md) built `prioritised` and `noted` on
  the existing `page` scope — a priority from `shared/priorities.mjs` (`high | medium | low`,
  closed in git, never in the database, no `normal`) and an optional free-text note. The
  schema editor the proposal asked for is **refused**: rename and reorder are mutations, and
  the table has insert and select policies only. There is no **owner** field. Neither
  annotation moves any count, and a test pins it. Two things below are now wrong wherever
  they appear: _the page scope has one key_ — it has three, keyed by `PAGE_KEY`, and the
  review keeps the empty term so no row on disk changed key — and _`cleared` revokes the last
  override on any key_, which on the page scope still means the review alone. An annotation
  clears by carrying no value, and the answer on the ticket says why `cleared` could not be
  reused. `supabase/page-annotations.sql` was **applied by hand on 2026-08-14** and the
  annotations write.

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

- [13 — Keeping the Supabase project awake](issues/13-supabase-pause-risk.md)
  — **The plan stays free.** A daily GitHub Action inserts one row into a
  `keepalive` table, plus `workflow_dispatch`, and it fails on a non-2xx. It
  **writes** rather than reads, because whether a bare select counts as database
  activity is unverified (`research/supabase-override-log.md`, line 175), and a
  keep-alive built on that assumption fails in the same quiet shape as the fault
  it prevents. It never touches `overrides`: ticket 09 makes that ledger
  append-only and latest-event-wins, so a hosting row would enter the derivation
  and the progress bar. `keepalive` holds `id` and `created_at` and nothing else,
  so an anon insert with the public key can cost row count and nothing more. It
  is **not** in `CONTEXT.md` — it is infrastructure, not parity vocabulary — and
  it lives in `supabase/keepalive.sql` rather than `schema.sql`, because that
  file drops `overrides` at the top and applying a keep-alive must not risk the
  log. **Built 2026-08-07**, the first workflow in the repository; the SQL and
  the two repository secrets are human steps in `RUNBOOK.md`.
  **Accepted, not solved**: GitHub disables a scheduled workflow after 60 days of
  repository quiet, silently, which is the same failure shape again. The
  detection for that case is the loud write failure spec 29 built, which also
  covers a lost network and an outage. Pro at $25 a month, a staleness warning, a
  second free monitor and migration tooling were all refused.

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

  **Closed 2026-08-11, and three of the numbers above are wrong.** Read them as
  the 2026-08-06 record, not as facts. The seed list holds **550 rows**, not 181:
  `de`, `fr` and `be_fr` went to 134/123/122 once `isContentPage()` stopped
  needing `changefreq=daily`, so the sitemap did **not** yield exactly the
  hreflang counts. **283 clusters have no NL member**, so "no non-NL page lacks an
  NL counterpart" is false — those rows carry the unanchored `(store)path` key
  that ticket 57 added. The 26,645-in-one-number exclusion is gone: 105 drops,
  each with a `rule` from `shared/drop-rules.mjs`. What held: the plain host swap,
  and the translated category keys. The work is in
  [50](issues/50-content-page-discriminator.md),
  [53](issues/53-every-content-page-in-the-seed-list.md),
  [55](issues/55-five-stores-show-all-their-pages.md) and
  [57](issues/57-retire-the-nl-url-key-assumption.md). The one thread 04 left open
  was [16](issues/16-new-site-page-discovery.md), and that closed the same day —
  see its entry below.

- [16 — Discovering non-NL pages that only exist on the new site](issues/16-new-site-page-discovery.md)
  — **Closed 2026-08-11 by a decision: production is the source of truth, and the
  new site is expected to match it.** So a page only the new site has is not content
  to preserve, it is a deletion candidate. The production sitemap **is** the seed by
  definition, no crawl of the new site is owed, and **`orphan-page` never gets a
  producer** — it was a migration-completeness worry, not a defect class.
  Two premises of the ticket were measured false first. **The new site does serve a
  sitemap**, declared in `robots.txt` at `/media/siteindex/<locale>/siteindex.xml`,
  which the 2026-08-06 probe missed by trying three standard paths instead of reading
  `robots.txt`; production serves none of those paths. It is **rejected as a source**
  anyway: generated once, 2024 content, and of the 35 urls it adds to the seed list
  **21 are already 404 on the new site too**. And "no non-NL page lacks an NL
  counterpart" was already false — 283 clusters have no NL member.
  What it found: **14 pages live on the new side and 404 on production**, thirteen of
  them non-nl, which contradicts step 33's "the new-only population is entirely nl".
  They are 2024 pages the clone kept, handed to
  [20](issues/.out-of-scope/20-one-sided-pages-checklist.md) as a third population for the
  one-sided checklist. A fuller sweep needs no new requests — `data/extract`'s
  `.new.links[].url` holds 2,270 internal targets in no seed row, about 238 of them
  plausible content pages — but extraction is `<main>`-scoped, so nav and footer
  anchors were never captured. Re-open only if a new-site page appears that
  production never had and somebody wants to keep.

- [05 — Link checking rules](issues/05-link-checking-rules.md)
  — The Links tab compares **targets only**; anchor text belongs to the content view.
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
  **contradicted** — _claimed fixed, still differs_, attributed. The old "manual
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
  per page for the rest. Graduated tickets 21, 22, 23, 24; re-worded 12; unblocked 16.

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
  is a legitimate page**, so the invariant is no text _and_ no image _and_ no link
  on a 200 response. It throws, like ticket 14. Built and validated live: 58 tests
  green, 359 extractions, guard fired **0** times. Graduated ticket 25.

- [26 — Build the Axis A compare stage](issues/26-axis-a-compare-stage.md)
  — **The ticket that was missing from this map.** 02, 05 and 06 wrote the rules, 07
  built the extractor, 08 built the shell, and nothing joined them: `data/reports/`
  never existed, so the dashboard rendered its own _"run the comparison first"_
  message while thirteen tickets read as resolved. Built as
  `compare/{match,text,links,images,findings,link-status,30-compare}.mjs` plus
  `crawl/21-crawl-store.mjs`, and the front end is now the tool — a dashboard over
  every page and the Variant A ledger with real data. Commit `52387b1`, branch
  `axis-a-compare-and-log`, 101 tests green, 180 pages built.
  Measured on nl: **179 crawled, 124 comparable** — the same 124 ticket 06 counted
  from the other direction — **8,573 shown findings, median 41 a page, no page
  clean**. Six decisions the tickets did not give, of which two matter most:
  `restructured` never fires on unchanged text, so it means "the text differs _and_
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
  chronologically by construction**, which is what lets "contradicted by a _later_
  observation" be a string comparison inside a pure function. A `DiffRow` gained
  a `finding` id, because a row is a position and a finding is grouped, and the
  browser cannot recompute the id. **The Supabase project was not yet wired** at the time
  of writing: the log ran in its designed not-connected state. It is wired now — ticket 30
  resolved 2026-08-12 and the log holds 511 override rows. Ticket 13 was the one real
  risk; it is resolved, and the keep-alive it chose is built and applied.

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

- [27 — Product listings and filter UI inside `<main>`](issues/27-category-page-product-listings.md)
  — **A category page stays in the log; the grid leaves it as a region.** The log
  gains the word **non-editorial region**: a region inside the content boundary whose
  text the catalogue or an extension makes. This ticket's own objection decided
  _where_: the extract carries no DOM path, so the exclusion runs **at extraction**,
  from a committed list, and a check stays ignorant of regions. One selector cuts both
  hosts and removes 50 units on production against 21 on the new site — the grilling
  said 69 and 48, and ticket 63 re-measured. `pageType` was
  rejected as the hook — it names a page kind, and this is a region. Found while
  resolving: production's tile titles sit in a tag the extraction never read, so
  production never had them, and the nine "added" tiles on `/overkapping` are exactly
  the nine titles production cannot see. The log was reporting invented content that
  was not invented. The USP strip is deliberately left open. Built by
  [63](issues/63-regions-excluded-at-extraction.md).

- [32 — A scannable diff, class filters, six stores, and a design system](issues/32-scannable-log-and-six-stores.md)
  — **Closed 2026-08-13 by verification, not by work.** The spec read
  `ready-for-agent` while its six build tickets had already built it. Seven of
  eight phases are in the code: 33 the class vocabulary, 34 position, 35 the diff
  rendering and the design system and the meta panel, 36 the merged content view
  and the filters, 38 the six stores. **Leesweergave is the one phase that is not
  built** — decisions 21–24, parked `wontfix` as ticket 37. ~~Two user stories are
  open and both have owners: story 29's deep link is ticket 34's reopened
  criterion, and story 24's dropped `h1` is ticket 44.~~ **One story is open.**
  Story 29's deep link was met on 2026-08-17 by ticket 34's ninth criterion — *in
  situ on both* now holds for every finding that has a position on the page. Story
  24's dropped `h1` is ticket 44 and is still open.

  **Five of its decisions are superseded, and the spec text does not say so.**
  The tabs are four and not five (ticket 81 removed Taken); shown-and-hidden is
  the three-value visibility enum (ADR 0005) over 22 classes and not 21; the
  dashboard filter is in the URL and not session-only (ADR 0010); stock neutral
  greys are retired; and the Testing Decisions section rests on "five test files
  and no component tests" when there are 29 and a headless-Chromium project. The
  answer on the ticket lists each one and where the decision now lives, so a
  reader of the spec does not build from a superseded line.

  Found while verifying and **fixed the same day**: `TICK.secondary` in
  `OverrideControl.jsx` was `undefined`, so a fix tick that stands rendered in the
  shadcn primary. Decision 28 asks for three visual states and two of them were
  distinct. The tick is now **green**, which is a decision and not the design:
  `palette.mjs` reserves the only green for the `added` direction and spends none
  on status, and this is the one exception, taken on preference and written into
  the docblock beside it. `TICK.info` stays defined and unused, so the blue is a
  one-word change.

- [33 — The class vocabulary: direction, and the changes the log cannot see](issues/33-directional-text-classes.md)
  — **Phase 1 of spec 32 is built and measured.** `structure` is retired for
  `text-missing` (shown) and `text-added` (hidden), and an exact-text pair whose
  element changed is no longer silent: `heading-level` (shown) when either side is
  a heading, `tag-changed` (hidden) otherwise. 18 classes to 21, `classifyExactPair()`
  in `compare/text.mjs`, 161 tests green. The 0.6 threshold was not touched.

  **Measured in three steps, because the changes pull in opposite directions and
  one number would have hidden both.** Baseline reproduced exactly first
  (10,076 / 8,573 / median 41), then:

  |                               | findings   | shown     | median shown |
  | ----------------------------- | ---------- | --------- | ------------ |
  | baseline                      | 10,076     | 8,573     | 41           |
  | 1. the directional split      | 10,076     | **7,010** | **34.5**     |
  | 2. + the two new classes      | **10,814** | **7,477** | **37**       |
  | 3. + the heading-leaf bug fix | 10,796     | 7,456     | 37           |

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
  — **Resolved 2026-08-17. All nine criteria built, and the ninth verified in the
  running interface by the editor**, on `nl/bamboe-vlonder` and `nl/(home)`, with no
  defects found. Reopened 2026-08-07 for that ninth criterion, the deep link: see
  "Where is it, for every row" in the ticket. **Closed by a hands-on pass and not by
  a code read** — this ticket has twice been ticked in error from the source alone.

  **The ninth was one value meaning two things.** `anchorHeadings.production ===
  null` said *not on production* in the contract and *above the first heading* in
  `anchorHeadingFor()`, and the second was served the first's answer — so a finding
  above its page's first heading was treated as one that does not exist there and
  lost both links. `locations` replaces it, a pair of `{ heading, text } | null`:
  **absence is the side entry, precision is its fields.** `locationUrl()` aims at
  the finding's own words, then its section, then the bare page. Rows with no link
  fall **1,522 → 368**, and the 368 are all `meta/no-declared-alternate`, which is
  about the `<head>` and has no position in the body. The grilling this wanted was
  one question to the user, and the answer is in `CONTEXT.md` under **Location**.
  **Phase 2 of spec 32 is otherwise built, and the numbers did not move.** 179 crawled,
  124 comparable, 10,796 findings, 7,456 shown, median 37 — ticket 33's baseline to
  the finding. Position adds no rule, so movement would have been a defect.

  The extractor's three walks became **one walk on one counter**. Every record a
  node makes shares that node's position, so an anchor's words and its target
  agree about where they are; a deduplicated image keeps its **first** occurrence.
  `compare/locate.mjs` is the new browser-safe module and holds both answers: the
  nearest heading before a position, and a `#:~:text=` url that opens the live
  page scrolled to it. No DOM path — ticket 01 stands.

  |                                                 |                                    |
  | ----------------------------------------------- | ---------------------------------- |
  | findings carrying an anchor heading             | **9,174** of 10,796                |
  | findings with none, all above the first heading | 1,622                              |
  | rows the ordering fix moves                     | **6,990**, on **109** of 124 pages |

  **The row-ordering defect was bigger than the ticket guessed.** A new-only row
  sorted on its index in the _new_ document against _production_ indices; it is
  now anchored to the production position of the nearest matched pair before it.
  Invisible while the Diff tab showed only the differing rows. Ticket 36 shows the
  whole document, so it is visible now.

  Three decisions the ticket did not give. **`TextElement.index` is no longer the
  position in the `elements` array** — the shared counter runs over images and
  links too — so `DiffRow` carries the array position, which is what the contract
  always said it was — spec 32's decision 8 called `index` additive, which was
  true of the image and link records and **not** of `TextElement`; the amendment
  is written into 32. **`anchorHeading` is out of the grouping key as well as out
  of the id**, or one rename under six headings would have become six findings.
  The field is named in full because `anchor` alone is the `<a>` element
  everywhere else in the code; `CONTEXT.md` already gave the term as "anchor
  heading". And the
  ordering rule needed two cases the ticket did not name: an addition above the
  first agreement sits just before that agreement, and a page the two sides agree
  nowhere on reads as production first, then the new site.

- [38 — Six stores, not one](issues/38-six-stores.md)
  — **The log is six stores now, and nl did not move.** Phase 7 of spec 32. The
  five non-NL stores are crawled, compared and browsable; `/<store>/` is a
  dashboard of its own; and a switcher in the shell moves between them. 269 of
  270 rows crawled — `be/faq/offerte` is the one loss, and it is ticket 17's
  production redirect loop, not a tool failure.

  | store       | crawled | comparable | findings   | shown      | median shown |
  | ----------- | ------- | ---------- | ---------- | ---------- | ------------ |
  | nl          | 179     | 124        | 10,796     | 7,456      | 37           |
  | be          | 125     | 117        | 9,690      | 6,562      | 34           |
  | de          | 45      | 42         | 4,166      | 2,830      | 38.5         |
  | uk          | 42      | 40         | 5,137      | 3,642      | 40           |
  | be_fr       | 29      | 25         | 2,582      | 1,762      | 28           |
  | fr          | 28      | 25         | 2,539      | 1,709      | 27           |
  | **all six** | **448** | **373**    | **34,910** | **23,961** |              |

  **Every nl number held exactly**, which is what a phase that adds no rule must
  do. Production was verified live on all ten hosts before the run and no
  `MaintenanceError` fired in 538 requests, so the stale `prodMaintenance` flags
  were never consulted.

  **Re-measured on 2026-08-10 by ticket 55, and every non-NL row above was a
  floor.** The counts read the old page list. The new table:

  | store       | crawled | comparable | findings   | shown      | median shown |
  | ----------- | ------- | ---------- | ---------- | ---------- | ------------ |
  | nl          | 179     | 124        | 9,635      | 6,747      | 37           |
  | be          | 130     | 122        | 9,744      | 6,572      | 34           |
  | de          | 134     | 123        | 8,932      | 6,149      | 29           |
  | uk          | 128     | 121        | 10,027     | 6,820      | 30           |
  | be_fr       | 122     | 115        | 8,231      | 5,546      | 26           |
  | fr          | 123     | 117        | 8,154      | 5,495      | 25           |
  | **all six** | **816** | **722**    | **54,723** | **37,329** |              |

  **The two tables are not a before and an after.** The page list grew (ticket 55)
  and tickets 62, 63 and 64 removed findings, and the two effects pull opposite
  ways. `nl` is the control: the new list adds it nothing, so its fall from 10,796
  to 9,635 is the three rules alone.

  The prefactor landed first and earned itself: the failure log is
  `data/extract-failures-<store>.json`, and the `be` run then failed on
  `faq/offerte` without erasing the nl record of the same failure.

  Three decisions the ticket did not give. **`link-status.mjs` must be given no
  store** — it overwrites one global file, so a per-store run erases the store
  before it and the next compare reports no `broken-link` and no `redirect`; run
  it over every crawled store at once. **There is no all-stores dashboard**: `/`
  lists the stores and waits, and it moves nobody on. And **the switcher goes to
  the dashboard of a store, never to the same page in another store**, because the
  stores translate the category url keys and "this page over there" often does not
  exist.

  Payload per store, which is the criterion that a visitor does not download six
  stores to read one: nl 1,087 KB, be 925 KB, uk 470 KB, de 394 KB, be_fr 254 KB,
  fr 246 KB. 455 pages built.

  **The be/be_fr blind spot is 1.** On the new side — the only side
  `cross-store-link` reads — 14 be_fr anchors on 5 pages point outside `/fr` on
  the shared host, and 13 are shared `/media/` files rather than pages. The one
  page link is `/blog`, which is out of scope. Not zero, so
  [49](issues/.out-of-scope/49-be-fr-shared-host-blind-spot.md) was opened with a
  recommendation of wontfix. **No rule was written against it**, and the triage of
  2026-08-07 took the recommendation.

  **The review of 38 acted, and two findings became tickets.** Twelve findings:
  seven fixed in the same session, two opened as tickets, three recorded in the
  ticket. The one that mattered was **one rule asked two ways** — the crawler
  wanted both urls in a seed cell and the dashboard wanted the production url
  alone, so the two could disagree on which store an excluded page belongs to.
  `crawl/seed-rows.mjs` holds the condition now and both call sites read it. The
  divergence was **latent**: `veranda-configurator` carries both urls on nl and
  empty strings elsewhere, so every count was right before the fix and is
  unchanged after it. Also fixed: `/` no longer carries a zero-second meta refresh
  that made its own store list unreadable; `web/src/lib/stores.mjs` builds its
  names from `STORES` instead of keeping a second list of the six; the shell reads
  the report folder once for the build and not once on each of 455 pages; and
  `storesFromFilenames()` and `excludedInStore()` are pure and tested, because a
  rule with no test is not a rule. 270 tests green.

  Opened: [59](issues/59-link-status-overwrite.md), because a data-destroying CLI
  argument guarded by prose is not guarded, and
  [60](issues/60-report-filename-in-the-contract.md), because
  `<store>__<page>.json` is crawl-to-web data that `web/` parses and
  `compare/contract.mjs` does not mention. **Both were triaged to
  `ready-for-agent` in session 2**: 59 refuses the store argument rather than
  merging the file, and 60 names the filename shape in the contract rather than
  reading the store out of each report. **Both are resolved** on the same day. 59
  refuses the argument with exit 2, and the sweep it asked for found no third
  overwrite. 60 put `reportFilename()` and `storeOfFile()` in `contract.mjs`, so
  the `__` separator is written once and not in two files.

- [21 — The Axis A meta check: what is a parity defect in the head?](issues/21-axis-a-meta-check.md)
  — **The head is not one thing.** Each row is decided on its own, and the test is
  `CONTEXT.md`'s: a difference the content team cannot change is not a finding.
  Five rows — **Meta Title, Meta Keywords, Meta Description, Robots, Canonical** —
  of which three make findings and two stay display only. `h1` stays out; the
  content view owns it, and it differs on 93 of 179 nl pages. **Nine classes**,
  taking the table from 21 to 30. Keywords and the raw robots string are crawled
  for the first time, so the whole corpus must be re-crawled.

  **130 findings over 373 comparable pages — 0.54% of shown.** 45 title, 78
  description, 4 `meta-casing`, 3 robots. 68% of comparable pages get none.

  Three decisions the ticket did not ask for. **A tenth class was drafted and
  removed by measurement**: `meta-brand-suffix` would have folded a trailing
  ` | Tuinmaximaal`, but only **3 of 45** title differences collapse when it is
  stripped, and the suffix sits on ~45% of titles on _both_ sides, so it is editor
  text and not a template. The other 42 are real rewrites. No rule was written and
  no brand string enters the code. **The head labels are English** in a Dutch
  interface, because they name the Magento admin field the editor goes to fix —
  written into `CONTEXT.md` so the next reader does not translate them. And **the
  Meta tab keeps its five-row shape** rather than becoming a finding table, with
  the override controls inline and no class pill: on five fixed rows the cells
  already say what changed.

  Both robots directions ship. `robots-index-lost` — production indexable, the new
  site `noindex` — fires **once**, on `be`, and it is the severe one: the page
  leaves Google. The four `lost`/`added` classes fire **zero** times, because both
  sides always send a title and a description. They ship anyway; the two-direction
  pair is mandatory for a one-sided check.

  **`axis` is not taken here.** Ticket 39 owns it, and now has 30 classes to reach.

  Two defects found while resolving, both in the ticket. **A stale extract reads as
  clean** — there is no version marker, so a new `PageMeta` field folds to `null`
  on both sides and reports `same`; `PageExtract` gains `extractVersion`. And
  **`no-route` compares a 404 page against a 404 page** — both sides answer 200, so
  the status gate misses it, and it emits **25 findings, 15 shown, in every one of
  the six stores**. It goes into the exclusion list. Ticket 20 owns the 404 cell.
  Built as [58](issues/58-axis-a-meta-check.md).

- [10 — Re-check service](issues/10-recheck-service.md)
  — **Built by ticket 29, and closed on 2026-08-07 without work.** The ticket read
  as open while the code had existed since spec 29 shipped. `api/server.mjs` holds
  `POST /api/recheck/<store>/<page>` and `/api/health` and serves `dist/`;
  `npm start` runs it; and `probeHealth()` at `web/src/lib/recheck.mjs:16` is the
  feature detection that hides the Recheck button in the hosted copy, which is the
  two-mode split ticket 10 asked for. The Supabase merge is `overrides/state.mjs`.

- [12 — Variant A with eight tabs: does the density hold?](issues/12-variant-a-seven-tabs.md)
  — **Answered by ticket 36, and closed on 2026-08-07.** The question dissolved
  rather than got answered: **Diff is no longer a tab.** 36 merged Diff and
  Content into one content view and seven tabs became five, so "do eight tabs
  hold" has no subject. The worst case is measured — `fotogalerij/zonwering` at
  399 findings over 178 rows, filter re-render **21 ms** — and Inhoud lands, not
  Taken. **One remnant, and it is dropped**: whether the dashboard wants a sitemap
  tree with roll-up instead of the flat sortable table. Nobody has asked since
  ticket 26 built the table. It is not deferred with an owner; if the want comes
  back it is a new ticket against a built screen.

- [51 — A seed pipeline that runs, and output that is tracked](issues/51-runnable-tracked-seed-pipeline.md)
  — **Resolved 2026-08-10.** The absent `_data/` is gone from every code file;
  the generator writes `data/` where the five consumers read. The seed list is
  tracked (`.gitignore` needs `data/*` and then `!data/10-store-seeds.json`, not
  `data/`), the rest of `data/` stays ignored, and the summary moved from the
  repository root to `data/10-store-seeds.md`. **The six baseline scripts
  `01-parse-sitemap` through `06-html` are deleted, not repaired** — none was in
  a run sequence, none could run, and repaired paths would have left them looking
  runnable. The generator's private maintenance regex is gone in favour of
  `maintenanceReason()` and `MaintenanceError`, and it exits 3 before writing.
  **That guard is wider than the one it replaced**: every 500 and 503 now aborts,
  where the private regex needed a matching body. Two things stay for
  [53](issues/53-every-content-page-in-the-seed-list.md): neither generator input
  has a producer in the tree, so a fresh clone still exits 2, and the committed
  seed list is the phantom maintenance run of 2026-08-06.

- [52 — The production page list becomes committed evidence](issues/52-production-page-list-as-evidence.md)
  — **Resolved 2026-08-10.** The six production sitemaps are fetched once and
  reduced to two tracked files: `data/sitemap-extract.json` (876 entries, 289 KB)
  and `data/sitemap-manifest.json` (the url, the date, the status, the byte count
  and the loc count of each of the six). **289 KB against 181 MB of source**, so
  every page count in the log can now be checked against the production data it
  came from. **The six sitemap urls were written down nowhere** and were recovered
  from each host's `robots.txt`. Only five hosts exist, and the Belgian host
  declares two. That is the sixth. The extract carries **no date**: its bytes are
  a function of its source alone, and two independent fetches gave identical
  bytes. The date lives in the manifest, which is the record of the fetch. The
  rule is ticket 50's first clause **without the product signature**, because an
  extract that had already applied that signature could not be used to test it.
  **114 of the 876 entries are in the extract only because one file marks them
  `daily`**, which measures ticket 50's claim that both clauses are necessary.
  `alternateConflicts` is **0** over all 876 entries, so "one entry, not six
  copies" is re-checked by every run instead of assumed. Four failures stop the
  run and write nothing: a 500 or 503, a 200 with a maintenance page, any other
  non-200, and a 200 with no `<url>` block. All four were verified against a
  server that fails, not reasoned about. **Two things go to
  [53](issues/53-every-content-page-in-the-seed-list.md):** the generator is not
  wired to the extract and still exits 2, and **all six store home pages are in
  the sitemaps**, which contradicts the hand-seeding at
  `crawl/10-store-seeds.mjs:143`.

- [53 — Every content page of every store is in the seed list](issues/53-every-content-page-in-the-seed-list.md)
  — **Resolved 2026-08-10.** The seed list is **820 store pages over 550 rows**,
  against 451 over 181. Per store: nl 181, be 131, be_fr 122, de 134, fr 123,
  uk 129. **NL is 181 to the page** — 133 found by the rule, 48 carried — which is
  the check that the rule is right and not merely larger. The rule lives in
  `crawl/seed-list.mjs`, is pure and is tested; the generator makes **no live
  request** and `crawl/11-page-status.mjs` is the status pass beside it. **Ticket
  50's product signature is wrong as written** and was measured instead: production
  names the two kinds on the `<body>`, and a probe over all 876 candidates found
  **105 `catalog-product-view` pages**. The signature is a measurement token or a
  colour beside a finish, and it names 105 of 105 with no false positive.
  `co.uk/black-veranda` is the case that refuses a bare colour clause. **Every
  production 404 in the list is one of the 49 carried rows**: 39 of the 48 Dutch
  carried pages do not exist on production at all, so "NL has 181 content pages"
  was never true of production. Ticket 22 is answered: 1,640 urls, **zero failures
  and zero maintenance answers**, so the old column of 451 zeroes was the
  maintenance window and nothing else; `data/11-page-status.json` is tracked so
  the numbers stay checkable. The page key of an unanchored page is
  `(store)path`, never a colon, and the 181 anchored keys are byte-identical, so
  nothing detaches. **Two of ticket 50's statements do not survive the data**: the
  signature above, and "no other pairing exists" — there are **sixteen** shapes of
  alternate block, and `{de, nl, uk}` and `{de, uk}` are two of them, which axis B
  must know. `npm test` green at **412 tests**, 51 new.

- [22 — Re-measure production status](issues/22-remeasure-prod-status.md)
  — **Folded on 2026-08-07, not closed and not resolved.** Both criteria moved
  into spec 50, because 22 measures the 451-pair seed list that ticket 53 is about
  to replace with about 800 pairs. The measurement of `prodStatus` and
  `prodRedirect` and the clearing of the stale `prodMaintenance` flags are in
  [53](issues/53-every-content-page-in-the-seed-list.md); arming ticket 04's
  fail-loudly guard is in [51](issues/51-runnable-tracked-seed-pipeline.md),
  because `crawl/10-store-seeds.mjs:164-183` held a **private second copy of the
  maintenance rule** that recorded a flag and carried on where
  `crawl/fetch-page.mjs` throws. That copy is how 451 phantom `prodStatus` values
  reached the file. **51 deleted it on 2026-08-10**; the `prodMaintenance` flags
  in the committed seed file outlive it and are 53's to clear. **Resolved on 2026-08-10 by 53**: 1,640 urls over the
  rebuilt 820-pair list, zero failures and zero maintenance answers, tracked as
  `data/11-page-status.json`. Ticket 20 follows the edge from here. Its "do not re-run the whole seed derivation" instruction is
  **overtaken** by ticket 50, which found the page list itself unsound.

- [81 — The repeat is the queue](issues/81-the-repeat-is-the-queue.md)
  — **Built 2026-08-11, and one acceptance criterion refused.** The dashboard holds two
  views over one derivation: _Verschillen_, the store's repeats worst-first, and
  _Pagina's_, the page list it always had. One class-pill set filters both, so the
  quick-filter want is the repeat list with a class pre-selected and not a second
  surface. The `Taken` tab is gone and nothing it held is unreachable.

  **Refused: a repeat has no finding count separate from its page count.** `page` is a
  term of the finding id, so one page carries at most one finding of one repeat —
  measured, 25,657 repeats and zero exceptions. The row states pages, and
  `occurrences` is named apart as what it is.

  **The measurement in _Ready to build_ below is superseded.** It describes 448
  reports. The disk holds **816 reports, 722 comparable, 35,503 shown findings**, and
  the per-store table is in ticket 81's answer. The shape of the answer holds and the
  scale of the win does not: `nl` is **6,004 findings in 4,152 repeats**, its largest
  repeat is on **22 pages**, **78.8%** of its repeats are singletons, and the first
  fifty rows cover **9.6%**. Grouping saves 31% of the reading and none of the
  deciding. That is worth the screen and it is not the thirty-page footer line the
  ticket imagined, so the interface says so under the list. It also argues against
  ticket 31: a 22-page maximum is a click-through, not a bulk tool.

- **Three tickets resolved 2026-08-13 by a triage sweep, not by a build.** All three
  were built and none had its status line moved, so all three sat in the frontier
  advertising work that was already done. The sweep read all 44 open tickets against the
  code; these were the only three fully built, and 34, 70, 85 and 87 were found
  part-built and annotated in place. The verifications are code reads, not hands-on
  checks of the running interface, and each answer says so.

  - [74 — Seven accessible primitives](issues/74-seven-accessible-primitives.md)
    — built in `34a9e96`. All seven at `web/src/components/ui/`, `@base-ui/react` with
    no TypeScript, the tab strip as first user, and the palette's precedence over
    shadcn's variables written into `app.css` rather than left to import order.
  - [109 — A difference opens the page at the difference](issues/109-a-difference-opens-the-page-at-the-difference.md)
    — the finding id travels in `bevinding`, the landing opens the tab and scrolls,
    the editor's own tab and noise choices win, the way back is laundered through
    `screenFromSearch()`, and the dashboard screen rides the query string on
    `replaceState`. Carries ADR 0010.
  - [110 — The press covers the pages you ticked](issues/110-the-press-covers-the-pages-you-ticked.md)
    — through review rounds two and three: tri-state select-all in the table head,
    the floating bar, both presses stating the ticked count, clearing through the
    shared `clearedEventFor` seam, one selection per list, no new dependency. **Its
    mute half was struck by ADR 0011, not built.**

- [122 — Verschillen groups by class](issues/122-verschillen-groups-by-class.md)
  _(renumbered from 100 on 2026-08-13; 100 was already taken)_
  — **Built 2026-08-12.** The queue arrives as a **class group** for each class of the
  closed vocabulary, ordered by the vocabulary and never by the counts, so no group moves
  as the work is done. `groupRepeatsByClass()` is a pure derivation over 81's repeats: it
  re-sorts nothing, `Repeat` gained no field, and the rendering budget belongs to the group
  — held above the rows, because a closed group unmounts them and a budget kept down there
  reset every time it was reopened.

  **Opening a group is not a filter.** It is a class name in component state — not
  persisted, not in the url, absent from the amber strip — and the class pills stay the one
  filter: with a pill on, only the selected groups exist and they are open, so the two
  controls cannot tell different stories. Groups start closed unless one of them is the
  only one holding anything.

  **The ticket's word "section" is refused**, and `CONTEXT.md` gains _class group_ instead.
  "Section" is the mute scope, a run of one page under an anchor heading (ADR 0008), and
  one word with two meanings is what that glossary exists to stop. **Two of the ticket's
  own rules collide** — one at a time, against a pill opening what it selects — and the
  pills win: one-at-a-time governs the clicks, because a two-class filter answered with one
  class drawn open is the queue disagreeing with the control that narrowed it.

  An empty **shown** class is drawn and says so, because _nothing wrong here_ and _this
  class does not exist_ are two different answers; `fr` ships eleven groups and one such
  sentence. A class the vocabulary does not name is drawn **last** rather than nowhere: it
  cannot arrive today, and the guard exists because the failure would otherwise be silent —
  the row leaves the screen while the footer keeps counting it. The search keeps the flat
  list, since a search's grouping is the term.

- [111 — The last mute is revoked](issues/111-revoke-the-last-mute.md)
  — **Done 2026-08-13, and the ticket's own premise refused.** The one live mute is
  cleared, so no key in the table has `muted` as its latest event and no page bar in any
  store draws _N gedempt (buiten de teller)_. ADR 0011 may proceed.

  **`nl`'s numbers did not move** — 4632 open of 4784, before and after. The mute had
  **drifted off the section it named**: its key was `nl|downloads|text-missing|*none`, the
  content before the first heading, and on the current snapshot every one of that page's
  191 findings sits under a heading. It was hiding nothing, in every class, and had been
  for some time. ADR 0011 predicts the opposite ("`nl`'s numbers move once") and that
  prediction is wrong; the ADR's argument does not depend on it.

  This is ADR 0008's drift rule working as written — a mute naming a heading the snapshot
  no longer has reaches nothing, with no fallback to a wider key — and a third argument for
  withdrawing the mute: the project's only live mute spent its last days deciding nothing,
  and no surface said so. Nothing was deleted; a revocation is a new row.

- **Three resolved tickets the map never indexed**, added 2026-08-13 by the
  reconciliation below. Each is resolved and none has work left in it; they are
  listed so that the map holds one entry per ticket, which is the property that
  makes a frontier scan trustworthy.

  - [47 — Where a shared identity key lives](issues/47-shared-keys-layering.md)
    — the ticket behind
    [ADR 0001](../../docs/adr/0001-a-pure-rule-that-both-stages-need-lives-in-shared.md).
    A rule both the crawl and the compare need lives in `shared/`.
  - [54 — The French store shows all of its pages](issues/54-french-store-shows-all-its-pages.md)
    — resolved 2026-08-10; the identity half landed on the day and the crawl
    followed. One of the four tickets that grew the seed list past 04's numbers.
  - [56 — An excluded page says why](issues/56-an-excluded-page-says-why.md)
    — an excluded page stays visible in a _Not checked_ list carrying its reason,
    which is what ticket 19 promised and did not build.

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
  Ticket [25](issues/25-fotogalerij-worst-case-page.md), resolved: the migration
  of those pages is unfinished, and that is a storefront matter and not a tool
  defect.
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
  the crawl, not capability. (Closed by ticket 38: the claim held. 269 rows were
  crawled across five stores with no change to the extractor at all.)
- **The five non-NL stores are not cleaner than nl.** Measured by ticket 38: the
  median page differs in 27 to 40 places in every store, and `uk` is the worst at
  40 with `de` next at 38.5 — both above nl's 37. `text-missing` is the largest
  class in all six, from 31% (be) to 40% (uk). **No page in any store is clean.**
- **`cross-store-link` fires 4 times site-wide, all on `be`.** Ticket 05 measured
  0 on nl and the number is still 0 there. The whole cross-store link surface of
  six stores is four anchors.
- **Production links out of the French store on all 29 be_fr pages.** 29 anchors
  to `terrasoverkapping?terrasoverkapping_model=6039%2C6040`, the Dutch category
  page, and one to `fotogalerij/glazen-schuifwand`. The new site does not: 1
  anchor, to `/blog`. It is a production storefront defect, so it is the log's
  output and needs an owner in `devdva02`. Recorded in ticket 49.
- **An element carries no DOM path.** `{ index, tag, kind, level, raw, norm }` is
  the whole record, so any check that needs to align two documents must do it from
  text or from the heading levels. Nothing else is available.
- **`CHECKS` declares a `meta` check that no class uses.** The meta vocabulary is
  empty on both axes. Ticket 11 adds the first two, on the coverage axis;
  ticket 21 owns the parity side. (Closed by ticket 21: nine parity classes, built
  as ticket 58. The Meta column on the dashboard has printed `—` on every row since
  the dashboard existed.)
- **`PageMeta` holds no hreflang**, no og and no twitter field.
- **All 451 `prodStatus` values in the seed data are 0**, and `prodMaintenance` is
  stale on nearly every row, because production was in maintenance mode for the
  whole seed run. Ticket 22 was to re-measure; it folded into tickets 51 and 53 on
  2026-08-07, so the re-measurement happens on the rebuilt seed list of spec 50.
- **A `<style>` or `<script>` nested inside an `<a>` was extracted as content.**
  That anchor holds no other text element, so it is a leaf, and `structuredText`
  handed the CSS and the JavaScript over as copy: **151 elements on 23 of 179
  pages**, each a `structure` finding nobody can act on. Ticket 02 had measured that
  the chrome list removes no _element_ inside `<main>` — true, and it never asked
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
- ~~**The mute key carries the anchor heading, and a mute says what it hides.**
  `store | page | class | anchorHeading`, where an absent heading is the page-wide
  form and a null one is the content before the first heading — a real section, and
  the third state the key had to spell out. Both forms state their finding count
  before the press and both require a note. Zero mutes were live when the key
  changed, so nothing was orphaned.~~ ADR 0008 and ticket
  [88](issues/88-the-mute-says-what-it-hides.md). — **withdrawn 2026-08-13 by ADR 0011**,
  which supersedes ADR 0008. Built, and it did what it says; the note it made mandatory is
  what let the feature be measured, and the measurement withdrew it. _Zero mutes were live
  when the key changed_ held on the day, and an editor wrote one at 11:07 the same day.

- **`<meta name="title">` is a copy of `<title>`, and keywords is a real field.** Both
  guesses behind ticket 58's two new `PageMeta` fields were wrong, and in opposite
  directions. `meta[name="title"]` is on 1,539 of 1,541 status-200 page-sides, so it is
  not absent — it is **byte-identical to that page's own `<title>` on 1,539 of 1,539 and
  differs on 0**, including 0 that differ only invisibly. So it is **not added**: a field
  that can never disagree with a field the contract already has is not a second field, and
  the Meta Title row shows `<title>`, which on this corpus *is* Magento's Meta Title field.
  Keywords was expected to be empty everywhere and is not: 356 of 777 production
  page-sides and 291 of 764 new ones carry it, across 224 and 176 distinct strings, and on
  the 722 comparable pairs **54 pages lose it, 12 change it and 4 gain it**. It is
  **kept**, and the Meta Keywords row ships. Present-but-empty — the distinction the
  ticket insisted on — is 4 page-sides per side, and it is one page in four stores.
  Ticket [92](issues/92-measure-meta-title-and-keywords-presence.md), measured with
  `crawl/probes/probe-92-meta-title-and-keywords.mjs`.

## Working order

Settled on 2026-08-10. 46 of the 90 tickets are closed. About 44 are open, and
they are five streams and not one queue. Three constraints give the order.

1. **`data/` has one writer.** Tickets 54, 55, 58 and 67 each rebuild the corpus.
   Two of them must never be in flight together.
2. ~~**Ticket 88 is free today and impossible tomorrow.** Ticket 65 measured the
   override table: no mute is live in any store. The table is append-only, so a
   mute written under the old key can never be repaired.~~ — **spent 2026-08-13,
   ADR 0011.** 88 landed 2026-08-10 and the mute is withdrawn.
3. **A measurement before the corpus settles is a measurement done twice.**
   Tickets 76 and 89 count the corpus that ticket 55 takes from 451 pairs to
   about 800.

The order:

0. ~~**[88](issues/88-the-mute-says-what-it-hides.md), alone and first.** Out of
   dependency order, for constraint 2.~~ — **done 2026-08-10; the mute is withdrawn
   2026-08-13, ADR 0011.** The order starts at 1.
1. **The corpus.** One ticket per session, serial:
   54 → 55 + 56 → 67 → 58.
2. **Re-measure.** 76 and 89. Also ticket 38's per-store counts, and the
   re-triage of 04, 16, 20 and 25 that ticket 50 asks for after 55.
3. **The stack, alone.** 72 → 73 → 74. An upgrade that carries a product change
   cannot be reviewed. **72 and 73 are resolved (2026-08-11); only 74 is left.**
4. **The contract, then the workspace.** 75 and 77, then 78, 79, 68, 37, 80, 81,
   31, 82, 83, 84, 85, 86, 90, and 87 last.

**Ticket 68 left the corpus stream on 2026-08-10.** It waits on the corpus, but it
is not corpus work: it is view work, and the grilling sequenced it after 79, whose
context markers decide which rows a clamp applies to. Three tickets now reshape one
component in one stream — 79, then 68, then 87 last — which is the order to keep.

**Ticket 37 is parked, and it was built once.** It was sequenced after 68 and that
order held: the build was clean. It came out on 2026-08-11 on one question the code
cannot answer — whether a second reading of the same page earns the surface it costs.
Nothing was wrong with it. **Parked `wontfix` the same day**, into
[.out-of-scope/37](issues/.out-of-scope/37-leesweergave.md): the feature may or may
not be wanted, and that is a brainstorm rather than a triage. The ticket holds what
it cost, its re-open triggers, and how to bring the code back.

The build is on the branch **`park/ticket-37-leesweergave`**, promoted from the stash so a
`git stash drop` cannot lose it. Restore it with `git stash apply
park/ticket-37-leesweergave` — **not** `git checkout`, because five of the nine files are
new and live on the ref's third parent. Ticket
[48](issues/48-open-and-done-board.md) was blocked by 37; that edge is **void** and
cleared, and 48 inherits the mode question 37 would have answered.

**Axis B is parked.** Tickets 39 to 44 stay a named stream and nobody starts
them. 45 left the stream on 2026-08-13, `wontfix`. The grilling of 2026-08-10 put axis B out of scope for the workspace work,
and this line makes that a decision instead of a silence. Nothing about the
tickets changes, and the edges in the axis B section below still hold.

Two items want a human and not an agent: [30](issues/30-wire-the-supabase-project.md)
is one click and [48](issues/48-open-and-done-board.md) re-triages after 37.
~~Ticket 34's deep link wants a grilling before it wants code~~ — taken 2026-08-17.
The grilling was one question, and what it wanted was a decision and not a debate:
what a finding with no anchor heading offers instead. It offers the page.

## Ready to build

- **The same words, divided differently** — spec
  [119](issues/119-spec-the-same-words-divided-differently.md), five build tickets in
  dependency order: **118 → 86 →
  [116](issues/116-a-merged-paragraph-is-one-row.md) →
  [120](issues/120-a-split-paragraph-is-one-row.md) →
  [121](issues/121-a-run-may-hold-a-heading.md)**, with
  [117](issues/117-the-page-keeps-one-h1.md) held at `needs-triage` and gating nothing.
  Decisions: [ADR 0012](../../docs/adr/0012-regrouped-requires-total-coverage.md) and
  [ADR 0013](../../docs/adr/0013-the-finding-set-hash-ignores-visibility.md). Each ticket
  moves a number, so each lands on its own run — ticket 33 established that one number
  hiding two opposite movements is how a measurement stops meaning anything.

  [118 — the finding-set hash ignores visibility](issues/118-the-finding-set-hash-ignores-visibility.md)
  — **resolved 2026-08-13.** `findingSetHash()` no longer filters on class visibility, so
  a vocabulary edit can never again print _changed since review_ on a page where nothing
  moved. It landed first and alone so its churn is attributable to it: **84 of 133 live
  page reviews go stale on the run**, announced in advance by
  [notes/2026-08-13-your-page-reviews-go-stale-once.md](notes/2026-08-13-your-page-reviews-go-stale-once.md).
  Both the ticket and ADR 0013 predicted 121 and _all_ of them. The ADR's paragraph is
  rewritten, and the ticket's trap is struck through in place with the measurement beside
  it. 6 reviews survive, because a page whose findings are all `work` hashes the same
  under either rule, and 43 were already stale for reasons that predate the decision.
  **86 is unblocked.**

- **The interface speaks one language, and it is English** — two tickets from the
  grilling session of 2026-08-13, which started from ticket 42 and found that the
  question it raises is not 42's at all. Decision:
  [ADR 0014](../../docs/adr/0014-the-interface-speaks-english.md), which reverses
  ticket 38's criterion, spec 32's story 39 and decision 42, and amends ADR 0010's
  parameter-name clause.

  Spec 32's rule survives and only its value changes: **one** interface language
  for all six stores, because matching two strings needs no comprehension of
  either. No i18n machinery and no translation affordance. The insight that shaped
  the work is that `CONTEXT.md` is already in English and already names nearly
  every control, so this is not a translation job — it is making the labels agree
  with the glossary, which **wins** where they disagree. That corrects three
  long-standing mismatches: the `Verschillen` view becomes **Repeats**, the unit it
  actually lists; `Ongedaan maken` becomes **Clear**, because the glossary refuses
  `un-` words; and `nog niet opgelost` becomes **claimed fixed, still differs**,
  the sentence the glossary always prescribed. The `Inhoud` tab becomes **Text**,
  because "Content" is a retired tab name and _content view_ is the spine it draws.

  - [124 — The interface speaks one language, and it is English](issues/124-the-interface-speaks-one-language-and-it-is-english.md)
    — one ticket and one merge: every label in `web/src`, `lang="en-GB"` and
    `en-GB` dates, the five URL parameters and the search-index route and the
    export filenames, the Dutch reason prose in `shared/excluded-regions.mjs`, the
    English store names, the glossary renames with each Dutch label struck and
    dated, and a stopword guard in `npm test`. A half-Dutch application is worse
    than either end state, and the guard cannot pass until the labels are done, so
    the split is a commit per area and not a second ticket. It **blocks 42**, which
    builds the axis B tab and would otherwise write Dutch labels a week before
    deleting them.

    **Resolved 2026-08-13.** Four commits, one per area: the contract (the five screen
    parameters, `finding` and `back`, the `/search-index/` route, the export filenames,
    the six store names, `lang="en-GB"` and the three dates), the labels (34 files), the
    stopword guard, and the documents. **No count, bar, denominator or derivation moved**
    — the tests that pin that rule pass **unchanged**, and `view.mjs` and `bulk.mjs` are
    edited in their comments only, which is the whole claim of a relabelling. The guard
    caught one real hit on its way in: _resolved_ as an ordinary verb in `view.mjs`,
    reworded rather than excused. Two words were renamed
    beyond the ticket's list, both under the trap's own test — _does it reach the address
    bar_ — namely `bevinding` and `terug`; and the `bevinding-` DOM anchor followed them.
    The old Dutch parameters are **not** aliases, so a link copied before today opens the
    default screen. **125 is unblocked**, and it owns the `lang` on a content cell, which
    this ticket deliberately did not touch.

  - [125 — A content cell says which language it is in](issues/125-a-content-cell-says-which-language-it-is-in.md)
    — `ready-for-agent`, blocked by 124. `lang="nl"` has been wrong on five of six
    stores since the shell was written, so a German paragraph on `/de/` is
    announced as Dutch. Triaged 2026-08-13: **the page key carries no language**,
    in the breadcrumb or the `<h1>`, because a url key is an identifier and not
    prose — it inherits the shell's `en-GB` and is announced in English. Tagging
    it `nl` would make the one non-content element the loudest language claim on a
    `/de/` page; tagging it `en-GB` explicitly sounds the same and asserts
    something false. The accepted cost is a Dutch slug read with English
    phonetics.

  Two things the session settled that the tickets record rather than decide. **The
  editor's notes are data** and stay exactly as typed, in any language, because a
  tool must not rewrite a judgement somebody recorded. And **one regression is
  accepted**: on `/uk/` the chrome and the content become one language, which the
  Dutch chrome was distinguishing by accident — the two columns, the diff cells and
  the class pill do it on purpose, and 125 adds the machine-readable half.

- **The log becomes a workspace** — nineteen tickets from the grilling session of
  2026-08-10, which read a product proposal against the code and the corpus. Five ADRs
  carry the decisions; see **Decisions so far**. Axis A only.

  The measurement that shaped them: **22,990 shown findings of 33,507, over 448 reports
  and 373 comparable pages**, in **8,229** distinct repeats. 116 repeats covered a
  quarter of the corpus and 903 covered half — but **3,925 repeats are singletons**, so
  **the backlog is not drained**: 90% coverage costs about 5,930 decisions. Progress must
  read as how much is decided and never as how much is left. The head of that
  distribution was the promo banner, which ticket 64 has since excluded.

  **These numbers are superseded — do not design against them.** Ticket 81 measured the
  816 reports now on disk: **35,503 shown findings, 25,657 repeats across the six
  stores**, and the head is flat — the largest repeat in the largest store is on 22
  pages, and 79% to 91% of every store's repeats are singletons. 76's own accusation
  applies to its table. The current per-store curve is in
  [81's answer](issues/81-the-repeat-is-the-queue.md).

  **76 is resolved 2026-08-12 without a new measurement.** It asked for a before-and-after
  of the banner removal, and the before corpus no longer exists on disk — the crawls of 50
  and 54 overwrote it, and all 816 reports are post-64. The banner is confirmed out (12 of
  816 reports mention it, all of them the actievoorwaarden page and in-body links, never
  the block). 81 carries the after. The bulk-dismissal verdict for 31 is **no**.

  The stack goes first, alone, because an upgrade that carries a product change cannot be
  reviewed:
  [72 Astro 6](issues/72-upgrade-to-astro-6.md) — **resolved 2026-08-11**,
  [73 Astro 7](issues/73-upgrade-to-astro-7.md) — **resolved 2026-08-11**,
  [74 seven primitives](issues/74-seven-accessible-primitives.md) — **resolved 2026-08-13**,
  built in `34a9e96` and found by a triage sweep with its status line never moved.
  Astro 7.2.0 is current, the documented path from 5.14 is 5 → 6 → 7, and v6 raises the
  Node floor to 22.12.0 for the crawl and the re-check service as well as the build.

  **73 was upgraded by hand, outside a ticket**, so it did not run its gate. 72 closed on
  a byte-identical build of all 823 pages; 73 has no such line, and the whitespace
  difference its own criteria predicted from the new `compressHTML` default is
  unmeasured. ~~74 is unblocked either way — it builds on top of whatever the tree is.~~
  — **74 is resolved, 2026-08-13**; it built on top of the tree as written and the
  question of 73's ungated upgrade is unaffected by it, and still open.

  Then the contract and the measurements, all unblocked:
  [75 class visibility](issues/75-class-visibility-replaces-shown.md),
  [76 the coverage curve](issues/76-the-coverage-curve-without-the-promo-banner.md) — **resolved 2026-08-12**,
  [77 the run log](issues/77-a-finding-says-when-it-was-first-seen.md),
  [88 the mute](issues/88-the-mute-says-what-it-hides.md) — **resolved 2026-08-10, and its
  subject withdrawn 2026-08-13 by ADR 0011**,
  [89 what a campaign rule would catch](issues/89-what-a-one-sided-campaign-rule-would-catch.md).
  ~~**88 is urgent while it is free.** Ticket 65 counted the table: no mute is live in any
  store, the table is append-only, and a mute written under the old key can never be
  repaired.~~ — spent. Tickets 111 to 115 withdrew the mute.

  Then the interface and the rest:
  [78 the history note](issues/78-a-closed-finding-leaves-a-history-note.md),
  [79 the context marker](issues/79-the-content-view-opens-on-the-differences.md) —
  **resolved 2026-08-14. The content view opens on the work**: the nl store draws 5,290
  rows where it drew 6,977, a fall of 24.2%, with 2,560 agreeing blocks behind 873
  markers and nothing removed from the page. The predicate is deliberately **narrower**
  than 68's `equal` — a row that carries a class is not collapsed, even when its words
  agree — which is the disagreement the grilling of 48 found, and 48 widens it to *no
  open work* in one expression. *Differences only* **went** rather than being reworded: it
  narrowed the view, which is the one thing ADR 0006 forbids here, and *Show unchanged
  blocks* opens every marker instead. `rowKeyFromHash()` came back three days after 68
  withdrew it with the clamp, because this is the caller it was written for and the run
  must open before the browser looks for the row. **The marker does not help the worst
  page**: `fotogalerij/zonwering` is 446 findings over 185 rows and draws no marker at
  all, because almost every row is one-sided and therefore carries a class — 64 of 179 nl
  pages are the same. It helps the middle, and that is the honest claim. `pages equal`
  left the dashboard strip,
  [80 three buckets](issues/80-three-buckets-and-the-third-is-closed.md),
  [81 the repeat is the queue](issues/81-the-repeat-is-the-queue.md),
  [31 one reason, many findings](issues/31-bulk-dismissal.md),
  [82 search](issues/82-search-reaches-the-content.md),
  [83 priority and note](issues/83-a-page-carries-a-priority-and-a-note.md),
  [84 migration decisions](issues/.out-of-scope/84-a-one-sided-page-carries-a-migration-decision.md),
  [85 the comparison scope](issues/85-the-comparison-scope-is-legible.md),
  [86 heading level](issues/86-heading-level-becomes-information.md) — **resolved
  2026-08-13. The first re-triage that moved the denominator on purpose: 2,846 findings,
  10.00% of the work findings, out of `work` and into `information`. 28,462 → 25,616, and
  no other class tally moved by one finding**, which
  `crawl/probes/probe-86-heading-level-denominator.mjs` re-measures and fails on. Not a
  deletion — it renders, keeps its `detail` and keeps its id. The evidence was never the
  volume: of 682 live override events, **zero** sat on the class, so it had been shown for
  months and skipped, and nothing detached. It needed 118 first, or one word would have
  marked 392 page reviews stale on a day when no page changed. It also lands the generic
  `canDecide()` rule that 79, 48 and 116 read; the **context marker itself is still 79's**,
  so the collapse third of its criterion eight is a predicate here and a feature there,
  [90 a campaign is a class](issues/90-a-campaign-is-a-class-not-a-commit.md),
  [87 three widths](issues/87-three-widths.md).

  78 needs 77. 81 needs 76. 31 needs 81 and 88, and 30. 82 needs 81. 85 and 86 need 75,
  and 86 needs 76. **89 and 90 are both closed**: 89 refused 90's rule on exactly the
  objection ADR 0003 used against a Dutch text anchor, and 90 then got its outcome from
  an id production puts on the banner block. 87 is last so it is not done twice.
  [31](issues/31-bulk-dismissal.md) was rewritten rather than duplicated: the grouping
  key it asked for three sessions ago is 81's **repeat**.
  [48](issues/48-open-and-done-board.md) is **not** superseded — 81 groups across pages,
  48 groups within one page — but its first triage question is answered, because
  collapsing is not a view mode and 37 keeps that question.

- **The content unit, and the regions that leave the log** — ten tickets from the
  grilling session of 2026-08-07, which started from two reports of findings on text
  that looks identical. Four measurements decide them. **The leaf rule loses about
  3,400 words of body copy over ten pages**, because one inline link discards its
  whole paragraph; in one 190-word paragraph the log compares 35 characters, and that
  paragraph holds a product-spec regression (`6063-T6` against `6036-T6`) that the
  tool cannot report. **The promo banner makes 2,698 findings, 7.7% of 34,910, on 371
  of 448 pages** — one shared block, authored once. **Production hides 614 words in
  tags the extraction never read**, which is why nine tiles read as invented on each
  category page. **Two byte-identical strings can be reported as a `casing`
  difference**, when duplicate text defeats the ordered match. Ticket 28 read the
  volume as a statement about alignment; a large part of it is a statement about
  extraction, and that is fixable.
  In dependency order:
  [61 tier-1 gaps](issues/61-tier-one-normalisation-gaps.md),
  [62 identical units](issues/62-identical-units-make-no-finding.md),
  [63 regions at extraction](issues/63-regions-excluded-at-extraction.md),
  [64 the promo banner](issues/64-promo-banner-legacy-only-region.md),
  [65 count the overrides](issues/65-count-the-overrides-the-fold-detaches.md),
  [66 the rename](issues/66-rename-text-element-to-content-unit.md),
  [67 the fold](issues/67-a-content-unit-folds-its-inline-links.md),
  [68 the clamp](issues/68-the-content-view-clamps-a-tall-row.md),
  [69 one viewport](issues/69-one-canonical-viewport.md),
  [70 shared regions](issues/70-shared-regions-by-content-hash.md).
  61, 62, 63, 64, 65, 66, 67 and 68 are resolved. 70 needs the new environment, which
  answered HTTP 500 on all six hosts while this was written.

  **The clamp was withdrawn on 2026-08-14 and 68 is `wontfix` for that half.** A row shows
  its block whole: most blocks are shorter than four lines, so the clamp changed nothing on
  them while its control drew itself on every row, and where a block is long the complete
  overview beats a window onto its first change. **The diff-cost numbers below stand** —
  the trim, the cap and the `equal` fact are untouched — and the 105-pixel row is now the
  record of what the clamp did, not a fact about the interface. Read the rest of this entry
  as of the day it resolved.

  **68 is resolved**, 2026-08-10, and it ran **before 79 rather than after it**. A row
  clamps to four lines, so the rows on `nl__privacy-beleid` are **105 pixels at the
  median** where they were 450 to 550, and a 900-pixel screen carries eight of them. The
  word diff over 816 reports fell from **32.1 million LCS cells to 789 thousand,
  −97.5%**: 20,380 of 22,571 two-sided rows agree and are no longer compared at all
  (−83.4% on its own), the trim takes one changed word in a long paragraph to almost
  nothing, and the cap of 50,000 **fires on no row in the log** — the worst row after
  the trim is 44,523 cells, so the cap stays where the tail is and not where the reader
  is. A row's anchor is the unit's document position now (`p11`, `n4`), because the row
  index moved whenever the row list did. Unthrottled first paint meets both targets on
  both pages and `fotogalerij/zonwering` met neither before; under a 4× CPU throttle TBT
  is 1 to 2 seconds before **and** after, which is hydration and payload and not the
  diff. Two findings: **exact trim equivalence is not true** — a repeated word gives two
  alignments of one length and the trim takes the later — so ADR 0009 now claims
  optimality and the lossless rejoin instead; and the **collapsed run** half of the jump
  criterion is 79's, which now carries it as a criterion of its own.

  **67 is resolved**, 2026-08-10. A content unit is a block, and a block folds the
  `a` and the `button` inside it; a nested block still breaks it. The nl store went
  from **9,293** production units to **7,424** on the same 179 pages, so a fifth of
  production's units were fragments. The `/overkapping` paragraph the ticket is named
  after is one `<p>` on each side and the `6036-T6` regression is a shown `copy`
  finding, where the log used to compare 35 of its 1,232 characters. Seven live
  judgements of 33 detached, all on `nl`, and the dated note goes out with it. It also
  put `ABSOLUTE_MAX_UNITS` in question: the near-miss that justified the ceiling of
  100 now measures 91. That needs a ticket.

  **61 is resolved**, 2026-08-07, and it removed **no finding**. `tier1()` now
  folds a hexadecimal entity like a decimal one, removes the soft hyphen and the
  three zero-width characters, and names every Unicode space. Tier 2 is untouched.
  The probe re-normalises all 448 extracts and compares each page before and
  after: **34,559 findings on both sides**, no class moving by one. But the corpus
  holds **not one** hexadecimal entity, zero-width character or `&shy;`, in
  `data/extract/`, `data/reports/` or `data/rechecks/`; the string `Sorteer` does
  not occur at all. The soft hyphen occurs twice, inside a `text-missing` finding
  it did not cause. **The fix is correct, tested, and unproven against the two
  reports that asked for it.** `Sorteer op` is a listing-toolbar label, so the
  page is outside the seed list, or it is client-rendered (ticket 19). A page that
  shows the symptom is still necessary.
  Found while resolving: **a malformed numeric entity stopped the crawl.**
  `String.fromCodePoint()` throws above U+10FFFF. The defect was there before this
  ticket, on the decimal branch, but the hexadecimal branch makes it easy to hit:
  `&#xdeadbeef;` in CMS text is now a match. A guard returns the entity unchanged
  when the number is no character.

  **62 is resolved**, 2026-08-07. `classifyPair()` hands a pair of equal `norm`
  strings to `classifyExactPair()`. The tier-2 classifier now names a visible
  difference only when there is one. `casing` was its first test, and the
  byte-identical `casing` finding was **391 findings on 448 pages**, all of them
  shown. The rebuild goes from 34,910 findings and 23,961 shown to **34,559 and
  23,570**: 351 disappear and **40 become `tag-changed`** — equal text in a tag that
  moved, which the phantom finding had been hiding. `casing` stands at 271, every
  one a real letter-case difference. No class entered the vocabulary. `mayPair()`
  keeps `heading-level` off this path, so ticket 33's LCS route to it is untouched.
  391 finding ids leave the log, which is 391 more orphaned overrides for ticket 65
  to count.

  **66 is resolved**, 2026-08-07. `TextElement` is `ContentUnit`, and
  `textElement()` is `contentUnit()`. The larger part was the synonym: 25 files
  called a unit an "element" in a comment, a local, a test factory or a React prop.
  The word "element" now means the HTML element and nothing else, which is the whole
  point of the new noun. **No field name moved** — `PageExtract.elements` is
  untouched, so no report changes shape. All 448 reports were rebuilt against the
  build from before the rename: **0 differ**, 34,559 findings and 34,559 ids on both
  sides, 0 lost and 0 gained. The contract states in its own words that the unit does
  not fold yet, so it never reads ahead of its code; ticket 67 deletes that
  sentence. The Dutch interface said "elementen" and now says **"blokken"**, taking
  ADR 0002's own word for the thing.

  **65 is resolved**, 2026-08-07, and the answer is **one dismissal**. Supabase is
  reachable and holds 45 events, 14 keys and **5 live overrides**, all of them
  dismissals and all of them on `nl`. Of the five, **1 detaches**, 3 hold, and 1 is
  detached already by an edit the editor made on the new site. **No page review is
  live in any store**, so the fold cannot make one stale. Ticket 62's 391 lost
  finding ids orphaned **0** live overrides, so that sentence above is a count of
  findings and not of judgements.
  `crawl/probes/probe-fold-detachment.mjs` is the measurement, and ticket 67 runs it
  again on the day it ships, before it changes the extractor.
  Two things the naive rule got wrong. **"An anchor inside a text block" over-counts
  by three of five**: the id reads the words, and an anchor alone in its paragraph
  keeps its words when the fold moves it one tag up. And **the tag is still not
  innocent** — `restructured` fires when the two sides differ in tag, and the class
  is in the id, so a pair that goes from `a` vs `a` to `p` vs `a` changes class,
  becomes hidden, and drops the dismissal. That is the one detachment.

  **63 is resolved**, 2026-08-07, and it resolves ticket 27 with it.
  `shared/excluded-regions.mjs` is the committed list, and `extractPage()` cuts a
  region before the walk, so no unit the log has no business with ever takes a
  number. The list is in `shared/` because `crawl/` cuts the region and `web/` lists
  it — ADR 0001's first resident that was written into the seam rather than moved
  into it. The first entry is `#amasty-shopby-product-list`. Measured on both hosts
  on `/overkapping`, `/carport` and `/veranda`: **one match on each side, −50 units
  on production and −21 on the new site**, the same on all three, and **no match** on
  four CMS pages, a home page and a live product page. The probe compares each
  category page before and after the cut: on `/overkapping` **258 findings become 172
  and 186 shown become 139**, `text-added` falls from 32 to 16, and **16 rows leave
  and 0 appear on each of the three pages**. That nothing appears is the half that
  matters: a cut that moved the pairing would invent findings elsewhere. The sixteen
  are the nine tile titles, the pager, the result count, the sorter and the three USP
  strip lines.
  **The flat cap of 20 could not ship, and the cap is now per entry.** Ticket 63
  asked for 20 and ticket 27's own first entry removes 50, so the two criteria
  contradicted each other. An entry that declares no cap still gets 20, and the list
  **refuses an entry whose cap is below its own recorded measurement**. Because both
  numbers are written by hand, no entry may declare a cap **above 100** — above the
  widest entry (50) and below the `.magezon-builder` near-miss (139 on the same
  page). A region wider than the ceiling needs a decision in the ADR. The cap counts
  the whole entry on one page, not one match, and a nested match once. It counts
  content units only, so a link-dense or image-dense region does not trip it; that
  limit is stated in the ADR.
  **Ticket 27's 69 and 48 do not reproduce**, and the cause is not established. The
  catalogue moved (`1702 resultaten` then, `1320` now) and ticket 61 shipped in
  between; neither is proven. Ticket 27 is corrected in place.
  One page pays the ticket-27 argument back: production gives `showroom-contact` the
  body class `catalog-category-view`, and the selector correctly matches nothing on
  it. `pageType` names a page kind; the grid is a region.
  **The 19 nl category pages are re-crawled and re-compared, and nothing else is.**
  **3,368 findings become 2,316, and 2,323 shown become 1,743.** A rebuild does not
  detach an override here: `findingId()` hashes the two texts and no position, so a
  surviving finding keeps its id. That risk belongs to 67, which rewrites the text of
  units that stay. The other five stores pick the entry up at their next crawl.
  Three things the three measured pages could not show. **Four category pages have no
  grid at all**, and the entry is correctly silent on them. **`glazen-schuifdeur`
  matches on both hosts with an empty grid on the new site** — 41 units against 0,
  which is the rule working. And **`losse-onderdelen` breaks the ADR's third bar**:
  production has the container and the new site does not have it at all. It widened
  nothing — `text-added` stays at 15 and `text-missing` falls from 53 to 44 — but the
  new site's grid furniture there survives the cut. That is a second entry waiting for
  a measurement, and it is deliberately not added blind.
  The USP strip stays open. On the new site this entry already takes it; on
  production its position is still unmeasured, so it does not get an entry yet.

  **64 is resolved**, 2026-08-07, and it is **the largest single removal in the
  project**. The promo banner is the list's first `legacy-only` entry. Its anchor is
  the campaign option ids in a link href — `.mgz-element-section:has(a[href*=
"_model=6039,6040"])`, and the same selector again for `6039%2C6040`, because
  `[href*=]` reads the **raw** attribute and one page sends both encodings. The
  banner has no other hook: its wrapper class is a generated hash, a different hash
  in each store, and its text is translated per store.
  **Measured on the whole corpus, in all six stores, from the seed urls** — `fr` and
  `be_fr` included, which the grilling never verified. Production matches **twice**
  on every page, the new site matches **nothing**, and the banner is on **446 of 448
  pages**. **34,488 findings become 30,433, so 4,055 leave, 11.8%**, and 23,020 shown
  become 19,460. By store: **nl 1,347, be 1,156, de 498, uk 479, be_fr 300, fr 275.**
  By class: `text-missing` 2,378, `missing-link` 1,169, **`image-campaign` 503**,
  and a tail of 28.
  **The ticket's own numbers were low on all three counts** — it said 2,698 of 34,910
  on 371 pages, and it missed `image-campaign` entirely. **And its reason for the two
  responsive versions was wrong**: they are siblings, not one wrapper. They leave
  together because one entry counts all of its matches. The wrapper above them is
  `.magezon-builder`, which is the near-miss the ADR forbids.
  **The default cap of 20 could not ship either.** Three nl pages carry the same
  banner **twice** — `glazen-schuifwand`, `shading-panel`,
  `steel-look-glazen-schuifwand` — at 4 matches and 18 units. 20 holds today and
  stops the crawl on a third placement, so the entry declares **30**. A small region
  that repeats needs room for a repeat, and that is now in the ADR.
  **23 findings appear, on 22 pages, and every one is the pairing correcting
  itself**: a banner unit was absorbing a new-site unit. 13 are `text-added`, which
  is hidden. They are more reporting and not less.
  **Coverage is now compared against the previous snapshot.**
  `compare/region-coverage.mjs` counts the pages each entry was removed on, and
  `data/snapshot.json` carries the verdict. The verdict is stored and never the
  sentence: the crawl writes Simplified Technical English and the dashboard writes
  Dutch, so two translations cannot drift. Two runs are compared only at the same
  scope, because a one-store run against a corpus snapshot would read as five stores
  that stopped matching. The counting is one rule in one place, and
  `regionsRemovedInStore()` in `web/` now calls it.
  **No crawl was run**, for ticket 63's reason: a rebuild detaches overrides, and
  that is 67. Both probes measure live and write nothing else. Two pages,
  `faq/offerte` on nl and be, answered a transport error and are unmeasured.

- [50 — The content page discriminator](issues/50-content-page-discriminator.md)
  — designed in the grilling session of 2026-08-07, `claimed`. **The seed list
  holds 28 French pages. The French store has about 110.** The cause is not the
  sitemap: all six production sitemaps hold all six stores and are ≥99% the same
  URL set. The cause is the filter. `nl`, `be` and `uk` mark their store-local
  content `changefreq=daily`; `de`, `fr` and `be_fr` mark the same content
  `never`. The new rule is `(alternates < 6 or daily in any file) and not a
product signature` — a product page carries all six hreflang alternates, and
  exactly 4,444 locs for each store do. Verified on the live navigation of three
  stores: 88–91% coverage, against 40% for French under the old rule. The store
  page count goes from 451 to about 800.

  **The NL baseline does not move**: 133 of its 181 rows are in the new set, 48
  are in no sitemap at all and are carried over, and none are new. This reopens
  [04](issues/04-six-store-page-lists.md), whose "the sitemap yields exactly the
  hreflang counts" reads one file two ways, and whose "no page exists in a non-NL
  store without an NL counterpart" is false — 283 clusters have no NL member.
  Ticket 38's per-store counts must be re-measured after it lands. **Done on
  2026-08-10 by ticket 55**, in ticket 38 and in its entry above.

  **The cross-store view for editors is the next ticket, not this one.** It is
  axis B, and everything ticket 38 built is axis A. Its first question: are those
  283 unanchored clusters a real difference between the store views, or a gap in
  the sitemap metadata?

  **Ticket 22 folded in on 2026-08-07.** 53 now also measures `prodStatus` and
  `prodRedirect` over the rebuilt list and clears the stale `prodMaintenance`
  flags, and 51 also deletes the generator's private copy of the maintenance rule
  in favour of `maintenanceReason()` and `MaintenanceError` from
  `crawl/fetch-page.mjs`. The status pass is a second step over the finished list,
  not part of the generator — 53's "the generator makes no live request" stands.

  **Two tickets now wait on 55** — 16 has since closed, 2026-08-11 — the rollout
  sitting: [16](issues/16-new-site-page-discovery.md) and
  [20](issues/.out-of-scope/20-one-sided-pages-checklist.md). Both count out of the seed list,
  and both re-triage after it. **55 landed on 2026-08-10, so both are unblocked**,
  and so is [04](issues/04-six-store-page-lists.md).
  [49](issues/.out-of-scope/49-be-fr-shared-host-blind-spot.md) is **re-opened**:
  its own trigger fired and the number that made it wontfix went from 1 to 12.
  `WORKLIST.md` step 33 holds all four.

  **The spec is delivered. 55 landed on 2026-08-10 and the number is 816.** Every
  one of the six dashboards holds every page of its store: nl 179, be 130, be_fr
  122, de 134, fr 123, uk 128, against 451 store-page pairs before. The German
  store goes from 45 pages to **134** and the British from 42 to **128**.

  **The NL baseline held, byte for byte** — 179 crawled, 124 comparable, 9,635
  findings, 6,747 shown, median 37. That is the check that the new rule did not
  over-collect, and it is the whole reason `nl` was kept invariant across the spec.

  Navigation and footer coverage, measured on production for all six stores:
  nl 94.2%, be 90.6%, be_fr 92.0%, de **90.6%**, fr 90.2%, uk **88.5%**. `de` and
  `uk` hit ticket 50's numbers exactly. Every miss is a blog page or the
  newsletter, and both are in no sitemap — with one exception, `/Separate-parts`
  in the British chrome, which is a storefront defect and is recorded in
  `devdva02`.

  Broken into six build tickets. **51, 52 and 53 are all resolved (2026-08-10),
  so 54 is unblocked and is the go/no-go.**

  ```
  51 ─┬──> 53 ──> 54 ─┬──> 55
  52 ─┘               └──> 56
  ```

  Run them in three sittings, not six: **51+52+53** is the input and the rule,
  and ends with per-store counts that can be checked against the Magento store-view
  grid. **54** is French end to end and is the go/no-go. **55+56+57** is the
  rollout, the excluded list and the cleanup. The cost is the crawl — about 1,600
  requests — and it is the same cost whatever the ticket count. 54 exists so that a
  design defect costs one store and not six.

  **57 was written and then merged**, because the count it waited on came back
  narrow. The page value is used in about 82 places and only **twelve** hold an
  assumption about its shape; the finding id, the mute key, the database column and
  everything shown to an editor treat it as opaque. So there is no expand and
  contract: a page that has a Dutch url key keeps its current string, byte for
  byte, and nothing stored detaches. The override table is append-only by policy,
  so that condition is not a convenience — a reformatted key could never be
  repaired. The identity change lands inside 54.

  One trap recorded there: the unused store-scoped fallback key in the old
  generator uses a **colon**, which is illegal in a Windows filename and would
  break the extract writer, the report writer and the static build. The home-page
  sentinel proves that **parentheses** survive all four. No current key contains a
  colon, so the fallback has never fired.

- [32 — A scannable diff, class filters, six stores, and a design system](issues/32-scannable-log-and-six-stores.md)
  — the spec from the grilling session of 2026-08-06. **Resolved 2026-08-13 —
  the record of what it built is in Decisions so far, above; this entry is the
  workstream and keeps the record of tickets 35, 36 and 48.** Eight
  phases, and **phase 1 must be measured before phase 2 starts**. It retires
  `structure` for a directional `text-missing` / `text-added` pair, adds
  `heading-level` and `tag-changed` for the **762 tag changes on 80 pages the log
  reported as identical**, merges Diff and Content into one tinted
  content view, adds class filters and a store switcher over all six stores, gives
  every finding a position, and puts the storefront's 22 brand hexes into one
  Tailwind 4 `@theme`. Resolves ticket 28 and closes ticket 12's remaining
  questions.

  Broken into six build tickets. **33, 34, 35, 36 and 38 are resolved** — 34's
  ninth criterion, reopened by the review of 2026-08-07, closed 2026-08-17.
  **37 is parked `wontfix`**, so no ticket of this spec is waiting to be built.

  ```
  33 ✓ ──> 34 ✓ ─┐
     └──> 35 ✓ ──┴──> 36 ✓ ──> 37 ✗ parked ──> 48 (needs-triage)
  38 ✓ (independent) ──> 49 ✗ wontfix
                     └──> 59 ✓, 60 ✓
  ```

  **34's open criterion blocked nothing, and it is now closed.** 36 needed the
  row-ordering fix and 37 needed the document-order index; both landed and are
  measured. The deep link was orthogonal to each, and neither ticket mentions it. So
  the reopening was a debt to pay rather than a gate to wait on — 36 did not wait,
  37 need not have, and the debt is paid.

  **Ticket 36 is resolved: the log is one view of the page, and it can be
  narrowed.** Seven tabs are five — Inhoud, Links, Afbeeldingen, Meta, Taken —
  and Inhoud is the whole document in order, matched rows included, because a tint
  only reads as a signal against untinted baseline. Outline is navigation now, a
  sticky jump-list built from the rows that are actually on screen. Markdown is a
  download.

  **The filter is a pure module, and that is the load-bearing decision.**
  `web/src/lib/view.mjs` decides what is on screen; the components are pixels. It
  returns rows, the classes the page carries, and a row total — and a test pins
  that it returns _nothing else_, because the one rule that outranks the rest here
  is that a filter never moves a count. Measured: filtering the dashboard to
  `casing` narrows 124 pages to 58 and leaves `7455 verschillen open` where it was.

  Two things a reader will want to know. The tab badges all count **findings**,
  Inhoud's included, so a row count never sits beside four finding counts. And a
  class filter implies the differences: narrowing to `copy` does not also keep the
  matched rows, because the pass an editor asked for is the copy edits.

  |                                               |                                                  |
  | --------------------------------------------- | ------------------------------------------------ |
  | rows on the largest page, `terrasoverkapping` | **288**                                          |
  | `fotogalerij/zonwering`, the worst case       | 399 findings over 178 rows                       |
  | filter re-render there                        | **21 ms** — no virtualisation needed, none added |

  The "Opgelost" button is a **checkbox** with three states: unticked, ticked, and
  ticked-but-contradicted. Dismissal ~~and mute~~ keeps its menu, because a note is
  mandatory on a dismissal and a checkbox cannot carry one. — **2026-08-13, ADR 0011: one
  menu, not two.** The reason is unchanged and it only ever applied to the dismissal.

  ~~**Ticket 34 is reopened.**~~ **Closed 2026-08-17.** Position, ordering, the
  shared counter and the occurrence badge landed in 2026-08 and hold the baseline
  exactly. The deep link was the one gap, in two halves: findings with no anchor
  heading carried no link at all, and where a link did render both sides were built
  from the **production** heading — that second half was fixed 2026-08-13, the first
  on 2026-08-17. Spec 32's **story 29 is met**. The decision nobody had taken is
  taken: a finding with no heading opens the page itself, and a link aims at the
  finding rather than its section wherever the finding has words on the page.

  **The logo belongs to no ticket.** `fe921ce` added the Tuinmaximaal mark to the
  shell inside ticket 34's branch. It is not phase 7 (six stores, ticket 38) and it
  is not phase 8 either: phase 8 is the design system, decisions 43–48, and it asks
  for a `@theme`, a colour discipline, greys and a monospaced family. **No decision
  in spec 32 asks for a logo.** The nearest owner is ticket 35, which holds the
  chrome and the header — and 35 is resolved, so this arrived after its ticket
  closed.

  It is kept rather than reverted, and recorded here because unticketed work in the
  shell is exactly what this map exists to catch. It also **removed the header title
  and strapline**, so the product name now lives only in the `aria-label` of the
  header link. That decision was never taken anywhere. Either restore the words
  beside the mark or write down why the mark alone is enough — and do it against a
  ticket, reopening 35 or opening a small one of its own.

  - [35 — One visual language: brand tokens and a real diff](issues/35-diff-rendering-and-design-system.md)
  - [36 — The content view: the whole page, filtered, tickable](issues/36-merged-content-view.md)
  - [37 — Leesweergave: the page as a reader sees it](issues/.out-of-scope/37-leesweergave.md)
    — **parked `wontfix` on 2026-08-11**, built once and kept on the branch
    `park/ticket-37-leesweergave`.
  - [38 — Six stores, not one](issues/38-six-stores.md) — **resolved**, above.
  - [48 — A row collapses when it holds no open work](issues/48-open-and-done-board.md)
    — **triaged 2026-08-13, and the board is refused.** `ready-for-agent`, blocked by
    79 and 80. The mode question it inherited from 37 is not answered but **not asked**:
    nothing here is a mode. What is left of the ticket is one sentence — a row collapses
    when it holds no **open work**, not when its two texts match — so it is 79's missing
    predicate and not a second reading of the page. _Afgerond_ is 80's **Closed** bucket;
    a contradicted row is Needs attention and stays visible. The "is a ×6 finding one
    task or six" question dissolved: only a thing that counts tasks had to answer it, and
    a fold counts nothing. The grilling also found that **79 and 68 disagree about
    `equal`** — 68's rule collapses a row carrying an open `heading-level` finding, which
    79's own first criterion forbids — so 79 gains a criterion narrowing it, and 48 is
    the deliberate widening afterwards. This makes 48 a correctness fix, not a
    convenience. `CONTEXT.md`'s **Context marker** entry is corrected; no new term, no ADR.
  - [49 — The be/be_fr shared-host blind spot, measured](issues/.out-of-scope/49-be-fr-shared-host-blind-spot.md)
    — **closed `wontfix`** on 2026-08-07 and moved to `issues/.out-of-scope/`.
  - [59 — `link-status.mjs` erases the other stores](issues/59-link-status-overwrite.md)
    — **resolved** 2026-08-07. The script takes no argument. Given one,
    `refusalReason()` gives the reason, and the script prints it and exits 2. The
    sweep of every `writeFile` into `data/` found no third overwrite, so the
    shape is not a pattern.
  - [60 — The report filename is crawl-to-web data outside the contract](issues/60-report-filename-in-the-contract.md)
    — **resolved** 2026-08-07. `compare/contract.mjs` holds `reportFilename()`
    and `storeOfFile()`, one beside the other, and the `__` separator is stated
    once. `30-compare.mjs` writes through the first and `web/src/lib/reports.mjs`
    reads through the second. A move, not a change: the tests moved with the
    functions and no number moved.

  **The review of 36 acted, and one finding became 48.** `CONTEXT.md` gained the
  words the merged view brought — _content view_, _filter_, _noise toggle_ — and it
  names _Diff_, _Content_ and _Outline_ as retired tab names. The class pills and the
  amber strip became one `ClassFilterPills` and one `FilterBanner`, shared by the
  content view and the dashboard, because ticket 36 asks for the same semantics in
  both and two copies of one affordance drift. _Alleen verschillen_ now draws ticked
  and disabled while a class filter is on: a class filter already leaves no matched
  row, so the unticked box was a control that lied. **235 and 288 are the same page** —
  235 rows under the default noise toggle, 288 rows in all — and the ticket now says
  which basis each count is on. 48 is the one finding that turned out to be a want
  rather than a defect, and it is `needs-triage`, not agent-ready.

  33 was **measured** before 34 and 35 — three times, because the split and the two
  new classes move the count in opposite directions. **The baseline for every later
  phase is 10,796 findings / 7,456 shown / median 37 / 179 crawled / 124
  comparable**, not 8,573. Take it with `node compare/measure.mjs nl`. Ticket 34
  held all five numbers exactly, which is what a phase that adds no rule must do.

- **Axis B: coverage, NL against the other five stores.** Ticket 11 resolved every
  rule and nothing was built. `/to-tickets` cut it into seven slices on
  2026-08-06. It **supersedes ticket
  [24](issues/24-axis-b-compare-stage.md)** and **folds ticket
  [23](issues/23-coverage-view-prototype.md)** into 41. Both are resolved on
  those grounds and neither has work left in it.

  ```
  33 ✓ (spec 32) ──> 39 ──> 40 ──> 41
                      └──────────────> 42 ──> 43
       38 ✓ (spec 32) ┘        └──────────────> 44
                               └──> 45 ✗
  ```

  - [39 — The class vocabulary learns about axes](issues/39-class-vocabulary-axes.md)
    — the prefactor. Nothing changes on the screen.
  - [40 — Coverage: missing pages, from the seed file alone](issues/40-coverage-missing-pages.md)
    — the tracer bullet. **Needs no crawl**: the 635 null cells are on disk now.
  - [41 — The coverage matrix, and bulk muting](issues/.out-of-scope/41-coverage-matrix-bulk-mute.md)
    — **parked `wontfix` 2026-08-13**, ADR 0011: its second half was bulk muting and there
    is no mute for a matrix to offer. The matrix itself is not refused; a revival starts
    from 40.
  - [42 — Untranslated text](issues/42-untranslated-text.md) — the highest-value
    check on the axis.
  - [43 — Alt language and meta](issues/43-alt-language-and-meta.md)
  - [44 — Heading outline shape](issues/44-heading-outline-shape.md)
  - [45 — Images across stores](issues/.out-of-scope/45-images-across-stores.md)
    — **parked `wontfix` 2026-08-13**, on value and on the stability of its own key.
    Store-specific images are coming and filenames will be renamed, so the basename key
    moves under the check and its output would be churn. Three findings are kept in the
    file: the set difference makes a false `image-missing-store` on every replacement;
    `image-store-variant` was written for a naming convention this site does not use,
    because the asset path carries the language in a `<locale>` **folder** and the
    basename is identical across the stores; and the defect worth catching is an image
    whose locale segment is neither `global` nor the page's own store, which reads one
    store page, needs no NL page, reaches the unanchored pages too, and is therefore not
    an axis B ticket. That is the re-open trigger, and it wants a measurement first.

  **Two edges cross into spec 32, and both are real.** Ticket 39 adds an `axis`
  to the same class table that ticket 33 rewrote, so 39 is **unblocked**: 33 landed
  and was measured, and it deliberately left `axis` alone so that 39 still has a
  ticket to resolve. There are 21 classes for it to reach, not 18 — **30 once
  ticket 58 lands**, so 39 gets cheaper the earlier it runs. Ticket 44 is now
  the nearest owner for spec 32's user story 24, which 33 could not close — a page
  whose first heading is not an `h1` (11 pages) or that has no `h1` at all (3).
  Ticket 42 needs the five stores crawled, which is
  ticket 38, not a ticket of their own —
  [46](issues/46-crawl-five-stores.md) asked for the same crawl and is closed as
  a duplicate. **38 is resolved, so 42 has its data**: 269 non-NL rows
  are extracted on disk, and Axis B needs the new side only. Ticket 45 wanted the same
  crawl and is parked, so the stream is **four checks and not five**.

- [58 — The head becomes a check](issues/58-axis-a-meta-check.md)
  — builds what ticket 21 decided, `ready-for-agent`, blocked by nothing. Nine
  classes, two newly crawled head fields, and the Meta tab becomes tickable. **It
  must be measured twice**, because the two halves move the counter in opposite
  directions: excluding `no-route` removes about 150 findings over six stores and
  the meta classes add about 130. One number would hide both, as ticket 33 found.
  It re-crawls all six stores, so nothing else should be in flight against
  `data/`.

  **Cut into nine build tickets, and the map had not indexed one of them until
  2026-08-13.** 91 is **resolved** (2026-08-14) and the other eight are
  `ready-for-agent`. Both of 58's "about" figures were its estimates and both are
  now measured: see Decisions so far. Two measurements go first,
  because 58's own instruction is that the two halves must not be counted as one
  number; the re-crawl is the hinge, and nothing else may touch `data/` while it
  runs.

  ```
  91 ──> 93 ─┐
  92 ──> 94 ─┴──> 95 ──┐
                 96 ───┴──> 97 ──> 98
                            └────> 99
  ```

  - [91 — Measure: what the nine meta classes would fire, on today's corpus](issues/91-measure-meta-classes-on-todays-corpus.md)
    — **resolved 2026-08-14.** 197 meta findings, not about 130, and `no-route` is
    85 findings, not about 150. Both tables are pasted into the tickets that
    waited on them.
  - [92 — Measure: does either side send `<meta name="title">` or keywords?](issues/92-measure-meta-title-and-keywords-presence.md)
  - [93 — `no-route` leaves the log, and an aborted run writes its failures](issues/93-no-route-leaves-the-log.md)
    — the prefactor half, the one that **removes** about 150 findings.
  - [94 — The extract carries the head, and a stale one refuses to compare](issues/94-the-extract-carries-the-head.md)
    — `extractVersion`, so a new head field can never fold to `null` on both
    sides and report `same`.
  - [95 — Re-crawl all six stores with the new head](issues/95-recrawl-six-stores-with-the-new-head.md)
    — the run itself. Blocked by 93 and 94, and it blocks the producer.
  - [96 — Nine meta classes enter the vocabulary](issues/96-nine-meta-classes-in-the-vocabulary.md)
    — 22 classes to 30 (the count was 21 when 21 wrote it; ticket 58's own
    arithmetic predates `no-declared-alternate`).
  - [97 — The producer: one finding per head row](issues/97-the-meta-producer-one-finding-per-row.md)
  - [98 — The Meta tab becomes a checklist an editor can tick](issues/98-the-meta-tab-becomes-a-checklist.md)
    — this is what retires spec 32's decision 31, _the meta panel is display
    only_. The panel is display-only **until 98 lands**, and not by principle.
  - ~~[99 — Measure: what the meta check added, beside what the prefactor removed](issues/99-measure-what-the-meta-check-added.md)
    — the second of the two numbers.~~ — **merged into 97 on 2026-08-17** as its
    whole-corpus measurement. It was `Type: measure` with no session, blocked by
    nothing but 97, measuring what 97 produced: 97's gate, not a ticket. Both
    numbers are still measured apart, which is what 99 existed to protect.

  - ~~[100 — The glossary names the display-only rows, and the English labels](issues/100-the-glossary-names-the-display-only-rows.md)
    — `ready-for-agent`, blocked by 98. The tail of the same chain: once a head
    row can be ticked, `CONTEXT.md` has to say which rows stayed display-only and
    why the head labels are English in a Dutch interface.~~ — **merged into 98 on
    2026-08-17** as slice 7. Two prose edits describing the panel 98 builds, and a
    separate ticket only opened a window in which `CONTEXT.md` was wrong. Its
    premise had also gone stale: ADR 0014 made the whole interface English, so the
    labels are no longer *English in a Dutch interface* — they stay untranslated
    because a Magento field name is an identifier and not prose.

- **The search learns the page scope** — ~~seven tickets~~ **three**, none of which
  the map indexed until 2026-08-13.
  [102](issues/102-the-class-pills-survive-a-search.md)
  is **resolved** and is the record above, in Decisions so far: a term composes
  with the class pills instead of replacing them. What is left is the scope — a
  term that names a page rather than a string.

  **Merged 2026-08-17: 105, 106, 107 and 108 are now parts B to E of
  [104](issues/104-a-scoped-search-says-which-kind-of-nothing.md).** Five tickets over
  one search box — one scope value, one load-time page list, one component tree — and
  not one measured number between them, so there was no gate to batch across. 124 set
  the shape: a commit per area, not a ticket per area. **103, 102 and 123 are all
  resolved, so 104 is unblocked and buildable today.**

  ```
  103, 102, 123 (all resolved)
        └──> 104  A the four kinds of nothing
                  B the notes      C the chip
                  D the keys       E the page row
  ```

  - [103 — A leading slash narrows the search to pages](issues/103-a-leading-slash-narrows-the-search-to-pages.md)
    — the root of the chain, **resolved**.
  - [104 — The search takes a page scope](issues/104-a-scoped-search-says-which-kind-of-nothing.md)
    — five parts, five commits. Part A returns the four kinds of nothing as a value;
    B narrows the notes; C makes the scope a chip in the filter strip and amends
    `CONTEXT.md`'s **Filter** entry; D offers the page keys on `/`; E hands a row's key
    to the search. **Read its opening note first:** all five parts were written before
    124 and name Dutch labels that no longer exist.
  - ~~105, 106, 107, 108~~ — merged into 104. The files are kept as the record of
    where each part was written.
  - [123 — An unloaded log is not an empty one](issues/123-an-unloaded-log-is-not-an-empty-one.md)
    — _renumbered from 101 on 2026-08-13._ A search in the first moment after a
    store loads must not answer "none" about a log it has not read.

    **Resolved 2026-08-14.** `searchNotes()` returns `reading`, `failed` with its
    reason, or `answered` with its matches, and `notes` exists on the third alone —
    the state is in the value and not inferred from a length, so a caller that
    forgets it breaks rather than drawing an empty block. The bug was two places one
    layer apart: `useStoreOverrides()` handed out `events ?? []`, breaking its own
    module's first rule on the one field whose reader wants the words; and `Notes`
    then drew `length === 0 → null`. No connection collapses into `failed`, and an
    error over a log that *was* read still answers — both following `LogBanner`, so
    the two cannot tell an editor different stories about one log. Recovery needed
    no mechanism: nothing latches, so the moment `ready` flips the same term is
    answered, with no retry and no second request. Three seams tested; 742 tests
    pass and no count moves. **105 is unblocked**, and its "never says none about an
    unread log" criterion is now a property of the value it narrows.

- ~~**Two tickets are `ready-for-human`, and the map did not say so.** Neither is
  blocked and neither is delegable as written.~~ — **both are built and were resolved
  2026-08-13.** A triage sweep of all 44 open tickets found the code in the tree and the
  status lines never moved. See _Resolved tickets_.

  - [109 — A difference opens the page at the difference](issues/109-a-difference-opens-the-page-at-the-difference.md)
    — carries [ADR 0010](../../docs/adr/0010-the-dashboard-screen-is-the-url.md),
    which is already in Decisions so far. **Resolved 2026-08-13.**
  - [110 — The press covers the pages you ticked](issues/110-the-press-covers-the-pages-you-ticked.md)
    — the bulk press; 31 below is the measurement it argues from. **Resolved 2026-08-13**,
    through review rounds two and three, with its mute half struck by ADR 0011 rather
    than built.

- [101 — The image campaign rule hides editorial images](issues/101-the-image-campaign-rule-hides-editorial-images.md)
  — `ready-for-agent`, unblocked, and **the live collateral ticket 89 measured
  and 90 could not close**. 90 fixed the text side by anchoring on an id; the
  image side is still a pattern.

  **Re-measured 2026-08-14 in triage, and it is worse than 89 reported.** The 530
  findings and the "4.9% collateral" describe the 2026-08-10 corpus, 446 of whose
  extracts were crawled before ticket 64's entry landed and still carried the
  banner. On the corpus on disk — 816 reports, `builtAt 2026-08-13T13:40Z` —
  `image-campaign` is **29 findings and every one is collateral**: 26
  `ontwerp_je_ideale_overkapping.jpg` and 3 `actie-updates_*.jpg`. **No key in the
  corpus contains `korting`** — `#campaign-banner` cuts the artwork at extraction,
  so the rule catches no campaign image at all, and 89's "the image half of the
  banner needs no work" is now "the image half of the banner is not there".
  `ideal-wero.svg`, a payment logo, is matched on both sides and is one edit from
  being hidden as a campaign. **What the rule actually hides, located:** the 26 are
  two different pictures under one basename — 20 the customer-service contact block
  at `/media/wysiwyg/`, 6 a blog photo — plus a reviews-page image and a payment
  logo. None was ever campaign artwork; the filename is a leftover from a blog
  article called `ontwerp-je-ideale-overkapping`.
  **The German store already agrees**: `aktions-update_erhalten.jpg` on the German
  reviews page is the same block as `actie-updates_nl.jpg` and is already
  `image-missing`, because the pattern says `actie` and not `aktion`. The fix makes
  all six stores read the block the same way, in the direction `de` already had.

  Two of the ticket's five acceptance criteria were unsatisfiable and the brief was
  rewritten. **`\b` is the wrong tool**, and wrong towards the campaign side: `_` is
  a word character, so `\bsale\b` drops `summer_sale_2026.svg`. A letter-only
  boundary is the measured fix, the `actie` arm goes with a named cost, and the rule
  is kept rather than deleted. Its one out-of-scope question is **closed**, not
  deferred: 126 answered the vocabulary bullet on 2026-08-14 with "add none".
  **Still `ready-for-agent` on 2026-08-14 — the pattern at `compare/images.mjs:25`
  is unchanged**, so every count 126 records is a pre-101 count.

- [126 — The campaign rule and the other five stores](issues/126-the-campaign-rule-and-the-other-five-stores.md)
  — **resolved 2026-08-14, and the answer is "add none".** The last open bullet 101
  left behind: should `IMAGE_CAMPAIGN` learn `rabatt`, `angebot`, `aktion`,
  `réduction`, `promotion`, `discount` and `offre`? It should not, and **the reason
  is not that the corpus is empty**. The campaign artwork this project recorded was
  named `kortingactie` in **all six stores** — `2026-07-23-kortingactie-{nl,de,fr,en}-16aug.svg`
  in ticket 90's probe, where the suffix is a language tag and the campaign word is
  Dutch every time. `korting` catches 4 of 4; every foreign word catches **0 of 4,
  in its own store**. **A filename is not translated even though the copy is**, so
  ADR 0003's objection to a Dutch anchor holds on the text side and does not carry
  to the image side — the one surface where a Dutch word reaches all six stores.
  That is the finding, and the first measurement could not see it, because it
  scanned the corpus and the artwork is not in the corpus.

  The cost side was confirmed and corrected. Zero true positives and **seven `work`
  findings** hidden — six `icon_offerte.png`, a quote-request icon on the FAQ page
  in all six stores whose `alt` reads `Offerte`/`Devis`/`Angebot`/`Quotation`, and
  the German reviews-page image 101 decided is not a campaign — but **seven is the
  price of an unbounded arm, and it is 1 under 101's own letter boundary**:
  `(?<![a-z])offers?(?![a-z])` does not match `icon_offerte.png`, while `aktion`
  survives no boundary, because `-` is a separator. **The asymmetry is accepted**,
  and it dissolves rather than being fixed: after 101 the `actie` arm is gone, so
  `zomeractie-2027.jpg` and `sonderaktion-2027.jpg` are both `image-missing` in
  every store. **101 had not landed when this was measured**, so every class in it
  is the pre-101 class and the ticket says which conclusions survive if 101 is
  abandoned — "add none" does; the asymmetry verdict does not, and the fix for it
  stays 101's.

  Two things worth keeping. **The corpus holds no campaign artwork in any
  language** — `#campaign-banner` cuts it on 811 of 816 production page-sides — so
  "this word catches nothing" is the expected result for every word **including the
  Dutch ones**, and zero matches is evidence about no word at all; each is judged on
  what it would wrongly take. And a page key with a slash is stored as a
  **subdirectory** under `data/extract/<store>/`, so a scan that reads one level
  finds 444 of 816 files and 6,082 of 11,122 records. The first pass did exactly
  that and lost `be_fr`. A scan of this corpus must recurse.

- [31 — Bulk dismissal across pages](issues/31-bulk-dismissal.md) — the one user
  story in spec 29 that shipped as nothing, found by the code review of the
  spec-29 diff. Ticket 09 already gave the rule (bulk writes N page-scoped
  events, never a third key); what is missing is the grouping key for "the same
  difference on thirty pages", and a measurement that says whether a mute is the
  better answer. Resolve the measurement first — it can shrink the ticket to
  nothing.

- [71 — A saved re-check survives a reload](issues/71-a-saved-recheck-survives-a-reload.md)
  — **resolved**, 2026-08-07. A press of `Hercontroleer` writes the fresh report
  to `data/rechecks/` before it answers, and the page asks for it again on the
  next load. The overlay is written **beside** the crawl report and never over
  it, because `compare/measure.mjs` reads `data/reports/` and the corpus totals
  come from it: a button press must not move a measured baseline (ticket 28). The
  newer of the two wins and the crawl wins a tie, so a crawl that runs after a
  press makes the press stale; the stale file stays on disk as evidence.
  `chooseReport()` in `web/src/lib/recheck-choice.mjs` is the rule, with a test
  for each of the six cases. The page view only — the dashboard and the home page
  keep the built snapshot. No count moves.

- [30 — Wire the Supabase project to the built log](issues/30-wire-the-supabase-project.md)
  — **resolved 2026-08-12.** The schema is applied, the two public values are in
  `web/.env.local`, the built bundle carries the client, and the log is in daily use:
  **511 override rows**, written by more than one editor, the latest on the day it
  resolved. The end-to-end proof is not a pending click; editors have been doing it for
  days. The one thing still unproven is ticket 13's keep-alive — **a scheduled run must
  have written a row**, because a manual `workflow_dispatch` proves the insert and not the
  cron — and that check now sits in [13](issues/13-supabase-pause-risk.md), which owns
  the mitigation. Nothing waits on it.

- **The presentation carve-out** — the stream that came out of
  [127](issues/127-the-log-names-its-browser-floor.md) and was never indexed here.
  Recorded on 2026-08-17, in the shape it has after that day's merges. It moves **no
  count, bar, denominator or roll-up anywhere**, which is why the merges were available:
  the runbook batches freely up to a gate and this stream contains none.

  ```
  127 (resolved) ──> 128 ──> 132 ──> 133  A dashboard  B ledger  C the maps are gone
                              ↑
                       131 (resolved)
  129  A dashboard hints   B every other surface + the guard   (unblocked today)
  ```

  - [128 — The carve-out reaches for CSS and primitives first](issues/128-the-carve-out-reaches-for-css-and-primitives-first.md)
    — `ready-for-agent`, blocked by 127. Records *primitive, CSS, JS last* as the second
    amendment to ADR 0007.
  - [129 — A hint is reachable without a mouse, on every surface](issues/129-a-hint-is-reachable-without-a-mouse.md)
    — `ready-for-agent`, **blocked by nothing and buildable today.** Absorbed **130** on
    2026-08-17: one pattern, one primitive and one guard, and the guard cannot pass until
    every surface has moved, so it had no ticket of its own to belong to — the same ruling
    124 made about its stopword guard. 36 `title` attributes against a `Tooltip` primitive
    with zero importers since 74. Part A is the dashboard and the pattern; part B is the
    other six components and the guard, landed as its own pass.
  - [132 — A tone is a selector](issues/132-a-tone-is-a-selector.md)
    — `ready-for-agent`, blocked by 128 and 131. The **expand** half: `app.css` defines
    the eight tones and the shapes, and the diff surface moves onto them. **Kept separate
    from the merge below** — it is the one part of the palette move that reviews as a
    decision rather than as a transcription.
  - [133 — Every surface wears its tone, and the maps are gone](issues/133-the-dashboard-wears-its-tone.md)
    — `ready-for-agent`, blocked by 132. Absorbed **134 and 135** on 2026-08-17. 133 and
    134 were the same mechanical migration split by surface, and 135 was the **contract**
    phase, which its own last trap admits — *if any surface still reads a map when this
    ticket starts, stop and finish that migration first*. Three commits: A the dashboard,
    B the ledger, C the deletion and the ADR. The per-surface split survives as the commit
    boundary, because it exists so a moved screenshot baseline is reviewed against one
    screen.
  - ~~130, 134, 135~~ — merged. The files are kept as the record of where each part was
    written.

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

- **A decision vocabulary for one-sided pages** — parked `wontfix` 2026-08-11, both
  halves: the question,
  [20 — Pages that exist on only one side](issues/.out-of-scope/20-one-sided-pages-checklist.md),
  and its build,
  [84 — A one-sided page carries a migration decision](issues/.out-of-scope/84-a-one-sided-page-carries-a-migration-decision.md).
  A `/grilling` resolved 20 and `/prototype` built three variants of the surface; the user
  refused both, on the grounds that the store dashboards already show these pages and
  **usually every page needs to be built**, so a verb per page models a decision that is
  already made. The four verbs trace to `content-parity-product-improvements.md` §14 — a
  draft whose own header says "do not build from it" — by way of `PRD.md` stories 40–44,
  and no measurement or person ever asked for them. One-sided pages **stay visible**: the
  `eenzijdig` chip, the store header sentence and the read-only aside are untouched. What
  is given up is recording a decision, and that is 20's re-open trigger. Numbers worth
  keeping are in 20: the strict cross-tab is **50, not 53**, and **41** is the defensible
  new-only count.

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
