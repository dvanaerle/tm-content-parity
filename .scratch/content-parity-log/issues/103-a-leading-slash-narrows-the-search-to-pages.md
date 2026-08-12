# 103 — A leading slash narrows the search to pages

Type: task
Status: ready-for-agent
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

- [ ] `/downloads` on its own returns the repeats on that page — repeat-shaped, like
      every other search result.
- [ ] `/downloads knop` returns the repeats on that page whose searchable text holds the
      second term.
- [ ] A slash that is not in first position is matched literally, and searching for a term
      that contains one still works exactly as it does today.
- [ ] The key is matched by substring, so a scope that matches several pages returns all
      of them merged into one repeat list.
- [ ] A multi-match result says which pages it matched, as a header over the one list.
- [ ] Parsing a term into its scope and its text is a pure function, tested apart from
      matching.
- [ ] `CONTEXT.md` gains **Page scope**.
- [ ] ADR `0010` records the decision, including why the reasoning it overturns held for
      everywhere but first position.
- [ ] No search dependency is added, and the index probe is re-run if anything about the
      scan changes.
- [ ] No count, bar or denominator moves.

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
