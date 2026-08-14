# 129 — A hint is reachable without a mouse

Type: task
Status: ready-for-agent
Blocked by: None — can start immediately.
Parent: ../map.md

**What to build:** the hints on the dashboard reach an editor who is not holding a mouse.
Every hover hint in the log is a native `title` attribute, and a `title` is invisible on a
touch screen, unreachable by keyboard, unstyleable, and announced unreliably by screen
readers. The `Tooltip` primitive has been installed since ticket 74 and **has no importer
anywhere** — not in a component, not in a page.

That is the largest undocumented gap in the interface: 36 real `title` attributes against a
primitive with zero imports, and no comment anywhere acknowledging the choice. Several
comments discuss "the tooltip" as a designed thing — the caller owning the tooltip that
names the unit, the tooltip that keeps two rows apart, the tooltip that says what each view
answers — while the thing they describe is an attribute the browser draws however it likes.

ADR 0007 bought this dependency for exactly this reason. Its own case for taking the library
is the accessibility work the interface was not doing, and `title` is the textbook example.

**This ticket establishes the pattern and applies it to one surface.** The dashboard is
chosen first because it holds the largest share of the hints and the widest variety of them —
a hint on a pill, on a column head, on a checkbox, on a count — so a pattern that survives
the dashboard survives everywhere. 130 takes the rest.

**It adds JavaScript, deliberately, and that is worth stating.** A `title` costs nothing and
a `Tooltip` is Base UI with positioning behind it. The CSS-only replacements — the Popover
API, anchor positioning, `interestfor` — are all refused by 127 for years yet. The trade is
accepted because "zero JavaScript" was never the goal: a hint a touch user cannot see is not
a cheap hint, it is a hidden one.

- [ ] A hint on the dashboard is reachable by keyboard and announced, and it is drawn by the
      primitive rather than by the browser's own box.
- [ ] The pattern is established once — how a hint is attached, what it does to the control's
      accessible name, and how a hint on a disabled or read-only control behaves — so 130 is
      an application of it and not a second design.
- [ ] A hint never becomes the control's only accessible name. A control whose meaning lived
      in its `title` gets a real label, and the hint says the extra thing.
- [ ] Hints that are decoration rather than meaning are identified and left as they are, or
      removed. The ticket does not promote a nicety into a component.
- [ ] The words are unchanged. This is about reach, not copy, and ADR 0014 already fixed the
      language.
- [ ] Browser tests assert reach and not markup: a hint is available to a keyboard user and
      carries its text. The assertion is about what a reader can get to.
- [ ] The dashboard's screenshot baselines are reviewed for layout movement. A tooltip
      trigger inside a table cell can change a row's height, and a moved baseline is a real
      change that needs looking at rather than accepting.
- [ ] No `title` attribute is left on the dashboard carrying meaning an editor needs.

## Traps

- **A tooltip is not a place to put something an editor must read.** If the hidden text is
  required to act, the text belongs on screen. Moving an essential sentence from a `title`
  into a `Tooltip` makes it reachable but keeps it hidden, and some of these 36 hints are
  carrying more than a hint.
- **Do not wrap a `title` in a `Tooltip` and leave both.** The browser will draw its own box
  over the primitive's, and a reader gets the same words twice in two shapes.
- Do not reach for the Popover API, anchor positioning or `interestfor` as a CSS-only route.
  All three are refused by 127, and the unguarded fallback for the Popover API renders the
  content inline and always visible, which is worse than the problem.
- A hint attached to a checkbox must not swallow the press. The tri-state select-all controls
  already answer a mixed press by clearing, and that behaviour is pinned; a trigger wrapped
  around the wrong element breaks it.
- The four `title` **props** on the local aside and class-strip components are not DOM
  attributes and are not this ticket's subject. Do not convert them.
