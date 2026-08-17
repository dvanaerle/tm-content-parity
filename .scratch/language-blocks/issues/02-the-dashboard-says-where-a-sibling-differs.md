# 02 — The dashboard says where a sibling differs

**What to build:** an editor of `be` opens their dashboard and sees which of their pages disagree
with the `nl` sibling, worst-first, and which pages `nl` has that they have not. An editor of `nl`
sees the mirror of it. It compares **production** — the reference side — and says so.

This is the whole reading in one ticket: the **language block** vocabulary, the **sibling page**
match, the divergence measure and the list that draws it. It is one ticket because a block with no
surface is a glossary entry for a panel that does not exist.

**Blocked by:** 01 — the language fact must be readable from the web layer.

**Status:** resolved — 2026-08-17, branch `ticket-104-search-page-scope`.

Work it in four commits, in this order — a commit per area and not a second ticket, in the manner
of ticket 124 in `content-parity-log`:

- **A. the vocabulary** — blocks derived from the languages.
- **B. the match** — sibling pages, and which rule matched.
- **C. presence** — the list, sibling-absent rows only. Verifiable end to end from the seed list
  alone, with no report read and no text compared. **If the ticket runs out of context, stop
  here**: this is a complete, useful surface.
- **D. identity** — the same list gains the pages both stores have, ranked.

- [x] Blocks are **derived** from the stores' hreflang languages and no list of blocks is written
      by hand: `nl-NL`/`nl-BE` give `{nl, be}`, `fr-BE`/`fr-FR` give `{be_fr, fr}`.
- [x] `de` and `uk` are in no block, and a test says why — each is alone in its language — so the
      answer survives the next person who asks.
- [x] A sibling page is matched by the **hreflang alternate production declares** first, and by
      **path equality** only where neither page declares one, with `be_fr`'s leading `fr/` stripped
      for the comparison alone.
- [x] A page that would match by path but declares a different alternate follows the alternate.
- [x] **Which rule matched is carried on the sibling**, as a cell's `provenance` is — it is data and
      not a comment.
- [x] The French block is as complete as the Dutch one: the path rule reaches the pages that declare
      no Dutch counterpart, which is most of `be_fr` and `fr`.
- [x] The store dashboard lists the pages whose **sibling is absent**, distinguished from the pages
      both stores have. `blog`, `klantenservice` and `contactformulier` are absent from `be`;
      `pergola` and four `herroeping-*` webforms are absent from `nl`; the French block splits on
      `galerie/eclairage` against `galerie/eclairaige`.
- [x] The pages both stores have are ranked worst-first by how much their text diverges, measured
      over production's content units on **normalised text** as the share of one store's unit texts
      that appear exactly in the sibling's.
- [x] A page whose sibling is byte-identical says so in its own words, and does not read as though
      the comparison failed to run. This is 66 of 125 pages in the Dutch block and 48 of 120 in the
      French one, so it is the common case and not an edge.
- [x] The list says which side it compares, and the answer is production.
- [x] The list says it is **not a census**: a page no sitemap declares is absent from it, and 48 of
      `nl`'s 181 cells are carried over for exactly that reason.
- [x] Nothing is excluded — no list of legal or ephemeral pages exists.
- [x] The whole reading is **decided as values** in the pure layer and only rendered by the
      component, in the manner of `explainScope()`.
- [x] No count, bar, denominator or roll-up moves, and no class is added to the class vocabulary.
- [x] ADR 0017 records the model: a block is a **view and not an axis**, and why the word "axis" is
      refused — an axis here means a tab, a task and in the end a count, and ticket 11's rule about
      not summing two bars exists only because an axis has one.
- [x] `CONTEXT.md`'s **Language blocks** section is accurate against what was built. *(Written
      during the grilling, 2026-08-17.)*
- [x] The full suite passes, including the stopword guard.

## Traps

- **Do not call it a pair.** A **store-page pair** is production against the new site for one store
  page; a block is two stores on one side. The grilling made this mistake before catching it.
- **Do not call it an axis and do not add a class.** A block difference is a **display-only
  difference** — no id, no override, no bar — and it is never called a finding.
- **Do not touch `pageKey()` or the seed list.** Merging `be_fr` and `fr` upstream is the tidier
  model and it expires every finding id on those two stores and breaks every existing link into
  them, to make a display-only view cheaper. The join lives in the derivation.
- **Do not strip `fr/` anywhere but the comparison.** It is real in every URL.
- **Do not exclude the legal pages.** They are among the least identical — `disclaimer` 71%,
  `copyright` 67% — and they carry 4.5% of the Dutch block's difference volume and 8.6% of the
  French one's. An exclusion buys nothing and excludes at page granularity what varies at unit
  granularity, the mistake ADR 0003 avoided by excluding *regions*.
- **Do not build a `/block/nl-be/` route.** One screen per block instead of two mirrored ones is
  cheaper and it is a third kind of dashboard belonging to no store, which ticket 38 settled
  against: a store is the unit an editor is responsible for.
- **Do not borrow axis B's `missing-page` or `orphan-page`** for the sibling-absent row. Those were
  specified as counted classes in a vocabulary that stays closed, and axis B stays parked.
- **The ranking is not a score on a finding.** It orders a list and nothing else.

## Comments

**2026-08-17 — built, in the four commits the ticket asked for.**

**A — the vocabulary.** `shared/language-blocks.mjs`: `LANGUAGE_BLOCKS`, `languageOf()`,
`blockOf()`, `siblingOf()`, all derived from `HREFLANG_STORE` by grouping the codes on the
part before the region. Two of the five tests are guards rather than slices — they passed
the moment they were written — and they read the derivation against `HREFLANG_STORE` and
never against a second copy of `{nl, be}`. Checked by breaking the derivation: all five
fail. `siblingOf()` answers with one store because a block holds two, and the test asserts
that shape rather than the function assuming it.

**B — the match.** `siblingPages()` in `web/src/lib/blocks.mjs`. Alternate first, path
second, `fr/` off for the comparison alone. The ordering test is the one worth keeping and
it was verified by flipping the two rules. Against the committed seed list: `be` 126
alternate + 0 path of 131, `nl` 126 of 181, `be_fr` 28 + 92 of 122, `fr` 28 + 92 of 123 —
the ticket's numbers exactly, asserted in `describe('the committed seed list')` in the
manner of `crawl/seed-list.test.mjs`.

**C — presence.** Verifiable from the seed list alone, as asked: no report is read and no
text compared. `blog`, `klantenservice` and `contactformulier` are among `nl`'s 55; `pergola`
and the four `herroeping-*` webforms are `be`'s 5; the French block splits on
`galerie/eclairage` against `galerie/eclairaige`, reported as an absence on both sides
rather than guessed at.

**D — agreement.** Measured, and it reproduces the ticket's whole table: `nl`/`be` 125
measured pages, 66 identical, 5,722 units against 5,631, 5,150 found, 90.0%, bands 33/22/4;
`be_fr`/`fr` 120, 48, 5,221/5,210, 4,952, 94.8%, 43/29/0. Worst page
`algemene-fotogalerij` at 6 of 163. `copyright` and `disclaimer` are in the list — nothing
is excluded.

Those figures are **not** in a test. `data/reports/` is out of git by design
(`.gitignore` names the four exceptions), so a test over it would fail on a fresh clone. The
unit tests work from fixtures; the measurement is recorded here and in the commit message,
as ticket 01 recorded its own.

**Two judgement calls worth reading.**

1. **Absence has two directions, and both are shown.** The ticket's opening sentence says an
   editor of `be` sees "which pages `nl` has that they have not", while the checkbox names
   only "the pages whose sibling is absent" — opposite directions. Both are built, as
   `sibling-absent` and `only-in-sibling`, because they are different work: one is a page
   somebody over there builds and the other is a page somebody here builds. Both readings of
   the ticket are satisfied and neither is contradicted. They come from one rule read twice,
   so the two directions cannot disagree about what absence is.
2. **The measure is called *agreement* and not *identity*.** The ticket and the PRD both say
   "identity", and `CONTEXT.md` already gives **Identity** to the finding id — what makes two
   differences the same difference. How much two pages say the same thing is a different
   question, and two meanings for one word is what that glossary exists to stop, in the same
   way the PRD itself refuses "pair". The row kinds `identical` and `diverged` keep the
   adjective, which collides with nothing.

**A fifth kind of row the ticket does not name.** `unmeasured` — production did not answer
200 on both sides, so nothing was compared. It has no share, because a share of zero would
accuse a page of diverging when what happened is that nobody looked, and it sorts after
every measured page. This is `explainScope()`'s own precedent, which grew a fifth kind past
the four its ticket named.

**What was not touched.** `pageKey()`, `data/10-store-seeds.json`, the finding id, the class
vocabulary, and `Dashboard.jsx` — so no count, bar, denominator or roll-up can have moved.
No `/block/nl-be/` route. `de` and `uk` get `null` and draw no panel, and their build reads
no sibling reports at all.

The panel ships **no JavaScript**: the reading is decided at build time in the Astro
frontmatter and handed over as a value, so no content unit crosses the wire. It carries no
decision control, no class pill, no bar and no link — a seed-list page can have no report and
so no route, which is why the *Not checked* aside states its pages as text too.

ADR 0017 records the model. `CONTEXT.md`'s **Language blocks** section gained the match rule
as data, the agreement share with its refusal of the word *identity*, the five row kinds,
the census sentence and the pointer to the ADR.

Full suite 934 passing, including the stopword guard. `oxlint` clean, `oxfmt` clean on the
touched files. No typecheck exists in this repo.

**One thing left for ticket 04.** The reserved "fifth tab" comment in `Ledger.jsx`'s `TABS`
still says the fifth tab is axis B's coverage. That comment belongs to the sibling tab's
ticket and is untouched here.
