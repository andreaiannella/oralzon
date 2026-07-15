import { useState } from 'react';
import { Mail, HelpCircle, Send, Store, ShoppingCart, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { callEdge } from '../../lib/edgeApi';

export function Contact() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const res = await callEdge('/contact-form', { body: form });
      if (!res.success) throw new Error(res.error || 'Invio non riuscito');
      setResult({ type: 'success', text: 'Messaggio inviato! Ti risponderemo entro 1-2 giorni lavorativi.' });
      setForm({ firstName: '', lastName: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setResult({ type: 'error', text: err.message || 'Invio non riuscito, riprova più tardi o scrivici direttamente a support@oralzon.com' });
    } finally {
      setSending(false);
    }
  };

  const faqs = [
    {
      q: 'Chi gestisce la spedizione dei prodotti?',
      a: 'Oralzon è un marketplace: ogni fornitore gestisce autonomamente la spedizione dei propri prodotti. I tempi di consegna variano da venditore a venditore e sono indicati nella scheda prodotto. Riceverai un\u2019email con il tracking non appena il venditore spedisce il tuo ordine.'
    },
    {
      q: 'Chi stabilisce i prezzi dei prodotti?',
      a: 'I prezzi sono definiti autonomamente da ciascun fornitore in base alle proprie condizioni commerciali. Oralzon non applica sconti o listini propri: eventuali offerte per acquisti multipli o clienti ricorrenti dipendono dalle politiche del singolo venditore.'
    },
    {
      q: 'I prodotti venduti sono certificati?',
      a: 'Ogni fornitore che opera su Oralzon è tenuto a garantire che i propri prodotti rispettino la normativa MDR (UE 2017/745) sui dispositivi medici. La responsabilità della conformità dei singoli prodotti resta in capo al venditore che li commercializza.'
    },
    {
      q: 'Come contatto un venditore per una domanda su un ordine?',
      a: 'Vai sulla pagina pubblica dello store del venditore (clicca sul suo nome da un prodotto o da un tuo ordine) e usa l\u2019indirizzo email di contatto indicato lì per scrivergli direttamente.'
    },
    {
      q: 'Come funziona un reso?',
      a: 'Dalla sezione "I Miei Ordini" puoi richiedere il reso di un prodotto già spedito. Il venditore esaminerà la richiesta ed entro 48-72 ore ti risponderà con l\u2019esito. Se approvato, il rimborso viene elaborato automaticamente sul tuo metodo di pagamento originale una volta che il venditore conferma la ricezione del prodotto reso.'
    },
    {
      q: 'Oralzon applica commissioni sulle vendite?',
      a: 'Sì, applichiamo una commissione sulle vendite concluse, comprensiva dei costi di elaborazione del pagamento e del servizio piattaforma. Il dettaglio è indicato nelle Condizioni di Vendita. Per i primi venditori che si iscrivono offriamo inoltre 6 mesi di abbonamento gratuito.'
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-accent via-white to-accent/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-5xl mb-6">Contattaci</h1>
            <p className="text-xl text-muted-foreground">
              Siamo un marketplace B2B per il settore odontoiatrico. Per domande sulla piattaforma, il tuo account
              o problemi tecnici, scrivici: ti risponderemo il prima possibile.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <div className="bg-white rounded-2xl p-8 border border-border">
              <h2 className="text-3xl mb-6">Inviaci un Messaggio</h2>
              <form className="space-y-6" onSubmit={handleSubmit}>
                {result && (
                  <div className={`flex items-start gap-3 p-4 rounded-lg text-sm ${result.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {result.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                    {result.text}
                  </div>
                )}
                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block mb-2">Nome</label>
                    <input type="text" id="firstName" required value={form.firstName}
                      onChange={e => setForm({ ...form, firstName: e.target.value })}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      placeholder="Mario" />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block mb-2">Cognome</label>
                    <input type="text" id="lastName" required value={form.lastName}
                      onChange={e => setForm({ ...form, lastName: e.target.value })}
                      className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                      placeholder="Rossi" />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block mb-2">Email</label>
                  <input type="email" id="email" required value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    placeholder="mario.rossi@studio.it" />
                </div>

                <div>
                  <label htmlFor="subject" className="block mb-2">Oggetto</label>
                  <select id="subject" value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white">
                    <option value="">Seleziona un'opzione</option>
                    <option value="order">Domanda su un ordine</option>
                    <option value="account">Problema con l'account</option>
                    <option value="vendor">Voglio diventare venditore</option>
                    <option value="technical">Problema tecnico sul sito</option>
                    <option value="other">Altro</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block mb-2">Messaggio</label>
                  <textarea id="message" rows={6} required value={form.message}
                    onChange={e => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white resize-none"
                    placeholder="Scrivi qui il tuo messaggio..." />
                </div>

                <button type="submit" disabled={sending}
                  className="w-full px-8 py-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {sending ? 'Invio in corso...' : 'Invia Messaggio'}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-border">
              <h2 className="text-2xl mb-6">Contatto Diretto</h2>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="mb-1">Email</h3>
                  <p className="text-muted-foreground">support@oralzon.com</p>
                  <p className="text-sm text-muted-foreground mt-1">Ti rispondiamo entro 1-2 giorni lavorativi.</p>
                </div>
              </div>
            </div>

            {/* Chiarimento marketplace */}
            <div className="bg-accent rounded-2xl p-8 border border-border">
              <div className="flex items-center gap-3 mb-4">
                <Store className="w-6 h-6 text-primary flex-shrink-0" />
                <h3 className="text-xl">Hai una domanda su un ordine o un prodotto?</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Oralzon è un marketplace: prodotti, spedizioni e resi sono gestiti direttamente dai singoli venditori,
                non da noi. Per domande specifiche su un ordine ti conviene contattare direttamente il venditore.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <ShoppingCart className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Vai su "I Miei Ordini" e trova il prodotto interessato</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Store className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Clicca sul nome del venditore per aprire la sua vetrina</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Usa l'email di contatto pubblicata nella sua pagina store</span>
                </div>
              </div>
              <Link to="/account/ordini" className="inline-block mt-5 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
                Vai ai miei ordini
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 border border-border">
              <div className="flex items-center gap-3 mb-3">
                <HelpCircle className="w-6 h-6 text-primary flex-shrink-0" />
                <h3 className="text-xl">Come possiamo aiutarti noi</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Problemi tecnici con il sito o l'account</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Dispute non risolte con un venditore</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Informazioni per diventare venditore</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Segnalazioni e feedback sulla piattaforma</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl mb-4">Domande Frequenti</h2>
            <p className="text-xl text-muted-foreground">
              Le risposte alle domande più comuni sul funzionamento del marketplace
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {faqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl p-6 border border-border">
                <h3 className="mb-3">{faq.q}</h3>
                <p className="text-muted-foreground">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
