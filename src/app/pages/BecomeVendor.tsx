import { Link } from 'react-router-dom';
import { CheckCircle, ArrowRight, Package, TrendingUp, Shield, Zap, Truck, BarChart3, Star } from 'lucide-react';

const benefits = [
  { icon: Package, title: 'Catalogo Digitale Professionale', desc: 'Carica i tuoi prodotti con immagini, specifiche tecniche, certificazioni. Il tuo catalogo sempre aggiornato e accessibile.' },
  { icon: TrendingUp, title: 'Pagamenti Puntuali', desc: 'Incassi tracciati automaticamente ad ogni vendita, con report vendite mensile sempre disponibile in dashboard.' },
  { icon: Shield, title: 'Clienti Qualificati B2B', desc: 'I tuoi acquirenti sono professionisti del dentale — studi, cliniche, laboratori. Non consumatori generici.' },
  { icon: Zap, title: 'Gestione Ordini Automatizzata', desc: 'Ricevi un\u2019email a ogni nuovo ordine. Aggiorna lo stato di spedizione e il tracking direttamente dalla dashboard.' },
  { icon: Truck, title: 'Spedisci tu, Noi Gestiamo il Resto', desc: 'Tu gestisci la spedizione come preferisci. Noi gestiamo il pagamento, la comunicazione con il cliente e il tracking.' },
  { icon: BarChart3, title: 'Dashboard Analitica', desc: 'Visualizza le performance del tuo catalogo: prodotti più venduti, ordini e fatturato mensile.' },
];

const steps = [
  { step: '01', title: 'Registrati Gratis', desc: '6 mesi di accesso completo senza carta di credito. Carica i tuoi prodotti e scopri la piattaforma.' },
  { step: '02', title: 'Carica il Catalogo', desc: 'Aggiungi prodotti uno per uno o importa tutto via Excel. Immagini, prezzi, descrizioni, certificazioni MDR.' },
  { step: '03', title: 'Ricevi Ordini', desc: 'I professionisti trovano i tuoi prodotti, li acquistano e tu ricevi subito un\u2019email di notifica. Spedisci e incassi.' },
];

const features = [
  'Dashboard venditore professionale',
  'Upload singolo e massivo prodotti',
  'Import catalogo via file Excel',
  'Gestione ordini e spedizioni',
  'Tracciamento spedizioni con tracking',
  'Promozione prodotti in evidenza',
  'Gestione inventario e stock',
  'Badge venditore verificato',
  'Statistiche vendite in tempo reale',
  'Supporto tecnico prioritario',
  'Notifiche email automatiche',
  'Pagamenti sicuri via Stripe',
];

export function BecomeVendor() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Vendi i Tuoi Prodotti su Oralzon
              </h1>
              <p className="text-xl text-oralzon-pale-mint mb-8 leading-relaxed">
                Raggiungi dentisti, cliniche e professionisti del settore odontoiatrico con il marketplace verticale più specializzato d'Italia.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Link to="/registrazione-venditore" className="px-8 py-4 bg-white text-primary rounded-xl font-bold hover:bg-gray-100 transition-colors text-center">
                  Inizia Gratis — 7 Giorni
                </Link>
                <Link to="/pricing-venditori" className="px-8 py-4 border-2 border-white/60 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors text-center">
                  Vedi i Piani
                </Link>
              </div>
              <div className="flex items-center gap-2 text-oralzon-pale-mint text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Nessun costo di attivazione · Prima settimana gratuita · 6 mesi di abbonamento in regalo per i primi venditori</span>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&q=80"
                alt="Fornitore prodotti odontoiatrici professionale"
                className="rounded-2xl shadow-2xl w-full object-cover max-h-96"
                onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80'; }}
              />
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Nuovo ordine ricevuto</p>
                    <p className="text-xs text-gray-500">Studio Dr. Bianchi · €234,00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Perché Vendere su Oralzon</h2>
            <p className="text-xl text-gray-500">Tutto ciò che ti serve per crescere nel settore odontoiatrico</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Come Funziona</h2>
            <p className="text-gray-500">Inizia a vendere in meno di 30 minuti</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-5">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-4">
                    <ArrowRight className="w-8 h-8 text-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-4">Funzionalità per Venditori</h2>
              <p className="text-xl text-gray-500 mb-8">Tutti gli strumenti di cui hai bisogno, disponibili da subito</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1629909615184-74f495363b67?w=800&q=80"
                alt="Strumenti odontoiatrici professionali"
                className="rounded-2xl shadow-xl w-full object-cover max-h-96"
                onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'; }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing preview — aggiornato */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Piano Pensato per il B2B Dentale</h2>
            <p className="text-gray-500">Primi 6 mesi di abbonamento gratis per chi si iscrive ora con il codice promozionale di lancio.</p>
          </div>
          <div className="max-w-md mx-auto">
            {/* Piano unico */}
            <div className="bg-primary text-white rounded-2xl p-8 shadow-2xl shadow-primary/30 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">6 MESI GRATIS AL LANCIO</div>
              <h3 className="text-2xl font-bold mb-2">Piano Venditore</h3>
              <div className="text-4xl font-bold mb-1">€129<span className="text-lg opacity-80 font-normal">/mese</span></div>
              <p className="text-sm text-oralzon-pale-mint font-medium mb-6">Prodotti illimitati</p>
              <ul className="space-y-2 mb-8 text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Prodotti illimitati</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Upload massivo Excel</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Badge venditore verificato</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Statistiche vendite avanzate</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Supporto prioritario</li>
              </ul>
              <Link to="/pricing-venditori" className="block w-full px-6 py-3 bg-white text-primary rounded-xl hover:bg-gray-100 transition-colors text-center font-bold">
                Acquista
              </Link>
            </div>
          </div>
          <p className="text-center text-gray-500 text-sm mt-8">
            Tutti i piani includono: commissione sulle vendite (dettaglio nelle Condizioni di Vendita) · Gestione ordini · Upload immagini · Email transazionali
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Pronto a Vendere su Oralzon?</h2>
          <p className="text-xl mb-8 text-oralzon-pale-mint">Inizia con 6 mesi gratuiti. Nessuna carta di credito richiesta.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/registrazione-venditore" className="px-8 py-4 bg-white text-primary rounded-xl font-bold hover:bg-gray-100 transition-colors">
              Registrati Gratis
            </Link>
            <Link to="/contatti" className="px-8 py-4 border-2 border-white/60 text-white rounded-xl hover:bg-white/10 transition-colors">
              Parla con il Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
