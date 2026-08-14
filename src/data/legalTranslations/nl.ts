import type { LegalDocument } from '../legalContent';

/**
 * Nederlandse versie van de juridische teksten.
 *
 * Twee bewuste vertaalkeuzes:
 *
 * 1. De plaatshouders [DENOMINAZIONE SOCIALE DA COMPLETARE],
 *    [INDIRIZZO SEDE LEGALE] en [PARTITA IVA] blijven in de Italiaanse
 *    vorm staan — identiek in alle taalversies. Zo volstaat later één enkele
 *    zoek-en-vervangactie over alle acht bestanden, in plaats van acht
 *    afzonderlijke wijzigingen met het risico er één te vergeten.
 *
 * 2. Verwijzingen naar Italiaans recht (consumentenwetboek, burgerlijk
 *    wetboek, rechtbank van Cassino) worden NIET vervangen door Nederlandse
 *    equivalenten, maar uitdrukkelijk als Italiaans recht aangeduid. Op de
 *    overeenkomst is Italiaans recht van toepassing (punt 11); ze omzetten
 *    naar Nederlands recht zou inhoudelijk onjuist zijn en verkeerde
 *    verwachtingen wekken.
 */

const TERMINI_SERVIZIO_NL: LegalDocument = {
  title: "Servicevoorwaarden",
  lastUpdated: "Augustus 2026",
  sections: [
    {
      heading: "1. Wie wij zijn en wat deze voorwaarden regelen",
      paragraphs: [
        "Oralzon is een online bemiddelingsdienst die leveranciers van tandheelkundige producten (**verkopers**) in contact brengt met professionele partijen in de sector (**kopers**). Oralzon verkoopt via de bemiddelingsdienst geen eigen producten aan kopers: elke koopovereenkomst komt rechtstreeks tot stand tussen de verkoper en de koper.",
        "De exploitant van het platform is **[DENOMINAZIONE SOCIALE DA COMPLETARE]**, gevestigd te **[INDIRIZZO SEDE LEGALE]**, btw-nummer **[PARTITA IVA]**, bereikbaar via support@oralzon.com.",
        "Door het platform te gebruiken aanvaardt u deze Voorwaarden. Aanvaardt u ze niet, dan mag u het platform niet gebruiken. De Verkoopvoorwaarden, het Privacybeleid en het Cookiebeleid maken er integraal deel van uit."
      ],
    },
    {
      heading: "2. Wie Oralzon mag gebruiken",
      paragraphs: [
        "Oralzon is voorbehouden aan partijen die handelen in de uitoefening van hun beroeps- of bedrijfsactiviteit en beschikken over een geldig btw-nummer. Het platform richt zich niet op consumenten: bijgevolg **zijn de beschermingsbepalingen van het Italiaanse consumentenwetboek niet van toepassing** (D.Lgs. 206/2005), aangezien deze uitsluitend gelden voor natuurlijke personen die handelen voor doeleinden buiten hun activiteit.",
        "Verkopers moeten gevestigd zijn in een van de 27 lidstaten van de Europese Unie. Dit vereiste vloeit voort uit de btw-regels inzake de veronderstelde leverancier (art. 14 bis van Richtlijn 2006/112/EG) en er kan niet van worden afgeweken.",
        "U bent verantwoordelijk voor de juistheid van de verstrekte gegevens, voor het beheer van uw inloggegevens en voor alles wat via uw account gebeurt."
      ],
    },
    {
      heading: "3. Wijzigingen van deze voorwaarden",
      paragraphs: [
        "Wij kunnen deze Voorwaarden wijzigen. Wijzigingen worden per e-mail aan de verkopers meegedeeld en **ten minste 15 dagen vóór** de inwerkingtreding op het platform gepubliceerd, zoals bepaald in art. 3 van Verordening (EU) 2019/1150. Vereist de wijziging aanzienlijke technische of commerciële aanpassingen, dan is de opzegtermijn evenredig langer.",
        "Tijdens de opzegtermijn kan de verkoper kosteloos opzeggen. Het plaatsen van nieuwe producten of het uitblijven van een opzegging binnen de termijn geldt als aanvaarding.",
        "De opzegtermijn geldt niet wanneer de wijziging wordt opgelegd door een wettelijke verplichting of dient om een dreigend gevaar voor de veiligheid van het platform of zijn gebruikers af te wenden."
      ],
    },
    {
      heading: "4. Hoe producten worden gerangschikt (ranking)",
      paragraphs: [
        "Ter uitvoering van art. 5 van Verordening (EU) 2019/1150 vermelden wij de belangrijkste parameters die de positie van producten in de zoekresultaten en in de onderdelen van het platform bepalen, alsook hun relatieve gewicht."
      ],
      bullets: [
        "**Overeenkomst met de zoekopdracht** — de doorslaggevende parameter: de tekstzoekopdracht vergelijkt de ingevoerde term met naam, merk en artikelnummer van het product",
        "**Door de koper gekozen filters en sortering** — sorteert de koper op prijs of datum, dan gaat die keuze vóór elke andere parameter, inclusief betaalde posities",
        "**Beschikbaarheid en status van het product** — niet-gepubliceerde producten of producten van geschorste verkopers verschijnen niet",
        "**Betaalde positionering** — verkopers kunnen zichtbaarheidspakketten aanschaffen (uitgelichte producten, plaatsen op de homepage, plaatsen per categorie, contextuele kaarten). Deze inhoud is **altijd aangeduid als „Gesponsord”** en de positie ervan hangt uitsluitend af van de aankoop van het pakket, niet van een kwaliteitsoordeel over het product. Is een betaalde plaats beschikbaar maar door geen enkele verkoper gekocht, dan tonen wij een niet-gesponsord product met de neutrale aanduiding „Uitgelicht”, zonder er een niet-bestaande sponsoring aan toe te schrijven",
        "**Aankoop- en navigatiegeschiedenis van de koper** — gebruikt om relevante producten voor te stellen, met gegevens die uitsluitend op dit platform zijn verzameld. Het heeft geen invloed op prijzen of voorwaarden en gaat nooit vóór de uitdrukkelijke keuzes van de koper of vóór betaalde plaatsen",
        "**Gerealiseerde verkopen en ontvangen beoordelingen** — in de onderdelen voor best verkochte producten"
      ],
    },
    {
      heading: "5. Verplichtingen van verkopers",
      bullets: [
        "Rechtsgeldig opgerichte rechtssubjecten zijn, met een geldig btw-nummer in een lidstaat van de Europese Unie",
        "Volledige, juiste en niet-misleidende productinformatie publiceren, met inbegrip van de wettelijk verplichte vermeldingen",
        "Waarborgen dat producten die als medisch hulpmiddel zijn geclassificeerd voldoen aan Verordening (EU) 2017/745 (MDR) en aan alle andere toepasselijke regelgeving",
        "Voorraadgegevens actueel houden en ontvangen bestellingen binnen de opgegeven termijnen uitvoeren",
        "De verzending van de eigen producten regelen en de trackinggegevens invoeren",
        "Gegevens van kopers uitsluitend gebruiken om de bestelling uit te voeren, met inachtneming van de AVG",
        "**Kopers niet van het platform wegleiden**: het is verboden directe contactgegevens (e-mail, telefoon, berichtendiensten, sites van derden) op te nemen in productpagina's, antwoorden op vragen, beoordelingen, afbeeldingen of bij zendingen gevoegd materiaal, met het doel om op Oralzon ontstane verkopen buiten het platform af te ronden",
        "Alle fiscale verplichtingen zelf nakomen, met inbegrip van de opgaven van intracommunautaire leveringen (Intrastat) waar verschuldigd: Oralzon dient deze niet in namens de verkoper"
      ],
    },
    {
      heading: "6. Beperking, opschorting en beëindiging van de dienst",
      paragraphs: [
        "Ter uitvoering van art. 4 van Verordening (EU) 2019/1150 delen wij een verkoper wiens diensten wij beperken of opschorten **de specifieke redenen** voor de beslissing mee, op een duurzame gegevensdrager, uiterlijk op het moment waarop de maatregel van kracht wordt.",
        "Besluiten wij de dienstverlening volledig te staken, dan bedraagt de opzegtermijn **ten minste 30 dagen**, tenzij er sprake is van een wettelijke verplichting, een ernstige en herhaalde schending van deze Voorwaarden, of een concreet risico voor de veiligheid van gebruikers of de integriteit van de dienst.",
        "De verkoper kan de beslissing aanvechten via de klachtenprocedure van punt 7. Wordt het bezwaar toegekend, dan wordt de maatregel zonder onnodige vertraging ingetrokken.",
        "Het aflopen van de proefperiode of van het verkopersplan, wanneer dit niet wordt verlengd, is geen sanctie: het wordt geregeld door de Verkoopvoorwaarden en gaat vergezeld van de daartoe strekkende meldingen.",
        "**Bestellingen die vóór een opschorting zijn ontvangen blijven geldig** en moeten worden uitgevoerd. De bijbehorende bedragen worden onder de gewone voorwaarden uitbetaald."
      ],
    },
    {
      heading: "7. Klachten en geschillenbeslechting",
      paragraphs: [
        "Elke verkoper kan een klacht indienen door te schrijven naar **support@oralzon.com**, met vermelding van het onderwerp van het bezwaar. Wij behandelen klachten binnen redelijke termijnen die in verhouding staan tot de complexiteit ervan, en delen de uitkomst individueel en in duidelijke taal mee.",
        "De exploitant van het platform is momenteel een kleine onderneming in de zin van art. 11, lid 5, van Verordening (EU) 2019/1150 en is dus niet verplicht een geformaliseerd intern klachtenafhandelingssysteem op te zetten. Wij handhaven niettemin de hierboven beschreven procedure.",
        "Komt geen overeenstemming tot stand, dan kunnen partijen zich buitengerechtelijk wenden tot een bemiddelingsinstantie die is ingeschreven in het register van het Italiaanse ministerie van Justitie en bevoegd is in handelszaken. Het beroep op bemiddeling laat het recht om zich tot de rechter te wenden onverlet.",
        "De rechten die art. 14 van diezelfde Verordening toekent aan representatieve organisaties van verkopers blijven onverlet."
      ],
    },
    {
      heading: "8. Toegang tot gegevens",
      paragraphs: [
        "De verkoper heeft via zijn beveiligde omgeving toegang tot de door zijn activiteit gegenereerde gegevens: ontvangen bestellingen, verkochte producten, omzet, beoordelingen, vragen van klanten, overboekingen en fiscale overzichten.",
        "Wij delen het e-mailadres en telefoonnummer van kopers niet met verkopers. Zij ontvangen wel naam, afleveradres en factuurgegevens, die nodig zijn om te leveren en te factureren. Deze keuze beschermt kopers tegen ongevraagde benadering en houdt de uitwisselingen traceerbaar bij een geschil.",
        "Wij dragen de op het platform gegenereerde geaggregeerde gegevens niet over aan derden voor hun eigen commerciële doeleinden."
      ],
    },
    {
      heading: "9. Intellectuele eigendom en inhoud",
      paragraphs: [
        "De verkoper behoudt alle rechten op de inhoud die hij publiceert en garandeert daartoe gerechtigd te zijn. Hij verleent Oralzon een niet-exclusieve, kosteloze licentie om die te publiceren, automatisch te vertalen naar de talen van het platform en te gebruiken ter promotie van de catalogus, beperkt tot de duur van de relatie.",
        "Merken, interfaces, redactionele teksten en software van het platform behoren toe aan de exploitant en mogen niet zonder toestemming worden verveelvoudigd.",
        "Wij verwijderen inhoud die onrechtmatig of misleidend is of in strijd is met deze Voorwaarden, en informeren de auteur onder vermelding van de redenen."
      ],
    },
    {
      heading: "10. Aansprakelijkheid",
      paragraphs: [
        "Oralzon staat in voor de werking van het technologische platform en voor de juistheid van de informatie die zij zelf verstrekt. Zij is geen partij bij de koopovereenkomst en is niet aansprakelijk voor de kwaliteit, conformiteit of veiligheid van de producten, voor het gedrag van verkopers of voor levertijden; dat blijft uitsluitend voor rekening van de verkoper.",
        "Behoudens opzet of grove schuld, en behoudens letselschade, is de totale aansprakelijkheid van Oralzon jegens een verkoper beperkt tot wat deze in de twaalf maanden vóór het voorval aan het platform heeft betaald. Jegens een koper is zij beperkt tot het bedrag van de bestelling waarop het bezwaar betrekking heeft.",
        "Geen enkele bepaling van deze Voorwaarden sluit aansprakelijkheid uit of beperkt deze voor zover het toepasselijke recht dat niet toestaat."
      ],
    },
    {
      heading: "11. Toepasselijk recht en bevoegde rechter",
      paragraphs: [
        "Op deze Voorwaarden is Italiaans recht van toepassing.",
        "Voor elk geschil is uitsluitend de rechtbank van Cassino (Italië) bevoegd. Aangezien het om relaties tussen professionele partijen gaat, erkennen partijen dat deze bevoegdheidstoewijzing schriftelijk is overeengekomen in de zin van art. 25 van Verordening (EU) 1215/2012.",
        "Bij verschillen tussen de taalversies is de Italiaanse versie van deze Voorwaarden bepalend."
      ],
    },
  ],
};

const CONDIZIONI_VENDITA_NL: LegalDocument = {
  title: "Verkoopvoorwaarden",
  lastUpdated: "Augustus 2026",
  sections: [
    {
      heading: "1. Toepassingsgebied",
      paragraphs: [
        "Deze Voorwaarden regelen aankopen die via Oralzon worden gedaan door professionele partijen in de tandheelkundige sector. De producten worden verkocht door de ingeschreven leveranciers (verkopers): de overeenkomst komt tot stand tussen verkoper en koper, terwijl Oralzon optreedt als technologische tussenpersoon en incassogemachtigde.",
        "Aangezien de koper steeds handelt in de uitoefening van zijn activiteit, **zijn de beschermingsbepalingen van het Italiaanse consumentenwetboek niet van toepassing** (D.Lgs. 206/2005), die aan consumenten zijn voorbehouden."
      ],
    },
    {
      heading: "2. Bestellingen en bevestiging",
      paragraphs: [
        "De bestelling komt tot stand wanneer de betaling wordt bevestigd. De koper ontvangt onmiddellijk een e-mail met het bestelnummer en het overzicht, die geldt als aanvaarding van het aanbod van de verkoper.",
        "Gestarte en niet afgeronde betalingen leiden niet tot een bestelling en worden na 24 uur automatisch geannuleerd.",
        "De beschikbaarheid van producten wordt op het moment van bestellen gecontroleerd. Blijkt een artikel door gelijktijdige aankopen na bevestiging toch niet beschikbaar, dan meldt de verkoper dit en wordt het niet-leverbare deel terugbetaald."
      ],
    },
    {
      heading: "3. Prijzen, btw en betaling",
      bullets: [
        "De prijzen luiden in euro. Bij binnenlandse verkopen zijn ze inclusief btw tegen het in het land van de verkoper geldende tarief",
        "Bij verkopen tussen een verkoper en een koper die in twee verschillende lidstaten van de Europese Unie zijn gevestigd en beiden over een in het VIES-systeem geverifieerd btw-nummer beschikken, geldt de verleggingsregeling: de tegenprestatie omvat geen btw en de koper draagt de belasting af in zijn eigen land, zoals op de factuur vermeld",
        "Levert de VIES-controle voor een van beide partijen geen positief resultaat op, dan geldt de btw van het land van de verkoper",
        "De betaling gebeurt met krediet- of debetkaart en wordt verwerkt door Stripe. Oralzon verwerkt noch bewaart kaartgegevens",
        "Het bedrag is volledig verschuldigd op het moment van bestellen",
        "De factuur wordt uitgereikt door de verkoper, de enige daartoe gehouden partij: Oralzon levert de nodige gegevens aan maar factureert niet namens hem"
      ],
    },
    {
      heading: "4. Commissie en verkopersplan",
      paragraphs: [
        "Over elke gesloten verkoop houdt Oralzon een commissie in van **7 % van de waarde van de goederen** (grondslag, exclusief btw), die in mindering wordt gebracht op het aan de verkoper uitbetaalde bedrag. De commissie dekt de kosten van de betalingsverwerking en de diensten van het platform.",
        "**Over verzendkosten wordt geen commissie geheven**, aangezien deze geen opbrengst van het platform vormen.",
        "Toegang tot het platform vereist bovendien een jaarlijks verkopersplan, tegen de voorwaarden die bij het afsluiten op de betreffende pagina zijn vermeld. Na afloop van de gratis proefperiode leidt het ontbreken van een abonnement tot opschorting van de verkopen, voorafgegaan door e-mailmeldingen vóór de vervaldatum en in de dagen daarna. Catalogus, bestellingen en statistieken blijven gearchiveerd en zijn bij activering van het plan weer beschikbaar.",
        "Eventuele wijzigingen van het commissiepercentage worden per e-mail meegedeeld met een opzegtermijn van minimaal 30 dagen en gelden niet voor reeds ontvangen bestellingen."
      ],
    },
    {
      heading: "5. Verzendingen",
      paragraphs: [
        "Elke verkoper verzendt zijn producten zelf. Bij bestellingen waarbij meerdere leveranciers betrokken zijn, reizen de producten afzonderlijk, met per verkoper afzonderlijke kosten en tracking.",
        "De verzendkosten worden door de verkoper per bestemmingszone bepaald en vóór de betaling aan de koper getoond, uitgesplitst per leverancier. De verkoper kan een bestelbedrag vaststellen waarboven verzending gratis is: in dat geval blijven de transportkosten voor zijn rekening.",
        "De op de productpagina's vermelde levertijden zijn schattingen en niet bindend. Oralzon verzendt uitsluitend binnen de Europese Unie.",
        "De koper ontvangt bij verzending per e-mail het trackingnummer en wordt uitgenodigd de ontvangst te bevestigen in het onderdeel bestellingen. Blijft bevestiging uit, dan wordt de levering geacht te hebben plaatsgevonden na 7 dagen vanaf verzending bij binnenlandse zendingen en 15 dagen bij intracommunautaire zendingen."
      ],
    },
    {
      heading: "6. Uitbetaling aan de verkoper",
      paragraphs: [
        "De geïnde bedragen blijven bij Oralzon tot de bevestiging van levering, handmatig of automatisch volgens de bepalingen van punt 5. Pas dan wordt het nettobedrag aan de verkoper uitbetaald op de gekoppelde rekening.",
        "Deze werkwijze beschermt beide partijen: zij maakt het mogelijk een retour of een bezwaar af te handelen voordat de bedragen zijn overgemaakt, en verzekert de verkoper van een automatische uitbetaling zonder te hoeven rappelleren.",
        "Een openstaand retourverzoek schort de uitbetaling voor het betrokken artikel op tot het dossier is afgehandeld.",
        "Om uitbetalingen te ontvangen moet de verkoper de door de betaaldienstverlener vereiste identiteitsverificatie voltooien. Tot dan blijven de bedragen gereserveerd en gaan ze niet verloren."
      ],
    },
    {
      heading: "7. Retouren en terugbetalingen",
      paragraphs: [
        "Aangezien het om verkopen tussen professionele partijen gaat, **bestaat er geen wettelijk herroepingsrecht**. Oralzon erkent evenwel, als eigen commercieel beleid, de mogelijkheid om binnen **30 dagen** na levering een retour aan te vragen, onder de hierna volgende voorwaarden.",
        "Het verzoek wordt geopend via het onderdeel „Mijn bestellingen” en kan ook slechts een deel van de gekochte hoeveelheden betreffen. De verkoper beoordeelt het en kan het toewijzen of gemotiveerd afwijzen.",
        "De producten moeten onbeschadigd worden geretourneerd, in de ongeopende originele verpakking en compleet met alle onderdelen. **Uitgesloten van retour** zijn hulpmiddelen voor eenmalig gebruik met geopende of beschadigde steriele verpakking, op maat gemaakte producten, snel bederfelijke producten en producten waarvan de veiligheid na opening niet meer verifieerbaar is.",
        "Tenzij anders overeengekomen komen de retourkosten voor rekening van de koper. Zij komen daarentegen voor rekening van de verkoper wanneer het product gebrekkig is, niet aan de bestelling beantwoordt of tijdens het transport is beschadigd.",
        "De terugbetaling wordt berekend over de daadwerkelijk betaalde prijs van de geretourneerde artikelen en gebeurt via hetzelfde betaalmiddel binnen 14 dagen na aanvaarding van het retour. De verkoper kan een gemotiveerd deel inhouden wegens waardevermindering die niet voortvloeit uit het controleren van het product.",
        "Dit beleid laat de garantierechten wegens gebreken van de verkochte zaak, voorzien in het Italiaanse burgerlijk wetboek, onverlet."
      ],
    },
    {
      heading: "8. Garantie en conformiteit van de producten",
      paragraphs: [
        "De verkoper garandeert, onder zijn uitsluitende verantwoordelijkheid, dat de gepubliceerde producten voldoen aan de toepasselijke regelgeving, waaronder Verordening (EU) 2017/745 betreffende medische hulpmiddelen, en dat hij over de nodige titels beschikt om ze te verhandelen.",
        "Oralzon verifieert de bij de registratie verstrekte identificatie- en fiscale gegevens, maar onderzoekt noch certificeert de conformiteit van de afzonderlijke producten, die volledig ten laste van de verkoper blijft.",
        "Op de verkoop is de wettelijke vrijwaring voor gebreken van toepassing zoals voorzien in art. 1490 e.v. van het Italiaanse burgerlijk wetboek, in de verhouding tussen verkoper en koper."
      ],
    },
    {
      heading: "9. Beoordelingen en vragen",
      paragraphs: [
        "Alleen kopers die het product daadwerkelijk hebben gekocht kunnen een beoordeling achterlaten: de controle is automatisch en niet te omzeilen.",
        "Beoordelingen en vragen zijn openbaar en vermelden de naam van de auteur. Het is niet toegestaan daarin directe contactgegevens op te nemen, noch lasterlijke, onrechtmatige of niet aan het product gerelateerde inhoud.",
        "Wij verwijderen negatieve beoordelingen niet op verzoek van de verkoper, die wel openbaar kan reageren. Inhoud die deze regels schendt verwijderen wij, met bericht aan de auteur."
      ],
    },
    {
      heading: "10. Toepasselijk recht en bevoegde rechter",
      paragraphs: [
        "Op deze Voorwaarden is Italiaans recht van toepassing. Voor elk geschil is uitsluitend de rechtbank van Cassino (Italië) bevoegd, op grond van art. 25 van Verordening (EU) 1215/2012, aangezien het om relaties tussen professionele partijen gaat.",
        "Bij verschillen met de vertalingen is de Italiaanse versie bepalend."
      ],
    },
    {
      heading: "11. Contact",
      paragraphs: [
        "Voor alle informatie over deze Voorwaarden: **support@oralzon.com**"
      ],
    },
  ],
};

export const NL_LEGAL: { termini: LegalDocument; condizioni: LegalDocument } = {
  termini: TERMINI_SERVIZIO_NL,
  condizioni: CONDIZIONI_VENDITA_NL,
};
