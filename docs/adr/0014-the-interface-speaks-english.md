# The interface speaks English, on all six stores

The log's chrome was Dutch on every store. It is now English (UK), written in the same
ASD-STE100 Simplified Technical English the docs use, on all six stores.

**The rule this reverses is not the rule it looks like.** Ticket 38 decided that the
interface stays **one** language everywhere, on the grounds that matching two strings needs
no comprehension of either. That reasoning is untouched and it still holds. Only the value
changes: one language, and that language is English.

`CONTEXT.md` is the source of the labels. It was already in English and already named
nearly every control, so this was not a translation job — it was making the labels agree
with the glossary. Where the two disagreed, the glossary won.

## Why

- **The glossary is the only written vocabulary this project has**, and it is English. Two
  vocabularies for one tool is the collision `CONTEXT.md` exists to stop, and the interface
  was the half nobody could cite.
- **Four of the six stores are not Dutch.** A `de` editor read a Dutch dashboard about
  German pages. One language is still right; Dutch was never the language the whole audience
  shared.
- **Three labels were wrong in Dutch and could not be corrected by translating them.**
  *Verschillen* names differences and the view lists **repeats**, which is the narrower and
  the true unit — *Differences* would have carried the imprecision across. *Ongedaan maken*
  is *undo*, and the glossary says there are no `un-` words; the action is **Cleared**.
  *nog niet opgelost* says "not yet solved", and the finding is **contradicted**, whose
  sentence the glossary already prescribed: *claimed fixed, still differs*.
- **The `Inhoud` tab is `Text` and not `Content`.** `CONTEXT.md` retires "Content" as the
  old flat-Markdown tab, and **content view** is the name of the spine that tab draws. One
  word would have meant three things. `Text` is the check's own name.

## The alternative, and why it lost

**Per-store chrome, with i18n machinery** — Dutch on `nl` and `be`, French on `be_fr` and
`fr`, German on `de`, English on `uk`. Rejected.

It buys an editor their own language and costs a message catalogue, a key for every string
in `web/src`, six translations of each one, and a review path for the day a label changes.
The log has about 200 strings and one reader per store. Worse, it makes every screen
untestable by name: the browser tests assert on the words on screen, and under a catalogue
they would assert on keys — which is the same test asserting nothing about what an editor
reads. And it re-opens what ticket 38 closed: the log's question is whether two strings
match, so comprehension of the chrome is not what the tool is for.

**The surviving half of decision 42 is `no translation affordance`.** Reversing the
*Dutch* half is not permission to add i18n. There is no message catalogue, no locale
switch and no per-store chrome, and a request for one is a new decision and not a
continuation of this one.

## What this reverses, by name

Four statements said the interface is Dutch. Each is struck through in place, dated, and
points here:

- `.scratch/content-parity-log/issues/38-six-stores.md:46` — the criterion. **Its tick
  stays**: it was met, and then the decision changed. A criterion that was met and later
  reversed is not a criterion that failed.
- `.scratch/content-parity-log/issues/32-scannable-log-and-six-stores.md:176` — user story
  39.
- `.scratch/content-parity-log/issues/32-scannable-log-and-six-stores.md:398` — decision 42,
  whose second sentence — *no translation affordance* — **survives**.
- `docs/adr/0010-the-dashboard-screen-is-the-url.md:93-94` — the parameter-name clause. ADR
  0010 is **amended and not superseded**: the rest of it stands, and the amendment is only
  that the five names are English.

The standing caveat in the two `notes/` files — *"The interface is Dutch, so translate this
before it goes out"* — is struck and dated as well. Those notes go to a Dutch reader and
the interface no longer needs a translator between them.

## What else this decides

- **Ticket 56 and 85's convention is retired.** It read *labels Dutch, reasons English*, and
  with English labels it has no two sides. `shared/excluded-regions.mjs` is corrected in the
  same breath: its reason prose was Dutch beside `drop-rules.mjs`'s English on the same
  dashboard, which was already breaking the convention it was written under.
- **Ticket 80's ban on *Resolved* survives and gains teeth.** It hid the difference between
  a claim of fact and a judgement, and until now nothing enforced it. The stopword guard in
  `npm test` refuses the word, which is the first mechanical check that rule has ever had.
- **The copied-link promise is retracted knowingly.** ADR 0010 made the five parameter names
  as stable as the page keys, and this renames all five. The old Dutch names are **not**
  accepted as aliases: a half-migrated contract is a second contract to keep, and two names
  for one parameter is the ambiguity the rename exists to remove. A link copied before this
  change opens the dashboard on its default screen. It is a dashboard and not a document, so
  what is lost is one reader's filter and never a reference somebody cited.
- **An accepted regression on `/uk/`.** There the chrome and the content are one language,
  so the frame no longer stands out from the words it frames. What separates them is
  structural instead of accidental: the two columns, the diff cells and the class pill. It
  was the same reading on `/nl/` before this change, and nobody reported it.

## Consequences

- `lang="en-GB"` on the shell, and `en-GB` for every formatted date. **The content cells are
  a separate question**: a German paragraph on `/de/` now inherits `en-GB` instead of `nl`,
  which is a different wrong answer and not a new one. Ticket 125 fixes it per cell, and
  this decision must not smuggle a per-cell `lang` in.
- The store names are English — Netherlands, Belgium (Dutch), Belgium (French), Germany,
  France, United Kingdom — and the build guard's message loses the word "Dutch". **The
  switcher still draws the store id** and keeps the name in the `title`: ticket 38 decided
  that and it stands. An English name is no invitation to draw `Germany` where a reader
  learned six ids.
- The five screen parameters are `view`, `sort`, `query`, `classes` and `closed`. `classes`
  is plural because the parameter always carried a list; `soort` was the name that read as
  one. The page parameters `bevinding` and `terug` reach the address bar too, so they are
  `finding` and `back`.
- The route is `/search-index/<store>.json` and the exports are
  `<store>-<page>-production.md` and `-new.md`.
- **Editor notes are not touched, in any language.** A note is a recorded judgement and the
  tool must not rewrite one. Only the placeholder is English.
- **The class pills still draw the raw class key.** English chrome removes the reason
  anybody wanted a label for them, and the `meaning` tooltip becomes same-language for free.
- A **stopword guard** runs in `npm test` over `web/src/**`, excluding `*.test.mjs`. Its job
  is labels and not fixtures: a test stands a recorded note in for an editor's judgement.
- `CONTEXT.md` carries the English labels, with each Dutch one struck and dated in place, so
  a reader of ticket 122 can still resolve *Verschillen*. It also states that
  **untranslated** is a finding class on scraped store content and never a description of
  this interface.
- No count, no bar, no denominator and no derivation moves. That is what makes this a
  relabelling: the suite passes, and the tests that pin those rules pass **unchanged** —
  `view.mjs` and `bulk.mjs` are edited in their comments only.
