import { describe, expect, it } from 'vitest';
import { STORES } from '../../../compare/vocabulary.mjs';
import { TRANSLATED_ELSEWHERE, listReading } from './list-reading.mjs';
import { repeatsInStore } from './view.mjs';

/**
 * One reading of one screen, asked about one row (code health 05, ADR 0030).
 *
 * Everything here is a value: a store or none goes in, a repeat is asked about, and what
 * comes out is what an editor or a screen reader would meet — the sentence a refusal says,
 * the language a row declares, whether a store is named, where a link goes. The press rule
 * used to be provable only by mounting a repeat list four levels above the code that decides
 * it, so a browser test was the only witness that a refusal said the right sentence.
 */

const finding = (id, cls, prod, next) => ({
  id,
  class: cls,
  prod,
  new: next,
  detail: null,
  occurrences: 1,
});

const on = (store, page, ...findings) => ({ store, page, findings });

/**
 * The repeats are built by **`repeatsInStore()` itself** and never written out as literals,
 * for the reason the browser fixtures are not: a literal drifts from the derivation the
 * moment it gains a field, and which stores a difference groups over — the whole subject
 * here — is that function's answer and not a fixture's.
 */
const repeatOf = (...pages) => repeatsInStore(pages)[0];

/** Translated words on one store: a `copy` difference, whose corpus is a language block. */
const translated = repeatOf(on('nl', 'overkapping', finding('f1', 'copy', 'oud', 'nieuw')));

/** The same words on both stores of a block. `nl` and `be` share Dutch, so this is one row. */
const acrossBlock = repeatOf(
  on('nl', 'afhalen', finding('f1', 'copy', 'oud', 'nieuw')),
  on('be', 'afhalen', finding('f2', 'copy', 'oud', 'nieuw')),
);

/** One filename on all six stores: the same string everywhere, so one difference. */
const everywhere = repeatOf(
  ...STORES.map((store, at) =>
    on(store, 'afhalen', finding(`f${at}`, 'image-missing', 'max.svg', null)),
  ),
);

/** A page title, which every store writes in its own language. */
const title = repeatOf(
  on('de', 'terrassendach', finding('m1', 'meta-title-changed', 'Alt', 'Neu')),
);

const reading = (over = {}) =>
  listReading({
    byFinding: new Map(),
    link: (store, page, id) => `/${store}/${page}/?finding=${id}`,
    ...over,
  });

describe('what a press may cross', () => {
  it('presses a difference of translated words on the store it belongs to', () => {
    expect(reading({ store: 'nl' }).of(translated).refusal).toBeNull();
  });

  it('presses a difference that crosses the block, on either store of it', () => {
    expect(reading({ store: 'be' }).of(acrossBlock).refusal).toBeNull();
  });

  it('presses one filename over all six stores from above them', () => {
    expect(reading().of(everywhere).refusal).toBeNull();
  });

  it('refuses translated words above the stores, in the words that say where instead', () => {
    // The whole sentence and not a substring of it: a refusal that only says no leaves an
    // editor with a row they cannot act on, and a DOM query matching *translate* would pass
    // over a reworded refusal that had lost the second half.
    expect(reading().of(translated).refusal).toBe(
      'The stores translate these words — decide it on one of the stores named.',
    );
    expect(TRANSLATED_ELSEWHERE).toBe(reading().of(translated).refusal);
  });

  it('refuses a page title above the stores, because four titles are four decisions', () => {
    expect(reading().of(title).refusal).toBe(TRANSLATED_ELSEWHERE);
  });
});

describe('the language a row declares', () => {
  it('is the store’s on a store’s own screen', () => {
    expect(reading({ store: 'de' }).of(title).language).toBe('de');
  });

  it('is the block’s language on a row that crosses it', () => {
    // Two stores of one language, so the row is still in one — and it is the list's answer
    // whichever store's screen this is.
    expect(reading({ store: 'nl' }).of(acrossBlock).language).toBe('nl');
    expect(reading().of(acrossBlock).language).toBe('nl');
  });

  it('is none on a row over six stores, rather than the first store’s', () => {
    // Four languages between them, and the two strings are a filename either way. Declaring
    // one would tell a screen reader that German content is Dutch.
    expect(reading().of(everywhere).language).toBeNull();
  });
});

describe('whether a row names its store', () => {
  it('stays quiet about the store the editor is already looking at', () => {
    expect(reading({ store: 'nl' }).of(translated).namesStore).toBe(false);
  });

  it('names it above the stores, where one row is one row among six stores’ worth', () => {
    expect(reading().of(translated).namesStore).toBe(true);
  });

  it('names it on a difference that crosses a block, because two pages share a name', () => {
    expect(reading({ store: 'nl' }).of(acrossBlock).namesStore).toBe(true);
  });
});

describe('whether the list answers something typed', () => {
  it('says so only where a term was typed, so a dashboard row draws no matched fields', () => {
    expect(reading({ store: 'nl', searched: true }).searched).toBe(true);
    // The default is the quiet one: a list nobody asked a question of has no matched fields
    // to show, and *in the page name* on a row nobody searched for is two dead words.
    expect(reading({ store: 'nl' }).searched).toBe(false);
  });
});

describe('where a row’s links land', () => {
  it('opens a page on that page’s own store, at this difference', () => {
    const row = reading({ store: 'nl' }).of(acrossBlock);

    // Each page's **own** store: a link built from the screen's store would open a page that
    // is not the one clicked.
    expect(acrossBlock.on.map((entry) => row.pageHref(entry))).toEqual([
      '/nl/afhalen/?finding=f1',
      '/be/afhalen/?finding=f2',
    ]);
  });

  it('opens the row’s class where the screen has somewhere to open it', () => {
    const classLink = (cls) => `/search/?classes=${cls}`;

    expect(reading({ classLink }).of(everywhere).classHref).toBe('/search/?classes=image-missing');
  });

  it('gives no class link where the screen offers none, so the label stays a statement', () => {
    expect(reading({ store: 'nl' }).of(translated).classHref).toBeNull();
  });
});
