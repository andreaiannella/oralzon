import { useTranslation } from 'react-i18next';
export function Cookie() {
  const { t } = useTranslation();
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{t('legalPages.cookieTitle')}</h1>
      <p className="text-gray-500 text-sm mb-8">{t('legalPages.lastUpdated')}: Maggio 2026</p>
      <div className="bg-accent border border-oralzon-mint-fresh/30 rounded-lg p-3 text-xs text-oralzon-steel-ink mb-6">{t('legalPages.italianNotice')}</div>
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
          <p>Con il tuo consenso, utilizziamo Google Analytics per capire come gli utenti interagiscono con la piattaforma e migliorarne l'usabilità. I dati sono aggregati; questi cookie vengono impostati solo se hai accettato dal banner.</p>
          <div className="mt-3 border border-gray-200 rounded-xl overflow-hidden">
            {[
              { name: '_ga, _ga_*', scopo: 'Google Analytics — distingue gli utenti in forma anonima/aggregata', durata: 'Fino a 2 anni' },
            ].map(c => (
              <div key={c.name} className="flex items-center gap-4 px-4 py-3">
                <code className="text-xs bg-gray-100 px-2 py-1 rounded w-48 flex-shrink-0">{c.name}</code>
                <span className="flex-1 text-xs">{c.scopo}</span>
                <span className="text-xs text-gray-400">{c.durata}</span>
              </div>
            ))}
          </div>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Gestione dei Cookie</h2>
          <p className="mb-3">Puoi cambiare la tua scelta sui cookie analitici in qualsiasi momento:</p>
          <button
            onClick={() => window.dispatchEvent(new Event('oralzon-reopen-cookie-banner'))}
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Gestisci le tue preferenze cookie
          </button>
          <p className="mt-3">Puoi anche gestire i cookie direttamente dal tuo browser. La disabilitazione dei cookie tecnici potrebbe compromettere il funzionamento della piattaforma. Per maggiori informazioni: <strong>support@oralzon.com</strong></p>
        </section>
      </div>
    </div>
  );
}
