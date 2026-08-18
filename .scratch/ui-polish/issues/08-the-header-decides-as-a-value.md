# 08 — The header decides as a value

**What to build:** nothing an editor can see. This is the prefactor that makes the next two tickets
easy: *what may an editor do to this page right now* stops being scattered through the page header's
JSX and becomes one function that returns a value.

Today the header works it out in several places at once — whether there is a review and whether it
went stale, whether there is a priority and a note, whether the override log can be written, whether
a name has been given, whether the local re-check service answers. Each reading is made where it is
drawn, so no test can ask the question without rendering a page, and the two tickets that follow
would each have to re-derive all of it.

After this ticket the header draws exactly what it draws today, from a value it is handed.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

**Parent:** 07-the-page-header-is-one-quiet-line.md

- [ ] One module under the web layer's `lib`, exporting **one** function. It takes the page's
      review, its annotations, whether the log can be written, whether an editor name is set, and
      whether the local service answers. It returns the header's reading and, for each action the
      page offers, whether it is present, absent, or present-and-refused with a reason.
- [ ] It imports no component and renders nothing, in the same shape as `explainScope()`,
      `blockReading()`, `bucketOf()` and `collapses()`.
- [ ] The refusal sentences come from `whyNotWriting()`. No second set is written.
- [ ] *Absent* and *refused* are different answers and the type says so: a re-check with no local
      service is **absent**, and a decision with no editor name is **refused with a reason**.
- [ ] The page header consumes the value for its existing reading. No control moves, no wording
      changes, and the rendered header is the one that is there today.
- [ ] A data-level test in the shape of `search.test.mjs` and `blocks.test.mjs`, built one cycle at
      a time — one test, then the implementation it asks for, then the next. Do not write the suite
      first.
- [ ] `npm test && npm run lint && npm run build`.

## Traps

- **This is not a trivial mapping and it must not become one.** The standards refuse a test that
  mirrors a one-line function. The value here is worth testing because of the refusals — five
  inputs and four ways to be told no — so if the function ends up as a pass-through the design is
  wrong, not the test.
- **Do not mock anything.** The inputs are plain values. If a test needs a mock to reach this
  function, the interface is wrong.
- **Do not move a control in this ticket.** The whole worth of a prefactor is that it proves nothing
  moved.
- **Keep the interface small.** One function, few parameters. Two functions that each answer half of
  *what may an editor do here* is the shallow module the standards warn about.
