# 91 — Measure: what the nine meta classes would fire, on today's corpus

Type: measure
Status: resolved
Blocked by: —
Parent: 58-axis-a-meta-check.md

**What to measure:** ticket [21](21-axis-a-meta-check.md) counted 130 meta findings
and about 150 `no-route` findings over **373** comparable pages. Step 03 took the
corpus to **722**. Every number in ticket 58 is therefore stale, and two build
tickets are waiting to carry them. Restate both against `data/extract/` as it
stands.

**No session.** This runs as a probe under `crawl/probes/`, or as a background
subagent. It reads disk and touches no network.

## What can and cannot be measured yet

`keywords` and `metaTitle` are **not on disk** — they have never been crawled. So
this probe measures the three rows that are: title, description and the derived
`noindex` boolean. The two uncrawled fields are ticket [92](92-measure-meta-title-and-keywords-presence.md).

## Deliverable

Two tables, pasted into the tickets that wait on them.

- [x] Per store, and totalled: pages compared, and for each of the nine classes the
      number of rows it would fire on. `meta-casing` is counted separately from
      `meta-title-changed` and `meta-description-changed` — it is the tier-2-only
      difference, a dropped trailing full stop or a case change, which those two
      classes must not also claim.
- [x] The share of shown findings the meta total represents. 21 put it at 0.54%;
      that ratio, not either raw count, is the figure the gate reads.
- [x] `robots-index-lost` and `robots-noindex-lost` counted per store by name. 21
      says `robots-index-lost` fires **exactly once**, on `be`. If it fires more
      often now that is a finding about a head, not corpus drift, and it is written
      down as such.
- [x] The four `lost`/`added` classes counted. 21 expects zero. A non-zero count
      means a page lost a title or a description since 2026-08-07 and wants naming.
- [x] Per store, and totalled: the findings `no-route` emits today, total and
      shown. This is what excluding it removes.
- [x] The meta table is pasted into ticket [97](97-the-meta-producer-one-finding-per-row.md)
      and the `no-route` table into ticket
      [93](.out-of-scope/93-no-route-leaves-the-log.md) — which is now out of scope,
      so the `no-route` rows stay in the log.

## Reading list

- `compare/meta.mjs` — `metaRows()` already folds and compares these fields
- `compare/contract.mjs` — `PageMeta`, and what tier 1 has already normalised
- `21-axis-a-meta-check.md` § Nine new classes, § Identity and normalisation
- `crawl/probes/probe-tag-changes.mjs` — a probe that already walks every extract

The probe is throwaway. It re-implements the nine rules loosely to get a count; it
is not the producer, and ticket 97 does not import it.

## Answer

Measured 2026-08-14 by `crawl/probes/probe-91-meta-classes.mjs`, against `data/extract/`
and `data/reports/` copied beside a `read` lane. **816 extract files, 722 comparable**,
40,947 findings, 22,003 `work`. No crawl and no network.

Both tables are pasted: the meta table into ticket
[97](97-the-meta-producer-one-finding-per-row.md), the `no-route` table into ticket
[93](.out-of-scope/93-no-route-leaves-the-log.md). They are not repeated here.

**Four things moved, and only one of them is corpus drift.**

**The meta total is 197, not 130, and it is all `work`.** Title changes went 45 → 67 and
description changes 78 → 120. That is drift, and it is **sub-proportional**: the corpus
nearly doubled (373 → 722) while meta grew by half, so the rate per comparable page fell
from 0.35 to 0.27. The per-store rates say where that comes from: `nl` 0.37 and `be` 0.44
against `be_fr` 0.22, `fr` 0.22, `uk` 0.20 and `de` 0.18. The pages step 03 added have
cleaner heads than the ones already there. **Why** is not measured here and is not this
ticket's question. It matters only in that ticket 97 must not scale 130 by the corpus
ratio and expect 250.

**The share is 0.90%, not 0.54%, and drift is only half the reason.** The denominator
*fell* while meta rose: ticket 86 moved 2,846 `heading-level` findings out of `work`, so
22,003 replaces 23,961. Both movements push the ratio the same way. It nearly doubled —
but it is still under 1%, so ticket 21's argument that the head is a small addition to the
count survives its own restatement.

0.90% is the share **against today's log**, reproducing ticket 21's method so the two are
comparable. It is **not** the figure the gate will read: all 197 are `work`, so when the
producer lands the denominator moves with the numerator and `measure.mjs` prints
197 / 22,200 = **0.89%**. Ticket 97 carries both numbers and says which is which.

**`robots-index-lost` fires twice, and the second one is a finding about a head.**
Ticket 21 found `be/bedrijfsinformatie`. `de/(de)erfolg-probepaket` is new: production
serves it indexable and the new site serves it `noindex`, so the page leaves Google. It
appeared in the seven days between the two measurements and nobody saw it, which is
exactly the argument ticket 21 made for the class — *nobody finds these by eye*. It is
written down here, and named in ticket 97's table, because it is a defect on the new
site and not an artefact of counting.

**`no-route` is 85 findings, not ~150.** Ticket 21 said 25 findings and 15 shown in
every one of the six stores. It is now 14 or 15 a store, 34 `work` over six. Ticket 58's
step 1 therefore removes 85 and its step 2 adds 197 — the two no longer come close to
cancelling, and the ticket's *"expect about 150 findings fewer"* is stale in the
direction that matters. Both build tickets carry the corrected figure.

**What did not move.** The four `lost`/`added` classes still fire **zero** times: both
sides still always send a title and a description. `meta-casing` is still exactly **4**,
still all a dropped trailing full stop on a description, on the same two pages
(`aluminium-zijwand/productinformatie`, `showroom-berlijn`) in `nl` and `be`. That the
casing count is unchanged while the two changed classes grew by half is the evidence
that they are not claiming each other's rows.

**`check: 'meta'` is not empty, so ticket 97 does not create the fourth check.** It
already holds **349** `no-declared-alternate` findings across five stores — `be_fr` 90,
`fr` 92, `de` 81, `uk` 81, `be` 5, and **`nl` 0**. Ticket 58 and ticket 97 both read as
though the head arrives on an empty check; it arrives on one that already fires. The 349
are all `diagnostic`, so none is in `work` and none of the share arithmetic above moves.
It matters only for 97's gate, which counts findings on `check: 'meta'` and happens to
run on the one store where the existing count is 0. The per-check baseline is pasted into
97 beside the meta table for exactly this reason.

### Two notes for whoever measures next

**`data/snapshot.json` and `compare/measure.mjs` disagree about the finding total.**
The snapshot records 40,966 and the gate prints 40,947. The gate counts comparable
reports only; the snapshot counts every report file, including 19 non-comparable ones
that each carry one `no-declared-alternate`. `work` is 22,003 either way, because all 19
are diagnostic. This ticket used the gate's number throughout, since that is what
tickets 93 and 97 are read against. **The inconsistency is real and is nobody's ticket
yet.**

**`keywords` and `metaTitle` are still unmeasurable** and ticket
[92](92-measure-meta-title-and-keywords-presence.md) still owns them. Nothing here
changes that; the probe measures the three rows that are on disk.
