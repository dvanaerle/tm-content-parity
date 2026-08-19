import { describe, expect, it, vi } from 'vitest';

import {
  CANONICAL_VIEWPORT,
  HIDDEN_AT_CANONICAL_VIEWPORT,
  validateConventions,
} from '../shared/canonical-viewport.mjs';
import {
  ABSOLUTE_MAX_UNITS,
  DEFAULT_MAX_UNITS,
  EXCLUDED_REGIONS,
  REGION_KINDS,
  capFor,
  validateRegions,
} from '../shared/excluded-regions.mjs';
import { exclusionReason, isExcludedPage } from '../shared/excluded-pages.mjs';
import { extractPage, pageType, toMarkdown } from './extract.mjs';
import { failuresFilename } from './21-crawl-store.mjs';
import { imageKey, linkKey } from '../shared/keys.mjs';
import { maintenanceReason } from './fetch-page.mjs';
import { tier1 } from './normalise.mjs';

const CONTEXT = {
  store: 'nl',
  page: 'overkappingen',
  side: 'production',
  url: 'https://www.tuinmaximaal.nl/overkappingen',
  prodHost: 'www.tuinmaximaal.nl',
  newHost: 'm2stagingnl.intern.systems',
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

  it('folds a hexadecimal numeric entity like a decimal one', () => {
    expect(tier1('Sorteer&#x20;op')).toBe('Sorteer op');
    expect(tier1('Sorteer&#32;op')).toBe('Sorteer op');
    expect(tier1('Sorteer&#X20;op')).toBe('Sorteer op');
    expect(tier1('Prijs&#xA0;nu')).toBe('Prijs nu');
    expect(tier1('5&#x20AC;')).toBe('5€');
  });

  it('leaves a form that is not an entity alone', () => {
    expect(tier1('&#xzz; &unknown; A & B')).toBe('&#xzz; &unknown; A & B');
  });

  // A crawl of 448 pages must not die on one malformed entity in one paragraph.
  it('leaves a numeric entity outside Unicode alone, and does not throw', () => {
    expect(tier1('&#x110000; &#1114112; &#xdeadbeef;')).toBe('&#x110000; &#1114112; &#xdeadbeef;');
    expect(tier1('&#xd800;')).toBe('&#xd800;');
    expect(tier1('&#x10ffff;')).toBe('􏿿');
  });

  it('folds a no-break space to one space', () => {
    expect(tier1('Prijs nu')).toBe('Prijs nu');
    expect(tier1('Prijs&nbsp;nu')).toBe('Prijs nu');
  });

  it('folds the zero-width characters and the soft hyphen to nothing', () => {
    for (const code of [0x200b, 0x200c, 0x200d, 0x00ad]) {
      const invisible = String.fromCodePoint(code);
      expect(tier1(`Over${invisible}kappingen`)).toBe('Overkappingen');
    }
    for (const entity of ['&#x200b;', '&#8203;', '&shy;', '&zwj;', '&zwnj;']) {
      expect(tier1(`Over${entity}kappingen`)).toBe('Overkappingen');
    }
  });

  it('folds the remaining Unicode space characters to one space', () => {
    const codes = [
      0x1680, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009,
      0x200a, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000, 0xfeff,
    ];
    for (const code of codes) {
      expect(tier1(`Prijs${String.fromCodePoint(code)}nu`)).toBe('Prijs nu');
    }
  });
});

describe('the content boundary', () => {
  it('is <main>, and nothing outside it counts', () => {
    const extract = extractPage(page('<h1>Overkappingen</h1>'), CONTEXT);
    expect(extract.boundary).toBe('main');
    expect(extract.elements.map((unit) => unit.raw)).toEqual(['Overkappingen']);
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
    expect(extract.elements.map((unit) => unit.raw)).toEqual(['Real page copy']);
  });

  it('does not read a nested <style> or <script> as content', () => {
    // Production nests both inside an `<a>`, and `structuredText` handed over the
    // CSS as copy: 151 units on 23 of 179 nl pages, measured before ticket 67
    // folded inline links. Ticket 02 put the chrome list on the fallback path only,
    // having measured that it removes no *element* inside `<main>` — which is true,
    // and misses this. After the fold the block that folds the anchor takes the CSS
    // as well, so the guard covers more than it did.
    const extract = extractPage(
      page(
        '<a href="/carport">' +
          '<style>.product-image-container-9656 { width: 480px; }</style>' +
          '<script>var x = document.querySelectorAll(".a");</script>' +
          'Bekijk carports</a>',
      ),
      CONTEXT,
    );
    expect(extract.elements.map((unit) => unit.raw)).toEqual(['Bekijk carports']);
  });

  it('keeps a <template>, because Alpine renders what is inside it', () => {
    const extract = extractPage(page('<template><p>Gratis bezorging</p></template>'), CONTEXT);
    expect(extract.elements.map((unit) => unit.raw)).toEqual(['Gratis bezorging']);
  });

  it('throws when the document has no <body>, because a silent fallback hid a broken parse', () => {
    expect(() => extractPage('<p>orphan</p>', { ...CONTEXT })).toThrow(/No <body>/);
  });

  it('throws on a 200 page that holds nothing, because that is an app page or a broken parse', () => {
    // The whole of <main> on the new site's veranda-configurator.
    const mount = '<div id="configurator-root" data-url-key="veranda"></div>';
    expect(() => extractPage(page(mount), CONTEXT)).toThrow(
      /application page that\s+belongs in shared\/excluded-pages\.mjs/,
    );
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
    expect(extract.elements.map((unit) => unit.raw)).toEqual(['Overkappingen']);
  });
});

describe('content units', () => {
  it('takes the leaves in document order and skips the containers', () => {
    const extract = extractPage(
      page('<div><h2>Kleuren</h2><ul><li>Antraciet</li><li>Wit</li></ul></div>'),
      CONTEXT,
    );
    expect(extract.elements).toMatchObject([
      { index: 0, tag: 'h2', kind: 'heading', level: 2, raw: 'Kleuren' },
      { index: 1, tag: 'li', kind: 'text', level: null, raw: 'Antraciet' },
      { index: 2, tag: 'li', kind: 'text', level: null, raw: 'Wit' },
    ]);
  });

  it('folds an inline link into the paragraph that holds it', () => {
    // The loss ticket 67 measured: 62 blocks and about 3,400 words of body copy
    // on 10 of 10 pages, because one inline link discarded its whole block.
    const extract = extractPage(
      page('<p>Onze <a href="/carport">carports</a> zijn van 6063-T6 aluminium.</p>'),
      CONTEXT,
    );
    expect(extract.elements.map((unit) => [unit.tag, unit.kind, unit.raw])).toEqual([
      ['p', 'text', 'Onze carports zijn van 6063-T6 aluminium.'],
    ]);
  });

  it('folds a button as well as an anchor, and two links make the block text', () => {
    // A block is a call to action only when the **whole** block is one link. Two
    // links make it a sentence with links in it, and no one target is the unit's.
    const extract = extractPage(
      page(
        '<p><button>Vraag een offerte aan</button></p>' +
          '<li>Kies <a href="/wit">wit</a> of <a href="/grijs">grijs</a></li>',
      ),
      CONTEXT,
    );
    expect(extract.elements.map((unit) => [unit.tag, unit.kind, unit.raw])).toEqual([
      ['p', 'cta', 'Vraag een offerte aan'],
      ['li', 'text', 'Kies wit of grijs'],
    ]);
  });

  it('gives a wrapped anchor and a bare anchor one kind', () => {
    // Ticket 67 inverted this test. It pinned the leaf rule: the `<p>` was
    // skipped for holding an `a`, so the anchor made a unit of its own and both
    // units read `cta` from their tag. Now the block speaks. `kind` reads the
    // content instead of the tag, so the two shapes of one call to action still
    // pair, and one `copy` row does not become two one-sided rows.
    const extract = extractPage(
      page(
        '<p><a href="/carport">Lees over carports</a></p><a class="btn" href="/offerte">Offerte</a>',
      ),
      CONTEXT,
    );
    expect(extract.elements.map((unit) => [unit.tag, unit.kind, unit.raw])).toEqual([
      ['p', 'cta', 'Lees over carports'],
      ['a', 'cta', 'Offerte'],
    ]);
  });

  it('keeps the raw text and the tier-1 text apart', () => {
    const extract = extractPage(page('<p>Prijs “nu”</p>'), CONTEXT);
    expect(extract.elements[0].raw).toBe('Prijs “nu”');
    expect(extract.elements[0].norm).toBe('Prijs "nu"');
  });

  it('drops text that carries no letter and no number', () => {
    const extract = extractPage(page('<p>—</p><p>••</p><p>OK</p>'), CONTEXT);
    expect(extract.elements.map((unit) => unit.raw)).toEqual(['OK']);
  });

  it('separates the child texts that the parser glues together', () => {
    const extract = extractPage(page('<p>samplepakket</p><button>Vraag aan</button>'), CONTEXT);
    expect(extract.elements.map((unit) => unit.raw)).toEqual(['samplepakket', 'Vraag aan']);
  });

  it('reads a heading that wraps an accordion anchor as the heading', () => {
    // Ticket 33. Production builds every FAQ question as
    // `<h4 class="panel-title"><a data-toggle="collapse" …>`, so the anchor was
    // the leaf and the heading level was thrown away: the unit read as a
    // `cta` with no level, against a plain `<h3>` on the new site. 337 units
    // on 40 of 179 nl pages, measured before ticket 67, and it was about to be
    // reported as 330 `a` → `h3` heading-level findings that name the wrong
    // production unit. Ticket 67 gave every block the rule the heading had, so this
    // is no longer the exception it was.
    const extract = extractPage(
      page(
        '<div class="panel-heading"><h4 class="panel-title">' +
          '<a data-toggle="collapse" href="#question3890">Is mijn product op voorraad?</a>' +
          '</h4></div>',
      ),
      CONTEXT,
    );
    expect(extract.elements).toMatchObject([
      { tag: 'h4', kind: 'heading', level: 4, raw: 'Is mijn product op voorraad?' },
    ]);
  });

  it('keeps a heading whole when only part of it is a link', () => {
    // The same rule, and the reason it is "a heading is never a container"
    // rather than a rule about accordions: the leaf rule reported the anchor
    // alone and silently dropped the words around it.
    const extract = extractPage(
      page('<h2>Bekijk onze <a href="/carport">carports</a> nu</h2>'),
      CONTEXT,
    );
    expect(extract.elements.map((unit) => [unit.tag, unit.raw])).toEqual([
      ['h2', 'Bekijk onze carports nu'],
    ]);
  });

  it('still takes the leaves inside a container that is not a heading', () => {
    const extract = extractPage(page('<li><p>Antraciet</p></li>'), CONTEXT);
    expect(extract.elements.map((unit) => [unit.tag, unit.raw])).toEqual([['p', 'Antraciet']]);
  });

  it('still loses loose text beside a heading in a container, and that is recorded', () => {
    // The mirror of the rule above, and **not** fixed in ticket 33: the `<td>` is
    // skipped for holding a text tag, so `Levertijd` is dropped. Rescuing it means
    // emitting the direct text nodes of a container as a unit, which changes
    // what a unit is and moves the count on all 179 pages. Pinned here so the
    // limit is read rather than discovered.
    const extract = extractPage(
      page('<table><tr><td>Levertijd <h4>Vraag</h4></td></tr></table>'),
      CONTEXT,
    );
    expect(extract.elements.map((unit) => [unit.tag, unit.raw])).toEqual([['h4', 'Vraag']]);
  });

  it('leaves the anchor in the link list when the heading swallows its text', () => {
    // Ticket 05 owns the links, and the swallow rule is about what a unit says.
    // A heading that wraps a real navigational link must still report the link.
    const extract = extractPage(page('<h2><a href="/carport">Carports</a></h2>'), CONTEXT);
    expect(extract.elements.map((unit) => unit.tag)).toEqual(['h2']);
    expect(extract.links.map((record) => record.text)).toEqual(['Carports']);
  });
});

describe('linkKey', () => {
  const hosts = { prodHost: 'www.tuinmaximaal.nl', newHost: 'm2stagingnl.intern.systems' };
  const key = (href) => linkKey(new URL(href), hosts);

  it("folds the page's own two hosts to one token", () => {
    expect(key('https://www.tuinmaximaal.nl/carport')).toBe(
      key('https://m2stagingnl.intern.systems/carport'),
    );
  });

  it('keeps another host apart', () => {
    expect(key('https://www.tuinmaximaal.de/carport')).not.toBe(
      key('https://www.tuinmaximaal.nl/carport'),
    );
  });

  it('lowercases the path and removes the trailing slash', () => {
    expect(key('https://www.tuinmaximaal.nl/Carport/')).toBe('self/carport');
  });

  it('keeps the query and drops the fragment', () => {
    expect(key('https://www.tuinmaximaal.nl/carport?kleur=wit#specs')).toBe(
      'self/carport?kleur=wit',
    );
  });

  it('folds the percent encoding of the query, which one page sends both ways', () => {
    expect(key('https://www.tuinmaximaal.nl/terrasoverkapping?model=6039,6040')).toBe(
      key('https://www.tuinmaximaal.nl/terrasoverkapping?model=6039%2C6040'),
    );
  });

  it('keeps two different queries apart', () => {
    expect(key('https://www.tuinmaximaal.nl/terrasoverkapping?model=6039')).not.toBe(
      key('https://www.tuinmaximaal.nl/terrasoverkapping?model=6040'),
    );
  });
});

describe('links', () => {
  it('skips the three non-navigational shapes and keeps the rest', () => {
    const extract = extractPage(
      page(`
      <a href="#top">Naar boven</a>
      <a href="mailto:info@tuinmaximaal.nl">Mail ons</a>
      <a href="tel:+31123">Bel ons</a>
      <a href="/carport">Carport</a>
      <a href="https://www.youtube.com/watch?v=1">Video</a>`),
      CONTEXT,
    );

    expect(extract.links.map((link) => link.href)).toEqual([
      '/carport',
      'https://www.youtube.com/watch?v=1',
    ]);
  });

  it('resolves the url and marks the internal targets', () => {
    const extract = extractPage(
      page('<a href="/carport">Carport</a><a href="https://www.youtube.com/x">Video</a>'),
      CONTEXT,
    );
    expect(extract.links[0]).toMatchObject({
      url: 'https://www.tuinmaximaal.nl/carport',
      key: 'self/carport',
      text: 'Carport',
      internal: true,
    });
    expect(extract.links[1].internal).toBe(false);
  });

  it('marks a live-domain and a m2staging host as internal', () => {
    const extract = extractPage(
      page(`
      <a href="https://www.tuinmaximaal.de/carport">DE</a>
      <a href="https://m2stagingbe.intern.systems/carport">BE</a>`),
      CONTEXT,
    );
    expect(extract.links.map((link) => link.internal)).toEqual([true, true]);
  });
});

describe('opening links', () => {
  // Production's gallery module writes both anchors for every photo: one to the
  // image file, one to a page that displays it. The new site writes the first only.
  const PHOTO_CARD = `
    <div class="gallery-item">
      <a href="/media/lof/gallery/album/c/a/carport-modern_1.jpg"><img
        src="/media/lof/gallery/album/cache/300x200/c/a/carport-modern_1.jpg"
        alt="Carport modern"></a>
      <a href="/gallery/aluminium-carports/carport-met-plat-dak">Carport met plat dak</a>
    </div>`;

  it('makes no link record for either anchor of a production photo card', () => {
    const extract = extractPage(page(PHOTO_CARD), CONTEXT);
    expect(extract.links).toEqual([]);
    expect(extract.images.map((image) => image.key)).toEqual(['carport-modern_1.jpg']);
  });

  it('carries the image anchor\u2019s target onto the image record as the full-size source', () => {
    const extract = extractPage(page(PHOTO_CARD), CONTEXT);
    expect(extract.images[0]).toMatchObject({
      src: '/media/lof/gallery/album/cache/300x200/c/a/carport-modern_1.jpg',
      fullSrc: '/media/lof/gallery/album/c/a/carport-modern_1.jpg',
    });
  });

  it('makes no link record for the new site\u2019s lightbox wrapper', () => {
    const extract = extractPage(
      page(`<a href="/media/wysiwyg/General/special/album/c/a/carport-modern_1.jpg"
        data-fancybox><img
        src="/media/wysiwyg/General/special/album/c/a/carport-modern_1.jpg"
        alt="Carport modern"></a>`),
      CONTEXT,
    );
    expect(extract.links).toEqual([]);
  });

  it('is about the markup and not the page, so a showroom photo wrapper is quiet too', () => {
    const extract = extractPage(
      page(`<h2>Showroom Eindhoven</h2>
      <a href="/media/wysiwyg/showroom/eindhoven-hal.jpg"><img
        src="/media/wysiwyg/showroom/eindhoven-hal-800x600.jpg" alt="Hal"></a>`),
      CONTEXT,
    );
    expect(extract.links).toEqual([]);
    expect(extract.images.map((image) => image.fullSrc)).toEqual([
      '/media/wysiwyg/showroom/eindhoven-hal.jpg',
    ]);
  });

  it('leaves an album-page link alone in each localised form', () => {
    const extract = extractPage(
      page(`
      <a href="/fotogalerij/carports">Carports</a>
      <a href="/fotogalerie/carports">Carports</a>
      <a href="/galerie/carports">Carports</a>
      <a href="/gallery/carports">Carports</a>
      <a href="/photo-gallery/carports">Carports</a>`),
      CONTEXT,
    );
    expect(extract.links.map((link) => link.href)).toEqual([
      '/fotogalerij/carports',
      '/fotogalerie/carports',
      '/galerie/carports',
      '/gallery/carports',
      '/photo-gallery/carports',
    ]);
  });

  it('leaves a brochure link alone, because a document is not a photo', () => {
    const extract = extractPage(
      page('<a href="/media/brochure-carport.pdf"></a><p>Brochure</p>'),
      CONTEXT,
    );
    expect(extract.links.map((link) => link.href)).toEqual(['/media/brochure-carport.pdf']);
  });

  it('leaves a captioned link to a photo alone, because an editor wrote the caption', () => {
    const extract = extractPage(
      page(`<img src="/media/lof/gallery/album/c/a/carport-modern_1.jpg" alt="Carport modern">
      <a href="/media/lof/gallery/album/c/a/carport-modern_1.jpg">Bekijk op ware grootte</a>`),
      CONTEXT,
    );
    expect(extract.links.map((link) => link.href)).toEqual([
      '/media/lof/gallery/album/c/a/carport-modern_1.jpg',
    ]);
    expect(extract.images[0].fullSrc).toBeNull();
  });

  it('leaves an empty anchor to a photo the page does not show alone', () => {
    const extract = extractPage(
      page('<p>Fotoboek</p><a href="/media/lof/gallery/album/c/a/elders.jpg"></a>'),
      CONTEXT,
    );
    expect(extract.links.map((link) => link.href)).toEqual([
      '/media/lof/gallery/album/c/a/elders.jpg',
    ]);
  });

  it('catches a be_fr detail route and not an fr album link of the same segment count', () => {
    const extract = extractPage(
      page(`
      <a href="/fr/gallery/carports-aluminium/carport-toit-plat">Carport toit plat</a>
      <a href="/galerie/carports/aluminium/toit-plat">Toit plat</a>`),
      CONTEXT,
    );
    expect(extract.links.map((link) => link.href)).toEqual([
      '/galerie/carports/aluminium/toit-plat',
    ]);
  });

  // The rejected basename-only rule destroyed 28 of these, and it destroyed them in
  // exactly this shape: the target's basename matches a photo on the same page, and
  // the photo sits right beside the link, because that is how the page is built.
  // Nothing here is a photo, so nothing here may be quiet.
  it('leaves the editorial links that a basename rule destroyed alone', () => {
    const extract = extractPage(
      page(`
      <p>Meer info over de <a href="/laagste-prijs-garantie">laagste prijs garantie</a></p>
      <img src="/media/wysiwyg/laagste-prijs-garantie.jpg" alt="Laagste prijs garantie">
      <img src="/media/wysiwyg/showroom-eindhoven.jpg" alt="Showroom Eindhoven">
      <a href="/showroom-eindhoven">Showroom Eindhoven</a>
      <img src="/media/wysiwyg/lowest-price-guarantee.png" alt="Lowest price guarantee">
      <a href="/lowest-price-guarantee">here</a>`),
      CONTEXT,
    );
    expect(extract.links.map((link) => link.href)).toEqual([
      '/laagste-prijs-garantie',
      '/showroom-eindhoven',
      '/lowest-price-guarantee',
    ]);
  });
});

describe('one document-order walk', () => {
  it('puts text, images and links on one shared counter', () => {
    const extract = extractPage(
      page(`
      <h2>Kleuren</h2>
      <img src="/media/Veranda.jpg" alt="Veranda">
      <p>Antraciet en creme</p>
      <a href="/carport">Carport</a>`),
      CONTEXT,
    );

    expect(extract.elements.map((unit) => unit.index)).toEqual([0, 2, 3]);
    expect(extract.images.map((image) => image.index)).toEqual([1]);
    expect(extract.links.map((link) => link.index)).toEqual([3]);
  });

  it('gives an anchor one position for its words and its target', () => {
    const extract = extractPage(page('<p>Intro tekst</p><a href="/carport">Carport</a>'), CONTEXT);
    expect(extract.elements[1].index).toBe(extract.links[0].index);
  });

  it('gives a deduplicated image the position of its first occurrence', () => {
    const extract = extractPage(
      page(`
      <p>Intro tekst</p>
      <img src="/media/Veranda.jpg" alt="Veranda">
      <p>Tussen tekst</p>
      <img src="/media/Veranda.jpg" alt="Veranda">`),
      CONTEXT,
    );

    expect(extract.images).toHaveLength(1);
    expect(extract.images[0].index).toBe(1);
    expect(extract.elements.map((unit) => unit.index)).toEqual([0, 2]);
  });

  it('still counts an anchor a heading spoke for as a link, at its own position', () => {
    const extract = extractPage(
      page('<h2>Bekijk onze <a href="/carports">carports</a> nu</h2>'),
      CONTEXT,
    );

    expect(extract.elements.map((unit) => [unit.index, unit.raw])).toEqual([
      [0, 'Bekijk onze carports nu'],
    ]);
    expect(extract.links.map((link) => [link.index, link.key])).toEqual([[1, 'self/carports']]);
  });

  it('still counts a folded anchor as a link, at its own position', () => {
    // Ticket 67. The paragraph speaks for the words, and the anchor takes the
    // next position for its target alone. The links check compares targets and
    // the fold does not touch it.
    const extract = extractPage(
      page('<p>Onze <a href="/carport">carports</a> zijn sterk</p>'),
      CONTEXT,
    );

    expect(extract.elements.map((unit) => [unit.index, unit.tag])).toEqual([[0, 'p']]);
    expect(extract.links.map((link) => [link.index, link.key, link.text])).toEqual([
      [1, 'self/carport', 'carports'],
    ]);
  });

  it('takes no position for an image with no identity', () => {
    const extract = extractPage(
      page('<img alt="icon" width="24"><p>Antraciet en creme</p>'),
      CONTEXT,
    );
    expect(extract.elements[0].index).toBe(0);
  });
});

describe('imageKey', () => {
  it('is the basename, lowercased, extension kept', () => {
    expect(
      imageKey('/cdn-cgi/image/quality=75/media/wysiwyg/tm/nl-nl/Terras_Antraciet.jpg?x=1'),
    ).toBe('terras_antraciet.jpg');
  });

  it('matches across the two environment paths', () => {
    expect(
      imageKey('https://www.tuinmaximaal.nl/media/wysiwyg/tm/nl-nl/afbeeldingen/Veranda.jpg'),
    ).toBe(imageKey('https://m2stagingnl.intern.systems/media/wysiwyg/Veranda.jpg'));
  });

  it('removes a true size suffix', () => {
    expect(imageKey('/media/Veranda-1292x729.jpg')).toBe('veranda.jpg');
    expect(imageKey('/media/Veranda_800x600.jpg')).toBe('veranda.jpg');
  });

  it('never removes a bare _N, which is the only thing separating two gallery photos', () => {
    expect(imageKey('/media/terrasoverkapping_antraciet_2.jpg')).not.toBe(
      imageKey('/media/terrasoverkapping_antraciet_3.jpg'),
    );
  });

  it('decodes an escaped basename', () => {
    expect(imageKey('/media/Terras%20Antraciet.jpg')).toBe('terras antraciet.jpg');
  });
});

describe('images', () => {
  it('holds each identity once, because the new site emits a mobile and a desktop copy', () => {
    const extract = extractPage(
      page(`
      <img src="/media/Veranda.jpg" alt="Veranda">
      <img src="/media/Veranda.jpg" alt="Veranda">`),
      CONTEXT,
    );
    expect(extract.images).toEqual([
      { index: 0, key: 'veranda.jpg', src: '/media/Veranda.jpg', alt: 'Veranda', fullSrc: null },
    ]);
  });

  it('takes the real alt when the two copies disagree', () => {
    const extract = extractPage(
      page(`
      <img src="/media/Veranda.jpg" alt="">
      <img src="/media/Veranda.jpg" alt="Veranda in antraciet">`),
      CONTEXT,
    );
    expect(extract.images[0].alt).toBe('Veranda in antraciet');
  });

  it('keeps an absent alt and an empty alt apart', () => {
    const extract = extractPage(
      page('<img src="/media/A.jpg"><img src="/media/B.jpg" alt="">'),
      CONTEXT,
    );
    expect(extract.images.map((image) => image.alt)).toEqual([null, '']);
  });

  it('falls back to data-src', () => {
    const extract = extractPage(page('<img data-src="/media/Lazy.jpg" alt="Lazy">'), CONTEXT);
    expect(extract.images[0].src).toBe('/media/Lazy.jpg');
  });

  it('counts an image with no identity as a diagnostic, never as an image', () => {
    const extract = extractPage(
      page('<img alt="icon" width="24"><img src="/media/A.jpg">'),
      CONTEXT,
    );
    expect(extract.images).toHaveLength(1);
    expect(extract.diagnostics.imagesWithoutSrc).toBe(1);
  });
});

describe('meta', () => {
  it('reads the head and the first h1 inside the boundary', () => {
    const head = `<title>Overkappingen | Tuinmaximaal</title>
      <meta name="description" content="Alles over overkappingen">
      <meta name="robots" content="index, follow">
      <meta name="keywords" content="overkapping, veranda">
      <link rel="canonical" href="https://www.tuinmaximaal.nl/overkappingen">`;
    const extract = extractPage(page('<h1>Overkappingen</h1>', { head }), CONTEXT);

    expect(extract.meta).toEqual({
      title: 'Overkappingen | Tuinmaximaal',
      description: 'Alles over overkappingen',
      canonical: 'https://www.tuinmaximaal.nl/overkappingen',
      robots: 'index, follow',
      noindex: false,
      keywords: 'overkapping, veranda',
      h1: 'Overkappingen',
    });
  });

  it('reads noindex', () => {
    const extract = extractPage(
      page('<h1>Kop</h1>', { head: '<meta name="robots" content="NOINDEX,nofollow">' }),
      CONTEXT,
    );
    expect(extract.meta.noindex).toBe(true);
  });

  it('keeps what the robots tag said beside the boolean it derives', () => {
    // The boolean answers one question and the tag says more than one thing, so a
    // head panel reading the boolean can only ever show a page's `nofollow` as
    // `index`. Ticket 94: the string the page sent survives the derivation.
    const extract = extractPage(
      page('<h1>Kop</h1>', { head: '<meta name="robots" content="index, nofollow">' }),
      CONTEXT,
    );
    expect(extract.meta.robots).toBe('index, nofollow');
    expect(extract.meta.noindex).toBe(false);
  });

  it('gives null where the page says nothing', () => {
    const extract = extractPage(page('<p>Geen kop</p>'), CONTEXT);
    expect(extract.meta).toEqual({
      title: null,
      description: null,
      canonical: null,
      robots: null,
      noindex: false,
      keywords: null,
      h1: null,
    });
  });

  it('tells a tag with no value apart from no tag at all', () => {
    // Ticket 92 measured 4 page-sides that carry `keywords` empty, all of them one page
    // in four stores. Folding those onto absence would say Magento holds no value where
    // it holds an empty one. One rule for every attribute here, so `description` gains
    // the same distinction — it is pinned because it is a change and not a side effect.
    const extract = extractPage(
      page('<h1>Kop</h1>', {
        head: '<meta name="keywords" content=""><meta name="description" content=" ">',
      }),
      CONTEXT,
    );
    expect(extract.meta.keywords).toBe('');
    expect(extract.meta.description).toBe('');
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
    const extract = extractPage(
      page('<h1>Kop</h1>', { bodyClass: 'catalog-product-view' }),
      CONTEXT,
    );
    expect(extract.pageType).toBe('product');
  });
});

describe('toMarkdown', () => {
  it('renders the same units the content view shows', () => {
    const extract = extractPage(
      page(`
      <h1>Overkappingen</h1><p>Kies uw model.</p>
      <ul><li>Antraciet</li></ul><a href="/offerte">Offerte</a>`),
      CONTEXT,
    );

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
    expect(
      maintenanceReason(
        200,
        '<html><body>There has been an error processing your request</body></html>',
      ),
    ).toMatch(/body matches/);
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

  it('does not name no-route, whose body is CMS content an editor writes', () => {
    // Ticket 93 excluded it as "the 404 page itself" and was wrong: the 404
    // *template* is layout, but its body is a CMS page, and production's copy is
    // missing on the new site. Those findings are the defect, not noise.
    expect(isExcludedPage('no-route')).toBe(false);
    expect(exclusionReason('no-route')).toBeNull();
  });
});

describe('excluded regions', () => {
  const GRID = [
    {
      selector: '#grid',
      kind: 'non-editorial',
      reason: 'The catalogue writes it.',
      measured: { pages: ['a', 'b', 'c'], production: 4, new: 4 },
    },
  ];

  const withGrid = (main) => extractPage(page(main), { ...CONTEXT, excludedRegions: GRID });

  it('removes the units, the links and the images of a matched region', () => {
    const extract = withGrid(`
      <h1>Overkappingen</h1><p>Kies uw model.</p>
      <div id="grid">
        <h3>Heavy Duty 6.06 x 3 meter</h3>
        <a href="/p/heavy-duty">Bekijk product</a>
        <img src="/media/tile.jpg" alt="Heavy Duty">
      </div>`);

    expect(extract.elements.map((unit) => unit.raw)).toEqual(['Overkappingen', 'Kies uw model.']);
    expect(extract.links).toEqual([]);
    expect(extract.images).toEqual([]);
  });

  it('counts the units it removed, so the exclusion is visible on the page it cut', () => {
    const extract = withGrid(`
      <h1>Overkappingen</h1>
      <div id="grid"><h3>Tegel</h3><p>1702 resultaten</p></div>`);

    expect(extract.diagnostics.regionsExcluded).toEqual([
      {
        selector: '#grid',
        kind: 'non-editorial',
        reason: 'The catalogue writes it.',
        matches: 1,
        units: 2,
      },
    ]);
    expect(extract.diagnostics.unitsExcluded).toBe(2);
  });

  it('says nothing on a page no entry matched, so a region that stops matching reads as a change', () => {
    const extract = withGrid('<h1>Overkappingen</h1><p>Geen grid.</p>');
    expect(extract.diagnostics.regionsExcluded).toEqual([]);
    expect(extract.diagnostics.unitsExcluded).toBe(0);
    expect(extract.elements).toHaveLength(2);
  });

  it('does not renumber the units that stay, because a finding id is not positional', () => {
    const extract = withGrid(`
      <h1>Overkappingen</h1>
      <div id="grid"><p>Tegel</p></div>
      <p>Na het grid.</p>`);

    expect(extract.elements.map((unit) => unit.raw)).toEqual(['Overkappingen', 'Na het grid.']);
    expect(extract.elements.map((unit) => unit.index)).toEqual([0, 1]);
  });

  it('throws above the entry cap, because a wider match is a wrong selector', () => {
    const tiles = '<p>Een tegel met tekst.</p>'.repeat(21);

    expect(() =>
      extractPage(page(`<h1>Kop</h1><div id="grid">${tiles}</div>`), {
        ...CONTEXT,
        excludedRegions: GRID,
      }),
    ).toThrow(/#grid holds 21 content units.*cap is 20/s);
  });

  it('counts a match inside another match once, so the recorded count is right', () => {
    // `querySelectorAll` gives the ancestor and the descendant. The outer match
    // removes the inner one anyway, so counting both doubles the number.
    const extract = withGrid(`
      <h1>Kop</h1>
      <div id="grid"><p>Buiten</p><div id="grid"><p>Binnen</p></div></div>`);

    expect(extract.diagnostics.regionsExcluded[0]).toMatchObject({ matches: 1, units: 2 });
    expect(extract.elements.map((unit) => unit.raw)).toEqual(['Kop']);
  });

  it('does not throw on a nested match that only double-counting would push over the cap', () => {
    const eleven = '<p>Een tegel met tekst.</p>'.repeat(11);
    const extract = withGrid(`<h1>Kop</h1><div id="grid"><div id="grid">${eleven}</div></div>`);

    expect(extract.diagnostics.unitsExcluded).toBe(11);
  });

  it('honours a cap the entry declares, so a measured wide region can ship', () => {
    const tiles = '<p>Een tegel met tekst.</p>'.repeat(21);
    const wide = [
      { ...GRID[0], measured: { pages: ['a', 'b', 'c'], production: 21, new: 21 }, maxUnits: 90 },
    ];

    const extract = extractPage(page(`<h1>Kop</h1><div id="grid">${tiles}</div>`), {
      ...CONTEXT,
      excludedRegions: wide,
    });
    expect(extract.elements).toHaveLength(1);
    expect(extract.diagnostics.unitsExcluded).toBe(21);
  });

  it('caps the whole entry and not one match, so two half-size matches still throw', () => {
    const half = '<p>Een tegel met tekst.</p>'.repeat(11);

    expect(() =>
      extractPage(page(`<h1>Kop</h1><div id="grid">${half}</div><div id="grid">${half}</div>`), {
        ...CONTEXT,
        excludedRegions: GRID,
      }),
    ).toThrow(/matched 2 times/);
  });

  it('holds a list a caller gives to the same bar as the committed one', () => {
    const unmeasured = [{ ...GRID[0], measured: { pages: ['a'], production: 1, new: 1 } }];
    expect(() =>
      extractPage(page('<h1>Kop</h1>'), { ...CONTEXT, excludedRegions: unmeasured }),
    ).toThrow(/measured on 1 page/);
  });

  it('names the page and the side, because a crawl fails on one page of 448', () => {
    const tiles = '<p>Een tegel met tekst.</p>'.repeat(21);
    expect(() =>
      extractPage(page(`<div id="grid">${tiles}</div>`), { ...CONTEXT, excludedRegions: GRID }),
    ).toThrow(/nl\/overkappingen production/);
  });

  it('leaves a page with no <main> to the chrome list, and still cuts the region', () => {
    const html = `<!doctype html><html><body class="catalog-category-view">
      <h1>Overkappingen</h1><div id="grid"><p>Tegel</p></div></body></html>`;
    const extract = extractPage(html, { ...CONTEXT, excludedRegions: GRID });

    expect(extract.boundary).toBe('body');
    expect(extract.elements.map((unit) => unit.raw)).toEqual(['Overkappingen']);
  });
});

describe('the committed region list', () => {
  it('cuts the product grid on both hosts by one selector', () => {
    expect(EXCLUDED_REGIONS).toHaveLength(3);
    expect(EXCLUDED_REGIONS[0].selector).toBe('#amasty-shopby-product-list');
    expect(EXCLUDED_REGIONS[0].kind).toBe('non-editorial');
  });

  it('gives every entry a reason from the vocabulary and three measured pages', () => {
    for (const entry of EXCLUDED_REGIONS) {
      expect(REGION_KINDS).toContain(entry.kind);
      expect(entry.reason.length).toBeGreaterThan(20);
      expect(entry.measured.pages.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('never caps an entry below its own measurement', () => {
    for (const entry of EXCLUDED_REGIONS) {
      expect(capFor(entry)).toBeGreaterThanOrEqual(
        Math.max(entry.measured.production, entry.measured.new),
      );
    }
  });

  it('falls back to 20 for an entry that declares no cap', () => {
    expect(capFor(/** @type {any} */ ({ selector: '#x' }))).toBe(DEFAULT_MAX_UNITS);
    expect(DEFAULT_MAX_UNITS).toBe(20);
  });
});

/**
 * The filter block. The ticket asked for `#layered-filter-block`, which is the id
 * production puts on the wrapper — and the new site does not: it ships the id as a
 * template expression, so an id anchor would cut one side of a two-sided region
 * and leave the other side's labels behind as findings nobody can resolve.
 *
 * So the entry anchors on the inner block that both hosts name the same, and this
 * is the rule under test: one selector, both host shapes, one match each.
 *
 * The entry is read from the committed list, never retyped.
 */
describe('the filter block entry', () => {
  const FILTER = EXCLUDED_REGIONS.filter((entry) => entry.selector === '.filter-content');
  const only = (main) =>
    extractPage(page(main, { bodyClass: 'catalog-category-view' }), {
      ...CONTEXT,
      excludedRegions: FILTER,
    });

  /** The labels the catalogue writes, and Akeneo writes on the new site. */
  const LABELS = '<p>Productlijn</p><a href="/overkapping?product_line=7873">Poly line (12)</a>';

  /** Production: the id on the wrapper, the shared class on the block inside it. */
  const PRODUCTION = `
    <div class="sidebar sidebar-main"><div id="layered-filter-block" class="block filter">
      <div class="block-content filter-content">${LABELS}</div>
    </div></div>`;

  /**
   * The new site: the same inner class, a different wrapper, and the id left
   * unevaluated in the attribute. The selector must not read that attribute.
   */
  const NEW = `
    <aside class="sidebar sidebar-main"><div class="block-filter hidden fixed" id="isSidebar ? 'layered-filter-block' : ''">
      <div class="block-content filter-content px-4 py-6 md:p-0">${LABELS}</div>
    </div></aside>`;

  it('cuts the block on production, where the wrapper carries the id', () => {
    const extract = only(`<h1>Overkappingen</h1>${PRODUCTION}`);
    const [cut] = extract.diagnostics.regionsExcluded;

    expect(cut.matches).toBe(1);
    expect(extract.elements.map((unit) => unit.raw)).toEqual(['Overkappingen']);
    expect(extract.links).toEqual([]);
  });

  it('cuts the block on the new site, where the id is an unevaluated expression', () => {
    // The whole reason the entry is not `#layered-filter-block`. Both sides leave
    // together, so neither side's labels are left over as findings.
    const extract = only(`<h1>Overkappingen</h1>${NEW}`);
    const [cut] = extract.diagnostics.regionsExcluded;

    expect(cut.matches).toBe(1);
    expect(extract.elements.map((unit) => unit.raw)).toEqual(['Overkappingen']);
    expect(extract.links).toEqual([]);
  });
});

/**
 * Ticket 64, rewritten by ticket 90. The banner anchor **was** the one selector
 * in the list that read a link target, because the block carried no stable class
 * and no stable text. Production now marks the block with `id="campaign-banner"`,
 * so the anchor is an id like the product grid's, and the entry stops naming a
 * campaign.
 *
 * That is the whole rule under test here: the same entry must cut the next
 * campaign's banner, whatever its copy, its language and its option ids.
 *
 * The entry is read from the committed list, never retyped, so a test cannot
 * drift from the selector that ships.
 */
describe('the promo banner entry', () => {
  const BANNER = EXCLUDED_REGIONS.filter((entry) => entry.kind === 'legacy-only');
  const only = (main) => extractPage(page(main), { ...CONTEXT, excludedRegions: BANNER });

  /**
   * The two responsive versions, as production nests them: siblings in one
   * wrapper, each carrying the hook. The id repeats on the page — the desktop
   * and the mobile copy of one block — so the selector must count both.
   */
  const section = (href, copy) => `
    <div id="campaign-banner" class="tfix5k1 mgz-element mgz-element-section w-full">
      <div class="mgz-element-inner">
        <div class="y1842ri mgz-element mgz-element-section grow">
          <p>${copy}</p><a href="${href}">Bekijk alle deals</a>
        </div>
      </div>
    </div>`;

  const DESKTOP = section(
    '/terrasoverkapping?terrasoverkapping_model=6039,6040#productbuilder',
    'Nu 10% korting.',
  );
  const MOBILE = section(
    '/terrasoverkapping?terrasoverkapping_model=6039%2C6040#productbuilder',
    'Nu 10% korting.',
  );

  it('is one entry, legacy-only, anchored on the hook production puts on the block', () => {
    expect(BANNER).toHaveLength(1);
    expect(BANNER[0].selector).toBe('#campaign-banner');
  });

  it('names no campaign, so the entry outlives the campaign it was written for', () => {
    // The point of the change. An entry that carries option ids, a campaign name
    // or a month stops being true the day the campaign does, and the next one
    // needs a commit. Nothing here may date.
    const entry = `${BANNER[0].selector} ${BANNER[0].reason}`;

    // One rule, not an enumeration of the things it must not say: every dated
    // thing this entry used to carry — the option ids `6039,6040`, the `10%`, the
    // year — is a digit, and the prose it needs has none (`alle zes de winkels`
    // is spelled). An enumeration would keep needing another entry; this does not.
    expect(entry).not.toMatch(/\d/);
    expect(entry).not.toMatch(/_model=/);
    // A month is the one dated thing that can be written without a digit. The
    // list is Dutch because the reason is; a campaign named in another language
    // is not covered, which is why the digit rule above carries the weight.
    expect(entry).not.toMatch(
      /januari|februari|maart|april|mei|juni|juli|augustus|september|oktober|november|december/i,
    );
  });

  it('cuts the next campaign, whatever its copy, its language and its option ids', () => {
    // The claim the ticket rests on. Different ids, different words, a store the
    // Dutch pattern is blind in — and the same entry still takes the block.
    const next = `
      <div id="campaign-banner" class="a7xk2 mgz-element mgz-element-section w-full">
        <p>15% Rabatt auf alle Modelle.</p>
        <a href="/terrassenueberdachung?modell=7104%2C7105">Alle Angebote ansehen</a>
      </div>`;
    const extract = only(`<h1>Kop</h1>${next}`);
    const [cut] = extract.diagnostics.regionsExcluded;

    expect(cut.matches).toBe(1);
    expect(extract.elements.map((unit) => unit.raw)).toEqual(['Kop']);
    expect(extract.links).toEqual([]);
  });

  it('takes both responsive versions, because one entry counts all its matches', () => {
    const extract = only(`<h1>Kop</h1><div class="magezon-builder">${DESKTOP}${MOBILE}</div>`);
    const [cut] = extract.diagnostics.regionsExcluded;

    expect(cut.matches).toBe(2);
    expect(extract.elements.map((unit) => unit.raw)).toEqual(['Kop']);
  });

  it('counts a repeated id as two matches, because production ships it twice', () => {
    // A duplicate id is invalid HTML and `getElementById` would see one of the
    // two. The extractor reads all of them, and the banner needs that: the
    // mobile copy is the second one and it is not optional.
    const [cut] = only(`<h1>Kop</h1>${DESKTOP}${MOBILE}`).diagnostics.regionsExcluded;

    expect(cut.matches).toBe(2);
  });

  it('leaves an editorial filter link alone, because the entry no longer reads link targets', () => {
    // `/overkapping` carries an editorial filter link to `?terrasoverkapping_model=6039`
    // with the anchor text `Authentiek`. The old anchor had to exclude it by hand,
    // with a pair of ids. An id on the block cannot reach it at all.
    const editorial = `
      <div class="p9crveb mgz-element mgz-element-section">
        <p>Kies een model: <a href="/overkapping?terrasoverkapping_model=6039">Authentiek</a>.</p>
      </div>`;
    const extract = only(`<h1>Kop</h1>${editorial}`);

    expect(extract.diagnostics.regionsExcluded).toEqual([]);
    // Ticket 67: the words are in the paragraph that holds the link, not in a
    // unit of their own. The link keeps its own record either way.
    expect(extract.elements.map((unit) => unit.raw)).toContain('Kies een model: Authentiek.');
    expect(extract.links.map((link) => link.text)).toContain('Authentiek');
  });

  it('leaves the campaign link alone when it sits outside the block', () => {
    // The mirror of the above, and the cost of the change: the entry now cuts a
    // region and not a link. A campaign target in editorial prose stays in the
    // log, which is the over-reporting direction.
    const inline =
      '<p>Lees de <a href="/actievoorwaarden?terrasoverkapping_model=6039,6040">voorwaarden</a>.</p>';
    const extract = only(`<h1>Kop</h1>${inline}`);

    expect(extract.diagnostics.regionsExcluded).toEqual([]);
    expect(extract.links.map((link) => link.text)).toContain('voorwaarden');
  });

  it('measures zero on the new site, because that is what legacy-only means', () => {
    expect(BANNER[0].measured.new).toBe(0);
    expect(BANNER[0].measured.production).toBeGreaterThan(0);
  });

  it('allows three placements of one small block, and no more', () => {
    // Three nl pages carry the same banner twice, at 16 units. A correct selector
    // must not stop the crawl, and 30 is still far below the 91 units the generic
    // wrapper holds on `/overkapping` (2026-08-10, after the fold).
    expect(capFor(BANNER[0])).toBe(30);
    expect(capFor(BANNER[0])).toBeGreaterThan(2 * BANNER[0].measured.production);
    expect(capFor(BANNER[0])).toBeLessThan(4 * BANNER[0].measured.production);
  });

  it('counts two placements of the block as one entry, so the cap sees both', () => {
    const twice = `<h1>Kop</h1><div class="magezon-builder">${DESKTOP}${MOBILE}${DESKTOP}${MOBILE}</div>`;
    const [cut] = only(twice).diagnostics.regionsExcluded;

    expect(cut.matches).toBe(4);
  });
});

/**
 * The bar for an entry is a rule, so it has tests. Asserting only that today's
 * list satisfies the bar leaves a broken validator green.
 */
describe('validateRegions', () => {
  const good = {
    selector: '#grid',
    kind: 'non-editorial',
    reason: 'The catalogue writes it.',
    measured: { pages: ['a', 'b', 'c'], production: 4, new: 4 },
  };
  const check = (patch) => () => validateRegions([{ ...good, ...patch }]);

  it('accepts an entry that meets the bar', () => {
    expect(check({})).not.toThrow();
  });

  it('refuses a reason outside the vocabulary', () => {
    expect(check({ kind: 'noisy' })).toThrow(/vocabulary is non-editorial or legacy-only/);
  });

  it('refuses an entry with no prose reason, because an excluded region says why', () => {
    expect(check({ reason: '' })).toThrow(/says why/);
  });

  it('refuses a measurement on fewer than three pages', () => {
    expect(check({ measured: { pages: ['a', 'b'], production: 4, new: 4 } })).toThrow(
      /The bar is 3/,
    );
  });

  it("refuses a cap below the entry's own measurement", () => {
    expect(
      check({ measured: { pages: ['a', 'b', 'c'], production: 30, new: 4 }, maxUnits: 25 }),
    ).toThrow(/throw on its own evidence/);
  });

  it('refuses a cap above the ceiling, so an author cannot declare their way out', () => {
    // The per-entry cap and the measurement beside it are both written by hand.
    // Without a ceiling the guard is only "type the number twice".
    expect(
      check({
        measured: { pages: ['a', 'b', 'c'], production: 400, new: 400 },
        maxUnits: 400,
      }),
    ).toThrow(/ceiling is 100/);
    expect(ABSOLUTE_MAX_UNITS).toBe(100);
  });

  it("names where the list came from, so a caller's list is told apart from the committed one", () => {
    expect(() => validateRegions([{ ...good, kind: 'noisy' }], 'context.excludedRegions')).toThrow(
      /context\.excludedRegions: #grid/,
    );
  });
});

describe('the committed viewport conventions', () => {
  it('is desktop, and this is the one place that says so', () => {
    expect(CANONICAL_VIEWPORT).toBe('desktop');
  });

  it('lists every convention with the pages it was measured on', () => {
    for (const convention of HIDDEN_AT_CANONICAL_VIEWPORT) {
      expect(convention.framework).toBeTruthy();
      expect(convention.measured.pages.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('names the framework and never a store, because a convention is markup', () => {
    // A Dutch or a per-store hook is the mistake ADR 0003 rejected for the banner,
    // and a responsive convention is exactly the kind of rule that invites it.
    const list = JSON.stringify(HIDDEN_AT_CANONICAL_VIEWPORT);
    for (const store of ['nl', 'be_fr', 'de', 'uk']) {
      expect(list).not.toMatch(new RegExp(`"${store}"`));
    }
  });
});

describe('validateConventions', () => {
  const good = {
    selector: '[class*="hide-on-wide"]',
    framework: 'Some Page Builder',
    measured: { pages: ['a', 'b', 'c'], production: 4, new: 0 },
  };
  const check = (patch) => () => validateConventions([{ ...good, ...patch }]);

  it('accepts a convention that meets the bar', () => {
    expect(check({})).not.toThrow();
  });

  it('refuses a convention that names no framework', () => {
    expect(check({ framework: '' })).toThrow(/belongs to a front end/);
  });

  it('refuses a measurement on fewer than three pages', () => {
    expect(check({ measured: { pages: ['a', 'b'], production: 4, new: 0 } })).toThrow(
      /The bar is 3/,
    );
  });

  it("refuses a cap below the convention's own measurement", () => {
    expect(
      check({ measured: { pages: ['a', 'b', 'c'], production: 30, new: 0 }, maxUnits: 25 }),
    ).toThrow(/throw on its own evidence/);
  });

  it('refuses a cap above the ceiling, so an author cannot declare their way out', () => {
    expect(
      check({ measured: { pages: ['a', 'b', 'c'], production: 400, new: 0 }, maxUnits: 400 }),
    ).toThrow(/ceiling is 100/);
  });

  it("names where the list came from, so a caller's list is told apart from the committed one", () => {
    expect(() =>
      validateConventions([{ ...good, framework: '' }], 'context.hiddenAtCanonicalViewport'),
    ).toThrow(/context\.hiddenAtCanonicalViewport: \[class\*="hide-on-wide"\]/);
  });

  it('holds a list the extractor was given, so no path into the extraction skips the bar', () => {
    expect(() =>
      extractPage(page('<h1>Kop</h1>'), {
        ...CONTEXT,
        hiddenAtCanonicalViewport: [{ ...good, framework: '' }],
      }),
    ).toThrow(/belongs to a front end/);
  });
});

describe('failuresFilename', () => {
  it('carries the store, so a be run does not erase the nl record', () => {
    expect(failuresFilename('nl')).toBe('extract-failures-nl.json');
    expect(failuresFilename('be_fr')).toBe('extract-failures-be_fr.json');
    expect(failuresFilename('be')).not.toBe(failuresFilename('be_fr'));
  });
});

describe('the canonical viewport', () => {
  const at = (main) => extractPage(page(main), CONTEXT);

  it('does not extract a unit the page hides at the canonical viewport', () => {
    const extract = at(`
      <div class="mgz-hidden-xs mgz-hidden-sm mgz-hidden-md"><p>Onderhoudsproducten</p></div>
      <div class="mgz-hidden-lg mgz-hidden-xl"><p>Onderhoudsproducten</p></div>`);

    expect(extract.elements.map((unit) => unit.raw)).toEqual(['Onderhoudsproducten']);
  });

  it('counts what it dropped, so the choice of width is visible on the page it cut', () => {
    const extract = at(`
      <h1>Downloads</h1>
      <div class="mgz-hidden-xl"><p>Montagehandleiding</p><p>Energielabel</p></div>`);

    expect(extract.diagnostics.hiddenAtViewport).toEqual({ matches: 1, units: 2 });
  });

  it('says zero on a page that sends one version, so a convention that stops matching reads as a change', () => {
    const extract = at('<h1>Downloads</h1><p>Kies een handleiding.</p>');

    expect(extract.diagnostics.hiddenAtViewport).toEqual({ matches: 0, units: 0 });
    expect(extract.elements).toHaveLength(2);
  });

  it("keeps a block hidden only in Magezon's laptop band, which a desktop reader sees", () => {
    // The trap a substring selector falls into: `[class*="hidden-lg"]` also matches
    // `mgz-hidden-lg`, which hides between 992px and 1200px and nowhere else.
    // Measured on production: 3 to 12 elements per page would be taken wrongly.
    const extract = at(
      '<h1>Overkapping</h1><div class="mgz-hidden-lg"><p>Zichtbaar op 1280.</p></div>',
    );

    expect(extract.elements.map((unit) => unit.raw)).toEqual(['Overkapping', 'Zichtbaar op 1280.']);
  });

  it('throws above the cap, because a match that wide is a wrapper and not a second copy', () => {
    const body = '<p>Een regel met tekst.</p>'.repeat(61);

    expect(() => at(`<div class="mgz-hidden-xl">${body}</div>`)).toThrow(
      /holds 61 content units at the desktop viewport/,
    );
  });

  it('counts one page and not one match, so two half-width matches fail like one wide one', () => {
    const half = '<div class="mgz-hidden-xl">' + '<p>Een regel.</p>'.repeat(31) + '</div>';

    expect(() => at(half + half)).toThrow(/Its cap is 60/);
  });
});
