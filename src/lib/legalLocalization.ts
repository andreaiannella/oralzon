import { TERMINI_SERVIZIO_IT, CONDIZIONI_VENDITA_IT, LegalDocument } from '../data/legalContent';
import { EN_LEGAL } from '../data/legalTranslations/en';
import { ES_LEGAL } from '../data/legalTranslations/es';
import { FR_LEGAL } from '../data/legalTranslations/fr';
import { DE_LEGAL } from '../data/legalTranslations/de';
import { PT_LEGAL } from '../data/legalTranslations/pt';
import { NL_LEGAL } from '../data/legalTranslations/nl';
import { PL_LEGAL } from '../data/legalTranslations/pl';

const TRANSLATIONS_BY_LANG: Record<string, { termini: LegalDocument; condizioni: LegalDocument }> = {
  en: EN_LEGAL, es: ES_LEGAL, fr: FR_LEGAL, de: DE_LEGAL, pt: PT_LEGAL, nl: NL_LEGAL, pl: PL_LEGAL,
};

// Stesso principio di getLocalizedArticle/getLocalizedGuide: l'italiano
// resta sempre la fonte, la traduzione sovrascrive quando esiste per la
// lingua richiesta, altrimenti fallback automatico all'italiano — il
// testo legale ITALIANO fa comunque fede in caso di discrepanza (vedi
// legalPages.italianNotice), quindi mostrare l'italiano come fallback
// prima che una traduzione sia pronta non è mai fuorviante.
export function getLocalizedTermini(language: string): LegalDocument {
  return TRANSLATIONS_BY_LANG[language]?.termini || TERMINI_SERVIZIO_IT;
}

export function getLocalizedCondizioniVendita(language: string): LegalDocument {
  return TRANSLATIONS_BY_LANG[language]?.condizioni || CONDIZIONI_VENDITA_IT;
}
