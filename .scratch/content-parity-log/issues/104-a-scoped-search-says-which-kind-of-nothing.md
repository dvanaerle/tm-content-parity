# 104 — A scoped search says which kind of nothing it found

Type: task
Status: ready-for-agent
Blocked by: 103
Parent: ../map.md

**What to build:** an editor scopes to a page and gets nothing back, and the screen tells
them **which** nothing it is. There are four, and today they are one blank:

- **No such page.** The scope matches no key. A typo, and the answer is to try again.
- **The page has one side.** It exists, it is in the store, and it is in the *Eenzijdige
  pagina's* aside — but one side did not answer, so it is not compared and it is not in
  the index. Search returning silence here is search contradicting the page list on the
  same screen.
- **The page is clean.** Compared, and nothing is wrong with it. This is the answer an
  editor most wants and the one currently indistinguishable from a typo.
- **The second term matched nothing.** The page is fine, the scope is fine, the word is
  not on it.

All four are answerable from data the browser already holds when the store page loads:
the full page list, each entry carrying whether it is comparable and why not. Nothing new
is fetched and the index needs no new field.

A parity tool that cannot tell *clean* from *I don't know* is arguing against its own
purpose. This is also what makes a scope useful as a spot-check, which is the most likely
way anyone will actually use it.

- [ ] A scope matching no page key says so, and says it differently from a page that
      matched.
- [ ] A scope matching a one-sided page says the page exists, gives the reason the
      comparison did not run, and points at where one-sided pages are listed.
- [ ] A scope matching a compared page with no shown findings says the page is clean.
- [ ] A scope matching a compared page that has findings, with a second term matching none
      of them, says the term found nothing on that page.
- [ ] Which of the four applies is decided as a value in the search module and returned to
      be rendered. The component classifies nothing.
- [ ] Each of the four is pinned by its own test at the existing search seam.
- [ ] A scope matching several pages of mixed kinds — one clean, one one-sided — does not
      collapse to a single verdict.
- [ ] No new fetch, no new index field, no change to what the build emits.
- [ ] No count, bar or denominator moves.

## Traps

- **Clean and unindexed are not the same.** A compared page with no shown findings
  contributes no index entry at all, so absence from the index proves nothing on its own.
  The page list is what distinguishes them.
- The count of indexed pages is a **number**, not a list of keys, and it counts only
  compared pages. It cannot answer any of this. The load-time page list can.
- Do not invent new copy for the one-sided case where the aside already has language for
  it. Two names for one situation is how a vocabulary rots.
