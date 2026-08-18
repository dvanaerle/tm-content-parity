# 02 — The weights are earned

**What to build:** the interface becomes quiet by default. Nothing carries visual weight that
has not earned it, and ADR 0019 says what earns each device. An editor scanning a list sees
content first and categories second, instead of a wall of filled badges in which nothing stands
out. Amber stops meaning *you clicked a pill* and goes back to meaning *something is wrong*.
And a comparison stops being one line joined by an arrow: both sides are labelled, and the
shared renderer that draws them decides whether they sit side by side or stack from the space
it has, not from the viewport.

**Blocked by:** 01 — the class pill can only stop shouting once it has a label to draw.
**132** and **133** in `content-parity-log` — 133 is moving the tone maps into CSS selectors
across the dashboard and the ledger, and its value is that it can prove nothing moved. This
ticket changes pixels on purpose and must come after it.

**Status:** ready-for-agent

**Parent:** ../PRD.md

- [ ] No uppercase anywhere except a table's own heading row, where small uppercase is a
  structural signal. The priority, the note kind and the class pill read in sentence case.
- [ ] A new guard, named for ADR 0019, refuses the `uppercase` utility outside a table-heading
  selector.
- [ ] Only four badges survive: the **class**, the **priority**, **Needs attention**, and the
  **one-sided** chip. The guard holds that list, so a fifth badge is an amendment to the ADR.
- [ ] `Open` and `Closed`, every count, every date, `×3` and *changed since review* are text.
- [ ] *claimed fixed, still differs* stays loud and stays a **sentence** naming the person, not
  a badge — a pill cannot hold a name, and the name is the part an editor needs.
- [ ] A **card** appears only around a surface that could move elsewhere and still mean the same
  thing. Grouping alone does not earn one.
- [ ] A **border** appears only on a table, a floating layer, a selected state, or a boundary a
  reader must not read across. Everything else is separated by space and a hairline rule.
- [ ] A **shadow** appears only on something that floats above the page.
- [ ] **Hover** may change a background and emphasise an action. It moves nothing, resizes
  nothing, and reveals nothing a reader needs.
- [ ] A **selected row** is a tick and a tint — not also a border, not also a shadow, and not
  also a badge saying it is selected.
- [ ] Every repeated count is tabular.
- [ ] The **filter strip is neutral**, and the only colour in it is the primary its *Clear
  filter* shares with the pressed class pill. Amber is left to **Needs attention**, a failed
  **re-check**, and **read-only**.
- [ ] The strip still names **all three kinds** of narrowing — classes, priorities and page
  scope — in one sentence, under one *Clear filter*. Its sentence does not change.
- [ ] A **comparison shows two labelled sides**, *Production* and *New site*, and **never an
  arrow**. The shared diff renderer carries this contract, so every surface that draws a
  comparison inherits it.
- [ ] Whether the two sides sit side by side or stack is decided by a **container** size query,
  not the viewport, so the same component stacks inside a narrow group and sits side by side in
  the content view.
- [ ] Long Dutch paragraphs, German compound words, URLs and filenames wrap in both sides. No
  compared content is permanently hidden by truncation.
- [ ] `npm test` passes, including the palette guard, which must stay green — no ninth tone.

## Traps

- **The class pill is refused as a candidate for conversion to text.** Ticket 79 removed the row
  tint from the content view because in a view where every visible row is work a tint says
  nothing, and it left the pill carrying the whole signal. Converting the pill would re-create
  what 79 solved. ADR 0019 records this refusal.
- **The arrow is not a style choice.** `CONTEXT.md` retires the word *Changed* because the tool
  cannot know that one text became another. An arrow asserts exactly that. Do not reintroduce it
  as a glyph, a caret, or the word *to*.
- **Do not add a tone.** The palette guard refuses a ninth key in any tone-keyed map. Everything
  here is achievable with the eight that exist.
- **Do not move a number.** No bar, denominator, percentage or bucket rule changes. A filter has
  never moved a count and this does not change that.
- **Container *style* queries are refused by ADR 0015; container *size* queries are permitted.**
  They share a syntax and not a Baseline row.
- **Coordinate with 133 rather than racing it.** If 133 has not landed, this ticket waits — the
  two touch the same two files and 133 must be able to prove it changed nothing.
