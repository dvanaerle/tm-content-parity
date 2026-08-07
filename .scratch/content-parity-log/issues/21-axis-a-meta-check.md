# 21 — The Axis A meta check: what is a parity defect in the head?

Type: grilling
Status: resolved
Blocked by: —
Parent: ../map.md

## Question

What does the meta check compare on the **parity** axis, prod against new, within
one store, and which differences are defects?

`CHECKS` in `compare/contract.mjs` declares a `meta` check, but no class carries
`check: 'meta'`. Ticket 11 added two meta classes for the **coverage** axis
(`meta-presence`, `meta-untranslated`) and deliberately left the parity axis
alone, because a changed `<title>` or a lost canonical is a question with SEO
weight and ticket 11's session gathered no evidence for it.

## What to settle

- **Which fields.** `PageMeta` is `{ title, description, canonical, noindex, h1 }`.
  There is no hreflang, no og and no twitter field. Does the check need them, and
  therefore an extractor change?
- **`<title>`.** A title that differs is almost certainly intentional on a
  relaunch. Is it a finding, and shown or hidden?
- **`canonical`.** The value is the raw href, not tier1-normalised, unlike title,
  description and h1. A host swap therefore makes every canonical differ. What is
  the identity rule — the same `self` folding that `linkKey()` uses?
- **`noindex`.** A page that is indexable on production and `noindex` on the new
  site is a severe and silent defect. Is this the highest-value check here?
- **`h1`.** `h1` is in `PageMeta` and also in `elements` as a heading. Does the
  meta check read it, or does that duplicate a `copy` finding on the same text?
- **An absent field.** Production's `nieuwsbrief` page has no `<title>` at all —
  the only such page on either side. Is absent-on-both a finding?

## Notes

Resolve with `/grilling` and `/domain-modeling`.

Ticket 11 owns the coverage-axis meta classes. Do not re-open them here; this
ticket adds the parity-axis vocabulary beside them.

## Answer

**The head is not one thing. Each row is decided on its own, and the test is
whether an editor can change it.** `CONTEXT.md` already gives that rule: a
difference the content team has no power to change is not a finding. Three of the
five rows fail that test in the editor's favour, so they make findings. Two do
not, and they stay display-only.

The panel keeps five rows, in this order:

| row | source | makes findings |
|---|---|---|
| Meta Title | `<title>` | yes |
| Meta Keywords | `meta[name="keywords"]` | no |
| Meta Description | `meta[name="description"]` | yes |
| Robots | `meta[name="robots"]` | yes |
| Canonical | `link[rel="canonical"]` | no |

`h1` stays out. It is a heading in `elements`, so the content view owns it, and
reading it here would report the same words twice. It differs on 93 of 179 nl
pages, so the duplication would be large.

### Nine new classes

All carry `check: 'meta'`. The vocabulary goes from 21 classes to **30**, shown
from 13 to 20, hidden from 8 to 10.

| class | shown | direction | fires today |
|---|---|---|---|
| `meta-title-changed` | yes | — | 45 |
| `meta-title-lost` | yes | lost | 0 |
| `meta-title-added` | no | added | 0 |
| `meta-description-changed` | yes | — | 78 |
| `meta-description-lost` | yes | lost | 0 |
| `meta-description-added` | no | added | 0 |
| `meta-casing` | yes | — | 4 |
| `robots-index-lost` | yes | — | 1 |
| `robots-noindex-lost` | yes | — | 2 |

130 findings over 373 comparable pages. Against 23,961 shown today that is
**0.54%**. 68% of comparable pages get none.

**The four `lost` and `added` classes fire zero times.** Both sides always send a
title and a description. They ship anyway, because `CONTEXT.md` makes the two
directions mandatory for a one-sided check, and a title that disappears after a
later content edit is the exact defect this log exists to catch.

**`meta-casing` is a new class and not the existing `casing`.** `casing` carries
`check: 'text'`, so re-using it would file a head defect under the Inhoud tab.
All 4 cases are a dropped trailing full stop on a description.

**Robots is measured in both directions.** `robots-index-lost` is production
indexable against the new site `noindex`. It is the worse of the two: the page
leaves Google. It fires **once**, on `be`. `robots-noindex-lost` is the reverse,
and fires twice. Rarity is the argument for the class. Nobody finds these by eye.

The tab shows no dashboard alert for them. Three pages do not justify a mechanism
the glossary has no word for.

### Two fields the crawler does not read yet

`crawl/extract.mjs` reads five things and destroys one of them. `noindex` is
`/noindex/i.test(...)`, so the robots string is gone. Keywords is not read at all,
and the word does not appear anywhere in the repo.

- **Keywords.** Google has ignored it since 2009. It is still a Magento CMS field
  an editor fills, so it is a real content loss if the relaunch dropped it. It is
  captured and displayed, and it makes no finding until there is evidence that a
  value exists.
- **Robots.** Store the raw `content` string beside the derived boolean. The panel
  shows the string; the rule reads the boolean.
- **`<meta name="title">`.** Nobody knows whether either site sends it. The dead
  `crawl/lib-extract.mjs:227` read it as `meta_title`, so somebody once thought it
  worth reading. Capture it in the same crawl and decide from the data. If it is
  absent everywhere, delete it; the Meta Title row then shows `<title>`, which is
  honest, because Magento's Meta Title field is what fills `<title>`.

### No brand-suffix rule

The first draft of this answer added a tenth class, `meta-brand-suffix`, hidden,
for titles that agree once a trailing ` | Tuinmaximaal` is removed. **It was
removed, and the measurement is why.** Only **3** of the 45 title differences
collapse when the suffix is stripped. The other 42 are real rewrites: a USP swap
(`10 jaar garantie` → `gratis levering`, 8 pages), a price change on
`glazen-schuifwand` (€70 → €119), and outright retitles.

The suffix is also not a template. If a Magento Title Suffix setting sent it,
every title would carry it. 116 of 258 production titles have it and 121 of 258
on the new site — about 45% on each side. A template change would read as 0%
against 100%. So the suffix is typed into the per-page Meta Title field, which
makes it editor text like any other.

The 3 pages are ordinary `meta-title-changed` findings. No rule is written, and no
brand string enters the code.

### Identity and normalisation

- Title and description are already tier-1 normalised by the extractor.
- Tier 2 is **not** folded. A case or trailing-punctuation difference is
  `meta-casing`, as `CONTEXT.md` requires. Folding it would make the head the one
  place in the log where a dropped full stop is invisible.
- Canonical keeps the host fold that `metaRows()` does today through `linkKey()`,
  and keeps the suppression of the `added` state. Production has no canonical on
  147 of 179 nl pages. Two pages lost one, and those two rows stay.
- Robots compares the derived boolean. The raw string is display only.
- A meta finding carries `score: null`. The contract says `score` is on `copy`
  findings only, and a head field has no similarity pairing.
- A meta finding carries `anchorHeading: null`. There is no legal alternative: the
  field is defined by document order inside the content boundary, and the head is
  outside it.

**Each of the four rows holds at most one finding.** The three title classes are
mutually exclusive, and so are the two robots classes. The field row *is* the
finding row, which is what lets the panel stay a five-row table.

### What the reader sees

**On the dashboard, no new column.** A **Meta** column is already on screen,
driven by `CHECKS`. It prints `—` on every row today and will print a count on
about 110 of 373 pages. The filter pills go from 21 to 30. The chips move:
`verschillen open` rises by about 127, `verborgen (ruis)` by the rest, and
`pagina's gelijk` falls.

One distortion is accepted and recorded. The page bar is
`shown / production.elements`, and a head finding is not a body element. A short
page with two meta findings reads worse than the arithmetic deserves. It is small.
It is the price of one counter.

**On the page, the Meta tab keeps its five-row shape.** It does not become a
`FindingTable`. The head has five known slots, and an editor reads it as a
checklist of slots, not as a list of defects, so the field is the useful first
column and the class is not.

The class pill is **not** on the row. On a five-row table the field is fixed and
both values sit side by side, so a `META-CASING` pill next to `…beschutting.`
against `…beschutting` says nothing the cells do not. The class still drives the
dashboard filter, the mute key and the Taken tab, which keeps its pills.

The override controls sit inline, after the field label. No row is added for them.

```
                              Productie              Nieuwe site
Meta Title  [tick][menu]      Bedrijfsinformatie     Bedrijfsinformatie | Tuinmaximaal
Meta Keywords                 terrasoverkapping…     terrasoverkapping…
Meta Description [tick][menu] …beschutting.          …beschutting
Robots  [tick][menu]          index                  noindex
─────────────────────────────────────────────────────────────────
Alleen weergave, niet in de teller.
Canonical                     —                      https://…/bedrijfsinformatie
```

The rule and the note above Canonical stay. Without them the two display-only rows
differ from a `same` finding row only by an absent control, and an absent control
reads as "nothing to do here", not as "this is not counted".

Meta findings appear in **Taken** as well, which needs no work: `Tasks` receives
every finding. They do **not** appear in the content view. The content view is the
body in document order, and the head is not in it. The Meta tab carries a count
badge for that reason.

Where a meta finding does render through `FindingTable`, `Section` says
**in de `<head>`** instead of nothing. Ticket 34 bought "every finding says where
it is", and a silent blank would spend it.

### The labels are English

**Meta Title, Meta Keywords, Meta Description, Robots, Canonical.** They are the
only English labels in a Dutch interface, and that is deliberate: they name the
Magento admin field, which is the screen the editor goes to. Written into
`CONTEXT.md`, because without it the next reader translates them to Dutch to match
the tabs and is not wrong to try.

`web/src/lib/classes.mjs` says it holds "the Dutch label an editor reads". That is
not true of the file today — it holds `TONE` and `CHECK_LABEL` and nothing else.
The field labels go there, and the comment is corrected.

### `axis` belongs to ticket 39, not here

Ticket 11 decided the class records must gain an `axis` field, and the map gives
that work to **ticket 39**, the prefactor. Ticket 33 dropped `axis` on purpose so
39 would still have a question. This ticket does not take it either. It hands 39 a
table of **30** classes to reach instead of 21.

### Two defects found while resolving

- **A stale extract reads as clean.** The extract has no version marker. Add a
  field to `PageMeta` and an old file yields `undefined`, which `display()` turns
  into `null` and `stateOf()` then calls `same`. Both sides stale is a silently
  green head panel, and all 448 extracts on disk go stale the moment the extractor
  changes. `PageExtract` gains `extractVersion`, and `30-compare.mjs` refuses an
  extract below the current one.
- **`no-route` compares a 404 page against a 404 page.** Both sides answer 200, so
  the status gate misses it, and it emits **25 findings, 15 shown, in every one of
  the six stores**. No ticket mentions it. It goes into
  `crawl/excluded-pages.mjs`, which holds one entry today. Ticket 20 owns the 404
  cell and is cross-referenced.

A third, smaller one: `21-crawl-store.mjs` writes the failure log *after* the early
return on `MaintenanceError`, so an aborted run leaves the previous run's failures
on disk. The write moves above the return.

### Order of work

`compare/contract.mjs` is the contract, so it changes first.

1. `compare/contract.mjs` — `PageMeta` gains `keywords`, `metaTitle` and the raw
   `robots` string. `PageExtract` gains `extractVersion`.
2. `compare/vocabulary.mjs` — the nine classes. No `axis`.
3. `compare/30-compare.mjs` — refuse an extract below `extractVersion`.
4. `crawl/extract.mjs` — capture the new tags. Keep the derived boolean.
5. `crawl/21-crawl-store.mjs` — move the failure-log write above the early return.
6. `crawl/excluded-pages.mjs` — add `no-route`.
7. Re-crawl `nl --force`, check the new fields hold a value, then the other five.
   About 5 minutes for 896 requests. `MaintenanceError` is the one thing that
   aborts a store.
8. `compare/meta.mjs` — the producer. **It may not import `findings.mjs`**: the
   file is imported by a React island, and `findings.mjs` reaches `node:crypto`
   through `contract.mjs`. Take the collector as a parameter and type it with a
   JSDoc import, as `compare/images.mjs:41` already does.
9. `web/` — the labels, the inline controls, the head anchor, the tab badge, and
   the rewritten note.
10. `compare/meta.test.mjs` — a new file. Move the 9 existing `metaRows` tests out
    of `compare/compare.test.mjs` unchanged and add the class coverage.
11. `CONTEXT.md` — the two edits below.

Two pins in `compare/contract.test.mjs` must move: the literal `21 classes`, and
the sorted list of classes carrying `direction`, which gains four.

### `CONTEXT.md` changes

- The `Display-only difference` entry ends *"The `<head>` panel is made of
  these"*. That becomes false. It names Meta Keywords and Canonical instead.
- A new entry records the English-label rule.

## Comments

The measurements in this answer were taken on 2026-08-07 against
`data/extract/`, 448 files, 373 comparable. Two sub-agent measurements
disagreed and the lower one was wrong: it globbed `<store>/*.json` and missed
every nested page key. The figures here were verified directly, and 373 matches
`data/snapshot.json`.
