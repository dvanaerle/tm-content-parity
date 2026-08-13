# 42 — Untranslated text

Type: task
Status: ready-for-agent
Blocked by: 39, 38, 124
Parent: ../map.md

## What to build

The highest-value check on this axis, and the first per-page one. A de page that
shows the exact Dutch sentence from the nl page must say so.

It also builds the axis B tab on a store page. The per-page checks live there;
the presence checks stay in the Coverage view. Ticket 12 owns the ledger tabs.

## Rules from ticket 11

- **The signal is a string that is byte-identical to the NL string.** There is no
  language detection and no confidence score. Ticket 02 removed the confidence
  axis from this project, and a probable score is what it removed. An editor must
  understand the finding at a glance.
- **The test is set membership, not element pairing.** A `TextElement` carries no
  DOM path and no selector, so a positional comparison across languages is not
  possible. It is also not necessary: the test is if the store page holds a `norm`
  value that the NL page also holds. There is no pair threshold, no alignment,
  and no sensitivity to a changed order.
- **Suppression is a skip rule, not a list of pages.** Skip a string that holds
  fewer than 3 words after you remove digits, punctuation and units. Skip a
  string that matches a brand token. This covers `Gumax®`, `Tuinmaximaal`,
  `RAL 7016`, model names and dimensions, which are correctly identical in every
  language.
- **The skip-token list is committed in `compare/`**, next to the other
  comparison rules. Read the `tuinmaximaal-translator` glossary once and commit
  the list. It is **not** in Supabase: an editor who records a judgement and an
  editor who changes the rules hold two different powers, and ticket 03 made that
  table append-only and unauthenticated on purpose.
- The class is `untranslated`, and it is shown.
- **`untranslated` is about the store's content and never about this interface.**
  Ticket 124 puts the log's own chrome into English, which translates no sentence
  on any Tuinmaximaal page: a `de` page carrying the NL sentence is exactly as
  broken after it. 124 blocks this ticket only because the axis B tab needs
  labels, and writing Dutch ones a week before they are deleted is writing the
  same text twice. The rule above is unchanged.

## Acceptance criteria

- [ ] A de page that holds an nl sentence makes one `untranslated` finding.
- [ ] `Gumax®`, `Tuinmaximaal` and `RAL 7016` make no finding.
- [ ] A string of two words makes no finding.
- [ ] The order of elements on a page changes no finding.
- [ ] The axis B tab shows the findings on a store page, with its own count.
- [ ] The axis A tabs and the axis A bar do not change.
- [ ] `npm test` is green. The skip rule and the membership rule have tests.

## Notes

Use `tuinmaximaal-translator` to build the skip-token list. It holds the approved
glossary and is the authority on what a brand token is. It is a skill and not a
machine-readable file, so this is a one-time extraction.

Measure the volume before you call this done. If one shared page footer is
untranslated on every de page, the tab fills with the same finding. That is a
real result and it belongs in the ticket, ~~but it may also want the class-mute
that already exists.~~ — **struck 2026-08-13, ADR 0011: there is no class-mute.** A shared
footer untranslated on every `de` page is a **repeat**, and the answer to a repeat is one
bulk dismissal over its pages (ticket 110), not a press that never expires.
