// PRIMA: questo file importava staticamente tutti e 6 i file lingua
// (~500KB l'uno, ~3MB totali) e li fondeva su OGNI articolo al caricamento
// del modulo — chiunque aprisse anche una sola pagina del blog scaricava
// tutte le traduzioni di tutte le lingue, per mostrarne una sola.
//
// ORA: si carica dinamicamente solo il file della lingua effettivamente
// richiesta, una alla volta, e solo quando serve — non al caricamento del
// modulo. Il risultato viene messo in cache (Map) così cambi di pagina
// successivi nella stessa lingua non richiedono un nuovo download.
export type ArticleTranslation = { title: string; description: string; content: string[] };
export type LangTranslations = Record<string, ArticleTranslation>; // slug -> traduzione

const cache = new Map<string, LangTranslations>();

const LOADERS: Record<string, () => Promise<any>> = {
  en: () => import('./en'),
  fr: () => import('./fr'),
  es: () => import('./es'),
  de: () => import('./de'),
  pt: () => import('./pt'),
  nl: () => import('./nl'),
};

const EXPORT_NAMES: Record<string, string> = {
  en: 'EN_TRANSLATIONS', fr: 'FR_TRANSLATIONS', es: 'ES_TRANSLATIONS',
  de: 'DE_TRANSLATIONS', pt: 'PT_TRANSLATIONS', nl: 'NL_TRANSLATIONS',
};

/**
 * Carica le traduzioni degli articoli per UNA lingua, on demand. L'italiano
 * è la lingua nativa dei dati (in articles.ts) e non ha bisogno di essere
 * caricato qui — ritorna subito un oggetto vuoto senza scaricare nulla.
 */
export async function loadLanguageTranslations(lang: string): Promise<LangTranslations> {
  if (lang === 'it') return {};
  if (cache.has(lang)) return cache.get(lang)!;
  const loader = LOADERS[lang];
  if (!loader) return {};
  const mod = await loader();
  const data: LangTranslations = mod[EXPORT_NAMES[lang]] || {};
  cache.set(lang, data);
  return data;
}
