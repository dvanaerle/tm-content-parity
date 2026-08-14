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
 * with nothing configured the port cannot be created, which is exactly the state the first
 * case asserts about — a log there is no read of. Nothing is mocked, which the lint rules
 * forbid and which these two cases do not need: what they turn on is the **store list**,
 * and that is a prop.
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

/**
 * The state the fix left unnamed, found by the review of ticket 123: **no store to read**.
 * The effect returned early on an empty store list and left `events` null with no request
 * outstanding, which the notes half reads as *still reading* — forever, for a page it will
 * never read anything for.
 *
 * An empty list is the true answer there, and it is one of the two cases in which an empty
 * notes block is honest: there is no store to ask about, so nothing in the log is about
 * these pages. That is decided **before** whether the log could be reached, which is why
 * this case needs no project: *nothing to read* does not depend on being able to read.
 */
describe('useStoreOverrides, with no store to read', () => {
  it('says the log holds nothing, rather than reading forever', () => {
    const { held, unmount } = renderHook([]);

    expect(held.events).toEqual([]);
    expect(held.ready).toBe(true);
    unmount();
  });
});
