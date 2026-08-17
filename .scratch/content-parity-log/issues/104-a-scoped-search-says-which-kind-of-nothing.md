# 104 — The search takes a page scope

Type: task
Status: ready-for-agent — part A landed, B to E open.
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
| **B** | The scope reaches the notes | open |
| **C** | The scope is a filter and says so | open |
| **D** | Typing a slash offers the page keys | open |
| **E** | A page row hands its key to the search | open |

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

## B — A scope reaches the notes

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

- [ ] A scope narrows the notes block to notes written on the matching pages.
- [ ] A scope plus a second term narrows the notes by that term as well.
- [ ] An unscoped search returns exactly today's notes. This adds a narrowing and removes
      none.
- [ ] A note's kind is legible on sight — a note attached to a page reads differently from
      the sentence given when dismissing ~~or muting~~ a finding. — **2026-08-13, ADR 0011:
      a dismissal is the only judgement that takes a note.** The two kinds of note are still
      two.
- [ ] A one-sided page with a note shows that note, alongside **A**'s explanation of why
      there are no findings.
- [ ] The two halves keep their two freshnesses and stay two blocks. No merged list.
- [ ] The notes half keeps 123's honest states: a scoped notes block never says "none"
      about a log it has not read.
- [ ] Notes stay governed by the latest-per-key rule, so a withdrawn note is never offered
      as a live one.

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

## C — The scope is a filter and says so

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

- [ ] An active page scope appears as a chip beside the class pills.
- [ ] The amber strip names the scope while it is on, alongside any classes.
- [ ] The clear-filter control clears the scope and the classes together, and the search box
      loses the scope while keeping any remaining term.
- [ ] Dismissing the scope chip alone clears the scope and leaves the classes and the term
      alone.
- [ ] Editing the scope in the box updates the chip, and the two never disagree. The box is
      the source of truth; the chip is a reading of it.
- [ ] A scope and a class filter compose — the result is what both agree on — building on
      what 102 established for the term.
- [ ] The scope moves no count, no bar and no denominator, and the existing test for that
      rule passes unchanged.
- [ ] `CONTEXT.md`'s **Filter** entry admits page scope as a kind of filter, with the same
      session-only life and the same amber strip.

### Traps — C

- **The noise toggle is not the precedent here.** It survives a filter clear because it
  changes what counts as a finding. A scope only changes what is on screen, so it is a
  filter and it clears.
- Two sources of truth for the scope is the failure mode. The chip must derive from the
  parsed term rather than hold its own copy.
- The include-closed option is still not a filter and still does not belong in the strip.

---

## D — Typing a slash offers the page keys

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

- [ ] Typing `/` as the first character offers the store's page keys.
- [ ] Continuing to type narrows the suggestions by the same substring rule the scope itself
      uses, so what is offered is what would match.
- [ ] Choosing a suggestion puts that scope in the box, leaving any second term intact.
- [ ] The list is keyboard-navigable and dismissable without leaving the box.
- [ ] Suggestions are available before the search index has been fetched.
- [ ] One-sided pages are offered, and are marked as such — they are exactly the pages an
      editor cannot otherwise reach through search, and **A** explains what they get.
- [ ] A slash typed anywhere but first position offers nothing, matching 103's rule.
- [ ] Choosing a suggestion is not required — a scope typed out by hand behaves identically.

### Traps — D

- **Suggesting only indexed pages would hide the clean pages and the one-sided ones**, which
  is most of what a spot-check is for. The list is every page in the store.
- The count of indexed pages is a number, not a list. It cannot feed this.
- Do not fetch the index to populate suggestions. The index is large and arrives on the
  first keystroke for a different reason; the page list is already in memory.

---

## E — A page row hands its key to the search

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

- [ ] A row in the pages table offers a way to search within that page, distinct from the
      link that opens the page itself.
- [ ] Taking it puts that page's scope in the search box and shows the scoped result.
- [ ] The existing page link is unchanged and still opens the whole content view, never a
      fragment — `docs/adr/0006-the-content-view-is-the-spine.md`.
- [ ] A key holding a slash or parentheses is inserted correctly and matches only its own
      page.
- [ ] Any class filter already on stays on, and the scoped result respects it.
- [ ] The default view does not change. The repeats view stays where an editor lands.

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
