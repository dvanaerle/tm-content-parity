import { describe, expect, it } from 'vitest';
import { backInSearch, findingInSearch, pageHref, recheckPath, storeHref } from './page-url.mjs';

describe('pageHref', () => {
  // The Astro route is a rest parameter, so a slash in the key is a route
  // segment and must survive. `encodeURIComponent` on the whole key would write
  // `%2F` and the link would 404.
  it('keeps a slash in the key as a route segment', () => {
    expect(pageHref('nl', 'faq/productinformatie')).toBe('/nl/faq/productinformatie/');
  });

  // Measured on 2026-08-10: encoding changes **0** of the 550 committed keys, so
  // this is a guard on the input widening and not a repair of a live link. The
  // characters below are what it guards against.
  it('encodes a character that would break the URL', () => {
    expect(pageHref('fr', 'a b')).toBe('/fr/a%20b/');
    expect(pageHref('fr', '100%-glas')).toBe('/fr/100%25-glas/');
    expect(pageHref('fr', 'a#b')).toBe('/fr/a%23b/');
  });

  // The parenthesis is the sentinel precisely because it survives the static
  // route. `encodeURIComponent` leaves it alone, so the href is the built
  // directory name byte for byte.
  it('leaves the unanchored sentinel exactly as the build wrote it', () => {
    expect(pageHref('fr', '(fr)heavy-duty-veranda')).toBe('/fr/(fr)heavy-duty-veranda/');
    expect(pageHref('be_fr', '(be_fr)fr/pergola')).toBe('/be_fr/(be_fr)fr/pergola/');
  });
});

describe('pageHref, asked for a finding', () => {
  // Ticket 101. Clicking a difference on the dashboard used to open the page at the
  // top, and on a 399-row page the difference had to be found again by eye. The link
  // names it, and the page lands on it.
  it('carries the finding id', () => {
    expect(pageHref('nl', 'lighting-system/productinformatie', { finding: 'abc123' }))
      .toBe('/nl/lighting-system/productinformatie/?bevinding=abc123');
  });

  // The screen the editor left, so the way back is that screen and not a bare store.
  // It is a query string inside a query string, so it has to arrive encoded or the
  // page would read the dashboard's own keys as its own.
  it('carries the dashboard it was clicked from, encoded', () => {
    expect(pageHref('nl', 'faq', { finding: 'abc123', back: 'weergave=pages&soort=copy' }))
      .toBe('/nl/faq/?bevinding=abc123&terug=weergave%3Dpages%26soort%3Dcopy');
  });
});

describe('reading a link back', () => {
  // The other end of `pageHref`. What the dashboard wrote, the page reads — and a
  // page reached the ordinary way asked for nothing, which is the common case and
  // must read as null rather than as an empty string somebody has to remember to
  // check.
  it('reads the finding and the way back off a link it wrote', () => {
    const href = pageHref('nl', 'faq', { finding: 'abc123', back: 'weergave=pages&soort=copy' });
    const search = href.slice(href.indexOf('?'));

    expect(findingInSearch(search)).toBe('abc123');
    expect(backInSearch(search)).toBe('weergave=pages&soort=copy');
  });

  it('says null when a link asked for nothing', () => {
    expect(findingInSearch('')).toBe(null);
    expect(backInSearch('')).toBe(null);
    expect(findingInSearch('?bevinding=')).toBe(null);
  });
});

describe('storeHref', () => {
  // The way back. With nothing carried it is the store's own dashboard, which is the
  // link the page header has always drawn.
  it('is the bare dashboard when nothing was carried', () => {
    expect(storeHref('nl')).toBe('/nl/');
    expect(storeHref('nl', null)).toBe('/nl/');
    expect(storeHref('nl', '')).toBe('/nl/');
  });

  it('returns to the screen that was left', () => {
    expect(storeHref('nl', 'weergave=pages&soort=copy')).toBe('/nl/?weergave=pages&soort=copy');
  });
});

describe('recheckPath', () => {
  // `api/server.mjs` reads the store as the first segment and the page as
  // everything after it, then decodes. `api/server.test.mjs` pins the same two
  // literals from the other side, so the round trip is fixed in both directions.
  it('gives the path the re-check service parses', () => {
    expect(recheckPath('nl', 'faq/productinformatie')).toBe(
      '/api/recheck/nl/faq/productinformatie'
    );
    expect(recheckPath('fr', '(fr)heavy-duty-veranda')).toBe(
      '/api/recheck/fr/(fr)heavy-duty-veranda'
    );
  });
});
