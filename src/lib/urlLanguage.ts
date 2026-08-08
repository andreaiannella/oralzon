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
  if (targetLang === 'it') return pathWithoutPrefix;
  if (pathWithoutPrefix === '/') return `/${targetLang}`;
  return `/${targetLang}${pathWithoutPrefix}`;
}
