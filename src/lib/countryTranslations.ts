// Traduzione statica dei nomi paese — stesso principio di categoryTranslations.ts.
// Chiave per codice ISO (stabile, indipendente dalla lingua), non per il nome
// italiano: PAESI_COMUNI in constants/countries.ts resta la fonte dei codici,
// qui si traduce solo l'etichetta mostrata.
const COUNTRY_LABELS: Record<string, Record<string, string>> = {
  IT: { en: 'Italy', es: 'Italia', fr: 'Italie', de: 'Italien', pt: 'Itália', nl: 'Italië', pl: 'Włochy' },
  DE: { en: 'Germany', es: 'Alemania', fr: 'Allemagne', de: 'Deutschland', pt: 'Alemanha', nl: 'Duitsland', pl: 'Niemcy' },
  FR: { en: 'France', es: 'Francia', fr: 'France', de: 'Frankreich', pt: 'França', nl: 'Frankrijk', pl: 'Francja' },
  ES: { en: 'Spain', es: 'España', fr: 'Espagne', de: 'Spanien', pt: 'Espanha', nl: 'Spanje', pl: 'Hiszpania' },
  PT: { en: 'Portugal', es: 'Portugal', fr: 'Portugal', de: 'Portugal', pt: 'Portugal', nl: 'Portugal', pl: 'Portugalia' },
  NL: { en: 'Netherlands', es: 'Países Bajos', fr: 'Pays-Bas', de: 'Niederlande', pt: 'Países Baixos', nl: 'Nederland', pl: 'Holandia' },
  BE: { en: 'Belgium', es: 'Bélgica', fr: 'Belgique', de: 'Belgien', pt: 'Bélgica', nl: 'België', pl: 'Belgia' },
  AT: { en: 'Austria', es: 'Austria', fr: 'Autriche', de: 'Österreich', pt: 'Áustria', nl: 'Oostenrijk', pl: 'Austria' },
  IE: { en: 'Ireland', es: 'Irlanda', fr: 'Irlande', de: 'Irland', pt: 'Irlanda', nl: 'Ierland', pl: 'Irlandia' },
  PL: { en: 'Poland', es: 'Polonia', fr: 'Pologne', de: 'Polen', pt: 'Polónia', nl: 'Polen', pl: 'Polska' },
  SE: { en: 'Sweden', es: 'Suecia', fr: 'Suède', de: 'Schweden', pt: 'Suécia', nl: 'Zweden', pl: 'Szwecja' },
  DK: { en: 'Denmark', es: 'Dinamarca', fr: 'Danemark', de: 'Dänemark', pt: 'Dinamarca', nl: 'Denemarken', pl: 'Dania' },
  FI: { en: 'Finland', es: 'Finlandia', fr: 'Finlande', de: 'Finnland', pt: 'Finlândia', nl: 'Finland', pl: 'Finlandia' },
  GR: { en: 'Greece', es: 'Grecia', fr: 'Grèce', de: 'Griechenland', pt: 'Grécia', nl: 'Griekenland', pl: 'Grecja' },
  CZ: { en: 'Czech Republic', es: 'República Checa', fr: 'République Tchèque', de: 'Tschechische Republik', pt: 'República Checa', nl: 'Tsjechië', pl: 'Czechy' },
  RO: { en: 'Romania', es: 'Rumanía', fr: 'Roumanie', de: 'Rumänien', pt: 'Roménia', nl: 'Roemenië', pl: 'Rumunia' },
  HU: { en: 'Hungary', es: 'Hungría', fr: 'Hongrie', de: 'Ungarn', pt: 'Hungria', nl: 'Hongarije', pl: 'Węgry' },
  HR: { en: 'Croatia', es: 'Croacia', fr: 'Croatie', de: 'Kroatien', pt: 'Croácia', nl: 'Kroatië', pl: 'Chorwacja' },
  SK: { en: 'Slovakia', es: 'Eslovaquia', fr: 'Slovaquie', de: 'Slowakei', pt: 'Eslováquia', nl: 'Slowakije', pl: 'Słowacja' },
  SI: { en: 'Slovenia', es: 'Eslovenia', fr: 'Slovénie', de: 'Slowenien', pt: 'Eslovénia', nl: 'Slovenië', pl: 'Słowenia' },
  LT: { en: 'Lithuania', es: 'Lituania', fr: 'Lituanie', de: 'Litauen', pt: 'Lituânia', nl: 'Litouwen', pl: 'Litwa' },
  LV: { en: 'Latvia', es: 'Letonia', fr: 'Lettonie', de: 'Lettland', pt: 'Letónia', nl: 'Letland', pl: 'Łotwa' },
  EE: { en: 'Estonia', es: 'Estonia', fr: 'Estonie', de: 'Estland', pt: 'Estónia', nl: 'Estland', pl: 'Estonia' },
  LU: { en: 'Luxembourg', es: 'Luxemburgo', fr: 'Luxembourg', de: 'Luxemburg', pt: 'Luxemburgo', nl: 'Luxemburg', pl: 'Luksemburg' },
  MT: { en: 'Malta', es: 'Malta', fr: 'Malte', de: 'Malta', pt: 'Malta', nl: 'Malta', pl: 'Malta' },
  CY: { en: 'Cyprus', es: 'Chipre', fr: 'Chypre', de: 'Zypern', pt: 'Chipre', nl: 'Cyprus', pl: 'Cypr' },
  BG: { en: 'Bulgaria', es: 'Bulgaria', fr: 'Bulgarie', de: 'Bulgarien', pt: 'Bulgária', nl: 'Bulgarije', pl: 'Bułgaria' },
  OTHER: { en: 'Other country', es: 'Otro país', fr: 'Autre pays', de: 'Anderes Land', pt: 'Outro país', nl: 'Ander land', pl: 'Inny kraj' },
};

/** Nome paese localizzato per la lingua corrente; ricade sull'italiano se manca la traduzione o la lingua è 'it'. */
export function localizeCountryName(code: string, italianLabel: string, language: string): string {
  if (language === 'it') return italianLabel;
  return COUNTRY_LABELS[code]?.[language] || italianLabel;
}
