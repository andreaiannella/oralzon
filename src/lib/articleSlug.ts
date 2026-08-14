import { LangTranslations } from '../data/articleTranslations';

// Stessa idea già applicata alle categorie (categorySlugs.ts): lo slug
// nell'URL deve essere nella lingua di chi legge, non sempre in italiano —
// altrimenti un articolo mostrato in inglese ha comunque un indirizzo
// italiano, un segnale confuso sia per chi legge sia per Google.
//
// A differenza delle categorie (14, tradotte a mano una volta), gli
// articoli sono 119 e la traduzione avanza articolo per articolo nel
// tempo — tradurre 119 slug a mano per ogni lingua non sarebbe
// praticabile, e andrebbe risincronizzato ad ogni nuova traduzione. Invece
// lo slug si DERIVA automaticamente dal titolo già tradotto (che esiste
// comunque, per mostrare l'articolo): se un articolo ha la traduzione,
// lo slug la segue automaticamente; se non ce l'ha ancora, resta quello
// italiano (coerente: anche il CONTENUTO mostrato è ancora italiano in
// quel caso, grazie al fallback già esistente in getLocalizedArticle).

// BUG TROVATO: la sola normalizzazione NFD non basta. NFD scompone un
// carattere accentato in lettera base + segno diacritico (é -> e + accento),
// e togliendo i diacritici resta la lettera. Ma alcune lettere NON sono
// composte in questo modo: sono caratteri a sé stanti, e NFD non le tocca.
// La ł polacca è il caso peggiore per noi — non venendo scomposta, cadeva
// nella regola successiva [^a-z0-9] e spariva, lasciando un trattino al suo
// posto: "powikłaniami" diventava "powik-aniami", "dziąsłowy" diventava
// "dzias-owy". 126 slug polacchi su 151 erano illeggibili in questo modo.
// La mappa qui sotto traslittera esplicitamente i caratteri che NFD non
// gestisce, PRIMA della normalizzazione.
const NON_DECOMPOSABLE: Record<string, string> = {
  'ł': 'l', 'Ł': 'l',
  'đ': 'd', 'Đ': 'd', 'ð': 'd', 'Ð': 'd',
  'ø': 'o', 'Ø': 'o',
  'æ': 'ae', 'Æ': 'ae',
  'œ': 'oe', 'Œ': 'oe',
  'ß': 'ss',
  'þ': 'th', 'Þ': 'th',
  'ı': 'i', 'İ': 'i',
};

function transliterate(text: string): string {
  return text.replace(/[łŁđĐðÐøØæÆœŒßþÞıİ]/g, ch => NON_DECOMPOSABLE[ch] ?? ch);
}

export function slugify(text: string): string {
  return transliterate(text)
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // toglie accenti (é -> e, ü -> u, ecc.)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100); // slug eccessivamente lunghi non aiutano la SEO, e alcuni titoli tradotti superano quelli italiani in lunghezza
}

// Slug prodotto dalla versione precedente di slugify (senza traslitterazione).
// Serve solo a non rompere gli indirizzi già condivisi o eventualmente già
// raccolti da un crawler prima della correzione: delocalizeArticleSlug li
// riconosce ancora, e il consolidamento in BlogArticle.tsx riscrive poi
// l'indirizzo su quello corretto.
export function legacySlugify(text: string): string {
  return text
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

/** Slug da usare nel link, nella lingua corrente. italianSlug è il fallback per l'italiano e per articoli non ancora tradotti in quella lingua. */
export function localizeArticleSlug(italianSlug: string, language: string, translations: LangTranslations): string {
  if (language === 'it') return italianSlug;
  const translatedTitle = translations[italianSlug]?.title;
  if (!translatedTitle) return italianSlug; // non ancora tradotto in questa lingua: resta italiano, coerente col contenuto (anch'esso ancora in fallback italiano)
  return slugify(translatedTitle);
}

/**
 * Risale allo slug italiano canonico dato UNO SLUG QUALSIASI nell'URL in
 * arrivo — può essere già italiano (link vecchio/condiviso) o nella lingua
 * corrente (derivato da un titolo tradotto). Serve per interpretare
 * correttamente l'URL indipendentemente da quale dei due formati contiene.
 */
export function delocalizeArticleSlug(incomingSlug: string, italianSlugs: string[], translations: LangTranslations): string | null {
  if (italianSlugs.includes(incomingSlug)) return incomingSlug;
  for (const italianSlug of italianSlugs) {
    const translatedTitle = translations[italianSlug]?.title;
    if (translatedTitle && (slugify(translatedTitle) === incomingSlug || legacySlugify(translatedTitle) === incomingSlug)) return italianSlug;
  }
  return null;
}
