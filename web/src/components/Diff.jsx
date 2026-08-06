import { Fragment, useMemo, useState } from 'react';
import { spansFor, wordDiff } from '../../../compare/worddiff.mjs';
import { SURFACE, TOKEN } from '../lib/palette.mjs';

/**
 * One diff, four surfaces: content rows, link findings, image findings and the
 * `<head>` panel. Ticket 35 makes it one component so the four cannot disagree
 * about what red means — before it, the same production/new pair was rendered in
 * four different idioms and none of them highlighted anything.
 *
 * **Two layers, and they never both fire on one cell.**
 *
 * - *Row level.* Content that exists on one side only tints that whole cell: red
 *   where production has it and the new site does not, green the other way. There
 *   is nothing to diff against, so there is no word layer — striking through a
 *   whole paragraph says the same thing twice and reads as noise.
 * - *Word level.* When both sides have text, the cells stay calm and the changed
 *   **words** carry the colour. This is the layer that lets an editor see
 *   `Verkrijgbaar in de volgende kleuren` become `Beschikbare kleuren` without
 *   reading both strings end to end.
 *
 * Colour is never the only channel: a removed word is a `<del>` and an added one
 * an `<ins>`, so the strike and the underline say it as well.
 */

/**
 * @param {object} props
 * @param {string | null} props.prod       Production's normalised text.
 * @param {string | null} props.new        The new site's normalised text.
 * @param {import('react').ReactNode} [props.prodPrefix]  Rendered before production's text,
 *                                                        for the element tag.
 * @param {import('react').ReactNode} [props.newPrefix]
 * @param {string | null} [props.prodRaw]  The literal string, for the copy button. Absent
 *                                         where there is no raw — a link key has none.
 * @param {string | null} [props.newRaw]
 * @param {boolean} [props.mono]
 * @param {boolean} [props.strong]
 * @param {boolean} [props.equal]  The caller compared the two sides and got equal, on
 *                                 values it does not show. Both cells stay plain.
 * @returns Two `<td>`s, for a caller that owns the `<tr>`.
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
  const spans = useMemo(() => (equal ? null : wordDiff(prod, next)), [prod, next, equal]);
  const oneSided = prod === null || next === null;

  return (
    <>
      <Cell
        side="production"
        value={prod}
        spans={oneSided ? null : spans}
        tint={!equal && next === null ? SURFACE.lost : null}
        prefix={prodPrefix}
        raw={prodRaw}
        mono={mono}
        strong={strong}
      />
      <Cell
        side="new"
        value={next}
        spans={oneSided ? null : spans}
        tint={!equal && prod === null ? SURFACE.added : null}
        prefix={newPrefix}
        raw={newRaw}
        mono={mono}
        strong={strong}
      />
    </>
  );
}

/** @param {{ spans: import('../../../compare/worddiff.mjs').DiffSpan[] | null }} props */
function Cell({ side, value, spans, tint, prefix, raw, mono, strong }) {
  if (value === null || value === '') {
    return <td className="px-2 py-3 align-top text-sm italic text-slate-400">niet aanwezig</td>;
  }

  return (
    <td className={`break-words px-2 py-3 align-top ${tint ?? ''} ${mono ? 'font-mono text-xs' : 'text-sm'}`}>
      {prefix}
      <span className={strong ? 'font-semibold' : undefined}>
        {spans ? <Spans spans={spansFor(spans, side)} /> : value}
      </span>
      {raw !== null && raw !== value && <CopyButton text={raw} />}
    </td>
  );
}

/**
 * A span carries the separators around its words, because the module reconstructs
 * each side exactly. The **highlight** must not: a box drawn around a trailing
 * space is a box that says a space changed. So the edge whitespace is rendered
 * outside the mark and every character still reaches the screen.
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
        <Tag className={`rounded px-0.5 ${TOKEN[tone]}`}>{core}</Tag>
        {after}
      </Fragment>
    );
  });
}

/**
 * The way back to the literal string. The cells render `norm`, and an editor
 * pasting into Magento needs the punctuation production actually shipped —
 * including the curly quote and the non-breaking space that tier 1 folded away.
 *
 * It appears only where `raw` and `norm` differ. Everywhere else the text on
 * screen is already the literal one and the button would be furniture.
 */
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      title={text}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="ml-2 align-middle text-[11px] text-slate-400 hover:text-slate-700"
    >
      {copied ? 'gekopieerd' : 'kopieer letterlijk'}
    </button>
  );
}
