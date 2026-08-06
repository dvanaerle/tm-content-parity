import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

/**
 * `compare/` writes one `PageReport` per store page into `data/reports/`.
 * The folder is not in git, so a fresh clone builds an empty log instead of
 * failing.
 *
 * @typedef {import('../../../compare/contract.mjs').PageReport} PageReport
 * @returns {Promise<PageReport[]>}
 */
export async function loadReports() {
  const dir = fileURLToPath(new URL('../../../data/reports/', import.meta.url));

  let names;
  try {
    names = (await readdir(dir)).filter((name) => name.endsWith('.json'));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }

  return Promise.all(
    names.map(async (name) => JSON.parse(await readFile(dir + name, 'utf8'))),
  );
}
