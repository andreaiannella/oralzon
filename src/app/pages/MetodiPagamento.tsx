import { CreditCard, Smartphone, Landmark, Lock, CheckCircle } from 'lucide-react';

export function MetodiPagamento() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Metodi di Pagamento</h1>
      <p className="text-gray-500 text-sm mb-8">Come funzionano i pagamenti su Oralzon</p>
      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">

        <section className="bg-accent border border-oralzon-mint-fresh/30 rounded-xl p-6">
          <h2 className="text-lg font-bold text-oralzon-steel-ink mb-3">Pagamento Sicuro con Stripe</h2>
          <p>Tutti i pagamenti su Oralzon sono elaborati da <strong>Stripe</strong>, il sistema di pagamento online più sicuro al mondo, utilizzato da Amazon, Google e migliaia di aziende Fortune 500.</p>
          <p className="mt-2">Oralzon <strong>non memorizza mai</strong> i dati della tua carta di credito. Ogni transazione avviene in un ambiente crittografato direttamente su infrastruttura Stripe.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Metodi Accettati</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: CreditCard, title: 'Carte di Credito / Debito', desc: 'Visa, Mastercard, American Express, Maestro. Supporto per carte aziendali e corporate.' },
              { icon: Smartphone, title: 'Apple Pay / Google Pay', desc: 'Pagamento rapido da dispositivi mobili con autenticazione biometrica.' },
              { icon: Landmark, title: 'SEPA Addebito Diretto', desc: 'Per acquisti ricorrenti e abbonamenti. Richiede autorizzazione esplicita.' },
              { icon: Lock, title: '3D Secure 2.0', desc: 'Autenticazione rinforzata automatica per transazioni superiori alle soglie PSD2.' },
            ].map(m => (
              <div key={m.title} className="border border-gray-200 rounded-xl p-4">
                <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center mb-2"><m.icon className="w-5 h-5 text-primary" /></div>
                <h3 className="font-bold text-gray-900 mb-1">{m.title}</h3>
                <p className="text-xs text-gray-500">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Sicurezza e Protezione</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /><span>Crittografia SSL/TLS 256-bit su tutte le transazioni</span></li>
            <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /><span>Conformità PCI DSS Level 1 — massimo standard di sicurezza per i pagamenti</span></li>
            <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /><span>Monitoraggio antifrode in tempo reale con machine learning</span></li>
            <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /><span>Direttiva PSD2 / Strong Customer Authentication (SCA) implementata</span></li>
            <li className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /><span>I dati carta non transitano mai sui server Oralzon</span></li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Tempistiche di Addebito e Rimborso</h2>
          <div className="space-y-3">
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg"><span className="font-medium text-gray-700 w-32 flex-shrink-0">Addebito:</span><span>Immediato al momento della conferma dell'ordine</span></div>
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg"><span className="font-medium text-gray-700 w-32 flex-shrink-0">Rimborso:</span><span>Entro 5-10 giorni lavorativi dalla data di approvazione del reso</span></div>
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg"><span className="font-medium text-gray-700 w-32 flex-shrink-0">Abbonamenti:</span><span>Addebito mensile automatico, cancellabile in qualsiasi momento dalla dashboard</span></div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Fatturazione</h2>
          <p>Ogni transazione genera automaticamente una ricevuta di pagamento inviata via email. Per la fatturazione fiscale, ogni venditore è responsabile dell'emissione della propria fattura. Oralzon emette fattura per gli abbonamenti di visibilità e i piani venditori.</p>
          <p className="mt-2">Per richieste di fatturazione: <strong>support@oralzon.com</strong></p>
        </section>

      </div>
    </div>
  );
}
