# 34 — Where is it? Position for every finding

**What to build:** an editor reading a finding knows where to look. A finding
that says `hier` or `carports` names the heading it sits under and offers a link
that opens the live page scrolled to that text — on both sides.

Today a finding carries no position at all: id, store, page, check, class, the
two strings, an occurrence count and a score. Grouping actively destroys
position. So a one-word finding sends the editor hunting through the page by eye,
and `occurrences: 6` means it was six different places.

**Blocked by:** [33](33-directional-text-classes.md) — the spec forbids moving
the same rows twice, and phase 1's measurement must be settled against an
unmoved baseline before anything else changes the comparison.

**Status:** resolved

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
- [x] Every finding row offers a link that scrolls the live page to its text, for
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

## Resolution

Built on branch `axis-a-compare-and-log`, commit `00116f2`. 225 tests green,
180 pages built.

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
- **`anchor` is out of the grouping key as well as out of the id.** The same
  rename under six headings is still one rename. The anchor names the first of
  them and `occurrences` says there are more. Putting it in the key would have
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

`compare/locate.mjs` is browser-safe and holds both answers — `anchorFor()` and
`textFragmentUrl()`. The word-level diff of spec 32 phase 3 is a separate module
and stays that way.

A text fragment is matched by the browser against what it **rendered**, so
`textFragmentUrl()` takes the literal text and never the tier-1 normalisation: a
folded curly quote is not on the page to be found. It is not yet known how often
the browser fails to find a string the extractor read. Watch it on the first
editor pass.
