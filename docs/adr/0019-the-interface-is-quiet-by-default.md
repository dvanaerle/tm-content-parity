# The interface is quiet by default, and a container is earned

An outside audit read this interface and said it was loud: a badge on every category, a card
around every group, a border around every card, uppercase on every label, and a filter
styled as a warning. Most of that reading is correct. None of it is a fault of the palette,
which ADR 0007 settled and `palette.test.mjs` guards — the eight tones mean what they say
and red and green are spent on diff direction only. The fault is in **how freely the
components reach for a container, a badge and a capital letter**, and that has never been
written down, so each surface answered it again and answered it differently.

The policy is: **the interface is quiet by default, and every device that adds visual weight
must be earned.** Below is what earns each one. A device used without its reason is a defect,
in the same manner as a word used outside `CONTEXT.md`.

This is a rule about **restraint in using the palette**, and it is deliberately not the same
decision as ticket 132's, which is about the **mechanism** — a tone becomes a CSS selector
and the JavaScript maps die. That migration must be provably pixel-identical; this one
changes pixels on purpose. Mixing them would destroy the only proof 132 has.

## What earns a card

A **Card** is earned by a surface that could be **moved somewhere else and still mean the
same thing**. A card says "this is a thing", and a thing has an outside.

Grouping does not earn one. Four counts that belong to one store are not a thing; they are
four counts. A search box above a list is not a thing; it is a search box above a list. The
audit's example was two cards reading *Search* and *Work* stacked on one screen, and it is
right that they carry no information: the reader already knew which was which from the words
inside them.

## What earns a border

A **border** is earned by exactly four things: a **table**, a **floating layer**, a
**selected state**, and a **section boundary that a reader must not read across**.

Everything else is separated by **space and a hairline rule**. A list of findings is a list
of findings; boxing each row states, falsely, that a row is a surface.

The failure this closes is the compound one: a row with a border, and a background, and a
badge, and a shadow, all saying *this row exists*, which the reader already knew because it
has words in it.

## What earns a shadow

A **shadow** is earned by floating above the page, and by nothing else. The floating bulk
bar, a dialog, a popover. Content that does not float must not look as though it does.

## What earns a badge

A **badge** is earned by a value from a **closed vocabulary** that a reader must
**recognise at a glance while scanning**. There are four, and a fifth needs an amendment to
this file:

- the **class** pill
- the **priority**
- **Needs attention**
- the **one-sided** chip

Everything else is text. That takes `Open` and `Closed` out of badges — the surrounding
table already says which bucket is being read, so the badge was a second copy of it — and it
takes out every count and every date, because a quantity is not a category. `4 pages`,
`First seen`, `×3` and `changed since review` are words.

**`claimed fixed, still differs` stays loud and is not a badge**, because it names a person.
A pill cannot hold *claimed fixed by Dylan, still differs*, and the name is the part an
editor needs: the sentence is the unit, not the state.

The refusal that matters most here is the **class pill**, which the audit asked to convert to
text. It is refused. Ticket 79 removed the row tint from the content view on the grounds
that in a view where every visible row is work, a tint carries no signal — and it left the
class pill carrying the whole of it. Converting the pill to text now would re-create the
problem 79 solved. What the pill needed was not less weight but a **label**: it drew the
contract key, in capitals, so an editor read `IMAGE-MISSING`.

## What earns a capital letter

Nothing, except a table's own `th`, where small uppercase is a structural signal and not
emphasis.

`PRODUCTION`, `COPY`, `HIGH`, `PAGE NOTE` and `DISMISSED · REASON` are the same words
shouted. `CONTEXT.md` fixes *Production* and *New site* in sentence case for the two sides;
this generalises it. It is guarded: the `uppercase` utility may not appear outside a `th`
selector.

## Interaction states

- **Hover** may change a background and emphasise an action. It may not move a control,
  resize a row, or reveal information a reader needs. A reader who must hover to find out
  what a row says cannot scan, and cannot use a keyboard.
- A **selected row** is a **tick and a tint**. Not also a border, and not also a shadow, and
  not also a badge saying it is selected. The tick is the control and the tint is the
  feedback; a third and fourth statement of the same fact is what the audit found.
- **Focus is never removed.** Every interactive element has a visible keyboard focus state,
  and an outline may be replaced but not deleted.
- An **icon-only control** has an accessible name and a comfortable hit area. The glyph stays
  small; the target does not.

## What earns the front of a row

The **compared content leads**, and everything the tool made of it follows. A finding row and
a content row each carried a 224-pixel first column holding a class pill, a detail, a score, a
date, a history note and a decision control — six facts *about* a block, in front of the block.
Every one of them stays; the order says which of them the reader came for.

The one exception is a **row header**: a cell that names what the cells beside it hold heads
them or it heads nothing, so the `<head>` panel keeps its field name first. That is structure
and not emphasis, in the same way a `th` keeps its capitals.

Built in ticket 05. The metadata cell publishes a `data-slot` naming the column it belongs to,
for the reason every other stable name here exists: an assertion that read *the first cell of
the row* would otherwise be reading the class off a paragraph of Dutch.

## What a floating bar says

A floating bar names its **object** and its **scope**, and **never its content**.

The bulk bar drew the two compared texts in full, pinned over the very rows that were drawing
them, so an editor read the same pair twice and the count they were about to press on was the
smaller half of it. Its object is the pages and its scope is how many of the list they are, and
which difference they are in is said by the **class**. Its sibling, the annotate bar, said *2
pages selected* — an object with no scope at all — and gains the same shape off the same
component, count bubble included.

A **press that wrote everything says so**, once, in the place the same bar already reports a
shortfall. No toast: the pass refuses the primitive, and for a single row the state flipping is
the feedback. Silence is only ambiguous where a press covered pages the editor cannot all see,
which means the bar has to outlive the selection the press spent.

An **empty state says the reason it is empty**, not that it is. *No rows in this filter* names a
cause that in this interface cannot even happen, while the two that can — nothing was
extracted, and every block is a diagnostic the reader switched off — are opposite answers, and
one of them is a press away from being undone.

## Numbers

Every **repeated count is tabular**, so a column of them aligns. This is largely already
true — `tabular-nums` is on the bucket numbers, the check counts and the page counts — and it
is written here so the next count arrives with it.

## Colour

ADR 0007 and `palette.test.mjs` already carry the substance: eight tones, red and green for
diff direction only, brand colour for chrome only. One rule is added, and it is the one the
audit found: **amber means something is wrong.**

Amber was doing three jobs — `--destructive` is deliberately amber `#78350f`, the `caution`
tone is amber, and the filter strip wore `BANNER.caution`. A filter is a normal state that
an editor chose. Spending the warning colour on it means the colour says nothing by the time
something is genuinely wrong, and this interface has three things that are: **Needs
attention**, a failed **re-check**, and **read-only**.

So the filter strip becomes **neutral**, and the only colour inside it is the **primary** its
*Clear filter* shares with the pressed class pill — the strip and the control that sets it
say one thing in one colour. The strip itself does not change: `CONTEXT.md` requires that all
three kinds of narrowing be named in one sentence under one *Clear filter*, because what an
editor must never misread is an empty list, and that is the sentence's job. It was never the
colour's.

## Considered and refused

**The audit's full aesthetic** — near-borderless, badge-free, hierarchy from typography
alone. Refused as stated. This interface carries a genuinely large amount of *categorical*
information: six stores, four checks, three buckets, thirty-one classes, three annotation
families, and two axes. Categorical information is what a badge is for, and a reading surface
that renders all of it as differently-weighted text asks the reader to hold the weights in
their head. The restraint is adopted; the abolition is not.

**Folding these rules into ticket 133's ADR.** Refused for the reason given above: 133 is a
mechanical migration whose value is that nothing moves.

**A visual-regression suite.** Refused. The repo has no snapshot tests by choice, and
adopting screenshot testing to support one polish pass would be a large standing cost paid
for a one-off. The enforcement instead follows the habit this repo already has — the stopword
sweep, the palette guard, the `resolved` ban — and turns the *mechanical* rules into tests:
no `uppercase` outside a `th`, one date helper, a label for every class, an accessible name on
every icon-only control. The rules that need taste are enforced by a reader.

## Consequences

- **Pixels move, on every surface.** This is the one ADR in this repo whose purpose is that
  things look different. It is worth stating because every other visual decision here has
  been careful to change nothing.
- **The badge list is a closed list, and it lives here.** A fifth badge is an amendment to
  this file, in the manner of ADR 0015's exception list. That is the cost that stops the
  count from drifting back up.

  Built in ticket 02, and the mechanism is worth one sentence because the list is only as
  closed as the thing checking it. Every badge carries a **`data-badge`** naming which of
  the four it is, and `web/src/interface-weight.test.mjs` asserts that every `Badge` has
  one and that the four names are exactly these four. A sweep could always find `<Badge`;
  what it could not do is tell what a badge was a badge *of*, so the element says so — the
  way `data-tone`, `data-wears` and `data-bucket` already have the interface publish a
  stable name for something it draws.

  One consequence that reads as a fifth badge and is not: the **page scope chip** stopped
  being a `Badge` rather than joining the list. The four are values an editor scans a list
  for. The scope chip is a **control** — it holds a clear button, it is always the same one
  word, and it is on screen only while the reader themselves put it there.

  A second, from ticket 05, and it is the same argument: the **count bubble** on the two
  floating bars. It is round, it is filled with brand colour and it is badge-shaped, and it is
  not a value from a closed vocabulary — it is a count of the reader's own ticks, on a bar that
  exists only while they are ticked. It carries no `data-badge`, so the guard is satisfied by
  construction, and it lives in one component (`Selected.jsx`) that both bars draw, because it
  was written out verbatim in each of them.
- **`CONTEXT.md` does not gain these rules.** It is a glossary and nothing else. The language
  rules the audit raised did go there — the two sides are one pair of words in sentence case,
  a class has a label, a *Clear* says what disappears — because those are vocabulary. Cards,
  borders, shadows, capitals and hover are not, and they are here.
- **Amber is now scarce on purpose**, so a future reader reaching for `caution` on a normal
  state is reaching past this decision. `palette.test.mjs` asserts `warning` and `caution`
  render different pixels; it cannot assert that a normal state does not wear one, and that
  gap is knowingly left to a reader.
- **A row's own secondary presses are quieter than the same words in a form.** A page carries
  up to 168 of them, and an outlined button on each drew a column of boxes down the one surface
  whose content is meant to be the loudest thing on it. They are ghosts in the interface's grey
  and they are **not** behind hover: the interaction rule above already refuses revealing
  something a reader needs, and a press nobody can find until the pointer is on it is not
  available. The outline is left to the form, where there is one action and it is the point.
- **The class pill survives and gains a label**, which makes the label a domain fact rather
  than a presentation one. It lives beside `meaning` in `compare/vocabulary.mjs`, and a class
  without one fails the test — so the thirty-second class cannot arrive unnamed.
