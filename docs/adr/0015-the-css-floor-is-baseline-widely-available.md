# The stylesheet may use Baseline Widely Available, and nothing newer

The log had no written browser floor. There is no `browserslist`, no `.browserslistrc` and
no build target anywhere in the repo; the only floor stated in `package.json` is Node's,
and Node does not run a stylesheet. So the answer was emergent and nobody chose it.

The policy is now: **a CSS feature may be used when it is Baseline Widely Available**, with
one written exception mechanism. It is a **rule**, and it is deliberately not a list of
browser versions.

## Why a rule and not a list

A dated list rots, and it gives false confidence while it does. Two features on the same
list move at different speeds and in different directions: `:has()` crossed into Widely
Available in June 2026, and `content-visibility` will not until about 2028. A list written
today is wrong within months, and the reader who trusts it cannot tell which of its lines
have gone stale — every line looks as authoritative as every other.

The rule stays true, because it is a question and not an answer: **check the feature's
Baseline status at the moment you reach for it.** That is the version a reader can act on,
and it is the only version that does not need re-writing.

Widely Available and not Newly Available, because Newly Available means the feature landed
in the last of the core browsers within the last 30 months. This build is opened from
outside the network, by content editors on whatever machine their office gave them, and
nobody here measures those browsers. The 30 months is the margin that makes the question
"does it work" instead of "who is on the old version".

## The floor the build already imposes is a mechanism, not the policy

The stylesheet is Tailwind v4 through `@tailwindcss/vite`, and Tailwind v4's own output
leans on `@property` and `color-mix()`. That puts a hard floor under this build at
**Chrome 111 / Safari 16.4 / Firefox 128**, by accident of a dependency and not by anyone's
decision. `color-mix()` is also written by hand — `button.jsx` mixes `var(--secondary)` with
`var(--foreground)` for a hover ground — so the floor is the interface's as well as
Tailwind's.

Those three numbers are the **mechanism's** floor. They are **not** the policy, and writing
them down as the policy would be the trap this ADR exists to close: a feature can clear
Chrome 111 comfortably and still be two years from Widely Available. The version triple
answers *what will parse*; the policy answers *what may be relied on*. They are different
questions and only one of them is a decision.

The practical consequence of keeping them apart: **if the dependency moves, the mechanism
moves and the policy does not.** A Tailwind v5 that raises `@property` to something newer
raises the floor under this build without anybody choosing it, and that would be a change
worth a ticket — but it would not be a change to what a reader is allowed to write, because
Widely Available is already above it.

## No `browserslist` key, deliberately

Nothing in this toolchain reads one. There is no autoprefixer, no PostCSS config and no
`.browserslistrc`; Lightning CSS runs inside Tailwind and is driven by Tailwind's own
target. A `browserslist` key here would be a machine-readable declaration that no machine
reads — a lie with a schema — and the next person would trust it precisely because it looks
mechanical. The policy is prose because prose is what is actually enforced here: a reader,
before they write the line.

(`browserslist` appears in `web/package-lock.json`. Those are transitive dependencies of
the build, not a declaration of ours, and adding one of ours would not change what they do.)

## The exception mechanism

A policy with no exception mechanism does not get obeyed. It gets quietly ignored by
whoever first meets a label that disagrees with what the feature demonstrably does, and
once one person has stepped over the line with no record, the policy is decoration.

So an exception is allowed, and it **costs one sentence naming the feature and the reason**,
written where the feature is used. Not a request, not a review — a sentence. That is cheap
enough to be paid and visible enough to be found.

### First exception: `overscroll-behavior`

`overscroll-behavior` is formally **limited availability** under a 2026 re-versioning, and
the whole of that label turns on one narrow spec detail: the behaviour of the property on a
scroll container that has **no scrollable overflow**. The case anybody actually writes —
`overscroll-behavior: contain` on an element that does scroll, to stop a scroll chaining out
to the page behind it — has worked since **Chrome 63 / Firefox 59 / Safari 16**, which is
below this build's own Tailwind floor.

So the label is true and misleading at the same time, and a rule that refused this feature
would be refusing it for a case nobody writes. The exception is granted here, ahead of use,
because ticket 128 is the ticket that reaches for it.

## What the policy currently refuses

Named here so the next reader does not re-derive them. This list is the **worked example**
of the rule, not the rule — it is a snapshot of 2026-08-14 and it will go stale, which is
exactly why the rule above is the thing to obey.

**Newly Available** — real, shipped in all core browsers, and inside the 30-month margin:
`content-visibility` (Widely Available around 2028), `::details-content`, the Popover API,
`@starting-style`, `transition-behavior`, `light-dark()`, `text-wrap: balance`,
`field-sizing`, and container **style** queries.

**Worse than Newly Available** — limited availability or still moving: `@scope`, `if()`,
`@function`, typed `attr()`, anchor positioning, `interestfor`, `appearance: base-select`,
`interpolate-size`, `sibling-index()`, and scroll-state queries.

**`@scope` deserves its own sentence, and not only its version.** A browser that does not
support it drops **every rule inside the block**, not only the scoping — so it fails
destructively where the rest of this list fails cosmetically. A missing
`text-wrap: balance` gives a reader a ragged heading; a missing `@scope` gives them an
unstyled region. It is the one entry whose cost of being wrong is not proportional to its
usefulness.

## What the policy permits, and one reader needed the answer

**Container size queries are permitted.** They have been Widely Available since **August
2025**. Ticket 87 asks whether a component may respond to the width of its own container
rather than to the viewport, and this is where that answer lives.

The feature is in the tree already, and it arrived with the library rather than by a
decision. `card.jsx` declares `@container/card-header` and is **rendered** — `Dashboard.jsx`
and `Ledger.jsx` both import `Card` — so a container context is on screen today. `field.jsx`
declares `@container/field-group` and nothing imports it, so that one is installed and not
drawn. Both are shadcn's, under ADR 0007's amended list of nineteen and not its original
seven.

Container **style** queries are a different feature with a different status, and they are
refused. The two share a syntax and not a Baseline row.

`:has()` is permitted, and it is already used throughout shadcn's primitives as Tailwind's
`has-*` variants. It crossed into Widely Available in June 2026.

## Consequences

- **Nothing on screen moves.** No stylesheet rule and no component changed. This ADR and a
  pointer comment in `web/src/styles/app.css` are the whole of it.
- **The pointer is in `app.css`**, at the top, where somebody about to add a rule is
  standing. It has to say that the policy reaches the components too: most CSS in this
  interface is written as Tailwind classes in `.jsx`, not as rules in this file, so a
  pointer that read as being about this file alone would cover the smaller half.
- **There is no mechanical guard**, and that is a knowing cost. Baseline status is a moving
  external fact, so a committed list of allowed features would be the dated list this
  decision refuses, wearing a test. The enforcement is a reader and a review.
- **A dependency that raises the floor is a ticket**, not a silent change. Today it is
  Tailwind v4's `@property` and `color-mix()`. **This ADR is the one live copy of those
  numbers**, and it is the only place they need editing when they move. The `app.css`
  pointer deliberately does not repeat them, and the map entry and ticket 127 do — but
  those are dated records of what was decided on the day, which the map says of itself,
  and a record is not a copy that can go stale.
- **The exception list grows in this file.** `overscroll-behavior` is the first entry, and
  the next one is a sentence appended under the same heading rather than a new decision.
