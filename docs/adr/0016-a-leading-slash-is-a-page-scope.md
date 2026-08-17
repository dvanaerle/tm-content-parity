# A leading slash is a page scope, and only in first position

Ticket 103 asked for this ADR under the number `0010`. That number was taken by *the
dashboard screen is the URL* before this ticket was written, and ADR 0014 already amends
it, so the decision is recorded here as `0016`. Nothing else about the ticket changes.

An editor types `/downloads` and gets the repeats on that page, and nothing from the pages
whose text merely holds the word *downloads*. They type `/downloads knop` and get the
repeats on that page whose words hold *knop*.

## The decision

**Position 0 of the term, and nowhere else.** A term is trimmed, and if it then begins with
a slash, everything up to the first space is the **page scope** and everything after it is
the text to search for. Anywhere else the slash is an ordinary character, exactly as it was
before. ~~`parseTerm()` in `web/src/lib/search.mjs` is the whole of this rule, and it is a
pure function tested apart from matching.~~
*Amended 2026-08-17 by ticket 104 part D.* The rule is still one pure function in
`web/src/lib/search.mjs`, tested apart from matching — but it is `splitScope()`, and
`parseTerm()` is now one of its three readers. The other two arrived with the suggestion
list: `scopeSuggestions()` needs the fragment *being typed*, which `parseTerm()` refuses to
call a scope at all (a bare `/` is deliberately not one), and `withScope()` needs the words
after it, to put a chosen key in the box without costing them. The division is what all three
share and the judgement is what they differ on, so the division moved down and each reader
keeps its own answer. The consequence below — one string, one parse, and no second copy of
this rule to drift — is the reason it moved rather than being written out three times.

**The scope is matched by substring against the page key.** It is how every other field in
this search is matched, and it is what lets `/faq` reach the family, `/home` reach `(home)`
and `/pergola` reach `(be)pergola` with no special case for any of them. A scope may
therefore match several pages, and often does — so a result names the pages it matched, as
a header over the one merged list.

**A slash with nothing after it is not a scope.** An empty scope is a substring of every
page key, so the first keystroke of one would answer with the whole store. `/` stays the
ordinary term it was, which is also what still finds the keys that hold a slash.

## Why this overturns nothing but first position

Ticket 82 recorded a trap: **a page key can hold a slash**, so the key is matched as one
opaque string and nothing ever splits on the character. `faq/productinformatie` is a key,
`(be)pergola` is a key, and a tokeniser that divided either of them would make a page
unfindable by the name an editor reads.

That reasoning is untouched here, because it is about the **key** and this is about the
**term**. At the front of a term, before any word, there is nothing for a slash to be part
of: no page key begins with one, and an editor who types one there has said something about
where they are looking rather than about what they are looking for. Everywhere else the
character stays a letter, and `search.test.mjs` pins both halves — `faq/product` and
`/faq/product` find the same page, and the second is one scope and never two.

## This is not the first step toward a query language

No second sigil is planned, and this decision is not a precedent for one. The search is a
substring scan over six fields with no dependency and no grammar, and the reason a scope is
worth an exception is that **searching within one page was not possible at all** — the page
key was already a searchable field, so `downloads` returned that page's findings mixed with
every text hit for the same word, and no typing separated the page from the word.

A second operator would have to make that argument again on its own. `field:value`, a
quoted phrase, a boolean — each of them is a grammar, each needs an error state for the
malformed case, and none of them answers a question that cannot be asked today. The scope
answers one that could not.

## Considered options

- **Exact key match.** Rejected. `/faq` would then find one page and not the family, and an
  editor would have to know that `(home)` and `(be)pergola` carry sentinels the interface
  never shows them. Substring is the rule the rest of the search already follows.
- **A scope filters the report instead of the search.** Rejected, and it is the ticket's
  first trap. A scope narrows the corpus a search runs over; it does not open a page. A page
  name in a result opens the whole content view and never a fragment of it (ADR 0006).
- **A bare scope draws the page.** Rejected, and it is the second trap. `/downloads` lists
  that page's **repeats**, in the row shape every other search result has. The ledger
  reading of a page has one home and this is not it.
- **A separate control beside the box.** Rejected. A dropdown of page keys is a second
  place to say where you are looking, it costs the whole page list on the dashboard, and it
  cannot be sent to a colleague in the query string the way a term can.

  *Read against ticket 104 parts D and E, 2026-08-17.* Both put a control on the screen that
  sets a scope, and **neither is the option this rejected**, which is worth stating rather
  than leaving a reader to reconcile. All three of its reasons turn on a control that is a
  second place the scope can *live*: the suggestion list and the row button each write the
  box and hold nothing, so the term is still the one source and still the thing that goes in
  the query string. The middle reason is the one that turned out to be wrong on its own
  terms: the whole page list is **already in the browser**, handed to the dashboard when the
  store page loads, so offering the keys costs no fetch and no index field. The rejection
  stands for what it named: a control that owns a scope of its own.
- **Narrow the index before grouping.** Not rejected but not needed: the narrowing is a
  `continue` in the scan `searchStore()` already runs, before the grouping, and the grouping
  is still ticket 81's `repeatsInStore()`. There is no second answer here to what a repeat
  is.

## Consequences

- The scan gains one comparison per entry, and it can leave early on a page mismatch, so a
  scoped query is cheaper than the unscoped one it narrows. No dependency is added and none
  is needed. `web/probes/probe-search-index.mjs` was re-run because the scan changed, on the
  `nl` store — 3,832 findings over 124 pages, medians of 20 runs:

  The rows are quoted under the labels the probe itself prints, so its output and this table
  read alike:

  | query | median | hits | pages | repeats |
  | --- | --- | --- | --- | --- |
  | `e` — matches nearly every entry | 18.12 ms | 3,825 | 120 | 2,641 |
  | `zzzqx` — matches nothing | 2.38 ms | 0 | 0 | 0 |
  | `/carport` — one page, bare scope | 0.65 ms | 133 | 4 | 131 |
  | `/e` — the widest scope an editor would type | 9.29 ms | 3,556 | 111 | 2,458 |
  | `/carport` + the largest repeat — scope and words | 0.47 ms | 1 | 1 | 1 |
- `searchStore()` returns `scope` beside its counts. It rides on the result and not on a
  repeat, for the reason `fields` rides on the repeat and not on its pages: `view.test.mjs`
  pins what a repeat's pages hold. `Search.jsx` reads it off the answer and never parses the
  term a second time — one string, one parse, and no second copy of this rule to drift.
- **The header is drawn on one matched page as well as on several.** The ticket asks for it
  on a multi-match, which is the case that can lie; but *1 page in /afhalen* is the same
  true sentence and the alternative is a header that appears and disappears as an editor
  types. It is the by-page reading of the term under a scope, which is why the by-name block
  is not drawn there — that block asks the same question under a different sentence, and two
  lists of the same pages would disagree about which was asked.
- **The header promises a list only when there is one.** A scope can reach pages and find no
  open difference on them, and *the differences below are the ones on these pages* printed
  above *no difference with these words* contradicts the sentence under it. The matched pages
  are still named — they are still what the scope reached, and still worth opening.
- No count, bar or denominator moves. A scope narrows what is on screen, in the same manner
  as the class filter and the term itself.
- **Cross-store search stays impossible.** A scope narrows within a store, and ticket 38
  settled that there is no all-stores surface.
- The four kinds of empty answer are ticket 104's, not this one's. Here, nothing found says
  nothing found.
- ~~The notes half is not scoped yet. `searchNotes()` still reads the term as typed, so
  `/downloads` searches the notes for those literal characters. That is ticket 105.~~
  *Amended 2026-08-17 by ticket 104 part B* — ticket 105 was absorbed into 104 when nine
  tickets over one search box became five, so the work is there and not under its own number.
  The notes half **is** scoped: `searchNotes()` runs the same `parseTerm()` and the same
  `inScope()` the findings half runs, over the page each event was **written on**. The
  sentence above understated what it left behind — reading the term as typed did not merely
  leave the notes unscoped, it matched them against the slash, so the notes half of a scoped
  search answered with nothing at all.
