# 38 — Six stores, not one

**What to build:** an editor responsible for the German store opens the German
store. A switcher in the shell moves between `nl`, `be`, `be_fr`, `de`, `fr` and
`uk`; the store is in the URL, so a link to the French dashboard can be sent to a
colleague; and each store carries its own progress numbers.

Today the tool is nl only — not because the code is nl-specific, but because
nobody has run it. The crawl, extract, compare, link-key and report-naming paths
are all already store-generic, and the seed data holds a production URL and a
new-site URL for all 451 store pages. The gap is data and one missing route.

**Blocked by:** None — can start immediately. It needs nothing from tickets
33–37 and can run alongside them.

**Status:** ready-for-agent

**Implements:** spec [32](32-scannable-log-and-six-stores.md), phase 7.

- [ ] **Fix the failure-log overwrite first.** The extract failure file is one
      fixed filename that every run overwrites, so a `be` run erases the nl
      record — which today holds the `faq/offerte` redirect loop. Make it per
      store. This is a prefactor: do it before any other store is crawled.
- [ ] **Verify production is not in maintenance before each run.** The crawler
      aborts loudly on a 500 or 503, which is correct behaviour; all ten hosts
      answered 200 on 2026-08-06, and the `prodMaintenance` flags in the seed
      data are stale and must not be trusted.
- [ ] The five non-NL stores are crawled and compared: **270 rows, 540
      requests** — be 126, de 45, uk 42, be_fr 29, fr 28.
- [ ] A dashboard route per store, with a switcher in the shell that navigates to
      it. The page-level route already carries the store; the dashboard is the
      only place that does not.
- [ ] Each store's page carries only that store's summaries, so a visitor does
      not download six stores to read one.
- [ ] Each store carries its own progress numbers.
- [ ] **Axis A only** — production against the new site *within* one store. Axis
      B, NL against the other stores, stays unbuilt and is not touched here.
- [ ] The interface stays **Dutch** on every store. The log's question is whether
      two strings match, which needs no comprehension of either.
- [ ] **Measure the be/be_fr shared-host blind spot and write the number into
      `map.md`.** `cross-store-link` compares hosts and those two stores share
      one, so a French page linking into a Dutch Belgian page is not flagged.
      Count how many be_fr anchors actually point at a non-`/fr` path on the
      shared host. **Open a follow-up ticket only if the number is not zero** —
      do not write a rule against a hypothetical.
- [ ] Per-store results recorded in `map.md`: crawled, comparable, and shown
      findings for each of the five.
