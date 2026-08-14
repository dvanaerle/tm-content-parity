import { Fragment, useMemo, useState } from 'react';
import { isUncompared, spansFor, wordDiff } from '../../../compare/worddiff.mjs';
import { cn } from '../lib/utils.js';
import { Button } from './ui/button.jsx';
import { TableCell } from './ui/table.jsx';
import { SURFACE, TOKEN } from '../lib/palette.mjs';

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
 * **A third state, and it is neither layer.** A pair over the rendering budget is
 * **uncompared** (ticket 68, ADR 0009): both versions in full, no word layer, no
 * tint, and a line that says the comparison did not run. It is not a row-level state,
 * because both sides have the content; it is not a word-level state, because no word
 * was compared.
 *
 * **`mono` is for a machine string, and not for prose.** A url, an image path and a
 * `<head>` value align character by character, and an editor reads them for the one
 * character that changed. A content cell holds Dutch prose. On a long paragraph,
 * `font-mono text-xs` costs more legibility than the alignment returns, and the word
 * layer already shows which words changed.
 */

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
 * @param {boolean} [props.mono]
 * @param {boolean} [props.strong]
 * @param {boolean} [props.equal]  The caller compared the two sides and got equal, on
 *                                 values it does not show. Both cells stay plain.
 * @returns Two `TableCell`s, for a caller that owns the `TableRow`.
 */
export function DiffCells({
  prod,
  new: next,
  prodPrefix = null,
  newPrefix = null,
  prodRaw = null,
  newRaw = null,
  mono = false,
  strong = false,
  equal = false,
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
        spans={uncompared ? null : spans}
        tint={!equal && next === null ? SURFACE.lost : null}
        prefix={prodPrefix}
        raw={prodRaw}
        mono={mono}
        strong={strong}
        note={uncompared ? UNCOMPARED : null}
      />
      <Cell
        side="new"
        value={next}
        spans={uncompared ? null : spans}
        tint={!equal && prod === null ? SURFACE.added : null}
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

/** @param {{ spans: import('../../../compare/worddiff.mjs').DiffSpan[] | null }} props */
function Cell({ side, value, spans, tint, prefix, raw, mono, strong, note }) {
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
    <TableCell className={cn(layout, 'break-words', tint, mono ? 'font-mono text-xs' : 'text-sm')}>
      {prefix}
      {note && <p className="mb-1 text-xs text-muted-foreground italic">{note}</p>}
      <span className={strong ? 'font-semibold' : ''}>
        {spans ? <Spans spans={spansFor(spans, side)} /> : value}
      </span>
      {raw !== null && raw !== value && <CopyButton text={raw} />}
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
    const Tag = span.type === 'removed' ? 'del' : 'ins';
    const tone = span.type === 'removed' ? 'lost' : 'added';

    return (
      <Fragment key={index}>
        {before}
        <Tag className={`rounded p-1 ${TOKEN[tone]}`}>{core}</Tag>
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
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  return (
    <Button
      variant="ghost"
      size="xs"
      title={text}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="ml-2 align-middle text-xs text-muted-foreground"
    >
      {copied ? 'copied' : 'copy the literal text'}
    </Button>
  );
}
