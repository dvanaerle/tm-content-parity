import { useEffect, useMemo, useState } from 'react';
import { Locate, Occurrences, Tag } from './Annotations.jsx';
import { ClassFilterPills, ClassPill, FilterBanner } from './Chips.jsx';
import { DiffCells } from './Diff.jsx';
import { CHROME } from '../lib/palette.mjs';
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
export default function ContentView({ report, findings, showNoise, control }) {
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
          ? <p className="py-6 text-sm text-slate-500">Geen regels in deze filter.</p>
          : <Rows rows={rows} control={control} sides={report.sides} />}
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
      <label
        className={`flex items-center gap-2 text-sm ${differences.disabled ? 'text-slate-400' : 'text-slate-600'}`}
        title={differences.disabled
          ? 'Een klassefilter toont altijd alleen verschillen.'
          : undefined}
      >
        <input
          type="checkbox"
          checked={differences.checked}
          disabled={differences.disabled}
          onChange={(event) => setFilter({ ...filter, onlyDifferences: event.target.checked })}
        />
        Alleen verschillen
      </label>

      <span className="ml-auto flex items-center gap-2 text-xs text-slate-500">
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
 */
function Outline({ entries }) {
  if (!entries.length) return null;

  return (
    <nav
      aria-label="Koppen op deze pagina"
      className="max-h-[80vh] shrink-0 self-start overflow-auto lg:sticky lg:top-4 lg:w-56"
    >
      <h3 className="mb-1 text-[11px] uppercase tracking-wide text-slate-500">Koppen</h3>
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
function Rows({ rows, control, sides }) {
  const [open, setOpen] = useState(() => new Set());

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
    <table className="w-full table-fixed text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-500">
          <th className="w-56 px-2 py-2 font-medium">Status</th>
          <th className="px-2 py-2 font-medium">
            Productie <span className="normal-case text-slate-400">— bron van waarheid</span>
          </th>
          <th className="px-2 py-2 font-medium">Nieuwe site</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.key}
            id={row.key}
            className="border-b border-slate-100 align-top scroll-mt-4 last:border-0"
          >
            <td className="px-2 py-3">
              {row.class
                ? <ClassPill class={row.class} />
                : <span className="text-xs text-slate-400">gelijk</span>}
              {row.score !== null && <span className="ml-2 text-xs text-slate-400">{row.score}</span>}
              <ClampControl open={open.has(row.key)} onToggle={() => toggle(row.key)} />
              <Occurrences finding={row.finding} />
              {row.finding && <div className="mt-1">{control(row.finding)}</div>}
            </td>
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
          </tr>
        ))}
      </tbody>
    </table>
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
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      title={open ? 'Toon vier regels van dit blok' : 'Toon dit blok helemaal'}
      className="ml-2 text-xs text-slate-400 hover:text-slate-700"
    >
      {open ? 'vier regels' : 'hele blok'}
    </button>
  );
}

