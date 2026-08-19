# Cross-store reuse — finding churn, measured

Type: research (throwaway probe)
Status: ready-for-human
Parent: ./PRD.md
Ticket: ./issues/01-measure-finding-churn.md

**Measured 2026-08-19** over the data on disk at commit `866a9c0` plus the uncommitted
working-tree change to `history/run-log.jsonl`. Spelled UK English, worded from
`CONTEXT.md`. Every number below names the file it came from and the code path that owns
that file's shape.

---

## 0. Read this first: the corpus is 21 minutes long

The ticket assumes the run log holds a history a lifespan can be measured over. **It does
not yet.** `history/run-log.jsonl` holds exactly **two** observation ids:

| # | observation id | calendar moment |
|---|----------------|-----------------|
| 1 | `2026-08-18T11:55:50.629Z-2fd9b259` | 2026-08-18 11:55 UTC |
| 2 | `2026-08-18T12:17:11.051Z-62ec9d28` | 2026-08-18 12:17 UTC |

Source: every `first`, `last` and `gone` value in `history/run-log.jsonl`, plus the header's
`stores` map, decoded by `decodeRunLog()` in `compare/run-log.mjs`. Script:
`.scratch/cross-store-reuse/churn-probe.mjs`.

The two runs are **21 minutes apart on the same day**. `git log --follow -- history/run-log.jsonl`
returns **one** commit, `da69c7b` "A finding says when it was first seen, and the index never
re-attaches", dated 2026-08-18 14:26 +02:00. The index was created that day; the runs before
it left no survival record. So the corpus cannot say how many findings "live only a day or
two" — nothing in it has had the chance to live a day.

That the earlier runs happened is itself on disk: the override backup
`data/overrides-backup-2026-08-18T09-46-51-393Z.json` references **15 distinct
`observation_id` values** between 2026-08-06 09:55 UTC and 2026-08-17 10:00 UTC. Those 15
runs are named in the override log and are absent from the run log, because the run log did
not exist for any of them.

### What each field means, from the code and not from the ticket

Read from `compare/run-log.mjs` and `compare/contract.mjs`:

- The file's **encoded** shape is `{id, store, page, class, first}`, plus `last` and `gone`
  on a row that is no longer seen. The ticket's `firstSeen` / `lastSeen` / `seen` /
  `retiredAt` are the **decoded** field names in `RunLogRow`; three of the four are derived,
  not stored. `encodeRunLog()` and `decodeRunLog()` own both shapes.
- `seen` is derived as `row.last === undefined`. It is not a stored flag.
- `lastSeen` on a still-seen row is derived as `header.stores[row.store]` — the observation
  that last covered that row's store. A still-seen row therefore carries no per-row last
  stamp at all; omitting it is deliberate, so that a run over an unchanged corpus rewrites
  no line and `git log` on the file stays readable.
- `retiredAt` (`gone` on disk) is stamped **once**, by the run that stopped seeing the id,
  and never restamped. `nextRunLog()` says why: a later run that also does not see the id
  "has stopped seeing nothing".
- A **run** is an *observation*, not an execution. `observationForRun()` in
  `compare/contract.mjs` mints a new observation id only when `crawledAt` is later than the
  previous observation; a rebuild over extracts nobody re-fetched keeps the previous id. So a
  run in the run log is *a fresh look at the two sites*, and re-running the comparison after
  a rule change does **not** add a run.
- The **id** is `findingId()` in `compare/contract.mjs`:
  `sha256(store|page|check|rule|prodNorm|newNorm[|detail])`, base64url, first 16 characters.
  Store, page, class and both normalised texts are all terms. Nothing else. There is no
  relation between two ids anywhere in the file, and `nextRunLog()` is not given a finding's
  text, so none can be added without changing the signature.

**A consequence for this probe.** Because a rule change alters `prodNorm` or `newNorm`
without a new crawl, an id can expire *without any run boundary being crossed*. The run log
cannot see that at all: the new id simply appears with `first` set to whatever observation is
current. This is the main reason the run log understates expiry, and it turns out to be the
whole story below.

## 1. Lifespan distribution

Lifespan = `rank(lastSeen) − rank(firstSeen) + 1` over the two ordered observation ids.
Source: `history/run-log.jsonl`, decoded by `compare/run-log.mjs`. Corpus: **40,829 rows**.

| lifespan | ids | share |
|---|---|---|
| 1 run | 4 | 0.010% |
| 2 runs | 40,825 | 99.990% |

Of the 40,829 rows, **40,824 are still seen** and **5 are not seen any more**. The 4 ids with
a one-run lifespan are the ids that arrived *in* run 2 and are still seen; they are new, not
short-lived. The 5 no-longer-seen ids all have a two-run lifespan: seen in run 1, not seen in
run 2.

Per store — rows / still seen / no longer seen:

| store | rows | still seen | no longer seen | pages compared |
|---|---|---|---|---|
| `nl` | 7,348 | 7,348 | 0 | 179 |
| `uk` | 7,086 | 7,086 | 0 | 128 |
| `de` | 6,757 | 6,757 | 0 | 134 |
| `be` | 6,577 | 6,573 | 4 | 130 |
| `be_fr` | 6,573 | 6,572 | 1 | 122 |
| `fr` | 6,488 | 6,488 | 0 | 123 |

Page counts from the 816 files in `data/reports`, whose name shape is owned by
`reportFileName()` in `compare/contract.mjs`.

**Cross-check.** The 40,824 still-seen ids in the run log and the 40,824 finding ids across
the 816 files in `data/reports` are the same set: 0 in one and not the other. Every report
carries `observationId` `2026-08-18T12:17:11.051Z-62ec9d28`, i.e. run 2. So `data/reports` is
an independent witness of "what exists now", and the two agree exactly.

## 2. The pages that produce short-lived findings

There are five ids in the whole corpus that a run stopped seeing, on five pages, one each:

| ids | store | page | class | first seen | stopped being seen |
|---|---|---|---|---|---|
| 1 | `be` | `zonwering/prijzen` | `broken-link` | run 1 | run 2 |
| 1 | `be` | `tuinhuis-met-overkapping` | `broken-link` | run 1 | run 2 |
| 1 | `be` | `zonwering/buiten` | `broken-link` | run 1 | run 2 |
| 1 | `be` | `glazen-schuifdeur` | `broken-link` | run 1 | run 2 |
| 1 | `be_fr` | `(be_fr)fr/retractation/recu/retourner` | `broken-link` | run 1 | run 2 |

No page produces more than one. A ranking of pages is therefore not a ranking: it is a list
of five, all tied.

The four ids **new** in run 2 are the mirror image, and they are all `missing-link`:
`be terrasoverkapping/productinformatie`, `uk reviews`,
`nl glazen-schuifwand/productinformatie`, `be glazen-schuifwand/productinformatie`.

## 3. The classes those findings carry

All **5** no-longer-seen ids carry `broken-link`. All **4** arriving ids carry `missing-link`.

`broken-link` and `missing-link` are the two link classes whose input is a **live HTTP
status**, not page text (`compare/link-status.mjs`, `data/link-status.json`). A link that
answers 200 on one look and 503 on the next changes the finding without an editor touching
anything. That reads as a probe flake or a transient server answer, not as a moving page and
not as a rule misfire — 22 classes exist in the corpus and only these two moved in 21 minutes.

For scale, the class census over the 40,824 still-seen ids:

`text-missing` 9,646 · `text-added` 6,961 · `missing-link` 4,750 · `image-missing` 4,393 ·
`extra-link` 2,897 · `heading-level` 2,846 · `image-added` 2,742 · `tag-changed` 2,216 ·
`copy` 1,162 · `restructured` 651 · `alt-changed` 637 · `alt-lost` 414 ·
`no-declared-alternate` 368 · `link-target` 276 · `broken-link` 274 · `casing` 269 ·
`regrouped` 189 · `price` 46 · `campaign` 40 · `redirect` 35 · `cross-store-link` 13 ·
`leakage` 4.

By `visibilityOf()` in `compare/vocabulary.mjs`: **21,833 work**, 16,332 information,
2,659 diagnostic.

## 4. Dismissal orphans

Source: `data/overrides-backup-2026-08-18T09-46-51-393Z.json`, the on-disk copy written by
`overrides/dump.mjs`. 1,618 events, `created_at` from 2026-08-06 10:16 UTC to 2026-08-18
09:22 UTC. Actions: 898 `dismissed`, 315 `fixed`, 191 `reviewed`, 161 `cleared`, 39
`prioritised`, 11 `muted` (the withdrawn action of ADR 0011), 3 `noted`.

Collapsed latest-per-key using `eventKey()` from `overrides/state.mjs`
(`scope|store|page|findingId`), which is the rule the app itself derives state with:
**829 standing dismissals** on finding scope.

| | count | share |
|---|---|---|
| standing dismissals | 829 | — |
| keyed on an id **absent from the current snapshot** (`data/reports`) | **132** | 15.9% |
| keyed on an id absent from `history/run-log.jsonl` entirely | 132 | 15.9% |
| orphans whose **page** has left the corpus | **0** | 0% |
| orphans the run log holds as no-longer-seen | **0** | 0% |
| orphans that stopped being seen **within two runs of being written** | **0 recorded** | see below |

**All 132 orphans sit on a page that is still compared.** The page did not go; the id did.

Per store — dismissals are not spread evenly, and three stores have none at all:

| store | standing dismissals | orphans | share |
|---|---|---|---|
| `nl` | 560 | 86 | 15.4% |
| `uk` | 197 | 34 | 17.3% |
| `be` | 72 | 12 | 16.7% |
| `be_fr` | 0 | 0 | — |
| `de` | 0 | 0 | — |
| `fr` | 0 | 0 | — |

Top pages by orphan dismissal: `nl glazen-schuifwand` **21**, `nl downloads` 5,
`nl steel-look-glazen-schuifwand/productinformatie` 4, `uk (uk)veranda/sidewall` 4, then
`nl showroom-eindhoven`, `nl glazen-schuifwand/prijzen`, `nl privacy-beleid`,
`be glazen-schuifwand-monteren` and `uk disclaimer` at 3 each. One page,
`nl glazen-schuifwand`, carries 16% of the whole orphan count.

### The class an orphan carried is not recoverable

A finding-scope override row has `class: null` by design — `overrides/state.mjs` records that
the `class` column belongs only to the eleven historical `page-class` rows. Confirmed: **0 of
132** orphan rows carry a class value. The class is a term inside the sha256 of the id and the
id is a truncated hash, so it cannot be read back either. **The classes carried by the 132
detached dismissals are unanswerable from the data on disk.** The classes in §3 are the
classes of the five ids the run log observed stopping, which is a different and much smaller
question.

### "Within two runs of being written" is unanswerable, and why

Every one of the 132 orphans was written before the run log existed, so no row records the
observation that stopped seeing it. The recorded answer is **0 of 132**, and that zero is an
absence of record and not a measurement. Restating the limit from §0: because a rule change
expires an id with no new crawl, most of these ids never crossed a run boundary at all —
asking how many runs they survived is asking a question the mechanism does not have an answer
to.

### What the age profile does show

Orphan share by the day the dismissal was written:

| day written | orphan / standing | share |
|---|---|---|
| 2026-08-06 | 1 / 1 | 100% |
| 2026-08-07 | 4 / 9 | 44.4% |
| 2026-08-08 | 0 / 1 | 0% |
| 2026-08-10 | 1 / 5 | 20.0% |
| 2026-08-11 | 56 / 142 | 39.4% |
| 2026-08-12 | 13 / 97 | 13.4% |
| 2026-08-13 | 43 / 247 | 17.4% |
| 2026-08-14 | 14 / 304 | 4.6% |
| 2026-08-17 | 0 / 18 | 0% |
| 2026-08-18 | 0 / 5 | 0% |

The share collapses with recency: **zero** of the 23 dismissals written on 08-17 and 08-18
have detached. If findings churned on a crawl cadence, a dismissal's survival would decay
smoothly with age and recent ones would already be losing. They are not.

The alternative reading is on the record in `git log`, in the commit subjects themselves —
all on 2026-08-18, all before run 1 at 11:55 UTC (13:55 +02:00):

- `0954488` 10:19 +02:00 — "The log reads one width, and the second copy of a block goes"
- `d15ec0a` 12:08 +02:00 — "A campaign word must be a word, and the image class empties"
- `6bb6854` 12:15 +02:00 — "The same words divided differently is one row, and **18 dismissals detach**"
- `e36eb05` 12:57 +02:00 — "A divided paragraph is one row, and **52 dismissals detach**"

Two commits announce **70** detachments between them, and the viewport commit changes the
extracted text of every page that sends a mobile copy of a block. 70 of 132 is accounted for
by two same-day commits with the count in the subject line. Earlier in the window,
`741d858` (08-12, "The filter block leaves both extracts") and `79b9985` (08-10, "a paragraph
is compared as a paragraph") do the same kind of thing.

So the measured 15.9% is **rule-change detachment, not content churn**. It is a cost of a
project changing its own extraction rules quickly, and it stops when the rules settle.

## 5. What was *not* measured, and why

- **Lifespan in days.** The corpus is 21 minutes long. Unanswerable until the run log has
  covered several days of crawls.
- **Whether a store-scoped mechanism — a custom variable, a rotating promotion — churns.**
  This needs the same id observed absent across days. Not in the corpus. The `campaign` class
  exists and holds 40 findings, and `c0c4310` (08-11, "The banner anchor is an id, and no
  campaign needs a commit") shows the machinery to look is there — but there is no history to
  look at.
- **The class of a detached dismissal.** Structurally unrecoverable (§4).
- **Whether two ids are the same defect with edited text.** Out of scope by the ticket's own
  trap, and the run log holds no relation to read it from.

## 6. The reading

**Churn does not outrank decision repetition — not on this corpus, and not by an order of
magnitude.** Repetition is the standing shape of the work: 21,833 work findings are live right
now (`history/run-log.jsonl` × `visibilityOf()`), and `CONTEXT.md` records the measured
consequence of the store being a term of the finding id — 11,162 of 22,048 work findings sit
in a block-spanning repeat, and the distinct decisions an editor owes fall 16,881 → 12,722
once one grouping rule is applied. That is roughly 4,159 decisions removed by a single rule,
against a backlog of over twelve thousand still outstanding. Churn, measured against the same
corpus, costs **132 detached dismissals over twelve days** — 15.9% of the 829 decisions ever
made — and 70 of those 132 are claimed outright by two commit subjects that changed the
comparison rules, on a day when the rules were being changed hourly. Nothing in the run log
shows text-driven expiry: in 21 minutes over six stores, 5 ids of 40,829 stopped being seen
and 4 arrived, all nine in the two classes whose input is an HTTP status rather than page
text. The honest verdict is therefore two-part. Churn is not the bigger problem, so this
effort's premise survives — but the number that would settle it either way does not exist yet,
because the run log is one day old, and the cheapest thing to do about that is nothing: let the
index accumulate and re-run this probe in a fortnight. The one finding here worth acting on is
not about churn at all: dismissals live in three of six stores, and 21 of the 132 orphans sit
on one page, `nl glazen-schuifwand`, so the cost of expiry today is concentrated in a handful
of pages an editor has actually worked and not spread over the corpus.

## 7. The scripts

Throwaway, left beside this note. `crawl/probes/` is where this repo's committed probes live
(`probe-118-review-staleness.mjs` and 27 others), but the ticket calls this one throwaway and
forbids touching production code, so these stay in `.scratch/`:

- `.scratch/cross-store-reuse/churn-probe.mjs` — the run log, the lifespan table, the
  no-longer-seen and arriving ids, the `data/reports` cross-check, the orphan count.
- `.scratch/cross-store-reuse/churn-probe-2.mjs` — orphans by page, by store and by day
  written; whether the page survived; the class census.
- `.scratch/cross-store-reuse/churn-probe-3.mjs` — the visibility split and the work-finding
  count used in §6.

Each imports `decodeRunLog()` from `compare/run-log.mjs` and `visibilityOf()` from
`compare/vocabulary.mjs` rather than re-implementing either, so no number here rests on this
probe's own reading of a file shape. Run from the repo root with `node`.
