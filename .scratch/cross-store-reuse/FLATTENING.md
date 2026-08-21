# The flattening, the pairing and the double claim

The full working behind ticket 11's `## Answer`. Measured **2026-08-21** at commit `cf50c63`,
over the corpus on disk. Nothing here crawled, nothing was written to `data/`, and no
production code changed. Scripts, all throwaway:
`.scratch/cross-store-reuse/flatten-probe-1.mjs`, `-2.mjs`, `-3.mjs`, and
`flattening.json` beside them.

## The corpus

| | |
|---|---|
| reports | 816 in `data/reports`, all observation `2026-08-19T15:15:18.599Z-135ccd35`, built 2026-08-20 |
| findings | **35,604** |
| run log | `history/run-log.jsonl`, 41,316 rows (41,317 lines; the first is the index header) |
| extracts | `data/extract/<store>/<page>.json`, both sides, `extractVersion: 2` |
| seed rows | 550 in `data/10-store-seeds.json` |
| override log | `data/overrides-backup-2026-08-18T09-46-51-393Z.json`, 1,618 events, 1,294 standing after `latestByKey()` |

**This is not ticket 01's corpus.** That answer, two days ago, counted 40,824 findings and
132 detached dismissals; the same override log now detaches **152**, and the finding total
has moved by more than five thousand. The rules have been re-run since, so a finding id is
a shorter-lived thing than either number on its own suggests. That fact carries measurement
3 below.

## The field shapes, read from the code and not from the ticket

- A content unit is an element of `extract.elements` with `raw`, `norm`, `tag`, `kind`,
  `level` (`compare/contract.mjs`). Excluded regions have already left at extraction, so
  the extract is what the comparison sees — `comparePage()` hands `diffRows()` the element
  lists unfiltered.
- Both sides live in one file, keyed `production` and `new`, each with its own `status`.
- A sibling page is `siblingPages()` in `web/src/lib/blocks.mjs`: the declared alternate
  first, path equality second, `fr/` stripped as a host artefact. Which rule matched is
  carried on the sibling.
- The agreement share and `mutual` are `blockReading()`'s, already written and reused here.
- An override row on disk is **snake_case** (`finding_id`, `created_at`, `observation_id`);
  `overrides/state.mjs` reads camelCase, so probe 3 decodes before calling `latestByKey()`.
- A repeat is `repeatsInStore()`'s key: `[block language ?? store, class, prod, new, detail]`.

## 1. The flattening

**Three alignments, all of them `diffRows()`**, so that *which two blocks are the same
block* keeps one definition: production A against production B (this is
`siblingReading()`'s own comparison), then production against the new site inside each
store (this is `comparePage()`'s). A cross-store pair whose `norm` differs, and whose two
counterparts through the axis-A alignments carry the same `norm`, is a candidate flattened
store difference.

| | |
|---|---|
| page pairs measured (both stores 200 on both sides) | **230** |
| cross-store unit pairs | 9,675 |
| pairs diverging on production | **311** |
| …with a counterpart on both new sites | 214 |
| …**agreeing on the new site — the flattening** | **111** on **42 page pairs** (40 distinct page keys) |
| …one side's unit had no counterpart, so nothing is claimed | 97 |

The class the log's own `classifyPair()` gives the production divergence: **copy 94,
casing 15**, price 1, campaign 1. So 109 of the 111 are a divergence in **work** classes,
and the two that are not are `price` (information) and `campaign` (diagnostic).

Which store's production words the new site now shows on both: `nl` 46, `fr` 24, `be_fr`
13, `be` 7, and **neither** 21 — the last being a new-site rewrite that landed identically
on both stores.

**109 of the 111 are already an ordinary axis-A finding today**, on the store that lost its
words: 58 on `be`, 34 on `be_fr`, 28 on `fr`, 17 on `nl` (a unit can be a finding on both
stores: 58+34+28+17 = 137 against 111 units, so 28 units are a finding on both, and all 21
*neither* rows are among those 28). The two that are not are both a run the
new site merged, where the finding exists with a `regrouped` shape and not with these two
texts.

### Ranked, with the text

The full 42 page pairs and 111 units are in `flattening.json`. The head of the ranking:

| units | stores | page |
|---|---|---|
| 16 | `nl`/`be` | `schuifpui` |
| 13 | `nl`/`be` | `terrasoverkapping/productinformatie` |
| 8 | `be_fr`/`fr` | `portes-coulissantes/information-produit` |
| 6 | `be_fr`/`fr` | `verandas/information-produit` |
| 5 | `nl`/`be` | `garantie` |
| 4 | `be_fr`/`fr` | `avantages`, `verandas/paroi-laterale`, `lighting-system` |
| 4 | `nl`/`be` | `voordelen` |
| 3 | `nl`/`be` | `(home)` |

Then a tail of 2 and 1: `dop`, `levergebied`, `betaalmethoden`, `afhalen`, `downloads`,
`carport`, `fotogalerij`, `zonwering/productinformatie`, `glazen-schuifwand/productinformatie`,
`(be_fr)fr/zone-de-livraison`, `(be_fr)fr/modes-de-paiement`, `(be_fr)fr/telechargements`
and others.

**The warranty scope, `garantie`, `nl`/`be`.** Production says two different things and
the new site says one:

- `nl` production: "…naast uw wettelijke rechten als consument. **Voor alle artikelen die
  je bij ons koopt, geldt de wettelijke garantie.**"
- `be` production: "…naast uw wettelijke rechten als consument. **Deze garantie geldt voor
  producten die u als consument rechtstreeks bij Tuinmaximaal heeft gekocht.**"
- both new sites: `be`'s sentence. The `nl` store now states Belgium's scope of the
  warranty.

**The delivery area, `levergebied`, `nl`/`be`.** Production orders the countries by the
store's own country and the new site does not:

- `nl` production: "…aan huis in **Nederland** (m.u.v. de Waddeneilanden), België, …"
- `be` production: "…aan huis in **België**, Nederland (m.u.v. de Waddeneilanden), …"
- both new sites: `nl`'s ordering. The Belgian store lists the Netherlands first.

**The pickup terms, `zone-de-livraison`, `be_fr`/`fr`.** `be_fr` production carries a
sentence restricting how an order may be collected that `fr` does not, and the new site
drops it from `be_fr` — the shorter French text is now on both.

**The largest page, `schuifpui`, `nl`/`be`.** 16 units — 14 where the new site shows `nl`'s
production wording and 2 where it shows neither store's. Headings are among them: `be`
production "Meer genieten met een aluminium schuifpui" against `nl` "Veel meer genieten met
een schuifpui", and the new site says `nl`'s on both.

**Reported as a divergence and never as a cause.** A store-scoped variable renders no
HTML, so a unit that differs may differ for a reason no crawl can name. None of the above
says *why* production varied; it says that it varied and that the new site does not.

## 2. The pairing

`blockReading()` unchanged, run from all four stores of the two blocks. The share is
one-directional — this store's unit texts found in the sibling's — and `mutual` is the
both-ways question the word *identical* needs.

| | `nl`→`be` | `be`→`nl` | `be_fr`→`fr` | `fr`→`be_fr` |
|---|---|---|---|---|
| pages this store has | 181 | 131 | 122 | 123 |
| with a sibling matched | 126 | 126 | 120 | 120 |
| sibling absent | 55 | 5 | 2 | 3 |
| only in the sibling | 5 | 55 | 3 | 2 |
| measured | 125 | 125 | 120 | 120 |
| unmeasured | 1 | 1 | 0 | 0 |
| **identical (mutual)** | **66** | **66** | **47** | **47** |
| mean share | 0.923 | 0.922 | 0.936 | 0.938 |
| median share | 1.000 | 1.000 | 0.970 | 0.972 |

Distribution, and it is the point of the measurement:

| share | `nl`→`be` | `be`→`nl` | `be_fr`→`fr` | `fr`→`be_fr` |
|---|---|---|---|---|
| 1.00, mutual | 66 (52.8%) | 66 (52.8%) | 47 (39.2%) | 47 (39.2%) |
| 1.00, contained but not mutual | 0 | 1 | 1 | 0 |
| 0.90–0.99 | 33 | 35 | 43 | 42 |
| 0.75–0.89 | 16 | 12 | 25 | 27 |
| 0.50–0.74 | 6 | 7 | 4 | 4 |
| 0.25–0.49 | 1 | 1 | 0 | 0 |
| 0.01–0.24 | 3 | 3 | 0 | 0 |
| 0.00 | 0 | 0 | 0 | 0 |

**246 page pairs exist** (126 Dutch + 120 French), 245 of them measured, and **113 render
identical words** (66 + 47) — 46% of the measured pairs. The shape is **not bimodal**: nothing at all sits at 0.00, and the
0.75–0.99 band holds 49 of the 125 Dutch rows and **68 of the 120 French rows** — in the
French block that band is larger than the identical one. Both directions of a block agree
to within one row, so nothing here depends on which store the reading is taken from.

**Identical words are not evidence of one record.** ADR 0025 and ticket 10 both say so:
two separate records holding the same words are indistinguishable from one record to a
crawler, and they behave oppositely the moment somebody edits one. The 113 is the size of
a transcription pass, not a list of shared records, and no press here links anything.

## 3. The double claim

Standing decisions from `latestByKey()`, `scope: 'finding'`. *The same finding* is
`repeatsInStore()`'s key.

| | count |
|---|---|
| standing fix claims | **232** (`nl` 185, `uk` 38, `be` 8, `de` 1) |
| …in a store that has a block | 193 |
| …**whose finding id is still in the corpus** | **10** |
| …whose page has a matched sibling with a report | 9 |
| …**whose sibling carries the same finding** | **7** |
| …where the sibling's finding was **also claimed fixed** | **0** |
| …where the sibling's finding was decided at all (a dismissal) | 1 |

**219 of the 232 standing fix claims key on an id that is absent from the whole corpus**
— 94%, against 152 of 829 dismissals (18%). The claims are the older population and they
have outlived more rule changes. So the honest statement is: **the number of doubled fix
claims cannot be measured on this corpus, because 94% of the claims no longer name a
finding that exists.** What can be measured is the 10 that survive, and 7 of them — 70% —
sat on a page whose sibling carried the identical finding, while **not one** of those
siblings was claimed fixed too.

The seven, with the class and who wrote them:

| store, page | sibling | class | written | twin also claimed |
|---|---|---|---|---|
| `nl glazen-schuifwand-monteren` | `be` same page | `link-target` | 08-11 shireesha | no |
| `nl (home)` | `be (home)` | `broken-link` | 08-11 d.aerle | no |
| `nl fotogalerij/verlichting` | `be` same page | `copy` | 08-12 s.schouten | no (dismissed) |
| `nl overkapping` | `be overkapping` | `copy` | 08-12 s.schouten | no |
| `nl quote-error` | `be quote-error` | `broken-link` | 08-17 d.aerle | no |
| `nl kleine-overkapping-voor-kleine-tuin` | `be` same page | `broken-link` | 08-17 d.aerle | no |
| `nl schuifpui` | `be schuifpui` | `broken-link` | 08-17 d.aerle | no |

Two readings sit on that table and only one of them is supported. The **opportunity** to
claim twice is real and common — 7 of 10. The **act** of claiming twice is not in the data
at all: 0 of 7. Four of the seven are `broken-link`, whose input is an HTTP status and not
page text, so a single fix on the target corrects both stores without either claim being
pressed. `be` carries 8 standing fix claims against `nl`'s 185, which says the plainer
thing: **the second store is barely worked at all.** An editor who does not visit `be` does
not claim a fix twice, and a press that saves the second claim saves a press nobody makes
today.
