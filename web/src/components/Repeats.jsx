import { useMemo, useState } from 'react';
import { barOf } from '../../../overrides/state.mjs';
import { Detail, Occurrences, onePageTitle } from './Annotations.jsx';
import BulkControl from './BulkControl.jsx';
import { ClassPill } from './Chips.jsx';
import { STATE } from './OverrideControl.jsx';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible.jsx';
import { CHROME, INK, PILL } from '../lib/palette.mjs';
import { pageHref } from '../lib/page-url.mjs';
import { cn } from '../lib/utils.js';
import { findingsIn, groupRepeatsByClass } from '../lib/view.mjs';

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
 * This is the **flat** reading of that list, and it is what a search draws (ticket 82).
 * *Verschillen* draws `ClassGroups` below instead, which is the same rows in a class group
 * for each class (ticket 100). A search answers past the classes — the term is the
 * grouping the editor asked for — so grouping its result by class would be a second
 * grouping over one answer.
 *
 * **The backlog is not drained.** A repeat is a grouping and never a finding, so a
 * decision on a repeat is still one decision per finding — every number here says how
 * much is *decided*, and none of them counts down to an empty list.
 */
export default function Repeats({ repeats, byFinding, bulk }) {
  if (repeats.length === 0) return <NoRepeats />;

  return (
    <>
      <RowList repeats={repeats} byFinding={byFinding} bulk={bulk} />
      <Total repeats={repeats} />
    </>
  );
}

/**
 * The same repeats, in a **class group** for each class (ticket 100).
 *
 * *Verschillen* is the queue an editor lands on, and as one undifferentiated column it
 * asks to be read before it says anything. Six or so numbers is a choice instead: which
 * **kind** of difference to work through. The order inside a group is untouched, so
 * nothing changes about which work is on top — only how much of it arrives at once.
 *
 * The word is **group** and never *section*. `CONTEXT.md` spends "section" on the mute
 * scope — a run of one page under an anchor heading — and one word with two meanings is
 * what that glossary exists to stop. Ticket 100 asked for sections; the name is refused
 * and the concept is kept.
 *
 * **Opening a group is not a filter.** It changes what is drawn and never what is
 * included, so it is session state here, it is absent from the amber strip, and *filter
 * wissen* does not touch it. The class pills stay the one filter: while a pill is on, its
 * group is open and the unselected groups are not drawn at all, so the two controls cannot
 * tell different stories.
 *
 * The search draws the flat list above instead. A search answers past the classes — the
 * term is the grouping the editor asked for — and grouping it by class as well would be a
 * second grouping over one answer.
 */
export function ClassGroups({ repeats, classes, byFinding, bulk }) {
  const groups = useMemo(() => groupRepeatsByClass(repeats, classes), [repeats, classes]);

  // Which groups are open. The initial state is the derivation's `opensOnLoad`: closed,
  // unless a group is the only one holding anything or the pills already chose it.
  const [open, setOpen] = useState(
    () => groups.filter((group) => group.opensOnLoad).map((group) => group.class),
  );

  // One at a time, on a click: two open groups is the wall again in halves. The pills may
  // still open several at load, and that is their call to make — they are the control that
  // chose those classes. Clicking from there collapses the rest, and re-toggling a pill is
  // what brings the pair back.
  const toggle = (cls) => setOpen(open.includes(cls) ? open.filter((held) => held !== cls) : [cls]);

  // How many rows each group draws, held **here** rather than inside the group. A closed
  // group unmounts its rows, so a budget living down there would reset every time: an
  // editor who paged `copy` to three hundred rows, looked at `casing` and came back would
  // find the paging gone. The budget is the group's, and the group keeps it for as long as
  // this list is on screen.
  const [budget, setBudget] = useState(/** @type {Record<string, number>} */ ({}));

  if (repeats.length === 0) return <NoRepeats />;

  return (
    <>
      <ul>
        {groups.map((group) => (
          <ClassGroupRow
            key={group.class}
            group={group}
            open={open.includes(group.class)}
            onToggle={() => toggle(group.class)}
            drawn={budget[group.class] ?? PAGE_SIZE}
            onDraw={(next) => setBudget({ ...budget, [group.class]: next })}
            byFinding={byFinding}
            bulk={bulk}
          />
        ))}
      </ul>
      <Total repeats={repeats} />
    </>
  );
}

/**
 * One class, its repeat count, and its rows behind a click.
 *
 * An empty group is drawn and says so, and it is **not** a trigger: *nothing wrong here*
 * and *this class does not exist* are two different answers, and a reader who cannot tell
 * them apart does not know whether the rule ran. It states no number, because the sentence
 * is the number and *0 verschillen* beside it would say one thing twice.
 *
 * Most repeats are singletons — 78.8% of them in `nl`, measured in ticket 81 — and grouping
 * makes that tail navigable; it does not get to decide the tail is not work. So no group is
 * left out for being small, and none of them hides its rows behind its count.
 */
function ClassGroupRow({ group, open, onToggle, drawn, onDraw, byFinding, bulk }) {
  const count = group.repeats.length;

  if (count === 0) {
    return (
      <li className="flex items-center gap-2 border-b border-border px-4 py-2 text-sm last:border-0">
        <ClassPill class={group.class} />
        <span className="text-muted-foreground">Geen verschil van deze soort in deze winkel.</span>
      </li>
    );
  }

  return (
    <li className="border-b border-border last:border-0">
      <Collapsible open={open} onOpenChange={onToggle}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 bg-muted/40 px-4 py-2 text-left text-sm hover:bg-muted">
          <span aria-hidden className="w-3 text-muted-foreground">{open ? '▾' : '▸'}</span>
          <ClassPill class={group.class} />
          {/* The count is this group's own rows and nothing summed from elsewhere.
              Opening it moves no count, no bar and no denominator: the repeat total
              across the groups is the total the footer states. */}
          <span className="tabular-nums text-muted-foreground">
            {count} {count === 1 ? 'verschil' : 'verschillen'}
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {/* The budget belongs to **this** group, and so does the button that pages it.
              One number over the whole list would draw a hundred rows of the first class
              and none of the fifth. */}
          <RowList
            repeats={group.repeats}
            byFinding={byFinding}
            bulk={bulk}
            drawn={drawn}
            onDraw={onDraw}
          />
        </CollapsibleContent>
      </Collapsible>
    </li>
  );
}

/**
 * The rows, and how many of them are drawn.
 *
 * A rendering budget, in the manner of the clamp: it is about length and not about
 * findings. The line below says how many rows there are, so nothing here is hidden —
 * only not drawn yet.
 *
 * The budget is a prop when a class group owns it and state here when nobody else does,
 * which is the flat list a search draws. A list that is never taken off screen cannot lose
 * its paging, so there is nothing above it to hold.
 */
function RowList({ repeats, byFinding, bulk, drawn: given, onDraw }) {
  const [held, setHeld] = useState(PAGE_SIZE);
  const drawn = given ?? held;
  const draw = (next) => (onDraw ? onDraw(next) : setHeld(next));

  return (
    <>
      <ul className="text-sm">
        {repeats.slice(0, drawn).map((repeat) => (
          <Row key={repeat.key} repeat={repeat} byFinding={byFinding} bulk={bulk} />
        ))}
      </ul>

      {drawn < repeats.length && (
        <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
          {drawn} van {repeats.length} verschillen getekend.{' '}
          <Button variant="outline" size="xs" onClick={() => draw(drawn + PAGE_SIZE)}>
            Volgende {PAGE_SIZE} tonen
          </Button>
        </p>
      )}
    </>
  );
}

/**
 * What the list adds up to, stated once at the bottom of it.
 *
 * Both numbers come from **this** list, so they cannot disagree about what they are
 * counting. A filtered row count over an unfiltered finding count would be exactly the
 * mismatched pair ticket 81 exists to stop — and the total is over the repeats given,
 * grouped or not, so grouping them cannot move it either.
 */
function Total({ repeats }) {
  return (
    <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
      {repeats.length} verschillen over {findingsIn(repeats)} bevindingen. Het groeperen
      scheelt leeswerk en geen werk: één beslissing op een regel blijft één beslissing per
      bevinding, dus deze lijst raakt niet leeg. Wat vooruitgaat, is hoeveel er besloten
      is.
    </p>
  );
}

/** Said by both readings, so it is said once. */
const NoRepeats = () => (
  <p className="px-4 py-6 text-sm text-muted-foreground">Geen verschil gevonden.</p>
);

/** How many rows are drawn at once, and how many the button adds. */
const PAGE_SIZE = 100;

/**
 * What the `×N` mark means on a repeat, which is not what it means on a finding: it
 * counts over the pages, and the row already says how many pages there are. Confusing
 * the two is this ticket's named trap, so the two sentences are written apart.
 */
const acrossPagesTitle = (repeat) => `${repeat.occurrences} keer in totaal, op ${repeat.on.length} `
  + "pagina's. Op sommige van die pagina's staat het verschil meer dan één keer.";

function Row({ repeat, byFinding, bulk }) {
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
    <li className="border-b border-border last:border-0">
      {/* The trigger is the whole row, and `Collapsible` is what writes the
          `aria-expanded` this markup used to carry by hand — the state below still
          decides, and the library only draws it. */}
      <Collapsible open={open} onOpenChange={(next) => setOpen(next)}>
        <CollapsibleTrigger className="flex w-full flex-wrap items-start gap-2 px-4 py-2 text-left hover:bg-muted">
          <span className="mt-0.5 shrink-0">
            <ClassPill class={repeat.class} />
            <Detail detail={repeat.detail} />
            <MatchedFields fields={repeat.fields} />
          </span>

          <span className="min-w-48 flex-1 break-words">
            {repeat.prod ?? '—'}
            <span className="mx-1 text-muted-foreground">→</span>
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
            <span className={cn('ml-2 tabular-nums', bar.closed ? INK.info : 'text-muted-foreground')}>
              {bar.closed} van {bar.denominator} afgehandeld
            </span>
          </span>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <ul className="border-t border-border bg-muted px-4 py-2 text-sm">
            {/* A page name opens the **whole** content view for that page, and not a
                fragment of it filtered to this difference. The question a one-sided
                difference asks is where the text belongs, and only document order
                answers it (ADR 0006). */}
            {repeat.on.map((entry) => (
              <li key={entry.id} className="flex flex-wrap items-baseline gap-2 py-0.5">
                <a className={cn('hover:underline', CHROME.link)} href={pageHref(repeat.store, entry.page)}>
                  {entry.page}
                </a>
                <Occurrences count={entry.occurrences} title={onePageTitle(entry.occurrences)} />
                <FindingState finding={byFinding.get(entry.id)} />
              </li>
            ))}
          </ul>

          {/* One reason, many findings (ticket 31). It is **below** the page list on
              purpose: those are the pages the decision covers, and an editor reads them
              before deciding about them. It cannot go in the header, which is entirely
              the collapsible's trigger. */}
          <BulkControl repeat={repeat} byFinding={byFinding} bulk={bulk} />
        </CollapsibleContent>
      </Collapsible>
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
      <span className="ml-2 text-[11px] text-muted-foreground">
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
      <Badge className={PILL[STATE[finding.state].tone]}>
        {STATE[finding.state].label}
      </Badge>
    )
    : null
);
