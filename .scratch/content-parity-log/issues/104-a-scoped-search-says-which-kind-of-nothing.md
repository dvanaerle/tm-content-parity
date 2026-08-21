# 104 — The search takes a page scope

Type: task
Status: resolved 2026-08-17 — all five parts landed and are on `main`; part A is `bc59495`.
The five per-part sections below each carry their own **landed** note. This line read
`ready-for-human` until 2026-08-21, which was a resolved ticket wearing a triage label: nothing
was waiting on a human, and the audit of 2026-08-19 said so.
Blocked by: None — 103, 102 and 123 are all resolved.
Parent: ../map.md

## If you are building one part, read only that part

**This ticket is five sessions, not one.** Read this heading block, then **your part and
nothing else** — its reading list, its criteria, its traps. Do not read the other parts and
**do not plan across all five**. Each part is one commit, and each starts in a fresh context
window.

Part A cost 180k tokens because it had to find the seam from a ticket that named no paths.
That is what the per-part reading lists below exist to prevent: **read the files listed for
your part and nothing else. If you need more, the ticket is wrong — say so and stop.**

| part | what | state |
|---|---|---|
| **A** | The four kinds of nothing, returned as a value | **landed**, `bc59495` |
| **B** | The scope reaches the notes | **landed** |
| **C** | The scope is a filter and says so | **landed** |
| **D** | Typing a slash offers the page keys | **landed** |
| **E** | A page row hands its key to the search | **landed** |

**A is the seam the rest consume.** B, D and E build on the value it returns; C is
independent of all of them. B to E may be built in any order.

### The one thing every part needs

`searchStore()` already returns one object and **every part extends it rather than replacing
it**: `{ repeats, total, pages, matchedRepeats, matchedPages, scope, text }` — the JSDoc
contract is at `web/src/lib/search.mjs:340-376`. Part A added `matchedPages`, `scope` and
`text`, plus `explainScope({ pages, result })` at `:506`, which returns
`{ scope, state, pages }`.

### Before your first commit: the labels are English now

Every part below names Dutch labels — *Eenzijdige pagina's*, *Pagina's*, *Verschillen*,
*filter wissen*, *inclusief afgesloten*. **All five parts were written before 124 landed**,
and 124 made the interface English (UK) on all six stores and renamed *Verschillen* to
**Repeats**. Read those names as pointers to surfaces, not as strings to type, and take the
current name from `web/src` and from `CONTEXT.md`, which wins. The stopword guard 124
installed will catch a slip; do not excuse it.

### Gate, every part

```
npm test && npm run lint && npm run build
```

**No count, bar or denominator moves in any part**, and the existing test for that rule
passes unchanged.

> **Merged 2026-08-17.** This ticket absorbed **105, 106, 107 and 108**, which were five
> tickets over one search box: the same scope value, the same load-time page list, the same
> component tree, and not one measured number between them. The runbook's rule is *batch
> freely inside a gate*, and there is no gate here to batch across. Ticket 124 set the
> shape — **a commit per area, not a ticket per area.** The filename keeps 104's slug so
> every inbound link still resolves.
>
> **Restructured 2026-08-17**, after part A. The traps were pooled at the bottom and the
> parts named no files, so a part-A session read all five parts' criteria and all five trap
> groups to build one. Traps now sit under their own part and each part carries a reading
> list. No criterion and no trap was changed, added or dropped.

---

## A — A scoped search says which kind of nothing it found — **landed in `bc59495`**

Built 2026-08-17: `web/src/lib/search.mjs`, `web/src/lib/search.test.mjs`,
`web/src/components/Search.jsx`, `web/src/components/Search.browser.test.mjs`,
`web/src/components/Dashboard.jsx`, `web/src/components/Dashboard.browser.test.mjs`,
`CONTEXT.md` — 7 files, +586/−36. The nine criteria are ticked **as claimed by that
commit's own message and its `/code-review`**; they were not independently re-verified when
this file was restructured.

An editor scopes to a page and gets nothing back, and the screen tells them **which**
nothing it is. There are four, and before this they were one blank:

- **No such page.** The scope matches no key. A typo, and the answer is to try again.
- **The page has one side.** It exists, it is in the store, and it is in the one-sided pages
  aside — but one side did not answer, so it is not compared and it is not in the index.
  Search returning silence here is search contradicting the page list on the same screen.
- **The page is clean.** Compared, and nothing is wrong with it. This is the answer an
  editor most wants and the one previously indistinguishable from a typo.
- **The second term matched nothing.** The page is fine, the scope is fine, the word is not
  on it.

All four are answerable from data the browser already holds when the store page loads: the
full page list, each entry carrying whether it is comparable and why not. Nothing new is
fetched and the index needs no new field.

A parity tool that cannot tell *clean* from *I don't know* is arguing against its own
purpose. This is also what makes a scope useful as a spot-check, which is the most likely
way anyone will actually use it.

- [x] A scope matching no page key says so, and says it differently from a page that
      matched.
- [x] A scope matching a one-sided page says the page exists, gives the reason the
      comparison did not run, and points at where one-sided pages are listed.
- [x] A scope matching a compared page with no shown findings says the page is clean.
- [x] A scope matching a compared page that has findings, with a second term matching none
      of them, says the term found nothing on that page.
- [x] Which of the four applies is decided as a value in the search module and returned to
      be rendered. The component classifies nothing.
- [x] Each of the four is pinned by its own test at the existing search seam.
- [x] A scope matching several pages of mixed kinds — one clean, one one-sided — does not
      collapse to a single verdict.
- [x] No new fetch, no new index field, no change to what the build emits.
- [x] No count, bar or denominator moves.

### Traps — A

- **Clean and unindexed are not the same.** A compared page with no shown findings
  contributes no index entry at all, so absence from the index proves nothing on its own.
  The page list is what distinguishes them.
- The count of indexed pages is a **number**, not a list of keys, and it counts only
  compared pages. It cannot answer any of this. The load-time page list can.
- Do not invent new copy for the one-sided case where the aside already has language for
  it. Two names for one situation is how a vocabulary rots.

---

## B — A scope reaches the notes — **landed**

Built 2026-08-17: `web/src/lib/search.mjs` (`searchNotes()` parses the term instead of
matching the raw string, narrows on the event's own page through `inScope()`, and returns
`scope` and `text` beside the notes), `web/src/lib/search.test.mjs`,
`web/src/components/Search.jsx` (the heading is a reading of what was narrowed by),
`web/src/components/Search.browser.test.mjs`, `CONTEXT.md`.

The bug underneath it was worse than *not narrowed*: `/downloads knop` was matched against
the notes **with its slash on**, so the notes half of a scoped search found nothing at all.

Criterion four was already met when this part started — ticket 83 built `NoteKind` and the
quoted `PageNote`, and this part is the first screen that puts the two side by side, which is
what the criterion was guarding. Nothing was built for it; a browser case now renders the two
kinds together under one scope, which is the situation that had never existed before, so the
tick is a pin and not a claim about untested code.

`docs/adr/0016`'s last consequence said the notes half was unscoped and that scoping it was
ticket 105. 105 is one of the four this ticket absorbed, so that line is amended in place
rather than left pointing at a number nothing lives under.

### Reading list — B

Read these and nothing else. If you need more, the ticket is wrong: say so and stop.

- `web/src/lib/search.mjs` — `searchNotes()` `:649-686` (folds the term, `latestByKey()`,
  the sort); `parseTerm()` `:298` and `inScope()` `:324` are the scope rule to **reuse, not
  re-derive**
- `overrides/state.mjs` — the `OverrideEvent` typedef `:27-40` (`scope: 'finding'|'page'`,
  `store` `:33`, `page` `:34`, `note` `:39`) and `latestByKey(events)` `:160` with its
  warning at `:140`
- `web/src/components/Search.jsx` — `Notes` `:386-457` (renders the block, returns `null`
  on empty), `NotesAside` `:459`, `NoteKind` `:478`, the `useMemo` call site `:95-96` and
  the mount point `:223`
- `web/src/lib/search.test.mjs` — `describe('searchNotes')` `:829-1040`, including the
  no-coercion case at `:1031`
- `web/src/components/Search.browser.test.mjs` — the notes-block rendering cases

### What to build — B

An editor scopes to a page and the notes half narrows with the findings half. `/downloads`
answers about the downloads page in both blocks, not in one.

This is nearly free: every override event already carries its store and its page as required
fields, and the notes block already draws a page link from them. The scope is a filter over
data the screen has in hand.

It also rescues the one-sided case from **A**. A one-sided page has no findings and can
never have any, so a note is the **only** thing search can truthfully say about it — and
today the notes block would not be narrowed to it.

Scoping is what first puts a page note and a dismissal note side by side on one screen,
which is exactly where 83's warning bites: they are different things and must not read as
each other. Today every note renders identically. That stops here.

- [x] A scope narrows the notes block to notes written on the matching pages.
- [x] A scope plus a second term narrows the notes by that term as well.
- [x] An unscoped search returns exactly today's notes. This adds a narrowing and removes
      none.
- [x] A note's kind is legible on sight — a note attached to a page reads differently from
      the sentence given when dismissing ~~or muting~~ a finding. — **2026-08-13, ADR 0011:
      a dismissal is the only judgement that takes a note.** The two kinds of note are still
      two.
- [x] A one-sided page with a note shows that note, alongside **A**'s explanation of why
      there are no findings.
- [x] The two halves keep their two freshnesses and stay two blocks. No merged list.
- [x] The notes half keeps 123's honest states: a scoped notes block never says "none"
      about a log it has not read.
- [x] Notes stay governed by the latest-per-key rule, so a withdrawn note is never offered
      as a live one. — a bare scope has no words to match, so the `note` field is now
      required to be non-empty rather than merely to hold the needle: `''.includes('')`
      holds, and a cleared note would have drawn as a note with nothing in it.

### Traps — B

- **The scope filters notes by their own page, not by the page a finding is on.** An event
  records where it was written, and that is the field to narrow on.
- The notes are shown whatever the include-closed option says, for the reason 82 records: a
  note is required when dismissing, so nearly every note hangs off closed work. Do not
  quietly make the option govern them.
- Ticket 83 adds page-scope notes with a priority. It needs no key-shape change and this
  part should not pre-empt its vocabulary — only make room for a second kind of note to be
  told apart.

---

## C — The scope is a filter and says so — **landed**

Built 2026-08-17: `web/src/components/Chips.jsx` (`ScopeChip`, and `ClassFilterBanner` takes
a `scope` and names it in the one sentence), `web/src/components/Search.jsx` (the strip is
handed `result.scope`; `onClearClasses` is now `onClearFilters`, because it clears two
things), `web/src/components/Dashboard.jsx` (the box is parsed through `parseTerm()` and the
chip is a reading of it; both clears write back to the box),
`web/src/components/Search.browser.test.mjs`,
`web/src/components/Dashboard.browser.test.mjs`, `CONTEXT.md`.

The strip's guard moved with it: a scope raises the amber strip **on its own**, with no pill
pressed, which is the case the component could not draw before. Its denominator is unchanged
— `matchedRepeats`, what the term found before the pills cut it — and under a scope that
already was *of what the scope reached*, because the scope narrows the corpus before the term
runs. The last line still says the counts above count everything, so no count moved.

The chip is parsed from the box in `Dashboard` rather than read off `result.scope` the way
`Search` reads it. That is not a second source of truth and not a second rule: it is the same
`parseTerm()` over the same string. It is parsed there because the result is `null` until the
index has been fetched, and a chip arriving a beat after the scope did would flicker on every
keystroke of a scope being typed.

Three things the `/code-review` of this part turned up, recorded rather than left implicit:

- **The chip was not beside the pills.** It was drawn in the control row with the search box,
  which on a wide viewport is a header's width from the pills — the two halves of one
  sentence, apart. The pills and the chip are now one wrapped group, and a browser case pins
  the shared parent rather than a pixel distance.
- **The `CONTEXT.md` edit is wider than the one entry the criterion names.** The **Filter**
  entry also gained the three-kinds taxonomy (it cannot admit a third kind without naming
  that there are kinds) and a clause putting the **noise toggle** outside the strip, which is
  this part's first trap written down where the next reader will meet it. The **Page scope**
  entry gained the same fact from its own side. All three are consistent with the part; none
  was asked for by name.
- **While the index is in flight there is a chip and no strip.** `Search` returns *the search
  index is loading…* before the strip, so the sentence naming the scope arrives with the
  result. That is the behaviour the classes already had and it is not made worse here: the
  strip's numbers are counts **of the result**, and a strip drawn before there is one would
  have to invent them. The chip is the control and is honest on its own.

### Reading list — C

Read these and nothing else. If you need more, the ticket is wrong: say so and stop.

- `web/src/components/Chips.jsx` — `FilterBanner` `:190` (the amber strip shell and its
  clear control), `ClassFilterBanner` `:242-278` (the classes/priorities sentence,
  `shown`/`total`), `ClassPill` `:36`, `ClassFilterPills` `:58`, `Chip` `:26`
- `web/src/components/Search.jsx` `:157-169` — the `ClassFilterBanner` call site, with
  `total={result.matchedRepeats}` and `onClearClasses`
- `web/src/components/Dashboard.jsx` `:472-484` — the other `ClassFilterBanner` call site
  (pages and repeats views) and `onClearClasses={() => patch({ classes: [] })}` at `:456`
- `CONTEXT.md` `:263-275` — the **Filter** glossary entry: a filter moves no bar,
  denominator or count; *include closed* is deliberately absent from the strip; the
  URL-versus-session rule

**C is independent of A.** It needs `parseTerm()`'s output and nothing part A added.

### What to build — C

A page scope stops being invisible punctuation inside a text box and becomes a chip beside
the class pills, named in the amber strip like every other narrowing, cleared by the
clear-filter control.

`CONTEXT.md` defines a filter as a narrowing of what is on screen that moves no bar, no
denominator and no count, and says so with an amber strip for as long as it is on. A page
scope is precisely that. Leaving it as raw text means the strip enumerates the small
narrowings and omits the largest one — a strip that is wrong about what is filtering the
screen is worse than no strip.

The price is that clearing the chip rewrites the search box, because the chip owns a
fragment of an input. That is accepted: an editor who clears the filters is asking for the
whole store back, and a scope silently surviving that is the more surprising outcome.

This part also amends the **Filter** entry in `CONTEXT.md`, which today reads as though
narrowing by class is the only kind there is.

- [x] An active page scope appears as a chip beside the class pills.
- [x] The amber strip names the scope while it is on, alongside any classes. — *Filtered on
      page /overkap and copy.* The word **page** carries it: alone, `/overkap` reads as a
      path, and beside a class it would read as a second class with odd punctuation.
- [x] The clear-filter control clears the scope and the classes together, and the search box
      loses the scope while keeping any remaining term.
- [x] Dismissing the scope chip alone clears the scope and leaves the classes and the term
      alone.
- [x] Editing the scope in the box updates the chip, and the two never disagree. The box is
      the source of truth; the chip is a reading of it.
- [x] A scope and a class filter compose — the result is what both agree on — building on
      what 102 established for the term. — pinned in both directions: a class the scoped
      page has, and one it has none of, where the intersection is empty and the scope is
      still named rather than dropped.
- [x] The scope moves no count, no bar and no denominator, and the existing test for that
      rule passes unchanged.
- [x] `CONTEXT.md`'s **Filter** entry admits page scope as a kind of filter, with the same
      session-only life and the same amber strip. — the strip, yes; **the life is not
      session-only and the entry says so instead.** The scope rides inside `query`, which is
      part of the **screen** and therefore lives in the URL (ticket 109), exactly as this
      screen's classes and priorities do. The criterion is left as written rather than
      normalised, because the entry it asked for now contradicts one of its clauses and a
      quietly reworded criterion is a criterion nobody can check.

### Traps — C

- **The noise toggle is not the precedent here.** It survives a filter clear because it
  changes what counts as a finding. A scope only changes what is on screen, so it is a
  filter and it clears.
- Two sources of truth for the scope is the failure mode. The chip must derive from the
  parsed term rather than hold its own copy.
- The include-closed option is still not a filter and still does not belong in the strip.

---

## D — Typing a slash offers the page keys — **landed**

Built 2026-08-17: `web/src/lib/search.mjs` (`splitScope()` holds the slash rule and
`parseTerm()` is now one of its three readers; `scopeSuggestions()` and `withScope()` are the
other two), `web/src/lib/search.test.mjs`, `web/src/components/SearchBox.jsx` (**new** — the
box and its listbox), `web/src/components/Dashboard.jsx` (it hands down the whole page list
and keeps `patch({ query })` as the one write), `web/src/components/Dashboard.browser.test.mjs`,
`CONTEXT.md`, `docs/adr/0016` and `docs/adr/0007`.

The list closes on a **settled** scope — a fragment that names a key *and is the only key it
reaches*. Both halves are needed, and the first version had only the first: a key can be the
prefix of a sibling, so `/veranda` over a store holding `veranda` and `veranda-hout` went
silent with a page left to offer, which breaks the one rule the list lives under. It would have
gone silent on a one-sided sibling in particular — the page nothing else can reach. Choosing a
suggestion therefore closes the list itself rather than relying on the offer to stop.

Two ADRs said something this part makes false, and both are amended in place rather than left
standing:

- **0016** said `parseTerm()` *is the whole of this rule*. It is `splitScope()` now, with three
  readers, because the suggestions need the fragment being typed — which `parseTerm()`
  deliberately refuses to call a scope — and the write-back needs the words after it. The
  division moved down; each reader keeps its own judgement.
- **0007** says every panel is a shadcn primitive and names the failure mode: *a dozen panels
  that each redefined a border and a corner*. The listbox is hand-rolled, because a `Popover`
  takes the focus and this list must never — the caret stays in the box and the active row is
  named by `aria-activedescendant`. Recorded as a consequence with two conditions, the second
  being that a **second** hand-rolled panel means this repo wants a focus-free primitive of its
  own.

Three things the `/code-review` asked about that were kept as built, named here rather than
left implicit:

- **The `CONTEXT.md` edit is not asked for by any part-D criterion.** Parts A and B updated the
  glossary the same way without one; the **Page scope** entry would otherwise describe a scope
  an editor cannot be offered.
- **Alphabetical order and the mouse affordances** — hover to highlight, mousedown to choose —
  are decisions no criterion names. A listbox that answered only the keyboard would be the
  odder control.
- **Escape means two things**: it puts the list down when the list is up, and otherwise the
  browser's own default empties the box. That default is what the box did before this part, so
  it is left alone rather than changed outside part D's remit.

### Reading list — D

Read these and nothing else. If you need more, the ticket is wrong: say so and stop.

- `web/src/components/Dashboard.jsx` `:373-383` — the single `Input type="search"`, bound to
  `query` through `patch({ query })`
- `web/src/components/Dashboard.jsx` `:71` (props) and `:447-468` — `pages={pages}` handed
  to `Search`, with the comment stating it is the **whole** list and not the comparable half
- `web/src/pages/[store]/index.astro` `:22-24`, `:61` — `loadSummaries(store)`, where every
  page for the store arrives and is passed down as `pages`
- `web/src/lib/search.mjs` — `parseTerm()` `:298-317` and `inScope()` `:324`: substring,
  never split on a slash, and position 0 is the only structural slash
- `web/src/lib/screen-url.mjs` — `PARAM.query` `:63`, `SCREEN` `:42-46`,
  `searchFromScreen()` `:94`, `screenFromSearch()` `:123`, `useScreen()` `:166`. The query
  lives in the URL, with a 250 ms mirror delay at `:81`

### What to build — D

An editor types `/` and the box offers the store's page keys, narrowing as they keep typing.
Without this, page scope is a feature only someone who has read the source can use.

The keys are not guessable. They are opaque strings carrying store prefixes and
parentheses — `(home)`, `(be)pergola`, `faq/productinformatie` — and no editor is going to
produce one from memory. An autocomplete is not a convenience here; it is the difference
between a usable feature and a hidden one.

It costs nothing to source. The full page list arrives in the browser when the store page
loads, well before the search index is fetched, so the suggestions are available from the
first keystroke — including for pages the index does not contain.

- [x] Typing `/` as the first character offers the store's page keys.
- [x] Continuing to type narrows the suggestions by the same substring rule the scope itself
      uses, so what is offered is what would match. — it is `inScope()` itself, and the offer
      survives a key that is the prefix of a sibling, which is where an exact match read as
      settlement had it going quiet with a page still to offer.
- [x] Choosing a suggestion puts that scope in the box, leaving any second term intact.
- [x] The list is keyboard-navigable and dismissable without leaving the box. — Escape
      remembers the **fragment** it was dismissed at, so the list returns when that fragment
      changes rather than staying down for the session or reopening on the next keystroke.
- [x] Suggestions are available before the search index has been fetched. — pinned against a
      `fetch` that never resolves, so a test cannot pass by letting the index land.
- [x] One-sided pages are offered, and are marked as such — they are exactly the pages an
      editor cannot otherwise reach through search, and **A** explains what they get. — in the
      aside's own words, *Only one site has this page.*
- [x] A slash typed anywhere but first position offers nothing, matching 103's rule. — pinned
      with `faq/overk`, where the words after the slash **do** name a page: the obvious
      `overkappingen/deals` is silent under a wrong rule as well and proves nothing.
- [x] Choosing a suggestion is not required — a scope typed out by hand behaves identically.

### Traps — D

- **Suggesting only indexed pages would hide the clean pages and the one-sided ones**, which
  is most of what a spot-check is for. The list is every page in the store.
- The count of indexed pages is a number, not a list. It cannot feed this.
- Do not fetch the index to populate suggestions. The index is large and arrives on the
  first keystroke for a different reason; the page list is already in memory.

---

## E — A page row hands its key to the search — **landed**

Built 2026-08-17: `web/src/components/Chips.jsx` (`ScopeRowButton`, beside `ScopeChip`
because they are the scope's two controls), `web/src/components/Dashboard.jsx` (the pages
table's page cell and the one-sided aside's row, both writing `patch({ query: withScope(…) })`),
`web/src/components/Dashboard.browser.test.mjs`, `CONTEXT.md`.

**Nothing was added to `search.mjs`.** `withScope()` is already the answer to *what should the
box hold now*, written for part D's suggestion list, and a row is its second reader. So a
scope handed over by a row and one chosen from the list are the same write and cannot come to
behave differently.

The **one-sided aside carries the control too**, which no criterion names and this part's own
trap does: a one-sided page is out of the bar and out of the pages table, and no index entry
can offer it either, so its row in the aside is the only way into a scope on it. It is also
the page the affordance is worth most on — part A's sentence is what the scope lands on.

*Matches only its own page* is pinned for the two key shapes the criterion names, a slash and
parentheses, with a `faq` page in the fixture so the slash case can fail. It is **not** true of
a key that is the prefix of a sibling — `/veranda` reaches `veranda-hout` — because the scope
is `inScope()`'s substring rule, which part D deliberately built the suggestion list on. That
is unchanged here and out of this part's remit; a row that scoped by exact match would need a
syntax the box does not have.

Four things the `/code-review` of this part turned up, recorded rather than left implicit:

- **The parentheses half of criterion four was ticked before it was pinned.** The first
  version pressed the `faq/productinformatie` row only and used `(home)` as the page a scope
  must *not* reach, which proves nothing about inserting one. `(home)` now has its own press.
- **`docs/adr/0016` rejected *a separate control beside the box*, and both D and E put one on
  the screen.** Amended in place with the reading: all three of that option's reasons turn on
  a control that is a second place the scope can *live*, and neither the list nor the row
  button holds one — they write the box. Its middle reason, the cost of the page list, was
  wrong on its own terms: the list is already in the browser.
- **The press clears the ticked pages**, because writing `query` trips the effect that puts a
  selection down. That is the rule already written at `Dashboard.jsx:237` — a tick means
  *this page* and cannot outlive the list it was made in — and this press puts a search where
  that table was. Kept, and said where the write is.
- **The `CONTEXT.md` edit is not asked for by any part-E criterion**, the same way part D's
  was not. The **Page scope** entry would otherwise describe a scope only a box can be told
  about, on a screen where a row now hands it over.

### Reading list — E

Read these and nothing else. If you need more, the ticket is wrong: say so and stop.

- `web/src/components/Dashboard.jsx` `:505-570` — the `view === 'pages'` table, its
  `rows.map((page) => …)` at `:531`, and the existing page link
  `<a href={link(page.store, page.page)}>{page.page}</a>` at `:545-551`
- `web/src/components/Dashboard.jsx` `:373-383` — `patch({ query })`, the one place a row
  would write the term
- `web/src/lib/page-url.mjs` — `encodePage` `:17` with its per-segment slash rule `:10-16`,
  and `pageHref()` `:48`, which is the `link` prop's implementation
- `web/src/lib/search.mjs` `:319-324` — `inScope()`'s docblock, which names the three key
  shapes, so a row-supplied scope stays a substring
- `docs/adr/0006-the-content-view-is-the-spine.md` — the constraint on the existing link

### What to build — E

An editor looking at the pages table finds the page they care about, and gets from there into
a scoped search without typing an opaque key by hand.

This is the page-first path. The original ask was to make the pages table the default view,
and that was settled against: the page table draws every row at once, so landing there trades
a budgeted wall for an unbudgeted one, and it demotes the queue 81 established. What the ask
was actually reaching for is this — a way to go from *this page* to *what is on this page* —
and it is a click, not a default.

It also stops the two views being two disconnected worlds. Today the page list and the search
have nothing to say to each other.

- [x] A row in the pages table offers a way to search within that page, distinct from the
      link that opens the page itself. — a button carrying the key as its accessible name,
      *Search inside overkappingen*, beside the link and never instead of it.
- [x] Taking it puts that page's scope in the search box and shows the scoped result.
- [x] The existing page link is unchanged and still opens the whole content view, never a
      fragment — `docs/adr/0006-the-content-view-is-the-spine.md`. — pinned on the href
      itself, which carries the way back and no finding.
- [x] A key holding a slash or parentheses is inserted correctly and matches only its own
      page. — for those two shapes; see the note above on a key that is a sibling's prefix.
- [x] Any class filter already on stays on, and the scoped result respects it. — the row
      writes `query` alone, and the strip names both narrowings in one sentence.
- [x] The default view does not change. The repeats view stays where an editor lands. — no
      `view` is written, so dropping the scope puts back the table the press came from.

### Traps — E

- **Do not make the row itself scope the search.** The row's job is opening the page, and
  ADR 0006 is the reason. This is a second, clearly separate affordance.
- Scoping from a one-sided page is reachable from the one-sided pages aside too, and lands on
  **A**'s explanation rather than on silence.
- This part adds no new page data. Everything it needs is on the row already.

---

## Traps — the merge itself

- **Five commits, and the branch is reviewable at each.** The reason this is one ticket is
  that no number moves, not that the work is one lump. A single commit rewriting the search
  box, the notes block, the filter strip, the suggestion list and the page table at once is
  the failure mode the merge is supposed to avoid.
- **One part per context window.** Part A took 180k tokens, which is past the smart zone on
  its own. `/clear` between parts and start from the reading list; what the next part needs
  from the last one is the **code** and this file, never the transcript.
