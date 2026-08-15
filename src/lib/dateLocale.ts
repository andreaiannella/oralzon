// ── Formato data secondo la lingua del lettore ──────────────────────────
//
// PERCHE' STA QUI. Questa stessa mappa era copiata identica in sei file
// diversi (CustomerOrders e cinque pagine dell'area venditore), mentre in
// altri due punti la data era scritta a mano come 'it-IT'. Il risultato:
// un venditore olandese vedeva le date nel formato giusto in una pagina e
// nel formato italiano in quella accanto, senza alcuna logica apparente.
//
// Una regola replicata in sei posti diverge sempre — e infatti era gia'
// divergente. Qui vive in un punto solo, e chi aggiunge una pagina nuova
// importa questa invece di ricopiarla.
//
// SCELTA DEI CODICI. Non basta passare il codice lingua a due lettere:
// 'en' da solo porta al formato statunitense (mese/giorno), sbagliato per
// un pubblico europeo, e 'pt' puo' risolvere in portoghese brasiliano. Si
// indicano quindi le varianti regionali esplicite: en-GB per l'inglese
// europeo, pt-PT per il portoghese europeo.

export const DATE_LOCALE: Record<string, string> = {
  it: 'it-IT',
  en: 'en-GB',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-PT',
  nl: 'nl-NL',
  pl: 'pl-PL',
};

/** Codice locale per la lingua indicata, con ripiego sull'italiano. */
export function dateLocale(language?: string): string {
  const code = (language || 'it').split('-')[0];
  return DATE_LOCALE[code] || DATE_LOCALE.it;
}

/** Data formattata secondo le convenzioni della lingua del lettore. */
export function formatDate(
  value: string | number | Date | null | undefined,
  language?: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return '—';
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(dateLocale(language), options);
}
