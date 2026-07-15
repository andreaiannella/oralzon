import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  { cat: "Per i Clienti", items: [
    { q: "Come mi registro su Oralzon?", a: "Clicca su 'Accedi' in alto a destra, poi su 'Crea Account Cliente'. Inserisci nome, email e password. Puoi iniziare ad acquistare subito dopo la registrazione." },
    { q: "Come funziona il checkout e il pagamento?", a: "Aggiungi prodotti al carrello, vai al checkout, inserisci l'indirizzo di spedizione e procedi al pagamento sicuro tramite Stripe. Accettiamo tutte le principali carte di credito e debito." },
    { q: "Chi gestisce la spedizione?", a: "Ogni fornitore gestisce la spedizione dei propri prodotti in autonomia. Riceverai una notifica con il numero di tracking non appena il pacco verrà spedito." },
    { q: "Posso acquistare prodotti da più fornitori in un solo ordine?", a: "Sì, puoi aggiungere prodotti da più fornitori nello stesso carrello. La spedizione verrà gestita separatamente da ciascun fornitore." },
    { q: "Come posso tracciare il mio ordine?", a: "Vai su 'I miei ordini' nel tuo account. Vedrai lo stato di ogni prodotto e il numero di tracking una volta che il fornitore ha spedito." },
    { q: "Come faccio un reso?", a: "Dalla sezione 'I miei ordini' puoi richiedere il reso di un prodotto già spedito, indicando il motivo. Il venditore esamina la richiesta ed entro 48-72 ore ti risponde con l'esito e le istruzioni per la restituzione." },
    { q: "I miei dati di pagamento sono sicuri?", a: "Assolutamente. Oralzon non vede né memorizza i dati della tua carta. Tutti i pagamenti sono gestiti da Stripe, il sistema di pagamento più sicuro al mondo." },
  ]},
  { cat: "Per i Venditori", items: [
    { q: "Come posso vendere su Oralzon?", a: "Clicca su 'Vendi su Oralzon' e registrati come venditore. Scegli il piano più adatto alle tue esigenze, carica i prodotti e inizia a vendere." },
    { q: "Quali sono i piani disponibili?", a: "Offriamo un piano unico a €129/mese con prodotti illimitati, oltre a una prova gratuita di 6 mesi senza carta di credito. Su ogni vendita si applica inoltre una commissione, comprensiva dei costi di elaborazione pagamento (dettaglio nelle Condizioni di Vendita)." },
    { q: "Oralzon prende commissioni sulle vendite?", a: "Sì, applichiamo una commissione su ogni vendita conclusa, che copre i costi di elaborazione del pagamento e il servizio della piattaforma. Il dettaglio è indicato nelle Condizioni di Vendita." },
    { q: "Come ricevo i pagamenti?", a: "I pagamenti vengono elaborati da Stripe. L'acquirente paga la piattaforma e il fornitore riceve i fondi direttamente. Il sistema di distribuzione pagamenti sarà implementato nelle prossime versioni." },
    { q: "Posso caricare i prodotti in massa?", a: "Sì, il piano venditore include l'upload massivo via file Excel. Trovi il template nella sezione 'Import Excel' della dashboard venditore." },
    { q: "Come gestisco la spedizione?", a: "Sei responsabile della spedizione dei tuoi prodotti. Quando ricevi un ordine, puoi aggiornare lo stato nella sezione 'Ordini' della dashboard e inserire il numero di tracking." },
  ]},
  { cat: "Prodotti e Categorie", items: [
    { q: "Che tipo di prodotti posso trovare su Oralzon?", a: "Trovi tutto per lo studio dentistico: monouso, sterilizzazione, strumenti odontoiatrici, implantologia, ortodonzia, endodonzia, materiali da impronta, protesica, radiologia, arredi, disinfezione e molto altro." },
    { q: "I prodotti sono certificati?", a: "Richiediamo ai venditori che i prodotti odontoiatrici rispettino la normativa MDR (EU 2017/745) per i dispositivi medici. Il processo di verifica viene rafforzato progressivamente." },
    { q: "Come faccio la ricerca avanzata?", a: "Usa la barra di ricerca nella parte superiore del sito. Puoi filtrare per categoria, prezzo, venditore e ordinare i risultati per rilevanza, prezzo o novità." },
  ]},
];

export function FAQ() {
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (key: string) => setOpen(open === key ? null : key);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Domande Frequenti</h1>
        <p className="text-gray-500">Trova le risposte alle domande più comuni su Oralzon</p>
      </div>
      <div className="space-y-8">
        {faqs.map(section => (
          <div key={section.cat}>
            <h2 className="text-lg font-bold text-primary mb-4 pb-2 border-b border-primary/20">{section.cat}</h2>
            <div className="space-y-2">
              {section.items.map((item, i) => {
                const key = `${section.cat}-${i}`;
                const isOpen = open === key;
                return (
                  <div key={key} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-sm text-gray-900">{item.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                    </button>
                    {isOpen && <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">{item.a}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-10 p-6 bg-primary/5 rounded-2xl text-center">
        <p className="font-medium text-gray-900 mb-2">Non hai trovato la risposta?</p>
        <p className="text-sm text-gray-500 mb-4">Il nostro team è disponibile per aiutarti</p>
        <a href="mailto:support@oralzon.com" className="inline-block px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
          Contattaci
        </a>
      </div>
    </div>
  );
}
