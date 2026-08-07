import { describe, expect, it } from 'vitest';
import { storeOfFile } from './reports.mjs';

/**
 * One rule with judgement in it: a report file names its store, and the store is
 * read back from the name so that one store's dashboard opens one store's files.
 * The judgement is that a prefix match is safe here.
 */
describe('storeOfFile', () => {
  it('reads the store from the report filename', () => {
    expect(storeOfFile('nl__overkappingen.json')).toBe('nl');
    expect(storeOfFile('de__faq__productinformatie.json')).toBe('de');
  });

  it('does not read be_fr as be', () => {
    // `be` is a prefix of `be_fr`, and the two stores share a host as well. The
    // separator is what makes the match exact, so it is part of the match.
    expect(storeOfFile('be_fr__carports.json')).toBe('be_fr');
    expect(storeOfFile('be__carports.json')).toBe('be');
  });

  it('claims no store for a name it does not recognise', () => {
    expect(storeOfFile('snapshot.json')).toBeNull();
    expect(storeOfFile('nlx__overkappingen.json')).toBeNull();
  });
});
