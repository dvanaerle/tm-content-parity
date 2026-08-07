# 60 — The report filename is crawl-to-web data outside the contract

**What this is:** `compare/` writes the store into a filename and `web/` reads it
back out, and `compare/contract.mjs` says nothing about it.

`compare/30-compare.mjs` names a report `` `${store}__${page.replaceAll('/', '__')}.json` ``.
Ticket 38 made `web/src/lib/reports.mjs` read the store back from that name with
`storeOfFile()`, because that is what lets one store's dashboard open one store's
files without opening all 448 reports first. The `__` separator is now encoded in
two places, and it decides which pages a route is built for.

`AGENTS.md` is direct about this: "`compare/contract.mjs` is the contract. `crawl/`
writes it, `compare/` and `web/` read it. Change the contract in that file first,
then the code." A filename shape that `web/` parses is exactly that kind of data,
and it has no home in the contract file.

**Status:** ready-for-agent

**Session:** 2, and **before spec 50**. See `../RUNBOOK.md`.

**Origin:** the review of ticket [38](38-six-stores.md), 2026-08-07.

## What triage has to settle

- **Name it in the contract, or stop parsing it?** Two fixes, and they point in
  opposite directions. The contract can own the name — one `reportFilename(store,
  page)` and one `storeOfFile(name)` beside each other, both imported, and the
  shape stated once. Or the web build can stop reading the name at all and read the
  store out of the JSON, which is already there as `PageReport.store`.
- **Reading the JSON costs the thing ticket 38 bought.** Naming the store in the
  filename is what makes a store's dashboard cheap: the build opens 45 files for
  `de`, not 448. Reading the store from inside each file means opening all of them
  again. So "stop parsing it" is only honest if the cost is measured first — the
  numbers to beat are in ticket 38's payload table.
- **A folder per store is a third option.** `data/reports/<store>/<page>.json` puts
  the store in the path instead of the name, and a `readdir` of one folder needs no
  parse at all. It is a bigger change: the compare step, the api and every path in
  `web/` move with it.

## Not to decide again

The prefix match itself is settled and tested — no store id is a prefix of another
once the `__` is counted, so `be__` does not match `be_fr__`. This ticket is about
where the shape is written down, not about whether the match is safe.

## Triage, 2026-08-07: ready-for-agent, session 2

**Name the shape in the contract. Keep the filename.**

Of the three options, two are rejected on cost and one is what `AGENTS.md`
already asks for.

- **Stop parsing it, and read the store out of each JSON.** Rejected for now.
  It gives back exactly what ticket 38 bought: the store dashboard opens 45 files
  for `de` instead of 448, and the payload table shows the result — nl 1,087 KB
  against fr 246 KB. Reading the store from inside each file means opening all of
  them again on every build. This option is **only honest with a measurement in
  front of it**, and no measurement has been made. Do not take it blind.
- **A folder per store, `data/reports/<store>/<page>.json`.** Rejected as too
  large for the problem. It is the cleanest shape, and a `readdir` of one folder
  needs no parse at all — but the compare step, the api and every path in `web/`
  move with it. That is a refactor, and this ticket is about one undocumented
  data shape.
- **Name it in the contract.** Taken. `compare/contract.mjs` gains
  `reportFilename(store, page)` and `storeOfFile(name)` beside each other, both
  imported by their call sites, and the `__` separator is stated once. The shape
  stops being encoded in two places, and the rule the repo runs on is obeyed:
  *change the contract in that file first, then the code.*

**Do it before spec 50.** Spec 50 takes the seed list from 451 pages to about
800, so it roughly doubles the files this shape names. The change is the same
size either way, but the risk of leaving a second encoding in place grows with
the file count, and session 5 rebuilds all of them.

### What to build

- `reportFilename(store, page)` and `storeOfFile(name)` in
  `compare/contract.mjs`. One statement of the separator, and a comment that says
  **why** the store is in the name — the store dashboard must not open every
  report to find its own.
- `compare/30-compare.mjs` writes through `reportFilename()`.
  `web/src/lib/reports.mjs` reads through `storeOfFile()` and keeps no template
  of its own.
- The existing prefix-match tests move with the functions. They already pin that
  `be__` does not match `be_fr__`, and that is the property the contract now owns.
- No number moves. This is a move, not a change of behaviour: 455 pages built,
  and `node compare/measure.mjs nl` unchanged.

### Left for later, on purpose

The payload measurement that would let "read the store out of the JSON" be judged
fairly. It is not needed to make this fix, and it is not worth a crawl. If the
folder-per-store shape is ever wanted, it starts from a contract that already
names the pair of functions, which makes it a smaller change than it is today.
