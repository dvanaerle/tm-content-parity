/**
 * The static index files a search scans, fetched in the browser (ticket 82, widened by
 * ticket 03).
 *
 * It is a hook and not an island prop, and that is the whole reason this file exists apart
 * from `search.mjs`: the index is nearly a megabyte per store and every visitor to a
 * dashboard would pay for it, including the ones who never type. It is a static file the
 * build wrote, so one fetch answers every query afterwards and no service is involved.
 *
 * `search.mjs` stays pure and knows nothing about fetching, in the manner
 * `overrides/state.mjs` knows nothing about Supabase. What is here is the wiring and the
 * one rule below.
 */

import { useEffect, useState } from 'react';
import { mergeIndexes } from './search.mjs';

/**
 * The indexes of the named stores, as one index.
 *
 * **A store that did not answer is an error and not a narrower search.** Every fetch is one
 * promise, so a missing file says so instead of quietly answering over five stores — which
 * would be worse for arriving without a message: an editor searching `max.svg` over six
 * stores and getting four of them has no way to tell that from the string being on four.
 * That rule shipped for a block's two files in ticket 05 and it is what generalises here.
 *
 * The result is `mergeIndexes()`', so the caller gets one index whether it named one store
 * or six, and nothing downstream branches on which.
 *
 * @param {string[]} stores The corpus, in the order it should be scanned. A store dashboard
 *   names itself and its sibling; the screen above the stores names all of them.
 * @returns {{ index: import('./search.mjs').SearchIndex | null, error: string | null }}
 *   `index` is `null` while the fetch is out and on a failure, so a caller cannot draw an
 *   empty result over a corpus it has not read.
 */
export function useSearchIndex(stores) {
  const [state, setState] = useState({ index: null, error: null });

  // The **string** and not the array: a caller building `[store, sibling]` inline hands over
  // a new array on every render, and an effect keyed on that identity would re-fetch six
  // files on every keystroke elsewhere on the screen.
  const named = stores.join(',');

  useEffect(() => {
    let live = true;
    setState({ index: null, error: null });
    const read = (one) =>
      fetch(`/search-index/${one}.json`).then((response) =>
        response.ok ? response.json() : Promise.reject(new Error(`${one}: HTTP ${response.status}`)),
      );

    Promise.all(named ? named.split(',').map(read) : [])
      .then((indexes) => {
        if (live) setState({ index: mergeIndexes(indexes), error: null });
      })
      .catch((failure) => {
        if (live) setState({ index: null, error: failure.message });
      });
    return () => {
      live = false;
    };
  }, [named]);

  return state;
}
