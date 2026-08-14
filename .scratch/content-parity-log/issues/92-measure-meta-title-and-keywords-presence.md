# 92 — Measure: does either side send `<meta name="title">` or keywords?

Type: measure
Status: resolved 2026-08-14 — measured. **`metaTitle` is dropped, `keywords` is kept.**
`meta[name="title"]` is byte-identical to that page's own `<title>` on **all 1,539
page-sides that send a value** and differs on **zero**, so it is not a second field, and
it is absent on only 2 of the 1,541 read — it dies of duplication, not absence. Keywords is
the opposite of the guess: it is on 356 of 777 production pages and 291 of 764 new ones,
and on the 722 comparable pairs a row would show **54 lost, 12 changed and 4 added**. See
`## Answer`.
Blocked by: —
Parent: 58-axis-a-meta-check.md

**What to measure:** two fields are about to be added to the contract on a guess.
Nobody knows whether either site sends `<meta name="title">`, and the word
*keywords* appears nowhere in the repository. Ticket
[94](94-the-extract-carries-the-head.md) cannot decide its own field list, so the
data comes first.

**No session.** A probe under `crawl/probes/`. It fetches, so budget a retry:
production has served the maintenance page on 446 of 451 urls for a whole session.

## Deliverable

- [x] Per store and per side, the number of pages that send `meta[name="title"]`,
      and of those, how many send a non-empty value. Present-but-empty is counted
      apart from absent — they lead to different decisions. — `### 2` below.
- [x] The same two counts for `meta[name="keywords"]`. — `### 3` below.
- [x] Where a value exists, whether it differs from `<title>` (for the first) on the
      same page, because a field that always duplicates `<title>` is not a second
      field. — `### 4`. It differs on **zero** of 1,539.
- [x] A verdict sentence for each field: **keep** it in the contract, or **drop** it
      and say the number that killed it. If `metaTitle` is absent everywhere, the
      Meta Title row shows `<title>`, which is honest — Magento's Meta Title field
      is what fills it. If keywords is empty everywhere, the row goes. — `### 6`.
      Neither field is absent; `metaTitle` dies of duplication instead, which the
      ticket did not predict.
- [x] Both verdicts pasted into ticket 94, and the keywords verdict also into
      ticket [98](98-the-meta-tab-becomes-a-checklist.md), which owns the row. —
      **done 2026-08-14**, `94-…md` above its reading list and `98-…md` in place of
      the paragraph that was waiting on this number.

## Reading list

- `crawl/fetch-page.mjs` — how a page is fetched, and how `MaintenanceError` is raised
- `crawl/extract.mjs` — the five things the head is read for today
- `crawl/seed-list.mjs` — the page list to walk
- `crawl/probes/probe-extract-v2.mjs` — a probe that already fetches both sides

Do not write into `data/extract/`. A probe writes its own file.

## Answer

### 0. Which corpus this describes

`crawl/probes/probe-92-meta-title-and-keywords.mjs`, run **2026-08-14** against
`data/10-store-seeds.json` (`generated: 2026-08-13`): all six stores, 819 cells, both
sides, 1,638 fetches. Production served no maintenance page — the run's own guard would
have aborted it with exit 3 rather than record the outage as an absence. Two fetches
failed, both `faq/offerte` on the new site (`nl` and `be`) — the redirect loop ticket
[17](17-faq-offerte-redirect-loop.md) already names and closed as out of scope. Both
verdicts were re-derived on a second full run 25 minutes later and every number in the
tables below reproduced exactly, including the 722-pair movement.

The probe writes `data/probe-92-meta-title-and-keywords.json`, which `.gitignore` keeps
out of git along with everything else under `data/` that is not one of the four
exceptions. So the numbers below are the record, and the run is repeatable from the
committed probe. Nothing under `data/extract/` was read or written.

**The denominator is the status-200 page-sides, and that choice moves a number.** 42
production and 53 new page-sides answer **404**. A Magento 404 sends a head of its own,
and its `keywords` carries the string `Pagina niet gevonden | Tuinmaximaal | Goedkope
overkappingen` — which is why the all-status keywords count is 397 production, and 356 is
the honest one. Counting a 404's head as a page's head would have made keywords look
denser than it is on exactly the pages nobody can fix. That production answers 404 on 41
of 180 `nl` urls its own sitemap declares is not this ticket's finding; it belongs to
tickets [22](22-remeasure-prod-status.md) and [40](40-coverage-missing-pages.md), and it
is named here only because it sets the denominator.

### 1. The reading rule, and why it is not `extract.mjs`'s

`crawl/extract.mjs`'s `meta()` could not have answered this. Its `attribute()` helper is
`value ? tier1(value) : null`, which returns `null` for an absent tag and for an empty
one alike — the exact distinction the ticket asks for. So the probe re-derives the rule
and states its four states: `absent` (no tag), `no-content-attribute` (a tag with no
`content`), `empty` (a `content` that is empty or whitespace), `value`. It reads the head
only, and the name case-insensitively, as a browser does.

The rule is held to 15 fixture documents and the tally to 3 before a single page is
fetched; a failed check throws and nothing is fetched. That self-check is where a test
would be, and it is inside the probe because `crawl/probes/` is evidence that no stage
may import.

### 2. `meta[name="title"]`, per store and per side

Status-200 page-sides. `pres-empty` is present-but-empty.

| store | side | read | present | non-empty | pres-empty | absent |
| --- | --- | --- | --- | --- | --- | --- |
| `nl` | production | 139 | 138 | 138 | 0 | 1 |
| `nl` | new | 165 | 165 | 165 | 0 | 0 |
| `be` | production | 131 | 131 | 131 | 0 | 0 |
| `be` | new | 122 | 122 | 122 | 0 | 0 |
| `be_fr` | production | 122 | 122 | 122 | 0 | 0 |
| `be_fr` | new | 115 | 115 | 115 | 0 | 0 |
| `de` | production | 134 | 134 | 134 | 0 | 0 |
| `de` | new | 123 | 123 | 123 | 0 | 0 |
| `fr` | production | 123 | 123 | 123 | 0 | 0 |
| `fr` | new | 117 | 117 | 117 | 0 | 0 |
| `uk` | production | 128 | 128 | 128 | 0 | 0 |
| `uk` | new | 122 | 121 | 121 | 0 | 1 |
| **ALL** | production | 777 | 776 | 776 | 0 | 1 |
| **ALL** | new | 764 | 763 | 763 | 0 | 1 |

**Present-but-empty never happens, and absent happens twice.** Both sides send the tag on
every page but one. The two exceptions are named, because two is a number a reader can
check: `nl/nieuwsbrief` on production sends no `meta[name="title"]` **and no `<title>`
either**, and `(uk)measuring-tool` on the new site sends `<title>Tuinmaximaal Measuring
Tool</title>` and no meta tag. Neither is a store-wide pattern.

### 3. `meta[name="keywords"]`, per store and per side

| store | side | read | present | non-empty | pres-empty | absent | distinct values |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `nl` | production | 139 | 69 | 69 | 0 | 70 | 65 |
| `nl` | new | 165 | 57 | 57 | 0 | 108 | 54 |
| `be` | production | 131 | 65 | 65 | 0 | 66 | 64 |
| `be` | new | 122 | 54 | 54 | 0 | 68 | 51 |
| `be_fr` | production | 122 | 63 | 62 | 1 | 59 | 62 |
| `be_fr` | new | 115 | 52 | 51 | 1 | 63 | 51 |
| `de` | production | 134 | 68 | 67 | 1 | 66 | 64 |
| `de` | new | 123 | 56 | 55 | 1 | 67 | 54 |
| `fr` | production | 123 | 62 | 61 | 1 | 61 | 60 |
| `fr` | new | 117 | 52 | 51 | 1 | 65 | 50 |
| `uk` | production | 128 | 29 | 28 | 1 | 99 | 27 |
| `uk` | new | 122 | 20 | 19 | 1 | 102 | 18 |
| **ALL** | production | 777 | 356 | 352 | 4 | 421 | 224 |
| **ALL** | new | 764 | 291 | 287 | 4 | 473 | 176 |

Here the distinction the ticket asked for earns itself, and it is small and exact:
**present-but-empty is 4 page-sides on each side, and it is the same page four times.**
`install a veranda` ships `<meta name="keywords" content="">` in `be_fr`, `de`, `fr` and
`uk`, on both sides, and nowhere else. One editor left one field blank in four stores.
Absent is 421 and 473 — three orders of magnitude away, and a different fact.

The `distinct values` column is not in the deliverable and is what refutes the other way
this could have died: 224 distinct strings across 352 valued production page-sides is a
per-page field, not one string pasted site-wide. `uk` is the thin store on both sides — 29
of 128 against `nl`'s 69 of 139.

### 4. Does the meta title differ from `<title>`?

**No. Not once.** Over every page-side that sends a value:

| side | values | identical | invisible-only | differs | no `<title>` |
| --- | --- | --- | --- | --- | --- |
| production | 776 | 776 | 0 | 0 | 0 |
| new | 763 | 763 | 0 | 0 | 0 |

`identical` is byte-equality after whitespace collapse. `invisible-only` would be a pair
that differs before tier-1 folding and not after — a curly quote, an `&nbsp;`, an en dash.
It fires **zero** times, so the answer does not rest on the folding: the two strings are
the same bytes, 1,539 times out of 1,539. On the 722 comparable pairs it holds on both
sides at once, all 722.

### 5. What a keywords row would actually show

The 722 pairs where both sides answered 200 — the pages the compare stage can compare:

| store | pairs | same | changed | lost | added | neither side |
| --- | --- | --- | --- | --- | --- | --- |
| `nl` | 124 | 52 | 3 | 9 | 1 | 59 |
| `be` | 122 | 48 | 5 | 8 | 1 | 60 |
| `be_fr` | 115 | 50 | 1 | 9 | 0 | 55 |
| `de` | 123 | 53 | 2 | 8 | 0 | 60 |
| `fr` | 117 | 50 | 1 | 9 | 0 | 57 |
| `uk` | 121 | 17 | 0 | 11 | 2 | 91 |
| **ALL** | 722 | 270 | 12 | 54 | 4 | 382 |

**70 pairs of 722 (9.7%) have something to show, and 54 of those are a loss.** The loss is
spread evenly across all six stores — 8 to 11 each — which makes it a migration behaviour
and not one store's editor. `uk` is where the row would be quietest and the loss loudest:
17 pairs agree, 11 lost the field.

### 6. The verdicts

**`metaTitle`: DROP.** It is not absent — it is on 1,539 of the 1,541 status-200
page-sides, which is the opposite of what this ticket expected to find. It dies of
duplication instead: it is byte-identical to that page's own `<title>` on **1,539 of
1,539** page-sides that carry a value, and **differs on 0**, including 0 that differ only
invisibly. A field that never disagrees with a field the contract already has is not a
second field, and adding it would give the head panel two rows that cannot ever say
different things. The Meta Title row shows `<title>`, which the ticket already called
honest, and it is more honest than the ticket knew: on this corpus `<title>` **is**
Magento's Meta Title field, byte for byte.

**`keywords`: KEEP.** The guess that killed it does not hold. It is on 356 of 777
production page-sides (45.8%) and 291 of 764 new ones (38.1%), carrying 224 and 176
distinct strings. Empty-everywhere would have been the reason to drop the row; empty is 4
page-sides, and it is one page in four stores. And the field moves in the migration: on
the 722 comparable pairs, 54 pages lose it, 12 change it, 4 gain it. A row that would be
blank on both sides is worth nothing, and this one would not be.

### Acceptance criteria — what this answer does and does not close

- Done: both fields counted per store and per side, present apart from non-empty, and
  present-but-empty apart from absent (`### 2`, `### 3`).
- Done: the relation to `<title>` (`### 4`), and the verdict sentences (`### 6`).
- Done: pasted into 94 and into 98.
- **Does not fire:** no class is named here and no field is added. Ticket 94 owns
  `PageMeta` and ticket 97 owns the classes. `### 5`'s 54/12/4 is what the row would
  *show*; whether any of it becomes a *finding* is not this ticket's to decide, and
  ticket 98's design has the Meta Keywords row carrying no override control, so on that
  design it shows and does not count.
- **Not verified, and stated as such:** whether the 404s of `### 0` hide a different
  keywords population. 42 production and 53 new page-sides were excluded from every
  denominator above, and what their real pages would have sent cannot be read from a 404.
  If tickets 22 and 40 recover those pages, the keywords counts move and the `metaTitle`
  verdict does not — a recovered page sends one head, and this measurement says that head
  copies its own `<title>`.
