# 66 — Rename `TextElement` to `ContentUnit`, and change no behaviour

**What to build:** the contract, the code and the tests speak of a **content unit**.
No number moves.

The word is changing because the thing is changing. Ticket 67 makes a unit fold the
links inside it, so it stops being one HTML element and becomes the block an editor
edits. `CONTEXT.md` already calls the concept a content unit in two places, and the
committed exclusion list for pages has used the phrase since ticket 19.

This ticket goes first and alone, so that ticket 67 is a change of behaviour and
nothing else. A rename mixed into a behavioural change hides the behavioural change
in the diff, and this one rebuilds every report.

Blocked by: None — can start immediately.

Status: resolved 2026-08-07

**Origin:** the grilling of 2026-08-07 on the content unit, question 1.

- [x] The contract names `ContentUnit`. The field names inside it do not change.
- [x] The crawl, the comparison, the web build, the tests and the probes use the new
      name. No module keeps a local synonym.
- [x] `CONTEXT.md` and the ADRs are already written; check the code agrees with them.
- [x] **Every count and every finding id is identical before and after.** This is a
      move, not a change. If a number moves, something behavioural came in with the
      rename and must come out.
- [x] The tests pass without a fixture changing meaning.

## Resolved, 2026-08-07

The typedef `TextElement` is `ContentUnit`, and the extractor's `textElement()` is
`contentUnit()`. Those two are the whole of the name. The rest of the work was the
**synonym**: 25 files called a unit an "element" in prose, in a local variable, in a
test factory or in a React prop, and the word "element" must now mean the HTML
element and nothing else. `crawl/extract.mjs` shows why the distinction earns its
keep: two comments there say the chrome list "removes no *element*", and that is
still the right word, because the sentence is about a selector and a `<style>` tag.

**No field name moved.** `PageExtract.elements` is still `elements`, so every report
on disk keeps its shape. That is why a collection is still `elements` where it is the
contract field, while one of them is a `unit`.

**Nothing moved at all.** All 448 reports were rebuilt and compared against the
build from before the rename, ignoring only `observationId` and `builtAt`, which
every run mints fresh: **0 reports differ.** 34,559 findings, 33,074 rows and 34,559
distinct finding ids on both sides, **0 ids lost and 0 gained**.
288 tests green, none of them new and no fixture edited —
only the words in the test names and the name of the factory that builds a unit.
The corpus total stands where ticket 62 left it.

### Two decisions the ticket did not give

**The contract says what it is not yet.** `CONTEXT.md` and ADR 0002 describe a unit
that folds its inline links, and the code does not fold. The name arrived one ticket
before the rule, deliberately. So the `ContentUnit` typedef states it plainly: "the
unit is still one leaf element here, so an inline `a` still breaks the block that
holds it. Ticket 67 makes it fold." A contract that reads ahead of its code is worse
than one that admits the gap. Ticket 67 deletes those two sentences.

**The interface said "elementen" to the editor, and now says "blokken".** The page
header and the dashboard row both printed a count of units in Dutch under the retired
word. `CONTEXT.md` retires "text element" without giving the Dutch, so this takes
ADR 0002's own word — a content unit is "the block an editor edits" — and renders it
`blokken`. No count moved; only the noun beside it. Overrule it in ticket 68, which
owns the content view.

### Found while resolving

**The probes are evidence and were renamed anyway.** `AGENTS.md` says
`crawl/probes/` holds one-time measurements kept for their numbers. Two prose
comments in `prototype-parity-data.mjs` said "text element". The ticket names the
probes, so they were changed; no number in a probe was touched, and its
`extractElements()` function keeps its name, because the probe measures what it
measured.
