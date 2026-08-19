# 129 — A hint is reachable without a mouse, on every surface

Type: task
Status: ready-for-agent
Blocked by: None — can start immediately.
Parent: ../map.md

## If you are building one part, read only that part

**This ticket is two sessions.** Read this heading block, then **your part and nothing
else** — its reading list, its criteria, its traps. **Do not plan across both parts.** Each
part is one commit and starts in a fresh context window.

| part | what | files |
|---|---|---|
| **A** | The dashboard, and the pattern | 5 |
| **B** | The other surfaces, and the guard | 8 |

**A establishes the pattern; B applies it.** B is blocked by A in substance, not just in
order: there is no second design in B.

### Gate, every part

```
npm test && npm run lint && npm run build
```

> **Merged 2026-08-17.** This ticket absorbed **130**. One pattern, one primitive, one guard,
> and the guard cannot pass until every surface has moved — which is exactly the shape ticket
> 124 ruled on: *a half-Dutch application is worse than either end state, and the guard cannot
> pass until the labels are done, so the split is a commit per area and not a second ticket.*
> 130's own words make the same case against itself — *the same shape means two different
> things depending on which screen it is on* — and it moves no count.
>
> **130's stated reason for the split was a context window, not a principle**, and it says so.
> That reason is honoured: the two parts are **two commits landed in two passes**, and part B
> may be a second session. The filename keeps 129's slug so inbound links still resolve.
>
> **Restructured 2026-08-17.** Traps moved under their own part and each part gained a
> reading list, after ticket 104 part A cost 180k tokens finding a seam its ticket named no
> paths for. No criterion and no trap was changed, added or dropped — except the screenshot
> clause, struck in place below with its reason.

## The subject, shared by both parts

Every hover hint in the log reaches an editor who is not holding a mouse. Every one of them
is a native `title` attribute, and a `title` is invisible on a touch screen, unreachable by
keyboard, unstyleable, and announced unreliably by screen readers. The `Tooltip` primitive
has been installed since ticket 74 at `web/src/components/ui/tooltip.jsx` and **has no
importer anywhere** — verified again on 2026-08-17, still zero.

That is the largest undocumented gap in the interface: **11** real `title` attributes over
**9 files** against a primitive with zero imports, and no comment anywhere acknowledging the
choice.

> **Re-counted 2026-08-19, by the audit of every open `ready-for-agent` ticket.** This ticket
> said **36**. The tree holds 13 `title=` occurrences in `web/src`, and two of them are
> `<Shell title="...">` component props rather than DOM tooltips, so the real figure is **11**:
> `Annotate.jsx:350,372`, `Annotations.jsx:121`, `BulkControl.jsx:382`, `Chips.jsx:336`,
> `Dashboard.jsx:484,983`, `RecordLayout.jsx:158`, `Repeats.jsx:611`, `SearchBox.jsx:146,202`.
> The argument is unchanged — a hint a touch user cannot see is a hidden hint, the primitive is
> installed and unused, and the guard is what makes it stick — but the *cost* is a third of
> what was written, and so is the case for splitting it into two sessions. Re-price part B
> before starting: 11 attributes over 9 files is plausibly one sitting. Several
comments discuss "the tooltip" as a designed thing — the caller owning the tooltip that names
the unit, the tooltip that keeps two rows apart, the tooltip that says what each view
answers — while the thing they describe is an attribute the browser draws however it likes.

ADR 0007 bought this dependency for exactly this reason. Its own case for taking the library
is the accessibility work the interface was not doing, and `title` is the textbook example.

**It adds JavaScript, deliberately, and that is worth stating.** A `title` costs nothing and a
`Tooltip` is Base UI with positioning behind it. The CSS-only replacements — the Popover API,
anchor positioning, `interestfor` — are all refused by 127 for years yet. The trade is
accepted because "zero JavaScript" was never the goal: a hint a touch user cannot see is not
a cheap hint, it is a hidden one.

### There are no screenshot baselines in this repo — 2026-08-17

Both parts' screenshot criteria are struck below, and this is why. Verified on 2026-08-17:
**no screenshot matcher is called anywhere** outside `node_modules`, `git ls-files` returns
**zero** committed images, and `.gitignore`'s last entry is `__screenshots__/` with the
comment *"What the browser vitest project writes when a **test fails**. It is an artefact of
one run, not evidence."* Local `__screenshots__/` directories exist under
`web/src/components/` and `web/src/lib/`, and they are failure artefacts, not baselines.

So *"the baselines are unchanged"* is not a check anybody can run. **The claim it was
reaching for survives** — a hint must not move a layout — and it is checked the way this repo
actually checks things: the browser suites that exist, plus a human looking at the screen.
Visual regression testing is a real gap and wants its own ticket; it is not this one's job.

---

## A — The dashboard, and the pattern

### Reading list — A

Read these and nothing else. If you need more, the ticket is wrong: say so and stop.

- `web/src/components/ui/tooltip.jsx` — the primitive, 53 lines, exporting `Tooltip`,
  `TooltipTrigger`, `TooltipContent`, `TooltipProvider`. Zero importers today
- `web/src/components/Dashboard.jsx` — DOM `title=` at `:323` (bucket pill), `:335`, `:338`,
  `:342` (counts), `:382` (search input), `:695` (bucket strip head), `:735` (select-all
  checkbox), `:752` (view-switch segment)
- `web/src/components/Chips.jsx` — DOM `title=` at `:28` (`Chip` forwards its prop to
  `Badge`), `:41` (class pill `info.meaning`), `:86` (`ClassFilterPills` per pill), `:129`
  (priority chip), `:166`
- `web/src/components/Repeats.jsx` — DOM `title=` at `:392`, `:473` (select-all), `:543`
- `web/src/components/Dashboard.browser.test.mjs` — where the reach assertions go

**Do not convert these — `title` is a component prop, not a DOM attribute.** Declared at
`Chips.jsx:26` (`Chip({ …, title })`), `Chips.jsx:58`
(`ClassFilterPills({ counts, selected, onToggle, title })`) and `Dashboard.jsx:862`
(`Aside({ id, title, note, children })`, which renders it as an `<h2>` at `:869`). The four
prop-passes are `Dashboard.jsx:357`, `:602`, `:615`, `:632`. Also prop-shaped and out of
scope: `ContentView.jsx:268`, and `Shell title=` in `web/src/pages/index.astro:16`,
`web/src/pages/[store]/index.astro:42` and `web/src/pages/[store]/[...page].astro:23`.

### What to build — A

The dashboard is done first because it holds the largest share of the hints and the widest
variety of them — a hint on a pill, on a column head, on a checkbox, on a count — so a
pattern that survives the dashboard survives everywhere.

- [ ] A hint on the dashboard is reachable by keyboard and announced, and it is drawn by the
      primitive rather than by the browser's own box.
- [ ] The pattern is established once — how a hint is attached, what it does to the control's
      accessible name, and how a hint on a disabled or read-only control behaves — so part B
      is an application of it and not a second design.
- [ ] A hint never becomes the control's only accessible name. A control whose meaning lived
      in its `title` gets a real label, and the hint says the extra thing.
- [ ] Hints that are decoration rather than meaning are identified and left as they are, or
      removed. This does not promote a nicety into a component.
- [ ] The words are unchanged. This is about reach, not copy, and ADR 0014 already fixed the
      language.
- [ ] Browser tests assert reach and not markup: a hint is available to a keyboard user and
      carries its text. The assertion is about what a reader can get to.
- [ ] ~~The dashboard's screenshot baselines are reviewed for layout movement.~~ —
      **2026-08-17: there are no baselines; see the heading block.** The claim survives:
      `Dashboard.browser.test.mjs` and `Repeats.browser.test.mjs` pass unchanged except where
      this part deliberately changed them, and a human confirms no row grew. A tooltip trigger
      inside a table cell can change a row's height, and that is a real change to look at
      rather than accept.
- [ ] No `title` attribute is left on the dashboard carrying meaning an editor needs.

### Traps — A

- **A tooltip is not a place to put something an editor must read.** If the hidden text is
  required to act, the text belongs on screen. Moving an essential sentence from a `title`
  into a `Tooltip` makes it reachable but keeps it hidden, and some of these 11 hints are
  carrying more than a hint.
- **Do not wrap a `title` in a `Tooltip` and leave both.** The browser will draw its own box
  over the primitive's, and a reader gets the same words twice in two shapes.
- Do not reach for the Popover API, anchor positioning or `interestfor` as a CSS-only route.
  All three are refused by 127, and the unguarded fallback for the Popover API renders the
  content inline and always visible, which is worse than the problem.
- A hint attached to a checkbox must not swallow the press. The tri-state select-all controls
  already answer a mixed press by clearing, and that behaviour is pinned; a trigger wrapped
  around the wrong element breaks it.
- The four `title` **props** are not DOM attributes and are not this part's subject. The
  reading list names them; do not convert them.

---

## B — Every other surface, and the guard

### Reading list — B

Read these and nothing else. If you need more, the ticket is wrong: say so and stop.

- `web/src/components/ContentView.jsx` — DOM `title=` at `:277`, `:356`, `:500` (`:268` is
  the prop, leave it)
- `web/src/components/Diff.jsx` — `:199`, the copy-button hint whose flash 128 moved to CSS
- `web/src/components/Ledger.jsx` — `:511`
- `web/src/components/OverrideControl.jsx` — `:114`, `:171` (the tri-state checkbox hint)
- `web/src/components/Annotate.jsx` — `:55`, `:210`, `:247`, `:300`
- `web/src/components/BulkControl.jsx` — `:141`, `:169`, `:203`
- `web/src/components/Annotations.jsx` — `:54`, `:77`, `:101`
- `web/src/interface-language.test.mjs` — the guard to model on: a static stopword sweep,
  `STOPWORDS` at `:28`, walking the drawn extensions with `readdir`/`readFile`, excluding
  `*.test.mjs` and itself

**Eight files, not six.** `web/src/components/StoreSwitcher.astro:28` carries a DOM `title=`
that this ticket's prose never named — found 2026-08-17. It is in scope: the criterion says
*anywhere in the interface*. If the pass runs long, the natural halves are
Ledger/OverrideControl/Annotate/BulkControl, then ContentView/Diff/Annotations/StoreSwitcher.

### What to build — B

The rest of the log's hints follow the dashboard's, so an editor learns one behaviour and it
holds wherever they are. With part A alone the dashboard's hints are reachable and the others
are not, which is worse than either state on its own: the same shape means two different
things depending on which screen it is on.

Each is an application of part A's pattern. **Nothing here is a new decision.**

**Land this as its own pass, and possibly its own session.** Eight files, two dozen hints and
several browser suites do not fit one context window beside the work of establishing the
pattern, and a refactor that runs out of room half-finished is worse than one that lands in
two passes.

- [ ] Every hint on the content view, the diff, the ledger, the override control, the annotate
      bar, the bulk control, the search result and the store switcher is reachable by keyboard
      and announced.
- [ ] The pattern is part A's, unchanged. If a surface cannot follow it, the reason is a
      comment in that file and not a second pattern.
- [ ] No `title` attribute carrying meaning is left anywhere in the interface.
- [ ] A guard fails if a `title` attribute returns to a component. `interface-language.test.mjs`
      is the shape to follow — a static sweep over the drawn extensions, `ui/` included,
      because a primitive that starts writing a `title` is exactly the day a guard that
      trusted `ui/` cannot see.
- [ ] ~~Screenshot baselines are reviewed per surface, not accepted in bulk.~~ —
      **2026-08-17: there are no baselines; see the heading block.** The claim survives: the
      browser suites pass per surface, and a human looks at the diff cells and the content
      view rows, which are where a trigger is most likely to move a layout.
- [ ] The words are unchanged, per part A.

### Traps — B

- **The diff's copy button is the delicate one.** Its hint sits on a control whose flash 128
  moved into CSS, and wrapping it changes what the animation is attached to. Check the flash
  still runs after the swap.
- The override control's hint explains a tri-state checkbox — one of the two places the mixed
  press is answered by clearing. Do not let a trigger take the press.
- A hint inside a `CollapsibleTrigger` must not become a button inside a button. The repeats
  queue already met that failure once, when a checkbox was put inside the trigger, and its
  comment records that it is neither valid nor clickable.
- Do not extend the guard to the `title` **props**. They are component props, not attributes,
  and a guard that cannot tell them apart will be switched off by whoever it first annoys.
  Part A's reading list names all of them.

---

## Traps — the merge itself

- **The guard lands with part B and not before.** A guard added in part A fails the moment it
  is written, because the other surfaces still hold their attributes. This is why the two
  parts are one ticket: the guard has no ticket of its own to belong to.
- **Two commits, and two passes if the context asks for it.** Merging the tickets did not
  merge the work. If part B runs out of room, stop at a reviewed half rather than rushing to
  finish.
