import { Fragment, useMemo, useState } from 'react';
import { isUncompared, spansFor, wordDiff } from '../../../compare/worddiff.mjs';
import { cn } from '../lib/utils.js';
import { Hint } from './Hint.jsx';
import { Button } from './ui/button.jsx';
import { TableCell, TableHead } from './ui/table.jsx';

/**
 * One diff, four surfaces: content rows, link findings, image findings and the
 * `<head>` panel. Ticket 35 makes it one component, so that the four surfaces
 * cannot disagree about the meaning of red. Before this component, the same
 * production/new pair had four different presentations, and no presentation
 * highlighted a change.
 *
 * **Two layers, and only one layer applies to a cell.**
 *
 * - *Row level.* Content that is on one side only tints that whole cell. It is red
 *   if production has the content and the new site does not, and green in the other
 *   direction. There is nothing to diff against, thus there is no word layer. A
 *   strike-through on a whole paragraph gives the same information two times.
 * - *Word level.* If both sides have text, the cells stay plain and the changed
 *   **words** get the colour. This layer shows an editor that `Verkrijgbaar in de
 *   volgende kleuren` became `Beschikbare kleuren`. The editor does not read both
 *   strings from start to end.
 *
 * Colour is not the only indication. A removed word is a `<del>`, and an added word
 * is an `<ins>`. Thus the strike-through and the underline also show the change.
 *
 * **Neither layer holds a colour** (ticket 132). A cell says `data-wears="cell"` and a
 * word says `data-wears="word"`, each with the direction as `data-tone`, and `app.css`
 * decides what that prints. Both shapes are granted to `lost` and `added` there and to no
 * other tone, which is the row layer's claim written as a selector: *this content is
 * missing on the other side*.
 *
 * **A third state, and it is neither layer.** A pair over the rendering budget is
 * **uncompared** (ticket 68, ADR 0009): both versions in full, no word layer, no
 * tint, and a line that says the comparison did not run. It is not a row-level state,
 * because both sides have the content; it is not a word-level state, because no word
 * was compared.
 *
 * **`mono` is for a machine string, and not for prose.** A url, an image path and a
 * `<head>` value are set smaller than Dutch prose so they sit apart from a paragraph.
 */

/**
 * The two sides, named once (ADR 0019).
 *
 * `CONTEXT.md` fixes *Production* and *New site* as the **only** pair of words for the two
 * sides, in sentence case, everywhere — so they are written here and read by every surface
 * that draws a comparison, rather than typed into each table head. Four copies of a pair of
 * words is four chances for one of them to say *New* or *Prod*.
 *
 * The keys are the ones the data uses (`report.sides`, `DiffCells`' own props), so a caller
 * holding one never has to translate.
 *
 * It is exported for the one surface that names the two sides without comparing them: the
 * content view's block counts, which are a fact about each side rather than a pair of texts.
 * Everything that draws a comparison takes the words through `DiffHeads` or `Comparison` and
 * cannot choose to name one side only.
 */
export const SIDES = { production: 'Production', new: 'New site' };

/**
 * The two column heads a table drawing `DiffCells` puts above them.
 *
 * This is where the contract lives for the table form: whatever a caller puts around it, it
 * gets both names or it gets neither, so a table cannot draw a comparison with one side
 * labelled.
 *
 * **Where the caller's own column goes is the caller's** and it is not the same answer
 * everywhere. A finding table leads with the compared content (ADR 0019), so its class head
 * comes *after* this and it passes no child at all. The meta panel's leading cell is a row
 * **header** naming what the two cells beside it hold, and a row header comes first or it
 * heads nothing — so that one passes its head as a child.
 *
 * @param {object} props
 * @param {import('react').ReactNode} [props.children] The head of a leading column, for the
 *   one caller that has one.
 */
export function DiffHeads({ children = null }) {
  return (
    <>
      {children}
      <TableHead>{SIDES.production}</TableHead>
      <TableHead>{SIDES.new}</TableHead>
    </>
  );
}

/**
 * A comparison outside a table: the same two labelled sides, stacked or side by side.
 *
 * It exists because two surfaces drew a comparison as `production → new site` — a repeat
 * row and the floating bulk bar — and **the arrow is not a style choice**. `CONTEXT.md`
 * retires *Changed* because the tool cannot know that one text became another, and an arrow
 * asserts exactly that. Neither surface labelled its sides either, so a reader had to know
 * by convention which half of the line was production.
 *
 * One of the two is left: the bulk bar stopped drawing a comparison at all, because a bar
 * names its object and its scope and never its content (ADR 0019), and the rows it floats
 * over are already drawing the pair. The container query survives that, and it is not
 * theoretical — a repeat row narrows with the list it is in.
 *
 * **A container size query and not a viewport breakpoint** (ADR 0015 permits the size
 * query and refuses the style query; they share a syntax and not a Baseline row). What
 * decides whether the two sides fit beside each other is the width of the box this is *in*
 * — a floating bar 20rem wide on a 27-inch screen, or a full-width row — and a viewport
 * breakpoint would stack the wide one and crush the narrow one. So the same component
 * stacks inside a narrow group and sits side by side in the content view.
 *
 * Both sides wrap: Dutch paragraphs, German compound words, urls and filenames run long,
 * and **nothing here truncates**, so no compared content is permanently hidden.
 *
 * @param {object} props
 * @param {string | null} props.prod  Production's text.
 * @param {string | null} props.new   The new site's text.
 * @param {string} props.language  The language the two texts are in (ticket 125). It is the
 *   store's and not the interface's: the two labels beside them stay English.
 * @param {string} [props.className]
 */
export function Comparison({ prod, new: next, language, className = '' }) {
  // **Spans and not divs, all the way down.** Both callers put this inside phrasing
  // content — a `CollapsibleTrigger`, which is a `<button>`, and the bulk bar's `<p>` — and
  // a `<div>` in either is invalid HTML the parser repairs by closing the ancestor early.
  // These islands are server-rendered and hydrated (`client:load`), so that repair happens
  // to the shipped markup and React then hydrates against a tree it did not write. Grid and
  // block are asked for by class, which a span takes as readily as a div.
  return (
    <span className={cn('@container block', className)}>
      <span className="grid gap-x-4 gap-y-1 @md:grid-cols-2">
        <Side side="production" value={prod} language={language} />
        <Side side="new" value={next} language={language} />
      </span>
    </span>
  );
}

/**
 * `data-side` is a stable name for a thing the interface already draws, in the manner of
 * `data-bucket`: the test then reads the label back without depending on the element or on
 * the class names it wears.
 */
function Side({ side, value, language }) {
  return (
    <span className="block min-w-0">
      <span data-side={side} className="block text-xs text-muted-foreground">
        {SIDES[side]}
      </span>
      {value === null || value === '' ? (
        <span className="text-sm text-muted-foreground italic">not present</span>
      ) : (
        <span lang={language} className="block text-sm break-words">
          {value}
        </span>
      )}
    </span>
  );
}

/**
 * @param {object} props
 * @param {string | null} props.prod       Production's normalised text.
 * @param {string | null} props.new        The new site's normalised text.
 * @param {import('react').ReactNode} [props.prodPrefix]  Rendered before production's text,
 *                                                        for the unit tag.
 * @param {import('react').ReactNode} [props.newPrefix]
 * @param {string | null} [props.prodRaw]  The literal string, for the copy button. Absent
 *                                         where there is no raw — a link key has none.
 * @param {string | null} [props.newRaw]
 * @param {string} props.language  The language the two texts are in (ticket 125), which is
 *                                 the store's. The marks and the controls in the cell
 *                                 beside them are the interface's and stay English.
 * @param {boolean} [props.mono]
 * @param {boolean} [props.strong]
 * @param {boolean} [props.equal]  The caller compared the two sides and got equal, on
 *                                 values it does not show. Both cells stay plain.
 * @param {boolean} [props.tinted] Whether a one-sided pair tints its cell. It is what
 *                                 makes the row layer a statement about **direction** —
 *                                 red where production has the content and green where
 *                                 the new site invented it — and it is switched off by
 *                                 the one caller comparing two **equals**. Two stores of
 *                                 a language block have no reference between them:
 *                                 neither lost anything, they differ, and `lost` and
 *                                 `added` are tones for a class that a block difference
 *                                 does not carry. The word layer is untouched, because
 *                                 it says which words are on which side and not which
 *                                 side is wrong.
 * @returns Two `TableCell`s, for a caller that owns the `TableRow`.
 */
export function DiffCells({
  prod,
  new: next,
  language,
  prodPrefix = null,
  newPrefix = null,
  prodRaw = null,
  newRaw = null,
  mono = false,
  strong = false,
  equal = false,
  tinted = true,
}) {
  // The diff is computed on `norm` and `norm` is what is rendered. Tier 1 folds
  // curly quotes, NBSP, dashes and entities deliberately, so diffing `raw` would
  // paint differences the tool classifies as equal in the same breath.
  //
  // `equal` is the case where the caller cannot hand over what it compared. The
  // meta panel folds the two hostnames out of a canonical before it compares, and
  // then shows the hostnames, because an editor reading a canonical wants them. On
  // 18 of 179 nl pages that is the whole of the difference, and a diff of what is
  // on screen would paint it — the same defect one paragraph up.
  const oneSided = prod === null || next === null;

  // Two identical strings and a string against nothing are the two pairs that need
  // no table (ticket 68). Together they were 78% of the word diff over the whole
  // corpus, and the content view asked for both.
  const spans = useMemo(
    () => (equal || oneSided ? null : wordDiff(prod, next)),
    [prod, next, equal, oneSided],
  );

  const uncompared = isUncompared(spans);

  return (
    <>
      <Cell
        side="production"
        value={prod}
        language={language}
        spans={uncompared ? null : spans}
        tone={tinted && !equal && next === null ? 'lost' : null}
        prefix={prodPrefix}
        raw={prodRaw}
        mono={mono}
        strong={strong}
        note={uncompared ? UNCOMPARED : null}
      />
      <Cell
        side="new"
        value={next}
        language={language}
        spans={uncompared ? null : spans}
        tone={tinted && !equal && prod === null ? 'added' : null}
        prefix={newPrefix}
        raw={newRaw}
        mono={mono}
        strong={strong}
        note={uncompared ? UNCOMPARED : null}
      />
    </>
  );
}

/**
 * What an **uncompared** cell says. It is about the comparison and never about the
 * content: the cap is a size, so a paragraph with five scattered edits and a score of
 * 0.97 reaches it as well as a rewrite does. *Rewritten* is refused for the reason
 * `CONTEXT.md` retires "changed" — the tool cannot know it.
 *
 * The cell holds both versions whole, so *nothing was compared* is the whole of the
 * loss: an editor reads the two texts and does the comparison by eye.
 */
const UNCOMPARED = 'This block is too large for the word comparison. Nothing was compared.';

/**
 * @param {{
 *   spans: import('../../../compare/worddiff.mjs').DiffSpan[] | null,
 *   tone: 'lost' | 'added' | null,
 * }} props  `tone` is the row layer's, and those two words are the whole of it. `app.css`
 *           grants the **cell** shape to `lost` and `added` and to nothing else, so a
 *           status tone written here would print no colour and throw nothing —
 *           `Diff.browser.test.mjs` is what refuses the third word.
 */
function Cell({ side, value, language, spans, tone, prefix, raw, mono, strong, note }) {
  // `TableCell` defaults to `whitespace-nowrap align-middle`, which is right for a
  // dashboard row and wrong for every cell here: these hold a paragraph of Dutch
  // prose or a long url, and both must wrap and both must sit at the top of a row
  // whose other cell may be four times as tall. The three overrides below are
  // layout, and `cn()` resolves each of them against the default in the same group.
  const layout = 'px-2 py-3 align-top whitespace-normal';

  if (value === null || value === '') {
    return (
      <TableCell className={`${layout} text-sm text-muted-foreground italic`}>
        not present
      </TableCell>
    );
  }

  return (
    <TableCell
      data-wears={tone ? 'cell' : null}
      data-tone={tone}
      className={cn(layout, 'break-words', mono ? 'text-xs' : 'text-sm')}
    >
      {prefix}
      {note && <p className="mb-1 text-xs text-muted-foreground italic">{note}</p>}
      {/* The language goes on the text and not on the cell: the prefix above holds the
          unit's tag and a link into the live page, and the note holds a sentence of the
          interface's own — three things that are English on every store. */}
      <span lang={language} className={strong ? 'font-semibold' : ''}>
        {spans ? <Spans spans={spansFor(spans, side)} /> : value}
      </span>
      {raw !== null && raw !== value && <CopyButton text={raw} language={language} />}
    </TableCell>
  );
}

/**
 * A span includes the separators around its words, because the module gives each
 * side exactly. The **highlight** must not include them. A box around a trailing
 * space tells the reader that a space changed. Therefore the whitespace at the two
 * edges is outside the mark, and each character is still on the screen.
 *
 * @param {{ spans: import('../../../compare/worddiff.mjs').DiffSpan[] }} props
 */
function Spans({ spans }) {
  return spans.map((span, index) => {
    if (span.type === 'same') return <Fragment key={index}>{span.text}</Fragment>;

    const [, before, core, after] = span.text.match(/^(\s*)([\s\S]*?)(\s*)$/);
    const removed = span.type === 'removed';
    const Tag = removed ? 'del' : 'ins';
    const tone = removed ? 'lost' : 'added';

    return (
      <Fragment key={index}>
        {before}
        <Tag data-wears="word" data-tone={tone} className="rounded p-1">
          {core}
        </Tag>
        {after}
      </Fragment>
    );
  });
}

/**
 * The way back to the literal string. The cells show `norm`. An editor who pastes
 * into Magento needs the punctuation that production has, and this includes the
 * curly quote and the non-breaking space that tier 1 folded.
 *
 * The button is present only if `raw` and `norm` differ. In all other rows the text
 * on the screen is already the literal string, and the button has no use.
 */
function CopyButton({ text, language }) {
  const [copied, setCopied] = useState(false);

  return (
    <Hint text={text} lang={language}>
      <Button
        variant="ghost"
        size="sm"
        // The hint holds the scraped string, and it is announced in **its own** language —
        // which is why the hint is given `lang` as well as the button: it is drawn and read
        // from the end of the document, where this button's own language cannot reach it. The
        // label below declares the one thing in this button that is English.
        lang={language}
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        className="ml-2 align-middle text-xs text-muted-foreground"
      >
        <span lang="en-GB">{copied ? 'copied' : 'copy the literal text'}</span>
      </Button>
    </Hint>
  );
}
