# 125 — A content cell says which language it is in

Type: task
Status: resolved 2026-08-20 — **a content cell declares its language and the chrome does
not**. `STORE_LANGUAGE` in `web/src/lib/stores.mjs` is the one derivation, and it is derived
rather than written out: `languageOf()` already cuts the language out of the store's hreflang
code, and a hand-written map beside it would be a second answer to *what does `be_fr` speak*.
It carries the same build guard the store names do. Every element holding scraped text
declares it — both cells of a diff, both quoted strings of a repeat row, each block of a run
cell, the heading a finding sits under, the heading jump-list — and the two tooltips that
repeat scraped text carry it on the element that owns them, which is why the copy button
declares the content's language and its own label declares `en-GB`. The page key declares
nothing in either of its two places. 1370 tests pass; no count, bar or derivation moved, and
the build's 824 pages carry `lang="de"`, `lang="fr"` and `lang="en"` on content cells with
`en-GB` on the shell.

Three things beyond the checkboxes. A **source sweep**
(`web/src/content-language.test.mjs`) holds the rule in the form it is actually stated: a
declaration is *derived, or English by name* — a `lang={…}` binding is allowed and the only
quoted language anywhere under `web/src` is `en-GB` — and `hreflang`, `xml:lang` and `locale`
are refused outright, which is what keeps a note untagged and keeps this from becoming the
seam i18n hangs on. The same sweep pins that **every** caller of the two components drawing
compared text hands the language down: these are `.jsx`, `tsc` does not check a JSX prop
here, and a caller that forgot it would have React omit the attribute and throw nothing.

And one latent defect in the derivation it reads: `languageIn()` cut a code with
`slice(0, indexOf('-'))`, which answers `d` for a region-less `de`. No code in
`HREFLANG_STORE` is region-less today, so nothing was wrong on screen — but the answer is
now written on a cell as `lang`, where `d` is a tag a screen reader would try to honour, so
it cuts on the separator instead.
Blocked by: 124
Parent: ../map.md

**What to build:** a screen reader announces a German paragraph on `/de/` as
German. Today every content cell inherits the shell's language, so a French
sentence on `/be_fr/` is read as Dutch, and after ticket 124 it is read as
English. The chrome's language and the content's language are two different
facts, and the cell carries the second one.

The store code already tells you the answer: `nl` and `be` are Dutch, `be_fr` and
`fr` are French, `de` is German, `uk` is English. That mapping does not exist in
the code yet — `web/src/lib/stores.mjs` holds display names and nothing about
language.

It reaches every place scraped text is drawn: the diff cells, the repeat rows'
two quoted strings, the anchor heading in an annotation, the heading jump-list,
and the page key where it is drawn as a heading. The page key is a Dutch url key
on every store, which is the one case where the cell's language is not the
store's.

**Why it is separate from 124.** 124 relabels chrome. This adds a fact to the
data the chrome draws, it has a different reader — somebody using a screen
reader — and it fixes a defect that predates the language decision entirely:
`lang="nl"` has been wrong on five of six stores since the shell was written.

## Decisions from triage, 2026-08-13

- **The page key carries no language, on any store.** A url key is an
  identifier, not prose. It is not tagged in the breadcrumb and it is not tagged
  in the `<h1>`, so it inherits `en-GB` from the shell and is announced in
  English. **The two must agree** — the breadcrumb's last rung and the `<h1>`
  draw the same string on purpose, and tagging one but not the other is a
  half-implementation.

  The alternative, `lang="nl"` on the heading, was refused twice over. It would
  make the one non-content element on a `/de/` page the loudest language claim
  on it, inverting this ticket's own rule that a language declaration is a fact
  about content. And writing `lang="en-GB"` on it explicitly was refused
  separately: it sounds identical to a screen reader, but it asserts that a
  Dutch slug is English, which is false, and the next reader will correctly file
  it as a bug. Omission asserts nothing, which is the true state of affairs.

  The accepted cost is stated rather than hidden: a Dutch slug read with English
  phonetics is mildly garbled. This does not contradict the `nl` decision below —
  that is about content cells, where the derivation runs. The page key sits
  outside the derivation and never asks the mapping a question.

- **A `nl` store gets the attribute explicitly**, once the shell is `en-GB`.
  Stating it is cheaper than a conditional, and a cell that declares `nl` is
  making the same kind of claim on every store.

- **The editor's notes stay untagged.** They are free text in whatever language
  the editor typed, and no fact exists to derive a language from. Saying nothing
  beats guessing.

## Acceptance criteria

- [x] A language is derived from the store code, in one place, for all six stores.
- [x] Every element holding scraped production or new-site text carries that
      language.
- [x] The chrome around it keeps `en-GB`, so the two are distinguishable to a
      screen reader in the way ticket 124's accepted regression says they are not
      distinguishable by eye on `/uk/`.
- [x] The page key carries no `lang`, in the breadcrumb or the `<h1>`, on any
      store — and a test pins that the two agree.
- [x] No count, bar or derivation moves, and no visible layout changes.
- [x] `npm test` is green.

## Traps

- **Do not tag a note.** An editor's note has no known language and guessing at
  one is worse than saying nothing.
- **This is not per-store chrome.** ADR 0014 keeps one interface language. A
  content cell declaring its language is a fact about the content, and it must not
  become the seam somebody hangs i18n on.
- **Two tooltips hold scraped text** — the diff cell repeats its text as a
  `title`, and the heading jump-list puts the full heading in one. A `title` is
  announced in *its own element's* language, so the attribute must land on the
  element that owns the tooltip. Tagging an inner span leaves the tooltip
  declaring English while the visible text declares German.
- **Do not reach for a global to get the store.** The repeat rows are the one
  surface without it in scope, and a module-level store is how a per-cell fact
  quietly becomes application state.

## Comments

**2026-08-13 — triaged.**

> *This was generated by AI during triage.*

**Verified against the codebase.** There is exactly **one** `lang` attribute in
the whole of `web/src`: `<html lang="nl">` on the shell. Nothing else declares a
language, so every scraped cell inherits it on all six stores. The claim holds
as written.

**The mapping does not exist.** `web/src/lib/stores.mjs` holds display names and
a build guard and nothing else. It is the obvious single home for the
derivation, and 124 is already editing that file — which makes `Blocked by: 124`
right rather than incidental.

**Not already implemented, and not previously rejected.** Searched for `lang=`,
`hreflang`, `xml:lang` and language-derivation-by-store-code across `web/src` and
`compare/`. No `.out-of-scope/` entry resembles this.

## Agent Brief

**Category:** bug
**Summary:** every element holding scraped store content declares the language of
that content, derived from the store code, so a screen reader stops announcing
German and French as English.

**Current behaviour.** The document declares one language on the shell and every
descendant inherits it. Before 124 that value is `nl`, which is wrong on five of
six stores; after 124 it is `en-GB`, which is wrong on five of six stores in a
different direction. Either way a French sentence on `be_fr` is announced with
the wrong phonetics, and the two facts — what language the *interface* is in and
what language the *content* is in — are not distinguishable to a screen reader.
This is WCAG 3.1.2 (Language of Parts) and it predates the language decision
entirely.

**Desired behaviour.** A language is derived from the store code in exactly one
place, and every element that draws scraped production or new-site text carries
it. The chrome keeps `en-GB`. On `uk` the two values coincide and the attribute
is still written, because a cell declaring its language should make the same kind
of claim on every store.

**Key interfaces.**

- A `STORE_LANGUAGE`-shaped export beside the existing store-name map, keyed by
  store code: `nl`/`be` → Dutch, `be_fr`/`fr` → French, `de` → German, `uk` →
  English. Give it the same build-time guard the name map has — a seventh store
  with no language should stop the build, not emit `lang="undefined"`.
- Every component that renders scraped text needs the store in scope to read
  that map. The ledger and the content view already receive the report and can
  read the store off it; **the repeat rows receive no store at all** and need it
  threaded as a prop. Search renders no snippets of its own — it hands off to the
  repeat rows, so it is fixed by fixing them.
- The reach is *the text*, not the row: the two columns of a diff cell, the two
  quoted strings on a repeat row, the anchor heading on an annotation, the
  heading jump-list, and the content-view spine.

**Acceptance criteria.**

- [x] One derivation, in one module, covering all six stores, guarded at build
      time against an unmapped store.
- [x] Every element holding scraped production or new-site text declares that
      language; the chrome around it remains `en-GB`.
- [x] The page key declares nothing, in the breadcrumb and in the `<h1>` alike,
      with a test pinning that the two agree.
- [x] Editor notes declare nothing.
- [x] No count, bar, denominator or derivation moves, and no visible layout
      change. The tests pinning that rule pass unchanged.
- [x] `npm test` is green, including 124's stopword guard.

**Out of scope.**

- **Any interface string.** ADR 0014 stands: one interface language, English.
  This adds a fact to the data the chrome draws and touches no label.
- **i18n machinery of any kind** — no catalogue, no translation affordance, no
  per-store chrome. A per-cell `lang` must not become the seam someone hangs that
  on.
- **`dir`**, RTL, or any locale formatting. All six languages are LTR.
- **The scraped content itself**, which is never edited — only framed.

**Why an agent can take this.** The decision that was holding it is made and
recorded above; what remains is mechanical breadth across a handful of
components, with a build guard and existing tests as the safety net.
