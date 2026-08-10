import { describe, expect, it } from 'vitest';
import { muteForms } from './mute.mjs';

/**
 * ADR 0008 puts the whole weight of the mute on **what the button says before it
 * is pressed**. The press itself is one line in `OverrideControl`; the sentence
 * an editor reads is this file, so it is where the rule is tested.
 */

const HEAVY = 'Gumax® Heavy Duty';

/** @param {string} cls @param {string | null} anchorHeading */
const finding = (cls, anchorHeading, shown = true) => ({
  id: `${cls}-${anchorHeading}`, class: cls, anchorHeading, shown, state: 'open',
});

// nl__terrasoverkapping in miniature: one heading carries most of the class.
const page = [
  finding('text-missing', HEAVY),
  { ...finding('text-missing', HEAVY), id: 'two' },
  finding('text-missing', 'Zonwering'),
  finding('text-missing', null),
  finding('casing', HEAVY),
];

const formsFor = (target) => muteForms(page, target);

describe('the control offers the section first and the page second', () => {
  it('offers exactly two forms, section first', () => {
    const [section, wide] = formsFor(finding('text-missing', HEAVY));
    expect(formsFor(finding('text-missing', HEAVY))).toHaveLength(2);
    expect(section.count).toBe(2);
    expect(wide.count).toBe(4);
  });

  it('carries the heading on the section form and no heading on the page-wide one', () => {
    const [section, wide] = formsFor(finding('text-missing', HEAVY));
    expect(section.key).toEqual({ class: 'text-missing', anchorHeading: HEAVY });
    expect(wide.key).toEqual({ class: 'text-missing' });
    expect(wide.key).not.toHaveProperty('anchorHeading');
  });

  it('says the count and the place, so the press is never silent', () => {
    const [section, wide] = formsFor(finding('text-missing', HEAVY));
    expect(section.says).toBe(`2 bevindingen onder “${HEAVY}”`);
    expect(wide.says).toBe('4 bevindingen op de hele pagina');
  });

  it('names the null section honestly, and never as the page', () => {
    // The count is the guard here: the bucket is heterogeneous.
    const [section, wide] = formsFor(finding('text-missing', null));
    expect(section.says).toBe('1 bevinding in de inhoud vóór de eerste kop');
    expect(section.key).toEqual({ class: 'text-missing', anchorHeading: null });
    expect(wide.count).toBe(4);
  });

  it('counts one class only, because the class is still the only axis', () => {
    const [section, wide] = formsFor(finding('casing', HEAVY));
    expect([section.count, wide.count]).toEqual([1, 1]);
  });

  it('says the two forms are the same press when the class sits under one heading', () => {
    // 44.1% of pairs are this shape. The two counts are equal, and the editor can
    // see that without being told which button to use.
    const [section, wide] = muteForms([finding('price', 'Prijzen')], finding('price', 'Prijzen'));
    expect(section.count).toBe(wide.count);
  });
});
