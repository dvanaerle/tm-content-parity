# 91 — Measure: what the nine meta classes would fire, on today's corpus

Type: measure
Status: ready-for-agent
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

- [ ] Per store, and totalled: pages compared, and for each of the nine classes the
      number of rows it would fire on. `meta-casing` is counted separately from
      `meta-title-changed` and `meta-description-changed` — it is the tier-2-only
      difference, a dropped trailing full stop or a case change, which those two
      classes must not also claim.
- [ ] The share of shown findings the meta total represents. 21 put it at 0.54%;
      that ratio, not either raw count, is the figure the gate reads.
- [ ] `robots-index-lost` and `robots-noindex-lost` counted per store by name. 21
      says `robots-index-lost` fires **exactly once**, on `be`. If it fires more
      often now that is a finding about a head, not corpus drift, and it is written
      down as such.
- [ ] The four `lost`/`added` classes counted. 21 expects zero. A non-zero count
      means a page lost a title or a description since 2026-08-07 and wants naming.
- [ ] Per store, and totalled: the findings `no-route` emits today, total and
      shown. This is what excluding it removes.
- [ ] The meta table is pasted into ticket [97](97-the-meta-producer-one-finding-per-row.md)
      and the `no-route` table into ticket [93](93-no-route-leaves-the-log.md).

## Reading list

- `compare/meta.mjs` — `metaRows()` already folds and compares these fields
- `compare/contract.mjs` — `PageMeta`, and what tier 1 has already normalised
- `21-axis-a-meta-check.md` § Nine new classes, § Identity and normalisation
- `crawl/probes/probe-tag-changes.mjs` — a probe that already walks every extract

The probe is throwaway. It re-implements the nine rules loosely to get a count; it
is not the producer, and ticket 97 does not import it.
