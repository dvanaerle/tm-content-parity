import { Attribution } from './Attribution.jsx';
import { Hint, TextHint } from './Hint.jsx';
import { day } from '../lib/dates.mjs';
import { locationUrl } from '../../../compare/locate.mjs';

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
export const Tag = ({ unit }) =>
  unit ? <span className="mr-2 text-xs text-muted-foreground">{unit.tag}</span> : null;

/**
 * Ticket 33. On `heading-level` and `tag-changed` the two text columns are equal,
 * so without this the row reads as a finding about nothing. The content view mostly needs
 * no such thing: it prints the tag of each unit next to the words.
 *
 * **The exception is `regrouped`** (tickets 116 and 120), and it is the one case where
 * counting the tags in the cells is not reading the finding: one cell holds two to four of
 * them and the other one, and the arity is the whole difference. So that row wears this too.
 *
 * It takes the detail and not the finding, because ticket 81 gives it a second
 * caller that is not a finding: `detail` is a term of the repeat grouping key, so a
 * repeat row wears the same mark. A prop named `finding` there would be a lie about
 * the one distinction that ticket keeps.
 */
export const Detail = ({ detail }) =>
  detail ? <span className="ml-2 text-xs text-muted-foreground">{detail}</span> : null;

/**
 * Ticket 34. A finding reading `hier` or `carports` used to send an editor hunting
 * through the page by eye. This says where it is: the section it sits in, and a link
 * per side that opens the live page there.
 *
 * **The section and the links are two separate things, and this used to treat them as
 * one.** The whole block was gated on there being a heading, so the 1,522 rows that sit
 * above their page's first heading lost their links along with their section name —
 * and a finding with no heading is precisely the one an editor cannot find by eye. Now
 * the words render when there is a section to name and each link renders when that side
 * has a location, independently.
 *
 * Each link is aimed with **its own side's** location, which is why `locations` is a
 * pair and not the one string displayed beside it. Both links were once built from the
 * displayed heading, and on a page where the new site reworded that heading the
 * new-site fragment matched nothing: it scrolled nowhere and reported no error, so a
 * dead link looked exactly like a live one. A side the finding is not on has no
 * location at all and offers no link — there is no position there to open.
 *
 * A content row does not use this at all. Its own cells carry a link to the exact words
 * beside them, which is closer than anything a section could offer.
 *
 * **`inHead` is the fourth check's answer to the same question** (ticket 98). A head
 * finding has no `anchorHeading` — the heading order is defined inside the content
 * boundary and the `<head>` is outside it — so without this it would draw the one thing
 * ticket 34 exists to refuse: a difference that does not say where it is. It names the
 * place instead of a heading, and it takes the place of the heading rather than sitting
 * beside it, because a finding is in one of the two and never in both.
 */
export const Section = ({
  anchorHeading,
  locations = null,
  sides = null,
  language,
  inHead = false,
}) => {
  // The **urls** and not the two elements. A `<Locate>` element is truthy whether or not
  // it goes on to render an anchor, so a guard written on the elements never fires — and
  // a report predating `locations` would ship an empty strip with no section and no
  // links in it. That is the shape this component exists to avoid: something on the row
  // that looks like an answer and is not one.
  const production = sides && locationUrl(sides.production.url, locations?.production);
  const next = sides && locationUrl(sides.new.url, locations?.new);
  if (!anchorHeading && !inHead && !production && !next) return null;

  return (
    <div className="mt-1 flex items-baseline gap-1 text-xs text-muted-foreground">
      {inHead ? (
        <span>in the &lt;head&gt;</span>
      ) : (
        anchorHeading && (
          /* *under* is the interface's word and the heading is the page's, so the inner span
             is what declares the language — and what carries the hint with it (ticket 125;
             `Diff.jsx`'s copy button says why the two go together). The hint is given the
             language too: it is the same scraped heading, and it is drawn and announced from
             outside this span, where the `lang` written here cannot reach it (ticket 129).
             It **is** announced, unlike the jump list's copy of the same idea: this span is a
             reading with no name of its own, so the description is the only thing a reader
             who lands on it is given. */
          <span className="truncate">
            under{' '}
            <TextHint text={anchorHeading} lang={language}>
              <span lang={language}>“{anchorHeading}”</span>
            </TextHint>
          </span>
        )
      )}
      <Locate href={production} side="production" />
      <Locate href={next} side="the new site" />
    </div>
  );
};

/**
 * One rename repeated six times is one finding, and the tick acts on all six. The mark
 * is on every one of those rows, so an editor who ticks the first and watches the other
 * five tick with it learns the rule from the interface (ticket 36).
 *
 * It takes the count and the sentence, not the finding, because ticket 81 gives it a
 * second caller that counts a different thing: a repeat sums the occurrences over the
 * pages it is on. The mark is the same mark and the two sentences are not the same
 * sentence, and confusing the two counts is that ticket's named trap — so the caller
 * that knows which count it holds is the caller that writes the words.
 *
 * **Text, and no longer a badge** (ADR 0019). `×3` is a quantity and not a category, and
 * this was the last badge left on the primitive's `default` variant — a solid brand-green
 * ground, which made a repeat count the loudest thing on a row about something else.
 */
export const Occurrences = ({ count, hint }) =>
  count > 1 ? (
    <TextHint text={hint}>
      <span className="ml-2 text-xs text-muted-foreground tabular-nums">×{count}</span>
    </TextHint>
  ) : null;

/**
 * How long the difference has been there (ticket 77).
 *
 * It renders nothing where the run log has no row for the id, which is the ordinary
 * reading on a fresh clone: the index is committed and the reports are not. A guess here
 * would say *first seen today* about a difference that has been on the page all along.
 *
 * It says **first seen** and never *still seen* or *no longer seen*. A finding that is
 * drawn is in the snapshot being drawn, by construction — and the index's own *no longer
 * seen* mark is a fact about a row, not a decision anybody made, so it has no place on a
 * row that is asking an editor for one (ADR 0004).
 */
export const FirstSeen = ({ at }) =>
  at ? (
    <TextHint text="The first run that saw this difference">
      <span className="ml-2 text-xs text-muted-foreground">first seen {day(at)}</span>
    </TextHint>
  ) : null;

/**
 * What closed on this page as this difference appeared (ticket 78).
 *
 * **It is a display-only difference, and the `<head>` panel is the precedent**: like the
 * meta rows, it wears the interface's quietest ink, carries no control of any kind, and
 * reaches no bar, no denominator and no badge. Nothing here is something an editor can
 * complete, so nothing here may look like it.
 *
 * The wording is the whole of the risk. It says what **closed**, and never what changed:
 * *"Changed"* named a finding the tool believed to be an older finding with new text, and
 * the tool cannot know that (ADR 0004). Two ids of one class on one page, one of them last
 * seen in the run before the other appeared, is a coincidence of run and place — so the
 * line reports the coincidence and leaves the reader to judge it.
 *
 * Where several closed at once it counts them instead of naming one. A pick is a match.
 *
 * The reason under it is free text an editor wrote about **other** words, so it can
 * contradict the text on screen. That is the point of showing it, and it is why the visible
 * line says whose difference the decision was — *about it*, not about the words above. The
 * row draws its own `Attribution` a few pixels below, so a lead-in that left the subject to
 * the hint would put two decisions on one row with only a hover to tell them apart.
 *
 * @param {object} props
 * @param {{ count: number, decision: { action: string, editor: string, at: string,
 *   note: string | null } | null }} [props.note]
 */
export const HistoryNote = ({ note }) => {
  if (!note) return null;

  return (
    <TextHint
      text={
        'The run that first saw this difference stopped seeing another one of this class ' +
        'here. It is a decision about that one, not about this one, and no count holds it.'
      }
    >
      <div data-history-note className="mt-1 text-xs text-muted-foreground">
        {note.decision
          ? 'earlier on this page, a difference of this class closed. ' +
            'What an editor decided about it:'
          : `earlier on this page, ${note.count} differences of this class closed, ` +
            'each with a decision of its own'}
        {note.decision && (
          <Attribution
            action={note.decision.action}
            editor={note.decision.editor}
            at={note.decision.at}
            reason={note.decision.note}
          />
        )}
      </div>
    </TextHint>
  );
};

/** What the mark means on a finding: the same difference, several times on this page. */
export const onePageHint = (count) =>
  `This finding is ${count} times on the page. ` + `One tick closes all ${count}.`;

/**
 * The arrow that opens one side's live page at the finding.
 *
 * It takes the **finished url** rather than the pieces to build one, because its two
 * callers reach it differently: a finding row has a location per side, and a content
 * cell has the unit standing next to it. Both build the url with `locationUrl()`, and
 * both must be able to ask *is there a url at all* before they lay anything out — a
 * caller that could only find out by rendering this would draw the frame around an
 * answer that turns out not to exist.
 *
 * Where the url points is `locationUrl()`'s decision: the finding's own words where it
 * has them, the section heading where it does not, the bare page where it has neither.
 * The fragment is matched by the browser against what it **rendered**, which is why a
 * location carries the literal text and never the normalised one: tier 1 folds curly
 * quotes, NBSP and dashes, and a folded string is not on the page to be found.
 */
export function Locate({ href, side }) {
  if (!href) return null;

  return (
    // The hint is the name made visible and says nothing more, so it is not announced a
    // second time: an arrow is not a word, and this sentence is the whole of what the link
    // says. `PageNoteMark` states the same rule from the other side.
    <Hint text={`Open on ${side}, at this text`} announce={false}>
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        aria-label={`Open on ${side}, at this text`}
        // The glyph is a small target and the hit area is not: `inline-flex` with a floor of
        // 24 pixels gives a finger something to land on without making the arrow bigger.
        className="mr-2 inline-flex size-6 items-center justify-center align-middle text-xs text-muted-foreground no-underline hover:text-foreground"
      >
        {/* Hidden from the name it now has, or a screen reader reads the arrow after it. */}
        <span aria-hidden>↗</span>
      </a>
    </Hint>
  );
}
