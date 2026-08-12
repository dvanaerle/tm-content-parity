# The dashboard screen is the URL, and a page link names the difference

The ask was a modal: *if you open `lighting-system/productinformatie genegeerd` it goes to
the page — wouldn't a popup be more user-friendly, so you never get lost on a page?*

We refused the modal and kept the complaint. What would have to go **in** the modal is the
whole content view: a one-sided difference asks *where does this text belong*, and only the
rows around it in document order answer it (ADR 0006). Three one-sided classes are 82% of
the corpus. A modal holding one difference is the Diff tab ticket 12 retired, with a
backdrop over it. There is also nothing to put in it — the dashboard carries `PageSummary`
and trimmed findings, not `rows`, so a context-bearing overlay needs a per-page endpoint
that does not exist.

So *lost* was read as two losses, and both are navigation rather than layout:

| lost | before | now |
| --- | --- | --- |
| inside the page | the link named the page, and the reader landed at the top of a view holding a median of 37 findings and 399 on the worst page | the link names the **finding**, and the page lands on it |
| on the way back | every dashboard control was session state, so Back returned an unfiltered queue from the top | the **screen** is the query string, so Back restores it and the link can be sent |

## The screen is what is drawn, and it is in the URL

Five controls: the view, the sort, the search term, the class pills and *inclusief
afgesloten*. They move no bar, no denominator and no count — ticket 36's rule is untouched,
and `screen-url.mjs` only says where the state is kept.

Three rules make the URL safe to hand around:

- **Only what differs from the default is written.** An untouched dashboard has a clean URL,
  so a query in a copied link carries a *choice* — and the default can be changed later
  without stranding every link that was ever sent.
- **`replaceState`, never `pushState`.** Toggling a pill is not a place to go back to. Ten
  presses would be ten entries between the editor and the screen they came from, which is
  the thing this exists to protect.
- **The mirror is debounced.** The search box is one of the five controls, so typing a word
  is one write per keystroke; Safari throttles `replaceState` and starts dropping calls, and
  the address bar would end up holding a prefix of what is on screen.

**Which group is open stays out**, for the reason `Class group` gives: opening a group is not
a filter, so it is session state, and a URL that pinned it would make *filter wissen* and the
address bar disagree about what a filter is.

## The link names a finding, and the page translates it

The dashboard holds **finding ids**. The row anchor `p12` is production's document position
and only the page's own report knows it, so the link cannot carry a row — it carries
`?bevinding=<id>` and the page resolves it. That is also what lets a link reach a `links` or
`images` finding, which no row anchor covers: `landingFor()` picks the tab from the finding's
check.

A landing is **not** a filter. It opens the row, marks it, takes the keyboard and scrolls —
and removes nothing, so ADR 0006 holds by construction.

Five things a landing has to get right, each of which was wrong first:

- **It waits for the log.** A decided row grows an override control when the log answers, so
  a landing taken before that is measured against a layout about to move. Measured on
  `nl/carport`: 273 pixels.
- **It takes the focus, not only the colour.** An outline is a landing for a reader who can
  see it. `tabIndex={-1}` on the landed row and `aria-current="location"` are what make it
  one for everybody else.
- **It expires.** A finding id is a term of `sha256(store | page | check | rule | prodNorm |
  newNorm | detail)`, so a link outlives the finding it names. A stale link says so and
  leaves the page whole.
- **It only borrows the two controls, and gives each back on its own.** A landing needs a
  tab, and sometimes *Ruis en gedempt tonen*. One "the reader has chosen" flag made the two
  hand each other back: ticking the toggle threw a reader off Links, and switching tabs
  released the toggle that was the only reason the landed row was drawable, so the row
  vanished. Two controls, two flags — `useLanding()`.
- **Not every finding has a tab.** The Meta tab is `metaRows()`, display only, so the one
  `meta` rule is a finding no tab draws. Asking for the noise toggle on the way to a row
  that does not exist buys a screenful of noise and no landing, so `landingFor()` reports
  it the way it reports a stale link: `unplaced`, and the page says so.

## Considered options

- **A modal holding the difference.** Rejected above: it is ADR 0006's rejected option with
  a backdrop, and the data for a context-bearing version is not on the dashboard.
- **A side sheet loading the real report over the dashboard.** Rejected for now. It answers
  *never leave* honestly, and it costs a per-page JSON endpoint, a second mount of the
  override hooks and a much heavier payload. It is the option to revisit if landing turns out
  not to be enough.
- **A hash link, `#p12`.** Rejected. The dashboard does not know row positions, and a hash
  cannot reach the two tabs whose rows are findings.
- **Leaving the screen in session state and relying on bfcache.** Rejected. It restores
  nothing a colleague can be sent, and nothing survives a reload.

## Consequences

- `CONTEXT.md` gains **Screen** and **Landing**, and **Filter** no longer says
  *session-only* — on the dashboard it is part of the screen. On a page it still is:
  a page filter is a pass an editor is making, not a place to return to.
- The parameter names are part of every link an editor copies, so `weergave`, `sortering`,
  `zoek`, `soort` and `afgesloten` are as stable as the page keys.
- `terug` arrives off the address bar and is laundered through `screenFromSearch()`, which
  keeps the five keys the dashboard has. Nothing else can reach an href.
- Two seams are the browser rather than a pure function — the mirror and the landing — so
  the suite gained a second vitest project that runs real Chromium. A pretend DOM would
  answer a question about `history` and `scrollIntoView` by definition, which is not the
  question worth asking.
