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

**Status:** needs-triage

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
