# 01 — The language fact moves to shared

**What to build:** nothing an editor can see. The store→hreflang map becomes the one place the
repo records which language a store speaks, in the pure layer, so that both the crawl and the
web layer can read it. This is the prefactor that makes every other ticket in this feature a
small change: make the change easy, then make the easy change.

Today the map lives inside the crawl, a flat copy of the same six codes lives in the sitemap
extractor, and the web layer cannot import from the crawl at all — so a language block derived
from hreflang has nowhere to be derived.

**Blocked by:** None — can start immediately.

**Status:** resolved — 2026-08-17, branch `ticket-104-search-page-scope`.

- [x] The store→hreflang map lives in the pure `shared/` layer beside the store list, and that
      layer still imports nothing (ADR 0001).
- [x] The crawl reads it from its new home and holds no copy of it.
- [x] The sitemap extractor's duplicate flat list of the same six codes is gone, replaced by the
      same import.
- [x] Every store has exactly one hreflang code and every code one store, asserted where the map
      now lives rather than in the crawl's tests.
- [x] No behaviour changes: the seed list regenerates byte-identically, and no count, bar,
      denominator or roll-up moves.
- [x] The full suite passes, including the stopword guard.

## Traps

- **Do not move the hosts, the sitemap URLs or the `fr/` prefix with it.** Those are crawl
  concerns and they stay in the crawl. Only the language fact moves.
- **Do not add a store record type** that gathers host, sitemap, locale and name into one object.
  It is the tempting tidy-up and it drags four modules into a prefactor that needs one.
- **The display names in the web layer are not language data.** `Belgium (Dutch)` is a label and
  nothing parses the parenthetical; do not derive a block from it.

## Comments

**2026-08-17 — built.** `HREFLANG_STORE` and `STORE_HREFLANG` are in `shared/stores.mjs` beside
`STORES`, in one file rather than a sibling module, which is what "beside `STORES`" asks for and
what keeps the bijection assertable in one test. `crawl/seed-list.mjs` and
`crawl/sitemap-extract.mjs` both import `STORE_HREFLANG` from there and neither holds a copy;
`crawl/seed-list.test.mjs` gets `HREFLANG_STORE` from `shared/` too and kept only its evidence
about which stores production groups, which is a crawl claim and not the map's shape.

The bijection is `shared/stores.test.mjs`, in three tests: the literal map, the pairing as a
rule, and the code **order**. The order turned out to be load-bearing — the deleted copy in the
sitemap extractor set the key order of every entry's `alternates` in `data/sitemap-extract.json`
— and it is genuinely not implied by the literal, because object equality ignores key order.
Checked against the committed extract: 0 of 876 entries reorder under the shared list.

`data/10-store-seeds.json` regenerates with identical content — only its `generated` date moved,
and that regeneration was reverted. Full suite 910 passing, `oxlint` clean, `oxfmt --check` clean
on the touched files (the 33 it flags are pre-existing). No typecheck exists in this repo.

ADR 0001 gained a dated section recording the resident, in the style of its four others. `CONTEXT.md`
now points at the map's new home. No store record type was added and the hosts, sitemap urls and
`fr/` prefix stayed in the crawl.

**One thing to know before ticket 02.** On the day it moved, the map **fails ADR 0001's third
question**: only `crawl/` reads it. There is no back-arrow to invoke the ADR's *at once* exception
either — nothing imports backwards today. It moved because ticket 02's `web/` derivation is what
makes the answer true, and that ticket cannot import `crawl/`. The ADR section says this in those
words rather than claiming a broken arrow that does not exist, so the stretch is on the record and
is not readable as a general licence. If ticket 02 were abandoned, the map belongs back in
`crawl/seed-list.mjs`.

Also: `HREFLANG_STORE` was typed `Record<string, Store>` while its neighbour `STORES` carries a
union, which left `STORE_HREFLANG` as `string[]` — weaker than the thing it moved next to, and the
code union is what `web/` will key on. There is now a `Hreflang` typedef and the cast follows
`STORES`' own pattern. Types are JSDoc-only and unchecked in this repo, so this buys documentation,
not enforcement.
