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

  it('refuses on maintenance mode rather than answering with findings', async () => {
    // Ticket 04: a run that records the maintenance page records phantom defects.
    const handle = createApi({
      recheck: async () => { throw new MaintenanceError('https://example.test', 'HTTP 503'); },
    });
    const { status, body } = await call(handle, '/api/recheck/nl/overkappingen');
    expect(status).toBe(503);
    expect(body.reason).toMatch(/onderhoudsmodus/);
    expect(body).not.toHaveProperty('findings');
  });

  it('exists, which is the whole job of the health endpoint', async () => {
    const handle = createApi({ recheck: async () => ({}) });
    expect(await call(handle, '/api/health', 'GET')).toMatchObject({ status: 200 });
  });

  it('rejects a GET on recheck', async () => {
    const handle = createApi({ recheck: async () => ({}) });
    expect((await call(handle, '/api/recheck/nl/x', 'GET')).status).toBe(405);
  });
});
