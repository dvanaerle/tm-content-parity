# 64 — The promo banner is a legacy-only region

**What to build:** the campaign banner stops making findings on every page it loads
on, and the log says loudly if the rule ever stops matching.

The banner is one shared Magento block. It is editor work, so it is not a
non-editorial region — but the new site will not get it, which makes it
**legacy-only**, in the same manner as a legacy-only page. Measured over the whole
corpus: **2,698 findings, 7.7% of 34,910, on 371 of 448 pages.** By class: 1,635
`text-missing`, 1,036 `missing-link`, and a small tail. By store: nl 1,239, be 1,043,
de 121, uk 120, be_fr 100, fr 75.

One authored block makes 7.7% of the work list. It is the largest single removal
available.

The banner has no stable markup hook: its wrapper class is generic and its inner
classes are generated hashes. It also has no stable **text**, because it is
translated in each store. What is stable across stores is the campaign option ids in
a link target — Magento attribute codes and option ids are global. Measured in `nl`,
`be`, `de` and `uk`, that signal matched the banner and matched nothing else.

Blocked by: 63.

Status: resolved — 2026-08-07

**Origin:** the grilling of 2026-08-07 on the content unit. The user asked for the
banner to be ignored, and then asked what happens when the content changes.

- [x] One entry in the excluded-region list, reason `legacy-only`, anchored on the
      campaign option ids in a link target.
- [x] The entry names the campaign and the date, because the anchor is
      campaign-specific by construction.
- [x] The entry is verified in all six stores. `fr` and `be_fr` are **not** verified
      yet: the URLs used while grilling answered 404, which proves only that they were
      guessed. Take the real URLs from the seed list.
- [x] Both responsive versions of the banner leave together. They sit inside one
      wrapper, so one match removes both. **The outcome holds. The reason is wrong;
      see below.**
- [x] **Coverage is compared against the previous snapshot.** If the region was
      removed on 371 pages and is now removed on none, the log says that in one line.
      The reader must never have to infer it from 2,698 rows that came back.
- [x] The 2,698 findings are gone, and no page loses a unit that an editor wrote.
      **4,055 findings, not 2,698.**

## What was measured

Two probes, both kept as evidence. Neither re-crawls: `data/extract/` and
`data/reports/` are untouched, because a re-crawl detaches overrides and that is
ticket 67.

- `crawl/probes/probe-promo-banner.mjs` — what the selector matches, on three pages
  that all six stores have, and on four controls.
- `crawl/probes/probe-promo-banner-corpus.mjs` — the whole seed list, 448 store
  pages, in every store, with the real link statuses.

**The anchor.** `.mgz-element-section:has(a[href*="_model=6039,6040"])`, and the
same selector again for the `%2C` encoding. On production it matches **twice** on
every page, in **all six stores**, and on the new site it matches **nothing**. The
two matches are the desktop and the mobile version of one banner. `fr` and `be_fr`
are verified from the seed urls, and they answer 200.

**The corpus.** The banner is on **446 of 448 pages**, not 371. Only `meettool`, on
nl and be, does not have it.

| | before | after | gone |
| --- | --- | --- | --- |
| findings | 34,488 | 30,433 | **4,055 (11.8%)** |
| shown by default | 23,020 | 19,460 | 3,560 |

By store, findings gone: **nl 1,347, be 1,156, de 498, uk 479, be_fr 300, fr 275.**

By class, findings gone: `text-missing` 2,378, `missing-link` 1,169,
`image-campaign` 503, `restructured` 10, `link-target` 6, `copy` 6, `casing` 5,
`heading-level` 1.

**No page loses a unit an editor wrote.** Across 446 pages the entry removes 8, 9
or 18 units, and nothing else. Every removed unit is banner copy, in the store's own
language: `10% korting op terrasoverkappingen en carports.`,
`10% Rabatt auf Terrassenüberdachungen und Carports.`,
`10% de réduction sur les vérandas et les carports.`, with the offer link, the small
print and the terms link.

## Four things this ticket got wrong

1. **The count and the share were low.** The ticket said 2,698 of 34,910, or 7.7%.
   Measured: **4,055 of 34,488, or 11.8%**. The class list also missed
   `image-campaign` entirely, which is 503 findings: the banner carries a campaign
   image in both responsive versions.
2. **The page count was low.** 371 of 448 in the ticket, **446 of 448** measured.
3. **"They sit inside one wrapper, so one match removes both" is wrong.** The two
   responsive versions are **siblings**, each its own `.mgz-element-section`. The
   shared wrapper above them is `.magezon-builder`, which is the selector ADR 0003
   forbids, because it holds 358 of 359 units on `/downloads`. Both versions leave
   together because **one entry counts all of its matches**, and not because one
   match takes both. The outcome the ticket wanted holds. The reason it gave does
   not.
4. **The default cap was not enough.** Three nl pages carry the same banner
   **twice** — `glazen-schuifwand`, `shading-panel` and
   `steel-look-glazen-schuifwand`, at 4 matches and 18 units. The default cap of 20
   holds today, and it would stop the crawl on a third placement. A correct selector
   must not fail the run, so the entry declares `maxUnits: 30`. That is three
   placements, and it is far below the sizes the cap defends against: 139 units on
   `/overkapping` and 358 on `/downloads`.

## The 23 findings that appeared

22 pages gain one finding each, 23 in total, and 18 of them are nl. Every one is the
**pairing correcting itself**. A banner unit was absorbing a new-site unit, and with
the banner gone the new-site unit reads as what it is.

13 are `text-added`, which is hidden by default, so they arrive behind the noise
toggle. `Bekijk alle FAQs` is the common one. The rest are 5 `restructured`, 3
`copy` and 1 `extra-link`.

They are more reporting and not less, and the net is still 4,055 findings fewer. A
row that appeared is a row the banner was hiding.

## Two fetch failures

`faq/offerte` on nl and be answered a transport error during the corpus run. It is
not the banner, and 448 of 450 store pages measured. Both pages are in the probe
result with their error.

## What the coverage check does

`compare/region-coverage.mjs` counts the pages each entry was removed on, and
`compare/30-compare.mjs` compares that count with the run before it. The verdict —
`stopped-matching`, `narrowed`, `widened`, `started-matching`, `new-entry` or
`left-the-list` — goes into `data/snapshot.json`, and the crawl prints one line for
each entry that moved. A run where nothing moved prints nothing.

**The verdict is stored, and never the sentence.** The crawl says it in Simplified
Technical English and the dashboard says it in Dutch. Two translations of one
sentence would drift apart; two readings of one verdict cannot.

Two runs are compared only when they cover the same scope. A
`node compare/30-compare.mjs nl` run against a whole-corpus snapshot would otherwise
read as five stores that stopped matching, so it says that instead of comparing.

The dashboard states the line on every store, and it labels it as a statement about
the whole run. Ticket 70 names the reading this prevents: a campaign that changes
"reads on the dashboard as a collapse in every store when nothing regressed".

## Not to decide again

Excluding a campaign banner is an exception to the resolved decision behind the
`campaign` class and the promo pattern, which exist because a promotional difference
is one of the most valuable findings the log makes. The exception is narrow, and it
stays narrow: `campaign` keeps working on promotional copy **inside** a content unit.
Only a whole region that is declared legacy-only leaves the log.

If the new site ever gets its own banner, it will not match a production anchor and
it appears as added content. That class is hidden by default, so it arrives behind
the noise toggle rather than announcing itself. Accepted, and recorded here so the
next reader is not surprised.
