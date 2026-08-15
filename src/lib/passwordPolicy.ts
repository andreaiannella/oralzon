// ── Requisiti password ──────────────────────────────────────────────────
//
// PROBLEMA TROVATO IN AUDIT. La lunghezza minima era controllata in cinque
// punti diversi con due valori diversi: 8 caratteri nella registrazione
// venditore e nelle impostazioni account, ma solo 6 nella registrazione
// cliente e nel reset password. I due percorsi più deboli erano proprio
// quelli aperti a chiunque senza alcuna verifica preliminare — cioè i due
// che contano.
//
// La costante vive qui perché una regola replicata in cinque file diverge
// sempre: è già successo. Chi aggiunge un nuovo percorso di registrazione
// importa questa e non reinventa il numero.
//
// ATTENZIONE — questo è un controllo LATO CLIENT, quindi è solo un aiuto
// all'utente: chiunque può saltarlo chiamando direttamente le API di
// Supabase Auth. L'unico vincolo che conta davvero è quello configurato nel
// pannello Supabase (Authentication → requisiti password), che va tenuto
// allineato a questo valore. Il controllo qui serve a dare un messaggio
// chiaro prima della chiamata, non a proteggere.
//
// NOTA sul contesto: la protezione contro le password già comparse in fughe
// di dati (HaveIBeenPwned) non è attivabile sul piano Free di Supabase —
// richiede il piano Pro. Finché resta così, la lunghezza minima e la
// complessità richiesta sono le uniche leve disponibili, e per questo vale
// la pena tenerle severe.

export const MIN_PASSWORD_LENGTH = 8;

/** true se la password è più corta del minimo richiesto. */
export function isPasswordTooShort(password: string): boolean {
  return (password || '').length < MIN_PASSWORD_LENGTH;
}
