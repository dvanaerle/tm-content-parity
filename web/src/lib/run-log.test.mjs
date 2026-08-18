import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { RUN_LOG } from '../../../compare/run-log.mjs';
import { firstSeenOn } from './run-log.mjs';
import { fromRoot } from './repo-root.mjs';

const AT = '2026-08-01T09:00:00.000Z';
const index = new Map([['aaa', AT]]);

describe('the dates a page reads off the run log', () => {
  it('gives a finding the day its id was first seen', () => {
    expect(firstSeenOn(index, [{ id: 'aaa' }])).toEqual({ aaa: AT });
  });

  /**
   * The index is committed and the reports are not, so on a fresh clone the index is
   * older than the report it is read beside — and a re-check mints ids no run has seen.
   * A finding with no row says nothing. It must never guess, because the guess would be
   * *first seen today* on a difference that has been there since the first crawl.
   */
  it('says nothing about a finding the index does not hold', () => {
    expect(firstSeenOn(index, [{ id: 'zzz' }])).toEqual({});
  });
});

/**
 * The web build reads the index the compare stage writes, and it resolves the path a
 * different way — through `repo-root.mjs`, because Astro bundles server modules into
 * `web/.astro/.prerender/chunks/` where a path relative to `import.meta.url` points at
 * nothing (ticket 72).
 *
 * Two ways of naming one file is two chances for them to name different ones, and the
 * failure is silent: a missing index is a legitimate answer on a fresh clone, so the
 * build loses every date and still exits 0. It did exactly that once. This is the guard.
 */
it('reads the file the compare stage writes', () => {
  expect(fromRoot('history/run-log.jsonl')).toBe(fileURLToPath(RUN_LOG));
});
