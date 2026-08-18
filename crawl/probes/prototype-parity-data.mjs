// PROTOTYPE - throwaway. Answers: "what should the parity page view look like,
// and do element-level findings read as trustworthy or as noise?"
// Fetches one page from prod + new, aligns their content units, writes findings
// JSON for _prototype/index.html. Not production code.

import { parse } from 'node-html-parser';
import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const SLUG = process.argv[2] ?? 'heavy-duty-terrasoverkapping';
const PROD = `https://www.tuinmaximaal.nl/${SLUG}`;
const NEW = `https://m2stagingnl.intern.systems/${SLUG}`;

const TEXT_TAGS = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,dt,dd,button,a,figcaption,th,td';

// Chrome nodes that are not page content. Boilerplate inflates the diff and is
// the single biggest source of false positives.
const CHROME = [
  'header',
  'footer',
  'nav',
  'form',
  'script',
  'style',
  'noscript',
  '[class*="breadcrumb"]',
  '[class*="cookie"]',
  '[class*="newsletter"]',
  '[class*="menu"]',
  '[class*="modal"]',
  '[class*="drawer"]',
  '[class*="usp-bar"]',
  '[class*="trustpilot"]',
  '[role="dialog"]',
];

const normalise = (s) =>
  s
    .replace(/ /g, ' ')
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();

// Number-insensitive form. Prices, stock counts and review totals legitimately
// differ between environments; masking them separates "content changed" from
// "data changed".
const maskNumbers = (s) => s.replace(/\d[\d.,]*/g, '#');

function textOf(node) {
  return normalise(node.structuredText ?? node.text ?? '');
}

function extractElements(html) {
  const root = parse(html);
  const main =
    root.querySelector('main') ??
    root.querySelector('#maincontent') ??
    root.querySelector('body') ??
    root;

  for (const selector of CHROME) {
    for (const node of main.querySelectorAll(selector)) node.remove();
  }

  const candidates = main.querySelectorAll(TEXT_TAGS);
  const out = [];

  for (const node of candidates) {
    // Skip containers: if it holds another content unit, its children speak.
    if (node.querySelectorAll(TEXT_TAGS).length > 0) continue;

    const tag = node.rawTagName.toLowerCase();
    if (tag === 'a') {
      const isCta =
        node.getAttribute('data-element') === 'link' ||
        /button|btn|cta/i.test(node.getAttribute('class') ?? '');
      if (!isCta) continue;
    }

    const raw = textOf(node);
    if (!raw || raw.length < 2) continue;
    if (/^[\s\W]+$/.test(raw)) continue;

    out.push({
      index: out.length,
      tag,
      kind: /^h[1-6]$/.test(tag) ? 'heading' : tag === 'a' || tag === 'button' ? 'cta' : 'text',
      level: /^h[1-6]$/.test(tag) ? Number(tag.slice(1)) : null,
      raw,
      norm: raw.toLowerCase(),
      masked: maskNumbers(raw.toLowerCase()),
    });
  }
  return out;
}

function extractImages(html) {
  const root = parse(html);
  const main = root.querySelector('main') ?? root.querySelector('body') ?? root;
  for (const selector of CHROME) {
    for (const node of main.querySelectorAll(selector)) node.remove();
  }
  return main
    .querySelectorAll('img')
    .map((img, i) => {
      const src = img.getAttribute('src') ?? img.getAttribute('data-src') ?? '';
      return {
        index: i,
        src,
        // Magento rewrites cache paths per environment, so the filename is the
        // only stable identity.
        file: decodeURIComponent(src.split('?')[0].split('/').pop() ?? ''),
        alt: normalise(img.getAttribute('alt') ?? ''),
      };
    })
    .filter((img) => img.file);
}

// Token overlap, 0..1. Cheap enough for a prototype and good enough to tell
// "same sentence, edited" from "different sentence".
function similarity(a, b) {
  const ta = new Set(a.split(' ').filter(Boolean));
  const tb = new Set(b.split(' ').filter(Boolean));
  if (!ta.size || !tb.size) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared += 1;
  return (2 * shared) / (ta.size + tb.size);
}

// Longest common subsequence over a key, so insertions on one side do not
// cascade into every later element being reported as different.
function lcsPairs(left, right, key) {
  const n = left.length;
  const m = right.length;
  const table = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) {
    for (let j = m - 1; j >= 0; j -= 1) {
      table[i][j] =
        left[i][key] === right[j][key]
          ? table[i + 1][j + 1] + 1
          : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const pairs = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (left[i][key] === right[j][key]) {
      pairs.push([i, j]);
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) i += 1;
    else j += 1;
  }
  return pairs;
}

function compare(prod, next) {
  const anchors = lcsPairs(prod, next, 'norm');
  const matchedProd = new Set(anchors.map(([i]) => i));
  const matchedNew = new Set(anchors.map(([, j]) => j));

  const rows = [];
  for (const [i, j] of anchors) {
    const p = prod[i];
    const n = next[j];
    rows.push({
      status: p.raw === n.raw ? 'match' : 'match-normalised',
      prod: p,
      new: n,
      note: p.raw === n.raw ? null : 'Identical after whitespace and quote normalisation',
    });
  }

  // Pair up the leftovers by similarity: an edited paragraph, not a missing one.
  const leftProd = prod.filter((p) => !matchedProd.has(p.index));
  const leftNew = next.filter((n) => !matchedNew.has(n.index));
  const usedNew = new Set();

  for (const p of leftProd) {
    let best = null;
    let bestScore = 0;
    for (const n of leftNew) {
      if (usedNew.has(n.index)) continue;
      if (n.kind !== p.kind) continue;
      const score = similarity(p.norm, n.norm);
      if (score > bestScore) {
        bestScore = score;
        best = n;
      }
    }
    if (best && bestScore >= 0.55) {
      usedNew.add(best.index);
      const numbersOnly = p.masked === best.masked;
      rows.push({
        status: numbersOnly ? 'differs-numbers' : 'differs',
        prod: p,
        new: best,
        similarity: Number(bestScore.toFixed(2)),
        note: numbersOnly
          ? 'Only numbers differ - likely a price or count, not a content defect'
          : null,
      });
    } else {
      rows.push({ status: 'missing-on-new', prod: p, new: null });
    }
  }

  for (const n of leftNew) {
    if (usedNew.has(n.index)) continue;
    rows.push({ status: 'added-on-new', prod: null, new: n });
  }

  // Document order, driven by prod as the source of truth.
  rows.sort((a, b) => {
    const ai = a.prod?.index ?? (a.new ? a.new.index + 0.5 : 0);
    const bi = b.prod?.index ?? (b.new ? b.new.index + 0.5 : 0);
    return ai - bi;
  });
  return rows;
}

function compareImages(prod, next) {
  const byFile = new Map(next.map((img) => [img.file, img]));
  const seen = new Set();
  const rows = [];
  for (const p of prod) {
    const n = byFile.get(p.file);
    if (n) {
      seen.add(p.file);
      rows.push({
        status: p.alt === n.alt ? 'match' : 'alt-differs',
        prod: p,
        new: n,
        note: p.alt === n.alt ? null : 'Same image file, different alt text',
      });
    } else {
      rows.push({ status: 'missing-on-new', prod: p, new: null });
    }
  }
  for (const n of next) {
    if (!seen.has(n.file)) rows.push({ status: 'added-on-new', prod: null, new: n });
  }
  return rows;
}

const [prodHtml, newHtml] = await Promise.all([
  fetch(PROD).then((r) => r.text()),
  fetch(NEW).then((r) => r.text()),
]);

// ---- noise control
// The raw diff of one page produced 88 findings, of which roughly a dozen were
// real. These two passes are what the log lives or dies on.

const PROMO = /korting|deal|actie(?!f)|aanbieding|black\s*friday|sale|nu\s+vanaf|op\s+voorraad/i;
const PRICE = /^\s*€|€\s*\d|^\s*\d+[.,]\d{2}\s*$/;

function classify(row) {
  const text = `${row.prod?.raw ?? ''} ${row.new?.raw ?? ''}`;
  const tag = row.prod?.tag ?? row.new?.tag;

  if (row.status === 'match') return { class: 'ok', confidence: 'high' };
  if (row.status === 'match-normalised') {
    return {
      class: 'formatting',
      confidence: 'low',
      hint: 'Whitespace, casing or quote style only. Not a content defect.',
    };
  }
  if (row.status === 'differs-numbers' || PRICE.test(text)) {
    return {
      class: 'price',
      confidence: 'low',
      hint: 'Price or number. Environments hold different catalogue data - probably not a defect.',
    };
  }
  if (PROMO.test(text)) {
    return {
      class: 'campaign',
      confidence: 'low',
      hint: 'Campaign or stock copy. Time-limited, so a mismatch is expected.',
    };
  }
  if (tag === 'td' || tag === 'th') {
    return {
      class: 'restructured',
      confidence: 'low',
      hint: 'Table cell. The new site rebuilt this block as a table, so the same content reads as new.',
    };
  }
  if (row.status === 'differs') {
    return { class: 'copy', confidence: (row.similarity ?? 0) >= 0.8 ? 'medium' : 'high' };
  }
  return { class: 'structure', confidence: 'high' };
}

// One rename repeated six times is one task, not six.
function group(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = `${row.status}|${row.prod?.norm ?? ''}|${row.new?.norm ?? ''}`;
    const existing = groups.get(key);
    if (existing) {
      existing.occurrences += 1;
      existing.positions.push(row.prod?.index ?? row.new?.index ?? null);
      continue;
    }
    groups.set(key, {
      ...row,
      ...classify(row),
      // Hash, not base64 of the key itself. Truncating base64(key) collided
      // hard: the leading status string ate the whole budget, so 156 findings
      // shared 88 ids and one id covered 30 unrelated findings. See ticket 01.
      id: `${SLUG}:${row.status}:${createHash('sha256').update(key).digest('base64url').slice(0, 16)}`,
      occurrences: 1,
      positions: [row.prod?.index ?? row.new?.index ?? null],
    });
  }
  return [...groups.values()];
}

const prodEls = extractElements(prodHtml);
const newEls = extractElements(newHtml);
const rows = group(compare(prodEls, newEls));
const images = compareImages(extractImages(prodHtml), extractImages(newHtml));

const meta = (html) => {
  const root = parse(html);
  return {
    title: root.querySelector('title')?.text?.trim() ?? '',
    description: root.querySelector('meta[name="description"]')?.getAttribute('content') ?? '',
    h1: root.querySelector('h1')?.text?.trim() ?? '',
  };
};

const payload = {
  generated: new Date().toISOString(),
  slug: SLUG,
  prodUrl: PROD,
  newUrl: NEW,
  meta: { prod: meta(prodHtml), new: meta(newHtml) },
  counts: {
    prodElements: prodEls.length,
    newElements: newEls.length,
    rawFindings: rows.reduce((n, r) => n + (r.status === 'match' ? 0 : r.occurrences), 0),
    groupedFindings: rows.filter((r) => r.status !== 'match').length,
    byClass: rows.reduce((acc, r) => ({ ...acc, [r.class]: (acc[r.class] ?? 0) + 1 }), {}),
    byConfidence: rows
      .filter((r) => r.class !== 'ok')
      .reduce((acc, r) => ({ ...acc, [r.confidence]: (acc[r.confidence] ?? 0) + 1 }), {}),
  },
  outline: prodEls,
  rows,
  images,
};

await mkdir(new URL('../_prototype/', import.meta.url), { recursive: true });
await writeFile(
  new URL('../_prototype/findings.json', import.meta.url),
  JSON.stringify(payload, null, 2),
);
// Also as a script file, so index.html opens straight from file:// with no
// server - fetch() is blocked on file:// but a <script src> is not.
await writeFile(
  new URL('../_prototype/findings.js', import.meta.url),
  `window.__PARITY__ = ${JSON.stringify(payload)};\n`,
);

console.log(`prod elements ${prodEls.length} | new elements ${newEls.length}`);
console.log(payload.counts);
console.log(`images: ${images.length} rows`);
