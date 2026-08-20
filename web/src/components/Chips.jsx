import { SearchIcon, XIcon } from 'lucide-react';
import { BUCKET_LABEL, BUCKET_TONE } from '../lib/buckets.mjs';
import { classInfo } from '../lib/classes.mjs';
import { PRIORITIES } from '../../../shared/priorities.mjs';
import { cn } from '../lib/utils.js';
import { Hint, TextHint } from './Hint.jsx';
import { Alert } from './ui/alert.jsx';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group.jsx';
import { severityTone } from '../lib/palette.mjs';

/*
 * Every chip in this file is a shadcn `Badge` for its shape and a **tone** for its
 * colour. Badge's own variants — `default`, `secondary`, `destructive` — are refused on
 * purpose: they read from `--primary` and `--destructive`, and a class tone is not a
 * brand colour and is not a status. The tone arrives as `data-tone` beside a
 * `data-wears`, and `app.css` decides what that prints.
 *
 * **`variant={null}` and not a variant with no colour in it**, because the library has
 * none: every one of the seven paints a ground. `cva` reads `null` as *this element has
 * no variant*, so the badge keeps its shape — the pill radius, the height, the icon
 * sizing — and brings no `bg-*` utility to outrank the tone. A variant left at its
 * default would win, since a shape is a rule in `@layer components` and a utility comes
 * after it; that is deliberate, so a component can still depart from a shape with a
 * class.
 *
 * That is a deliberate breach of shadcn's own guidance that `className` is for layout
 * and never for colour. ADR 0007 outranks it: the palette decides tone.
 */

/**
 * A number and what it counts: the number in bold, its label beside it.
 *
 * Ticket 09 requires absolute counts everywhere, because the denominator moves: a
 * corrected difference leaves the snapshot, and a class switched off leaves the count.
 *
 * **Text, and no longer a filled chip** (ADR 0019). A quantity is not a category, so it is
 * not what a badge is for — and a row of eight filled chips is the wall this ticket set
 * out to remove, in which the one an editor needed was no louder than the seven they did
 * not. The tone survives as ink where the tone shape has one; `neutral` prints none, which
 * is what carrying no judgement looks like.
 */
export function Count({ value, label, tone = 'neutral', hint, className = '', ...props }) {
  // A count with nothing to explain is left as text — no hint, and so no tab stop. A tab
  // stop on every number would put a reader through the strip a press at a time.
  return (
    <TextHint text={hint}>
      <span className={cn('flex items-baseline gap-1.5 text-sm', className)} {...props}>
        <Reading value={value} label={label} tone={tone} />
      </span>
    </TextHint>
  );
}

/**
 * The number and its word, in the one order both strips read them in.
 *
 * It is a component and not two lines repeated because the badge below draws the same pair
 * and the two must not drift: a strip reading *2 Open* beside a badge reading *Needs
 * attention 1* is the one thing `BucketCount` exists to prevent.
 *
 * The space between the two is **written** and not left to the flex gap. A gap draws a
 * space and does not put one in the text, so a screen reader and a test both read *2Open*.
 */
function Reading({ value, label, tone = null }) {
  return (
    <>
      <strong
        data-wears={tone ? 'ink' : null}
        data-tone={tone}
        className="font-semibold tabular-nums"
      >
        {value}
      </strong>{' '}
      <span className={tone ? '' : 'text-muted-foreground'}>{label}</span>
    </>
  );
}

/**
 * One of the three buckets, wherever they are read together.
 *
 * **Only the middle one is a badge**, and that is ADR 0019's list rather than this
 * component's taste: *Needs attention* is the one an editor scans for, and `Open` and
 * `Closed` are already said by the strip they sit in — a badge on each was a second copy
 * of the surrounding structure. Written once because the dashboard and the ledger both
 * draw all three, and two copies of *which one is loud* is one copy too many.
 *
 * @param {object} props
 * @param {import('../../../overrides/state.mjs').Bucket} props.bucket
 * @param {number} props.value
 * @param {string} [props.hint]
 * @param {string} [props.className]
 */
export function BucketCount({ bucket, value, hint, className = '' }) {
  if (bucket !== 'needs-attention') {
    return (
      <Count
        value={value}
        label={BUCKET_LABEL[bucket]}
        tone={BUCKET_TONE[bucket]}
        hint={hint}
        className={className}
        data-bucket={bucket}
      />
    );
  }

  return (
    <TextHint text={hint}>
      <Badge
        data-bucket={bucket}
        data-badge="needs-attention"
        variant={null}
        data-wears="pill"
        data-tone={BUCKET_TONE[bucket]}
        className={cn('h-auto gap-1.5 px-2 py-1 tabular-nums', className)}
      >
        <strong className="font-semibold">{value}</strong> <span>{BUCKET_LABEL[bucket]}</span>
      </Badge>
    </TextHint>
  );
}

/**
 * One finding class, coloured by whether it is work.
 *
 * It draws the **label** and never the key. The key is the contract's — it makes the
 * finding id, so it cannot change — and an editor reading `IMAGE-MISSING` was reading the
 * contract (ADR 0019).
 *
 * **Two presses, two verbs, one class** (ticket 03). Given an `href` this label is a
 * **link** that opens every finding of the class; the pill in the filter strip stays a
 * control that toggles. That difference is drawn here, in the one place a class is written
 * on screen, because it is the difference an editor reads the affordance by: a press that
 * navigates must never look like a press that filters. The anchor is what says so — it has
 * a URL, it can be opened in a new tab, and the browser draws it as a place to go.
 *
 * @param {object} props
 * @param {string} props.class
 * @param {boolean} [props.hinted] Off inside a control that carries a hint of its own. One
 *   element gets one hint: a pill inside a filter button would be a second trigger inside the
 *   group's own, and a second sentence for a reader who asked for none.
 * @param {string | null} [props.href] Where the label goes, or nothing. It is `null`
 *   everywhere the class is a **statement** rather than a way in — and it must stay `null`
 *   inside a button, where an anchor is neither valid nor clickable.
 */
export function ClassPill({ class: cls, hinted = true, href = null }) {
  const info = classInfo(cls);

  // A tab stop, which is the only reach there is: a description hung on a `span` with no role
  // and no focus is read by nothing. It is worth a stop per row — the pill is the one thing on
  // the row whose word an editor may not know, and the label is not the key (ADR 0019).
  //
  // A linked pill has that stop already, from the anchor, so `render` hands the badge's shape
  // to the anchor rather than nesting one inside the other. The hint stays the class's
  // meaning: what the word means is the same sentence whether or not it opens anything, and
  // where it opens something the link's own words say so.
  return (
    <TextHint text={hinted && info.meaning}>
      <Badge
        data-badge="class"
        variant={null}
        data-wears="pill"
        data-tone={info.tone}
        className={cn('h-auto px-1.5 py-0.5 text-xs', href && 'hover:underline')}
        render={href ? <a href={href} aria-label={`Every ${info.label} finding`} /> : undefined}
      >
        {info.label}
      </Badge>
    </TextHint>
  );
}

/**
 * The class filter, wherever it is. The content view narrows a page to a class and
 * the dashboard narrows the page list to the same class, and ticket 36 asks for the
 * **same semantics** in both — so it is one component. Two copies of *narrow to this
 * class* would drift, and the drift would land on the one word an editor reads the
 * affordance by.
 *
 * The count beside each pill is whatever the caller counts — rows on a page, pages
 * on the dashboard — so the caller owns the hint that names the unit.
 */
export function ClassFilterPills({ counts, selected, onToggle, hint }) {
  return (
    /*
     * A `ToggleGroup` and not a row of buttons. The filter is a set — an editor may
     * hold two classes at once — so `toggleMultiple` is on, and the group answers the
     * arrow keys, which a row of separate buttons did not.
     *
     * `onToggle` still takes one class and the caller still owns the array. The group
     * hands back the whole next selection, and the one class that moved is the
     * difference between the two; deriving it here keeps every caller of this
     * component unchanged.
     */
    <ToggleGroup
      toggleMultiple
      value={selected}
      onValueChange={(next) => {
        const moved =
          next.find((cls) => !selected.includes(cls)) ??
          selected.find((cls) => !next.includes(cls));
        if (moved !== undefined) onToggle(moved);
      }}
      className="flex-wrap"
      spacing={1}
    >
      {counts.map(({ class: cls, count }) => (
        <Hint key={cls} text={hint(cls, count)}>
          <ToggleGroupItem
            value={cls}
            className={cn(
              'h-auto gap-1 px-0.5 py-0',
              // The ring is the brand's and stays a class: it is chrome, which says *this
              // filter is on* and makes no claim about a finding, so it is outside the tone
              // product this pill's colour comes from. Nothing is assembled here — the
              // group already holds which classes are pressed, and the class name is a
              // literal Tailwind can see.
              selected.includes(cls) && 'ring-2 ring-primary',
            )}
          >
            <ClassPill class={cls} hinted={false} />
            <span className="pr-1 text-xs text-muted-foreground tabular-nums">{count}</span>
          </ToggleGroupItem>
        </Hint>
      ))}
    </ToggleGroup>
  );
}

/**
 * The tone of each of ticket 83's three priorities.
 *
 * **Not a diff hue.** `lost` and `added` claim that content exists on one side only, and a
 * priority is a human's judgement about a page — so the three take the status weights, the
 * way a stale review does. Amber is the loudest thing here on purpose: `danger` red is the
 * ink of a real absence, and an editor's *look at this first* is not that.
 *
 * The middle rung is `info` and not `closed`. A medium priority is not done, so `closed`
 * would be a false statement; `info` is spent here as the blue rung between the amber and
 * the grey.
 */
const PRIORITY_TONE = { high: 'caution', medium: 'info', low: 'neutral' };

/**
 * The three, in sentence case (ADR 0019).
 *
 * A map and not a `capitalise()` call, for the reason the class labels are a map: what a
 * word looks like on screen is a decision somebody made, and a function would let the next
 * word arrive without one being made.
 *
 * The lower-case words survive in the filter strip's sentence, where *priority high* is
 * mid-sentence and a capital would be the shout this pill just stopped.
 */
const PRIORITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' };

/**
 * One page priority, worn wherever the page is named.
 *
 * @param {object} props
 * @param {string|null} props.priority
 * @param {string} [props.className]
 * @param {boolean} [props.hinted] Off inside the filter, for `ClassPill`'s reason.
 */
export function PriorityPill({ priority, className = '', hinted = true }) {
  if (!priority) return null;

  // A tab stop, per `ClassPill`'s reason.
  return (
    <TextHint text={hinted && `An editor set the priority of this page to ${priority}.`}>
      <Badge
        data-badge="priority"
        variant={null}
        data-wears="pill"
        data-tone={PRIORITY_TONE[priority]}
        className={cn('h-auto px-1.5 py-0.5 text-xs', className)}
      >
        {PRIORITY_LABEL[priority]}
      </Badge>
    </TextHint>
  );
}

/**
 * The priority filter, beside the class pills and narrowing the same list.
 *
 * It is a second component rather than a second call to `ClassFilterPills`, because that
 * one draws a `ClassPill` and takes a count per pill off the snapshot. A priority has no
 * count off the snapshot — it is an annotation in the log — and the two lists must not
 * look like one 25-pill vocabulary.
 *
 * Every one of the three is always drawn, including the ones no page carries. The list is
 * closed and three words long, so a pill that appeared only once a page held it would make
 * the control itself flicker as the log changed underneath it.
 */
export function PriorityFilterPills({ selected, onToggle, counts = {} }) {
  return (
    <ToggleGroup
      toggleMultiple
      value={selected}
      onValueChange={(next) => {
        const moved =
          next.find((one) => !selected.includes(one)) ??
          selected.find((one) => !next.includes(one));
        if (moved !== undefined) onToggle(moved);
      }}
      className="flex-wrap"
      spacing={1}
    >
      {PRIORITIES.map((priority) => (
        <Hint
          key={priority}
          text={
            `Show the pages an editor gave priority ${priority}. ` +
            'The counts above do not change.'
          }
        >
          <ToggleGroupItem
            value={priority}
            className={cn(
              'h-auto gap-1 px-0.5 py-0',
              selected.includes(priority) && 'ring-2 ring-primary',
            )}
          >
            <PriorityPill priority={priority} hinted={false} />
            <span className="pr-1 text-xs text-muted-foreground tabular-nums">
              {counts[priority] ?? 0}
            </span>
          </ToggleGroupItem>
        </Hint>
      ))}
    </ToggleGroup>
  );
}

/**
 * The page scope, worn beside the class pills (ticket 104 part C).
 *
 * A scope narrows what is on screen and moves no bar, no denominator and no count, which is
 * `CONTEXT.md`'s **filter** word for word — so it is drawn as a filter is drawn, rather than
 * left as punctuation inside a text box where nothing on screen says it is on.
 *
 * **It holds no state of its own.** The search box is the source of truth and this is a
 * reading of it: the caller parses the box with `parseTerm()` and hands the scope down, so
 * the two cannot disagree. A copy kept here would be the second source of truth this part
 * exists to avoid.
 *
 * The slash is drawn back on. It is how the scope was typed, it is what an editor would type
 * to get it again, and a chip reading `overkap` over a box reading `/overkap` is one thing
 * spelled two ways.
 *
 * **Neutral, ringed in the primary, and not a badge** (ADR 0019). It was amber to pair with
 * the amber strip that names it, and both ends of that pairing move: amber is left to the
 * three states that are genuinely wrong, and a narrowing an editor chose is not one of them.
 * The ring is the same `ring-primary` a pressed class pill wears, which is the pairing this
 * strip has now — one colour for *a filter is on*, on every control that turns one on.
 *
 * It is a `span` and not a `Badge` because it is a **control** and not a value to be
 * scanned: it holds a button, it is always the same one word, and ADR 0019's four badges
 * are the four things an editor reads off a list. Its shape is the pill's, spelled out.
 */
export function ScopeChip({ scope, onClear }) {
  return (
    <span
      data-scope-chip={scope}
      data-wears="pill"
      data-tone="neutral"
      className="inline-flex h-auto w-fit shrink-0 items-center gap-1 rounded-4xl py-0.5 pr-0.5 pl-1.5 text-xs font-medium ring-2 ring-primary"
    >
      {/* The hint is on the **word** and not on the chip around it, which holds a button of
          its own: a trigger wrapped around a trigger is two hints a reader walks into one
          after the other, and a tab stop on a container is a stop on nothing.

          The slash is on in the hint too. The chip draws `/overkap` and a hint explaining
          `overkap` is the one thing spelled two ways this component exists to avoid. */}
      <TextHint
        text={`The search is narrowed to /${scope} — the pages whose key holds ${scope}. The counts above do not change.`}
      >
        <span>/{scope}</span>
      </TextHint>
      <ScopeClearButton onClear={onClear} />
    </span>
  );
}

/**
 * The × that clears the scope, and the one hint in this file that is not a second sentence.
 *
 * The control is an icon and *×* is not a word, so its name **is** these words — it names the
 * scope and not merely *clear*, because the strip below carries a *Clear filter* that clears
 * more than this one does. So the hint draws that name for a reader who is looking rather than
 * listening, and `announce` is off: a description repeating the name is the name said twice.
 */
function ScopeClearButton({ onClear }) {
  return (
    <Hint text="Clear the page scope" announce={false}>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={onClear}
        aria-label="Clear the page scope"
        // The glyph stays 16 pixels so the chip keeps its shape, and the **target** is
        // grown past it with a pseudo-element — the trick `ui/checkbox.jsx` has used for its
        // own tick since it came in, borrowed here by ticket 03. Growing the button itself
        // would make the chip a different size from the pills it sits beside.
        className="relative size-4 rounded-sm after:absolute after:-inset-1.5 hover:bg-transparent hover:opacity-70"
      >
        <XIcon />
      </Button>
    </Hint>
  );
}

/**
 * The scope, handed over by the row that is about that page (ticket 104 part E).
 *
 * The page-first path: an editor reading the page list gets from *this page* to *what is on
 * this page* with a press, instead of producing `faq/productinformatie` or `(be)pergola` from
 * memory. It is the same journey the suggestion list serves from the other end, and it exists
 * because until now the page list and the search had nothing to say to each other.
 *
 * **A second control and never the row's own meaning.** ADR 0006 keeps the page link opening
 * the whole content view, because the one-sided classes are answered by document order and a
 * row that scoped a search instead would take that away. So this sits beside the link as its
 * own button, wearing a name of its own — a row cannot come to mean two things.
 *
 * The key is the accessible name and not a hint over an icon: the icon says *search* and
 * the question an editor is answering is *inside which page*, which only the key answers. The
 * hint draws that same name, and announces nothing on top of it — `ScopeClearButton`'s rule.
 *
 * @param {object} props
 * @param {string} props.page   The key, exactly as the row draws it.
 * @param {() => void} props.onScope
 * @param {string} [props.className] Spacing belongs to the row: the table cell is a text
 *   flow and wants a margin, the aside is a flex row with a gap of its own.
 */
export function ScopeRowButton({ page, onScope, className = '' }) {
  return (
    <Hint text={`Search inside ${page}`} announce={false}>
      <Button
        variant="ghost"
        size="icon-xs"
        data-scope-row={page}
        onClick={onScope}
        aria-label={`Search inside ${page}`}
        className={cn('align-middle text-muted-foreground hover:text-foreground', className)}
      >
        <SearchIcon />
      </Button>
    </Hint>
  );
}

/**
 * A filter says so for as long as it is on. A narrowed view that looks like the whole
 * thing is read as the whole thing, and the editor stops early — so the strip stays up
 * for as long as the filter is, and it carries the one action that clears it.
 *
 * **Neutral, and the only colour in it is the primary** (ADR 0019). It was amber, which
 * spent the warning colour on a normal state an editor chose — so by the time something
 * was genuinely wrong, amber had stopped meaning it. Amber is now left to the three that
 * are: **Needs attention**, a failed **re-check**, and **read-only**.
 *
 * The primary on *Clear filter* is the same one a pressed class pill and the scope chip
 * wear. The strip and the controls that raise it say one thing in one colour, which is
 * what the amber was reaching for and could not do while it also meant a failure.
 *
 * The sentence does not change. `CONTEXT.md` requires all three kinds of narrowing in one
 * sentence under one *Clear filter*, because what an editor must never misread is an empty
 * list — and that was always the sentence's job rather than the colour's.
 */
export function FilterBanner({ onClear, className = '', children }) {
  return (
    /* `Alert` for the shape and the `neutral` tone worn as a banner. Alert's `destructive`
       variant is refused: a live filter is a status, and `--destructive` is the amber this
       strip has just given up. */
    <Alert
      variant={null}
      data-wears="banner"
      data-tone="neutral"
      className={cn('flex flex-wrap items-center gap-2 text-sm', className)}
    >
      {children}
      <Button variant="outline" size="xs" onClick={onClear} className="border-primary text-primary">
        Clear filter
      </Button>
    </Alert>
  );
}

/**
 * The dashboard's strip, in the one place all three of its screens read it from.
 *
 * The page list, the differences list and a search are three lists narrowed by the same
 * pills, so they say so in the same sentence. Written once because ticket 102 puts the
 * strip over a search as well, and three copies of a sentence are three chances for one
 * of them to describe a filter the other two do not have.
 *
 * `shown` and `total` are counted off the list under the strip and never from elsewhere:
 * a narrowed list beneath an unnarrowed denominator is the mismatched pair ticket 81
 * exists to stop.
 *
 * **No pills, no strip**, and that is decided here rather than at each call site: a strip
 * reading *Filtered on .* over an unfiltered list is the one sentence this component
 * must never be able to say, and a guard repeated by every caller is a guard one of them
 * will eventually forget.
 *
 * Ticket 83 adds a second filter over the same list, so the strip names **both** of them
 * in one sentence and one *Clear filter* clears both. Two strips would be two denominators
 * over one list, and an editor who cleared the one they could see would still be looking at
 * a narrowed list.
 *
 * Ticket 104 part C brings the **page scope** into the same sentence, for the same reason
 * and against the stronger case: a scope narrows the screen further than any pill does, so a
 * strip that enumerated the pills and omitted the scope would be wrong about what is
 * filtering the list under it — worse than no strip. A scope therefore raises the strip on
 * its own, with no pill pressed.
 *
 * **None of the three means no filter**, and the component draws nothing. That is the guard
 * this component keeps rather than each caller, for the reason above.
 *
 * @param {object} props
 * @param {string[]} props.classes  The pills that are on.
 * @param {string[]} [props.priorities]
 * @param {string | null} [props.scope] The page scope, without its slash, or `null`.
 * @param {number} props.shown
 * @param {number} props.total
 * @param {string} props.noun      What is counted: `differences`, `pages`.
 * @param {() => void} props.onClear
 * @param {string} [props.className]
 */
export function ClassFilterBanner({
  classes,
  priorities = [],
  scope = null,
  shown,
  total,
  noun,
  onClear,
  className = '',
}) {
  if (classes.length === 0 && priorities.length === 0 && !scope) return null;

  // Named in the order the controls sit in, and each part only when it is on: *Filtered on
  // priority high.* is the whole sentence when no pill is pressed.
  //
  // The scope carries the word *page* and its slash. Alone, `Filtered on /overkap.` reads
  // as a path and not as a narrowing; beside a class it would read as a second class with
  // odd punctuation. The word is what tells the two kinds apart in one sentence.
  const on = [
    scope && `page /${scope}`,
    classes.length > 0 && classes.map((cls) => classInfo(cls).label).join(', '),
    priorities.length > 0 && `priority ${priorities.join(', ')}`,
  ]
    .filter(Boolean)
    .join(' and ');

  return (
    <FilterBanner onClear={onClear} className={className}>
      {/* `{' '}` before the last sentence and not after the `<strong>`: the banner is a
          flex row with a gap, so the element boundary is already a gap — but the text
          children after it collapse into one anonymous item, and there the space has to
          be written. */}
      <strong>Filtered on {on}.</strong>
      {`${shown} of ${total} ${noun}.`} The counts above do not change.
    </FilterBanner>
  );
}

/**
 * The parity bar. Ticket 09: the `work` classes on this snapshot only, and a class
 * that is not work is not in it at all — a bar that counts what the editor was never
 * asked to look at cannot be read.
 */
export function Bar({ shown, units }) {
  // The unit count is the only honest denominator available before overrides
  // exist: it is how many things the page says.
  const scale = Math.max(units, shown, 1);
  const share = Math.min(1, shown / scale);
  return (
    /*
     * The one thing in this file that stays hand-rolled, and it stays on one reason now.
     * It is **not a progress bar**: it is a 24-pixel sparkline sitting inline in a table
     * cell, with no label and no value.
     *
     * It used to say `Progress` had no prop that reached its indicator either, which ticket
     * 80 made false and ADR 0007 struck. That left the swap reading as impossible when it is
     * only unwanted — a weaker warrant, and the honest one.
     *
     * `severityTone()` stays in JavaScript because it is a threshold with judgement in it,
     * and `palette.test.mjs` pins it. What it answers with is now an attribute rather than
     * a lookup, and the fill shape reads it — including the one inversion in the ramp: with
     * no ink on top, both ambers come from the deep end, so the loud tone runs darker here
     * and the quiet one lighter.
     */
    <span className="inline-flex h-1.5 w-24 overflow-hidden rounded bg-muted align-middle">
      <span
        data-wears="fill"
        data-tone={severityTone(share)}
        className="h-full"
        style={{ width: `${Math.round(share * 100)}%` }}
      />
    </span>
  );
}
