# Glossary audit - Copy and Case or punctuation

Every `copy`, `casing` and `meta-casing` finding on the `2026-08-19T15:15:18.599Z-135ccd35` snapshot, judged against *Woordenlijst Tuinmaximaal januari 2026*.

- **1,432** findings in scope (1,169 Copy + 259 Case or punctuation + 4 head casing)
- **44** settled by the word list -- word-identical, differing only in case, punctuation or the (R) mark
- **22** the new site gets right -> bulk dismissal (`dismiss-new-correct.sql`)
- **22** production gets right -> copy fixes for the CMS, no SQL
- **94** the word list touches but cannot settle -> human review
- the rest are outside the word list: rewrites, prices, and prose the glossary has no opinion on

## The new site is correct - dismiss these

| store | page | prod | new | term |
| --- | --- | --- | --- | --- |
| be | carport/productinformatie | Gumax® Glazen schuifwand | Gumax® glazen schuifwand | Gumax® glazen schuifwand |
| be | carport/productinformatie | Gumax® Steel look glazen schuifwand | Gumax® Steel Look glazen schuifwand | Gumax® Steel Look glazen schuifwand |
| be | carport/productinformatie | Gumax® Shading panel | Gumax® Shading Panel | Gumax® Shading Panel(s) |
| be | glazen-schuifwand/productinformatie | Gumax® Deurmeenemers | Gumax® deurmeenemers | Gumax® deurmeenemer |
| be | schuifwand | Gumax® Schuifwanden voor uw overkapping | Gumax® schuifwanden voor uw overkapping | Gumax® schuifwand(en) |
| be | schuifwand | Gumax® Hor schuifdeur | Gumax® hor schuifdeur | Gumax® hor schuifdeur |
| be | voordelen-van-een-aluminium-terrasoverkapping | Modern, klassiek, Tijdloos, Authentiek of Eigentijds ontwerp | Modern, Klassiek, Tijdloos, Authentiek of Eigentijds ontwerp | Klassiek |
| be | zwarte-overkapping | Stijlvol & tijdloos | Stijlvol & Tijdloos | Tijdloos |
| be | zwarte-overkapping | glazen schuifwanden | Glazen schuifwanden | Glazen schuifwand |
| be_fr | verlichting | Choisissez vos spots LED > | Choisissez vos Spots LED | Spots LED |
| de | downloads | Das installationsvideo ansehen | Das Installationsvideo ansehen | Installationsvideo(s) |
| nl | carport/productinformatie | Gumax® Glazen schuifwand | Gumax® glazen schuifwand | Gumax® glazen schuifwand |
| nl | carport/productinformatie | Gumax® Steel look glazen schuifwand | Gumax® Steel Look glazen schuifwand | Gumax® Steel Look glazen schuifwand |
| nl | carport/productinformatie | Gumax® Shading panel | Gumax® Shading Panel | Gumax® Shading Panel(s) |
| nl | schuifwand | Gumax® Schuifwanden voor uw overkapping | Gumax® schuifwanden voor uw overkapping | Gumax® schuifwand(en) |
| nl | schuifwand | Gumax® Hor schuifdeur | Gumax® hor schuifdeur | Gumax® hor schuifdeur |
| nl | voordelen-van-een-aluminium-terrasoverkapping | Modern, klassiek, Tijdloos, Authentiek of Eigentijds ontwerp | Modern, Klassiek, Tijdloos, Authentiek of Eigentijds ontwerp | Klassiek |
| nl | zwarte-overkapping | Stijlvol & tijdloos | Stijlvol & Tijdloos | Tijdloos |
| nl | zwarte-overkapping | glazen schuifwanden | Glazen schuifwanden | Glazen schuifwand |
| uk | (uk)glass-sliding-door/assembly | Dimensions glass sliding doors | Dimensions Glass sliding doors | Glass sliding doors |
| uk | (uk)sliding-door | Gumax® Sliding doors for your veranda | Gumax® sliding doors for your veranda | Gumax® sliding doors |
| uk | (uk)sliding-door | Can be combined with Gumax® Shading panel & Steel Look | Can be combined with Gumax® Shading Panel & Steel Look | Gumax® Shading Panel(s) |

## Production is correct - fix the new site

No SQL. A `fixed` event is a claim that someone corrected the page, and nobody has yet.

| store | page | prod (correct) | new (wrong) | term |
| --- | --- | --- | --- | --- |
| be | heavy-duty-terrasoverkapping | Stijl Modern of Klassiek | Stijl modern of klassiek | Klassiek, Modern |
| be | heavy-duty-terrasoverkapping | Gumax® Heavy Duty Modern | Gumax® Heavy Duty modern | Modern |
| be | steel-look-glazen-schuifwand/productinformatie | Gumax® hor schuifdeur | Gumax® Hor schuifdeur | Gumax® hor schuifdeur |
| be_fr | (be_fr)fr/shading-panel/information-produit | Couleurs de base | couleurs de base | Couleurs |
| be_fr | (be_fr)fr/shading-panel/information-produit | Couleurs spéciales | couleurs spéciales | Couleurs |
| be_fr | schuifwand | Toutes les parois coulissantes Gumax® | Toutes les parois coulissantes Gumax | Gumax(R) |
| be_fr | schuifwand | Découvrez les parois latérales Gumax® | Découvrez les parois latérales Gumax | Gumax(R) |
| de | (de)glasschiebewand/montage | Montage Glasschiebewand | Montage glasschiebewand | Glasschiebewand |
| de | (de)haufig-gestellte-fragen | Service & Garantie | Service & garantie | Garantie |
| de | (de)heavy-duty-terrassenueberdachung | Gumax® Heavy Duty Modern | Gumax® Heavy Duty modern | Modern |
| de | (de)shading-panel/produktinformationen | Material: 6063-T6 Aluminium | Material: 6063-T6 aluminium | 6063-T6 Aluminium |
| fr | (fr)shading-panel/information-produit | Couleurs de base | couleurs de base | Couleurs |
| fr | (fr)shading-panel/information-produit | Couleurs spéciales | couleurs spéciales | Couleurs |
| fr | schuifwand | Toutes les parois coulissantes Gumax® | Toutes les parois coulissantes Gumax | Gumax(R) |
| fr | schuifwand | Découvrez les parois latérales Gumax® | Découvrez les parois latérales Gumax | Gumax(R) |
| nl | heavy-duty-terrasoverkapping | Stijl Modern of Klassiek | Stijl modern of klassiek | Klassiek, Modern |
| nl | heavy-duty-terrasoverkapping | Gumax® Heavy Duty Modern | Gumax® Heavy Duty modern | Modern |
| nl | steel-look-glazen-schuifwand/productinformatie | Gumax® hor schuifdeur | Gumax® Hor schuifdeur | Gumax® hor schuifdeur |
| nl | terrasoverkapping/productinformatie | Gumax® goot bladvanger | Gumax® Goot bladvanger | Gumax® goot bladvanger |
| uk | (uk)heavy-duty-veranda | Gumax® Heavy Duty Modern | Gumax® Heavy Duty modern | Modern |
| uk | (uk)shading-panel/product-information | Gumax® glass sliding doors | Gumax® Glass sliding doors | Gumax® glass sliding doors |
| uk | verlichting | Choose your Lighting System > | Choose your lighting system | Lighting System |

## Neither side is correct

Both sides write the brand bare. The word list says `Gumax(R)`.

| store | page | prod | new |
| --- | --- | --- | --- |
| be | garantie | Gumax Vrijstaande overkapping: 10 jaar | Gumax vrijstaande overkapping: 10 jaar |
| be | garantie | Gumax Gevelisolatie-montagesysteem 10 jaar | Gumax Gevelisolatie montagesysteem: 10 jaar |
| be | garantie | Gumax Staande terrasverwarmer: 2 jaar | Gumax staande terrasverwarmer: 2 jaar |
| be_fr | garantie | Paroi latérale en aluminium Gumax : 10 ans | paroir latérale en aluminium Gumax : 10 ans |
| be_fr | garantie | Gumax Lighting System : 2 ans | Lighting System Gumax : 2 ans |
| de | (de)galerie/glasschiebewande | Gumax Glasschiebetür in mattem Anthrazit mit Türgriffen | Gumax Glasschiebetür in mattem Anthrazit mit Türgriffen. |
| de | garantie | Gumax Aluminium-Seitenwand: 10 Jahre | Gumax Dach-upgrade-Paket: 10 Jahre |
| de | garantie | Gumax Fassadendämmung Montagesystem 10 Jahre | Gumax Fassadendämmung Montagesystem: 10 Jahre |
| de | garantie | Gumax Dach-upgrade-paket: 10 Jahre | Gumax Aluminium Seitenwand: 10 Jahre |
| fr | garantie | Gumax Lighting System : 2 ans | Lighting System Gumax : 2 ans |
| nl | glazen-schuifwand/productinformatie | Gumax glazen schuifwanden zijn verkrijgbaar in verschillende hoogte- en breedtematen | Gumax glazen schuifwanden zijn verkrijgbaar in verschillende hoogte- en breedtematen. |

## Touched but not settled - needs a human

A glossary term moved, but the words changed too, so the difference is an editing decision and not a spelling one. `both-valid` means the list holds both names (`Shading Panel` and `Gumax(R) Shading Panel`) and licenses either.

| store | verdict | prod | new |
| --- | --- | --- | --- |
| be | both-valid | Gumax® Steel Look glazen schuifwand | Gumax® Steel Look set |
| be | both-valid | Shading Panel | Gumax® Shading Panel |
| be_fr | both-valid | Portes coulissantes à entraînement Gumax® | Portes coulissante à entraînement Gumax® |
| be_fr | both-valid | Protection solaire Gumax® | Gumax® Protection solaire |
| be_fr | both-valid | Cliquez ici pour obtenir la déclaration de performance (DOP) du Shading Panel Gumax® . | Cliquez ici pour obtenir la déclaration de performance (DOP) du Gumax® Shading Panel. |
| be_fr | both-valid | Portes coulissantes en verre Gumax® | Paroi coulissante en verre Gumax® |
| be_fr | both-valid | Portes coulissantes en verre à aspect acier Gumax® | Paroi coulissante en verre à aspect acier Gumax® |
| de | both-valid | Shading Panel | Gumax® Shading Panel |
| de | both-valid | Gumax® Steel Look Glasschiebewand | Gumax® Steel Look Set |
| de | both-valid | Gumax® Sonnenschutz | Sonnenschutz |
| de | both-valid | Gumax® Shading Panel | Shading Panel |
| de | both-valid | Gumax® Glasschiebewand | Glasschiebewand |
| fr | both-valid | Protection solaire Gumax® | Gumax® Protection solaire |
| fr | both-valid | Portes coulissantes en verre Gumax® | Paroi coulissante en verre Gumax® |
| fr | both-valid | Portes coulissantes en verre à aspect acier Gumax® | Paroi coulissante en verre à aspect acier Gumax® |
| nl | both-valid | Gumax® Steel Look glazen schuifwand | Gumax® Steel Look set |
| nl | both-valid | Zonwering productinformatie | Gumax® zonwering productinformatie |
| nl | both-valid | Shading Panel | Gumax® Shading Panel |
| uk | both-valid | Assembly of Gumax® automatic sun shading | Assembly of the Gumax® sun shading |
| uk | both-valid | Modern sliding glass doors with Gumax® Excellence Superior Coating | Glass sliding doors with Gumax® Excellence Superior Coating |
| be | conflict | Veelgestelde vragen over Gumax® Lighting System | Veelgestelde vragen over zonwering |
| be | neither | Gumax Vrijstaande overkapping: 10 jaar | Gumax vrijstaande overkapping: 10 jaar |
| be | neither | Gumax Gevelisolatie-montagesysteem 10 jaar | Gumax Gevelisolatie montagesysteem: 10 jaar |
| be | neither | Gumax Staande terrasverwarmer: 2 jaar | Gumax staande terrasverwarmer: 2 jaar |
| be_fr | neither | Paroi latérale en aluminium Gumax : 10 ans | paroir latérale en aluminium Gumax : 10 ans |
| be_fr | neither | Gumax Lighting System : 2 ans | Lighting System Gumax : 2 ans |
| de | neither | Gumax Glasschiebetür in mattem Anthrazit mit Türgriffen | Gumax Glasschiebetür in mattem Anthrazit mit Türgriffen. |
| de | neither | Gumax Aluminium-Seitenwand: 10 Jahre | Gumax Dach-upgrade-Paket: 10 Jahre |
| de | neither | Gumax Fassadendämmung Montagesystem 10 Jahre | Gumax Fassadendämmung Montagesystem: 10 Jahre |
| de | neither | Gumax Dach-upgrade-paket: 10 Jahre | Gumax Aluminium Seitenwand: 10 Jahre |
| fr | neither | Gumax Lighting System : 2 ans | Lighting System Gumax : 2 ans |
| nl | neither | Gumax glazen schuifwanden zijn verkrijgbaar in verschillende hoogte- en breedtematen | Gumax glazen schuifwanden zijn verkrijgbaar in verschillende hoogte- en breedtematen. |
| be | new | Gumax glazen schuifwanden zijn verkrijgbaar in verschillende hoogte- en breedtematen | Gumax® glazen schuifwanden zijn verkrijgbaar in verschillende hoogte- en breedtematen. |
| be | new | Met het Gumax® Lighting System heeft u altijd de passende sfeer onder uw terrasoverkapping | Kies voor elke gelegenheid met slechts één druk op de knop een bijpassende kleur. Elk lich |
| be | new | Bekijk terrasoverkappingen | Terrasoverkappingen |
| be | new | Bekijk glazen schuifwanden | Glazen schuifwanden |
| be | new | De outdoor shutters voor uw overkapping | Gumax Shading Panel - de outdoor shutters voor uw overkapping |
| be | new | Passen onder vrijwel iedere overkapping | Shading Panels passen onder vrijwel iedere overkapping |
| be | new | Montagevideo Heavy Duty -Vrijstaand | Montagevideo Heavy Duty - Vrijstaand |
| be_fr | new | Profiter le plus rapidement possible de votre pièce de jardin ? Lorsque vous venez cherche | Profiter le plus rapidement possible de votre pièce de jardin ? Lorsque vous venez cherche |
| be_fr | new | Mat anthracite (RAL 7016) | Anthracite mat (RAL 7016) |
| be_fr | new | Mat blanc (RAL 9016) | Blanc mat (RAL 9016) |
| be_fr | new | Mat noir (RAL 9005) | Noir mat (RAL 9005) |
| be_fr | new | Clavette Gumax® | Clavette en verre Gumax® |
| be_fr | new | Les volets extérieurs pour votre véranda | Shading Panel Gumax® - Les volets extérieurs pour votre véranda |
| be_fr | new | Gumax aspect acier pour portes coulissantes : 2 ans | Kit aspect acier pour paroi coulissante en verre : 2 ans |
| de | new | Gumax® Heavy Duty Authtentisch | Gumax® Heavy Duty Authentisch |
| de | new | Die Außenlamellen für Ihre Überdachung | Gumax Shading Panel - Die Außenlamellen für Ihre Überdachung |
| de | new | Ihr vertrauenswürdiger Partner für Terrassenüberdachungen und Glasschiebewände | Ihr Partner für Überdachungen und Schiebewände |
| de | new | Sortiment ansehen | Lose Teile Lose Teile Sortiment ansehen |
| de | new | Glass Line & Poly Line | Gumax® Poly & Glass Line Terrassenüberdachung (Breite ab 7,06m) |
| de | new | Gumax Fliegengitter Schiebetür: 5 Jahre | Gumax Fliegengitter-Schiebetür: 5 Jahre |
| de | new | Mit dem Gumax® Lighting System haben Sie immer die richtige Atmosphäre unter Ihrer Terrass | Jedes Lichtelement ist individuell einstellbar, je nach Ihren persönlichen Vorlieben. Auf  |
| de | new | Anleitung ansehen > | Anleitung Fernbedienung ansehen |
| fr | new | Clavette Gumax® | Clavette en verre Gumax® |
| fr | new | Les volets extérieurs pour votre véranda | Shading Panel Gumax® - Les volets extérieurs pour votre véranda |
| fr | new | Gumax aspect acier pour portes coulissantes : 2 ans | Kit aspect acier pour paroi coulissante en verre : 2 ans |
| nl | new | Met het Gumax® Lighting System heeft u altijd de passende sfeer onder uw terrasoverkapping | Kies voor elke gelegenheid met slechts één druk op de knop een bijpassende kleur. Elk lich |
| nl | new | De outdoor shutters voor uw overkapping | Gumax Shading Panel - de outdoor shutters voor uw overkapping |
| nl | new | Passen onder vrijwel iedere overkapping | Shading Panels passen onder vrijwel iedere overkapping |
| nl | new | Montagevideo Heavy Duty -Vrijstaand | Montagevideo Heavy Duty - Vrijstaand |
| uk | new | Connecting sliding doors with Gumax ® door followers | Connecting sliding doors with Gumax® door followers |
| uk | new | Expansions | Veranda expansions |
| uk | new | Veranda photo gallery | Photo gallery |
| uk | new | The outdoor shutters for your veranda | Gumax Shading Panel - The outdoor shutters for your veranda |
| uk | new | Gumax® glass sliding door | Gumax® glass sliding doors |
| uk | new | Glass Line & Poly Line | Gumax® Poly & Glass Line Verandas (width from 7.06m) |
| be_fr | production | Couleurs des lames : | Couleur des lames: |
| be_fr | production | Glass Line & Poly Line | Gumax® Poly & Glass Line Verandas (largeur jusqu'à 6,06m) |
| be_fr | production | Anthracite mat (RAL 7016) | Mat antraciet (RAL 7016) |
| be_fr | production | Blanc mat (RAL 9016) | Mat wit (RAL 9016) |
| be_fr | production | Noir mat (RAL 9005) | Mat zwart (RAL 9005) |
| be_fr | production | Vérandas Gumax® Poly Line | Gumax® Poly Line terrasoverkappingen |
| be_fr | production | Vérandas Gumax® Glass Line | Gumax® Glass Line terrasoverkappingen |
| be_fr | production | Vérandas Gumax® Heavy Duty | Gumax® Heavy Duty terrasoverkappingen |
| be_fr | production | Vérandas Gumax : 10 ans | Verandas Gumax : 10 ans |
| de | production | Montage von Glasschiebewänden unter einer bestehenden Terrassenüberdachung | Montage von Glasschiebewänden unter einer bestehenden Überdachung |
| de | production | Farben Heavy Duty - Am Haus | Heavy Duty - Am Haus |
| de | production | Montage von Gumax® automatischem Sonnenschutz | Montage von Gumax® Automatischer Sonnenschutz |
| de | production | Eine Terrassenüberdachung an Ihrem Haus, inklusive Montage | Einem Vordach an Ihrem Haus, inklusive Montage |
| de | production | Mit der mitgelieferten Fernbedienung können Sie ganz einfach die für den jeweiligen Moment | Mit der mitgelieferten Fernbedienung können Sie ganz einfach die für den jeweiligen Moment |
| fr | production | Couleurs des lames : | Couleur des lames: |
| fr | production | Glass Line & Poly Line | Gumax® Poly & Glass Line Verandas (largeur jusqu'à 6,06m) |
| fr | production | Anthracite mat (RAL 7016) | Mat antraciet (RAL 7016) |
| fr | production | Blanc mat (RAL 9016) | Mat wit (RAL 9016) |
| fr | production | Noir mat (RAL 9005) | Mat zwart (RAL 9005) |
| fr | production | Vérandas Gumax® Poly Line | Gumax® Poly Line terrasoverkappingen |
| fr | production | Vérandas Gumax® Glass Line | Gumax® Glass Line terrasoverkappingen |
| fr | production | Vérandas Gumax® Heavy Duty | Gumax® Heavy Duty terrasoverkappingen |
| fr | production | Vérandas Gumax : 10 ans | Verandas Gumax : 10 ans |
| uk | production | Colours: | Available colours: |
| uk | production | Remote control manual > | Manual remote control |
| uk | production | Polycarbonate | Opal Polycarbonate |
