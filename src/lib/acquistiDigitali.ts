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
