import { ChevronDown, ChevronRight } from 'lucide-react';
import { Hint } from './Hint.jsx';
import { Checkbox } from './ui/checkbox.jsx';
import { Label } from './ui/label.jsx';
import { TableCell, TableRow } from './ui/table.jsx';
import { CHROME } from '../lib/palette.mjs';

/**
 * A run of blocks holding no open work, standing in one row (ticket 79, ADR 0006).
 *
 * It says **how many blocks it holds**, which is the distance between the finding above
 * it and the finding below it, and it gives them back on one click. That is the whole
 * difference from the *Diff* tab ticket 12 retired: the tab deleted the position, and
 * this keeps it. `CONTEXT.md` reserves *fold* to two other meanings, so a run
 * **collapses** and this is a **context marker**.
 *
 * **Two sentences, chosen by `marker.agrees`** (ticket 48, which 79 left the copy to). A
 * run nobody found anything in agrees; a run holding a finding somebody closed says it
 * holds no open work, which is the thing that is true of every row in it. A **mixed**
 * run says the second rather than splitting into two markers: the run is a unit of
 * skipping and not of reading, and two markers where one will do is furniture asking to
 * be counted. *Agreeing* and never *unchanged* — `CONTEXT.md` spends that word on a
 * finding id that survives a re-measure.
 *
 * **No tint.** Once every visible row is a difference the row tint says nothing — which
 * is the specific failure that retired the tab — so the class pill on each row carries
 * the class and no row carries a colour. The marker is quieter still: it is furniture
 * between two findings and it must not read as one.
 *
 * **Two tables draw it** since ticket 04: the content view, where a run is blocks with
 * no open work left on them, and the sibling tab, where a run is blocks two stores of a
 * language block agree about. They differ in how wide the table is and in nothing else,
 * so the width is the prop and the words are not — a second copy of this row is a second
 * place for *agreeing* to drift into *unchanged*.
 *
 * @param {object} props
 * @param {import('../lib/view.mjs').ContextMarker} props.marker
 * @param {number} props.columns  How many columns the marker spans, which is the one
 *                                thing its two tables disagree about.
 * @param {() => void} props.onToggle
 */
export function Marker({ marker, columns, onToggle }) {
  const Chevron = marker.open ? ChevronDown : ChevronRight;
  const noun = marker.blocks === 1 ? 'block' : 'blocks';

  return (
    /* The disclosure is hand-rolled for the reason `Ledger.jsx`'s closed section spells out:
       the trigger is in a cell and what it opens is the run of sibling rows this marker
       stands in for, and a `CollapsibleContent` between a `tbody` and its rows is not a
       table. So the state lives with the table that owns the rows and `aria-expanded` is
       written here. */
    <TableRow id={marker.key} className="scroll-mt-4 border-dashed hover:bg-transparent">
      <TableCell colSpan={columns} className="px-2 py-1">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={marker.open}
          // `min-h-6` and the padding under it: the glyph and the words stay the size
          // they are, and the press becomes something a finger can land on (ticket 03).
          className={`flex min-h-6 items-center gap-1 py-1 text-xs hover:underline ${CHROME.link}`}
        >
          <Chevron className="size-3.5" aria-hidden="true" />
          {marker.agrees
            ? `${marker.blocks} agreeing ${noun}`
            : `${marker.blocks} ${noun} with no open work`}
        </button>
      </TableCell>
    </TableRow>
  );
}

/**
 * The one control over every marker in a table: open all the runs at once.
 *
 * **The same two tables draw it** as draw the marker above, and for the same reason it
 * lives here rather than in each of them. The sentence is shared and only the
 * counterparty differs — the content view's runs agree with **production**, the sibling
 * tab's agree with **the other store of the block** — so that is the prop and the words
 * are not. *Agreeing* here too, and never *unchanged*.
 *
 * Base UI's `Checkbox` hands back the value, not an event. It is drawn only when there is
 * a run to open: a control over nothing is a control that teaches the reader it does
 * nothing, so the caller passes the markers and this decides whether to appear.
 *
 * @param {object} props
 * @param {import('../lib/view.mjs').ContextMarker[]} props.markers
 * @param {boolean} props.allOpen
 * @param {string} props.agreesWith  What the collapsed blocks agree with, named as the
 *                                   reader already reads it: `production` in the content
 *                                   view, the sibling's store id on the sibling tab.
 * @param {(keys: string[]) => void} props.onOpen  Every marker key, or none.
 */
export function MarkerToggle({ markers, allOpen, agreesWith, onOpen }) {
  if (markers.length === 0) return null;

  return (
    <Label className="font-normal text-muted-foreground">
      {/* On the tick and not on the label around it: the label is a plain element, so a hint
          there would be read by nothing and hovered by a mouse only, and the tick is the
          control that already answers to a keyboard (ticket 129). The trigger merges onto it,
          so the press the label passes on is still the tick's own press. */}
      <Hint
        text={`The blocks that agree with ${agreesWith}. They are never removed from this page — this opens all of them at once.`}
      >
        <Checkbox
          checked={allOpen}
          onCheckedChange={(checked) => onOpen(checked ? markers.map((marker) => marker.key) : [])}
        />
      </Hint>
      Show agreeing blocks
    </Label>
  );
}
