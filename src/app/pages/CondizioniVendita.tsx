export function CondizioniVendita() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Condizioni di Vendita</h1>
      <p className="text-gray-500 text-sm mb-8">Ultimo aggiornamento: Luglio 2026</p>
      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Ambito di applicazione</h2>
          <p>Le presenti Condizioni di Vendita regolano tutti gli acquisti effettuati da professionisti del settore odontoiatrico (acquirenti) attraverso la piattaforma Oralzon. I prodotti sono venduti direttamente dai fornitori iscritti (venditori) e non da Oralzon, che opera esclusivamente come intermediario tecnologico.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Ordini e Conferma</h2>
          <p>L'ordine si perfeziona al momento della conferma del pagamento da parte di Stripe. L'acquirente riceve una email di conferma con il numero d'ordine entro pochi minuti. La conferma d'ordine costituisce accettazione dell'offerta del venditore.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Prezzi e Pagamenti</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Tutti i prezzi sono espressi in Euro (€) IVA inclusa salvo diversa indicazione</li>
            <li>I pagamenti sono accettati tramite carta di credito/debito via Stripe</li>
            <li>Oralzon non memorizza dati di pagamento — questi sono gestiti esclusivamente da Stripe</li>
            <li>Il pagamento è richiesto integralmente al momento dell'ordine</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Commissioni e Abbonamento Venditori</h2>
          <p>Oralzon applica ai venditori iscritti una commissione del <strong>7% sul valore di ogni vendita conclusa</strong> (imponibile, IVA esclusa), trattenuta in fase di liquidazione del netto spettante al venditore. La commissione copre i costi di elaborazione dei pagamenti e i servizi offerti dalla piattaforma (gestione ordini, comunicazioni email, hosting del catalogo).</p>
          <p className="mt-2">L'accesso alla piattaforma richiede inoltre un abbonamento mensile secondo il piano scelto dal venditore, come indicato nella pagina Piani e Prezzi al momento della sottoscrizione. Eventuali codici promozionali che estendono il periodo di prova non modificano la commissione applicata sulle vendite concluse durante tale periodo.</p>
          <p className="mt-2">Oralzon si riserva il diritto di modificare la percentuale di commissione con un preavviso minimo di 30 giorni, comunicato via email a tutti i venditori attivi.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Spedizioni e Consegne</h2>
          <p>Ogni venditore gestisce autonomamente le spedizioni dei propri prodotti. Oralzon non è responsabile dei tempi di consegna indicati nelle schede prodotto, che sono forniti a titolo indicativo. L'acquirente riceve notifica via email con il numero di tracking al momento della spedizione.</p>
          <p className="mt-2">In caso di ordini da più fornitori, i prodotti vengono spediti separatamente da ciascun venditore.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Diritto di Recesso</h2>
          <p>Per i prodotti non personalizzati e non appartenenti alla categoria dei dispositivi medici monouso, l'acquirente ha diritto di recesso entro 30 giorni dalla ricezione, in conformità al D.Lgs. 206/2005 (Codice del Consumo). Per esercitare il recesso, contattare il venditore tramite l'indirizzo email indicato nella sua pagina store, oppure aprire una richiesta di reso dalla sezione "I Miei Ordini".</p>
          <p className="mt-2"><strong>Eccezioni:</strong> il diritto di recesso non si applica a prodotti monouso aperti, prodotti su misura, e prodotti soggetti a deterioramento rapido.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Garanzie e Conformità</h2>
          <p>I venditori garantiscono che i prodotti rispettano le normative vigenti, inclusa la Regolazione UE 2017/745 (MDR) per i dispositivi medici. Oralzon verifica la documentazione dei venditori al momento dell'iscrizione, ma non è responsabile di eventuali non conformità dei prodotti.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Responsabilità di Oralzon</h2>
          <p>Oralzon è responsabile unicamente del corretto funzionamento della piattaforma tecnologica. Non è responsabile per: qualità e conformità dei prodotti venduti, comportamento dei venditori, ritardi nelle consegne, danni derivanti dall'uso dei prodotti.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. Legge Applicabile e Foro</h2>
          <p>Le presenti condizioni sono regolate dalla legge italiana. Per qualsiasi controversia non risolvibile amichevolmente è competente in via esclusiva il Foro di Roma.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">10. Contatti</h2>
          <p>Per qualsiasi informazione sulle condizioni di vendita: <strong>support@oralzon.com</strong></p>
        </section>
      </div>
    </div>
  );
}
