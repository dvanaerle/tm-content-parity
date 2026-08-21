import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { userEvent } from '@vitest/browser/context';
import { afterEach, describe, expect, it } from 'vitest';
import Ledger from './Ledger.jsx';

/**
 * The three buckets, on the ledger (ticket 80).
 *
 * It is a browser test for the reason `Repeats.browser.test.mjs` gives: the grouping is
 * pure and tested in `overrides/state.mjs`, and what is left to prove is that the words
 * an editor reads come off that derivation and that Closed is reachable without being
 * the first thing on screen. Neither question can be asked of a `.mjs`.
 */

/** A derived finding, as `derivePageState()` hands one over. */
const finding = (id, state, extra = {}) => ({
  id,
  store: 'nl',
  page: 'overkappingen',
  check: 'links',
  class: 'link-target',
  state,
  visibility: 'work',
  prod: '/overkappingen/',
  new: '/overkapping/',
  detail: null,
  anchorHeading: null,
  locations: null,
  occurrences: 1,
  score: null,
  override:
    state === 'open'
      ? null
      : { action: 'fixed', editor: 'Danielle', at: '2026-08-14T12:00:00.000Z', note: null },
  ...extra,
});

/** Two open, one contradicted and one closed, so each bucket has a number of its own. */
const FOUR = [
  finding('a', 'open'),
  finding('b', 'open'),
  finding('c', 'contradicted'),
  finding('d', 'fixed'),
];

/**
 * The two heads the Meta panel is drawn from (ticket 98).
 *
 * They are on the shared fixture rather than passed in by the tests that open the tab,
 * because `metaRows()` reads `sides.*.meta` unconditionally: a report without one is not
 * a report with an empty head, it is a crash on the fourth tab.
 *
 * Between them they make one row of each kind the panel has to draw: a changed title, a
 * lost keywords field, a description that dropped only its full stop, a page leaving the
 * index, and a canonical that differs by hostname alone and is therefore no difference.
 */
const PROD_META = {
  title: 'Bedrijfsinformatie',
  description: 'Beschutting op maat.',
  keywords: 'terrasoverkapping, veranda',
  canonical: 'https://www.tuinmaximaal.nl/overkappingen',
  robots: null,
  noindex: false,
  h1: null,
};

const NEW_META = {
  ...PROD_META,
  title: 'Bedrijfsinformatie | Tuinmaximaal',
  description: 'Beschutting op maat',
  keywords: null,
  canonical: 'https://new.tuinmaximaal.nl/overkappingen',
  noindex: true,
};

/** The three findings `compareMeta()` makes out of the two heads above. */
const HEAD = [
  finding('t', 'open', {
    check: 'meta',
    class: 'meta-title-changed',
    prod: PROD_META.title,
    new: NEW_META.title,
  }),
  finding('d', 'open', {
    check: 'meta',
    class: 'meta-casing',
    prod: PROD_META.description,
    new: NEW_META.description,
  }),
  finding('r', 'open', {
    check: 'meta',
    class: 'robots-index-lost',
    prod: 'index',
    new: 'noindex',
  }),
];

const report = {
  store: 'nl',
  page: 'overkappingen',
  comparable: true,
  skipReason: null,
  rows: [],
  // `elements` is the side's own block list, which the content view counts at the head of
  // the table it draws them in (ADR 0019). Empty here: these tests are about the finding
  // tables, and the Text tab's rows are built from `rows` above.
  sides: {
    production: {
      url: 'https://www.tuinmaximaal.nl/overkappingen',
      units: 4,
      elements: [],
      meta: PROD_META,
    },
    new: {
      url: 'https://new.tuinmaximaal.nl/overkappingen',
      units: 4,
      elements: [],
      meta: NEW_META,
    },
  },
};

function mount(props = {}) {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  act(() =>
    root.render(
      createElement(Ledger, {
        report,
        findings: FOUR,
        append: async () => true,
        canWrite: true,
        observationId: '2026-08-14T10:00:00.000Z-aaaaaaaa',
        settled: true,
        ...props,
      }),
    ),
  );
  return () => act(() => root.unmount());
}

/** The strip's three items, read as `{ 'needs-attention': '1', … }`. */
const strip = () =>
  Object.fromEntries(
    [...document.querySelectorAll('[data-bucket]')].map((element) => [
      element.dataset.bucket,
      element.textContent,
    ]),
  );

afterEach(() => {
  history.replaceState(null, '', location.pathname);
  document.body.innerHTML = '';
});

/** The finding ids the Links table currently draws a row for, in order. */
const rows = () =>
  [...document.querySelectorAll('tbody tr[id^="finding-"]')].map((row) =>
    row.id.replace('finding-', ''),
  );

/** The words on the tab strip, in order. A badge is read as part of its trigger, so a name
    with no number after it is a tab carrying no badge. */
const tabs = () =>
  [...document.querySelectorAll('[role="tab"]')].map((one) => one.textContent.trim());

/** A button whose words start with `words`, which is how the disclosure is found. */
const button = (words) =>
  [...document.querySelectorAll('button')].find((element) =>
    element.textContent.trim().startsWith(words),
  );

describe('a decided finding says who decided it, and when', () => {
  /**
   * One shape for every attribution (ticket 01): the action, the editor and the day on one
   * line. Two of the three shapes this replaced had a date to draw and drew neither, so an
   * editor could not tell a judgement made this morning from one made in June.
   */
  it('reads as the action, the editor and the day', async () => {
    const unmount = mount();
    await userEvent.click(button('Links'));
    await userEvent.click(button('Closed'));

    expect(document.body.textContent).toContain('fixed · Danielle · 14 Aug 2026');
    unmount();
  });

  // The contradiction is the one state that stays loud, and it stays a sentence naming the
  // person whose claim the reader is about to overturn (ADR 0019).
  it('names the person whose claim a re-check contradicted', async () => {
    const unmount = mount();
    await userEvent.click(button('Links'));

    expect(document.body.textContent).toContain(
      'claimed fixed, still differs · Danielle · 14 Aug 2026',
    );
    unmount();
  });

  /**
   * The two ticked states of the fix checkbox, read off the tone each one publishes.
   *
   * Since ticket 133 part B that tone is an attribute the stylesheet reads, and it is asserted
   * here for the reason `Diff.browser.test.mjs` asserts the diff's: the attribute is the whole
   * mechanism, Base UI renders the element, and a primitive that swallowed the prop would
   * leave the tick with no colour and throw nothing. No stylesheet is loaded in this project,
   * so which pixels a tone prints stays `palette.test.mjs`'s question.
   */
  const tickOf = (id) => document.querySelector(`tr#finding-${id} [data-slot="checkbox"]`);

  it('turns the contradicted claim amber, still ticked', async () => {
    const unmount = mount();
    await userEvent.click(button('Links'));

    // Ticked because the editor did claim it, and amber because a later observation
    // disagreed. `caution` is the word; which pixels it prints is `palette.test.mjs`'s.
    expect(tickOf('c').dataset.tone).toBe('caution');
    expect(tickOf('c').hasAttribute('data-checked')).toBe(true);
    unmount();
  });

  it('leaves an undecided finding’s tick uncoloured', async () => {
    const unmount = mount();
    await userEvent.click(button('Links'));

    // The other half of the same rule, and the reason it keys on `data-checked`: an open
    // finding carries the tone it *would* wear and must not wear it yet, or a box nobody has
    // ticked is painted for a claim nobody made.
    expect(tickOf('a').dataset.tone).toBe('added');
    expect(tickOf('a').hasAttribute('data-checked')).toBe(false);
    unmount();
  });
});

describe('the three buckets on the ledger', () => {
  it('counts the page into Open, Needs attention and Closed', () => {
    const unmount = mount();

    // The words are the ones `CONTEXT.md` defines, and the third is Closed — never the
    // retired "Resolved". A contradicted claim is the whole of Needs attention.
    //
    // The count leads, which is the dashboard strip's order: the two are one component
    // since ADR 0019 took Open and Closed out of badges, and one of them had to give.
    expect(strip()).toEqual({
      open: '2 Open',
      'needs-attention': '1 Needs attention',
      closed: '1 Closed',
    });

    unmount();
  });

  /**
   * *Closed is reachable and it is not the default view.* It is a disclosure and not a
   * filter, which is the trap this ticket walks past: hiding Closed behind a filter that
   * is off by default would make a row vanish the instant an editor ticked it fixed, with
   * the tick still under their cursor. So the closed work collapses into a section that
   * says how much of it there is, and opens on a press.
   */
  it('keeps Closed out of the way on Links, and one press reaches it', async () => {
    const unmount = mount();
    await userEvent.click(button('Links'));

    // Open and Needs attention are the work in front of the editor, in that order.
    expect(rows()).toEqual(['a', 'b', 'c']);

    await userEvent.click(button('Closed'));
    expect(rows()).toEqual(['a', 'b', 'c', 'd']);

    unmount();
  });

  /**
   * A link that names a closed finding opens the section on the way in, or the landing
   * would scroll to a row that is not on screen. The press has to keep working afterwards:
   * an editor who arrives on one closed finding and then wants the closed work out of the
   * way again is pressing a control that says it is expanded, and a control that says so
   * and does nothing is the silent nothing-happens ticket 109 wrote its banners to stop.
   */
  it('collapses the section a landing opened, on the first press', async () => {
    history.replaceState(null, '', `?finding=d`);
    const unmount = mount();
    await userEvent.click(button('Links'));

    // Open on the way in, because the landing named a closed finding.
    expect(rows()).toEqual(['a', 'b', 'c', 'd']);

    await userEvent.click(button('Closed'));
    expect(rows()).toEqual(['a', 'b', 'c']);

    unmount();
  });
});

/**
 * The fifth tab (ticket 04).
 *
 * The reading is `siblingReading()`'s and the panel is `SiblingView`'s, both tested where
 * they live. What is left for the strip is the one thing neither can answer: that the tab
 * is **absent and not empty** on a page with no sibling, and that it is reachable where
 * there is one.
 */
describe('the sibling tab on the ledger', () => {
  const unit = (raw, index) => ({ tag: 'p', kind: 'text', level: null, raw, norm: raw, index });

  /** A page with an extract on both stores, which is what the panel compares. */
  const comparing = {
    ...report,
    sides: {
      production: { ...report.sides.production, elements: [unit('Gelijk een', 0)] },
      new: report.sides.new,
    },
  };

  const sibling = {
    store: 'be',
    page: 'overkappingen',
    rule: 'alternate',
    units: [unit('Gelijk een', 0)],
    newUnits: [unit('Gelijk een', 0)],
  };

  /** The same page, with a new side the crawl got an answer for. */
  const onNewSite = (status, elements) => ({
    ...comparing,
    sides: { ...comparing.sides, new: { ...comparing.sides.new, status, elements } },
  });

  it('is absent, and not empty, on a page with no sibling', () => {
    // A tab that draws itself to say there is nothing to compare is a tab an editor
    // opens once per page to learn nothing. `de` and `uk` are in no block at all.
    const unmount = mount({ report: comparing, sibling: null });

    expect(tabs()).toEqual(['Text0', 'Links4', 'Images0', 'Meta0']);

    unmount();
  });

  it('is the fifth tab where the page has a sibling, and it carries no badge', () => {
    // No badge, because a badge here counts findings and a block difference is never a
    // finding. **Sibling** and not a store name: the tab is drawn on both stores of the
    // block, so `BE` here and `NL` over there would be two labels for one tab.
    const unmount = mount({ report: comparing, sibling });

    expect(tabs()).toEqual(['Text0', 'Links4', 'Images0', 'Meta0', 'Sibling']);

    unmount();
  });

  it('hands the new site over only where the new site answered 200', async () => {
    // A page the new site did not serve still carries an extract — the error page's own
    // words — and comparing those to the sibling's real page would be a measurement of
    // nothing that called itself measured.
    const unmount = mount({ report: onNewSite(404, [unit('Pagina niet gevonden', 0)]), sibling });
    await userEvent.click(button('Sibling'));

    expect(document.body.textContent).toContain(
      'Not compared: the new site did not answer 200 on both sides',
    );
    expect(document.body.textContent).not.toContain('Pagina niet gevonden');

    unmount();
  });

  it('compares the new site on both stores where it did', async () => {
    const unmount = mount({ report: onNewSite(200, [unit('Gelijk een', 0)]), sibling });
    await userEvent.click(button('Sibling'));

    expect(document.body.textContent).toContain(
      'The two stores say the same thing on the new site',
    );

    unmount();
  });

  it('opens the sibling comparison when it is pressed', async () => {
    const unmount = mount({ report: comparing, sibling });
    await userEvent.click(button('Sibling'));

    // Both of the tab's readings, because the ledger's job here is to mount the tab and
    // the tab's is to draw two of them.
    expect(document.body.textContent).toContain('Production, on both stores');
    expect(document.body.textContent).toContain('The new site, on both stores');

    unmount();
  });
});

/**
 * Ticket 77. The run log makes the *history* visible, and this is the whole of what it
 * says on a row: how long the difference has been there.
 *
 * A browser test because the question is what an editor reads. That a finding with no row
 * in the index gets no date is settled purely in `lib/run-log.test.mjs`; that the row it
 * lands on draws the words rather than an empty mark is only answerable here.
 */
describe('a finding row leads with the compared content', () => {
  /**
   * The two texts first, the class after them (ADR 0019).
   *
   * The class column sat first, 224 pixels of pill, detail, date and control, in front of
   * the pair of strings the row exists to be decided about. Nothing left the row: the order
   * says which of it is the subject and which of it is about the subject.
   */
  it('draws the two sides before the class, and heads them in that order', async () => {
    const unmount = mount();
    await userEvent.click(button('Links'));

    const cells = [...document.querySelectorAll('tbody tr[id="finding-a"] > *')];
    expect(cells[0].textContent).toContain('/overkappingen/');
    expect(cells[1].textContent).toContain('/overkapping/');
    expect(cells[2].getAttribute('data-slot')).toBe('class');

    expect([...document.querySelectorAll('thead th')].map((head) => head.textContent)).toEqual([
      'Production',
      'New site',
      'Class',
    ]);
    unmount();
  });

  /**
   * The row's own presses are quieter than the form's, and **not** hidden (ADR 0019).
   *
   * A page carries up to 168 of these. An outlined button on each drew a column of boxes down
   * the one surface whose content is supposed to be the loudest thing on it — and moving them
   * behind hover would have made a press an editor cannot find until the pointer is on it,
   * which is not the same as available.
   */
  it('keeps the row press reachable and pressable with no hover first', async () => {
    const unmount = mount();
    await userEvent.click(button('Links'));

    // Present, named and in the tab order before any pointer has been near it. **How quiet
    // it looks is not asserted**: ADR 0019 leaves the devices that need taste to a reader,
    // and a test reading utility classes off a button would go red on a rename that changed
    // nothing an editor can see.
    const dismiss = button('Dismiss…');
    expect(dismiss).toBeDefined();
    expect(dismiss.disabled).toBe(false);

    // Pressed cold, it opens the form it is the way into.
    await userEvent.click(dismiss);
    expect(document.querySelector('[data-slot="input"]')).not.toBeNull();
    unmount();
  });
});

describe('an empty tab says why it is empty', () => {
  /** Nothing found is the answer an editor is working towards, and it says so. */
  it('names an absence when the page has no finding of that check', async () => {
    const unmount = mount({ findings: [] });
    await userEvent.click(button('Links'));

    expect(document.body.textContent).toContain('Nothing was found for Links on this page');
    unmount();
  });

  /**
   * The other reason a tab is empty, and it is the opposite answer: the findings are there
   * and the reader has switched them off. *No findings for Links* said the first about both,
   * which is wrong exactly where a rule author is looking for what their rule saw.
   */
  it('names the diagnostics control where that is what emptied it', async () => {
    const unmount = mount({
      findings: [finding('a', 'open', { visibility: 'diagnostic' })],
    });
    await userEvent.click(button('Links'));

    expect(document.body.textContent).toContain('Every Links finding on this page is a diagnostic');
    expect(document.body.textContent).toContain('read the 1');
    unmount();
  });
});

describe('a finding says when it was first seen', () => {
  const rowOf = (id) => document.querySelector(`tr[id="finding-${id}"]`);

  it('says the day the run log first saw the id', async () => {
    const unmount = mount({
      findings: [finding('a', 'open', { firstSeen: '2026-06-03T09:00:00.000Z' })],
    });
    await userEvent.click(button('Links'));

    expect(rowOf('a').textContent).toContain('first seen 03 Jun 2026');
    unmount();
  });

  // The index is committed and the reports are not, so a report newer than the index is
  // the normal case. Nothing is the honest answer; *first seen today* would be a guess.
  it('says nothing about a finding the index does not hold', async () => {
    const unmount = mount({ findings: [finding('a', 'open')] });
    await userEvent.click(button('Links'));

    expect(rowOf('a').textContent).not.toContain('first seen');
    unmount();
  });
});

/**
 * Ticket 78. The run log says an id of this class stopped being seen in the run that first
 * saw this difference, and the overrides say what an editor had decided about it. What is
 * left is the reading, and the reading is the whole risk: a line that says *changed* claims
 * the tool matched two ids, which is the one thing ADR 0004 refuses.
 *
 * A browser test because every criterion here is about what an editor sees — the words, the
 * absence of a control, and that no number beside it moves.
 */
describe('a closed finding leaves a history note', () => {
  const rowOf = (id) => document.querySelector(`tr[id="finding-${id}"]`);
  const noteOf = (id) => rowOf(id)?.querySelector('[data-history-note]');

  const dismissed = {
    count: 1,
    decision: {
      action: 'dismissed',
      editor: 'Danielle',
      at: '2026-08-14T12:00:00.000Z',
      note: 'Prijs verschilt per omgeving.',
    },
  };

  const withNote = (historyNote) => ({ findings: [finding('a', 'open', { historyNote })] });

  it('names the decision, the editor, the day and the reason of what closed', async () => {
    const unmount = mount(withNote(dismissed));
    await userEvent.click(button('Links'));

    expect(noteOf('a').textContent).toContain('earlier on this page, a difference of this class');
    expect(noteOf('a').textContent).toContain('dismissed · Danielle · 14 Aug 2026');
    expect(noteOf('a').textContent).toContain('Prijs verschilt per omgeving.');
    unmount();
  });

  // Picking one of several is a match. The count is what the note can say without one.
  it('counts them where several closed in one run', async () => {
    const unmount = mount(withNote({ count: 3, decision: null }));
    await userEvent.click(button('Links'));

    expect(noteOf('a').textContent).toContain('3 differences of this class closed');
    expect(noteOf('a').textContent).not.toContain('Danielle');
    unmount();
  });

  it('says nothing where no id closed as the difference appeared', async () => {
    const unmount = mount({ findings: [finding('a', 'open')] });
    await userEvent.click(button('Links'));

    expect(noteOf('a')).toBeNull();
    expect(rowOf('a').textContent).not.toContain('earlier on this page');
    unmount();
  });

  /**
   * The most likely defect is a helpful one: a *reuse this reason* button saves typing and
   * buries a real difference under a decision nobody made about the text in front of them.
   * A human matcher with an accept button is the same matcher with a slower threshold.
   */
  it('offers nothing to press', async () => {
    const unmount = mount(withNote(dismissed));
    await userEvent.click(button('Links'));

    expect(noteOf('a').querySelectorAll('button, a, input, [role="button"]')).toHaveLength(0);
    unmount();
  });

  /**
   * Two words are refused. **"Changed"** named a finding the tool believed to be an older
   * finding with new text, and "was" says the same thing in the past tense. The note says
   * what closed.
   */
  it('says what closed and never what changed', async () => {
    const unmount = mount(withNote(dismissed));
    await userEvent.click(button('Links'));

    expect(noteOf('a').textContent).not.toMatch(/\bchanged\b|\bwas\b/i);
    unmount();
  });

  /**
   * The criterion the ticket pins hardest. The derivation keeps the note off the findings
   * (`overrides/state.mjs`), and this is the other half: the strip and the tab badges are
   * identical with the note on screen and without it.
   */
  it('moves no count', async () => {
    const bare = mount({ findings: FOUR });
    await userEvent.click(button('Links'));
    const before = { strip: strip(), tabs: tabs() };
    bare();

    const noted = mount({
      findings: [finding('a', 'open', { historyNote: dismissed }), ...FOUR.slice(1)],
    });
    await userEvent.click(button('Links'));

    expect(noteOf('a')).not.toBeNull();
    expect({ strip: strip(), tabs: tabs() }).toEqual(before);
    noted();
  });
});

/**
 * The 273 pixels, at the seam they came from.
 *
 * A row grew when the override log answered: the log arrives a beat after the first paint,
 * `canWrite` turns true with it, and every open row sprouted a *Dismiss…* the pending
 * render had not drawn. An editor about to tick *Fixed* had the row jump out from under
 * the cursor — measured at 273 pixels down the page on `nl/carport`, and written into
 * `landing.mjs` where the scroll delay works around the symptom.
 *
 * The scroll delay is a different question — *when* to scroll — and it never prevented the
 * shift. This is the shift.
 *
 * The measurement is real and not a class name: no stylesheet is mounted in this project,
 * so a reserved height written as a Tailwind utility would measure the same either way and
 * this test would pass over the defect. What holds the space is the control itself, drawn
 * in its full shape and taking no press until the log answers, so the row is the same
 * height because it holds the same elements.
 */
describe('a row while the override log is still reading', () => {
  /** The Links tab, mounted once so the two renders share a root and a layout. */
  async function open(props) {
    const host = document.createElement('div');
    document.body.append(host);
    const root = createRoot(host);
    const draw = (extra) =>
      act(() =>
        root.render(
          createElement(Ledger, {
            report,
            findings: FOUR,
            append: async () => true,
            observationId: '2026-08-14T10:00:00.000Z-aaaaaaaa',
            ...props,
            ...extra,
          }),
        ),
      );
    draw({});
    await userEvent.click(button('Links'));
    return { draw, unmount: () => act(() => root.unmount()) };
  }

  /** The heights of every finding row on screen, which is what must not move. */
  const heights = () =>
    [...document.querySelectorAll('tbody tr[id^="finding-"]')].map((row) =>
      Math.round(row.getBoundingClientRect().height),
    );

  it('does not change height when the log resolves', async () => {
    // The pending state exactly: the log is connected and has not answered, so nothing is
    // writable yet and no event has been read — every finding derives as open.
    const { draw, unmount } = await open({ pending: true, canWrite: false, settled: false });

    const before = heights();
    expect(before.length).toBeGreaterThan(0);

    draw({ pending: false, canWrite: true, settled: true });

    expect(heights()).toEqual(before);
    unmount();
  });

  // The control is reserved space and not a live control: a press before the log has
  // answered would be a write against a state nobody has read.
  it('offers the control and refuses the press', async () => {
    const { unmount } = await open({ pending: true, canWrite: false, settled: false });

    expect(button('Dismiss')).toBeDefined();
    expect(button('Dismiss').disabled).toBe(true);
    unmount();
  });

  // A log that will never answer is not a log that has not answered yet. Reserving the
  // space there would leave a permanently dead button on every row, which ADR 0019 refuses
  // — the banner says the page is read-only and the row simply offers nothing.
  it('reserves nothing when the log is not coming', async () => {
    const { unmount } = await open({ pending: false, canWrite: false, settled: true });

    expect(button('Dismiss')).toBeUndefined();
    unmount();
  });
});

/**
 * The Meta tab as a checklist an editor ticks (ticket 98).
 *
 * The panel keeps its five-row shape and does not become a `FindingTable`: the head has
 * five known slots, so the field is the useful first column and a class pill beside a
 * fixed field name would say nothing the two cells do not.
 */
describe('the Meta tab', () => {
  const fields = () =>
    [...document.querySelectorAll('[data-meta-field]')].map((row) => row.dataset.metaField);

  /** The row header, which is the cell a control has to be inside. */
  const label = (field) => document.querySelector(`[data-meta-field="${field}"] th`);

  const openMeta = async () => {
    const unmount = mount({ findings: [...FOUR, ...HEAD] });
    await userEvent.click(button('Meta'));
    return unmount;
  };

  it('reads as five named rows in the order of the Magento fields', async () => {
    const unmount = await openMeta();

    // English labels in an English interface (ADR 0014), and they would stay English if
    // that ADR were reversed: each one names the admin field an editor opens to fix the
    // value, which is an identifier in another system and not prose.
    expect(fields()).toEqual(['title', 'keywords', 'description', 'noindex', 'canonical']);
    expect(
      [...document.querySelectorAll('[data-meta-label]')].map((one) => one.textContent),
    ).toEqual(['Meta Title', 'Meta Keywords', 'Meta Description', 'Robots', 'Canonical']);

    unmount();
  });

  it('carries the control inline after the label on the three checking rows', async () => {
    const unmount = await openMeta();

    // No row is added for the control: the field row **is** the finding row, which is what
    // ticket 97 bought by making each checking row hold at most one finding.
    for (const field of ['title', 'description', 'noindex']) {
      expect(label(field).querySelector('[data-slot="checkbox"]')).not.toBeNull();
    }
    // And the two display-only rows have none. An absent control is not a statement, which
    // is why the note below has to say the words as well.
    for (const field of ['keywords', 'canonical']) {
      expect(label(field).querySelector('[data-slot="checkbox"]')).toBeNull();
    }

    unmount();
  });

  it('says which two rows are not counted', async () => {
    const unmount = await openMeta();

    // Without this a display-only row differs from an agreeing row only by a missing
    // control, which reads as "nothing to do here" rather than "this is not counted".
    expect(document.querySelector('[data-meta-note]').textContent).toBe(
      'Display only: Meta Keywords and Canonical are not counted.',
    );

    unmount();
  });

  it('names only the uncounted rows it drew', async () => {
    // The Canonical row is gone on the 147 of 179 nl pages where production has none and
    // the new site sets one, and Meta Keywords is still display only underneath it. A note
    // that only appeared beside Canonical would leave those pages with an uncounted row and
    // no words — which is a row differing from an agreeing one only by a missing control.
    const noCanonical = {
      ...report,
      sides: {
        production: { ...report.sides.production, meta: { ...PROD_META, canonical: null } },
        new: report.sides.new,
      },
    };
    const unmount = mount({ report: noCanonical, findings: [...FOUR, ...HEAD] });
    await userEvent.click(button('Meta'));

    expect(fields()).toEqual(['title', 'keywords', 'description', 'noindex']);
    expect(document.querySelector('[data-meta-note]').textContent).toBe(
      'Display only: Meta Keywords is not counted.',
    );

    unmount();
  });

  it('carries a count badge, because the content view has nowhere to put one', async () => {
    const unmount = mount({ findings: [...FOUR, ...HEAD] });

    // The content view is the body in document order and the head is not in it, so the
    // badge is the only place a head count can live.
    expect(tabs()).toEqual(['Text0', 'Links4', 'Images0', 'Meta3']);

    unmount();
  });

  it('lands on the head row a link named, and says the difference is in the head', async () => {
    history.replaceState(null, '', '?finding=r');
    const unmount = mount({ findings: [...FOUR, ...HEAD] });

    // Reached through the dashboard's list of differences, a meta finding has to say where
    // it is, as a text finding says *under “…”* — a silent blank would spend what ticket 34
    // bought. The tab is opened for the reader as well: the landing is the whole point.
    expect(document.querySelector('[role="tab"][aria-selected="true"]').textContent).toContain(
      'Meta',
    );
    expect(document.querySelector('tr#finding-r').textContent).toContain('in the <head>');
    // And the page does not claim the link went nowhere.
    expect(document.body.textContent).not.toContain('This difference is not on one of these tabs.');

    unmount();
  });

  it('keeps head findings out of the content view', async () => {
    const unmount = mount({ findings: HEAD });
    await userEvent.click(button('Text'));

    // The content view is built from the report's rows, which are units inside the content
    // boundary. Three head findings on the page put no row in it.
    expect(document.querySelectorAll('[data-meta-field]').length).toBe(0);
    expect(document.querySelector('tr#finding-t')).toBeNull();

    unmount();
  });
});

/**
 * What language the compared text is in (ticket 125).
 *
 * The two columns of a finding hold scraped strings — an anchor wording, a title, a meta
 * description — and they inherited `en-GB` from the shell on all six stores. The report
 * carries the store, so the ledger reads the language off it and the cells declare it.
 */
describe('the language of the content', () => {
  const german = { ...report, store: 'de' };

  it('declares it on both compared texts and on the heading a finding sits under', async () => {
    const unmount = mount({
      report: german,
      findings: [finding('a', 'open', { anchorHeading: 'Farben und Formen' })],
    });
    await userEvent.click(button('Links'));

    const declared = [...document.querySelectorAll('tr#finding-a [lang]')];
    expect(declared.map((one) => [one.lang, one.textContent])).toEqual([
      ['de', '/overkappingen/'],
      ['de', '/overkapping/'],
      ['de', '“Farben und Formen”'],
    ]);
    unmount();
  });

  /** The tooltip and the language are on one element, for `Diff.jsx`'s reason. */
  it('declares it on the element that owns the heading tooltip', async () => {
    const unmount = mount({
      report: german,
      findings: [finding('a', 'open', { anchorHeading: 'Farben und Formen' })],
    });
    await userEvent.click(button('Links'));

    const under = document.querySelector('tr#finding-a [lang="de"][title]');
    expect(under.title).toBe('Farben und Formen');
    unmount();
  });

  it('declares it in the head panel, where the title and the description are prose', async () => {
    const unmount = mount({ report: german, findings: HEAD });
    await userEvent.click(button('Meta'));

    const declared = [...document.querySelectorAll('tbody [lang]')];
    expect(declared.map((one) => one.lang)).not.toContain('en-GB');
    expect(declared.map((one) => one.textContent)).toContain(PROD_META.title);
    unmount();
  });
});
