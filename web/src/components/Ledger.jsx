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
import { CHECK_LABEL } from '../lib/classes.mjs';
import { findingAnchor, landedRowProps, landingFor, useLanding, useLandOn } from '../lib/landing.mjs';
import { findingInSearch } from '../lib/page-url.mjs';
import { BANNER, CHROME, INK } from '../lib/palette.mjs';
import { cn } from '../lib/utils.js';

/**
 * The column heads of both tables here and of the content view are the same small
 * capitals. `TableHead` ships `text-foreground`, which a plain class beside it cannot
 * beat, so the tone is written as a descendant selector on the header instead — an
 * attribute-free `[&_th]` still outranks the component's own class. This is the same
 * shape of problem as `CHROME.tabActive` below, and the same answer: the palette, or
 * in this case the muted neutral the whole interface already uses, has to be declared
 * somewhere that outranks shadcn rather than somewhere that ties with it.
 */
const HEAD_TONE = '[&_th]:text-[11px] [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-muted-foreground';

/**
 * A tabbed ledger, production and the new site side by side.
 *
 * **Four tabs** since ticket 81, and Inhoud lands first. Diff and Content were two
 * tabs answering half a question each, and Outline was production's unit list
 * indented by heading level — which the merged content view now contains, and which
 * returns there as navigation. That closes ticket 12's question about the tab count.
 *
 * Inhoud lands first because it is now the whole page rather than a wall of
 * unexplained differences. An editor who lands on a task list has to take the
 * tool's word for it.
 *
 * **Taken is gone.** It was every finding of the page in one list, grouped by check,
 * and each of its three groups is a tab that shows the same findings with better
 * context: Inhoud puts a text finding in document order, and Links and Afbeeldingen
 * word-diff the two targets. Its one remaining claim was *work down a page without
 * changing tabs*, and it answered that by removing the context the other tabs add.
 * The grouped reading of the work is now the store's repeat list, which groups
 * across pages, which is where the repetition actually is.
 *
 * Coverage is absent: Axis B is ticket 24, and ticket 11 forbids summing its bar
 * with this one. It arrives as a fifth tab, not as extra rows in these.
 */
const TABS = ['Inhoud', 'Links', 'Afbeeldingen', 'Meta'];

/**
 * `findings` are the **derived** findings from `derivePageState()` — the same
 * records with a `state` and an `override` attached. The Ledger never re-derives
 * anything; it renders what the pure function decided.
 */
export default function Ledger({ report, findings: derived, append, canWrite, observationId, settled }) {
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

  // A muted finding stays **visible behind the toggle**: muting is not deleting,
  // and an editor who muted a class by mistake must be able to find it again.
  const findings = useMemo(
    () => derived.filter((finding) => noise || (finding.shown && finding.state !== 'muted')),
    [derived, noise],
  );

  // `derived` and not `findings`: the mute counts what it would hide on the whole
  // snapshot, and the noise toggle is a question about the screen, not about the
  // press. A count that changed with a checkbox would not be the press's count.
  const control = (finding) => (
    <OverrideControl
      finding={finding}
      findings={derived}
      observationId={observationId}
      append={append}
      canWrite={canWrite}
    />
  );

  const hiddenCount = derived.length - derived.filter((f) => f.shown && f.state !== 'muted').length;

  // Every badge counts **findings**, including Inhoud's. The content view is a list
  // of rows and a grouped finding covers several of them, so a row count here would
  // put two different numbers for the same thing next to each other.
  const badges = {
    Inhoud: findings.filter((finding) => finding.check === 'text').length,
    Links: findings.filter((finding) => finding.check === 'links').length,
    Afbeeldingen: findings.filter((finding) => finding.check === 'images').length,
  };

  if (!report.comparable) {
    return (
      /* The tone is `BANNER.attention` and not Alert's own `destructive` variant. An
         uncomparable page is a status, and palette rule 2 keeps status out of the diff
         hues; Alert's `destructive` reads from `--destructive`, which this repo has
         already pointed at the amber ink for exactly that reason. */
      <Alert className={`p-4 ${BANNER.attention}`}>
        <AlertTitle className="font-semibold">Niet te vergelijken</AlertTitle>
        <AlertDescription className="text-current">
          <p className="text-sm">{report.skipReason}</p>
          <p className="mt-2 text-sm">
            Ticket 07 laat de vergelijking alleen doorgaan bij status 200 aan beide kanten:
            een 404-pagina heeft ook een <code>&lt;main&gt;</code> en levert anders honderden
            verschillen op waar niemand iets mee kan.
          </p>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      {/* Two ways a link can arrive with nothing to land on, and both of them have to be
          said out loud — otherwise the page simply does not move and the reader is left
          wondering whether they missed it.

          The first is a link that outlived its finding: an id is a term of the text, so it
          expires the moment the text does, whether the difference was fixed or the page was
          measured again. The second is a finding this page has and no tab draws — the one
          `meta` rule, which the display-only Meta tab does not list.

          `attention` and not `severe` for both: a condition, not a loss. */}
      {(asked.missing || asked.unplaced) && (
        <Alert className={`mb-3 ${BANNER.attention}`}>
          <AlertTitle className="font-semibold">
            {asked.missing
              ? 'Dit verschil staat niet in deze momentopname.'
              : 'Dit verschil staat niet in een van deze tabbladen.'}
          </AlertTitle>
          <AlertDescription className="text-current">
            {asked.missing ? (
              <p className="text-sm">
                De link wees een bevinding aan die er niet meer is: het verschil is opgelost,
                of de pagina is opnieuw gemeten en de tekst is veranderd. De hele pagina staat
                er nog wel.
              </p>
            ) : (
              <p className="text-sm">
                De link wees een bevinding over de <code>&lt;head&gt;</code> aan. Ticket 21
                beslist nog wat daar een pariteitsdefect is, dus die bevinding heeft geen
                regel om naartoe te springen. Meta laat de velden zelf zien.
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
        stops `position: sticky` working in the descendant. The Inhoud panel's outline
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
            <TabsList variant="line" className="group-data-horizontal/tabs:h-auto flex-wrap gap-1 p-0">
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
                    <Badge variant="secondary" className="tabular-nums">
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
              Ruis en gedempt tonen ({hiddenCount})
            </Label>
          </div>

          {/* The padding is on the wrapper and not on each panel: exactly one panel
              is mounted at a time, so four copies of `p-4` would be four chances to
              let one tab sit differently from the other three. */}
          <CardContent className="p-4">
            <TabsContent value="Inhoud">
              <ContentView
                report={report}
                findings={derived}
                showNoise={noise}
                control={control}
                landing={landing}
              />
            </TabsContent>
            <TabsContent value="Links">
              <FindingTable findings={findings} check="links" control={control} sides={report.sides} landing={landing} />
            </TabsContent>
            <TabsContent value="Afbeeldingen">
              <FindingTable findings={findings} check="images" control={control} sides={report.sides} landing={landing} />
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

function FindingTable({ findings, check, control, sides, landing }) {
  const rows = findings.filter((finding) => finding.check === check);

  // A link can name a finding on either of these two tabs, and neither has a document
  // position to anchor on the way the content view does — their rows *are* findings. So
  // they anchor on the id, and the landing scrolls to it once the tab is on screen.
  // The **mark** is drawn at once and the **landing** waits for the log, which is the
  // hook's own rule.
  const focus = landing?.focus ?? null;
  const landed = focus && rows.some((finding) => finding.id === focus) ? findingAnchor(focus) : null;
  useLandOn(landed, landing?.settled);

  if (!rows.length) return <Empty>Geen bevindingen voor {CHECK_LABEL[check]}.</Empty>;

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
    <Table className="table-fixed min-w-3xl">
      <TableHeader className={HEAD_TONE}>
        <TableRow>
          <TableHead className="w-56">Soort</TableHead>
          <TableHead>Productie</TableHead>
          <TableHead>Nieuw</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((finding) => {
          // The mark of a landed row is `landing.mjs`'s rule, and the class it carries is
          // merged with this table's own rather than replacing them.
          const { className, ...mark } = landedRowProps(finding.id === focus);

          return (
            <TableRow
              key={finding.id}
              id={findingAnchor(finding.id)}
              {...mark}
              className={cn('align-top scroll-mt-4', className)}
            >
              <TableCell className="px-2 py-2 align-top whitespace-normal">
                <ClassPill class={finding.class} />
                <Detail detail={finding.detail} />
                <Occurrences count={finding.occurrences} title={onePageTitle(finding.occurrences)} />
                {/* A target key and an alt text are not words on the page, so the
                    heading above them is the only thing a browser can scroll to. */}
                <Section anchorHeading={finding.anchorHeading} sides={sides} />
                <div className="mt-1">{control(finding)}</div>
              </TableCell>
              {/* The same component the content rows use. A link finding word-diffs
                  two target keys, which makes a changed path segment jump out. */}
              <DiffCells prod={finding.prod} new={finding.new} mono />
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
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
      <Alert className="mb-3">
        <AlertDescription>
          Alleen weergave, zonder afvinken. Ticket 21 beslist nog wat in de{' '}
          <code>&lt;head&gt;</code> een pariteitsdefect is, dus hier komen geen bevindingen
          uit en deze regels staan niet in de teller.
        </AlertDescription>
      </Alert>
      {/* A lower floor than the finding table's: a meta row holds a title or a
          description, not a block of body copy, and `w-40` leaves more behind. */}
      <Table className="table-fixed min-w-2xl">
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
                  <span className={`mt-1 block text-[11px] font-normal ${INK.lost}`}>
                    de nieuwe site heeft er geen
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
    </>
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
