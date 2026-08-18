import { Fragment, useMemo, useState } from 'react';
import { DiffCells } from './Diff.jsx';
import { Marker, MarkerToggle } from './Marker.jsx';
import { Table, TableBody, TableHead, TableHeader, TableRow } from './ui/table.jsx';
import { STORE_NAME } from '../lib/stores.mjs';
import { siblingReading } from '../lib/sibling.mjs';
import { collapseRuns, collapseState, toggleIn } from '../lib/view.mjs';

/**
 * The **sibling tab**: this page against the same page in the other store of its
 * language block, in document order (`CONTEXT.md` → *Language blocks*).
 *
 * The block list on the dashboard answers *which page*; this answers *where on it*. It
 * is the same reading one step down, and it compares **production** on both sides for
 * the same reason: a difference between two stores is not a defect on the new site, and
 * an editor who cannot tell which side is compared reads it as one.
 *
 * **It decides nothing, and that is not a gap.** A block difference is a display-only
 * difference — no id, no override, no place in a bar — so a row here carries no class
 * pill, no finding id and no decision control, and no decision is offered anywhere on
 * this tab. A decision that crosses a block is a decision about an axis-A **finding**,
 * and it belongs on the tab that shows that finding. The precedent for withholding the
 * control beside four tabs that all carry one is the Meta tab, which has done it since
 * ticket 54.
 *
 * **No row is tinted by direction.** `lost` and `added` are the tones of a class, a
 * block difference carries none, and neither store lost anything: they differ. The word
 * layer stays, because it says which words are on which side and not which side is
 * wrong.
 *
 * **This is not a fifth check.** `Check` is the closed family `text | links | images |
 * meta` and it does not grow. Nothing here has a finding id, so no link can name a row
 * on this tab and no landing can open it — which is `landingFor()`'s answer, because it
 * resolves a tab from a finding's check and this tab is not one, and not a rule restated
 * here.
 *
 * What is on screen is `siblingReading()`'s decision and `collapseRuns()`'s, both of
 * them pure and tested. This file chooses markup and tone and nothing else.
 */
export default function SiblingView({ store, here, sibling }) {
  const [openRuns, setOpenRuns] = useState([]);

  /*
   * The reading, worked out **here** and not at build time.
   *
   * A re-check replaces this store's production extract in `PageView`'s state, and the
   * comparison has to follow it — a reading frozen into the build would go on describing
   * the page as it was crawled while the tab beside it shows the page as it is now.
   *
   * It costs an alignment on open and nothing before it: this component is mounted only
   * while its tab is the selected one, so a reader who never opens the tab never pays
   * for it.
   */
  const reading = useMemo(() => siblingReading({ here, sibling }), [here, sibling]);

  const items = useMemo(
    () => collapseRuns(reading?.rows ?? [], { open: openRuns }),
    [reading, openRuns],
  );
  const { markers, allOpen, everythingCollapsed } = collapseState(items);

  // A page with no sibling gets no tab at all, and `Ledger.jsx` is where that is decided.
  // This is the same answer said where the reading is, so the component cannot be
  // mounted into a state it has no words for.
  if (!reading) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-1 text-sm text-muted-foreground">
        <p>
          This page against <code>{reading.sibling.page}</code> on{' '}
          <strong>{reading.sibling.store}</strong>, its sibling page in the {STORE_NAME[store]} and{' '}
          {STORE_NAME[reading.sibling.store]} language block.{' '}
          {/* The rule that matched, carried through rather than restated. It is data, so
              a wrong pairing can be diagnosed on the screen that drew it. */}
          Matched by {reading.sibling.rule}.
        </p>
        <p>
          It compares <strong>{reading.side}</strong> on both sides, which is the reference side: a
          difference here is a difference between the two stores, and not a defect on the new site.
          Neither store is the reference for the other — they differ, and nothing on this tab is
          decided.
        </p>
      </div>

      {!reading.measured ? (
        /* The block list's own words for a page nothing was compared on. It must not read
           as agreement, and it must not read as a comparison that broke: nobody looked,
           and that is a different fact from finding nothing. */
        <p className="text-sm text-muted-foreground">
          Not compared: production did not answer 200 on both sides, or one side has no content
          units.
        </p>
      ) : (
        <>
          <MarkerToggle
            markers={markers}
            allOpen={allOpen}
            agreesWith={reading.sibling.store}
            onOpen={setOpenRuns}
          />

          {/* A page whose sibling says the same words is the common case — half of the
              pages in a block are byte-identical — so it is an **answer**, and it is said
              in the marker's own word. Without this the tab is one marker over an empty
              table, which reads as a comparison that failed to run. The marker stays
              below, because the blocks are still there and still worth opening.

              There is no second sentence here, unlike the content view's. That one tells
              a clean page apart from a page an editor finished, and finishing is
              something that happens to findings. Nothing on this tab can be finished. */}

          {everythingCollapsed && (
            <p className="text-sm text-muted-foreground">
              Nothing differs between these two pages. Every block agrees with{' '}
              {reading.sibling.store}.
            </p>
          )}

          <Rows
            items={items}
            store={store}
            sibling={reading.sibling.store}
            onToggleRun={(key) => setOpenRuns((held) => toggleIn(held, key))}
          />
        </>
      )}
    </div>
  );
}

/**
 * Two columns, one per store, and no third.
 *
 * The content view keeps a status column for the class pill and the decision control.
 * This tab has neither, so it has no status column: an empty column of furniture on
 * every row would be the tab asking to be read as one of the four beside it.
 *
 * `table-fixed min-w-3xl` for the reason `ContentView.jsx` gives: an auto layout lets
 * the two prose columns change width from row to row, and a diff whose columns move is a
 * diff a reader cannot scan.
 */
function Rows({ items, store, sibling, onToggleRun }) {
  return (
    <Table className="min-w-3xl table-fixed">
      <TableHeader className="[&_th]:text-xs [&_th]:tracking-wide [&_th]:text-muted-foreground [&_th]:uppercase">
        <TableRow>
          {/* The store id is the label everywhere in this log, and the name explains it
              once. Neither head says *source of truth*: the two stores are equals, and a
              column that claimed one of them was would say the other is wrong. */}
          <TableHead>
            {store} <span className="normal-case opacity-70">— {STORE_NAME[store]}</span>
          </TableHead>
          <TableHead>
            {sibling} <span className="normal-case opacity-70">— {STORE_NAME[sibling]}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) =>
          item.kind === 'marker' ? (
            <Fragment key={item.key}>
              <Marker marker={item} columns={2} onToggle={() => onToggleRun(item.key)} />
              {item.open && item.rows.map((row) => <Row key={row.key} row={row} />)}
            </Fragment>
          ) : (
            <Row key={item.key} row={item.row} />
          ),
        )}
      </TableBody>
    </Table>
  );
}

/**
 * One block, the two stores side by side.
 *
 * The row carries its anchor and nothing else — no class pill, no finding id, no
 * occurrence count and no control. `b<n>` and `s<n>` are `siblingReading()`'s scheme, and
 * they are deliberately neither `p<n>`/`n<n>` nor `finding-<digest>`: a link naming a
 * finding must not open this tab, and there is nothing here for one to name.
 *
 * **`prod` and `new` are `DiffCells`' props and not this tab's words.** `CONTEXT.md`
 * keeps *production* and *the new site* as the only pair of names for the two sides, and
 * neither is a side here: this store and its sibling are two productions. So the reading
 * says `here` and `there`, and the last step hands them to the shared component through
 * the prop names it already has. The mismatch stops at this function — nothing downstream
 * of `DiffCells` reads a direction, which is exactly what `tinted={false}` guarantees.
 * Widening `DiffCells` to side-neutral names would touch all four surfaces that use it,
 * and it is the direction to go if a second two-equals tab ever appears.
 *
 * `tinted={false}` is the whole of *not tinted by direction*, and `DiffCells` is
 * otherwise the same component the other four surfaces use — so a block too large for
 * the word comparison is **uncompared** here in the existing word and the existing
 * meaning: both sides in full, neither coloured, and a line saying nothing was compared.
 */
function Row({ row }) {
  return (
    <TableRow id={row.key} className="scroll-mt-4 align-top">
      <DiffCells
        prod={row.here?.norm ?? null}
        new={row.there?.norm ?? null}
        prodRaw={row.here?.raw ?? null}
        newRaw={row.there?.raw ?? null}
        strong={row.here?.kind === 'heading' || row.there?.kind === 'heading'}
        equal={row.equal}
        tinted={false}
      />
    </TableRow>
  );
}
