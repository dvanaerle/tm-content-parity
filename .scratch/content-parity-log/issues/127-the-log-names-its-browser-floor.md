# 127 — The log names its browser floor

Type: task
Status: ready-for-agent
Blocked by: None — can start immediately.
Parent: ../map.md

**What to build:** the log says which CSS it is allowed to use, in one place, so the next
person reaching for a new feature learns the answer before they write the line rather than
after a reader on an old browser sees nothing.

Today the answer is emergent and nobody chose it. There is no `browserslist`, no
`.browserslistrc` and no build target anywhere in the repo — the only stated floor is
Node's. The real floor is Tailwind v4's, because the stylesheet leans on `@property` and
`color-mix()`, so it is Chrome 111 / Safari 16.4 / Firefox 128 by accident of a
dependency. If Tailwind v5 moves it, the log's support policy changes and no ticket
records that it did.

**The policy is Baseline Widely Available**, and it is written as a *rule* and not as a
list of versions. A dated list rots: `:has()` crossed into Widely Available in June 2026
and `content-visibility` will not until about 2028, so any list is wrong within months and
gives false confidence while it is. The rule stays true — *check the feature's Baseline
status at the moment you reach for it* — and it is the version a reader can act on.

**One exception mechanism, and it must be used in writing.** `overscroll-behavior` is the
first case: it is formally *limited availability* under a 2026 re-versioning that turns on
one narrow spec detail — no effect on a scroll container with no scrollable overflow — while
the case anybody actually writes, `contain` on an element that does scroll, has worked since
Chrome 63 / Firefox 59 / Safari 16. A policy with no exception mechanism does not get
obeyed; it gets quietly ignored by whoever first meets a label that disagrees with reality.
So the exception is allowed and it costs a sentence naming the feature and the reason.

- [ ] An ADR states the policy: Baseline Widely Available, as a rule and not as a version
      list, with the reason a list was refused.
- [ ] The ADR states the exception mechanism and records `overscroll-behavior` as the first
      exception, with the spec detail that makes its label misleading.
- [ ] The ADR names the floor the build already imposes — Tailwind v4's `@property` and
      `color-mix()` requirement — so a reader can tell the policy from the mechanism, and
      knows which one moves if the dependency does.
- [ ] `app.css` carries a pointer to the ADR, positioned where somebody reaching for a
      newer feature would be standing.
- [ ] The features this policy currently refuses are named with their status, so the next
      reader does not re-derive them: `content-visibility`, `::details-content`, the Popover
      API, `@starting-style`, `transition-behavior`, `light-dark()`, `text-wrap: balance`,
      `field-sizing`, container **style** queries — all Newly Available — and `@scope`,
      `if()`, `@function`, typed `attr()`, anchor positioning, `interestfor`,
      `appearance: base-select`, `interpolate-size`, `sibling-index()` and scroll-state
      queries, all worse.
- [ ] Container **size** queries are named as permitted (Widely Available since August
      2025), because ticket 87 needs that answer and this is where it lives.
- [ ] Nothing on screen moves. No stylesheet rule and no component changes.

## Traps

- **Do not add a `browserslist` key.** Nothing in this toolchain reads one: there is no
  autoprefixer and no PostCSS config, and Lightning CSS is driven by Tailwind's own target.
  A machine-readable declaration that no machine reads is a lie with a schema, and the next
  person will trust it.
- **Do not pin a version triple as the policy.** The versions are the *mechanism*'s floor,
  not the *policy*. Writing "Chrome 111 / Safari 16.4 / Firefox 128" as the rule invites
  somebody to use a feature that happens to clear those numbers but is two years from
  Widely Available.
- `@scope` deserves its own sentence in the refusal list, and not only its version. An
  unsupporting browser drops **every rule inside the block**, not just the scoping — so it
  fails destructively where the rest of the list fails cosmetically.
- This ticket writes a decision and touches no component. Resist doing 128's work here
  because the ADR made it obvious.
