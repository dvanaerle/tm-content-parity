import { Fragment, useMemo, useState } from 'react';
import { DiffCells } from './Diff.jsx';
import { Marker, MarkerToggle } from './Marker.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table.jsx';
import { STORE_LANGUAGE, STORE_NAME } from '../lib/stores.mjs';
import { siblingReading } from '../lib/sibling.mjs';
import { collapseRuns, collapseState, toggleIn } from '../lib/view.mjs';

/**
 * The **sibling tab**: this page against the same page in the other store of its
 * language block, in document order (`CONTEXT.md` → *Language blocks*).
 *
 * The block list on the dashboard answers *which page*; this answers *where on it*.
 *
 * **Two readings and not a fifth comparison** (ticket 07). Production's two stores, and
 * the new site's two stores beside them. The first says where the two stores stop
 * agreeing, and the pair of them says the one thing neither says alone: where production
 * varied and the new site does not, the migration **lost a store difference** and one
 * store now shows the other's words — the warranty scope, the delivery area. Both
 * readings name the side they compare, because an editor who cannot tell which side is
 * compared reads a production divergence as a migration defect.
 *
 * **It decides nothing, and that is not a gap.** A block difference is a display-only
 * difference — no id, no override, no place in a bar — so a row here carries no class
 * pill, no finding id and no decision control, and no decision is offered anywhere on
 * this tab. **A flattened row is no exception**: where it produces a defect, that defect
 * is an ordinary axis-A finding on the store that lost its words — 109 of the 111 units
 * measured on 2026-08-21 already are one — and the decision belongs on the tab that
 * shows that finding. The precedent for withholding the control beside four tabs that all
 * carry one is the Meta tab, which has done it since ticket 54.
 *
 * **No row is tinted by direction.** `lost` and `added` are the tones of a class, a
 * block difference carries none, and neither store lost anything: they differ. A
 * flattened row is not tinted either — it carries a **sentence**, because what is worth
 * saying about it is a fact about two sides and no colour says that.
 *
 * **The tool never names the cause.** A store-scoped variable renders no HTML, so
 * `{{customVar code=zonweringUSP}}` is knowledge this log does not have. A row may say
 * that production varied here and the new site does not, and nothing about why.
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
export default function SiblingView({ store, here, hereNew = null, sibling }) {
  /*
   * The reading, worked out **here** and not at build time.
   *
   * A re-check replaces this store's two extracts in `PageView`'s state, and the
   * comparison has to follow them — a reading frozen into the build would go on
   * describing the page as it was crawled while the tab beside it shows the page as it is
   * now.
   *
   * It costs three alignments on open and nothing before it: this component is mounted
   * only while its tab is the selected one, so a reader who never opens the tab never
   * pays for it.
   */
  const reading = useMemo(
    () => siblingReading({ here, hereNew, sibling }),
    [here, hereNew, sibling],
  );

  // A page with no sibling gets no tab at all, and `Ledger.jsx` is where that is decided.
  // This is the same answer said where the reading is, so the component cannot be
  // mounted into a state it has no words for.
  if (!reading) return null;

  /*
   * One language over both columns of both readings (ticket 125), read from this store
   * alone.
   *
   * A block **is** two stores of one language — that is what makes the words comparable
   * and what this tab is for — so asking the sibling would be asking the same question
   * twice. The region differs and the language does not, and `nl-NL` beside `nl-BE` would
   * have one row claiming two languages for text that is in one.
   */
  const language = STORE_LANGUAGE[store];

  return (
    <div className="flex flex-col gap-4">
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
          Both readings compare the two stores against <strong>each other</strong>, on one side at
          a time. Neither store is the reference for the other — they differ, and nothing on this
          tab is decided.
        </p>
        {/* The count is the reason the second reading is here, so it is stated where a
            reader meets it and only where there is some: *0 blocks were flattened* is an
            argument against the sentence it is support for. It says what was seen and
            never why — production varied and the new site does not. */}
        {reading.flattening > 0 && (
          <p>
            <strong>
              {reading.flattening} {reading.flattening === 1 ? 'content unit' : 'content units'}
            </strong>{' '}
            of this page varied between the two stores on production and say one thing on the new
            site: a store difference the migration lost. Each is marked below. Where that is a
            defect it is an ordinary finding on the store that lost its words, and it is decided
            there.
          </p>
        )}
      </div>

      <Reading
        reading={reading.production}
        store={store}
        sibling={reading.sibling.store}
        language={language}
        heading="Production, on both stores"
        agreement={`Nothing differs between these two pages on production. Every block agrees with ${reading.sibling.store}.`}
      />

      {/*
       * The new site's two stores, and it is a **reading** and not a fourth column.
       * Drawn beside production's rather than instead of it: the flattening is a
       * statement about both sides at once, so a reader who cannot see both cannot check
       * it.
       */}
      <Reading
        reading={reading.newSite}
        store={store}
        sibling={reading.sibling.store}
        language={language}
        heading="The new site, on both stores"
        agreement="The two stores say the same thing on the new site, block for block."
      />
    </div>
  );
}

/**
 * One reading: the two stores of the block, on one side.
 *
 * The two readings differ in the units they are given, in the side they name and in
 * whether a row can be flattened. They do not differ in how a run collapses or in what
 * the marker says, so those are here once — a second copy is a second place for
 * *agreeing* to drift into *unchanged*.
 *
 * Each reading holds its **own** open runs. A reader who opens the agreeing blocks of
 * production has not asked to open the new site's, and the two tables are different
 * lengths.
 */
function Reading({ reading, store, sibling, language, heading, agreement }) {
  const [openRuns, setOpenRuns] = useState([]);

  const items = useMemo(
    () => collapseRuns(reading.rows, { open: openRuns }),
    [reading.rows, openRuns],
  );
  const { markers, allOpen, everythingCollapsed } = collapseState(items);

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-medium">{heading}</h3>

      {!reading.measured ? (
        /* The block list's own words for a page nothing was compared on. It must not read
           as agreement, and it must not read as a comparison that broke: nobody looked,
           and that is a different fact from finding nothing. */
        <p className="text-sm text-muted-foreground">
          Not compared: {reading.side} did not answer 200 on both sides, or one side has no content
          units.
        </p>
      ) : (
        <>
          <MarkerToggle
            markers={markers}
            allOpen={allOpen}
            agreesWith={sibling}
            onOpen={setOpenRuns}
          />

          {/* A page whose sibling says the same words is the common case — half of the
              pages in a block are byte-identical — so it is an **answer**, and it is said
              in the marker's own word. Without this the reading is one marker over an
              empty table, which reads as a comparison that failed to run. The marker
              stays below, because the blocks are still there and still worth opening.

              There is no second sentence here, unlike the content view's. That one tells
              a clean page apart from a page an editor finished, and finishing is
              something that happens to findings. Nothing on this tab can be finished. */}
          {everythingCollapsed && <p className="text-sm text-muted-foreground">{agreement}</p>}

          <Rows
            items={items}
            store={store}
            sibling={sibling}
            language={language}
            onToggleRun={(key) => setOpenRuns((held) => toggleIn(held, key))}
          />
        </>
      )}
    </section>
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
function Rows({ items, store, sibling, language, onToggleRun }) {
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
              {item.open &&
                item.rows.map((row) => <Row key={row.key} row={row} language={language} />)}
            </Fragment>
          ) : (
            <Row key={item.key} row={item.row} language={language} />
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
 * neither is a side here: this store and its sibling are two stores of one side. So the
 * reading says `here` and `there`, and the last step hands them to the shared component
 * through the prop names it already has. The mismatch stops at this function — nothing
 * downstream of `DiffCells` reads a direction, which is exactly what `tinted={false}`
 * guarantees.
 *
 * `tinted={false}` is the whole of *not tinted by direction*, and `DiffCells` is
 * otherwise the same component the other four surfaces use — so a block too large for
 * the word comparison is **uncompared** here in the existing word and the existing
 * meaning: both sides in full, neither coloured, and a line saying nothing was compared.
 */
function Row({ row, language }) {
  return (
    <>
      {/* The reason, above the difference it is about, and it is **words and not a
          colour**: the two stores differ here and both new sites say one thing, which is
          a fact about four cells and no tone can carry it. It says nothing about why
          production varied — a store-scoped mechanism renders no HTML — and it is not a
          class: it has no pill, no id, and no place in any bar. */}
      {row.flattened && (
        <TableRow className="border-none hover:bg-transparent">
          <TableCell colSpan={2} className="px-2 pt-2 pb-0 text-xs text-muted-foreground">
            Production varied here and the new site does not: the two stores show the same words
            there.
          </TableCell>
        </TableRow>
      )}
      <TableRow id={row.key} className="scroll-mt-4 align-top">
        <DiffCells
          language={language}
          prod={row.here?.norm ?? null}
          new={row.there?.norm ?? null}
          prodRaw={row.here?.raw ?? null}
          newRaw={row.there?.raw ?? null}
          strong={row.here?.kind === 'heading' || row.there?.kind === 'heading'}
          equal={row.equal}
          tinted={false}
        />
      </TableRow>
    </>
  );
}
