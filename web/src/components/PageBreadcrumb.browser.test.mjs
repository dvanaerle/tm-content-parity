import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import PageBreadcrumb from './PageBreadcrumb.jsx';

/**
 * The breadcrumb in a real browser (ticket 109).
 *
 * It is here rather than in a node test because the whole of its behaviour is *reading the
 * address bar and putting the answer in an href*. That is the one seam in this change where
 * a value a stranger controls reaches the DOM, so it is worth pinning from the outside — the
 * laundering itself is a pure round trip and `screen-url.test.mjs` pins that separately.
 */

/** The store rung: the middle one, and the only one that carries anything. */
function storeRung() {
  return [...document.querySelectorAll('nav a')].find((a) => a.textContent.trim() === 'nl');
}

function mount() {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() => root.render(createElement(PageBreadcrumb, { store: 'nl', page: 'faq/productinformatie' })));
  return () => act(() => root.unmount());
}

afterEach(() => {
  history.replaceState(null, '', location.pathname);
  document.body.innerHTML = '';
});

describe('PageBreadcrumb', () => {
  it('returns to the screen the editor left', () => {
    history.replaceState(null, '', '?bevinding=a1&terug=weergave%3Dpages%26soort%3Dcopy');

    const unmount = mount();

    expect(storeRung().getAttribute('href')).toBe('/nl/?weergave=pages&soort=copy');
    unmount();
  });

  // A page opened straight from a URL carries no screen, and the rung is then the link the
  // header has always drawn.
  it('is the bare dashboard when the link carried no screen', () => {
    const unmount = mount();

    expect(storeRung().getAttribute('href')).toBe('/nl/');
    unmount();
  });

  // The seam this file exists for. `terug` is a query string that travelled through a link
  // and came back off the address bar, so anyone can put anything in it. What reaches the
  // href is only ever the keys this dashboard has.
  it('launders a terug value a stranger wrote', () => {
    history.replaceState(
      null,
      '',
      '?terug=' + encodeURIComponent('weergave=pages&onbekend=x&script=<img src=x onerror=alert(1)>'),
    );

    const unmount = mount();

    expect(storeRung().getAttribute('href')).toBe('/nl/?weergave=pages');
    unmount();
  });

  // The current page is the last rung and it is **not** a link: it is where the reader
  // already is, and a link back to here would be a click that does nothing.
  it('names the page without linking to it', () => {
    const unmount = mount();

    const last = document.querySelector('[data-slot="breadcrumb-page"], [aria-current="page"]');
    expect(last?.textContent.trim()).toBe('faq/productinformatie');
    expect(last?.tagName).not.toBe('A');
    unmount();
  });
});
