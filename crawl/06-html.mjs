// Stage 6 - wrap every markdown file in a viewer that renders the Mermaid
// diagrams. Markdown alone shows the diagrams as code blocks outside GitLab.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';

const MERMAID = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';
const MARKED = 'https://cdn.jsdelivr.net/npm/marked@14/lib/marked.esm.js';

// The markdown travels inside the page, so the viewer needs no web server.
// Opening the file straight from disk is enough.
const page = (title, markdown, depth) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  :root { --line: #e2e8f0; --muted: #64748b; --bg: #ffffff; --code: #f1f5f9; }
  * { box-sizing: border-box; }
  body {
    margin: 0; padding: 2rem clamp(1rem, 5vw, 4rem) 6rem;
    font: 16px/1.6 -apple-system, "Segoe UI", Roboto, sans-serif;
    color: #0f172a; background: var(--bg); max-width: 1400px;
  }
  h1 { font-size: 1.9rem; margin: 0 0 .5rem; }
  h2 { font-size: 1.3rem; margin: 2.5rem 0 .75rem; padding-bottom: .3rem; border-bottom: 1px solid var(--line); }
  h3 { font-size: 1.05rem; margin: 1.75rem 0 .5rem; }
  a { color: #1d4ed8; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; font-size: .87rem; display: block; overflow-x: auto; }
  th, td { border: 1px solid var(--line); padding: .4rem .6rem; text-align: left; vertical-align: top; }
  th { background: #f8fafc; position: sticky; top: 0; }
  tr:nth-child(even) td { background: #fcfdfe; }
  code { background: var(--code); padding: .1rem .3rem; border-radius: 3px; font-size: .85em; }
  pre { background: var(--code); padding: 1rem; overflow-x: auto; border-radius: 6px; }
  blockquote { margin: 1rem 0; padding: .5rem 1rem; border-left: 3px solid var(--line); color: var(--muted); }
  em { color: var(--muted); }
  .mermaid { margin: 1.5rem 0; overflow-x: auto; }
  .mermaid svg { max-width: none !important; height: auto; }
  .nav { margin-bottom: 2rem; font-size: .9rem; color: var(--muted); }
  .nav a { margin-right: 1rem; }
  .filter { margin: 1rem 0; }
  .filter input { padding: .45rem .6rem; border: 1px solid var(--line); border-radius: 4px; width: min(340px, 100%); font-size: .9rem; }
  hr { border: 0; border-top: 1px solid var(--line); margin: 2.5rem 0; }
</style>
</head>
<body>
<div class="nav">
  ${depth ? '<a href="../index.html">&larr; Index</a>' : '<strong>Site architecture</strong>'}
  <a href="${depth ? '../pages.csv' : 'pages.csv'}">pages.csv</a>
</div>
<article id="out"></article>
<div class="filter" hidden><input id="q" type="search" placeholder="Filter table rows..."></div>
<script id="src" type="text/markdown">${markdown.replaceAll('</script', '<\\/script')}</script>
<script type="module">
import { marked } from '${MARKED}';
import mermaid from '${MERMAID}';

const source = document.getElementById('src').textContent;
const out = document.getElementById('out');
out.innerHTML = marked.parse(source, { gfm: true, breaks: false });

// Links point at the markdown files. In the viewer they should stay in html.
for (const link of out.querySelectorAll('a[href$=".md"]')) {
  link.href = link.href.replace(/\\.md$/, '.html');
}

// marked leaves a mermaid fence as a code block. Mermaid needs its own div.
for (const block of out.querySelectorAll('pre > code.language-mermaid')) {
  const holder = document.createElement('div');
  holder.className = 'mermaid';
  holder.textContent = block.textContent;
  block.parentElement.replaceWith(holder);
}

mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  maxTextSize: 4000000,
  maxEdges: 2000,
  flowchart: { htmlLabels: true, useMaxWidth: false, nodeSpacing: 30, rankSpacing: 55 },
});
try {
  await mermaid.run({ querySelector: '.mermaid' });
} catch (error) {
  console.error(error);
}

// Row filter, useful on the long index tables. It is moved next to the first
// long table so it does not sit above the page title.
const box = document.getElementById('q');
const tables = out.querySelectorAll('table');
const longTable = [...tables].find((table) => (table.tBodies[0]?.rows.length ?? 0) > 15);
if (longTable) {
  const holder = box.parentElement;
  holder.hidden = false;
  longTable.parentElement.insertBefore(holder, longTable);
  box.addEventListener('input', () => {
    const needle = box.value.toLowerCase();
    for (const table of tables) {
      for (const row of table.tBodies[0]?.rows ?? []) {
        row.hidden = needle && !row.textContent.toLowerCase().includes(needle);
      }
    }
  });
}
</script>
</body>
</html>
`;

const root = new URL('../', import.meta.url);
const firstHeading = (markdown) => markdown.match(/^#\s+(.+)$/m)?.[1] ?? 'Page';

const indexMarkdown = readFileSync(new URL('index.md', root), 'utf8');
writeFileSync(new URL('index.html', root), page('Site architecture', indexMarkdown, false));

let count = 0;
for (const file of readdirSync(new URL('pages/', root))) {
  if (!file.endsWith('.md')) continue;
  const markdown = readFileSync(new URL(`pages/${file}`, root), 'utf8');
  writeFileSync(
    new URL(`pages/${file.replace(/\.md$/, '.html')}`, root),
    page(firstHeading(markdown), markdown, true)
  );
  count++;
}

console.log(`wrote index.html and ${count} page files`);
