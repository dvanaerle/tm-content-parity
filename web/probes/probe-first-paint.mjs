/**
 * First paint on the two pages ticket 68 names: LCP, FCP and TBT.
 *
 * `crawl/probes/` holds crawl measurements. This measures `web/`, so it lives here.
 * It is evidence and never an import.
 *
 * **No Playwright.** Ticket 19 ruled browser automation out of the crawl for good,
 * and a probe is not a reason to bring the dependency back. This speaks the DevTools
 * protocol over the `WebSocket` that Node itself has, to the Chrome that is already
 * on the machine. It adds no dependency to the repository.
 *
 * A browser number is **evidence and not a passing condition**: no test can re-check
 * it, and this file is where it is measured rather than asserted.
 *
 *   npm run build && node api/server.mjs 4321 &
 *   node web/probes/probe-first-paint.mjs http://127.0.0.1:4321/nl/privacy-beleid
 *
 * `CHROME` overrides the browser path. `--cpu <rate>` throttles the CPU; the default
 * runs 1 and 4, because an unthrottled desktop number flatters the page and the
 * thresholds this probe is read against are field thresholds.
 */

import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** Read after the load event, so a late LCP candidate is in the number. */
const SETTLE_MS = 3_000;

/** Kept runs for each rate. The median of three, and the spread beside it. */
const RUNS = 3;

const CHROMES = [
  process.env.CHROME,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`,
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

/**
 * The observer runs before the document does, so nothing is missed and nothing is
 * inferred from a trace afterwards.
 *
 * `tbt` is the blocking time over the whole measurement window rather than to
 * interactive: the page is a static Astro build with one React island, so the window
 * closes well after the island has hydrated.
 */
const OBSERVE = `
  window.__paint = { lcp: 0, fcp: 0, tbt: 0, tasks: 0, longest: 0 };
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) window.__paint.lcp = entry.startTime;
  }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name === 'first-contentful-paint') window.__paint.fcp = entry.startTime;
    }
  }).observe({ type: 'paint', buffered: true });
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__paint.tasks += 1;
      window.__paint.tbt += Math.max(0, entry.duration - 50);
      window.__paint.longest = Math.max(window.__paint.longest, entry.duration);
    }
  }).observe({ type: 'longtask', buffered: true });
`;

/** @param {string} url */
async function json(url) {
  const answer = await fetch(url);
  return answer.json();
}

/** @param {number} port */
async function waitForChrome(port) {
  for (let tries = 0; tries < 100; tries += 1) {
    try {
      return await json(`http://127.0.0.1:${port}/json/version`);
    } catch {
      await new Promise((wake) => setTimeout(wake, 100));
    }
  }
  throw new Error('Chrome did not open a debugging port');
}

/**
 * One page, one CPU rate.
 *
 * @param {string} target  The page target's WebSocket url.
 * @param {string} url
 * @param {number} cpu
 */
async function measure(target, url, cpu) {
  const socket = new WebSocket(target);
  await new Promise((open, fail) => {
    socket.addEventListener('open', open, { once: true });
    socket.addEventListener('error', fail, { once: true });
  });

  let id = 0;
  /** @type {Map<number, (result: object) => void>} */
  const waiting = new Map();
  /** @type {Map<string, () => void>} */
  const events = new Map();

  socket.addEventListener('message', (message) => {
    const frame = JSON.parse(message.data);
    if (frame.id !== undefined) waiting.get(frame.id)?.(frame.result);
    else events.get(frame.method)?.();
  });

  const send = (method, params = {}) =>
    new Promise((done) => {
      id += 1;
      waiting.set(id, done);
      socket.send(JSON.stringify({ id, method, params }));
    });

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: OBSERVE });

  const loaded = new Promise((done) => events.set('Page.loadEventFired', done));
  await send('Page.navigate', { url });
  await loaded;
  await new Promise((wake) => setTimeout(wake, SETTLE_MS));

  const { result } = await send('Runtime.evaluate', {
    expression: 'JSON.stringify(window.__paint)',
    returnByValue: true,
  });

  await send('Page.navigate', { url: 'about:blank' });
  socket.close();
  return JSON.parse(result.value);
}

const urls = process.argv.slice(2).filter((argument) => argument.startsWith('http'));
if (urls.length === 0) {
  console.error('Give one url or more. The site must be served: node api/server.mjs 4321');
  process.exit(2);
}

const asked = process.argv.indexOf('--cpu');
const rates = asked === -1 ? [1, 4] : [Number(process.argv[asked + 1])];

const browser = CHROMES.find(Boolean);
const profile = await mkdtemp(join(tmpdir(), 'tm-paint-'));
const port = 9333;

const chrome = spawn(
  browser,
  [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--window-size=1440,900',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

try {
  const version = await waitForChrome(port);
  console.log(`\n${version.Browser}, ${SETTLE_MS} ms after load, window 1440 × 900.`);

  /** @type {{ webSocketDebuggerUrl: string, type: string }[]} */
  const targets = await json(`http://127.0.0.1:${port}/json/list`);
  const page = targets.find((one) => one.type === 'page');

  for (const url of urls) {
    console.log(`\n${url}`);
    console.log('  cpu     LCP        FCP        TBT      LCP spread    TBT spread');
    for (const cpu of rates) {
      // One navigation is thrown away and three are kept, and the median is
      // reported with its spread. A single run on a shared machine moves by
      // hundreds of milliseconds, and a before-and-after read off two single runs
      // reports noise as a result.
      await measure(page.webSocketDebuggerUrl, url, cpu);
      /** @type {object[]} */
      const runs = [];
      for (let run = 0; run < RUNS; run += 1) {
        runs.push(await measure(page.webSocketDebuggerUrl, url, cpu));
      }

      const middle = (field) => {
        const sorted = runs.map((paint) => paint[field]).sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)];
      };
      const spread = (field) => {
        const sorted = runs.map((paint) => paint[field]).sort((a, b) => a - b);
        return `${Math.round(sorted[0])}–${Math.round(sorted.at(-1))}`;
      };

      console.log(
        `  ${String(cpu).padEnd(6)}` +
          `${`${Math.round(middle('lcp'))} ms`.padEnd(11)}` +
          `${`${Math.round(middle('fcp'))} ms`.padEnd(11)}` +
          `${`${Math.round(middle('tbt'))} ms`.padEnd(9)}` +
          `${spread('lcp').padEnd(14)}` +
          `${spread('tbt')}`,
      );
    }
  }
  console.log();
} finally {
  chrome.kill();
  // Windows keeps the profile's files open until the process is gone, so the wait
  // is not politeness.
  await new Promise((done) => chrome.once('exit', done));
  await rm(profile, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 });
}
