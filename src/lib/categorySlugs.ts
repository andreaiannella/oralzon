// Slug URL delle categorie tradotti per lingua — es. "monouso" (italiano)
// diventa "jetables" nell'URL francese, "disposables" in quello inglese.
// A differenza del NOME categoria (categoryTranslations.ts, mostrato come
// testo nella pagina), questo modulo riguarda la parte tecnica dell'URL
// stesso: è quello che permette a un utente francese di cercare "gants
// jetables" e trovare un URL che contiene "jetables", non "monouso" — un
// fattore SEO reale, a differenza delle parole strutturali fisse come
// "negozio"/"categoria", lasciate deliberatamente invariate in tutte le
// lingue (vedi discussione: il valore SEO sta nel termine di ricerca, non
// nell'impalcatura di navigazione).
//
// Chiave: il NOME italiano canonico della categoria (stesso usato in
// categoryTranslations.ts) — non lo slug italiano, per evitare una tabella
// di conversione in più.
const CATEGORY_SLUG_TRANSLATIONS: Record<string, Record<string, string>> = {
  'Monouso': {
    en: 'disposables', es: 'desechables', fr: 'jetables', de: 'einwegartikel', pt: 'descartaveis', nl: 'wegwerpartikelen', pl: 'jednorazowe',
  },
  'Sterilizzazione': {
    en: 'sterilization', es: 'esterilizacion', fr: 'sterilisation', de: 'sterilisation', pt: 'esterilizacao', nl: 'sterilisatie', pl: 'sterylizacja',
  },
  'Strumenti Odontoiatrici': {
    en: 'dental-instruments', es: 'instrumental-dental', fr: 'instruments-dentaires', de: 'dentalinstrumente', pt: 'instrumentos-dentarios', nl: 'tandheelkundige-instrumenten', pl: 'narzedzia-dentystyczne',
  },
  'Implantologia': {
    en: 'implantology', es: 'implantologia', fr: 'implantologie', de: 'implantologie', pt: 'implantologia', nl: 'implantologie', pl: 'implantologia',
  },
  'Ortodonzia': {
    en: 'orthodontics', es: 'ortodoncia', fr: 'orthodontie', de: 'kieferorthopadie', pt: 'ortodontia', nl: 'orthodontie', pl: 'ortodoncja',
  },
  'Endodonzia': {
    en: 'endodontics', es: 'endodoncia', fr: 'endodontie', de: 'endodontie', pt: 'endodontia', nl: 'endodontie', pl: 'endodoncja',
  },
  'Materiali da Impronta': {
    en: 'impression-materials', es: 'materiales-de-impresion', fr: 'materiaux-d-empreinte', de: 'abformmaterialien', pt: 'materiais-de-impressao', nl: 'afdrukmaterialen', pl: 'materialy-wyciskowe',
  },
  'Protesica': {
    en: 'prosthetics', es: 'protesica', fr: 'prothese-dentaire', de: 'prothetik', pt: 'protese', nl: 'prothetiek', pl: 'protetyka',
  },
  'Radiologia': {
    en: 'radiology', es: 'radiologia', fr: 'radiologie', de: 'radiologie', pt: 'radiologia', nl: 'radiologie', pl: 'radiologia',
  },
  'Arredi Studio': {
    en: 'office-furniture', es: 'mobiliario-clinico', fr: 'mobilier-de-cabinet', de: 'praxismobiliar', pt: 'mobiliario-clinico', nl: 'praktijkmeubilair', pl: 'wyposazenie-gabinetu',
  },
  'Abbigliamento e Divise': {
    en: 'workwear', es: 'uniformes', fr: 'tenues-professionnelles', de: 'berufsbekleidung', pt: 'uniformes', nl: 'werkkleding', pl: 'odziez-i-uniformy',
  },
  'Disinfezione': {
    en: 'disinfection', es: 'desinfeccion', fr: 'desinfection', de: 'desinfektion', pt: 'desinfecao', nl: 'desinfectie', pl: 'dezynfekcja',
  },
  'Consumabili': {
    en: 'consumables', es: 'consumibles', fr: 'consommables', de: 'verbrauchsmaterial', pt: 'consumiveis', nl: 'verbruiksartikelen', pl: 'materialy-zuzywalne',
  },
  'Igiene Orale Professionale': {
    en: 'professional-oral-hygiene', es: 'higiene-oral-profesional', fr: 'hygiene-bucco-dentaire', de: 'professionelle-mundhygiene', pt: 'higiene-oral-profissional', nl: 'professionele-mondhygiene', pl: 'profesjonalna-higiena-jamy-ustnej',
  },
};

/**
 * Slug da usare nel link per la lingua corrente. italianSlug è quello già
 * presente in DENTAL_CATEGORIES (usato come fallback e per l'italiano).
 */
export function localizeCategorySlug(categoryName: string, italianSlug: string, language: string): string {
  if (language === 'it') return italianSlug;
  return CATEGORY_SLUG_TRANSLATIONS[categoryName]?.[language] || italianSlug;
}

/**
 * Risale al nome italiano canonico della categoria dato UNO SLUG QUALSIASI,
 * in una qualunque delle 8 lingue (compreso l'italiano stesso). Usata per
 * interpretare l'URL in arrivo, indipendentemente dalla lingua con cui è
 * stato generato — un link francese già condiviso/indicizzato continua a
 * funzionare anche se l'utente cambia lingua del sito.
 */
export function delocalizeCategorySlug(slug: string, italianSlugToName: Record<string, string>): string | null {
  const needle = slug.trim().toLowerCase();
  if (italianSlugToName[needle]) return italianSlugToName[needle];
  for (const [italianName, translations] of Object.entries(CATEGORY_SLUG_TRANSLATIONS)) {
    for (const translated of Object.values(translations)) {
      if (translated === needle) return italianName;
    }
  }
  return null;
}
