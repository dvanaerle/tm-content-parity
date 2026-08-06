# 24 — Build the Axis B compare stage

Type: task
Status: closed — superseded by 39, 40, 42, 43, 44, 45
Blocked by: 07, 11
Parent: ../map.md

> **Superseded 2026-08-06.** This ticket was one task for the whole axis B
> compare stage. `/to-tickets` cut it into slices that each fit one session:
> [39](39-class-vocabulary-axes.md) the contract prefactor,
> [42](42-untranslated-text.md) untranslated text,
> [43](43-alt-language-and-meta.md) alt and meta,
> [44](44-heading-outline-shape.md) the heading outline, and
> [45](45-images-across-stores.md) the images. Presence went to
> [40](40-coverage-missing-pages.md), because it needs no crawl.
> The crawl it needs is [38](38-six-stores.md), from spec 32.
> Nothing below is withdrawn. The rules stay as written; only the packaging
> changed.

## Question

Nothing to decide once ticket 11 is settled. Build the coverage comparison: NL
against each of the other five stores, on the new site only.

## What to build

Nine new classes in `compare/contract.mjs`, which takes the table from 18 to 27:
`missing-page`, `orphan-page`, `untranslated`, `alt-untranslated`,
`meta-untranslated`, `meta-presence`, `outline-shape`, `image-missing-store` all
shown, and `image-store-variant` hidden.

The class records gain an **`axis`** field. The two axes have separate tabs,
separate bars and separate task lists, so a consumer must be able to select one.
Ticket 11 recorded this as a consequence of decisions already made. Do not
re-open it.

Two numbers go beside ticket 02's 0.6 pair threshold, so that every tunable number
is in one file:

- skip a string of **fewer than 3 words**, after digits, punctuation and units are
  removed
- **0.5** divergent positions is the `restructured` cap, tie to `outline-shape`

The five checks:

1. **Presence** — a null cell in `data/10-store-seeds.json` makes `missing-page`.
   Derive it from the seed file with no status logic. A **404** cell is ticket 20,
   not this stage. If the NL page answers 404, emit nothing for that store page.
2. **Untranslated text** — set membership of the store page's `norm` values
   against the NL page's `norm` values. No pairing, no threshold. Apply the skip
   rule and the brand-token list.
3. **Alt language** — the same membership test over `ImageRecord.alt`.
4. **Meta** — `meta-presence` and `meta-untranslated` over title, description,
   canonical and h1. `PageMeta` holds no hreflang.
5. **Heading outline** — align the sequence of `level` values of the elements with
   `kind: 'heading'` inside `<main>`. One finding per divergent position.

Images: `image-missing-store` for an `imageKey()` that NL holds and the store does
not; `image-store-variant`, hidden, for a basename that differs.

## Also in scope

- The skip-token list, committed in `compare/`, extracted once from the
  `tuinmaximaal-translator` glossary. Not in Supabase.
- The per-store Axis B bar, never summed with the parity bar. This amends ticket
  09's axis-A-only roll-up.

## Notes

The extractor is already store-agnostic: nothing in `extractPage()` or the
contract is NL-specific, `STORES` lists all six, and the seeds carry the
cross-language key. `data/extract/` holds one NL page, so this stage needs a crawl
of the other five stores first.

Production is not read at any point in this stage.
