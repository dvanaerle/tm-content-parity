import { Badge } from './ui/badge.jsx';
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
 * The unit's own tag beside its words. On a `heading-level` row it is the whole
 * finding: the two texts are identical and the tag is what changed.
 */
export const Tag = ({ unit }) => (
  unit ? <span className="mr-2 font-mono text-xs text-muted-foreground">{unit.tag}</span> : null
);

/**
 * Ticket 33. On `heading-level` and `tag-changed` the two text columns are equal,
 * so without this the row reads as a finding about nothing. The content view needs
 * no such thing: it prints the tag of each unit next to the words.
 *
 * It takes the detail and not the finding, because ticket 81 gives it a second
 * caller that is not a finding: `detail` is a term of the repeat grouping key, so a
 * repeat row wears the same mark. A prop named `finding` there would be a lie about
 * the one distinction that ticket keeps.
 */
export const Detail = ({ detail }) => (
  detail
    ? <span className="ml-2 font-mono text-xs text-muted-foreground">{detail}</span>
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
      <div className="mt-1 flex items-baseline gap-1 text-xs text-muted-foreground">
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
 *
 * It takes the count and the sentence, not the finding, because ticket 81 gives it a
 * second caller that counts a different thing: a repeat sums the occurrences over the
 * pages it is on. The mark is the same mark and the two sentences are not the same
 * sentence, and confusing the two counts is that ticket's named trap — so the caller
 * that knows which count it holds is the caller that writes the words.
 */
export const Occurrences = ({ count, title }) => (
  count > 1
    ? (
      <Badge className="ml-2" title={title}>×{count}</Badge>
    )
    : null
);

/** What the badge means on a finding: the same difference, several times on this page. */
export const onePageTitle = (count) => `Deze bevinding staat ${count} keer op de pagina. `
  + `Eén vinkje vinkt ze alle ${count} af.`;

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
      className="mr-2 text-xs text-muted-foreground no-underline hover:text-foreground"
    >
      ↗
    </a>
  );
}
