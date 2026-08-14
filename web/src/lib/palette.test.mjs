import { readdir, readFile } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ACCENT,
  BANNER,
  FILL,
  INK,
  PILL,
  SOLID,
  SURFACE,
  TOKEN,
  TONES,
  severityTone,
} from './palette.mjs';

/**
 * `palette.mjs` holds three rules with judgement in them, and the repo says a rule
 * with no test is not a rule. The thresholds are one. The second is the reservation
 * that makes the diff readable: red and green mean direction and never status. The
 * third is the vocabulary itself — ticket 131 settled which eight words the file may
 * use, and a ninth is a colour with no stated meaning.
 */

/**
 * Every map in the file that is **keyed by tone**. `CHROME` is the one that is not — its
 * keys are places in the interface, and it holds the brand colours a tone may never take —
 * so it is out of the guards below rather than missing from them.
 */
const MAPS = { PILL, SOLID, FILL, BANNER, INK, SURFACE, TOKEN, ACCENT };

describe('the tone vocabulary', () => {
  it('is these eight words and no others', () => {
    // Written out rather than counted, because the point of ticket 131 is *which*
    // eight. Four are generic because the hue is free, and four are the domain's
    // because it is not: `lost` and `added` are `CONTEXT.md`'s Direction, `closed`
    // is its bucket, and `total` is worn by any total.
    expect([...TONES]).toEqual([
      'lost',
      'added',
      'warning',
      'caution',
      'closed',
      'info',
      'neutral',
      'total',
    ]);
  });

  it('refuses a key that is not one of the eight', () => {
    // The guard ticket 131 asked for. A ninth tone is a colour with no stated
    // meaning, which is the drift this whole file exists to stop — and the maps are
    // deliberately sparse, so a typo in a key is otherwise a silent `undefined` at
    // the call site rather than a failure here.
    for (const [name, map] of Object.entries(MAPS)) {
      for (const key of Object.keys(map)) {
        // `FILL.secondary` is the one exception in the file: a progress track's brand
        // step, which is a fill and not a judgement about anything.
        if (map === FILL && key === 'secondary') continue;
        expect(TONES, `${name}.${key}`).toContain(key);
      }
    }
  });
});

/**
 * The guard above reads the maps, which is only half of ticket 131's *a test fails if a
 * tone outside the eight is used*: a tone is also **written at the call site**, and three
 * tables produce one without `palette.mjs` ever seeing the word — `BUCKET_TONE`,
 * `STATE` in `OverrideControl.jsx` and `PRIORITY_TONE` in `Chips.jsx`. A wrong word in any
 * of them is `PILL[undefined]`: a pill that draws with no colour, and nothing throws.
 *
 * So this sweeps the source text, the way `interface-language.test.mjs` sweeps it for
 * Dutch. Two of the three tables write `tone:` and are caught. **`PRIORITY_TONE` is not**,
 * because it keys its tones on the priority (`{ high: 'caution' }`) and a sweep for bare
 * quoted words would match every string in the interface. Its cover is
 * `PILL[PRIORITY_TONE[priority]]` being read by a person, and that is the honest limit of
 * this test.
 */
describe('the tones written at a call site', () => {
  const ROOT = fileURLToPath(new URL('..', import.meta.url));
  const DRAWN = ['.jsx', '.mjs', '.astro', '.js'];

  /** A tone reached off one of the maps by name, plus the two ways one is passed as a prop. */
  const WRITTEN = [
    /\b(?:PILL|SOLID|FILL|BANNER|INK|SURFACE|TOKEN|ACCENT)\.([A-Za-z_$][\w$]*)/g,
    /\btone:\s*'([^']*)'/g,
    /\btone="([^"]*)"/g,
  ];

  /** `FILL.secondary` is not a tone, and `palette.mjs` says why. */
  const ALLOWED = new Set([...TONES, 'secondary']);

  /** @returns {Promise<string[]>} */
  async function filesUnder(directory) {
    const entries = await readdir(directory, { recursive: true, withFileTypes: true });
    return entries
      .filter(
        (entry) =>
          entry.isFile() && DRAWN.includes(extname(entry.name)) && !entry.name.endsWith('.test.mjs'),
      )
      .map((entry) => join(entry.parentPath, entry.name));
  }

  it('never names a tone the palette does not hold', async () => {
    const files = await filesUnder(ROOT);
    // The sweep has to actually sweep, or an empty list passes this whole block.
    expect(files.length).toBeGreaterThan(30);

    const read = await Promise.all(
      files.map(async (file) => /** @type {[string, string]} */ ([file, await readFile(file, 'utf8')])),
    );

    /** @type {string[]} */
    const caught = [];
    for (const [file, text] of read) {
      for (const [index, line] of text.split('\n').entries()) {
        for (const pattern of WRITTEN) {
          for (const [, name] of line.matchAll(pattern)) {
            if (!ALLOWED.has(name)) {
              caught.push(`${relative(ROOT, file)}:${index + 1} — ${name} — ${line.trim()}`);
            }
          }
        }
      }
    }

    expect(caught).toEqual([]);
  }, 30_000);

  // And it has to be able to fail, or emptying the patterns would go on reporting success.
  it('catches the tone a rename would leave behind', () => {
    const stale = ['<Banner tone="severe">', "  contradicted: { tone: 'attention' },", 'PILL.dark'];
    for (const line of stale) {
      const names = WRITTEN.flatMap((pattern) => [...line.matchAll(pattern)].map(([, name]) => name));
      expect(names.length, line).toBeGreaterThan(0);
      expect(names.some((name) => !ALLOWED.has(name)), line).toBe(true);
    }
  });

  // And leave the tones that are there alone.
  it('passes the call sites the interface actually has', () => {
    const live = ['<Banner tone="caution">', "  open: { tone: 'neutral' },", 'FILL.secondary'];
    for (const line of live) {
      const names = WRITTEN.flatMap((pattern) => [...line.matchAll(pattern)].map(([, name]) => name));
      expect(names.length, line).toBeGreaterThan(0);
      expect(names.every((name) => ALLOWED.has(name)), line).toBe(true);
    }
  });
});

describe('severityTone', () => {
  it('reads no difference as closed, not as success', () => {
    // A page with nothing to answer for is blue. Green is `added` and it must not
    // also mean "done", or the dashboard and the diff disagree about the hue.
    expect(severityTone(0)).toBe('closed');
  });

  it('reads a minority of the page as caution and a majority as warning', () => {
    expect(severityTone(0.01)).toBe('caution');
    expect(severityTone(0.5)).toBe('caution');
    expect(severityTone(0.51)).toBe('warning');
    expect(severityTone(1)).toBe('warning');
  });

  it('never reads a share as a direction', () => {
    // However much of a page differs, the share is a status. An editor who saw the
    // bar go red would read the whole page as lost content.
    const shares = [0, 0.25, 0.5, 0.75, 1];
    for (const share of shares) {
      expect(['lost', 'added']).not.toContain(severityTone(share));
    }
  });
});

describe('the tone maps', () => {
  /** The six that are not a direction. `lost` and `added` are the other two. */
  const STATUS = ['warning', 'caution', 'closed', 'info', 'neutral', 'total'];

  /** The maps that answer for every tone. `INK` and the three below it are sparse. */
  const TOTAL = { PILL, SOLID, FILL, BANNER };

  it('answers for every tone in the maps that are total over them', () => {
    // Without this the guard above passes on an empty map, and so does the direction
    // rule below it — `map[tone] ?? ''` matches nothing when the tone is not there,
    // which is how a renamed key could go missing and still read as green.
    //
    // It is deliberately **not** a rule that every map is total. Ticket 131's trap says
    // the sparse maps are sparse on purpose and are not a bug to tidy, so `INK`, `SURFACE`,
    // `TOKEN` and `ACCENT` are outside this and stay the length their callers need.
    for (const [name, map] of Object.entries(TOTAL)) {
      expect(Object.keys(map).filter((key) => key !== 'secondary').sort(), name).toEqual(
        [...TONES].sort(),
      );
    }
  });

  it('spends the diff colours on direction only', () => {
    for (const map of [PILL, SOLID, FILL, BANNER, INK, ACCENT]) {
      for (const tone of STATUS) {
        expect(map[tone] ?? '').not.toMatch(/lost|added/);
      }
    }
  });

  it('gives warning and caution different pixels', () => {
    // They were the same string, so an error banner and a not-connected banner
    // printed the same shape and a reader could not tell which one they had.
    expect(BANNER.warning).not.toBe(BANNER.caution);
  });

  it('gives the fix checkbox two ticked colours and no direction', () => {
    // Ticket 36: ticked, and ticked-but-contradicted. A checkbox reports work, so
    // neither of the two may be the red or the green of the diff.
    expect(Object.keys(ACCENT)).toEqual(['closed', 'caution']);
  });

  it('tints a whole cell for the two directions and for nothing else', () => {
    // `SURFACE` is the row layer of the diff. A tinted cell claims the content is
    // missing on the other side, which only `lost` and `added` claim.
    expect(Object.keys(SURFACE)).toEqual(['lost', 'added']);
    expect(Object.keys(TOKEN)).toEqual(['lost', 'added']);
  });
});
