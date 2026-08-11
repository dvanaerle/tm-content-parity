# 89 — What a one-sided campaign rule would catch

Type: research
Status: resolved 2026-08-11 — measured. **90 is refused as written.** A one-sided
`PROMO` rule sweeps 58 editorial findings, is blind in `de`, `fr` and `be_fr`, and
leaves 1,175 shown link findings behind. See `## Answer`.
**Its closing recommendation is superseded the same day — see `## What happened next`.**
The refusal stands; "keep the option-id anchor and accept a commit per campaign" does not.
Blocked by: None — can start immediately.
Parent: ../map.md

**What to answer:** if the campaign rule fired when the pattern is on production and the
new side is missing, how much real editorial content would it sweep up with the banner?

[90](90-a-campaign-is-a-class-not-a-commit.md) is only worth building if the answer is
"almost none". This ticket is a script over the reports that exist. **No crawl.**

## Why the question exists

The `campaign` class already exists, hidden, with a generic pattern in `compare/text.mjs`:

```
korting | deal | actie(?!f) | aanbieding | black\s*friday | sale | nu\s+vanaf | op\s+voorraad
```

It does not fire on the promo banner. The rule requires the pattern on **both** sides,
and the banner is absent from the new site, so the finding falls through to
`text-missing`.

That is why the banner needed a hand-written selector anchored on the campaign option ids
`6039,6040` — and why **every new campaign needs a new commit**. The regex does not care
which campaign it is. The selector does.

Measured: 1,645 shown findings match the banner strings, **7.2% of all shown findings**,
and every one carries `anchorHeading: null`.

## What to produce

- The count of shown `text-missing`, `casing` and `copy` findings whose **production**
  side matches `PROMO` and whose new side is missing or does not match.
- Of those, how many are the banner. Use the excluded-region entry's own definition to
  separate them, not a list of strings, so the filter and the exclusion agree.
- **The remainder, listed in full if it is small.** This is the whole point: the false
  positives are the answer. A paragraph that says *"Actie: vraag een gratis proefmontage
  aan"* is editorial content and a rule that hides it is worse than a per-campaign commit.
- The same counts per store, because the pattern is Dutch and four stores are not.
  `uk`, `de` and `fr` copy will match `sale` and `deal` differently, or not at all.
- A recommendation: build 90, build 90 with a narrower pattern, or keep the selector.

## Acceptance criteria

- [x] The script is a throwaway and is not committed. The numbers go in this ticket's
      answer.
- [x] The banner and the non-banner matches are reported separately, with the totals per
      store.
- [x] Every non-banner match is listed with its page, its class and its production text,
      if there are fewer than about 200. If there are more, that is the answer and the
      ticket recommends against 90.
- [x] The four non-Dutch stores are reported separately. A Dutch-only pattern that is
      blind in `de`, `fr` and `uk` is a finding about the rule, and ADR 0003 already
      rejected a Dutch text anchor for exactly this reason.
- [x] The answer states what happens to the committed region entry if 90 ships: whether it
      is retired, kept as a belt-and-braces measure, or kept for the links and images the
      text rule cannot reach. *(It said "kept". Ticket 90 then re-anchored it — see
      `## What happened next`.)*
- [x] No file in `data/` is written or moved, and `shared/excluded-regions.mjs` is not
      touched. *(True of this ticket's research. Ticket 90 edited the entry afterwards.)*

## Traps

- **The banner is not only text.** It carries `missing-link` findings too — the
  measurement of 2026-08-10 found link tuples on `_model=6039%2C6040` at 299, 239 and 99
  findings. A text-only rule leaves those behind, so report the link and image side as
  well or 90 will look complete when it is not.
- **`IMAGE_CAMPAIGN` in `compare/images.mjs` already matches on either side.** So the
  images check has the behaviour the text check lacks. Say why they differ, because one of
  the two is wrong and the answer should name which.
- **`actie(?!f)` exists to avoid `actief`.** Any pattern change needs the same care, and
  the answer should list the near-misses it found.
- The exclusion currently removes the banner, so the reports on disk may or may not still
  hold it depending on when they were written. Check before counting, and say which corpus
  the numbers describe. Ticket 76 has the same problem and the same obligation.

---

## Answer

**Measured 2026-08-11.** Every number below is re-derived from the reports on disk.
Nothing in `data/` was written or moved, and `shared/excluded-regions.mjs` was not
touched. No crawl, no network.

**The script is a throwaway and is not committed.** It lives outside the repo, at
`%TEMP%\ticket-89\count-campaign.mjs` (and `table.mjs` for the list below). It
imports `PROMO` from `compare/text.mjs:25`, `IMAGE_CAMPAIGN` from
`compare/images.mjs:25`, `FINDING_CLASSES` from `compare/vocabulary.mjs:42` and
`EXCLUDED_REGIONS` from `shared/excluded-regions.mjs:65`, so no rule is retyped.

### 0. Which corpus this describes, and it is a mixed one

The corpus is `data/reports/*.json`: **816 reports, 54,742 findings, 37,329 shown**
(`FINDING_CLASSES[class].shown`), all with `builtAt: 2026-08-10T10:09Z`.

**The banner exclusion had already landed when these reports were built, and that
is not the same as saying the banner is out of them.** The entry was committed in
`d9377af` (2026-08-07 15:44, ticket 64). A region is cut **at extraction**
(`docs/adr/0003`), so a report only loses the banner if its extract was crawled
after that commit. Of the 816 extracts:

| store | pages | extracts that still carry the banner | crawled |
| --- | --- | ---: | --- |
| nl | 179 | **178** | 2026-08-06/07, before the entry |
| be | 130 | **124** | 2026-08-07, before the entry |
| be_fr | 122 | **29** | 2026-08-07, before the entry |
| de | 134 | **45** | 2026-08-07, before the entry |
| fr | 123 | **28** | 2026-08-07, before the entry |
| uk | 128 | **42** | 2026-08-07, before the entry |
| **total** | **816** | **446** | the other 370 were crawled 2026-08-10 09:00–12:00 |

"Carries the banner" is the entry's own predicate: a production link whose **raw
`href`** contains `_model=6039,6040` or `_model=6039%2C6040`, the two tokens parsed
straight out of `EXCLUDED_REGIONS[1].selector` (`shared/excluded-regions.mjs:103`).

Two corroborations that this is the spec-50 seam and not an accident. 446 is
exactly ticket 64's "the banner is on 446 of 448 pages". And the per-store counts
29 / 45 / 28 / 42 are byte-for-byte the old page counts in ticket 04's answer, i.e.
the 448-pair seed list — every page added by tickets 54 and 55 was crawled with the
exclusion live and holds no banner.

So: **the banner counts below are what is left of it on 446 pages, not what it
would make on 816.** They are a floor, not a ceiling. Two further caveats: every
extract predates the ticket-67 fold (`79b9985`, 2026-08-10 14:10), so the corpus is
pre-fold; and the reports were built at 12:09, before it too.

**The ticket's own numbers do not carry over.** The body says "1,645 shown findings
match the banner strings, 7.2% of all shown findings". 1,645 / 22,990 = 7.2%, and
22,990 is the 448-report corpus in `RUNBOOK.md` session 10. Against the corpus on
disk today the banner is **2,055 shown findings of 37,329 — 5.5%** (880 text + 804
`_model` link + 371 terms-link, below). The old figure is history. The claim that
every banner finding carries `anchorHeading: null` **does hold**: 880 of 880 text
findings and 804 of 804 link findings.

### 1. What the one-sided rule would catch

Shown `text-missing`, `casing` and `copy` findings where `PROMO` matches the
**production** side and the new side is missing or does not match:

| | total | banner | non-banner |
| --- | ---: | ---: | ---: |
| all | **938** | **880** | **58** |
| `text-missing` | 929 | 876 | 53 |
| `copy` | 9 | 4 | 5 |
| `casing` | **0** | 0 | 0 |

`casing` is a zero: a case-only difference never carries the pattern on one side
alone. The rule is a `text-missing` rule with nine `copy` rows attached.

Per store:

| store | total | banner | non-banner |
| --- | ---: | ---: | ---: |
| nl | 511 | 492 | **19** |
| be | 367 | 348 | **19** |
| uk | 50 | 40 | **10** |
| de | 8 | **0** | **8** |
| fr | 1 | **0** | **1** |
| be_fr | 1 | **0** | **1** |

### 2. How banner and non-banner were told apart

The exclusion is a DOM selector and an extract holds no DOM path, so the entry's
selector cannot be replayed over the corpus. What can be replayed is its **anchor**.
Per page: seed on the indices of the production links whose raw `href` carries a
token from the entry's own selector; a content unit within two positions of a seed
is inside the block the entry cuts (units, links and images share one index counter,
`compare/images.mjs:47`); a text that does so on **two or more pages of the same
store** is the shared block, and a page's own `h1` beside the banner is not.

That derives the banner vocabulary from the corpus rather than from a hand-written
string list, and it agrees with `data/probe-promo-banner.json`, which is the entry's
real selector run through the real extractor on three pages plus four controls in
every store (2026-08-10 11:54).

**The vocabulary, and which entries `PROMO` actually matches — this is the finding
about the rule:**

| store | banner lines the region removes | matched by `PROMO` |
| --- | --- | ---: |
| nl | `10% korting op terrasoverkappingen en carports.`, `Bekijk deals`, `Bekijk alle deals`, `actievoorwaarden`, `Geldig op geselecteerde modellen.`, `terrasoverkappingen`, `carports` | **4** |
| be | as nl, without `Bekijk deals` | **3** |
| uk | `10% discount on verandas and carports.`, `Valid on selected models.`, `View all deals`, `promotion terms`, `verandas`, `carports` | **1** |
| de | `10% Rabatt auf Terrassenüberdachungen und Carports.`, `Gültig für ausgewählte Modelle.`, `Alle Angebote ansehen`, `Aktionsbedingungen`, `Terrassenüberdachungen`, `Carports` | **0** |
| fr / be_fr | `10% de réduction sur les vérandas et les carports.`, `Valable sur une sélection de modèles.`, `Voir toutes les offres`, `conditions de la promotion`, `vérandas`, `carports` | **0** |

`Aktionsbedingungen` is not `actie` — the German is a `k`. `réduction`, `offres`
and `promotion` are not in the pattern at all. **A one-sided `PROMO` rule removes
nothing from the German, French and Belgian-French banner, and removes one line per
page from the English one.** ADR 0003 rejected a Dutch text anchor for this exact
reason, and the option ids were chosen because they are the one signal that reads
the same in all six stores (`shared/excluded-regions.mjs:89-102`). Ticket 90 walks
back into the objection ADR 0003 already sustained.

### 3. Every non-banner match, in full — 58 rows

Caught by: `nu vanaf` 26, `deal` 23, `actie` 6, `sale` 3. Of the 23 `deal` rows,
**22 are the substring in `ideal` / `ideale` / `idealen` / `idealisierend`** and one
is the English verb (*"to deal with your enquiry"*, the uk privacy policy).

| store | page | class | occ | caught by | production text (58 rows) |
| --- | --- | --- | --- | --- | --- |
| be | `(home)` | text-missing | 1 | nu vanaf (`Nu vanaf`) | Nu vanaf € 70 |
| be | `(home)` | text-missing | 2 | nu vanaf (`Nu vanaf`) | Nu vanaf € 799 |
| be | `aluminium-zijwand/productinformatie` | text-missing | 1 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| be | `fotogalerij/glazen-schuifwand` | text-missing | 1 | actie (`actie`) | Antractiet glazen schuifdeur in terrasoverkapping van aluminium |
| be | `glazen-schuifwand/hor-schuifdeur` | text-missing | 1 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| be | `heavy-duty-terrasoverkapping` | text-missing | 1 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| be | `herroeping` | text-missing | 1 | actie (`actie`) | Gevolgen van de herroeping Wanneer de overeenkomst succesvol herroepen is, ontvangt u alle betalingen die u to… |
| be | `lighting-system/productinformatie` | text-missing | 1 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| be | `schuifwand` | copy | 1 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| be | `schuifwand` | text-missing | 3 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| be | `shading-panel/productinformatie` | text-missing | 1 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| be | `shading-panel` | copy | 1 | deal (`deal`) | U zit lekker buiten onder uw terrasoverkapping, maar de zon schijnt toch wat fel. Later op de dag schijnt de z… |
| be | `shading-panel` | text-missing | 1 | deal (`deal`) | De ideale buiten shutters |
| be | `steel-look-glazen-schuifwand/productinformatie` | text-missing | 1 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| be | `steel-look-glazen-schuifwand` | copy | 1 | deal (`deal`) | Wilt u langer onder uw terrasoverkapping genieten en wilt u uw overkapping een extra luxe, unieke uitstraling … |
| be | `terrasoverkapping/productinformatie` | text-missing | 1 | deal (`deal`) | Alle aluminiumprofielen van Gumax® terrasoverkappingen zijn bovendien ook gepoedercoat met Gumax® Excellence S… |
| be | `terrasoverkapping` | text-missing | 1 | actie (`actie`) | * Prijs is excl. lopende acties. |
| be | `terrasoverkapping` | text-missing | 3 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| be | `verlichting` | text-missing | 2 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| be_fr | `(be_fr)fr/protection-solaire/questions-frequemment-posees` | text-missing | 1 | sale (`sale`) | La moisissure ne peut pas apparaitre sur la toile vu qu'elle est faite en fils de polyéthylène téréphtalate co… |
| de | `(de)aluminium-seitenwand/produktinformationen` | text-missing | 1 | deal (`deal`) | Unschlagbar günstig und guter Service! Ich habe insg. 15 Glasschiebetüren plus 4 Shading Panels bestelt und im… |
| de | `(de)glasschiebewand/fliegengitter-schiebetur` | text-missing | 1 | deal (`deal`) | Unschlagbar günstig und guter Service! Ich habe insg. 15 Glasschiebetüren plus 4 Shading Panels bestelt und im… |
| de | `(de)heavy-duty-terrassenueberdachung` | text-missing | 1 | deal (`deal`) | Unschlagbar günstig und guter Service! Ich habe insg. 15 Glasschiebetüren plus 4 Shading Panels bestelt und im… |
| de | `(de)shading-panel/produktinformationen` | text-missing | 1 | deal (`deal`) | Unschlagbar günstig und guter Service! Ich habe insg. 15 Glasschiebetüren plus 4 Shading Panels bestelt und im… |
| de | `(de)stahl-look-glas-schiebetuer/produktinformationen` | text-missing | 1 | deal (`deal`) | Unschlagbar günstig und guter Service! Ich habe insg. 15 Glasschiebetüren plus 4 Shading Panels bestelt und im… |
| de | `(de)terrassenueberdachung/fassadendaemmung-montagesystem` | text-missing | 1 | deal (`deal`) | Unschlagbar günstig und guter Service! Ich habe insg. 15 Glasschiebetüren plus 4 Shading Panels bestelt und im… |
| de | `(de)ueber-uns` | text-missing | 1 | deal (`deal`) | Wir sind ständig auf der Suche nach Möglichkeiten, unsere Aktivitäten zu erweitern, damit wir noch mehr Kunden… |
| de | `terrasoverkapping` | text-missing | 1 | deal (`deal`) | Ideal für kleine Gärten |
| fr | `(fr)protection-solaire/questions-frequemment-posees` | text-missing | 1 | sale (`sale`) | La moisissure ne peut pas apparaitre sur la toile vu qu'elle est faite en fils de polyéthylène téréphtalate co… |
| nl | `(home)` | text-missing | 1 | nu vanaf (`Nu vanaf`) | Nu vanaf € 70 |
| nl | `(home)` | text-missing | 2 | nu vanaf (`Nu vanaf`) | Nu vanaf € 799 |
| nl | `aluminium-zijwand/productinformatie` | text-missing | 1 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| nl | `fotogalerij/glazen-schuifwand` | text-missing | 1 | actie (`actie`) | Antractiet glazen schuifwand in terrasoverkapping van aluminium |
| nl | `glazen-schuifwand/hor-schuifdeur` | text-missing | 1 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| nl | `heavy-duty-terrasoverkapping` | text-missing | 1 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| nl | `herroeping` | text-missing | 1 | actie (`actie`) | Gevolgen van de herroeping Wanneer de overeenkomst succesvol herroepen is, ontvangt u alle betalingen die u to… |
| nl | `home-nl` | text-missing | 1 | nu vanaf (`Nu vanaf`) | Nu vanaf € 70 |
| nl | `home-nl` | text-missing | 2 | nu vanaf (`Nu vanaf`) | Nu vanaf € 799 |
| nl | `lighting-system/productinformatie` | text-missing | 1 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| nl | `schuifwand` | copy | 1 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| nl | `schuifwand` | text-missing | 3 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| nl | `serre` | text-missing | 1 | actie (`actie`) | *Prijs is excl. lopende acties. |
| nl | `serre` | text-missing | 1 | deal (`deal`) | Je terrasoverkapping als loungeruimte inrichten, hoe doe je dat? Met deze vijf tips kun je aan de slag om het … |
| nl | `shading-panel/productinformatie` | text-missing | 1 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| nl | `steel-look-glazen-schuifwand/productinformatie` | text-missing | 1 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| nl | `steel-look-glazen-schuifwand` | copy | 1 | deal (`deal`) | Wilt u langer onder uw terrasoverkapping genieten en wilt u uw overkapping een extra luxe, unieke uitstraling … |
| nl | `terrasoverkapping` | text-missing | 3 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| nl | `verlichting` | text-missing | 2 | nu vanaf (`Nu vanaf`) | Nu vanaf |
| uk | `(uk)about-us` | text-missing | 1 | deal (`deal`) | We are continuously looking for opportunities to expand our activities so that we can help even more customers… |
| uk | `(uk)install-a-veranda` | text-missing | 1 | sale (`sale`) | sales@saffronol.com |
| uk | `(uk)privacy-policy` | text-missing | 1 | deal (`deal`) | Telephone calls. Calls to and from our customer service, service and planning departments are recorded, and th… |
| uk | `lighting-system` | text-missing | 1 | deal (`deal`) | Setting up your veranda as a lounge area - how do you do it? These five tips will help you create the ideal pl… |
| uk | `overkapping` | text-missing | 1 | deal (`deal`) | Your ideal canopy |
| uk | `shading-panel` | text-missing | 1 | deal (`deal`) | Gumax® Shading Panels are ideal as outdoor sun shading with slats, but also for controlling airflow under your… |
| uk | `shading-panel` | text-missing | 1 | deal (`deal`) | The ideal outdoor shutters |
| uk | `terrasoverkapping` | text-missing | 1 | deal (`deal`) | Ideal for small gardens |
| uk | `tuinkamer` | text-missing | 1 | deal (`deal`) | Create your ideal garden room |
| uk | `tuinoverkapping` | text-missing | 1 | deal (`deal`) | Configure your ideal garden canopy |

**What is in that list.** 26 rows are the price label `Nu vanaf` / `Nu vanaf € 799`
— a product-block label, not a campaign, and one of them is a **shown `copy` row
where the new site changed it to `Vanaf`**, which is precisely the CTA-change case
the both-sides rule was written to protect (`compare/text.mjs:18-23`). 22 rows are
the `ideal` substring, and they are headings and paragraphs an editor wrote:
`Your ideal canopy`, `Ideal for small gardens`, `The ideal outdoor shutters`,
`Create your ideal garden room`, `Configure your ideal garden canopy`. Three rows
are long legal or FAQ paragraphs that a single buried word drags in — the Dutch
herroeping notice, the French `saleté` mould answer, the English privacy policy.
Two rows are the `Antractiet` photo caption, where `actie` sits inside a misspelt
colour name. **Four rows are `copy` findings with real lost sentences in them**
(`shading-panel`, `steel-look-glazen-schuifwand` on nl and be): production's
paragraph is longer than the new site's, and the finding would go from shown to
hidden because the paragraph contains the word *ideale*.

None of the 58 is a campaign. The ticket asked whether the collateral is "almost
none"; it is small in count and it is not none, and its worst members are exactly
the findings the log exists to make.

### 4. The link and the image side, which a text rule does not reach

**Links, production key carrying the campaign anchor** (`_model=6039,6040` /
`_model=6039%2C6040`), all shown:

| class | nl | be | be_fr | de | fr | uk | total |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `missing-link` | 242 | 229 | 75 | 121 | 50 | 80 | **797** |
| `link-target` | 4 | 3 | — | — | — | — | **7** |

**Plus the campaign terms page**, the second link in the same block
(`actievoorwaarden-10-korting-…`, `promotion-terms-10-discount-…`,
`conditions-promotion-10-remise-…`, `aktionsbedingungen-10-rabatt-…`):
`missing-link` nl 123, be 116, de 42, uk 40, be_fr 25, fr 25 — **371**, all shown.

So the banner makes **1,175 shown link findings** on 446 pages, against 880 shown
text findings. **A text-only rule leaves more behind than it removes**, and it
leaves it behind in every store including the three where it removes nothing.
(The ticket's trap quotes 299 / 239 / 99 for the link tuples; against this corpus
the per-store figures are 242 / 229 / 121 / 80 / 75 / 50. Re-derived, not carried.)

**Images**, `image-campaign`, which already fires one-sided: nl 128, be 121, de 88,
uk 85, be_fr 54, fr 54 — **530, and all of them hidden already**. Plus 4 `alt-lost`
and 2 `alt-changed` on campaign images, which are shown. The image half of the
banner is the one half that already needs no work.

### 5. Why the two checks differ, and which one is wrong

`compare/text.mjs:18-24` requires both sides because a text identity is ambiguous:
`Bekijk alle deals` → `Bekijk alle FAQs` is a real CTA change and the most important
kind of finding the log makes. `compare/images.mjs:15-24` fires on either side
because an image identity is a filename, and under a both-sides rule production's
`2026-07-23-KortingActie-NL-16Aug.svg` would have been the largest single source of
findings in the dataset.

Both arguments are sound, and the difference is not an inconsistency: it follows
from what the two identities are. **The claim that is wrong is the symmetry claim —
that `campaign` is one class and therefore wants one rule.**

If one of the two files must be named, it is **`compare/images.mjs`**, and the
evidence is in this corpus. `IMAGE_CAMPAIGN` has no word boundary either, and
one-sidedness makes that cost real: of the 530 `image-campaign` findings, **24 are
`ontwerp_je_ideale_overkapping.jpg`** — an editorial image, hidden as a campaign
image because `ideale` contains `deal`. Two more are `actie-updates_nl.jpg` and
`actie-updates_uk.jpg`, which are plausibly a newsletter block rather than this
campaign. **4.9% of the one-sided image rule's output is already collateral**, and
nobody noticed because the class is hidden. Ticket 90 proposes to import that same
defect into the text check, where the class it displaces is shown.

### 6. Near misses, for any pattern change

Counted over every production content unit in the 816 reports. Words `PROMO` matches
today that are **not** campaign words:

`actievoorwaarden` 622 (banner, wanted), `winactie` 38, `ideale` 31, `ideal` 27,
`saleté` 10, `idealisierend` 6, `idealen` 5, `actieperiode` 4, `kortingsactie` 4,
`transactietijden` 4, `transactie` 4, `reactie` 4, `reacties` 4, `saletés` 2,
`antractiet` 2, `interactieve` 2, `winactie-terrasverwarmer` 2, `wholesale` 1,
`dealing` 1.

The guard already there, `actie(?!f)`, correctly keeps out `actief` (10 units) but
`interactieve` (2) slips past it — the guard is one character, not a boundary. And
the German `Aktion*` family is 113 units the pattern never sees at all
(`aktionsbedingungen` 91, `sonderaktionen` 9, `aktion` 6, `rabattaktion` 1). A
pattern change needs word boundaries on `deal` and `sale` and a leading boundary on
`actie`, plus `rabatt`, `angebot`, `réduction`, `promotion`, `discount` and `offre`
if it is to see the other four stores at all — and each of those brings its own
`Sonderangebot` / `promotional` tail.

### 7. Recommendation: keep the selector; do not build 90 as written

**Refuse 90 in its proposed form. Keep the hand-written region entry.** The reasons,
in the order they decide it:

1. **It is blind where the banner is.** 0 banner lines matched in `de`, `fr` and
   `be_fr`; 1 per page in `uk`. A rule that works in two of six stores does not
   retire a rule that works in six, and ADR 0003 already refused a Dutch text anchor
   on this argument.
2. **It cannot reach the links.** 1,175 shown link findings against 880 text ones.
   90 would look complete and would remove less than half the banner.
3. **The collateral is small but it is the wrong 58.** Four `copy` rows with real
   lost sentences and ten `ideal` headings would go from shown to hidden, with no
   editor action and no record. A per-campaign commit is a cheap, visible,
   reviewable cost; a silently hidden regression is not.
4. **The one-sided image rule already shows the failure mode**: 24 hidden findings
   on an editorial image, unnoticed because the class is hidden.

**A narrower pattern does not rescue it either.** Anchoring `deal` and `sale` on word
boundaries kills 22 of the 58 collateral rows, and dropping `nu vanaf` kills 26 more
— that is 48 of 58, and it also removes `Bekijk deals` from what the rule catches on
the banner. What remains is a rule that catches four Dutch and Belgian lines and one
English one, still misses the German and French banner entirely, and still leaves
1,175 link findings. The pattern is not the problem; the anchor is.

**What happens to the committed region entry:** it stays, unchanged, as the primary
mechanism — **not** belt-and-braces and **not** links-and-images only. It is the only
thing in the pipeline that reads the same in all six stores, and it removes the text,
the links and the image in one cut. Its real cost is the one the ticket named: it is
campaign-specific by construction and needs a commit per campaign. The right ticket
to write next is not a text-pattern rule but the ownership and detection the entry
already asks for in its own `reason` (`shared/excluded-regions.mjs:117`, *"Deze lijst
heeft een eigenaar nodig"*). The coverage check that reports in one line when the
entry stops matching is already built (ticket 64), so what is missing is a named
owner and a way to carry the option-id pair as configuration rather than as a source
edit. If 90 is rewritten, that is what it should be.

**Answered against:** `data/reports/*.json`, 816 reports, `builtAt`
2026-08-10T10:09Z, of which 446 extracts still carry the banner. Cross-checks read
`data/probe-promo-banner.json` and `data/probe-promo-banner-corpus.json`
(2026-08-10, ticket 64's own probes). Nothing under `data/` was modified.

---

## What happened next

**Same day, 2026-08-11.** The measurement above is unchanged and the refusal of 90's
text rule stands on it. What did not survive is section 7's closing move — *"keep the
hand-written region entry… its real cost is the one the ticket named: it is
campaign-specific by construction and needs a commit per campaign."*

That framing assumed the anchor had to be chosen from what production already emitted.
It did not. The banner block is editable in the Magento admin, and production now marks
it with `id="campaign-banner"`. The entry re-anchors on the hook and stops naming a
campaign, so the per-campaign commit goes without any text rule existing. Measured
identical to the option-id selector in matches, units, links and images on every page of
every store. See [90](90-a-campaign-is-a-class-not-a-commit.md)'s answer.

**This does not weaken the research, and one part of it got sharper.** The reason a DOM
hook is the right anchor is precisely §2's finding: `PROMO` matches 0 banner lines in
`de`, `fr` and `be_fr`. Any text anchor was going to be blind in half the stores, which
is what ADR 0003 said. The measurement is what ruled the text route out; it just turned
out there was a third option outside the three this ticket was asked to choose between.

**Still open, and this ticket found both.** The `IMAGE_CAMPAIGN` collateral in §5 — 24
hidden findings on `ontwerp_je_ideale_overkapping.jpg` — is untouched and still live; it
is now [101](101-the-image-campaign-rule-hides-editorial-images.md). And §7's request for
a named owner is still unanswered: the hook moves the recurring dependency from a
developer to whoever builds the next CMS block, and nothing fails loudly at the crawl when
a committed entry matches nothing. That second one is deliberately not a ticket — ticket
64's coverage reports it a run later, which is judged good enough.
