/**
 * The local re-check service, and the one command that runs the whole tool.
 *
 *   node api/server.mjs [port]
 *
 * Plain Node, no framework, no Playwright. Ticket 19 ruled browser rendering out
 * for good, and plain `fetch` reads every page in scope.
 *
 * It exists because **neither site sends CORS headers**, so a browser cannot
 * fetch either of them. A local service is mandatory, and it is the reason the
 * hosted snapshot cannot re-check: the webhost runs no server code.
 *
 * The front end **feature-detects** it on `/api/health`. Present, the Recheck
 * button renders; absent, it does not, and nothing else changes. There is no
 * build flag, because the same static files are the hosted snapshot and the
 * local copy.
 */

import { createServer } from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { newObservationId, reportFilename } from '../compare/contract.mjs';
import { checkAll } from '../compare/link-status.mjs';
import { comparePage, newSitePathsFor } from '../compare/30-compare.mjs';
import { MaintenanceError } from '../crawl/fetch-page.mjs';
import { extractStorePage } from '../crawl/20-extract.mjs';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const SEEDS = new URL('../data/10-store-seeds.json', import.meta.url);

/**
 * A press writes here, beside `data/reports/` and never over it (ticket 71).
 * `compare/measure.mjs` reads the crawl reports, so a button press must not move
 * a measured baseline. `chooseReport()` in `web/src/lib/recheck-choice.mjs` holds
 * the rule that picks between the two.
 */
const RECHECKS = new URL('../data/rechecks/', import.meta.url);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

/** @type {any} */
let seeds = null;
const readSeeds = async () => (seeds ??= JSON.parse(await readFile(SEEDS, 'utf8')));

/**
 * @param {string} store
 * @param {string} page
 */
async function urlsFor(store, page) {
  const all = await readSeeds();
  const cell = all.rows.find((row) => row.page === page)?.stores?.[store];
  if (!cell) throw new Error(`No page ${store}/${page} in the seed list.`);
  return { prodUrl: cell.prodUrl, newUrl: cell.newUrl };
}

/**
 * One page, both sites, one fresh observation.
 *
 * Link status is checked on **this page's** targets only, deduplicated within the
 * page, with a cold cache. Ticket 05 forbids a site-wide sweep from a button; the
 * probe did 37 targets in 1.1 seconds, which is a button press.
 *
 * @param {string} store
 * @param {string} page
 */
export async function recheck(store, page) {
  const { prodUrl, newUrl } = await urlsFor(store, page);
  const sides = await extractStorePage({ store, page, prodUrl, newUrl });

  const targets = ['production', 'new'].flatMap((side) =>
    sides[side].links.filter((link) => link.internal).map((link) => link.url),
  );
  const statuses = new Map(Object.entries(await checkAll(targets)));

  const report = comparePage({
    sides,
    newSitePaths: newSitePathsFor(await readSeeds(), store),
    statuses,
    observationId: newObservationId(),
  });

  // Saved before it is answered, so a reload shows what the press showed.
  await mkdir(fileURLToPath(RECHECKS), { recursive: true });
  await writeFile(new URL(reportFilename(store, page), RECHECKS), JSON.stringify(report));

  return report;
}

/**
 * The saved re-check of one page, or `null`.
 *
 * `data/` is not in git, so a missing folder and a missing file are the normal
 * case on a fresh clone. A file that cannot be read is the same answer as no
 * file: the built page still carries the crawl report, and the reader loses
 * nothing.
 *
 * @param {string} store
 * @param {string} page
 */
export async function savedRecheck(store, page) {
  try {
    return JSON.parse(await readFile(new URL(reportFilename(store, page), RECHECKS), 'utf8'));
  } catch {
    return null;
  }
}

/**
 * One writer, and the content type decides what the body already is. A caller that
 * has text says so by calling `sendText`; every other answer is JSON.
 *
 * @param {import('node:http').ServerResponse} response
 */
const write = (response, status, type, body) => {
  response.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  response.end(body);
};

/** @param {import('node:http').ServerResponse} response */
const send = (response, status, body) =>
  write(response, status, 'application/json; charset=utf-8', JSON.stringify(body));

/** @param {import('node:http').ServerResponse} response */
const sendText = (response, status, body) =>
  write(response, status, 'text/plain; charset=utf-8', body);

/**
 * The router, with the work injected. The extraction and the comparison have
 * their own suites and are not re-tested through HTTP — this takes a stub, so
 * the two smoke tests never reach the network.
 *
 * @param {object} deps
 * @param {(store: string, page: string) => Promise<any>} deps.recheck
 * @param {(store: string, page: string) => Promise<any>} [deps.savedRecheck]
 */
export function createApi({ recheck: run, savedRecheck: read = async () => null }) {
  /**
   * @param {import('node:http').IncomingMessage} request
   * @param {import('node:http').ServerResponse} response
   */
  return async function handle(request, response) {
    const { pathname } = new URL(request.url ?? '/', 'http://localhost');

    // Its only job is to exist.
    if (pathname === '/api/health') return send(response, 200, { ok: true });

    if (pathname.startsWith('/api/recheck/')) {
      // A page key can hold a slash (`faq/productinformatie`), so the store is the
      // first segment and the page is everything after it. One parser serves both
      // methods, so the read and the press can never split a key differently.
      const [store, ...rest] = pathname.slice('/api/recheck/'.length).split('/');
      const page = decodeURIComponent(rest.join('/'));
      if (!store || !page) return send(response, 400, { reason: 'Give a store and a page.' });

      // Ticket 71: the saved re-check, never the crawl report. The built page
      // already carries the crawl report, and it holds both extracts.
      if (request.method === 'GET') {
        const saved = await read(store, page);
        return saved
          ? send(response, 200, saved)
          : send(response, 404, { reason: 'No saved re-check.' });
      }

      if (request.method !== 'POST') return send(response, 405, { reason: 'Use POST or GET.' });

      try {
        return send(response, 200, await run(store, page));
      } catch (error) {
        // Ticket 04: production goes into maintenance mode without warning, and a
        // run that records the maintenance page records phantom defects. This is a
        // plain refusal with the reason, never a result.
        if (error instanceof MaintenanceError) {
          return send(response, 503, {
            reason:
              `The site is in maintenance mode (${error.message}). Nothing was compared,` +
              ' because a maintenance page gives hundreds of invented differences.',
          });
        }
        return send(response, 500, { reason: /** @type {Error} */ (error).message });
      }
    }

    if (pathname.startsWith('/api/')) return send(response, 404, { reason: 'Unknown endpoint.' });

    return serveStatic(pathname, response);
  };
}

/** It also serves `dist/`, so one command gives the whole tool locally. */
async function serveStatic(pathname, response) {
  const clean = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
  const candidates = extname(clean)
    ? [clean]
    : [join(clean, 'index.html'), `${clean.replace(/\/$/, '')}.html`];

  for (const candidate of candidates) {
    const file = join(DIST, candidate);
    if (!file.startsWith(DIST)) break;
    try {
      const body = await readFile(file);
      response.writeHead(200, {
        'content-type': MIME[extname(file)] ?? 'application/octet-stream',
      });
      return response.end(body);
    } catch {
      // Try the next shape, then fall through to the 404 below.
    }
  }

  return sendText(
    response,
    404,
    'Not found. Run `npm run build` in the root first, or `npm start`.',
  );
}

if (process.argv[1]?.endsWith('server.mjs')) {
  const port = Number(process.argv[2] ?? process.env.PORT ?? 4321);
  const handle = createApi({ recheck, savedRecheck });

  createServer((request, response) => {
    handle(request, response).catch((error) => send(response, 500, { reason: String(error) }));
  }).listen(port, () => {
    console.log(`Content parity log op http://localhost:${port}`);
    console.log('  GET  /api/health');
    console.log('  POST /api/recheck/<store>/<page>');
    console.log('  GET  /api/recheck/<store>/<page>');
  });
}
