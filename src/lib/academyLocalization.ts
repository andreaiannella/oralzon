import { ACADEMY_GUIDES, AcademyGuide } from '../data/academyGuides';
import { EN_ACADEMY_TRANSLATIONS } from '../data/academyTranslations/en';
import { ES_ACADEMY_TRANSLATIONS } from '../data/academyTranslations/es';
import { FR_ACADEMY_TRANSLATIONS } from '../data/academyTranslations/fr';
import { DE_ACADEMY_TRANSLATIONS } from '../data/academyTranslations/de';
import { PT_ACADEMY_TRANSLATIONS } from '../data/academyTranslations/pt';
import { NL_ACADEMY_TRANSLATIONS } from '../data/academyTranslations/nl';
import { PL_ACADEMY_TRANSLATIONS } from '../data/academyTranslations/pl';

const TRANSLATIONS_BY_LANG: Record<string, Record<string, any>> = {
  en: EN_ACADEMY_TRANSLATIONS,
  es: ES_ACADEMY_TRANSLATIONS,
  fr: FR_ACADEMY_TRANSLATIONS,
  de: DE_ACADEMY_TRANSLATIONS,
  pt: PT_ACADEMY_TRANSLATIONS,
  nl: NL_ACADEMY_TRANSLATIONS,
  // NOTA: pl copre per ora SOLO la guida "come-usare-le-sponsorizzazioni"
  // (tradotta il 12/08/2026) — le altre 5 guide fanno fallback naturale
  // all'italiano finché non vengono tradotte anche loro, il meccanismo
  // sotto già lo gestisce guida per guida, nessun problema strutturale.
  pl: PL_ACADEMY_TRANSLATIONS,
};

// Stesso principio di getLocalizedArticle per il blog: la guida italiana
// resta sempre la fonte (id/slug canonici), la traduzione sovrascrive solo
// titolo/descrizione/sezioni quando esiste per la lingua richiesta —
// fallback automatico all'italiano se una guida non è ancora tradotta.
export function getLocalizedGuide(guide: AcademyGuide, language: string): AcademyGuide {
  const translation = TRANSLATIONS_BY_LANG[language]?.[guide.slug];
  if (!translation) return guide;
  return { ...guide, title: translation.title, description: translation.description, sections: translation.sections };
}

export function getLocalizedGuides(language: string): AcademyGuide[] {
  return ACADEMY_GUIDES.map(g => getLocalizedGuide(g, language));
}

export function getLocalizedGuideBySlug(slug: string, language: string): AcademyGuide | undefined {
  const guide = ACADEMY_GUIDES.find(g => g.slug === slug);
  return guide ? getLocalizedGuide(guide, language) : undefined;
}
