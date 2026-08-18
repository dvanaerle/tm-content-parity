# The log reads one viewport, and a breakpoint band decides which copy goes

Production sends the desktop and the mobile version of some blocks in the same HTML.
The extraction is an HTTP fetch and a non-rendering parse, so it has no computed
style and cannot see that a block is hidden. It read both copies, and the second one
paired against nothing: `text-missing` on content the new site has, once, exactly
where it should be.

We decided that the log compares a page at **one width — desktop, 1280 pixels** — and
that the copy a reader at that width never sees is **dropped at extraction**, by a
committed list of markup conventions in `shared/canonical-viewport.mjs`.
`CANONICAL_VIEWPORT` and `CANONICAL_VIEWPORT_WIDTH` are the one place in the code
that says which width; `crawl/extract.mjs` holds the removal, and `web/` states the
consequence. Two stages read the rule, so ADR 0001 puts it in `shared/`.

## Why the number, when nothing renders

Because a breakpoint utility hides a block inside a **band**, not above a threshold,
and the band is what a selector has to be chosen by. Magezon's five, read from
production's own stylesheet on 2026-08-18:

| class | hidden at |
| --- | --- |
| `mgz-hidden-xs` | `max-width: 575px` |
| `mgz-hidden-sm` | `576px`–`767px` |
| `mgz-hidden-md` | `768px`–`991px` |
| `mgz-hidden-lg` | `992px`–`1200px` |
| `mgz-hidden-xl` | `min-width: 1200px` |

Only the top band contains a desktop, so only `mgz-hidden-xl` names a block a desktop
reader does not get. 1280 is inside that band rather than on its edge, and a later
move to 1440 or 1920 stays inside it and changes nothing in the list. That is the
point of writing the bands down instead of the pixels.

**The token does not even mean one thing on one page.** The theme is Bootstrap 3,
whose scale has four tiers where Magezon's has five, and its `.hidden-lg` is
`min-width: 1200px` — the band Magezon calls `xl`. So `hidden-lg` and
`mgz-hidden-lg` on the same page disagree about whether a desktop sees the block, and
only the stylesheet says which is which. This is why `validateConventions()` refuses
an entry that names no framework, and it is the strongest argument in this file for
the whole shape of the list.

The first version of this rule read the class *names* and took `mgz-hidden-lg` as
well, on the reasoning that `lg` is a large screen. That was wrong for the reason
above, and correcting it moved 18 texts across the corpus — not the hundreds first
claimed here on the strength of a coincidence in timing. The number is small because
the two Magezon tokens almost always travel together: of 175 duplicated copies
measured, **none** carried `lg` or `xl` alone.

So the bar for a convention is a **stylesheet reading**, and a name that looks like a
breakpoint is not evidence.

## How we know the rule only drops what a reader cannot see

The extraction cannot check its own premise, so a probe does it with a browser:
`crawl/probes/probe-canonical-viewport-visible.mjs` renders the page at 1,280 pixels
and reads computed style. Over 19 page-store pairs — the widest pages in the corpus
and two controls — the committed conventions match **119 elements, of which 0 are
visible**. That is the acceptance test for this ADR, and it is the reason the list is
allowed to drop anything at all.

It also measures the converse, and the answer is worth recording because it is
uncomfortable: **617 content units on those same 19 pages are invisible at 1,280
pixels and no convention reaches them.** They are not responsive copies. They sit
behind a closed modal (`tm-modal-content`), inside a collapsed accordion panel
(`mgz-panel-body`), or in a paginator that the excluded product grid already accounts
for. The log reads them and compares them, which over-reports and is safe. Hiding for
a reason that is not a viewport is a different problem with a different answer, and it
is not solved here — ticket 137.

## Why this is not a third kind of excluded region

ADR 0003 already removes regions at extraction, with a committed list, a reason
vocabulary and a size cap. Adding `hidden-at-canonical-viewport` to `REGION_KINDS`
would have cost no new machinery and would have inherited the dashboard listing and
the coverage verdicts for free. It is still wrong, for one reason:

**An excluded region is content the log does not check. A second copy is content the
log checks once.** ADR 0003's vocabulary means "nobody writes it" or "nobody will
migrate it", and its stated consequence is that we are blind to changes inside the
region — correct there, because neither kind can make editor work. A mobile copy is
editor work and it *is* migrated: dropping it costs nothing precisely because the
desktop copy is still compared, word for word. The two lists make different promises
and fail in different ways, so they stay two lists with two vocabularies.

What they do share is the number. `DEFAULT_MAX_UNITS` and `ABSOLUTE_MAX_UNITS` are
imported from `shared/excluded-regions.mjs` rather than retyped, so the ceiling is one
fact about this codebase and not two that can drift.

## The bar for a new convention

1. **A stylesheet reading, not a class name.** The band the utility hides in, quoted
   from the CSS the site serves, and containing `CANONICAL_VIEWPORT_WIDTH`.
2. **A named framework.** A convention belongs to a front end, and the next front end
   brings its own. `validateConventions()` refuses an entry without one. Two
   frameworks on this site already use the token `lg` for different bands.
3. **A visibility check in a browser.** Every match invisible at
   `CANONICAL_VIEWPORT_WIDTH`, measured and not reasoned. One visible match is a
   defect.
4. **A measurement on at least three pages**, in the entry, with the count on each
   side.
5. **A cap with headroom over the widest page in the corpus.** The cap must never fail
   the run on a correct selector — ticket 64 learned that from a banner that appears
   three times on three nl pages — and it must fail on a wrapper. The first cap here
   was set to 40 against a widest-measured 40, which is a guard with a margin of zero;
   the corpus measurement is what caught it.
6. **A failure direction that over-reports.** A convention that stops matching brings
   the second copy back as findings. It must never widen.

## Consequences

- **The log does not check the mobile version of a page.** This is the cost, it is
  accepted, and it is stated where a reader meets it: `CONTEXT.md`, and the store
  dashboard under *Excluded regions*, as **One width**. It is a statement about what
  is compared and never about what the interface runs on — ticket 87's three widths
  are a different subject, and confusing the two would read as a promise that the
  dashboard is desktop-only.
- **The rule is one-sided, because the duplication is.** The new site removes **0
  units on every page in the corpus**: its `data-content-text-desktop` sits on *both*
  copies of a repeated line, so it is a text style and not a hide-one convention. ADR
  0003 asks a region to match on both hosts, and for the same reason it gives — cutting
  one side only turns the other side's units into `text-added` rows nobody can fix.
  That reason is answered here by measurement rather than by symmetry: the new site
  has no second copy to cut, and the corpus run reports what the asymmetry actually
  costs.
- **A one-sided rule on a site that later duplicates would be wrong in the safe
  direction.** If the new site ever ships a second copy, this list does not match it,
  the copy stays in the extract, and it reads as added content. That over-reports.
- **Every extraction records what the width dropped**, as
  `diagnostics.hiddenAtViewport`, beside `regionsExcluded`. It is a count and not a
  list: a reader asks how much of the page the chosen width dropped, never which
  utility class did it. An extract written before this ticket has no such key, which
  reads as "nothing dropped here" — the over-reporting direction.
- **There is no coverage verdict for a convention that stops matching.** ADR 0003's
  regions get one, from `compare/region-coverage.mjs` against the last snapshot. A
  convention does not, and the failure is therefore silent at the crawl and invisible
  a run later: a Magezon upgrade that renames the utility would quietly return every
  second copy as `text-missing`. That is the over-reporting direction, so it is safe,
  and it is a real gap rather than a decision — the same asymmetry ADR 0003 records
  for `capBreachMessage`, which fails a crawl that matches too much and says nothing
  about one that matches nothing.
- **We are blind to a block production sends only for a phone.** Measured, not
  assumed: the corpus figure is in the ticket, and the largest single item is a
  mobile-only jump link (`▼ Direct naar producten▼`) on category pages.

## Considered options

- **Render the page in a headless browser and read computed style.** The correct
  answer to "is this block hidden", and rejected on cost: the crawl is 1,600 HTTP
  fetches of a live shop, `crawl/` has no browser anywhere, and Playwright is in this
  repo for `web/` component tests only. It would replace a list of five CSS bands with
  a browser in the crawl path. Worth revisiting only if the conventions multiply.
- **Deduplicate by text instead — drop the second identical unit on a page.** Rejected.
  Duplicate text on this site is overwhelmingly *legitimate* repetition: measured over
  the 816-page corpus, 3,612 duplicate copies on 495 pages, and almost all of it is
  product tiles that each say `Stel nu samen`, a RAL colour table, and one
  `Download de montagehandleiding` per product. A text rule would delete real content
  and could not tell the two cases apart. The markup is what carries the distinction.
- **Drop the class-convention rule and close the ticket.** This was ticket 69's own
  instruction if the promo banner's removal left almost nothing, and it was tested
  rather than assumed. The measurement declined it: see the ticket.
