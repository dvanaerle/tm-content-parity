# 134 — The ledger wears its tone

Type: task
Status: ready-for-agent
Blocked by: 132 — the tones and shapes this surface asks for.
Parent: ../map.md

**What to build:** the page's ledger and the controls beside it stop holding colour strings. The
ledger, the override control, the annotate bar, the bulk control, the search result and the page
island ask for a tone and a shape.

This is the last **migrate** batch. It is the widest by file count and the most varied by shape:
the bucket strip and the tab badges wear pills, the banners wear the banner shape, the fix
checkbox wears the accent, and the history notes wear ink.

**The third transcription lives here.** The fix checkbox's tick map writes `data-checked:`
prefixes by hand because a palette token cannot carry a variant. It has three visual states and
two of them are ticked — a claim that stands, and a claim a later observation contradicted — and
as selectors over the state the control publishes, the third transcription goes the way of the
other two.

**The accent shape holds status tones only, and that rule has to survive the move.** A checkbox
reports work, and a work state never wears the diff hues: an editor who saw a tick in the diff's
red would read it as a claim about content rather than about their own decision.

- [ ] The ledger, the override control, the annotate bar, the bulk control, the search result and
      the page island emit a tone and a shape and hold no colour string.
- [ ] The fix checkbox's two ticked states are selectors over the state it publishes, and no
      variant prefix is transcribed by hand.
- [ ] The accent shape still holds status tones and no direction.
- [ ] The banner shape still gives its two ambers different pixels. A banner reporting a failure
      and a banner reporting a condition must not print the same shape, or a reader cannot tell
      which one they have.
- [ ] The bucket strip's three buckets keep their tones, and **Needs attention** keeps meaning
      *contradicted and nothing else* — 131 freed the word `attention` for exactly this reason, so
      the bucket and the tone must not be wired to each other by name.
- [ ] The history note's ink and the override state badges move with the rest.
- [ ] No JavaScript map has a caller left after this ticket.
- [ ] Screenshot baselines for the page's four tabs are reviewed per tab and unchanged in colour.
- [ ] No count, bar, denominator or roll-up moves.

## Traps

- **The bucket and the tone are two vocabularies that now share a word.** `closed` is a tone and
  **Closed** is a bucket; `caution` is a tone and **Needs attention** is a bucket. They agree
  today and they are free to disagree tomorrow, so the mapping is written once where the bucket is
  drawn, and never inferred from the name matching.
- **Do not merge the log banner's states while moving them.** Whose fault a failure is belongs at
  the top of the screen, and one reading of the log already answers for the three readers. A tone
  change is not the moment to re-collapse them.
- The re-check button is hidden when the local service is absent, and the hosted build senses
  this. A tone on a control that is not there is not a bug to chase.
- Do not delete a map here either. 135 contracts, and it is blocked by this ticket so that the
  deletion happens once, with no caller left anywhere.
- The uncompared row is not coloured, deliberately: the log is saying the comparison did not run,
  not that somebody rewrote the text. A shape that gives it a tone makes the log assert something
  it refuses to assert.
