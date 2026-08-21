import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Detail,
  FirstSeen,
  HistoryNote,
  Locate,
  Occurrences,
  Tag,
  onePageHint,
} from './Annotations.jsx';
import { locationUrl, unitLocation } from '../../../compare/locate.mjs';
import { ClassFilterPills, ClassPill, FilterBanner } from './Chips.jsx';
import { DiffCells, DiffHeads, SIDES } from './Diff.jsx';
import { Hint } from './Hint.jsx';
import { Marker, MarkerToggle } from './Marker.jsx';
import { Empty, EmptyDescription, EmptyHeader } from './ui/empty.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx';
import { cn } from '../lib/utils.js';
import { CHROME } from '../lib/palette.mjs';
import { STORE_LANGUAGE } from '../lib/stores.mjs';
import { landedRowProps, landingRow, useLandOn } from '../lib/landing.mjs';
import {
  NO_FILTER,
  allDiagnostic,
  collapseRuns,
  collapseState,
  collapsedKeys,
  isNarrowed,
  outlineFrom,
  prepareRows,
  rowKeyFromHash,
  runKeyHolding,
  toggleClass,
  toggleIn,
} from '../lib/view.mjs';

/**
 * The content view: the whole page, filtered, tickable (ticket 36).
 *
 * Diff and Content answered half a question each. Diff showed only the differing
 * rows, so once ticket 35 tinted them every row was coloured and the colour carried
 * no signal. Content showed two blocks of flat Markdown with no diff at all. This
 * component is the two of them merged: **every unit in document order**,
 * production and the new site side by side, matched rows calm and changed rows
 * coloured, so a difference is found by scanning rather than by reading.
 *
 * **The unit table is the spine, and Markdown is an export.** Markdown flattens
 * the unit identity the finding id depends on, so it can never be the spine — but
 * an editor pasting a whole page into Magento wants it, and the two download links
 * are where it lives now.
 *
 * **It opens on the open work** (tickets 79 and 48, ADR 0006). Each run of blocks with
 * nothing left on them is one **context marker** naming how many it holds, and the
 * marker expands. Nobody scrolls past 47 identical paragraphs to reach the next
 * difference, nobody re-reads the work they finished an hour ago, and nobody loses the
 * ability to see where a missing line belonged. This is **not a view mode**: it is one
 * order with a collapse in it. Nothing is reordered, nothing is filtered away, and the
 * heading outline still names the same places.
 *
 * What is on screen is `view.mjs`'s decision, not this component's. The filter is
 * the judgement in this feature and it is pure and tested; this file is the pixels.
 */
export default function ContentView({ report, findings, showDiagnostics, control, landing }) {
  const [filter, setFilter] = useState(NO_FILTER);
  const [openRuns, setOpenRuns] = useState([]);
  const { production, new: next } = report.sides;

  const { rows, all, total, classes } = useMemo(
    () =>
      prepareRows({
        rows: report.rows,
        findings,
        elements: { production: production.elements, new: next.elements },
        filter,
        showDiagnostics,
      }),
    [report.rows, findings, production, next, filter, showDiagnostics],
  );

  const outline = useMemo(() => outlineFrom(rows), [rows]);

  /*
   * The row a link landed on (ticket 109).
   *
   * The link names a finding and this view is a list of rows, so `landingRow()` does the
   * translation and the row's **own** anchor is what is scrolled to — the same anchor an
   * outline link uses and a reader copies. Nothing is filtered: the row arrives with the
   * rows around it in document order, which is the question a one-sided difference asks
   * and the reason ADR 0006 keeps this view whole.
   */
  const landed = useMemo(() => landingRow(rows, landing?.focus ?? null), [rows, landing]);
  const narrowed = isNarrowed(filter);

  // How many rows the diagnostics control is holding back, which is the difference between a
  // page nothing was extracted from and a page whose every block the reader asked not to
  // see. `total` is what the control left; `report.rows` is what the page has.
  const withheld = report.rows.length - total;

  /*
   * The collapse set, taken **when the page opens** (ticket 48).
   *
   * A row collapses when it holds no open work, and a tick is the thing that changes
   * that answer. Asking again on every render would move the page under the reader at
   * the moment they act on it: on a 168-row page an editor working top-down loses their
   * place at every tick, and cannot look at what they have just claimed. So the set is
   * taken once and held, and the ticked row stays where they left it and joins its run
   * the next time the page is opened. There is no recompute control — *Show agreeing
   * blocks* already gives every run back, and a second one was refused for want of any
   * evidence it is wanted.
   *
   * It is taken from `all` and never from `rows`: a filter decides what is drawn and
   * never what holds open work, and a set taken through one would leave every row
   * outside it unable to collapse for as long as the view stood.
   *
   * It is keyed on the **page** and not on the report object, which a parent may build
   * fresh on any render. A different page is a different document whose anchors are
   * counted from zero again, so a set carried into it would collapse rows by
   * coincidence. The diagnostics control is in the key for the other half of that: it changes
   * which rows the page **has**, and a row that was not there when the set was taken
   * could never collapse. Neither is a tick, which is the one thing this must not
   * follow — and opening the view again, by a tab or by a link, is opening the page.
   */
  const page = `${report.store}/${report.page}/${showDiagnostics}`;
  const [taken, setTaken] = useState(() => ({ page, collapsed: collapsedKeys(all) }));
  const collapsed = taken.page === page ? taken.collapsed : collapsedKeys(all);
  if (taken.page !== page) setTaken({ page, collapsed });

  /*
   * The row a jump named (ticket 79, handed over by 68).
   *
   * A jump is a request to read one row, so the run holding it opens with it — a saved
   * link and an outline entry must not land on a marker. The hash is read in an effect
   * rather than at first render because this component is server-rendered as well, and
   * there is no `location` there. It is given the same collapse set the markers were
   * drawn from, or it would name a run the document does not hold.
   */
  const hashRow = useHashRow();
  const jumped = landed ?? hashRow;
  const jumpedRun = runKeyHolding(rows, jumped, collapsed);

  /*
   * The jump **seeds** the open runs, and it does not hold them open.
   *
   * Holding them was a second answer about one marker, and a second answer is a state
   * the chevron cannot leave: a press took the key out of `openRuns` and the jump put it
   * straight back, so a run a reader arrived in could never be shut again while the
   * address stood — and *Show agreeing blocks* could not close it either. Seeding says
   * the same thing once: the run opens, and from then on the reader's controls are the
   * only thing that answers for it.
   *
   * It is set **during the render** and not in an effect, which is React's own way to
   * adjust state when an input changes. The run has to be open in the commit the browser
   * lands in — an effect would run after it, and `useLandOn()` would go looking for a row
   * that is not in the document yet.
   */
  const [seeded, setSeeded] = useState(null);
  if (jumpedRun !== seeded) {
    setSeeded(jumpedRun);
    if (jumpedRun) setOpenRuns((held) => (held.includes(jumpedRun) ? held : [...held, jumpedRun]));
  }

  const items = useMemo(
    () => collapseRuns(rows, { open: openRuns, collapsed }),
    [rows, openRuns, collapsed],
  );
  const { markers, allOpen, everythingCollapsed, everythingAgrees } = collapseState(items);

  /*
   * One scroll, to the one row a jump named.
   *
   * `landed ?? hashRow` is what makes it one: a finding link and a bare `#p12` are two
   * ways of asking for a row, the link wins where both are there, and the answer is one
   * anchor. It was two calls — one here for the hash and one in `Rows` for the landing —
   * which left *do not scroll twice* stated as a ternary in the first and implied by the
   * argument of the second.
   *
   * The run holding the row opened in the render above, so the row is in the document by
   * the time this runs.
   */
  useLandOn(jumped, landing?.settled ?? true);

  /*
   * What language the scraped text on this page is in (ticket 125), read once from the
   * store this report is of and handed to the two surfaces that draw that text: the jump
   * list and the rows. It is not the interface's language — everything else on this screen
   * is English on every store (ADR 0014).
   */
  const language = STORE_LANGUAGE[report.store];

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <Outline entries={outline} language={language} />

      <div className="min-w-0 flex-1">
        <Controls
          classes={classes}
          filter={filter}
          setFilter={setFilter}
          markers={markers}
          allOpen={allOpen}
          setOpenRuns={setOpenRuns}
          production={production}
          next={next}
          page={report.page}
          store={report.store}
        />

        {narrowed && (
          <FilterBanner
            onClear={() => setFilter(NO_FILTER)}
            className="mb-3 rounded border px-3 py-2"
          >
            <strong>Filtered.</strong>
            You see {rows.length} of {total} rows. This is not the whole page.
          </FilterBanner>
        )}

        <BlockCounts production={production.elements.length} next={next.elements.length} />

        {rows.length === 0 ? (
          <Empty className="py-6">
            <EmptyHeader>
              {/* The reason it is empty, and not the fact (ADR 0019). *No rows in this
                  filter* was the only thing it said, and there are three causes: a filter, a
                  page whose every block is a diagnostic the reader switched off, and a page
                  nothing was extracted from. They are opposite answers, and only the first
                  two are one press from being undone.

                  **The filter comes first**, and it takes more reaching than it looks. The
                  class pills are built from the rows on screen, so a class an editor can pick
                  always has one — but the pills are read under the diagnostics control while
                  the pick is held in this component's own state, so choosing a diagnostic
                  class and then switching diagnostics off empties the list with the filter
                  still set. Naming the control there would be a false sentence about a page
                  that has plenty of blocks. */}
              <EmptyDescription>
                {narrowed
                  ? `No row on this page is in the classes you filtered on. The page has ${total}.`
                  : withheld > 0
                    ? allDiagnostic({ count: withheld, noun: 'block' })
                    : 'Nothing was extracted from either side of this page, so there is nothing to compare.'}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {/* A collapsed run can be the whole page, and then the table is one marker
                and nothing else. Without this it reads as a view that failed to load
                rather than as a page with nothing left on it. The marker stays below,
                because the blocks are still there and still worth opening.

                **Two pages end this way and they are not the same page** (ticket 48).
                One was clean when it was crawled. The other is a page an editor worked
                through, where every difference is still there and every one of them is
                closed — which is what finishing looks like, and it must not be told it
                agrees with production. */}
            {everythingCollapsed && (
              <p className="mb-3 text-sm text-muted-foreground">
                {everythingAgrees
                  ? 'Nothing differs on this page. Every block agrees with production.'
                  : 'Nothing left to do on this page. Every finding on it is closed.'}
              </p>
            )}
            <Rows
              items={items}
              control={control}
              sides={report.sides}
              language={language}
              landed={landed}
              onToggleRun={(key) => setOpenRuns((held) => toggleIn(held, key))}
            />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * The class filter, the expand-all control and the Markdown export.
 *
 * The chips count **rows** and never findings. A grouped finding is one finding
 * over several rows, so the two numbers differ on purpose, and the word on the
 * tooltip is what keeps them apart. Nothing here moves a bar: `view.mjs` returns no
 * number a bar could be built from.
 *
 * *Differences only* stood here until ticket 79 and it is gone. It **narrowed** the
 * view — it dropped the agreeing rows outright — and the view now opens on the
 * differences by itself, with those rows one click away behind a marker. A box that
 * removed them would take away the only answer a one-sided finding has to *where does
 * this text belong*, and it sat next to a class filter counting rows, which is exactly
 * the pair a reader could mistake for one that moves a count. What replaces it opens
 * every marker at once, which is the same want said as a collapse instead of a filter.
 */
function Controls({
  classes,
  filter,
  setFilter,
  markers,
  allOpen,
  setOpenRuns,
  production,
  next,
  page,
  store,
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <ClassFilterPills
        counts={classes}
        selected={filter.classes}
        onToggle={(cls) => setFilter(toggleClass(filter, cls))}
        hint={(_cls, count) => `${count} rows in this class. The counts above do not change.`}
      />

      <MarkerToggle
        markers={markers}
        allOpen={allOpen}
        agreesWith="production"
        onOpen={setOpenRuns}
      />

      <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
        Markdown:
        <Export markdown={production.markdown} name={`${store}-${slug(page)}-production.md`}>
          production
        </Export>
        <Export markdown={next.markdown} name={`${store}-${slug(page)}-new.md`}>
          new site
        </Export>
      </span>
    </div>
  );
}

const slug = (page) => page.replaceAll('/', '-');

/**
 * How many blocks each side holds, **where the blocks are** (ADR 0019).
 *
 * It was two of the five facts in the page header, beside a status code and a boundary, and
 * a header reciting the content view's business is the header competing with the page key
 * for the one glance an editor has. The rows of this table **are** the blocks, so the count
 * belongs at the head of the list it counts — the same relocation the dashboard's one-sided
 * and not-checked counters made to the lists they describe.
 *
 * It is a **relocation and not a removal**: the fact is one tab away from every screen it
 * was on before, and this pass's standing rule is that a fact is never silently absent.
 *
 * The two sides are named in the pair `Diff.jsx` holds, and not in a third copy of the
 * words. They are two counts and **not a comparison** — a side having fewer blocks is not a
 * finding, and the rows below are where the difference between them is drawn — so this takes
 * no tint, no diff hue and no `Comparison`.
 */
const BlockCounts = ({ production, next }) => (
  <p className="mb-3 text-xs text-muted-foreground">
    {SIDES.production} <span className="tabular-nums">{production}</span> blocks ·{' '}
    {SIDES.new} <span className="tabular-nums">{next}</span> blocks
  </p>
);

/**
 * Markdown, demoted from a tab to a download. It is the reading and export
 * artefact, and an editor reaches it when they want the whole page as text — not
 * when they want to compare two pages.
 */
function Export({ markdown, name, children }) {
  const href = useMemo(
    () => URL.createObjectURL(new Blob([markdown], { type: 'text/markdown' })),
    [markdown],
  );

  // A blob url pins its blob until it is revoked. Without this an editor walking the
  // log strands one whole page of Markdown per side per page they open.
  useEffect(() => () => URL.revokeObjectURL(href), [href]);

  return (
    <a href={href} download={name} className={`hover:underline ${CHROME.link}`}>
      {children}
    </a>
  );
}

/**
 * Outline, retired as a tab and returned as navigation. It was production's unit
 * list indented by heading level, and the table beside it now holds every one of
 * those units — so what is left of it is the jump list.
 *
 * It sticks, because the page it navigates is up to 288 rows long.
 *
 * Everything that makes it a *column* is behind `lg:`, because below `lg` the parent
 * is `flex-col` and there is no column to be. `shrink-0` used to be unconditional
 * while the width was not, which is the one combination that cannot work: a flex item
 * with no width that refuses to shrink takes its content width, and the longest
 * heading here is 650 pixels. It pushed the document to 697 pixels inside a 399 pixel
 * viewport and took the whole page sideways with it. `truncate` on each link was dead
 * in the same breath — there was no box to truncate against.
 */
function Outline({ entries, language }) {
  if (!entries.length) return null;

  return (
    <nav
      aria-label="Headings on this page"
      className="max-h-64 w-full overflow-auto lg:sticky lg:top-4 lg:max-h-[80vh] lg:w-56 lg:shrink-0 lg:self-start"
    >
      {/* Sentence case: this is a section heading and not a table's heading row, and ADR
          0019 spends small capitals on the second only. */}
      <h3 className="mb-1 text-xs font-semibold text-muted-foreground">Headings</h3>
      <ol className="space-y-0.5 text-sm">
        {entries.map((entry) => (
          <li key={entry.id} style={{ paddingLeft: `${(entry.level - 1) * 10}px` }}>
            {/* On the link and not on a span inside it: the link is the whole heading and it
                owns the hint repeating it (`Diff.jsx`'s copy button says why). Not announced,
                because the hint is here for `truncate` — a listening reader is given the whole
                heading as the link's own name already. */}
            <Hint text={entry.text} lang={language} announce={false}>
              <a
                href={`#${entry.anchor}`}
                className={`block truncate hover:underline ${CHROME.link}`}
                lang={language}
              >
                {entry.text}
              </a>
            </Hint>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Three columns: status, production as the reference, the new site.
 *
 * **Every row shows its block whole.** Ticket 68 held a row at four lines and gave the
 * reader a control to open it; both are withdrawn, and 68 is `wontfix` for that half.
 * Most blocks are shorter than the clamp was, so the control changed nothing on them and
 * cost a line of furniture on every row — and where a block *was* long, four lines of it
 * is the wrong answer: an editor deciding on a paragraph wants the paragraph, not a
 * window onto its first change. A jump still lands on a row and marks it; there is no
 * longer anything to open.
 */
function Rows({ items, control, sides, language, landed, onToggleRun }) {
  // The **mark** is drawn at once, and it is all this table does about a landing: the
  // scroll is one call in the parent, over the one anchor a finding link and a hash link
  // agree on.
  return (
    /* `table-fixed`, for the reason `Ledger.jsx` gives: an auto layout would let the
       two comparison columns change width from row to row, and a diff whose columns
       move is a diff a reader cannot scan.

       `min-w-3xl` is what makes the scroll container shadcn's `Table` already wraps
       itself in actually fire. `table-fixed w-full` alone never asks for more room
       than it is given, so on a 319 pixel card it did not overflow — it *divided*,
       handing the 224 pixel status column its width and leaving 48 pixels each to the
       two prose columns. Three words per line is not a narrower diff, it is no diff
       at all. Below the threshold the reader now scrolls the table sideways and the
       columns keep the proportions they have on a desktop. */
    <Table className="min-w-3xl table-fixed">
      <TableHeader className="[&_th]:text-xs [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:uppercase">
        {/* *— source of truth* went with the pair moving into `DiffHeads`. It said what
            `CONTEXT.md` already says of Production, in a head that had to undo its own
            capitals with a `normal-case` span to fit it. */}
        {/* The compared content leads and the status follows it (ADR 0019). This table is
            the page in document order and every row of it is a block an editor reads; the
            status column holds a pill, a score, a date and a control, and it held all four
            in front of the text they are about. */}
        <TableRow>
          <DiffHeads />
          <TableHead className="w-56">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) =>
          item.kind === 'marker' ? (
            <Fragment key={item.key}>
              <Marker marker={item} columns={3} onToggle={() => onToggleRun(item.key)} />
              {/* An opened run draws the rows it holds, and they are the rows this view
                  draws everywhere else — the marker compacts nothing and renders
                  nothing of its own. */}
              {item.open &&
                item.rows.map((row) => (
                  <Row
                    key={row.key}
                    row={row}
                    control={control}
                    sides={sides}
                    language={language}
                    landed={landed}
                  />
                ))}
            </Fragment>
          ) : (
            <Row
              key={item.key}
              row={item.row}
              control={control}
              sides={sides}
              language={language}
              landed={landed}
            />
          ),
        )}
      </TableBody>
    </Table>
  );
}

/** One block, production beside the new site. */
function Row({ row, control, sides, language, landed }) {
  // What marks a landed row is `landing.mjs`'s rule and not this table's: the
  // finding table draws one too, and the outline, the Tab stop and the
  // announcement are one mark said three ways rather than three classes
  // that happen to sit here. The class it hands back is merged with this row's.
  const { className, ...mark } = landedRowProps(row.key === landed);
  // A row where one side divides the words over a run: a merge holds it on the left and a
  // split on the right, and the two cells and the detail mark are the same answer either way.
  const regrouped = Boolean(row.prodRun || row.newRun);

  return (
    <TableRow id={row.key} {...mark} className={cn('scroll-mt-4 align-top', className)}>
      {regrouped ? (
        <RunCells row={row} sides={sides} language={language} />
      ) : (
        <DiffCells
          language={language}
          prod={row.prod?.norm ?? null}
          new={row.new?.norm ?? null}
          prodRaw={row.prod?.raw ?? null}
          newRaw={row.new?.raw ?? null}
          prodPrefix={
            <>
              <Tag unit={row.prod} />
              <Locate
                href={locationUrl(sides.production.url, unitLocation(row.prod))}
                side="production"
              />
            </>
          }
          newPrefix={
            <>
              <Tag unit={row.new} />
              <Locate
                href={locationUrl(sides.new.url, unitLocation(row.new))}
                side="the new site"
              />
            </>
          }
          strong={row.prod?.kind === 'heading' || row.new?.kind === 'heading'}
          equal={row.equal}
        />
      )}
      {/* `data-slot` is a stable name for the cell the *Status* head names, in the manner of
          `data-side` and `data-bucket`: it now comes after the two comparison cells, and a
          test reading *the first cell of the row* would have been reading the class off a
          paragraph of Dutch. */}
      <TableCell data-slot="status" className="px-2 py-3 align-top whitespace-normal">
        {/*
         * The pill on a row that carries a class, and the word on a row whose two sides
         * agree. They are two questions and not one: this used to say *equal* whenever
         * there was no pill to draw, which reads the absence of a class as an answer
         * about the text. `row.equal` is that answer, and the row carries it — the same
         * field `collapses()` reads, so the cell and the marker cannot disagree about
         * which rows agree.
         */}
        {row.class ? (
          <ClassPill class={row.class} />
        ) : (
          row.equal && <span className="text-xs text-muted-foreground">agrees</span>
        )}
        {row.score !== null && (
          <span className="ml-2 text-xs text-muted-foreground">{row.score}</span>
        )}
        {/* `p + p → p` or `p → 4×p`, on a run row and on no other. `Annotations.jsx` carries
            the reason. */}
        {regrouped && <Detail detail={row.finding?.detail} />}
        <Occurrences count={row.finding?.occurrences} hint={onePageHint(row.finding?.occurrences)} />
        <FirstSeen at={row.finding?.firstSeen} />
        <HistoryNote note={row.finding?.historyNote} />
        {/*
         * `decidable` and not `row.finding`: an `information` row keeps its
         * finding — it has an id and a link can name it — and offers no
         * decision, because nothing is being asked (ticket 86).
         *
         * This gates the **wrapper**, and `Ledger.jsx`'s closure gates the
         * control itself, because Links and Images share that closure and
         * have no rows to read. The two are one rule, `canDecide()`, and not a
         * rule stated twice: without this the row would draw an empty `mt-1`
         * div. It reads the row rather than calling the rule again so that
         * ticket 79's marker and this cell can never disagree about which rows
         * hold a decision.
         */}
        {row.decidable && <div className="mt-1">{control(row.finding)}</div>}
      </TableCell>
    </TableRow>
  );
}

/**
 * The two comparison cells of a `regrouped` row: the run on the side that divides the words,
 * one block under the next, and the single block the other side holds them in. Production is
 * on the left whichever side that is — a merge divides them there (ticket 116) and a split
 * divides them on the right (ticket 120).
 *
 * **It is not `DiffCells`, and it must not become it.** That component's job is to show
 * which words differ, and on this row none do: the criterion is total coverage, so the two
 * sides hold the same tokens in the same order and only the seams moved. A word diff here
 * would paint an empty answer over the one thing the row is about, and it would spend the
 * clamp budget doing it. The same reason there is no tint: nothing is lost and nothing is
 * added, so neither `lost` nor `added` is the row's to wear.
 *
 * The side holding one block is drawn as a run of one, so the two directions are one
 * component and not two that have to be kept looking alike.
 *
 * A row whose run has a member the page does not hold never arrives here at all: `runOf()`
 * drops such a run, and the row falls to `DiffCells` and is word-diffed against one member.
 * That is ticket 116's choice and it stands — a report that names a block it does not carry
 * has a defect this cell cannot draw around — but it is the one path on which the paragraph
 * above is not the whole truth.
 */
function RunCells({ row, sides, language }) {
  return (
    <>
      <RunCell
        units={row.prodRun ?? asRun(row.prod)}
        url={sides.production.url}
        side="production"
        language={language}
      />
      <RunCell
        units={row.newRun ?? asRun(row.new)}
        url={sides.new.url}
        side="the new site"
        language={language}
      />
    </>
  );
}

/**
 * The side that holds the words in one block, as a run of one — or of none, on the report that
 * names a block the page does not hold. `runOf()` in `view.mjs` drops a run whose members do
 * not resolve for the same reason: a cell here draws what is there and never a placeholder.
 */
const asRun = (unit) => (unit ? [unit] : []);

/**
 * One side of a `regrouped` row.
 *
 * The seam is what the reader is being shown, so each block keeps its own tag and its own
 * link into its own site, and the run reads down the cell in document order. A block that is
 * a heading is set in the same semibold the rest of the view gives a heading — a run may
 * hold one (ticket 121), and it should not stop looking like a heading because the other side
 * inlined it.
 */
function RunCell({ units, url, side, language }) {
  return (
    <TableCell className="px-2 py-3 align-top text-sm break-words whitespace-normal">
      {units.map((unit) => (
        <p key={unit.index} className="mt-3 first:mt-0">
          <Tag unit={unit} />
          <Locate href={locationUrl(url, unitLocation(unit))} side={side} />
          <span lang={language} className={unit.kind === 'heading' ? 'font-semibold' : ''}>
            {unit.norm}
          </span>
        </p>
      ))}
    </TableCell>
  );
}

/**
 * The row a hash link names, kept in step with the address bar.
 *
 * Read in an effect and never at first render: this component is server-rendered too,
 * and there is no `location` there. `hashchange` is what makes an outline click work
 * after the first — the browser changes the hash without a navigation, so nothing else
 * would tell this view to open the run the reader jumped into.
 */
function useHashRow() {
  const [key, setKey] = useState(null);

  useEffect(() => {
    const read = () => setKey(rowKeyFromHash(globalThis.location.hash));
    read();
    globalThis.addEventListener('hashchange', read);
    return () => globalThis.removeEventListener('hashchange', read);
  }, []);

  return key;
}
