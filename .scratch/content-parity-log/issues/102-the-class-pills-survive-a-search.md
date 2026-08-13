# 102 — The class pills survive a search

Type: task
Status: resolved — built on branch `the-class-pills-survive-a-search`.
Blocked by: None — can start immediately.
Parent: ../map.md

**What to build:** an editor filters the store to one class, types a term, and the filter
is still on. Today typing switches the class pills off entirely — the pills disappear,
the amber strip disappears, and the search answers over every class as though no filter
had ever been set. The editor's answer to *which kind of difference am I working on* is
silently discarded the moment they ask a second question.

After this, a search narrows within the filter. The pills stay visible and usable while
searching, the amber strip stays up, and the result set is what the term and the classes
agree on.

This is the bypass 36 and 12 already named. It is worth doing on its own merits, and it
is also what makes 106 cheap: a scope chip has nowhere to live until the strip survives a
search.

- [x] The class pills remain visible and operable while a term is in the box.
      *They were never hidden* — the ticket reads worse than the code was. `ClassFilterPills`
      is outside the `!searching` guard and always was; pressing one wrote the selection to
      the URL and changed nothing on screen. So this was a control that answered and was
      ignored, which is the same defect wearing a worse face. Its tooltip now says what a
      press does under a search rather than under a view that is not on screen.
- [x] Search results are narrowed by the active classes. `searchStore()` takes `classes`
      and the dashboard hands it the pills. The by-name block under the result is narrowed
      too — it is the by-page reading of the same term, so it answers the same filter.
- [x] The amber strip stays up while searching. It is drawn inside `Search`, because its
      denominator is a count of the result and only that component holds one. The sentence
      is now one `ClassFilterBanner` for all three lists, so the words cannot drift.
- [x] *Filter wissen* clears the classes and hands back nothing else. The term is not the
      strip's to touch — that is 106's business, and only for a scope.
- [x] Changing the class selection re-answers the same term: the pills are in the memo's
      dependencies, so no retype.
- [x] With no classes selected the answer is what it was. `repeatsWithClasses([])` returns
      the list it was given, and a test pins the two calls equal.
- [x] The narrowing runs through `repeatsWithClasses()` and `pagesWithClasses()` — the two
      derivations the views already narrow by. Search owns no idea of what a class is.
- [x] No count, bar or denominator moves. The result's own two numbers are counted off the
      **narrowed** list rather than the wider bucketing, so no line disagrees with the rows
      under it, and `matchedRepeats` — the strip's denominator — is a count of the result
      and not of the store.

## Traps

- **One filter, not two.** The classes are the filter; the term is a search. Composing
  them must not turn the term into a second thing that appears in the amber strip — that
  arrives deliberately in 106, for the scope, and not by accident here.
- The *inclusief afgesloten* option is search-only and stays that way. It is not a class
  filter and does not belong in the strip.
- Search results group by repeat first and then by page. Narrowing by class must not
  quietly regroup them.

## Answer

**Built 2026-08-13.** The classes reach `searchStore()`, which applies them through
`repeatsWithClasses()` — ticket 81's derivation, the one the two views already narrow by —
**after** the grouping and never before it. After, because a search row is a repeat and has
to stay one: narrowing the index entries first and grouping the survivors would be a second
place in the codebase deciding what a repeat is. It is safe to narrow late because a
repeat's key holds its class, so every member of one shares it and no repeat is ever
half-filtered. The trap about regrouping is answered by not touching the grouping at all.

**The pills were never hidden, and the ticket's premise is half wrong.** `ClassFilterPills`
sits outside the `!searching` guard and always did. What a press did while a term was typed
was write the selection to the URL and change nothing on screen — a control that answers and
is ignored, which is the same defect wearing a better face. The visible half of the report
was true: the amber strip *was* behind `!searching`, and the result *did* answer over every
class.

**The strip is drawn inside `Search`.** Its denominator is a count of the result, and only
that component holds one, so the alternative was lifting a search result into the dashboard
to render one banner. The sentence itself moved into `ClassFilterBanner`, which all three
narrowed lists now read from — the page list, the differences list and a search — because
"says what it says everywhere else" is a promise three copies of a sentence cannot keep.
`searchStore()` returns `matchedRepeats` for the *van* half: what the term found before the
pills cut it, so the strip describes the filter and not the term.

**The by-name block is narrowed too**, through `pagesWithClasses()`. It is the by-page
reading of the same term, so it answers the same filter. It reads the snapshot's
`summary.byClass` and not the log — a page whose only `copy` finding is already dismissed
still lists under a `copy` pill — which is exactly how the page list behaves, and a version
that read the log would hide the clean pages that block exists to keep reachable.

**Two things this deliberately did not do.** The term stays out of the strip: it becomes a
filter in [106](106-the-scope-is-a-filter-and-says-so.md), for the scope, and letting it in
here by accident is the trap. *Inclusief afgesloten* stays out for the same reason it always
was — it says what counts as a result, not what is on screen.

**One gap, named rather than fixed.** While the index is still being fetched, and on the
error paint, `Search` returns early and no strip is drawn. Neither branch draws a list, so
there is nothing on screen to misread as whole; a strip with no numbers over a *Zoekindex
wordt geladen…* line would have to invent a second sentence, and the drift is the worse
trade. If the fetch ever becomes slow enough to read, this is the thing to revisit.

Tests: seven in `web/src/lib/search.test.mjs` over the derivation, and four in the new
`web/src/components/Search.browser.test.mjs`, which mounts the component and stubs the one
seam that is a fetch. The composition was the defect — nothing was wrong with a pure
function — so the strip is read off a real screen and *Filter wissen* is pressed.
