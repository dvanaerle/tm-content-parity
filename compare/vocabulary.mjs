/**
 * The closed class vocabulary, and nothing else.
 *
 * This is the half of the contract that the **browser** reads. `contract.mjs`
 * re-exports it, so a Node consumer still has one import site, but it also holds
 * `findingId()`, which needs `node:crypto` — and a Vite build that reaches
 * `contract.mjs` from an island fails on that import. Ids are made in `compare/`,
 * never in the browser, so the split costs nothing.
 *
 * Ticket 02 fixes the text classes, ticket 05 the link classes, ticket 06 the
 * image classes, ticket 33 the directional text split, ticket 96 the nine head
 * classes. A class **keys nothing** since
 * ADR 0011, but it is still the unit **visibility** is decided on — one enum, triaged once
 * in git, and the only thing that can say *this is not work at all* (ADR 0005). So one
 * class is one such decision: each name must be a name an editor knows, and each new class
 * must say which of the three it is.
 *
 * **A one-sided difference is named by its direction, on every check.** Content
 * production has and the new site lost is `work`. Content the new site invented is
 * `information`, because it is mostly a PageBuilder rebuild and not a defect, and an
 * editor may still want to read it. It is one idea an editor learns once, so the
 * direction is a **field** on the class rather than a rule three names have to
 * remember: `direction` carries it, and the `visibility` follows from it. The tone in
 * `web/src/lib/classes.mjs` reads the same field, so rose cannot come apart from the
 * meaning.
 */

/** @typedef {import('../shared/stores.mjs').Store} Store */

/** @typedef {'production' | 'new'} Side */

/** @typedef {'text' | 'links' | 'images' | 'meta'} Check */

/**
 * What a class is **for**, in one word (ADR 0005, ticket 75). It replaced the `shown`
 * boolean rather than joining it: `shown: false` said two different things and nothing
 * said which, and a boolean beside an enum would let a class be hidden and also be work.
 *
 * - `work` — migration work. It counts: it is the bar's denominator and nothing else is.
 * - `information` — a difference an editor may want to read. It renders and it does not
 *   count. It is a finding you can link to and cannot decide.
 * - `diagnostic` — it tells the author of a rule what the rule saw. It stays behind the
 *   diagnostics control.
 *
 * There is no fourth value for "excluded from comparison". An excluded region leaves at
 * extraction (ADR 0003) and never reaches a class, so a fourth value would claim the log
 * can see inside one.
 *
 * @typedef {'work' | 'information' | 'diagnostic'} Visibility
 */

/** @type {Visibility[]} */
export const VISIBILITIES = ['work', 'information', 'diagnostic'];

/**
 * @typedef {object} FindingClass
 * @property {Check} check
 * @property {Visibility} visibility  What the class is for. The only axis there is.
 * @property {string} label  What an editor reads instead of the key, in sentence case. It
 *                           lives here and not in the web layer because what a class *is*
 *                           does not depend on who draws it (ADR 0019).
 * @property {string} meaning
 * @property {'lost' | 'added'} [direction]  On a one-sided class only. `lost` is always
 *                                           `work`, `added` is always `information`.
 */

/** @type {Record<string, FindingClass>} */
export const FINDING_CLASSES = {
  // Ticket 02 — text
  copy: {
    check: 'text',
    visibility: 'work',
    label: 'Copy changed',
    meaning: 'The text changed. Both sides are present.',
  },
  casing: {
    check: 'text',
    visibility: 'work',
    label: 'Case or punctuation',
    meaning: 'Only letter case or trailing punctuation is different.',
  },
  // Triaged by ticket 75. It is the class that tells *moved* from *gone* (ADR 0006), which
  // is a difference an editor reads and not a report about the rule.
  restructured: {
    check: 'text',
    visibility: 'information',
    label: 'Moved to another element',
    meaning: 'The same content, but a different element on each side.',
  },
  // Triaged by ticket 75. A number that differs is a real content difference worth reading;
  // it is nobody's migration work.
  price: {
    check: 'text',
    visibility: 'information',
    label: 'Numbers differ',
    meaning: 'Only the numbers are different.',
  },
  // Triaged by ticket 75. The finding exists because a promotional pattern matched on both
  // sides — it reports what the rule matched, which is a diagnostic.
  campaign: {
    check: 'text',
    visibility: 'diagnostic',
    label: 'Promotional copy',
    meaning: 'Promotional copy. The pattern must match both sides.',
  },

  // Ticket 116 and ADR 0012 — the same words, divided differently. Production sends a run
  // of blocks that the new site sends as one, and the log used to report a `copy` and a
  // `text-missing` that were both false: no word was edited and no word was lost, only the
  // seams moved. It is `information` for the reason `restructured` is — a difference an
  // editor reads and cannot act on — and it inherits ticket 86's information-row behaviour.
  //
  // The class is the one thing that can be relied on to be **exact**: ADR 0012 fixes the
  // criterion at total coverage and prices every alternative, because a rule that
  // over-detects here moves lost content into a class that is not counted and cannot be
  // decided. That is the silence `CONTEXT.md` is written to prevent.
  //
  // **The ticket asks for the Dutch phrase here and it cannot have it.** Ticket 116's own
  // words are *dezelfde tekst, anders verdeeld* — the editors' phrase for the fold, from
  // seven notes that describe it in prose (*"de content staat een regel erboven"*); none of
  // them says *samengevoegd*, so *merged* would have been the log's word and not theirs.
  // ADR 0014 landed after the ticket was written and the interface speaks English on all six
  // stores, and `meaning` is drawn — `Chips.jsx` puts it on the class pill. So the
  // phrase survives as the **sense** of the label rather than as its letters: what the
  // editors were pointing at is the division, never the merge. That binds what an editor
  // **reads**. Inside the matcher `mergeRuns()` is the right name and stays: the ticket and
  // ADR 0012 use *merge* and *split* for the two directions of the arity, and ticket 120
  // needs the pair.
  regrouped: {
    check: 'text',
    visibility: 'information',
    label: 'Same text, divided differently',
    meaning: 'The same words in both places. Production divides them over more blocks.',
  },

  // Ticket 33 — text, by direction. These replace `structure`.
  'text-missing': {
    check: 'text',
    visibility: 'work',
    direction: 'lost',
    label: 'Text missing',
    meaning: 'Production has the text. The new site does not.',
  },
  // Triaged by ticket 75, and it is the example ADR 0005 argues from: content the new site
  // invented is usually not a defect, and an editor may want to read it.
  'text-added': {
    check: 'text',
    visibility: 'information',
    direction: 'added',
    label: 'Text added',
    meaning: 'The new site has text that production does not have.',
  },

  // Ticket 33 — the same text in a different element. Silent before this ticket.
  // One class covers a level change and a promotion to or from a heading. The
  // class is the unit visibility is decided on, so one decision covers both. That is
  // accepted: both are the same defect to the outline.
  //
  // Re-triaged from `work` by **ticket 86**, 2026-08-13, and it is the first move that was
  // meant to move the denominator: 2,846 findings — 10.00% of the work findings on the 722
  // comparable pages — left the number everybody is measured on. A demoted heading is a
  // heading-hierarchy question, and heading hierarchy is SEO work that the log has always
  // said is somebody else's phase. The evidence is not the volume: of 682 live override
  // events, **zero** sit on a `heading-level` finding. The class has been shown for months
  // and skipped. It is **not deleted**, because that would throw away a real difference
  // nobody has decided about; it renders, it keeps its `detail` and its id, and it counts
  // nowhere. Where heading hierarchy is handled instead: nowhere yet — ticket 117 carries
  // the 14 pages whose `h1` moved, deliberately untriaged.
  'heading-level': {
    check: 'text',
    visibility: 'information',
    label: 'Heading level changed',
    meaning: 'The text is the same, and it is a heading on one side or at another level.',
  },
  // Triaged by ticket 75. The same words in a different element, neither of them a heading:
  // nothing moved for a reader, and what it reports is what the alignment saw.
  'tag-changed': {
    check: 'text',
    visibility: 'diagnostic',
    label: 'Element changed',
    meaning: 'The text is the same, and it sits in a different element. Neither side is a heading.',
  },

  // Ticket 05 — links
  'broken-link': {
    check: 'links',
    visibility: 'work',
    label: 'Broken link',
    meaning: 'The target does not answer. It fires also if production is broken.',
  },
  'missing-link': {
    check: 'links',
    visibility: 'work',
    direction: 'lost',
    label: 'Link missing',
    meaning: 'Production has the link. The new site does not.',
  },
  'link-target': {
    check: 'links',
    visibility: 'work',
    label: 'Link target changed',
    meaning: 'The two sides point at different targets.',
  },
  leakage: {
    check: 'links',
    visibility: 'work',
    label: 'Link to production',
    meaning: 'The new site points at the live domain, and that path exists as a new-site page.',
  },
  'cross-store-link': {
    check: 'links',
    visibility: 'work',
    label: 'Link to another store',
    meaning: 'The link goes to the host of a different store.',
  },
  // Triaged by ticket 75, and it is the other example ADR 0005 argues from: the target
  // answers, so it tells the author of the link rule what the rule saw.
  redirect: {
    check: 'links',
    visibility: 'diagnostic',
    label: 'Link redirects',
    meaning: 'The target answers, after a redirect.',
  },
  // Triaged by ticket 75. The `added` side of the direction rule, the same on all three
  // checks: a link the new site invented is not work, and it is worth reading.
  'extra-link': {
    check: 'links',
    visibility: 'information',
    direction: 'added',
    label: 'Link added',
    meaning: 'The new site has a link that production does not have.',
  },

  // Ticket 06 — images
  'image-missing': {
    check: 'images',
    visibility: 'work',
    direction: 'lost',
    label: 'Image missing',
    meaning: 'Production has the image. The new site does not.',
  },
  'alt-lost': {
    check: 'images',
    visibility: 'work',
    label: 'Alt text lost',
    meaning: 'Production has alt text. The new site has none.',
  },
  'alt-changed': {
    check: 'images',
    visibility: 'work',
    label: 'Alt text changed',
    meaning: 'Both sides have alt text, and it is different.',
  },
  // Triaged by ticket 75. The `added` side of the direction rule, on the images check.
  'image-added': {
    check: 'images',
    visibility: 'information',
    direction: 'added',
    label: 'Image added',
    meaning: 'The new site has an image that production does not have.',
  },
  // Triaged by ticket 75, as `campaign`: it reports a pattern the rule matched.
  'image-campaign': {
    check: 'images',
    visibility: 'diagnostic',
    label: 'Campaign image',
    meaning: 'A campaign image. The pattern matches on either side.',
  },

  // Ticket 54 — the page metadata, not the page. `CONTEXT.md` separates "no NL
  // page" from "no declared alternate": the first says the store has content NL
  // does not have, the second says production does not say which NL page is the
  // counterpart. This is the second, so ticket 75 triaged it `diagnostic` — it is a
  // defect of the sitemap, there is nothing on the page for an editor to read or to
  // change, and what it reports is why the log could not place the page. It is the
  // `meta` check because it is metadata about the page; it reaches the log
  // through the page key and not through the `<head>`.
  'no-declared-alternate': {
    check: 'meta',
    visibility: 'diagnostic',
    label: 'No declared alternate',
    meaning:
      'Production declares no hreflang alternate for this page, so the log cannot put it beside the other stores.',
  },

  // Ticket 96 — the `<head>`, one class per field and per direction. No producer emits
  // these yet; ticket 97 writes it. They arrive first so that the vocabulary is true
  // before anything reads it, and they depend on no crawled field.
  //
  // The four `lost` and `added` classes fire zero times on today's corpus: both sides
  // always send a title and a description. They ship anyway, because a one-sided
  // difference is named by its direction on every check, and a title that disappears
  // after a later content edit is the exact defect this log exists to catch.
  //
  // **None of the nine carries `axis`.** That field is ticket 39's question; ticket 33
  // dropped it on purpose so 39 would still have one, and this ticket hands 39 a wider
  // table rather than an answer.
  //
  // **Seven of them are `work`, and that contradicts `CONTEXT.md` as it stands.** The
  // glossary says a display-only difference "has no id, no override and no place in a
  // bar" and that "the `<head>` panel is made of these", and the Landing entry says
  // *Meta is display only*. Ticket 21 decided the reverse and recorded the price: a head
  // finding is not a body element, so a short page with two of them reads worse than the
  // page bar's arithmetic deserves, and that distortion is accepted as the cost of one
  // counter. The glossary is not edited here, because nothing emits these yet and a
  // glossary that describes an unbuilt screen is worse than one a ticket is about to
  // correct: ticket 98 rewrites both entries when the Meta tab lands. Stated here rather
  // than left for a reader to find, per `docs/agents/domain.md`.
  'meta-title-changed': {
    check: 'meta',
    visibility: 'work',
    label: 'Title changed',
    meaning: 'Both sides have a title, and it is different.',
  },
  'meta-title-lost': {
    check: 'meta',
    visibility: 'work',
    direction: 'lost',
    label: 'Title missing',
    meaning: 'Production has a title. The new site has none.',
  },
  'meta-title-added': {
    check: 'meta',
    visibility: 'information',
    direction: 'added',
    label: 'Title added',
    meaning: 'The new site has a title that production does not have.',
  },
  'meta-description-changed': {
    check: 'meta',
    visibility: 'work',
    label: 'Description changed',
    meaning: 'Both sides have a description, and it is different.',
  },
  'meta-description-lost': {
    check: 'meta',
    visibility: 'work',
    direction: 'lost',
    label: 'Description missing',
    meaning: 'Production has a description. The new site has none.',
  },
  'meta-description-added': {
    check: 'meta',
    visibility: 'information',
    direction: 'added',
    label: 'Description added',
    meaning: 'The new site has a description that production does not have.',
  },
  // A new class, and deliberately **not** the existing `casing`: that one carries
  // `check: 'text'`, so re-using it here would file a head defect under the Inhoud tab.
  // Tier 2 is not folded in the head — folding it would make the `<head>` the one place
  // in the log where a dropped full stop is invisible.
  'meta-casing': {
    check: 'meta',
    visibility: 'work',
    label: 'Head case or punctuation',
    meaning: 'Only letter case or trailing punctuation is different, in a head field.',
  },
  // Robots is measured in both directions, and neither is a `direction` in the contract's
  // sense: both sides send a robots value, so nothing is one-sided. `robots-index-lost`
  // is the worse of the two — the page leaves Google. Rarity is the argument for the
  // pair: three pages carry one on today's corpus, and nobody finds these by eye.
  'robots-index-lost': {
    check: 'meta',
    visibility: 'work',
    label: 'Page leaves the index',
    meaning: 'Production is indexable. The new site is noindex.',
  },
  'robots-noindex-lost': {
    check: 'meta',
    visibility: 'work',
    label: 'Page enters the index',
    meaning: 'Production is noindex. The new site is indexable.',
  },
};

/**
 * The visibility of a class, and the answer for a name the vocabulary does not hold.
 *
 * An unknown class reads as `diagnostic`: it is not work, so it cannot enter a
 * denominator by accident, and it stays behind the diagnostics control where a rule author
 * will find it. That is what `shown ?? false` did before ticket 75, said in one word.
 *
 * @param {string} cls
 * @returns {Visibility}
 */
export const visibilityOf = (cls) => FINDING_CLASSES[cls]?.visibility ?? 'diagnostic';

/**
 * Whether a finding in this class **counts**. It is the one question the bar and the
 * summary ask, and they must both ask it in one place.
 *
 * **The finding-set hash does not ask it.** It did until ticket 118 and ADR 0013: the
 * hash answers *did this page change*, and what the tool counts is not a fact about the
 * page. That is the one place where counting and identity deliberately come apart.
 *
 * @param {string} cls
 */
export const isWork = (cls) => visibilityOf(cls) === 'work';

/** @type {Check[]} */
export const CHECKS = ['text', 'links', 'images', 'meta'];

// `crawl/` needs the same list and cannot import `compare/`, so the list lives
// in `shared/` and this is the re-export the existing readers keep using.
// ADR 0001.
export { STORES } from '../shared/stores.mjs';
