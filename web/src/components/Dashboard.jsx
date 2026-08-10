import { useMemo, useState } from 'react';
import { Bar, Chip, ClassFilterPills, FilterBanner } from './Chips.jsx';
import { LogBanner } from './Progress.jsx';
import { CHECK_LABEL } from '../lib/classes.mjs';
import { CHROME, INK } from '../lib/palette.mjs';
import { useStoreOverrides } from '../lib/overrides.mjs';
import { pageHref } from '../lib/page-url.mjs';
import { groupNotChecked } from '../lib/not-checked.mjs';
import { pagesWithClasses, toggleIn } from '../lib/view.mjs';

const CHECKS = ['text', 'links', 'images'];

/**
 * Every page of **one store** on one screen. A store is what an editor is
 * responsible for (ticket 38). Even one store is too many rows to read top to
 * bottom, so the list is sorted worst-first and filterable — the question this
 * view answers is "which page do I open next", not "what is on page 84".
 *
 * Axis A only. Ticket 11 gave the coverage axis its own bar, which must never be
 * summed with this one, and ticket 23 owns its store-level view.
 */
export default function Dashboard({
  pages, notChecked = [], regions = [],
  regionsChanged = { store: null, reason: null, changes: [] },
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('worst');
  // Ticket 36 gives the class pills the same semantics the content view's filter
  // has: a pure view filter, session-only, that moves no bar and no roll-up. The
  // chips above the table keep counting every comparable page.
  const [classes, setClasses] = useState(/** @type {string[]} */ ([]));

  // One-sided pages are out of the bar from the first day: ticket 20 owns them,
  // and seventy-six undecidable rows would poison the roll-up.
  const comparable = useMemo(() => pages.filter((page) => page.comparable), [pages]);
  const oneSided = pages.filter((page) => !page.comparable);

  const log = useStoreOverrides({ pages: comparable });

  /** The open count **after** overrides, so the worst page is the worst remaining page. */
  const openOf = (page) => log.byPage.get(`${page.store}/${page.page}`)?.bar.open ?? page.summary.shown;
  const barOf = (page) => log.byPage.get(`${page.store}/${page.page}`)?.bar;

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const found = pagesWithClasses(comparable, classes)
      .filter((page) => !needle || page.page.toLowerCase().includes(needle));
    return [...found].sort((a, b) => (
      sort === 'worst' ? openOf(b) - openOf(a) : a.page.localeCompare(b.page)
    ));
  }, [comparable, classes, query, sort, log.byPage]);

  const totals = useMemo(() => {
    const byClass = {};
    let hidden = 0;
    for (const page of comparable) {
      hidden += page.summary.hidden;
      for (const [cls, count] of Object.entries(page.summary.byClass)) {
        byClass[cls] = (byClass[cls] ?? 0) + count;
      }
    }
    // Clean means clean **now**: no open findings after the overrides.
    const clean = comparable.filter((page) => openOf(page) === 0).length;
    return { hidden, clean, byClass, ...log.derived.bar };
  }, [comparable, log.derived]);

  return (
    <div className="space-y-6">
      <LogBanner
        connected={log.connected}
        notConnectedReason={log.notConnectedReason}
        ready={log.ready}
        error={log.error}
      />

      <section className="flex flex-wrap items-center gap-2">
        <Chip value={comparable.length} label="pagina's vergeleken" tone="dark" />
        <Chip value={totals.open} label="verschillen open" tone="attention" />
        <Chip value={totals.closed} label="afgehandeld" tone="info" />
        <Chip value={totals.clean} label="pagina's gelijk" tone="info" />
        {totals.contradicted > 0 && (
          <Chip
            value={totals.contradicted}
            label="nog niet opgelost"
            tone="attention"
            title="Geclaimd opgelost, maar een latere waarneming ziet het verschil nog."
          />
        )}
        <Chip
          value={log.derived.reviewedFresh}
          label="pagina's gecontroleerd"
          title="Een mens heeft alles op deze pagina bekeken, ook wat het gereedschap niet ziet."
        />
        <Chip value={totals.hidden} label="verborgen (ruis)" />
        <Chip
          value={oneSided.length}
          label="eenzijdig"
          title="Een van de twee kanten antwoordt geen 200. Ticket 20 beslist wat hiermee gebeurt."
        />
        <Chip
          value={notChecked.length}
          label="niet gecontroleerd"
          title="Gevonden en zichtbaar, maar er is niets te vergelijken. Elke pagina zegt onderaan waarom."
        />
      </section>

      <section className="rounded border border-slate-200 bg-white">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <ClassFilterPills
            counts={Object.entries(totals.byClass)
              .sort((a, b) => b[1] - a[1])
              .map(([cls, count]) => ({ class: cls, count }))}
            selected={classes}
            onToggle={(cls) => setClasses(toggleIn(classes, cls))}
            title={(cls) => `Toon alleen pagina's met ${cls}. De getallen hierboven veranderen niet.`}
          />
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Zoek een pagina"
              className="rounded border border-slate-300 px-2 py-1 text-sm"
            />
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded border border-slate-300 px-2 py-1 text-sm"
            >
              <option value="worst">Meeste verschillen eerst</option>
              <option value="name">Op naam</option>
            </select>
          </div>
        </header>

        {classes.length > 0 && (
          <FilterBanner onClear={() => setClasses([])} className="border-b px-4 py-2">
            <strong>Gefilterd op {classes.join(', ')}.</strong>
            {rows.length} van {comparable.length} pagina's. De getallen hierboven tellen alle pagina's.
          </FilterBanner>
        )}

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2 font-medium">Pagina</th>
              <th className="w-40 px-4 py-2 font-medium">Open</th>
              {CHECKS.map((check) => (
                <th key={check} className="w-24 px-2 py-2 font-medium">{CHECK_LABEL[check]}</th>
              ))}
              <th className="w-24 px-4 py-2 font-medium">Verborgen</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((page) => (
              <tr key={`${page.store}/${page.page}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-2">
                  <a className={`font-medium hover:underline ${CHROME.link}`} href={pageHref(page.store, page.page)}>
                    {page.page}
                  </a>
                  <span className="ml-2 text-xs text-slate-400">{page.sides.production.units} blokken</span>
                </td>
                <td className="px-4 py-2">
                  <Bar shown={openOf(page)} units={page.sides.production.units} />
                  <span className={`ml-2 tabular-nums ${openOf(page) ? 'font-semibold' : INK.info}`}>
                    {openOf(page)}
                  </span>
                  {barOf(page)?.closed > 0 && (
                    <span className={`ml-1 text-xs ${INK.info}`}>+{barOf(page).closed} af</span>
                  )}
                </td>
                {CHECKS.map((check) => (
                  <td key={check} className="px-2 py-2 tabular-nums text-slate-600">
                    {page.summary.byCheck[check] ?? '—'}
                  </td>
                ))}
                <td className="px-4 py-2 tabular-nums text-slate-400">{page.summary.hidden}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="px-4 py-6 text-sm text-slate-500">Geen pagina gevonden.</p>
        )}
      </section>

      <Aside
        title={`Eenzijdige pagina's (${oneSided.length})`}
        note="Een kant antwoordt geen 200, dus er is niets te vergelijken. Ticket 20 beslist of dit een migratietaak wordt."
      >
        {oneSided.map((page) => (
          <li key={`${page.store}/${page.page}`} className="flex flex-wrap gap-2 py-1">
            <a className={`hover:underline ${CHROME.link}`} href={pageHref(page.store, page.page)}>{page.page}</a>
            <span className="text-slate-500">{page.skipReason}</span>
          </li>
        ))}
      </Aside>

      <Aside
        title={`Niet gecontroleerd (${notChecked.length})`}
        note="Gevonden, geteld en zichtbaar, maar er is niets te vergelijken (ticket 56). De reden staat er per groep bij. Zichtbaar uitgesloten, niet stil weggelaten."
      >
        {groupNotChecked(notChecked).map((group) => (
          <li key={group.key} className="border-t border-slate-100 py-2 first:border-0">
            <strong className="font-medium">
              {NOT_CHECKED_KIND[group.kind] ?? group.kind} ({group.pages.length})
            </strong>
            <span className="block text-slate-500">{group.reason}</span>
            <span className="mt-1 block text-slate-600">
              {group.pages.map((entry) => entry.page).join(', ')}
            </span>
          </li>
        ))}
        {notChecked.length === 0 && (
          <li className="py-1 text-slate-500">Elke gevonden pagina van deze winkel wordt gecontroleerd.</li>
        )}
      </Aside>

      <Aside
        title={`Uitgesloten regio's (${regions.length})`}
        note="Stukken binnen de contentgrens die geen redactiewerk zijn (ticket 63). Ze gaan er bij de extractie uit. Zichtbaar uitgesloten, niet stil weggelaten."
      >
        {regions.map((region) => (
          <li key={region.selector} className="py-1">
            <code className="font-medium">{region.selector}</code>
            <span className="text-slate-500"> — {REGION_KIND[region.kind] ?? region.kind}. {region.reason}</span>
            <span className="block text-slate-500">
              {region.removedOn.production.pages === 0 && region.removedOn.new.pages === 0
                ? 'In deze snapshot nergens weggehaald. Drie mogelijke oorzaken: deze winkel heeft de regio niet, de selector past niet meer, of de snapshot is ouder dan deze regel.'
                : `Weggehaald op ${region.removedOn.production.pages} pagina's op productie `
                  + `(${region.removedOn.production.units} blokken) en op ${region.removedOn.new.pages} `
                  + `op de nieuwe site (${region.removedOn.new.units} blokken).`}
            </span>
          </li>
        ))}
        <RegionCoverage {...regionsChanged} />
      </Aside>
    </div>
  );
}

/**
 * Ticket 64: the coverage of this run against the run before it. One entry is
 * anchored on a campaign, so it will stop matching the day the campaign changes,
 * and 2,600 findings come back at once. This is the line that says so, instead of
 * leaving the reader to infer it from the rows that returned.
 *
 * The verdict comes from `compare/region-coverage.mjs` and the words are written
 * here, because the crawl and the dashboard speak two languages.
 *
 * It is a statement about the whole run. A store's own numbers are the line above.
 */
function RegionCoverage({ store, reason, changes }) {
  const moved = changes.filter((change) => change.verdict !== 'unchanged');
  if (!reason && moved.length === 0) return null;

  const scope = store ? `winkel ${store}` : 'alle winkels';
  return (
    <li className="mt-2 border-t border-slate-200 pt-2">
      <strong className="font-medium">Vergeleken met de vorige snapshot ({scope})</strong>
      {reason
        ? <span className="block text-slate-500">Niet vergeleken. {REGION_VERDICT_REASON}</span>
        : moved.map((change) => (
          <span key={change.selector} className="block text-slate-500">
            <code>{change.selector}</code>
            {' — '}
            {REGION_VERDICT[change.verdict](change)}
          </span>
        ))}
    </li>
  );
}

const REGION_VERDICT_REASON = 'De vorige snapshot heeft een andere omvang, of hij is er niet. '
  + 'De volgende run vergelijkt weer.';

/**
 * One sentence for each verdict. `unchanged` has none, because a run where
 * nothing moved must stay quiet.
 */
const REGION_VERDICT = {
  'stopped-matching': (change) => `weggehaald op ${change.was.pages} pagina's in de vorige snapshot, `
    + `en nu op ${change.now.pages}. Deze regel past niet meer, en de regio staat weer in het log. `
    + 'Een anker op een campagne stopt met passen als de campagne verandert.',
  'started-matching': (change) => `weggehaald op ${change.was.pages} pagina's in de vorige snapshot, `
    + `en nu op ${change.now.pages}. Deze regel past sinds deze run.`,
  narrowed: (change) => `weggehaald op ${change.was.pages} pagina's in de vorige snapshot, `
    + `en nu op ${change.now.pages}. Deze regel past op minder pagina's dan eerst.`,
  widened: (change) => `weggehaald op ${change.was.pages} pagina's in de vorige snapshot, `
    + `en nu op ${change.now.pages}. Deze regel past op meer pagina's dan eerst.`,
  'new-entry': (change) => `nieuw in de lijst, weggehaald op ${change.now.pages} pagina's. `
    + 'De vorige snapshot heeft er geen getal voor.',
  'left-the-list': (change) => 'staat niet meer in de lijst. Weggehaald op '
    + `${change.was.pages} pagina's in de vorige snapshot.`,
};

/**
 * The three ways a page is not checked, in the language the dashboard speaks.
 * Two of them are decisions and one is an accident, and an editor acts on them
 * differently, so they never share a word.
 */
const NOT_CHECKED_KIND = {
  'dropped-by-rule': 'Geen contentpagina',
  'excluded-page': 'Bewust buiten het log',
  'not-crawled': 'Niet opgehaald',
};

/** The two words of the vocabulary, in the language the dashboard speaks. */
const REGION_KIND = {
  'non-editorial': 'Niet-redactioneel: de catalogus of een extensie maakt de tekst',
  'legacy-only': 'Alleen oud: geschreven, maar de nieuwe site krijgt het niet',
};

function Aside({ title, note, children }) {
  return (
    <section className="rounded border border-slate-200 bg-white p-4">
      <h2 className="font-semibold">{title}</h2>
      <p className="mb-2 text-sm text-slate-500">{note}</p>
      <ul className="text-sm">{children}</ul>
    </section>
  );
}
