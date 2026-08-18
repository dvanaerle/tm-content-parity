# A judgement may cross a language block, and only a judgement

An editor dismisses a difference on `be` and, where `nl` carries the same words, the one
press writes in both stores. This is the first thing in the log that crosses a store, so it
records what it buys, what it costs, and the boundary that keeps it from becoming the thing
ADR 0017 refused.

## What changed, in one sentence

The **first term of the repeat key** is now the store's language block where it has one, and
the store where it has not. That is the whole change to the derivation:

```js
blockOf(page.store)?.language ?? page.store
```

`blockOf()` comes from `web/src/lib/language-blocks.mjs` and is derived from
`HREFLANG_STORE`. Everything else follows from it, which is the reason it was done this way:
the class grouping, the search result, both bulk writers and the bar over a row all read
`repeatsInStore()`, so **no second definition of "repeat" exists in the codebase**. A
`blockOf()` call in `bulk.mjs` would have been the second one.

The two writers changed by one word each — `repeat.store` became `entry.store` — because a
repeat spanning two stores has no single store to file an event under, and reading one would
have filed `be`'s event under `nl`, where that finding id does not exist.

## What it buys

Measured 2026-08-17 over the committed reports, with `.scratch/language-blocks/measure-03.mjs`:

- **11,162 of 22,048 work findings (50.6%)** sit in a repeat that spans its block.
- **Distinct decisions over the six stores fall 16,881 → 12,722, a drop of 4,159 (24.6%).**
  The Dutch block's two dashboards held 5,328 rows between them and now mirror 3,264; the
  French block's 5,817 become 3,722.
- **`de` and `uk` do not move at all**: 2,789 and 2,947 rows before and after, zero spanning
  rows. Each is the only store of its language, so `blockOf()` gives it nothing.

The originating ticket predicted about half of this — 5,256 findings, 24% — and the gap is
worth keeping written down because it is a measuring mistake anybody would repeat. That
figure counted a repeat key co-occurring **on the same page**. A repeat groups *across*
pages, so the shipped grouping joins `nl/afhalen` with `be/pergola` where the words agree,
which the per-page measure could not see. The 24% turned out to be the right number about
**rows** and half the right number about findings.

## What it costs

**A block store's dashboard downloads its sibling's summaries.** Gzipped, per dashboard:

| store   | own    | sibling | total  |
| ------- | ------ | ------- | ------ |
| `nl`    | 148 kB | +136 kB | 283 kB |
| `be`    | 136 kB | +148 kB | 284 kB |
| `be_fr` | 144 kB | +144 kB | 286 kB |
| `fr`    | 144 kB | +144 kB | 286 kB |
| `de`    | 154 kB | — | 154 kB |
| `uk`    | 142 kB | — | 142 kB |

Roughly double on the four stores that are in a block, and **nothing** on the two that are
not. `web/src/pages/[store]/index.astro` had a comment defending the opposite — "the visitor
who opens `de` downloads 45 pages and not 451" — and that sentence is still true of `de`,
which is the shape of this trade: a store pays for a block only if it is in one.

It is also why the block **panel** and the block **press** load differently. The panel (ADR
0017) is worked out at build time and ships no content units at all. A press cannot be: an
editor ticks pages in the browser, and the eligibility of each finding is a question about
the log's current state, so the sibling's findings have to be *there*. Deferring the second
read until the first tick was considered and rejected for now — it buys back the first paint
and pays for it with an async state on the selection, which is the one control in this
interface that must never be uncertain about what it is aimed at.

**A second `deriveStoreState()` call per dashboard.** `useStoreOverrides()` takes two lists
since this ticket: `pages`, which is what the store's **numbers** are about, and
`siblingPages`, which is what a press can touch and no number may read. One list would have
been less code and would have put `be`'s findings into `nl`'s denominator.

**The repeat list is over the block, and three kinds of row are on it.** Feeding the sibling's
pages to the grouping widens the **rows** as well as the selection: a block store's list holds
rows spanning both stores, rows of this store alone, and rows the **sibling carries alone** —
`nl`'s list shows a difference `be` has on a page where `nl`'s own text is fine. That is kept
rather than filtered out, because the mirroring is the point: the two dashboards of a block
show one list, which is what makes a decision on either of them the same decision, and a
filtered list would be two lists again — a row cleared on `be` would vanish from `nl` rather
than read as decided. The cost is paid in words: the count beside the list says *differences
in this language block*, because it is no longer a count of this store's work. The bar, the
chips, the roll-up and *Pages* still are.

## The boundary that keeps it safe

**A block is derived from a shared language and never from a hand-written list.** This is the
load-bearing sentence and it is ADR 0017's, restated here because this ticket is the first
one with an incentive to break it. A list would make the same two blocks today and would be
an invitation forever: somebody adds `{de, uk}` because both are "the other ones". With
`languageIn()` over `HREFLANG_STORE` there is nothing to add — `de-DE` and `en-GB` are each
the only code of their language, and the answer to "may `de` and `uk` be a block" costs no
debate. The repeat key is the highest-traffic derivation in the app, and a hand-written list
feeding it is how a bad entry would move counts on two stores this feature is not about.

**Nothing is keyed on a block.** No scope, no column, no change to the finding id. A press
still writes N ordinary events, one per page, `scope: 'finding'`, `action: 'dismissed'`. A
`block` scope would be the mute's mistake with a new name (ADR 0011), and the mute is the
precedent for what happens when a key names something an editor did not choose.

**A dismissal still expires per store.** The store is a term of
`sha256(store | page | check | rule | prodNorm | newNorm | detail)`, so `be`'s dismissal
detaches when `be`'s text changes and `nl`'s does not. Two stores agreeing today is not a
claim that they will agree tomorrow, and the key already says so without anything being
added.

**Only the judgement travels.** A dismissal is a judgement — "these two exact strings are
acceptable" — and it is as true of one store's copy of a string as of the other's. A **fix
claim** is a claim of fact about one page on one site, and correcting `be` does not correct
`nl`. So there is no bulk fix claim, which is not a new refusal: `offersDismissal()` and
`offersClear()` have both excluded `fixed` since ticket 31, and the single control's
checkbox stays the only way to make one.

**80% is not 100%, and the interface says so per press.** Each press names the stores **its
own events** are in, derived from the entries it can act on — not from the row's `stores`.
A selection spanning `nl` and `be` whose `be` page a colleague already dismissed says `nl`.
A sentence that named the block there would imply the block is being decided when a fifth of
it is not, and that is the trap this feature is most likely to fall into later. Both presses
say it **on screen** — the dismissal in its form, the clearing on a line of the bar. The
clearing said it in a `title` for one commit, which is a sentence an editor sees only by
hovering; *states, before the press* is not something a tooltip does.

**The search stays per store, and the widening stops at the hook.** Reading two stores' events
is safe for every *derivation*, because each is handed the reports it is about and
`derivePageState()` matches on `event.store`. The **log itself** is the exception: it leaves
the hook raw for one reader, the notes half of a search, which filters on the words and the
page scope and never on a store. Handed both stores' events, `nl`'s search answered with notes
written on `be` pages — the cross-store surface `search.mjs` refuses in its first paragraph,
arrived at without anyone deciding to build it. `eventsOfStores()` narrows the log back before
it leaves `useStoreOverrides()`, which is where the two lists are told apart; the search has no
business knowing a block exists. **The general rule this leaves:** what crosses a block is a
*press* and a *row*. Anything given the log itself must be narrowed first.

## This is not axis C

What crosses a block is a decision about an ordinary **axis-A finding** that happens to be
identical in two stores. A **block difference** — the display-only reading of ADR 0017 — is
untouched by this and is still never a finding: no id, no override, no bar, no denominator.

The distinction is worth stating as a test rather than as a claim: the thing that widened is
a **selection**, and a selection has no count. The store's bar, roll-up, chips and *Pages*
view are all still built from `comparable` — this store's pages alone — and the sibling's
pages reach exactly two readers, the repeat grouping and the presses armed off it. A repeat
has never moved a number, so widening one cannot have moved one either.

This work is the reason ADR 0017's refusal can hold rather than a step toward it. It answers
the want that would otherwise argue for a counted block axis — *stop asking me the same
question twice* — and it answers it with 4,159 fewer decisions and no new column. The day a
block difference is promoted to a finding is still its own ADR, and still the day the word
"axis" becomes available. Not before.

## What was considered and rejected

- **Widening in `bulk.mjs` instead of in the key.** The press learns about blocks, the
  grouping does not, and the row an editor reads says one thing while the press does
  another. It also puts a second definition of "repeat" in the codebase, which the ticket
  named as its own failure condition.
- **Keeping `repeat.store` beside `repeat.stores`.** One of them is a lie on a spanning row.
  `stores` is derived from `on`, so the row's answer to *in which stores* and the events a
  press writes come off one array and cannot disagree.
- **Widening the store's numbers with the selection.** Rejected: ticket 38 makes a store the
  unit an editor is responsible for, and a bar that counted the sibling would make two
  editors quoting "the number" mean different things — the failure the roll-up rules exist
  to prevent.
- **A `/block/nl-be/` press surface.** Refused for ADR 0017's reason, unchanged: it is a
  third kind of dashboard belonging to no store. The press lives on both stores' dashboards
  as one mirrored row, and it is safe to mirror for a new reason this ADR adds — the two
  dashboards write to **one** append-only table, so a decision made from `be` is visible
  from `nl` on the next read rather than being a second copy to keep in sync.
- **Naming the stores on every row.** Drawn only where a row spans more than one store. On a
  single-store row it would print the store whose dashboard this is, once per page, for no
  reader — and the rule this keeps is that the marker appears exactly when a decision leaves
  the store an editor thinks they are working in.
