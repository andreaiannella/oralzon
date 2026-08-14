// Un prodotto è sempre scritto in italiano dal venditore; le traduzioni
// automatiche vivono nella colonna jsonb `translations`, con struttura
// { en: {name, description, specifications}, ... }.
//
// ATTENZIONE — quel jsonb è una CACHE DI LETTURA, non la fonte di verità.
// La fonte è la tabella `product_translations`, scritta dal Translation
// Engine (trigger su products → coda translation_jobs → edge function
// translation-worker via pg_cron ogni minuto → DeepL con glossario
// odontoiatrico). Un trigger su product_translations riversa il testo nel
// jsonb, che è ciò che questo helper legge.
//
// Il doppio livello esiste per una ragione precisa: al passaggio al
// Translation Engine le traduzioni furono spostate nella tabella nuova
// senza aggiornare chi le leggeva, e per settimane il sito ha mostrato
// titoli e descrizioni in italiano in tutte le lingue pur avendo 329
// traduzioni regolarmente generate e pagate a database. Tenere il jsonb
// allineato via trigger è ciò che evita di dover riscrivere ogni query
// prodotto del frontend — ma se un giorno una traduzione non compare,
// il primo posto da guardare è se il trigger ha popolato questo campo,
// non se la traduzione esiste.
//
// Questo helper sceglie i campi giusti in base alla lingua corrente
// dell'utente, ricadendo sempre sull'italiano se la lingua è 'it', se il
// prodotto non ha ancora traduzioni, o se manca quella lingua specifica.
export function localizeProduct<T extends { name?: string; description?: string; specifications?: string; translations?: Record<string, { name?: string; description?: string; specifications?: string }> | null }>(
  product: T | null | undefined,
  language: string
): T {
  if (!product) return product as T;
  if (language === 'it' || !product.translations) return product;
  const t = product.translations[language];
  if (!t) return product;
  return {
    ...product,
    name: t.name || product.name,
    description: t.description || product.description,
    specifications: t.specifications || product.specifications,
  };
}
