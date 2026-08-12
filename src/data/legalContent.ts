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
  lastUpdated: "Maggio 2026",
  sections: [
    {
      heading: "1. Accettazione dei Termini",
      paragraphs: [
        "Utilizzando Oralzon, accetti integralmente i presenti Termini di Servizio. Se non accetti, non puoi utilizzare la piattaforma."
      ],
    },
    {
      heading: "2. Descrizione del Servizio",
      paragraphs: [
        "Oralzon è un marketplace B2B per prodotti odontoiatrici professionali. Funge da intermediario tra fornitori (venditori) e acquirenti (studi dentistici, laboratori odontotecnici, professionisti). Oralzon non è un venditore diretto dei prodotti presenti sulla piattaforma."
      ],
    },
    {
      heading: "3. Registrazione e Account",
      paragraphs: [
        "Per utilizzare il servizio devi registrarti con dati veritieri. Sei responsabile della sicurezza del tuo account e di tutte le attività che vi si svolgono. Oralzon si riserva di sospendere account in caso di violazioni."
      ],
    },
    {
      heading: "4. Obblighi dei Venditori",
      bullets: [
        "I venditori devono essere soggetti giuridici (imprese, P.IVA) regolarmente costituiti",
        "I prodotti odontoiatrici classificati come dispositivi medici devono rispettare la normativa MDR EU 2017/745",
        "I venditori sono responsabili della correttezza delle informazioni sui prodotti",
        "I venditori gestiscono autonomamente le spedizioni e sono responsabili della consegna",
        "Su ogni vendita conclusa si applica una commissione della piattaforma, dettagliata nelle Condizioni di Vendita; eventuali modifiche alla percentuale saranno comunicate con almeno 30 giorni di preavviso",
        "Per le vendite verso acquirenti registrati in altri paesi dell'Unione Europea, il venditore è l'unico responsabile dei propri adempimenti fiscali presso la propria Agenzia delle Entrate, incluso l'Elenco Riepilogativo delle Cessioni Intracomunitarie (Intrastat) quando dovuto. Oralzon non presenta questi adempimenti per conto del venditore"
      ],
    },
    {
      heading: "5. Pagamenti",
      paragraphs: [
        "I pagamenti sono elaborati da Stripe. Oralzon non memorizza dati delle carte di credito. In caso di mancata consegna o prodotto non conforme, l'acquirente deve contattare il venditore. Oralzon può intervenire come mediatore."
      ],
    },
    {
      heading: "6. Limitazione di Responsabilità",
      paragraphs: [
        "Oralzon non è responsabile per: la qualità dei prodotti venduti dai fornitori, i tempi di spedizione, i danni derivanti dall'uso dei prodotti. La responsabilità massima di Oralzon è limitata all'importo dell'abbonamento pagato."
      ],
    },
    {
      heading: "7. Legge Applicabile",
      paragraphs: [
        "I presenti termini sono regolati dalla legge italiana. Per qualsiasi controversia è competente il Foro di Cassino."
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
        "Le presenti Condizioni di Vendita regolano tutti gli acquisti effettuati da professionisti del settore odontoiatrico (acquirenti) attraverso la piattaforma Oralzon. I prodotti sono venduti direttamente dai fornitori iscritti (venditori) e non da Oralzon, che opera esclusivamente come intermediario tecnologico."
      ],
    },
    {
      heading: "2. Ordini e Conferma",
      paragraphs: [
        "L'ordine si perfeziona al momento della conferma del pagamento da parte di Stripe. L'acquirente riceve una email di conferma con il numero d'ordine entro pochi minuti. La conferma d'ordine costituisce accettazione dell'offerta del venditore."
      ],
    },
    {
      heading: "3. Prezzi e Pagamenti",
      bullets: [
        "Tutti i prezzi sono espressi in Euro (€) IVA inclusa per le vendite nazionali. Per le vendite tra un venditore e un acquirente registrati in due diversi paesi UE, entrambi con Partita IVA verificata, si applica il regime di inversione contabile (reverse charge): il prezzo non include IVA e l'acquirente è tenuto ad assolvere l'imposta nel proprio paese, come indicato in fattura",
        "I pagamenti sono accettati tramite carta di credito/debito via Stripe",
        "Oralzon non memorizza dati di pagamento — questi sono gestiti esclusivamente da Stripe",
        "Il pagamento è richiesto integralmente al momento dell'ordine"
      ],
    },
    {
      heading: "4. Commissioni e Abbonamento Venditori",
      paragraphs: [
        "Oralzon applica ai venditori iscritti una commissione del **7% sul valore di ogni vendita conclusa** (imponibile, IVA esclusa), trattenuta in fase di liquidazione del netto spettante al venditore. La commissione copre i costi di elaborazione dei pagamenti e i servizi offerti dalla piattaforma (gestione ordini, comunicazioni email, hosting del catalogo).",
        "L'accesso alla piattaforma richiede inoltre un abbonamento annuale al venditore, come indicato nella pagina Piani e Prezzi al momento della sottoscrizione. Eventuali codici promozionali che estendono il periodo di prova non modificano la commissione applicata sulle vendite concluse durante tale periodo.",
        "Oralzon si riserva il diritto di modificare la percentuale di commissione con un preavviso minimo di 30 giorni, comunicato via email a tutti i venditori attivi."
      ],
    },
    {
      heading: "5. Spedizioni e Consegne",
      paragraphs: [
        "Ogni venditore gestisce autonomamente le spedizioni dei propri prodotti. Oralzon non è responsabile dei tempi di consegna indicati nelle schede prodotto, che sono forniti a titolo indicativo. L'acquirente riceve notifica via email con il numero di tracking al momento della spedizione.",
        "In caso di ordini da più fornitori, i prodotti vengono spediti separatamente da ciascun venditore."
      ],
    },
    {
      heading: "6. Diritto di Recesso",
      paragraphs: [
        "Per i prodotti non personalizzati e non appartenenti alla categoria dei dispositivi medici monouso, l'acquirente ha diritto di recesso entro 30 giorni dalla ricezione, in conformità al D.Lgs. 206/2005 (Codice del Consumo). Per esercitare il recesso, contattare il venditore tramite l'indirizzo email indicato nella sua pagina store, oppure aprire una richiesta di reso dalla sezione \"I Miei Ordini\".",
        "**Eccezioni:** il diritto di recesso non si applica a prodotti monouso aperti, prodotti su misura, e prodotti soggetti a deterioramento rapido."
      ],
    },
    {
      heading: "7. Garanzie e Conformità",
      paragraphs: [
        "I venditori garantiscono, sotto la propria esclusiva responsabilità, che i prodotti pubblicati rispettano le normative vigenti, inclusa la Regolazione UE 2017/745 (MDR) per i dispositivi medici. Oralzon effettua controlli formali sui dati anagrafici e fiscali forniti in fase di registrazione, ma non verifica né garantisce la conformità normativa dei singoli prodotti, che resta interamente a carico del venditore."
      ],
    },
    {
      heading: "8. Responsabilità di Oralzon",
      paragraphs: [
        "Oralzon è responsabile unicamente del corretto funzionamento della piattaforma tecnologica. Non è responsabile per: qualità e conformità dei prodotti venduti, comportamento dei venditori, ritardi nelle consegne, danni derivanti dall'uso dei prodotti."
      ],
    },
    {
      heading: "9. Legge Applicabile e Foro",
      paragraphs: [
        "Le presenti condizioni sono regolate dalla legge italiana. Per qualsiasi controversia non risolvibile amichevolmente è competente in via esclusiva il Foro di Cassino."
      ],
    },
    {
      heading: "10. Contatti",
      paragraphs: [
        "Per qualsiasi informazione sulle condizioni di vendita: **support@oralzon.com**"
      ],
    },
  ],
};