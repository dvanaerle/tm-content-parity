import { describe, expect, it } from 'vitest';
import {
  SEARCH_FIELDS,
  addPage,
  emptyIndex,
  explainScope,
  indexStore,
  inScope,
  matchedFields,
  mergeIndexes,
  pagesOfIndex,
  parseTerm,
  scopeSuggestions,
  searchNotes,
  searchStore,
  withScope,
} from './search.mjs';
import { screenFromSearch, searchForClass, searchForRepeat } from './screen-url.mjs';
import { deriveStoreState } from '../../../overrides/state.mjs';

/**
 * Ticket 82. An editor types the words and sees every finding that holds them, across
 * every page of the store. The index is what the build emits so that can happen with
 * no service and no search library.
 */

/** @param {Partial<import('../../../compare/contract.mjs').Finding>} part */
const finding = (part) => ({
  id: 'a',
  store: 'nl',
  page: 'afhalen',
  check: 'text',
  class: 'text-missing',
  prod: 'Bekijk deals >',
  new: null,
  detail: null,
  anchorHeading: 'Montage',
  occurrences: 1,
  score: null,
  ...part,
});

/**
 * A report as `compare/30-compare.mjs` writes it, cut to what the index reads. The
 * extracts are the large half — 54 MB over the corpus — and the point of the index is
 * that it holds none of them.
 */
const report = ({
  page = 'afhalen',
  store = 'nl',
  findings = [finding({})],
  links = {},
  comparable = true,
} = {}) => ({
  store,
  page,
  comparable,
  skipReason: null,
  findings,
  rows: [{ prod: 0, new: null, class: 'text-missing', score: null, finding: 'a' }],
  summary: {
    work: findings.length,
    information: 0,
    diagnostic: 0,
    total: findings.length,
    byClass: {},
    byCheck: {},
  },
  observationId: '2026-08-11T00:00:00Z-1',
  findingSetHash: 'hash',
  builtAt: '2026-08-11T00:00:00Z',
  sides: {
    production: {
      url: 'https://www.tuinmaximaal.nl/afhalen',
      status: 200,
      elements: [
        {
          index: 0,
          tag: 'p',
          kind: 'text',
          level: null,
          raw: 'Bekijk deals >',
          norm: 'Bekijk deals >',
        },
      ],
      links: links.production ?? [],
      images: [],
      markdown: '',
      meta: {},
      diagnostics: {},
    },
    new: {
      url: 'https://m2stagingnl.intern.systems/afhalen',
      status: 200,
      elements: [],
      links: links.new ?? [],
      images: [],
      markdown: '',
      meta: {},
      diagnostics: {},
    },
  },
});

describe('indexStore', () => {
  it('holds the searchable fields and the finding id, and never the report', () => {
    // The named trap: a report holds both extracts and is large. Shipping searchable
    // text plus ids is a fraction of it; shipping the report twice is not. So the
    // shape is pinned, and a field that creeps in has to be argued for here first.
    const index = indexStore('nl', [report()]);

    expect(Object.keys(index).sort()).toEqual(['builtAt', 'findings', 'pages', 'store']);
    expect(index.store).toBe('nl');
    expect(index.pages).toBe(1);
    expect(Object.keys(index.findings[0]).sort()).toEqual([
      'anchorHeading',
      'class',
      'detail',
      'id',
      'linkText',
      'new',
      'observationId',
      'occurrences',
      'page',
      'prod',
      'store',
    ]);
  });

  it('carries the observation the page was seen in, so a fix claim can be contradicted', () => {
    // The eleventh field, argued here as the shape above demands. The all-stores screen
    // (ticket 03) has no page summaries to ask — six stores of them is seven megabytes of
    // HTML — so the log is derived over the index itself, and `derivePageState()` needs the
    // page's observation to tell a `fixed` claim from a `contradicted` one. Without it a
    // claim made against an older crawl reads as closed, and open work sits behind *Include
    // closed* on the one screen that cannot look it up anywhere else.
    const index = indexStore('nl', [report()]);
    expect(index.findings[0].observationId).toBe('2026-08-11T00:00:00Z-1');
  });

  it('carries the page of every finding, because the result says which pages', () => {
    const index = indexStore('nl', [report({ page: 'garantie' })]);
    expect(index.findings[0].page).toBe('garantie');
  });

  it('carries the store of every finding, so two indexes can be merged (ticket 05)', () => {
    // The tenth field, and the ticket's first trap. Until an entry says which store it is
    // on, the store lives on the **index** — so merging `be`'s entries into `nl`'s array
    // files every `be` finding under `nl`, and a press writes an event where the finding
    // id does not exist. The entry has to carry it before anything may be merged.
    const index = indexStore('be', [report({ store: 'be', page: 'garantie' })]);
    expect(index.findings[0].store).toBe('be');
  });

  it('takes the store off the report and never off the index it is being added to', () => {
    // The same trap from the other side. `addPage()` is the accumulator two indexes are
    // merged through, and an entry stamped with the accumulator's store rather than with
    // the report's own is the mislabelling this field exists to make impossible.
    const index = [report({ store: 'be', page: 'garantie' })].reduce(addPage, emptyIndex('nl'));
    expect(index.findings[0].store).toBe('be');
  });

  it('leaves out a class that is not work, for the reason the bar leaves it out', () => {
    // `text-added` is content the new site invented; ticket 33 kept it out of the count
    // and ticket 75 named it `information`. A search that returned it would offer work
    // the log does not count. Widening the index to `information` is a payload decision
    // and belongs to whichever ticket wants to pay for it.
    const index = indexStore('nl', [
      report({
        findings: [
          finding({ id: 'a' }),
          finding({ id: 'b', class: 'text-added', prod: null, new: 'Bekijk deals >' }),
        ],
      }),
    ]);

    expect(index.findings.map((entry) => entry.id)).toEqual(['a']);
  });

  it('resolves the link text a links finding does not carry', () => {
    // A links finding holds the **target** in `prod` and `new` — the host-folded
    // `linkKey` — and the anchor text is nowhere on it. The words an editor types are
    // the words on the page, so the build reads them off the extract's link records.
    // This is the one field the dashboard's own finding index cannot derive, and it is
    // why the index is emitted rather than assembled in the browser.
    const index = indexStore('nl', [
      report({
        findings: [
          finding({
            check: 'links',
            class: 'link-target',
            prod: 'self/terrasoverkapping',
            new: 'other/terrasoverkapping',
          }),
        ],
        links: {
          production: [
            {
              index: 3,
              href: '/terrasoverkapping',
              url: '',
              key: 'self/terrasoverkapping',
              text: 'Bekijk deals >',
              internal: true,
            },
          ],
          new: [
            {
              index: 3,
              href: '/terrasoverkapping',
              url: '',
              key: 'other/terrasoverkapping',
              text: 'Bekijk aanbiedingen',
              internal: true,
            },
          ],
        },
      }),
    ]);

    expect(index.findings[0].linkText).toEqual(['Bekijk deals >', 'Bekijk aanbiedingen']);
  });

  it('has no link text on a finding that is not about a link', () => {
    // An empty list and not `null`: every reader then scans the same shape, and no
    // caller has to remember which findings carry the field.
    expect(indexStore('nl', [report()]).findings[0].linkText).toEqual([]);
  });

  it('leaves out a page there was nothing to compare on', () => {
    // A one-sided page is out of the bar from the first day (ticket 20), and 19 of them
    // in this corpus still carry a finding. Indexing those would put ids in a result
    // that the dashboard's derived state has never heard of — and the repeat row is
    // written to throw on a missing one rather than quietly shrink its denominator.
    const index = indexStore('nl', [report({ page: 'weg', comparable: false }), report()]);

    expect(index.findings.map((one) => one.page)).toEqual(['afhalen']);
    expect(index.pages).toBe(1);
  });

  it('builds the same index one report at a time as it does from all of them', () => {
    // The build cannot hold a store's reports at once: a full report carries both
    // extracts, 11 MB over the NL store on disk and several times that parsed, which is
    // the very reason `loadSummaries()` reads one file and throws the rest away. So the
    // emitter streams, and the accumulator is the seam it streams into. Pinning the two
    // paths equal is what stops the streaming one growing a second, divergent merge.
    const pages = [report({ page: 'afhalen' }), report({ page: 'garantie' })];
    const streamed = pages.reduce(addPage, emptyIndex('nl'));

    expect(streamed).toEqual(indexStore('nl', pages));
  });

  it('says when the snapshot was built, because the finding half is not live', () => {
    // Two sources, two freshnesses. The index is as old as the last build and the
    // notes are live, so the index has to be able to say which moment it is.
    expect(indexStore('nl', [report()]).builtAt).toBe('2026-08-11T00:00:00Z');
  });
});

/** One index entry, as `indexStore` emits it. */
const entry = (part) => ({
  id: 'a',
  store: 'nl',
  page: 'afhalen',
  class: 'text-missing',
  prod: 'Bekijk deals >',
  new: null,
  detail: null,
  anchorHeading: 'Montage',
  occurrences: 1,
  linkText: [],
  observationId: '20260811-01',
  ...part,
});

describe('mergeIndexes', () => {
  /** An index as the build emitted it for one store. */
  const index = (store, findings, builtAt = '2026-08-11T00:00:00Z') => ({
    store,
    pages: findings.length,
    builtAt,
    findings,
  });

  it('holds every store’s entries, each still saying which store it is on', () => {
    // The merge itself, and the reason the entry carries a store at all: the entries land in
    // one array and the only thing left telling them apart is the field each one carries.
    const merged = mergeIndexes([
      index('nl', [entry({ id: 'a', store: 'nl' })]),
      index('be', [entry({ id: 'b', store: 'be' })]),
    ]);

    expect(merged.findings.map((one) => [one.id, one.store])).toEqual([
      ['a', 'nl'],
      ['b', 'be'],
    ]);
  });

  it('takes an arbitrary set, so six stores are one merge and not five (ticket 03)', () => {
    // The whole of the generalisation. It used to take **one** sibling, because `siblingOf()`
    // answers with one store or with nothing, and an all-stores screen has no sibling to name.
    const merged = mergeIndexes(
      ['nl', 'be', 'be_fr', 'de', 'fr', 'uk'].map((store) =>
        index(store, [entry({ id: store, store })]),
      ),
    );

    expect(merged.findings.map((one) => one.store)).toEqual([
      'nl',
      'be',
      'be_fr',
      'de',
      'fr',
      'uk',
    ]);
  });

  it('answers with the one index it was given, unmerged', () => {
    // `de` and `uk` are each the only store of their language, so a per-store search there has
    // no second file to fetch and nothing to merge. A store out of a block pays nothing for
    // the block, which is the shape of ADR 0018's trade.
    const alone = index('de', [entry({ store: 'de' })]);
    expect(mergeIndexes([alone])).toEqual(alone);
  });

  it('keeps the shape of an index, so nothing downstream can tell it was merged', () => {
    const merged = mergeIndexes([index('nl', [entry({ store: 'nl' })]), index('be', [])]);
    expect(Object.keys(merged).sort()).toEqual(['builtAt', 'findings', 'pages', 'store']);
  });

  it('names no store once it holds more than one, because a merge is of none', () => {
    // It was the dashboard's store while the merge was a block's two files: a label on the
    // index and never a claim about its entries, which is why an entry carries its own. Over
    // six stores there is no such store to name, so the field says so instead of picking one.
    expect(mergeIndexes([index('nl', []), index('be', [])]).store).toBeNull();
  });

  it('is an empty index when there is nothing to merge', () => {
    // A screen with no store to search draws its own empty answer. Throwing here would make
    // *the log holds no store yet* a broken screen rather than an empty one.
    expect(mergeIndexes([])).toEqual(emptyIndex(null));
  });

  it('counts the pages of all of them, because the number counts what was scanned', () => {
    const merged = mergeIndexes([
      index('nl', [entry({ store: 'nl' })]),
      index('be', [entry({ store: 'be' }), entry({ store: 'be', page: 'garantie' })]),
    ]);
    expect(merged.pages).toBe(3);
  });

  it('carries the newest build, the rule `addPage()` already follows one level down', () => {
    // One rule for *when was this snapshot taken* and not two. The files are written by one
    // build, so they carry the same moment in practice; where they do not, this answers as
    // the accumulator below it answers over two reports.
    const merged = mergeIndexes([
      index('nl', [], '2026-08-11T00:00:00Z'),
      index('be', [], '2026-08-12T00:00:00Z'),
      index('uk', [], '2026-08-10T00:00:00Z'),
    ]);
    expect(merged.builtAt).toBe('2026-08-12T00:00:00Z');
  });
});

describe('pagesOfIndex', () => {
  const index = (findings) => ({
    store: null,
    pages: findings.length,
    builtAt: '2026-08-11T00:00:00Z',
    findings,
  });

  it('reads the flat entries back as the store pages they came off', () => {
    // The index is the corpus of the all-stores screen and the summaries are not there to be
    // read: six stores of them is seven megabytes of HTML, which is why the entries carry
    // enough to be read back as pages.
    const pages = pagesOfIndex(
      index([
        entry({ id: 'a', store: 'nl', page: 'afhalen' }),
        entry({ id: 'b', store: 'nl', page: 'afhalen' }),
        entry({ id: 'c', store: 'nl', page: 'garantie' }),
      ]),
    );

    expect(pages.map((page) => [page.store, page.page, page.findings.length])).toEqual([
      ['nl', 'afhalen', 2],
      ['nl', 'garantie', 1],
    ]);
  });

  it('keeps the same page key on two stores apart', () => {
    // `afhalen` is a page of `nl` and a page of `be`, and one report holding both would put
    // `be`'s findings behind `nl`'s events.
    const pages = pagesOfIndex(
      index([
        entry({ id: 'a', store: 'nl', page: 'afhalen' }),
        entry({ id: 'b', store: 'be', page: 'afhalen' }),
      ]),
    );

    expect(pages.map((page) => page.store)).toEqual(['nl', 'be']);
  });

  it('carries the observation each page was seen in', () => {
    // The eleventh field, and the reason it is there: a fix claim is *contradicted* when a
    // later observation still gives the finding, and the observation is a fact about the page.
    // Without it a claim made against an older crawl reads as `fixed`, so open work would sit
    // behind *Include closed* on the one screen that has no summaries to ask instead.
    const pages = pagesOfIndex(index([entry({ observationId: '20260811-01' })]));

    expect(pages[0].observationId).toBe('20260811-01');
  });

  it('reads as a report the override derivation can take', () => {
    // The whole point of the shape. A fix claimed against an earlier observation is
    // contradicted, and it is `deriveStoreState()` that says so — not a second reading of the
    // rule written out for this screen.
    const { pages } = deriveStoreState({
      reports: pagesOfIndex(index([entry({ id: 'a', observationId: '20260811-01' })])),
      events: [
        {
          store: 'nl',
          page: 'afhalen',
          scope: 'finding',
          findingId: 'a',
          action: 'fixed',
          editor: 'Ana',
          createdAt: '2026-08-10T00:00:00Z',
          observationId: '20260810-01',
        },
      ],
    });

    expect(pages[0].findings[0].state).toBe('contradicted');
  });
});

describe('searchStore over a language block (ticket 05)', () => {
  const index = (store, findings) => ({
    store,
    pages: findings.length,
    builtAt: '2026-08-11T00:00:00Z',
    findings,
  });

  it('answers a term typed on nl with a repeat holding be’s pages', () => {
    // The ticket in one test. Before this the searched list was `nl`'s findings grouped by
    // a key that already spanned the block, so a spanning row could never appear in it —
    // the sibling's findings were not in the array being grouped.
    const result = searchStore({
      index: mergeIndexes([
        index('nl', [entry({ id: 'a', store: 'nl', page: 'afhalen' })]),
        index('be', [entry({ id: 'b', store: 'be', page: 'pergola' })]),
      ]),
      term: 'deals',
    });

    expect(result.repeats).toHaveLength(1);
    expect(result.repeats[0].stores).toEqual(['be', 'nl']);
    expect(result.repeats[0].on.map((one) => `${one.store}/${one.page}`)).toEqual([
      'nl/afhalen',
      'be/pergola',
    ]);
  });

  it('keeps two stores’ same page key as two pages', () => {
    // The two stores of a block carry the same keys, and `nl/afhalen` and `be/afhalen` are
    // two pages of one repeat. Bucketed by the key alone they would be one, wearing
    // whichever store's name arrived first.
    const result = searchStore({
      index: mergeIndexes([
        index('nl', [entry({ id: 'a', store: 'nl', page: 'afhalen' })]),
        index('be', [entry({ id: 'b', store: 'be', page: 'afhalen' })]),
      ]),
      term: 'deals',
    });

    expect(result.repeats[0].on).toHaveLength(2);
    expect(result.pages).toBe(2);
    expect(result.total).toBe(2);
  });

  it('does not move a store out of a block at all', () => {
    // `de` is the only store of its language. Its index is its own, its rows are its own,
    // and this ticket is invisible there — which is the test the ticket asks for by name.
    const alone = index('de', [entry({ id: 'a', store: 'de', page: 'afhalen' })]);
    expect(searchStore({ index: mergeIndexes([alone]), term: 'deals' })).toEqual(
      searchStore({ index: alone, term: 'deals' }),
    );
  });

  it('does not group across a block boundary, because the key never did', () => {
    // The grouping is `repeatsInStore()`'s and this ticket adds nothing to it. `de` and
    // `nl` are not a block, so identical words there are two rows — and a merge that
    // reached past the sibling would be a cross-store search, which ticket 38 refuses.
    const result = searchStore({
      index: mergeIndexes([
        index('nl', [entry({ id: 'a', store: 'nl' })]),
        index('de', [entry({ id: 'b', store: 'de' })]),
      ]),
      term: 'deals',
    });

    expect(result.repeats).toHaveLength(2);
    expect(result.repeats.every((one) => one.stores.length === 1)).toBe(true);
  });

  it('asks the log about the sibling’s findings by their own ids', () => {
    // A press is armed off `byFinding`, which the hook builds over **both** lists. So a
    // sibling finding somebody already dismissed is closed here too, and the searched row
    // reads the same on both dashboards of the block — which is the mirroring ADR 0018
    // says is the point.
    const result = searchStore({
      index: mergeIndexes([
        index('nl', [entry({ id: 'a', store: 'nl', page: 'afhalen' })]),
        index('be', [entry({ id: 'b', store: 'be', page: 'pergola' })]),
      ]),
      term: 'deals',
      stateOf: (id) => (id === 'b' ? 'dismissed' : 'open'),
    });

    expect(result.repeats[0].on.map((one) => one.id)).toEqual(['a']);
  });
});

describe('matchedFields', () => {
  it('names six fields and no more', () => {
    // The ticket asks for six, and the answer says which of the six matched. A
    // seventh name would be a field an editor was never told they could search.
    expect(SEARCH_FIELDS).toEqual([
      'page',
      'prodText',
      'newText',
      'linkTarget',
      'linkText',
      'anchorHeading',
    ]);
  });

  it('finds a finding by its production text', () => {
    expect(matchedFields(entry({ prod: 'Bekijk deals >' }), 'bekijk deals >')).toEqual([
      'prodText',
    ]);
  });

  it('finds a finding by its new-site text', () => {
    expect(
      matchedFields(entry({ prod: null, new: 'Bekijk aanbiedingen' }), 'aanbiedingen'),
    ).toEqual(['newText']);
  });

  it('finds a finding by the link target, and does not call that production text', () => {
    // Decision 1: on a links check `prod` and `new` hold `linkKey()`'s host-folded
    // target and not words. Reporting a URL hit as *production text* would tell an
    // editor a sentence is on the page when what is on the page is a link.
    const links = entry({ class: 'link-target', prod: 'self/terrasoverkapping', new: null });
    expect(matchedFields(links, 'terrasoverkapping')).toEqual(['linkTarget']);
  });

  it('finds a finding by the words on the link', () => {
    // The field only the build can fill, and the reason the index is emitted at all.
    const links = entry({
      class: 'link-target',
      prod: 'self/deals',
      new: null,
      linkText: ['Bekijk deals >'],
    });
    expect(matchedFields(links, 'bekijk')).toEqual(['linkText']);
  });

  it('finds a finding by the heading it sits under', () => {
    expect(matchedFields(entry({ prod: null, anchorHeading: 'Montage' }), 'montage')).toEqual([
      'anchorHeading',
    ]);
  });

  it('finds a finding by its page key', () => {
    expect(matchedFields(entry({ prod: null, anchorHeading: null }), 'afhal')).toEqual(['page']);
  });

  it('matches a page key that holds a slash, without splitting on it', () => {
    // The named trap. A key like `blog/montage-tips` is one opaque string, so the term
    // is matched against the whole of it and the slash is an ordinary letter. Plain
    // substring gets this for free — the test is here to stop a later tokeniser
    // breaking it, not because the first attempt failed.
    const nested = entry({ page: 'blog/montage-tips', prod: null, anchorHeading: null });
    expect(matchedFields(nested, 'blog/montage')).toEqual(['page']);
    expect(matchedFields(nested, 'montage-tips')).toEqual(['page']);
  });

  it('matches the words as typed, ignoring case and keeping punctuation', () => {
    // `Bekijk deals >` is what an editor reads on the page, so it is what they type,
    // and the `>` has to survive being searched for. Not tokens: two words with
    // something between them are not a match for the pair.
    expect(matchedFields(entry({}), 'DEALS >')).toEqual(['prodText']);
    expect(matchedFields(entry({}), 'deals montage')).toEqual([]);
  });

  it('matches nothing on an empty term, because an empty box is not a search', () => {
    // Without this every finding in the store would match, and the result would read
    // as a search that found everything rather than as a box nobody has typed in.
    expect(matchedFields(entry({}), '  ')).toEqual([]);
  });

  it('names every field that matched, in the order the fields are listed', () => {
    // One word can hit the text and the heading at once. Naming both is how a result
    // explains itself; naming only the first would hide half the reason it is there.
    const both = entry({ prod: 'Montage inbegrepen', anchorHeading: 'Montage' });
    expect(matchedFields(both, 'montage')).toEqual(['prodText', 'anchorHeading']);
  });
});

/**
 * Ticket 103. A leading slash stops being an ordinary character and becomes a page scope.
 * Parsing is tested here, apart from matching: what the slash rule says is which half of
 * the typing is the page and which half is the words, and nothing about what either half
 * then finds.
 */
describe('parseTerm', () => {
  it('reads a leading slash as the page scope', () => {
    expect(parseTerm('/downloads')).toEqual({ scope: 'downloads', text: '' });
  });

  it('divides a scope from the words after it', () => {
    expect(parseTerm('/downloads knop')).toEqual({ scope: 'downloads', text: 'knop' });
  });

  it('keeps the whole of the words, spaces and all', () => {
    // The scope ends at the first space and the text is everything after it. A term
    // that stopped at the second space would refuse `Bekijk deals >`, which is the
    // phrase ticket 82 is written around.
    expect(parseTerm('/afhalen bekijk deals >')).toEqual({
      scope: 'afhalen',
      text: 'bekijk deals >',
    });
  });

  it('leaves a slash that is not in first position alone', () => {
    // A page key can hold one — `faq/productinformatie` is a key — so anywhere but the
    // front the character is an ordinary letter and the term keeps it whole.
    expect(parseTerm('faq/productinformatie')).toEqual({
      scope: null,
      text: 'faq/productinformatie',
    });
  });

  it('scopes on a key that holds a slash, without splitting on the second one', () => {
    // Position 0 is the only place a slash is structure. The rest of the key is opaque,
    // so `/faq/productinformatie` is one scope and never two.
    expect(parseTerm('/faq/productinformatie')).toEqual({
      scope: 'faq/productinformatie',
      text: '',
    });
  });

  it('is not a scope when nothing follows the slash', () => {
    // An empty scope holds every page key by substring, so the first keystroke would
    // answer with the whole store. It stays the ordinary term it was before this ticket.
    expect(parseTerm('/')).toEqual({ scope: null, text: '/' });
    expect(parseTerm('/ knop')).toEqual({ scope: null, text: '/ knop' });
  });

  it('reads the term as typed, so a scope survives the space before it', () => {
    expect(parseTerm('  /downloads  knop  ')).toEqual({ scope: 'downloads', text: 'knop' });
  });

  it('has nothing to say about an empty box', () => {
    expect(parseTerm('   ')).toEqual({ scope: null, text: '' });
  });
});

describe('inScope', () => {
  it('matches the key by substring, so one scope can reach a family of pages', () => {
    // Substring and not an exact key: it is how every other field in this search is
    // matched, and it is what lets one rule reach `faq`, `(home)` and `(be)pergola`
    // with no special case for any of them.
    expect(inScope('faq/productinformatie', 'faq')).toBe(true);
    expect(inScope('(home)', 'home')).toBe(true);
    expect(inScope('(be)pergola', 'pergola')).toBe(true);
    expect(inScope('garantie', 'downloads')).toBe(false);
  });

  it('ignores letter case, as the rest of the search does', () => {
    expect(inScope('Downloads', 'downloads')).toBe(true);
  });
});

/**
 * Ticket 104 part D. The keys are not guessable — they carry store prefixes and
 * parentheses — so a scope nobody can be offered is a feature only a reader of the source
 * can use. The offer is a value here for the reason part A's four kinds are: the rule is the
 * scope's own rule, and a component re-deriving it would offer keys the scope then misses.
 */
const KEYS = [
  { page: 'overkappingen', comparable: true },
  { page: '(home)', comparable: true },
  { page: 'faq/productinformatie', comparable: true },
  { page: '(be)pergola', comparable: true },
  { page: 'kerstactie', comparable: false },
];

describe('scopeSuggestions', () => {
  const offered = (term) => scopeSuggestions({ pages: KEYS, term })?.pages.map((one) => one.page);

  it('offers every key of the store on the slash alone', () => {
    // Alphabetical, and not the order the store happens to load in: the list is long
    // enough to scroll on a real store, and a scroll through an order nobody can predict
    // is a list an editor has to read rather than aim at.
    expect(offered('/')).toEqual([
      '(be)pergola',
      '(home)',
      'faq/productinformatie',
      'kerstactie',
      'overkappingen',
    ]);
  });

  it('narrows by the scope’s own substring rule, so what is offered is what would match', () => {
    expect(offered('/pergola')).toEqual(['(be)pergola']);
    expect(offered('/faq')).toEqual(['faq/productinformatie']);
    expect(offered('/HOME')).toEqual(['(home)']);
  });

  it('offers nothing for a slash that is not in first position', () => {
    // 103's rule, and the reason for it: a key can hold a slash, so anywhere but the front
    // the character is an ordinary letter and there is no scope being typed.
    expect(scopeSuggestions({ pages: KEYS, term: 'faq/productinformatie' })).toBe(null);
    expect(scopeSuggestions({ pages: KEYS, term: 'knop' })).toBe(null);
    expect(scopeSuggestions({ pages: KEYS, term: '' })).toBe(null);
  });

  it('has nothing left to offer once the fragment is the one key it reaches', () => {
    // The scope is settled, so the list closes on its own and stays closed while the words
    // after it are typed. It is the one honest way to keep a suggestion list from hanging
    // over the result an editor is reading, without a second piece of state saying so.
    expect(scopeSuggestions({ pages: KEYS, term: '/(home)' })).toBe(null);
    expect(scopeSuggestions({ pages: KEYS, term: '/overkappingen deals' })).toBe(null);
  });

  it('keeps offering when the key is the prefix of a sibling', () => {
    // The exact match is not settlement on its own. A store holding both `veranda` and
    // `veranda-hout` is the ordinary case, and there `/veranda` has a page left to offer —
    // going quiet would break the rule the list lives under, that what is offered is what
    // would match. Worse where the sibling is the one-sided one: no index entry can offer it.
    const siblings = [
      { page: 'veranda', comparable: true },
      { page: 'veranda-hout', comparable: false },
    ];

    expect(scopeSuggestions({ pages: siblings, term: '/veranda' })).toEqual({
      scope: 'veranda',
      pages: [
        { page: 'veranda', comparable: true },
        { page: 'veranda-hout', comparable: false },
      ],
    });
    // And it is settled again as soon as the fragment reaches one of them alone.
    expect(scopeSuggestions({ pages: siblings, term: '/veranda-hout' })).toBe(null);
  });

  it('keeps offering while the scope is half typed, second term and all', () => {
    // Which is what makes a scope correctable: `/overkap deals` is a page not yet named and
    // a search already typed, and choosing here must not cost the words.
    expect(offered('/overkap deals')).toEqual(['overkappingen']);
  });

  it('offers the one-sided pages, and says which they are', () => {
    // They are exactly the pages an editor cannot otherwise reach through search — there is
    // no index entry to find them by — and part A explains what a scope onto one gets.
    expect(scopeSuggestions({ pages: KEYS, term: '/kerst' })).toEqual({
      scope: 'kerst',
      pages: [{ page: 'kerstactie', comparable: false }],
    });
  });

  it('offers an empty list rather than nothing when the fragment matches no key', () => {
    // Not `null`. A fragment is being typed, so the box is a scope box; that no key holds it
    // is part A's *no such page*, which the result says and this list does not repeat.
    expect(scopeSuggestions({ pages: KEYS, term: '/zzz' })).toEqual({ scope: 'zzz', pages: [] });
  });
});

describe('withScope', () => {
  it('puts the chosen key in the box, whole', () => {
    expect(withScope('/faq', 'faq/productinformatie')).toBe('/faq/productinformatie');
    expect(withScope('/home', '(home)')).toBe('/(home)');
  });

  it('leaves the second term intact', () => {
    expect(withScope('/overkap deals', 'overkappingen')).toBe('/overkappingen deals');
    expect(withScope('/overkap bekijk deals >', 'overkappingen')).toBe(
      '/overkappingen bekijk deals >',
    );
  });

  it('scopes a term that had no scope, rather than replacing it', () => {
    // Reachable from `/ deals`, where nothing follows the slash: the words are a search
    // already typed and the scope is what is being added to them.
    expect(withScope('/ deals', 'overkappingen')).toBe('/overkappingen deals');
  });
});

describe('searchStore', () => {
  /** An index over the entries given, as the store page would have loaded it. */
  const index = (findings) => ({
    store: 'nl',
    pages: 3,
    builtAt: '2026-08-11T00:00:00Z',
    findings,
  });

  it('groups the hits by repeat, so one difference on many pages is one row', () => {
    // The ticket's second trap: a term matching one repeat of many findings must not
    // read as many unrelated results. The grouping is ticket 81's `repeatsInStore()`,
    // reused and not rewritten — one footer line wrong on three pages is one row.
    const result = searchStore({
      index: index([
        entry({ id: 'a', page: 'afhalen' }),
        entry({ id: 'b', page: 'garantie' }),
        entry({ id: 'c', page: 'montage' }),
      ]),
      term: 'deals',
    });

    expect(result.repeats).toHaveLength(1);
    expect(result.repeats[0].on.map((one) => one.page)).toEqual(['afhalen', 'garantie', 'montage']);
  });

  it('says how many findings on how many pages', () => {
    // A count *of the result* and nothing else. Search narrows; it moves no count, so
    // there is no bar here, no denominator and no closed count — the rule ticket 36
    // pinned, which `view.mjs` obeys in the same words.
    const result = searchStore({
      index: index([
        entry({ id: 'a', page: 'afhalen' }),
        entry({ id: 'b', page: 'afhalen', anchorHeading: 'Levering' }),
        entry({ id: 'c', page: 'garantie' }),
        entry({ id: 'd', page: 'montage', prod: 'Gratis montage' }),
      ]),
      term: 'deals',
    });

    expect(result.total).toBe(3);
    expect(result.pages).toBe(2);
  });

  it('says which fields matched on the repeat, and leaves its pages untouched', () => {
    // Decision 3. `view.test.mjs` pins the keys of a `Repeat.on` entry to exactly the four
    // the derivation writes, so a search that hung the matched field there would break
    // ticket 81's derivation for the view that has nothing to do with search. The row is
    // what matched; the pages are only where it is. `store` is the fourth since ticket 03,
    // and it comes from `repeatsInStore()` — not from here.
    const result = searchStore({
      index: index([entry({ prod: 'Montage inbegrepen', anchorHeading: 'Montage' })]),
      term: 'montage',
    });

    expect(result.repeats[0].fields).toEqual(['prodText', 'anchorHeading']);
    expect(Object.keys(result.repeats[0].on[0]).sort()).toEqual([
      'id',
      'occurrences',
      'page',
      'store',
    ]);
  });

  it('narrows to one page on a scope, and leaves the word alone', () => {
    // Ticket 103. `downloads` on its own returns the page's findings mixed with every
    // text hit for the same word; `/downloads` is the page and nothing else.
    const findings = index([
      entry({ id: 'a', page: 'downloads', prod: 'Bekijk deals >' }),
      entry({ id: 'b', page: 'garantie', prod: 'Onze downloads staan hier' }),
    ]);

    expect(searchStore({ index: findings, term: 'downloads' }).total).toBe(2);

    const scoped = searchStore({ index: findings, term: '/downloads' });
    expect(scoped.repeats.map((one) => one.on[0].page)).toEqual(['downloads']);
    expect(scoped.total).toBe(1);
  });

  it('searches within the scope on the words after it', () => {
    const scoped = searchStore({
      index: index([
        entry({ id: 'a', page: 'downloads', prod: 'Bekijk de knop' }),
        entry({ id: 'b', page: 'downloads', prod: 'Bekijk deals >' }),
        entry({ id: 'c', page: 'garantie', prod: 'Bekijk de knop' }),
      ]),
      term: '/downloads knop',
    });

    expect(scoped.total).toBe(1);
    expect(scoped.repeats[0].on.map((one) => one.id)).toEqual(['a']);
  });

  it('merges the pages of a scope that holds several into one list', () => {
    // A substring scope reaches a family, and the result is one list of repeats over
    // all of it — the grouping is the one `repeatsInStore()` makes, as everywhere else.
    const scoped = searchStore({
      index: index([
        entry({ id: 'a', page: 'faq' }),
        entry({ id: 'b', page: 'faq/productinformatie' }),
        entry({ id: 'c', page: 'garantie' }),
      ]),
      term: '/faq',
    });

    expect(scoped.repeats).toHaveLength(1);
    expect(scoped.repeats[0].on.map((one) => one.page)).toEqual(['faq', 'faq/productinformatie']);
    expect(scoped.pages).toBe(2);
  });

  it('says which scope it answered, so the result can name the pages it matched', () => {
    // The scope rides on the result and not on a repeat: `view.test.mjs` pins what a
    // repeat's pages hold, and which pages a scope matched is a fact about the answer.
    expect(searchStore({ index: index([entry({})]), term: '/afhalen' }).scope).toBe('afhalen');
    expect(searchStore({ index: index([entry({})]), term: 'afhalen' }).scope).toBe(null);
  });

  it('reports a bare scope as a hit on the page name', () => {
    // The fields say why a row is in the result. Under a bare scope the answer is the
    // page, which is the one field the editor typed.
    expect(searchStore({ index: index([entry({})]), term: '/afhalen' }).repeats[0].fields).toEqual([
      'page',
    ]);
  });

  it('finds a key that holds a slash the way it always did', () => {
    // The trap ticket 82 recorded, kept shut. Anywhere but position 0 the slash is an
    // ordinary letter, so the term is matched against the whole opaque key.
    const findings = index([entry({ id: 'a', page: 'faq/productinformatie', prod: null })]);

    expect(searchStore({ index: findings, term: 'faq/product' }).total).toBe(1);
    expect(searchStore({ index: findings, term: '/faq/product' }).total).toBe(1);
  });

  it('answers nothing for an empty box, scope or no scope', () => {
    // An untouched box is not a search, and a slash with nothing after it is not a
    // scope — so neither of them is a term that matches everything.
    expect(searchStore({ index: index([entry({})]), term: '' }).repeats).toEqual([]);
    expect(searchStore({ index: index([entry({})]), term: '/' }).repeats).toEqual([]);
  });

  it('leaves out what the log has closed, because the default is active work', () => {
    // The state comes from the derivation the dashboard already holds, so search reads
    // the log's own answer about a finding and never a second opinion on it.
    const result = searchStore({
      index: index([entry({ id: 'a', page: 'afhalen' }), entry({ id: 'b', page: 'garantie' })]),
      term: 'deals',
      stateOf: (id) => (id === 'b' ? 'dismissed' : 'open'),
    });

    expect(result.repeats[0].on.map((one) => one.page)).toEqual(['afhalen']);
    expect(result.total).toBe(1);
    expect(result.pages).toBe(1);
  });

  it('reads a contradicted claim as open, the rule the bar already obeys', () => {
    // `fixed` is closed; `contradicted` is a fix the newest observation did not agree
    // with, and the log counts it as open. Search does not get a second opinion — it
    // asks the same question `barOf` asks, so a finding cannot be open in the bar and
    // gone from the search that is meant to find it.
    // `dismissed` is an editor closing work, so it goes with `fixed`. Those two are the
    // only states that close anything since ADR 0011 withdrew the second judgement.
    const states = { b: 'fixed', c: 'contradicted', e: 'dismissed' };
    const result = searchStore({
      index: index([
        entry({ id: 'a', page: 'afhalen' }),
        entry({ id: 'b', page: 'garantie' }),
        entry({ id: 'c', page: 'montage' }),
        entry({ id: 'e', page: 'retour' }),
      ]),
      term: 'deals',
      stateOf: (id) => states[id] ?? 'open',
    });

    expect(result.repeats[0].on.map((one) => one.page)).toEqual(['afhalen', 'montage']);
  });

  it('includes what is closed when asked to, without moving a count', () => {
    // *Inclusief afgesloten*. The two numbers are counts of the result, so they grow
    // with the result — that is search narrowing and widening what is on screen, and
    // not a count of the store's work changing. Nothing here reports on the store.
    const both = {
      index: index([entry({ id: 'a', page: 'afhalen' }), entry({ id: 'b', page: 'garantie' })]),
      term: 'deals',
      stateOf: (id) => (id === 'b' ? 'fixed' : 'open'),
    };

    expect(searchStore({ ...both, includeClosed: true }).total).toBe(2);
    expect(
      searchStore({ ...both, includeClosed: true }).repeats[0].on.map((one) => one.page),
    ).toEqual(['afhalen', 'garantie']);
    expect(searchStore(both).total).toBe(1);
  });
});

describe('searchStore, narrowed by the class pills (ticket 102)', () => {
  const index = (findings) => ({
    store: 'nl',
    pages: 4,
    builtAt: '2026-08-11T00:00:00Z',
    findings,
  });

  /** A term over three classes, which the pills then cut down. */
  const three = index([
    entry({ id: 'a', page: 'afhalen', class: 'copy', prod: 'Bekijk deals >' }),
    entry({ id: 'b', page: 'garantie', class: 'copy', prod: 'Bekijk deals >' }),
    entry({ id: 'c', page: 'montage', class: 'casing', prod: 'bekijk DEALS >' }),
    entry({ id: 'd', page: 'levering', class: 'text-missing', prod: 'Bekijk deals nu >' }),
  ]);

  it('returns what the term and the classes agree on, and never more', () => {
    // The bypass this ticket closes: before it, a term answered over every class as
    // though the pills had never been pressed. A filter the editor set does not stop
    // holding because they asked a second question.
    const result = searchStore({ index: three, term: 'deals', classes: ['copy'] });

    expect(result.repeats.map((one) => one.class)).toEqual(['copy']);
    expect(result.repeats[0].on.map((one) => one.page)).toEqual(['afhalen', 'garantie']);
  });

  it('counts the result after the narrowing, so no number disagrees with the rows', () => {
    // Both numbers are counted off the list that is drawn — the rule ticket 81 set for
    // the repeats footer. A narrowed list under the unnarrowed page count would be
    // exactly the mismatched pair that rule exists to stop.
    const result = searchStore({ index: three, term: 'deals', classes: ['copy'] });

    expect(result.total).toBe(2);
    expect(result.pages).toBe(2);
  });

  it('says how many the term matched before the classes, for the amber strip', () => {
    // The strip says *n van m*, in the same words the two views say it. `m` is what the
    // term alone found, so the sentence is about the filter and not about the term. It
    // is still a count of a result: no bar, no denominator of work, no closed count.
    const result = searchStore({ index: three, term: 'deals', classes: ['copy'] });

    expect(result.repeats).toHaveLength(1);
    expect(result.matchedRepeats).toBe(3);
  });

  it('returns exactly what it returns today when no class is on', () => {
    // This ticket adds a narrowing; it removes none. An empty selection is not a filter
    // that matches nothing — it is no filter, which is what an untouched box says.
    const withArg = searchStore({ index: three, term: 'deals', classes: [] });
    const without = searchStore({ index: three, term: 'deals' });

    // The literals first: comparing the two calls alone would be new code against new
    // code, and would still pass if both had drifted from what the term answers.
    expect(without.repeats).toHaveLength(3);
    expect(without.total).toBe(4);
    expect(without.pages).toBe(4);

    expect(withArg.repeats).toEqual(without.repeats);
    expect(withArg.total).toBe(without.total);
    expect(withArg.pages).toBe(without.pages);
  });
});

/**
 * Ticket 09. A class an editor can name is a list they can open, so the pills are a
 * **selector** as well as a filter: with nothing typed and no scope, the classes on are the
 * corpus. The refusal the empty box ships is narrowed here and never removed.
 */
describe('searchStore, opened by a class alone (ticket 09)', () => {
  const index = (findings) => ({
    store: 'nl',
    pages: 4,
    builtAt: '2026-08-11T00:00:00Z',
    findings,
  });

  /** Three classes over four pages, with no word any two of them share. */
  const three = index([
    entry({ id: 'a', page: 'afhalen', class: 'broken-link', prod: '/oude-pagina' }),
    entry({ id: 'b', page: 'garantie', class: 'broken-link', prod: '/oude-pagina' }),
    entry({ id: 'c', page: 'montage', class: 'copy', prod: 'Bekijk deals >' }),
    entry({ id: 'd', page: 'levering', class: 'casing', prod: 'bekijk DEALS >' }),
  ]);

  it('returns the repeats of that class with nothing typed', () => {
    // The gesture the whole ticket is about: an editor looking at a *Broken link* row wants
    // the rest of them, and there is no word to type — the class is the thing they mean.
    const result = searchStore({ index: three, term: '', classes: ['broken-link'] });

    expect(result.repeats.map((one) => one.class)).toEqual(['broken-link']);
    expect(result.repeats[0].on.map((one) => one.page)).toEqual(['afhalen', 'garantie']);
  });

  it('still draws nothing with no words, no scope and no class', () => {
    // The refusal is narrowed and not removed. The empty box keeps meaning the empty box,
    // and an untouched filter is still no filter rather than one matching everything.
    const result = searchStore({ index: three, term: '', classes: [] });

    expect(result.repeats).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.pages).toBe(0);
    expect(result.matchedRepeats).toBe(0);
  });

  it('reports no matched field on a row its class selected', () => {
    // Inventing one would be a lie about why the row is on screen. It matched no field:
    // what it matched on is the pill, which is on screen above it.
    const result = searchStore({ index: three, term: '', classes: ['broken-link'] });

    expect(result.repeats[0].fields).toEqual([]);
  });

  it('counts the findings and the pages off the list it draws', () => {
    // A count of the result and nothing more, exactly as a typed term's is: no bar, no
    // denominator of work and no closed count. A class query can be long and it is counted
    // as any other result.
    const result = searchStore({
      index: index([
        entry({ id: 'a', page: 'afhalen', class: 'broken-link' }),
        entry({ id: 'b', page: 'afhalen', class: 'broken-link', prod: '/tweede' }),
        entry({ id: 'c', page: 'garantie', class: 'broken-link' }),
        entry({ id: 'd', page: 'montage', class: 'copy' }),
      ]),
      term: '',
      classes: ['broken-link'],
    });

    expect(result.total).toBe(3);
    expect(result.pages).toBe(2);
  });

  it('says the class cut nothing, because on a class query it selected', () => {
    // `matchedRepeats` is the amber strip's denominator. On a class query the pill is what
    // produced the result rather than what cut it, so the strip reads *n of n*: a
    // denominator counting the whole store would say the editor's filter had thrown away
    // rows no question of theirs ever found.
    const result = searchStore({ index: three, term: '', classes: ['broken-link'] });

    expect(result.matchedRepeats).toBe(result.repeats.length);
    expect(result.matchedPages).toEqual([
      { store: 'nl', page: 'afhalen' },
      { store: 'nl', page: 'garantie' },
    ]);
  });

  it('opens an `information` class exactly as a `work` one', () => {
    // Visibility gates deciding and never reading. Nothing here asks what a class is for,
    // which is why this needs no case of its own in the selector — and why the index's own
    // `work`-only rule stays `addPage`'s decision and not this function's.
    const result = searchStore({
      index: index([entry({ id: 'a', page: 'afhalen', class: 'restructured' })]),
      term: '',
      classes: ['restructured'],
    });

    expect(result.repeats.map((one) => one.class)).toEqual(['restructured']);
    expect(result.repeats[0].fields).toEqual([]);
  });

  it('leaves a closed row out until asked, as a typed term does', () => {
    // A class query is a search and not a queue: *Include closed* means over it exactly
    // what it means over a term, and nothing here records that the list was ever drawn.
    const both = {
      index: three,
      term: '',
      classes: ['broken-link'],
      stateOf: (id) => (id === 'b' ? 'fixed' : 'open'),
    };

    expect(searchStore(both).total).toBe(1);
    expect(searchStore({ ...both, includeClosed: true }).total).toBe(2);
  });

  it('narrows to the words once they are typed, and to the class after', () => {
    // The second half of the same box: a term and a class together narrow exactly as they
    // did before this ticket — the term decides what matched, the classes decide which of
    // it is on screen — so a wide queue narrows without the editor starting again.
    const wide = searchStore({ index: three, term: '', classes: ['broken-link'] });
    const narrowed = searchStore({ index: three, term: 'garantie', classes: ['broken-link'] });

    expect(wide.total).toBe(2);
    expect(narrowed.repeats[0].on.map((one) => one.page)).toEqual(['garantie']);
    expect(narrowed.repeats[0].fields).toEqual(['page']);
  });

  it('keeps a bare scope a hit on the page name, with a class on', () => {
    // The guard this ticket narrows is load-bearing: it is what makes a bare scope a hit
    // on the page it named. A scope is a selector too, so the classes go back to cutting
    // what it found rather than selecting beside it.
    const result = searchStore({ index: three, term: '/garantie', classes: ['broken-link'] });

    expect(result.repeats[0].on.map((one) => one.page)).toEqual(['garantie']);
    expect(result.repeats[0].fields).toEqual(['page']);
    expect(
      searchStore({ index: three, term: '/montage', classes: ['broken-link'] }).repeats,
    ).toEqual([]);
  });
});

/**
 * Ticket 104 part A. An editor scopes to a page, gets nothing back, and the screen says
 * **which** nothing it is. The kinds are decided here, as a value, and the component
 * renders one — it classifies nothing itself.
 */
describe('explainScope', () => {
  /** An index over the entries given, as the store page would have loaded it. */
  const index = (findings) => ({
    store: 'nl',
    pages: 3,
    builtAt: '2026-08-11T00:00:00Z',
    findings,
  });

  /** One page of the store's load-time list, as `loadSummaries()` writes it. */
  const page = (part) => ({
    store: 'nl',
    page: 'afhalen',
    comparable: true,
    skipReason: null,
    findings: [],
    ...part,
  });

  it('says a scope reached no page at all, which is what a typo looks like', () => {
    // The first of the four. `/dwonloads` matches no key, and the answer is to type it
    // again — which is a different answer from every other empty result on this screen.
    const result = searchStore({
      index: index([entry({ page: 'downloads' })]),
      term: '/dwonloads',
    });

    expect(explainScope({ pages: [page({ page: 'downloads' })], result })).toEqual({
      scope: 'dwonloads',
      state: 'no-such-page',
      pages: [],
    });
  });

  it('names a one-sided page as one, and carries the reason the comparison did not run', () => {
    // The second. The page exists, it is in the store and it is in the one-sided pages
    // aside — but one side did not answer, so it is compared nowhere and indexed nowhere.
    // Silence here is the search contradicting the aside on the same screen.
    const result = searchStore({ index: index([]), term: '/kerst' });

    expect(
      explainScope({
        pages: [page({ page: 'kerstactie', comparable: false, skipReason: 'new site: 404' })],
        result,
      }),
    ).toEqual({
      scope: 'kerst',
      state: 'found',
      pages: [{ store: 'nl', page: 'kerstactie', kind: 'one-sided', skipReason: 'new site: 404' }],
    });
  });

  it('says a page the result holds rows on matched, which is the not-nothing case', () => {
    // The kinds are told apart from each other and not only from silence: a page that
    // answered has to read differently from all four, or the answer says nothing.
    const result = searchStore({
      index: index([entry({ page: 'downloads' })]),
      term: '/downloads',
    });

    expect(explainScope({ pages: [page({ page: 'downloads' })], result }).pages).toEqual([
      { store: 'nl', page: 'downloads', kind: 'matched', skipReason: null },
    ]);
  });

  it('does not call a page clean when its differences are all closed', () => {
    // The fifth kind, which the ticket's four do not name. *Clean* is "nothing is wrong
    // with it"; a page whose every difference somebody accepted had something wrong and
    // is finished. CONTEXT.md already tells *3 agreeing blocks* from *nothing left to do*,
    // so this is the vocabulary's own split and not a new one.
    const result = searchStore({
      index: index([entry({ id: 'a', page: 'downloads' })]),
      term: '/downloads',
      stateOf: () => 'dismissed',
    });

    expect(
      explainScope({
        pages: [page({ page: 'downloads', findings: [{ id: 'a', class: 'text-missing' }] })],
        result,
      }).pages,
    ).toEqual([{ store: 'nl', page: 'downloads', kind: 'no-open-work', skipReason: null }]);
  });

  it('says a compared page with no difference on it is clean', () => {
    // The third of the four, and the answer an editor most wants — compared, and nothing
    // wrong with it. It is the one that is today indistinguishable from the typo above,
    // which is a parity tool arguing against its own purpose.
    const result = searchStore({ index: index([entry({ page: 'garantie' })]), term: '/downloads' });

    expect(
      explainScope({ pages: [page({ page: 'downloads', findings: [] })], result }).pages,
    ).toEqual([{ store: 'nl', page: 'downloads', kind: 'clean', skipReason: null }]);
  });

  it('says the second term found nothing on a page that does hold differences', () => {
    // The fourth. The page is fine, the scope is fine, the word is not on it — a different
    // sentence from *this page is clean*, and the one that keeps a scope usable as a
    // spot-check. Which of the two it is turns on whether a second term was typed at all,
    // so the parse rides back on the result and is never run a second time.
    const result = searchStore({
      index: index([entry({ id: 'a', page: 'downloads', prod: 'Bekijk deals >' })]),
      term: '/downloads knop',
    });

    expect(
      explainScope({
        pages: [page({ page: 'downloads', findings: [{ id: 'a', class: 'text-missing' }] })],
        result,
      }).pages,
    ).toEqual([{ store: 'nl', page: 'downloads', kind: 'no-match', skipReason: null }]);
  });

  it('answers per page, so a scope over mixed kinds does not collapse to one verdict', () => {
    // A scope is a substring and often reaches a family, and the members can be of
    // different kinds. One sentence over all of them would be false about most of them.
    const result = searchStore({ index: index([]), term: '/kerst' });

    expect(
      explainScope({
        pages: [
          page({ page: 'kerstactie', comparable: false, skipReason: 'new site: 404' }),
          page({ page: 'kerstboom' }),
        ],
        result,
      }).pages,
    ).toEqual([
      { store: 'nl', page: 'kerstactie', kind: 'one-sided', skipReason: 'new site: 404' },
      { store: 'nl', page: 'kerstboom', kind: 'clean', skipReason: null },
    ]);
  });

  it('does not let a class pill decide which kind of nothing a page is', () => {
    // A filter moves no bar, no denominator and no count (CONTEXT.md), and a verdict is
    // none of those three only because it is worse: a `casing` pill over a page whose open
    // work is all `copy` would have the screen say *every difference on it is closed*,
    // which is false and which the editor's own filter made true-looking. The strip above
    // says what the classes cut; this says what the term found, and the two are not one job.
    const findings = index([entry({ id: 'a', page: 'downloads', class: 'copy' })]);

    expect(
      explainScope({
        pages: [page({ page: 'downloads', findings: [{ id: 'a', class: 'copy' }] })],
        result: searchStore({ index: findings, term: '/downloads', classes: ['casing'] }),
      }).pages,
    ).toEqual([{ store: 'nl', page: 'downloads', kind: 'matched', skipReason: null }]);
  });

  it('classifies the sibling’s pages too, and says which store each is on (ticket 05)', () => {
    // The scope crosses the block because the **corpus** does. A scope narrows what the
    // search runs over, the search now runs over two stores' indexes, and a header that
    // listed one store's pages under a result holding both would be the same disagreement
    // between two halves of one screen that this ticket exists to close.
    const result = searchStore({
      index: index([
        entry({ id: 'a', store: 'nl', page: 'downloads' }),
        entry({ id: 'b', store: 'be', page: 'downloads-be' }),
      ]),
      term: '/downloads',
    });

    expect(
      explainScope({
        pages: [page({ page: 'downloads' }), page({ store: 'be', page: 'downloads-be' })],
        result,
      }),
    ).toEqual({
      scope: 'downloads',
      state: 'found',
      pages: [
        { store: 'nl', page: 'downloads', kind: 'matched', skipReason: null },
        { store: 'be', page: 'downloads-be', kind: 'matched', skipReason: null },
      ],
    });
  });

  it('does not call a sibling page no such page, which is the typo’s answer', () => {
    // The acceptance criterion said as its own line. A scope reaching only the sibling used
    // to reach no page of *this* store, and the screen answered *check the spelling* about
    // a page that exists and holds rows in the list below it.
    const result = searchStore({
      index: index([entry({ id: 'b', store: 'be', page: 'pergola' })]),
      term: '/pergola',
    });

    expect(explainScope({ pages: [page({ store: 'be', page: 'pergola' })], result })).toEqual({
      scope: 'pergola',
      state: 'found',
      pages: [{ store: 'be', page: 'pergola', kind: 'matched', skipReason: null }],
    });
  });

  it('tells two stores’ copies of one page key apart', () => {
    // `afhalen` is a page of both stores of a block, and they are two pages. `be/afhalen`
    // answering must not make `nl/afhalen` read as matched — an editor would be told a page
    // holds rows it holds none of, and would go looking for them.
    const result = searchStore({
      index: index([entry({ id: 'b', store: 'be', page: 'afhalen' })]),
      term: '/afhalen',
    });

    expect(
      explainScope({
        pages: [
          page({ store: 'nl', page: 'afhalen', findings: [{ class: 'copy' }] }),
          page({ store: 'be', page: 'afhalen' }),
        ],
        result,
      }).pages,
    ).toEqual([
      { store: 'nl', page: 'afhalen', kind: 'no-open-work', skipReason: null },
      { store: 'be', page: 'afhalen', kind: 'matched', skipReason: null },
    ]);
  });

  it('has nothing to explain about a term that carries no scope', () => {
    // The four kinds are a scope's kinds. An ordinary term answers over the whole store,
    // where *nothing found* is the whole of what can truthfully be said.
    const result = searchStore({ index: index([entry({})]), term: 'downloads' });
    expect(explainScope({ pages: [page({ page: 'downloads' })], result })).toBe(null);
  });
});

/** An override event, as the log appends them. */
const event = (part) => ({
  createdAt: '2026-08-10T09:00:00Z',
  editor: 'Dennis',
  scope: 'finding',
  action: 'dismissed',
  store: 'nl',
  page: 'afhalen',
  findingId: 'a',
  note: 'Bekijk deals staat er bewust nog',
  ...part,
});

/**
 * The log, read. Ticket 123: `searchNotes()` takes the whole read and not the events
 * alone, because the events on their own cannot say whether they are all of them. Every
 * case below that is about *finding* a note passes this, and the three cases about the
 * log's own state pass something else on purpose.
 */
const read = (events) => ({ events, ready: true, error: null, connected: true });

describe('searchNotes', () => {
  it('finds a note by its words, and says it is live', () => {
    // The other half of the answer, and the other freshness. A note lives in the log
    // and is not in the index — it is filtered from the events the store page already
    // loaded, so it is as new as the last read and not as old as the last build. The
    // flag is on the result because a caller drawing one list has to be able to say
    // which half it is drawing.
    const result = searchNotes({
      log: read([event({}), event({ findingId: 'b', note: 'Wacht op copy' })]),
      term: 'deals',
    });

    expect(result.live).toBe(true);
    expect(result.state).toBe('answered');
    expect(result.notes.map((one) => one.findingId)).toEqual(['a']);
  });

  it('finds only the note that still stands, not the one written over', () => {
    // The table is append-only, so the words an editor withdrew are still in it. A
    // search that returned them would offer a reason for a decision that has since
    // been taken back. The filter is `latestByKey()` — the log's own answer to *which
    // event counts* — so a cleared finding has no note to find either.
    const result = searchNotes({
      log: read([
        event({ note: 'Bekijk deals staat er bewust nog' }),
        event({ createdAt: '2026-08-11T09:00:00Z', action: 'cleared', note: null }),
        event({ findingId: 'b', createdAt: '2026-08-09T09:00:00Z', note: 'deals: oude reden' }),
        event({ findingId: 'b', createdAt: '2026-08-11T10:00:00Z', note: 'deals: nieuwe reden' }),
      ]),
      term: 'deals',
    });

    expect(result.notes.map((one) => one.note)).toEqual(['deals: nieuwe reden']);
  });

  /**
   * Ticket 83. A page note reaches search through this function and not through the build
   * index: it is written in the log after the build, so indexing it would be indexing a
   * moment that has already passed.
   */
  it('finds a page note, which is the second thing living in the note column', () => {
    const result = searchNotes({
      log: read([
        event({
          scope: 'page',
          action: 'noted',
          findingId: null,
          note: 'Campagne-update volgt',
        }),
      ]),
      term: 'campagne',
    });

    expect(result.notes.map((one) => one.note)).toEqual(['Campagne-update volgt']);
  });

  it('says which of the two kinds of note it found, so the two can be drawn apart', () => {
    // The ticket's trap: a dismissal note explains one judgement about two strings, and a
    // page note explains nothing in particular. A result that could not tell them apart
    // would leave the interface to guess, and the interface must not have to.
    const result = searchNotes({
      log: read([
        event({ note: 'zelfde woord hier' }),
        event({
          scope: 'page',
          action: 'noted',
          findingId: null,
          note: 'zelfde woord daar',
          // Newer, so the order below is the sort doing its job and not two events
          // arriving in the same millisecond and landing however they were listed.
          createdAt: '2026-08-11T09:00:00Z',
        }),
      ]),
      term: 'zelfde woord',
    });

    expect(result.notes.map((one) => one.scope)).toEqual(['page', 'finding']);
    expect(result.notes.map((one) => one.action)).toEqual(['noted', 'dismissed']);
  });

  it('does not find a page note an editor took back', () => {
    // Cleared with an empty note, which is how ticket 83 clears one. The words are still
    // in the append-only table and they are no longer what the page says.
    const result = searchNotes({
      log: read([
        event({ scope: 'page', action: 'noted', findingId: null, note: 'Campagne-update volgt' }),
        event({
          scope: 'page',
          action: 'noted',
          findingId: null,
          note: '',
          createdAt: '2026-08-11T09:00:00Z',
        }),
      ]),
      term: 'campagne',
    });

    expect(result.notes).toEqual([]);
  });

  it('reaches every page under a term that carries no scope', () => {
    // The narrowing ticket 104 adds and nothing else: an ordinary term is still answered
    // over the whole log, which is what part B promises to leave alone.
    const result = searchNotes({
      log: read([
        event({}),
        event({
          page: 'garantie',
          findingId: 'b',
          note: 'deals ook hier',
          createdAt: '2026-08-11T09:00:00Z',
        }),
      ]),
      term: 'deals',
    });

    expect(result.notes.map((one) => one.page)).toEqual(['garantie', 'afhalen']);
  });

  it('does not let a page note hide the review of the same page', () => {
    // The two are different keys on one scope. A note that displaced the review here
    // would be the collision `eventKey()` exists to prevent, showing up in search.
    const result = searchNotes({
      log: read([
        event({ scope: 'page', action: 'reviewed', findingId: null, note: 'deals gezien' }),
        event({
          scope: 'page',
          action: 'noted',
          findingId: null,
          note: 'deals nog niet',
          createdAt: '2026-08-11T09:00:00Z',
        }),
      ]),
      term: 'deals',
    });

    expect(result.notes.map((one) => one.action)).toEqual(['noted', 'reviewed']);
  });
});

/**
 * Ticket 104 part B. A scope narrows **both** halves of the answer or it narrows neither
 * honestly: `/downloads` answering about the downloads page above and about the whole store
 * below is one screen giving two answers to one question.
 *
 * The field narrowed on is the event's **own** page — where the note was written — and not
 * the page a finding sits on. It is the same substring rule the findings half runs, through
 * `inScope()` rather than through a second `includes` written out here.
 */
describe('searchNotes, under a page scope', () => {
  it('narrows the notes to the pages the scope reached', () => {
    const result = searchNotes({
      log: read([event({}), event({ page: 'garantie', findingId: 'b', note: 'deals ook hier' })]),
      term: '/afhalen',
    });

    expect(result.notes.map((one) => one.page)).toEqual(['afhalen']);
  });

  it('answers a bare scope with the notes on that page and not with nothing', () => {
    // The empty box and a bare scope are two different silences. `/afhalen` is a search
    // *for the page*, so every note on it is the answer; an empty box has been asked
    // nothing and answers with nothing, which is the case below.
    const result = searchNotes({
      log: read([event({ note: 'niets van dit woord' })]),
      term: '/afhalen',
    });

    expect(result.notes.map((one) => one.note)).toEqual(['niets van dit woord']);
  });

  it('narrows by the second term as well, so both halves of the typing count', () => {
    const result = searchNotes({
      log: read([
        event({ note: 'deals blijft staan' }),
        event({ findingId: 'b', note: 'wacht op copy' }),
        event({ page: 'garantie', findingId: 'c', note: 'deals ook hier' }),
      ]),
      term: '/afhalen deals',
    });

    expect(result.notes.map((one) => one.note)).toEqual(['deals blijft staan']);
  });

  it('reaches a scope by substring, exactly as the findings half does', () => {
    // `/afhal` reaching `deals-afhalen` is `inScope()`'s rule and not a second one: one
    // substring match over one page key, in both halves of the screen.
    const result = searchNotes({
      log: read([event({ page: 'deals-afhalen' })]),
      term: '/afhal',
    });

    expect(result.notes).toHaveLength(1);
  });

  it('offers no note an editor took back, not even under a bare scope', () => {
    // The bare scope has no words to match, so nothing about the note's text stands
    // between a cleared note and the screen. `latestByKey()` still does: the clearing is
    // the newest event on the key and it carries no words.
    const result = searchNotes({
      log: read([
        event({ scope: 'page', action: 'noted', findingId: null, note: 'Campagne volgt' }),
        event({
          scope: 'page',
          action: 'noted',
          findingId: null,
          note: '',
          createdAt: '2026-08-11T09:00:00Z',
        }),
      ]),
      term: '/afhalen',
    });

    expect(result.notes).toEqual([]);
  });

  it('carries the parse back, so the block above it is not a second reading of the slash', () => {
    // What part A did for the findings half: one string, one parse. A caller naming the
    // scope over the notes reads it off the answer it is drawing.
    const result = searchNotes({ log: read([event({})]), term: '/afhalen deals' });

    expect(result.scope).toBe('afhalen');
    expect(result.text).toBe('deals');
  });

  it('answers an empty box with nothing, which is what it was asked', () => {
    const result = searchNotes({ log: read([event({})]), term: '' });

    expect(result.state).toBe('answered');
    expect(result.notes).toEqual([]);
    expect(result.scope).toBe(null);
  });
});

/**
 * Ticket 123. The three cases nobody can reach by hand: the moment before the log
 * arrives, the log that did not arrive, and the log there is no connection to. Each one
 * used to be an empty array, which reads on screen as *there are no notes about this* —
 * a false statement wearing the same clothes as a true one.
 */
describe('searchNotes, before the log has answered', () => {
  it('says it is still reading, and offers no notes to draw', () => {
    const result = searchNotes({
      log: { events: null, ready: false, error: null, connected: true },
      term: 'deals',
    });

    expect(result.state).toBe('reading');
    expect(result.live).toBe(true);
    // Not an empty array. A caller that ignored the state would draw *no notes* from
    // one, which is the bug; there is nothing here to draw it from.
    expect(result.notes).toBeUndefined();
  });

  it('says the log was not read, and why', () => {
    const result = searchNotes({
      log: { events: null, ready: false, error: 'TypeError: Failed to fetch', connected: true },
      term: 'deals',
    });

    expect(result.state).toBe('failed');
    expect(result.reason).toBe('TypeError: Failed to fetch');
    expect(result.notes).toBeUndefined();
  });

  it('reads an unconnected log as one that could not be read, and gives its reason', () => {
    // No project configured is not an error the editor caused, and `LogBanner` draws it
    // in its own words above. Here it collapses into *the log could not be read*,
    // because that is what is true of the notes half: there is no log to read.
    const result = searchNotes({
      log: {
        events: null,
        ready: false,
        error: null,
        connected: false,
        notConnectedReason: 'PUBLIC_SUPABASE_URL is not set.',
      },
      term: 'deals',
    });

    expect(result.state).toBe('failed');
    expect(result.reason).toBe('PUBLIC_SUPABASE_URL is not set.');
  });

  it('answers the moment the log arrives, with no second call and no reload', () => {
    // The state is derived from the read and never latched, so the same term against a
    // log that has since answered is an answer. This is the recovery the ticket asks
    // for: nothing here remembers having failed.
    const events = [event({})];

    expect(searchNotes({ log: { events: null, ready: false }, term: 'deals' }).state).toBe(
      'reading',
    );
    expect(searchNotes({ log: read(events), term: 'deals' }).notes).toHaveLength(1);
  });

  it('answers from the last good read when a later write failed', () => {
    // `LogBanner`'s own distinction: an error over a log that *was* read leaves the
    // events standing, and it says so rather than throwing away what is on screen. The
    // notes half follows it — the read is what this half depends on, and it succeeded.
    const result = searchNotes({
      log: { events: [event({})], ready: true, error: 'insert failed', connected: true },
      term: 'deals',
    });

    expect(result.state).toBe('answered');
    expect(result.notes).toHaveLength(1);
  });

  it('cannot be told that an unread log holds nothing', () => {
    // The review's second finding, at this seam. `searchNotes` used to coerce
    // `log.events ?? []` on the answered branch, so a caller claiming `ready` over no
    // events got a confident empty answer — the very lie, one layer down and now with a
    // state field beside it saying `answered`. The coercion is gone, so the contradiction
    // breaks where it stands instead of being drawn.
    expect(() => searchNotes({ log: { events: null, ready: true }, term: 'deals' })).toThrow();
  });

  it('answers with nothing for a log that was read and holds no match', () => {
    // The true statement this ticket exists to keep sayable, and the one case that may
    // draw an empty block.
    const result = searchNotes({ log: read([event({})]), term: 'niets hiervan' });

    expect(result.state).toBe('answered');
    expect(result.notes).toEqual([]);
  });
});

/**
 * The bridge out of a page and into the surface that decides across pages. An editor
 * fixing a page meets a difference that is a judgement rather than a defect, and the
 * judgement is the one action that was never about this page.
 *
 * The link is a **search**, so the thing worth pinning is not its string but what the
 * search does with it: the words and the class have to be enough to reach every page
 * holding the same difference, and nothing else.
 */
describe('the link a page makes to a repeat', () => {
  const words = '*Prijzen zijn exclusief lopende acties';

  /** The store's index, as the dashboard would have loaded it. */
  const index = (findings) => ({
    store: 'nl',
    pages: 3,
    builtAt: '2026-08-11T00:00:00Z',
    findings,
  });

  const held = (id, page) => entry({ id, page, class: 'casing', prod: words, new: `${words}.` });

  /** The dashboard, opened on what the link asked for. */
  const opened = (finding, findings) => {
    const screen = screenFromSearch(searchForRepeat(finding));
    return searchStore({ index: index(findings), term: screen.query, classes: screen.classes });
  };

  it('finds the difference on every page that holds it, as one row', () => {
    const result = opened({ store: 'nl', class: 'casing', prod: words, new: `${words}.` }, [
      held('a', 'zonwering/prijzen'),
      held('b', 'zonwering/plisse'),
      // The same words, demoted rather than repunctuated. A different class is a
      // different repeat, and the pill the link carries is what keeps them apart.
      entry({ id: 'c', page: 'montage', class: 'copy', prod: words, new: 'Prijzen op aanvraag' }),
    ]);

    expect(result.repeats).toHaveLength(1);
    expect(result.repeats[0].on.map((one) => one.page)).toEqual([
      'zonwering/prijzen',
      'zonwering/plisse',
    ]);
  });
});

/**
 * The all-stores screen, as the two halves the ticket separates: the corpus is six indexes
 * merged, and the press that opens it is a class label writing a class with nothing typed
 * (ticket 03).
 *
 * It is here and not in a component test because none of it is drawing: the widening is a
 * merge and a query string, and both are values.
 */
describe('the search corpus over every store', () => {
  const index = (store, findings) => ({
    store,
    pages: findings.length,
    builtAt: '2026-08-11T00:00:00Z',
    findings,
  });

  /** One broken link on each of the six stores, with the same target on all of them. */
  const everywhere = ['nl', 'be', 'be_fr', 'de', 'fr', 'uk'].map((store) =>
    index(store, [
      entry({ id: store, store, class: 'broken-link', prod: '/max.svg', new: null, linkText: [] }),
    ]),
  );

  it('opens a class over every store from the label on a row', () => {
    // The gesture end to end: *Broken link* on an `nl` row is a class and an empty query,
    // read back as a screen, run over the merged corpus. Six stores, one queue.
    const screen = screenFromSearch(searchForClass('broken-link'));
    const result = searchStore({
      index: mergeIndexes(everywhere),
      term: screen.query,
      classes: screen.classes,
    });

    expect(result.total).toBe(6);
    expect(result.repeats.flatMap((one) => one.stores).sort()).toEqual([
      'be',
      'be_fr',
      'de',
      'fr',
      'nl',
      'uk',
    ]);
  });

  it('leaves the repeat corpus where it is: four rows for one string on six stores', () => {
    // Reading crosses any store; pressing crosses only a language block. So the widening is
    // visible in the corpus and **not** in the grouping — `{nl, be}` and `{be_fr, fr}` are
    // one row each, and `de` and `uk` are alone. Ticket 04 is what moves this number.
    const result = searchStore({
      index: mergeIndexes(everywhere),
      term: '',
      classes: ['broken-link'],
    });

    expect(result.repeats).toHaveLength(4);
  });

  it('says which store every page of a result is on', () => {
    // A merged list with no store on a page is ambiguous the moment two stores carry the
    // same key, and every store carries `afhalen`.
    const result = searchStore({
      index: mergeIndexes([
        index('nl', [entry({ id: 'a', store: 'nl', page: 'afhalen' })]),
        index('de', [entry({ id: 'b', store: 'de', page: 'afhalen' })]),
      ]),
      term: 'deals',
    });

    expect(result.matchedPages).toEqual([
      { store: 'nl', page: 'afhalen' },
      { store: 'de', page: 'afhalen' },
    ]);
  });

  it('finds a note written on any store, because reading moves no count', () => {
    // The amendment this ticket writes into `CONTEXT.md`. `eventsOfStores()` narrowed the log
    // to the store whose screen it was, on the reasoning that a cross-store search is the back
    // door to a cross-store surface. A screen that is **above** the stores is not that door:
    // it reads, and reading moves no count.
    const note = (store) => ({
      store,
      page: 'afhalen',
      scope: 'page',
      action: 'noted',
      note: `max.svg is on the ${store} banner`,
      editor: 'Ana',
      createdAt: '2026-08-12T00:00:00Z',
    });

    const answer = searchNotes({
      log: { events: [note('nl'), note('uk')], ready: true, connected: true },
      term: 'max.svg',
    });

    expect(answer.state).toBe('answered');
    expect(answer.notes.map((one) => one.store).sort()).toEqual(['nl', 'uk']);
  });
});
