import type { AcademyGuideSection } from '../academyGuides';
import type { AcademyGuideTranslation } from './en';

export const NL_ACADEMY_TRANSLATIONS: Record<string, AcademyGuideTranslation> = {
  "come-iniziare-su-oralzon": {
    title: "Aan de slag met Oralzon",
    description: "Het essentiële traject van de eerste dagen: wat u moet afronden voordat u echt opengaat voor het publiek, en in welke volgorde.",
    sections: [
      {
        heading: "Eerst het winkelprofiel",
        paragraphs: [
          "Voordat u producten uploadt, loont het de moeite om het profiel in Instellingen volledig te maken: winkelnaam, telefoonnummer, website (indien u die heeft), en de fiscale gegevens (btw-nummer, PEC of SDI-code) die nodig zijn voor facturering. Er is geen logo of beschrijving om te uploaden — op Oralzon bestaat de identiteit van een verkoper uit de winkelnaam plus het eventuele geverifieerde-verkoper-label, geen afbeelding."
        ],
      },
      {
        heading: "Stripe koppelen voordat u producten publiceert",
        paragraphs: [
          "De gekoppelde Stripe-account is degene die de betalingen voor verkopen daadwerkelijk ontvangt — zonder deze koppeling kan een product wel gepubliceerd en zelfs gekocht worden, maar blijven de gelden bij Oralzon in de wacht totdat de koppeling is voltooid. De pagina Betalingen toont altijd de actuele koppelingsstatus, en een banner bovenaan het paneel herinnert eraan zolang deze niet actief is."
        ],
      },
      {
        heading: "De eerste producten: kwaliteit boven kwantiteit",
        paragraphs: [
          "Beter 10-15 producten met volledige vermeldingen (meerdere foto's, uitgebreide beschrijving, juiste categorie) dan 50 minimale vermeldingen. Onvolledige vermeldingen scoren slechter in de interne zoekfunctie en converteren minder — een klant die een specifiek instrument zoekt en een vage beschrijving aantreft, gaat bijna altijd verder naar het volgende resultaat.",
          "Importeren vanuit Excel (sectie Import Excel) is handig wanneer u vertrekt vanuit een catalogus die al in een spreadsheet bestaat, maar het loont toch de moeite om de eerste geïmporteerde vermeldingen handmatig te controleren voordat u ze publiceert: vooral de fotokwaliteit kan niet worden geautomatiseerd."
        ],
      },
      {
        heading: "Wat er in de eerste 6 maanden gebeurt",
        paragraphs: [
          "De gratis proefperiode duurt 180 dagen vanaf de registratie — gedurende deze periode betaalt u geen abonnementskosten voor het verkopersplan, maar de commissie op verkopen is al vanaf de eerste bestelling actief. Het loont de moeite deze maanden te gebruiken om te testen wat werkt (categorieën, prijzen, sponsoring) voordat de abonnementskosten ingaan."
        ],
      },
    ],
  },
  "migliorare-le-vendite": {
    title: "Verkopen verbeteren: wat de cijfers echt beweegt",
    description: "De hefbomen met een reëel effect op de verkoop, in volgorde van praktische prioriteit — niet alles is dezelfde inspanning waard.",
    sections: [
      {
        heading: "Foto's tellen meer dan de beschrijving",
        paragraphs: [
          "Op een B2B-marktplaats is de verleiding groot om zeer lange technische beschrijvingen te schrijven en de foto's te verwaarlozen, ervan uitgaande dat kopers al weten wat ze zoeken. In de praktijk gebeurt het tegenovergestelde: foto's zijn het eerste filter waarmee een koper een product afwijst of overweegt, de beschrijving komt pas daarna aan bod. Scherpe foto's op een neutrale achtergrond, die het product vanuit meerdere hoeken tonen, maken een meetbaar verschil in het conversiepercentage."
        ],
      },
      {
        heading: "Prijs is niet de enige concurrentiehefboom",
        paragraphs: [
          "Op een marktplaats met meerdere verkopers in dezelfde productcategorie is de verleiding groot om alleen te concurreren op de laagste prijs — maar eerlijk vermelde levertijden, een volledige productvermelding en positieve beoordelingen die in de loop van de tijd zijn opgebouwd, wegen voor een professionele koper die de betrouwbaarheid van de leverancier beoordeelt, niet alleen de kosten van de bestelling, even zwaar of zwaarder dan de prijs."
        ],
      },
      {
        heading: "Reageren op beoordelingen, ook op negatieve",
        paragraphs: [
          "Vanuit de sectie Beoordelingen kunt u publiekelijk reageren op elke beoordeling — uw reactie blijft zichtbaar onder die van de klant. Een negatieve beoordeling zonder reactie weegt zwaarder dan de beoordeling zelf: het communiceert dat het probleem niet is aangepakt. Een openbare reactie, ook al is die kort, die het probleem erkent en uitlegt wat eraan is gedaan, herstelt het grootste deel van het verloren vertrouwen."
        ],
      },
      {
        heading: "Sponsoring werkt het beste bij al bewezen producten",
        paragraphs: [
          "Een product sponsoren dat nog niets heeft verkocht, om te testen of het werkt, is bijna altijd minder efficiënt dan een product sponsoren dat al organisch goed verkoopt — sponsoring versterkt de zichtbaarheid, het compenseert geen zwakke vermelding of een prijs die niet marktconform is. Het loont de moeite om de statistieken te bekijken voordat u kiest wat u sponsort, niet daarna."
        ],
      },
    ],
  },
  "fatturazione-e-dati-fiscali": {
    title: "Facturering: wat Oralzon doet en wat bij de verkoper blijft",
    description: "Hoe de btw-berekening per regel echt werkt, wat u vindt in het verkooprapport, en wat u zelf nog moet doen.",
    sections: [
      {
        heading: "Oralzon stelt geen facturen op namens u",
        paragraphs: [
          "Een belangrijk punt dat u vanaf het begin duidelijk moet hebben: Oralzon is niet verantwoordelijk voor het opstellen van de daadwerkelijke fiscale facturen. Elke verkoper blijft een zelfstandig fiscaal subject en moet voor elke bestelling zijn eigen elektronische facturen opstellen (of laten opstellen door zijn boekhouder). Wat Oralzon biedt, in de sectie Verkooprapport → Gegevens voor facturering, is de al kant-en-klare berekening — belastbaar bedrag, tarief, btw, eventuele vrijstellingsreden — zodat u dit niet handmatig hoeft over te doen."
        ],
      },
      {
        heading: "Hoe de btw bij elke bestelling wordt berekend",
        paragraphs: [
          "De berekening volgt de standaard EU-regel voor B2B-goederenleveringen: binnenlandse verkoop (zelfde land van verkoper en klant) past het volledige btw-tarief van het land van de verkoper toe; intracommunautaire verkoop met beide partijen geverifieerd via VIES past de verleggingsregeling toe (btw op nul, de klant voldoet de belasting zelf); intracommunautaire verkoop zonder VIES-verificatie past voor de zekerheid toch het volledige btw-tarief toe; verkoop buiten de EU is vrijgesteld als uitvoer.",
          "Deze berekening gebeurt automatisch voor elke bestelregel, op het moment van aankoop — er hoeft niets geconfigureerd te worden om dit te laten werken."
        ],
      },
      {
        heading: "Gegevens exporteren voor uw boekhouder",
        paragraphs: [
          "De knop CSV exporteren in de sectie Gegevens voor facturering genereert een bestand met één regel per product per bestelling — het detailniveau dat werkelijk nodig is om een factuur op te stellen, geen maandelijkse samenvatting. Het is het handigste bestand om aan uw boekhouder te geven of te gebruiken als basis voor het opstellen van elektronische facturen."
        ],
      },
    ],
  },
  "marketing-su-oralzon": {
    title: "Marketing op Oralzon",
    description: "Wat er echt invloed op heeft hoe klanten u vinden en u vertrouwen op het platform.",
    sections: [
      {
        heading: "Uw winkelnaam en het geverifieerde label zijn uw identiteit",
        paragraphs: [
          "Op Oralzon is er geen logo of winkelbeschrijving om te tonen — wat een klant ziet, op uw winkelpagina en naast uw producten, is de bedrijfsnaam en het eventuele geverifieerde-verkoper-label. Het loont de moeite om al bij de registratie een duidelijke, herkenbare winkelnaam te kiezen: het is het enige identiteitselement dat u overal op het platform vertegenwoordigt."
        ],
      },
      {
        heading: "Beoordelingen zijn marketing, niet alleen feedback",
        paragraphs: [
          "De beoordelingen die klanten achterlaten bij uw producten zijn zichtbaar voor iedereen die uw winkelpagina of productvermeldingen bezoekt — het is in de praktijk materiaal dat door uw eigen klanten wordt gegenereerd, vaak overtuigender dan elke beschrijving die u zelf zou kunnen schrijven. Het loont de moeite om, na een geslaagde verzending, de klant vriendelijk te vragen een beoordeling achter te laten, in plaats van te wachten tot dit vanzelf gebeurt."
        ],
      },
      {
        heading: "Uw winkelpagina brengt uw hele catalogus samen",
        paragraphs: [
          "Veel bezoekers komen via zoeken bij een product terecht, maar klikken vervolgens op de naam van de verkoper om de rest van de catalogus te bekijken — de winkelpagina (op /negozio/venditore/[id]) is vaak het punt waarop wordt bepaald of een klant een vaste klant wordt of bij een eenmalige aankoop blijft. Een catalogus die per categorie is georganiseerd, met volledige productvermeldingen, helpt om die bezoeker vast te houden."
        ],
      },
    ],
  },
  "sconti-e-codici-sconto": {
    title: "Kortingen en kortingscodes",
    description: "Hoe u een effectieve kortingscode maakt, en een belangrijk punt om te weten als u verkoopt in een winkelwagen die wordt gedeeld met andere verkopers.",
    sections: [
      {
        heading: "Hoe u een kortingscode maakt",
        paragraphs: [
          "Vanuit de sectie Kortingen kunt u een aangepaste code maken, in percentage of vast bedrag, met een optionele gebruikslimiet en vervaldatum, en — als u dat wilt — deze beperken tot specifieke producten in plaats van de hele catalogus. U deelt de code zelf met klanten (e-mail, sociale media, visitekaartje) — Oralzon adverteert deze nergens automatisch."
        ],
      },
      {
        heading: "Belangrijk: uw code geldt alleen voor uw eigen producten",
        paragraphs: [
          "Oralzon is een multi-verkoper marktplaats: een klant kan in zijn winkelwagen uw producten hebben samen met producten van andere verkopers in dezelfde bestelling. Een fundamenteel punt om te onthouden: een kortingscode die u aanmaakt, geldt uitsluitend voor de regels van uw winkel in die winkelwagen, nooit voor producten van een andere verkoper. Geen enkele verkoper kan, zelfs niet per ongeluk, via zijn eigen kortingscode onbedoeld de marge van een andere verkoper verkleinen."
        ],
      },
      {
        heading: "Een redelijke minimumdrempel",
        paragraphs: [
          "Het instellen van een minimaal bestelbedrag voor het gebruik van de code (bijvoorbeeld \"geldig vanaf 50€\") is vaak effectiever dan een kleine korting zonder drempel: het moedigt de klant aan om nog iets aan de winkelwagen toe te voegen om de drempel te bereiken, in plaats van zich te beperken tot de minimale aankoop die hij al in gedachten had."
        ],
      },
    ],
  },
  "come-usare-le-sponsorizzazioni": {
    title: "Hoe u sponsoring gebruikt",
    description: "De opties die beschikbaar zijn in Promoties, en hoe u de juiste kiest op basis van wat u wilt bereiken.",
    sections: [
      {
        heading: "Vier soorten zichtbaarheid, vier verschillende doelen",
        paragraphs: [
          "Uitgelichte Producten plaatst tot 5 van uw producten op de startpagina en in de zoekresultaten — de juiste keuze wanneer u specifieke producten een duwtje wilt geven, misschien nieuwe aanwinsten of artikelen met een betere marge. Startpagina-sponsoring geeft u een roterende of vaste positie in de gesponsorde sectie van de startpagina — beter geschikt om herkenning voor uw winkel als geheel op te bouwen, niet voor één product. Categorie-sponsoring geeft u bevoorrechte zichtbaarheid in een of meer gekozen categorieën — nuttig als u opgemerkt wilt worden door mensen die al specifiek op zoek zijn naar het type product dat u verkoopt. Hero-Sponsoring plaatst u alleen, zonder andere producten eromheen, in een uitgelichte kaart die past bij de categorie die de klant op dat moment bekijkt — verschijnt op meerdere plekken tussen home, catalogus en productpagina."
        ],
      },
      {
        heading: "Hero-Sponsoring: nooit meer dan één van u tegelijk",
        paragraphs: [
          "U kunt dit pakket kopen voor zoveel producten als u wilt — er is geen limiet aan hoeveel u gesponsord kunt hebben. De limiet gaat over wat de individuele klant op een bepaald moment ziet: op dezelfde pagina verschijnt nooit meer dan één van uw producten tegelijk, ook al heeft u er meerdere gesponsord — het systeem laat rouleren welk van uw producten wordt getoond, zowel in de tijd als tussen de verschillende plekken op de startpagina waar dit formaat verschijnt. Dit zorgt ervoor dat de ruimte eerlijk verdeeld blijft tussen alle sponsors, in plaats van gemonopoliseerd te worden door wie het meest koopt."
        ],
      },
      {
        heading: "Bekijk de statistieken voordat u kiest wat u sponsort",
        paragraphs: [
          "De sectie Statistieken toont welke producten al weergaven en organische verkopen genereren — dit zijn over het algemeen de beste kandidaten om te sponsoren, omdat sponsoring een reeds bestaande interesse versterkt in plaats van deze vanaf nul te moeten creëren. Een product sponsoren dat helemaal niet verkoopt, keert de trend zelden vanzelf om."
        ],
      },
      {
        heading: "De kortingscode bij het afrekenen van sponsoring",
        paragraphs: [
          "Als u een geldige kortingscode heeft voor zichtbaarheidspakketten, voert u deze in bij de bevestigingsstap die opent wanneer u op \"Kopen\" klikt bij een specifiek pakket — niet daarvoor. De uiteindelijke prijs met toegepaste korting is wat u ziet vlak voordat u verdergaat naar de betaling, nooit een verrassing achteraf."
        ],
      },
    ],
  },
};