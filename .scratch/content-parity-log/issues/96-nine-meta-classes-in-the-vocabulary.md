# 96 — Nine meta classes enter the vocabulary

Type: build
Status: resolved 2026-08-14 — built in `1cf4f94`, on `main`. Every criterion met, and the
class-count pin reads **31** rather than the 30 written below: ticket 54's
`no-declared-alternate` landed after this ticket was written. The deviation is recorded in
the pin's own test comment and in the commit body.
Blocked by: —
Parent: 58-axis-a-meta-check.md

**What to build:** the vocabulary gains the nine classes the head check will emit,
so the dashboard filter pills go from 21 to 30 and the two contract pins agree with
them. No producer emits them yet — that is ticket
[97](97-the-meta-producer-one-finding-per-row.md). This ticket makes the vocabulary
true and the pins honest, and it depends on no crawled field, so it can start
immediately.

All nine carry `check: 'meta'`. `CHECKS` in the contract already declares a `meta`
check that no class claims today.

| class | shown | direction |
|---|---|---|
| `meta-title-changed` | yes | — |
| `meta-title-lost` | yes | lost |
| `meta-title-added` | no | added |
| `meta-description-changed` | yes | — |
| `meta-description-lost` | yes | lost |
| `meta-description-added` | no | added |
| `meta-casing` | yes | — |
| `robots-index-lost` | yes | — |
| `robots-noindex-lost` | yes | — |

**`meta-casing` is a new class, not the existing `casing`.** `casing` carries
`check: 'text'`, so re-using it would file a head defect under the Inhoud tab.

**No class carries `axis`.** That field is ticket
[39](39-class-vocabulary-axes.md)'s question, and ticket 33 dropped it on purpose so
39 would still have one. This ticket hands 39 a table of 30 classes to reach instead
of 21, and answers nothing about axes.

## Reading list

Read these and nothing else. If you need more, the ticket is wrong: say so and stop.

- `compare/vocabulary.mjs`
- `compare/contract.mjs` — `CHECKS`, and the class record shape
- `compare/contract.test.mjs` — the two pins
- `21-axis-a-meta-check.md` § Nine new classes

## Slices

In build order. **Criterion 1 is your first failing test.** Run
`npm test -- compare/contract.test.mjs` and show the red before you write the
implementation.

- [x] 1 The class-count pin reads **30**, and fails. — shipped as **31**; see the Status
      note. `compare/contract.test.mjs:244-252`.
- [x] 2 The nine records exist with the shown defaults above. Shown goes 13 → 20,
      hidden 8 → 10. — `compare/vocabulary.mjs:247-302`, seven `work` and two
      `information`.
- [x] 3 The `direction` pin — the sorted list of classes carrying it — gains the four
      `lost`/`added` classes. — `compare/contract.test.mjs:296-313`.
- [x] 4 A test asserts no `meta` class carries `axis`, so ticket 39 inherits a clean
      table. — `compare/contract.test.mjs:315-321`.

## Gate

`npm test`, then `node compare/measure.mjs nl`. **No number moves.** Nine classes
exist and nothing emits them yet.
