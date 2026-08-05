import { useTranslation } from 'react-i18next';
export function CondizioniVendita() {
  const { t } = useTranslation();
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{t('legalPages.condizioniVenditaTitle')}</h1>
      <p className="text-gray-500 text-sm mb-8">{t('legalPages.lastUpdated')}: Agosto 2026</p>
      <div className="bg-accent border border-oralzon-mint-fresh/30 rounded-lg p-3 text-xs text-oralzon-steel-ink mb-6">{t('legalPages.italianNotice')}</div>
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
            <li>Tutti i prezzi sono espressi in Euro (€) IVA inclusa per le vendite nazionali. Per le vendite tra un venditore e un acquirente registrati in due diversi paesi UE, entrambi con Partita IVA verificata, si applica il regime di inversione contabile (reverse charge): il prezzo non include IVA e l'acquirente è tenuto ad assolvere l'imposta nel proprio paese, come indicato in fattura</li>
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
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Divieto di Elusione della Piattaforma</h2>
          <p>È espressamente vietato ai venditori sollecitare un acquirente, con cui siano entrati in contatto tramite Oralzon, a concludere transazioni al di fuori della piattaforma al fine di evitare la commissione dovuta — a titolo esemplificativo: proporre pagamenti diretti, fatturazione parallela, o l'uso di canali di contatto (telefono, email, messaggistica) per definire ordini futuri che non transitano da Oralzon.</p>
          <p className="mt-2">Oralzon si riserva il diritto di effettuare verifiche periodiche, inclusi ordini di controllo, per accertare il rispetto di questo divieto. In caso di violazione accertata, Oralzon può sospendere o disattivare permanentemente l'account del venditore coinvolto, fatto salvo il diritto di richiedere il pagamento delle commissioni dovute sulle transazioni eluse, ove dimostrabili.</p>
          <p className="mt-2">Lo stesso divieto si applica, in senso inverso, a un acquirente che solleciti attivamente un venditore a concludere la vendita fuori piattaforma.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Spedizioni e Consegne</h2>
          <p>Ogni venditore gestisce autonomamente le spedizioni dei propri prodotti. Oralzon non è responsabile dei tempi di consegna indicati nelle schede prodotto, che sono forniti a titolo indicativo. L'acquirente riceve notifica via email con il numero di tracking al momento della spedizione.</p>
          <p className="mt-2">In caso di ordini da più fornitori, i prodotti vengono spediti separatamente da ciascun venditore.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Diritto di Recesso</h2>
          <p>Per i prodotti non personalizzati e non appartenenti alla categoria dei dispositivi medici monouso, l'acquirente ha diritto di recesso entro 30 giorni dalla ricezione, in conformità al D.Lgs. 206/2005 (Codice del Consumo). Per esercitare il recesso, contattare il venditore tramite l'indirizzo email indicato nella sua pagina store, oppure aprire una richiesta di reso dalla sezione "I Miei Ordini".</p>
          <p className="mt-2"><strong>Eccezioni:</strong> il diritto di recesso non si applica a prodotti monouso aperti, prodotti su misura, e prodotti soggetti a deterioramento rapido.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Garanzie e Conformità</h2>
          <p>I venditori garantiscono, sotto la propria esclusiva responsabilità, che i prodotti pubblicati rispettano le normative vigenti, inclusa la Regolazione UE 2017/745 (MDR) per i dispositivi medici. Oralzon effettua controlli formali sui dati anagrafici e fiscali forniti in fase di registrazione, ma non verifica né garantisce la conformità normativa dei singoli prodotti, che resta interamente a carico del venditore.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. Responsabilità di Oralzon</h2>
          <p>Oralzon è responsabile unicamente del corretto funzionamento della piattaforma tecnologica. Non è responsabile per: qualità e conformità dei prodotti venduti, comportamento dei venditori, ritardi nelle consegne, danni derivanti dall'uso dei prodotti.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">10. Legge Applicabile e Foro</h2>
          <p>Le presenti condizioni sono regolate dalla legge italiana. Per qualsiasi controversia non risolvibile amichevolmente è competente in via esclusiva il Foro di Roma.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">11. Contatti</h2>
          <p>Per qualsiasi informazione sulle condizioni di vendita: <strong>support@oralzon.com</strong></p>
        </section>
      </div>
    </div>
  );
}
