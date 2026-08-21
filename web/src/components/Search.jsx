import { useMemo } from 'react';
import Repeats from './Repeats.jsx';
import { PageNote } from './Annotate.jsx';
import { ClassFilterBanner } from './Chips.jsx';
import { Checkbox } from './ui/checkbox.jsx';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from './ui/empty.jsx';
import { Label } from './ui/label.jsx';
import { Separator } from './ui/separator.jsx';
import { CHROME } from '../lib/palette.mjs';
import { STORE_LANGUAGE } from '../lib/stores.mjs';
import { Attribution } from './Attribution.jsx';
import { day } from '../lib/dates.mjs';
import { cn } from '../lib/utils.js';
import { logState } from '../lib/log-read.mjs';
import { explainScope, inScope, searchNotes, searchStore } from '../lib/search.mjs';
import { useSearchIndex } from '../lib/search-index.mjs';
import { siblingOf } from '../lib/language-blocks.mjs';
import { pagesWithClasses } from '../lib/view.mjs';

/**
 * *on 1 page*, and *on 2 pages*.
 *
 * The plural was unconditional in both of the templates that count a search result, so a
 * difference confined to a single page read *on 1 pages*. It is a function and not two
 * inline conditionals because both ask the same question about the same number, and one
 * of them would have been fixed alone.
 *
 * It stays in this file. The interface writes this conditional inline in a dozen other
 * places and unifying all of them is a change of its own; what this closes is the one
 * place where the plural was not conditional at all.
 *
 * @param {number} pages
 */
const onPages = (pages) => `on ${pages} ${pages === 1 ? 'page' : 'pages'}`;

/**
 * What an editor gets for typing words: every finding in the corpus that holds them, across
 * every page, with the pages they are on (ticket 82).
 *
 * **Two sources, two freshnesses**, and the whole of this component's care goes there. The
 * findings come from a file the build wrote, so they are as old as the last build. The
 * notes come from the log the page has open, so they are live. They are drawn as two
 * blocks under two sentences, never as one list — a single list would present two moments
 * as one, and an editor would read the note half as being as stale as the other.
 *
 * The two halves also **arrive** at different moments, and each one says where it is
 * (ticket 123). The findings wait on the index the screen above fetches; the notes wait on
 * the log it opened. Neither holds up the other, and neither draws an empty answer about a
 * source it has not read yet.
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
 * itself.
 *
 * **The page scope is in the strip** (ticket 104 part C), and it is the one part of the term
 * that is: it narrows what is on screen and moves no count, which is the definition of a
 * filter, while the words after it decide what matched at all. So the strip names it and
 * *Clear filter* takes it out of the box, and the words survive that clear.
 *
 * **A leading slash narrows to a page** (ticket 103). The rows are the same repeats and the
 * counts are the same counts of them; what a scope adds on screen is the header saying
 * which pages it matched, because a substring scope often holds several and a merged list
 * with no header reads as one page's work. It is a narrowing of the corpus and not a way
 * into a page: a page name still opens the whole content view (ADR 0006).
 *
 * **It draws two screens and is one component** (ticket 03). A store's search — this store
 * and its sibling, unchanged — and the search above the stores, which reaches all six. The
 * corpus arrives as `index`, already merged, so nothing here knows how many files it came
 * out of. What it does know is `store`: the store this screen is *of*, `null` above them, and
 * the whole of what turns on it is written where it is read:
 *
 * - The **corpus** is this store's block, or the stores the caller names.
 * - Every row **says which store it is on**, because a merged list of six stores' rows is
 *   ambiguous the moment two of them carry `afhalen`, which all six do.
 * - The two **page-list** blocks — which pages a scope reached, and which pages hold the term
 *   in their name — are a store's own answers and are not drawn above the stores. They need
 *   the whole page list, and six stores of page summaries is seven megabytes of island prop
 *   against a corpus that is already in six static files.
 * - **Which rows may be pressed** is the caller's too (ticket 04). A store's search refuses
 *   nothing; above the stores an `images` or `links` row is pressed and a row of translated
 *   words is drawn with its reason instead, through `refusesPress`. Reading is what widened here; ticket 04 is what widens the press.
 *
 * **The index is a prop and the fetch is the caller's** since that ticket. Both screens need
 * it before this component runs — the store's to keep it out of the hands of a visitor who
 * never types, the all-stores screen's because the log it derives has nowhere else to come
 * from — so `useSearchIndex()` sits with each of them and this draws whatever it is handed.
 * `StoreSearch` below is that wrapper for the store screen.
 */
export default function Search({
  store = null,
  index,
  indexError = null,
  pages = [],
  siblingPages = [],
  term,
  classes = [],
  onClearFilters,
  byFinding,
  log,
  includeClosed,
  onIncludeClosed,
  bulk = null,
  refusesPress = null,
  link,
  classLink = null,
}) {
  /*
   * Whether this list spans stores, which is the one question the two screens answer
   * differently. It is *no store of its own* and not *more than one store in the index*: a
   * block store's search reaches two stores and is still `nl`'s screen, drawing `nl`'s page
   * list and speaking Dutch.
   */
  const acrossStores = !store;

  const result = useMemo(
    () =>
      index
        ? searchStore({
            index,
            term,
            classes,
            includeClosed,
            // The log's own answer about a finding. `open` for one the log has not decided,
            // which is also what an unconnected log says about everything.
            stateOf: (id) => byFinding.get(id)?.state ?? 'open',
          })
        : null,
    // The pills are in here, so moving one re-answers the same term against the new
    // selection. An editor who narrows mid-search does not retype.
    [index, term, classes, includeClosed, byFinding],
  );

  // The whole read goes in, and what comes back says which of three things it is
  // (ticket 123). This component does not decide that — an empty list and an unread log
  // look identical from here, which is exactly how the block came to say "no notes"
  // about a log nobody had read yet.
  //
  // The state and not the object: the hook builds a fresh one every render, so a
  // dependency on it would re-scan the whole log on every keystroke elsewhere on the
  // screen. It used to be the four flags spelled out one by one, which hard-coded what
  // `searchNotes` reads and went stale the moment it read a fifth (the review of 123).
  // `logState()` is what it reads them through, so the events and that state are the whole
  // of what this answer depends on.
  const read = logState(log);
  const notes = useMemo(
    () => searchNotes({ log, term }),
    [log.events, read.state, read.ready, read.reason, term],
  );

  // The scope is read off the **result**, which is where `searchStore()` puts it, rather
  // than parsed again here: no second reading of the slash rule free to drift from the one
  // the answer was built with. It is `null` until the index arrives, and nothing below is
  // drawn before then.
  //
  // The dashboard does call `parseTerm()` on the same string, for the chip beside the pills
  // (ticket 104 part C) — it has to, because that chip is drawn before this result exists.
  // That is one rule read twice and not two rules: the guarantee is that `parseTerm()` is
  // the only thing anywhere that knows what a leading slash means.
  const scope = result?.scope ?? null;

  // Which pages the scope reached and which kind of nothing each of them is (ticket 104).
  // Over the store's **whole** page list rather than the index: a page with no open
  // finding is in no index and is still in scope, and a one-sided page is in neither and
  // is one of the answers. It is not narrowed by the pills — it says what the scope
  // matched, and the strip above it says what the classes then cut.
  //
  // The classification is `search.mjs`' and nothing below decides any of it. That is the
  // ticket's own rule and it is the rule the scope itself follows: one string, one parse,
  // one place the answer is made.
  // Over the **block's** page list since ticket 05, because the corpus a scope narrows is
  // the block's index: a scope reaching only the sibling used to answer *no page of this
  // store has that in its key* about a page that exists and holds rows in the list below it.
  // The lists are concatenated rather than merged — each entry carries its own store, and
  // the two stores share page keys, so `store/page` is what tells them apart.
  // Above the stores there is no page list at all, so the four kinds are unanswerable and
  // nothing is drawn: a scope still narrows the corpus there — `searchStore()` does that off
  // the term — and what is missing is only the sentence about a page that answered nothing.
  // Answering it would mean shipping six stores' page summaries, which is the trade the
  // component docblock states.
  const blockPages = useMemo(() => [...pages, ...siblingPages], [pages, siblingPages]);
  const answer = useMemo(
    () => (result && !acrossStores ? explainScope({ pages: blockPages, result }) : null),
    [acrossStores, blockPages, result],
  );

  // The pages whose **name** holds the term, which the removed box used to narrow the
  // page list down to. A page with no open finding is in no result above — it is clean,
  // and clean is the point — so without this list a page could be reached by name before
  // this ticket and not after it. That is a capability the search had to keep, not a
  // second answer: it is the by-page reading of the same term.
  const named = useMemo(() => {
    // Nothing above the stores: the block is the **page list's** answer and there is no page
    // list there. It is skipped and not merely undrawn, so six stores' worth of filtering is
    // not run on every keystroke to be thrown away.
    if (acrossStores) return [];
    // `inScope()` and not a second `includes` written out here: it is the same substring
    // rule over the same page key, and two copies of it would drift the day one of them
    // learns to fold diacritics. The block is not drawn under a scope at all — the header
    // above the list is the by-page reading there — so the raw term is what it matches,
    // and with no scope the raw term is exactly what the parse would have returned.
    // The comparable half only. `pages` is the store's whole list since ticket 104, so
    // that a scope can reach a one-sided page and say so; this block is the **page list's**
    // answer and the page list has never held one. A one-sided page reached by name
    // belongs to the aside, which says why it is there — this block says nothing at all.
    const found = pages.filter((page) => page.comparable && inScope(page.page, term));
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
  }, [acrossStores, pages, term, classes]);

  if (indexError) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">
        A search index was not read ({indexError}). Search works again after a new build.
      </p>
    );
  }

  if (!result)
    return <p className="px-4 py-6 text-sm text-muted-foreground">The search index is loading…</p>;

  return (
    <>
      {/* Above the count, where the two views draw it. The denominator is what the term
          found before the pills cut it, so the strip is about the filter and not about
          the term.

          The scope is named in it since ticket 104 part C, which makes the strip's
          denominator read as *of what the scope reached* rather than *of the store* — and
          that is what it has always been, since a scope narrows the corpus before the term
          runs. The last line still says the counts above count everything.

          *Clear filter* now clears the classes **and** the scope, and nothing else of the
          term: the callback is the caller's, because the search box is. */}
      <ClassFilterBanner
        classes={classes}
        scope={scope}
        shown={result.repeats.length}
        total={result.matchedRepeats}
        noun="differences"
        onClear={onClearFilters}
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
              ? `1 difference ${onPages(result.pages)}`
              : `${result.total} findings ${onPages(result.pages)}`}
          </strong>
          <span className="text-muted-foreground">
            {result.repeats.length > 1 && ` in ${result.repeats.length} differences`}. From the
            snapshot of {day(index.builtAt)} — the counts at the top do not move with it.
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

      <Scope store={store} answer={answer} found={result.repeats.length} link={link} />

      {result.repeats.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted-foreground">No difference with these words.</p>
      ) : (
        <Repeats
          // Remounting is how the selection is dropped, and the key is the whole of that
          // rule: it holds ticks against rows, and a pill — or a scope, or *Include
          // closed* — can take a ticked row out of the list. A selection that outlived the
          // result it was made in would arm a press over rows the editor can no longer
          // see, and at 472 rows that is not a press anybody could check.
          //
          // The scope is inside `term`: it is the leading `/…` of the same typed string,
          // and `parseTerm()` is the only thing that splits them. So all four of the
          // things that narrow this list are in this key.
          key={`${term}|${includeClosed}|${classes.join(',')}`}
          repeats={result.repeats}
          byFinding={byFinding}
          // The language of the scraped strings on every row, which is this store's: a
          // result reaches the sibling store and a block is two stores of one language.
          // Above the stores there is no such answer — six stores speak four languages — so
          // the list gives none and each row answers for itself. See `rowLanguage()`.
          language={store ? STORE_LANGUAGE[store] : null}
          // Every row says which store it is on, and the tick in it names one too.
          acrossStores={acrossStores}
          // *Broken link* on a row opens every broken link there is (ticket 03).
          classLink={classLink}
          // The rows are worst-first on what is left in each difference (ticket 141), and
          // that reading waits for the log: until it has answered, `byFinding` says every
          // finding is open. It is the same `read` the notes half below is drawn on.
          logRead={read.ready}
          bulk={bulk}
          // Which rows this screen may be pressed on, and why the others may not (ticket
          // 04). It is the caller's answer and not this component's: a store's search
          // refuses nothing, and above the stores a difference made of translated words is
          // read and decided elsewhere.
          refusesPress={refusesPress}
          link={link}
          searched
          // The snapshot the rows were built over, so a wide press can name it. The
          // selection straddles two clocks — these rows are the build's, and what a press
          // may act on is the live log's — and that is worth saying out loud once at 472.
          builtAt={index.builtAt}
        />
      )}

      {/* Under a scope the header above is the by-page reading of the same typing, so
          this block would list the same pages a second time. */}
      {scope || acrossStores ? null : <Named store={store} pages={named} link={link} />}
      <Notes result={notes} link={link} acrossStores={acrossStores} />
    </>
  );
}

/**
 * Which pages the scope matched, as a header over the one list (ticket 103).
 *
 * A scope is a **substring** of the page key, so it often holds several pages — `/faq`
 * reaches the family — and the repeats of all of them are merged into one list. Without
 * this line an editor reads that list as one page's work, which is the one way a scope
 * can lie.
 *
 * The pages come from a whole page list and not from the search index, so a page with no open
 * finding is named here too: it is in scope, it is often the page somebody is looking for,
 * and it is in no result. That is the capability the by-name block below carries under an
 * ordinary term, and this is where it lives under a scope.
 *
 * It is the **block's** page list since ticket 05, because the corpus a scope narrows is the
 * block's index, so a line here can be a page of the sibling and says which store it is on.
 *
 * A page name opens the **whole content view** and never a fragment of it — ADR 0006, and
 * this ticket's first trap. A scope narrows the corpus a search runs over; it does not
 * open a page, and this header is not a second reading of one.
 *
 * **The closing line is drawn only when there is a list to close over** (the review of this
 * ticket). A scope can reach pages and still find no open difference on them — a clean
 * family is the ordinary case — and *the differences below are the ones on these pages*
 * printed directly above *no difference with these words* contradicts the sentence under
 * it. The pages are still named, because they are still what the scope matched and they are
 * still worth opening; it is only the promise of a list that goes.
 */
function Scope({ store, answer, found, link }) {
  if (!answer) return null;

  if (answer.state === 'no-such-page')
    return (
      <section className="border-b border-border px-4 py-3">
        <p className="text-sm">
          No page the search reaches has {answer.scope} in its key, so there is nothing to search
          inside. Check the spelling — a page key is not always the name you read on the page.
        </p>
      </section>
    );

  return (
    <section className="border-b border-border px-4 py-3">
      <h3 className="text-sm font-medium">
        {answer.pages.length} {answer.pages.length === 1 ? 'page' : 'pages'} in /{answer.scope}
      </h3>
      <ul className="mt-1 text-sm">
        {answer.pages.map((page) => (
          <li key={`${page.store}/${page.page}`} className="py-0.5">
            {/* The page's **own** store and not the component's. A scope reaches the block
                since ticket 05, so a line here can be a page of the sibling — and a link
                built from the dashboard's store would open a page that is not the one
                named. */}
            <a className={cn('hover:underline', CHROME.link)} href={link(page.store, page.page)}>
              {page.page}
            </a>
            {/* Which store, and only where it is not this one — the same rule the repeat row
                keeps: the marker appears exactly when a page is outside the store an editor
                thinks they are working in, and never once per line for no reader. */}
            {page.store !== store && (
              <span className="ml-2 text-xs text-muted-foreground">on {page.store}</span>
            )}
            <WhyNothing page={page} />
          </li>
        ))}
      </ul>
      {found > 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          The differences below are the ones on these pages, in one list.
        </p>
      )}
    </section>
  );
}

/**
 * Why this page contributed nothing to the list below (ticket 104 part A).
 *
 * One sentence per kind, and the kind is `search.mjs`' decision — this is a lookup over a
 * value and not a second classification. A page that *did* answer says nothing here,
 * because the rows below are what it has to say.
 *
 * The one-sided line does not invent copy. `skipReason` is the aside's own words for why
 * the comparison did not run, and the link points at the aside rather than restating it:
 * two names for one situation is how a vocabulary rots, and the aside had this one first.
 * It also says no more than the aside does — *not compared* is refused for the three **not
 * checked** kinds and **uncompared** is a row and not a page, so a fourth phrasing here
 * would be the rot the previous sentence is guarding against.
 */
function WhyNothing({ page }) {
  if (page.kind === 'matched') return null;

  if (page.kind === 'one-sided')
    return (
      <span className="ml-2 text-muted-foreground">
        Only one site has this page ({page.skipReason}).{' '}
        <a className={cn('hover:underline', CHROME.link)} href="#one-sided-pages">
          One-sided pages
        </a>{' '}
        lists it.
      </span>
    );

  return <span className="ml-2 text-muted-foreground">{NOTHING[page.kind]}</span>;
}

/**
 * What each kind of nothing reads as. The words are the vocabulary's: a **clean** page
 * agrees with production, and a page whose every difference is closed has *nothing left to
 * do* — which is the sentence CONTEXT.md's context marker already uses to keep those two
 * apart.
 */
const NOTHING = {
  clean: 'Compared, and no difference on it.',
  'no-open-work': 'Compared, and every difference on it is closed. Nothing left to do.',
  'no-match': 'Has differences, and none of them holds these words.',
};

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
 * The notes are drawn whatever *include closed* says, and that is deliberate: a dismissal
 * note is the sentence required when **dismissing** something, so most notes there are hang
 * off work that is already closed. Hiding them by default would leave the option switching
 * on a half of the answer that is empty until it is pressed, which is not what *active work
 * by default* is protecting — that rule is about which findings are offered as work.
 *
 * **Two kinds of note are in this list** since ticket 83, and each says which it is. That is
 * the ticket's first trap: a dismissal note explains one judgement about two strings, and a
 * page note explains nothing in particular about a whole page. Drawn identically, an
 * editor reading *“Campagne-update volgt”* under a page name would read it as somebody's
 * reason for accepting a difference. So each line is tagged, and the page note is drawn as
 * `PageNote` draws it everywhere else — quoted, and never labelled as a reason.
 *
 * **A page scope narrows this block with the one above it** (ticket 104 part B), so
 * `/downloads` answers about the downloads page in both halves and not in one. The narrowing
 * is `searchNotes()`' and the heading is a reading of what it narrowed by; nothing here
 * filters. It is also what finally lets the screen say something true about a one-sided
 * page, which has no findings and can never have any.
 *
 * **Drawing nothing is a claim, so it is only made about a log that was read** (ticket
 * 123). This block used to be the array's length and nothing else, so the first moment of
 * a store page and a log that never answered both drew as *there is nothing here* — which
 * an editor reads as *there are no notes about this*, and acts on. The three branches
 * below are the result's own three states, and none of them is inferred from a count. The
 * findings half above is untouched by all of it: a slow log holds up nothing that is
 * already in memory.
 */
function Notes({ result, link, acrossStores = false }) {
  if (result.state === 'reading') return <NotesAside>The override log is loading…</NotesAside>;

  if (result.state === 'failed')
    return (
      <NotesAside>
        The override log was not read ({result.reason}), so this half of the answer is missing.
        Reload the page to try again.
      </NotesAside>
    );

  // `result.notes` and not `result.notes ?? []`. The state above is what says whether there
  // are notes to draw, and a coercion here would put the ticket's own bug back one layer
  // down: an unhandled fourth state would quietly draw the empty block again, which is
  // exactly what the three branches exist to stop (the review of ticket 123).
  const { notes } = result;
  if (notes.length === 0) return null;

  return (
    <>
      <Separator />
      <section className="bg-muted px-4 py-3">
        <h3 className="text-sm font-medium">
          {notes.length} {notes.length === 1 ? 'note' : 'notes'} {narrowedBy(result)}
        </h3>
        <p data-wears="ink" data-tone="info" className="mb-2 text-xs">
          Read from the log now, not from the snapshot. This half is current, and the findings above
          are as old as the last build.
        </p>
        <ul className="text-sm">
          {notes.map((note) => (
            <li
              key={`${note.createdAt}|${note.page}|${note.findingId ?? note.class ?? ''}`}
              className="py-0.5"
            >
              {/* The event's own store and page, and not the component's: an event
                  carries where it was written, and reading it is what keeps the link
                  honest if the two ever disagree. */}
              <a className={cn('hover:underline', CHROME.link)} href={link(note.store, note.page)}>
                {note.page}
              </a>
              {/* Which store the note was written on, above the stores. The page keys are
                  shared, so a note on `afhalen` names nothing on its own in a list holding
                  six stores' — and the notes half crosses them all since ticket 03. On a
                  store's own screen every note is that store's, and printing it once per line
                  would be a word for no reader. */}
              {acrossStores && (
                <span className="ml-2 text-xs text-muted-foreground">on {note.store}</span>
              )}
              {/* A page note is quoted and italic, the way it is drawn on the page and in
                  the store list. A dismissal note is the plain sentence it has always
                  been, and it sits inside the decision it explains. */}
              <Attribution
                action={note.action === 'noted' ? 'page note' : note.action}
                editor={note.editor}
                at={note.createdAt}
                reason={note.action === 'noted' ? <PageNote note={note.note} /> : note.note}
              />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/**
 * What the count above the notes was narrowed by, in its own words (ticket 104 part B).
 *
 * Three phrasings and not one, because *with these words* over a bare scope is a heading
 * naming a search nobody ran: `/downloads` is a search **for a page**, and the words it
 * claims to have matched are not there to be seen. A scope with a term did both, and says
 * both, in the order they were typed.
 *
 * The scope is read off the **result** rather than parsed here — it is `searchNotes()`'
 * answer about its own narrowing, and a second reading of the slash rule up here is exactly
 * what part A's contract exists to prevent.
 */
const narrowedBy = ({ scope, text }) => {
  if (!scope) return 'with these words';
  return text ? `with these words on /${scope}` : `on /${scope}`;
};

/**
 * What the notes half says when it has no matches to say it with.
 *
 * It carries a title of its own, because a reader who does not know a second half exists
 * cannot tell a half that is missing from a half that found nothing — and telling those two
 * apart is the whole of ticket 123.
 *
 * shadcn's `Empty` gives the shape, as ADR 0007's amendment requires of an empty state and
 * as `Ledger.jsx` and `ContentView.jsx` already draw one. It was a hand-rolled `section`
 * until the review of this ticket, copied off the block below it rather than shared with
 * it — two shapes free to drift, and the case the amendment names.
 */
const NotesAside = ({ children }) => (
  <>
    <Separator />
    <Empty className="py-6">
      <EmptyHeader>
        <EmptyTitle>Notes in the log</EmptyTitle>
        <EmptyDescription>{children}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  </>
);

/**
 * The store screen's search: this store's index and its sibling's, fetched, and the answer
 * drawn over them (ticket 05, lifted out of `Search` by ticket 03).
 *
 * It is a wrapper of four lines and it exists for two reasons. The fetch has to happen
 * **only while an editor is searching** — the index is nearly a megabyte per store, and an
 * island prop or a hook in the dashboard would charge every visitor for it — so it belongs in
 * a component the dashboard mounts on a typed term. And it must not happen in `Search`
 * itself, because the screen above the stores derives its whole log from the same index and
 * so has to hold it first.
 *
 * The sibling comes from `siblingOf()`, the same derivation the dashboard's page list goes
 * through, and it is nothing on `de` and `uk` — each is the only store of its language, so
 * they fetch what they always fetched. A store pays for a block only if it is in one, which
 * is ADR 0018's trade in its own shape; ADR 0021 holds what the second file costs.
 */
export function StoreSearch({ store, ...rest }) {
  // The two stores, and never a wider set. The all-stores corpus is a screen of its own and
  // not a dropdown on this one: a control may narrow what is read, and what may be *pressed*
  // is a property of the check.
  const corpus = useMemo(() => [store, siblingOf(store)].filter(Boolean), [store]);
  const { index, error } = useSearchIndex(corpus);

  return <Search store={store} index={index} indexError={error} {...rest} />;
}
