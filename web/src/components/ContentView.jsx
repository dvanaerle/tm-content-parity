import { Fragment, useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Locate, Occurrences, Tag, onePageTitle } from './Annotations.jsx';
import { ClassFilterPills, ClassPill, FilterBanner } from './Chips.jsx';
import { DiffCells } from './Diff.jsx';
import { Checkbox } from './ui/checkbox.jsx';
import { Empty, EmptyDescription, EmptyHeader } from './ui/empty.jsx';
import { Label } from './ui/label.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx';
import { cn } from '../lib/utils.js';
import { CHROME } from '../lib/palette.mjs';
import { landedRowProps, landingRow, useLandOn } from '../lib/landing.mjs';
import {
  NO_FILTER,
  collapseRuns,
  isNarrowed,
  outlineFrom,
  prepareRows,
  rowKeyFromHash,
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
 * **It opens on the differences** (ticket 79, ADR 0006). Each run of agreeing blocks is
 * one **context marker** naming how many it holds, and the marker expands. Nobody
 * scrolls past 47 identical paragraphs to reach the next difference, and nobody loses
 * the ability to see where a missing line belonged. This is **not a view mode**: it is
 * one order with a fold in it. Nothing is reordered, nothing is filtered away, and the
 * heading outline still names the same places.
 *
 * What is on screen is `view.mjs`'s decision, not this component's. The filter is
 * the judgement in this feature and it is pure and tested; this file is the pixels.
 */
export default function ContentView({ report, findings, showNoise, control, landing }) {
  const [filter, setFilter] = useState(NO_FILTER);
  const [openRuns, setOpenRuns] = useState([]);
  const { production, new: next } = report.sides;

  const { rows, total, classes } = useMemo(
    () =>
      prepareRows({
        rows: report.rows,
        findings,
        elements: { production: production.elements, new: next.elements },
        filter,
        showNoise,
      }),
    [report.rows, findings, production, next, filter, showNoise],
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

  /*
   * The row a hash link names (ticket 79, handed over by 68).
   *
   * A jump is a request to read one row, so the run holding it opens with it — a saved
   * link and an outline entry must not land on a marker. It is read in an effect rather
   * than at first render because this component is server-rendered as well, and there
   * is no `location` there.
   */
  const hashRow = useHashRow();
  const reveal = landed ?? hashRow;

  const items = useMemo(
    () => collapseRuns(rows, { open: openRuns, reveal }),
    [rows, openRuns, reveal],
  );

  // The run opened in the render above, so the row is in the document by the time this
  // runs. Only when the landing has not already claimed the jump: two scrolls to two
  // places is worse than either.
  useLandOn(landed ? null : hashRow, landing?.settled ?? true);

  const markers = items.filter((item) => item.kind === 'marker');

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <Outline entries={outline} />

      <div className="min-w-0 flex-1">
        <Controls
          classes={classes}
          filter={filter}
          setFilter={setFilter}
          markers={markers}
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

        {rows.length === 0 ? (
          <Empty className="py-6">
            <EmptyHeader>
              <EmptyDescription>No rows in this filter.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            {/* A run of agreeing rows can be the whole page, and then the table is one
                marker and nothing else. Without this it reads as a view that failed to
                load rather than as a page with nothing wrong on it. The marker stays
                below, because the blocks are still there and still worth opening. */}
            {markers.length === items.length && (
              <p className="mb-3 text-sm text-muted-foreground">
                Nothing differs on this page. Every block agrees with production.
              </p>
            )}
            <Rows
              items={items}
              control={control}
              sides={report.sides}
              landed={landed}
              settled={landing?.settled}
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
 * every marker at once, which is the same want said as a fold instead of a filter.
 */
function Controls({
  classes,
  filter,
  setFilter,
  markers,
  setOpenRuns,
  production,
  next,
  page,
  store,
}) {
  const allOpen = markers.length > 0 && markers.every((marker) => marker.open);

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <ClassFilterPills
        counts={classes.map(({ class: cls, rows }) => ({ class: cls, count: rows }))}
        selected={filter.classes}
        onToggle={(cls) => setFilter(toggleClass(filter, cls))}
        title={(_cls, count) => `${count} rows in this class. A filter changes no count.`}
      />

      {/* Base UI's Checkbox hands back the value, not an event. It is drawn only when
          there is a run to open: a control over nothing is a control that teaches the
          reader it does nothing. */}
      {markers.length > 0 && (
        <Label
          className="font-normal text-muted-foreground"
          title="The blocks that agree with production. They are never removed from this page — this opens all of them at once."
        >
          <Checkbox
            checked={allOpen}
            onCheckedChange={(checked) =>
              setOpenRuns(checked ? markers.map((marker) => marker.key) : [])
            }
          />
          Show unchanged blocks
        </Label>
      )}

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
function Outline({ entries }) {
  if (!entries.length) return null;

  return (
    <nav
      aria-label="Headings on this page"
      className="max-h-64 w-full overflow-auto lg:sticky lg:top-4 lg:max-h-[80vh] lg:w-56 lg:shrink-0 lg:self-start"
    >
      <h3 className="mb-1 text-xs tracking-wide text-muted-foreground uppercase">Headings</h3>
      <ol className="space-y-0.5 text-sm">
        {entries.map((entry) => (
          <li key={entry.key} style={{ paddingLeft: `${(entry.level - 1) * 10}px` }}>
            <a
              href={`#${entry.key}`}
              className={`block truncate hover:underline ${CHROME.link}`}
              title={entry.text}
            >
              {entry.text}
            </a>
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
function Rows({ items, control, sides, landed, settled, onToggleRun }) {
  // The **mark** is drawn at once; the landing itself waits for the log, which is the
  // hook's own rule.
  useLandOn(landed, settled);

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
        <TableRow>
          <TableHead className="w-56">Status</TableHead>
          <TableHead>
            Production <span className="normal-case opacity-70">— source of truth</span>
          </TableHead>
          <TableHead>New site</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) =>
          item.kind === 'marker' ? (
            <Fragment key={item.key}>
              <Marker marker={item} onToggle={() => onToggleRun(item.key)} />
              {/* An opened run draws the rows it holds, and they are the rows this view
                  draws everywhere else — the marker compacts nothing and renders
                  nothing of its own. */}
              {item.open &&
                item.rows.map((row) => (
                  <Row key={row.key} row={row} control={control} sides={sides} landed={landed} />
                ))}
            </Fragment>
          ) : (
            <Row key={item.key} row={item.row} control={control} sides={sides} landed={landed} />
          ),
        )}
      </TableBody>
    </Table>
  );
}

/**
 * A run of agreeing blocks, standing in one row (ticket 79, ADR 0006).
 *
 * It says **how many blocks it holds**, which is the distance between the finding above
 * it and the finding below it, and it gives them back on one click. That is the whole
 * difference from the *Diff* tab ticket 12 retired: the tab deleted the position, and
 * this keeps it. `CONTEXT.md` reserves *fold* to two other meanings, so a run
 * **collapses** and this is a **context marker**.
 *
 * **No tint.** Once every visible row is a difference the row tint says nothing — which
 * is the specific failure that retired the tab — so the class pill on each row carries
 * the class and no row carries a colour. The marker is quieter still: it is furniture
 * between two findings and it must not read as one.
 */
function Marker({ marker, onToggle }) {
  const Chevron = marker.open ? ChevronDown : ChevronRight;

  return (
    <TableRow id={marker.key} className="scroll-mt-4 border-dashed hover:bg-transparent">
      <TableCell colSpan={3} className="px-2 py-1">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={marker.open}
          className={`flex items-center gap-1 text-xs hover:underline ${CHROME.link}`}
        >
          <Chevron className="size-3.5" aria-hidden="true" />
          {marker.blocks} unchanged {marker.blocks === 1 ? 'block' : 'blocks'}
        </button>
      </TableCell>
    </TableRow>
  );
}

/** One block, production beside the new site. */
function Row({ row, control, sides, landed }) {
  // What marks a landed row is `landing.mjs`'s rule and not this table's: the
  // finding table draws one too, and the outline, the Tab stop and the
  // announcement are one mark said three ways rather than three classes
  // that happen to sit here. The class it hands back is merged with this row's.
  const { className, ...mark } = landedRowProps(row.key === landed);

  return (
    <TableRow id={row.key} {...mark} className={cn('scroll-mt-4 align-top', className)}>
      <TableCell className="px-2 py-3 align-top whitespace-normal">
        {row.class ? (
          <ClassPill class={row.class} />
        ) : (
          <span className="text-xs text-muted-foreground">equal</span>
        )}
        {row.score !== null && (
          <span className="ml-2 text-xs text-muted-foreground">{row.score}</span>
        )}
        <Occurrences
          count={row.finding?.occurrences}
          title={onePageTitle(row.finding?.occurrences)}
        />
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
      <DiffCells
        prod={row.prod?.norm ?? null}
        new={row.new?.norm ?? null}
        prodRaw={row.prod?.raw ?? null}
        newRaw={row.new?.raw ?? null}
        prodPrefix={
          <>
            <Tag unit={row.prod} />
            <Locate url={sides.production.url} text={row.prod?.raw} side="production" />
          </>
        }
        newPrefix={
          <>
            <Tag unit={row.new} />
            <Locate url={sides.new.url} text={row.new?.raw} side="the new site" />
          </>
        }
        strong={row.prod?.kind === 'heading' || row.new?.kind === 'heading'}
        equal={row.equal}
      />
    </TableRow>
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
