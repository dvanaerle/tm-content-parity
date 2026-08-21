# Verifying ticket 11 — the flattening, the pairing and the double claim

A verification pass over ticket 11's `## Answer` and over `FLATTENING.md`, against the data on
disk and the production code the probes call. Nothing here crawled and nothing was written to
`data/`. Throwaway scripts: `.scratch/cross-store-reuse/verify-11-corpus.mjs`,
`verify-11-overrides.mjs`, `verify-11-pairing.mjs`, `verify-11-double.mjs` — each one
re-implements the rule it checks from the code, rather than importing the module the probe
imported, wherever that was possible.

**Verified 2026-08-21 at commit `ff263b8`** (the answer was measured at `cf50c63`; the only
change between them is `ff263b8`, which rewrote probe 1's lookup key from three literal NUL
bytes to `JSON.stringify`). **The corpus has not moved under the answer**: `git diff
cf50c63..HEAD -- data history` is empty, `data/reports` was last written at `1144ee0`
(2026-08-20), and the working tree holds no change under `data/` or `history/`. Re-running
probe 1 leaves `flattening.json` byte-identical.

**Corpus as I found it.** 816 report files in `data/reports`, **35,604 findings**, all on
observation `2026-08-19T15:15:18.599Z-135ccd35`, every `builtAt` on 2026-08-20.
`history/run-log.jsonl`: 41,317 **lines**, of which the first is the index header, so
**41,316 rows** — and exactly 35,604 of them are still seen, which is the finding total to the
unit. 550 seed rows in `data/10-store-seeds.json`. `data/overrides-backup-2026-08-18T09-46-51-393Z.json`:
1,618 events, 1,294 standing.

## The verdict

**The answer stands.** Every load-bearing number reproduces, most of them from a second,
independent count that does not go through the probes: 111 flattened units on 42 page pairs,
the class split, the whose-words split, the 109 already open as axis-A findings, 246 pairs and
113 identical, 232 standing fix claims, 219 detached, 10 surviving, 7 twins, 0 doubled. The
three quoted examples exist in `data/extract/` verbatim and the direction of the flattening is
as described in all three.

Five claims are wrong or loose, none of them changing a reading:

1. **`history/run-log.jsonl`: 41,317 rows** — it is 41,317 *lines*; `decodeRunLog()`
   (`compare/run-log.mjs:147`) drops the header line, so the log holds **41,316 rows**. The
   ticket's own trap says to read the code for the shapes, and this is the one place the
   answer counted the file instead.
2. **"111 units on 42 pages"** — 42 **page pairs**, over **40 distinct page keys**: `garantie`
   and `shading-panel` each appear once in the `nl`/`be` block and once in `be_fr`/`fr`.
3. **`schuifpui`: "16 units, every one of them `be`'s own rewrite of the Dutch copy replaced by
   `nl`'s wording"** — 14 of the 16 kept `nl`'s words, **2 are `neither`** (a new-site rewrite).
   And *`be`'s own rewrite of the Dutch copy* names a direction in production's history that
   two extracts cannot establish — the same cause the write-up correctly refuses to name
   everywhere else.
4. **"(a unit can be a finding on both stores, which is what the 21 `neither` rows are)"** —
   **28** units are a finding on both stores (58+34+28+17 = 137 = 109 + 28). All 21 `neither`
   rows are among them, plus 7 rows where one store's words won and both stores still carry a
   finding.
5. **"113 of 246 — 46%"** — the 246 includes the one Dutch pair that is `unmeasured`. Over
   measured pairs it is 113/245. Immaterial to the reading; noted because the two denominators
   are two different populations.

Two more things a later reader should know, neither of them an error: the answer's two 109s are
**different measurements that coincide** (109 units in `work` classes; 109 units already an
axis-A finding), and measurement 1 covers **230 of the 246 page pairs**, so 111 is a floor over
what could be compared, not a block total.

## Claim by claim

| claim | stated | measured here | verdict | source |
|---|---|---|---|---|
| reports | 816 | 816 | reproduced | `verify-11-corpus.mjs` |
| findings | 35,604 | 35,604 | reproduced | `verify-11-corpus.mjs` |
| one observation, `…-135ccd35` | all | all 816, `builtAt` 2026-08-20 | reproduced | `verify-11-corpus.mjs` |
| run-log rows | 41,317 | 41,316 rows (41,317 lines) | **not reproduced** | `compare/run-log.mjs:147`; `verify-11-corpus.mjs` |
| seed rows | 550 | 550 | reproduced | `data/10-store-seeds.json` |
| override events | 1,618 | 1,618 | reproduced | `verify-11-overrides.mjs` |
| standing after `latestByKey()` | 1,294 | 1,294 | reproduced | own key rule per `overrides/state.mjs:130,160` |
| override rows are snake_case, `state.mjs` reads camelCase | correction needed | `finding_id`/`created_at`/`observation_id` on disk; `createdAt`/`findingId` in the code | reproduced | `data/overrides-backup-…json`; `overrides/state.mjs:29,35,131,173` |
| measurement 2 needed nothing new — it **is** `blockReading()` | — | `share`/`mutual` in `blocks.mjs:171-183` are exactly the measurement | reproduced | `web/src/lib/blocks.mjs:143-183` |
| page pairs measured | 230 | 230 | reproduced | `verify-11-corpus`-style status filter, own count |
| cross-store unit pairs | 9,675 | 9,675 | reproduced (probe rerun) | `flatten-probe-1.mjs` |
| diverging on production | 311 | 311 | reproduced (probe rerun) | ditto |
| counterpart on both new sites | 214 | 214 | reproduced (probe rerun) | ditto |
| **flattened** | **111 on 42 pages** | 111 on 42 page **pairs** / 40 page keys | reproduced, wording loose | `flattening.json` |
| class split | copy 94, casing 15, price 1, campaign 1 | same | reproduced | `flattening.json`; `compare/text.mjs:79-89` |
| 109 in `work` classes | 109 | copy+casing = 109; `visibilityOf` gives both `work`, `price` information, `campaign` diagnostic | reproduced | `compare/vocabulary.mjs` |
| whose words kept | nl 46, fr 24, be_fr 13, be 7, neither 21 | same | reproduced | `flattening.json` |
| 109 already an axis-A finding (be 58, be_fr 34, fr 28, nl 17) | 109 | 109 units, per-store 58/34/28/17 | reproduced | `flattening.json`; spot-checked in `data/reports` |
| ranked head | schuifpui 16, terrasoverkapping/productinformatie 13, … | identical, in order | reproduced | `flattening.json` |
| `garantie` quote and direction | be's sentence on both new sites | verbatim in the extracts; nl's own sentence is gone from nl's new side | reproduced | `data/extract/nl/garantie.json`, `data/extract/be/garantie.json` |
| `levergebied` quote and direction | nl's ordering on both | verbatim; be production is België-first, both new sides Nederland-first | reproduced | `data/extract/{nl,be}/levergebied.json` |
| `zone-de-livraison` | be_fr's extra collection sentence dropped, fr's shorter text on both | verbatim | reproduced | `data/extract/be_fr/(be_fr)fr/zone-de-livraison.json`, `data/extract/fr/(fr)zone-de-livraison.json` |
| schuifpui "every one of them nl's wording" | 16 | 14 nl, 2 neither | **not reproduced** | `flattening.json` |
| pages with a sibling | 126 / 126 / 120 / 120 | same | reproduced | own re-implementation of `blocks.mjs:67-96` |
| measured | 125 / 125 / 120 / 120 | same | reproduced | `verify-11-pairing.mjs` |
| identical (mutual) | 66 / 66 / 47 / 47 | same, and the two directions name the **same** pairs | reproduced | `verify-11-pairing.mjs` |
| mean · median | .923/.922/.936/.938 · 1.000/1.000/.970/.972 | same to three places | reproduced | `verify-11-pairing.mjs` |
| 1.00 not mutual | 0 / 1 / 1 / 0 | same (share-1 totals 66/67/48/47) | reproduced | `verify-11-pairing.mjs` |
| band distribution | see the answer's table | identical in all four columns | reproduced | `verify-11-pairing.mjs` |
| nothing at 0.00, not bimodal | 0 at 0.00 | 0 at 0.00; 49 of 125 Dutch and 68 of 120 French in 0.75–0.99 | reproduced | `verify-11-pairing.mjs` |
| 246 pairs, 113 identical (46%) | 46% | 113 of 246 incl. one unmeasured pair; 113/245 measured | reproduced, denominator loose | `verify-11-pairing.mjs` |
| standing fix claims | 232 (nl 185, uk 38, be 8, de 1) | 232, nl 185, uk 38, be 8, de 1 | reproduced | `verify-11-overrides.mjs` |
| in a store with a block | 193 | 193 | reproduced | `verify-11-double.mjs` |
| finding id still in the corpus | 10 | 10 (13 claims attached corpus-wide; 3 of them `uk`) | reproduced | `verify-11-double.mjs` |
| sibling carries the same finding | 7 | 7, the same seven rows | reproduced | own `repeatsInStore()` key per `web/src/lib/view.mjs:804-814` |
| sibling also claimed fixed | 0 | 0 standing **and** 0 in the raw event log | reproduced, and stronger | `verify-11-double.mjs` |
| sibling decided at all | 1 (a dismissal) | 1 | reproduced | `verify-11-double.mjs` |
| 219/232 detached (94%) vs 152/829 (18%) | — | 219/232 = 94.4%; 152/829 = 18.3% | reproduced | `verify-11-overrides.mjs` |
| "not ticket 01's corpus": 40,824 findings, 132 detached | — | `CHURN.md:84,163` says exactly that, over the same 829 dismissals | reproduced | `.scratch/cross-store-reuse/CHURN.md` |

## The detail

### The corpus

`verify-11-corpus.mjs` walks `data/reports` itself: 816 files, 35,604 findings summed over
`report.findings`, one distinct `observationId` across all 816, every `builtAt` on 2026-08-20.
Per store: nl 6,434, be 5,957, uk 6,125, de 5,786, be_fr 5,703, fr 5,599.

The run log is the one number that does not hold. `decodeRunLog()`
(`compare/run-log.mjs:147-153`) splits on newlines, takes the **first line as the header** and
maps the rest into rows; `encodeRunLog()` (`:117`) writes it that way. The file's first line is
`{"index":"finding-run-log","observationId":…}`. So the log holds 41,316 rows, of which 35,604
carry no `last` — still seen — and 5,712 are retired. The 35,604 still-seen ids are exactly the
35,604 ids in `data/reports`, id for id, which is a cross-check the answer could have made and
did not. Ticket 01 counted rows and not lines (`CHURN.md:84`: 40,829 rows = 40,824 seen + 5
retired), so the two answers are also inconsistent with each other by one.

### The field correction on the override log

Real, and needed. `data/overrides-backup-2026-08-18T09-46-51-393Z.json` rows carry
`created_at`, `finding_id`, `observation_id`, `finding_set_hash`. `latestByKey()`
(`overrides/state.mjs:160-167`) keys through `eventKey()` (`:130-133`), which reads
`event.findingId`, and orders through `isLater()` (`:172`), which reads `event.createdAt`.
Undecoded, every finding-scope row on one page would collapse onto the key `finding|store|page|`
and the ordering would compare `undefined` with `undefined`. Probe 3's `decode()` is the right
fix and my own reimplementation of the same rule over the raw snake_case rows lands on the same
1,294 standing events.

### Measurement 1

Probe 1 reruns to the digit: `{"pairs":230,"crossPaired":9675,"diverging":311,"bothMapped":214,
"flattened":111,"onlyOneSideMapped":97,"alreadyAFinding":109,"classes":{"copy":94,"casing":15,
"campaign":1,"price":1}}`, 42 pages, `{nl:46,be:7,be_fr:13,fr:24,neither:21}`.

Independently: my own re-implementation of `siblingPages()`' two rules over
`data/10-store-seeds.json` gives 126 candidate pairs in the Dutch block and 120 in the French,
and 230 of those 246 have `status === 200` with non-empty `elements` on **both** sides of
**both** stores — the probe's own gate, recomputed without importing it. So 230 is right, and it
is also the honest scope: 16 pairs were never compared, and the answer says so in its table.

The three alignments are what they are claimed to be:

- Cross-store: `siblingReading()` in `web/src/lib/sibling.mjs:84`, whose `rowsOf()` (`:128`)
  calls `diffRows({elements: here}, {elements: there})` on two stores' production units and
  whose `equal` is `row.prod.norm === row.new.norm`. Probe 1's cross-store step is that,
  exactly.
- Axis A: `comparePage()` at `compare/30-compare.mjs:130` calls `diffRows(production, next)` on
  the whole extract sides, unfiltered. Probe 1's `counterparts()` is that call.

The `already a finding` test keys a report finding on `JSON.stringify([one.prod, one.new])`. I
checked it against the reports by hand rather than by key: `data/reports/nl__garantie.json`
carries a `copy` finding whose `prod` is nl's warranty sentence and whose `new` is be's, and
`data/reports/be__levergebied.json` carries a `copy` finding whose `prod` is België-first and
whose `new` is Nederland-first. Both are open axis-A findings today on the store that lost its
words, which is the claim.

The quoted examples, read straight out of `data/extract/` and not out of `flattening.json`:

- `garantie`. nl production holds "…**Voor alle artikelen die je bij ons koopt, geldt de
  wettelijke garantie.**", which appears **nowhere** on be's production side; be holds "…**Deze
  garantie geldt voor producten die u als consument rechtstreeks bij Tuinmaximaal heeft
  gekocht.**". Both new sides hold be's sentence, and nl's own sentence is absent from nl's new
  side. As described.
- `levergebied`. nl production "…aan huis in **Nederland** (m.u.v. de Waddeneilanden), België,
  …", be production "…aan huis in **België**, Nederland (m.u.v. de Waddeneilanden), …", both new
  sides nl's ordering. As described.
- `zone-de-livraison`. be_fr production carries "…Il n'y a pas de frais supplémentaires.
  **L'enlèvement de votre commande se fait uniquement sur rendez-vous.** Nous vous
  contacterons…"; fr production stops at "frais supplémentaires."; both new sides hold fr's
  shorter text. As described.

`schuifpui` is the one page whose prose is wrong. 16 units, `{nl:14, neither:2}`, tags
`h2,p,li,a`, and the `h2` is be "Meer genieten met een aluminium schuifpui" against nl "Veel
meer genieten met een schuifpui" with nl's on both new sides — so the headline example holds and
the word *every* does not.

The double-counting note is off by seven: 58+34+28+17 = 137 against 109 units, so 28 units carry
a finding on both stores. All 21 `won: neither` rows are among the 28; the other 7 are units
where one store's production words won and both stores still report a difference.

### Measurement 2

Probe 2 reruns to the digit, and `verify-11-pairing.mjs` reproduces every cell without importing
`blockReading()`: it re-implements `siblingPages()` from the seed rows, reads
`data/extract/<store>/<page>.json`'s `production.elements[].norm`, and computes set membership
and set equality itself. 181/131/122/123 pages, 126/126/120/120 with a sibling, 125/125/120/120
measured, 66/66/47/47 set-equal, means 0.923/0.922/0.936/0.938, medians 1.000/1.000/0.970/0.972,
bands identical in all four columns, nothing at 0.00. The share-1 totals are 66/67/48/47, which
is where the answer's "1.00, contained but not mutual" row of 0/1/1/0 comes from.

The identical **pairs** are the same pairs read from either store, in both blocks — checked by
comparing the two directions' pair sets — so 66+47 = 113 is not a double count and the answer's
"both directions agree to within one row" is the weaker true statement.

`mutual` means what the answer needs it to mean, with one caveat the answer does not state.
`agreementOf()` (`web/src/lib/blocks.mjs:171-183`) is `found === mine.length` **and** every text
of the sibling's set present in this store's set — that is **set equality of normalised unit
texts**. It ignores document order and multiplicity, and it compares `norm`, so tier-1 folding
and any tag or heading-level change read as agreement (`sibling.mjs:38-49` writes that exclusion
down for the same reason). "Renders identical words" is true of the set of texts, not of the
sequence. It is the right measure for sizing a transcription pass and it is `blockReading()`'s
own, which is what the answer claims.

Third-source corroboration: ADR 0017's Consequences say "66 of the Dutch block's 125 measured
pages and 47 of the French block's 120 are identical", and record that reading `share === 1` as
identity made `be` count 67 and `be_fr` 48 — the exact two numbers my share-1 column produced.

### Measurement 3

`verify-11-double.mjs` re-implements the key rule, the sibling rules and `repeatsInStore()`'s
key from the code and imports nothing: 1,294 standing, 232 fix claims (nl 185, uk 38, be 8,
de 1), 829 dismissals, 193 claims in a block store, 10 whose finding is on its own page's
report, 9 with a matched sibling that has a report, **7** whose sibling carries the same repeat
key, **0** whose sibling was claimed fixed, 1 decided (a dismissal). The seven rows are the same
seven, with the same stores, pages, classes, dates and editors.

Two things worth adding. First, `repeatKey()` in probe 3 is character-for-character
`repeatsInStore()`'s key (`web/src/lib/view.mjs:804-814`): block language or the store,
`class`, `prod`, `new`, `detail`. Second, I widened the "also claimed" test from the standing
decisions to the **raw** event log — every `finding`/`fixed` row ever written, superseded ones
included — and the answer is still 0. The claim is stronger than stated.

The detachment figures hold from both directions: 219 of 232 claims name an id absent from the
whole corpus, and the same 219 name an id absent from their own page's report, so the two tests
coincide on this corpus. 152 of 829 dismissals detach (18.3%). Of the 13 claims that are still
attached, 10 are `nl` and 3 are `uk` — which is why the population in a block is 10 and not 13.
The raw log holds 315 `fixed` events (nl 266, uk 39, be 9, de 1) between 2026-08-06 and
2026-08-18, so the "second store is barely worked" reading holds on the raw population too.

## Method — what the probes measure, and what the ticket asked

- **Measurement 1 is a floor, not a total.** 230 of 246 page pairs were comparable; the other 16
  have a non-200 or empty side somewhere. The answer's table says so, and its headline does not.
- **A flattened unit must survive three alignments.** 97 of the 311 production divergences lost
  their new-site counterpart in one store's axis-A alignment and are excluded with nothing
  claimed. That is the conservative choice and it is stated — but it means a flattening the new
  site also *merged* or *split* (`regrouped`) is invisible to this measurement. The answer
  notices the same effect from the other end, in the two units that are not an axis-A finding
  "with a `regrouped` shape".
- **The class on a cross-store divergence is an addition the block reading refuses.**
  `siblingReading()` drops `diffRows()`' classification deliberately — "a block difference has no
  class" (`web/src/lib/sibling.mjs:104-120`) — and ADR 0017 says "Nothing about it is `work`".
  Probe 1 runs `classifyPair()` over the production pair anyway and the answer reports "109 of
  the 111 are a divergence in **work** classes". As a way of telling a rewritten promise from a
  punctuation nudge it is defensible, and nothing is counted in a bar; as a sentence it lends a
  block difference an axis-A visibility that ADR 0017 says it does not have. The safer phrasing
  is *109 of the 111 are copy or casing and not price or campaign*.
- **Measurement 2 answers the ticket exactly**, with a distribution and both directions, and it
  reuses the production rule rather than inventing one. The one thing the ticket asked that the
  probe does not print is the per-page list; the ranking exists inside `blockReading()`'s
  `shared` and was not written out.
- **Measurement 3's population is the standing decisions, not the events.** That is the right
  reading of "fix claims in the override log" — a cleared claim is not a claim — and the raw
  event log gives the same 0.
- **The unmeasurability is a property of the corpus, not of the method.** 219 detached claims is
  measured, not assumed, and the answer marks the criterion `[~]` rather than `[x]`.

## The traps, and the reading

- **Identical words never reported as linked.** Held. `FLATTENING.md` and the answer both say
  the 113 sizes a transcription pass and is not a list of shared records, and no probe writes
  anything. ADR 0025's own argument — "identical words are what two separate records look like
  on the day before they diverge" — is quoted in the sense the ADR means it.
- **No production divergence framed as work.** Held in substance: the flattening is the finding
  and the divergence is the baseline, nothing is counted, no bar moves. The "work classes"
  sentence above is the one place the wording leans on axis-A vocabulary.
- **No pairing across language blocks.** Held, structurally. `LANGUAGE_BLOCKS` evaluates to
  `[{nl,[nl,be]},{fr,[be_fr,fr]}]`, all three probes iterate it, and `siblingPages()` reaches
  only `siblingOf(store)`. There is no code path by which a `nl` page could pair with a `be_fr`
  one.
- **No cause named.** Held everywhere except the `schuifpui` sentence, which attributes the
  divergence to "`be`'s own rewrite of the Dutch copy". Two extracts cannot say who rewrote whom.
- **A probe and not a feature.** Held: four throwaway scripts and one JSON file under
  `.scratch/`, no production code touched.

**Does `## The reading` follow?** Mostly yes, and it is careful where the numbers are thin.

- *Reduce 07 to its flattening half.* Supported. 111 units on 42 page pairs, 109 in copy or
  casing, and the three quoted units are exactly the customer-facing migration defect the tool
  exists for — I read all three in the extracts. The refusal of the `store-scoped content` label
  is supported by the 21 `neither` rows and by the fact that no crawl sees a server-side
  variable. And the observation that most carries the recommendation — 109 of 111 are already an
  open axis-A finding — reproduces, with the caveat that this 109 is a different measurement
  from the class 109 and the two agreeing is coincidence.
- *Refuse 10.* Supported on its own terms: the derived pairing covers 126 of `be`'s 131 pages
  and 120 of `fr`'s 123 with no table, the pass is 246 and not ten, and only 46% render identical
  texts. One caveat the reading does not carry: **ADR 0025 was amended on 2026-08-19 by ticket
  08**, and the shared-page fact no longer lives in a committed file — it lives in the log's own
  append-only table, edited in the interface (`overrides/record-layout.mjs`,
  `supabase/record-layout.sql`, `web/src/lib/shared-pages.mjs`). Calling it *imported* is still
  right, because the fact is Magento's and the ADR still refuses an editor-declared relation.
  But the argument used against 10 — that a new table widens who may grant a permission — applies
  in part to the table the reading points at instead, and the reading does not say so. I also
  **could not check** that the record-layout table is populated: there is no record-layout backup
  under `data/` and the override backup carries no such rows, so "already answered by the
  shared-page fact" is answered by design here, not by data on disk. `shared-pages.mjs`'s own
  header notes the complement's upper bound is 492 store pages "under a dated layout with no
  entries", which is consistent with there being nothing yet.
- *Refuse 06, and say what would reopen it.* Supported, and it is the most carefully stated
  paragraph in the answer: it separates the opportunity (7 of 10) from the act (0 of 7), names
  the `broken-link` confound, and rests the conclusion on the plainer 8-against-185. The two
  reopening triggers follow from the numbers. The one thing I would add is that 0 of 7 is a
  small sample and the answer says so out loud already.

One overreach worth naming: "the transcription pass behind the bulk press is **two hundred and
forty-six, not ten**" treats every matched pair as a pass item, while the pass ticket 10 would
need is over pairs an editor must *transcribe*, which is not obviously all 246. The direction of
the argument survives either way — 246 candidate pairs and 113 identical is nowhere near ten.

## Provenance

- Verified **2026-08-21**, at commit **`ff263b8`**, over the corpus recorded at the top of this
  file: 816 reports, 35,604 findings on observation `2026-08-19T15:15:18.599Z-135ccd35`, 41,316
  run-log rows, 550 seed rows, 1,618 override events / 1,294 standing.
- The corpus is the same one ticket 11 measured at `cf50c63`: no change to `data/` or `history/`
  between the two commits, and none in the working tree.
- Scripts: `.scratch/cross-store-reuse/verify-11-corpus.mjs`, `verify-11-overrides.mjs`,
  `verify-11-pairing.mjs`, `verify-11-double.mjs`. All throwaway, all read-only.
