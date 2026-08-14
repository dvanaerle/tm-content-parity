// THROWAWAY probe for ticket 92 — does either side send `<meta name="title">` or
// `<meta name="keywords">`, and is the first of the two a second field or a copy of
// `<title>`?
//
// Ticket 94 is about to add two fields to `PageMeta` and refuses to do it on a guess.
// So this reads the head of every page of every store on both sides and counts.
//
// **Absent is not present-but-empty.** The ticket says the two lead to different
// decisions: an absent field means the site never fills it, an empty one means the
// site ships the tag and the editor left it blank. `crawl/extract.mjs`'s `meta()`
// cannot answer this — its `attribute()` helper returns `null` for both — so the
// reading rule is re-derived here rather than borrowed, and `selfCheck()` below
// holds it to the cases that matter before a single page is fetched. That check is
// where a test would be: a probe is evidence and no stage may import it (README),
// so the fixtures travel with the measurement instead of with the suite.
//
// What it prints, per store and per side:
//
//   1. `meta[name="title"]` — pages read, pages that answered 404, pages that failed,
//      then present, of those non-empty, present-but-empty, and absent;
//   2. the same table for `meta[name="keywords"]`;
//   3. for every meta title value, its relation to `<title>` on the same page:
//      identical, invisible-only (differs before tier-1 folding, not after), differs;
//   4. how many distinct keyword strings a store carries, and the commonest one — which
//      is what says whether keywords is a per-page field or one string pasted everywhere;
//   5. per store, what a keywords row would show on the pairs where **both** sides
//      answered: same, changed, lost, added, on neither side.
//
// Then the corpus totals the two verdicts rest on. **Every count excludes the page-sides
// that answered 404**, and names them in their own column: a Magento 404 sends a head of
// its own, whose `keywords` carries the 404 page's title string, so counting one as a
// page's head would make the field look denser than it is on exactly the pages nobody
// can fix.
//
// It fetches ~1,640 pages. Production has served the maintenance page on 446 of 451
// urls for a whole session, so a `MaintenanceError` aborts the run with exit 3 rather
// than recording phantom absences — every page of a maintenance run would count as
// absent on both fields, which is the one answer this probe must never give by
// accident. Any other failure is retried three times and then recorded per page.
//
//   node crawl/probes/probe-92-meta-title-and-keywords.mjs
//   node crawl/probes/probe-92-meta-title-and-keywords.mjs nl uk   # a subset
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { parse } from 'node-html-parser';
import { isExcludedPage } from '../../shared/excluded-pages.mjs';
import { STORES } from '../../shared/stores.mjs';
import { MaintenanceError, fetchPage } from '../fetch-page.mjs';
import { collapse, tier1 } from '../normalise.mjs';

const CONCURRENCY = 8;
const ATTEMPTS = 3;
const SIDES = ['production', 'new'];

// ------------------------------------------------------------------ the reading

/**
 * @typedef {'absent' | 'no-content-attribute' | 'empty' | 'value'} FieldState
 *   `absent` — the head sends no such tag.
 *   `no-content-attribute` — a tag, carrying no `content` at all.
 *   `empty` — a `content` that is empty or only whitespace.
 *   `value` — something a reader would see.
 */

/**
 * @typedef {object} FieldReading
 * @property {number} tags How many tags the head sends. More than one is its own
 *   fact: two `keywords` tags mean a template and a page, or two editors.
 * @property {boolean} present At least one tag, whatever it carries.
 * @property {FieldState} state
 * @property {string | null} value The first non-empty value, tier-1 normalised.
 * @property {string | null} raw The same value with only its whitespace collapsed,
 *   so `identical` can be told from `invisible-only`.
 */

/** @type {FieldReading} */
const ABSENT = { tags: 0, present: false, state: 'absent', value: null, raw: null };

/**
 * One `meta[name=…]`, read the way a browser reads it: the name is
 * case-insensitive, and only the head counts — a `meta` in the body is markup a
 * browser ignores, and counting it would inflate the presence number.
 *
 * @param {import('node-html-parser').HTMLElement} head
 * @param {string} name
 * @returns {FieldReading}
 */
function readField(head, name) {
  const tags = head
    .querySelectorAll('meta')
    .filter((tag) => (tag.getAttribute('name') ?? '').trim().toLowerCase() === name);
  if (tags.length === 0) return { ...ABSENT };

  const reading = { tags: tags.length, present: true };
  let sawAttribute = false;
  for (const tag of tags) {
    const content = tag.getAttribute('content');
    if (content === undefined || content === null) continue;
    sawAttribute = true;
    const raw = collapse(content);
    if (raw) return { ...reading, state: 'value', value: tier1(content), raw };
  }
  return {
    ...reading,
    state: sawAttribute ? 'empty' : 'no-content-attribute',
    value: null,
    raw: null,
  };
}

/**
 * @typedef {'absent' | 'no-title' | 'identical' | 'invisible-only' | 'differs'} Relation
 *   Whether the meta title is a second field or a copy of `<title>`. `absent` is
 *   *no value to compare* and is evidence for neither.
 */

/**
 * @param {FieldReading} metaTitle
 * @param {{ value: string | null, raw: string | null }} title
 * @returns {Relation}
 */
function relationTo(metaTitle, title) {
  if (metaTitle.state !== 'value') return 'absent';
  if (!title.value) return 'no-title';
  if (metaTitle.raw === title.raw) return 'identical';
  // Tier 1 is invisible equivalence (ticket 02). A pair that differs only there is
  // not a second field — the reader sees one string.
  return metaTitle.value === title.value ? 'invisible-only' : 'differs';
}

/**
 * @typedef {object} Head
 * @property {string | null} title
 * @property {FieldReading} metaTitle
 * @property {FieldReading} keywords
 * @property {Relation} metaTitleRelation
 */

/**
 * @param {string} html
 * @returns {Head}
 */
function readHead(html) {
  const root = parse(html);
  // A malformed document may carry no head tag. Then the reader is the document,
  // which is the closest thing to what a browser would have built.
  const head = root.querySelector('head') ?? root;
  const titleTag = head.querySelector('title');
  const title = {
    value: titleTag ? tier1(titleTag.text) || null : null,
    raw: titleTag ? collapse(titleTag.text) || null : null,
  };
  const metaTitle = readField(head, 'title');
  return {
    title: title.value,
    metaTitle,
    keywords: readField(head, 'keywords'),
    metaTitleRelation: relationTo(metaTitle, title),
  };
}

// ------------------------------------------------------------------- the counts

/** @param {FieldReading[]} readings */
const countField = (readings) => {
  const present = readings.filter((one) => one.present).length;
  const nonEmpty = readings.filter((one) => one.state === 'value').length;
  return {
    present,
    nonEmpty,
    presentEmpty: present - nonEmpty,
    absent: readings.length - present,
    noAttribute: readings.filter((one) => one.state === 'no-content-attribute').length,
    multiple: readings.filter((one) => one.tags > 1).length,
  };
};

/**
 * The counts the deliverable asks for, over one store and one side.
 *
 * `keywordValues` is not in the deliverable and is here for the verdict: a field
 * carrying one string across a whole store is not a per-page field, and the verdict
 * has to be able to say that with a number.
 *
 * @param {Head[]} heads
 */
function tally(heads) {
  /** @type {Record<string, number>} */
  const relation = {};
  for (const head of heads) {
    if (head.metaTitleRelation === 'absent') continue;
    relation[head.metaTitleRelation] = (relation[head.metaTitleRelation] ?? 0) + 1;
  }

  /** @type {Record<string, number>} */
  const keywordValues = {};
  for (const head of heads) {
    if (head.keywords.value === null) continue;
    keywordValues[head.keywords.value] = (keywordValues[head.keywords.value] ?? 0) + 1;
  }

  return {
    pages: heads.length,
    metaTitle: countField(heads.map((head) => head.metaTitle)),
    keywords: countField(heads.map((head) => head.keywords)),
    metaTitleRelation: relation,
    keywordValues,
    noTitleTag: heads.filter((head) => head.title === null).length,
  };
}

// -------------------------------------------------------------- the self-check

const doc = (head) => `<!doctype html><html><head>${head}</head><body><p>x</p></body></html>`;

/**
 * The cases the answer depends on, checked before anything is fetched.
 *
 * Each is `[name, html, expectation]`, where the expectation is a subset of the
 * reading. A fold of absent into empty, a body `meta` counted as a head one, or a
 * duplicated `<title>` read as a second field would each produce a plausible number
 * and a wrong verdict. Five minutes of fetching after a failed check is five minutes
 * spent measuring the reader's bug, so this throws.
 */
const CHECKS = [
  [
    'a value the page sends',
    doc('<title>Overkapping</title><meta name="title" content="Overkapping">'),
    {
      'metaTitle.state': 'value',
      'metaTitle.value': 'Overkapping',
      'metaTitle.tags': 1,
      metaTitleRelation: 'identical',
    },
  ],
  [
    'no tag at all is absent',
    doc('<title>Overkapping</title>'),
    {
      'metaTitle.state': 'absent',
      'metaTitle.present': false,
      'keywords.state': 'absent',
      metaTitleRelation: 'absent',
    },
  ],
  [
    'an empty value is present, not absent',
    doc('<meta name="keywords" content="">'),
    {
      'keywords.state': 'empty',
      'keywords.present': true,
      'keywords.tags': 1,
      'keywords.value': null,
    },
  ],
  [
    'a whitespace-only value is present, not absent',
    doc('<meta name="keywords" content="  \n ">'),
    {
      'keywords.state': 'empty',
      'keywords.present': true,
    },
  ],
  [
    'a tag with no content attribute is present, not absent',
    doc('<meta name="keywords">'),
    {
      'keywords.state': 'no-content-attribute',
      'keywords.present': true,
    },
  ],
  [
    'two tags are counted, and the first value wins',
    doc('<meta name="keywords" content=""><meta name="keywords" content="glazen schuifwand">'),
    { 'keywords.tags': 2, 'keywords.state': 'value', 'keywords.value': 'glazen schuifwand' },
  ],
  [
    'the name is case-insensitive',
    doc('<meta NAME="Keywords" content="veranda">'),
    {
      'keywords.state': 'value',
      'keywords.value': 'veranda',
    },
  ],
  [
    'a property is not a name',
    doc('<meta property="og:title" content="Overkapping">'),
    {
      'metaTitle.state': 'absent',
    },
  ],
  [
    'a meta tag in the body is not in the head',
    '<!doctype html><html><head><title>T</title></head><body><meta name="keywords" content="x"></body></html>',
    { 'keywords.state': 'absent' },
  ],
  [
    'an entity is not a difference',
    doc('<meta name="title" content="Tuin&nbsp;maximaal &amp; co">'),
    {
      'metaTitle.value': 'Tuin maximaal & co',
    },
  ],
  [
    'source indentation is not a difference',
    doc('<title>\n  Overkapping\n</title><meta name="title" content="Overkapping">'),
    { metaTitleRelation: 'identical' },
  ],
  [
    'a difference a reader cannot see is not a second field',
    doc('<title>Tuin - maximaal</title><meta name="title" content="Tuin – maximaal">'),
    { metaTitleRelation: 'invisible-only' },
  ],
  [
    'two different strings differ',
    doc('<title>Overkapping</title><meta name="title" content="Veranda">'),
    {
      metaTitleRelation: 'differs',
    },
  ],
  [
    'an empty meta title has nothing to compare',
    doc('<title>Overkapping</title><meta name="title" content="">'),
    {
      metaTitleRelation: 'absent',
    },
  ],
  [
    'a page with no title of its own says so',
    doc('<meta name="title" content="Overkapping">'),
    {
      metaTitleRelation: 'no-title',
      title: null,
    },
  ],
];

/** @param {object} value @param {string} path */
const at = (value, path) => path.split('.').reduce((one, key) => one?.[key], value);

function selfCheck() {
  const failures = [];
  for (const [name, html, expected] of CHECKS) {
    const head = readHead(html);
    for (const [path, want] of Object.entries(expected)) {
      const got = at(head, path);
      if (got !== want)
        failures.push(`${name}: ${path} is ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
    }
  }

  // The tally, over the three documents above: one with both fields filled, one with
  // a meta title that differs and empty keywords, one with neither.
  const heads = [
    readHead(
      doc('<title>A</title><meta name="title" content="A"><meta name="keywords" content="a">'),
    ),
    readHead(
      doc('<title>B</title><meta name="title" content="Other"><meta name="keywords" content="">'),
    ),
    readHead(doc('<title>C</title>')),
  ];
  const counts = tally(heads);
  const wanted = {
    pages: 3,
    'metaTitle.present': 2,
    'metaTitle.nonEmpty': 2,
    'metaTitle.presentEmpty': 0,
    'metaTitle.absent': 1,
    'keywords.present': 2,
    'keywords.nonEmpty': 1,
    'keywords.presentEmpty': 1,
    'keywords.absent': 1,
    'metaTitleRelation.identical': 1,
    'metaTitleRelation.differs': 1,
    'metaTitleRelation.absent': undefined,
  };
  for (const [path, want] of Object.entries(wanted)) {
    const got = at(counts, path);
    if (got !== want)
      failures.push(`tally: ${path} is ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  }
  if (Object.keys(counts.keywordValues).length !== 1 || counts.keywordValues.a !== 1) {
    failures.push(`tally: keywordValues is ${JSON.stringify(counts.keywordValues)}, want {"a":1}`);
  }
  if (tally([]).pages !== 0) failures.push('tally: an empty corpus is not zero pages');

  if (failures.length > 0) {
    for (const line of failures) console.error(`  ${line}`);
    throw new Error(`The reader is wrong on ${failures.length} case(s). Nothing was fetched.`);
  }
  console.log(`Reader checked on ${CHECKS.length} documents and the tally on 3. Fetching.\n`);
}

// ---------------------------------------------------------------------- the run

/**
 * One url, three attempts. A `MaintenanceError` is never retried and never
 * recorded: it is site-wide, and the caller empties the queue on it.
 *
 * @param {string} url
 */
async function ask(url) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetchPage(url);
    } catch (error) {
      if (error instanceof MaintenanceError) throw error;
      if (attempt === ATTEMPTS) throw error;
    }
  }
}

const percent = (part, whole) => (whole === 0 ? '—' : `${((part / whole) * 100).toFixed(1)}%`);

/**
 * The value the most pages of a store share, and how many share it. One string on
 * many pages is what a template does; a different string on every page is what an
 * editor does, and that is the difference the keywords verdict turns on.
 *
 * @param {Record<string, number>} counts
 */
const commonest = (counts) => {
  const value = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return value ? `${JSON.stringify(value[0].slice(0, 60))} on ${value[1]}` : '—';
};

async function main() {
  selfCheck();

  const asked = process.argv.slice(2).filter((word) => STORES.includes(word));
  const stores = asked.length > 0 ? asked : STORES;

  const seeds = JSON.parse(
    readFileSync(new URL('../../data/10-store-seeds.json', import.meta.url), 'utf8'),
  );
  const jobs = [];
  for (const row of seeds.rows) {
    if (isExcludedPage(row.page)) continue;
    for (const store of stores) {
      const cell = row.stores?.[store];
      if (cell) jobs.push({ store, page: row.page, prodUrl: cell.prodUrl, newUrl: cell.newUrl });
    }
  }
  console.log(`${jobs.length} cells over ${stores.join(', ')}, ${jobs.length * 2} fetches.`);

  /** @type {{ store: string, page: string, production?: object, new?: object }[]} */
  const rows = [];
  const queue = jobs.slice();
  let done = 0;

  const work = async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      const record = { store: job.store, page: job.page };
      for (const [side, url] of [
        ['production', job.prodUrl],
        ['new', job.newUrl],
      ]) {
        try {
          const response = await ask(url);
          const head = readHead(response.html);
          record[side] = { status: response.status, ...head };
        } catch (error) {
          if (error instanceof MaintenanceError) {
            // Site-wide. Do not ask sixteen hundred more times, and do not record
            // this page: a maintenance page is absent on both fields, and a run
            // that kept it would answer the ticket with the outage.
            queue.length = 0;
            throw error;
          }
          record[side] = { error: `${error.name}: ${error.message}`.slice(0, 160) };
        }
      }
      rows.push(record);
      if (++done % 50 === 0) console.log(`  ${done}/${jobs.length}`);
    }
  };

  await Promise.all(Array.from({ length: CONCURRENCY }, work));

  // ------------------------------------------------------------------ reporting
  //
  // **The denominator is the status-200 page-sides, and that choice moves a number.**
  // A Magento 404 sends a head of its own, and its `keywords` carries the 404 page's
  // own title string — `Pagina niet gevonden | …`. Counting one as a page's head makes
  // the field look denser than it is on exactly the pages nobody can fix. So the 404s
  // are excluded from every count and named on their own column instead. That
  // production answers 404 on urls its own sitemap declares belongs to tickets 22 and
  // 40; here it only sets the denominator.
  const readable = (one) => one && !one.error && one.status === 200;

  /** @param {typeof rows} mine @param {string} side */
  const measure = (mine, side) => ({
    ...tally(mine.filter((row) => readable(row[side])).map((row) => row[side])),
    notFound: mine.filter((row) => row[side] && !row[side].error && row[side].status !== 200)
      .length,
    failed: mine.filter((row) => row[side]?.error).length,
  });

  /** @type {Record<string, Record<string, ReturnType<typeof measure>>>} */
  const perStore = {};
  for (const store of stores) {
    const mine = rows.filter((row) => row.store === store);
    perStore[store] = Object.fromEntries(SIDES.map((side) => [side, measure(mine, side)]));
  }
  /** @type {Record<string, ReturnType<typeof measure>>} */
  const corpus = Object.fromEntries(SIDES.map((side) => [side, measure(rows, side)]));

  // What a keywords row would show is a property of the **pair**, not of a side, and
  // only the pages where both sides answered 200 are pages the compare stage can
  // compare at all. Ticket 98 owns that row and this is the table it needs.
  const pairs = rows.filter((row) => readable(row.production) && readable(row.new));
  /** @param {typeof pairs} mine */
  const movementOf = (mine) => {
    const counts = { pairs: mine.length, same: 0, changed: 0, lost: 0, added: 0, neither: 0 };
    for (const row of mine) {
      const before = row.production.keywords.value;
      const after = row.new.keywords.value;
      if (before && after) {
        if (before === after) counts.same++;
        else counts.changed++;
      } else if (before) counts.lost++;
      else if (after) counts.added++;
      else counts.neither++;
    }
    return counts;
  };
  const movement = {
    ...Object.fromEntries(
      stores.map((store) => [store, movementOf(pairs.filter((row) => row.store === store))]),
    ),
    ALL: movementOf(pairs),
  };

  const out = new URL('../../data/probe-92-meta-title-and-keywords.json', import.meta.url);
  mkdirSync(new URL('../../data/', import.meta.url), { recursive: true });
  writeFileSync(
    out,
    JSON.stringify(
      {
        ranAt: new Date().toISOString(),
        stores,
        seedsGenerated: seeds.generated,
        corpus,
        perStore,
        movement,
        rows,
      },
      null,
      2,
    ),
  );

  const oneOf = (store, side) => (store === 'ALL' ? corpus[side] : perStore[store][side]);

  for (const field of ['metaTitle', 'keywords']) {
    console.log(`\n=== meta[name="${field === 'metaTitle' ? 'title' : 'keywords'}"] ===`);
    console.log('store  side        read  404  fail  present  non-empty  pres-empty  absent');
    for (const store of [...stores, 'ALL']) {
      for (const side of SIDES) {
        const one = oneOf(store, side);
        const f = one[field];
        console.log(
          `${store.padEnd(7)}${side.padEnd(12)}${String(one.pages).padEnd(6)}${String(one.notFound).padEnd(5)}` +
            `${String(one.failed).padEnd(6)}${String(f.present).padEnd(9)}${String(f.nonEmpty).padEnd(11)}` +
            `${String(f.presentEmpty).padEnd(12)}${f.absent}`,
        );
      }
    }
  }

  console.log('\n=== where a meta title value exists, is it a second field? ===');
  console.log('store  side        values  identical  invisible-only  differs  no-title');
  for (const store of [...stores, 'ALL']) {
    for (const side of SIDES) {
      const one = oneOf(store, side);
      const r = one.metaTitleRelation;
      const values = one.metaTitle.nonEmpty;
      console.log(
        `${store.padEnd(7)}${side.padEnd(12)}${String(values).padEnd(8)}${String(r.identical ?? 0).padEnd(11)}` +
          `${String(r['invisible-only'] ?? 0).padEnd(16)}${String(r.differs ?? 0).padEnd(9)}${r['no-title'] ?? 0}`,
      );
    }
  }

  console.log('\n=== is keywords a per-page field? ===');
  console.log('store  side        with a value  distinct values  commonest');
  for (const store of [...stores, 'ALL']) {
    for (const side of SIDES) {
      const one = oneOf(store, side);
      console.log(
        `${store.padEnd(7)}${side.padEnd(12)}${String(one.keywords.nonEmpty).padEnd(14)}` +
          `${String(Object.keys(one.keywordValues).length).padEnd(17)}${commonest(one.keywordValues)}`,
      );
    }
  }

  console.log('\n=== what a keywords row would show, on the pairs both sides answered ===');
  console.log('store  pairs  same  changed  lost  added  neither side');
  for (const store of [...stores, 'ALL']) {
    const one = movement[store];
    console.log(
      `${store.padEnd(7)}${String(one.pairs).padEnd(7)}${String(one.same).padEnd(6)}` +
        `${String(one.changed).padEnd(9)}${String(one.lost).padEnd(6)}${String(one.added).padEnd(7)}${one.neither}`,
    );
  }

  console.log('\n=== the verdict numbers ===');
  for (const side of SIDES) {
    const one = corpus[side];
    console.log(
      `${side}: ${one.pages} read, ${one.notFound} answered 404, ${one.failed} failed. ` +
        `meta title present on ${one.metaTitle.present} (${percent(one.metaTitle.present, one.pages)}), ` +
        `valued on ${one.metaTitle.nonEmpty}, of which ${one.metaTitleRelation.differs ?? 0} differ from <title> ` +
        `and ${one.metaTitleRelation['invisible-only'] ?? 0} differ invisibly. ` +
        `keywords present on ${one.keywords.present} (${percent(one.keywords.present, one.pages)}), ` +
        `valued on ${one.keywords.nonEmpty} across ${Object.keys(one.keywordValues).length} distinct strings, ` +
        `present-but-empty on ${one.keywords.presentEmpty}.`,
    );
  }
  const all = movement.ALL;
  console.log(
    `\nA keywords row would show something on ${all.lost + all.changed + all.added} of ${all.pairs} ` +
      `comparable pairs (${percent(all.lost + all.changed + all.added, all.pairs)}): ` +
      `${all.lost} lost, ${all.changed} changed, ${all.added} added. ` +
      `A meta title row could never show anything: ${corpus.production.metaTitleRelation.differs ?? 0} differ.`,
  );
  console.log(`\nWritten to ${out.pathname}`);
}

try {
  await main();
} catch (error) {
  console.error(`\n${error.message}`);
  if (error instanceof MaintenanceError) {
    console.error('Production is in maintenance mode. Nothing was measured. Re-run later.');
    process.exit(3);
  }
  process.exit(1);
}
