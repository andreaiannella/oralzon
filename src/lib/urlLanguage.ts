// ── Gestione lingua tramite prefisso URL ──────────────────────────────
// L'italiano è la lingua di default e NON ha prefisso nell'URL — così tutti
// i link esistenti, i backlink esterni e la sitemap restano validi senza
// nessuna modifica. Le altre lingue usano un prefisso a due lettere:
//   oralzon.com/blog/xyz        → italiano (invariato)
//   oralzon.com/en/blog/xyz     → inglese
//   oralzon.com/es/blog/xyz     → spagnolo
// Questo è ciò che permette a Google di indicizzare ogni lingua come una
// pagina separata con URL propria — un prerequisito per comparire nei
// risultati di ricerca in lingue diverse dall'italiano. Prima di questo,
// esisteva un solo URL per pagina indipendentemente dalla lingua mostrata,
// invisibile a Google come pagine multilingua distinte.

import { DENTAL_CATEGORIES } from '../constants/categories';
import { localizeCategorySlug, delocalizeCategorySlug } from './categorySlugs';

const ITALIAN_SLUG_TO_NAME: Record<string, string> = Object.fromEntries(DENTAL_CATEGORIES.map(c => [c.slug, c.name]));

export const SUPPORTED_URL_LANGS = ['en', 'es', 'fr', 'de', 'pt', 'nl', 'pl'] as const;
export type UrlLang = typeof SUPPORTED_URL_LANGS[number];

/**
 * Rileva il prefisso lingua dal path corrente (es. "/en/blog/xyz" -> "en").
 * Ritorna null se non c'è prefisso riconosciuto — cioè italiano, la lingua
 * di default.
 */
export function detectUrlLanguage(pathname: string): UrlLang | null {
  const match = pathname.match(/^\/([a-z]{2})(\/|$)/);
  if (match && (SUPPORTED_URL_LANGS as readonly string[]).includes(match[1])) {
    return match[1] as UrlLang;
  }
  return null;
}

/**
 * Il basename da passare a <BrowserRouter> — stringa vuota per l'italiano
 * (nessun prefisso), altrimenti "/xx". Con questo, TUTTI i <Link to="...">
 * già esistenti nel sito continuano a funzionare senza modifiche: React
 * Router aggiunge/toglie il prefisso da solo in base al basename attivo.
 */
export function getBasename(pathname: string): string {
  const lang = detectUrlLanguage(pathname);
  return lang ? `/${lang}` : '';
}

/**
 * Costruisce l'URL equivalente in un'altra lingua, mantenendo lo stesso
 * percorso — usato dal selettore lingua e dalla generazione dei tag
 * hreflang. targetLang 'it' produce sempre l'URL senza prefisso.
 */
export function buildLocalizedPath(currentPathname: string, targetLang: string): string {
  const currentLang = detectUrlLanguage(currentPathname);
  let pathWithoutPrefix = currentPathname;
  if (currentLang) {
    pathWithoutPrefix = currentPathname.slice(`/${currentLang}`.length) || '/';
  }

  // Se il percorso è una pagina categoria, lo slug va tradotto anche lui per
  // la lingua di destinazione — altrimenti hreflang e cambio lingua
  // porterebbero a un URL con lo slug ancora nella lingua di partenza
  // (es. passando da francese a spagnolo, "jetables" invece di "desechables").
  const categoryMatch = pathWithoutPrefix.match(/^\/negozio\/categoria\/([^/]+)$/);
  if (categoryMatch) {
    const canonicalName = delocalizeCategorySlug(categoryMatch[1], ITALIAN_SLUG_TO_NAME);
    const cat = canonicalName ? DENTAL_CATEGORIES.find(c => c.name === canonicalName) : null;
    if (cat) {
      pathWithoutPrefix = `/negozio/categoria/${localizeCategorySlug(cat.name, cat.slug, targetLang)}`;
    }
  }

  if (targetLang === 'it') return pathWithoutPrefix;
  if (pathWithoutPrefix === '/') return `/${targetLang}`;
  return `/${targetLang}${pathWithoutPrefix}`;
}
