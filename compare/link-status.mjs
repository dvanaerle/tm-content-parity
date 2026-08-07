/**
 * Status checking for internal link targets (ticket 05).
 *
 * Site-wide, deduplicated, cached for the whole run, concurrency 8. Only
 * `broken-link` and `redirect` need this; the other five link classes are decided
 * from the two page HTMLs alone.
 *
 *   node compare/link-status.mjs
 *
 * Reads every extract under `data/extract/`, collects the internal targets and
 * writes `data/link-status.json`. It takes no store: the file is keyed on the
 * target url and holds every store, so a per-store run erases the rest. See
 * `refusalReason`, ticket 59.
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const CONCURRENCY = 8;
const MAX_HOPS = 10;
const EXTRACTS = new URL('../data/extract/', import.meta.url);
const OUT = new URL('../data/link-status.json', import.meta.url);

/**
 * Redirects are followed by hand, because `fetch` with `redirect: 'follow'`
 * reports no hop count and ticket 05 needs one: a redirect that lands on a 404,
 * and a redirect loop, are both `broken-link`, and a redirect that resolves is a
 * separate, hidden class.
 *
 * `status: 0` is "no answer at all" — a DNS failure, a refused connection or a
 * timeout. The comparison treats it as broken.
 *
 * @param {string} url
 * @param {{ timeoutMs?: number }} [options]
 * @returns {Promise<{ status: number, hops: number, finalUrl: string }>}
 */
export async function checkUrl(url, { timeoutMs = 20000 } = {}) {
  let current = url;
  const seen = new Set([url]);

  for (let hops = 0; hops <= MAX_HOPS; hops += 1) {
    let response;
    try {
      response = await request(current, 'HEAD', timeoutMs);
      // Magento and CDNs mishandle HEAD often enough to invent phantom 404s, so
      // a failing verdict is always confirmed with a GET. The new site's 404 page
      // is 335 KB, and this is the only place that cost is paid.
      if (response.status === 405 || response.status === 501 || response.status >= 400) {
        response = await request(current, 'GET', timeoutMs);
      }
    } catch {
      return { status: 0, hops, finalUrl: current };
    }

    const location = response.headers.get('location');
    if (response.status >= 300 && response.status < 400 && location) {
      const next = new URL(location, current).href;
      // A loop is not a redirect that resolves. Ticket 17 found one on
      // `faq/offerte`, and reporting it as `redirect` would hide it.
      if (seen.has(next)) return { status: 508, hops: hops + 1, finalUrl: next };
      seen.add(next);
      current = next;
      continue;
    }
    return { status: response.status, hops, finalUrl: current };
  }
  return { status: 508, hops: MAX_HOPS, finalUrl: current };
}

/**
 * @param {string} url
 * @param {'HEAD' | 'GET'} method
 * @param {number} timeoutMs
 */
function request(url, method, timeoutMs) {
  return fetch(url, {
    method,
    redirect: 'manual',
    headers: { 'user-agent': 'Mozilla/5.0 (content-parity; internal)' },
    signal: AbortSignal.timeout(timeoutMs),
  });
}

/**
 * @param {string[]} urls
 * @param {{ onProgress?: (done: number, total: number) => void }} [options]
 * @returns {Promise<Record<string, { status: number, hops: number }>>}
 */
export async function checkAll(urls, { onProgress } = {}) {
  const unique = [...new Set(urls)];
  /** @type {Record<string, { status: number, hops: number }>} */
  const out = {};
  let cursor = 0;
  let done = 0;

  const worker = async () => {
    while (cursor < unique.length) {
      const url = unique[cursor];
      cursor += 1;
      const { status, hops } = await checkUrl(url);
      out[url] = { status, hops };
      done += 1;
      onProgress?.(done, unique.length);
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  return out;
}

/**
 * @param {URL} dir
 * @returns {Promise<string[]>}
 */
async function jsonFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) out.push(...await jsonFiles(new URL(`${entry.name}/`, dir)));
    else if (entry.name.endsWith('.json')) out.push(fileURLToPath(new URL(entry.name, dir)));
  }
  return out;
}

/**
 * The status of a target is a fact about the target and not about a store. Thus
 * `data/link-status.json` has no store dimension to give it (ticket 38), and the
 * script takes no argument. The message below gives the rest of the reason.
 *
 * @param {string[]} args positional arguments, after the script path
 * @returns {string | null} the reason to refuse, or null to run
 */
export function refusalReason(args) {
  if (args.length === 0) return null;
  return [
    `link-status.mjs takes no argument, and it was given ${args.map((a) => `\`${a}\``).join(' ')}.`,
    'It writes data/link-status.json, which is keyed on the target url and holds',
    'every store at once. A per-store run would write over the other stores, and',
    'the next compare would report no broken-link and no redirect at all.',
    'Run it with no argument, over every store that is crawled.',
  ].join('\n');
}

if (process.argv[1]?.endsWith('link-status.mjs')) {
  const refusal = refusalReason(process.argv.slice(2));
  if (refusal !== null) {
    console.error(refusal);
    process.exit(2);
  }

  const urls = [];
  for (const file of await jsonFiles(EXTRACTS)) {
    const sides = JSON.parse(await readFile(file, 'utf8'));
    for (const side of ['production', 'new']) {
      for (const link of sides[side].links) if (link.internal) urls.push(link.url);
    }
  }

  const unique = new Set(urls);
  console.log(`${urls.length} internal targets, ${unique.size} unique.`);

  const statuses = await checkAll(urls, {
    onProgress: (done, total) => {
      if (done % 100 === 0 || done === total) console.log(`  ${done}/${total}`);
    },
  });

  await mkdir(fileURLToPath(new URL('.', OUT)), { recursive: true });
  await writeFile(OUT, JSON.stringify(statuses, null, 2));

  const broken = Object.values(statuses).filter((s) => s.status >= 400 || s.status === 0).length;
  const redirected = Object.values(statuses).filter((s) => s.hops > 0 && s.status < 400).length;
  console.log(`broken ${broken}, redirected ${redirected}, ok ${unique.size - broken - redirected}`);
  console.log(`wrote ${fileURLToPath(OUT)}`);
}
