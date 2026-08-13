# 124 — The interface speaks one language, and it is English

Type: task
Status: ready-for-agent
Blocked by: None — can start immediately.
Parent: ../map.md

**What to build:** an editor opens the log and reads it in English, everywhere.
The doorway says **Choose a store**, the dashboard offers **Repeats** and
**Pages**, a finding offers **Fixed** and **Dismiss**, the page tabs are
**Text / Links / Images / Meta**, and a screen sent to a colleague reads
`/nl/?view=pages&classes=copy`. The document declares `lang="en-GB"` instead of
claiming to be Dutch on all six stores. Nothing about what the log *means*
changes: no count, no bar, no denominator and no derivation moves.

One ticket and one merge. The intermediate state is a half-Dutch application,
which is worse than either end, and the stopword guard below cannot pass until the
labels are done. Commit per area inside the branch.

## The decision

One interface language for all six stores, and that language is English (UK), in
the same Simplified Technical English the docs use. The rule from spec 32 survives
untouched — it was never "Dutch", it was *one* language, on the grounds that
matching two strings needs no comprehension of either. Only the value changes.
There is no i18n machinery, no message catalogue and no translation affordance.

**`CONTEXT.md` is the source of the labels.** It is already in English and already
names nearly every control, so this is not a translation job — it is making the
labels agree with the glossary. Where the two disagree, the glossary wins.

## Three labels are corrected, not translated

- **Repeats**, for the `Verschillen` view. The Dutch is imprecise already: the
  view lists **repeats**, and **difference** is a defined term that is wider than
  a finding. *Differences* would carry the imprecision across.
- **Clear**, for `Ongedaan maken`. The glossary says "There are no `un-` words",
  and *Undo* is exactly the word it refuses. The action is **Cleared**.
- **claimed fixed, still differs**, for `nog niet opgelost`. That is the sentence
  the glossary prescribes for a **contradicted** finding. The Dutch says "not yet
  solved", which was never it.

And one name the glossary does not hand over cleanly: the tab is **Text**, not
*Content*. `CONTEXT.md` retires "Content" as the old flat-Markdown tab, and
**content view** is the name of the spine that tab draws — one word would mean
three things. `Text` is the check's own name.

The rest follow the glossary: **Show noise**, **Clear filter**, **Include
closed**, **one-sided**, **Fixed**, **Dismiss**, **Re-check**, **Snapshot**,
**Class / Production / New site**, **Worst first**, **blocks**, **boundary**,
**changed since review**, **All stores**.

## What moves

- **Every label in `web/src`** — doorway, shell, breadcrumb, store switcher,
  dashboard, chips, filter strip, class groups, bulk control, search, content
  view, ledger, diff, annotations, override control, progress, re-check.
- **`lang="en-GB"`** on the shell, and `en-GB` for every formatted date.
- **The store names** — **Netherlands**, **Belgium (Dutch)**, **Belgium
  (French)**, **Germany**, **France**, **United Kingdom** — and the build guard's
  message, which loses the word "Dutch". The switcher still draws the store id and
  keeps the name in the `title`: ticket 38 decided that and it stands.
- **The five URL parameters**, to the internal keys they already have:
  `weergave`→`view`, `sortering`→`sort`, `zoek`→`query`, `soort`→`classes`,
  `afgesloten`→`closed`. The values are already English and do not change.
- **The route** `/zoekindex/<store>.json` → `/search-index/<store>.json`.
- **The export filenames** → `<store>-<page>-production.md` and `-new.md`.
- **`shared/excluded-regions.mjs` reason prose**, which is Dutch today beside
  `drop-rules.mjs`'s English on the same dashboard. It was breaking ticket 56's
  own convention; this is a correction, not scope creep.
- **`CONTEXT.md`**, entry by entry, each Dutch label struck and dated in place —
  the treatment that file already gives a retired word — so a reader of ticket 122
  can still resolve *Verschillen*.
- **About 25 inline test assertions** across six files. No snapshots, so each
  breaks by name.

## What does not move

- **Editor notes, in any language.** A Dutch note is a recorded judgement and the
  tool must not rewrite one. Only the placeholder turns English. Test fixtures
  standing in for a note may stay Dutch.
- **The class pills.** They draw the raw class key, and English chrome is what
  removes the reason anyone wanted a label for it. The `meaning` tooltip becomes
  same-language for free.
- **`drop-rules.mjs`**, already English.
- **The scraped content**, obviously. Every diff cell holds prose production
  wrote; this changes the frame and never a character inside it.
- **42 of the 46 markdown files** that quote a Dutch label, and both Dutch
  filenames. See the traps.

## Acceptance criteria

- [ ] Every string the log draws is English (UK) in Simplified Technical English:
      doorway, shell, breadcrumb, switcher, dashboard, page, and every tooltip,
      empty state, banner, placeholder and failure sentence.
- [ ] The three corrections and the `Text` tab are as above. Nothing reads
      *Resolved*, *Undo* or *Differences* for the view, in the interface or in the
      code.
- [ ] `<html lang="en-GB">` on all six stores, and `en-GB` dates.
- [ ] The six English store names, and the guard message without "Dutch".
- [ ] The five parameters, the route and the export filenames are renamed. The old
      Dutch parameter names are **not** accepted as aliases: a half-migrated
      contract is a second contract to keep. Back still restores the screen and a
      copied link still carries it.
- [ ] `excluded-regions.mjs` reason prose is English.
- [ ] `docs/adr/0014-the-interface-speaks-english.md` records the decision, the
      alternative (per-store chrome with i18n machinery) and why it lost. It names
      all four reversed statements — `38-six-stores.md:46`,
      `32-scannable-log-and-six-stores.md:176` and `:398`, and ADR `0010:93-94` —
      and states that the surviving half of decision 42 is **no translation
      affordance**, so the reversal is not permission to add i18n.
- [ ] The ADR also records: the copied-link promise retracted knowingly; ticket
      56 and 85's "labels Dutch, reasons English" convention retired, because with
      English labels it has no two sides; ticket 80's ban on "Resolved" surviving
      and gaining teeth; and the accepted regression that on `/uk/` the chrome and
      the content are one language, distinguished by the two columns, the diff
      cells and the class pill rather than by accident.
- [ ] ADR 0010 gains a note that its parameter-name clause is amended by 0014. It
      is not superseded; the rest stands.
- [ ] Ticket 38's criterion and both of spec 32's statements are struck through in
      place and dated, each pointing at ADR 0014. The tick on 38's stays: it was
      met, and then the decision changed. The standing caveat in the two `notes/`
      files — "The interface is Dutch, so translate this before it goes out" — is
      struck and dated too.
- [ ] `CONTEXT.md` carries the English labels throughout, with each Dutch one
      struck and dated. The **Cleared** entry restates the no-`un-`-words rule
      against *Undo*, its first real test.
- [ ] `CONTEXT.md` states that **untranslated** is a finding class on scraped
      store content — a store page showing NL text — and never a description of
      this interface. Two meanings for one word is what that file exists to stop,
      and this stream is where the collision becomes available.
- [ ] The UK spelling rule is written beside `map.md`'s Simplified Technical
      English line. It has been a convention by usage only: `behaviour`,
      `honouring`, `normalisation`, and no rule anywhere.
- [ ] A stopword guard runs in `npm test` over `web/src/**`, excluding
      `*.test.mjs`, and fails on `pagina`, `winkel`, `verschil`, `wissen`, `geen`,
      `niet` and `resolved`. Its job is labels, not fixtures.
- [ ] Every existing test passes, with the Dutch assertions rewritten to the
      English labels by name. No count, bar, denominator or derivation moves, and
      the tests that pin that rule pass unchanged.
- [ ] `map.md` carries the entry, and ticket 42 lists 124 as a blocker.

## Traps

- **Do not edit the other 42 markdown files.** 168 label occurrences across 46
  files, and all but the four named above are narrative: they recount what a
  button said, and a reader does not act on them. The test is whether the line
  would make somebody build Dutch. `map.md:221` recounts a `Negeren` note and
  stands; `38:46` instructs, and is struck.
- **Do not rename `112-dempen-leaves-the-interface.md` or
  `122-verschillen-groups-by-class.md`.** A filename is an address, and renaming
  breaks every link in `map.md` for a word in a title.
- **`Text` is a tab, `text` is a check, `content view` is the spine.** Getting
  this wrong revives a retired name.
- **`lang="en-GB"` is right for the chrome and wrong for the content cells.** A
  German paragraph on `/de/` will inherit `en-GB` instead of `nl` — a different
  wrong answer, not a new one. Ticket 125 fixes it, and this ticket must not
  smuggle a per-cell `lang` in.
- **The switcher label stays the store id.** An English name is not an invitation
  to draw `Germany` where a reader learned six ids.
- **`classes` is plural and `soort` was singular.** The parameter has always
  carried a list; the Dutch name was the thing that read as one.
- **The `terug` sentinel** in ADR 0010 is a different mechanism from the five
  parameters. Rename it only if it reaches the address bar.
- **The row tint is gone and stays gone.** Do not reintroduce a signal while
  relabelling the rows that carry the class pill.

## Notes

This blocks 42, which builds the axis B tab: writing Dutch labels there and
deleting them a week later is writing the same text twice. 42's own subject is
untouched — it compares scraped content and never chrome.

The work may not fit one context window. The mitigation is a commit per area on
the branch, not a second ticket.
