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

**Status:** needs-triage — on hold. It was built on 2026-08-11 and reverted the same
day. The open question is not a specification question: it is whether a second reading
of the same page earns the surface it costs. Read *Built once, then held* below before
you build it again.

## Built once, then held — 2026-08-11

Every criterion below was met and every test passed. It came out anyway, on the one
question the code cannot answer. **Nothing here is a defect list.**

The build is on the git stash `ticket 37 Leesweergave: built 2026-08-11, reverted
pending a value decision`. `git stash apply` brings it back. It is worth ten minutes
of a reader's time before anyone specifies this again.

**What it cost:** 6 files, about 490 lines. `shared/markdown.mjs` and its test (the
image line, written by `crawl/` and read by `web/`), `web/src/lib/reading.mjs` and its
test (`readingBlocks`, pure, 7 tests), `web/src/components/Leesweergave.jsx` (182
lines), a `toMarkdown(units, images)` change in `crawl/extract.mjs`, and a `ModeSwitch`
in `ContentView.jsx`. `npm test` went 545 → 554. The web build stayed at 823 pages.

**What it would have needed next, and did not get:** a crawl. `markdown` is written by
`crawl/`, so all 816 committed reports carried the old image-less string. The view
worked; it had no images to place until the next crawl ran. Verified against a stored
extract instead — `data/extract/nl/terrasoverkapping.json` gave 157 blocks, 13 images,
12 with alt text and 1 with the attribute absent, marked.

**Three things a rebuild should decide differently:**

1. **Not at build time.** Decision 22 says build time. A Recheck replaces the report
   client-side (`usePageReport`), so prose rendered in the `.astro` frontmatter is last
   crawl's prose under this minute's numbers. The parse belongs in the island. Decision
   22's *reason* — no content collections, no zod, no ~900 files — holds either way.
2. **A table reads as a bullet list.** `toMarkdown` already writes `th`/`td` as `- `,
   from ticket 36. Measured on nl: **9 of 93 pages carry `th`/`td` units, 156 cells in
   all**, and on **4 pages** two different item tags sit adjacent, where gathering a run
   of `- ` into one list reports a structure the page does not have. In the view whose
   whole job is *does this page still read*, that is the wrong answer. Fixing it is a
   change to the Markdown artefact, and it is not in this ticket.
3. **The Outline leaves in reading mode**, because its anchors are row anchors and no
   row exists there. Decision 19 puts the jump list beside the content view, and the
   reading view is the one rendering with real `h1`–`h6` — so it is where a jump list
   would work best. Giving it one means anchors on the prose, which this ticket never
   scoped.

**What was sound, and needs no second look:** images placed on ticket 34's shared
counter, with a deduplicated image at its first occurrence. The three alt states kept
apart end to end, with the absent marker in the Markdown **title slot** — `![](a.jpg
"geen alt-attribuut")` — because a marker in the alt slot is a string a real alt could
also hold, so reading it back would be a guess. The live image opt-in, off by default.
Five tabs, unchanged: the switch is a `role="group"` and not a second `tablist`.

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
