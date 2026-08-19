import { describe, expect, it, vi } from 'vitest';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { MaintenanceError } from './fetch-page.mjs';
import { crawlStore, failuresFilename } from './21-crawl-store.mjs';

/**
 * Ticket 93: the failure log is a record of the run that just happened, and an
 * aborted run is a run. The write used to sit after the `MaintenanceError`
 * return, so an abort left the previous run's file untouched and the file then
 * described a run that was not the last one.
 */
describe('the failure log of an aborted crawl', () => {
  const seeds = {
    rows: ['garantie', 'offerte'].map((page) => ({
      page,
      stores: {
        nl: {
          path: page,
          prodUrl: `https://www.tuinmaximaal.nl/${page}`,
          newUrl: `https://m2stagingnl.intern.systems/${page}`,
        },
      },
    })),
  };

  /** `garantie` is an ordinary failure the log must keep; `offerte` aborts the run. */
  const extract = ({ page }) => {
    if (page === 'offerte')
      throw new MaintenanceError('https://www.tuinmaximaal.nl/offerte', 'HTTP 503');
    throw new Error('socket hang up');
  };

  const STALE = {
    store: 'nl',
    at: '2026-08-01T00:00:00.000Z',
    failures: [{ page: 'dakgoot', error: 'the run before this one' }],
  };

  /**
   * @param {typeof STALE | null} previous What the run before this one left on disk.
   * @returns {Promise<{ aborted: unknown, log: typeof STALE }>}
   */
  async function abortedRunOver(previous) {
    const dir = pathToFileURL(join(await mkdtemp(join(tmpdir(), 'tm-crawl-')), '/'));
    const logFile = new URL(failuresFilename('nl'), dir);
    if (previous) await writeFile(logFile, JSON.stringify(previous));

    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      const { aborted } = await crawlStore({
        store: 'nl',
        seeds,
        extract,
        extracts: new URL('extract/', dir),
        failuresDir: dir,
      });
      return { aborted, log: JSON.parse(await readFile(logFile, 'utf8')) };
    } finally {
      vi.restoreAllMocks();
    }
  }

  it('writes the failures the aborted run collected', async () => {
    const { aborted, log } = await abortedRunOver(null);

    expect(aborted).toBeInstanceOf(MaintenanceError);
    expect(log.failures).toEqual([{ page: 'garantie', error: 'socket hang up' }]);
  });

  it('replaces the log of the run before, which is no longer the last run', async () => {
    const { log } = await abortedRunOver(STALE);

    expect(log.failures.map((failure) => failure.page)).not.toContain('dakgoot');
  });
});
