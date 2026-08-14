import { useTranslation } from 'react-i18next';
import { usePageSEO } from '../../lib/usePageSEO';

/**
 * Informativa privacy — riscritta il 13/08/2026 confrontando riga per riga
 * il documento precedente con ciò che la piattaforma fa davvero.
 *
 * La versione precedente ometteva trattamenti realmente in corso, il che è
 * di per sé una violazione a prescindere da quanto fosse ben scritta:
 *  - Anthropic (traduzione schede prodotto, controllo immagini) non era
 *    nominata, pur essendo un responsabile con trasferimento extra-UE;
 *  - Netlify (hosting, log, indirizzi IP) non era nominata;
 *  - non era detto che nome e indirizzo del cliente vanno al venditore;
 *  - non era dichiarata la profilazione su acquisti e prodotti visti;
 *  - mancavano token push, newsletter, VIES e Google Analytics;
 *  - la conservazione era solo "10 anni per i dati fiscali".
 *
 * ATTENZIONE: i dati identificativi del titolare sono ancora SEGNAPOSTO.
 * Vanno compilati prima dell'apertura al pubblico: l'art. 13 GDPR richiede
 * denominazione, sede e contatti, senza i quali l'informativa e' incompleta.
 */
export function Privacy() {

  const { t, i18n } = useTranslation();
  // SEO: senza questa chiamata la pagina eredita i tag statici di
  // index.html, canonical compreso — che punta alla home e dice a Google
  // di trattare questa pagina come un duplicato della home.
  usePageSEO({
    title: "Informativa sulla privacy — Oralzon",
    description: "Come Oralzon tratta i dati personali degli utenti: finalità, basi giuridiche, conservazione e diritti previsti dal GDPR.",
    language: i18n.language,
  });

  const processors = [
    { name: 'Supabase', ruolo: 'Database, autenticazione e archiviazione file', dove: 'Unione Europea' },
    { name: 'Netlify', ruolo: 'Hosting del sito e log tecnici di accesso', dove: 'Stati Uniti — clausole contrattuali standard' },
    { name: 'Stripe', ruolo: 'Pagamenti, verifica identità dei venditori, accrediti', dove: 'Stati Uniti — clausole contrattuali standard' },
    { name: 'Resend', ruolo: 'Invio delle email transazionali', dove: 'Stati Uniti — clausole contrattuali standard' },
    { name: 'Anthropic', ruolo: 'Traduzione automatica delle schede prodotto e controllo delle immagini caricate dai venditori', dove: 'Stati Uniti — clausole contrattuali standard' },
    { name: 'Google (Analytics)', ruolo: 'Statistiche di utilizzo, solo previo consenso', dove: 'Stati Uniti — clausole contrattuali standard' },
    { name: 'Apple e Google', ruolo: 'Consegna delle notifiche push sulle app native', dove: 'Stati Uniti — clausole contrattuali standard' },
  ];

  const retention = [
    { dato: 'Dati dell’account', durata: 'Fino alla cancellazione dell’account, poi 30 giorni per l’eventuale ripristino' },
    { dato: 'Ordini e documenti fiscali', durata: '10 anni (art. 2220 c.c. e normativa tributaria)' },
    { dato: 'Ordini non completati', durata: 'Annullati automaticamente dopo 24 ore, poi conservati 12 mesi' },
    { dato: 'Recensioni e domande pubbliche', durata: 'Fino alla rimozione da parte dell’autore o alla chiusura dell’account' },
    { dato: 'Log tecnici e di sicurezza', durata: '12 mesi' },
    { dato: 'Iscrizione alla newsletter', durata: 'Fino alla disiscrizione' },
    { dato: 'Token per le notifiche push', durata: 'Fino alla disinstallazione dell’app o alla revoca del permesso' },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{t('legalPages.privacyTitle')}</h1>
      <p className="text-gray-500 text-sm mb-8">{t('legalPages.lastUpdated')}: Agosto 2026</p>
      <div className="bg-accent border border-oralzon-mint-fresh/30 rounded-lg p-3 text-xs text-oralzon-steel-ink mb-6">{t('legalPages.italianNotice')}</div>

      <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. Titolare del trattamento</h2>
          <p>
            Il titolare del trattamento dei dati personali raccolti tramite la piattaforma Oralzon è
            <strong> [DENOMINAZIONE SOCIALE DA COMPLETARE]</strong>, con sede in
            <strong> [INDIRIZZO SEDE LEGALE]</strong>, P.IVA <strong>[PARTITA IVA]</strong>.
          </p>
          <p>Per qualsiasi richiesta relativa ai dati personali puoi scrivere a <strong>support@oralzon.com</strong>.</p>
          <p>Non è stato nominato un Responsabile della Protezione dei Dati, non ricorrendo i presupposti dell’art. 37 GDPR.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. Quali dati raccogliamo</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Dati identificativi e di contatto:</strong> nome, cognome, email, telefono, indirizzo di spedizione e di fatturazione.</li>
            <li><strong>Dati fiscali:</strong> Partita IVA, ragione sociale, codice fiscale, PEC e codice SDI. Oralzon è riservato a operatori professionali: la Partita IVA è necessaria per acquistare.</li>
            <li><strong>Dati degli ordini:</strong> prodotti acquistati, importi, stato della spedizione, resi e rimborsi.</li>
            <li><strong>Contenuti che pubblichi:</strong> recensioni, domande sui prodotti e, per i venditori, schede prodotto e risposte.</li>
            <li><strong>Dati di navigazione:</strong> indirizzo IP, tipo di dispositivo e browser, pagine visitate.</li>
            <li><strong>Prodotti visti di recente e storico acquisti</strong>, usati per i suggerimenti (vedi punto 5).</li>
            <li><strong>Token del dispositivo</strong>, se autorizzi le notifiche push dalle app iOS o Android.</li>
          </ul>
          <p className="text-sm">
            <strong>Non trattiamo i dati della tua carta di pagamento.</strong> Numero, scadenza e codice di sicurezza
            vengono raccolti direttamente da Stripe e non transitano mai dai nostri sistemi.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Perché li trattiamo e con quale base giuridica</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Erogare il servizio</strong> — account, ordini, spedizioni, resi, assistenza. Base: esecuzione del contratto (art. 6.1.b GDPR).</li>
            <li><strong>Email transazionali</strong> — conferme d’ordine, tracciabilità, esito dei resi, comunicazioni sul piano venditore. Base: esecuzione del contratto.</li>
            <li><strong>Obblighi fiscali e contabili</strong> — conservazione dei documenti e calcolo dell’IVA. Base: obbligo di legge (art. 6.1.c GDPR).</li>
            <li><strong>Verifica della Partita IVA</strong> tramite il servizio VIES della Commissione Europea, necessaria per applicare correttamente il regime IVA intracomunitario. Base: obbligo di legge.</li>
            <li><strong>Sicurezza e prevenzione degli abusi</strong> — log di accesso, limiti alle richieste, controllo automatico dei contenuti pubblicati. Base: legittimo interesse (art. 6.1.f GDPR).</li>
            <li><strong>Suggerimenti di prodotto</strong> personalizzati. Base: legittimo interesse; puoi opporti (vedi punto 5).</li>
            <li><strong>Statistiche di utilizzo</strong> e <strong>newsletter</strong>. Base: consenso (art. 6.1.a GDPR), revocabile in ogni momento.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Chi riceve i tuoi dati</h2>
          <p>
            <strong>I venditori.</strong> Quando acquisti, il venditore riceve il tuo nome, il tuo indirizzo di spedizione
            e il dettaglio degli articoli che lo riguardano: gli servono per preparare e spedire il pacco. Per gli stessi
            ordini riceve i dati fiscali necessari a emettere la fattura.
          </p>
          <p>
            <strong>Non condividiamo con i venditori la tua email né il tuo numero di telefono.</strong> Le comunicazioni
            relative all’ordine passano dalla piattaforma. È una scelta deliberata: riduce le comunicazioni indesiderate e
            mantiene tracciabile lo scambio in caso di contestazione.
          </p>
          <p>Ogni venditore agisce come titolare autonomo per i dati che riceve, ed è tenuto a usarli solo per evadere l’ordine.</p>
          <p><strong>I fornitori tecnici</strong> elencati al punto 7, che trattano i dati per nostro conto come responsabili.</p>
          <p><strong>Le autorità</strong>, quando previsto da un obbligo di legge.</p>
          <p>Non vendiamo i tuoi dati e non li cediamo a terzi per loro finalità pubblicitarie.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Contenuti pubblici e suggerimenti personalizzati</h2>
          <p>
            <strong>Recensioni e domande sono pubbliche</strong> e riportano il nome con cui sei registrato. Restano
            visibili a chiunque visiti la scheda prodotto, anche senza account. Puoi chiederne la rimozione in ogni momento.
          </p>
          <p>
            <strong>Suggerimenti.</strong> Per proporti prodotti pertinenti analizziamo le categorie dei tuoi acquisti
            passati e dei prodotti visti di recente. È un trattamento limitato ai dati raccolti su questa piattaforma: non
            usiamo cookie di terze parti, non ti seguiamo su altri siti e non incrociamo i tuoi dati con fonti esterne.
          </p>
          <p>
            Questa analisi non produce effetti giuridici e non incide su prezzi o condizioni di vendita: cambia solo
            l’ordine in cui alcuni prodotti ti vengono mostrati, e non prevale mai sulle tue scelte esplicite di ricerca o
            ordinamento. Puoi opporti scrivendo a support@oralzon.com.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Traduzione automatica e controllo dei contenuti</h2>
          <p>
            Le schede prodotto redatte dai venditori vengono tradotte automaticamente nelle lingue della piattaforma
            tramite i servizi di <strong>Anthropic</strong>. Le immagini caricate dai venditori possono essere sottoposte a
            un controllo automatico che verifica l’assenza di contatti diretti, come previsto dalle Condizioni di Vendita.
          </p>
          <p>
            Vengono trasmessi soltanto i contenuti commerciali delle schede e le immagini caricate: non inviamo dati
            personali dei clienti, né ordini, né dati di pagamento. I contenuti trasmessi non sono utilizzati per
            addestrare modelli.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">7. Fornitori e trasferimenti fuori dall’Unione Europea</h2>
          <p>Ci avvaliamo dei seguenti fornitori, nominati responsabili del trattamento:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse mt-2">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-2 border-b">Fornitore</th>
                  <th className="p-2 border-b">Finalità</th>
                  <th className="p-2 border-b">Trattamento</th>
                </tr>
              </thead>
              <tbody>
                {processors.map(p => (
                  <tr key={p.name} className="align-top">
                    <td className="p-2 border-b font-semibold text-gray-900">{p.name}</td>
                    <td className="p-2 border-b">{p.ruolo}</td>
                    <td className="p-2 border-b">{p.dove}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm mt-3">
            Per i fornitori con sede negli Stati Uniti il trasferimento avviene sulla base delle clausole contrattuali
            standard approvate dalla Commissione Europea, integrate dalle misure di sicurezza previste dai rispettivi
            contratti.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">8. Per quanto tempo conserviamo i dati</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse mt-2">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="p-2 border-b">Categoria</th>
                  <th className="p-2 border-b">Conservazione</th>
                </tr>
              </thead>
              <tbody>
                {retention.map(r => (
                  <tr key={r.dato} className="align-top">
                    <td className="p-2 border-b font-semibold text-gray-900">{r.dato}</td>
                    <td className="p-2 border-b">{r.durata}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm mt-3">
            Alla chiusura dell’account i dati non soggetti a obblighi di conservazione vengono cancellati. Ordini e
            documenti fiscali restano per il periodo previsto dalla legge anche dopo la chiusura: è un obbligo a cui non
            possiamo derogare nemmeno su tua richiesta.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">9. I tuoi diritti</h2>
          <p>Puoi in ogni momento:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>accedere ai tuoi dati e ottenerne copia (artt. 15 e 20 GDPR);</li>
            <li>correggerli se inesatti o incompleti (art. 16);</li>
            <li>chiederne la cancellazione (art. 17), nei limiti degli obblighi fiscali;</li>
            <li>chiedere la limitazione del trattamento (art. 18);</li>
            <li>opporti ai trattamenti fondati sul legittimo interesse, compresi i suggerimenti personalizzati (art. 21);</li>
            <li>revocare i consensi prestati, senza pregiudizio per la liceità del trattamento precedente.</li>
          </ul>
          <p>Scrivi a <strong>support@oralzon.com</strong>: rispondiamo entro un mese, prorogabile di due in casi complessi, dandotene comunicazione.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">10. Sicurezza e violazioni</h2>
          <p>
            Adottiamo misure tecniche e organizzative adeguate: cifratura dei dati in transito, controlli di accesso a
            livello di database, separazione dei ruoli fra clienti, venditori e amministratori, limiti alle richieste
            automatizzate. In caso di violazione che comporti un rischio elevato per i tuoi diritti ti informeremo senza
            ingiustificato ritardo e notificheremo l’Autorità entro 72 ore.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">11. Minori</h2>
          <p>
            La piattaforma è riservata a operatori professionali del settore odontoiatrico titolari di Partita IVA. Non è
            rivolta a minori e non raccogliamo consapevolmente dati di minori di 18 anni.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">12. Reclami</h2>
          <p>
            Se ritieni che il trattamento dei tuoi dati violi il GDPR puoi rivolgerti al Garante per la Protezione dei
            Dati Personali (<span className="font-mono">www.garanteprivacy.it</span>) o all’autorità di controllo del tuo
            Stato di residenza.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">13. Modifiche</h2>
          <p>
            Se modificheremo questa informativa in modo sostanziale te lo comunicheremo via email o con un avviso in
            piattaforma prima che le modifiche abbiano effetto. La data in cima indica l’ultimo aggiornamento.
          </p>
        </section>
      </div>
    </div>
  );
}
