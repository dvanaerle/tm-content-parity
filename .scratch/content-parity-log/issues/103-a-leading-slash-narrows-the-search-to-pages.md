# 103 — A leading slash narrows the search to pages

Type: task
Status: resolved — built on `main`.
Blocked by: None — can start immediately.
Parent: ../map.md

**What to build:** an editor types `/downloads` and sees the repeats on that page, and
nothing from the pages whose text merely happens to hold the word "downloads". They type
`/downloads knop` and see the repeats on that page whose words hold *knop*. A leading
slash stops being an ordinary character and becomes a **page scope**.

Today a page key is already searchable, so typing `downloads` does return that page's
findings — mixed with every text hit for the same word. The scope is what separates *the
page* from *the word*, and it is what makes searching within one page possible at all.

The slash is a scope marker **in first position only**. Anywhere else it stays an
ordinary character, because a page key can hold one — `faq/productinformatie` is a key,
and `/faq/productinformatie` is that key scoped. Matching is a substring against the key,
consistent with every other field in this search, which is what lets `/faq` reach the
family and `/home` reach `(home)` and `/pergola` reach `(be)pergola` without a single
special case. A scope may therefore match several pages, and often does.

This ticket carries ADR `0010`, which records the position-0 rule, substring rather than
exact matching, and why this is not the first step toward a query language. It also adds
the **Page scope** entry to `CONTEXT.md`.

- [x] `/downloads` on its own returns the repeats on that page — repeat-shaped, like
      every other search result. It reports its hit under the **page** field, which is the
      one field the editor typed.
- [x] `/downloads knop` returns the repeats on that page whose searchable text holds the
      second term. The words are matched by `matchedFields()` untouched: the scope is taken
      off the term before anything is matched, so the six fields answer exactly as before.
- [x] A slash that is not in first position is matched literally, and searching for a term
      that contains one still works exactly as it does today. `faq/product` and
      `/faq/product` reach the same page, and the second is one scope and never two.
- [x] The key is matched by substring, so a scope that matches several pages returns all
      of them merged into one repeat list. The grouping is untouched — `repeatsInStore()`,
      as everywhere else.
- [x] A multi-match result says which pages it matched, as a header over the one list.
      `Scope` in `Search.jsx`, drawn from the store's **whole** page list and not from the
      index, so a page with no open finding is named there too.
- [x] Parsing a term into its scope and its text is a pure function, tested apart from
      matching. `parseTerm()`, with `inScope()` beside it; eight cases over the parse and
      two over the predicate, with no index in sight.
- [x] `CONTEXT.md` gains **Page scope**.
- [x] ~~ADR `0010`~~ **ADR `0016`** records the decision, including why the reasoning it
      overturns held for everywhere but first position. `0010` was taken by *the dashboard
      screen is the URL* before this ticket was written, and ADR 0014 already amends it; the
      new file says so in its first paragraph.
- [x] No search dependency is added, and the index probe is re-run if anything about the
      scan changes. The scan changed — one comparison per entry, and the one term that
      leaves early — so the probe gained three scoped queries and was re-run. The numbers
      are in the ADR.
- [x] No count, bar or denominator moves.

## Traps

- **A scope is not a page filter on the report.** It narrows the corpus a search runs
  over; it does not open a page. A page name in a result still opens the whole content
  view and never a fragment of it — `docs/adr/0006-the-content-view-is-the-spine.md`.
- **The bare scope must not become a second content view.** `/downloads` lists that
  page's **repeats**. The ledger reading of a page has one home and this is not it.
- The four kinds of empty answer are **104**, not this ticket. Here, nothing found says
  nothing found.
- Cross-store search stays impossible. A scope narrows within a store, and 38 settled
  that there is no all-stores surface.
- Matching on the key must not split on a slash — the trap 82 recorded. Position-0
  parsing is the only place a slash is ever treated as structure.

## Answer

**Built 2026-08-14.** `parseTerm()` divides the typing and `inScope()` matches the key, and
they are two small pure functions rather than one, because the ticket asks for the parse to
be tested apart from matching and they are separately true. The scan gained one line —
`if (scope && !inScope(entry.page, scope)) continue;` — and the grouping, the class pills
and the counts below it are untouched. The scope rides back on the **result**, beside the
counts, for the reason `fields` rides on the repeat and not on its pages: `view.test.mjs`
pins what a repeat's pages hold, and which pages a scope reached is a fact about the answer.

**A slash with nothing after it is not a scope**, and that is the one rule the ticket does
not state. An empty scope is a substring of every page key, so the first keystroke of one
would answer with the whole store — a screen that appears for an instant on the way to every
scoped search. `/` stays the ordinary term it was, which still finds the keys that hold one.

**The header is drawn from the store's page list and not from the index**, which is what
keeps a capability the by-name block carries: a page with no open finding is in no result,
it is in scope, and it is often the page somebody is looking for. The by-name block itself
is **not drawn under a scope** — it would list the same pages a second time, under a
sentence asking a different question — and under an ordinary term it now reads the parsed
text rather than the raw term, which is the same string when there is no scope.

**The probe was re-run because the scan changed**, and it says the change is in the cheap
direction: on `nl`, `/carport` answers in 0.65 ms against 18.12 ms for the ceiling, because
an entry out of scope is skipped before any of the six fields is folded. That makes the
scope the one term where matching is not a constant, which is a claim the probe's own
worst-case reasoning had to be corrected for.

**Two things deliberately not done.** The notes half is unscoped — `searchNotes()` still
reads the term as typed, so `/downloads` searches notes for those characters, which is
ticket **105**. And nothing here says which *kind* of nothing was found: a scope that
matches no page draws the sentence a term with no hits has always drawn, which is **104**.

Tests: sixteen new node cases in `web/src/lib/search.test.mjs` — eight over `parseTerm`, two
over `inScope`, six over a scoped `searchStore()` — and four browser cases in
`Search.browser.test.mjs` over the header, because whether a merged list says which pages it
merged is a question only a screen can be asked.
