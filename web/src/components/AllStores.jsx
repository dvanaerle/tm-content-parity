import { useMemo } from 'react';
import { ClassFilterPills } from './Chips.jsx';
import { EditorPrompt, LogBanner } from './Progress.jsx';
import Search from './Search.jsx';
import SearchBox from './SearchBox.jsx';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from './ui/empty.jsx';
import { classInfo } from '../lib/classes.mjs';
import { listReading } from '../lib/list-reading.mjs';
import { NO_EDITOR, useBulk, useEditor, useStoreOverrides } from '../lib/overrides.mjs';
import { pageHref } from '../lib/page-url.mjs';
import { pagesOfIndex } from '../lib/search.mjs';
import { useSearchIndex } from '../lib/search-index.mjs';
import { classHref, useScreen } from '../lib/screen-url.mjs';
import { classCounts, toggleIn } from '../lib/view.mjs';

/**
 * One search over every store (ticket 03).
 *
 * An editor who finds `max.svg` on `nl` could not see from there that `de`, `fr` and `uk`
 * hold it too, so they opened each store and searched again — six stores are four searches,
 * and the same false positive is written up four times. This is that search, once.
 *
 * **It is above the stores and not inside one**, which is what its own route says: a result
 * that can return a `uk` row has stopped being a view of `nl`. Nothing here is a store's,
 * and there is no store dropdown — a control may narrow what is *read*, and this screen is
 * already the widest reading there is.
 *
 * **It reads every store and presses on some of them** (ticket 04). The corpus a search runs
 * over and the corpus a press may cross are two different things (`CONTEXT.md`): reading may
 * cross any store because reading moves no count, and pressing may cross only where the
 * **check** makes the two sides the same string. So the two corpora meet here and do not
 * coincide:
 *
 * - An `images` or `links` row is one difference over up to six stores, and one press
 *   dismisses `max.svg` everywhere. That is this screen's reason to exist as a surface an
 *   editor decides on and not only reads.
 * - A `text` or `meta` row is one language block's words. It is drawn, it is **not tickable**,
 *   and it says so: those stores translate their text, and the row is decided on a store's
 *   own screen, where the same difference is the same row.
 *
 * The refusal is this screen's and not the row's, and this screen says so in one word: it
 * names **no store**, and `listReading()` derives the refusal and its sentence from that
 * (ADR 0030). The same `copy` difference is pressed on its dashboard and refused here, and
 * only the screen knows which of the two it is. A per-row tick and a select-all cannot
 * disagree about it, because `Repeats` narrows the selection once, off that one reading.
 *
 * **The index is the corpus and the page list both.** Six static files, fetched together, a
 * partial read an error. It is also what the log is derived over: six stores of page
 * summaries would be seven megabytes of island prop against a corpus that is already in
 * those six files, so `pagesOfIndex()` reads the entries back as the store pages they came
 * off and `useStoreOverrides()` derives what is decided from there. Two consequences worth
 * stating, because both are visible:
 *
 * - Every finding a result can hold is in that derivation, so *Include closed* means here
 *   exactly what it means on a dashboard.
 * - A page with **no work finding** is in no index and so in nothing here. The two
 *   page-list blocks a store's search draws — which pages a scope reached, which pages hold
 *   the term in their name — need the whole list and stay on the store screens.
 *
 * **No number.** There is no bar, no roll-up and no census on this screen, and not because
 * one would be hard: a store is what an editor is responsible for (ticket 38), and six
 * stores' progress on one screen is what that ticket removed. What is here is a result and a
 * count *of the result*.
 */
export default function AllStores({ stores = [] }) {
  /*
   * The same screen contract the dashboard writes, so Back restores this screen and a link
   * carries it. **No new parameter**: a class query is `classes` set with `query` empty,
   * which the contract could already write and read.
   *
   * `view`, `sort` and `priorities` are in the shape and are never set here — they belong to
   * the two views a store has, and `searchFromScreen()` writes none of them off a default
   * screen. So the URL of this one holds a term, the classes and *Include closed*, and
   * nothing that would describe a list this screen does not draw.
   */
  const { screen, patch } = useScreen();
  const { query, classes, includeClosed } = screen;

  const { index, error } = useSearchIndex(stores);

  /**
   * The index read back as store pages, which is what the log is derived over.
   *
   * `[]` until the corpus arrives, which is the honest input rather than a wait: no page is
   * known yet, so nothing is decided about any, and `useStoreOverrides()` answers *no store
   * to read* rather than leaving a read outstanding that never resolves.
   */
  const pages = useMemo(() => (index ? pagesOfIndex(index) : []), [index]);

  /*
   * The log of every store the corpus names. It is one read per store, as the dashboard's is
   * — the hook takes its stores off the pages it is given — and it carries the **editor**,
   * because a press here writes six ordinary events and every one of them is signed.
   */
  const { editor, save } = useEditor();
  const log = useStoreOverrides({ pages, editor });

  // What a press writes with, built by the same function the dashboard's is: this screen is
  // the second surface that presses, and two spellings of that bag is where a field arrives on
  // one screen and not the other.
  const bulk = useBulk(log);

  /**
   * A link into a page, and the one thing it deliberately does not carry: a way back.
   *
   * `BACK_PARAM` is a **store dashboard's** query string — the page header hands it to
   * `storeHref()` — and this screen is not one. Carrying this screen there would send an
   * editor from a `uk` page to `/uk/?classes=broken-link`, which is a filter over one store
   * that nobody chose. Back is what returns here, and the browser already has it: the screen
   * is in the address bar.
   */
  const link = (store, page, finding = null) => pageHref(store, page, { finding });

  /**
   * This screen, as the one reading the list is drawn under (ADR 0030).
   *
   * **No store**, which is the whole of what this screen is: rows that name their store, a
   * row that speaks its own language or none at all, a press over six stores where the check
   * makes the two sides one string, and a row of translated words refused with the sentence
   * saying where to decide it instead. One fact stated here, and the rest derived.
   */
  const reading = useMemo(
    () => listReading({ byFinding: log.byFinding, searched: true, link, classLink: classHref }),
    [log.byFinding],
  );

  /**
   * How many findings of each class the corpus holds, for the number beside each pill.
   *
   * Off the **snapshot** and not off the log, which is the rule every class pill follows: a
   * pill says how much of this kind there is, and that is not a question about what is drawn
   * or about what is decided. It counts the index, which is the whole corpus of this screen,
   * so the number a pill carries and the list it opens are counts of one thing.
   */
  const counts = useMemo(() => {
    /** @type {Record<string, number>} */
    const byClass = {};
    for (const entry of index?.findings ?? []) {
      byClass[entry.class] = (byClass[entry.class] ?? 0) + 1;
    }
    return classCounts(byClass);
  }, [index]);

  // Nothing asked, nothing drawn. It is the same refusal `searchStore()` makes and it is
  // said once here as well, because a screen that landed on an empty result would read as a
  // screen that is broken. Three things open a result: words, a page scope, a class.
  const asked = query.trim().length > 0 || classes.length > 0;

  return (
    <div className="space-y-4">
      <LogBanner
        connected={log.connected}
        notConnectedReason={log.notConnectedReason}
        ready={log.ready}
        error={log.error}
      />

      {/* A press here is signed, so the name is asked for here. It is the dashboard's own
          control and its own sentence, because a decision made on this screen is a decision
          in the same ledger — one written in up to six stores at a time. */}
      <div className="flex flex-wrap items-center gap-2">
        <EditorPrompt editor={editor} save={save} />
        <p className="text-sm text-muted-foreground">
          {editor ? 'A decision made here is recorded under this name.' : NO_EDITOR}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* No page keys to offer: the scope suggestions are a store's own keys, and a scope
            is a substring that cannot name a store. Typing one still narrows — the slash rule
            is `parseTerm()`'s and it runs wherever a term does — and what is missing here is
            only the list of keys to choose from. */}
        <SearchBox value={query} onChange={(next) => patch({ query: next })} pages={[]} />
        <ClassFilterPills
          counts={counts}
          selected={classes}
          onToggle={(cls) => patch({ classes: toggleIn(classes, cls) })}
          // What a press does here, said plainly, because it does two things: with something
          // typed it narrows the answer, and with nothing typed it **is** the question
          // (ticket 09). No count moves either way.
          hint={(cls) => {
            const { label } = classInfo(cls);
            return query.trim()
              ? `Search inside ${label} only, on every store.`
              : `Every ${label} finding, on every store.`;
          }}
        />
      </div>

      <div className="rounded-lg border border-border">
        {asked ? (
          <Search
            // The reading above, which names no store. That is the whole of what this screen
            // is, and everything turning on it — rows that name their store, a row that
            // speaks its own language, the press and the rows it may not reach — is derived
            // there. The two page-list blocks are left undrawn on the same answer.
            reading={reading}
            index={index}
            indexError={error}
            term={query}
            classes={classes}
            onClearFilters={() => patch({ classes: [], query: '' })}
            log={log}
            includeClosed={includeClosed}
            onIncludeClosed={(next) => patch({ includeClosed: next })}
            bulk={bulk}
            link={link}
          />
        ) : (
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyTitle>Search every store</EmptyTitle>
              <EmptyDescription>
                Type the words an editor would read on the page — a filename, a link target, an
                anchor's words, a heading or a page name — or press a class to open every finding
                of that kind. {stores.length} stores are searched at once, and the notes in the log
                are searched with them.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>

    </div>
  );
}
