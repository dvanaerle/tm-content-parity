# shadcn on Base UI is taken for behaviour only, and the palette keeps meaning

This repo has two runtime dependencies. A shadcn install on Base UI adds about seven
packages, and it arrives with its own theme of CSS variables.

We decided to take **seven primitives and nothing else** — Dialog, Popover, Tooltip,
Select, Checkbox, Tabs, Table — and to keep `web/src/lib/palette.mjs` as the source of
truth for anything that carries meaning.

## Why behaviour, and not appearance

What the repo lacks is accessible interactive behaviour: a focus trap, a keyboard
menu, a roving tabindex, a dismiss on escape that also restores focus. That work is
subtle, it is easy to get wrong without noticing, and it is worth a dependency.

What the repo does not lack is a way to say what a finding class means. `Chips.jsx`
and `Diff.jsx` encode domain signal — a class tone, a deletion and an insertion — and
no library has an opinion about a `text-missing` on production. A test pins the token
maps. Rebuilding those two out of library parts would lose the test and buy nothing.

Two theming systems in one application is how an interface stops being coherent. So
shadcn's variables are the surface and the palette decides the tone. Where the two
disagree, the palette wins, because the palette is the one that knows what the colour
is for.

## The facts this rests on

- Base UI is the **default** primitive set for shadcn since the July 2026 changelog,
  and it is post-1.0: `@base-ui/react` 1.7.0. Radix stays supported behind
  `-b radix`, so a retreat is available.
- Astro is a documented shadcn install target, and Tailwind v4 and React 19 are both
  supported. The repo is on Astro 5.14, Tailwind 4.1 and React 19.2.
- The install needs the `@/*` alias. The repo has no TypeScript, and this decision
  does not introduce it, so a `jsconfig.json` provides the alias.
- The repo is npm. Every shadcn command in the documentation is written with
  `pnpm dlx`, and here it is `npx`.

## Amendment: shape is taken too, and tone still is not

The first reading of this decision was too narrow, and the interface showed it. With
seven primitives installed and one in use, the application still looked exactly as it
had: hand-rolled tables, three accidental button shapes, native inputs, and a dozen
panels that each redefined a border and a corner. "Behaviour only" had been read as
"behaviour and nothing else", and the result was a library carried as a dependency and
paid for in nothing.

So the line moves, and it moves once: **shadcn owns shape and structure; the palette
owns tone.** Every table, button, input, select, badge, panel, banner, divider and
empty state is a shadcn primitive. ~~Every colour that carries meaning is still a token
from `palette.mjs`, handed to the primitive through `className`.~~
— **Struck 2026-08-19, ticket 133 part C** (ADR 0023). Half of it survives and is the
half that is the decision: meaning is still ours and not the library's. The mechanism is
not. A tone is a `data-tone` attribute the element publishes and `app.css` reads, the
eight token maps in `palette.mjs` are deleted, and the primitive is handed a word rather
than a class name. ADR 0023 records the move and answers the objection to it.

This is not the rejected option below. The rejected option put shadcn's variables in
charge of what a class tone means. Here they are in charge of what a border radius is,
which is a question they can answer, and the three palette rules are untouched.

Two things follow from it and are worth writing down:

- ~~**`className` carries colour, and shadcn's own guidance says it must not.** The
  shadcn skill's first styling rule is that `className` is for layout and never for
  a component's colour, and that a status colour should be a variant. Here it is
  the opposite: `<Badge className={PILL[tone]}>` and `<Alert className={BANNER[tone]}>`
  are the normal form.~~ Shadcn's rule exists to stop a design system fragmenting into
  one-off colours. This repo has the same goal and already has a stricter mechanism
  for it — a tested palette with three rules — so the rule is met by other means.
  — **Struck 2026-08-19, ticket 133 part C**, with the sentence above it. The normal form
  is `<Badge data-wears="pill" data-tone={tone}>`, so `className` stops carrying colour
  and the tension with the library's own guidance stops existing. The two sentences that
  survive the strike are the ones that mattered: the goal, and the stricter mechanism that
  meets it — which is now a tested stylesheet rather than a tested map.
- **A variant is refused wherever it would smuggle in a hue.** `Alert` and `Badge`
  both ship a `destructive` variant. Nothing here uses it. A parity tool has red and
  green already spent on *production has this* and *the new site added this*, and
  palette rule 2 keeps them off status. Amber says look at this, and it comes from the
  `caution` tone — `attention` until **ticket 131 renamed it, 2026-08-14**, because the old
  word had a second meaning as `CONTEXT.md`'s **Needs attention**. The decision is
  untouched; only the name is. It was `BANNER.caution` until **ticket 133 part C** deleted
  the map, and it is a rule in `app.css` now; which file draws it was never this bullet's
  point.

## Second amendment: inside the carve-out, primitive first, CSS second, JavaScript last

The amendment above says what the library owns and what the palette owns, and the
consequences below carve the content-parity concepts out as permanently custom — the diff,
the page group, the repeat, the history note, the bulk selection. What none of it said is
**what to reach for inside that carve-out**, and the silence had a cost: two disclosures
that write `aria-expanded` by hand beside a third that credits `Collapsible` for writing
it, and a count mark spelled in nine utility classes that `ui/badge.jsx` already draws
almost class for class. A reader who has just learned that the diff stays custom is the
reader who needs the order, so it goes here.

Two sentences, and they are the whole of it:

- **Inside the carve-out, reach for a primitive where one fits, Widely Available CSS where
  none does, and JavaScript last.** Custom means *this repo decides what it looks like*; it
  does not mean *this repo draws it by hand*. A shape shadcn owns is a primitive even when
  the thing it is part of is ours, and a behaviour the platform has — a selector, a custom
  property, `calc()` — is not worth a state hook and a re-render. Which CSS counts as
  available is ADR 0015's question and not this one's.
- **A tone that depends on a state is a selector and not a token.** ADR 0023 records the
  move and the objection to it; the reason it belongs in the order above is that a tone
  chosen in JavaScript and handed over as a class name is exactly the hand-drawing this
  clause refuses, one property at a time.

Neither sentence licenses anything new. Attribute selectors, custom properties, `calc()`
and `animationend` are the whole toolkit the interface uses today, and every one of them
was already here.

### What it settled, first time out (ticket 128)

- **Three shapes stopped being hand-rolled.** The count mark in both floating bars is a
  `Badge`; the rule before each bar's dismissal is a `Separator`, which publishes the role
  the hand-rolled span had to hide behind `aria-hidden`; and the bars' panel is a `Card`.
  The count mark is **not** one of ADR 0019's four badges and does not become one — it
  carries no `data-badge` and no tone. Spending a primitive's shape and spending its meaning
  are different acts and only the second is that ADR's business, so
  `interface-weight.test.mjs` names the one site that wears a badge without being one and
  asserts the list of them exactly, which is stricter than the file exemption it replaced.
- **The "second hand-rolled panel" clause below was acted on rather than argued with.** The
  two floating bars spelled one border, corner, background and shadow in two files, with
  nothing saying either was a copy — which is what that clause said to watch for. They are
  one component on `Card` now. The suggestion list keeps its exemption for the reason
  recorded there, focus, and it is the only hand-rolled panel this file still allows.
- **Two disclosures stay hand-rolled and now say why.** `Ledger.jsx`'s closed section and
  `Marker.jsx` both put a trigger in a table cell and open a run of sibling `<tr>`s.
  `CollapsibleContent` is a `<div>` around its children, and a div between a `tbody` and its
  rows is not a table: the browser hoists the rows out and the shared columns stop being
  shared. The primitive is refused for the one case it cannot hold, in a comment, in both
  files. The missing sentence was the defect; the code was already right.
- **The sparkline's warrant is corrected and not overturned.** `Chips.jsx` went on claiming
  in a comment that no prop reaches `Progress`'s indicator, which ticket 80 made false and
  this file struck. The comment says the surviving reason now — a 24-pixel bar in a table
  cell is not a progress bar — and says the other one is spent, so the next reader weighs a
  swap that is unwanted rather than one that looks impossible.

## Considered options

- **Full adoption, shadcn's theme as the source of truth.** Rejected. It would
  rewrite the components that carry domain meaning, and it puts the definition of a
  class tone in a place that knows nothing about classes.
- **No library.** Rejected. Focus management is the one part of this interface that
  is hard to write correctly and invisible when it is wrong.
- **Radix instead of Base UI.** Not rejected on merit. Base UI is simply the default
  now, and the migration path between them is documented in both directions.

## Consequences

- The dependency count goes from two to about nine. That is a real change of posture
  and it is deliberate, bounded by the list of seven primitives. A new primitive is a
  small decision; a new theming system is a decision here.
- **An eighth file arrives with the seven** (recorded when ticket 74 ran the
  install, and not a change of this decision). `ui/button.jsx` is a registry
  dependency of Dialog, which imports it for the footer's close control. It is a
  part of a primitive rather than a primitive we chose, and the bound still reads
  as seven: nothing outside `ui/` imports it, and it is where a shadcn button
  belongs if a later ticket wants one.
- Custom UI stays custom for the content-parity concepts: the finding diff, the page
  group, the repeat, the history note and the bulk selection. No library has them, and
  the failure mode of adopting shadcn is rebuilding the diff out of parts that are
  there. The amendment above does not weaken this: `Diff.jsx` still decides what a
  changed word looks like, and what it gained is a `TableCell` to sit in.
- **The primitive list grew from seven to nineteen** when the amendment landed, adding
  Badge, Input, Label, Card, Alert, Separator, Toggle, ToggleGroup, Collapsible,
  Progress, Empty and Field. Each is a shape the interface was already drawing by
  hand, and none of them is a decision about meaning. The count of npm packages did
  not move: these are source files, and they arrived on the dependencies the seven
  already brought.
- **A new primitive, and it is taken for exactly what this file says.** `DropdownMenu`
  arrives with ui-polish ticket 09 as the twenty-second file under `ui/`, and it is a keyboard
  menu, a roving focus and a dismiss on escape that restores focus — three of the four
  behaviours the section above names as the reason this dependency was worth having, and the
  fourth is a focus trap a menu has no use for. No npm package moved: it is one source file
  on `@base-ui/react`, which the seven already brought.

  It is recorded because a new primitive is a small decision this list holds, and because the
  obvious alternative had to be refused out loud. The suggestion list two bullets down is
  hand-rolled, and this file says a **second** hand-rolled panel should be read as evidence
  the repo wants a focus-free panel primitive rather than as licence for a third. A menu is
  not that case and cannot be: the suggestion list is hand-rolled *because* it must never
  take the focus, and a menu's whole job is to take it.

  **It arrived needing the third in-place edit, and the two above said to notice that.**
  `DropdownMenuContent` shipped `outline-none` with no `focus-visible:` ring beside it, and
  the positioner shipped `outline-none` on a wrapper that is never focused — so ui-polish
  03's focus guard failed on the file the moment it landed. The fix is what the sibling
  primitives already do: `dialog.jsx` and `popover.jsx` both carry
  `focus-visible:ring-3 focus-visible:ring-ring/50` on their panel, and the menu now
  carries it too; the positioner's is deleted, because an outline on an element that
  cannot hold the focus was never drawing anything.
  It is recorded here for the reason the other two are: **a `shadcn add dropdown-menu`
  will overwrite it**, and this list is the only place a re-add would be caught. It is
  unlike them in what it is *for* — the checkbox edit bought a behaviour and the progress
  edit opened a door for a token, and this one only brings a vendored file up to a rule
  this repo already enforces on its own files and the registry already meets in two others.
  That makes it the weakest of the three as evidence, and it is still the third. The
  question the bullets above park — whether this repo wants `ui/` files it maintains rather
  than vendors — is now due, and it is not this ticket's to answer.
- **One thing stays hand-rolled inside a component that otherwise did not.** The
  parity bar in `Chips.jsx` is not a shadcn `Progress`, because `Progress` composes
  its own indicator and paints it `bg-primary`, and the fill here is chosen per row
  from `FILL[severityTone(share)]`. ~~There is no prop that reaches the indicator, and
  wrapping the palette class in a descendant selector would assemble a class name at
  runtime, which Tailwind cannot see.~~ It is also a 24-pixel sparkline in a table cell
  rather than a progress bar.
  — **Struck 2026-08-14, ticket 80.** There is a prop now: the registry file takes
  `indicatorClassName` (see the amendment below), so a palette class reaches the fill
  without any runtime assembly. The sparkline stays hand-rolled on the **surviving**
  reason alone — it is a 24-pixel bar in a table cell and not a progress bar — and that
  is a weaker warrant than this consequence used to carry. A later ticket that wants it
  to be a `Progress` is not arguing with this decision.

- **A second thing stays hand-rolled: the suggestion list** (ticket 104 part D). The page-key
  list under the dashboard's search box is a `<ul role="listbox">` in `SearchBox.jsx` with its
  own border, corner and shadow, and not the installed `ui/popover.jsx`. The reason is the one
  thing this ADR takes shadcn *for*: **focus**. A popover takes it, and this list must never —
  the editor is typing, the caret stays in the box the whole time, the rows are read with the
  arrow keys from inside it, and the active row is named by `aria-activedescendant` rather
  than focused. A primitive whose whole job is to move the focus somewhere cannot be handed a
  case that forbids moving it.
  It is recorded here and not left in a component comment because this is the failure mode
  the amendment names by name — *a dozen panels that each redefined a border and a corner* —
  and one panel is how a dozen starts. Two conditions on it, then: the tokens are the
  popover's own (`bg-popover`, `text-popover-foreground`, `rounded-lg border shadow-md`), so
  the surface is still the theme's and only the focus behaviour is local; and a **second**
  hand-rolled panel should be read as evidence that this repo wants a focus-free panel
  primitive of its own rather than as licence for a third.
  — **2026-08-20, ticket 128.** The two floating bars were that second panel, drawn twice.
  They are one `Card` now (see the second amendment above), so this exemption is the only one
  left and the condition still binds the next panel that wants one.

- **A second registry file is edited in place** (ticket 80). `ui/progress.jsx` builds its
  own track and indicator and exposes a `className` for the root only, so the page bar in
  `Progress.jsx` had nowhere to put `FILL.secondary` — and the fill colour is the whole
  reason that bar is drawn rather than a number printed. The wrapper now takes
  `trackClassName` and `indicatorClassName` and forwards them to the two parts.

  It is the same shape of edit as the checkbox above and it is recorded for the same
  reason: **a `shadcn add progress` will overwrite it**, and this list is the only place a
  re-add would be caught. It differs from the checkbox in one way worth naming — this one
  *is* tone-shaped, since what it carries through is a palette token. That does not breach
  the rule the amendment above states. The palette still decides the colour and the
  primitive still decides the shape; the edit only opens a door the primitive had shut on
  `className` carrying colour, which is the normal form here.

  Two edits are not a pattern yet, but they are the start of one. A third should be read as
  evidence that this repo wants `ui/` files it maintains rather than vendors, and that is a
  decision of its own.

- **A registry file is edited in place, once** (ticket 110). `ui/checkbox.jsx` draws
  the same tick for a checked box and for an indeterminate one, because its indicator
  hard-codes `CheckIcon` and renders for both states. A tri-state selection needs
  *some of them* to look unlike *all of them*, so the wrapper takes `indeterminate`
  and swaps in `MinusIcon`. It is behaviour-shaped rather than tone-shaped — no
  palette token is involved, and `lucide-react` was already a dependency — but it is
  a hand edit inside `ui/`, so a `shadcn add checkbox` will overwrite it. It is
  recorded here because that is the only place a re-add would be caught.

## Scope

The upgrade to Astro 7 is a separate decision and a separate pair of tickets, and it
goes first. The documented path from 5.14 is 5 → 6 → 7, one major at a time, with a
Node floor of 22.12.0. No product change belongs in either diff.
