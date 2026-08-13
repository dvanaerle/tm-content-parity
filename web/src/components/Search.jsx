import { useEffect, useMemo, useState } from 'react';
import Repeats from './Repeats.jsx';
import { ClassFilterBanner } from './Chips.jsx';
import { Checkbox } from './ui/checkbox.jsx';
import { Label } from './ui/label.jsx';
import { Separator } from './ui/separator.jsx';
import { CHROME, INK } from '../lib/palette.mjs';
import { cn } from '../lib/utils.js';
import { searchNotes, searchStore } from '../lib/search.mjs';
import { pagesWithClasses } from '../lib/view.mjs';

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
 * The rows are **repeats**, drawn by the component the *Repeats* view draws, so a
 * search row and a repeats row are the same row with the same marks and the same bar. It
 * is one derivation on screen twice and not a second surface.
 *
 * **The class pills survive a term** (ticket 102). A search answers past the two views,
 * but a class filter is not a view: it is the editor's answer to *which kind of
 * difference am I working on*, and a second question does not withdraw it. So `classes`
 * arrives here, the result is narrowed by it, and the amber strip is drawn over that
 * result for as long as it is on.
 *
 * *Include closed* is not part of that. It is search-only, it says what counts as a
 * result rather than what is on screen, and it stays out of the strip — as does the term
 * itself, which becomes a filter deliberately in ticket 106 and not by accident here.
 */
export default function Search({
  store, pages, term, classes = [], onClearClasses, byFinding, events,
  includeClosed, onIncludeClosed, bulk, link,
}) {
  const { index, error } = useSearchIndex(store);

  const result = useMemo(
    () => (index ? searchStore({
      index,
      term,
      classes,
      includeClosed,
      // The log's own answer about a finding. `open` for one the log has not decided,
      // which is also what an unconnected log says about everything.
      stateOf: (id) => byFinding.get(id)?.state ?? 'open',
    }) : null),
    // The pills are in here, so moving one re-answers the same term against the new
    // selection. An editor who narrows mid-search does not retype.
    [index, term, classes, includeClosed, byFinding],
  );

  const notes = useMemo(() => searchNotes({ events, term }), [events, term]);

  // The pages whose **name** holds the term, which the removed box used to narrow the
  // page list down to. A page with no open finding is in no result above — it is clean,
  // and clean is the point — so without this list a page could be reached by name before
  // this ticket and not after it. That is a capability the search had to keep, not a
  // second answer: it is the by-page reading of the same term.
  const named = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const found = pages.filter((page) => page.page.toLowerCase().includes(needle));
    // The pills narrow this half through the derivation the page list itself narrows
    // by, rather than through a second reading of what a class filter means.
    //
    // It reads `summary.byClass`, which is the snapshot's count and knows nothing of the
    // log — so a page whose only `copy` finding is already dismissed still lists under a
    // `copy` pill, while the result above it does not. That is deliberate: this block is
    // the page list's answer and it is narrowed exactly as the page list is. A clean page
    // is the whole reason the block exists, and a version of it that read the log would
    // hide the pages it is here to keep reachable.
    return pagesWithClasses(found, classes);
  }, [pages, term, classes]);

  if (error) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">
        The search index of this store was not read ({error}). Search works again after a
        new build.
      </p>
    );
  }

  if (!result) return <p className="px-4 py-6 text-sm text-muted-foreground">The search index is loading…</p>;

  return (
    <>
      {/* Above the count, where the two views draw it. The denominator is what the term
          found before the pills cut it, so the strip is about the filter and not about
          the term — and *clear filter* clears the classes and leaves the term alone. */}
      <ClassFilterBanner
        classes={classes}
        shown={result.repeats.length}
        total={result.matchedRepeats}
        noun="differences"
        onClear={onClearClasses}
        className="border-b px-4 py-2"
      />

      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border px-4 py-3">
        <p className="text-sm">
          {/* The count of the result and nothing else. Search narrows and moves no
              count, so the chips above still count every comparable page.

              The finding count is drawn only when the result holds more than one
              difference. Inside one repeat the page is a term of the finding id, so
              *how many findings* and *how many pages* are one number, and printing
              both is the doubled figure CONTEXT.md forbids. A one-difference result
              says what its own row says: how many pages. */}
          <strong className="font-medium">
            {result.repeats.length === 1
              ? `1 difference on ${result.pages} pages`
              : `${result.total} findings on ${result.pages} pages`}
          </strong>
          <span className="text-muted-foreground">
            {result.repeats.length > 1 && ` in ${result.repeats.length} differences`}
            . From the snapshot of {new Date(index.builtAt).toLocaleDateString('en-GB')} —
            the counts at the top do not move with it.
          </span>
        </p>

        <Label className="gap-1 text-sm font-normal text-muted-foreground">
          <Checkbox
            checked={includeClosed}
            onCheckedChange={(checked) => onIncludeClosed(checked)}
          />
          Include closed
        </Label>
      </div>

      {result.repeats.length === 0
        ? <p className="px-4 py-6 text-sm text-muted-foreground">No difference with these words.</p>
        : (
          <Repeats
            // The classes are in the key for the reason the term is: `OneSelection`
            // holds ticks against rows, and a pill can take the ticked row out of the
            // list. A selection that outlived the result it was made in would arm a
            // press over rows the editor can no longer see.
            key={`${term}|${includeClosed}|${classes.join(',')}`}
            repeats={result.repeats}
            byFinding={byFinding}
            bulk={bulk}
            link={link}
            searched
          />
        )}

      <Named store={store} pages={named} link={link} />
      <Notes notes={notes.notes} link={link} />
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
/**
 * The pages of this store whose name holds the term, as links to open.
 *
 * This is what the removed box did, kept: it matched a page name and narrowed the page
 * list so an editor could open one. A clean page appears in no finding result, so this is
 * the only block that can carry it, and losing it would have made a page unreachable by
 * name. No count beside a name — the page list is where a page's numbers are.
 */
function Named({ store, pages, link }) {
  if (pages.length === 0) return null;

  return (
    <>
      <Separator />
      <section className="px-4 py-3">
        <h3 className="text-sm font-medium">
          {pages.length} {pages.length === 1 ? 'page has' : 'pages have'} this name
        </h3>
        <ul className="mt-1 flex flex-wrap gap-x-3 text-sm">
          {pages.map((page) => (
            <li key={page.page}>
              <a className={cn('hover:underline', CHROME.link)} href={link(store, page.page)}>
                {page.page}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/**
 * The notes are drawn whatever *include closed* says, and that is deliberate: a note
 * is the sentence required when **dismissing** or muting something, so nearly every note
 * there is hangs off work that is already closed. Hiding them by default would leave the
 * option switching on a half of the answer that is empty until it is pressed, which is not
 * what *active work by default* is protecting — that rule is about which findings are
 * offered as work.
 */
function Notes({ notes, link }) {
  if (notes.length === 0) return null;

  return (
    <>
      <Separator />
      <section className="bg-muted px-4 py-3">
        <h3 className="text-sm font-medium">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'} with these words
        </h3>
        <p className={cn('mb-2 text-xs', INK.info)}>
          Read from the log now, not from the snapshot. This half is current, and the
          findings above are as old as the last build.
        </p>
        <ul className="text-sm">
          {notes.map((note) => (
            <li key={`${note.createdAt}|${note.page}|${note.findingId ?? note.class ?? ''}`} className="py-0.5">
              {/* The event's own store and page, and not the component's: an event
                  carries where it was written, and reading it is what keeps the link
                  honest if the two ever disagree. */}
              <a className={cn('hover:underline', CHROME.link)} href={link(note.store, note.page)}>
                {note.page}
              </a>
              <span className="ml-2 text-muted-foreground">{note.note}</span>
              <span className="ml-2 text-xs text-muted-foreground">
                {note.editor}, {new Date(note.createdAt).toLocaleDateString('en-GB')}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
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
    fetch(`/search-index/${store}.json`)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(`HTTP ${response.status}`))))
      .then((index) => { if (live) setState({ index, error: null }); })
      .catch((failure) => { if (live) setState({ index: null, error: failure.message }); });
    return () => { live = false; };
  }, [store]);

  return state;
}
