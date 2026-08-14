# 80 — Three buckets, and the third is Closed

Type: task
Status: done
Blocked by: nothing — **114 resolved 2026-08-13 and the block is lifted; the sentences it
was waiting on are struck in place below.** The note that added it read: This ticket
enumerates *"five derived states —
`open`, `dismissed`, `muted`, `fixed`, `contradicted`"* and defines Closed partly as *"a
muted finding is Closed but it left the denominator"*. ADR 0011 withdrew the mute: there
are **four** states, and nothing leaves the denominator. The three buckets are unchanged
and correct; only the sentences reasoning from `muted` need cutting, which is why this is
sequenced behind 114 rather than re-triaged.
Parent: ../map.md

**What to build:** the dashboard and the ledger group findings into three: **Open**,
**Needs attention** and **Closed**. An editor can see what waits for a decision, what
somebody already claimed and got wrong, and what needs no current action — without
reading five state words and working out which of them means finished.

## The decision this ticket carries

There are ~~five~~ **four** derived states — `open`, `dismissed`, ~~`muted`,~~ `fixed`,
`contradicted` — and they are correct. What is missing is a grouping over them. A **bucket**
is that grouping. It is not a state, and nothing is stored on a finding to put it in one.
— **`muted` struck 2026-08-13, ADR 0011**; ticket 114 removed it from the derivation, and
the grouping this ticket carries is unaffected.

**Needs attention is `contradicted`, and nothing else.** A page review that went stale
is a fact about a *page*, so it stays a badge on the page. Two scopes in one bucket
would count one thing twice.

**The third bucket is named Closed**, not Resolved. Ticket 09 retired "Resolved"
because it hid the difference between a claim of fact and a judgement, and `CONTEXT.md`
already defines Closed: absent from the snapshot, or dismissed, or claimed fixed and
not contradicted. The proposal that started this work tried to bring "Resolved" back
with sub-reasons underneath it. The sub-reasons are the five states, which already
exist, and the word stays retired.

## Acceptance criteria

- [x] The store dashboard shows three counts per page and three totals for the store.
      Absolute counts sit next to any percentage, because the denominator moves at each
      crawl. — Per page in the `Open · needs attention · closed` cell, per store as three
      chips. The three chips **replace** *differences open* + *closed* + *claimed fixed,
      still differs*: that strip named the contradicted claims twice, because the bar's
      `open` already holds them.
- [x] The ledger groups findings into the same three, and a finding's individual state
      is still visible inside its bucket. A bucket summarises; it does not replace the
      state pill. — A three-count strip above the tabs, and the bucket order on Links and
      Images. `OverrideControl`'s pill is untouched and still on every row.
      **Accepted gap, and a narrowing of what this line asked for:** it says *the ledger*
      and the answer is *two of its four tabs*. Text is not grouped, because that tab is
      the content view in document order and ADR 0006 calls that the spine; Meta has no
      buckets to draw. The strip above the tabs counts all three on every tab, so no
      number is hidden — but a reader of this line should not have to infer the narrowing
      from the answer, so it is written here as one.
- [x] `Needs attention` holds contradicted findings only. A stale page review is a page
      badge saying ~~**gewijzigd sinds controle**~~ **changed since review**, and it is not
      in any finding bucket. — ADR 0014, and `Progress.jsx` already drew it in English.
- [x] The word **Resolved** appears nowhere, in code or in the interface. ~~The Dutch
      interface word for the third bucket is chosen and recorded in `CONTEXT.md`'s
      entry.~~ — **Superseded by ADR 0014**: the interface speaks English, so the word is
      **Closed** and no Dutch word is chosen. Recorded in `CONTEXT.md` all the same. The
      ban is enforced by the stopword guard, which caught a comment in
      `web/src/lib/buckets.mjs` during this ticket and was obeyed rather than amended.
- [x] Closed is kept out of the active workload: it is reachable and it is not the
      default view. — A disclosure on the two finding tables, naming how many it holds.
      **Deliberately not a filter**: hiding Closed by default would delete a row from the
      screen the instant an editor ticked it fixed, with the tick still under the cursor.
      The Text tab keeps document order, which ADR 0006 calls the spine.
      **Accepted gap:** on Text a closed finding therefore *is* in the default view, sitting
      inline where the page puts it. This line is met on the two finding tables and not on
      the content view, and the trade was deliberate — grouping the spine by bucket would
      cost the one thing that tab is for. Reviewed 2026-08-14 and left standing.
- [x] The three buckets are derived in `overrides/state.mjs` as a pure function over the
      ~~five~~ four states, with a test covering each state's bucket, including a
      contradicted claim ~~and a muted finding~~. — **2026-08-13, ADR 0011.**
      `bucketOf()`, with a case per state.
- [x] No new column, action or scope is added to the overrides table. This ticket stores
      nothing. — No migration, and no event shape changed.
- [x] The bar is still computed over the current snapshot only, and this ticket does not
      change any total. — `barOf()` is untouched; a test asserts the three buckets add up
      to its denominator and that Open plus Needs attention is its `open`.

## Traps

- ~~**A muted finding is Closed but it left the denominator**, while a dismissed finding
  is Closed and is in the numerator. Two Closed findings therefore affect the bar
  differently, and the interface must not suggest the bucket determines the bar.~~
  — **struck 2026-08-13, ADR 0011.** The trap is gone with the state that made it: nothing
  leaves the denominator now, so every Closed finding affects the bar the same way. The
  closing warning survives on its own merits — a bucket is a grouping and still does not
  determine the bar, because an absent finding is Closed and is in neither term.
- **`contradicted` is derived and never stored.** Do not add a column for it on the way
  to grouping it.
- The proposal listed "Fix not verified" beside contradicted as if they were two things.
  They are one thing: a fix claim the current snapshot disagrees with. Do not create a
  second name for it.

## Comments

- Runnable look prototype (throwaway): `/prototype/three-buckets?variant=A|B|C`, from
  `web/src/pages/prototype/three-buckets.astro`. Three variants over the real NL corpus with
  **invented** override events — deterministic, hashed from the finding id — fed through the
  real `overrides/state.mjs`, so no variant can show a grouping the derivation would refuse.
  Dashboard and ledger sit on one route, because the question is whether one grouping reads the
  same on both. A: three stacked counts, Gesloten as a disclosure. B: one compact line per page,
  Gesloten as a segmented filter. C: Aandacht nodig hoisted out of the list, Gesloten on a rail.
- Open question the prototype raised: **no palette tone fits Aandacht nodig.** `severe` means
  "the new site is wrong on its own terms", which a contradicted claim is not, and amber has
  only two weights. Either the palette gains a meaning or Aandacht nodig shares `attention`
  with Open and leans on position instead.
  — **Answered 2026-08-14: it leans on position, and the palette gains nothing.** Needs
  attention wears `attention`, which is the tone `contradicted` already wears in `STATE`,
  and **Open drops to `neutral`** so the amber is spent once rather than twice. That is the
  second option with one change: the two do not share the tone, because Open gave it up.
  An eighth meaning in the palette was refused — ADR 0007 keeps that map small, and `INK`
  has no neutral precisely because a plain number is the neutral. Recorded in
  `web/src/lib/buckets.mjs`.
- Status: **done 2026-08-14.** The prototype route named above is gone; it was throwaway and
  the real dashboard and ledger now carry the grouping.
- **Review, 2026-08-14.** Six things came back and five were fixed in place:
  - `bucketOf()` was a bare map lookup returning `undefined` for an unlisted state, and
    `bucketsOf()` then counted into a bucket named `undefined` and left the three real
    numbers reading `NaN`. Both this file and `CONTEXT.md` claimed the grouping was *total
    over the states*, and nothing held the claim. It throws now, and the enumeration and
    the zero-tally come off one list instead of three literals written out by hand.
  - The Closed disclosure could not be collapsed once a landing had opened it: `opened`
    went false while the URL kept `showClosed` true, so the button said *expanded* and did
    nothing. The state is tri-valued now — `null` is *nobody has said yet* — and the
    browser test presses it on the landing path, which is the press the first tests missed.
  - The three chips lowercased the glossary word and the column head hard-coded
    `Open · needs attention · closed`, so one defined term read three ways across the two
    screens this ticket set out to make agree. Both read `BUCKET_LABEL` now, and a new
    `Dashboard.browser.test.mjs` asserts the words as literals off the rendered page.
  - `BUCKET_MEANING` claimed to be *`CONTEXT.md`'s own definitions and not a second set*
    and had drifted into paraphrase — Closed had lost *absent from the snapshot*, which is
    the commonest way a difference closes. The three sentences are the glossary's again.
  - `findingRow` was a JSX-returning helper in camelCase among PascalCase siblings; it is a
    `FindingRow` component.
  - **Not fixed, and argued rather than skipped:** the reviewer read
    `bucketsOf(derived)` inside the Ledger as a breach of that file's *never re-derives*
    contract. It is a redundant call, not a second rule — `derivePageState()` groups with
    the same function, so the two cannot disagree — and threading the count in as a prop
    would move the proof into `PageView.jsx`, which has no test, and leave the ledger's own
    browser test asserting a number the test itself passed in. The contract was the
    inaccurate half, so the docblock now says what it actually forbids: a `switch` on
    `state` grown locally. The call stays.
- **On the acceptance criteria in this file.** Two of them were edited during the work
  rather than annotated beside the original ask — the Dutch word and the Dutch badge, both
  superseded by ADR 0014, which was recorded the day before this ticket started. The
  supersession is legitimate and the strikethroughs name it. The habit is not: an AC is the
  record of what was asked, and editing its text to match what was built loses the
  difference between a requirement that was met and one that was withdrawn. The two
  narrowings found in review are written as **accepted gaps** above for that reason.
