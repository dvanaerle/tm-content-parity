# 92 — Measure: does either side send `<meta name="title">` or keywords?

Type: measure
Status: ready-for-agent
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

- [ ] Per store and per side, the number of pages that send `meta[name="title"]`,
      and of those, how many send a non-empty value. Present-but-empty is counted
      apart from absent — they lead to different decisions.
- [ ] The same two counts for `meta[name="keywords"]`.
- [ ] Where a value exists, whether it differs from `<title>` (for the first) on the
      same page, because a field that always duplicates `<title>` is not a second
      field.
- [ ] A verdict sentence for each field: **keep** it in the contract, or **drop** it
      and say the number that killed it. If `metaTitle` is absent everywhere, the
      Meta Title row shows `<title>`, which is honest — Magento's Meta Title field
      is what fills it. If keywords is empty everywhere, the row goes.
- [ ] Both verdicts pasted into ticket 94, and the keywords verdict also into
      ticket [98](98-the-meta-tab-becomes-a-checklist.md), which owns the row.

## Reading list

- `crawl/fetch-page.mjs` — how a page is fetched, and how `MaintenanceError` is raised
- `crawl/extract.mjs` — the five things the head is read for today
- `crawl/seed-list.mjs` — the page list to walk
- `crawl/probes/probe-extract-v2.mjs` — a probe that already fetches both sides

Do not write into `data/extract/`. A probe writes its own file.
