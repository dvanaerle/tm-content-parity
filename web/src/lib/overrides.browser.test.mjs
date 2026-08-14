import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { useStoreOverrides } from './overrides.mjs';

/**
 * The one rule of this module, at the seam that broke it (ticket 123).
 *
 * `overrides.mjs` opens by saying that a failed read is never an empty list: `events`
 * stays `null` until a read succeeds, because an empty list means "nobody has done
 * anything" and a failure must never say that. The hook kept the rule everywhere except
 * on the one field that hands the events out — it flattened `events ?? []` for its single
 * reader, which is the notes half of a search, and that half then drew "no notes" about a
 * log nobody had read.
 *
 * It is a browser test because a hook needs a renderer, and it needs no Supabase project:
 * with nothing configured the port cannot be created, which is exactly the state this
 * asserts about — a log there is no read of.
 */

/** The hook's return, captured from a render. */
function renderHook(pages) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  let held;

  const Probe = () => {
    held = useStoreOverrides({ pages, editor: 'Dennis' });
    return null;
  };

  act(() => root.render(createElement(Probe)));
  return { held, unmount: () => act(() => root.unmount()) };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('useStoreOverrides, before a read has succeeded', () => {
  it('hands out no events at all, rather than an empty list of them', () => {
    const { held, unmount } = renderHook([{ store: 'nl', page: 'afhalen', findings: [] }]);

    // Null and not `[]`. The difference is the whole ticket: one says the log has not
    // been read and the other says it holds nothing.
    expect(held.events).toBeNull();
    expect(held.ready).toBe(false);
    unmount();
  });
});
