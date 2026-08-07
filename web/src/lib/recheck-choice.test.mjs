import { describe, expect, it } from 'vitest';

import { chooseReport } from './recheck-choice.mjs';

/**
 * Ticket 71: one page can have a report in each of the two folders, and the page
 * shows one of them. The choice is the whole rule, so every one of the six cases
 * is here: crawl only, re-check only, neither, re-check newer, crawl newer, and
 * the tie.
 */
describe('chooseReport', () => {
  const at = (builtAt) => ({ builtAt });

  it('gives the crawl when there is no saved re-check', () => {
    const crawl = at('2026-08-07T10:00:00.000Z');
    expect(chooseReport(crawl, null)).toEqual({ source: 'crawl', report: crawl });
  });

  it('gives the re-check when there is no crawl report', () => {
    const recheck = at('2026-08-07T10:00:00.000Z');
    expect(chooseReport(null, recheck)).toEqual({ source: 'recheck', report: recheck });
  });

  it('gives nothing when there is neither', () => {
    expect(chooseReport(null, null)).toBeNull();
  });

  it('gives the re-check when it is newer than the crawl', () => {
    const crawl = at('2026-08-07T10:00:00.000Z');
    const recheck = at('2026-08-07T11:00:00.000Z');
    expect(chooseReport(crawl, recheck)).toEqual({ source: 'recheck', report: recheck });
  });

  it('gives the crawl when the crawl is newer, so a stale re-check is ignored', () => {
    const crawl = at('2026-08-07T12:00:00.000Z');
    const recheck = at('2026-08-07T11:00:00.000Z');
    expect(chooseReport(crawl, recheck)).toEqual({ source: 'crawl', report: crawl });
  });

  it('gives the crawl on a tie', () => {
    // Both stamps come from `toISOString()`, so an equal string is an equal
    // moment. The crawl is the measured baseline, thus it wins.
    const crawl = at('2026-08-07T10:00:00.000Z');
    const recheck = at('2026-08-07T10:00:00.000Z');
    expect(chooseReport(crawl, recheck)).toEqual({ source: 'crawl', report: crawl });
  });
});
