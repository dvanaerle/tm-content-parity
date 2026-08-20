# Prototype — 85: the comparison scope is legible

A paper mockup of the read-only half of ticket 85. The data below is the real committed
content of `shared/excluded-pages.mjs`, `shared/excluded-regions.mjs` and
`compare/vocabulary.mjs`; counts marked *(illustratief)* stand in for a snapshot.

Placement: one section below the store strip, replacing the *Niet gecontroleerd* aside at
`Dashboard.jsx:412-430` and absorbing the excluded-regions panel at `:433-452`.

---

## Section header

> ### Wat deze vergelijking bekijkt
>
> Waar de log met opzet niet kijkt, en wat er sinds de vorige run veranderd is.
> Deze lijsten liggen vast in de repository. Wijzigen gaat via een pull request op
> `shared/excluded-pages.mjs` en `shared/excluded-regions.mjs`.

---

## 1. The warning hoist — above every list

Only rendered when there is something to say. `unchanged` stays silent.

```
+--------------------------------------------------------------------------------+
| !  #campaign-banner sluit niets meer uit                                       |
|                                                                                |
|    Vorige snapshot: verwijderd op 446 van 448 paginas.                         |
|    Deze run:        verwijderd op 0 paginas.                                   |
|                                                                                |
|    De 446 bevindingen die deze regel weghaalde staan weer in de backlog.       |
|    Een regel die op een campagne is geankerd stopt met matchen zodra de        |
|    campagne verandert.                                                         |
|                                                                                |
|    Eigenaar: content-parity-maintainers                                        |
|    Aanpassen: pull request op shared/excluded-regions.mjs                      |
+--------------------------------------------------------------------------------+
```

Second shape — an entry removed on zero pages where no *was* is available, so the count is
not claimed:

```
+--------------------------------------------------------------------------------+
| !  .filter-content is op 0 paginas verwijderd                                  |
|    Deze regel matcht nergens in deze run. Het aantal teruggekeerde             |
|    bevindingen is onbekend: de vorige snapshot heeft een andere omvang.        |
+--------------------------------------------------------------------------------+
```

Third shape — the guard refuses the comparison (`REGION_VERDICT_REASON`). No warning at
all, one line instead, so a one-store run never reads as five stores that stopped matching:

```
Niet vergeleken. De vorige snapshot heeft een andere omvang, of ontbreekt.
De volgende run vergelijkt opnieuw.
```

---

## 2. Uitgesloten paginas

Per entry: the page, the reason, and **how many stores it applies to** — the count
`excludedInStore()` already derives per store but never totals.

| Pagina                 | Reden                                                 | Winkels | Telt in |
|------------------------|-------------------------------------------------------|---------|---------|
| `veranda-configurator` | Application page with no comparable editorial content | nl      | 1 van 6 |

*Aanpassen: pull request op `shared/excluded-pages.mjs`.*

Empty state: `Geen paginas uitgesloten. Alle 448 paginas worden vergeleken.`

The two neighbouring kinds keep their own words and are **not** folded into this table —
`dropped-by-rule` is a seed rule and `not-crawled` is a failed fetch, not a decision:

| Kind              | Aantal | Woord                                               |
|-------------------|--------|-----------------------------------------------------|
| `excluded-page`   | 1      | Uitgesloten pagina                                  |
| `dropped-by-rule` | 12     | Niet toegelaten door zaadregel *(illustratief)*     |
| `not-crawled`     | 3      | Geen rapport — de fetch is mislukt *(illustratief)* |

---

## 3. Uitgesloten regios

Per entry: selector, kind, reason, the pages it was removed on **per store**, and its
coverage verdict against the previous snapshot. Counts *(illustratief)*.

| Selector                      | Soort            | Reden                                            | Verwijderd op (per winkel)                       | Verdict             |
|-------------------------------|------------------|--------------------------------------------------|--------------------------------------------------|---------------------|
| `#amasty-shopby-product-list` | Catalogusinhoud  | Product grid content comes from the catalogue    | nl 74 · be 74 · be_fr 71 · de 68 · fr 68 · uk 63 | Onveranderd         |
| `#campaign-banner`            | Alleen productie | Campaign banner exists on production only        | nl 0 · be 0 · be_fr 0 · de 0 · fr 0 · uk 0       | ! Stopt met matchen |
| `.filter-content`             | Catalogusinhoud  | Filter labels and counts come from the catalogue | nl 74 · be 74 · be_fr 71 · de 68 · fr 68 · uk 63 | Onveranderd         |

Expanded row — what the committed entry carries, including the ADR 0003 evidence:

```
#campaign-banner  ·  Alleen productie
  Reden      Campaign banner exists on production only.
  Gemeten op carport, terrasoverkapping, (home)
             productie 8 eenheden · nieuw 0 eenheden
  Plafond    maxUnits 30
  Verdict    Stopt met matchen — vorige snapshot 446 paginas, nu 0.
```

An extract written before ADR 0003 carries no record of regions removed. It must not read
as *stopped matching*:

```
  Verdict    Niet te zeggen — de snapshot kan ouder zijn dan deze regel.
```

*Aanpassen: pull request op `shared/excluded-regions.mjs`. Elke regel heeft een gemeten
eenhedental op ten minste drie paginas nodig; `validateRegions()` weigert een regel die
kopruimte claimt die nooit gemeten is.*

---

## 4. Bevindingsklassen

Every class on one screen, grouped by visibility, each with its finding count on the
current snapshot. Counts *(illustratief)*.

### `work` — hier beslist een editor over · Σ 312

| Klasse                     | Woord                    | Bevindingen |
|----------------------------|--------------------------|-------------|
| `copy`                     | Copy changed             | 88 |
| `casing`                   | Case or punctuation      | 41 |
| `text-missing`             | Text missing             | 27 |
| `broken-link`              | Broken link              | 6  |
| `missing-link`             | Link missing             | 14 |
| `link-target`              | Link target changed      | 9  |
| `leakage`                  | Link to production       | 3  |
| `cross-store-link`         | Link to another store    | 1  |
| `image-missing`            | Image missing            | 12 |
| `alt-lost`                 | Alt text lost            | 18 |
| `alt-changed`              | Alt text changed         | 22 |
| `meta-title-changed`       | Title changed            | 16 |
| `meta-title-lost`          | Title missing            | 2  |
| `meta-description-changed` | Description changed      | 31 |
| `meta-description-lost`    | Description missing      | 5  |
| `meta-casing`              | Head case or punctuation | 11 |
| `robots-index-lost`        | Page leaves the index    | 4  |
| `robots-noindex-lost`      | Page enters the index    | 2  |

### `information` — naartoe te linken, niet over te beslissen · Σ 196

| Klasse                   | Woord                          | Bevindingen |
|--------------------------|--------------------------------|-------------|
| `restructured`           | Moved to another element       | 34 |
| `price`                  | Numbers differ                 | 29 |
| `regrouped`              | Same text, divided differently | 47 |
| `text-added`             | Text added                     | 26 |
| `heading-level`          | Heading level changed          | 19 |
| `extra-link`             | Link added                     | 15 |
| `image-added`            | Image added                    | 11 |
| `meta-title-added`       | Title added                    | 8  |
| `meta-description-added` | Description added              | 7  |

### `diagnostic` — wat een regel zag, achter *Toon diagnostiek* · Σ 501

| Klasse                  | Woord                 | Bevindingen |
|-------------------------|-----------------------|-------------|
| `campaign`              | Promotional copy      | 446 |
| `tag-changed`           | Element changed       | 33  |
| `redirect`              | Link redirects        | 14  |
| `image-campaign`        | Campaign image        | 6   |
| `no-declared-alternate` | No declared alternate | 2   |

*Deze tabel is geen bediening. Een klasse aan- of uitzetten gaat via een pull request op
`compare/vocabulary.mjs`, om dezelfde reden als de rest van dit paneel: een uitsluiting
verandert wat het corpus **meet**.*

> **The 446 under `campaign` and the 446 in the warning at the top are the same 446.**
> That is the whole reason for putting the two on one screen.

---

## 5. The owner line

Rendered once, under the section. This is the answer AC-7 asks for:

> Deze lijsten hebben een eigenaar: **content-parity-maintainers** (`CODEOWNERS`, ADR 0003).
> Een regel die stopt met matchen is hun melding. Laatst nagekeken: 2026-08-20.

---

## Two places the criteria and the tree disagree

- **AC-5 says 21 classes. `FINDING_CLASSES` holds 32** — 18 `work`, 9 `information`,
  5 `diagnostic`. The literal in the ticket is stale; the criterion should read *every
  class in `FINDING_CLASSES`*, or it is wrong again at 33.
- **The trap says the dashboard speaks Dutch, but `REGION_VERDICT` and `REGION_KIND`
  (`Dashboard.jsx:1117-1154`) are written in English today.** This prototype is Dutch, per
  the trap. Either way the seam is unchanged — the snapshot stores verdicts and each side
  writes its own words — so it is a change to the wording tables only.
