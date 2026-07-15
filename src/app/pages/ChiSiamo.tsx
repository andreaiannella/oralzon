import { Link } from 'react-router-dom';
import { Shield, Users, Zap, TrendingUp, Star, ArrowRight } from 'lucide-react';
import logo from '../imports/logo_on_light.png';

export function ChiSiamo() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#003366] via-[#0055AA] to-[#0077CC] text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-oralzon-pale-mint uppercase tracking-widest text-sm font-medium mb-4">Il Marketplace B2B dell'Odontoiatria Italiana</p>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            Dove i Professionisti<br />del Dentale si Incontrano
          </h1>
          <p className="text-xl text-oralzon-pale-mint max-w-2xl mx-auto leading-relaxed">
            Oralzon nasce con un obiettivo preciso: eliminare le inefficienze tra chi produce strumenti e materiali odontoiatrici di eccellenza e chi li utilizza ogni giorno per trasformare sorrisi.
          </p>
        </div>
      </section>

      {/* Missione */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-primary font-semibold uppercase tracking-wide text-sm mb-3">La nostra missione</p>
              <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                Costruiamo il futuro dell'odontoiatria professionale
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Ogni giorno, migliaia di studi dentistici e laboratori odontotecnici in Italia affrontano la stessa sfida: trovare i fornitori giusti, confrontare prodotti certificati, gestire ordini in modo efficiente. Il tutto mentre le loro priorità — i pazienti — aspettano.
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                Oralzon risolve questo problema alla radice. Abbiamo creato una piattaforma dove ogni prodotto è verificato, ogni fornitore è accreditato, e ogni transazione è protetta. Perché nella salute orale non c'è spazio per compromessi.
              </p>
              <Link to="/negozio" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                Esplora il Catalogo <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield, title: 'Fornitori Verificati', desc: 'Ogni venditore è sottoposto a verifica della documentazione aziendale e delle certificazioni prodotto.' },
                { icon: Zap, title: 'Ordini in Tempo Reale', desc: 'Dalla conferma del pagamento alla notifica di spedizione, tutto è automatizzato e tracciabile.' },
                { icon: Users, title: 'Solo Professionisti', desc: 'Una community esclusiva di odontoiatri, igienisti, odontotecnici e responsabili acquisti.' },
                { icon: TrendingUp, title: 'Spedizioni Tracciate', desc: 'Ogni ordine è monitorabile dalla conferma alla consegna, con notifiche automatiche ad ogni passaggio.' },
              ].map(item => (
                <div key={item.title} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Perché sceglierci */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-primary font-semibold uppercase tracking-wide text-sm mb-3">Perché Oralzon</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Il mercato dentale merita uno standard più alto</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-14 leading-relaxed">
            Abbiamo analizzato i processi di approvvigionamento di centinaia di studi dentistici italiani. Il risultato? Ore perse su cataloghi cartacei, ordini via fax, preventivi che non arrivano. Oralzon è la risposta.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {[
              { num: '100%', label: 'Fornitori certificati', text: 'Ogni prodotto presente su Oralzon rispetta le normative MDR EU 2017/745 per i dispositivi medici. Sicurezza non è un optional.' },
              { num: 'B2B', label: 'Esclusivamente professionale', text: 'Non siamo un sito di e-commerce generico. Ogni funzionalità è progettata per le esigenze specifiche di chi lavora nel dentale.' },
              { num: '24/7', label: 'Supporto e aggiornamenti', text: 'Il mercato odontoiatrico evolve. La nostra piattaforma si aggiorna continuamente per stare al passo con normative, tecnologie e best practice.' },
            ].map(item => (
              <div key={item.num} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="text-4xl font-bold text-primary mb-2">{item.num}</div>
                <div className="font-bold text-gray-900 mb-3">{item.label}</div>
                <p className="text-gray-500 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Per i venditori */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-primary to-primary rounded-3xl p-12 text-white">
            <div className="max-w-2xl">
              <p className="text-oralzon-pale-mint uppercase tracking-wide text-sm font-medium mb-3">Per i fornitori</p>
              <h2 className="text-3xl font-bold mb-4">Raggiungi migliaia di professionisti senza intermediari</h2>
              <p className="text-oralzon-pale-mint leading-relaxed mb-6">
                Su Oralzon carichi i tuoi prodotti, gestisci gli ordini dalla tua dashboard, spedisci direttamente al cliente. Semplice, efficiente, redditizio.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link to="/diventa-venditore" className="px-6 py-3 bg-white text-primary rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                  Vendi su Oralzon
                </Link>
                <Link to="/pricing-venditori" className="px-6 py-3 border-2 border-white/50 text-white rounded-xl hover:bg-white/10 transition-colors">
                  Scopri i Piani
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Per gli acquirenti */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-primary font-semibold uppercase tracking-wide text-sm mb-3">Per gli acquirenti</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Tutto quello che serve allo studio, in un unico posto</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Monouso certificato, strumenti di sterilizzazione, kit per implantologia, materiali protesici. Ordina da più fornitori in un unico checkout, traccia ogni spedizione, gestisci resi in modo semplice.
          </p>
          <div className="flex items-center justify-center gap-2 mb-8">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
            <span className="text-gray-600 text-sm ml-2">Scelto dai professionisti del dentale italiano</span>
          </div>
          <Link to="/negozio" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors text-lg">
            Inizia ad Acquistare <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
}
