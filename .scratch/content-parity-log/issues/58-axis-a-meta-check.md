# 58 — The head becomes a check: Meta Title, Keywords, Description, Robots

Type: task
Status: ready-for-agent
Blocked by: —
Parent: ../map.md

**What to build:** the `<head>` stops being a display-only panel and becomes the
fourth check. An editor opens the Meta tab, sees five named rows, and can tick off
a changed Meta Title, a changed Meta Description or a lost Robots directive the
same way as body copy. The dashboard's Meta column stops printing `—`. Meta
Keywords and Canonical stay on the panel, below a rule, as display only.

Every rule is settled in [ticket 21](21-axis-a-meta-check.md). **Read it first.**
This ticket builds what 21 decided and adds no decisions of its own.

## Why it is one ticket

The nine classes, the two new crawled fields and the panel are one vertical slice:
the classes are unverifiable without the crawl, and the crawl shows nothing
without the panel.

**But two changes here move the counter in opposite directions.** Excluding
`no-route` removes about 150 findings over six stores. The meta classes add about
130. One number would hide both, exactly as ticket 33 found. So the work is
measured **twice**, and both numbers go in the answer.

## What it delivers

- Five rows on the Meta tab: **Meta Title, Meta Keywords, Meta Description,
  Robots**, then a rule, then **Canonical**. English labels, because they name the
  Magento admin field the editor goes to fix.
- The first, third and fourth rows carry override controls, inline after the
  label. No class pill: on a five-row table the cells already say what changed.
- Nine new finding classes on `check: 'meta'`. The vocabulary goes 21 → 30.
- Keywords and the raw robots string are crawled for the first time.
- A stale extract can no longer read as clean.
- `no-route` leaves the log. It is production's 404 page against the new site's
  404 page, and it emits 25 findings in every store.

## Acceptance criteria

### Step 1 — the prefactor, measured on its own

- [ ] `no-route` is in the committed exclusion list with its reason, and appears in
      the **Niet gecontroleerd** list on every store dashboard.
- [ ] The failure log is written even when a run aborts on `MaintenanceError`.
      Today the write sits after the early return, so an aborted run leaves the
      previous run's failures on disk.
- [ ] The comparison is re-run and the new per-store baseline is recorded in the
      answer, beside the old one. Expect about 150 findings fewer over six stores
      and **no other movement**.

### Step 2 — the check

- [ ] `PageMeta` carries `keywords`, `metaTitle` and the raw `robots` string. The
      derived `noindex` boolean stays.
- [ ] `PageExtract` carries `extractVersion`, and the compare stage refuses an
      extract below the current version with a named error. Without this a new
      field reads as `undefined`, which folds to `null` on both sides and reports
      as `same` — a silently green head panel.
- [ ] All six stores are re-crawled with `--force` and every extract holds the new
      fields. nl first; check a sample before the other five.
- [ ] Nine classes exist, with these shown defaults, and no class carries `axis` —
      that field is [ticket 39](39-class-vocabulary-axes.md)'s question and this
      ticket must not answer it.

      | class | shown | direction |
      |---|---|---|
      | `meta-title-changed` | yes | — |
      | `meta-title-lost` | yes | lost |
      | `meta-title-added` | no | added |
      | `meta-description-changed` | yes | — |
      | `meta-description-lost` | yes | lost |
      | `meta-description-added` | no | added |
      | `meta-casing` | yes | — |
      | `robots-index-lost` | yes | — |
      | `robots-noindex-lost` | yes | — |

- [ ] The producer emits at most **one** finding per row. The three title classes
      are mutually exclusive and so are the two robots classes.
- [ ] Every meta finding carries `score: null` and `anchorHeading: null`.
- [ ] `h1` is not read. The content view owns it, and it differs on 93 of 179 nl
      pages, so reading it here would report the same words twice.
- [ ] Canonical keeps its host fold and keeps suppressing the `added` state, and
      makes no finding.
- [ ] Tier 2 is not folded in the head. A dropped trailing full stop is
      `meta-casing`, not silence.
- [ ] **No brand-suffix rule and no `Tuinmaximaal` string anywhere in the code.**
      Only 3 of 45 title differences collapse when the suffix is stripped, and the
      suffix sits on about 45% of titles on *both* sides, so it is editor text and
      not a template.

### The panel

- [ ] The Meta tab keeps its five-row shape and does not become a finding table.
- [ ] Override controls are inline after the field label. No row is added for them.
- [ ] The rule and the note above Canonical survive, and the note no longer
      mentions ticket 21. An absent control is not a statement, so the two
      display-only rows still need to be framed as uncounted.
- [ ] The Meta tab carries a count badge.
- [ ] ~~A meta finding rendered in **Taken** says **in de `<head>`** where a text
      finding says *onder «heading»*.~~ **Ticket 81 removed the Taken tab.** The want
      survives and it moves: a meta finding reached through the dashboard's
      *Verschillen* list says **in de `<head>`** where a text finding says
      *onder «heading»*. A silent blank would spend what ticket 34 bought.
- [ ] Meta findings do **not** appear in the content view.
- [ ] The field labels live in the shared label module, and that module's comment
      stops claiming it holds only Dutch labels.

### Measurement and tests

- [ ] The second measurement is recorded per store beside step 1's. Expect about
      **130** findings added over 373 comparable pages, roughly 0.54% of shown.
- [ ] The four `lost`/`added` classes fire **zero** times on the current corpus.
      Both sides always send a title and a description. They ship anyway, because
      the two-direction pair is mandatory for a one-sided check.
- [ ] `robots-index-lost` fires **once**, on `be`. It is the severe direction: the
      page leaves Google.
- [ ] Text, link and image finding counts are **unmoved** by step 2. This ticket
      adds a check; it must not disturb the other three.
- [ ] Meta has its own test file, with the existing `metaRows` tests moved into it
      unchanged.
- [ ] The two contract pins are updated: the literal class count, and the sorted
      list of classes carrying `direction`.

### Glossary

- [ ] The `Display-only difference` entry no longer says the `<head>` panel is made
      of these. It names Meta Keywords and Canonical.
- [ ] A new entry records why the head labels are English while the rest of the
      interface is Dutch.

## Traps

- **The producer cannot import the collector.** `compare/meta.mjs` is imported by
  a React island, and the collector reaches `node:crypto` through the contract, so
  the Vite island build fails. Take the collector as a parameter and type it with
  a JSDoc import, as the images producer already does.
- **`<meta name="title">` is a measurement, not a feature.** Nobody knows whether
  either site sends it. Capture it in the same crawl. If it is absent everywhere,
  delete the field and say so in the answer; the Meta Title row then shows
  `<title>`, which is honest, because Magento's Meta Title field is what fills it.
- **Keywords may be empty everywhere.** It has never been crawled and the word
  appears nowhere in the repo. If neither side sends it, drop the row and record
  the number.
- **`link-status.mjs` takes no store argument.** It overwrites one global file.
- **A re-crawl can abort.** Production has served the maintenance page on 446 of
  451 urls for a whole session. Budget for a retry.
