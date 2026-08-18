# CONTEXT — the words this repo uses

Written in ASD-STE100 Simplified Technical English, spelled in UK English. Each word
below has one meaning in the code, in the interface and in the tickets. The decisions
behind them are in `.scratch/content-parity-log/map.md`.

**The interface speaks this list's own language.** It is English (UK) on all six stores
since 2026-08-13 (ADR 0014), so a label and its entry here are the same words. Each Dutch
label the interface had is kept below, struck and dated, because a ticket written before
that day names it.

## The two sites

- **Production** — the live Tuinmaximaal site. It is the reference. Each
  difference is a defect on the new site.
- **New site** — the Hyva site on `*.intern.systems`, not yet released. It is
  the cheap side to change.

These two are the **only** pair of words for the two sides, everywhere: in the interface,
in a column heading, in a ticket and in a comment. *Prod*, *Current*, *Old*, *New*,
*Replacement* and *Staging* are refused. They are not synonyms an editor can learn from —
*old* and *new* say that one is a later version of the other, which is what the log is
measuring and never what it may assume, and *staging* names a thing this repo does not
have. Written in **sentence case** and never in capitals: `PRODUCTION` is the same word
shouted, and a column heading is the one place capitals earn their keep.

## Pages and stores

- **Store** — one of the six Magento store views: `nl`, `be`, `be_fr`, `de`,
  `fr`, `uk`. The `be` and `be_fr` stores have the same host.
- **Page** — one content page in one or more stores. A page that production
  declares in Dutch is identified by its **NL url key**. A page that production
  declares only in another language has no NL url key, and it is identified by
  its store and its path. More than half of the pages are of the second kind.
- **Store page** — one page in one store. It has a production URL and a new-site
  URL. The new-site URL is a host swap of the production URL.
- **Store-page pair** — the unit of a parity comparison: production and the new
  site, for one store page.
- **Anchored page** — a page that production declares with an `nl-NL` hreflang
  alternate. It has an NL url key, so it can go beside the other stores.
- **Unanchored page** — a page with no `nl-NL` alternate. It is a page of its
  store, and it is comparable on axis A, because axis A needs no NL page. It is
  absent from axis B.
- **No NL page** and **no declared alternate** are two different things. The
  first says the store has content that NL does not have. The second says
  production does not say which NL page is the counterpart. The log must not name
  the second as the first.
- **Seed row** — one page in the seed list, with one **cell** for each of the six
  stores.
- **Cell** — one store page in a seed row, or `null`. A null cell says that the
  store does not have the page. A cell of a page that answers 404 is a different
  absence, and it is not null.
- **Provenance** — where a cell came from, and which clause of the rule admitted
  it: `sitemap-daily`, `sitemap-low-alternates`, or `carried-over` for the 49
  store pages that no sitemap declares. The NL store has cells that no sitemap
  declares, so the provenance is part of the data and not a comment. The
  hand-seeded store home page is retired: all six store roots are in the
  sitemaps, measured on 2026-08-10.
- **Content page** and **product page** — production distinguishes them in the
  sitemap only by the count of hreflang alternates and by `changefreq`. A product
  page carries all six alternates. See ticket 50 for the rule.
- **Application page** — a page whose content boundary holds a mounted JavaScript
  application instead of content. It has no content unit, because its text is
  transient interface state and not something an editor writes. An application
  page is outside the log by definition, and it is named in a committed list with
  its reason. It is not a one-sided page: a one-sided page waits for somebody to
  rebuild or retire it, while an application page waits for nothing.
- **Not checked** — the list of pages that the log found and does not compare,
  each with the reason. A page on it says why; it is never silently absent, and
  it is counted in the store total. It has three kinds, because a reader acts on
  a decision and on an accident differently (ticket 56):
  - **Dropped by rule** — the seed rule never admitted the URL, so it never
    became a store page. The rule is a **name** in `data/10-store-seeds.json` and
    its words are in `shared/drop-rules.mjs`.
  - **Excluded page** — a store page whose key is in `shared/excluded-pages.mjs`.
    The crawler fetches nothing for it. An application page is of this kind.
  - **Not crawled** — the seed list has the page on both sides and no report
    exists. Nothing decided it; the fetch failed. It is the one kind that is not
    a decision, and the next crawl can still bring it in.

  Do not say "not compared" for any of these. **Uncompared** is taken, and it is
  a row inside a page and not a page (see below).

## Extraction

- **Content boundary** — the `<main>` element. Content units outside `<main>`
  are chrome, and the log ignores them. If a page has no `<main>`, the
  extraction uses `<body>` with the chrome selector list, and it says so.
- **Content unit** — one block that an editor edits. The blocks are the tag list
  in ticket 02 (`h1-h6, p, li, blockquote, dt, dd, figcaption, th, td`), and an
  `a` or a `button` that stands alone. A unit folds the words of an `a` or a
  `button` inside it, because nobody edits a link apart from its sentence. A
  nested **block** still breaks a unit: an `li` gives way to a `p` inside it.
  See `docs/adr/0002-content-unit-is-the-editable-block.md`.
- **Chrome** — template furniture outside the content boundary. It is not
  editor work on this page, and the log never compares it.
- **Non-editorial region** — a region inside the content boundary whose text the
  catalogue or an extension makes. Nobody writes it, so a difference in it is not
  editor work. A **product grid** is one.
- **Legacy-only region** — a region inside the content boundary that an editor
  wrote and that the new site will not get. It is a scope decision, in the same
  manner as a legacy-only page. The promo banner is one.
- Both kinds of region are excluded at extraction and named in a committed list
  with the reason, so an excluded region says why. The log is blind to what
  changes inside one, and that is correct: neither kind can make editor work.
  See `docs/adr/0003-regions-are-excluded-at-extraction.md`.
- **Canonical viewport** — the one width the log compares a page at: **desktop, 1280
  pixels**. Production sends the desktop and the mobile version of some blocks in the
  same HTML, and the extraction has no computed style, so it must choose. The copy a
  reader at that width never sees is dropped at extraction, by a committed list of
  markup conventions that names each one's framework and the pages it was measured
  on. Nothing renders here, so the number is not a window size: it is which
  breakpoint **band** a hiding class must cover to count. A class name is not
  evidence of a band — two frameworks on this site use the token `lg` for different
  widths — so a convention quotes the band from the stylesheet. A consequence to
  state plainly: the log does not check the mobile version of a page. See
  `docs/adr/0020-the-log-reads-one-viewport.md`.
- **Raw text** — the text as the page sends it.
- **Normalised text** — the raw text after tier-1 normalisation only. Letter
  case and trailing punctuation stay. If they do not stay, the `casing` finding
  cannot exist.

One word is retired. **"Text element"** named an HTML element, and it carried the
rule that a node holding another node from the list is not one. The unit is not an
element any more: it folds the links inside it. Both the word and the rule are gone.

## Comparison

- **Tier 1** — invisible equivalence: every Unicode space, curly quotation marks,
  dashes, collapsed whitespace, and HTML entities in three forms: named,
  decimal and hexadecimal. The soft hyphen and the three zero-width characters
  fold to nothing. A browser draws nothing for them. Fold silently.
- **Tier 2** — visible difference: letter case, trailing punctuation. Report as
  a `casing` finding.
- **Check** — a family of comparisons: `text`, `links`, `images`, `meta`.
- **Class** — why the two sides are different. The class vocabulary is closed. See
  `compare/contract.mjs`. It was also the mute key until the mute was withdrawn
  (ADR 0011); the class is now the only axis and keys nothing.
- **Label** — what an editor reads for a class. **A class has a label, and an editor never
  sees a key.** `copy` is *Copy changed*; `image-missing` is *Image missing*. It is in
  sentence case, it is unique, and it is never the key itself: a label that reads `copy` has
  named nothing. It lives beside `meaning` in
  `compare/vocabulary.mjs` — what a class *is* does not depend on who draws it — and a
  class arriving without one fails the test suite (ADR 0019). The **key** is unchanged and
  unchangeable: it makes the finding id, so renaming one would expire every override in the
  database. Two names for one thing, and only one of them is on the screen.
- **Visibility** — what a class is for. One of three words, and each class has
  exactly one. **Work** is migration work: it counts. **Information** is a
  difference an editor may want to read: it is rendered and it does not count. Said
  exactly, it is **a finding you can link to and cannot decide** — it keeps its id,
  because somebody may have to be sent to it, and it offers no override control, because
  a dismissal says "these two exact strings are acceptable" and nothing is being asked.
  **Decidable** is that half said as one word. The code says `canDecide` for the rule and
  `decidable` for the field a row carries, and they are the same word in the two shapes it
  is needed in. It is what the override control and the context marker both read, and it
  asks the **visibility** and never a class name — so a class re-triaged in
  `vocabulary.mjs` needs no second edit. A `diagnostic` finding is decidable: what a rule
  saw is behind *Show diagnostics*, and it keeps the control it
  has.
  **Diagnostic** tells the author of a rule what the rule saw: it stays behind the
  diagnostics control. Visibility is not a second axis; it replaced a shown-or-hidden
  boolean, and the class stays the only axis. "Excluded from comparison" is not a
  visibility: an excluded region leaves at extraction and never reaches a class.
  See `docs/adr/0005-class-visibility-is-one-enum.md`.
- **Finding** — one actionable difference. The tool never makes a finding that
  it then hides. A row that is equal after tier-1 normalisation is not a
  finding. Read "hides" strictly: it means *never renders*. A finding that is
  **collapsed** into a context marker is not hidden, because the marker says it is there
  and it expands.
- **Occurrence count** — how many times the same difference is on the page. It
  is not part of the finding id.
- **Repeat** — every finding in **one store, or in the two stores of one language
  block**, with the same class, the same two texts and the same detail. It is the unit
  of a bulk decision, and it is not a thing the data holds: it is a grouping the
  interface makes. ~~A repeat never crosses a store, because the stores translate the
  text, so the same defect in six stores is six repeats and not one.~~ **Amended
  2026-08-17, ticket 03.** The claim was right and its stated reason was not: inside a
  **language block** the two stores do not translate the text between them, because they
  share a language. So a repeat crosses a store exactly there and nowhere else — `{nl, be}`
  and `{be_fr, fr}` — and the same defect in six stores is **four** repeats and not six.
  `de` and `uk` are each alone in their language and a repeat on them is what it was.
  The block is **derived** from the hreflang codes, never a hand-written list, and it is
  still not an axis: what crosses is a judgement about an ordinary axis-A finding, and a
  block difference stays display-only and uncounted. Nothing is keyed on a block, and no
  scope, column or finding id changed — the **selection** widened and the table still
  gains N rows. A dismissal still expires **per store**, because the store is a term of
  the finding id. Measured: 11,162 of 22,048 work findings sit in a block-spanning repeat,
  and the distinct decisions over the six stores fall 16,881 → 12,722.
  See `docs/adr/0018-a-judgement-may-cross-a-language-block.md`.
  A repeat is measured in **pages**, and there is no second number beside it. The
  page is a term of the finding id, so one page carries at most one finding of one
  repeat — measured over the corpus, 25,657 repeats and no exception. "How many
  findings" and "how many pages" are one number, and printing both would be the
  doubled figure this list exists to stop. **Occurrences** is the number that does
  differ, and it is a different question: the same difference more than once on a
  single page.
- **Detail** — what changed, when the two sides of text are equal. `h2 → h3` on a
  `heading-level` or a `tag-changed` finding, `p + p → p` or `p → 4×p` on a `regrouped` one,
  and null on every other class. It is
  part of the finding id, because without it two different demotions of the same
  words are one finding.
- **Difference** — any place the two sides do not agree. Wider than a finding:
  every finding is a difference, and a difference the content team has no power
  to change is not a finding. A canonical URL the store config generates is a
  difference and never a finding.
- **Display-only difference** — a difference the log renders but does not count.
  It has no id, no override and no place in a bar, and it is framed so that it
  cannot be read as actionable. The `<head>` panel is made of these.
- **Direction** — which side a one-sided difference is missing from. Content
  production has and the new site lost is a defect; content the new site invented
  is usually not. Every one-sided check names the two directions as two classes,
  and hides the invented side. It is a field on the class (`lost` or `added`), so
  the default and the colour both follow from it.
- **Regrouped** — the same words on both sides, divided into blocks differently. One
  production block that the new site sends as several, or several that it sends as one.
  The test is **total coverage**, and not containment: one side's block is exactly the
  other side's run of blocks, with nothing left over. "These words appear over there
  somewhere" is not the claim; "these blocks **are** that block" is. A side that
  regrouped **and** added a sentence therefore stays `copy`, because the remainder
  answers to no block, and a rule that swallowed it would hide invented content — the one
  failure this list exists to stop.
  A run is **adjacent and uninterrupted**, and the arity is one-to-many or many-to-one and
  never many-to-many: a reader can verify that two blocks are one block at a glance, and
  cannot verify that three are two. Each member of a run is a block that **nothing else
  claims**, or the block's own counterpart. A member the other side already answers for is
  what separates a regrouping from a page somebody rewrote.
  It has **no direction**: nothing is lost and nothing is added, so the arity is a fact
  the reader sees and not a class. Tags are no part of the test, because a change of
  structure is the thing itself; they are the **detail**, in the manner of
  `heading-level`: `p + p → p`, `p → h2 + 4×li`. It carries **no score**: a score on an
  exact match is decoration, and the score belongs to `copy`.
  It is not **restructured**, which is a pair whose text differs and whose tag differs.
  It is the false `text-missing` and the false `copy` that ADR 0002 accepted while
  many-to-one matching waited for a measurement.
  It is **built in both directions**, on 2026-08-18: ticket 116 landed the many-to-one half
  — several production blocks the new site sends as one — and ticket 120 the one-to-many, which
  is four times the volume and is mostly the new site rebuilding a paragraph as a heading and
  a list. `compare/vocabulary.mjs` holds 32 classes and `regrouped` is the thirty-second. The
  Within a page the **merge resolves first**, so a block the merge claimed is not on a split's
  row: no block is ever on two. The wording an editor reads is the same either way: the label is *Same
  text, divided differently*, which is the division and never the merge. `untranslated` is
  still decided and unbuilt.
- **Anchor heading** — the nearest heading before an element in document order.
  It is how a finding says where it is on the page, and it is null for an element
  that precedes every heading. The code says `anchorHeading` in full, never
  `anchor`: on its own that word is the `<a>` element, which the extractor and the
  links check both talk about. Two meanings for one word is what this list exists
  to stop.
- **Location** — where a finding is on **one** side, as `{ heading, text }`, and what
  its deep link aims at: its own words where it has words on the page, the anchor
  heading where it does not, the bare page where it has neither. A finding carries a
  pair of them as `locations`, and the side it is not on is `null` — which is the whole
  point of the shape. A bare pair of headings could not say the difference between *not
  on this side* and *above the first heading*, so it gave the second the first's answer
  and 1,522 rows offered no link at all. **Absence is the side entry; precision is its
  fields.** It is not a *position*: that word is the document-order index a location is
  derived from.

## The interface

- **Content view** — the whole store page in document order, production and the new
  site side by side, with a row for each content unit. It is the spine of the log,
  because most findings are one-sided and the question they ask is where the text
  belongs, which only document order answers. The word diff is a cell renderer
  inside it and not the interface. Markdown is an export beside it and never the
  spine, because Markdown flattens the element identity the finding id needs.
  See `docs/adr/0006-the-content-view-is-the-spine.md`.
- **Context marker** — one row that stands for a run of rows holding **no open work**
  and says how many blocks it holds. It expands. The content view shows the rows that
  need a decision by default and collapses the rest into markers, so position survives
  and nobody scrolls past agreement or past their own finished work. Three things
  collapse: a row whose texts agree, a row whose finding is **Closed**, and a row that
  is not **decidable**. A **contradicted** row does not, because it is Needs attention.
  Equal text is therefore not the rule — a row can agree about every word and carry an
  open `copy` or `casing` finding, and that row stays (ticket 48). The third rule is
  ticket 86's: a finding you can link to and cannot decide holds no work, whatever its
  words do. `heading-level` was the example here until 2026-08-13, when 86 made it
  `information` and moved it from the second side of that sentence to the third.
  In this state every visible row is work, so the
  **row tint carries no signal and it goes**; the class pill carries the class. The
  retired *Diff* tab is what happens without the marker and without that rule.
  **Built on 2026-08-14 by ticket 79 and widened the same day by ticket 48**, which is
  what makes the three rules above the whole of it. The predicate is `collapses()` in
  `web/src/lib/view.mjs`; 79 shipped its first term only, deliberately, because
  narrowing collapses less and is the safe direction to be wrong in. The Closed term
  reads ticket 80's `bucketOf()` and never a second list of which states are closed.
  The **set is taken when the page opens** and held: a tick that collapsed its own row
  would move a 168-row page under the editor at the moment they act on it, so the row
  they ticked stays where they left it and joins its run the next time the page opens.
  A marker holding closed work says so — *4 blocks with no open work* against *3
  agreeing blocks* — and a page that is finished says *nothing left to do* rather than
  claiming its blocks agree.
  Collapsing is **not a view mode**: it is one order with a collapse in it. Nothing is
  reordered and nothing is filtered away, which is the whole distinction — and since
  ticket 37 was parked there is nothing else that says what a mode may do to document
  order, so do not read the marker as an answer to that question.
  **The interface word is *agree*.** A marker says *3 agreeing blocks*, the control says
  *Show agreeing blocks*, the status cell of such a row says *agrees*, and a page with no
  difference on it says every block agrees with production. `equal` stays the word in the
  data — it is `ContentRow.equal`, and it is `prod.norm === next.norm` and nothing wider.
  Do not write *unchanged* for either: that word is spent below on a finding id that
  survives a re-measure, and the marker, the cell and that sentence were three words for
  one thing until 2026-08-14.
- **Clamp** — *retired 2026-08-14, ticket 68, which is `wontfix` for the clamp and stands
  for everything else in it.* A row used to show four lines of each side with a control
  that opened it. **A row now shows its block whole**, and no control shortens it: most
  blocks are shorter than the clamp was, and a reader deciding on a long paragraph wants
  the paragraph and not a window onto its first change. Do not reintroduce the word for a
  shortened row.
- **Uncompared** — a two-sided row that is too large for a word comparison. Both
  versions are shown in full, and neither one is coloured. It is a budget and not a
  judgement: the log says that the comparison did not run. It never says that somebody
  rewrote the text, because size is not similarity. The class stays `copy` and the
  score stays with it. "Uncompared" is not a class: the class vocabulary stays closed.
  See `docs/adr/0009-the-word-diff-runs-in-the-browser.md`.
- **Filter** — a narrowing of what is on screen. It moves no bar, no
  denominator and no count. The content view narrows a page to a class and the
  dashboard narrows the page list to the same class; both say so with an amber strip
  for as long as the filter is on.
  There are three kinds and the strip names **all of them in one sentence**, under one
  *Clear filter*: the **classes**, the **priorities** (ticket 83) and the **page scope**
  (ticket 104). Class was the only kind until the other two arrived, and a strip that
  enumerates some of what is narrowing the list is worse than no strip. Each kind also
  wears its own control beside the class pills — a pressed pill, a scope chip — and the
  control is a **reading** of the state and never a second copy of it.
  A **search is narrowed by it too** (ticket 102): the classes are the filter and the
  term is a search, so a term composes with a filter rather than replacing one, and the
  strip stays up over the result. *Include closed* (~~*Inclusief afgesloten*~~,
  2026-08-13) is not a filter — it says what
  counts as a result and not what is on screen — and it is absent from the strip. Neither
  is the **diagnostics control**, for the stronger version of the same reason: it changes what
  counts as a finding at all, which is why it survives a *Clear filter* and a scope does
  not.
  On the dashboard the filter is part of the **screen** and therefore lives in the URL
  (ticket 109), so Back restores it and a copied link carries it. On a page it stays
  session-only: a page filter is a pass an editor is making, not a place to return to.
  Neither of them has ever moved a number and this does not change that.
- **Page scope** — a search narrowed to the pages whose key holds a word: `/downloads` is
  the repeats on that page, and `/downloads knop` is the repeats on that page whose words
  hold *knop*. The slash is a scope marker **in first position only**; anywhere else it is
  an ordinary character, because a page key can hold one — `faq/productinformatie` is a key
  and `/faq/productinformatie` is that key scoped. The key is matched by **substring**, as
  every other field in this search is, which is what lets `/faq` reach the family, `/home`
  reach `(home)` and `/pergola` reach `(be)pergola` with no special case. A scope therefore
  often matches several pages, and a result says which ones, as a header over the one
  merged list.
  It **narrows the corpus a search runs over**, and it opens nothing: a page name in a
  result still opens the whole content view, never a fragment of it, and a bare scope lists
  that page's **repeats** and is not a second reading of the page. It moves no count, no bar
  and no denominator, in the same manner as a **filter** and as the term itself. A scope
  narrows the **language block** since ticket 05, because that is the corpus the search runs
  over: a scope narrows what is searched, and what is searched is this store's index and its
  sibling's. So `/pergola` typed on `nl` names `be`'s page too, each line saying which store
  it is on, and a page of the sibling is never reported as *no such page*. It is still not
  an all-stores scope — there is no all-stores surface to scope across, and a block is two
  stores. What is **offered** under the box stays this store's keys: a scope is a substring
  and cannot name a store, and the two stores of a block share nearly every key, so a list
  over both would be the same strings twice.
  It **is** a filter and it says so like one (ticket 104): a chip beside the class pills,
  named in the amber strip in one sentence with them, and cleared by the same *Clear
  filter*. The search box stays the source of truth and the chip is a reading of it, so the
  two cannot disagree. Clearing rewrites the box — the scope is a fragment of an input, and
  an editor clearing the filters is asking for the whole store back — but only the scope:
  the words after it are a search and survive. It lives in the URL because it lives inside
  the query, which is where the dashboard's other filters live too.
  It narrows **both halves** of the answer (ticket 104): the findings from the snapshot and
  the notes from the log, each still its own block with its own freshness. A note is narrowed
  by the page it was **written on** — the event carries it — and not by the page a finding of
  it sits on, and it is therefore the only thing search can truthfully say about a
  **one-sided** page, which has no findings and can never have any. A bare scope answers the
  notes half with every note on the page; an empty box is still nothing asked.
  It is **offered** and not only accepted (ticket 104): a leading slash puts the store's page
  keys under the box, narrowed as the key is typed by the same substring rule the scope
  matches by, walked with the arrow keys and put down with Escape. The keys are not
  guessable — `(home)`, `(be)pergola`, `faq/productinformatie` — so an unofferable scope is a
  feature only a reader of the source can use. The offer is the **whole** page list and never
  the indexed half, because a clean page has no index entry and a one-sided page can never
  have one, and those are most of what a spot-check is for; a one-sided key is offered wearing
  the aside's own words. It comes from the list the store page loaded, so it answers the first
  keystroke, before the index is fetched. Choosing is never required and changes nothing: it
  writes the same box a hand-typed scope writes, and a key that is already whole has nothing
  left to offer, which is what closes the list while the words after it are typed.
  It is also **handed over by the page it is about** (ticket 104): a row in the pages table
  and a row of the one-sided aside each carry a control that puts that page's key in the box,
  keeping any words already typed. That is the page-first path — from *this page* to *what is
  on this page* — and it is a click and never the default view, because the queue is where an
  editor lands. It is a **second control beside the page link and never the link's own
  meaning**: the link opens the whole content view, which ADR 0006 is the reason for. It
  writes the query and nothing else, so a class filter already on stays on and the result is
  what both narrowings agree on.
  See `docs/adr/0016-a-leading-slash-is-a-page-scope.md`, which records why the reasoning it
  overturns — a key is opaque and nothing splits on a slash — holds for everywhere but first
  position, and why this is not the first step toward a query language.
- **Which kind of nothing** — a scope that returns no row says **which** empty answer it is,
  per page and never over all of them (ticket 104). A scope is a substring and often reaches
  a family whose members differ, and one verdict over that is false about most of it. There
  are five, decided as a value by `explainScope()` in `web/src/lib/search.mjs` and only
  rendered by the component:
  **no such page** (the scope is in no key — a typo, and it is a state of the answer and not
  of a page), **one-sided** (it exists and one side did not answer, said in the aside's own
  `skipReason` and linked to it, because that aside had the words first), **clean**
  (compared, and no `work` finding on it), **no open work** (it holds differences and every
  one of them is closed) and **no match** (it holds differences and the second term is on
  none of them). A sixth value, **matched**, is the page that answered; it is not a kind of
  nothing and it draws no sentence, because the rows below are what it has to say.
  *Clean* and *no open work* are two and not one, for the reason the **context marker**
  draws *3 agreeing blocks* apart from *nothing left to do*: a page nothing was ever wrong
  with and a page somebody finished are different answers.
  The kinds are read off what the **term** matched, before the class pills narrow it. A
  filter moves no bar, no denominator and no count, and it moves no verdict either — the
  amber strip says what the classes cut, and this says what the term found.
- **Screen** — everything a dashboard is *drawing*: which of the two views is on, the
  sort, the search term, the class pills and *include closed*. It lives in the
  query string, so Back returns to it and it can be sent to a colleague; only what
  differs from the default is written, so a query means somebody chose something. It is
  what is drawn and never what a number means — see **Filter**. **Which group is open
  is not part of it**, for the reason **Class group** gives: that is session state, and
  a URL that pinned it would make *clear filter* and the address bar disagree about
  what a filter is.
- **Landing** — arriving at one difference because a link named it. A page link from
  the dashboard carries the **finding id**, and the page opens the tab that finding
  lives on, opens its row, marks it and scrolls to it. A landing is **not** a filter and
  removes nothing: the rows around it stay in document order, which is the whole reason
  ADR 0006 keeps the content view whole. A finding id is a term of the text, so a link
  outlives the finding it names, and a page reached by a stale one says so — as does one
  naming a finding no tab draws, which is the `meta` check: Meta is display only.
  The tab and *Show diagnostics* are **borrowed**, each released on its own the
  moment the reader touches that control. Taking one back is not taking the other back:
  switching tabs must not switch off the toggle that was drawing the landed row.
- **Dashboard** — one store's work on one screen, at `/<store>/`. It carries only
  that store's summaries and only that store's progress numbers. There is no
  all-stores dashboard: a store is the unit an editor is responsible for.
  It holds **two views over one derivation**, and one filter serves both.
  **Repeats** (~~*Verschillen*~~, 2026-08-13) is the store's repeats in **class groups**,
  worst-first by pages inside each one, and it answers *what do I decide next*; opening a
  row lists its pages, and a page name opens the whole content view for that page and
  never a fragment of it. The Dutch label named the wider word: a **difference** is wider
  than a finding and the view lists **repeats**, so this is a correction and not a
  translation.
  Since ticket 03 a row here may be a repeat **spanning this store's language block**, so
  its pages say which store each is on and a press writes in both. The list is then over
  the **block** and holds three kinds of row: spanning, this store's alone, and the
  sibling's alone — the two dashboards of a block mirror one list, which is what makes a
  decision on either of them the same decision. So the count beside the list names the
  block. That is still not an all-stores view: a block is two stores, it is derived, and
  the same trade ADR 0017 made for the block panel is the one made here.
  The store's **numbers are untouched** by it: the bar, the chips, the roll-up and *Pages*
  are built from this store's pages alone, as they always were.
  The **search** is half of one and half of the other since ticket 05. Its **findings** half
  reaches the block — it scans this store's search index and the sibling's, so a searched row
  is the same row the untouched list holds, and a press armed off one writes in both stores.
  Its **notes** half stays per store: the log reaching a search is narrowed before it leaves
  the hook, and a search on `nl` never answers with a note written on a `be` page. That split
  is ADR 0018's and ADR 0021 is where it is written down. Neither half moves a number.
  **Pages** (~~*Pagina's*~~, 2026-08-13) is the store's pages, worst-first, and it answers
  *which page do I open next*. There is no all-stores repeat view, for the reason
  there is no all-stores dashboard.
- **Class group** — the repeats of one class in *Repeats*, under a label carrying
  the class and how many repeats it holds. The groups are in the vocabulary's order
  and never in the counts' order, because a group that moves position as the work is
  done is a group nobody can learn where to look for. A `work` class with no repeats is
  a group that says so: "nothing wrong here" and "this class does not exist" are two
  different answers. **Opening a group is not a filter**: it changes what is drawn and
  never what is included, so it is session state, it never enters the amber strip and
  *clear filter* does not touch it. The class pills stay the one filter, and with a
  pill on only the selected groups exist, so the two controls cannot tell different
  stories.
  A group holds its own **rendering budget**, so *show the next 100*
  (~~*volgende 100*~~, 2026-08-13) pages the group it
  sits in. Do **not** call it a *section*: that word named the mute scope, a run of one
  page under an anchor heading, and though the mute is withdrawn (ADR 0011) the word stays
  taken — it is what an anchor heading names, and ticket 100's own wording is refused here
  for it.
- **Doorway** — the root, `/`. It lists the stores and waits. It is not a dashboard
  and it holds no numbers, because there is no all-stores dashboard for it to be.
- **Store switcher** — the six store ids in the shell header, each a link to that
  store's dashboard. It never goes to the same page in another store: the stores
  translate the category url keys, so that page often does not exist.
- **Diagnostics control** — *Show diagnostics* (~~*Show noise*~~, 2026-08-18;
  ~~*Ruis tonen*~~, 2026-08-13), the control that shows the classes whose visibility is
  `diagnostic`. The control and the thing it reveals are now **one word**: *noise* named the
  same set in a second vocabulary, and it also said the log's own judgement of what a rule
  saw. **Diagnostics** means *what a rule saw* and never the health of the build, the crawl
  or the log; a sentence using it the other way is the collision the rename closed. The word
  is refused by the stopword guard, so the rename cannot rot.
  It is **not** a filter: it belongs to the whole log, and *Clear filter*
  (~~*filter wissen*~~, 2026-08-13) does not clear it. An editor who asked to see what a rule
  saw did not ask a question about classes. It had a second job until ADR 0011 — it also
  showed muted findings, and it was called *Ruis en gedempt tonen* — and a diagnostic class
  is not a judgement, so the job that is left is the one it was named for.

Four tab names are retired, and the content view is what replaced the first three.
**"Diff"** showed the differing rows only, so once every row was tinted the tint said
nothing. **"Content"** showed two blocks of flat Markdown and no diff. **"Outline"**
was production's elements indented by heading level, which the content view contains;
what is left of it is a heading jump-list beside the rows.

The four tabs a page has are **Text**, **Links**, **Images** and **Meta**
(~~*Inhoud*, *Afbeeldingen*~~, 2026-08-13). The first is **Text** and not *Content*:
"Content" is retired above and **content view** is the spine that tab draws, so one word
would mean three things. `Text` is the check's own name.

**"Taken"** was every finding of one page in one list, grouped by check. Each of its
three groups is a tab that shows the same findings with more context, so it was the
one reading of the work that had to strip the context to exist. The grouped reading
now lives on the dashboard as *Repeats*, which groups **across** pages — where the
repetition is. Nothing it offered is unreachable: a text finding is a row of the
content view, a link and an image finding are rows of Links and Images, and all
four carry the same override control, the same class pill, the same detail and the
same section line.

One word is reserved. **"Fold"** has two meanings in this list and no more: a content
unit folds the words of an inline link, and tier 1 folds a character to nothing. A run
of equal rows **collapses**, and the row that stands for the run is a **context
marker**. Do not write "fold" for that.

## Identity

- **Finding id** —
  `sha256(store | page | check | rule | prodNorm | newNorm [| detail])`, cut to 16
  base64url characters. It is content-addressed, page-scoped and store-scoped,
  and it expires on purpose when the text changes. `detail` joins the key only when
  the class has one, so the id of a class without a detail is unchanged.
- **`rule`** — the class id of the finding. There is no rule identifier that is
  more specific than the class. A consequence: if a re-check gives a finding a
  different class, the id changes and a dismissal detaches.

## History

- **Run log** — the record of which findings each observation saw. It is keyed on the
  finding id alone, and it holds three facts: when an id was first seen, whether it is
  in the current snapshot, and when it was last seen. It holds no text, no decision
  and no relation between two ids.
- The run log **never re-attaches**. It cannot say that a new finding is an old
  finding with edited text, and it must not try: a matcher that is wrong carries a
  dismissal onto text that nobody dismissed, and it fails silently. An expired id
  asks a question twice, which is the failure that is visible and cheap. See
  `docs/adr/0004-history-is-a-run-log-that-never-re-attaches.md`.
- **No longer seen** — an id that the current snapshot does not hold. It is not a
  decision and nobody made it.
- One word is refused. **"Changed"** named a finding that the tool believed to be an
  older finding with new text. The tool cannot know that. The history note is what is
  left of the idea.

## Overrides

A finding has **no state**. It has overrides. An **override** is an editor's
event about a finding, a page class or a page. It is kept in Supabase, and the
table is append-only, so a reversal is a new event and not an edit.

An override is a **claim of fact** or a **judgement**. The difference decides
who wins against re-check.

- **Fix claim** — a claim of fact: "I corrected this." It **loses** to re-check,
  because re-check decides facts. Keyed on the finding id.
- **Dismissal** — a judgement: "these two exact strings are acceptable." It
  **beats** re-check, because re-check cannot decide what is acceptable. Keyed on
  content, thus on the finding id, so it expires when either side changes. This
  is correct behaviour: the judgement is stale, and the tool must ask again. A
  note is necessary.
- **Mute** — ~~a judgement about a class in one place: "this class is never a defect
  here", keyed on store, page, class and anchor heading~~. **Withdrawn from the vocabulary
  2026-08-13**, together with the `page-class` scope. It was built, tried and never
  adopted: eleven presses, all on `nl`, ten of them revoked by their own author within
  a minute, six of them labelled *Test*. The one that was left standing carries the note
  `"Negeren"` — the name, in the language the interface then spoke, of the other control
  (now *Dismiss*). And the job anybody wanted it for, silencing
  a whole class, is not a job it could do: its key named one section of one page, so a
  class across a store was hundreds of presses that no later crawl would extend. That job
  belongs to **visibility** on the class. Do not reason from this term.
  See `docs/adr/0011-the-mute-is-withdrawn.md`, which supersedes ADR 0008.
- **Bulk decision** — one press that writes **N ordinary events**, one per page, each
  carrying the editor and the same note. It is not a scope and it never will be: a
  repeat is a grouping the interface makes and has no identity to key on, so the table
  gains N rows and no column. **The pages are ticked**: a difference is a list with a
  checkbox per row and one in the column header, and every count follows the ticks. The
  two bulk presses have **different eligibilities on one selection** — a bulk
  **dismissal** expires with the text and skips a finding a colleague decided; a bulk
  **clearing** revokes a dismissal and touches nothing else. The dismissal does not cover a
  page that a later crawl finds. Since ticket 03 one selection may span a **language
  block**, and each press then states **in which stores** it will write — off its own
  events and never off the row, because a row spanning two stores whose sibling page a
  colleague already decided writes in one. Both presses say it **on screen**: the
  dismissal in its form, the clearing on a line of the bar, and neither in a tooltip.
  Only the **judgement** travels: there is no bulk fix claim, because correcting one
  store's page does not correct the other's.
  A partial failure is reported as *N of M saved*: the table
  is append-only, so what was written stands and the interface says how far it got.
  There were three presses until ADR 0011 took the bulk mute; a difference whose every
  finding is already decided therefore offers only the clearing, which is correct — the
  work there is done. See tickets 31 and 110.
- **Page review** — "a human looked at this whole page." Keyed on store and page.
  It covers what the tool cannot see: layout, tone, an image that agrees by name
  and shows something else. It never expires; it becomes **stale**.
- **Cleared** — the one action that revokes the last override on a key. There are
  no `un-` words. The control says **Clear** (~~*Ongedaan maken*~~, 2026-08-13). This is
  the rule's first real test: *Undo* is the exact word it refuses, and it is what a
  translation of the Dutch would have written, so the label is a **correction** and not a
  translation.
  **A *Clear* says what disappears.** The bare word is the action's name in this list; a
  control that wears it names its object — *Clear filter*, *Clear the selection*, *Clear
  note*, *Clear the decision*, *Clear the review*, *Clear the page scope* — because an
  editor pressing it is entitled to know what they are about to lose, and this interface has
  six things one press could take. A guard refuses a bare *Clear* on a control. The qualifier belongs to the label and never to the vocabulary: there
  is still one action and it is still **Clear**.
  It does **not** clear an annotation, and ticket 83 says why: on the `page` scope
  `cleared` already means *withdraw the review*, and reusing it for three annotation
  families on one scope would make one action mean three things and need a fourth column
  to say which. A cleared annotation is still a new event — never an edit and never a
  delete — but it is the value-carrying action carrying nothing: `prioritised` with a null
  priority, `noted` with an empty note.
- **Contradicted** — a fix claim that the current snapshot disagrees with. The
  finding is open again, and the interface says *claimed fixed, still differs*
  (~~*nog niet opgelost*~~, 2026-08-13), with the name of the person who claimed it. The
  Dutch said "not yet solved", which was never it: nobody is solving anything, a claim
  is contradicted. It is derived, never kept.
- **Stale** — a page review made against a page whose findings changed after it.
  The interface says **"changed since review"** (~~*gewijzigd sinds controle*~~,
  2026-08-13), not "needs review", because a
  page also becomes stale when an editor corrects things. **Its findings** means
  every finding on the page, in any class: a reviewer read the page and not the
  counted subset of it, and a hash that filtered on visibility made a change to the
  vocabulary look like a change to the page (ticket 118, ADR 0013).
- **Migration decision** — ~~an override on a one-sided page: **migrate**,
  **not migrated**, **replaced** or **redirected**~~. **Withdrawn from the vocabulary
  2026-08-11.** It never existed in the code: the override actions are
  `fixed | dismissed | reviewed | cleared` and nothing else — `muted` was among them until
  ADR 0011. The four values came
  from a superseded draft, were refused by the user — *usually, every page needs to be
  built*, so a verb per page names a decision already made — and their tickets are parked
  `wontfix` in `.scratch/content-parity-log/issues/.out-of-scope/` (20 and 84). Do not
  reason from this term. It is kept struck through rather than deleted because `PRD.md`
  stories 40 to 42 and 44 still refer to it.
- **Priority** and **Note** — two annotations on a page. Priority is one of a closed
  list of words; a note is free text. Both describe a page and neither describes a
  finding, because a finding carries its own decision. There is no **owner**: with a
  name in `localStorage` and no login, an owner field cannot mean what it says.
  Built by ticket 83 as two actions on the existing `page` scope, `prioritised` and
  `noted`, keyed apart from the review so that annotating a page cannot withdraw the
  review of it. The list is `high | medium | low` in `shared/priorities.mjs` — closed in
  git, never in the database, and there is no `normal` because absence is not a value.
  **Two and no more.** The proposal asked for user-defined columns, which is a schema
  editor: rename and reorder are mutations, and the table has insert and select policies
  only. A third annotation is that refusal reopened, not a free one.
  A **page note is not a dismissal note**, though they share the `note` column. A
  dismissal note is mandatory and explains one judgement about two strings; a page note is
  optional and explains nothing in particular. They are never rendered the same way.
- **History note** — a line beside a new finding, saying that a finding of the same
  class closed on the same page in the same run, and what was decided about it. It
  is a display-only difference. It asserts no identity, it is never counted, and it
  is never offered as a decision to accept.
- **Editor** — a name that the browser keeps in `localStorage`. There is no
  login.

Two words are retired. **"Resolved"** hid the difference between a claim and a
judgement. **"Reopened"** describes nothing: a finding is in the snapshot or it
is not. "Resolved" stays retired, and the third bucket is named **Closed**, which
this list already defines. Since 2026-08-13 the ban is **enforced**: the stopword guard
in `npm test` refuses the word anywhere under `web/src`, which is the first mechanical
check ticket 80's rule has had.

## Progress

- **Bucket** — one of the three groups a finding is in. There are three and no more:
  **Open**, **Needs attention** and **Closed**. A bucket is a grouping of the derived
  states, and it is not a state itself. Nothing is stored on a finding to put it in
  one. Built by ticket 80 as `bucketOf()` in `overrides/state.mjs` — a pure function over
  the four states, total over them, so a fifth state cannot fall silently into Closed.
  The **interface words are those three**, in that order, and they live once in
  `web/src/lib/buckets.mjs`. Ticket 80 asked for a Dutch word for the third and ADR 0014
  answered that question for the whole interface instead: it speaks English, so the word
  is **Closed**. `Gesloten`, `Aandacht nodig` and `Afgerond` were the candidates and none
  of them is used.
  The grouping **counts and never filters**: the dashboard draws three counts per page and
  three totals per store, and the ledger draws the same three above its tabs. Closed is
  reachable and is not the default — on the two finding tables it is a disclosure that
  names how many it holds, and never a filter, because a filter would make a row vanish
  the moment an editor ticked it fixed.
  A bucket does **not** determine the bar. An absent finding is Closed and is in neither
  of the bar's terms, and Open plus Needs attention is the bar's own open count, because
  a contradicted claim reads as open there.
- **Open** — a finding that waits for a decision.
- **Needs attention** — a finding that is **contradicted**, and nothing else. A page
  review that went stale is a fact about a page, so it is a badge on the page and
  never a finding in this bucket. Two scopes in one bucket would count one thing
  twice.
- **Closed** — a finding that is absent from the snapshot, or dismissed, or
  claimed fixed and not contradicted.
- **Denominator** — the findings in **`work`** classes on this snapshot. A dismissal moves
  them into the numerator. Nothing takes them out of it: the mute did, and ADR 0011
  withdrew it, so a difference in a `work` class is either open work or work an editor
  closed. Whether something is work at all is a property of the **class** — its
  visibility — and never of a place on a page.
- **Absolute counts go next to each percentage.** The denominator moves at each
  crawl, so a percentage alone reads as a regression when the dataset only became
  larger.
- **Roll-up** — findings closed, over page, store and migration, summed over
  findings and never over pages. Fresh page reviews, over store and migration
  only. A class is a breakdown and never a bar: a class that grows across many
  pages means a rule misfires, not that editors are behind.
- Progress is **axis A only**. Axis B has its own tab and its own count.

## One-sided pages

- **Legacy-only page** — a store page on production that gives 404 on the new
  site.
- **New-only page** — a store page on the new site that gives 404 on production.

Neither can make a finding, because the comparison needs 200 on both sides. They
are scope decisions and not editor work, so they stay out of the progress bar.

**There is no migration checklist, and none is planned.** One-sided pages are *shown* and
not *decided*: the `one-sided` chip (~~`eenzijdig`~~, 2026-08-13), the store header sentence
and a read-only aside naming
each page with its `skipReason`. The default answer for a legacy-only page is to build it,
which needs no vocabulary, so the checklist and its verbs were parked `wontfix` on
2026-08-11 — see `issues/.out-of-scope/20-one-sided-pages-checklist.md` for the reasoning and
the condition that would re-open it. Two cautions survive the park: this population is **not
a census**, because a page created on the new site since 2024 appears in no source at all, so
no "0 remaining" reading is ever true; and a legacy-only page that production **redirects** to
a surviving page is renamed rather than missing.

## Axes

- **Untranslated** — a finding class on the **scraped store content**: a store page that
  shows the NL text where the store's own language belongs (ticket 42). It is never a
  description of this interface. The interface has one language and it is English, and it
  is not "untranslated" — there is nothing it is waiting for. Two meanings for one word is
  what this list exists to stop, and this is the collision that became available the day
  the chrome stopped being Dutch (ADR 0014).
- **Axis A — parity.** Production against the new site, in one store.
- **Axis B — coverage.** NL against the five other stores. Translated text is
  different text on purpose, so axis B does not compare words.

The two axes have separate tabs and separate tasks. Do not mix them.

## Language blocks

- **Language block** — two stores whose hreflang codes share a language: `{nl, be}`
  from `nl-NL` and `nl-BE`, `{be_fr, fr}` from `fr-BE` and `fr-FR`. It follows from
  `HREFLANG_STORE` in `shared/stores.mjs` and it is not a hand-written list, so the
  question "may `de` and `uk` be a block" has an answer and it is no: each of them is
  alone in its language. The name is the word `crawl/seed-list.mjs` already used for
  the set when the map lived there. Decided 2026-08-17.
  A block is **not a pair**. A **store-page pair** is production against the new
  site, for one store page; a block is two stores on **one** side. Two meanings for
  one word is what this list exists to stop.
- **Sibling page** — the other store's page, inside one block. Two sibling pages are
  matched by the **hreflang alternate production declares** between them, which is
  production's own claim that they are the same page, and by path equality only where
  neither declares one. The path of `be_fr` carries a leading `fr/`, because `be` and
  `be_fr` have the same host, and that prefix is a host artefact and no part of the
  path that is compared. Both rules are needed: the Dutch block pairs on the alternate
  at 126 of 131, the French block at 28 of 122, and the path rule takes the French
  block to 120. **Which rule matched is carried on the sibling**, as a seed cell's
  `provenance` is — it is data, so a wrong pairing can be diagnosed without
  re-deriving it.
- **Agreement share** — of one store's production content units, the share whose
  **normalised text** appears exactly in the sibling's. It is what ranks the list,
  worst-first, and it is **not a score on a finding**. It is called *agreement* and
  never *identity*: this list gives *identity* to the finding id, which is what makes
  two differences the same difference, and that is a different question.
- A page of one store is one of five things, and they are told apart from each other
  and not only from silence. **Identical** — the sibling agrees word for word, which
  is 66 of the Dutch block's 125 measured pages and 47 of the French block's 120, so
  it is the common case and it says so rather than drawing an empty row. It is asked
  **both ways round**: the agreement share is one-directional, so a short page wholly
  contained in a much longer sibling scores 1 and is **diverged** and not identical.
  Read from either store of a block the answer is the same number, which is the test
  the one-directional reading failed — `be` said 67 where `nl` said 66.
  **Diverged** — some of the words are not over there. **Unmeasured** — nothing was
  compared: production did not answer 200 on both sides, or one side has no content
  units. It never reads as agreement and it is never a share of zero, and a page with
  no units has **no share** rather than a share of one. **Sibling-absent** — this store has the page and
  the sibling has no counterpart. **Only-in-sibling** — the sibling has it and this
  store has not. The last two are two facts and not one, because one is a page
  somebody over there builds and the other is a page somebody here builds. Neither
  borrows axis B's `missing-page` or `orphan-page`, which are counted classes.
- The block list is **not a census**. A page no sitemap declares is absent from it, and
  48 of `nl`'s 181 cells are carried over for exactly that reason. A short list is a
  short list and never agreement.
- The reading is **decided as values** by `blockReading()` in `web/src/lib/blocks.mjs`
  and only rendered by `BlockList.jsx`, in the manner of `explainScope()` — the three
  groupings and the count of agreements included, so that *a page both stores have* has
  one definition and not a second one in JSX. The block **vocabulary** is beside it in
  `web/src/lib/language-blocks.mjs` and not in `shared/`: ADR 0001 asks three questions
  and only the web layer reads it. `HREFLANG_STORE`, which it derives the blocks from,
  is the half two stages read. It compares
  **production** on both sides — the reference side — and the panel says so, so that a
  divergence between two stores is never read as a defect on the new site.
- The block has **two surfaces and one vocabulary**. The store dashboard's block list
  answers *which page* diverges; the **sibling tab** on a store page answers *where on
  it*, drawing this page against its sibling page in document order. It is the fifth tab
  and it is **not a fifth check**: `Check` stays the closed family
  `text | links | images | meta`, so no finding id can name a row on it and no landing can
  open one — `landingFor()` resolves a tab from a finding's check, and this tab is not
  one. It is named **Sibling** and never after a store, because it is drawn on both stores
  of the block and a store name would be two labels for one tab. It is **absent — not
  empty** — on a page with no sibling. `siblingReading()` in `web/src/lib/sibling.mjs`
  decides it as values and `SiblingView.jsx` renders it; the collapse predicate and the
  context marker are the content view's own, shared and not copied.
- **Block difference** — where two sibling pages do not agree. Words are compared,
  which no cross-store comparison in this repo has done before: axis B is
  presence-only **because** the language differs, and inside a block it does not.
- A block difference is a **display-only difference**. It has no id, no override and
  no place in a bar, and it moves no count, no denominator and no percentage. It is
  **never** called a finding: a finding is actionable and carries a decision, and this
  carries none. Nothing about it is `work`. On the sibling tab that means a row carries
  no override control, no finding id and no class pill, and no decision is offered
  anywhere on it — a decision that crosses a block is a decision about an axis-A
  **finding** and it belongs on the tab that shows that finding. A row is also **not
  tinted by direction**: `lost` and `added` are the tones of a class, a block difference
  has none, and neither store lost anything — they differ.
- A block is **not an axis**, and there is no axis C. The axes are what an editor
  works; a block is what an editor reads. The word is refused on purpose, because an
  axis in this repo means a tab, a task and in the end a count — ticket 11 forbids
  summing axis B's bar with axis A's, and that rule exists only because an axis has a
  bar. If a block difference is ever promoted to a finding, that promotion is an ADR
  and it is the day the word becomes available. Not before. See
  `docs/adr/0017-a-language-block-is-a-view-and-not-an-axis.md`.

## Delivery

- **Snapshot** — one build of the log, uploaded to the webhost as static files.
- **Re-check** — a live crawl of one store-page pair, on demand, by the local
  Node service. The hosted build senses that the service is not there and hides
  the button.
