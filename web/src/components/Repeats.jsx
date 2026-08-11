import { useState } from 'react';
import { barOf } from '../../../overrides/state.mjs';
import { Detail, Occurrences, onePageTitle } from './Annotations.jsx';
import { ClassPill } from './Chips.jsx';
import { STATE } from './OverrideControl.jsx';
import { CHROME, INK, PILL } from '../lib/palette.mjs';
import { pageHref } from '../lib/page-url.mjs';
import { findingsIn } from '../lib/view.mjs';

/**
 * A store's work listed as differences rather than as pages (ticket 81).
 *
 * One footer line that is wrong on thirty pages is **one row** here, saying it is on
 * thirty pages, and opening it shows them. An editor stops meeting the same
 * difference thirty times.
 *
 * It is the second view over the derivation the page list already uses, and not a
 * second surface: `repeatsInStore()` decides what the rows are, `repeatsWithClasses()`
 * decides which of them the class pills leave on screen, and this component draws
 * them. The pills above it are the ones the page list uses, so a pill that lists its
 * findings directly *is* this view with a class pre-selected.
 *
 * **The backlog is not drained.** A repeat is a grouping and never a finding, so a
 * decision on a repeat is still one decision per finding — every number here says how
 * much is *decided*, and none of them counts down to an empty list.
 */
export default function Repeats({ repeats, byFinding }) {
  // A rendering budget, in the manner of the clamp: it is about length and not about
  // findings. The count below says how many rows there are, so nothing here is
  // hidden — only not drawn yet. The dashboard remounts this component when the
  // class filter changes, so a narrowed list starts at the top of its own budget.
  const [drawn, setDrawn] = useState(PAGE_SIZE);

  // Both numbers come from **this** list, so they cannot disagree about what they
  // are counting. A filtered row count over an unfiltered finding count would be
  // exactly the mismatched pair this ticket exists to stop.
  const findings = findingsIn(repeats);

  if (repeats.length === 0) {
    return <p className="px-4 py-6 text-sm text-slate-500">Geen verschil gevonden.</p>;
  }

  return (
    <>
      <ul className="text-sm">
        {repeats.slice(0, drawn).map((repeat) => (
          <Row key={repeat.key} repeat={repeat} byFinding={byFinding} />
        ))}
      </ul>

      {drawn < repeats.length && (
        <p className="border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
          {drawn} van {repeats.length} verschillen getekend.{' '}
          <button
            type="button"
            onClick={() => setDrawn(drawn + PAGE_SIZE)}
            className="rounded border border-slate-300 px-2 py-0.5 text-xs"
          >
            Volgende {PAGE_SIZE} tonen
          </button>
        </p>
      )}

      <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
        {repeats.length} verschillen over {findings} bevindingen. Het groeperen scheelt
        leeswerk en geen werk: één beslissing op een regel blijft één beslissing per
        bevinding, dus deze lijst raakt niet leeg. Wat vooruitgaat, is hoeveel er
        besloten is.
      </p>
    </>
  );
}

/** How many rows are drawn at once, and how many the button adds. */
const PAGE_SIZE = 100;

/**
 * What the `×N` mark means on a repeat, which is not what it means on a finding: it
 * counts over the pages, and the row already says how many pages there are. Confusing
 * the two is this ticket's named trap, so the two sentences are written apart.
 */
const acrossPagesTitle = (repeat) => `${repeat.occurrences} keer in totaal, op ${repeat.on.length} `
  + "pagina's. Op sommige van die pagina's staat het verschil meer dan één keer.";

function Row({ repeat, byFinding }) {
  const [open, setOpen] = useState(false);

  // The same four rules the page bar obeys, over this difference's findings: a mute
  // leaves the denominator, a dismissal enters the numerator, and a contradicted
  // claim reads as open.
  //
  // The lookup cannot miss: `byFinding` is derived from the same store summaries the
  // repeats are, so every id here is in it. It is left to throw rather than to skip a
  // missing one, because a skipped member would quietly lower the denominator and the
  // row would then say *3 van 3 afgehandeld* about four findings.
  const bar = barOf(repeat.on.map((entry) => byFinding.get(entry.id)));

  return (
    <li className="border-b border-slate-100 last:border-0">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full flex-wrap items-start gap-2 px-4 py-2 text-left hover:bg-slate-50"
      >
        <span className="mt-0.5 shrink-0">
          <ClassPill class={repeat.class} />
          <Detail detail={repeat.detail} />
          <MatchedFields fields={repeat.fields} />
        </span>

        <span className="min-w-48 flex-1 break-words">
          {repeat.prod ?? '—'}
          <span className="mx-1 text-slate-400">→</span>
          {repeat.new ?? '—'}
        </span>

        <span className="shrink-0 text-right text-xs">
          {/* The page count is the size of the difference. There is no separate
              finding count beside it: the page is inside the finding id, so one page
              carries one finding of this difference and the two numbers are one
              number. `occurrences` is the number that genuinely differs — the same
              difference several times on a single page — and it is named apart. */}
          <span className="tabular-nums font-medium">op {repeat.on.length} pagina's</span>
          {/* Drawn only when it exceeds the page count, so the mark appears exactly
              when it says something the page count does not. */}
          {repeat.occurrences > repeat.on.length && (
            <Occurrences count={repeat.occurrences} title={acrossPagesTitle(repeat)} />
          )}
          <span className={`ml-2 tabular-nums ${bar.closed ? INK.info : 'text-slate-400'}`}>
            {bar.closed} van {bar.denominator} afgehandeld
          </span>
        </span>
      </button>

      {open && (
        <ul className="border-t border-slate-100 bg-slate-50 px-4 py-2 text-sm">
          {/* A page name opens the **whole** content view for that page, and not a
              fragment of it filtered to this difference. The question a one-sided
              difference asks is where the text belongs, and only document order
              answers it (ADR 0006). */}
          {repeat.on.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-baseline gap-2 py-0.5">
              <a className={`hover:underline ${CHROME.link}`} href={pageHref(repeat.store, entry.page)}>
                {entry.page}
              </a>
              <Occurrences count={entry.occurrences} title={onePageTitle(entry.occurrences)} />
              <FindingState finding={byFinding.get(entry.id)} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * Where the searched words were found, on a row a search put on screen (ticket 82).
 *
 * A row reached by four different fields is four different reasons to look at it, and the
 * two texts are not the only place a term can hit: on a links check the same two columns
 * hold the target instead. Without this the row shows words that do not contain what was
 * typed — because what was typed is in the link, the heading or the page name.
 *
 * Nothing here when there are no fields, which is the *Verschillen* view: it lists every
 * difference and no term was typed, so there is nowhere a match could have been.
 */
const MatchedFields = ({ fields }) => (
  fields?.length
    ? (
      <span className="ml-2 text-[11px] text-slate-500">
        in {fields.map((field) => FIELD_LABEL[field]).join(', ')}
      </span>
    )
    : null
);

/** The six searchable fields, in the language the dashboard speaks. */
const FIELD_LABEL = {
  page: 'de paginanaam',
  prodText: 'de tekst op productie',
  newText: 'de tekst op de nieuwe site',
  linkTarget: 'het linkdoel',
  linkText: 'de linktekst',
  anchorHeading: 'het kopje',
};

/**
 * What is decided about this finding, in **the log's own words for it** — the map
 * the override control reads, and not a second copy of it. An `open` finding says
 * nothing: it is the default, and a badge on every row would make the decided ones
 * harder to find rather than easier.
 */
const FindingState = ({ finding }) => (
  finding && finding.state !== 'open'
    ? (
      <span className={`rounded px-1.5 py-0.5 text-[11px] ${PILL[STATE[finding.state].tone]}`}>
        {STATE[finding.state].label}
      </span>
    )
    : null
);
