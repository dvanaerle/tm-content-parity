import { useMemo, useState } from 'react';
import { textFragmentUrl } from '../../../compare/locate.mjs';
import { metaRows } from '../../../compare/meta.mjs';
import { Chip, ClassPill } from './Chips.jsx';
import { DiffCells } from './Diff.jsx';
import OverrideControl from './OverrideControl.jsx';
import { CHECK_LABEL } from '../lib/classes.mjs';
import { BANNER, CHROME, INK } from '../lib/palette.mjs';

/**
 * Variant A: a tabbed ledger, production and the new site side by side.
 *
 * Diff lands first, not Tasks. Ticket 12 argued Tasks is arguably the landing
 * tab now that findings come from three sources, and this build is the material
 * for deciding that — but the diff is what makes the log trustworthy, and an
 * editor who lands on a task list has to take the tool's word for it.
 *
 * Coverage is absent: Axis B is ticket 24, and ticket 11 forbids summing its bar
 * with this one. It arrives as a ninth tab, not as extra rows in these.
 */
const TABS = ['Diff', 'Outline', 'Links', 'Afbeeldingen', 'Content', 'Meta', 'Taken'];

/**
 * `findings` are the **derived** findings from `derivePageState()` — the same
 * records with a `state` and an `override` attached. The Ledger never re-derives
 * anything; it renders what the pure function decided.
 */
export default function Ledger({ report, findings: derived, append, canWrite, observationId }) {
  const [tab, setTab] = useState('Diff');
  const [showNoise, setShowNoise] = useState(false);
  const [showMatches, setShowMatches] = useState(false);

  const { production, new: next } = report.sides;

  // A muted finding stays **visible behind the toggle**: muting is not deleting,
  // and an editor who muted a class by mistake must be able to find it again.
  const findings = useMemo(
    () => derived.filter((finding) => showNoise || (finding.shown && finding.state !== 'muted')),
    [derived, showNoise],
  );

  const byId = useMemo(
    () => new Map(derived.map((finding) => [finding.id, finding])),
    [derived],
  );
  const visible = useMemo(() => new Set(findings.map((finding) => finding.id)), [findings]);

  const rows = useMemo(() => report.rows
    .filter((row) => (row.class ? visible.has(row.finding) : showMatches))
    .map((row) => ({
      ...row,
      finding: row.finding ? byId.get(row.finding) : null,
      prod: row.prod === null ? null : production.elements[row.prod],
      new: row.new === null ? null : next.elements[row.new],
    })), [report.rows, visible, byId, showMatches, production, next]);

  const control = (finding) => (
    <OverrideControl
      finding={finding}
      observationId={observationId}
      append={append}
      canWrite={canWrite}
    />
  );

  const hiddenCount = derived.length - derived.filter((f) => f.shown && f.state !== 'muted').length;

  const badges = {
    Diff: rows.filter((row) => row.class).length,
    Outline: production.elements.length,
    Links: findings.filter((finding) => finding.check === 'links').length,
    Afbeeldingen: findings.filter((finding) => finding.check === 'images').length,
    Taken: findings.length,
  };

  if (!report.comparable) {
    return (
      <section className={`rounded border p-4 ${BANNER.attention}`}>
        <h2 className="font-semibold">Niet te vergelijken</h2>
        <p className="text-sm">{report.skipReason}</p>
        <p className="mt-2 text-sm">
          Ticket 07 laat de vergelijking alleen doorgaan bij status 200 aan beide kanten:
          een 404-pagina heeft ook een <code>&lt;main&gt;</code> en levert anders honderden
          verschillen op waar niemand iets mee kan.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded border border-slate-200 bg-white">
      <nav className="flex flex-wrap items-center gap-1 border-b border-slate-200 px-2" role="tablist">
        {TABS.map((name) => (
          <button
            key={name}
            type="button"
            role="tab"
            aria-selected={name === tab}
            onClick={() => setTab(name)}
            className={`flex items-center gap-2 px-3 py-2 text-sm ${
              name === tab ? `-mb-px border-b-2 font-semibold ${CHROME.tabActive}` : 'text-slate-600'
            }`}
          >
            {name}
            {badges[name] !== undefined && (
              <span className="rounded bg-slate-100 px-1.5 text-xs tabular-nums text-slate-600">
                {badges[name]}
              </span>
            )}
          </button>
        ))}

        <label className="ml-auto flex items-center gap-2 py-2 text-sm text-slate-600">
          <input type="checkbox" checked={showNoise} onChange={(event) => setShowNoise(event.target.checked)} />
          Ruis en gedempt tonen ({hiddenCount})
        </label>
      </nav>

      <div role="tabpanel" className="p-4">
        {tab === 'Diff' && (
          <>
            <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={showMatches} onChange={(event) => setShowMatches(event.target.checked)} />
              Gelijke elementen ook tonen
            </label>
            <DiffTable rows={rows} control={control} sides={report.sides} />
          </>
        )}
        {tab === 'Outline' && <Outline elements={production.elements} />}
        {tab === 'Links' && <FindingTable findings={findings} check="links" control={control} sides={report.sides} />}
        {tab === 'Afbeeldingen' && <FindingTable findings={findings} check="images" control={control} sides={report.sides} />}
        {tab === 'Content' && <SideBySide production={production} next={next} />}
        {tab === 'Meta' && <MetaTable production={production} next={next} />}
        {tab === 'Taken' && <Tasks findings={findings} control={control} sides={report.sides} />}
      </div>
    </section>
  );
}

/** The prototype's three columns: status, production as the reference, new site. */
function DiffTable({ rows, control, sides }) {
  if (!rows.length) return <Empty>Geen verschillen in deze filter.</Empty>;

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
        {rows.map((row, index) => (
          <tr key={index} className="border-b border-slate-100 align-top last:border-0">
            <td className="px-2 py-3">
              {row.class ? <ClassPill class={row.class} /> : <span className="text-xs text-slate-400">gelijk</span>}
              {row.score !== null && <span className="ml-2 text-xs text-slate-400">{row.score}</span>}
              <Occurrences finding={row.finding} />
              <Section anchorHeading={row.finding?.anchorHeading} />
              {row.finding && <div className="mt-1">{control(row.finding)}</div>}
            </td>
            <DiffCells
              prod={row.prod?.norm ?? null}
              new={row.new?.norm ?? null}
              prodRaw={row.prod?.raw ?? null}
              newRaw={row.new?.raw ?? null}
              prodPrefix={<><Tag element={row.prod} /><Locate url={sides.production.url} text={row.prod?.raw} side="productie" /></>}
              newPrefix={<><Tag element={row.new} /><Locate url={sides.new.url} text={row.new?.raw} side="de nieuwe site" /></>}
              strong={row.prod?.kind === 'heading' || row.new?.kind === 'heading'}
            />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * The element's own tag beside its words. On a `heading-level` row it is the whole
 * finding: the two texts are identical and the tag is what changed.
 */
const Tag = ({ element }) => (
  element ? <span className="mr-2 font-mono text-[11px] text-slate-400">{element.tag}</span> : null
);

/**
 * Ticket 02: the outline and the diff are one structure, not two features. So
 * this is production's document in order, indented by heading level — the same
 * elements the Diff tab pairs.
 */
function Outline({ elements }) {
  return (
    <ol className="space-y-1 text-sm">
      {elements.map((element) => (
        <li
          key={element.index}
          className={element.kind === 'heading' ? 'font-semibold' : 'text-slate-700'}
          style={{ paddingLeft: `${((element.level ?? 7) - 1) * 12}px` }}
        >
          <span className="mr-2 font-mono text-[11px] text-slate-400">{element.tag}</span>
          {element.raw}
        </li>
      ))}
    </ol>
  );
}

function FindingTable({ findings, check, control, sides }) {
  const rows = findings.filter((finding) => finding.check === check);
  if (!rows.length) return <Empty>Geen bevindingen voor {CHECK_LABEL[check]}.</Empty>;

  return (
    <table className="w-full table-fixed text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-500">
          <th className="w-56 px-2 py-2 font-medium">Soort</th>
          <th className="px-2 py-2 font-medium">Productie</th>
          <th className="px-2 py-2 font-medium">Nieuw</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((finding) => (
          <tr key={finding.id} className="border-b border-slate-100 align-top last:border-0">
            <td className="px-2 py-2">
              <ClassPill class={finding.class} />
              <Detail finding={finding} />
              <Occurrences finding={finding} />
              {/* A target key and an alt text are not words on the page, so the
                  heading above them is the only thing a browser can scroll to. */}
              <Section anchorHeading={finding.anchorHeading} sides={sides} />
              <div className="mt-1">{control(finding)}</div>
            </td>
            {/* The same component the content rows use. A link finding word-diffs
                two target keys, which makes a changed path segment jump out. */}
            <DiffCells prod={finding.prod} new={finding.new} mono />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Ticket 02: Markdown is a reading and export artefact, never the diff spine. It
 * lives here so an editor can copy a whole page, and nowhere else.
 */
function SideBySide({ production, next }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[['Productie', production], ['Nieuwe site', next]].map(([label, extract]) => (
        <div key={label}>
          <h3 className="mb-1 text-sm font-semibold">{label}</h3>
          <pre className="max-h-[70vh] overflow-auto rounded bg-slate-50 p-3 text-xs whitespace-pre-wrap">
            {extract.markdown}
          </pre>
        </div>
      ))}
    </div>
  );
}

/**
 * Display only, and now with the diff colours (ticket 35). An editor reads a changed
 * `<title>` in the same way as changed body copy, because it is the same type of
 * change.
 *
 * It still makes **no** finding. Ticket 21 has not decided what a parity defect in
 * the head is. Thus nothing here goes into the contract, the bar or the count. For
 * the same reason the rows have no override control: the shared colours must not
 * show something an editor can complete.
 *
 * Which rows exist at all is `compare/meta.mjs`'s decision, not this component's.
 */
function MetaTable({ production, next }) {
  const rows = useMemo(() => metaRows(production, next), [production, next]);

  return (
    <>
      <p className="mb-3 rounded bg-slate-50 p-2 text-sm text-slate-600">
        Alleen weergave, zonder afvinken. Ticket 21 beslist nog wat in de{' '}
        <code>&lt;head&gt;</code> een pariteitsdefect is, dus hier komen geen bevindingen
        uit en deze regels staan niet in de teller.
      </p>
      <table className="w-full table-fixed text-sm">
        <tbody>
          {rows.map((row) => (
            <tr key={row.field} className="border-b border-slate-100 align-top">
              <th className="w-40 px-2 py-3 text-left font-medium text-slate-500">
                {row.field}
                {/* The one loud case. Production has no canonical on 147 of 179 nl
                    pages and those rows are gone, so the 2 pages where the new
                    site **lost** one must not read like the rest. */}
                {row.field === 'canonical' && row.state === 'lost' && (
                  <span className={`mt-1 block text-[11px] font-normal ${INK.lost}`}>
                    de nieuwe site heeft er geen
                  </span>
                )}
              </th>
              {/* `state` is the tool's answer, and the cells must not contradict it:
                  a canonical that differs by hostname alone is `same`, and the
                  hostname on screen is not a difference an editor can act on. */}
              <DiffCells prod={row.prod} new={row.new} mono equal={row.state === 'same'} />
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

/**
 * The one place the three checks are unified, and now the one place an editor
 * can work down a page without leaving a tab.
 */
function Tasks({ findings, control, sides }) {
  const byCheck = useMemo(() => {
    const groups = new Map();
    for (const finding of findings) {
      if (!groups.has(finding.check)) groups.set(finding.check, []);
      groups.get(finding.check).push(finding);
    }
    return [...groups];
  }, [findings]);

  if (!findings.length) return <Empty>Deze pagina is gelijk aan productie.</Empty>;

  return (
    <div className="space-y-4">
      {byCheck.map(([check, group]) => (
        <div key={check}>
          <h3 className="mb-1 flex items-center gap-2 font-semibold">
            {CHECK_LABEL[check]}
            <Chip value={group.length} label="open" />
          </h3>
          <ul className="text-sm">
            {group.map((finding) => (
              <li key={finding.id} className="flex flex-wrap items-start gap-2 border-b border-slate-100 py-1.5 last:border-0">
                <ClassPill class={finding.class} />
                <Detail finding={finding} />
                <span className="min-w-48 flex-1 break-words">
                  {finding.prod ?? '—'}
                  <span className="mx-1 text-slate-400">→</span>
                  {finding.new ?? '—'}
                  <Section anchorHeading={finding.anchorHeading} sides={sides} />
                </span>
                <Occurrences finding={finding} />
                {control(finding)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const Empty = ({ children }) => <p className="py-6 text-sm text-slate-500">{children}</p>;

/**
 * Ticket 33. On `heading-level` and `tag-changed` the two text columns are equal,
 * so without this the row reads as a finding about nothing. The Diff tab needs no
 * such thing: it prints the tag of each element next to the words.
 */
const Detail = ({ finding }) => (
  finding.detail
    ? <span className="ml-2 font-mono text-[11px] text-slate-500">{finding.detail}</span>
    : null
);

/**
 * Ticket 34. A finding reading `hier` or `carports` used to send an editor hunting
 * through the page by eye. This is the section it sits in: the nearest heading
 * before it in document order, which is what the compare stage recorded.
 *
 * With `sides` it also carries the two deep links, for a finding whose own text is
 * not words on the page — a link target and an image key are not there to scroll
 * to. A content row does not pass them, because its own cells carry a link to the
 * exact words, which is closer.
 */
const Section = ({ anchorHeading, sides = null }) => (
  anchorHeading
    ? (
      <div className="mt-1 flex items-baseline gap-1 text-[11px] text-slate-500">
        <span className="truncate" title={anchorHeading}>onder “{anchorHeading}”</span>
        {sides && <Locate url={sides.production.url} text={anchorHeading} side="productie" />}
        {sides && <Locate url={sides.new.url} text={anchorHeading} side="de nieuwe site" />}
      </div>
    )
    : null
);

/**
 * Opens the live page scrolled to this text, with a `#:~:text=` fragment the
 * browser resolves against what it rendered. That is why it takes the **literal**
 * text and never the normalised one: tier 1 folds curly quotes, NBSP and dashes,
 * and a folded string is not on the page to be found.
 */
function Locate({ url, text, side }) {
  const href = textFragmentUrl(url, text);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={`Open op ${side}, bij deze tekst`}
      className="mr-2 text-[11px] text-slate-400 no-underline hover:text-slate-700"
    >
      ↗
    </a>
  );
}

/**
 * One rename repeated six times is one finding, and the tick acts on all six. An
 * editor who fixes the first and believes the page is done is wrong five times.
 */
const Occurrences = ({ finding }) => (
  finding && finding.occurrences > 1
    ? (
      <span className="ml-2 rounded bg-slate-900 px-1.5 text-[11px] text-white">
        ×{finding.occurrences}
      </span>
    )
    : null
);
