// Risolve titolo/descrizione/contenuto di un articolo del blog nella lingua
// attiva, con fallback automatico all'italiano se quella lingua non è ancora
// stata tradotta per questo articolo specifico. Permette di aggiungere le
// traduzioni un pezzo alla volta senza mai lasciare una pagina vuota o rotta.
//
// Il terzo parametro (opzionale) è la mappa slug->traduzione della lingua
// corrente, caricata pigramente da loadLanguageTranslations() nel componente
// chiamante — non più letta da article.translations, che non viene più
// popolato in anticipo per tutte le lingue insieme (vedi articleTranslations/index.ts).
export function getLocalizedArticle(article: any, lang: string, translationsBySlug?: Record<string, any>) {
  const t = translationsBySlug?.[article.slug] || article.translations?.[lang];
  return {
    ...article,
    title: t?.title || article.title,
    description: t?.description || article.description,
    content: t?.content || article.content,
  };
}
