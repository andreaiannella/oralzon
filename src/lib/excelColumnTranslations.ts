// Intestazioni del template Excel import prodotti, in tutte le 8 lingue.
// A differenza delle categorie (dove il valore salvato nel DB resta sempre
// in italiano), qui l'intero file — intestazioni comprese — è generato e
// letto nella lingua del venditore: dato che il file va scaricato, compilato
// a mano e ricaricato, avere le colonne in una lingua che il venditore non
// capisce lo blocca del tutto, mentre le categorie restano solo un valore
// interno mai digitato a mano dal venditore stesso.
export type ColumnKey =
  | 'productName' | 'description' | 'category' | 'price' | 'stock' | 'weight'
  | 'brand' | 'sku' | 'specs' | 'status';

export const REQUIRED_KEYS: ColumnKey[] = ['productName', 'description', 'category', 'price', 'stock', 'weight'];
export const OPTIONAL_KEYS: ColumnKey[] = ['brand', 'sku', 'specs', 'status'];
export const ALL_KEYS: ColumnKey[] = [...REQUIRED_KEYS, ...OPTIONAL_KEYS];

export const COLUMN_HEADERS: Record<string, Record<ColumnKey, string>> = {
  it: {
    productName: 'Nome Prodotto', description: 'Descrizione', category: 'Categoria', price: 'Prezzo (€)',
    stock: 'Quantità in Magazzino', weight: 'Peso (kg)', brand: 'Brand', sku: 'Codice SKU',
    specs: 'Specifiche Tecniche', status: 'Stato (pubblicato/bozza)',
  },
  en: {
    productName: 'Product Name', description: 'Description', category: 'Category', price: 'Price (€)',
    stock: 'Stock Quantity', weight: 'Weight (kg)', brand: 'Brand', sku: 'SKU Code',
    specs: 'Technical Specifications', status: 'Status (published/draft)',
  },
  es: {
    productName: 'Nombre del Producto', description: 'Descripción', category: 'Categoría', price: 'Precio (€)',
    stock: 'Cantidad en Stock', weight: 'Peso (kg)', brand: 'Marca', sku: 'Código SKU',
    specs: 'Especificaciones Técnicas', status: 'Estado (publicado/borrador)',
  },
  fr: {
    productName: 'Nom du Produit', description: 'Description', category: 'Catégorie', price: 'Prix (€)',
    stock: 'Quantité en Stock', weight: 'Poids (kg)', brand: 'Marque', sku: 'Code SKU',
    specs: 'Spécifications Techniques', status: 'Statut (publié/brouillon)',
  },
  de: {
    productName: 'Produktname', description: 'Beschreibung', category: 'Kategorie', price: 'Preis (€)',
    stock: 'Lagerbestand', weight: 'Gewicht (kg)', brand: 'Marke', sku: 'SKU-Code',
    specs: 'Technische Daten', status: 'Status (veröffentlicht/Entwurf)',
  },
  pt: {
    productName: 'Nome do Produto', description: 'Descrição', category: 'Categoria', price: 'Preço (€)',
    stock: 'Quantidade em Stock', weight: 'Peso (kg)', brand: 'Marca', sku: 'Código SKU',
    specs: 'Especificações Técnicas', status: 'Estado (publicado/rascunho)',
  },
  nl: {
    productName: 'Productnaam', description: 'Beschrijving', category: 'Categorie', price: 'Prijs (€)',
    stock: 'Voorraadhoeveelheid', weight: 'Gewicht (kg)', brand: 'Merk', sku: 'SKU-code',
    specs: 'Technische Specificaties', status: 'Status (gepubliceerd/concept)',
  },
  pl: {
    productName: 'Nazwa Produktu', description: 'Opis', category: 'Kategoria', price: 'Cena (€)',
    stock: 'Ilość w Magazynie', weight: 'Waga (kg)', brand: 'Marka', sku: 'Kod SKU',
    specs: 'Specyfikacja Techniczna', status: 'Status (opublikowany/szkic)',
  },
};

// Valori accettati per la colonna Stato — solo "bozza"/equivalente porta a
// draft, qualunque altro valore (incluso vuoto) va a published, esattamente
// come il comportamento originale solo-italiano.
export const DRAFT_VALUES: Record<string, string> = {
  it: 'bozza', en: 'draft', es: 'borrador', fr: 'brouillon', de: 'entwurf', pt: 'rascunho', nl: 'concept', pl: 'szkic',
};

// Le 2 righe di esempio nel template, tradotte — così un venditore che
// scarica il template in francese non si ritrova con un prodotto di esempio
// in italiano che non capisce.
export const EXAMPLE_ROWS: Record<string, [string, string, string, string, string, string, string, string, string, string][]> = {
  it: [
    ['Guanti in Nitrile Taglia M', 'Guanti in nitrile monouso, ipoallergenici, ideali per uso clinico quotidiano.', 'Monouso', '19.99', '100', '2.5', 'SafeMed', 'GNM-001', 'Taglia M, 100 pz/scatola, materiale nitrile', 'pubblicato'],
    ['Kit Sterilizzazione Base', 'Kit completo per sterilizzazione strumenti con buste per autoclave incluse.', 'Sterilizzazione', '89.50', '20', '4', 'SterilPro', 'KSB-002', 'Include 200 buste, testato EN ISO 11607', 'pubblicato'],
  ],
  en: [
    ['Nitrile Gloves Size M', 'Disposable nitrile gloves, hypoallergenic, ideal for daily clinical use.', 'Disposables', '19.99', '100', '2.5', 'SafeMed', 'GNM-001', 'Size M, 100 pcs/box, nitrile material', 'published'],
    ['Basic Sterilization Kit', 'Complete instrument sterilization kit with autoclave pouches included.', 'Sterilization', '89.50', '20', '4', 'SterilPro', 'KSB-002', 'Includes 200 pouches, EN ISO 11607 tested', 'published'],
  ],
  es: [
    ['Guantes de Nitrilo Talla M', 'Guantes de nitrilo desechables, hipoalergénicos, ideales para uso clínico diario.', 'Desechables', '19.99', '100', '2.5', 'SafeMed', 'GNM-001', 'Talla M, 100 uds/caja, material nitrilo', 'publicado'],
    ['Kit Básico de Esterilización', 'Kit completo para esterilización de instrumentos con bolsas para autoclave incluidas.', 'Esterilización', '89.50', '20', '4', 'SterilPro', 'KSB-002', 'Incluye 200 bolsas, probado según EN ISO 11607', 'publicado'],
  ],
  fr: [
    ['Gants en Nitrile Taille M', 'Gants en nitrile jetables, hypoallergéniques, idéaux pour un usage clinique quotidien.', 'Jetables', '19.99', '100', '2.5', 'SafeMed', 'GNM-001', 'Taille M, 100 pcs/boîte, matériau nitrile', 'publié'],
    ['Kit de Stérilisation de Base', 'Kit complet de stérilisation des instruments avec sachets pour autoclave inclus.', 'Stérilisation', '89.50', '20', '4', 'SterilPro', 'KSB-002', 'Inclut 200 sachets, testé EN ISO 11607', 'publié'],
  ],
  de: [
    ['Nitrilhandschuhe Größe M', 'Einweg-Nitrilhandschuhe, hypoallergen, ideal für den täglichen klinischen Einsatz.', 'Einwegartikel', '19.99', '100', '2.5', 'SafeMed', 'GNM-001', 'Größe M, 100 Stk/Box, Material Nitril', 'veröffentlicht'],
    ['Basis-Sterilisationsset', 'Komplettes Instrumenten-Sterilisationsset inklusive Autoklavenbeutel.', 'Sterilisation', '89.50', '20', '4', 'SterilPro', 'KSB-002', 'Enthält 200 Beutel, getestet nach EN ISO 11607', 'veröffentlicht'],
  ],
  pt: [
    ['Luvas de Nitrilo Tamanho M', 'Luvas de nitrilo descartáveis, hipoalergénicas, ideais para uso clínico diário.', 'Descartáveis', '19.99', '100', '2.5', 'SafeMed', 'GNM-001', 'Tamanho M, 100 un/caixa, material nitrilo', 'publicado'],
    ['Kit Básico de Esterilização', 'Kit completo para esterilização de instrumentos com bolsas para autoclave incluídas.', 'Esterilização', '89.50', '20', '4', 'SterilPro', 'KSB-002', 'Inclui 200 bolsas, testado segundo EN ISO 11607', 'publicado'],
  ],
  nl: [
    ['Nitril Handschoenen Maat M', 'Wegwerp nitril handschoenen, hypoallergeen, ideaal voor dagelijks klinisch gebruik.', 'Wegwerpartikelen', '19.99', '100', '2.5', 'SafeMed', 'GNM-001', 'Maat M, 100 st/doos, materiaal nitril', 'gepubliceerd'],
    ['Basis Sterilisatieset', 'Compleet instrumenten-sterilisatieset inclusief autoclaafzakjes.', 'Sterilisatie', '89.50', '20', '4', 'SterilPro', 'KSB-002', 'Inclusief 200 zakjes, getest volgens EN ISO 11607', 'gepubliceerd'],
  ],
  pl: [
    ['Rękawiczki Nitrylowe Rozmiar M', 'Jednorazowe rękawiczki nitrylowe, hipoalergiczne, idealne do codziennego użytku klinicznego.', 'Artykuły jednorazowe', '19.99', '100', '2.5', 'SafeMed', 'GNM-001', 'Rozmiar M, 100 szt/pudełko, materiał nitryl', 'opublikowany'],
    ['Podstawowy Zestaw do Sterylizacji', 'Kompletny zestaw do sterylizacji narzędzi wraz z torebkami do autoklawu.', 'Sterylizacja', '89.50', '20', '4', 'SterilPro', 'KSB-002', 'Zawiera 200 torebek, testowane zgodnie z EN ISO 11607', 'opublikowany'],
  ],
};

/**
 * Rileva la lingua di un file caricato confrontando la riga di intestazione
 * con le intestazioni note delle 8 lingue, e sceglie quella con più
 * corrispondenze. Non dipende dalla lingua correntemente selezionata
 * nell'interfaccia: un venditore può scaricare il template in francese,
 * cambiare lingua del sito, e ricaricare lo stesso file senza problemi.
 */
export function detectTemplateLanguage(headerRow: string[]): string {
  const normalized = headerRow.map(h => String(h).trim().toLowerCase());
  let bestLang = 'it';
  let bestScore = -1;
  for (const [lang, headers] of Object.entries(COLUMN_HEADERS)) {
    const expected = Object.values(headers).map(h => h.toLowerCase());
    const score = expected.filter(h => normalized.includes(h)).length;
    if (score > bestScore) { bestScore = score; bestLang = lang; }
  }
  return bestLang;
}

/** Costruisce la mappa "chiave colonna canonica → indice colonna" per la lingua rilevata. */
export function buildColumnIndexMap(headerRow: string[], language: string): Partial<Record<ColumnKey, number>> {
  const normalized = headerRow.map(h => String(h).trim().toLowerCase());
  const headers = COLUMN_HEADERS[language] || COLUMN_HEADERS.it;
  const map: Partial<Record<ColumnKey, number>> = {};
  (Object.keys(headers) as ColumnKey[]).forEach(key => {
    const idx = normalized.indexOf(headers[key].toLowerCase());
    if (idx !== -1) map[key] = idx;
  });
  return map;
}

/** true se il valore della cella Stato corrisponde a "bozza" in una qualsiasi delle 8 lingue. */
export function isDraftValue(value: string): boolean {
  const v = value.trim().toLowerCase();
  return Object.values(DRAFT_VALUES).includes(v);
}
