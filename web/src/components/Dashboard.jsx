import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnnotateBar, PageNoteMark } from './Annotate.jsx';
import { Checkbox } from './ui/checkbox.jsx';
import {
  Bar,
  BucketCount,
  Count,
  ClassFilterBanner,
  ClassFilterPills,
  PriorityFilterPills,
  PriorityPill,
  ScopeChip,
  ScopeRowButton,
} from './Chips.jsx';
import { EditorPrompt, LogBanner } from './Progress.jsx';
import { ClassGroups } from './Repeats.jsx';
import Search from './Search.jsx';
import SearchBox from './SearchBox.jsx';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card.jsx';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible.jsx';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group.jsx';
import { CHECK_LABEL, classInfo } from '../lib/classes.mjs';
import {
  awaitsDecision,
  BUCKETS,
  BUCKET_LABEL,
  BUCKET_MEANING,
  BUCKET_TONE,
} from '../lib/buckets.mjs';
import { CHROME } from '../lib/palette.mjs';
import { cn } from '../lib/utils.js';
import { NO_EDITOR, useEditor, useStoreOverrides } from '../lib/overrides.mjs';
import { pageHref } from '../lib/page-url.mjs';
import { parseTerm, withScope } from '../lib/search.mjs';
import { useScreen } from '../lib/screen-url.mjs';
import { groupNotChecked } from '../lib/not-checked.mjs';
import { CANONICAL_VIEWPORT } from '../../../shared/canonical-viewport.mjs';
import { emptyBuckets } from '../../../overrides/state.mjs';
import {
  pagesWithClasses,
  pagesWithPriorities,
  repeatsInStore,
  repeatsWithClasses,
  toggleIn,
} from '../lib/view.mjs';

const CHECKS = ['text', 'links', 'images'];

/**
 * The header's two rows of buckets, split by the vocabulary's own predicate.
 *
 * `awaitsDecision()` is total over `BUCKETS`, so between them these two draw every bucket
 * exactly once — a fourth one arrives in a row rather than falling off the screen. What
 * recedes is the record of work already done, because that is normal operation and ADR 0019
 * keeps prominent weight off it.
 */
const LEADING = BUCKETS.filter(awaitsDecision);
const RECEDING = BUCKETS.filter((bucket) => !awaitsDecision(bucket));

/**
 * The four per-check counts drop out when the table has no room for them, by the width of
 * the **container** and not of the viewport — a size query, which ADR 0015 permits and
 * ticket 02 already spends on the comparison. On a wide screen an editor loses nothing.
 *
 * Written once because eight cells wear it, four heads and four bodies. A head that dropped
 * while its cells stayed would shift every count one column to the left, which is the one
 * failure this constant exists to make impossible.
 */
const WIDE_ONLY = 'hidden @4xl:table-cell';

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
  store,
  pages,
  /**
   * The sibling store's summaries, where this store is in a language block, and an empty
   * list on `de` and `uk` (ticket 03).
   *
   * They are here for **two** readers: the repeat grouping, which spans the two stores of a
   * block where they carry the same words, and — since ticket 05 — the search, whose findings
   * half is the same grouping over the same block. Nothing else on this screen touches them:
   * not the bar, not the chips, not the pages table. A store is still the unit an editor is
   * responsible for, and the only thing that crosses the edge is a judgement about text the
   * two stores share. ADR 0021 says which half of a search moved and which did not.
   */
  siblingPages = [],
  notChecked = [],
  regions = [],
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
  const { query, sort, includeClosed, view, classes, priorities } = screen;

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

  /**
   * The sibling's comparable pages: what a press can reach and no number may read.
   *
   * One-sided pages are out of it for the same reason they are out of `comparable` — a page
   * the new site does not answer 200 on has no decidable finding on either store.
   *
   * It is a **sibling page** here, in the hook, and in the page that loads it, because that
   * is the one word `CONTEXT.md` has for it. It went by three names for a while.
   */
  const comparableSiblings = useMemo(
    () => siblingPages.filter((page) => page.comparable),
    [siblingPages],
  );

  // The same name the page view writes under, out of the same `localStorage` key. A
  // repeat row can write since ticket 31, and every row it writes carries the editor.
  const { editor, save } = useEditor();
  // `pages` is this store's numbers; the sibling's pages are what a block-spanning press can
  // touch and what no number here reads. The hook keeps that split — see its own comment.
  const log = useStoreOverrides({
    pages: comparable,
    siblingPages: comparableSiblings,
    editor,
  });

  /** The open count **after** overrides, so the worst page is the worst remaining page. */
  const openOf = (page) =>
    log.byPage.get(`${page.store}/${page.page}`)?.bar.open ?? page.summary.work;
  /**
   * The page's three counts (ticket 80), off the same derivation the bar comes from.
   *
   * A page the log has not answered for yet has no buckets, and the fallback puts its
   * work in Open: before any override is known, nothing is decided and nothing is
   * contradicted, which is what an empty log means rather than a blank cell.
   */
  const bucketsOfPage = (page) =>
    log.byPage.get(`${page.store}/${page.page}`)?.buckets ?? {
      ...emptyBuckets(),
      open: page.summary.work,
    };

  // A typed term puts the search on screen in place of either view. It answers past both
  // of them — a finding anywhere in the store, with the pages it is on — so narrowing one
  // of the two lists as well would be two answers to one question.
  const searching = query.trim().length > 0;

  // The page scope, read off the box (ticket 104 part C). The box is the source of truth
  // and this is a **reading** of it, through the same `parseTerm()` the answer is built
  // with — a second slash rule written out here is the one way the chip and the box could
  // come to disagree, and they must never.
  //
  // It is parsed here rather than taken off the search result for the reason the chip has
  // to be drawn at all: the result is `null` until the index has been fetched, and a chip
  // that appeared a beat after the scope did would flicker on every keystroke.
  //
  // `withoutScope` is what both clears write back: the words after the scope, which is what
  // an editor keeps when they drop the page they were looking inside. It is `parseTerm()`'s
  // own `text` and not a slice taken here.
  const { scope, text: withoutScope } = parseTerm(query);

  /**
   * A page handing its own key to the search (ticket 104 part E).
   *
   * One function and not a handler written into each row, because two rows carry this — the
   * pages table and the one-sided aside — and *the row writes `query` and nothing else* is
   * the whole of the part. Said twice, it would be a claim; said here, it is a fact. The
   * write is `withScope()`, which is what the suggestion list writes too, so a scope handed
   * over by a row and one chosen from the list cannot come to behave differently.
   *
   * The ticked pages go, and that is the rule `setSelected` already keeps rather than a cost
   * of this: a tick means *this page* and cannot outlive the list it was made in, and this
   * press puts the search where that table was.
   */
  const scopeTo = (key) => patch({ query: withScope(query, key) });

  /**
   * What an editor annotated this page with, or nothing. It comes off the same derivation
   * the bar does, so the annotation an editor set and the annotation the filter reads are
   * one value — ticket 83.
   */
  const annotationsOf = (page) => log.byPage.get(`${page.store}/${page.page}`)?.annotations;
  const priorityOf = (page) => annotationsOf(page)?.priority ?? null;

  const rows = useMemo(() => {
    // The two filters are **and**, not or: the high-priority `copy` pages is one question.
    // Both narrow what is drawn and neither moves a count — the rule `view.mjs` states.
    const found = pagesWithPriorities(
      pagesWithClasses(comparable, classes),
      priorities,
      priorityOf,
    );
    return [...found].sort((a, b) =>
      sort === 'worst' ? openOf(b) - openOf(a) : a.page.localeCompare(b.page),
    );
  }, [comparable, classes, priorities, sort, log.byPage]);

  /**
   * The store's differences, grouped. It is derived from the **summaries the page list
   * already holds**, so the two views are two readings of one array and no text crosses the
   * wire twice.
   *
   * Since ticket 03 the sibling's pages are in the input, and `repeatsInStore()` is what
   * decides whether anything joins: it keys on the **block** where a store is in one, so a
   * difference `nl` and `be` carry in the same words is one row on both dashboards, and a
   * difference only one of them carries is a row of one store the way it always was. On
   * `de` and `uk` the second array is empty and this is the call it always was.
   *
   * So a block store's list holds **three** kinds of row, and the third is the one to say out
   * loud: rows spanning both stores, rows of this store alone, and rows of the **sibling
   * alone** — a difference `be` carries on a page where `nl`'s text is fine. That is not a
   * side effect to be filtered out. The two dashboards of a block mirror one list, which is
   * what makes a decision on either of them the same decision; a list that dropped the
   * sibling's own rows would be two different lists again, and the row an editor cleared on
   * `be` would vanish from `nl` rather than reading as decided. It is the reason the count
   * beside the list names the block rather than the store — `narrowed` below.
   *
   * This is the *Repeats* view only. `rows`, `totals` and the bar above are built from
   * `comparable`, so the sibling moves no number on this screen — a repeat is a grouping
   * the interface makes, and it has never moved one.
   */
  const repeats = useMemo(
    () => repeatsInStore([...comparable, ...comparableSiblings]),
    [comparable, comparableSiblings],
  );
  const shownRepeats = useMemo(() => repeatsWithClasses(repeats, classes), [repeats, classes]);

  /**
   * What the filter strip counts, which is whichever list is under it.
   *
   * Asked once rather than three times in the strip's own props: *how many, of how many,
   * of what* is one answer about one list, and three separate readings of `view` are
   * three chances for the noun to end up over the other list's number. The searching
   * case is absent on purpose — a search counts its own result, and only `Search` holds
   * that count.
   *
   * The repeats noun says **in this language block** where there is one, because that is what
   * the number is over: the list is mirrored across the block and holds rows the sibling
   * carries alone, so *3,264 differences* on `nl`'s screen would be a count of `nl`'s work,
   * which it is not — `totals` and the bar above are that. On `de` and `uk` there is no
   * sibling, the two counts are the same number they always were, and the words are too.
   */
  const narrowed =
    view === 'repeats'
      ? {
          shown: shownRepeats.length,
          total: repeats.length,
          noun:
            comparableSiblings.length > 0 ? 'differences in this language block' : 'differences',
        }
      : { shown: rows.length, total: comparable.length, noun: 'pages' };

  /**
   * How many pages carry each priority, for the number beside each pill. It counts the
   * **store** and not the list under the filter, exactly as a class pill's count does: a
   * pill says how much of this kind there is, which is not a question about what is drawn.
   */
  /**
   * The ticked pages, as `store/page` (ticket 83).
   *
   * It is **session state and not in the URL**, which is the one place this control parts
   * company with the five that ADR 0010 put in the address bar. A selection is not a screen:
   * it is what an editor is about to act on, and a link that arrived carrying twenty ticked
   * pages would be a press somebody else half-made.
   *
   * Keyed on `store/page` and not on a finding id, because `Repeats.jsx`'s selection is over
   * the pages of one difference and this one is over the pages of a store. Same seam, same
   * bar, different key — a priority annotates the page, so the page is what is ticked.
   */
  const [selected, setSelected] = useState(/** @type {Set<string>} */ (new Set()));
  const keyOf = (page) => `${page.store}/${page.page}`;

  const tick = useCallback(
    (key, on) =>
      setSelected((held) => {
        const next = new Set(held);
        if (on) next.add(key);
        else next.delete(key);
        return next;
      }),
    [],
  );

  const tickAll = useCallback(
    (on) => setSelected(on ? new Set(rows.map(keyOf)) : new Set()),
    [rows],
  );

  // A tick means *this page*, so a selection cannot outlive the list it was made in: an
  // editor who narrows the filter and then presses would otherwise annotate pages that are
  // no longer on screen. Switching to *Repeats* puts it down for the same reason.
  useEffect(() => setSelected(new Set()), [classes, priorities, view, query]);

  const priorityCounts = useMemo(() => {
    /** @type {Record<string, number>} */
    const counts = {};
    for (const page of comparable) {
      const priority = priorityOf(page);
      if (priority) counts[priority] = (counts[priority] ?? 0) + 1;
    }
    return counts;
  }, [comparable, log.byPage]);

  /**
   * What a repeat row needs to be able to decide, in one prop.
   *
   * It is a bag rather than four props because it passes through four components to
   * reach the row that uses it, and it says **why** it cannot write rather than merely
   * that it cannot: a control that vanishes without a reason reads as a missing feature.
   */
  const bulk = useMemo(
    () => ({
      canWrite: log.canWrite,
      busy: log.busy,
      appendMany: log.appendMany,
      // The hook's own sentence about its own flag, not a second reading of the four
      // conditions behind it.
      notWritingReason: log.notWritingReason,
    }),
    [log.canWrite, log.busy, log.appendMany, log.notWritingReason],
  );

  const totals = useMemo(() => {
    const byClass = {};
    // The disclosure at the foot of this screen says *diagnostics*, so this counts what is
    // actually behind the toggle: the `diagnostic` findings. Ticket 75 moved `information` out
    // from behind it, and that is on screen on the page it is on.
    let diagnostic = 0;
    for (const page of comparable) {
      diagnostic += page.summary.diagnostic;
      for (const [cls, count] of Object.entries(page.summary.byClass)) {
        byClass[cls] = (byClass[cls] ?? 0) + count;
      }
    }
    return { diagnostic, byClass, ...log.derived.bar };
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
            {editor ? 'A decision on a difference is recorded under this name.' : NO_EDITOR}
          </span>
        </div>
      )}

      {/* The strip carried **eight** counters until ticket 04, four of them counting a list
          that is already further down this same page: *pages compared*, *diagnostics*,
          *one-sided* and *not checked*. An editor arriving to ask *what do I decide next*
          read a census first and found the answer fifth.

          None of the four is deleted — the standing rule is that a fact is never silently
          absent, and a count at the head of its own list is not absent. *pages compared* is
          in the sentence beside the store name, which states the whole arithmetic (found,
          crawled, comparable) and always did; the other three are at the head of the three
          lists below. So what leaves this strip is the duplication and not the information.

          It is a named region because it is the one an editor's eye is sent to, and because
          the two lists further down are landmarks already. */}
      <section aria-label="Work in this store" className="space-y-1">
        {/* The store's three totals (ticket 80), in the strip's own order and with the
            same three words the ledger uses. They are **absolute counts and no
            percentage**, because the denominator moves at each crawl: a genuinely
            corrected difference leaves the snapshot, so the same store can have fewer
            open findings and an unchanged share.

            These replace *differences open* + *closed* + *claimed fixed, still differs*.
            The old strip counted the contradicted claims twice on purpose and said so
            twice over — the bar's `open` includes them, because a claim that did not
            survive has closed nothing, and the fourth chip then named the same findings
            again. Three buckets partition the same denominator exactly once.

            Which of the three is a badge is `BucketCount`'s, so this strip and the
            ledger's cannot come to disagree about which one an editor's eye is sent to.

            The three are drawn in **two rows** since ticket 04 and they are still one
            partition: `LEADING` and `RECEDING` are complements over `BUCKETS`, so every
            bucket is drawn exactly once and a fourth one cannot fall off the screen by
            being in neither list. */}
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2">
          {LEADING.map((bucket) => (
            <BucketCount
              key={bucket}
              bucket={bucket}
              value={log.derived.buckets[bucket]}
              title={BUCKET_MEANING[bucket]}
              className="text-base"
            />
          ))}
        </div>

        {/* What is true and not what is next. Closed counts work an editor has already
            decided and *pages reviewed* counts pages they have already read, so neither is
            a queue — and normal operation recedes (ADR 0019).

            *pages equal* stood here until ticket 79. It counted the pages with no open
            finding — a thing nobody works on, and the one number on this strip that
            could only ever go up while the work went nowhere. The equal **rows** stay,
            behind the content view's context markers, because they answer *where does
            this text belong*; a tally of the pages holding them answers nothing. */}
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 text-xs">
          {RECEDING.map((bucket) => (
            <BucketCount
              key={bucket}
              bucket={bucket}
              value={log.derived.buckets[bucket]}
              title={BUCKET_MEANING[bucket]}
              className="text-xs"
            />
          ))}
          <Count
            value={log.derived.reviewedFresh}
            label="pages reviewed"
            title="A human looked at everything on this page, also at what the tool cannot see."
            className="text-xs"
          />
        </div>
      </section>

      {/* A section and no longer a `Card` (ADR 0019). A card says *this is a thing*, and a
          thing has an outside; a toolbar above the list it narrows is not a thing, it is a
          toolbar above a list. What the card was actually doing was drawing the rule under
          the toolbar, and the rule is still here — it just no longer implies a box around
          everything below it. */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b py-3">
          {/* The pills and the scope chip are **one group**, because they are one kind of
              thing: the narrowings that are on, each wearing its own control, all of them
              named together in the filter strip below. The chip drawn over by the search
              box instead would put the two halves of one sentence a header's width apart
              on a wide viewport, which is where it sat until the review of this part.

              A wrapper and not a third child of the header: this row is
              `justify-between`, and a third child would redistribute the two that are
              already here. */}
          <div className="flex flex-wrap items-center gap-2">
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
                const { label } = classInfo(cls);
                if (searching)
                  return `Search inside ${label} only. The counts above do not change.`;
                return view === 'repeats'
                  ? `Show the differences of class ${label} only. The counts above do not change.`
                  : `Show the pages with ${label} only. The counts above do not change.`;
              }}
            />
            {/* The scope, beside the pills because it is the same kind of thing (ticket 104
                part C): a narrowing of what is on screen that moves no count. Dismissing it
                clears the scope **alone** — the classes are not this control's, and neither
                are the words after it.

                No `searching &&` guard, and none is possible: `parseTerm()` trims before it
                reads, so a scope that is not `null` is a box with something in it. */}
            {scope && <ScopeChip scope={scope} onClear={() => patch({ query: withoutScope })} />}
          </div>
          {/* `flex-wrap` here and not only on the toolbar row: the row wrapped, but
              this inner group did not, so its three controls were measured as one
              indivisible 386 pixel run and hung 27 pixels past a 399 pixel viewport —
              taking the sort `Select`'s label off the side of the screen with them.
              The search box gives up its fixed width on the way down for the same
              reason: `w-56` is 224 pixels of a 319 pixel card, which leaves the switch
              and the select nowhere to go. */}
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            {/* The box, which offers the store's page keys while a scope is being typed
                (ticket 104 part D). It is `SearchBox` and not an `Input` because that offer
                is a small machine of its own — what is open, which row the arrow keys are
                on — and none of it is screen state.

                The **whole** page list goes down, one-sided pages and all: they are exactly
                the pages no index entry can offer, and it is in memory here well before the
                index is fetched, so the first keystroke is answered. The write is still
                `patch({ query })`, so a scope chosen from the list and one typed by hand are
                one write. */}
            <SearchBox value={query} onChange={(next) => patch({ query: next })} pages={pages} />
            {/* The switch belongs to the two views, and a search answers past both of
                them, so it steps aside while one is on screen. */}
            {!searching && <ViewSwitch view={view} onChange={(next) => patch({ view: next })} />}
            {/* Ticket 83. It narrows pages, so it is drawn with the list of pages — the
                same reason the sort is here and not over *Repeats*. */}
            {!searching && view === 'pages' && (
              <PriorityFilterPills
                selected={priorities}
                counts={priorityCounts}
                onToggle={(one) => patch({ priorities: toggleIn(priorities, one) })}
              />
            )}
            {!searching &&
              view === 'pages' && (
                // A native select works without JavaScript and this one does not. Nothing is
                // lost: the control and its state already live inside a `client:load` island,
                // so the sort was inert without JavaScript before this swap as well.
                //
                // It belongs to the **page list**, because it narrows pages, and there is no
                // second one over *Repeats*: that list is worst-first on what is left in each
                // difference and has no order to choose between (ticket 141).
                <Select
                  value={sort}
                  onValueChange={(next) => patch({ sort: next })}
                  items={SORT_LABEL}
                >
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
                  <SelectContent className="w-auto max-w-(--available-width) min-w-[max(var(--anchor-width),9rem)]">
                    <SelectGroup>
                      {Object.entries(SORT_LABEL).map(([name, label]) => (
                        <SelectItem key={name} value={name}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
          </div>
        </div>
        <div>
          {/* The classes go along (ticket 102). A search used to answer past the pills
              as well as past the two views, which threw away the editor's answer to
              *which kind of difference am I working on* the moment they asked a second
              question. The strip that says a filter is on goes with them, and is drawn
              inside `Search`: its denominator is a count of the result, and only that
              component has it. */}
          {searching && (
            <Search
              store={store}
              // The **whole** list and not the comparable half (ticket 104). A scope onto
              // a one-sided page used to be silence, which is the search contradicting the
              // aside below on the same screen — and a one-sided page is exactly one of
              // the four answers a scoped search has to be able to give. The by-name half
              // inside `Search` narrows to the comparable ones itself.
              pages={pages}
              // The sibling's **whole** list too, for the reason the whole list above is the
              // whole one (ticket 05). A scope now reaches the block, because the corpus the
              // search runs over does, and the one-sided half is exactly one of the answers
              // a scoped search has to be able to give about a page it reached. It is what a
              // scope may **name** and, as everywhere else on this screen, what no number
              // may read: `comparableSiblings` is what the press gets, and that split is the
              // hook's.
              siblingPages={siblingPages}
              term={query}
              classes={classes}
              // Both filters, in one write (ticket 104 part C). The price is that clearing
              // rewrites the box, because the scope is a fragment of an input: an editor
              // who clears the filters is asking for the whole store back, and a scope
              // silently surviving that is the more surprising outcome. The words after
              // the scope are a search and not a filter, so they stay.
              onClearFilters={() => patch({ classes: [], query: withoutScope })}
              byFinding={log.byFinding}
              // The whole read and not the events alone (ticket 123). The readiness
              // flag has sat beside them here since the hook was written, and the
              // notes half never asked for it, so a log in flight drew as a log
              // holding nothing.
              log={log}
              includeClosed={includeClosed}
              onIncludeClosed={(next) => patch({ includeClosed: next })}
              bulk={bulk}
              link={link}
            />
          )}

          {!searching && (
            <ClassFilterBanner
              classes={classes}
              // Only while the page list is under it, for the reason `searchFromScreen`
              // gives: on *Repeats* this filter narrows nothing, so a strip claiming it
              // does would be the mismatched pair the banner exists to prevent.
              priorities={view === 'pages' ? priorities : []}
              {...narrowed}
              onClear={() => patch({ classes: [], priorities: [] })}
              className="border-b px-4 py-2"
            />
          )}

          {!searching &&
            view === 'repeats' && (
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
                // Off the hook and never rebuilt here (ticket 03): it has to cover the
                // sibling's findings too, and the hook is the one place holding both lists.
                // An index built here off this store's pages would read the sibling's decided
                // findings as `open` and offer a press that overwrites a colleague.
                byFinding={log.byFinding}
                // Whether the log has answered. The order of this list is worst-first on
                // what is **left** in each difference (ticket 141), and until the events
                // have arrived `byFinding` says every finding is open — so the order waits
                // for this rather than holding a reading in which nothing is decided.
                logRead={log.ready}
                bulk={bulk}
                link={link}
              />
            )}

          {!searching &&
            view === 'pages' && (
              // The `@container` the four count columns drop out by. It is here and not on the
              // table because a table is not a layout box a query can trust: the wrapper's
              // width is the room the table has, which is the question being asked.
              <div className="@container">
                <Table>
                  <TableHeader>
                    {/* The capitals are addressed to the `th` and not to the row, which is the
                    one spelling ADR 0019 sanctions: a row that shouts shouts whatever a
                    later edit puts in it, and a `th` selector cannot come to mean anything
                    but a heading cell. */}
                    <TableRow className="[&_th]:text-xs [&_th]:tracking-wide [&_th]:uppercase">
                      {/* The header word is drawn for a screen reader and not for an eye, the
                    way `Repeats.jsx` draws its own: a header cell holding nothing but a
                    checkbox announces nothing. */}
                      <TableHead className="w-8 px-4">
                        <SelectAllPages rows={rows} selected={selected} onTickAll={tickAll} />
                        <span className="sr-only">Select</span>
                      </TableHead>
                      <TableHead className="px-4 text-muted-foreground">Page</TableHead>
                      {/* The three buckets name themselves in the head, so the three numbers
                      under it need no legend of their own. Joined from the same list the
                      cells below are drawn from, so the head cannot come to name two of
                      them, or name them in another order than they are drawn in.

                      **Second column since ticket 04.** It is the one column that says how
                      much work a page holds, and it stood sixth — so an editor reading
                      worst-first read four per-check counts to reach the number the sort was
                      made on. */}
                      <TableHead className="w-56 px-4 text-muted-foreground">
                        {BUCKETS.map((bucket) => BUCKET_LABEL[bucket]).join(' · ')}
                      </TableHead>
                      <TableHead className="w-20 px-4 text-muted-foreground">Blocks</TableHead>
                      {CHECKS.map((check) => (
                        <TableHead
                          key={check}
                          className={cn(WIDE_ONLY, 'w-24 text-muted-foreground')}
                        >
                          {CHECK_LABEL[check]}
                        </TableHead>
                      ))}
                      {/* *Hidden* until ticket 04. The control that reveals these is *Show
                      diagnostics* and the visibility they carry is `diagnostic`, so a third
                      word for one thing was the collision `CONTEXT.md` closed elsewhere. */}
                      <TableHead className={cn(WIDE_ONLY, 'w-24 px-4 text-muted-foreground')}>
                        Diagnostics
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((page) => (
                      <TableRow
                        key={`${page.store}/${page.page}`}
                        data-state={selected.has(keyOf(page)) ? 'selected' : undefined}
                      >
                        <TableCell className="px-4">
                          <Checkbox
                            checked={selected.has(keyOf(page))}
                            onCheckedChange={(ticked) => tick(keyOf(page), ticked)}
                            aria-label={`Select ${page.page}`}
                          />
                        </TableCell>
                        {/* The page key is **the** thing in this row (ticket 04), so it is the
                        only content in here at full weight. The cell carried five things and
                        the key was one of five; a reader scanning for a page had nothing to
                        scan. What is left beside it is its own scope control and its two
                        annotations, both of which are about this page and neither of which is
                        a number. */}
                        <TableCell className="px-4">
                          <a
                            className={cn('text-base font-semibold hover:underline', CHROME.link)}
                            href={link(page.store, page.page)}
                          >
                            {page.page}
                          </a>
                          {/* The row hands its key to the search (ticket 104 part E), which is
                          what keeps the classes on and the view where it was. */}
                          <ScopeRowButton
                            page={page.page}
                            onScope={() => scopeTo(page.page)}
                            className="ml-2"
                          />
                          {/* The two annotations, beside the page they are about. The note is a
                        **mark** here and never the note itself: it has no length limit and
                        this cell has no width to spare, so one long note used to stretch the
                        row past the width of the screen and take every count with it. It is
                        in full on the page it is about, which is also where it is edited. */}
                          <PriorityPill priority={priorityOf(page)} className="ml-2" />
                          <PageNoteMark
                            note={annotationsOf(page)?.note}
                            page={page.page}
                            href={link(page.store, page.page)}
                            className="ml-2"
                          />
                        </TableCell>
                        <TableCell className="px-4">
                          <Bar shown={openOf(page)} units={page.sides.production.units} />
                          <PageBuckets buckets={bucketsOfPage(page)} />
                        </TableCell>
                        <TableCell className="px-4 text-muted-foreground tabular-nums">
                          {page.sides.production.units}
                        </TableCell>
                        {CHECKS.map((check) => (
                          <TableCell
                            key={check}
                            className={cn(WIDE_ONLY, 'text-muted-foreground tabular-nums')}
                          >
                            {page.summary.byCheck[check] ?? '—'}
                          </TableCell>
                        ))}
                        <TableCell
                          className={cn(WIDE_ONLY, 'px-4 text-muted-foreground tabular-nums')}
                        >
                          {page.summary.diagnostic}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          {!searching && view === 'pages' && rows.length === 0 && (
            <p className="px-4 py-6 text-sm text-muted-foreground">No page found.</p>
          )}

          {/* Drawn only when something is ticked, the way ticket 31's bar is: a toolbar
              that is always on screen and always means *all of them* is the press ticket
              110 replaced. */}
          {!searching && view === 'pages' && selected.size > 0 && (
            <AnnotateBar
              pages={rows}
              selected={selected}
              bulk={bulk}
              onClear={() => setSelected(new Set())}
            />
          )}
        </div>
      </section>

      {/* The id is what a scoped search points at when it explains that a page it matched
          is one-sided (ticket 104). The aside had those words first, so the search links
          here rather than restating them. */}
      <Aside
        id="one-sided-pages"
        title={`One-sided pages (${oneSided.length})`}
        note="Only one site has these pages."
      >
        {oneSided.map((page) => (
          <li key={`${page.store}/${page.page}`} className="flex flex-wrap items-center gap-2 py-1">
            <a className={`hover:underline ${CHROME.link}`} href={link(page.store, page.page)}>
              {page.page}
            </a>
            {/* The same control the table's rows carry (ticket 104 part E), and this is the
                page that most needs it: a one-sided page is out of the bar and out of the
                pages table, and no index entry can offer it either — so this row is the only
                way into a scope on it. What the scope lands on is part A's sentence about
                why the comparison did not run, which is the aside's own words. */}
            <ScopeRowButton page={page.page} onScope={() => scopeTo(page.page)} />
            <span className="text-muted-foreground">{page.skipReason}</span>
          </li>
        ))}
      </Aside>

      {/* The note carries what the header chip's tooltip carried, because the chip is gone and
          a fact is never silently absent. Its last clause is dropped and only that: it pointed
          the reader at the bottom of the page, which is where they now are. */}
      <Aside
        title={`Not checked (${notChecked.length})`}
        note="Found and visible, but there is nothing to compare. Each one says why."
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

      <DiagnosticsAside count={totals.diagnostic} pages={comparable} link={link} />

      <Aside title={`Excluded regions (${regions.length})`} note="Page areas outside editor work.">
        {regions.map((region) => (
          <li key={region.selector} className="py-1">
            <code className="font-medium">{region.selector}</code>
            <span className="text-muted-foreground">
              {' '}
              — {REGION_KIND[region.kind] ?? region.kind}. {region.reason}
            </span>
          </li>
        ))}
        <RegionCoverage {...regionsChanged} />
        <CanonicalViewportNote />
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
 * Colour is still ours and not shadcn's. The pressed segment says `data-chrome="switch"`
 * and `app.css` draws the brand ground off the `aria-pressed` the toggle already
 * publishes — including the ink, so which segment is selected is asked once, by the
 * browser, rather than a second time here in JavaScript. The rule sits in `@layer
 * utilities` because it exists to outrank one: shadcn tints the pressed item `bg-muted`
 * under an `aria-pressed:` prefix, and that is a utility.
 */
/**
 * One page's three counts, in the same order and the same words as the store strip above
 * and the ledger inside (ticket 80).
 *
 * **Absolute counts and no percentage**, for the reason `CONTEXT.md` gives: the
 * denominator moves at each crawl, so a share alone reads as a regression when the page
 * only grew. The bar beside these is the share, and it is unchanged by this ticket.
 *
 * A zero is drawn muted rather than left out. Three numbers in a fixed order are read by
 * position, and a cell that sometimes has two of them cannot be.
 */
const PageBuckets = ({ buckets }) => (
  <span className="ml-2 text-sm tabular-nums">
    {BUCKETS.map((bucket, index) => {
      /*
       * `BUCKET_TONE` and not a second table: the store strip above draws the same three
       * buckets from it, and two tables would let one row's Closed drift green while the
       * other's did not.
       *
       * Open's tone is `neutral`, which the ink shape has no rule for — the stylesheet
       * saying that a plain number is the neutral. So Open prints no colour without
       * anybody here deciding that a second time.
       */
      const tone = buckets[bucket] > 0 ? BUCKET_TONE[bucket] : null;

      return (
        <span key={bucket}>
          {index > 0 && <span className="mx-1 text-muted-foreground">·</span>}
          <span
            title={`${BUCKET_LABEL[bucket]} — ${BUCKET_MEANING[bucket]}`}
            className={cn(
              buckets[bucket] === 0 && 'text-muted-foreground',
              // Open carries the weight when there is work in it, and the other two carry
              // their tone.
              buckets[bucket] > 0 && bucket === 'open' && 'font-semibold',
            )}
            data-wears={tone ? 'ink' : null}
            data-tone={tone}
          >
            {buckets[bucket]}
          </span>
        </span>
      );
    })}
  </span>
);

/**
 * The tick that selects every page on screen, and clears from the mixed state.
 *
 * It ticks the **narrowed** list and not the store: the rows under it are what the press
 * acts on, and a select-all that reached past the filter would annotate pages the editor
 * cannot see. `Repeats.jsx` states the same rule over the pages of one difference.
 *
 * Its label says *select*, because the ledger already spends a checkbox on the tri-state
 * *Fixed* control, which genuinely is a decision. A selection decides nothing.
 */
function SelectAllPages({ rows, selected, onTickAll }) {
  const all = rows.length > 0 && rows.every((page) => selected.has(`${page.store}/${page.page}`));
  const some = selected.size > 0 && !all;

  return (
    <Checkbox
      checked={all}
      indeterminate={some}
      // From the mixed state a press **clears**. Base UI would answer `true` there, which
      // would re-tick the same rows and leave the control stuck at mixed.
      onCheckedChange={(ticked) => onTickAll(some ? false : ticked)}
      aria-label={`Select all ${rows.length} pages on screen`}
      title="Selects each page on screen. A selection decides nothing."
    />
  );
}

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
          data-chrome="switch"
          className="text-muted-foreground"
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
      {reason ? (
        <span className="block text-muted-foreground">Not compared. {REGION_VERDICT_REASON}</span>
      ) : (
        moved.map((change) => (
          <span key={change.selector} className="block text-muted-foreground">
            <code>{change.selector}</code>
            {' — '}
            {REGION_VERDICT[change.verdict](change)}
          </span>
        ))
      )}
    </li>
  );
}

/**
 * Ticket 69: the scope statement a reader would otherwise meet nowhere.
 *
 * It sits under the regions rather than in an aside of its own. Both answer the
 * one question a reader is asking here — what the log leaves out on purpose — and
 * ADR 0019 keeps a panel that only ever says one static sentence off every store.
 *
 * It is about **what is compared** and never about what this interface runs on.
 * The log reads one width; the screen you read it on is ticket 87's subject, and
 * confusing the two would read as a promise that the dashboard is desktop-only.
 */
function CanonicalViewportNote() {
  return (
    <li className="mt-2 border-t pt-2">
      <strong className="font-medium">One width</strong>
      <span className="block text-muted-foreground">
        A page is compared as its {CANONICAL_VIEWPORT} version. Production sends both versions of
        some blocks in one page, so where it sends a separate version for a phone, that version is
        not checked.
      </span>
    </li>
  );
}

const REGION_VERDICT_REASON =
  'The previous snapshot has a different size, or it is absent. ' + 'The next run compares again.';

/**
 * One sentence for each verdict. `unchanged` has none, because a run where
 * nothing moved must stay quiet.
 */
const REGION_VERDICT = {
  'stopped-matching': (change) =>
    `removed on ${change.was.pages} pages in the previous snapshot, ` +
    `and now on ${change.now.pages}. This rule no longer matches, and the region is back in the log. ` +
    'A rule anchored on a campaign stops to match when the campaign changes.',
  'started-matching': (change) =>
    `removed on ${change.was.pages} pages in the previous snapshot, ` +
    `and now on ${change.now.pages}. This rule matches since this run.`,
  narrowed: (change) =>
    `removed on ${change.was.pages} pages in the previous snapshot, ` +
    `and now on ${change.now.pages}. This rule matches fewer pages than before.`,
  widened: (change) =>
    `removed on ${change.was.pages} pages in the previous snapshot, ` +
    `and now on ${change.now.pages}. This rule matches more pages than before.`,
  'new-entry': (change) =>
    `new in the list, removed on ${change.now.pages} pages. ` +
    'The previous snapshot has no number for it.',
  'left-the-list': (change) =>
    'is no longer in the list. It was removed on ' +
    `${change.was.pages} pages in the previous snapshot.`,
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
  'non-editorial': 'Catalogue content',
  'legacy-only': 'Production only',
};

/**
 * What a rule saw and did not count as work, with its count at the head of it.
 *
 * The number stood in the store strip until ticket 04, beside the three buckets that are an
 * editor's queue — and it is the one number up there that **nobody can act on**. A
 * `diagnostic` class is what a rule saw; it is not a defect, so it is never work. So it comes
 * down here, to the pages it is about, and the pages are behind a click because *how many* is
 * the whole of what most readers want from it.
 *
 * It is also the count's only home that survives a narrow screen: the per-page column drops
 * out by container width, and a fact must never be silently absent.
 *
 * *Diagnostics* means what a rule saw, and never the health of the build, the crawl or the
 * log. `CONTEXT.md` closed that collision when it renamed the control that reveals them.
 */
function DiagnosticsAside({ count, pages, link }) {
  const carrying = pages.filter((page) => page.summary.diagnostic > 0);

  return (
    <Aside
      disclosure
      title={
        <>
          Diagnostics (<span className="tabular-nums">{count}</span>)
        </>
      }
      note="What a rule saw and did not count as work. Nothing here is a defect."
    >
      {carrying.map((page) => (
        <li key={`${page.store}/${page.page}`} className="flex items-center gap-2 py-1">
          <a className={`hover:underline ${CHROME.link}`} href={link(page.store, page.page)}>
            {page.page}
          </a>
          <span className="text-muted-foreground tabular-nums">{page.summary.diagnostic}</span>
        </li>
      ))}
      {carrying.length === 0 && (
        <li className="py-1 text-muted-foreground">
          No rule saw anything of this kind in this store.
        </li>
      )}
    </Aside>
  );
}

/**
 * One panel at the foot of the dashboard: a heading that counts what it holds, a sentence
 * saying what it is, and the list.
 *
 * A `Card` is earned here on ADR 0019's own test — each of these could be moved to another
 * screen and still mean the same thing, which is not true of the toolbar or the count strip
 * above.
 *
 * `disclosure` closes the list behind its own heading. It is a prop rather than a second
 * component because the only difference is whether the list is on screen: ticket 04 added a
 * fourth panel and a near-copy of this one went with it, which is two places for a heading to
 * stop being an `h2` in.
 */
function Aside({ id, title, note, disclosure = false, children }) {
  const [open, setOpen] = useState(false);

  const body = <ul className="text-sm">{children}</ul>;

  return (
    <Card id={id}>
      <Collapsible open={!disclosure || open} onOpenChange={setOpen}>
        <CardHeader className="gap-2">
          {/* `CardTitle` renders a div, and the heading is what puts these panels in the
              page's outline, so the h2 stays inside it. */}
          <CardTitle>
            <h2 className="font-semibold">
              {disclosure ? (
                /* The chevron **trails** the words. Every other disclosure in this interface
                   leads with one, and those are rows in a list where the glyph is the column an
                   eye runs down; this is a heading, and a heading that starts with punctuation
                   is a heading you read second. */
                <CollapsibleTrigger className="flex items-center gap-2">
                  <span>{title}</span>
                  <span aria-hidden className="text-muted-foreground">
                    {open ? '▾' : '▸'}
                  </span>
                </CollapsibleTrigger>
              ) : (
                title
              )}
            </h2>
          </CardTitle>
          <p className="text-sm text-muted-foreground">{note}</p>
        </CardHeader>
        {/* A panel that is always open renders its list directly. Wrapping it in the
            `CollapsibleContent` as well would put every one of these behind a panel element
            that has no trigger to open it. */}
        {disclosure ? (
          <CollapsibleContent>
            <CardContent>{body}</CardContent>
          </CollapsibleContent>
        ) : (
          <CardContent>{body}</CardContent>
        )}
      </Collapsible>
    </Card>
  );
}
