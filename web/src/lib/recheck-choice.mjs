/**
 * The rule that picks between the two reports of one page.
 *
 * There are two folders (ticket 71). The crawl writes `data/reports/`, and a
 * press of Recheck writes `data/rechecks/` **beside** it and never over it:
 * `compare/measure.mjs` reads the crawl reports and the corpus totals come from
 * them, so one editor's ad-hoc look at one page must not move a measured
 * baseline (ticket 28). Both folders use `reportFilename()` from the contract,
 * thus one page has at most one file in each.
 *
 * `api/` writes the two folders and `web/` alone reads this rule, so it stays in
 * the stage that needs it. ADR 0001: `shared/` is not a place for pure code, it
 * is a place for pure code that two stages read. On the day the service also has
 * to choose, this file moves there.
 */

/**
 * The newer of the two wins, and **the crawl wins a tie**. A crawl that runs
 * after a re-check makes the re-check stale, and the page goes back to the
 * measured report. The stale file is ignored and not deleted, because it is
 * evidence of what the two sites said at that minute.
 *
 * `builtAt` is a `toISOString()` stamp on both sides, so the string comparison
 * is the time comparison and no date is parsed to make it.
 *
 * `data/` is not in git. A missing crawl report and a missing re-check are both
 * normal, which is why each side may be `null`.
 *
 * @template {{ builtAt: string }} T
 * @param {T | null} crawl
 * @param {T | null} recheck
 * @returns {{ source: 'crawl' | 'recheck', report: T } | null} `null` for neither.
 */
export function chooseReport(crawl, recheck) {
  if (!recheck) return crawl ? { source: 'crawl', report: crawl } : null;
  if (!crawl) return { source: 'recheck', report: recheck };
  return recheck.builtAt > crawl.builtAt
    ? { source: 'recheck', report: recheck }
    : { source: 'crawl', report: crawl };
}
