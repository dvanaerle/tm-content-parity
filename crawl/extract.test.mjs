import { describe, expect, it, vi } from 'vitest';

import { exclusionReason, isExcludedPage } from './excluded-pages.mjs';
import { extractPage, pageType, toMarkdown } from './extract.mjs';
import { imageKey, linkKey } from './keys.mjs';
import { maintenanceReason } from './fetch-page.mjs';
import { tier1 } from './normalise.mjs';

const CONTEXT = {
  store: 'nl',
  page: 'overkappingen',
  side: 'production',
  url: 'https://www.tuinmaximaal.nl/overkappingen',
  prodHost: 'www.tuinmaximaal.nl',
  newHost: 'valanticnl.intern.systems',
  onWarn: () => {},
};

const page = (main, { bodyClass = 'cms-page-view', head = '' } = {}) => `
<!doctype html><html><head>${head}</head>
<body class="${bodyClass}"><header class="page-header"><p>Alles modulair</p></header>
<main>${main}</main>
<footer><p>Footer copy</p></footer></body></html>`;

describe('tier1', () => {
  it('folds the invisible differences', () => {
    expect(tier1('Prijs “nu” – &amp; meer')).toBe('Prijs "nu" - & meer');
  });

  it('keeps letter case and trailing punctuation, because tier 2 is a finding', () => {
    expect(tier1('Levering in 5 werkdagen.')).toBe('Levering in 5 werkdagen.');
    expect(tier1('Kleuren')).not.toBe(tier1('kleuren'));
  });
});

describe('the content boundary', () => {
  it('is <main>, and nothing outside it counts', () => {
    const extract = extractPage(page('<h1>Overkappingen</h1>'), CONTEXT);
    expect(extract.boundary).toBe('main');
    expect(extract.elements.map((element) => element.raw)).toEqual(['Overkappingen']);
  });

  it('falls back to <body> and strips chrome when the page has no <main>', () => {
    const onWarn = vi.fn();
    const html = `<!doctype html><html><body class="cms-page-view">
      <header><p>Chrome copy</p></header>
      <nav><a href="/x">Menu link</a></nav>
      <ul class="breadcrumbs"><li>Home</li></ul>
      <p>Real page copy</p>
      <footer><p>Footer copy</p></footer></body></html>`;
    const extract = extractPage(html, { ...CONTEXT, onWarn });

    expect(extract.boundary).toBe('body');
    expect(onWarn).toHaveBeenCalledOnce();
    expect(extract.elements.map((element) => element.raw)).toEqual(['Real page copy']);
  });

  it('does not read a nested <style> or <script> as content', () => {
    // Production nests both inside an `<a>`, and that anchor holds no other text
    // element, so it is a leaf and `structuredText` handed over the CSS as copy.
    // 151 elements on 23 of 179 nl pages. Ticket 02 put the chrome list on the
    // fallback path only, having measured that it removes no *element* inside
    // `<main>` — which is true, and misses this.
    const extract = extractPage(page(
      '<a href="/carport">'
      + '<style>.product-image-container-9656 { width: 480px; }</style>'
      + '<script>var x = document.querySelectorAll(".a");</script>'
      + 'Bekijk carports</a>',
    ), CONTEXT);
    expect(extract.elements.map((element) => element.raw)).toEqual(['Bekijk carports']);
  });

  it('keeps a <template>, because Alpine renders what is inside it', () => {
    const extract = extractPage(page('<template><p>Gratis bezorging</p></template>'), CONTEXT);
    expect(extract.elements.map((element) => element.raw)).toEqual(['Gratis bezorging']);
  });

  it('throws when the document has no <body>, because a silent fallback hid a broken parse', () => {
    expect(() => extractPage('<p>orphan</p>', { ...CONTEXT }))
      .toThrow(/No <body>/);
  });

  it('throws on a 200 page that holds nothing, because that is an app page or a broken parse', () => {
    // The whole of <main> on the new site's veranda-configurator.
    const mount = '<div id="configurator-root" data-url-key="veranda"></div>';
    expect(() => extractPage(page(mount), CONTEXT))
      .toThrow(/application page that\s+belongs in crawl\/excluded-pages\.mjs/);
  });

  it('leaves a page with images and no text alone, because a photo page is a real page', () => {
    const extract = extractPage(page('<img src="/media/serre.jpg" alt="Serre">'), CONTEXT);
    expect(extract.elements).toEqual([]);
    expect(extract.images).toHaveLength(1);
  });

  it('leaves an empty non-200 page alone, because the status gate already excludes it', () => {
    const extract = extractPage(page(''), { ...CONTEXT, status: 404 });
    expect(extract.elements).toEqual([]);
  });

  it('survives the malformed header markup that the new site sends', () => {
    // Ticket 14: an unterminated <div> inside a <template> in the header. Without
    // closeAllByClosing the parser deletes <body> and <header>.
    const html = `<!doctype html><html><body class="cms-page-view">
      <header class="page-header"><template><div class="live-search"<!-- broken -->
      <p>Geen resultaten gevonden</p></template></header>
      <main><h1>Overkappingen</h1></main></body></html>`;
    const extract = extractPage(html, CONTEXT);

    expect(extract.boundary).toBe('main');
    expect(extract.elements.map((element) => element.raw)).toEqual(['Overkappingen']);
  });
});

describe('text elements', () => {
  it('takes the leaves in document order and skips the containers', () => {
    const extract = extractPage(page('<div><h2>Kleuren</h2><ul><li>Antraciet</li><li>Wit</li></ul></div>'), CONTEXT);
    expect(extract.elements).toMatchObject([
      { index: 0, tag: 'h2', kind: 'heading', level: 2, raw: 'Kleuren' },
      { index: 1, tag: 'li', kind: 'text', level: null, raw: 'Antraciet' },
      { index: 2, tag: 'li', kind: 'text', level: null, raw: 'Wit' },
    ]);
  });

  it('counts every anchor, not only the ones that look like a button', () => {
    const extract = extractPage(page('<p><a href="/carport">Lees over carports</a></p><a class="btn" href="/offerte">Offerte</a>'), CONTEXT);
    expect(extract.elements.map((element) => [element.kind, element.raw])).toEqual([
      ['cta', 'Lees over carports'],
      ['cta', 'Offerte'],
    ]);
  });

  it('keeps the raw text and the tier-1 text apart', () => {
    const extract = extractPage(page('<p>Prijs “nu”</p>'), CONTEXT);
    expect(extract.elements[0].raw).toBe('Prijs “nu”');
    expect(extract.elements[0].norm).toBe('Prijs "nu"');
  });

  it('drops text that carries no letter and no number', () => {
    const extract = extractPage(page('<p>—</p><p>••</p><p>OK</p>'), CONTEXT);
    expect(extract.elements.map((element) => element.raw)).toEqual(['OK']);
  });

  it('separates the child texts that the parser glues together', () => {
    const extract = extractPage(page('<p>samplepakket</p><button>Vraag aan</button>'), CONTEXT);
    expect(extract.elements.map((element) => element.raw)).toEqual(['samplepakket', 'Vraag aan']);
  });

  it('reads a heading that wraps an accordion anchor as the heading', () => {
    // Ticket 33. Production builds every FAQ question as
    // `<h4 class="panel-title"><a data-toggle="collapse" …>`, so the anchor is
    // the leaf and the heading level was thrown away: the element read as a
    // `cta` with no level, against a plain `<h3>` on the new site. 337 elements
    // on 40 of 179 nl pages, and it was about to be reported as 330 `a` → `h3`
    // heading-level findings that name the wrong production element.
    const extract = extractPage(page(
      '<div class="panel-heading"><h4 class="panel-title">'
      + '<a data-toggle="collapse" href="#question3890">Is mijn product op voorraad?</a>'
      + '</h4></div>',
    ), CONTEXT);
    expect(extract.elements).toMatchObject([
      { tag: 'h4', kind: 'heading', level: 4, raw: 'Is mijn product op voorraad?' },
    ]);
  });

  it('keeps a heading whole when only part of it is a link', () => {
    // The same rule, and the reason it is "a heading is never a container"
    // rather than a rule about accordions: the leaf rule reported the anchor
    // alone and silently dropped the words around it.
    const extract = extractPage(page('<h2>Bekijk onze <a href="/carport">carports</a> nu</h2>'), CONTEXT);
    expect(extract.elements.map((element) => [element.tag, element.raw])).toEqual([
      ['h2', 'Bekijk onze carports nu'],
    ]);
  });

  it('still takes the leaves inside a container that is not a heading', () => {
    const extract = extractPage(page('<li><p>Antraciet</p></li>'), CONTEXT);
    expect(extract.elements.map((element) => [element.tag, element.raw])).toEqual([
      ['p', 'Antraciet'],
    ]);
  });

  it('still loses loose text beside a heading in a container, and that is recorded', () => {
    // The mirror of the rule above, and **not** fixed in ticket 33: the `<td>` is
    // skipped for holding a text tag, so `Levertijd` is dropped. Rescuing it means
    // emitting the direct text nodes of a container as an element, which changes
    // what an element is and moves the count on all 179 pages. Pinned here so the
    // limit is read rather than discovered.
    const extract = extractPage(page('<table><tr><td>Levertijd <h4>Vraag</h4></td></tr></table>'), CONTEXT);
    expect(extract.elements.map((element) => [element.tag, element.raw])).toEqual([
      ['h4', 'Vraag'],
    ]);
  });

  it('leaves the anchor in the link list when the heading swallows its text', () => {
    // The links walk is its own pass over `a[href]` and ticket 05 owns it. A
    // heading that wraps a real navigational link must still report the link.
    const extract = extractPage(page('<h2><a href="/carport">Carports</a></h2>'), CONTEXT);
    expect(extract.elements.map((element) => element.tag)).toEqual(['h2']);
    expect(extract.links.map((record) => record.text)).toEqual(['Carports']);
  });
});

describe('linkKey', () => {
  const hosts = { prodHost: 'www.tuinmaximaal.nl', newHost: 'valanticnl.intern.systems' };
  const key = (href) => linkKey(new URL(href), hosts);

  it('folds the page\'s own two hosts to one token', () => {
    expect(key('https://www.tuinmaximaal.nl/carport')).toBe(key('https://valanticnl.intern.systems/carport'));
  });

  it('keeps another host apart', () => {
    expect(key('https://www.tuinmaximaal.de/carport')).not.toBe(key('https://www.tuinmaximaal.nl/carport'));
  });

  it('lowercases the path and removes the trailing slash', () => {
    expect(key('https://www.tuinmaximaal.nl/Carport/')).toBe('self/carport');
  });

  it('keeps the query and drops the fragment', () => {
    expect(key('https://www.tuinmaximaal.nl/carport?kleur=wit#specs')).toBe('self/carport?kleur=wit');
  });

  it('folds the percent encoding of the query, which one page sends both ways', () => {
    expect(key('https://www.tuinmaximaal.nl/terrasoverkapping?model=6039,6040'))
      .toBe(key('https://www.tuinmaximaal.nl/terrasoverkapping?model=6039%2C6040'));
  });

  it('keeps two different queries apart', () => {
    expect(key('https://www.tuinmaximaal.nl/terrasoverkapping?model=6039'))
      .not.toBe(key('https://www.tuinmaximaal.nl/terrasoverkapping?model=6040'));
  });
});

describe('links', () => {
  it('skips the three non-navigational shapes and keeps the rest', () => {
    const extract = extractPage(page(`
      <a href="#top">Naar boven</a>
      <a href="mailto:info@tuinmaximaal.nl">Mail ons</a>
      <a href="tel:+31123">Bel ons</a>
      <a href="/carport">Carport</a>
      <a href="https://www.youtube.com/watch?v=1">Video</a>`), CONTEXT);

    expect(extract.links.map((link) => link.href)).toEqual(['/carport', 'https://www.youtube.com/watch?v=1']);
  });

  it('resolves the url and marks the internal targets', () => {
    const extract = extractPage(page('<a href="/carport">Carport</a><a href="https://www.youtube.com/x">Video</a>'), CONTEXT);
    expect(extract.links[0]).toMatchObject({
      url: 'https://www.tuinmaximaal.nl/carport',
      key: 'self/carport',
      text: 'Carport',
      internal: true,
    });
    expect(extract.links[1].internal).toBe(false);
  });

  it('marks a live-domain and a valantic host as internal', () => {
    const extract = extractPage(page(`
      <a href="https://www.tuinmaximaal.de/carport">DE</a>
      <a href="https://valanticbe.intern.systems/carport">BE</a>`), CONTEXT);
    expect(extract.links.map((link) => link.internal)).toEqual([true, true]);
  });
});

describe('imageKey', () => {
  it('is the basename, lowercased, extension kept', () => {
    expect(imageKey('/cdn-cgi/image/quality=75/media/wysiwyg/tm/nl-nl/Terras_Antraciet.jpg?x=1'))
      .toBe('terras_antraciet.jpg');
  });

  it('matches across the two environment paths', () => {
    expect(imageKey('https://www.tuinmaximaal.nl/media/wysiwyg/tm/nl-nl/afbeeldingen/Veranda.jpg'))
      .toBe(imageKey('https://valanticnl.intern.systems/media/wysiwyg/Veranda.jpg'));
  });

  it('removes a true size suffix', () => {
    expect(imageKey('/media/Veranda-1292x729.jpg')).toBe('veranda.jpg');
    expect(imageKey('/media/Veranda_800x600.jpg')).toBe('veranda.jpg');
  });

  it('never removes a bare _N, which is the only thing separating two gallery photos', () => {
    expect(imageKey('/media/terrasoverkapping_antraciet_2.jpg'))
      .not.toBe(imageKey('/media/terrasoverkapping_antraciet_3.jpg'));
  });

  it('decodes an escaped basename', () => {
    expect(imageKey('/media/Terras%20Antraciet.jpg')).toBe('terras antraciet.jpg');
  });
});

describe('images', () => {
  it('holds each identity once, because the new site emits a mobile and a desktop copy', () => {
    const extract = extractPage(page(`
      <img src="/media/Veranda.jpg" alt="Veranda">
      <img src="/media/Veranda.jpg" alt="Veranda">`), CONTEXT);
    expect(extract.images).toEqual([{ key: 'veranda.jpg', src: '/media/Veranda.jpg', alt: 'Veranda' }]);
  });

  it('takes the real alt when the two copies disagree', () => {
    const extract = extractPage(page(`
      <img src="/media/Veranda.jpg" alt="">
      <img src="/media/Veranda.jpg" alt="Veranda in antraciet">`), CONTEXT);
    expect(extract.images[0].alt).toBe('Veranda in antraciet');
  });

  it('keeps an absent alt and an empty alt apart', () => {
    const extract = extractPage(page('<img src="/media/A.jpg"><img src="/media/B.jpg" alt="">'), CONTEXT);
    expect(extract.images.map((image) => image.alt)).toEqual([null, '']);
  });

  it('falls back to data-src', () => {
    const extract = extractPage(page('<img data-src="/media/Lazy.jpg" alt="Lazy">'), CONTEXT);
    expect(extract.images[0].src).toBe('/media/Lazy.jpg');
  });

  it('counts an image with no identity as a diagnostic, never as an image', () => {
    const extract = extractPage(page('<img alt="icon" width="24"><img src="/media/A.jpg">'), CONTEXT);
    expect(extract.images).toHaveLength(1);
    expect(extract.diagnostics.imagesWithoutSrc).toBe(1);
  });
});

describe('meta', () => {
  it('reads the head and the first h1 inside the boundary', () => {
    const head = `<title>Overkappingen | Tuinmaximaal</title>
      <meta name="description" content="Alles over overkappingen">
      <meta name="robots" content="index, follow">
      <link rel="canonical" href="https://www.tuinmaximaal.nl/overkappingen">`;
    const extract = extractPage(page('<h1>Overkappingen</h1>', { head }), CONTEXT);

    expect(extract.meta).toEqual({
      title: 'Overkappingen | Tuinmaximaal',
      description: 'Alles over overkappingen',
      canonical: 'https://www.tuinmaximaal.nl/overkappingen',
      noindex: false,
      h1: 'Overkappingen',
    });
  });

  it('reads noindex', () => {
    const extract = extractPage(page('<h1>Kop</h1>', { head: '<meta name="robots" content="NOINDEX,nofollow">' }), CONTEXT);
    expect(extract.meta.noindex).toBe(true);
  });

  it('gives null where the page says nothing', () => {
    const extract = extractPage(page('<p>Geen kop</p>'), CONTEXT);
    expect(extract.meta).toEqual({
      title: null, description: null, canonical: null, noindex: false, h1: null,
    });
  });
});

describe('pageType', () => {
  it('maps the body class', () => {
    expect(pageType('cms-page-view page-layout-1column')).toBe('cms-page');
    expect(pageType('catalog-category-view')).toBe('category');
    expect(pageType('checkout-index-index')).toBe('other');
    expect(pageType('')).toBeNull();
  });

  it('is read from the raw html, because the parser can drop the tag', () => {
    const extract = extractPage(page('<h1>Kop</h1>', { bodyClass: 'catalog-product-view' }), CONTEXT);
    expect(extract.pageType).toBe('product');
  });
});

describe('toMarkdown', () => {
  it('renders the same elements the Diff tab shows', () => {
    const extract = extractPage(page(`
      <h1>Overkappingen</h1><p>Kies uw model.</p>
      <ul><li>Antraciet</li></ul><a href="/offerte">Offerte</a>`), CONTEXT);

    expect(extract.markdown).toBe('# Overkappingen\n\nKies uw model.\n\n- Antraciet\n\n[Offerte]');
    expect(toMarkdown(extract.elements)).toBe(extract.markdown);
  });
});

describe('maintenanceReason', () => {
  it('catches the two status codes production answers with', () => {
    expect(maintenanceReason(503, '')).toBe('HTTP 503');
    expect(maintenanceReason(500, '')).toBe('HTTP 500');
  });

  it('catches the bootstrap exception page', () => {
    expect(maintenanceReason(200, '<html><body>There has been an error processing your request</body></html>'))
      .toMatch(/body matches/);
  });

  it('leaves a real page that talks about maintenance alone', () => {
    const html = `<html><body>${'Onderhoud en maintenance van uw overkapping. '.repeat(400)}</body></html>`;
    expect(maintenanceReason(200, html)).toBeNull();
  });
});

describe('excluded pages', () => {
  it('names the configurator and gives the reason', () => {
    expect(isExcludedPage('veranda-configurator')).toBe(true);
    expect(exclusionReason('veranda-configurator')).toMatch(/Application page/);
  });

  it('is exact keys, so a future configurator content page is still checked', () => {
    expect(isExcludedPage('configurator-vergelijken')).toBe(false);
    expect(exclusionReason('configurator-vergelijken')).toBeNull();
  });
});
