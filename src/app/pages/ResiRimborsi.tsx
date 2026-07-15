import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export function ResiRimborsi() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Resi e Rimborsi</h1>
      <p className="text-gray-500 text-sm mb-8">Politica di reso per il marketplace B2B Oralzon — aggiornata Maggio 2026</p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <h2 className="font-bold text-amber-900 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Marketplace B2B Professionale</h2>
        <p className="text-sm text-amber-800">Oralzon è una piattaforma esclusivamente B2B tra professionisti del settore odontoiatrico. Non si applicano le norme sul diritto di recesso previste per i consumatori finali (D.Lgs. 206/2005, art. 59 lettere e/c). I resi sono ammessi solo nelle casistiche specifiche indicate di seguito.</p>
      </div>

      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quando è Possibile Richiedere un Reso</h2>
          <div className="grid gap-3">
            {[
              { ok: true, title: 'Prodotto sbagliato', desc: 'Hai ricevuto un articolo diverso da quello ordinato (codice REF, taglia, quantità)' },
              { ok: true, title: 'Prodotto difettoso', desc: 'Il prodotto presenta difetti manifesti di fabbricazione che ne compromettono l\'utilizzo clinico' },
              { ok: true, title: 'Danno da trasporto', desc: 'Il prodotto è arrivato danneggiato a causa della spedizione (documentare con foto entro 48h dalla consegna)' },
              { ok: true, title: 'Non conforme alla scheda tecnica', desc: 'Il prodotto non corrisponde alle specifiche tecniche dichiarate nella scheda prodotto' },
              { ok: false, title: 'Cambio di idea o preferenza', desc: 'Non è ammesso il reso per mancato gradimento o per errori nell\'ordine dell\'acquirente' },
              { ok: false, title: 'Prodotti monouso aperti', desc: 'Qualsiasi prodotto monouso (guanti, mascherine, kit sterili) una volta rimosso dal confezionamento originale' },
              { ok: false, title: 'Prodotti con sigillo rotto', desc: 'Prodotti sterilizzati, in blister o con sigillo di garanzia rimosso' },
              { ok: false, title: 'Ordini speciali e personalizzati', desc: 'Protesi su misura, materiali ordinati specificamente, prodotti non a stock' },
            ].map(item => (
              <div key={item.title} className={`flex items-start gap-3 p-4 rounded-xl border ${item.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                {item.ok ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                <div>
                  <p className={`font-semibold ${item.ok ? 'text-green-800' : 'text-red-800'}`}>{item.title}</p>
                  <p className={`text-xs mt-0.5 ${item.ok ? 'text-green-700' : 'text-red-700'}`}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Procedure e Tempistiche</h2>
          <div className="space-y-3">
            {[
              { step: '1', title: 'Richiesta RMA entro 14 giorni', desc: 'Vai su "I miei ordini" → seleziona il prodotto → "Richiedi Reso". Allega foto del prodotto e della confezione. Descrivi il problema dettagliatamente.' },
              { step: '2', title: 'Valutazione del venditore (48-72h)', desc: 'Il venditore ha 48-72 ore lavorative per accettare o rifiutare la richiesta. In caso di accettazione, riceverai istruzioni per la restituzione.' },
              { step: '3', title: 'Spedizione del reso', desc: 'Imballare il prodotto nell\'imballo originale. Indicare il numero RMA sulla scatola. Conservare la prova di spedizione fino alla conferma di ricezione.' },
              { step: '4', title: 'Ispezione e rimborso (entro 15 giorni)', desc: 'Ricevuta la merce, il venditore ha 5 giorni lavorativi per l\'ispezione. Il rimborso viene emesso entro 15 giorni dalla conferma.' },
            ].map(s => (
              <div key={s.step} className="flex gap-4 p-4 border border-gray-200 rounded-xl">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{s.step}</div>
                <div><p className="font-semibold text-gray-900">{s.title}</p><p className="text-xs text-gray-600 mt-1">{s.desc}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Costi del Reso — Chi Paga?</h2>
          <div className="overflow-hidden border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Motivazione</th>
                  <th className="text-left px-4 py-3 font-semibold">Spedizione Reso</th>
                  <th className="text-left px-4 py-3 font-semibold">Spese di Riaccettazione</th>
                  <th className="text-left px-4 py-3 font-semibold">Rimborso</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Errore del venditore', 'A carico del venditore', 'Nessuna', 'Totale'],
                  ['Prodotto difettoso', 'A carico del venditore', 'Nessuna', 'Totale'],
                  ['Danno da trasporto', 'A carico del venditore', 'Nessuna', 'Totale'],
                  ['Non conforme a scheda', 'Da concordare', 'Da concordare', 'Totale o parziale'],
                ].map(([motivo, spedizione, spese, rimborso]) => (
                  <tr key={motivo} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">{motivo}</td>
                    <td className="px-4 py-3 text-green-700 font-medium">{spedizione}</td>
                    <td className="px-4 py-3">{spese}</td>
                    <td className="px-4 py-3 font-medium">{rimborso}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">Il venditore può applicare una quota di riaccettazione (restocking fee) fino al 20% per resi non dovuti a propri errori, da comunicare esplicitamente in fase di approvazione.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Mediazione Oralzon</h2>
          <p>In caso di controversia tra acquirente e venditore non risolta entro 7 giorni, Oralzon interviene come mediatore. Il team di supporto esamina le prove fornite da entrambe le parti e può:</p>
          <ul className="mt-2 space-y-1 list-disc pl-5">
            <li>Richiedere documentazione aggiuntiva</li>
            <li>Imporre al venditore l'accettazione del reso se le prove sono chiare</li>
            <li>Sospendere il venditore in caso di comportamento scorretto ricorrente</li>
          </ul>
          <p className="mt-3">Per aprire una mediazione: <strong>support@oralzon.com</strong></p>
        </section>

        <section className="bg-gray-50 rounded-xl p-5">
          <h2 className="font-bold text-gray-900 mb-2">Conformità Normativa</h2>
          <p className="text-xs text-gray-600">La presente politica è conforme al Regolamento UE 2017/745 (MDR) per i dispositivi medici, al Codice del Consumo per i rapporti B2B applicabili, e alle linee guida della Commissione Europea sul commercio elettronico tra professionisti. Per prodotti classificati come dispositivi medici, si applicano restrizioni aggiuntive alla rivendita e al reso determinate dal fabbricante.</p>
        </section>

        <div className="text-center pt-4">
          <Link to="/account/ordini" className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">
            Vai ai miei ordini per richiedere un reso
          </Link>
        </div>

      </div>
    </div>
  );
}
