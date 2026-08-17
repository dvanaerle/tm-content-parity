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

Status: resolved 2026-08-17 — all nine criteria built, and the ninth verified in the
running interface by the editor the same day. No defects found. **This one was closed
by a hands-on pass and not by a code read**, which matters here: the ticket has twice
been ticked in error from the source alone, and the one thing no test in it can measure
is whether the browser finds a string the extractor read.

Reopened on 2026-08-07 by the review of commit `3251d91..HEAD`. Eight of the nine
criteria hold. The deep-link one does not, and it was ticked in error. See
"What is not done" below.

> **Re-verified 2026-08-13 during a triage sweep of every open ticket, and still true.**
> The eight that hold are in the tree: `compare/locate.mjs:29` (`anchorHeadingFor`),
> `compare/locate.mjs:63` (`textFragmentUrl`), and the occurrence badge at
> `web/src/components/Annotations.jsx:69-84`. The ninth fails in two ways, both at
> `Annotations.jsx:47-57` — `Section` returns `null` when `anchorHeading` is falsy, so a
> row without one gets **no link at all**; and ~~where it does render, both `Locate` calls
> (`:52-53`) are handed the **same** heading string, so the new-site link is built from
> production's heading~~ — *fixed 2026-08-13, and stated too narrowly here; see "The dead
> deep link" below.* An agent taking this ticket builds the ninth criterion only.
> One thing has moved under it since: ticket 113 took `anchorHeading` out of part of the
> derivation (`web/src/lib/reports.mjs:101`) and ADR 0011 took it off the dashboard index
> (`web/src/lib/search.mjs:52`). The field still exists on the ledger row
> (`Ledger.jsx:356`) and in search, so the ninth criterion is still reachable — but check
> which surfaces still carry it before designing the fix.

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
      production and for the new site. **Closed 2026-08-17; see "Where is it, for
      every row" below.**
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

~~**Both deep links are built from the production heading.** `links.mjs` and
`images.mjs` pass `prodHeading(...)` for the finding, and `Section` then makes the
production url and the new-site url from that one string. On a page where the
heading itself changed, the new-site fragment cannot resolve, and it fails
silently.~~

> **Fixed 2026-08-13, and the diagnosis above was too narrow.** The rule was not
> "production's heading wins" but *the row held **one** heading and rendered **two**
> links*, so whichever side did not supply it got the dead one. `text.mjs` takes the
> heading from production **when there is a production side** and from the new site
> otherwise — so a `text-added` finding's **production** link was broken in exactly the
> same way, which this paragraph missed. See "The dead deep link" below.

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

## The dead deep link, 2026-08-13

One of the ninth criterion's three failures is closed. **The criterion is still open**,
and the failure that was already its stated blocker is still its blocker.

### What was wrong

A finding carried one `anchorHeading` and `Annotations.jsx:52-53` spent it on both
`Locate` calls. Reproduced against the real compare stage on a page whose heading was
reworded from `Kleuren en RAL` to `Kleuren en kleurkeuze`:

| finding | heading it held | the dead link |
|---|---|---|
| `copy` on the paragraph below | `Kleuren en RAL`, from production | **new-site** link |
| `text-added` under that heading | `Kleuren en kleurkeuze`, from the new site | **production** link |

A text fragment that matches nothing scrolls nowhere and raises no error, so a dead link
and a live one were indistinguishable until an editor clicked one.

### What was built

`Finding` gains `anchorHeadings: { production, new }` — the same section as **each side
words it** — set by all three producers from the `prodHeading`/`newHeading` pair each
already computed. `anchorHeading` is untouched: still production-preferred, still the
section's displayed name, still what a mute keys on. Both stay out of the id and the
grouping key, so the Resolution section's rule above is unchanged.

**A decision this needed, which the ticket had not taken.** A side the finding is not on
gets `null` and offers **no link**: a `missing-link` has no position on the new site to
scroll to, so the alternative was a link to the wrong place. This narrows user story 29's
*"for both production and the new site"* for one-sided findings, and it is recorded here
rather than left in the code — the story asks to see a difference *in situ on both*, and
a finding that exists on one side has no *both*.

### Still not done

- **The 1,622 rows with no anchor heading still offer no link at all.** `Section` returns
  `null` on a falsy heading, unchanged. This is the decision the ticket defers to a ticket
  of its own, and nothing here touches it.
- **Where a link renders on Links, Afbeeldingen and Taken it still points at the heading,
  not at the finding.** Unchanged.

### Two notes for whoever ships this

- **The reports must be regenerated before this is deployed.** `Section` now reads
  `anchorHeadings`, which exists only in a fresh compare run. Against the report JSON on
  disk the field is `undefined`, `Locate` gets falsy text, and **both** links vanish while
  the row still renders `onder “…”` — the same silent failure class as the bug itself. A
  fallback to `anchorHeading` was rejected: it would quietly reinstate the dead link.
- **`links.mjs:140` has an unreachable branch.** `production: counterpart ? … : null` —
  `prodState` is only set when `counterpart` exists and the enclosing `if` requires
  `prodState?.status === 200`, so no counterpart means no finding. Confirmed by deleting
  the guard and running the suite green. Left in place for review rather than refactored.

### Tests

Seven, at the seams the ticket already uses. Two for the render (`Section` mounted, each
link checked against the text of the page it opens) and five at `compareLinks()` /
`compareImages()` for the per-side headings. The render tests are browser tests on purpose:
`locate.mjs` builds a correct fragment from whatever it is handed, so every unit test of it
passed while the call site was wrong — ticket 31's failure mode exactly. Suite: 679 green.

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

## Where is it, for every row — 2026-08-17

The ninth criterion is closed. It stood open on a decision the ticket had deferred to
"a ticket of its own" that nobody ever wrote, and the map recorded it as one of three
items wanting a human. The decision was taken with the user before any code: **a
finding with no anchor heading offers the page itself**, and a link aims at the
finding rather than at its section wherever the finding has words on the page.

### The root cause was one value meaning two things

`anchorHeadings.production === null` said *the finding is not on production* in
`contract.mjs` and *the position precedes every heading* in `anchorHeadingFor()`. The
second reading was served the first's answer, so a finding above its page's first
heading was treated as a finding that does not exist on that side — and lost both
links. That is why 1,622 rows rendered nothing, and no amount of work in `locate.mjs`
could have fixed it: the field could not express the case.

`anchorHeadings` is therefore replaced by **`locations`**, a pair of
`{ heading, text } | null`. **Absence is the side entry; precision is its fields.** A
side the finding is not on is `null` and offers no link, which keeps the 2026-08-13
decision intact. A side it is on always has a location, even when both fields are
null.

### The link aims three ways, best first

`locationUrl()` in `compare/locate.mjs` holds the order, so the compare stage and the
screen cannot disagree about it:

| | aims at | why |
|---|---|---|
| text findings | **its own words**, literal `raw` | nearest possible; the words are on the page |
| link findings | **the anchor wording**, `link.text` | a target is a folded key, and no browser matches that |
| image findings | the **section heading** | a basename and an `alt` are not rendered words |
| no heading either | the **bare page url** | it is in the opening block by definition, and a bare url is never a dead one |

That closes the second unmet point as well: Links no longer points at the heading. Only
Images still does, and that is now recorded as the honest answer rather than a gap —
`text` is null there on purpose, because an image finding has nothing on the page to
match.

`Section` no longer gates the links on the heading. The section **name** renders when
there is a section to name, and each link renders when that side has a location. They
were one thing and are two.

### Measured, on the regenerated reports

816 pages, 722 comparable, 41,049 findings.

| | |
|---|---|
| rows offering **no link at all**, before | **1,522** |
| rows offering no link at all, now | **368** |
| links on the page, before → now | 48,010 → **49,460** |
| sides aimed at the finding's own words | 36,761 |
| sides aimed at the section heading | 12,154 |
| sides aimed at the bare page | 545 |
| sides with no link, because the finding is not there | 32,638 |

**The 368 that remain are all `meta/no-declared-alternate`**, and they are correct.
A meta finding is about the `<head>`; it renders in `MetaTable`, which never called
`Section`, and there is no position in the body to scroll to. Every row that has a
position on the page now offers a link.

### Notes for whoever ships this

- **The reports were regenerated** as part of this change, and the build was run: 823
  pages. The trap the previous section names still applies to anyone rebuilding from an
  older extract — `Section` reads `locations`, and against a stale report both links
  vanish silently. A fallback to `anchorHeading` is still refused, and now for a second
  reason: it could not tell "not on this side" from "above the first heading" either,
  which is the bug this replaced.
- ~~**`links.mjs`'s unreachable branch is gone** with the rewrite of that call site.~~
  **This was false, and the review of this change caught it.** `links.mjs:171` still
  reads `production: counterpart ? … : null` and `:164` still reads
  `prod: counterpart?.key ?? null`, both under an `if` that already requires
  `counterpart`. The branch is untouched, and it stays where the 2026-08-13 note left
  it: recorded for review rather than refactored. Nothing here depended on the claim —
  what it cost was a true sentence in the record, which is the thing this file is for.
- The suite is **902 green**, including the three browser tests on `Section`. The new
  one mounts a finding with no heading and asserts two links come back — it fails with
  zero links against the previous component, which is the defect it exists to catch.

### One defect this change introduced, found by its own review

**`Section`'s guard was written on the two elements and not on the two urls.** A
`<Locate>` element is truthy whether or not it goes on to render an anchor, so
`if (!anchorHeading && !production && !next) return null` could never fire on a finding
row — `Ledger.jsx` always passes `sides`. Against a report predating `locations` the row
therefore shipped an **empty strip**: a `<div>` with no section and no links in it. That
is the same silent failure class as the bug this ticket is about, one layer up — something
on the row that looks like an answer and is not one.

`Section` now resolves both urls with `locationUrl()` and branches on those, and `Locate`
takes a finished `href` rather than the pieces to build one. That is the honest shape
anyway: a caller has to be able to ask *is there a url at all* before it lays anything
out, and one that could only find out by rendering would draw the frame first. A browser
test mounts the stale shape and asserts the row renders nothing.

### The editor pass, 2026-08-17

Walked in the running interface on `nl/bamboe-vlonder` and `nl/(home)` — the two pages
that carry every case between them: bare-page links, link findings aimed at their anchor
wording, image findings aimed at their section, and one-sided rows. **No defects found.**

The fragment match rate is the thing that pass was for, and it is now a **watch** rather
than an open question: nothing was seen failing, and the failure mode is silent, so
absence of a report is weaker evidence here than usual. If arrows start opening pages
without scrolling, this is the ticket to reopen — and the first place to look is a string
where the extractor and the browser disagree about a character, a curly quote or an NBSP
or a hyphen.

### Still deferred, and now smaller

Nothing here changes **how often a text fragment actually matches**. The browser
matches against what it rendered, and `textFragmentUrl()` deliberately takes the
literal text and never the tier-1 normalisation. 36,761 sides now aim at their own
words rather than at a heading, so the exposure is larger than it was — but a fragment
that fails to match now degrades to a page that opens at the top rather than to a link
that was never there. Watch it on the first editor pass.
