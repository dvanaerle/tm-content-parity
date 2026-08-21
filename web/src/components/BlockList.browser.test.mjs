import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import BlockList from './BlockList.jsx';
import { blockReading } from '../lib/blocks.mjs';

/**
 * The language block panel, read back off the rendered list (ticket 07).
 *
 * `blockReading()` decides the order and the counts, and it is tested in Node where it
 * belongs. What is left for a browser is what an editor actually reads: that the pages the
 * migration flattened come first **and say why they are there**, and that a store with
 * nothing flattened is told about the ordering it has and not the one it has not. A
 * sentence gated on a count passes every unit test there is.
 *
 * The reading is built with the real function rather than a literal, so the panel is drawn
 * from the shape the dashboard hands it.
 */

const row = (page, paths) => ({
  page,
  stores: Object.fromEntries(
    Object.entries(paths).map(([store, path]) => [store, { path, provenance: 'sitemap-daily' }]),
  ),
});

const ROWS = [
  row('drifted', { nl: 'drifted', be: 'drifted' }),
  row('levergebied', { nl: 'levergebied', be: 'levergebied' }),
];

const unitsOf = (store, page) =>
  ({
    nl: { drifted: ['a', 'x', 'y', 'z'], levergebied: ['a', 'q'] },
    be: { drifted: ['a', 'b', 'c', 'd'], levergebied: ['a', 'b'] },
  })[store]?.[page] ?? null;

function mount(flatteningOn) {
  const host = document.createElement('div');
  document.body.append(host);
  createRoot(host).render(
    createElement(BlockList, {
      reading: blockReading({ rows: ROWS, store: 'be', unitsOf, flatteningOn }),
    }),
  );
  return host;
}

const pages = (host) => [...host.querySelectorAll('li code')].map((one) => one.textContent);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('the pages the migration flattened', () => {
  it('draws them first, and says beside each one what was flattened', () => {
    let host;
    act(() => {
      host = mount((page) => (page === 'levergebied' ? 2 : 0));
    });

    // `drifted` has the worse agreement share by a distance, and it is not what the
    // migration lost.
    expect(pages(host).slice(0, 2)).toEqual(['levergebied', 'drifted']);
    expect(host.textContent).toContain(
      '2 content units varied between the two stores on production and say one thing on the new site',
    );
    expect(host.textContent).toContain('The pages the migration flattened first');
  });

  it('tells a store with nothing flattened about the order it does have', () => {
    // *Flattened first* on a store where nothing was flattened describes an ordering the
    // reader cannot see, which is worse than not mentioning it.
    let host;
    act(() => {
      host = mount(() => 0);
    });

    expect(pages(host).slice(0, 2)).toEqual(['drifted', 'levergebied']);
    expect(host.textContent).toContain('Worst first');
    expect(host.textContent).not.toContain('flattened');
  });
});
