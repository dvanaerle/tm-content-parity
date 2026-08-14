// THROWAWAY probe for ticket 65 — the overrides that ticket 67's fold detaches.
//
// A finding id is content-addressed. The fold folds an inline link into the
// block that holds it, so the text of every affected unit changes, so the id
// changes and every dismissal and fix claim on it detaches. Ticket 67 does not
// ship without this number.
//
// What it does, in order:
//
//   1. reads the whole override log from Supabase and reduces it to the live
//      state — latest event per key, `cleared` removed;
//   2. fetches both sides of every page that carries a live override, live,
//      and marks each content unit the fold will change;
//   3. reports, per store and per kind, how many live overrides sit on one.
//
// **A failed read is never zero.** The ticket forbids an estimate, so any
// failure here exits non-zero with the reason and prints no count at all.
//
// The affectedness rule is ticket 65's own: a unit is affected when it is an
// anchor inside a text block, or a text block that holds one. It is implemented
// here rather than imported, because ticket 67 has not written it yet. The
// second half of the rule can hold no override — a block that holds an anchor
// emits **no** unit today, so no finding and no id exist on it — so it is
// counted apart, as the units the fold creates.
//
// **Run it before ticket 67 changes the extractor, never after.** The rule
// below is a copy of the extractor as it stands, so a run after the fold lands
// measures the wrong thing. After the fold, the rebuild itself is the evidence.
//
//   node crawl/probes/probe-fold-detachment.mjs
import { readFile } from 'node:fs/promises';
import { parse } from 'node-html-parser';
// A probe is not a stage, so AGENTS.md's one-way arrow does not bind it. It
// reads the crown jewels rather than copying them: `latestByKey()` is the
// precedence rule of ticket 09 and `reportFilename()` is ticket 60's.
import { latestByKey } from '../../overrides/state.mjs';
import { STORES, reportFilename } from '../../compare/contract.mjs';
import { isWork } from '../../compare/vocabulary.mjs';
import { collapse, tier1 } from '../normalise.mjs';
import { fetchPage } from '../fetch-page.mjs';

const ROOT = new URL('../../', import.meta.url);

// The three lists extract.mjs walks with. Copied on purpose: a probe is
// evidence of what the corpus looked like on the day, and it must not move
// when ticket 67 moves the extractor.
const TEXT_TAGS = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,dt,dd,button,a,figcaption,th,td';
const FOLDABLE = new Set(['a', 'button']);
const NEVER_CONTENT = ['script', 'style', 'noscript'];
const CHROME = [
  'header',
  'footer',
  'nav',
  'form',
  '[class*="breadcrumb"]',
  '[class*="menu"]',
  '[role="dialog"]',
];

const textOf = (node) => collapse((node.structuredText ?? node.text ?? '').replaceAll('\n', ' '));
const tagOf = (node) => node.rawTagName?.toLowerCase() ?? '';

/** Ticket 02's leaf test, minus the heading case, which the caller handles. */
function unitNorm(node) {
  const norm = tier1(textOf(node));
  if (norm.length < 2) return null;
  if (!/[\p{L}\p{N}]/u.test(norm)) return null;
  return norm;
}

/**
 * The units the fold changes on one document.
 *
 * `lost` — the text of a unit that exists today and will not exist after the
 * fold. A finding on it is detached, whatever its class.
 * `retagged` — the text of an anchor that is **alone** in its block. The fold
 * moves the unit one tag up and the text does not move, so the id survives.
 * Only a finding that carries a `detail` is detached, because `detail` is
 * `a → p` and it **is** part of the id.
 * `created` — the blocks that become units. No override can sit on one, because
 * the block emits nothing today, but they do move the page's finding-set hash.
 */
function foldEffect(html, { onWarn }) {
  const root = parse(html, { closeAllByClosing: true });
  const body = root.querySelector('body');
  if (!body) throw new Error('No <body> in the parsed document.');
  for (const selector of NEVER_CONTENT) {
    for (const node of body.querySelectorAll(selector)) node.remove();
  }

  const main = root.querySelector('main');
  let scope = main;
  if (!scope) {
    onWarn('No <main>. Falling back to <body> with the chrome list.');
    for (const selector of CHROME) {
      for (const node of body.querySelectorAll(selector)) node.remove();
    }
    scope = body;
  }

  // Today's extraction, so that "was a unit" and "will be a unit" are decided
  // on one walk and cannot disagree.
  const emitted = new Set();
  const headingSwallowed = new Set();
  for (const node of scope.querySelectorAll(TEXT_TAGS)) {
    if (headingSwallowed.has(node)) continue;
    const tag = tagOf(node);
    const heading = /^h[1-6]$/.test(tag);
    if (heading) {
      for (const inner of node.querySelectorAll(TEXT_TAGS)) headingSwallowed.add(inner);
    } else if (node.querySelectorAll(TEXT_TAGS).length > 0) {
      continue;
    }
    if (unitNorm(node)) emitted.add(node);
  }

  /** A block emits after the fold when every text tag inside it is foldable. */
  const foldEmits = (node) => {
    const inner = node.querySelectorAll(TEXT_TAGS);
    if (inner.length === 0) return false;
    return inner.every((child) => FOLDABLE.has(tagOf(child)));
  };

  // What the fold does to each unit that exists today, decided per node. The
  // sets below are then built from these fates, so a text that occurs twice on
  // one page cannot have the fate of one occurrence written over the other.
  /** node → the tag it takes, or `null` when it stops being a unit. */
  const fate = new Map();
  const created = new Set();

  for (const block of scope.querySelectorAll(TEXT_TAGS)) {
    const tag = tagOf(block);
    // A heading is not touched: it folds its anchors already (ticket 33).
    if (/^h[1-6]$/.test(tag)) continue;
    if (headingSwallowed.has(block) || emitted.has(block)) continue;
    if (!foldEmits(block)) continue;

    const blockNorm = unitNorm(block);
    const inside = block.querySelectorAll(TEXT_TAGS).filter((node) => emitted.has(node));

    // One anchor alone in its paragraph is the same words in a new tag.
    if (inside.length === 1 && unitNorm(inside[0]) === blockNorm) {
      fate.set(inside[0], tag);
      continue;
    }
    for (const node of inside) fate.set(node, null);
    if (blockNorm) created.add(blockNorm);
  }

  /** norm → how many of its occurrences the fold swallows. */
  const lost = new Map();
  const retagged = new Set();
  /** Every tag a norm is written in, today and after the fold. */
  const tagsNow = new Map();
  const tagsAfter = new Map();
  const note = (map, norm, tag) => map.set(norm, (map.get(norm) ?? new Set()).add(tag));

  // A finding names its text, not its unit, so a norm on two units with two
  // fates cannot be traced to one of them. Those are reported, never guessed at.
  const occurrences = new Map();
  for (const node of emitted) {
    const norm = unitNorm(node);
    occurrences.set(norm, (occurrences.get(norm) ?? 0) + 1);
    note(tagsNow, norm, tagOf(node));

    const after = fate.has(node) ? fate.get(node) : tagOf(node);
    if (after === null) {
      lost.set(norm, (lost.get(norm) ?? 0) + 1);
      continue;
    }
    if (fate.has(node)) retagged.add(norm);
    note(tagsAfter, norm, after);
  }

  return {
    lost,
    retagged,
    created,
    tagsNow,
    tagsAfter,
    occurrences,
    boundary: main ? 'main' : 'body',
  };
}

// --- the override log ------------------------------------------------------

async function supabaseConfig() {
  const fromEnv = {
    url: process.env.PUBLIC_SUPABASE_URL,
    anonKey: process.env.PUBLIC_SUPABASE_ANON_KEY,
  };
  if (fromEnv.url && fromEnv.anonKey) return fromEnv;

  // The values are public by design (ticket 03) and live in a gitignored file.
  const text = await readFile(new URL('web/.env.local', ROOT), 'utf8');
  const read = (name) => text.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1]?.trim();
  const url = read('PUBLIC_SUPABASE_URL');
  const anonKey = read('PUBLIC_SUPABASE_ANON_KEY');
  if (!url || !anonKey) throw new Error('web/.env.local carries no Supabase configuration.');
  return { url, anonKey };
}

async function readOverrideLog() {
  const { url, anonKey } = await supabaseConfig();
  const endpoint = `${url}/rest/v1/overrides?select=*&order=created_at.asc`;
  const response = await fetch(endpoint, {
    headers: { apikey: anonKey, authorization: `Bearer ${anonKey}` },
    signal: AbortSignal.timeout(30000),
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`Supabase answered ${response.status}: ${body.slice(0, 300)}`);

  return JSON.parse(body).map((row) => ({
    id: String(row.id),
    createdAt: row.created_at,
    editor: row.editor,
    scope: row.scope,
    action: row.action,
    store: row.store,
    page: row.page,
    findingId: row.finding_id,
    class: row.class,
    findingSetHash: row.finding_set_hash,
    note: row.note,
  }));
}

// --- the measurement -------------------------------------------------------

const events = await readOverrideLog();
const live = [...latestByKey(events).values()].filter((event) => event.action !== 'cleared');

const pages = [...new Set(live.map((event) => `${event.store}|${event.page}`))].sort();

/** @type {Map<string, { swallowed: Set<string>, created: Set<string> }>} */
const effects = new Map();
for (const key of pages) {
  const [store, page] = key.split('|');
  const extract = JSON.parse(
    await readFile(new URL(`data/extract/${store}/${page}.json`, ROOT), 'utf8'),
  );
  const sides = {};
  for (const [side, name] of [
    ['production', 'production'],
    ['new', 'new'],
  ]) {
    const { url } = extract[side];
    const { status, html } = await fetchPage(url);
    if (status !== 200) throw new Error(`${key} ${name}: HTTP ${status} on ${url}`);
    sides[side] = foldEffect(html, { onWarn: (m) => console.warn(`${key} ${name}: ${m}`) });
  }
  effects.set(key, sides);
  const tally = (side) => `+${side.created.size} -${side.lost.size} ~${side.retagged.size}`;
  console.log(`${key}  production ${tally(sides.production)}  new ${tally(sides.new)}`);
}

/** @type {Map<string, any>} */
const reports = new Map();
for (const key of pages) {
  const [store, page] = key.split('|');
  const file = new URL(`data/reports/${reportFilename(store, page)}`, ROOT);
  reports.set(key, JSON.parse(await readFile(file, 'utf8')));
}

/**
 * Whether the fold changes the id of one finding.
 *
 * The id is `sha256(store | page | check | rule | prodNorm | newNorm)` plus
 * `detail`, so three of the six parts can move here: the two texts, and `rule`,
 * which is the class.
 */
function foldChangesId(finding, effect) {
  // Ticket 67: "A link still makes its link record. The links check compares
  // targets and is not touched by this." The same holds for images and meta:
  // their two sides are a target, an alt text or a head field, never a unit.
  if (finding.check !== 'text')
    return { detached: false, reason: `the ${finding.check} check reads no content unit` };

  /** The one tag a text is written in: `absent`, `many`, or the tag. */
  const only = (map, text) => {
    const tags = map.get(text);
    if (!tags) return 'absent';
    return tags.size === 1 ? [...tags][0] : 'many';
  };

  for (const [name, text] of [
    ['production', finding.prod],
    ['new', finding.new],
  ]) {
    if (!text) continue;
    const swallowed = effect[name].lost.get(text) ?? 0;
    if (swallowed === 0) continue;
    if (swallowed === effect[name].occurrences.get(text)) {
      return { detached: true, reason: `the ${name} text goes into its block` };
    }
    return {
      detached: null,
      reason: `the ${name} text is on ${effect[name].occurrences.get(text)} units and the fold takes ${swallowed}`,
    };
  }

  // The tag is not in the id, but two things derived from it are: `detail`,
  // which is `a → p`, and the class, because `restructured` fires when the two
  // sides differ in tag. So the pair of tags matters and neither tag does.
  const before = [
    only(effect.production.tagsNow, finding.prod),
    only(effect.new.tagsNow, finding.new),
  ];
  const after = [
    only(effect.production.tagsAfter, finding.prod),
    only(effect.new.tagsAfter, finding.new),
  ];
  for (const [i, text] of [finding.prod, finding.new].entries()) {
    if (!text) continue;
    // The corpus was crawled on another day. A text the live page no longer
    // carries is detached already, by an edit, and the fold cannot be charged
    // with it.
    if (before[i] === 'absent') {
      return { detached: null, reason: 'the live page no longer carries this text' };
    }
    if (before[i] === 'many' || after[i] === 'many') {
      return { detached: null, reason: 'the text is written in more than one tag on the page' };
    }
  }
  const moved = before[0] !== after[0] || before[1] !== after[1];
  const move = `${before.join(' vs ')} becomes ${after.join(' vs ')}`;
  if (!moved) return { detached: false, reason: 'neither side moves' };
  if (finding.detail) return { detached: true, reason: `detail ${finding.detail} is in the id` };

  // Only two classes read the tag. `classifyPair()` asks `casing`, `price` and
  // `campaign` **before** it asks whether the tags differ, so a finding in one
  // of those keeps its class however the tags move.
  const agreed = (pair) => pair[0] === pair[1];
  if (!TAG_SENSITIVE.has(finding.class))
    return { detached: false, reason: `${finding.class} does not read the tag: ${move}` };
  if (agreed(before) !== agreed(after))
    return { detached: true, reason: `the class moves: ${move}` };
  return { detached: false, reason: `both sides move together: ${move}` };
}

/** The two classes `classifyPair()` decides on the tag. */
const TAG_SENSITIVE = new Set(['copy', 'restructured']);

/** @param {{ store: string, page: string, findingId?: string }} event */
function detaches(event) {
  const key = `${event.store}|${event.page}`;
  const report = reports.get(key);
  const finding = report?.findings.find((candidate) => candidate.id === event.findingId);
  // Ticket 62 removed 391 ids in the rebuild before this one. An override on a
  // finding the report no longer holds is an orphan already.
  if (!finding) return { detached: null, reason: 'the finding is not in the current report' };
  return { ...foldChangesId(finding, effects.get(key)), finding };
}

const rows = [];
for (const event of live) {
  const base = {
    store: event.store,
    page: event.page,
    kind: event.action,
    key: event.findingId ?? event.class ?? '',
  };
  if (event.scope === 'finding') {
    const { detached, reason, finding } = detaches(event);
    rows.push({ ...base, detached, reason, class: finding?.class ?? null });
  } else if (event.scope === 'page-class') {
    // The withdrawn override of ADR 0011. Its key was page-plus-class, no text entered
    // it, so the fold cannot detach it. This branch stays because eleven rows on the
    // table still carry the scope: dropping it would send them to the review branch
    // below, which dereferences a report and would throw. A probe that reads the real
    // table has to read all of it.
    rows.push({ ...base, detached: false, reason: 'a withdrawn override, keyed on no text' });
  } else {
    // A review records the hash over the **work** finding ids, so it goes
    // stale when one of those ids moves — including a `copy` that becomes a
    // `restructured`, which is not work, and that leaves the work set without any text
    // changing at all.
    //
    // **That rule was retired on 2026-08-13 by ticket 118 and ADR 0013**: the hash now
    // covers every finding, in any class. This branch is left as it ran, because the
    // probe is spent — ticket 67 landed 2026-08-10 and the header already says a run
    // after the fold measures the wrong thing. It is evidence of the day, not a rule.
    // Anyone reviving this file must take the `isWork` filter below out with it.
    const key = `${event.store}|${event.page}`;
    const effect = effects.get(key);
    const work = reports.get(key).findings.filter((finding) => isWork(finding.class));
    const verdicts = work.map((finding) => foldChangesId(finding, effect).detached);
    const touched = ['production', 'new'].some(
      (side) => effect[side].lost.size > 0 || effect[side].created.size > 0,
    );
    if (verdicts.includes(true)) {
      rows.push({
        ...base,
        detached: true,
        reason: `${verdicts.filter(Boolean).length} work findings change id`,
      });
    } else if (touched || verdicts.includes(null)) {
      // The fold adds units, and a new unit can make a work finding this
      // probe cannot predict. Only the rebuild answers that.
      rows.push({
        ...base,
        detached: null,
        reason: 'the fold changes units on this page, so the work set may move',
      });
    } else {
      rows.push({ ...base, detached: false, reason: 'the fold touches nothing on this page' });
    }
  }
}

// `muted` is retired (ADR 0011) and is still a column here, because this probe counts what
// the table holds and not what the app can write. Dropping it would silently omit rows.
const kinds = ['dismissed', 'fixed', 'muted', 'reviewed'];

console.log(`\nOverride log: ${events.length} events, ${live.length} live.\n`);
console.log(`| store | ${kinds.map((kind) => `${kind} live | detached`).join(' | ')} |`);
console.log(`|---${'|---'.repeat(kinds.length * 2)}|`);
// Every store, with its zeros. A store an editor has not touched is an answer.
const line = (label, here) =>
  console.log(
    `| ${label} | ${kinds
      .map((kind) => {
        const of = here.filter((row) => row.kind === kind);
        const undecided = of.filter((row) => row.detached === null).length;
        return (
          `${of.length} | ${of.filter((row) => row.detached === true).length}` +
          (undecided ? ` (+${undecided} undecided)` : '')
        );
      })
      .join(' | ')} |`,
  );
for (const store of STORES)
  line(
    store,
    rows.filter((row) => row.store === store),
  );
line('**all six**', rows);

// Ticket 62's rebuild removed 391 finding ids the day before. This says how
// many live overrides that rebuild orphaned, without the fold being involved.
const orphans = rows.filter(
  (row) => row.reason === 'the finding is not in the current report',
).length;
console.log(`\nLive overrides whose finding is not in the current report: ${orphans}.`);

console.log('\nEvery live override:');
for (const row of rows) {
  const verdict = row.detached === null ? 'UNDECIDED' : row.detached ? 'DETACHES ' : 'holds    ';
  console.log(
    `  ${verdict} ${row.kind} ${row.store}/${row.page} ` +
      `${row.key}${row.class ? ` (${row.class})` : ''}${row.reason ? ` — ${row.reason}` : ''}`,
  );
}
