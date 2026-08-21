/**
 * VARIANTE DELL'APPLICAZIONE: Oralzon (clienti) oppure Oralzon Seller.
 *
 * PERCHE' DUE APP E NON UNA. Apple ha rifiutato tre volte la build unica
 * con la stessa motivazione: "l'app accede a contenuti digitali acquistati
 * fuori dall'app". Il problema non era il codice ma la STRUTTURA.
 *
 * L'esenzione che ci riguarda è la 3.1.3(f): le app gratuite che fungono da
 * "complemento AUTONOMO a uno strumento web a pagamento" non devono usare
 * l'acquisto in-app, purché non contengano acquisti né richiami all'acquisto
 * esterno. È il caso da manuale di un'app di archiviazione cloud: paghi sul
 * sito, usi l'app gratis.
 *
 * La parola che conta è "autonomo". Un'app venditore che fa solo quello è un
 * complemento autonomo. La nostra app unica non lo era: era un marketplace
 * di consumo con un'area venditore attaccata, e il revisore vedeva un
 * negozio con dentro un abbonamento pagato altrove.
 *
 * Separare non crea l'esenzione — quella esisteva già — ma la rende
 * leggibile a chi guarda l'app per venti minuti.
 *
 * Vale anche la 3.1.3(c) sui servizi enterprise: i venditori Oralzon sono
 * imprese con partita IVA, e la registrazione la richiede. Due argomenti
 * indipendenti invece di uno.
 *
 * ── LA REGOLA DA NON VIOLARE MAI ──────────────────────────────────────
 *
 * Nell'app venditore non deve comparire NULLA sull'abbonamento: né prezzi,
 * né "serve un piano attivo", né link al sito. Un caso reale sui forum
 * Apple mostra uno sviluppatore respinto ripetutamente con la nostra stessa
 * identica motivazione, solo perché la schermata di accesso diceva che
 * serviva un abbonamento attivo. Quella frase è un "richiamo all'acquisto
 * esterno" e fa cadere l'esenzione.
 *
 * Chi non ha un account attivo vede semplicemente che l'accesso non riesce.
 *
 * ── COME SI COSTRUISCONO ──────────────────────────────────────────────
 *
 *   npm run build            -> app clienti (predefinita)
 *   npm run build:seller     -> app venditori
 *
 * Una sola base di codice, due varianti: duplicare il progetto
 * significherebbe correggere ogni difetto due volte e vederli divergere
 * entro un mese.
 */

export type VarianteApp = 'cliente' | 'venditore';

export const VARIANTE: VarianteApp =
  (import.meta.env.VITE_APP_VARIANT as VarianteApp) === 'venditore' ? 'venditore' : 'cliente';

/** Vero nell'app Oralzon Seller. */
export function isAppVenditore(): boolean {
  return VARIANTE === 'venditore';
}

/** Vero nell'app Oralzon per i clienti. */
export function isAppCliente(): boolean {
  return VARIANTE === 'cliente';
}

/**
 * Nome mostrato nei testi dell'interfaccia. Non è il nome dell'app negli
 * store — quello sta in capacitor.config e in Info.plist — ma serve dove il
 * nome compare nel contenuto.
 */
export const NOME_APP = isAppVenditore() ? 'Oralzon Seller' : 'Oralzon';
