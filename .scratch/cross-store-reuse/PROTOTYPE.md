# Cross-store reuse — markdown prototype

Type: prototype (throwaway)
Status: needs-info
Parent: ./PRD.md

**Throwaway.** This file answers one question and is then spent: *what does an editor see,
in the words they see it in, when the eight changes in the PRD have landed?* It is a paper
prototype — ASCII screens plus the values behind them — and no code. Nothing here is a
commitment; where a screen forced a choice the PRD does not make, the choice is marked
**[open]** and listed at the bottom.

Spelled UK English, worded from `CONTEXT.md`. The data is fabricated, shaped from the
corpus of 2026-08-19.

---

## 1. A renamed image is one row (ticket 02)

**Today.** The rename `max.svg → max-logo.svg` is two rows, in two visibilities, and one
of them is not in the search index.

```
IMAGE MISSING   max.svg                                        ×1   [ ] open
                Production has the image. The new site does not.

… 24 rows later, under a disclosure nobody opened …

IMAGE ADDED     max-logo.svg                                   ×1        —
                The new site has an image that production does not have.
```

**The prototype.** One row, no tint, a decision on it, and both filenames in the index.

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ [ ]  IMAGE RENAMED   max.svg → max-logo.svg          ×6   0 of 6 closed    ▸  │
│      matched: src                                                             │
└───────────────────────────────────────────────────────────────────────────────┘
   ▾ opened
     ┌───────────────────────────────┬───────────┬───────────────────────────────┐
     │ [ ] page                      │ production│ new site                      │
     ├───────────────────────────────┼───────────┼───────────────────────────────┤
     │ [ ] nl/overkapping-op-maat    │ max.svg   │ max-logo.svg                  │
     │ [ ] be/overkapping-op-maat    │ max.svg   │ max-logo.svg                  │
     │ [ ] be_fr/carport-sur-mesure  │ max.svg   │ max-logo.svg                  │
     │ [ ] de/terrassenueberdachung  │ max.svg   │ max-logo.svg                  │
     │ [ ] fr/carport-sur-mesure     │ max.svg   │ max-logo.svg                  │
     │ [ ] uk/garden-canopy          │ max.svg   │ max-logo.svg                  │
     └───────────────────────────────┴───────────┴───────────────────────────────┘
```

The class as the vocabulary would carry it — the thirty-third entry, and the first whose
matcher is not textual equality:

```js
'image-renamed': {
  check: 'images',
  visibility: 'work',          // decidable, and so in the search index
  label: 'Image renamed',      // sentence case, like every other label
  meaning: 'The two sides carry one image under two filenames.',
  // no `direction`: nothing was lost and nothing was added
}
```

What the pairing returns, as values, over one page's two sides:

| production images (document order) | new-site images | findings |
|---|---|---|
| `max.svg` (alt `''`) | `max-logo.svg` (alt `''`) | 1 × `image-renamed`, detail `max.svg → max-logo.svg` |
| `a.svg`, `b.svg` | `c.svg` | 2 × `image-missing`, 1 × `image-added` — arity is not one-to-one |
| `a.svg`, `keep.svg` | `keep.svg`, `b.svg` | two singles — the position differs |
| `a.svg` (alt `Montage`) | `b.svg` (alt `Montage`) | 1 rename, its score raised by the equal `alt` |
| `a.svg`, `a.svg` | `b.svg` | one finding — the duplicated `src` is one key |

The detail is a term of the finding id, so a second rename of the same slot is a new row
and inherits no answer. The two singles are absent wherever a pair is made.

---

## 2. The search reaches every store (ticket 03)

Its own URL, above the stores, so Back works and the link can be shared:

```
/search?q=max.svg
```

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║  All stores       [ max.svg                                 ]  [Search]       ║
║                   nl · be · be_fr · de · fr · uk — six indices, all read      ║
╚═══════════════════════════════════════════════════════════════════════════════╝
  ( ) Image renamed   ( ) Image missing   ( ) Link target changed   ( ) …
────────────────────────────────────────────────────────────────────────────────
  8 findings on 8 pages in 2 differences. From the snapshot of 18 Aug 2026 — the
  counts at the top do not move with it.                    [ ] Include closed
────────────────────────────────────────────────────────────────────────────────
  [ ] IMAGE RENAMED   max.svg → max-logo.svg      ×6   0 of 6 closed         ▸
      on nl, be, be_fr, de, fr, uk
  [ ] IMAGE MISSING   max.svg                     ×2   1 of 2 closed         ▸
      on de, uk
────────────────────────────────────────────────────────────────────────────────
  Notes in the log
  "The rename is the new brand mark, not a defect." — d.aerle, 14 Aug, on
  nl/overkapping-op-maat
```

The result shape does not change: findings group into differences, and the **store becomes
a grouping inside a difference**. A flat list would lose the proposition a wide press needs.
Opened, the store sits on every page row, so a merged list is never ambiguous:

```
     ┌───────────┬──────────────────────────────┬──────────────────────────────┐
     │ [ ] store │ page                         │ state                        │
     ├───────────┼──────────────────────────────┼──────────────────────────────┤
     │ [ ] nl    │ overkapping-op-maat          │ open                         │
     │ [ ] be    │ overkapping-op-maat          │ dismissed — d.aerle, 14 Aug  │
     │ [ ] uk    │ garden-canopy                │ open                         │
     └───────────┴──────────────────────────────┴──────────────────────────────┘
```

A `text` row the corpus rule makes unpressable is **shown, not tickable, and says why** —
so a row from another language block does not look like a bug:

```
  [·] TEXT CHANGED    "Gratis bezorging vanaf …"   ×4   0 of 4 closed         ▸
      on nl, be — and on de, uk as other words
      ⓘ  A text decision stays inside its language block. Press it on the store
         page, or on nl and be together.
```

**No status filter.** A bucket counts and never filters; closed stays a disclosure that
names how many it holds, and *Include closed* is unchanged and stays out of the filter
strip. *Type* is not a word here — the control is class pills, as everywhere. The per-store
search keeps its present default of this store and its sibling. No backend: six static
index files, fetched together, and a partial read is an error rather than a narrower search.

---

## 3. An image repeat crosses all six stores (ticket 04)

The repeat key's first term stops being the block and becomes a function of the check. The
same six findings, two groupings:

| check | first term of the repeat key | six stores group into |
|---|---|---|
| `images` | a constant | **1** difference of 6 pages |
| `links` | a constant | 1 difference of 6 pages |
| `text` | the block language | **4**: `{nl, be}`, `{be_fr, fr}`, `{de}`, `{uk}` |
| `meta` | the block language | 4, the same way |

`de` and `uk` join the first group and stay alone in the second. Nothing is keyed on this:
no finding id, no scope, no column and no URL changes. The table gains rows and never a
column.

The bar over a six-store selection, before the press:

```
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ ⑥ of 6 pages selected on Image renamed                                      │
  │     production  max.svg          new site  max-logo.svg                     │
  │                              [Dismiss on 6 pages…]  [Clear …]         │  ✕  │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │ These ticks are over the snapshot of 18 Aug 2026. What each press may act    │
  │ on is read from the log as it is now.                                       │
  │                                                                             │
  │ 5 pages of the 6: the other 1 is decided already. Written in nl, be, be_fr,  │
  │ de, fr and uk: the two sides of this difference are filenames, so the same   │
  │ string is one decision.                                                     │
  │                                                                             │
  │ [ Why is this not a defect?          ]  [Dismiss on 5 pages]  [Cancel]       │
  └─────────────────────────────────────────────────────────────────────────────┘
```

The sentence already on the bar — *these two stores share a language, so the same words are
one decision* — is false over six stores, so the wide press needs its own reason: **the two
sides are filenames**. **[open]** the exact wording; the PRD names the fact and not the
sentence.

The write stays N ordinary per-store events, so the override table gains rows and never a
column. The report is the one every bulk press already prints:

```
  5 of 5 saved.
```
```
  3 of 5 saved. It stopped on de/terrassenueberdachung, and the rest is not written.
  What was saved is in the log and it is visible above.
```

Nothing else moves. The note stays mandatory however wide the press, a colleague's decision
is skipped and counted, and the stores are named off the eligible entries and never off the
row.

---

## 4. The shared-page file (ticket 05)

The complement, an entry per line with its Magento record id and its reason, in the manner
of the excluded-pages and drop-rule lists:

```
# Store pages whose new-site CMS record is NOT shared with its block sibling.
# Everything else inside a block is shared, because the only possible partner is
# the sibling store. Taken from the new site's Magento, enabled records only,
# on 2026-08-19.
#
be/algemene-voorwaarden          412  own record — Belgian legal text
be/retourneren                   418  own record — Belgian withdrawal form
be_fr/conditions-generales       509  own record — Belgian legal text
…
```

The one new pure module — *is this store page shared* — as values:

| asked | the file says | the run log says | answer |
|---|---|---|---|
| `be/algemene-voorwaarden` | listed | first seen 2026-03-02 | **not shared** |
| `be/bedrijfsinformatie` | unlisted | first seen 2026-03-02 | **shared** with `nl/bedrijfsinformatie` |
| `be/nieuwe-actiepagina` | unlisted | first seen 2026-08-25 | **not shared** — newer than the file's date |
| `de/terrassenueberdachung` | unlisted, no block | — | **not shared** |
| `fr/formulaire-retrait` | listed, resolves to no page | — | **raises; the build fails** |

The build's output, which is why an unresolvable key stops the build rather than being
normalised away — the check doubles as housekeeping on the Magento side:

```
  ✗ shared-page file: 3 keys resolve to no store page in the corpus.
      fr/distributeurs-n-v-t         — the suffix says the record is to be disabled
      fr/formulaire-retrait          — exists on the new site only
      be_fr/formulaire-retractation  — exists on the fr store only
    A stale key is not mapped onto a live page. Fix the file, or disable the record.
```

Only the structural normalisation: the `fr/` prefix on `be_fr` paths is a host artefact and
is stripped, as the sibling pairing already strips it. Nothing else. The file states a fact
about today — an entry leaves it when the merge lands in Magento, never before.

---

## 5. A fix claim travels over a shared page (ticket 06)

Both conditions, stated on the control before it writes:

```
  ┌─────────────────────────────────────────────────────────────────────────────┐
  │ nl/bedrijfsinformatie — TEXT CHANGED   "Onze vestiging in Weert …"          │
  │                                                                             │
  │   [Fixed]   [Dismiss…]                                                      │
  │   ⓘ  Fixed writes in nl and be. One Magento record serves both stores, and  │
  │      both render these same words. Each store's next crawl checks its own.  │
  └─────────────────────────────────────────────────────────────────────────────┘
```

Every other case draws no second store, so the two conditions read as visibly both
required:

| store page | record shared? | the finding a repeat over the block? | *Fixed* writes |
|---|---|---|---|
| `nl/bedrijfsinformatie` | yes | yes | **nl and be** — two events, each with its own observation |
| `nl/zonwering` | yes | no — `be` renders other words | **nl** only |
| `nl/algemene-voorwaarden` | no | yes | **nl** only |
| `de/terrassenueberdachung` | no block sibling | — | **de** only |

The repeat condition is what handles a custom variable: if the two stores render the same
two strings, the words come from the record. The residual risk — a variable holding equal
values today — is bounded by the nature of the claim. A fix claim loses to re-check, so each
store's next crawl contradicts it and names the editor. **The dismissal is unchanged**:
sharing grants it no permission it does not already have, and removes none.

---

## 6. Store-scoped content, and the sibling reading (ticket 07)

On a shared page a divergence between the block's two stores can only come from a
store-scoped mechanism. It is a **reading**: no id, no override, no place in a bar, and it
is never called a finding.

```
  nl/bedrijfsinformatie   ·   Content   ·   Sibling   ·   Notes
  ──────────────────────────────────────────────────────────────────────────────
  This page against bedrijfsinformatie on be, its sibling page in the Dutch and
  Belgian-Dutch language block. One Magento record serves both stores, so a
  difference below is store-scoped content — it is there on purpose.

  ┌──────────────────────┬────────────────────┬────────────────────────────────┐
  │ block                │ nl — Dutch         │ be — Belgian Dutch             │
  ├──────────────────────┼────────────────────┼────────────────────────────────┤
  │ Onze vestigingen     │ Weert en Roermond  │ Weert en Roermond              │
  │ USP                  │ Gratis bezorging   │ Gratis levering in België      │ ←
  └──────────────────────┴────────────────────┴────────────────────────────────┘
                                                        ← store-scoped content
```

The second reading, beside production's — not a fourth comparison. The interesting row is
production diverging where the new site does not:

```
  ┌──────────────────────┬───────────────┬───────────────┬──────────┬──────────┐
  │ block                │ production nl │ production be │ new nl   │ new be   │
  ├──────────────────────┼───────────────┼───────────────┼──────────┼──────────┤
  │ Onze vestigingen     │ same          │ same          │ same     │ same     │
  │ USP                  │ diverges  ────────────────────│ same  ─────────────►│ ⚠
  │ Algemene voorwaarden │ diverges  ────────────────────│ diverges ──────────►│
  └──────────────────────┴───────────────┴───────────────┴──────────┴──────────┘

  ⚠  Production gives these two stores different words here, and the new site
     gives them the same words. A store difference the migration lost. Where that
     is a defect it is already an ordinary finding on the affected store, and the
     decision stays there.
```

The tool never names the variable — its value is server-side and appears in no HTML. A
legal-text divergence reads as correct, so the log does not ask anybody to fix the law.
Both readings are display-only, so ADR 0017 holds: a difference between two stores is read
and never decided.

---

## 7. Merge candidates

Derived, never authored, and a reading rather than a backlog:

```
  Pages that are two records and the same words
  ──────────────────────────────────────────────────────────────────────────────
  These 14 pages hold a separate Magento record per store, and both records
  render the same words today. Merging them removes the ability to give the two
  stores different words later.

    be/afhalen        418  ·  the same words as nl/afhalen, asked both ways round
    be/garantie       421  ·  the same words as nl/garantie
    be_fr/livraison   512  ·  the same words as fr/livraison
    …

  Not tracked. A page leaves this list when its line leaves the shared-page file.
```

---

## What this prototype settles

1. The rename row needs no new control. The tick, the arrow detail and the bar already on
   a repeat row carry the whole of it.
2. The all-stores search needs a **third row state** — pressable, closed, and *readable but
   not pressable*. That state is the only structural thing the search adds.
3. The wide press needs a **new reason sentence**, because *these two stores share a
   language* is false over six stores.
4. The shared-page file's failure output is worth more as housekeeping than as a guard, so
   it names every unresolvable key rather than the first.
5. Store-scoped content and the lost-divergence reading are two sentences and one extra
   pair of columns, not a fourth comparison.

## Still open

- **[open]** The wording of the six-store reason on the bulk bar.
- **[open]** Whether the rename row prints its matched field once or twice, having matched
  two `src` values.
- **[open]** Where `/search` sits in the navigation, and what the per-store search says
  about it.
- **[open]** Whether the four-column sibling reading is one table or two tables beside each
  other, at the widths the tab actually has.
- **[open]** Whether the merge-candidate list lives on the dashboard or on a page of its own.

## When this is spent

Fold the answers into `issues/02`…`issues/07`, then commit this file to a throwaway branch
and leave a pointer to that branch on the issue it settled. Main keeps the decision and not
the prototype.
