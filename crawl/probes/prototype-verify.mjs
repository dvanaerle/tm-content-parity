// PROTOTYPE - throwaway. Renders each variant headless and reports JS errors.
import { chromium } from 'playwright';

const base = new URL('../_prototype/index.html', import.meta.url).href;
const outDir = new URL('../_prototype/', import.meta.url);
const browser = await chromium.launch();

for (const v of ['A', 'B', 'C']) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));

  await page.goto(`${base}?variant=${v}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const info = await page.evaluate(() => ({
    mounted: document.getElementById('root').children.length > 0,
    chars: document.body.innerText.length,
    bar: document.body.innerText.toLowerCase().includes('prototype'),
  }));

  console.log(
    `variant ${v}: ${JSON.stringify(info)} errors: ${errors.length ? JSON.stringify(errors.slice(0, 3)) : 'none'}`,
  );
  await page.screenshot({
    path: new URL(`variant-${v}.png`, outDir).pathname.slice(1),
    fullPage: false,
  });
  await page.close();
}

await browser.close();
