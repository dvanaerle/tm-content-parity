import { useMemo, useState } from 'react';
import { barOf } from '../../../overrides/state.mjs';
import { Detail, Occurrences, onePageTitle } from './Annotations.jsx';
import BulkControl from './BulkControl.jsx';
import { ClassPill } from './Chips.jsx';
import { STATE } from './OverrideControl.jsx';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { Checkbox } from './ui/checkbox.jsx';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible.jsx';
import {
  Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow,
} from './ui/table.jsx';
import { refusesMute } from '../lib/bulk.mjs';
import { CHROME, INK, PILL } from '../lib/palette.mjs';
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
export default function Repeats({ repeats, byFinding, bulk, link, searched = false }) {
  if (repeats.length === 0) return <NoRepeats />;

  return (
    <>
      <RowList
        repeats={repeats}
        byFinding={byFinding}
        bulk={bulk}
        link={link}
        searched={searched}
      />
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
export function ClassGroups({ repeats, classes, byFinding, bulk, link }) {
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
            link={link}
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
function ClassGroupRow({ group, open, onToggle, drawn, onDraw, byFinding, bulk, link }) {
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
        <CollapsibleTrigger className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm hover:bg-muted">
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
            link={link}
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
function RowList({ repeats, byFinding, bulk, link, drawn: given, onDraw, searched = false }) {
  const [held, setHeld] = useState(PAGE_SIZE);
  const drawn = given ?? held;
  const draw = (next) => (onDraw ? onDraw(next) : setHeld(next));

  return (
    <>
      <ul className="text-sm">
        {repeats.slice(0, drawn).map((repeat) => (
          <Row
            key={repeat.key}
            repeat={repeat}
            byFinding={byFinding}
            bulk={bulk}
            link={link}
            searched={searched}
          />
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

function Row({ repeat, byFinding, bulk, link, searched }) {
  const [open, setOpen] = useState(false);

  /**
   * The ticked pages, as finding ids (ticket 110).
   *
   * A difference opens with nothing ticked: selection is something an editor does and
   * never something they arrive at, and a press pre-aimed at ten pages is the all-or-
   * nothing control this replaces.
   */
  const [selected, setSelected] = useState(() => new Set());

  const tick = (id, on) => setSelected((held) => {
    const next = new Set(held);
    if (on) next.add(id); else next.delete(id);
    return next;
  });

  /**
   * All of them or none of them. Round one ticked only the pages a dismissal could act on
   * and left a decided one out — while that row stayed tickable by hand, so one control
   * refused what the other allowed. The ticks say *these pages*; each press then filters
   * to what it can act on and says what it did, which is the only place that rule belongs.
   */
  const tickAll = (on) => setSelected(on ? new Set(repeat.on.map((entry) => entry.id)) : new Set());

  /**
   * The pages of this difference a bulk mute cannot be pressed on — the same rule the
   * press applies, asked so the list can mark them. One page of twelve refuses the mute
   * for all twelve, and *untick the ones that refuse* is only an instruction if the rows
   * say which they are.
   */
  const refuses = useMemo(() => refusesMute({ repeat, byFinding }), [repeat, byFinding]);

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
      {/* The trigger is the whole row, as it was before ticket 110 and is again since its
          round two. Round one put the select-all here, which meant a checkbox inside a
          `CollapsibleTrigger` — a button inside a button, which is neither valid nor
          clickable — and it let an editor arm a press over pages they had never seen. The
          tick moved to the header of the list it selects, and the trap moved with it.

          `Collapsible` is what writes the `aria-expanded` this markup used to carry by
          hand — the state below decides, and the library draws it. */}
      <Collapsible
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          // Closing the difference puts the selection down: it is a question about one
          // press and not a state of the queue.
          if (!next) setSelected(new Set());
        }}
      >
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
          <PageTable
            repeat={repeat}
            byFinding={byFinding}
            link={link}
            selected={selected}
            onTick={tick}
            onTickAll={tickAll}
            refuses={refuses}
            searched={searched}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* One reason, many findings (ticket 31), on the pages that were ticked (ticket
          110). It is drawn **only** when something is ticked: an empty selection has
          nothing for an action to act on, and a bar carrying buttons that would write
          nothing is worse than no bar.

          It sits under the difference rather than inside the opened panel so it does not
          push the page list about as the selection grows: the list is what is being
          selected, and a toolbar that moved it would be a toolbar in the way. Closing the
          difference clears the selection, so the bar cannot outlive the list it belongs
          to. */}
      {selected.size > 0 && (
        <BulkControl
          repeat={repeat}
          byFinding={byFinding}
          bulk={bulk}
          selected={selected}
          onClear={() => setSelected(new Set())}
        />
      )}
    </li>
  );
}

/**
 * The tick that belongs to the difference itself (ticket 110).
 *
 * It is **tri-state**, and it is a control before it is a summary: ticked when all its
 * pages are, unticked when none are, indeterminate in between — and the same click that
 * reports also changes. `aria-checked="mixed"` is what a screen reader is told, which is
 * the whole of the third state's meaning.
 *
 * It ticks **every** page of the difference, decided or not. Round one ticked only the
 * pages a dismissal was offered on, which refused by select-all what the row-level tick
 * allowed by hand — and a decided page is not a page with nothing left to do: a mute is
 * still live there, and since round two so is an undo.
 *
 * Its label says **kies** and never *afgehandeld*. The ledger already spends a checkbox on
 * the tri-state *Opgelost* control, which genuinely is a decision (tickets 36 and 48), so
 * two checkboxes with two meanings share this screen and each has to say which it is.
 */
function SelectAll({ repeat, selected, onTickAll }) {
  // Over **every** page of the difference and not over the ones it ticks: it says
  // *ticked* only when no row of the list is left out, because a reader who is told
  // *ticked* while a row is unticked has been told the one thing this control exists to
  // get right.
  const all = repeat.on.every((entry) => selected.has(entry.id));
  const some = selected.size > 0 && !all;

  return (
    <Checkbox
      checked={all}
      indeterminate={some}
      // From the mixed state a press **clears**. Base UI would otherwise answer `true`
      // there, which would re-tick the same rows and leave the control stuck at mixed —
      // a control that cannot be pressed back is not a control.
      onCheckedChange={(ticked) => onTickAll(some ? false : ticked)}
      aria-label={`Kies alle ${repeat.on.length} pagina's van dit verschil`}
      title="Kiest elke pagina van dit verschil. Kiezen legt niets vast."
    />
  );
}

/**
 * The pages of one difference, with a tick each (ticket 110).
 *
 * It was a list until this ticket and it is a table now, because a tick is a column and a
 * column wants a header word. That word is the whole reason the table is here: the ledger
 * already spends a checkbox on the tri-state *Opgelost* control, which **is** a decision,
 * and two checkboxes with two meanings on one screen have to say which is which. This one
 * says *Kies*, and every tick repeats it in its label.
 *
 * A page name opens the **whole** content view for that page, and not a fragment of it
 * filtered to this difference. The question a one-sided difference asks is where the text
 * belongs, and only document order answers it (ADR 0006).
 *
 * Since ticket 109 the link also **names this finding**, and the page lands on it: the row
 * opens, the view scrolls to it, and it is marked. That is not a filter and it narrows
 * nothing — it is the difference between arriving at the row and arriving at the top of a
 * page 399 rows long. The link carries the dashboard back as well, so both Back and the
 * header link return to this screen: its view, its pills and its search term. **Not**
 * which group was open — that is session state by the rule `groupRepeatsByClass()` states,
 * and a pill that is on re-opens its own group anyway.
 */
function PageTable({ repeat, byFinding, link, selected, onTick, onTickAll, refuses, searched }) {
  return (
    <div className="border-t border-border bg-muted px-4 py-2 text-sm">
      <Table>
        {/* Under a search these are the **matching** pages and a difference may be on
            more: `searchStore()` builds its repeats out of matched findings only, and a
            term can be in one page's key and not another's. Ticking all of them is then a
            press on the matches, which is right — and unsayable if this line is missing. */}
        {searched && (
          <TableCaption className="mt-2 text-left text-xs">
            Dit zijn de pagina&rsquo;s waarop de zoekterm is gevonden. Dit verschil kan op
            meer pagina&rsquo;s staan; die staan hier niet en worden niet mee beslist.
          </TableCaption>
        )}
        <TableHeader>
          <TableRow>
            {/* The header word is drawn for a screen reader and not for an eye. A header
                cell holding nothing but a checkbox announces nothing, and *Kies* beside
                the tick would be a word repeated in every label under it. */}
            <TableHead className="w-8">
              <SelectAll repeat={repeat} selected={selected} onTickAll={onTickAll} />
              <span className="sr-only">Kies</span>
            </TableHead>
            <TableHead>Pagina</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {repeat.on.map((entry) => (
            <TableRow key={entry.id} data-state={selected.has(entry.id) ? 'selected' : undefined}>
              <TableCell>
                <Checkbox
                  checked={selected.has(entry.id)}
                  onCheckedChange={(ticked) => onTick(entry.id, ticked)}
                  aria-label={`Kies ${entry.page}`}
                />
              </TableCell>
              <TableCell className="whitespace-normal">
                <a className={cn('hover:underline', CHROME.link)} href={link(repeat.store, entry.page, entry.id)}>
                  {entry.page}
                </a>
                <Occurrences count={entry.occurrences} title={onePageTitle(entry.occurrences)} />
              </TableCell>
              <TableCell>
                <FindingState finding={byFinding.get(entry.id)} />
                {/* On the row and not on the *ticked* row. An editor ticking one page at
                    a time has to see which page will block the mute before they tick it,
                    or *untick exactly those* is an instruction they can only follow
                    backwards. The mark costs two words and only ever appears inside an
                    opened difference. */}
                <NoMute reason={refuses.get(entry.id)} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * The row that is holding the bulk mute back, said on the row itself.
 *
 * The refusal above the button gives the count and the reason; this gives the address.
 * Only the mute is refused — a dismissal on this page is untouched — so the words name
 * the one press they are about and not the selection.
 */
const NoMute = ({ reason }) => (
  reason
    ? (
      <span className={cn('ml-2 text-[11px]', INK.attention)} title={WHY_NO_MUTE[reason]}>
        niet te dempen
      </span>
    )
    : null
);

/**
 * The two obstacles, kept apart. A section this screen does not know is a screen older
 * than the log and a reload answers it; a difference before the first heading is a real
 * fact about the page, and muting there is a judgement to make one page at a time. Saying
 * one of these where the other is true sends an editor to the wrong work.
 */
const WHY_NO_MUTE = {
  unknown: 'Van deze pagina is hier niet bekend onder welk kopje dit verschil staat — dit '
    + 'scherm is ouder dan het logboek. Herlaad de pagina. Negeren kan wel.',
  headless: 'Dit verschil staat hier vóór de eerste kop, dus dempen zou hier alles vóór de '
    + 'eerste kop verbergen. Dat gaat per pagina, op de pagina zelf. Negeren kan wel.',
};

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
