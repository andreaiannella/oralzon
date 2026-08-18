// Contenuto legale (Termini di Servizio, Condizioni di Vendita) — struttura
// dati invece di JSX fisso, per poterlo tradurre in tutte le lingue con lo
// stesso pattern già usato per blog e Academy. **testo** nei paragrafi
// diventa grassetto nel render (vedi lib/legalLocalization.ts).
export interface LegalSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface LegalDocument {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

export const TERMINI_SERVIZIO_IT: LegalDocument = {
  title: "Termini di Servizio",
  lastUpdated: "Agosto 2026",
  sections: [
    {
      heading: "1. Chi siamo e cosa regolano questi termini",
      paragraphs: [
        "Oralzon è un servizio di intermediazione online che mette in contatto fornitori di prodotti odontoiatrici (**venditori**) con operatori professionali del settore (**acquirenti**). Oralzon non vende prodotti propri agli acquirenti attraverso il servizio di intermediazione: ogni contratto di vendita si conclude direttamente fra il venditore e l'acquirente.",
        "Il gestore della piattaforma è **Oralzon**, contattabile all'indirizzo support@oralzon.com.",
        "Utilizzando la piattaforma accetti questi Termini. Se non li accetti, non puoi utilizzarla. Le Condizioni di Vendita, la Privacy Policy e la Cookie Policy ne costituiscono parte integrante."
      ],
    },
    {
      heading: "2. Chi può usare Oralzon",
      paragraphs: [
        "Oralzon è riservata a soggetti che agiscono nell'esercizio della propria attività professionale o imprenditoriale e sono titolari di una Partita IVA valida. Non è rivolta a consumatori: di conseguenza **non si applicano le tutele previste dal Codice del Consumo** (D.Lgs. 206/2005), che riguardano esclusivamente le persone fisiche che agiscono per scopi estranei alla propria attività.",
        "I venditori devono avere sede in uno dei 27 Stati membri dell'Unione Europea. Questo requisito deriva dalle regole IVA sul fornitore presunto (art. 14 bis della Direttiva 2006/112/CE) e non è derogabile.",
        "Sei responsabile della veridicità dei dati forniti, della custodia delle credenziali e di quanto avviene tramite il tuo account."
      ],
    },
    {
      heading: "3. Modifiche a questi termini",
      paragraphs: [
        "Possiamo modificare questi Termini. Le modifiche vengono comunicate ai venditori via email e pubblicate in piattaforma **almeno 15 giorni prima** di avere effetto, come previsto dall'art. 3 del Regolamento (UE) 2019/1150. Se la modifica richiede adeguamenti tecnici o commerciali significativi, il preavviso è proporzionalmente più lungo.",
        "Durante il periodo di preavviso il venditore può recedere senza costi. La pubblicazione di nuovi prodotti o la mancata disdetta entro il termine valgono come accettazione.",
        "Il preavviso non si applica quando la modifica è imposta da un obbligo di legge o serve a fronteggiare un pericolo imminente per la sicurezza della piattaforma o dei suoi utenti."
      ],
    },
    {
      heading: "4. Come vengono ordinati i prodotti (ranking)",
      paragraphs: [
        "In attuazione dell'art. 5 del Regolamento (UE) 2019/1150 indichiamo i parametri principali che determinano la posizione dei prodotti nei risultati di ricerca e nelle sezioni della piattaforma, e la loro importanza relativa.",
        "I risultati di ricerca sono ordinati combinando la **corrispondenza con il termine cercato** e alcuni parametri relativi al prodotto. La corrispondenza resta il fattore dominante: gli altri parametri intervengono per stabilire l'ordine **fra prodotti ugualmente pertinenti**, non per anteporre un prodotto meno pertinente a uno più pertinente."
      ],
      bullets: [
        "**Corrispondenza con la ricerca** — è il parametro prevalente e nessun altro può ribaltarlo. La ricerca confronta il termine inserito con il nome del prodotto (anche tradotto), la marca, il codice articolo e la descrizione, con peso decrescente in quest'ordine: una corrispondenza nel nome vale più della stessa parola presente solo nella descrizione",
        "**Filtri e ordinamento scelti dall'acquirente** — quando l'acquirente ordina per prezzo, quella scelta prevale su ogni altro parametro, comprese le posizioni a pagamento",
        "**Disponibilità** — a parità di corrispondenza, un prodotto disponibile precede uno esaurito. È il secondo parametro per importanza, perché un risultato non acquistabile non è utile né all'acquirente né al venditore. I prodotti esauriti restano comunque visibili e non vengono rimossi dai risultati",
        "**Vendite realizzate** — a parità di corrispondenza, un prodotto già acquistato da altri professionisti precede uno senza storia di vendite. L'effetto è progressivo ma decrescente: la differenza fra nessuna vendita e le prime vendite conta molto più di quella fra molte vendite e moltissime, così un prodotto affermato non occupa la posizione in modo permanente",
        "**Recensioni ricevute** — media dei giudizi, ponderata sul loro numero: poche recensioni ottime pesano meno di molte recensioni buone. Sono ammesse esclusivamente da acquirenti che hanno effettivamente acquistato quel prodotto sulla piattaforma",
        "**Prodotti di recente pubblicazione** — i prodotti pubblicati da poco ricevono un vantaggio esplicito nel posizionamento, che si riduce gradualmente nei primi tre mesi. È una scelta deliberata: senza di esso un marketplace favorirebbe stabilmente chi vende già, e un venditore che entra oggi non avrebbe modo di partire",
        "**Posizionamento a pagamento** — i venditori possono acquistare pacchetti di visibilità (prodotti in evidenza, spazi in homepage, spazi per categoria, card contestuali). Questi contenuti sono **sempre contrassegnati come “Sponsorizzato”**. Nei risultati di ricerca la sponsorizzazione **si somma** al punteggio del prodotto e non lo moltiplica: può quindi far prevalere un prodotto a parità di corrispondenza, ma **non può portare un prodotto poco pertinente sopra uno molto pertinente**. Quando uno spazio a pagamento è disponibile ma nessun venditore lo ha acquistato, mostriamo un prodotto non sponsorizzato con l'etichetta neutra “In evidenza”, senza attribuirgli una sponsorizzazione inesistente",
        "**Cronologia di acquisto e di navigazione dell'acquirente** — usata per suggerire prodotti pertinenti, con dati raccolti unicamente su questa piattaforma. Non incide su prezzi o condizioni e non prevale mai sulle scelte esplicite dell'acquirente né sugli spazi a pagamento",
        "**Nessuna preferenza per venditore** — l'anzianità, il volume complessivo di vendite del venditore, il piano sottoscritto e l'eventuale acquisto di altri servizi non influiscono in alcun modo sul posizionamento dei suoi prodotti. Oralzon non vende prodotti propri e non ha quindi posizioni da favorire"
      ],
    },
    {
      heading: "5. Obblighi dei venditori",
      bullets: [
        "Essere soggetti giuridici regolarmente costituiti, con Partita IVA valida in uno Stato membro dell'Unione Europea",
        "Pubblicare informazioni di prodotto complete, accurate e non ingannevoli, comprese le indicazioni obbligatorie per legge",
        "Garantire che i prodotti classificati come dispositivi medici rispettino il Regolamento (UE) 2017/745 (MDR) e ogni altra normativa applicabile",
        "Mantenere aggiornate le disponibilità di magazzino ed evadere gli ordini ricevuti nei tempi dichiarati",
        "Gestire la spedizione dei propri prodotti e inserire i dati di tracciabilità",
        "Utilizzare i dati degli acquirenti esclusivamente per evadere l'ordine, nel rispetto del GDPR",
        "**Non indirizzare gli acquirenti fuori dalla piattaforma**: è vietato inserire recapiti diretti (email, telefono, messaggistica, siti terzi) nelle schede prodotto, nelle risposte alle domande, nelle recensioni, nelle immagini o nei materiali inclusi nelle spedizioni, allo scopo di concludere fuori da Oralzon vendite originate sulla piattaforma",
        "Assolvere in proprio ogni adempimento fiscale, compresi gli elenchi riepilogativi delle cessioni intracomunitarie (Intrastat) ove dovuti: Oralzon non li presenta per conto del venditore"
      ],
    },
    {
      heading: "6. Limitazione, sospensione e cessazione del servizio",
      paragraphs: [
        "In attuazione dell'art. 4 del Regolamento (UE) 2019/1150, quando limitiamo o sospendiamo i servizi a un venditore gli comunichiamo **i motivi specifici** della decisione, su supporto durevole, entro e non oltre il momento in cui la misura ha effetto.",
        "Se decidiamo di cessare del tutto la fornitura dei servizi, il preavviso è di **almeno 30 giorni**, salvo che ricorra un obbligo di legge, una violazione grave e reiterata di questi Termini, o un rischio concreto per la sicurezza degli utenti o per l'integrità del servizio.",
        "Il venditore può contestare la decisione tramite la procedura di reclamo del punto 7. Se la contestazione è accolta, la misura viene revocata senza indebito ritardo.",
        "La scadenza del periodo di prova o del piano venditore, quando non rinnovato, non è una sanzione: è disciplinata dalle Condizioni di Vendita ed è preceduta da appositi avvisi.",
        "**Gli ordini già ricevuti prima di una sospensione restano validi** e devono essere evasi. I relativi importi vengono accreditati secondo le condizioni ordinarie."
      ],
    },
    {
      heading: "7. Reclami e risoluzione delle controversie",
      paragraphs: [
        "Ogni venditore può presentare un reclamo scrivendo a **support@oralzon.com**, indicando l'oggetto della contestazione. Trattiamo i reclami in tempi ragionevoli e proporzionati alla loro complessità, e comunichiamo l'esito in forma individuale e in linguaggio chiaro.",
        "Il gestore della piattaforma è attualmente una piccola impresa ai sensi dell'art. 11, paragrafo 5, del Regolamento (UE) 2019/1150 e non è pertanto tenuto a istituire un sistema interno di gestione dei reclami formalizzato. Manteniamo comunque la procedura sopra descritta.",
        "In caso di mancato accordo, le parti possono rivolgersi in via stragiudiziale a un organismo di mediazione iscritto nel registro tenuto dal Ministero della Giustizia, competente per la materia commerciale. Il ricorso alla mediazione non pregiudica il diritto di adire l'autorità giudiziaria.",
        "Restano impregiudicati i diritti riconosciuti alle organizzazioni rappresentative dei venditori dall'art. 14 del medesimo Regolamento."
      ],
    },
    {
      heading: "8. Accesso ai dati",
      paragraphs: [
        "Il venditore ha accesso, dalla propria area riservata, ai dati generati dalla sua attività: ordini ricevuti, prodotti venduti, fatturato, recensioni, domande dei clienti, trasferimenti e riepiloghi fiscali.",
        "Non condividiamo con i venditori l'email e il numero di telefono degli acquirenti. Riceve invece nome, indirizzo di spedizione e dati di fatturazione, necessari a consegnare e a emettere fattura. Questa scelta protegge gli acquirenti da comunicazioni non richieste e mantiene tracciabili gli scambi in caso di contestazione.",
        "Non cediamo a terzi i dati aggregati generati sulla piattaforma per finalità commerciali proprie di questi ultimi."
      ],
    },
    {
      heading: "9. Proprietà intellettuale e contenuti",
      paragraphs: [
        "Il venditore conserva ogni diritto sui contenuti che pubblica e garantisce di averne titolo. Concede a Oralzon una licenza non esclusiva e gratuita per pubblicarli, tradurli automaticamente nelle lingue della piattaforma e utilizzarli per promuovere il catalogo, limitatamente alla durata del rapporto.",
        "Marchi, interfacce, testi editoriali e software della piattaforma appartengono al gestore e non possono essere riprodotti senza autorizzazione.",
        "Rimuoviamo i contenuti che risultino illeciti, ingannevoli o in violazione di questi Termini, informandone l'autore con l'indicazione dei motivi."
      ],
    },
    {
      heading: "10. Responsabilità",
      paragraphs: [
        "Oralzon risponde del funzionamento della piattaforma tecnologica e dell'esattezza delle informazioni che essa stessa fornisce. Non è parte del contratto di vendita e non risponde della qualità, conformità o sicurezza dei prodotti, del comportamento dei venditori o dei tempi di consegna, che restano a carico esclusivo del venditore.",
        "Salvo i casi di dolo o colpa grave, e salvo i danni alla persona, la responsabilità complessiva di Oralzon verso un venditore è limitata a quanto da lui corrisposto alla piattaforma nei dodici mesi precedenti l'evento. Verso un acquirente è limitata all'importo dell'ordine cui la contestazione si riferisce.",
        "Nessuna clausola di questi Termini esclude o limita responsabilità che la legge applicabile non consente di escludere o limitare."
      ],
    },
    {
      heading: "11. Legge applicabile e foro competente",
      paragraphs: [
        "Questi Termini sono regolati dalla legge italiana.",
        "Per ogni controversia è competente in via esclusiva il Foro di Cassino. Trattandosi di rapporti fra professionisti, le parti riconoscono che tale attribuzione è convenuta per iscritto ai sensi dell'art. 25 del Regolamento (UE) 1215/2012.",
        "La versione italiana di questi Termini fa fede in caso di divergenza con le traduzioni."
      ],
    },
  ],
};

export const CONDIZIONI_VENDITA_IT: LegalDocument = {
  title: "Condizioni di Vendita",
  lastUpdated: "Agosto 2026",
  sections: [
    {
      heading: "1. Ambito di applicazione",
      paragraphs: [
        "Queste Condizioni regolano gli acquisti effettuati tramite Oralzon da operatori professionali del settore odontoiatrico. I prodotti sono venduti dai fornitori iscritti (venditori): il contratto si conclude fra venditore e acquirente, mentre Oralzon interviene come intermediario tecnologico e incaricato dell'incasso.",
        "Poiché l'acquirente agisce sempre nell'esercizio della propria attività, **non trovano applicazione le tutele del Codice del Consumo** (D.Lgs. 206/2005), riservate ai consumatori."
      ],
    },
    {
      heading: "2. Ordini e conferma",
      paragraphs: [
        "L'ordine si perfeziona quando il pagamento viene confermato. L'acquirente riceve subito una email con il numero d'ordine e il riepilogo, che vale come accettazione dell'offerta del venditore.",
        "I checkout avviati e non completati non danno luogo ad alcun ordine e vengono annullati automaticamente decorse 24 ore.",
        "La disponibilità dei prodotti è verificata al momento dell'ordine. Se, per acquisti concomitanti, un articolo risultasse indisponibile dopo la conferma, il venditore ne dà comunicazione e si procede al rimborso della parte non evadibile."
      ],
    },
    {
      heading: "3. Prezzi, IVA e pagamento",
      bullets: [
        "I prezzi sono in Euro. Per le vendite nazionali sono comprensivi di IVA all'aliquota vigente nel Paese del venditore",
        "Per le vendite fra venditore e acquirente stabiliti in due diversi Stati membri dell'Unione Europea, entrambi con Partita IVA verificata sul sistema VIES, si applica l'inversione contabile (reverse charge): il corrispettivo non comprende l'IVA e l'acquirente assolve l'imposta nel proprio Paese, come indicato in fattura",
        "Se la verifica VIES non dà esito positivo per una delle due parti, si applica l'IVA del Paese del venditore",
        "Il pagamento avviene tramite carta di credito o debito ed è elaborato da Stripe. Oralzon non tratta né conserva i dati delle carte",
        "L'importo è dovuto integralmente al momento dell'ordine",
        "La fattura è emessa dal venditore, unico soggetto obbligato: Oralzon fornisce i dati necessari ma non emette fattura per conto suo"
      ],
    },
    {
      heading: "4. Commissioni e piano venditore",
      paragraphs: [
        "Su ogni vendita conclusa Oralzon trattiene una commissione del **7% sul valore della merce** (imponibile, IVA esclusa), decurtata dall'importo accreditato al venditore. La commissione copre i costi di elaborazione dei pagamenti e i servizi della piattaforma.",
        "**La commissione non si applica alle spese di spedizione**, che non costituiscono ricavo della piattaforma.",
        "L'accesso alla piattaforma richiede inoltre un piano venditore annuale, alle condizioni indicate nella pagina dedicata al momento della sottoscrizione. Al termine del periodo di prova gratuito, l'assenza di sottoscrizione comporta la sospensione delle vendite, preceduta da avvisi via email prima della scadenza e nei giorni successivi. Catalogo, ordini e statistiche restano archiviati e tornano disponibili con l'attivazione del piano.",
        "Eventuali modifiche della percentuale di commissione sono comunicate via email con preavviso minimo di 30 giorni e non si applicano agli ordini già ricevuti."
      ],
    },
    {
      heading: "5. Spedizioni",
      paragraphs: [
        "Ogni venditore spedisce autonomamente i propri prodotti. Negli ordini che coinvolgono più fornitori i prodotti viaggiano separatamente, con spese e tracciabilità distinte per ciascun venditore.",
        "Le spese di spedizione sono determinate dal venditore per zona di destinazione e mostrate all'acquirente prima del pagamento, distinte per fornitore. Il venditore può stabilire una soglia d'ordine oltre la quale la spedizione è gratuita: in tal caso il costo del trasporto resta a suo carico.",
        "I tempi di consegna indicati nelle schede prodotto sono stimati e non vincolanti. Oralzon spedisce esclusivamente all'interno dell'Unione Europea.",
        "L'acquirente riceve via email il numero di tracciabilità al momento della spedizione ed è invitato a confermare la ricezione dalla sezione ordini. In assenza di conferma, la consegna si intende avvenuta decorsi 7 giorni dalla spedizione per gli invii nazionali e 15 giorni per quelli intracomunitari."
      ],
    },
    {
      heading: "6. Pagamento al venditore",
      paragraphs: [
        "Gli importi incassati restano presso Oralzon fino alla conferma di consegna, manuale o automatica secondo i termini del punto 5. Solo allora il netto viene accreditato al venditore sul conto collegato.",
        "Questa modalità tutela entrambe le parti: consente di gestire un reso o una contestazione prima che le somme siano trasferite, e assicura al venditore un accredito automatico senza necessità di sollecito.",
        "Una richiesta di reso aperta sospende l'accredito relativo all'articolo interessato fino alla definizione della pratica.",
        "Per ricevere gli accrediti il venditore deve completare la verifica di identità richiesta dal fornitore di servizi di pagamento. Fino ad allora le somme restano accantonate e non vengono perdute."
      ],
    },
    {
      heading: "7. Resi e rimborsi",
      paragraphs: [
        "Trattandosi di vendite fra professionisti, **non sussiste un diritto di recesso previsto dalla legge**. Oralzon riconosce tuttavia, come propria politica commerciale, la possibilità di richiedere un reso entro **30 giorni** dalla consegna, alle condizioni che seguono.",
        "La richiesta si apre dalla sezione “I miei ordini” e può riguardare anche solo una parte delle quantità acquistate. Il venditore la esamina e può accoglierla o respingerla motivando la decisione.",
        "I prodotti devono essere restituiti integri, nella confezione originale non aperta e completi di ogni elemento. **Sono esclusi dal reso** i dispositivi monouso con confezione sterile aperta o danneggiata, i prodotti realizzati su misura, quelli soggetti a rapido deterioramento e quelli la cui sicurezza non è più verificabile una volta aperti.",
        "Salvo diverso accordo, le spese di restituzione sono a carico dell'acquirente. Restano invece a carico del venditore quando il prodotto è difettoso, non conforme all'ordine o danneggiato durante il trasporto.",
        "Il rimborso è calcolato sul prezzo effettivamente pagato per gli articoli resi ed è disposto sullo stesso metodo di pagamento entro 14 giorni dall'accettazione del reso. Il venditore può trattenere una quota motivata a fronte di un deterioramento non dovuto alla verifica del prodotto.",
        "Questa politica non pregiudica i diritti di garanzia previsti dal Codice Civile per i vizi della cosa venduta, che restano impregiudicati."
      ],
    },
    {
      heading: "8. Garanzia e conformità dei prodotti",
      paragraphs: [
        "Il venditore garantisce, sotto la propria esclusiva responsabilità, che i prodotti pubblicati sono conformi alle normative applicabili, incluso il Regolamento (UE) 2017/745 sui dispositivi medici, e che dispone dei titoli necessari a commercializzarli.",
        "Oralzon verifica i dati anagrafici e fiscali forniti in fase di registrazione, ma non esamina né certifica la conformità dei singoli prodotti, che resta interamente a carico del venditore.",
        "Alla vendita si applica la garanzia legale per i vizi prevista dagli artt. 1490 e seguenti del Codice Civile, nei rapporti fra venditore e acquirente."
      ],
    },
    {
      heading: "9. Recensioni e domande",
      paragraphs: [
        "Possono lasciare una recensione soltanto gli acquirenti che hanno effettivamente acquistato il prodotto: la verifica è automatica e non aggirabile.",
        "Recensioni e domande sono pubbliche e riportano il nome dell'autore. Non è consentito inserirvi recapiti diretti né contenuti diffamatori, illeciti o estranei al prodotto.",
        "Non rimuoviamo recensioni negative su richiesta del venditore, che può però replicare pubblicamente. Rimuoviamo i contenuti che violano queste regole, informandone l'autore."
      ],
    },
    {
      heading: "10. Legge applicabile e foro competente",
      paragraphs: [
        "Queste Condizioni sono regolate dalla legge italiana. Per ogni controversia è competente in via esclusiva il Foro di Cassino, ai sensi dell'art. 25 del Regolamento (UE) 1215/2012, trattandosi di rapporti fra professionisti.",
        "La versione italiana fa fede in caso di divergenza con le traduzioni."
      ],
    },
    {
      heading: "11. Contatti",
      paragraphs: [
        "Per qualsiasi informazione su queste Condizioni: **support@oralzon.com**"
      ],
    },
  ],
};
