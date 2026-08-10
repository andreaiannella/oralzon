import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getBasename } from './urlLanguage';

// BUG SERIO TROVATO: solo Product.tsx e BlogArticle.tsx aggiornavano titolo
// e descrizione a runtime — OGNI altra pagina (negozio, categorie, home,
// offerte, novità, bestseller, store venditore) restava con i tag STATICI
// di index.html: canonical sempre su "https://oralzon.com" (la home),
// og:locale sempre "it_IT", titolo sempre quello generico della home.
// Il canonical sbagliato in particolare dice esplicitamente a Google "questa
// pagina è un duplicato della home, non indicizzarla separatamente" — per
// probabilmente l'intero catalogo, in tutte le lingue.
//
// Questo hook centralizza la correzione: ogni pagina indicizzabile lo
// richiama con il proprio titolo/descrizione, e canonical/OG/Twitter/robots
// vengono impostati coerentemente con l'URL e la lingua REALI di quella
// pagina in quel momento.
const OG_LOCALE_MAP: Record<string, string> = {
  it: 'it_IT', en: 'en_US', es: 'es_ES', fr: 'fr_FR', de: 'de_DE', pt: 'pt_PT', nl: 'nl_NL', pl: 'pl_PL',
};

const DEFAULT_DESCRIPTION = 'Il marketplace professionale per studi dentistici. Acquista strumenti odontoiatrici, materiali, monouso, sterilizzazione e implantologia da fornitori verificati.';

function upsertMeta(attrName: 'name' | 'property', attrValue: string, content: string) {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export interface PageSEOOptions {
  title: string;
  description?: string;
  language: string;
  /** Pagine private/funzionali (account, carrello, checkout, dashboard) — mai da mostrare nei risultati di ricerca. */
  noIndex?: boolean;
}

export function usePageSEO({ title, description, language, noIndex }: PageSEOOptions) {
  const location = useLocation();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    const desc = description || DEFAULT_DESCRIPTION;
    upsertMeta('name', 'description', desc);
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', desc);
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', desc);
    upsertMeta('property', 'og:locale', OG_LOCALE_MAP[language] || 'it_IT');
    upsertMeta('name', 'robots', noIndex ? 'noindex, follow' : 'index, follow');

    // Canonical: SEMPRE l'URL reale di questa pagina in questa lingua, mai
    // un'altra pagina — ogni variante linguistica si auto-referenzia; sono
    // gli hreflang (vedi HrefLangTags in App.tsx) a collegarle tra loro,
    // non il canonical.
    const basename = getBasename(window.location.pathname);
    const fullUrl = `https://oralzon.com${basename}${location.pathname}`;
    let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.rel = 'canonical';
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = fullUrl;
    upsertMeta('property', 'og:url', fullUrl);

    // Ripristina solo il titolo dello smontaggio — gli altri tag verranno
    // comunque sovrascritti dalla pagina successiva che monta, ripristinare
    // valori intermedi qui non porterebbe benefici.
    return () => { document.title = previousTitle; };
  }, [title, description, language, noIndex, location.pathname]);
}
