import { EN_TRANSLATIONS } from './en';
import { FR_TRANSLATIONS } from './fr';

// Mappa lingua -> traduzioni. Man mano che si aggiungono altre lingue
// (es. ES_TRANSLATIONS, DE_TRANSLATIONS...), si importano e si aggiungono
// qui — un file per lingua, tenuti separati per non appesantire un unico
// file enorme e per poter completare una lingua alla volta.
const TRANSLATIONS_BY_LANG: Record<string, Record<string, { title: string; description: string; content: string[] }>> = {
  en: EN_TRANSLATIONS,
  fr: FR_TRANSLATIONS,
};

/**
 * Applica le traduzioni disponibili a un array di articoli, popolando il
 * campo `translations` di ciascuno (quello che getLocalizedArticle già si
 * aspetta). Un articolo senza traduzione per una lingua resta invariato —
 * il fallback all'italiano avviene comunque a valle, in getLocalizedArticle.
 */
export function applyArticleTranslations<T extends { slug: string; translations?: Record<string, any> }>(articles: T[]): T[] {
  return articles.map(article => {
    const translations: Record<string, any> = { ...(article.translations || {}) };
    for (const [lang, byLangSlug] of Object.entries(TRANSLATIONS_BY_LANG)) {
      const t = byLangSlug[article.slug];
      if (t) translations[lang] = t;
    }
    return { ...article, translations };
  });
}
