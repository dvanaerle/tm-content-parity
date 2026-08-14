import { classInfo } from '../lib/classes.mjs';
import { PRIORITIES } from '../../../shared/priorities.mjs';
import { cn } from '../lib/utils.js';
import { Alert } from './ui/alert.jsx';
import { Badge } from './ui/badge.jsx';
import { Button } from './ui/button.jsx';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group.jsx';
import { BANNER, FILL, PILL, SOLID, severityTone } from '../lib/palette.mjs';

/*
 * Every chip in this file is a shadcn `Badge` for its shape and a palette token for
 * its colour. Badge's own variants — `default`, `secondary`, `destructive` — are
 * refused on purpose: they read from `--primary` and `--destructive`, and a class tone
 * is not a brand colour and is not a status. `SOLID`, `PILL` and `FILL` are the only
 * things that know what a class means, so they arrive through `className` and win.
 *
 * That is a deliberate breach of shadcn's own guidance that `className` is for layout
 * and never for colour. ADR 0007 outranks it: the palette decides tone.
 */

/**
 * The count row from the won prototype: a number in bold, its label beside it.
 * Ticket 09 requires absolute counts everywhere, because the denominator moves: a
 * corrected difference leaves the snapshot, and a class switched off leaves the count.
 */
export function Chip({ value, label, tone = 'neutral', title, ...props }) {
  return (
    <Badge className={cn('h-auto gap-1.5 px-2 py-1', PILL[tone])} title={title} {...props}>
      <strong className="font-semibold">{value}</strong>
      <span>{label}</span>
    </Badge>
  );
}

/** One finding class, coloured by whether it is work. */
export function ClassPill({ class: cls }) {
  const info = classInfo(cls);
  return (
    <Badge
      className={cn('h-auto px-1.5 py-0.5 text-xs tracking-wide uppercase', info.pill)}
      title={info.meaning}
    >
      {cls}
    </Badge>
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
 * on the dashboard — so the caller owns the tooltip that names the unit.
 */
export function ClassFilterPills({ counts, selected, onToggle, title }) {
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
        <ToggleGroupItem
          key={cls}
          value={cls}
          title={title(cls, count)}
          className={cn(
            'h-auto gap-1 px-0.5 py-0',
            // The ring is the brand's, so it is written as a literal from the same
            // place `CHROME` takes it. Base UI marks the pressed item with
            // `data-pressed`, but the tone is chosen here rather than in a
            // `data-pressed:` prefix, because the prefix would have to be assembled
            // around a palette value at runtime and Tailwind cannot see such a name.
            selected.includes(cls) && 'ring-2 ring-primary',
          )}
        >
          <ClassPill class={cls} />
          <span className="pr-1 text-xs text-muted-foreground tabular-nums">{count}</span>
        </ToggleGroupItem>
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
 */
const PRIORITY_TONE = { high: 'attention', medium: 'info', low: 'neutral' };

/** One page priority, worn wherever the page is named. */
export function PriorityPill({ priority, className = '' }) {
  if (!priority) return null;
  return (
    <Badge
      className={cn(
        'h-auto px-1.5 py-0.5 text-xs tracking-wide uppercase',
        PILL[PRIORITY_TONE[priority]],
        className,
      )}
      title={`An editor set the priority of this page to ${priority}.`}
    >
      {priority}
    </Badge>
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
        <ToggleGroupItem
          key={priority}
          value={priority}
          title={
            `Show the pages an editor gave priority ${priority}. ` +
            'The counts above do not change.'
          }
          className={cn(
            'h-auto gap-1 px-0.5 py-0',
            selected.includes(priority) && 'ring-2 ring-primary',
          )}
        >
          <PriorityPill priority={priority} />
          <span className="pr-1 text-xs text-muted-foreground tabular-nums">
            {counts[priority] ?? 0}
          </span>
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/**
 * A filter says so for as long as it is on. A narrowed view that looks like the whole
 * thing is read as the whole thing, and the editor stops early — so the strip is amber
 * and it carries the one action that clears it.
 */
export function FilterBanner({ onClear, className = '', children }) {
  return (
    /* `Alert` for the shape and `BANNER.attention` for the tone. Alert's `destructive`
       variant is refused for the reason above: a live filter is a status, and status
       never wears a diff hue. `border-current` on the button keeps the outline in the
       banner's own ink rather than the interface's border grey. */
    <Alert className={cn('flex flex-wrap items-center gap-2 text-sm', BANNER.attention, className)}>
      {children}
      <Button
        variant="outline"
        size="xs"
        onClick={onClear}
        className="border-current bg-transparent"
      >
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
 * @param {object} props
 * @param {string[]} props.classes  The pills that are on. None of either means no filter,
 *                                 and the component draws nothing.
 * @param {string[]} [props.priorities]
 * @param {number} props.shown
 * @param {number} props.total
 * @param {string} props.noun      What is counted: `differences`, `pages`.
 * @param {() => void} props.onClear
 * @param {string} [props.className]
 */
export function ClassFilterBanner({
  classes,
  priorities = [],
  shown,
  total,
  noun,
  onClear,
  className = '',
}) {
  if (classes.length === 0 && priorities.length === 0) return null;

  // Named in the order the controls sit in, and each half only when it is on: *Filtered on
  // priority high.* is the whole sentence when no pill is pressed.
  const on = [
    classes.length > 0 && classes.join(', '),
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
      {`${shown} of ${total} ${noun}.`} The counts above count everything.
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
     * The one thing in this file that stays hand-rolled, and the reason is the palette
     * again. shadcn's `Progress` composes its own track and indicator internally and
     * paints the indicator `bg-primary`; the fill here is `FILL[severityTone(share)]`,
     * chosen per row, and there is no prop that reaches the indicator. Wrapping the
     * palette class in a descendant selector would build the class name at runtime,
     * which Tailwind cannot see. It is also not a progress bar: it is a 24-pixel
     * sparkline sitting inline in a table cell, with no label and no value.
     */
    <span className="inline-flex h-1.5 w-24 overflow-hidden rounded bg-muted align-middle">
      <span
        className={`h-full ${FILL[severityTone(share)]}`}
        style={{ width: `${Math.round(share * 100)}%` }}
      />
    </span>
  );
}
