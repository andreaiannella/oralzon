export function Cookie() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Cookie Policy</h1>
      <p className="text-gray-500 text-sm mb-8">Ultimo aggiornamento: Maggio 2026</p>
      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Cosa sono i Cookie</h2>
          <p>I cookie sono piccoli file di testo che i siti visitati salvano sul dispositivo dell'utente. Permettono al sito di ricordare le preferenze e migliorare l'esperienza di navigazione.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Cookie Tecnici (necessari)</h2>
          <p>Questi cookie sono indispensabili per il funzionamento della piattaforma e non possono essere disabilitati:</p>
          <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
            {[
              { name: 'supabase-auth-token', scopo: 'Gestione della sessione di autenticazione', durata: 'Sessione' },
              { name: 'oralzon_cart_v2', scopo: 'Salvataggio degli articoli nel carrello', durata: 'Persistente' },
            ].map(c => (
              <div key={c.name} className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 last:border-0">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded w-48 flex-shrink-0">{c.name}</code>
                <span className="flex-1 text-xs">{c.scopo}</span>
                <span className="text-xs text-gray-400">{c.durata}</span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Cookie Analitici (opzionali)</h2>
          <p>Con il tuo consenso, utilizziamo cookie analitici per capire come gli utenti interagiscono con la piattaforma e migliorarne l'usabilità. I dati sono aggregati e anonimi.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Gestione dei Cookie</h2>
          <p>Puoi gestire le preferenze cookie dal tuo browser. La disabilitazione dei cookie tecnici potrebbe compromettere il funzionamento della piattaforma. Per maggiori informazioni: <strong>support@oralzon.com</strong></p>
        </section>
      </div>
    </div>
  );
}
