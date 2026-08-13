# 80 — Three buckets, and the third is Closed

Type: task
Status: ready-for-agent
Blocked by: 114 — **added 2026-08-13.** This ticket enumerates *"five derived states —
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

There are five derived states — `open`, `dismissed`, `muted`, `fixed`, `contradicted` —
and they are correct. What is missing is a grouping over them. A **bucket** is that
grouping. It is not a state, and nothing is stored on a finding to put it in one.

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

- [ ] The store dashboard shows three counts per page and three totals for the store.
      Absolute counts sit next to any percentage, because the denominator moves at each
      crawl.
- [ ] The ledger groups findings into the same three, and a finding's individual state
      is still visible inside its bucket. A bucket summarises; it does not replace the
      state pill.
- [ ] `Needs attention` holds contradicted findings only. A stale page review is a page
      badge saying **gewijzigd sinds controle**, and it is not in any finding bucket.
- [ ] The word **Resolved** appears nowhere, in code or in the interface. The Dutch
      interface word for the third bucket is chosen and recorded in `CONTEXT.md`'s entry.
- [ ] Closed is kept out of the active workload: it is reachable and it is not the
      default view.
- [ ] The three buckets are derived in `overrides/state.mjs` as a pure function over the
      five states, with a test covering each state's bucket, including a contradicted
      claim and a muted finding.
- [ ] No new column, action or scope is added to the overrides table. This ticket stores
      nothing.
- [ ] The bar is still computed over the current snapshot only, and this ticket does not
      change any total.

## Traps

- **A muted finding is Closed but it left the denominator**, while a dismissed finding
  is Closed and is in the numerator. Two Closed findings therefore affect the bar
  differently, and the interface must not suggest the bucket determines the bar.
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
