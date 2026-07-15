import { AlertTriangle } from 'lucide-react';

export function InfoSpedizione() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Informazioni sulle Spedizioni</h1>
      <p className="text-gray-500 text-sm mb-8">Come funziona la logistica su Oralzon</p>
      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">

        <section className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="font-bold text-amber-900 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Modello di Spedizione Distribuita</h2>
          <p>Su Oralzon ogni fornitore gestisce la spedizione dei propri prodotti in modo autonomo. Questo significa che un ordine contenente prodotti di fornitori diversi genererà spedizioni separate, ciascuna con il proprio tracking.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tempistiche di Spedizione</h2>
          <div className="overflow-hidden border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Tipo Prodotto</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Tempo Stimato</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">Note</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Monouso e consumabili', '24-72 ore lavorative', 'Stock sempre disponibile'],
                  ['Strumenti odontoiatrici', '2-5 giorni lavorativi', 'Dipende dalla disponibilità'],
                  ['Implantologia e kit chirurgici', '3-7 giorni lavorativi', 'Verifica disponibilità con fornitore'],
                  ['Attrezzature e arredi', '7-15 giorni lavorativi', 'Trasporto specializzato'],
                  ['Prodotti su ordinazione', 'Da concordare', 'Il fornitore contatterà direttamente'],
                ].map(([tipo, tempo, note]) => (
                  <tr key={tipo} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">{tipo}</td>
                    <td className="px-4 py-3 text-primary font-semibold">{tempo}</td>
                    <td className="px-4 py-3 text-gray-500">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">* I tempi sono indicativi. Ogni fornitore specifica i propri tempi nella scheda prodotto.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Notifiche e Tracking</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Conferma ordine', desc: 'Email immediata con numero ordine e riepilogo' },
              { step: '2', title: 'Presa in carico', desc: 'Il fornitore accetta l\'ordine (entro 24h lavorative)' },
              { step: '3', title: 'Spedizione', desc: 'Email con numero tracking e corriere utilizzato' },
              { step: '4', title: 'Consegna', desc: 'Notifica di avvenuta consegna e richiesta di feedback' },
            ].map(s => (
              <div key={s.step} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{s.step}</div>
                <div><p className="font-medium text-gray-900">{s.title}</p><p className="text-xs text-gray-500">{s.desc}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Costi di Spedizione</h2>
          <p>I costi di spedizione sono definiti da ogni fornitore e mostrati durante il checkout. Alcuni fornitori offrono:</p>
          <ul className="mt-2 space-y-1 list-disc pl-5">
            <li>Spedizione gratuita sopra una soglia d'ordine minima</li>
            <li>Tariffe forfettarie per zona geografica</li>
            <li>Corrieri espressi a tariffa maggiorata per consegne urgenti</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Prodotti Soggetti a Normativa Speciale</h2>
          <p>I dispositivi medici classificati nelle classi IIa, IIb e III (Regolamento MDR EU 2017/745) possono richiedere documentazione aggiuntiva per la spedizione. Il fornitore è responsabile di garantire che tutta la documentazione necessaria accompagni il prodotto.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Problemi con la Spedizione</h2>
          <p>In caso di mancata consegna, pacco danneggiato o prodotto sbagliato:</p>
          <ol className="mt-2 space-y-1 list-decimal pl-5">
            <li>Contatta il fornitore dalla sezione "I miei ordini" entro <strong>48 ore dalla consegna</strong></li>
            <li>Documenta il problema con fotografie</li>
            <li>Se non ricevi risposta entro 48h, apri una segnalazione a <strong>support@oralzon.com</strong></li>
          </ol>
        </section>

      </div>
    </div>
  );
}
