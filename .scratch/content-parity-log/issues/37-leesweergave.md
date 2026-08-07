# 37 — Leesweergave: the page as a reader sees it

**What to build:** a second view mode on the content tab that renders both sides
as prose — real headings, real lists, images in place — so an editor can judge
the page as a reader would rather than as a table of rows.

Today the Markdown export is text elements only: images never enter it, so the
one artefact built for reading is missing everything visual. Production carries
50 images with **no alt attribute** and the new site always writes the attribute,
empty when it has nothing to say — a distinction that vanishes if both render as
`![](file.jpg)`, and it is exactly the distinction the `alt-lost` class exists
for.

**Blocked by:** [36](36-merged-content-view.md) only, which owns the tab this
toggle lives on. [34](34-position-and-ordering.md) was the other edge — an image
cannot be placed in the prose without the document-order index — and **the shared
counter landed**, so that edge is satisfied.

34 was reopened on 2026-08-07 on a different criterion, the deep link. This view
does not use it. Do not read 34's open status as a block on this ticket.

**Status:** ready-for-agent

**Implements:** spec [32](32-scannable-log-and-six-stores.md), phase 4,
decisions 21–24.

- [ ] The content tab has two view modes: *Vergelijking* (the row table) and
      *Leesweergave* (rendered prose, side by side). One tab, two renderings of
      the same data. Still five tabs.
- [ ] Markdown is rendered to HTML **at build time from the existing JSON**.
      **No Astro content collections** — collections are for authored files with
      a zod schema; this is derived data regenerated on every crawl, ~900 files
      written to disk to be read straight back, and the schema would be a second
      data contract competing with the one the repo already has.
- [ ] Markdown gains images, placed by the index from ticket 34.
- [ ] **Three distinct alt renderings**: alt with content, alt present but empty,
      and **alt attribute absent** carrying a visible marker. The absent case is
      the one that matters and the easiest to lose.
- [ ] An image renders as a **labelled placeholder** carrying its filename and
      alt text, with an **opt-in toggle** to load the live image. The new-site
      hosts are `*.intern.systems`; a hosted static build that hotlinks them
      breaks for every reader off the network.
- [ ] Tests at the existing extract seam: images at the right positions in the
      markdown, and the three alt renderings as three separate assertions.
