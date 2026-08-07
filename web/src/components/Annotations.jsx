import { textFragmentUrl } from '../../../compare/locate.mjs';

/**
 * The small marks beside a difference: its tag, what changed, where it is on the
 * page, and how many times it is there.
 *
 * They are here rather than in one of the two tables because the content view and
 * the finding tables both wear them, and two copies of *where is this on the page*
 * would drift apart. Each one renders nothing when it has nothing to say.
 */

/**
 * The element's own tag beside its words. On a `heading-level` row it is the whole
 * finding: the two texts are identical and the tag is what changed.
 */
export const Tag = ({ element }) => (
  element ? <span className="mr-2 font-mono text-[11px] text-slate-400">{element.tag}</span> : null
);

/**
 * Ticket 33. On `heading-level` and `tag-changed` the two text columns are equal,
 * so without this the row reads as a finding about nothing. The content view needs
 * no such thing: it prints the tag of each element next to the words.
 */
export const Detail = ({ finding }) => (
  finding.detail
    ? <span className="ml-2 font-mono text-[11px] text-slate-500">{finding.detail}</span>
    : null
);

/**
 * Ticket 34. A finding reading `hier` or `carports` used to send an editor hunting
 * through the page by eye. This is the section it sits in: the nearest heading
 * before it in document order, which is what the compare stage recorded.
 *
 * With `sides` it also carries the two deep links, for a finding whose own text is
 * not words on the page — a link target and an image key are not there to scroll
 * to. A content row does not pass them, because its own cells carry a link to the
 * exact words, which is closer.
 */
export const Section = ({ anchorHeading, sides = null }) => (
  anchorHeading
    ? (
      <div className="mt-1 flex items-baseline gap-1 text-[11px] text-slate-500">
        <span className="truncate" title={anchorHeading}>onder “{anchorHeading}”</span>
        {sides && <Locate url={sides.production.url} text={anchorHeading} side="productie" />}
        {sides && <Locate url={sides.new.url} text={anchorHeading} side="de nieuwe site" />}
      </div>
    )
    : null
);

/**
 * One rename repeated six times is one finding, and the tick acts on all six. The
 * badge is on every one of those rows, so an editor who ticks the first and watches
 * the other five tick with it learns the rule from the interface (ticket 36).
 */
export const Occurrences = ({ finding }) => (
  finding && finding.occurrences > 1
    ? (
      <span
        className="ml-2 rounded bg-slate-900 px-1.5 text-[11px] text-white"
        title={`Deze bevinding staat ${finding.occurrences} keer op de pagina. Eén vinkje vinkt ze alle ${finding.occurrences} af.`}
      >
        ×{finding.occurrences}
      </span>
    )
    : null
);

/**
 * Opens the live page scrolled to this text, with a `#:~:text=` fragment the
 * browser resolves against what it rendered. That is why it takes the **literal**
 * text and never the normalised one: tier 1 folds curly quotes, NBSP and dashes,
 * and a folded string is not on the page to be found.
 */
export function Locate({ url, text, side }) {
  const href = textFragmentUrl(url, text);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      title={`Open op ${side}, bij deze tekst`}
      className="mr-2 text-[11px] text-slate-400 no-underline hover:text-slate-700"
    >
      ↗
    </a>
  );
}
