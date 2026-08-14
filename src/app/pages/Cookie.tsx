import { useTranslation } from 'react-i18next';
import { usePageSEO } from '../../lib/usePageSEO';

/**
 * Cookie policy — riscritta il 13/08/2026.
 *
 * La versione precedente elencava solo due voci tecniche e Google
 * Analytics, ma la direttiva ePrivacy copre QUALSIASI archiviazione sul
 * dispositivo, non i soli cookie: mancavano tre chiavi di localStorage
 * realmente usate, fra cui dc_recently_viewed, che e' proprio quella che
 * alimenta i suggerimenti personalizzati. Non era inoltre indicato che
 * Google Analytics comporta un trasferimento negli Stati Uniti.
 *
 * Le voci elencate qui vanno tenute allineate al codice: se si aggiunge una
 * nuova chiave di storage o uno strumento di terze parti, va aggiunta anche
 * a questa tabella.
 */
export function Cookie() {

  const { t, i18n } = useTranslation();
  // SEO: senza questa chiamata la pagina eredita i tag statici di
  // index.html, canonical compreso — che punta alla home e dice a Google
  // di trattare questa pagina come un duplicato della home.
  usePageSEO({
    title: "Cookie policy — Oralzon",
    description: "Quali cookie utilizza Oralzon, a cosa servono e come gestire le preferenze di consenso.",
    language: i18n.language,
  });

  const tecnici = [
    { name: 'supabase-auth-token', tipo: 'localStorage', scopo: 'Mantiene attiva la sessione dopo l’accesso', durata: 'Fino al logout' },
    { name: 'oralzon_cart_v2', tipo: 'localStorage', scopo: 'Conserva gli articoli nel carrello fra una visita e l’altra', durata: 'Persistente' },
    { name: 'dc_cookie_consent', tipo: 'localStorage', scopo: 'Ricorda la scelta espressa su questo banner, per non richiederla a ogni visita', durata: '12 mesi' },
    { name: 'oralzon_db_setup, oralzon_setup_required', tipo: 'localStorage', scopo: 'Indicatori tecnici di stato dell’applicazione', durata: 'Persistente' },
  ];

  const funzionali = [
    { name: 'dc_recently_viewed', tipo: 'localStorage', scopo: 'Prodotti visti di recente: alimenta la sezione “Continua ad acquistare” e i suggerimenti personalizzati', durata: 'Persistente, cancellabile dal browser' },
  ];

  const analitici = [
    { name: '_ga, _ga_*', tipo: 'Cookie di Google', scopo: 'Google Analytics — statistiche aggregate su come viene usata la piattaforma', durata: 'Fino a 2 anni' },
  ];

  const Riga = ({ c }: { c: { name: string; tipo: string; scopo: string; durata: string } }) => (
    <div className="border border-gray-200 rounded-lg p-3">
      <div className="flex flex-wrap items-baseline gap-2">
        <span className="font-mono text-xs font-semibold text-gray-900">{c.name}</span>
        <span className="text-[11px] text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">{c.tipo}</span>
      </div>
      <p className="text-sm text-gray-700 mt-1">{c.scopo}</p>
      <p className="text-xs text-gray-400 mt-1">Durata: {c.durata}</p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{t('legalPages.cookieTitle')}</h1>
      <p className="text-gray-500 text-sm mb-8">{t('legalPages.lastUpdated')}: Agosto 2026</p>
      <div className="bg-accent border border-oralzon-mint-fresh/30 rounded-lg p-3 text-xs text-oralzon-steel-ink mb-6">{t('legalPages.italianNotice')}</div>

      <div className="prose prose-sm max-w-none space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Cosa copre questa pagina</h2>
          <p>
            Oltre ai cookie veri e propri, questa informativa descrive tutte le tecnologie che salvano informazioni sul
            tuo dispositivo, compreso il <span className="font-mono text-xs">localStorage</span> del browser. La normativa
            europea le tratta allo stesso modo, indipendentemente dal nome tecnico.
          </p>
          <p>
            La maggior parte delle informazioni che conserviamo <strong>non lascia mai il tuo dispositivo</strong>: serve a
            farti ritrovare il carrello o a ricordare le tue preferenze, e non viene inviata a nessuno.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Necessari al funzionamento</h2>
          <p className="mb-3">
            Senza questi la piattaforma non può funzionare: non richiedono consenso e non possono essere disattivati
            dal banner.
          </p>
          <div className="space-y-2">{tecnici.map(c => <Riga key={c.name} c={c} />)}</div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Funzionali</h2>
          <p className="mb-3">
            Migliorano l’esperienza ma non sono indispensabili. Restano sul tuo dispositivo e puoi cancellarli in ogni
            momento dalle impostazioni del browser.
          </p>
          <div className="space-y-2">{funzionali.map(c => <Riga key={c.name} c={c} />)}</div>
          <p className="text-sm mt-3">
            L’elenco dei prodotti visti di recente viene usato per suggerirti articoli pertinenti. Non lo condividiamo con
            terzi e non lo incrociamo con dati provenienti da altri siti. Se preferisci non riceverne, puoi cancellare i
            dati del sito dal browser oppure opporti scrivendo a support@oralzon.com.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Analitici — solo con il tuo consenso</h2>
          <p className="mb-3">
            Usiamo Google Analytics per capire come viene usata la piattaforma e migliorarla. Questi cookie vengono
            installati <strong>solo se li accetti dal banner</strong>: finché non lo fai, restano disattivati.
          </p>
          <div className="space-y-2">{analitici.map(c => <Riga key={c.name} c={c} />)}</div>
          <p className="text-sm mt-3">
            Google LLC ha sede negli Stati Uniti: accettando questi cookie i relativi dati vengono trasferiti fuori
            dall’Unione Europea sulla base delle clausole contrattuali standard approvate dalla Commissione Europea.
            L’indirizzo IP è trattato in forma anonimizzata.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Cosa non usiamo</h2>
          <p>
            Non utilizziamo cookie pubblicitari, non facciamo retargeting e non condividiamo dati con circuiti
            pubblicitari. Gli spazi sponsorizzati che vedi sulla piattaforma sono acquistati dai venditori e mostrati in
            base alla categoria del prodotto, non a un profilo pubblicitario che ti segue fra siti diversi.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Gestire le tue preferenze</h2>
          <p className="mb-3">Puoi cambiare la tua scelta sui cookie analitici quando vuoi:</p>
          <button
            onClick={() => window.dispatchEvent(new Event('oralzon-reopen-cookie-banner'))}
            className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Gestisci le tue preferenze cookie
          </button>
          <p className="mt-3">
            Puoi anche cancellare o bloccare cookie e dati del sito dalle impostazioni del browser. Attenzione: rimuovendo
            quelli necessari verrai disconnesso e il carrello si svuoterà.
          </p>
          <p>Per qualsiasi domanda: <strong>support@oralzon.com</strong></p>
        </section>
      </div>
    </div>
  );
}
