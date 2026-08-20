import { Capacitor } from '@capacitor/core';

/**
 * ── Acquisti di servizi digitali e regole App Store ─────────────────────
 *
 * PERCHE' QUESTO MODULO ESISTE. Apple ha rifiutato la build 29 con la
 * Guideline 3.1.1: l'abbonamento venditore da 199 EUR si poteva acquistare
 * dentro l'app pagando con Stripe invece che con l'acquisto in-app.
 *
 * La regola distingue due cose che sulla piattaforma convivono:
 *
 *   BENI FISICI (guanti, mascherine, strumenti) — Apple non li tocca. Il
 *   pagamento con Stripe e' pienamente legittimo e resta come e'.
 *
 *   SERVIZI DIGITALI (abbonamento venditore, pacchetti di visibilita') —
 *   qui Apple pretende l'acquisto in-app, trattenendo il 15-30%.
 *
 * LA SCELTA. Invece di implementare l'acquisto in-app — che costerebbe circa
 * 30 EUR l'anno per venditore sui 199, piu' la complessita' di riconciliare
 * due sistemi di pagamento con Stripe Connect, e con i rinnovi gestiti da
 * Apple anziche' da noi — i servizi digitali NON si acquistano dall'app
 * nativa. Si acquistano dal sito.
 *
 * E' la prassi consolidata dei marketplace: nelle app venditore di Amazon,
 * eBay ed Etsy non si compra nulla. L'app serve a gestire prodotti e ordini.
 *
 * NIENTE LINK AL SITO. Apple vieta anche l'indirizzamento esterno per
 * aggirare l'acquisto in-app, quindi nell'app non si mostra alcun
 * collegamento ne' indirizzo: solo l'informazione che l'operazione si
 * completa dal sito. Mettere un pulsante "vai al sito" sarebbe una
 * violazione diversa ma altrettanto sanzionata.
 *
 * ATTENZIONE PER IL FUTURO: qualunque nuova funzione a pagamento rivolta ai
 * venditori (piani superiori, servizi aggiuntivi, crediti pubblicitari)
 * ricade in questa stessa regola. Va passata da qui, non aggiunta con un
 * pulsante di pagamento diretto.
 */

/** Vero quando l'app gira come applicazione nativa (iOS o Android). */
export function inAppNativa(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Vero se l'acquisto di servizi digitali e' consentito nel contesto corrente.
 *
 * La restrizione si applica anche ad Android per coerenza: Google Play ha una
 * regola equivalente, e mantenere due comportamenti diversi fra le due app
 * significherebbe scoprire il problema al primo invio sul Play Store invece
 * che adesso.
 */
export function acquistiDigitaliConsentiti(): boolean {
  return !inAppNativa();
}

/**
 * Vero se si possono MOSTRARE prezzi, piani e richiami all'abbonamento.
 *
 * PERCHE' SERVE OLTRE A acquistiDigitaliConsentiti(). Il secondo rifiuto di
 * Apple (build 30) non contestava piu' l'acquisto — quello era stato tolto —
 * ma il fatto che "l'app ACCEDE a contenuti digitali acquistati fuori
 * dall'app, come gli abbonamenti, e quel contenuto non e' acquistabile con
 * l'acquisto in-app".
 *
 * Il punto e' che togliere il pulsante non basta: la pagina dei prezzi
 * restava raggiungibile e collegata da sei punti dell'app — banner di prova,
 * pie' di pagina, home, "diventa venditore", chi siamo. Una pagina che
 * mostra "199 EUR/anno" con un percorso per arrivarci e' a tutti gli effetti
 * un richiamo all'acquisto esterno, che la regola 3.1.3 vieta esplicitamente
 * insieme ai pulsanti e ai link.
 *
 * L'ESENZIONE SU CUI CI APPOGGIAMO e' quella delle applicazioni gratuite di
 * accompagnamento a servizi web a pagamento: sono ammesse senza acquisto
 * in-app A CONDIZIONE che non contengano ne' acquisti ne' richiami
 * all'acquisto esterno. Rispettarla significa che nell'app nativa la
 * superficie commerciale non esiste affatto: niente pagina prezzi, niente
 * link, niente importi.
 *
 * Il venditore che ha gia' un piano attivo continua a lavorare
 * normalmente — gestisce prodotti e ordini — perche' quella e' la funzione
 * di accompagnamento, non la vendita del servizio.
 */
export function superficieCommercialeVisibile(): boolean {
  return !inAppNativa();
}
