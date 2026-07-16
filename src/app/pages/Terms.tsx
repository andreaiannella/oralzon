import { useTranslation } from 'react-i18next';
export function Terms() {
  const { t } = useTranslation();
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{t('legalPages.termsTitle')}</h1>
      <p className="text-gray-500 text-sm mb-8">{t('legalPages.lastUpdated')}: Maggio 2026</p>
      <div className="bg-accent border border-oralzon-mint-fresh/30 rounded-lg p-3 text-xs text-oralzon-steel-ink mb-6">{t('legalPages.italianNotice')}</div>
      <div className="space-y-6 text-gray-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Accettazione dei Termini</h2>
          <p>Utilizzando Oralzon, accetti integralmente i presenti Termini di Servizio. Se non accetti, non puoi utilizzare la piattaforma.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Descrizione del Servizio</h2>
          <p>Oralzon è un marketplace B2B per prodotti odontoiatrici professionali. Funge da intermediario tra fornitori (venditori) e acquirenti (studi dentistici, laboratori odontotecnici, professionisti). Oralzon non è un venditore diretto dei prodotti presenti sulla piattaforma.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Registrazione e Account</h2>
          <p>Per utilizzare il servizio devi registrarti con dati veritieri. Sei responsabile della sicurezza del tuo account e di tutte le attività che vi si svolgono. Oralzon si riserva di sospendere account in caso di violazioni.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Obblighi dei Venditori</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>I venditori devono essere soggetti giuridici (imprese, P.IVA) regolarmente costituiti</li>
            <li>I prodotti odontoiatrici classificati come dispositivi medici devono rispettare la normativa MDR EU 2017/745</li>
            <li>I venditori sono responsabili della correttezza delle informazioni sui prodotti</li>
            <li>I venditori gestiscono autonomamente le spedizioni e sono responsabili della consegna</li>
            <li>Su ogni vendita conclusa si applica una commissione della piattaforma, dettagliata nelle Condizioni di Vendita; eventuali modifiche alla percentuale saranno comunicate con almeno 30 giorni di preavviso</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Pagamenti</h2>
          <p>I pagamenti sono elaborati da Stripe. Oralzon non memorizza dati delle carte di credito. In caso di mancata consegna o prodotto non conforme, l'acquirente deve contattare il venditore. Oralzon può intervenire come mediatore.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Limitazione di Responsabilità</h2>
          <p>Oralzon non è responsabile per: la qualità dei prodotti venduti dai fornitori, i tempi di spedizione, i danni derivanti dall'uso dei prodotti. La responsabilità massima di Oralzon è limitata all'importo dell'abbonamento pagato.</p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Legge Applicabile</h2>
          <p>I presenti termini sono regolati dalla legge italiana. Per qualsiasi controversia è competente il Foro di Roma.</p>
        </section>
      </div>
    </div>
  );
}
