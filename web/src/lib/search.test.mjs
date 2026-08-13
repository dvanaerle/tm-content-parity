import { describe, expect, it } from 'vitest';
import {
  SEARCH_FIELDS, addPage, emptyIndex, indexStore, matchedFields, searchNotes, searchStore,
} from './search.mjs';

/**
 * Ticket 82. An editor types the words and sees every finding that holds them, across
 * every page of the store. The index is what the build emits so that can happen with
 * no service and no search library.
 */

/** @param {Partial<import('../../../compare/contract.mjs').Finding>} part */
const finding = (part) => ({
  id: 'a', store: 'nl', page: 'afhalen', check: 'text', class: 'text-missing',
  prod: 'Bekijk deals >', new: null, detail: null, anchorHeading: 'Montage', occurrences: 1,
  score: null, ...part,
});

/**
 * A report as `compare/30-compare.mjs` writes it, cut to what the index reads. The
 * extracts are the large half — 54 MB over the corpus — and the point of the index is
 * that it holds none of them.
 */
const report = ({
  page = 'afhalen', store = 'nl', findings = [finding({})], links = {}, comparable = true,
} = {}) => ({
  store,
  page,
  comparable,
  skipReason: null,
  findings,
  rows: [{ prod: 0, new: null, class: 'text-missing', score: null, finding: 'a' }],
  summary: { shown: findings.length, hidden: 0, total: findings.length, byClass: {}, byCheck: {} },
  observationId: '2026-08-11T00:00:00Z-1',
  findingSetHash: 'hash',
  builtAt: '2026-08-11T00:00:00Z',
  sides: {
    production: {
      url: 'https://www.tuinmaximaal.nl/afhalen',
      status: 200,
      elements: [{ index: 0, tag: 'p', kind: 'text', level: null, raw: 'Bekijk deals >', norm: 'Bekijk deals >' }],
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
    expect(Object.keys(index.findings[0]).sort()).toEqual(
      ['anchorHeading', 'class', 'detail', 'id', 'linkText', 'new', 'occurrences', 'page', 'prod'],
    );
  });

  it('carries the page of every finding, because the result says which pages', () => {
    const index = indexStore('nl', [report({ page: 'garantie' })]);
    expect(index.findings[0].page).toBe('garantie');
  });

  it('leaves out a hidden class, for the reason the bar leaves it out', () => {
    // `text-added` is content the new site invented, and ticket 33 hides it. A search
    // that returned it would offer work the log does not count.
    const index = indexStore('nl', [report({
      findings: [finding({ id: 'a' }), finding({ id: 'b', class: 'text-added', prod: null, new: 'Bekijk deals >' })],
    })]);

    expect(index.findings.map((entry) => entry.id)).toEqual(['a']);
  });

  it('resolves the link text a links finding does not carry', () => {
    // A links finding holds the **target** in `prod` and `new` — the host-folded
    // `linkKey` — and the anchor text is nowhere on it. The words an editor types are
    // the words on the page, so the build reads them off the extract's link records.
    // This is the one field the dashboard's own finding index cannot derive, and it is
    // why the index is emitted rather than assembled in the browser.
    const index = indexStore('nl', [report({
      findings: [finding({
        check: 'links', class: 'link-target', prod: 'self/terrasoverkapping', new: 'other/terrasoverkapping',
      })],
      links: {
        production: [{ index: 3, href: '/terrasoverkapping', url: '', key: 'self/terrasoverkapping', text: 'Bekijk deals >', internal: true }],
        new: [{ index: 3, href: '/terrasoverkapping', url: '', key: 'other/terrasoverkapping', text: 'Bekijk aanbiedingen', internal: true }],
      },
    })]);

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
  id: 'a', page: 'afhalen', class: 'text-missing', prod: 'Bekijk deals >', new: null,
  detail: null, anchorHeading: 'Montage', occurrences: 1, linkText: [], ...part,
});

describe('matchedFields', () => {
  it('names six fields and no more', () => {
    // The ticket asks for six, and the answer says which of the six matched. A
    // seventh name would be a field an editor was never told they could search.
    expect(SEARCH_FIELDS).toEqual(
      ['page', 'prodText', 'newText', 'linkTarget', 'linkText', 'anchorHeading'],
    );
  });

  it('finds a finding by its production text', () => {
    expect(matchedFields(entry({ prod: 'Bekijk deals >' }), 'bekijk deals >')).toEqual(['prodText']);
  });

  it('finds a finding by its new-site text', () => {
    expect(matchedFields(entry({ prod: null, new: 'Bekijk aanbiedingen' }), 'aanbiedingen'))
      .toEqual(['newText']);
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
      class: 'link-target', prod: 'self/deals', new: null, linkText: ['Bekijk deals >'],
    });
    expect(matchedFields(links, 'bekijk')).toEqual(['linkText']);
  });

  it('finds a finding by the heading it sits under', () => {
    expect(matchedFields(entry({ prod: null, anchorHeading: 'Montage' }), 'montage'))
      .toEqual(['anchorHeading']);
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

describe('searchStore', () => {
  /** An index over the entries given, as the store page would have loaded it. */
  const index = (findings) => ({ store: 'nl', pages: 3, builtAt: '2026-08-11T00:00:00Z', findings });

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
    // Decision 3. `view.test.mjs` pins the keys of a `Repeat.on` entry to exactly
    // `['id', 'occurrences', 'page']`, so a search that hung the matched field there
    // would break ticket 81's derivation for the view that has nothing to do with
    // search. The row is what matched; the pages are only where it is.
    const result = searchStore({
      index: index([entry({ prod: 'Montage inbegrepen', anchorHeading: 'Montage' })]),
      term: 'montage',
    });

    expect(result.repeats[0].fields).toEqual(['prodText', 'anchorHeading']);
    expect(Object.keys(result.repeats[0].on[0]).sort()).toEqual(['id', 'occurrences', 'page']);
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

    expect(result.repeats[0].on.map((one) => one.page))
      .toEqual(['afhalen', 'montage']);
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
    expect(searchStore({ ...both, includeClosed: true }).repeats[0].on.map((one) => one.page))
      .toEqual(['afhalen', 'garantie']);
    expect(searchStore(both).total).toBe(1);
  });
});

describe('searchStore, narrowed by the class pills (ticket 102)', () => {
  const index = (findings) => ({ store: 'nl', pages: 4, builtAt: '2026-08-11T00:00:00Z', findings });

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

/** An override event, as the log appends them. */
const event = (part) => ({
  createdAt: '2026-08-10T09:00:00Z', editor: 'Dennis', scope: 'finding', action: 'dismissed',
  store: 'nl', page: 'afhalen', findingId: 'a', note: 'Bekijk deals staat er bewust nog',
  ...part,
});

describe('searchNotes', () => {
  it('finds a note by its words, and says it is live', () => {
    // The other half of the answer, and the other freshness. A note lives in the log
    // and is not in the index — it is filtered from the events the store page already
    // loaded, so it is as new as the last read and not as old as the last build. The
    // flag is on the result because a caller drawing one list has to be able to say
    // which half it is drawing.
    const result = searchNotes({ events: [event({}), event({ findingId: 'b', note: 'Wacht op copy' })], term: 'deals' });

    expect(result.live).toBe(true);
    expect(result.notes.map((one) => one.findingId)).toEqual(['a']);
  });

  it('finds only the note that still stands, not the one written over', () => {
    // The table is append-only, so the words an editor withdrew are still in it. A
    // search that returned them would offer a reason for a decision that has since
    // been taken back. The filter is `latestByKey()` — the log's own answer to *which
    // event counts* — so a cleared finding has no note to find either.
    const result = searchNotes({
      events: [
        event({ note: 'Bekijk deals staat er bewust nog' }),
        event({ createdAt: '2026-08-11T09:00:00Z', action: 'cleared', note: null }),
        event({ findingId: 'b', createdAt: '2026-08-09T09:00:00Z', note: 'deals: oude reden' }),
        event({ findingId: 'b', createdAt: '2026-08-11T10:00:00Z', note: 'deals: nieuwe reden' }),
      ],
      term: 'deals',
    });

    expect(result.notes.map((one) => one.note)).toEqual(['deals: nieuwe reden']);
  });
});
