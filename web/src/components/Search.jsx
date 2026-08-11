import { useEffect, useMemo, useState } from 'react';
import Repeats from './Repeats.jsx';
import { CHROME, INK } from '../lib/palette.mjs';
import { pageHref } from '../lib/page-url.mjs';
import { searchNotes, searchStore } from '../lib/search.mjs';

/**
 * What an editor gets for typing words: every finding in this store that holds them,
 * across every page, with the pages they are on (ticket 82).
 *
 * **Two sources, two freshnesses**, and the whole of this component's care goes there. The
 * findings come from a file the build wrote, so they are as old as the last build. The
 * notes come from the log the page has open, so they are live. They are drawn as two
 * blocks under two sentences, never as one list — a single list would present two moments
 * as one, and an editor would read the note half as being as stale as the other.
 *
 * The rows are **repeats**, drawn by the component the *Verschillen* view draws, so a
 * search row and a repeats row are the same row with the same marks and the same bar. It
 * is one derivation on screen twice and not a second surface.
 */
export default function Search({ store, term, byFinding, events, includeClosed, onIncludeClosed }) {
  const { index, error } = useSearchIndex(store);

  const result = useMemo(
    () => (index ? searchStore({
      index,
      term,
      includeClosed,
      // The log's own answer about a finding. `open` for one the log has not decided,
      // which is also what an unconnected log says about everything.
      stateOf: (id) => byFinding.get(id)?.state ?? 'open',
    }) : null),
    [index, term, includeClosed, byFinding],
  );

  const notes = useMemo(() => searchNotes({ events, term }), [events, term]);

  if (error) {
    return (
      <p className="px-4 py-6 text-sm text-slate-500">
        De zoekindex van deze winkel is niet gelezen ({error}). Zoeken werkt weer na een
        nieuwe build.
      </p>
    );
  }

  if (!result) return <p className="px-4 py-6 text-sm text-slate-500">Zoekindex wordt geladen…</p>;

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <p className="text-sm">
          {/* The count of the result and nothing else. Search narrows and moves no
              count, so the chips above still count every comparable page. */}
          <strong className="font-medium">
            {result.total} bevindingen op {result.pages} pagina's
          </strong>
          <span className="text-slate-500">
            {' '}in {result.repeats.length} verschillen. Uit de snapshot van{' '}
            {new Date(index.builtAt).toLocaleDateString('nl-NL')} — de getallen bovenaan
            veranderen niet mee.
          </span>
        </p>

        <label className="flex items-center gap-1 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={includeClosed}
            onChange={(event) => onIncludeClosed(event.target.checked)}
          />
          Inclusief afgesloten
        </label>
      </div>

      {result.repeats.length === 0
        ? <p className="px-4 py-6 text-sm text-slate-500">Geen verschil met deze woorden.</p>
        : <Repeats key={`${term}|${includeClosed}`} repeats={result.repeats} byFinding={byFinding} />}

      <Notes store={store} notes={notes.notes} />
    </>
  );
}

/**
 * The notes in the log that hold the same words, under their own heading and their own
 * sentence about how fresh they are.
 *
 * Apart from the findings above because they are a different moment, and the ticket forbids
 * presenting the two as one. There is no page-note feature in the log yet: these are the
 * sentences an editor gave when dismissing or muting something, which are the notes there
 * are to search.
 */
function Notes({ store, notes }) {
  if (notes.length === 0) return null;

  return (
    <section className="border-t border-slate-200 bg-slate-50 px-4 py-3">
      <h3 className="text-sm font-medium">
        {notes.length} {notes.length === 1 ? 'notitie' : 'notities'} met deze woorden
      </h3>
      <p className={`mb-2 text-xs ${INK.info}`}>
        Nu uit het log gelezen, niet uit de snapshot. Deze helft is dus actueel en de
        bevindingen hierboven zijn zo oud als de laatste build.
      </p>
      <ul className="text-sm">
        {notes.map((note) => (
          <li key={`${note.createdAt}|${note.page}|${note.findingId ?? note.class ?? ''}`} className="py-0.5">
            <a className={`hover:underline ${CHROME.link}`} href={pageHref(store, note.page)}>
              {note.page}
            </a>
            <span className="ml-2 text-slate-700">{note.note}</span>
            <span className="ml-2 text-xs text-slate-400">
              {note.editor}, {new Date(note.createdAt).toLocaleDateString('nl-NL')}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The store's index, fetched the first time someone searches.
 *
 * Not an island prop: the index is over a megabyte and every visitor to the dashboard
 * would pay for it, including the ones who never type. It is a static file the build
 * wrote, so one fetch answers every query afterwards and no service is involved.
 *
 * Per store, and there is no version of this that takes several — ticket 38 settled that
 * there is no all-stores surface.
 */
function useSearchIndex(store) {
  const [state, setState] = useState({ index: null, error: null });

  useEffect(() => {
    let live = true;
    setState({ index: null, error: null });
    fetch(`/zoekindex/${store}.json`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((index) => { if (live) setState({ index, error: null }); })
      .catch((failure) => { if (live) setState({ index: null, error: failure.message }); });
    return () => { live = false; };
  }, [store]);

  return state;
}
