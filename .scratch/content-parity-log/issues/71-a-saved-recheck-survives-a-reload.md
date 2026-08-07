# 71 — A saved re-check survives a reload

Type: task
Status: resolved 2026-08-07
Blocked by: None — can start immediately. 10 and 29 are resolved.
Parent: ../map.md

**What to build:** an editor presses `Hercontroleer`, reloads the page, and the
page still shows the re-check. Today the fresh report lives in the browser only.
The reload throws it away and the crawl comes back, so the editor cannot tell a
fixed page from a page nobody looked at.

## The decision this ticket carries

A saved re-check is written **beside** the crawl report, never over it.

`compare/measure.mjs` is the regression gate. It reads the crawl reports, and the
totals in `map.md` come from it. A button press is one editor's ad-hoc
observation of one page. If a press replaced the crawl report, the corpus total
would move for a reason no session recorded. Ticket 28 forbids a measurement
against a baseline that an earlier change already moved.

So there are two folders. The crawl keeps `data/reports/`. A re-check writes
`data/rechecks/`. Both are keyed by the filename ticket 60 put in the contract,
so one page has at most one file in each.

**The newer of the two wins, and the crawl wins a tie.** A crawl that runs after a
re-check makes the re-check stale, and the page goes back to the crawl. The stale
overlay is ignored and **not** deleted: it is evidence of what the two sites said
at that minute.

## Scope

The page view only. The store dashboard and the home page are built from the
crawl reports and keep the built snapshot until the next `npm run build`. This is
a deliberate limit and not an oversight. Say so where a reader will look for it.

The hosted snapshot does not change. It has no service, so it saves nothing and
asks for nothing. The re-check button is already absent there, and the extra
request must be absent too.

## Acceptance criteria

- [x] A press of `Hercontroleer` writes the fresh report to the overlay folder
      before it answers the browser.
- [x] A reload of a re-checked page shows the re-check: the same findings, the
      same observation id and the same moment stamp as the press produced.
- [x] A press writes nothing into the crawl report folder.
      `node compare/measure.mjs nl` prints the same numbers before and after one.
- [x] A crawl that is newer than the overlay wins. The page shows the crawl, and
      the overlay file still exists on disk.
- [x] Two reports with the same moment give the crawl. The rule that picks
      between the two is a pure function with its own test: crawl only, overlay
      only, neither, overlay newer, crawl newer, and the tie.
- [x] The page tells the reader which of the two it shows. A restored re-check
      must not look like a crawl result.
- [x] The hosted copy makes no request for a saved re-check, because nothing
      answers `/api/health` there.
- [x] The HTTP layer keeps its smoke tests, and they reach neither the network
      nor the disk.
- [x] `api/README.md` records the new endpoint and the two folders.

## Traps

- The report holds both extracts and is large. Do not answer with the crawl
  report the built page already carries. Answer with the overlay, or with
  nothing.
- `builtAt` is a UTC `toISOString()` stamp on both sides, so a string comparison
  is the time comparison. Do not parse a date to compare two of them.
- `data/` is not in git. A missing folder and a missing file are the normal case
  on a fresh clone, and neither is an error.
- A page key can hold a slash (`faq/productinformatie`). The read endpoint must
  split store from page the same way the re-check endpoint does.

## What was built

- `POST /api/recheck/<store>/<page>` writes `data/rechecks/<reportFilename>` and
  then answers. `GET` on the same path answers the saved report or `404`, so one
  parser splits the store from the page for both methods.
- The `GET` answer is the overlay or nothing, never the crawl report the built
  page already carries.
- `chooseReport(crawl, recheck)` in `web/src/lib/recheck-choice.mjs` is the rule.
  It is pure and it holds no clock: both stamps come from `toISOString()`, so the
  string comparison is the time comparison. It stays in `web/` because `web/` is
  the only stage that runs it — ADR 0001's third question.
- `usePageReport()` in `web/src/lib/recheck.mjs` asks once, and only when
  `/api/health` answered. On the webhost no request is made at all.
- The footer reads `Hercontrole van …` instead of `Momentopname van …` when the
  saved re-check won.
- `api/README.md` records the endpoint, the two folders and the page-view limit.

## Origin

The question of 2026-08-07: "if I adjust content now and press `Hercontroleer`,
will it update?" It does. It then loses the answer on the next reload.
