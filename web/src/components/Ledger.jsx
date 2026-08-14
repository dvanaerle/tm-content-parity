import { useEffect, useMemo, useState } from 'react';
import { metaRows } from '../../../compare/meta.mjs';
import { Detail, Occurrences, Section, onePageTitle } from './Annotations.jsx';
import { ClassPill } from './Chips.jsx';
import ContentView from './ContentView.jsx';
import { DiffCells } from './Diff.jsx';
import OverrideControl from './OverrideControl.jsx';
import { Alert, AlertDescription, AlertTitle } from './ui/alert.jsx';
import { Badge } from './ui/badge.jsx';
import { Card, CardContent } from './ui/card.jsx';
import { Checkbox } from './ui/checkbox.jsx';
import { Empty as EmptyState, EmptyDescription, EmptyHeader } from './ui/empty.jsx';
import { Label } from './ui/label.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs.jsx';
import { CHECK_LABEL, canDecide } from '../lib/classes.mjs';
import {
  findingAnchor,
  landedRowProps,
  landingFor,
  useLanding,
  useLandOn,
} from '../lib/landing.mjs';
import { findingInSearch } from '../lib/page-url.mjs';
import { BANNER, CHROME, INK, PILL } from '../lib/palette.mjs';
import { cn } from '../lib/utils.js';
import { bucketOf, bucketsOf } from '../../../overrides/state.mjs';
import { BUCKETS, BUCKET_LABEL, BUCKET_TONE } from '../lib/buckets.mjs';

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
 * with this one. It arrives as a fifth tab, not as extra rows in these.
 */
const TABS = ['Text', 'Links', 'Images', 'Meta'];

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
  observationId,
  settled,
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
   * switching tabs is not a request to switch the noise toggle off and vice versa. The
   * mark on the row stays either way: looking at something else is not a reason to lose
   * where you came from.
   */
  const [focus, setFocus] = useState(/** @type {string | null} */ (null));
  useEffect(() => setFocus(findingInSearch(window.location.search)), []);

  const asked = useMemo(() => landingFor({ findings: derived, focus }), [derived, focus]);
  const { tab, noise, chooseTab, chooseNoise } = useLanding(asked, TABS[0]);

  /**
   * The landing, as the one thing the two tables below need: `focus` says which row and
   * `settled` says when. They never travel apart, so they travel as one.
   */
  const landing = useMemo(() => ({ focus, settled }), [focus, settled]);

  const { production, new: next } = report.sides;

  // The toggle asks about the **class**: a `diagnostic` is what a rule saw, told to the
  // author of the rule. An `information` finding is drawn beside the work and counted
  // nowhere (ticket 75), and what an editor decided about a finding is not noise, so
  // neither a decision nor a visibility other than `diagnostic` moves a row behind this
  // toggle.
  const findings = useMemo(
    () => derived.filter((finding) => noise || finding.visibility !== 'diagnostic'),
    [derived, noise],
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
      />
    ) : null;

  /**
   * The three buckets of this page (ticket 80), counted off the **derivation** and never
   * re-decided here. It reads `derived` and not the noise-filtered list on purpose:
   * `bucketsOf()` counts `work` findings, a `diagnostic` is not work, and so the toggle
   * cannot move a number that says how much work is left.
   */
  const buckets = useMemo(() => bucketsOf(derived), [derived]);

  // What the toggle would reveal, which is the `diagnostic` findings and nothing else.
  // The label must count what it uncovers: an `information` finding is on screen already.
  const noiseCount = derived.filter((f) => f.visibility === 'diagnostic').length;

  // Every badge counts **findings**, including Text's. The content view is a list
  // of rows and a grouped finding covers several of them, so a row count here would
  // put two different numbers for the same thing next to each other.
  const badges = {
    Text: findings.filter((finding) => finding.check === 'text').length,
    Links: findings.filter((finding) => finding.check === 'links').length,
    Images: findings.filter((finding) => finding.check === 'images').length,
  };

  if (!report.comparable) {
    return (
      /* The tone is `BANNER.caution` and not Alert's own `destructive` variant. An
         uncomparable page is a status, and palette rule 2 keeps status out of the diff
         hues; Alert's `destructive` reads from `--destructive`, which this repo has
         already pointed at the amber ink for exactly that reason. */
      <Alert className={`p-4 ${BANNER.caution}`}>
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
          measured again. The second is a finding this page has and no tab draws — the one
          `meta` rule, which the display-only Meta tab does not list.

          `caution` and not `warning` for both: a condition, not a loss. */}
      {(asked.missing || asked.unplaced) && (
        <Alert className={`mb-3 ${BANNER.caution}`}>
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
                This item is available on the Meta tab but is not counted as a finding.
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/*
        `py-0 gap-0` because this Card's first child is a tab strip that has to sit
        flush against the top edge and draw its own bottom rule. Card's default vertical
        padding would float the strip inside the card, which is the one place the strip
        must not be.

        `overflow-visible` is not cosmetic. Card ships `overflow-hidden` to clip an image
        to its corners, and an `overflow` other than `visible` on any ancestor silently
        stops `position: sticky` working in the descendant. The Text panel's outline
        nav is `lg:sticky lg:top-4` and it navigates a table up to 288 rows long, so
        clipping this card would have cost the one piece of furniture that makes a long
        page usable — and cost it quietly, with nothing on screen to show for it.
      */}
      <Card className="gap-0 overflow-visible py-0">
        {/*
          The tab strip is shadcn on Base UI since ticket 74, and it is the only
          thing in this component the library touches. What it buys is the roving
          tabindex: one Tab stop reaches the strip, the arrow keys move between the
          four, and Home and End reach the ends. The hand-rolled strip put four Tab
          stops in a row and answered no arrow key at all.

          The noise toggle now sits **beside** the `TabsList` rather than inside it.
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
              landed on top of the noise checkbox.

              Matching the prefix lets the two collapse to one class, and the list is
              finally as tall as what it contains.
            */}
            <TabsList
              variant="line"
              className="flex-wrap gap-1 p-0 group-data-horizontal/tabs:h-auto"
            >
              {TABS.map((name) => (
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
                  {badges[name] !== undefined && (
                    <Badge variant="neutral" className="tabular-nums">
                      {badges[name]}
                    </Badge>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Base UI's Checkbox is not an `<input>`, so the state arrives as the
                value rather than as an event: `onCheckedChange` and not
                `event.target.checked`. */}
            <Label className="ml-auto py-2 font-normal text-muted-foreground">
              <Checkbox checked={noise} onCheckedChange={chooseNoise} />
              Show noise ({noiseCount})
            </Label>
          </div>

          {/* The padding is on the wrapper and not on each panel: exactly one panel
              is mounted at a time, so four copies of `p-4` would be four chances to
              let one tab sit differently from the other three. */}
          <CardContent className="p-4">
            <TabsContent value="Text">
              <ContentView
                report={report}
                findings={derived}
                showNoise={noise}
                control={control}
                landing={landing}
              />
            </TabsContent>
            <TabsContent value="Links">
              <FindingTable
                findings={findings}
                check="links"
                control={control}
                sides={report.sides}
                landing={landing}
              />
            </TabsContent>
            <TabsContent value="Images">
              <FindingTable
                findings={findings}
                check="images"
                control={control}
                sides={report.sides}
                landing={landing}
              />
            </TabsContent>
            <TabsContent value="Meta">
              <MetaTable production={production} next={next} />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
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
 * does not depend on the class names or the element the badge happens to be.
 */
const BucketStrip = ({ buckets }) => (
  <section aria-label="Findings by bucket" className="mb-3 flex flex-wrap items-center gap-2">
    {BUCKETS.map((bucket) => (
      <Badge
        key={bucket}
        data-bucket={bucket}
        className={cn('tabular-nums', PILL[BUCKET_TONE[bucket]])}
      >
        {BUCKET_LABEL[bucket]} {buckets[bucket]}
      </Badge>
    ))}
  </section>
);

function FindingTable({ findings, check, control, sides, landing }) {
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

  if (!all.length) return <Empty>No findings for {CHECK_LABEL[check]}.</Empty>;

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
        <TableRow>
          <TableHead className="w-56">Class</TableHead>
          <TableHead>Production</TableHead>
          <TableHead>New site</TableHead>
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
          />
        ))}

        {/* The section header, drawn only when there is closed work to reach. It is a row
            in the same table rather than a control beside it, so the closed findings open
            where they belong — under the work, in the columns they share with it. */}
        {closed.length > 0 && (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={3} className="px-2 py-2">
              <button
                type="button"
                aria-expanded={showClosed}
                onClick={() => setOpened(!showClosed)}
                className={cn(
                  'text-xs font-medium text-muted-foreground hover:underline',
                  'flex items-center gap-1',
                )}
              >
                {/* The count is in the label, so the section says how much it is holding
                    while it is shut. A disclosure that only says "Closed" hides an amount
                    as well as a list. */}
                {BUCKET_LABEL.closed} ({closed.length}) {showClosed ? '▾' : '▸'}
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
const FindingRow = ({ finding, focus, control, sides }) => {
  // The mark of a landed row is `landing.mjs`'s rule, and the class it carries is
  // merged with this table's own rather than replacing them.
  const { className, ...mark } = landedRowProps(finding.id === focus);

  return (
    <TableRow
      id={findingAnchor(finding.id)}
      {...mark}
      className={cn('scroll-mt-4 align-top', className)}
    >
      <TableCell className="px-2 py-2 align-top whitespace-normal">
        <ClassPill class={finding.class} />
        <Detail detail={finding.detail} />
        <Occurrences count={finding.occurrences} title={onePageTitle(finding.occurrences)} />
        {/* A target key and an alt text are not words on the page, so the
            heading above them is the only thing a browser can scroll to. */}
        <Section
          anchorHeading={finding.anchorHeading}
          anchorHeadings={finding.anchorHeadings}
          sides={sides}
        />
        {/* The state pill is still here, inside the bucket. A bucket summarises; it does
            not replace what an editor decided about one finding. */}
        <div className="mt-1">{control(finding)}</div>
      </TableCell>
      {/* The same component the content rows use. A link finding word-diffs
          two target keys, which makes a changed path segment jump out. */}
      <DiffCells prod={finding.prod} new={finding.new} mono />
    </TableRow>
  );
};

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
    <Table className="min-w-2xl table-fixed">
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.field} className="align-top">
            {/* A `<th>` in the body, not a `<td>`: this row's first cell names what
                the two cells beside it hold, which is what a row header is. */}
            <TableHead className="w-40 py-3 align-top font-medium whitespace-normal text-muted-foreground">
              {row.field}
              {/* The one loud case. Production has no canonical on 147 of 179 nl
                  pages and those rows are gone, so the 2 pages where the new
                  site **lost** one must not read like the rest. */}
              {row.field === 'canonical' && row.state === 'lost' && (
                <span className={`mt-1 block text-xs font-normal ${INK.lost}`}>
                  the new site has none
                </span>
              )}
            </TableHead>
            {/* `state` is the tool's answer, and the cells must not contradict it:
                a canonical that differs by hostname alone is `same`, and the
                hostname on screen is not a difference an editor can act on. */}
            <DiffCells prod={row.prod} new={row.new} mono equal={row.state === 'same'} />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

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
