export function Privacy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-gray-500 text-sm mb-8">Ultimo aggiornamento: Maggio 2026</p>
      <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Titolare del Trattamento</h2>
          <p>Oralzon è il titolare del trattamento dei dati personali raccolti attraverso la piattaforma. Per qualsiasi richiesta relativa alla privacy, puoi contattarci all'indirizzo: <strong>support@oralzon.com</strong></p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Dati Raccolti</h2>
          <p>Raccogliamo i seguenti dati personali:</p>
          <ul className="list-disc pl-6 space-y-1 mt-2">
            <li>Dati identificativi: nome, cognome, email</li>
            <li>Dati di contatto: numero di telefono, indirizzo</li>
            <li>Dati fiscali (per i venditori): Partita IVA, ragione sociale</li>
            <li>Dati di navigazione: IP, tipo di browser, pagine visitate</li>
            <li>Dati transazionali: storico ordini (i dati delle carte sono gestiti esclusivamente da Stripe)</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Finalità del Trattamento</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Erogazione del servizio marketplace e gestione degli ordini</li>
            <li>Gestione del rapporto contrattuale con acquirenti e venditori</li>
            <li>Invio di comunicazioni transazionali (conferma ordine, aggiornamenti spedizione)</li>
            <li>Invio di comunicazioni commerciali (solo con consenso esplicito)</li>
            <li>Adempimento di obblighi legali e fiscali</li>
            <li>Prevenzione di frodi e sicurezza della piattaforma</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Base Giuridica</h2>
          <p>Il trattamento si basa su: esecuzione del contratto (art. 6.1.b GDPR), legittimo interesse (art. 6.1.f GDPR), consenso dell'interessato (art. 6.1.a GDPR) per le comunicazioni marketing.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Conservazione dei Dati</h2>
          <p>I dati vengono conservati per il tempo strettamente necessario alle finalità per cui sono stati raccolti. I dati fiscali vengono conservati per 10 anni in conformità alla normativa tributaria italiana.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Diritti dell'Interessato</h2>
          <p>Hai il diritto di: accedere ai tuoi dati (art. 15 GDPR), rettificarli (art. 16), cancellarli (art. 17), limitarne il trattamento (art. 18), portarli ad altro titolare (art. 20), opporti al trattamento (art. 21). Per esercitare questi diritti: <strong>support@oralzon.com</strong></p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Trasferimento dei Dati</h2>
          <p>I dati possono essere trasferiti a fornitori di servizi tecnici (Supabase, Stripe, Resend) che operano come responsabili del trattamento in conformità al GDPR e con garanzie adeguate per i trasferimenti extra-UE.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Reclami</h2>
          <p>Hai il diritto di proporre reclamo al Garante per la Protezione dei Dati Personali (www.garanteprivacy.it) se ritieni che il trattamento violi il GDPR.</p>
        </section>
      </div>
    </div>
  );
}
