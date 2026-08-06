// Stage 4 - full-page captures, desktop 1440 and mobile 390, JPEG quality 85.
// The new site is the subject. Production is used only for legacy-only pages.
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const rows = JSON.parse(
  readFileSync(new URL('../_data/03-merged.json', import.meta.url), 'utf8')
).rows;

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];
const OUT = fileURLToPath(new URL('../screenshots/', import.meta.url));
const LARGE_MB = 5;

const browser = await chromium.launch();
const report = { captured: [], failed: [], large: [] };
let index = 0;

for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: 1,
    isMobile: viewport.name === 'mobile',
    hasTouch: viewport.name === 'mobile',
    userAgent: 'Mozilla/5.0 (sitemap-inventory; internal)',
  });

  for (const row of rows) {
    const file = join(OUT, `${row.slug}-${viewport.name}.jpg`);
    if (existsSync(file)) continue; // Resumable: a rerun skips finished captures.

    const url = row.wireframe_source === 'new' ? row.new_url : row.full_url;
    const page = await context.newPage();
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      // Cookie walls and lazy images both need the page scrolled through.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 800) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 60));
        }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(400);
      await page.screenshot({ path: file, fullPage: true, type: 'jpeg', quality: 85 });

      const mb = statSync(file).size / 1024 / 1024;
      if (mb > LARGE_MB) report.large.push({ slug: row.slug, viewport: viewport.name, mb: +mb.toFixed(1) });
      report.captured.push(`${row.slug}-${viewport.name}`);
    } catch (error) {
      report.failed.push({ slug: row.slug, viewport: viewport.name, url, error: String(error).slice(0, 160) });
    } finally {
      await page.close();
    }

    index++;
    if (index % 10 === 0) {
      process.stdout.write(`\r${index} captures done, ${report.failed.length} failed   `);
    }
  }
  await context.close();
}

await browser.close();
writeFileSync(
  new URL('../_data/04-screenshots.json', import.meta.url),
  JSON.stringify(report, null, 2)
);
console.log(`\ncaptured ${report.captured.length} | failed ${report.failed.length} | over ${LARGE_MB}MB: ${report.large.length}`);
