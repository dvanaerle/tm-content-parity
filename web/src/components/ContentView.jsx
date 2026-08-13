import { useEffect, useMemo, useState } from 'react';
import { Locate, Occurrences, Tag, onePageTitle } from './Annotations.jsx';
import { ClassFilterPills, ClassPill, FilterBanner } from './Chips.jsx';
import { DiffCells } from './Diff.jsx';
import { Button } from './ui/button.jsx';
import { Checkbox } from './ui/checkbox.jsx';
import { Empty, EmptyDescription, EmptyHeader } from './ui/empty.jsx';
import { Label } from './ui/label.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx';
import { cn } from '../lib/utils.js';
import { CHROME } from '../lib/palette.mjs';
import { landedRowProps, landingRow, useLandOn } from '../lib/landing.mjs';
import {
  NO_FILTER,
  isNarrowed,
  onlyDifferencesState,
  outlineFrom,
  prepareRows,
  rowKeyFromHash,
  toggleClass,
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
 * What is on screen is `view.mjs`'s decision, not this component's. The filter is
 * the judgement in this feature and it is pure and tested; this file is the pixels.
 */
export default function ContentView({ report, findings, showNoise, control, landing }) {
  const [filter, setFilter] = useState(NO_FILTER);
  const { production, new: next } = report.sides;

  const { rows, total, classes } = useMemo(() => prepareRows({
    rows: report.rows,
    findings,
    elements: { production: production.elements, new: next.elements },
    filter,
    showNoise,
  }), [report.rows, findings, production, next, filter, showNoise]);

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

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <Outline entries={outline} />

      <div className="min-w-0 flex-1">
        <Controls
          classes={classes}
          filter={filter}
          setFilter={setFilter}
          production={production}
          next={next}
          page={report.page}
          store={report.store}
        />

        {narrowed && (
          <FilterBanner onClear={() => setFilter(NO_FILTER)} className="mb-3 rounded border px-3 py-2">
            <strong>Gefilterd.</strong>
            Je ziet {rows.length} van {total} regels. Dit is niet de hele pagina.
          </FilterBanner>
        )}

        {rows.length === 0
          ? (
            <Empty className="py-6">
              <EmptyHeader>
                <EmptyDescription>Geen regels in deze filter.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )
          : <Rows rows={rows} control={control} sides={report.sides} landed={landed} settled={landing?.settled} />}
      </div>
    </div>
  );
}

/**
 * The class filter, the inverse control and the Markdown export.
 *
 * The chips count **regels** and never findings. A grouped finding is one finding
 * over several rows, so the two numbers differ on purpose, and the word on the
 * tooltip is what keeps them apart. Nothing here moves a bar: `view.mjs` returns no
 * number a bar could be built from.
 */
function Controls({ classes, filter, setFilter, production, next, page, store }) {
  const differences = onlyDifferencesState(filter);

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <ClassFilterPills
        counts={classes.map(({ class: cls, rows }) => ({ class: cls, count: rows }))}
        selected={filter.classes}
        onToggle={(cls) => setFilter(toggleClass(filter, cls))}
        title={(_cls, count) => `${count} regels in deze klasse. Filteren verandert geen enkel getal.`}
      />

      {/* The inverse control. Matched rows are the default, because a tint only
          reads as a signal against untinted baseline. */}
      {/* Base UI's Checkbox hands back the value, not an event. The `peer` on the
          control is what lets `Label` dim itself when the box is disabled, so the
          conditional ink here only has to say what "enabled" looks like. */}
      <Label
        className={cn('font-normal', differences.disabled ? 'text-muted-foreground/60' : 'text-muted-foreground')}
        title={differences.disabled
          ? 'Een klassefilter toont altijd alleen verschillen.'
          : undefined}
      >
        <Checkbox
          checked={differences.checked}
          disabled={differences.disabled}
          onCheckedChange={(checked) => setFilter({ ...filter, onlyDifferences: checked })}
        />
        Alleen verschillen
      </Label>

      <span className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
        Markdown:
        <Export markdown={production.markdown} name={`${store}-${slug(page)}-productie.md`}>productie</Export>
        <Export markdown={next.markdown} name={`${store}-${slug(page)}-nieuw.md`}>nieuwe site</Export>
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
    <a href={href} download={name} className={`hover:underline ${CHROME.link}`}>{children}</a>
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
      aria-label="Koppen op deze pagina"
      className="max-h-64 w-full overflow-auto lg:sticky lg:top-4 lg:max-h-[80vh] lg:w-56 lg:shrink-0 lg:self-start"
    >
      <h3 className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Koppen</h3>
      <ol className="space-y-0.5 text-sm">
        {entries.map((entry) => (
          <li key={entry.key} style={{ paddingLeft: `${(entry.level - 1) * 10}px` }}>
            <a href={`#${entry.key}`} className={`block truncate hover:underline ${CHROME.link}`} title={entry.text}>
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
 * **A row is clamped until it is opened** (ticket 68). After ticket 67 a row holds a
 * whole block, so one paragraph is 20 to 24 wrapped lines and about 500 pixels: a jump
 * landed inside a row that was taller than the screen, and the view stopped being
 * something a reader scans. Four lines holds a change with a line above and below it,
 * and a 900-pixel screen then carries seven or eight rows.
 *
 * The clamp state belongs to the **row** and not to a cell, because a row is one
 * comparison and two cells at two heights cannot be read against each other.
 */
function Rows({ rows, control, sides, landed, settled }) {
  const [open, setOpen] = useState(() => new Set());

  // A landing is a jump, so it obeys the same rule the hash jump below obeys: the row it
  // lands on opens. It is a separate effect because it arrives from the query string and
  // not from the hash, and because it can change while the page stays put — a re-check
  // replaces the report without touching the address bar.
  useEffect(() => {
    if (landed) setOpen((held) => new Set(held).add(landed));
  }, [landed]);

  // The **mark** and the open row are drawn at once; the landing itself waits for the
  // log, which is the hook's own rule.
  useLandOn(landed, settled);

  // A jump is a request to read one row, so the row it lands on opens — and it opens
  // downwards from its own top, which the native jump has already put at the top of
  // the screen. **Nothing is added for a scroll offset**: nothing above the table is
  // sticky, so the native jump and `scroll-mt-4` are the whole of it. Ticket 87 is
  // what could break that.
  useEffect(() => {
    const openTheTarget = () => {
      const key = rowKeyFromHash(window.location.hash);
      if (key) setOpen((held) => new Set(held).add(key));
    };

    openTheTarget();
    window.addEventListener('hashchange', openTheTarget);
    return () => window.removeEventListener('hashchange', openTheTarget);
  }, []);

  const toggle = (key) => setOpen((held) => {
    const next = new Set(held);
    if (!next.delete(key)) next.add(key);
    return next;
  });

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
    <Table className="table-fixed min-w-3xl">
      <TableHeader className="[&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground">
        <TableRow>
          <TableHead className="w-56">Status</TableHead>
          <TableHead>
            Productie <span className="normal-case opacity-70">— bron van waarheid</span>
          </TableHead>
          <TableHead>Nieuwe site</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          // What marks a landed row is `landing.mjs`'s rule and not this table's: the
          // finding table draws one too, and the outline, the Tab stop and the
          // announcement are one mark said three ways rather than three classes
          // that happen to sit here. The class it hands back is merged with this row's.
          const { className, ...mark } = landedRowProps(row.key === landed);

          return (
            <TableRow
              key={row.key}
              id={row.key}
              {...mark}
              className={cn('align-top scroll-mt-4', className)}
            >
              <TableCell className="px-2 py-3 align-top whitespace-normal">
                {row.class
                  ? <ClassPill class={row.class} />
                  : <span className="text-xs text-muted-foreground">gelijk</span>}
                {row.score !== null && <span className="ml-2 text-xs text-muted-foreground">{row.score}</span>}
                <ClampControl open={open.has(row.key)} onToggle={() => toggle(row.key)} />
                <Occurrences count={row.finding?.occurrences} title={onePageTitle(row.finding?.occurrences)} />
                {row.finding && <div className="mt-1">{control(row.finding)}</div>}
              </TableCell>
              <DiffCells
                prod={row.prod?.norm ?? null}
                new={row.new?.norm ?? null}
                prodRaw={row.prod?.raw ?? null}
                newRaw={row.new?.raw ?? null}
                prodPrefix={<><Tag unit={row.prod} /><Locate url={sides.production.url} text={row.prod?.raw} side="productie" /></>}
                newPrefix={<><Tag unit={row.new} /><Locate url={sides.new.url} text={row.new?.raw} side="de nieuwe site" /></>}
                strong={row.prod?.kind === 'heading' || row.new?.kind === 'heading'}
                equal={row.equal}
                clamped={!open.has(row.key)}
              />
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

/**
 * The one control of the clamp, beside the class pill.
 *
 * **It is always rendered**, on a two-line row as well as on a twenty-line one. To
 * hide it where it changes nothing the view would have to measure every row, and a
 * measuring pass over 288 rows to remove one small piece of furniture is the trade
 * backwards. So it is quiet instead: text, no border, and the size of the score
 * beside it.
 *
 * **It says what the reader gets, and it borrows no other word.** *Uitklappen* is the
 * fold, which `CONTEXT.md` reserves to two meanings and refuses to a clamp; *inklappen*
 * is what a run of equal rows does, which is ticket 79's context marker and not this;
 * and *openen* is the word the finding state beside it already uses.
 */
function ClampControl({ open, onToggle }) {
  return (
    <Button
      variant="ghost"
      size="xs"
      onClick={onToggle}
      aria-expanded={open}
      title={open ? 'Toon vier regels van dit blok' : 'Toon dit blok helemaal'}
      className="ml-2 text-xs font-normal text-muted-foreground"
    >
      {open ? 'vier regels' : 'hele blok'}
    </Button>
  );
}

