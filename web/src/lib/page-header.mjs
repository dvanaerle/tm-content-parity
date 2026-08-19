/**
 * What the page header offers, as a value (ui-polish ticket 08).
 *
 * The header used to work this out in several places at once: whether there is a review
 * and whether it went stale, whether there is a priority and a note, whether the log can
 * be written to, whether a name has been given, whether the local re-check service
 * answers. Each reading was made where it was drawn, so *what may an editor do to this
 * page right now* could not be asked without rendering a page — and the quiet line and the
 * menu that followed would each have re-derived all of it.
 *
 * It is the same seam shape as `explainScope()` in the search and `blockReading()` in the
 * block panel, and it exists for the same stated reason: a reading with four inputs and
 * four ways to be told no is a value, and JSX is where a value is drawn and never where it
 * is decided. Nothing here renders and nothing here is imported from a component.
 */

/**
 * One thing the quiet line says. The line is the parts it has, so a page nobody has
 * annotated or reviewed is a **shorter line** and never three empty slots.
 *
 * The priority carries its word because it is the one badge ADR 0019 allows here; the
 * other two are text, so they carry only what they are.
 *
 * @typedef {{ kind: 'priority', priority: string }
 *   | { kind: 'note' }
 *   | { kind: 'review', editor: string, at: string, fresh: boolean }} LinePart
 */

/**
 * Whether the header offers one action.
 *
 * Three answers and not two, and the difference is the whole of why this module exists.
 * **Absent** is *there is nothing here to offer*: a re-check with no local service behind
 * it, a *Mark page reviewed* on a page already reviewed. **Refused** is *this is offered
 * and you cannot have it right now*, and it carries the sentence that says why — so the
 * interface can tell an editor what the state is instead of quietly dropping a control and
 * leaving them to wonder where it went.
 *
 * @typedef {{ state: 'offered' } | { state: 'absent' } | { state: 'refused', reason: string }} Offer
 */

/**
 * Every action the header offers, named. A bag keyed by `string` would take
 * `actions.markAgian` without complaint, and these seven names are read in three files.
 *
 * @typedef {object} HeaderActions
 * @property {Offer} recheck        Crawls the two live pages again.
 * @property {Offer} copyLink       This page's address on the clipboard.
 * @property {Offer} markReviewed   A human looked at this whole page.
 * @property {Offer} editDetails    Opens the dialog. A read, so never refused.
 * @property {Offer} annotate       The priority and the note, which are refused together.
 * @property {Offer} clearReview    Withdraws the review.
 * @property {Offer} markAgain      Reviews a page whose findings changed since the last one.
 */

/** @type {Offer} */
const OFFERED = { state: 'offered' };

/** @type {Offer} */
const ABSENT = { state: 'absent' };

/**
 * The reading of one page's header.
 *
 * @param {object} page
 * @param {{ editor: string, at: string, fresh: boolean } | null} page.review
 *   `derivePageState()`'s review. `fresh: false` is *changed since review*.
 * @param {{ priority: string | null, note: string | null }} page.annotations
 * @param {string | null} page.notWritingReason
 *   `whyNotWriting()`'s sentence, or `null` when the log can be written to. It is the
 *   **one** input for the four not-writing states, because that function's `null` is
 *   exactly `canWrite` — a second flag beside it could only ever disagree with it.
 * @param {boolean} page.recheckAvailable  Whether the local re-check service answers.
 * @returns {{ line: LinePart[], actions: HeaderActions, refusal: string | null }}
 *   `refusal` is the one sentence every refusal here carries, so a surface drawing several
 *   refused controls can say it once instead of finding it by scanning the actions for one.
 */
export function headerReading({ review, annotations, notWritingReason, recheckAvailable }) {
  /** A write the log will not take is refused with the log's own sentence for it. */
  const write = () => (notWritingReason ? { state: 'refused', reason: notWritingReason } : OFFERED);

  return {
    line: linePartsOf(review, annotations),
    refusal: notWritingReason,
    actions: {
      /* Feature detection and never permission: the service is absent on the webhost, and
         PRD story 28 keeps this one visible wherever it exists because it is the action
         with a real cost. It writes no override, so a read-only log does not touch it. */
      recheck: recheckAvailable ? OFFERED : ABSENT,

      /* One press and no form, so it stays in the menu rather than going behind the
         dialog — and it is absent rather than refused once the review exists, because a
         page cannot be reviewed twice. */
      markReviewed: review ? ABSENT : write(),

      /* The deep link has been shipped since ticket 109 and no control has ever offered
         it. It is the one item that is never absent and never refused: the address of this
         page is known without asking the log anything. */
      copyLink: OFFERED,

      /* The priority and the note, which are refused together because they are the same
         write to the same log by the same name. Two entries here would be two derivations
         that could only ever agree. */
      annotate: write(),

      /* Opening the dialog is a read, so it is never refused. A page's note is worth
         reading by an editor who cannot write one, and this pass's standing rule is that a
         fact may be relocated and never removed — a refusal here would remove it. What
         cannot happen on a read-only log is the saving, and `annotate` says so. */
      editDetails: OFFERED,

      /* The review is **read** on the quiet line and **acted on** here, beside the
         annotations it sits with. Both are absent where there is no review to act on. */
      clearReview: review ? write() : ABSENT,
      markAgain: review && !review.fresh ? write() : ABSENT,
    },
  };
}

/**
 * The line, in the order the header reads it: what an editor decided about this page
 * before what the log recorded about it.
 *
 * @param {{ editor: string, at: string, fresh: boolean } | null} review
 * @param {{ priority: string | null, note: string | null }} annotations
 * @returns {LinePart[]}
 */
function linePartsOf(review, annotations) {
  /** @type {LinePart[]} */
  const parts = [];
  if (annotations.priority) parts.push({ kind: 'priority', priority: annotations.priority });
  // That there **is** one, and never what it says. A note has no length limit, and the
  // header is not where a paragraph gets to set the width of the page.
  if (annotations.note) parts.push({ kind: 'note' });
  if (review) parts.push({ kind: 'review', ...review });
  return parts;
}
