// Risolve titolo/descrizione/contenuto di un articolo del blog nella lingua
// attiva, con fallback automatico all'italiano se quella lingua non è ancora
// stata tradotta per questo articolo specifico. Permette di aggiungere le
// traduzioni un pezzo alla volta senza mai lasciare una pagina vuota o rotta.
export function getLocalizedArticle(article: any, lang: string) {
  const t = article.translations?.[lang];
  return {
    ...article,
    title: t?.title || article.title,
    description: t?.description || article.description,
    content: t?.content || article.content,
  };
}
