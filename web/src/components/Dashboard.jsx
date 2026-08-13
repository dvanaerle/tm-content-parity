import { useCallback, useMemo } from 'react';
import { Bar, Chip, ClassFilterBanner, ClassFilterPills } from './Chips.jsx';
import { EditorPrompt, LogBanner } from './Progress.jsx';
import { ClassGroups } from './Repeats.jsx';
import Search from './Search.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Input } from './ui/input.jsx';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from './ui/select.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group.jsx';
import { CHECK_LABEL } from '../lib/classes.mjs';
import { CHROME, INK } from '../lib/palette.mjs';
import { cn } from '../lib/utils.js';
import { useEditor, useStoreOverrides } from '../lib/overrides.mjs';
import { pageHref } from '../lib/page-url.mjs';
import { useScreen } from '../lib/screen-url.mjs';
import { groupNotChecked } from '../lib/not-checked.mjs';
import { pagesWithClasses, repeatsInStore, repeatsWithClasses, toggleIn } from '../lib/view.mjs';

const CHECKS = ['text', 'links', 'images'];

/**
 * One store's work on one screen. A store is what an editor is responsible for
 * (ticket 38).
 *
 * **Two views over one derivation** since ticket 81, and the toggle between them is
 * the whole of the difference:
 *
 * - *Repeats* lists the store's **repeats**: one row for one difference, saying
 *   how many pages carry it. It answers "what do I decide next".
 * - *Pages* lists the store's pages, worst-first. It answers "which page do I
 *   open next", which is what this dashboard has always answered.
 *
 * Neither is a second surface. The class pills, the search box and the counts above
 * are one set, and both views read the same filter — so a pill that lists its
 * findings directly is *Repeats* with a class pre-selected.
 *
 * The box **searches the content** since ticket 82, and typing in it puts the result in
 * place of either view. It used to match a page name, which is now one of the six fields
 * it searches, so the old question is still asked by the one box that is left. The result
 * draws repeat rows through the same component *Repeats* draws, which keeps this a
 * third reading of one derivation rather than a third surface.
 *
 * Axis A only. Ticket 11 gave the coverage axis its own bar, which must never be
 * summed with this one, and ticket 23 owns its store-level view.
 */
export default function Dashboard({
  store, pages, notChecked = [], regions = [],
  regionsChanged = { store: null, reason: null, changes: [] },
}) {
  /*
   * Every control on this screen, in the **address bar** since ticket 109.
   *
   * It was five pieces of session state, so opening a page threw all of them away: an
   * editor working down a `copy` filter opened the third page on the list, pressed
   * Back, and got the unfiltered queue from the top. Now the screen is the URL, so
   * Back restores it and the link can be sent to a colleague.
   *
   * The semantics are untouched. Ticket 36 gives the class pills a pure view filter
   * that moves no bar and no roll-up, and the chips above still count every comparable
   * page; *include closed* still belongs to the search alone; *Repeats* still
   * lands first. `screen-url.mjs` only says where the state is kept.
   */
  const { screen, patch, search } = useScreen();
  const { query, sort, includeClosed, view, classes } = screen;

  /**
   * Every link off this dashboard into a page, built in one place.
   *
   * It is one prop rather than a store and a back-query drilled separately, because it
   * passes through four components to reach the row that draws it — and the leaves then
   * do not have to know that a way back exists at all.
   *
   * The **store is an argument** and not closed over. A note in the search result
   * carries the store it was written on, and reading the event's own store is what
   * keeps that link honest if the two ever disagree.
   */
  const link = useCallback(
    (linkStore, page, finding = null) => pageHref(linkStore, page, { finding, back: search }),
    [search],
  );

  // One-sided pages are out of the bar from the first day: ticket 20 owns them,
  // and seventy-six undecidable rows would poison the roll-up.
  const comparable = useMemo(() => pages.filter((page) => page.comparable), [pages]);
  const oneSided = pages.filter((page) => !page.comparable);

  // The same name the page view writes under, out of the same `localStorage` key. A
  // repeat row can write since ticket 31, and every row it writes carries the editor.
  const { editor, save } = useEditor();
  const log = useStoreOverrides({ pages: comparable, editor });

  /** The open count **after** overrides, so the worst page is the worst remaining page. */
  const openOf = (page) => log.byPage.get(`${page.store}/${page.page}`)?.bar.open ?? page.summary.work;
  const barOf = (page) => log.byPage.get(`${page.store}/${page.page}`)?.bar;

  // A typed term puts the search on screen in place of either view. It answers past both
  // of them — a finding anywhere in the store, with the pages it is on — so narrowing one
  // of the two lists as well would be two answers to one question.
  const searching = query.trim().length > 0;

  const rows = useMemo(() => {
    const found = pagesWithClasses(comparable, classes);
    return [...found].sort((a, b) => (
      sort === 'worst' ? openOf(b) - openOf(a) : a.page.localeCompare(b.page)
    ));
  }, [comparable, classes, sort, log.byPage]);

  // The store's differences, grouped. It is derived from the **summaries the page
  // list already holds**, so the two views are two readings of one array and no text
  // crosses the wire twice.
  const repeats = useMemo(() => repeatsInStore(comparable), [comparable]);
  const shownRepeats = useMemo(() => repeatsWithClasses(repeats, classes), [repeats, classes]);

  /**
   * What the amber strip counts, which is whichever list is under it.
   *
   * Asked once rather than three times in the strip's own props: *how many, of how many,
   * of what* is one answer about one list, and three separate readings of `view` are
   * three chances for the noun to end up over the other list's number. The searching
   * case is absent on purpose — a search counts its own result, and only `Search` holds
   * that count.
   */
  const narrowed = view === 'repeats'
    ? { shown: shownRepeats.length, total: repeats.length, noun: 'differences' }
    : { shown: rows.length, total: comparable.length, noun: 'pages' };

  /** Every derived finding of the store by id, so a repeat row can say what is decided. */
  const byFinding = useMemo(() => {
    const index = new Map();
    for (const page of log.derived.pages) {
      for (const finding of page.findings) index.set(finding.id, finding);
    }
    return index;
  }, [log.derived]);

  /**
   * What a repeat row needs to be able to decide, in one prop.
   *
   * It is a bag rather than four props because it passes through four components to
   * reach the row that uses it, and it says **why** it cannot write rather than merely
   * that it cannot: a control that vanishes without a reason reads as a missing feature.
   */
  const bulk = useMemo(() => ({
    canWrite: log.canWrite,
    busy: log.busy,
    appendMany: log.appendMany,
    // The hook's own sentence about its own flag, not a second reading of the four
    // conditions behind it.
    notWritingReason: log.notWritingReason,
  }), [log.canWrite, log.busy, log.appendMany, log.notWritingReason]);

  const totals = useMemo(() => {
    const byClass = {};
    // The chip below says *hidden (noise)*, so it counts what is actually hidden:
    // the `diagnostic` findings. Ticket 75 moved `information` out from behind the
    // toggle, and it is on screen on the page it is on.
    let diagnostic = 0;
    for (const page of comparable) {
      diagnostic += page.summary.diagnostic;
      for (const [cls, count] of Object.entries(page.summary.byClass)) {
        byClass[cls] = (byClass[cls] ?? 0) + count;
      }
    }
    // Clean means clean **now**: no open findings after the overrides.
    const clean = comparable.filter((page) => openOf(page) === 0).length;
    return { diagnostic, clean, byClass, ...log.derived.bar };
  }, [comparable, log.derived]);

  return (
    <div className="space-y-6">
      <LogBanner
        connected={log.connected}
        notConnectedReason={log.notConnectedReason}
        ready={log.ready}
        error={log.error}
      />

      {/* The name lives here since ticket 31: this screen can write now, and it wrote
          nothing before. It is one field and it is asked for once, not per row. */}
      {log.connected && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <EditorPrompt editor={editor} save={save} />
          <span className="text-muted-foreground">
            {editor
              ? 'A decision on a difference is recorded under this name, for each finding.'
              : 'Give your name to decide a difference in one press. Each decision carries a name.'}
          </span>
        </div>
      )}

      <section className="flex flex-wrap items-center gap-2">
        <Chip value={comparable.length} label="pages compared" />
        <Chip value={totals.open} label="differences open" tone="attention" />
        <Chip value={totals.closed} label="closed" tone="added" />
        <Chip value={totals.clean} label="pages equal" tone="added" />
        {totals.contradicted > 0 && (
          <Chip
            value={totals.contradicted}
            label="claimed fixed, still differs"
            tone="attention"
            title="Claimed fixed, but a later observation still sees the difference."
          />
        )}
        <Chip
          value={log.derived.reviewedFresh}
          label="pages reviewed"
          title="A human looked at everything on this page, also at what the tool cannot see."
        />
        <Chip value={totals.diagnostic} label="hidden (noise)" />
        <Chip
          value={oneSided.length}
          label="one-sided"
          title="One of the two sides does not answer 200. Ticket 20 decides what happens with these."
        />
        <Chip
          value={notChecked.length}
          label="not checked"
          title="Found and visible, but there is nothing to compare. The bottom of this page says why, for each one."
        />
      </section>

      <Card className="gap-0 py-0">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b py-3">
          <ClassFilterPills
            counts={Object.entries(totals.byClass)
              .sort((a, b) => b[1] - a[1])
              .map(([cls, count]) => ({ class: cls, count }))}
            selected={classes}
            onToggle={(cls) => patch({ classes: toggleIn(classes, cls) })}
            // The counts stay the store's own — a pill says how much of this kind there
            // is, which is not a question about what is on screen. What a press *does*
            // depends on which of the three lists is under it, so the tooltip does too.
            title={(cls) => {
              if (searching) return `Search inside ${cls} only. The counts above do not change.`;
              return view === 'repeats'
                ? `Show the differences of class ${cls} only. The counts above do not change.`
                : `Show the pages with ${cls} only. The counts above do not change.`;
            }}
          />
          {/* `flex-wrap` here and not only on the `CardHeader`: the header wrapped, but
              this inner group did not, so its three controls were measured as one
              indivisible 386 pixel run and hung 27 pixels past a 399 pixel viewport —
              taking the sort `Select`'s label off the side of the screen with them.
              The search box gives up its fixed width on the way down for the same
              reason: `w-56` is 224 pixels of a 319 pixel card, which leaves the switch
              and the select nowhere to go. */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            {/* One box, and it searches the content (ticket 82). It used to match a page
                name and nothing else, and it lived with the page list because that was
                the only list it could narrow. The page key is one of the six fields it
                now searches, so the old question is still asked — and there is one box
                on the screen rather than the two ticket 12 already cleaned up once. */}
            <Input
              type="search"
              value={query}
              onChange={(event) => patch({ query: event.target.value })}
              placeholder="Search the content"
              title="Searches the text, the links, the headings and the page names of this store."
            />
            {/* The switch belongs to the two views, and a search answers past both of
                them, so it steps aside while one is on screen. */}
            {!searching && <ViewSwitch view={view} onChange={(next) => patch({ view: next })} />}
            {!searching && view === 'pages' && (
              // A native select works without JavaScript and this one does not. Nothing is
              // lost: the control and its state already live inside a `client:load` island,
              // so the sort was inert without JavaScript before this swap as well.
              <Select value={sort} onValueChange={(next) => patch({ sort: next })} items={SORT_LABEL}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                {/* The popup sizes to its own longest option, not to the trigger.
                    shadcn's default is `w-(--anchor-width)`, which assumes the trigger
                    is the wider box — and against a `w-fit` trigger it never is. The
                    trigger keeps 30 pixels clear on the right for its chevron while a
                    `SelectItem` keeps 32 for the check, so every option gets two pixels
                    less room than the label that sized the anchor, and the popup's
                    `overflow-x-hidden` renders the shortfall as a clipped word. A
                    `w-fit` trigger is also sized to the *selected* option, so any longer
                    option was cut off regardless.

                    Both floors are one `max()` class on purpose: written as two
                    `min-w-*` classes they are one utility group with no variant between
                    them, and `tailwind-merge` would keep only the last — the same trap
                    the tab strip hit, from the other side.

                    It is corrected here and not in `ui/select.jsx`, which stays exactly
                    as shadcn ships it so a re-add can never drop a local fix. */}
                <SelectContent className="w-auto min-w-[max(var(--anchor-width),9rem)] max-w-(--available-width)">
                  <SelectGroup>
                    {Object.entries(SORT_LABEL).map(([name, label]) => (
                      <SelectItem key={name} value={name}>{label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {/* The classes go along (ticket 102). A search used to answer past the pills
              as well as past the two views, which threw away the editor's answer to
              *which kind of difference am I working on* the moment they asked a second
              question. The strip that says a filter is on goes with them, and is drawn
              inside `Search`: its denominator is a count of the result, and only that
              component has it. */}
          {searching && (
            <Search
              store={store}
              pages={comparable}
              term={query}
              classes={classes}
              onClearClasses={() => patch({ classes: [] })}
              byFinding={byFinding}
              events={log.events}
              includeClosed={includeClosed}
              onIncludeClosed={(next) => patch({ includeClosed: next })}
              bulk={bulk}
              link={link}
            />
          )}

          {!searching && (
            <ClassFilterBanner
              classes={classes}
              {...narrowed}
              onClear={() => patch({ classes: [] })}
              className="border-b px-4 py-2"
            />
          )}

          {!searching && view === 'repeats' && (
            // Keyed on the filter, so a narrowed list starts at the top of its own
            // rendering budget, with its groups open on the pills that narrowed it.
            // A budget carried over from the wider list would say *100 of 100
            // drawn* over a list of 12.
            //
            // Ticket 100: the rows arrive in a class group for each class. The list is
            // already narrowed to the pills here, and the classes go along so the groups
            // can draw the selected ones only — the same filter said once, to two things
            // that must agree about it.
            <ClassGroups
              key={classes.join(',')}
              repeats={shownRepeats}
              classes={classes}
              byFinding={byFinding}
              bulk={bulk}
              link={link}
            />
          )}

          {!searching && view === 'pages' && (
          <Table>
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wide">
                <TableHead className="px-4 text-muted-foreground">Page</TableHead>
                <TableHead className="w-40 px-4 text-muted-foreground">Open</TableHead>
                {CHECKS.map((check) => (
                  <TableHead key={check} className="w-24 text-muted-foreground">{CHECK_LABEL[check]}</TableHead>
                ))}
                <TableHead className="w-24 px-4 text-muted-foreground">Hidden</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((page) => (
                <TableRow key={`${page.store}/${page.page}`}>
                  <TableCell className="px-4">
                    <a className={cn('font-medium hover:underline', CHROME.link)} href={link(page.store, page.page)}>
                      {page.page}
                    </a>
                    <span className="ml-2 text-xs text-muted-foreground">{page.sides.production.units} blocks</span>
                  </TableCell>
                  <TableCell className="px-4">
                    <Bar shown={openOf(page)} units={page.sides.production.units} />
                    <span className={cn('ml-2 tabular-nums', openOf(page) ? 'font-semibold' : INK.added)}>
                      {openOf(page)}
                    </span>
                    {barOf(page)?.closed > 0 && (
                      <span className={cn('ml-1 text-xs', INK.added)}>+{barOf(page).closed} closed</span>
                    )}
                  </TableCell>
                  {CHECKS.map((check) => (
                    <TableCell key={check} className="tabular-nums text-muted-foreground">
                      {page.summary.byCheck[check] ?? '—'}
                    </TableCell>
                  ))}
                  <TableCell className="px-4 tabular-nums text-muted-foreground">{page.summary.diagnostic}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
          {!searching && view === 'pages' && rows.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground">No page found.</p>
          )}
        </CardContent>
      </Card>

      <Aside
        title={`One-sided pages (${oneSided.length})`}
        note="One side does not answer 200, so there is nothing to compare. Ticket 20 decides whether this becomes a migration task."
      >
        {oneSided.map((page) => (
          <li key={`${page.store}/${page.page}`} className="flex flex-wrap gap-2 py-1">
            <a className={`hover:underline ${CHROME.link}`} href={link(page.store, page.page)}>{page.page}</a>
            <span className="text-muted-foreground">{page.skipReason}</span>
          </li>
        ))}
      </Aside>

      <Aside
        title={`Not checked (${notChecked.length})`}
        note="Found, counted and visible, but there is nothing to compare (ticket 56). Each group states its reason. Excluded in view, not left out silently."
      >
        {groupNotChecked(notChecked).map((group) => (
          <li key={group.key} className="border-t py-2 first:border-0">
            <strong className="font-medium">
              {NOT_CHECKED_KIND[group.kind] ?? group.kind} ({group.pages.length})
            </strong>
            <span className="block text-muted-foreground">{group.reason}</span>
            <span className="mt-1 block text-muted-foreground">
              {group.pages.map((entry) => entry.page).join(', ')}
            </span>
          </li>
        ))}
        {notChecked.length === 0 && (
          <li className="py-1 text-muted-foreground">Each page found in this store is checked.</li>
        )}
      </Aside>

      <Aside
        title={`Excluded regions (${regions.length})`}
        note="Parts inside the content boundary that are not editor work (ticket 63). They leave at extraction. Excluded in view, not left out silently."
      >
        {regions.map((region) => (
          <li key={region.selector} className="py-1">
            <code className="font-medium">{region.selector}</code>
            <span className="text-muted-foreground"> — {REGION_KIND[region.kind] ?? region.kind}. {region.reason}</span>
            <span className="block text-muted-foreground">
              {region.removedOn.production.pages === 0 && region.removedOn.new.pages === 0
                ? 'Removed nowhere in this snapshot. Three possible causes: this store does not have the region, the selector no longer matches, or the snapshot is older than this rule.'
                : `Removed on ${region.removedOn.production.pages} pages on production `
                  + `(${region.removedOn.production.units} blocks) and on ${region.removedOn.new.pages} `
                  + `on the new site (${region.removedOn.new.units} blocks).`}
            </span>
          </li>
        ))}
        <RegionCoverage {...regionsChanged} />
      </Aside>
    </div>
  );
}

/**
 * The two readings of one store, and the tooltip that says what each one answers.
 * It is a switch and not a tab strip: a tab strip carries a badge per tab, and a
 * count of repeats beside a count of pages would read as two amounts of work.
 *
 * It is a single-selection `ToggleGroup`, which is what buys the arrow keys and the
 * one Tab stop the hand-rolled row of buttons never had. A group with one value can
 * be emptied by pressing the selected button, and a view that is neither of the two
 * is not a state this screen has, so an empty change is ignored.
 *
 * Colour is still the palette's. shadcn tints the pressed item with `bg-muted` under
 * an `aria-pressed:` prefix, which outranks a plain class, so that prefix is spent on
 * `bg-transparent` and `CHROME.button` is left to draw the selected tone.
 */
/**
 * The selected segment's ground, written with the **same** `aria-pressed:` prefix that
 * shadcn writes `aria-pressed:bg-muted` with, so `tailwind-merge` sees one group and
 * the last one wins. Countering the grey with `aria-pressed:bg-transparent` and letting
 * `CHROME.button` paint underneath does not work and is worth saying why: an attribute
 * selector outranks a plain class, so the transparent ground beat the brand green and
 * the white label was drawn on white. It was invisible, not wrong-coloured.
 *
 * The hexes are `CHROME.button`'s, transcribed rather than interpolated, because a
 * prefix assembled around a palette value at runtime is a class name Tailwind never
 * sees in the source text. `CHROME.button` stays the source of the meaning, and this
 * constant has to move with it — the same bargain `OverrideControl.jsx` strikes for a
 * checked box.
 */
const PRESSED_TONE = 'aria-pressed:bg-brand aria-pressed:hover:bg-brand-dark';

function ViewSwitch({ view, onChange }) {
  return (
    <ToggleGroup
      variant="outline"
      spacing={0}
      value={[view]}
      onValueChange={(next) => next.length > 0 && onChange(next[0])}
    >
      {Object.entries(VIEW_LABEL).map(([name, { label, title }]) => (
        <ToggleGroupItem
          key={name}
          value={name}
          title={title}
          className={cn(
            PRESSED_TONE,
            view === name ? 'text-white hover:text-white' : 'text-muted-foreground',
          )}
        >
          {label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

const VIEW_LABEL = {
  repeats: {
    label: 'Repeats',
    title: 'One row for each difference, with the pages it is on. What do I decide next?',
  },
  pages: {
    label: 'Pages',
    title: 'Each page of this store, most differences first. Which page do I open next?',
  },
};

/** The two orders the page list is read in, and the words the closed control shows. */
const SORT_LABEL = {
  worst: 'Worst first',
  name: 'By name',
};

/**
 * Ticket 64: the coverage of this run against the run before it. One entry is
 * anchored on a campaign, so it will stop matching the day the campaign changes,
 * and 2,600 findings come back at once. This is the line that says so, instead of
 * leaving the reader to infer it from the rows that returned.
 *
 * The verdict comes from `compare/region-coverage.mjs` and the words are written
 * here, because a verdict is a key and a sentence is a label.
 *
 * It is a statement about the whole run. A store's own numbers are the line above.
 */
function RegionCoverage({ store, reason, changes }) {
  const moved = changes.filter((change) => change.verdict !== 'unchanged');
  if (!reason && moved.length === 0) return null;

  const scope = store ? `store ${store}` : 'all stores';
  return (
    <li className="mt-2 border-t pt-2">
      <strong className="font-medium">Compared with the previous snapshot ({scope})</strong>
      {reason
        ? <span className="block text-muted-foreground">Not compared. {REGION_VERDICT_REASON}</span>
        : moved.map((change) => (
          <span key={change.selector} className="block text-muted-foreground">
            <code>{change.selector}</code>
            {' — '}
            {REGION_VERDICT[change.verdict](change)}
          </span>
        ))}
    </li>
  );
}

const REGION_VERDICT_REASON = 'The previous snapshot has a different size, or it is absent. '
  + 'The next run compares again.';

/**
 * One sentence for each verdict. `unchanged` has none, because a run where
 * nothing moved must stay quiet.
 */
const REGION_VERDICT = {
  'stopped-matching': (change) => `removed on ${change.was.pages} pages in the previous snapshot, `
    + `and now on ${change.now.pages}. This rule no longer matches, and the region is back in the log. `
    + 'A rule anchored on a campaign stops to match when the campaign changes.',
  'started-matching': (change) => `removed on ${change.was.pages} pages in the previous snapshot, `
    + `and now on ${change.now.pages}. This rule matches since this run.`,
  narrowed: (change) => `removed on ${change.was.pages} pages in the previous snapshot, `
    + `and now on ${change.now.pages}. This rule matches fewer pages than before.`,
  widened: (change) => `removed on ${change.was.pages} pages in the previous snapshot, `
    + `and now on ${change.now.pages}. This rule matches more pages than before.`,
  'new-entry': (change) => `new in the list, removed on ${change.now.pages} pages. `
    + 'The previous snapshot has no number for it.',
  'left-the-list': (change) => 'is no longer in the list. It was removed on '
    + `${change.was.pages} pages in the previous snapshot.`,
};

/**
 * The three ways a page is not checked, as the dashboard says them. Two of them
 * are decisions and one is an accident, and an editor acts on them differently, so
 * they never share a word.
 */
const NOT_CHECKED_KIND = {
  'dropped-by-rule': 'Not a content page',
  'excluded-page': 'Outside the log on purpose',
  'not-crawled': 'Not fetched',
};

/** The two words of the vocabulary, as the dashboard says them. */
const REGION_KIND = {
  'non-editorial': 'Non-editorial: the catalogue or an extension makes the text',
  'legacy-only': 'Legacy only: written, but the new site does not get it',
};

function Aside({ title, note, children }) {
  return (
    <Card>
      <CardHeader className="gap-2">
        {/* `CardTitle` renders a div, and the heading is what puts these three panels
            in the page's outline, so the h2 stays inside it. */}
        <CardTitle><h2 className="font-semibold">{title}</h2></CardTitle>
        <p className="text-sm text-muted-foreground">{note}</p>
      </CardHeader>
      <CardContent>
        <ul className="text-sm">{children}</ul>
      </CardContent>
    </Card>
  );
}
