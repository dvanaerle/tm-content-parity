import { useEffect, useMemo, useState } from 'react';
import { isCheckingField, metaFindingOf, metaRows } from '../../../compare/meta.mjs';
import {
  Detail,
  FirstSeen,
  HistoryNote,
  Occurrences,
  Section,
  onePageTitle,
} from './Annotations.jsx';
import { BucketCount, ClassPill } from './Chips.jsx';
import ContentView from './ContentView.jsx';
import { DiffCells, DiffHeads } from './Diff.jsx';
import OverrideControl from './OverrideControl.jsx';
import SiblingView from './SiblingView.jsx';
import { Alert, AlertDescription, AlertTitle } from './ui/alert.jsx';
import { Checkbox } from './ui/checkbox.jsx';
import { Empty as EmptyState, EmptyDescription, EmptyHeader } from './ui/empty.jsx';
import { Label } from './ui/label.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.jsx';
import { CHECK_LABEL, META_LABEL, canDecide } from '../lib/classes.mjs';
import {
  findingAnchor,
  landedRowProps,
  landingFor,
  useLanding,
  useLandOn,
} from '../lib/landing.mjs';
import { findingInSearch } from '../lib/page-url.mjs';
import { CHROME } from '../lib/palette.mjs';
import { STORE_LANGUAGE } from '../lib/stores.mjs';
import { cn } from '../lib/utils.js';
import { bucketOf, bucketsOf } from '../../../overrides/state.mjs';
import { BUCKETS, BUCKET_LABEL } from '../lib/buckets.mjs';
// The sentence the content view says about the same control, written once (ticket 05): the
// noun differs and the meaning does not.
import { allDiagnostic } from '../lib/view.mjs';

/**
 * The column heads of both tables here and of the content view are the same small
 * capitals. `TableHead` ships `text-foreground`, which a plain class beside it cannot
 * beat, so the tone is written as a descendant selector on the header instead — an
 * attribute-free `[&_th]` still outranks the component's own class. This is the same
 * shape of problem as `CHROME.tabActive` below, and the same answer: the palette, or
 * in this case the muted neutral the whole interface already uses, has to be declared
 * somewhere that outranks shadcn rather than somewhere that ties with it.
 */
const HEAD_TONE =
  '[&_th]:text-xs [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground';

/**
 * A tabbed ledger, production and the new site side by side.
 *
 * **Four tabs** since ticket 81, and Text lands first. Diff and Content were two
 * tabs answering half a question each, and Outline was production's unit list
 * indented by heading level — which the merged content view now contains, and which
 * returns there as navigation. That closes ticket 12's question about the tab count.
 *
 * Text lands first because it is now the whole page rather than a wall of
 * unexplained differences. An editor who lands on a task list has to take the
 * tool's word for it.
 *
 * **Taken is gone.** It was every finding of the page in one list, grouped by check,
 * and each of its three groups is a tab that shows the same findings with better
 * context: Text puts a text finding in document order, and Links and Images
 * word-diff the two targets. Its one remaining claim was *work down a page without
 * changing tabs*, and it answered that by removing the context the other tabs add.
 * The grouped reading of the work is now the store's repeat list, which groups
 * across pages, which is where the repetition actually is.
 *
 * Coverage is absent: Axis B is ticket 24, and ticket 11 forbids summing its bar
 * with this one. When it arrives it is a tab of its own, not extra rows in these — and
 * it is **not the fifth tab**, because ticket 04 took that place first.
 */
const TABS = ['Text', 'Links', 'Images', 'Meta'];

/**
 * The fifth tab: this page against its **sibling page**, the same page in the other
 * store of its language block (ticket 04).
 *
 * It is **not a fifth check**. `Check` is the closed family `text | links | images |
 * meta` and it stays closed: a block difference has no id, no override and no place in a
 * bar, and it is never called a finding. So this name is outside `TABS`, it has no badge,
 * and `TAB_OF_CHECK` in `landing.mjs` cannot resolve to it — which is what keeps a link
 * naming a finding from opening it.
 *
 * It is **not named after a store**. The tab is drawn on both stores of a block, so `BE`
 * on `nl`'s page and `NL` on `be`'s would be two labels for one tab. *Sibling* is the
 * glossary's word for the other page and it is nobody's store name.
 */
const SIBLING_TAB = 'Sibling';

/**
 * `findings` are the **derived** findings from `derivePageState()` — the same
 * records with a `state` and an `override` attached. The Ledger never re-derives
 * anything; it renders what the pure function decided.
 *
 * *Never re-derives* means **it reimplements no rule**, and not that it calls nothing. It
 * asks `bucketOf()` and `bucketsOf()` which bucket a finding is in and how many are in each
 * — the same functions `derivePageState()` itself groups with, so there is one rule and no
 * second reading of it, whichever of the two calls it. What is forbidden here is a `switch`
 * on `state` grown locally because a component needed one, which is how a screen comes to
 * disagree with the derivation it is drawing.
 */
export default function Ledger({
  report,
  findings: derived,
  append,
  canWrite,
  pending,
  observationId,
  settled,
  sibling,
}) {
  /*
   * The difference a link named, and what this ledger has to do about it (ticket 109).
   *
   * The id arrives in an **effect** and not in the initial state: this island is
   * rendered to static HTML at build time, so a first render that read `location` would
   * render one thing on the server and another in the browser.
   *
   * `landingFor()` decides what the landing asks for and `useLanding()` holds it against
   * the reader's own two controls — each of which is released on its own, because
   * switching tabs is not a request to switch the diagnostics control off and vice versa. The
   * mark on the row stays either way: looking at something else is not a reason to lose
   * where you came from.
   */
  const [focus, setFocus] = useState(/** @type {string | null} */ (null));
  useEffect(() => setFocus(findingInSearch(window.location.search)), []);

  const asked = useMemo(() => landingFor({ findings: derived, focus }), [derived, focus]);
  const { tab, diagnostics, chooseTab, chooseDiagnostics } = useLanding(asked, TABS[0]);

  /*
   * The strip, which is four tabs or five (ticket 04).
   *
   * The sibling tab is **absent and not empty** on a page with no sibling — which is
   * every page of `de` and `uk`, and the pages of a block store the other store has no
   * counterpart for. A tab that draws itself to say there is nothing to compare is a tab
   * an editor opens once per page to learn nothing.
   *
   * Absence is read off the prop and not off the reading: `SiblingView` works the reading
   * out when it is mounted, and the strip has to know before anything is mounted.
   */
  const tabs = sibling ? [...TABS, SIBLING_TAB] : TABS;

  /**
   * The landing, as the one thing the two tables below need: `focus` says which row and
   * `settled` says when. They never travel apart, so they travel as one.
   */
  const landing = useMemo(() => ({ focus, settled }), [focus, settled]);

  const { production, new: next } = report.sides;

  /*
   * The language of every scraped string under these tabs (ticket 125), read once from the
   * store rather than at each table.
   *
   * The two columns hold prose on three of the four checks — an anchor wording, a title, a
   * meta description — so they declare a language for the same reason a content block does.
   * A cell holding a bare url declares it too: it is the same component, and a link key is
   * the one thing in it a reader hears as letters either way. The page key is the case that
   * stays untagged, and it is drawn outside this island.
   */
  const language = STORE_LANGUAGE[report.store];

  // The toggle asks about the **class**: a `diagnostic` is what a rule saw, told to the
  // author of the rule. An `information` finding is drawn beside the work and counted
  // nowhere (ticket 75), and what an editor decided about a finding is not a diagnostic, so
  // neither a decision nor a visibility other than `diagnostic` moves a row behind this
  // toggle.
  const findings = useMemo(
    () => derived.filter((finding) => diagnostics || finding.visibility !== 'diagnostic'),
    [derived, diagnostics],
  );

  // One closure for all three tabs, so the question *is there a decision here* is asked
  // once. An `information` finding is one an editor can link to and cannot decide, so it
  // is drawn with no control at all — the same shape `MetaTable` has had since ticket 54,
  // for the same reason: the shared colours must not show something an editor can
  // complete. Ticket 86, and `canDecide()` in `view.mjs` is the rule.
  const control = (finding) =>
    canDecide(finding) ? (
      <OverrideControl
        finding={finding}
        observationId={observationId}
        append={append}
        canWrite={canWrite}
        pending={pending}
      />
    ) : null;

  /**
   * The three buckets of this page (ticket 80), counted off the **derivation** and never
   * re-decided here. It reads `derived` and not the diagnostics-filtered list on purpose:
   * `bucketsOf()` counts `work` findings, a `diagnostic` is not work, and so the toggle
   * cannot move a number that says how much work is left.
   */
  const buckets = useMemo(() => bucketsOf(derived), [derived]);

  /**
   * The `<head>` of this page: its five rows, each with the finding it carries or `null`.
   *
   * It is paired here and not inside the panel because the badge counts it too, and a
   * badge counting one pairing over a panel drawing another is two answers to *how much
   * work is in the head*.
   */
  const head = useMemo(
    () => metaRows(production, next).map((row) => ({ row, finding: metaFindingOf(row, findings) })),
    [production, next, findings],
  );

  // What the toggle would reveal, which is the `diagnostic` findings and nothing else.
  // The label must count what it uncovers: an `information` finding is on screen already.
  const diagnosticCount = derived.filter((f) => f.visibility === 'diagnostic').length;

  /**
   * How many findings of one check the diagnostics control is holding back — which is the
   * difference between *this page has nothing here* and *this page has three things you
   * asked not to see*. An empty tab could say only the first, and it was the wrong one
   * exactly where a rule author was looking for what their rule saw.
   *
   * Zero while the control is on, because then it is hiding nothing.
   */
  const withheld = (check) =>
    diagnostics
      ? 0
      : derived.filter((one) => one.check === check && one.visibility === 'diagnostic').length;

  // Every badge counts **findings**, including Text's. The content view is a list
  // of rows and a grouped finding covers several of them, so a row count here would
  // put two different numbers for the same thing next to each other.
  const badges = {
    Text: findings.filter((finding) => finding.check === 'text').length,
    Links: findings.filter((finding) => finding.check === 'links').length,
    Images: findings.filter((finding) => finding.check === 'images').length,
    // Meta counts the findings the **panel draws**, which is the head rows and not the
    // check: `no-declared-alternate` is `check: 'meta'` and the panel has no row for it, so
    // counting the check would put a number on a tab and no row under it. Ticket 98: the
    // content view is the body in document order, so this badge is the only place a head
    // count can live.
    Meta: head.filter((one) => one.finding).length,
  };

  if (!report.comparable) {
    return (
      /* The tone is `caution` worn as a banner, and not Alert's own `destructive`
         variant. An uncomparable page is a status, and palette rule 2 keeps status out of
         the diff hues; Alert's `destructive` reads from `--destructive`, which this repo has
         already pointed at the amber ink for exactly that reason. `variant={null}` because
         every variant the library has paints a ground of its own over the tone. */
      <Alert variant={null} data-wears="banner" data-tone="caution" className="p-4">
        <AlertTitle className="font-semibold">Cannot be compared</AlertTitle>
        <AlertDescription className="text-current">
          <p className="text-sm">{report.skipReason}</p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {/* The three buckets, over this page's findings.

          It **summarises and does not filter**: every row stays where it is, and a state
          pill still says what each finding is. A bucket is a grouping, so it must not
          become a fourth thing an editor has to set — and it must not determine the bar
          either, because an absent finding is Closed and is in neither of the bar's terms.

          The same three words and the same order as the store dashboard. That is the
          whole question ticket 80 asked: whether one grouping reads the same on both. */}
      <BucketStrip buckets={buckets} />

      {/* Two ways a link can arrive with nothing to land on, and both of them have to be
          said out loud — otherwise the page simply does not move and the reader is left
          wondering whether they missed it.

          The first is a link that outlived its finding: an id is a term of the text, so it
          expires the moment the text does, whether the difference was fixed or the page was
          measured again. The second is a finding this page has and no tab draws, and since
          ticket 98 that is one class: `no-declared-alternate` is `check: 'meta'` and it is
          not a row of the `<head>` — it says the log could not place the page at all.

          `caution` and not `warning` for both: a condition, not a loss. */}
      {(asked.missing || asked.unplaced) && (
        <Alert variant={null} data-wears="banner" data-tone="caution" className="mb-3">
          <AlertTitle className="font-semibold">
            {asked.missing
              ? 'This difference is not in this snapshot.'
              : 'This difference is not on one of these tabs.'}
          </AlertTitle>
          <AlertDescription className="text-current">
            {asked.missing ? (
              <p className="text-sm">
                The link named a finding that is no longer there: the difference is fixed, or the
                page was measured again and the text changed. The whole page is still here.
              </p>
            ) : (
              <p className="text-sm">
                This one is about the page itself rather than about anything on it: production
                declares no counterpart for this page, so there is no row to show you. The whole
                page is still here.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/*
        No `Card` (ADR 0019). A card says *this is a thing*, and a thing has an outside;
        a tab strip over the panel it switches is one control and its own output, which a
        reader already reads as one from the strip. What the card carried was a ring and a
        radius, and two of its three classes existed only to undo its own defaults — the
        vertical padding that floated the strip off the top edge it has to sit flush
        against, and the `overflow-hidden` that silently stopped the Text panel's
        `lg:sticky` outline nav from sticking. That trap goes with the box.
      */}
      {/*
          The tab strip is shadcn on Base UI since ticket 74, and it is the only
          thing in this component the library touches. What it buys is the roving
          tabindex: one Tab stop reaches the strip, the arrow keys move between the
          four, and Home and End reach the ends. The hand-rolled strip put four Tab
          stops in a row and answered no arrow key at all.

          The diagnostics control now sits **beside** the `TabsList` rather than inside it.
          It was a child of the old `role="tablist"`, which told a screen reader that
          a checkbox was a fifth tab.

          Colour is still the palette's. `CHROME.tabActive` is applied as a literal,
          because the component already knows which tab is selected and a
          `data-active:` prefix assembled around a palette value at runtime is a class
          name Tailwind cannot see in the source text.

          It goes on the trigger **and** on the label span. On the trigger it draws
          the underline. shadcn writes `data-active:text-foreground` on the trigger
          too, and an attribute selector outranks a plain class, so the ink has to be
          declared on a child to win — which is the concrete shape of "where a shadcn
          variable and a palette token disagree, the palette wins".
        */}
      <Tabs value={tab} onValueChange={chooseTab} className="gap-0">
        <div className="flex flex-wrap items-center gap-1 border-b px-2">
          {/*
              `group-data-horizontal/tabs:h-auto` and not a plain `h-auto`, and this is
              the fourth instance of the trap in the ADR: `tabsListVariants` writes the
              height as `group-data-horizontal/tabs:h-8`, `tailwind-merge` does not dedupe
              across differing variant modifiers, and the attribute selector then outranks
              the plain class. So the list was pinned to 32 pixels while its own triggers
              are 38 — `h-auto` on the *trigger* does win, because there it is plain
              against plain.

              Six pixels of trigger therefore hung out the bottom of the list box. That is
              the whole of the "underline sits below the divider" report: the underline is
              the active trigger's `-mb-px border-b-2`, the divider is this wrapper's
              `border-b`, and they are meant to be the same line. On a narrow screen it
              was worse than cosmetic — the strip wraps to two rows inside a box still
              claiming to be 32 pixels tall, so row two rendered outside its parent and
              landed on top of the diagnostics checkbox.

              Matching the prefix lets the two collapse to one class, and the list is
              finally as tall as what it contains.
            */}
          <TabsList
            variant="line"
            className="flex-wrap gap-1 p-0 group-data-horizontal/tabs:h-auto"
          >
            {tabs.map((name) => (
              <TabsTrigger
                key={name}
                value={name}
                className={`h-auto flex-none gap-2 rounded-none px-3 py-2 text-sm after:hidden ${
                  name === tab
                    ? `-mb-px border-x-0 border-t-0 border-b-2 font-semibold ${CHROME.tabActive}`
                    : 'text-muted-foreground'
                }`}
              >
                <span className={name === tab ? CHROME.tabActive : undefined}>{name}</span>
                {/* A count beside the tab name, as text: a quantity is not a category
                    (ADR 0019), and a filled chip on every tab made the four of them one
                    block of colour with no way to tell which held the work. */}
                {badges[name] !== undefined && (
                  <span className="text-muted-foreground tabular-nums">{badges[name]}</span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Base UI's Checkbox is not an `<input>`, so the state arrives as the
                value rather than as an event: `onCheckedChange` and not
                `event.target.checked`. */}
          <Label className="ml-auto py-2 font-normal text-muted-foreground">
            <Checkbox checked={diagnostics} onCheckedChange={chooseDiagnostics} />
            Show diagnostics (<span className="tabular-nums">{diagnosticCount}</span>)
          </Label>
        </div>

        {/* The padding is on the wrapper and not on each panel: exactly one panel
              is mounted at a time, so four copies of `p-4` would be four chances to
              let one tab sit differently from the other three. */}
        <div className="p-4">
          <TabsContent value="Text">
            <ContentView
              report={report}
              findings={derived}
              showDiagnostics={diagnostics}
              control={control}
              landing={landing}
            />
          </TabsContent>
          <TabsContent value="Links">
            <FindingTable
              findings={findings}
              check="links"
              withheld={withheld('links')}
              control={control}
              sides={report.sides}
              language={language}
              landing={landing}
            />
          </TabsContent>
          <TabsContent value="Images">
            <FindingTable
              findings={findings}
              check="images"
              withheld={withheld('images')}
              control={control}
              sides={report.sides}
              language={language}
              landing={landing}
            />
          </TabsContent>
          <TabsContent value="Meta">
            <MetaTable head={head} control={control} language={language} landing={landing} />
          </TabsContent>
          {/* Mounted only while it is the selected tab, which is what makes the
                alignment inside it cost nothing to a reader who never opens it. */}
          {sibling && (
            <TabsContent value={SIBLING_TAB}>
              <SiblingView store={report.store} here={production.elements} sibling={sibling} />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </>
  );
}

/**
 * The three counts, in one line above the tabs.
 *
 * Absolute counts and no percentage. `CONTEXT.md`'s rule is that the denominator moves at
 * each crawl — a genuinely corrected difference leaves the snapshot altogether — so a
 * share on its own reads as a regression when the dataset merely grew.
 *
 * `data-bucket` is what the browser test reads the strip back through. It is a stable
 * name for a thing the interface already draws, which is the point: the assertion then
 * does not depend on the class names or the element each reading happens to be.
 *
 * Which of the three is loud is `BucketCount`'s and not this strip's, so the dashboard and
 * the ledger cannot come to disagree about it.
 */
const BucketStrip = ({ buckets }) => (
  <section aria-label="Findings by bucket" className="mb-3 flex flex-wrap items-center gap-3">
    {BUCKETS.map((bucket) => (
      <BucketCount key={bucket} bucket={bucket} value={buckets[bucket]} />
    ))}
  </section>
);

function FindingTable({ findings, check, withheld = 0, control, sides, language, landing }) {
  const all = findings.filter((finding) => finding.check === check);

  /**
   * The bucket split, on the two tabs whose rows **are** findings (ticket 80).
   *
   * The active work comes first, in the strip's own order, and Closed collapses into a
   * section under it. It is a **disclosure and not a filter**: ticking a finding fixed
   * moves it into the section rather than deleting it from the screen, and the section
   * says how many are in it, so nothing silently leaves.
   *
   * Text is deliberately not grouped this way. That tab is the content view, which is the
   * page in **document order** — ADR 0006 calls it the spine — and a finding's place in
   * the page is the context that makes it decidable. Sorting it by bucket would trade the
   * one thing that tab is for. The strip above counts all three either way.
   */
  const active = all.filter((finding) => bucketOf(finding.state) !== 'closed');
  const closed = all.filter((finding) => bucketOf(finding.state) === 'closed');
  // `null` is **nobody has said yet**, and it is not the same as shut. The landing below
  // opens the section only while the reader has expressed no preference, so the first press
  // always decides — a boolean here would leave the button arguing with the URL and losing.
  const [opened, setOpened] = useState(null);

  // A link can name a finding on either of these two tabs, and neither has a document
  // position to anchor on the way the content view does — their rows *are* findings. So
  // they anchor on the id, and the landing scrolls to it once the tab is on screen.
  // The **mark** is drawn at once and the **landing** waits for the log, which is the
  // hook's own rule.
  const focus = landing?.focus ?? null;

  // A link that names a **closed** finding opens the section on the way in. Without this
  // the landing would scroll to a row that is not on screen, which is the same silent
  // nothing-happens ticket 109 wrote the two banners above to stop.
  const showClosed = opened ?? closed.some((finding) => finding.id === focus);
  const rows = showClosed ? [...active, ...closed] : active;

  const landed =
    focus && rows.some((finding) => finding.id === focus) ? findingAnchor(focus) : null;
  useLandOn(landed, landing?.settled);

  // Why it is empty, and not that it is (ADR 0019). *No findings for Links* is true of a
  // page whose links agree and of a page whose every link finding is a diagnostic the
  // reader has switched off, and those are opposite answers to the question they came with.
  if (!all.length)
    return (
      <Empty>
        {withheld > 0
          ? allDiagnostic({ count: withheld, noun: `${CHECK_LABEL[check]} finding` })
          : `Nothing was found for ${CHECK_LABEL[check]} on this page.`}
      </Empty>
    );

  return (
    /* `table-fixed` survives the swap. shadcn's Table is auto-layout and wraps itself
       in an `overflow-x-auto` container, which is right for a wide dashboard row and
       wrong here: these three columns hold prose of wildly different lengths, and an
       auto layout would let the two comparison columns change width from row to row,
       which is the one thing a diff must not do.

       This used to add "the scroll container stays and simply never fires", which was
       true and was the bug. `table-fixed w-full` never asks for more room than it is
       given, so a narrow screen did not overflow — it divided, and the 224 pixel
       `w-56` status column ate a 319 pixel card, leaving the two comparison columns
       48 pixels each. A diff whose columns hold three words is not a narrow diff. The
       floor lets the container do the job it was already wrapped in. */
    <Table className="min-w-3xl table-fixed">
      <TableHeader className={HEAD_TONE}>
        {/* The compared content leads and the class follows it (ADR 0019). A row of this
            table is a difference an editor is deciding about, and what they decide *on* is
            the two texts — which sat third and fourth, behind a 224-pixel column of a pill,
            a detail, a date and a control. Nothing left the row; the order says which of it
            is the subject. */}
        <TableRow>
          <DiffHeads />
          <TableHead className="w-56">Class</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {active.map((finding) => (
          <FindingRow
            key={finding.id}
            finding={finding}
            focus={focus}
            control={control}
            sides={sides}
            language={language}
          />
        ))}

        {/* The section header, drawn only when there is closed work to reach. It is a row
            in the same table rather than a control beside it, so the closed findings open
            where they belong — under the work, in the columns they share with it.

            **It is hand-rolled, and `Collapsible` is why.** `Repeats.jsx` credits the
            primitive for writing its `aria-expanded` and this writes its own, which reads
            like the older of the two until you try the swap: what opens here is a run of
            **sibling `<tr>`s**, and `CollapsibleContent` is a `<div>` around its children.
            A div between a `tbody` and its rows is not a table, so the browser hoists the
            rows out of it and the three columns this section shares with the work above
            stop being shared. The primitive is refused for the one case it cannot hold,
            and nowhere else. */}
        {closed.length > 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={3} className="px-2 py-2">
              <button
                type="button"
                aria-expanded={showClosed}
                onClick={() => setOpened(!showClosed)}
                className={cn(
                  'text-xs font-medium text-muted-foreground hover:underline',
                  // A comfortable target under a small glyph (ticket 03). `text-xs` alone
                  // gave the press a 16-pixel line box; the words do not grow, the row it
                  // can be hit in does.
                  'flex min-h-6 items-center gap-1 py-1',
                )}
              >
                {/* The count is in the label, so the section says how much it is holding
                    while it is shut. A disclosure that only says "Closed" hides an amount
                    as well as a list. */}
                {BUCKET_LABEL.closed} (<span className="tabular-nums">{closed.length}</span>){' '}
                {/* `aria-hidden`, as every other disclosure glyph in this interface is:
                    `aria-expanded` above already says which way it points, and a screen
                    reader that also read the triangle would say it twice. */}
                <span aria-hidden>{showClosed ? '▾' : '▸'}</span>
              </button>
            </TableCell>
          </TableRow>
        )}

        {showClosed &&
          closed.map((finding) => (
            <FindingRow
              key={finding.id}
              finding={finding}
              focus={focus}
              control={control}
              sides={sides}
            />
          ))}
      </TableBody>
    </Table>
  );
}

/**
 * One finding's row, drawn the same whichever bucket section it is in.
 *
 * It is one component and not a second copy inside the closed branch for the plainest of
 * reasons: a bucket is a grouping, so a Closed row is the *same row* in a different place.
 * Two copies would be two chances for it to stop being the same row.
 */
const FindingRow = ({ finding, focus, control, sides, language }) => {
  // The mark of a landed row is `landing.mjs`'s rule, and the class it carries is
  // merged with this table's own rather than replacing them.
  const { className, ...mark } = landedRowProps(finding.id === focus);

  return (
    <TableRow
      id={findingAnchor(finding.id)}
      {...mark}
      className={cn('scroll-mt-4 align-top', className)}
    >
      {/* The same component the content rows use. A link finding word-diffs
          two target keys, which makes a changed path segment jump out. */}
      <DiffCells prod={finding.prod} new={finding.new} language={language} mono />
      {/* Named for the head above it, for the reason the content view's cell is: it follows
          the compared content now, and *the first cell of the row* is no longer the class. */}
      <TableCell data-slot="class" className="px-2 py-2 align-top whitespace-normal">
        <ClassPill class={finding.class} />
        <Detail detail={finding.detail} />
        <Occurrences count={finding.occurrences} title={onePageTitle(finding.occurrences)} />
        {/* A link finding aims at its anchor wording, which a reader does see. An
            image key and an alt text are not words on the page, so an image finding
            falls back to the heading above it — and to the page itself where it has
            neither, rather than to no link at all. */}
        <Section
          anchorHeading={finding.anchorHeading}
          locations={finding.locations}
          sides={sides}
          language={language}
        />
        <FirstSeen at={finding.firstSeen} />
        {/* Beside the date and above the control, which is where a fact about the row's
            past belongs: after what the row is, and before what is being asked about it. */}
        <HistoryNote note={finding.historyNote} />
        {/* The state pill is still here, inside the bucket. A bucket summarises; it does
            not replace what an editor decided about one finding. */}
        <div className="mt-1">{control(finding)}</div>
      </TableCell>
    </TableRow>
  );
};

/**
 * The `<head>`, as a checklist of five named slots (ticket 98).
 *
 * **It is not a `FindingTable`, and that is the design.** The head has five known slots
 * and an editor reads it as a list of slots rather than a list of defects, so the field is
 * the useful first column and every row is drawn whether or not it differs. There is no
 * class pill either: with the field fixed and both values side by side, a `META-CASING`
 * pill next to `…beschutting.` against `…beschutting` says nothing the two cells do not.
 * The class still drives the dashboard filter and the store's repeat list, which keep
 * theirs.
 *
 * Three of the five rows make a finding an editor can tick off or dismiss like any other,
 * and the control sits **inline after the label**: the field row *is* the finding row —
 * ticket 97 made each checking row hold at most one — so a row of its own would be a
 * second row for one slot.
 *
 * The other two are display only, and the note under the rule — the border above it — says
 * so in words. An absent control is not a statement: without the note an uncounted row
 * differs from an agreeing row only by a missing control, which reads as *nothing to do
 * here* rather than *this is not counted*.
 *
 * Which rows exist at all, and which of them make findings, is `compare/meta.mjs`'s
 * decision and not this component's.
 */
function MetaTable({ head, control, language, landing }) {
  const focus = landing?.focus ?? null;

  // The row a link named, on the same terms the two finding tables land on theirs: the
  // anchor is the finding's, because a head row has no document position to anchor on.
  const landed =
    focus && head.some((one) => one.finding?.id === focus) ? findingAnchor(focus) : null;
  useLandOn(landed, landing?.settled);

  const uncounted = head.filter(({ row }) => !isCheckingField(row.field));
  const at = ruleAt(head);

  const rows = ({ row, finding }) => (
    <MetaRow
      key={row.field}
      row={row}
      finding={finding}
      focus={focus}
      control={control}
      language={language}
    />
  );

  return (
    <Table className="min-w-2xl table-fixed">
      {/* This panel drew its two cells with no heading row at all, so the only thing saying
          which column was production was the order. A comparison names both of its sides
          (ADR 0019), and the leading column here is a row header rather than a column, so
          the head above it is empty. */}
      <TableHeader className={HEAD_TONE}>
        <TableRow>
          <DiffHeads>
            <TableHead className="w-40" />
          </DiffHeads>
        </TableRow>
      </TableHeader>
      <TableBody>
        {head.slice(0, at).map(rows)}
        <UncountedNote fields={uncounted.map(({ row }) => row.field)} />
        {head.slice(at).map(rows)}
      </TableBody>
    </Table>
  );
}

/**
 * The rule and the words under it: which of the rows on screen are not counted.
 *
 * It **names the rows** rather than pointing below itself, because the two it names are
 * not adjacent: Meta Keywords sits second, where an editor meets the field in the Magento
 * admin, and Canonical is last. The mockup in ticket 98 draws the rule above Canonical
 * alone and calls both rows display only, and naming them is how those two are one
 * statement.
 *
 * The fields are the ones **drawn**, not the two the panel knows about: Canonical's row is
 * gone on the 147 of 179 nl pages where only the new site has one, and a note claiming a
 * row that is not there is worse than no note. Nothing is drawn at all when nothing is
 * uncounted.
 */
const UncountedNote = ({ fields }) => {
  if (!fields.length) return null;
  const names = fields.map((field) => META_LABEL[field]);

  return (
    <TableRow className="hover:bg-transparent">
      {/* The rule is this row's own top border. */}
      <TableCell colSpan={3} className="border-t px-2 pt-3 pb-1">
        <p data-meta-note className="text-xs text-muted-foreground">
          Display only: {names.join(' and ')} {names.length > 1 ? 'are' : 'is'} not counted.
        </p>
      </TableCell>
    </TableRow>
  );
};

/**
 * Where the rule goes: above the run of display-only rows that ends the panel, and below
 * every row when there is no such run.
 *
 * It is read off the rows rather than written between two named ones, because which rows
 * there are is not fixed: Canonical is dropped where production has none, and then the
 * last row is Robots — a row the note must not sit above, or the one field an editor is
 * being asked about would read as uncounted.
 *
 * @param {{ row: import('../../../compare/meta.mjs').MetaRow }[]} head
 * @returns {number}
 */
function ruleAt(head) {
  let at = head.length;
  while (at > 0 && !isCheckingField(head[at - 1].row.field)) at -= 1;
  return at;
}

/**
 * One slot of the head: what the field is called, what each side holds, and — on the three
 * checking rows — what the editor has decided about it.
 */
const MetaRow = ({ row, finding, focus, control, language }) => {
  const { className, ...mark } = landedRowProps(Boolean(finding) && finding.id === focus);

  return (
    <TableRow
      id={finding ? findingAnchor(finding.id) : undefined}
      data-meta-field={row.field}
      {...mark}
      className={cn('scroll-mt-4 align-top', className)}
    >
      {/* A `<th>` in the body, not a `<td>`: this row's first cell names what
          the two cells beside it hold, which is what a row header is. */}
      <TableHead className="w-40 py-3 align-top font-medium whitespace-normal text-muted-foreground">
        <span data-meta-label>{META_LABEL[row.field]}</span>
        {/* The one loud case. Production has no canonical on 147 of 179 nl
            pages and those rows are gone, so the 2 pages where the new
            site **lost** one must not read like the rest. */}
        {row.field === 'canonical' && row.state === 'lost' && (
          <span data-wears="ink" data-tone="lost" className="mt-1 block text-xs font-normal">
            the new site has none
          </span>
        )}
        {finding && (
          <>
            {/* Where the difference is, said in the words the other tables say it in. A
                head finding has no heading above it, and a blank there would spend what
                ticket 34 bought: every difference in this log says where it is. */}
            <Section inHead />
            <FirstSeen at={finding.firstSeen} />
            <HistoryNote note={finding.historyNote} />
            <div className="mt-1">{control(finding)}</div>
          </>
        )}
      </TableHead>
      {/* `state` is the tool's answer, and the cells must not contradict it:
          a canonical that differs by hostname alone is `same`, and the
          hostname on screen is not a difference an editor can act on. */}
      <DiffCells
        prod={row.prod}
        new={row.new}
        language={language}
        mono
        equal={row.state === 'same'}
      />
    </TableRow>
  );
};

/**
 * shadcn's `Empty` with no media and no action. There is no icon because there is
 * nothing wrong: a tab with no findings is the outcome the editor is working towards,
 * and an illustration of an empty box would read as a failure to load.
 */
const Empty = ({ children }) => (
  <EmptyState className="py-6">
    <EmptyHeader>
      <EmptyDescription>{children}</EmptyDescription>
    </EmptyHeader>
  </EmptyState>
);
