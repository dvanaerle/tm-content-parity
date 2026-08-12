# 107 — Typing a slash offers the page keys

Type: task
Status: ready-for-agent
Blocked by: 103
Parent: ../map.md

**What to build:** an editor types `/` and the box offers the store's page keys,
narrowing as they keep typing. Without this, page scope is a feature only someone who has
read the source can use.

The keys are not guessable. They are opaque strings carrying store prefixes and
parentheses — `(home)`, `(be)pergola`, `faq/productinformatie` — and no editor is going
to produce one from memory. An autocomplete is not a convenience here; it is the
difference between a usable feature and a hidden one.

It costs nothing to source. The full page list arrives in the browser when the store page
loads, well before the search index is fetched, so the suggestions are available from the
first keystroke — including for pages the index does not contain.

- [ ] Typing `/` as the first character offers the store's page keys.
- [ ] Continuing to type narrows the suggestions by the same substring rule the scope
      itself uses, so what is offered is what would match.
- [ ] Choosing a suggestion puts that scope in the box, leaving any second term intact.
- [ ] The list is keyboard-navigable and dismissable without leaving the box.
- [ ] Suggestions are available before the search index has been fetched.
- [ ] One-sided pages are offered, and are marked as such — they are exactly the pages an
      editor cannot otherwise reach through search, and 104 explains what they get.
- [ ] A slash typed anywhere but first position offers nothing, matching 103's rule.
- [ ] Choosing a suggestion is not required — a scope typed out by hand behaves
      identically.

## Traps

- **Suggesting only indexed pages would hide the clean pages and the one-sided ones**,
  which is most of what a spot-check is for. The list is every page in the store.
- The count of indexed pages is a number, not a list. It cannot feed this.
- Do not fetch the index to populate suggestions. The index is large and arrives on the
  first keystroke for a different reason; the page list is already in memory.
