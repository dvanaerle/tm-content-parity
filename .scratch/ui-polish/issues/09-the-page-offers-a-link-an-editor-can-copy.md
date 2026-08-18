# 09 — The page offers a link an editor can copy

**What to build:** the *more* control the page header has never had, carrying one item that works
end to end. An editor presses it and copies this page's address; a keyboard user opens it, moves
through it and closes it without a pointer, and lands back on the trigger they came from.

This is the thin complete path. Nothing is displaced from the header yet, so the ticket can be
judged on its own: either the menu is reachable, named and keyboard-correct, or it is not.

*Copy link* is worth building first because it is the one item that is never refused, and because
the deep link has been shipped since ticket 109 and no control in this interface has ever offered
it. An editor who wants to send a colleague to a page reads the address bar today.

**Blocked by:** 08 — the trigger reads its value from that module.

**Status:** ready-for-agent

**Parent:** 07-the-page-header-is-one-quiet-line.md

- [ ] `dropdown-menu` is installed with the project's shadcn setup, as the twenty-second file under
      `ui/`. It is not hand-rolled.
- [ ] ADR 0007 gains a consequence line naming it, in the shape that ADR already uses for a new
      primitive. It records that the menu is taken for **behaviour** — a keyboard menu, a roving
      focus, a dismiss on escape that restores focus — which is what that ADR bought the dependency
      for.
- [ ] The header carries one icon-only trigger with an accessible name and a comfortable hit area,
      passing ui-polish 03's guard. The glyph stays small; the target does not.
- [ ] The menu holds **Copy link**. It puts this page's address on the clipboard.
- [ ] The menu opens, moves and closes from the keyboard, and focus returns to the trigger on close.
- [ ] `Progress.browser.test.mjs` gains the assertions: the trigger has an accessible name, and
      *Re-check* is still a visible button and not a menu item. No new browser test file is created.
- [ ] `npm test && npm run lint && npm run build`.

## Traps

- **Do not hand-roll a panel.** ADR 0007 records one hand-rolled panel already — the search
  suggestion list — and states that a second should be read as evidence this repo wants a primitive
  of its own rather than as licence for a third. That list is hand-rolled *because* it must never
  take focus. A menu must, so it is the primitive's case and not the exception's.
- **Do not add a second item in this ticket.** *Edit page details* and *Mark page reviewed* are
  ticket 10's, and they need the dialog that ticket builds.
- **Do not move *Re-check* into the menu.** PRD story 28 keeps the one action with a cost visible,
  and the browser assertion above exists to hold that.
- **No new tone and no badge.** ADR 0019 closes the badge list at four and none of them is a menu.
- **One test, then the implementation it asks for.** Do not write the browser assertions and the
  data assertions up front.
