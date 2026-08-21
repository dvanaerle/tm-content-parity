# 02 — Three views stop sharing one file

Type: task
Status: ready-for-agent
Written: 2026-08-21
Decided in: the grilling of candidate 2, 2026-08-21
Blocked by: 01. It touches `Repeats.jsx`, `Search.jsx` and `Dashboard.jsx`, which is 01's whole
blast radius.

**What to build:** nothing an editor can see. `web/src/lib/view.mjs` holds four unrelated
groups behind 26 exports, and this ticket ends that: the content view, the repeat list and the
narrowing helpers become three modules, and the handful of exports that belong to a vocabulary
another module already owns go and live there. **No behaviour changes and no function body
changes.** The next ticket is the interesting one, and it is reviewable only if this one is
boring.

**Why it is its own ticket.** A move that must alter nothing and an interface change that alters
where a rule is enforced are two different reviews. Put together, the three-function change
hides inside eleven import edits and 1,619 moved test lines.

## What moves where

- **`content-view.mjs`** — the twelve exports `ContentView.jsx` and `SiblingView.jsx` read:
  `prepareRows`, `collapses`, `collapsedKeys`, `collapseRuns`, `runKeyHolding`, `collapseState`,
  `rowKeyFromHash`, `outlineFrom`, and the filter constants they use.
- **`repeat-list.mjs`** — the repeat exports: `repeatsInStore`, `repeatsWithClasses`,
  `repeatsWithWorkLeft`, `repeatsByOpenWork`, `groupRepeatsByClass`, `classCountsByOpenWork`,
  `findingsIn`.
- **`filter.mjs`** — the narrowing helpers imported by six modules that have nothing else in
  common: `NO_FILTER`, `isNarrowed`, `toggleIn`, `toggleClass`, `classIsOn`, and `classCounts`,
  which is a pill-ordering rule and belongs beside them. **Filter** is a glossary term, so the
  file names something the domain already names.
- **`classes.mjs`** (existing) — `spansEveryStore`, which is `FINDING_CLASSES[cls]?.check` in a
  set and has been living one module away from the check vocabulary, and `allDiagnostic`, which
  is a sentence about visibility drawn by two surfaces.
- **`language-blocks.mjs`** (existing) — `storesOf` and `crossesStore`, beside `blockOf` and
  `siblingOf`.
- **`view.mjs` is deleted.** Keeping the name for the largest cluster would leave a file called
  *view* holding one of three views, which is the ambiguity this ticket is about.
- **`pagesWithClasses` and `pagesWithPriorities` go to `filter.mjs` too**, and stay exported.
  They are narrowings of a list — by classes, and by priorities — which is what that module is
  for, and it is where a reader would look for them today. Ticket 04 takes them from there and
  makes them the page queue's implementation. That is one extra move of two functions, and it
  buys this ticket staying a pure regrouping: no module is created here that nobody calls.

## Tests

`view.test.mjs` splits into `content-view.test.mjs`, `repeat-list.test.mjs` and
`filter.test.mjs`. **Cases move verbatim.** One file importing three modules is refused: a test
file is its module's witness, and a shared one hides which module a failure belongs to.

- [ ] The four groups live in `content-view.mjs`, `repeat-list.mjs`, `filter.mjs`, and the two
      existing vocabulary modules named above.
- [ ] `view.mjs` and `view.test.mjs` no longer exist.
- [ ] All eleven importing modules import from the new homes. No re-export barrel is left behind
      — at eleven call sites, expand–contract buys nothing.
- [ ] `pagesWithClasses` and `pagesWithPriorities` are exported from `filter.mjs`, with their
      bodies untouched and both importers updated.
- [ ] No function body is edited. A diff of any moved function against its old form is empty but
      for its import lines.
- [ ] The three new test files together hold every case the old one did, unrewritten.
- [ ] `oxlint` and the full test suite pass.
