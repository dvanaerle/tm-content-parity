# 32 — Spec: a scannable diff, class filters, six stores, and a design system

Type: task
Status: resolved 2026-08-13 — seven of eight phases are built and measured. Read the
decisions below as the record of 2026-08-06 and not as the model: five of them are
superseded by later tickets, and the Testing Decisions section is stale. See the answer.
Blocked by: nothing — **114 resolved 2026-08-13; the two mute lines are struck in place.**
The note that added the block read: *"Mute keeps its menu"* has
no menu to keep: ADR 0011 withdrew the mute. Its other statement — that a re-classification
orphans any override keyed on the old class — stays true of the dismissal, which is keyed
on the finding id and therefore on the class. Everything else in this spec is unaffected.
Parent: ../map.md
Implements: the grilling session of 2026-08-06 (Q1–Q31)
Amends: 02 (class vocabulary), 06 (ImageRecord), 12 (tab count), 21 (meta panel),
07 (`TextElement.index`, see decision 8)
Resolves: 28 (the `structure` volume question)

## Problem Statement

The log runs and it can be worked, but an editor cannot **scan** it, cannot
**narrow** it, cannot **leave the nl store**, and cannot **find the thing it is
pointing at**.

- **The diff does not read as a diff.** Two columns of plain text, side by side,
  with a class pill and a number. Nothing is highlighted. To see that
  `Verkrijgbaar in de volgende kleuren` became `Beschikbare kleuren`, the editor
  reads both strings end to end and holds them in their head. A page has a median
  of 41 differences.
- **`structure` is 61% of the log and it means nothing an editor can act on.** It
  is what the tool says when the pairing found nothing, and a dropped paragraph
  and an invented one carry the same word.
- **There is no way to say "just show me the copy edits".** The only controls are
  one noise checkbox and the tab-per-check split. `copy` is 270 findings buried
  under 8,573.
- **The tool is nl only.** be, be_fr, de, fr and uk have seed rows, prod URLs and
  new URLs, and no data. The tool is already store-generic; nobody has run it.
- **A finding cannot be located on the page.** It carries no position at all. A
  finding reading `hier`, or `carports`, sends the editor to hunt through the
  page by eye — and `occurrences: 6` means it was six different places.
- **The interface has no design.** Tailwind 4 with no config, no tokens, four
  overlapping ad-hoc colour maps, stock palette, nothing of Tuinmaximaal in it.

Underneath the last point sits a measured hole: **762 elements on 67 pages match
on text but differ in tag or heading level, and the log reports them as
identical.** A heading demoted from `h2` to `h3` is invisible.

## Solution

One content view that reads like a diff editor, filterable by class, over any of
the six stores, in the house style.

- **The content tab is the diff.** Every element of the page in document order,
  production and new side by side, matched rows plain, lost rows red, added rows
  green, and changed rows with the changed **words** highlighted inside them. The
  Diff tab and the Content tab merge; Outline becomes navigation. Seven tabs
  become five.
- **`structure` splits by direction**, as links and images already did: content
  production has and the new site lost is shown; content the new site invented is
  hidden. The vague word disappears.
- **Class filters** on the page and on the dashboard, as a pure view filter that
  never moves a number.
- **A store switcher**, with a real dashboard route per store, over data crawled
  for all six.
- **Every finding says where it is** — the heading it lives under, and a link
  that scrolls the live page to it.
- **A design system**: the storefront's 22 brand hexes transcribed into one
  Tailwind 4 `@theme`, spent on chrome, with red and green reserved for diff
  meaning and nothing else.

## User Stories

### Reading a difference

1. As a content editor, I want the differences painted red and green, so that I
   can find them by scanning instead of by reading.
2. As a content editor, I want the changed **words** highlighted inside a changed
   sentence, so that I can see a small text edit without comparing two long
   strings character by character.
3. As a content editor, I want unchanged content shown too, so that the coloured
   rows stand out against a calm background instead of forming a wall of colour.
4. As a content editor, I want the whole page in document order in one place, so
   that I read the page as a page rather than as a list of complaints.
5. As a content editor, I want a lost element rendered as a red row with an empty
   opposite cell, so that "production had this and the new site does not" is
   obvious without reading a class name.
6. As a content editor, I want an added element rendered as a green row, so that
   I can tell at a glance that nothing was lost here.
7. As a content editor, I want the highlighting computed on the same normalised
   text the tool classifies, so that the colours never contradict the class pill.
8. As a content editor, I want a copy button that gives me the **literal**
   production string, so that I can paste the real text into Magento including
   its original punctuation.
9. As a content editor, I want a monospaced font in the comparison cells, so that
   two near-identical strings line up and the difference is visible.
10. As a content editor, I want to switch the content tab into a reading view of
    rendered prose, so that I can judge the page as a reader would.
11. As a content editor, I want the reading view side by side, so that I can
    compare the two pages as documents.
12. As a content editor, I want images in the reading view shown as a labelled
    placeholder with the filename and the alt text, so that the view works from
    outside the internal network.
13. As a content editor on the internal network, I want to opt into loading the
    real images, so that I can compare them visually when I can reach the hosts.

### Narrowing what is on screen

14. As a content editor, I want to filter the content view to one class, so that
    I can do a pass of nothing but copy edits.
15. As a content editor, I want to select several classes at once, so that I can
    work copy and casing together.
16. As a content editor, I want the filter to leave every count and every bar
    untouched, so that the number I quote to a manager does not depend on what I
    happen to have ticked.
17. As a content editor, I want the filter state visible while it is on, so that
    I never mistake a filtered view for a finished page.
18. As a content editor, I want to clear all filters in one action, so that I can
    get back to the whole page quickly.
19. As a content editor, I want to hide the matched rows again, so that I can go
    back to a dense list of differences when I know what I am looking for.
20. As a manager, I want to click a class on the dashboard and see only the pages
    carrying it, so that I can find every page with a copy edit outstanding.

### Understanding what a difference is

21. As a content editor, I want "production had this and the new site lost it"
    and "the new site invented this" to be two different classes, so that I know
    which of the two I am looking at without inspecting the columns.
22. As a content editor, I want the invented-content class hidden by default, so
    that a PageBuilder rebuild does not bury the content that was actually lost.
23. As a migration reviewer, I want a heading demoted from `h2` to `h3` to be
    reported, so that a structural regression with unchanged text does not pass
    as identical.
24. As a migration reviewer, I want a page whose first heading is not an `h1`
    surfaced, so that the 16 pages where the new site dropped the `h1` are
    visible.
25. As a migration reviewer, I want a non-heading tag change parked as hidden, so
    that it can be inspected without adding to the count.
26. As a content editor, I want a class name that tells me what happened, so that
    I never have to look up what `structure` meant.

### Finding it on the page

27. As a content editor, I want each finding to name the heading it sits under,
    so that I know which section of the page to scroll to.
28. As a content editor, I want a link that opens the live page scrolled to the
    text, so that a one-word finding like `hier` does not send me hunting.
29. As a content editor, I want that link for both production and the new site,
    so that I can see the difference in situ on both.
30. As a content editor, I want a finding that occurs six times to say so, so
    that I do not fix one and believe I am done.
31. As a content editor, I want image and link findings positioned too, so that
    "which of the eleven images" has an answer.

### Working the log

32. As a content editor, I want a checkbox to claim a fix, so that ticking off a
    pass is one click per row instead of a menu.
33. As a content editor, I want a claim that re-check has contradicted to look
    different from an untouched row and from an accepted one, so that I can see
    that I was wrong.
34. As a content editor, I want all six rows of a grouped difference to tick
    together and visibly, so that I learn that the tick acts on the difference
    and not on the line.
35. As a content editor, I want dismissing with a note to stay a deliberate
    action behind a menu, so that I never dismiss something by mis-clicking a
    checkbox.

### Working across stores

36. As a content editor, I want to switch to the German store, so that I can work
    the store I am responsible for.
37. As a content editor, I want the store in the URL, so that I can send a
    colleague a link to the French dashboard.
38. As a content editor, I want each store's dashboard to load only that store's
    pages, so that the page is fast.
39. As a content editor, I want the interface to stay in Dutch on every store, so
    that the tool reads the same wherever I am.
40. As a content editor, I want the be_fr store treated as its own store, so that
    the French Belgian pages are not mixed into the Dutch Belgian ones.
41. As a manager, I want each store to carry its own progress numbers, so that I
    can see which market is behind.
42. As a developer, I want one command per store to crawl and compare, so that
    refreshing a store is routine.

### The head of the document

43. As a content editor, I want a changed `<title>` shown with the same
    highlighting as body copy, so that I read it the same way.
44. As a content editor, I want a changed meta description shown the same way, so
    that I can spot a truncation or a lost keyword.
45. As a content editor, I want the meta panel clearly marked as display only, so
    that I do not expect it in the count.
46. As a content editor, I want canonical differences that are only a hostname
    suppressed, so that 93% of pages do not light up over an environment
    difference.
47. As a content editor, I want canonicals that production never had suppressed
    entirely, so that I am not shown 147 items I have no power to change.
48. As a migration reviewer, I want a canonical the new site **lost** shown
    loudly, so that the two pages shipping without one are not buried by the
    suppression rule.
49. As a content editor, I want `h1` removed from the meta panel, so that the
    same difference is not reported twice on two tabs.
50. As a migration reviewer, I want a `noindex` difference kept visible, so that
    a page silently de-indexed on the new site is escalated before launch.

### The look of it

51. As a content editor, I want the tool to look like Tuinmaximaal, so that it
    feels like part of our toolset.
52. As a content editor, I want red and green to mean removed and added
    everywhere in the tool and nothing else, so that colour is never ambiguous.
53. As a content editor, I want a neutral table surface, so that long sessions of
    reading are not tiring.
54. As a developer, I want one place where a colour is defined, so that the four
    overlapping colour maps stop drifting apart.
55. As a developer, I want one diff component used on content, links, images and
    meta, so that the four surfaces cannot disagree about what red means.

## Implementation Decisions

Ordered. **Phase 1 must ship and be measured before Phase 2 starts** — ticket 28
forbids moving the same rows twice and measuring the second change against a
moved baseline.

### Phase 1 — the class vocabulary

1. **`structure` is retired and replaced by two classes.** `text-missing`
   (production has the element, the new site does not) is **shown**;
   `text-added` (the new site has it, production does not) is **hidden**. Same
   split and same defaults as `missing-link`/`extra-link` and
   `image-missing`/`image-added`.
2. **Two new classes for the invisible structural changes.** When two elements
   match on normalised text but differ in tag or heading level, the pair stops
   being an exact match and becomes a finding: `heading-level` (**shown**) when
   either side is a heading, `tag-changed` (**hidden**) otherwise. This is the
   only rule in this spec that turns a currently-silent match into a finding, and
   it is what makes the missing `h1` on 16 pages visible.
3. **The contract goes from 18 classes to 21.** The class record is the single
   source; the browser reads it through the existing browser-safe vocabulary
   module.
4. **Accept that overrides on `structure` detach.** `class` is both the rule id
   ~~and the mute key~~ and a term of the finding id, so a re-classification orphans any
   override keyed on the old name. — **2026-08-13, ADR 0011: the mute clause is struck and
   the decision is unchanged.** A dismissal is keyed on the finding id, which carries the
   class, so it detaches for exactly the reason given here. This is a known and accepted consequence, recorded in ticket 08. It is
   near-free today because the Supabase project carries no real override data
   yet, and it will never be cheaper.
5. **Do not re-tune the 0.6 pair threshold in this phase, or in this spec.**
6. **Measure before Phase 2** and record in the map: shown findings, median per
   page, and the per-class breakdown, against the pre-change baseline of 10,076
   findings / 8,573 shown / median 41.

### Phase 2 — position

7. **One document-order walk in the extractor.** Text elements, images and links
   currently come from separate walks, so their positions are not on a shared
   counter. Merge them onto one counter.
8. **`ImageRecord` and `LinkRecord` gain an `index`** — the position of the
   **first** occurrence for a deduplicated record. Ticket 06's dedupe, set
   comparison and basename key are all unchanged. `index` is additive and does
   not enter the finding id, so no id moves and no override detaches.

   **Amended by ticket 34, 2026-08-07.** Additive held for `ImageRecord` and
   `LinkRecord`, which had no `index` before. It did **not** hold for
   `TextElement.index`, which ticket 07 defined as the position in the `elements`
   array: the shared counter of decision 7 runs over images and links too, so the
   two numbers stopped agreeing. `30-compare.mjs` now maps an element to its array
   position for `DiffRow.prod` and `DiffRow.new` rather than reading `.index`.
   This premise was wrong when written, and the amendment is recorded here so the
   next reader of decision 8 does not trust it.
9. **A finding gains the heading it lives under**, computed at compare time by
   scanning backwards from the element's position to the nearest preceding
   heading. Null when there is none.
10. **Fix the row-ordering defect.** A new-only row currently sorts by its index
    in the **new** document compared against **production** indices, which is
    wrong wherever the two documents differ in length — on `fotogalerij`,
    production 178 elements against the new site's 9, it is badly wrong. Anchor a
    new-only row to the production position of the nearest preceding matched
    pair. This is invisible today and becomes a visible lie the moment the view
    claims to show the whole document in order.
11. **No DOM path, and no per-position finding id.** Ticket 01 rejected both.

### Phase 3 — the diff rendering

12. **A new browser-safe pure module holds the word-level diff.** It takes two
    normalised strings and returns a list of unchanged / removed / added spans.
    No `node:crypto`, so a React island imports it directly. This is the one new
    seam in the spec.
13. **The algorithm is word-level, not character-level**, over whitespace-split
    tokens, with a longest-common-subsequence backbone. Character-level on Dutch
    compounds produces confetti.
14. **The diff is computed on `norm`, and `norm` is what is rendered.** Tier 1
    folds curly quotes, NBSP, dashes and entities deliberately; diffing `raw`
    would paint differences the tool simultaneously classifies as equal. `raw` is
    reachable through a copy button.
15. **Two layers of colour.** Row-level: a lost row's production cell is red, an
    added row's new cell is green, a changed row is neutral. Word-level: inside a
    changed row, removed tokens red and added tokens green. The row-level layer
    covers every finding; the word layer only the paired ones.
16. **One diff component, four places** — content rows, link findings, image
    findings, meta rows. A link finding word-diffs the two target keys, which
    makes a changed path segment jump out.

### Phase 4 — the merged content view

17. **The Diff tab and the Content tab merge into one tab.** The element table is
    the spine; Markdown is demoted from a tab to an export. This upholds the
    standing rule that Markdown is never the diff spine, because it flattens the
    element identity the finding id depends on.
18. **Matched rows are shown by default.** The tint only reads as a signal
    against untinted baseline. The inverse control — show only differences —
    remains.
19. **Outline is retired as a tab and returns as navigation**: a sticky
    heading jump-list beside the content view. It was production's element list
    indented by heading level, which the merged view now contains.
20. **Five tabs**: Inhoud, Links, Afbeeldingen, Meta, Taken. This closes ticket
    12's question about whether the tab count holds.
21. **The content tab has two view modes** — *Vergelijking* (the row table) and
    *Leesweergave* (rendered prose, side by side). One tab, two renderings of the
    same data.
22. **Leesweergave renders the Markdown string to HTML at build time from the
    existing JSON. No Astro content collections.** Collections are built for
    authored files with a zod schema; this is derived data regenerated on every
    crawl. Six stores × two sides × ~450 pages is ~900 files written to disk to
    be read straight back, and the zod schema would be a second data contract
    competing with the one the repo already has.
23. **Markdown gains images**, placed by the new `index` from decision 8, with
    three distinct renderings: alt with content, alt present but empty, and
    **alt attribute absent** rendered with a visible marker. Production carries
    50 images with no alt attribute and the distinction is what the `alt-lost`
    class exists for — it must not vanish in the one artefact built for reading.
24. **Images in Leesweergave are labelled placeholders carrying the filename and
    the alt text**, with an opt-in toggle to load the live image. The new-site
    hosts are `*.intern.systems`; a hosted static build that hotlinks them breaks
    for every reader off the network.

### Phase 5 — filters and controls

25. **Class filters are a pure view filter.** Multi-select, session-only, never
    touching the bar, the denominator or any count. A filterable denominator
    would make two people quoting "the number" mean different things.
26. **The dashboard's class pills become clickable** with the same semantics,
    filtering the page list to pages carrying that class.
27. **A checkbox replaces the "Opgelost" button only.** Dismissal keeps its
    menu, because ticket 09 makes a note mandatory on a dismissal and a checkbox
    cannot carry one. ~~Mute keeps its menu.~~ — **struck 2026-08-13, ADR 0011: there is no
    menu to keep.** One menu, and the reason for it was always the dismissal's note.
28. **The checkbox has three visual states**: unticked, ticked, and
    **ticked-but-contradicted**. `fixed` is a claim of fact that loses to
    re-check; a two-state checkbox is exactly the affordance that made the
    superseded "the tick always wins" model feel natural.
29. **A tick on one row of a grouped finding ticks every row of it, visibly**,
    and the row shows the occurrence count. Bulk stays a UI action writing N
    events, never a third override key.

### Phase 6 — the meta panel

30. **Meta renders with the diff treatment and emits no findings.** Ticket 21 is
    not resolved by this spec. Nothing enters the contract, the bar or the count.
31. **The meta panel is framed as display-only** with no override controls, so
    the shared visual language cannot be mistaken for actionability.
32. **Absolute URLs in meta are host-folded before comparison**, reusing the
    link-key folding that already collapses the page's two hosts to one token.
33. **Canonical is hidden when production has none and the new site has one** —
    147 of 179 nl pages. The content team cannot set a canonical, so it was never
    an actionable difference. The suppression is **directional**: the two pages
    where the **new site** lost a canonical stay visible and are flagged.
34. **`h1` leaves the meta panel.** It is an element inside the content boundary
    and the merged content view owns it, with position, level, an override
    control and a finding id. 93 pages differ on it and it must be reported once.
35. **`noindex` stays visible.** Four pages differ, and a page indexable on
    production and `noindex` on the new site is a launch blocker even where the
    editor's job is to escalate rather than fix.

### Phase 7 — six stores

36. **Axis A only.** Per store, production against the new site of that same
    store. Axis B stays unbuilt and is not touched.
37. **A dashboard route per store**, with a switcher in the shell that navigates.
    The page-level route already carries the store; the dashboard is the only
    place that does not. Each store's HTML carries only its own store's
    summaries.
38. **No pipeline code change is needed.** The crawl, extract, compare, link-key
    and report-naming paths are already store-generic and were verified so. The
    work is a data run: 270 rows, 540 requests, five stores.
39. **Fix the failure-log overwrite first.** The extract failure file is one
    fixed filename that each run overwrites, so a `be` run erases the nl record —
    which today holds the `faq/offerte` redirect loop. Make it per store.
40. **Verify production is not in maintenance before each run.** The crawler
    aborts loudly on a 500 or 503, which is correct; all ten hosts answered 200
    at the time of writing, and the `prodMaintenance` flags in the seed data are
    stale.
41. **The be/be_fr shared-host blind spot is accepted and measured, not fixed.**
    `cross-store-link` compares hosts, and be and be_fr share one, so a French
    page linking into a Dutch Belgian page is not flagged. Crawl be_fr, count how
    many be_fr anchors actually point at a non-`/fr` path on the shared host, and
    write the number into the map. Only open a ticket if the number is not zero.
42. **The interface stays Dutch on every store.** The log's question is whether
    two strings match, which needs no comprehension of either. No translation
    affordance.

### Phase 8 — the design system

43. **The storefront's brand colours are transcribed by hand into a Tailwind 4
    `@theme` block.** The storefront config is Tailwind 3 CommonJS, requires a
    Hyvä Node package at require-time, and uses v3 entry syntax — it cannot be
    imported. It is 22 self-contained hex values, so transcription is cheap.
44. **Brand colour is spent on chrome only** — header, navigation, the store
    switcher, focus rings, links.
45. **Red and green are reserved for diff meaning and never for status.** The
    brand primary is dark green and the accent is orange; letting green mean both
    "Tuinmaximaal" and "the new site added this" puts two meanings on one hue,
    eight pixels apart. Status messages use amber and blue.
46. **Stock neutral greys carry the table surface.** The storefront's neutral
    ramp is five steps with a hole exactly where table borders, zebra stripes and
    hover states live.
47. **A monospaced family is added** for the comparison cells. The storefront has
    none, and its type scale bottoms out at 10px with generic line-heights.
48. **The four overlapping ad-hoc colour maps collapse onto the `@theme`.** This
    is the concrete reason the design work and the diff work are one batch: the
    diff needs a red and a green defined in exactly one place.
49. **The Figma file is not a source.** The file at the shared URL contains one
    page of Hyvä marketing cover art, no variables, no styles and no components;
    verified three times, including a whole-document listing. If the real kit
    surfaces it changes which hexes go in the `@theme` and nothing else in this
    spec.

## Testing Decisions

A good test here states an **external behaviour in the domain's words** and would
survive a rewrite of the thing underneath it. It asserts on the shape the
contract names — a finding, a row, an extract — never on a private helper, and
never on rendered markup. The repo's five existing test files are all of this
kind and are the prior art; follow them.

**Reuse the existing seams. One new seam only.**

- **`compare/compare.test.mjs`** — the largest share. The `text-missing` /
  `text-added` split including that the added side is hidden by default;
  `heading-level` firing on an `h2`→`h3` pair with identical text and
  `tag-changed` on a `p`→`div` pair; that a same-text same-tag pair is still an
  exact match and emits nothing; the nearest-preceding-heading on a finding, and
  null when the element precedes every heading; the new-only row ordering,
  specifically the asymmetric case where the two documents differ sharply in
  length; meta host-folding; the directional canonical suppression, asserting
  **both** that the production-null case is hidden and that the new-null case is
  not.
- **`compare/contract.test.mjs`** — 21 classes registered with the right check,
  axis and shown/hidden default; `structure` gone; existing finding ids for
  untouched classes unchanged.
- **`crawl/extract.test.mjs`** — one shared document-order counter across text,
  images and links; first-occurrence `index` on a deduplicated image; that
  dedupe, the basename key and the set comparison are unchanged; markdown
  containing images at the right positions; and the three alt renderings as three
  distinct assertions, because the absent-attribute case is the one that matters
  and is the easiest to lose.
- **The new word-diff module** — tested in `compare/compare.test.mjs` alongside
  the rules that use it. Identical strings produce one unchanged span; a one-word
  substitution produces exactly one removed and one added span; an insertion at
  the head and at the tail; the empty-string cases on each side. It is a pure
  function of two strings, which is why it is a module and not a component.
- **`api/server.test.mjs`** — unchanged, but must stay green: the re-check path
  round-trips a report through the new contract.

**Not tested, deliberately and consistently with the repo as it stands:** React
components, Astro routes, and the Tailwind theme. There are five test files and
no component tests — no React Testing Library, no jsdom. Introducing a browser
test stack would be a larger change than this spec. The mitigation is decision
12: every rule with judgement in it lives in a pure module that Node can test,
and the components stay thin enough to read.

**Regression gate:** the comparison numbers must be re-measured and written into
the map after Phase 1 and again at the end. Ticket 29 held the line at 179
crawled / 124 comparable / 8,573 shown; Phase 1 is expected to move the third
number a long way and must not move the first two.

## Out of Scope

- **Axis B, cross-language coverage.** No code exists for it and none is written
  here. The store switcher is Axis A per store and nothing more.
- **Resolving ticket 21.** The meta panel gets the diff *rendering*; it emits no
  findings and the question of what a parity defect in the `<head>` is stays
  open.
- **Any check on the new site alone.** The `h1` rule enters as a comparison
  because production has an `h1` on all 16 pages that lack one. A page with no
  `h1` on **either** side stays silent. This holds the standing CRO boundary: the
  log says "make new match prod", and advice that says "make new beat prod" is a
  separate effort after parity closes.
- **Re-tuning the 0.6 pairing threshold.**
- **An actionability axis.** Canonical is handled by not rendering one field, not
  by a second dimension on every class. Ticket 02 removed the confidence axis for
  this reason. Revisit only if Phase 1 fails to bring the volume down.
- **A path-prefix rule for the be/be_fr shared host.** Measure first.
- **Fixing the storefront defects this spec surfaces**, including the missing
  canonical on 147 of 179 production pages. Those belong in
  `storefront-defects.md` and need an owner in the storefront work.
- **Wiring Supabase.** Ticket 30 owns it and remains the real risk.
- **Localising the interface.**
- **Browser rendering.** Ruled out for good by ticket 19.

## Further Notes

**Measurements this spec rests on**, all taken on 2026-08-06 against the 179 nl
reports:

| | |
|---|---|
| exact-text pairs reported as identical | 3,659 |
| …of which the tag differs | 762, on 67 pages |
| …of which the heading level differs | 467 |
| …of which `kind` differs (mostly `a` → `h3`) | 434 |
| new-site pages starting on a non-`h1` heading | 16 |
| …where production **also** starts non-`h1` | **0** |
| new site with no `h1` at all | 8 (production 4) |
| canonical differs | 167 of 179 |
| …production has none | 147 |
| …differs only by hostname | 18 |
| …new site has none | 2 |
| title / description / h1 / noindex differ | 71 / 84 / 93 / 4 |
| crawl cost, five non-nl stores | 270 rows, 540 requests |

**The `a` → `h3` group needs a look before `heading-level` is trusted.** 434 of
the 762 tag changes also change `kind`, and an anchor whose text became a heading
may be an extraction artefact rather than a content change. Inspect a sample
during Phase 1; if it is an artefact it is a bug fix, not a class.

**Two decisions in here are ADR candidates**, being hard to reverse, surprising
to a future reader, and the result of a real trade-off:

- Rendering Markdown from the JSON rather than using Astro content collections
  (decision 22) — a reader will ask why the framework's obvious feature is
  unused.
- Brand colour for chrome only, with red and green reserved for diff meaning
  (decisions 44–46) — a reader will ask why the storefront's status tokens were
  not adopted.

**This spec resolves ticket 28** and answers ticket 12's remaining questions
about the tab count and the landing tab. Diff stays first, because it is now the
whole content of the page rather than a wall of unexplained differences.

## Answer

> *This was generated by AI during triage.*

**Closed on 2026-08-13 by verification, not by work.** The spec read
`ready-for-agent` while six build tickets had already built it. Four sweeps read
`compare/`, `crawl/`, `web/src/` and `overrides/` against all 49 decisions.
Nothing here was implemented during the triage.

### The phases

| phase | decisions | ticket | verdict |
|---|---|---|---|
| 1 — the class vocabulary | 1–6 | 33 | built and measured |
| 2 — position | 7–11 | 34 | built; one criterion open |
| 3 — the diff rendering | 12–16 | 35 | built |
| 4 — the merged content view | 17–20 | 36 | built |
| 4 — Leesweergave | 21–24 | 37 | **not built**, parked `wontfix` |
| 5 — filters and controls | 25–29 | 36 | built |
| 6 — the meta panel | 30–35 | 35 | built |
| 7 — six stores | 36–42 | 38 | built |
| 8 — the design system | 43–48 | 35 | built |

Where each decision lives, for the phases a reader is most likely to doubt:
`classifyExactPair()` in `compare/text.mjs` makes `heading-level` and
`tag-changed`; `compare/worddiff.mjs` is the browser-safe word diff and
`DiffCells` in `web/src/components/Diff.jsx` is the one component decision 16
asked for, used on content rows, link findings, image findings and the meta
panel; `anchorHeadingFor()` in `compare/locate.mjs` gives a finding its anchor
heading; `sortKey()` in `compare/text.mjs` anchors a new-only row to the
production position of the nearest preceding matched pair; `web/src/lib/view.mjs`
is the filter, and a test pins that it returns no denominator; `compare/meta.mjs`
holds the directional canonical suppression and states that it makes no findings;
`web/src/styles/app.css` holds the `@theme` and `web/src/lib/palette.mjs` is the
one colour map the four collapsed onto. All six stores are on disk — nl 179, de
134, be 130, uk 128, fr 123, be_fr 122.

### What is left open, and who owns it

- **Leesweergave, decisions 21–24 and stories 10–13.** Built on 2026-08-11 and
  reverted the same day, on a value question the code cannot answer. Parked
  `wontfix` with a re-open trigger; the build is on the branch
  `park/ticket-37-leesweergave`. See
  [37](.out-of-scope/37-leesweergave.md).
- **Story 29 — the deep link on both sides.** Ticket
  [34](34-position-and-ordering.md) is reopened on it. Both links are built from
  the production anchor heading, so the new-site link cannot resolve wherever
  that heading changed, and 1,622 findings carry no heading and so no link at
  all. It wants a grilling before it wants code.
- **Story 24 — a page whose first heading is not an `h1`.** `heading-level` needs
  identical text on both sides, so it cannot reach a page that lost the `h1`
  outright. Ticket [44](44-heading-outline-shape.md) is the nearest owner. The
  numbers moved: 11 pages start on a non-`h1` and 3 have none, not 16 and 8.

### Five decisions are superseded, and the spec text does not say so

Read them as the record of 2026-08-06.

1. **Decision 20 — five tabs.** There are four: Inhoud, Links, Afbeeldingen,
   Meta. Ticket 81 removed Taken.
2. **Decisions 1–3 — shown and hidden.** Visibility is a three-value enum now,
   `work` / `information` / `diagnostic`, per ADR 0005. "Shown" is `work` plus
   `information`. The contract holds 22 classes and not 21; the twenty-second is
   `no-declared-alternate`.
3. **Decision 25 — session-only.** True of the content view. The dashboard's
   filter is in the URL, per ADR 0010 and ticket 109.
4. **Decision 46 — stock neutral greys.** Retired in `app.css`. The neutrals come
   from the styleguide names, and no `slate-*` class is left in the interface.
5. **The whole Testing Decisions section.** It rests on "five test files and no
   component tests". There are 29 test files, and `vitest.config.mjs` defines a
   real browser project on headless Chromium with three component tests in it.
   Its one durable instruction — every rule with judgement in it goes in a pure
   module — held: `worddiff.mjs`, `locate.mjs` and `view.mjs` are all of that
   kind.

Two smaller drifts, neither of them worth a ticket on its own. Decision 40 asked
that production is verified before each run; the guard is in flight rather than
before it — `maintenanceReason()` throws on a 503 or a 500 and the crawl aborts —
and the `prodMaintenance` seed flags are gone. Decision 44 asked for brand focus
rings; the rings come from `--ring`, which is a muted grey.

### One defect found on the way, and fixed

`FixCheckbox` in `web/src/components/OverrideControl.jsx` read
`contradicted ? TICK.attention : TICK.secondary`, and `TICK` defined only `info`
and `attention`. `TICK.secondary` was `undefined`, so a tick that stands fell
back to the shadcn primary. Decision 28 asks for three visual states and two of
them were distinct. Fixed on 2026-08-13: `TICK` gains an `added` entry and the
checkbox reads it.

**The standing tick is green, and that is a decision.** `palette.mjs` reserves
the only green in the interface for the `added` direction — *the new site has
this and production does not* — and spends none of it on status, which is spec 32
decision 45. This checkbox is the one exception, taken on preference after the
conflict was raised. It is recorded in the docblock above `TICK` so a later
reader does not take it for the drift the one colour map exists to stop, and
`TICK.info` stays defined and unused so restoring the blue is a one-word change.
