import { describe, expect, it } from 'vitest';

import { createApi } from './server.mjs';
import { MaintenanceError } from '../crawl/fetch-page.mjs';

/**
 * Two smoke tests, one each way. The extraction and the comparison have their own
 * suites and are deliberately not re-tested through HTTP — the work is stubbed,
 * so nothing here reaches the network.
 */
function call(handle, url, method = 'POST') {
  return new Promise((resolve) => {
    const chunks = [];
    const response = {
      writeHead(status, headers) { this.status = status; this.headers = headers; },
      end(body) {
        if (body) chunks.push(body);
        resolve({ status: this.status, body: JSON.parse(String(chunks.join(''))) });
      },
    };
    handle({ url, method }, response);
  });
}

describe('the re-check endpoint', () => {
  it('answers a fresh report', async () => {
    const handle = createApi({
      recheck: async (store, page) => ({ store, page, observationId: 'later', findings: [] }),
    });
    const { status, body } = await call(handle, '/api/recheck/nl/overkappingen');
    expect(status).toBe(200);
    expect(body).toMatchObject({ store: 'nl', page: 'overkappingen', observationId: 'later' });
  });

  it('reads a page key that holds a slash', async () => {
    // `faq/productinformatie` is a real page key. The store is the first segment
    // and the page is everything after it.
    const handle = createApi({ recheck: async (store, page) => ({ store, page }) });
    const { body } = await call(handle, '/api/recheck/nl/faq/productinformatie');
    expect(body).toMatchObject({ store: 'nl', page: 'faq/productinformatie' });
  });

  it('reads the key of a page that production declares in no Dutch alternate', async () => {
    // More than half of the pages are of this shape (ticket 53). The parenthesis
    // needs no percent encoding, which is why it is the sentinel, so the path the
    // browser builds arrives unchanged. `web/src/lib/page-url.test.mjs` pins the
    // same two literals from the sending side.
    const handle = createApi({ recheck: async (store, page) => ({ store, page }) });
    const { body } = await call(handle, '/api/recheck/fr/(fr)heavy-duty-veranda');
    expect(body).toMatchObject({ store: 'fr', page: '(fr)heavy-duty-veranda' });
  });

  it('refuses on maintenance mode rather than answering with findings', async () => {
    // Ticket 04: a run that records the maintenance page records phantom defects.
    const handle = createApi({
      recheck: async () => { throw new MaintenanceError('https://example.test', 'HTTP 503'); },
    });
    const { status, body } = await call(handle, '/api/recheck/nl/overkappingen');
    expect(status).toBe(503);
    expect(body.reason).toMatch(/maintenance mode/);
    expect(body).not.toHaveProperty('findings');
  });

  it('exists, which is the whole job of the health endpoint', async () => {
    const handle = createApi({ recheck: async () => ({}) });
    expect(await call(handle, '/api/health', 'GET')).toMatchObject({ status: 200 });
  });

  it('rejects a method that is neither POST nor GET', async () => {
    const handle = createApi({ recheck: async () => ({}) });
    expect((await call(handle, '/api/recheck/nl/x', 'DELETE')).status).toBe(405);
  });
});

/**
 * Ticket 71. The saved re-check is read from the same path with GET, so one
 * parser splits the store from the page for both methods and the two can never
 * disagree about `faq/productinformatie`.
 */
describe('the saved re-check endpoint', () => {
  it('answers the saved report', async () => {
    const handle = createApi({
      recheck: async () => ({}),
      savedRecheck: async (store, page) => ({ store, page, builtAt: '2026-08-07T11:00:00.000Z' }),
    });
    const { status, body } = await call(handle, '/api/recheck/nl/faq/productinformatie', 'GET');
    expect(status).toBe(200);
    expect(body).toMatchObject({ store: 'nl', page: 'faq/productinformatie' });
  });

  it('answers 404 when nothing is saved, which is the normal case', async () => {
    // `data/` is not in git. A missing folder and a missing file are what a
    // fresh clone has, and neither is an error.
    const handle = createApi({ recheck: async () => ({}), savedRecheck: async () => null });
    const { status, body } = await call(handle, '/api/recheck/nl/overkappingen', 'GET');
    expect(status).toBe(404);
    expect(body).not.toHaveProperty('findings');
  });

  it('answers 404 when the service was built without a reader', async () => {
    const handle = createApi({ recheck: async () => ({}) });
    expect((await call(handle, '/api/recheck/nl/overkappingen', 'GET')).status).toBe(404);
  });
});
