// Contenuti dell'Oralzon Academy — guide pratiche per aiutare i venditori a
// usare bene la piattaforma. Ogni affermazione qui dentro deve corrispondere
// esattamente a una funzionalità reale e verificata della piattaforma — mai
// una funzionalità presente solo nel codice ma mai realmente testata/attiva
// (es. rimosso il riferimento al codice referral: il codice esiste nel
// backend ma non è mai stato generato per NESSUN venditore reale, verificato
// via query diretta sul database — quindi non è materiale da Academy finché
// non è verificato funzionante end-to-end). Tradotto in
// src/data/academyTranslations/{lang}.ts — ogni correzione qui va sempre
// replicata in tutte le 6 lingue, mai lasciata solo in italiano.
export interface AcademyGuideSection {
  heading: string;
  paragraphs: string[];
}

export interface AcademyGuide {
  id: string;
  slug: string;
  title: string;
  description: string;
  sections: AcademyGuideSection[];
}

export const ACADEMY_GUIDES: AcademyGuide[] = [
  {
    id: "iniziare",
    slug: "come-iniziare-su-oralzon",
    title: "Come iniziare su Oralzon",
    description: "Il percorso essenziale dei primi giorni: cosa completare prima di aprire davvero al pubblico, e in che ordine.",
    sections: [
      {
        heading: "Il profilo negozio prima di tutto",
        paragraphs: [
          "Prima di caricare prodotti, vale la pena completare il profilo in Impostazioni: nome del negozio, telefono, sito web (se ne hai uno), e i dati fiscali (P.IVA, PEC o codice SDI) necessari per la fatturazione. Non c'è un logo o una descrizione da caricare — su Oralzon l'identità del venditore è il nome del negozio più l'eventuale badge di venditore verificato, non un'immagine."
        ],
      },
      {
        heading: "Collegare Stripe prima di pubblicare prodotti",
        paragraphs: [
          "Il conto Stripe collegato è quello che riceve davvero i pagamenti delle vendite — senza, un prodotto può essere pubblicato e persino acquistato, ma i fondi restano in sospeso su Oralzon fino a che il collegamento non viene completato. La pagina Pagamenti mostra sempre lo stato aggiornato del collegamento, e un banner in cima al pannello lo ricorda finché non è attivo."
        ],
      },
      {
        heading: "I primi prodotti: qualità prima di quantità",
        paragraphs: [
          "Meglio 10-15 prodotti con schede complete (foto multiple, descrizione dettagliata, categoria corretta) che 50 schede minime. Le schede incomplete si posizionano peggio nella ricerca interna e convertono meno — un cliente che cerca uno strumento specifico e trova una descrizione vaga passa quasi sempre al risultato successivo.",
          "L'importazione da Excel (sezione Import Excel) è utile quando si parte da un catalogo già esistente in un foglio di calcolo, ma vale comunque la pena rivedere a mano le prime schede importate prima di pubblicarle: la qualità delle foto in particolare non si può automatizzare."
        ],
      },
      {
        heading: "Cosa succede nei primi 6 mesi",
        paragraphs: [
          "Il periodo di prova gratuito dura 180 giorni dalla registrazione — durante questo periodo non si paga il canone del piano venditore, ma la commissione sulle vendite resta comunque attiva fin dal primo ordine. Vale la pena usare questi mesi per testare cosa funziona (categorie, prezzi, sponsorizzazioni) prima che scatti il canone."
        ],
      },
    ],
  },
  {
    id: "vendite",
    slug: "migliorare-le-vendite",
    title: "Migliorare le vendite: cosa muove davvero i numeri",
    description: "Le leve che hanno un impatto reale sulle vendite, in ordine di priorità pratica — non tutto vale lo stesso sforzo.",
    sections: [
      {
        heading: "Le foto contano più della descrizione",
        paragraphs: [
          "In un marketplace B2B la tentazione è scrivere descrizioni tecniche lunghissime e trascurare le foto, dando per scontato che chi compra sappia già cosa cerca. In pratica succede il contrario: le foto sono il primo filtro con cui un acquirente scarta o considera un prodotto, la descrizione interviene solo dopo. Foto nitide, su sfondo neutro, che mostrano il prodotto da più angolazioni, fanno una differenza misurabile nel tasso di conversione."
        ],
      },
      {
        heading: "Il prezzo non è l'unica leva competitiva",
        paragraphs: [
          "Su un marketplace con più venditori per la stessa categoria di prodotto, la tentazione è competere solo sul prezzo più basso — ma tempi di spedizione dichiarati onestamente, una scheda prodotto completa, e recensioni positive accumulate nel tempo pesano quanto o più del prezzo per un acquirente professionale che valuta l'affidabilità del fornitore, non solo il costo dell'ordine."
        ],
      },
      {
        heading: "Rispondere alle recensioni, anche a quelle negative",
        paragraphs: [
          "Dalla sezione Recensioni puoi rispondere pubblicamente a ogni recensione — la tua risposta resta visibile sotto quella del cliente. Una recensione negativa senza risposta pesa più della recensione stessa: comunica che il problema non è stato affrontato. Una risposta pubblica, anche breve, che riconosce il problema e spiega cosa è stato fatto, recupera gran parte della fiducia persa."
        ],
      },
      {
        heading: "Le sponsorizzazioni funzionano meglio su prodotti già validati",
        paragraphs: [
          "Sponsorizzare un prodotto che non ha ancora venduto nulla, per testare se funziona, è quasi sempre meno efficiente che sponsorizzare un prodotto che vende già bene organicamente — la sponsorizzazione amplifica la visibilità, non compensa un prodotto con una scheda debole o un prezzo fuori mercato. Vale la pena guardare le statistiche prima di scegliere cosa sponsorizzare, non dopo."
        ],
      },
    ],
  },
  {
    id: "fatturazione",
    slug: "fatturazione-e-dati-fiscali",
    title: "Fatturazione: cosa fa Oralzon e cosa resta al venditore",
    description: "Come funziona davvero il calcolo IVA riga per riga, cosa trovi nel report vendite, e cosa devi ancora fare tu.",
    sections: [
      {
        heading: "Oralzon non emette fatture al posto tuo",
        paragraphs: [
          "Un punto importante da avere chiaro fin da subito: Oralzon non è responsabile dell'emissione delle fatture fiscali reali. Ogni venditore resta un soggetto fiscale autonomo, e deve emettere le proprie fatture elettroniche (o tramite il proprio commercialista) per ogni ordine. Quello che Oralzon fornisce, nella sezione Report Vendite → Dati per fatturazione, è il calcolo già pronto — imponibile, aliquota, IVA, eventuale motivo di esenzione — così non serve ricalcolarlo a mano."
        ],
      },
      {
        heading: "Come viene calcolata l'IVA su ogni ordine",
        paragraphs: [
          "Il calcolo segue la regola standard UE per le cessioni di beni B2B: vendita nazionale (stesso Paese di venditore e cliente) applica l'IVA piena del Paese del venditore; vendita intracomunitaria con entrambe le parti verificate su VIES applica il reverse charge (IVA a zero, il cliente si autoliquida l'imposta); vendita intracomunitaria senza verifica VIES applica comunque l'IVA piena, per prudenza; vendita extra-UE è non imponibile per esportazione.",
          "Questo calcolo avviene automaticamente per ogni riga d'ordine, al momento dell'acquisto — non serve configurare nulla per farlo funzionare."
        ],
      },
      {
        heading: "Esportare i dati per il commercialista",
        paragraphs: [
          "Il pulsante Esporta CSV nella sezione Dati per fatturazione genera un file con un rigo per ogni prodotto di ogni ordine — il livello di dettaglio che serve davvero per compilare una fattura, non un aggregato mensile. È il file più comodo da passare al proprio commercialista o da usare come base per l'emissione delle fatture elettroniche."
        ],
      },
    ],
  },
  {
    id: "marketing",
    slug: "marketing-su-oralzon",
    title: "Marketing su Oralzon",
    description: "Come i clienti ti trovano, perché all'inizio non ti trovano, e cosa puoi fare per cambiarlo.",
    sections: [
      {
        heading: "Il problema di chi comincia: esistere non basta per essere trovato",
        paragraphs: [
          "Un catalogo caricato non è un catalogo visibile. Su qualsiasi marketplace i prodotti che compaiono più in alto sono quelli che hanno già venduto, già ricevuto recensioni, già accumulato una storia. È un meccanismo sensato per chi compra — mostra ciò che ha funzionato per altri — ma crea un problema circolare per chi arriva adesso: non vendi perché non ti vedono, e non ti vedono perché non hai ancora venduto.",
          "È il motivo per cui un fornitore serio, con prodotti ottimi e prezzi corretti, può restare mesi senza un ordine mentre concorrenti meno competitivi vendono ogni giorno. Non è una questione di qualità: è una questione di posizione. Chi cerca \"curette Gracey\" guarda i primi risultati, raramente arriva alla terza schermata.",
          "Le sponsorizzazioni servono esattamente a questo: comprare la posizione che non hai ancora guadagnato, per il tempo necessario a guadagnartela davvero. Sono un acceleratore dell'inizio, non una tassa permanente."
        ],
      },
      {
        heading: "Cosa cambia concretamente quando un prodotto è sponsorizzato",
        paragraphs: [
          "Un prodotto sponsorizzato non viene mostrato \"un po' più su\": entra in spazi dove i prodotti normali non compaiono affatto. La card Sponsorizzato Hero, per esempio, è una scheda singola con il tuo prodotto da solo, senza concorrenti accanto, che appare in homepage, nel catalogo e nelle pagine prodotto — dove un cliente sta già guardando articoli simili ai tuoi.",
          "La differenza rispetto a un buon posizionamento organico è che la sponsorizzazione agisce subito e in modo prevedibile: sai dove comparirai e per quanto tempo. Il posizionamento organico arriva dopo, come conseguenza delle vendite che la sponsorizzazione ti ha permesso di fare.",
          "Ed è questo il punto che molti venditori non colgono: le vendite generate mentre sei sponsorizzato non spariscono quando la sponsorizzazione finisce. Restano come storico ordini e come recensioni, e sono proprio gli ingredienti che ti fanno salire nei risultati anche dopo. Un mese di visibilità pagata può lasciarti in una posizione che avresti impiegato molto più tempo a raggiungere da solo."
        ],
      },
      {
        heading: "Quando conviene davvero, e quando no",
        paragraphs: [
          "Sponsorizzare ha senso quando il prodotto è già pronto a convertire: scheda completa, foto nitide, prezzo in linea col mercato, disponibilità reale a magazzino. Portare traffico su una scheda vuota o su un articolo esaurito è il modo più veloce di sprecare il budget — il cliente arriva, non trova quello che cerca, e non torna.",
          "Ha senso soprattutto in tre momenti: quando apri il negozio e nessuno ti conosce ancora; quando lanci un prodotto nuovo che non ha storico; quando vuoi difendere una categoria in cui un concorrente sta guadagnando terreno.",
          "Ha meno senso su prodotti che vendono già bene da soli — lì stai pagando per visibilità che avresti comunque — e su articoli a margine troppo basso, dove il costo della sponsorizzazione si mangia il guadagno. Prima di comprare, fai un conto semplice: quante unità devi vendere in più per ripagare il pacchetto? Se il numero ti sembra ragionevole, procedi; se ti sembra alto, scegli un prodotto con margine migliore.",
          "Le sponsorizzazioni non garantiscono vendite: comprano visibilità, che è una condizione necessaria ma non sufficiente. Quello che succede dopo il clic dipende dalla tua scheda prodotto, dal tuo prezzo e dalla tua affidabilità."
        ],
      },
      {
        heading: "Misura i risultati, non fidarti dell'impressione",
        paragraphs: [
          "Prima di attivare una sponsorizzazione, annota da dove parti: quanti ordini e quanto fatturato ha generato quel prodotto nell'ultimo mese. Li trovi nella sezione Statistiche della dashboard. Alla scadenza del pacchetto confronta gli stessi numeri — solo così sai se ha funzionato davvero, invece di andare a sensazione.",
          "Se un pacchetto ha reso, rinnovalo. Se non ha reso, prova a cambiare prodotto o tipo di visibilità prima di concludere che le sponsorizzazioni non funzionano: spesso il problema non è lo strumento ma l'abbinamento tra strumento e prodotto scelto."
        ],
      },
      {
        heading: "Il nome del negozio, il logo e il badge verificato sono la tua identità",
        paragraphs: [
          "Quello che un cliente vede, sulla pagina del tuo negozio e accanto ai tuoi prodotti, è il nome dell'attività, il logo che hai caricato nelle impostazioni e l'eventuale badge di venditore verificato. Vale la pena curarli fin dall'inizio: sono ciò che ti rappresenta ovunque sulla piattaforma, comprese le sezioni sponsorizzate dove la concorrenza è più diretta.",
          "Il logo non può contenere numeri di telefono, email, contatti WhatsApp o indirizzi di altri siti: un controllo automatico li rileva e rifiuta l'immagine. Non è un capriccio — le Condizioni di Vendita vietano di dirottare i clienti fuori dalla piattaforma, e il logo è uno dei punti dove si prova più spesso a farlo.",
          "Il badge di venditore verificato non si compra: si ottiene completando la verifica dell'identità su Stripe, la stessa che serve a ricevere i pagamenti. È l'unico segnale di affidabilità che un cliente non può mettere in dubbio, e sulle sezioni sponsorizzate fa differenza: a parità di prodotto e prezzo, si sceglie quasi sempre il venditore verificato."
        ],
      },
      {
        heading: "Le recensioni sono marketing, non solo feedback",
        paragraphs: [
          "Le recensioni che i clienti lasciano sui tuoi prodotti sono visibili a chiunque visiti la tua pagina negozio o le schede prodotto — sono a tutti gli effetti materiale generato dai tuoi stessi clienti, spesso più convincente di qualunque descrizione tu possa scrivere. Vale la pena, dopo una spedizione andata bene, chiedere gentilmente al cliente di lasciare una recensione, invece di aspettare che accada da solo.",
          "Le recensioni contano doppio se stai sponsorizzando: la visibilità porta il cliente sulla scheda, ma è la prova sociale che gli fa premere \"aggiungi al carrello\". Sponsorizzare un prodotto senza recensioni funziona, sponsorizzarne uno con recensioni positive funziona molto meglio — a parità di spesa."
        ],
      },
      {
        heading: "La pagina negozio raccoglie tutto il tuo catalogo",
        paragraphs: [
          "Molti visitatori arrivano a un prodotto tramite ricerca, ma poi cliccano sul nome del venditore per vedere il resto del catalogo — la pagina negozio è spesso il punto in cui si decide se un cliente diventa abituale o resta un acquisto singolo. Un catalogo organizzato per categorie, con schede prodotto complete, aiuta a trattenere quel visitatore.",
          "È anche il motivo per cui conviene sponsorizzare il prodotto giusto e non necessariamente il più economico: la sponsorizzazione porta traffico su una scheda, ma da lì il cliente esplora tutto il resto. Un prodotto rappresentativo di quello che vendi porta visite più utili di un articolo civetta scollegato dal tuo catalogo."
        ],
      },
    ],
  },
  {
    id: "sconti",
    slug: "sconti-e-codici-sconto",
    title: "Sconti e codici sconto",
    description: "Come creare un codice sconto efficace, e un punto importante da sapere se vendi in un carrello condiviso con altri venditori.",
    sections: [
      {
        heading: "Come creare un codice sconto",
        paragraphs: [
          "Dalla sezione Sconti puoi creare un codice personalizzato, a percentuale o a importo fisso, con un limite di utilizzi e una data di scadenza opzionali, e — se vuoi — limitarlo a prodotti specifici invece che a tutto il catalogo. Il codice puoi comunicarlo tu stesso ai clienti (email, social, biglietto da visita) — Oralzon non lo pubblicizza automaticamente da nessuna parte."
        ],
      },
      {
        heading: "Importante: il tuo codice si applica solo ai tuoi prodotti",
        paragraphs: [
          "Oralzon è un marketplace multi-venditore: un cliente può avere nel carrello prodotti tuoi insieme a prodotti di altri venditori nello stesso ordine. Un punto fondamentale da avere chiaro: un codice sconto che crei tu si applica esclusivamente alle righe del tuo negozio in quel carrello, mai ai prodotti di un altro venditore. Nessun venditore può, nemmeno per errore, ridurre involontariamente il margine di un altro tramite il proprio codice sconto."
        ],
      },
      {
        heading: "Una soglia minima ragionevole",
        paragraphs: [
          "Impostare un importo minimo d'ordine per l'utilizzo del codice (es. \"valido sopra i 50€\") è spesso più efficace di uno sconto piccolo senza soglia: incoraggia il cliente ad aggiungere qualcosa in più al carrello per raggiungere la soglia, invece di limitarsi all'acquisto minimo che aveva già in mente."
        ],
      },
    ],
  },
  {
    id: "sponsorizzazioni",
    slug: "come-usare-le-sponsorizzazioni",
    title: "Come usare le sponsorizzazioni",
    description: "Le opzioni disponibili in Promozioni, e come scegliere quella giusta in base a cosa vuoi ottenere.",
    sections: [
      {
        heading: "Quattro tipi di visibilità, quattro obiettivi diversi",
        paragraphs: [
          "Prodotti in Evidenza mette fino a 5 tuoi prodotti in homepage e nei risultati di ricerca — la scelta giusta quando vuoi dare spinta a prodotti specifici, magari nuovi arrivi o articoli con margine migliore. Sponsorizzazione Homepage ti dà una posizione a rotazione o fissa nella sezione sponsorizzati della homepage — più adatta a costruire riconoscibilità del tuo negozio nel suo complesso, non di un singolo prodotto. Sponsorizzazione Categoria ti dà visibilità privilegiata in una o più categorie a scelta — utile se vuoi farti notare da chi sta già cercando proprio il tipo di prodotto che vendi. Sponsorizzato Hero ti mette da solo, senza altri prodotti intorno, in una card in evidenza contestuale alla categoria che il cliente sta guardando in quel momento — compare in più punti tra home, catalogo e pagina prodotto."
        ],
      },
      {
        heading: "Sponsorizzato Hero: mai più di uno tuo alla volta",
        paragraphs: [
          "Puoi comprare questo pacchetto per quanti prodotti vuoi — non c'è limite a quanti puoi averne sponsorizzati. Il limite riguarda cosa vede il singolo cliente in un singolo momento: sulla stessa pagina non compare mai più di un tuo prodotto contemporaneamente, anche se ne hai sponsorizzati diversi — il sistema fa ruotare quale dei tuoi prodotti mostrare, sia nel tempo sia tra i vari punti della home dove compare questo formato. Serve a garantire che lo spazio resti condiviso equamente tra tutti gli sponsor, non monopolizzato da chi ne compra di più."
        ],
      },
      {
        heading: "Guarda le statistiche prima di scegliere cosa sponsorizzare",
        paragraphs: [
          "La sezione Statistiche mostra quali prodotti stanno già generando visualizzazioni e vendite organiche — sono in genere i candidati migliori da sponsorizzare, perché la sponsorizzazione amplifica un interesse che esiste già invece di doverlo creare da zero. Sponsorizzare un prodotto che non vende nulla raramente inverte la tendenza da solo."
        ],
      },
      {
        heading: "Il codice sconto nel checkout della sponsorizzazione",
        paragraphs: [
          "Se hai un codice sconto valido sui pacchetti visibilità, lo inserisci nel passaggio di conferma che si apre cliccando \"Acquista\" su un pacchetto specifico — non prima. Il prezzo finale con lo sconto applicato è quello che vedi subito prima di procedere al pagamento, mai una sorpresa dopo."
        ],
      },
    ],
  },
];