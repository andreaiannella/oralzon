// ── Importi in euro, scritti come li scrive chi legge ───────────────────
//
// PERCHE' ESISTE. Gli importi erano composti a mano come `€{n.toFixed(2)}`
// in una novantina di punti: simbolo davanti, punto decimale, nessuna
// separazione delle migliaia. E' la convenzione anglosassone, non quella
// italiana e nemmeno quella della maggior parte dei Paesi in cui Oralzon
// vende. Un tedesco scrive 1.234,56 €, un polacco 1 234,56 €, un francese
// 1 234,56 €: il simbolo va in coda e le migliaia si separano.
//
// Non e' pignoleria tipografica. Un professionista che legge "€1234.56" su
// una piattaforma che gli parla in tedesco capisce immediatamente che il
// sito e' stato costruito altrove e adattato, e su un acquisto B2B da
// centinaia di euro quella impressione conta.
//
// LA VALUTA RESTA L'EURO, E LO DICIAMO. Stripe addebita in EUR e i payout
// ai venditori sono in EUR: introdurre altre valute significherebbe gestire
// tassi di cambio, prezzi per valuta e payout multivaluta — un progetto,
// non una formattazione. Va pero' riconosciuto che POLONIA, Svezia,
// Danimarca, Cechia, Ungheria e Romania non sono nell'eurozona: un dentista
// di Cracovia paga in una valuta che non e' la sua. Finche' resta cosi',
// l'euro va almeno mostrato nel formato che gli e' familiare — ed e'
// esattamente quello che fa questo modulo.

import { dateLocale } from './dateLocale';

/**
 * Importo in euro nel formato della lingua indicata.
 * Esempi: it "1.234,56 €" · de "1.234,56 €" · en "€1,234.56" · pl "1 234,56 €"
 */
export function formatMoney(amount: number | string | null | undefined, language?: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  try {
    return new Intl.NumberFormat(dateLocale(language), {
      style: 'currency',
      currency: 'EUR',
    }).format(n);
  } catch {
    // Ripiego solo se Intl non fosse disponibile: meglio un importo
    // leggibile in formato neutro che una schermata rotta.
    return `€${n.toFixed(2)}`;
  }
}

/**
 * Come formatMoney ma senza simbolo di valuta, per le tabelle in cui la
 * valuta e' gia' indicata nell'intestazione di colonna.
 */
export function formatAmount(amount: number | string | null | undefined, language?: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '—';
  try {
    return new Intl.NumberFormat(dateLocale(language), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return n.toFixed(2);
  }
}
