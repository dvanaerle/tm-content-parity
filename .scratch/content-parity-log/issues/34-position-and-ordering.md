# 34 — Where is it? Position for every finding

**What to build:** an editor reading a finding knows where to look. A finding
that says `hier` or `carports` names the heading it sits under and offers a link
that opens the live page scrolled to that text — on both sides.

Today a finding carries no position at all: id, store, page, check, class, the
two strings, an occurrence count and a score. Grouping actively destroys
position. So a one-word finding sends the editor hunting through the page by eye,
and `occurrences: 6` means it was six different places.

Blocked by: [33](33-directional-text-classes.md) — the spec forbids moving
the same rows twice, and phase 1's measurement must be settled against an
unmoved baseline before anything else changes the comparison.

Status: ready-for-agent

Reopened on 2026-08-07 by the review of commit `3251d91..HEAD`. Eight of the nine
criteria hold. The deep-link one does not, and it was ticked in error. See
"What is not done" below.

**Implements:** spec [32](32-scannable-log-and-six-stores.md), phase 2.

- [x] Text elements, images and links come from **one** document-order walk, on a
      shared counter. They are three separate walks today, so their positions
      cannot be interleaved.
- [x] Image and link records carry an `index`. For a deduplicated record it is
      the position of the **first** occurrence.
- [x] Ticket 06's image rules are untouched: dedupe stays, the basename key
      stays, set comparison stays. `index` is additive and does **not** enter the
      finding id, so no id moves and no override detaches.
- [x] A finding carries its **anchor heading** — the nearest heading before it in
      document order, null when it precedes every heading.
- [ ] Every finding row offers a link that scrolls the live page to its text, for
      production and for the new site.
- [x] A finding with more than one occurrence says so on the row.
- [x] **The row-ordering defect is fixed.** A new-only row currently sorts by its
      index in the *new* document compared against *production* indices — badly
      wrong wherever the documents differ in length, as on `fotogalerij` with 178
      production elements against 9. Anchor a new-only row to the production
      position of the nearest preceding matched pair.
- [x] No DOM path and no per-position finding id.
- [x] Tests at the existing extract and compare seams, including the asymmetric
      ordering case and the null anchor heading.

## What is not done

**1,622 of the 10,796 findings have no anchor heading, and those rows carry no
deep link at all.** `Section` renders nothing when the heading is null, so a
finding above the first heading on its page offers the editor no way to reach it.
The number is measurable: `anchorHeading` is set on 9,174 findings and null on
1,622.

**Where the link does render, it points at the heading and not at the finding.**
Only the Diff tab links the words themselves. On the Links, Afbeeldingen and Taken
tabs the fragment carries the section heading, because a link target and an image
key are not words on the page.

**Both deep links are built from the production heading.** `links.mjs` and
`images.mjs` pass `prodHeading(...)` for the finding, and `Section` then makes the
production url and the new-site url from that one string. On a page where the
heading itself changed, the new-site fragment cannot resolve, and it fails
silently.

Spec 32's user story 29 asks for the link "for both production and the new site,
so that I can see the difference in situ on both", so the second and third points
are the same unmet requirement seen from two sides. Closing this needs a decision
the ticket never took: what a finding with no anchor heading should offer instead.
That decision belongs to a ticket of its own.

## Resolution

Built on branch `axis-a-compare-and-log`, commit `00116f2`. 225 tests green,
180 pages built. **Eight of the nine criteria.** The ninth is above.

**The measurement did not move, and that is the result.** 179 crawled, 124
comparable, 10,796 findings, 7,456 shown, median 37 a page — ticket 33's baseline,
to the finding. Phase 2 adds position and changes no rule, so any movement here
would have been a defect.

### One walk, one counter

`crawl/extract.mjs` had three `querySelectorAll` passes. It now has one, over
`TEXT_TAGS` plus `img`. **Every record a node makes shares that node's position**,
so an anchor's words and its target agree about where they are. A node that makes
no record takes no number, which keeps the counter gapless. A repeat of a
deduplicated image makes no record, so the position is the first occurrence.

The swallow rule needed splitting to do this. A heading speaks for an anchor
inside it, and it never spoke for that anchor's **target** — ticket 05 counts
every anchor. As three walks that was true by accident, because `links()` never
saw the swallow set. It is now stated: `textElement()` returns null and
`linkRecord()` still runs.

### Three decisions the ticket did not give

- **`TextElement.index` is no longer the position in the `elements` array.** The
  shared counter runs over images and links too. `DiffRow.prod` and `DiffRow.new`
  are array positions, because the browser reads the element back with
  `elements[row.prod]`, so `30-compare.mjs` maps the element to its array
  position instead of reading `.index`. The contract said "index into
  `sides.production.elements`" all along; the two numbers merely used to agree.
- **`anchorHeading` is out of the grouping key as well as out of the id.** The
  same rename under six headings is still one rename. The heading names the first
  of them and `occurrences` says there are more. Putting it in the key would have
  split one finding into six.
- **The ordering rule needed two cases the ticket did not name.** An addition
  above the **first** agreement anchors just before that agreement, not at the top
  of the page: on `fotogalerij` the first agreement is production element 170, and
  the top of production is not where the new site's opening block belongs. And
  when the two documents agree **nowhere** there is no position to claim, so the
  additions follow the whole of production — a wholly rebuilt page reads as
  production first, then the new site.

The sort key is a tuple `[base, before-or-after, new index]`, not a fraction. No
arithmetic can then collide a new-only row with the production row it must sit
against, which the old `index + 0.5` could as soon as the indices stopped being
contiguous.

### Measured

| | |
|---|---|
| findings carrying an anchor heading | **9,174** of 10,796 |
| findings with none, all above the first heading | 1,622 |
| new-only rows site-wide | 1,805 |
| rows the ordering fix moves | **6,990**, on **109** of 124 pages |
| worst page, `terrasoverkapping` | 281 of 288 rows move |
| `fotogalerij`, production against new | 178 elements against 9 |

The ordering defect was bigger than the ticket guessed. It is invisible today,
because the Diff tab shows only the rows that differ; it becomes a visible lie the
moment the merged content view claims to show the whole document in order. That is
ticket 36, and it is why this had to land first.

### Left for another ticket

`compare/locate.mjs` is browser-safe and holds both answers —
`anchorHeadingFor()` and `textFragmentUrl()`. The word-level diff of spec 32
phase 3 is a separate module and stays that way.

A text fragment is matched by the browser against what it **rendered**, so
`textFragmentUrl()` takes the literal text and never the tier-1 normalisation: a
folded curly quote is not on the page to be found. It is not yet known how often
the browser fails to find a string the extractor read. Watch it on the first
editor pass.

## Review follow-up, 2026-08-07

The two-axis review of `3251d91..HEAD` found nine things. Five were fixed in the
same session, three are recorded here and in the map, and one is the unmet
criterion above.

One review finding was itself wrong and is corrected in the map: commit `fe921ce`,
the logo, was reported as belonging to "phase 8 / ticket 38". Phase 8 is the design
system and belongs to ticket 35; phase 7 is the six stores and belongs to 38. No
decision in spec 32 asks for a logo at all.

**The field is `anchorHeading`, not `anchor`.** `CONTEXT.md` gives the term as
"anchor heading", and the one-word abbreviation collided with the `<a>` element,
which is what `anchor` means everywhere else in `crawl/` and in the links check.
`contract.mjs` changed first, then `locate.mjs`, `findings.mjs`, `text.mjs`,
`links.mjs`, `images.mjs`, `crawl/extract.mjs` and `Ledger.jsx`. The LCS pivot
variables in `diffRows()` were a third sense of the word and are now `exact`,
`pairedProd` and `pairedNew`. The reports were regenerated: 10,796 findings,
9,174 with a heading and 1,622 without, which is the same measurement as before.

**`sortKey()` no longer returns `Infinity`.** Two agree-nowhere rows subtracted to
`NaN` in the comparator. `NaN` is falsy, so the `||` chain fell through to the
tiebreakers and the order came out right by accident. The base is now one past the
last production element, which is what "the additions follow the whole of
production" means as a number. No behaviour changed — this was a defect in the
reason, not in the result.
