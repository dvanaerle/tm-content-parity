# 02 — The dashboard says where a sibling differs

**What to build:** an editor of `be` opens their dashboard and sees which of their pages disagree
with the `nl` sibling, worst-first, and which pages `nl` has that they have not. An editor of `nl`
sees the mirror of it. It compares **production** — the reference side — and says so.

This is the whole reading in one ticket: the **language block** vocabulary, the **sibling page**
match, the divergence measure and the list that draws it. It is one ticket because a block with no
surface is a glossary entry for a panel that does not exist.

**Blocked by:** 01 — the language fact must be readable from the web layer.

**Status:** ready-for-agent

Work it in four commits, in this order — a commit per area and not a second ticket, in the manner
of ticket 124 in `content-parity-log`:

- **A. the vocabulary** — blocks derived from the languages.
- **B. the match** — sibling pages, and which rule matched.
- **C. presence** — the list, sibling-absent rows only. Verifiable end to end from the seed list
  alone, with no report read and no text compared. **If the ticket runs out of context, stop
  here**: this is a complete, useful surface.
- **D. identity** — the same list gains the pages both stores have, ranked.

- [ ] Blocks are **derived** from the stores' hreflang languages and no list of blocks is written
      by hand: `nl-NL`/`nl-BE` give `{nl, be}`, `fr-BE`/`fr-FR` give `{be_fr, fr}`.
- [ ] `de` and `uk` are in no block, and a test says why — each is alone in its language — so the
      answer survives the next person who asks.
- [ ] A sibling page is matched by the **hreflang alternate production declares** first, and by
      **path equality** only where neither page declares one, with `be_fr`'s leading `fr/` stripped
      for the comparison alone.
- [ ] A page that would match by path but declares a different alternate follows the alternate.
- [ ] **Which rule matched is carried on the sibling**, as a cell's `provenance` is — it is data and
      not a comment.
- [ ] The French block is as complete as the Dutch one: the path rule reaches the pages that declare
      no Dutch counterpart, which is most of `be_fr` and `fr`.
- [ ] The store dashboard lists the pages whose **sibling is absent**, distinguished from the pages
      both stores have. `blog`, `klantenservice` and `contactformulier` are absent from `be`;
      `pergola` and four `herroeping-*` webforms are absent from `nl`; the French block splits on
      `galerie/eclairage` against `galerie/eclairaige`.
- [ ] The pages both stores have are ranked worst-first by how much their text diverges, measured
      over production's content units on **normalised text** as the share of one store's unit texts
      that appear exactly in the sibling's.
- [ ] A page whose sibling is byte-identical says so in its own words, and does not read as though
      the comparison failed to run. This is 66 of 125 pages in the Dutch block and 48 of 120 in the
      French one, so it is the common case and not an edge.
- [ ] The list says which side it compares, and the answer is production.
- [ ] The list says it is **not a census**: a page no sitemap declares is absent from it, and 48 of
      `nl`'s 181 cells are carried over for exactly that reason.
- [ ] Nothing is excluded — no list of legal or ephemeral pages exists.
- [ ] The whole reading is **decided as values** in the pure layer and only rendered by the
      component, in the manner of `explainScope()`.
- [ ] No count, bar, denominator or roll-up moves, and no class is added to the class vocabulary.
- [ ] ADR 0017 records the model: a block is a **view and not an axis**, and why the word "axis" is
      refused — an axis here means a tab, a task and in the end a count, and ticket 11's rule about
      not summing two bars exists only because an axis has one.
- [ ] `CONTEXT.md`'s **Language blocks** section is accurate against what was built. *(Written
      during the grilling, 2026-08-17.)*
- [ ] The full suite passes, including the stopword guard.

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
