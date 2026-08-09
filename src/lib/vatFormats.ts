// Formato ufficiale del numero di P.IVA/VAT per ciascuno dei 27 paesi UE —
// fonte: specifiche del servizio VIES della Commissione Europea. Usato come
// esempio/placeholder nei campi P.IVA per ridurre gli errori di battitura
// PRIMA di interrogare VIES, non per validare (quello lo fa comunque VIES
// stesso, l'unica fonte davvero autorevole).
//
// Nota sul prefisso: il campo dell'utente contiene SOLO le cifre/lettere
// dopo il prefisso paese (la chiamata a VIES separa già country+vatNumber),
// quindi l'esempio mostrato omette il prefisso ISO (es. "12345678901" per
// l'Italia, non "IT12345678901") — coerente con cosa l'utente deve
// effettivamente digitare nel campo.
export const VAT_FORMAT_EXAMPLES: Record<string, string> = {
  AT: 'U12345678', BE: '0123456789', BG: '123456789', CY: '12345678X',
  CZ: '12345678', DE: '123456789', DK: '12345678', EE: '123456789',
  ES: 'X1234567X', FI: '12345678', FR: 'XX123456789', GR: '123456789',
  HR: '12345678901', HU: '12345678', IE: '1234567X', IT: '12345678901',
  LT: '123456789', LU: '12345678', LV: '12345678901', MT: '12345678',
  NL: '123456789B01', PL: '1234567890', PT: '123456789', RO: '1234567890',
  SE: '123456789012', SI: '12345678', SK: '1234567890',
};

/** Esempio di formato P.IVA per il paese dato; stringa vuota se il paese non è nella UE. */
export function vatFormatExample(countryCode: string): string {
  return VAT_FORMAT_EXAMPLES[countryCode?.toUpperCase()] || '';
}
