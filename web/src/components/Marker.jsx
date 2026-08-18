import { ChevronDown, ChevronRight } from 'lucide-react';
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
    <TableRow id={marker.key} className="scroll-mt-4 border-dashed hover:bg-transparent">
      <TableCell colSpan={columns} className="px-2 py-1">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={marker.open}
          className={`flex items-center gap-1 text-xs hover:underline ${CHROME.link}`}
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
