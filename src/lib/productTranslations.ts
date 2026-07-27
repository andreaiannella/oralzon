// Un prodotto è sempre scritto in italiano dal venditore; le traduzioni
// automatiche (vedi edge function vendor/save-product) vivono nella colonna
// `translations`, con struttura { en: {name, description, specifications}, ... }.
// Questo helper sceglie i campi giusti in base alla lingua corrente
// dell'utente, ricadendo sempre sull'italiano se la lingua è 'it', se il
// prodotto non ha ancora traduzioni (es. creato prima di questa funzione,
// o traduzione fallita), o se manca quella lingua specifica.
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
