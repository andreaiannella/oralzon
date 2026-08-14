// ── Generazione della sitemap a build time ──────────────────────────────
//
// BUG TROVATO: public/robots.txt dichiarava
//   Sitemap: https://oralzon.com/sitemap.xml
// ma quel file non esisteva e nessuno lo generava. Google riceveva un 404
// (in realtà l'index.html, per via del redirect catch-all di Netlify, che è
// peggio di un 404: un XML atteso servito come HTML). Risultato: nessuna
// mappa del sito, e le pagine profonde — i 151 articoli del blog per 8
// lingue — raggiungibili solo seguendo link a partire da /blog, che è una
// lista filtrata lato client.
//
// Questo plugin scrive dist/sitemap.xml al termine della build usando i dati
// REALI del progetto (articoli, categorie, rotte) invece di un elenco
// scritto a mano che invecchierebbe al primo articolo aggiunto.
//
// Ogni URL è dichiarato in tutte e 8 le lingue con i rispettivi hreflang,
// più x-default sull'italiano: è così che Google capisce che /blog/xyz e
// /en/blog/abc sono la stessa pagina in lingue diverse invece di due
// contenuti che competono tra loro.
//
// NOTA sui prodotti: non sono inclusi qui perché vivono su Supabase e la
// build non ha (né deve avere) credenziali del database. Sono comunque
// raggiungibili tramite i link interni del catalogo e degli articoli. Se in
// futuro servisse una sitemap prodotti, la strada giusta è un endpoint
// dell'edge function che la generi a runtime, non una query in fase di build.

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { BLOG_ARTICLES } from './src/data/articles';
import { DENTAL_CATEGORIES } from './src/constants/categories';
import { localizeCategorySlug } from './src/lib/categorySlugs';
import { slugify } from './src/lib/articleSlug';
// Import statici: la config di Vite viene essa stessa bundlata, e un import
// dinamico con path calcolato non è risolvibile in quel contesto (il modulo
// non finisce nel bundle e a runtime fallisce). Sono file grandi, ma vengono
// caricati solo durante la build, mai spediti al browser.
import { EN_TRANSLATIONS } from './src/data/articleTranslations/en';
import { ES_TRANSLATIONS } from './src/data/articleTranslations/es';
import { FR_TRANSLATIONS } from './src/data/articleTranslations/fr';
import { DE_TRANSLATIONS } from './src/data/articleTranslations/de';
import { PT_TRANSLATIONS } from './src/data/articleTranslations/pt';
import { NL_TRANSLATIONS } from './src/data/articleTranslations/nl';
import { PL_TRANSLATIONS } from './src/data/articleTranslations/pl';

const TRANSLATIONS_BY_LANG: Record<string, Record<string, { title: string }>> = {
  en: EN_TRANSLATIONS, es: ES_TRANSLATIONS, fr: FR_TRANSLATIONS, de: DE_TRANSLATIONS,
  pt: PT_TRANSLATIONS, nl: NL_TRANSLATIONS, pl: PL_TRANSLATIONS,
};

const SITE = 'https://oralzon.com';
const LANGS = ['it', 'en', 'es', 'fr', 'de', 'pt', 'nl', 'pl'] as const;

/** Prefisso URL per lingua: l'italiano è la lingua di default e non ha prefisso. */
const prefix = (lang: string) => (lang === 'it' ? '' : `/${lang}`);

/** Rotte pubbliche statiche. Le pagine private (account, carrello, checkout,
 *  dashboard venditore, admin) sono volutamente escluse: sono noindex. */
const STATIC_PATHS: { path: string; priority: string; changefreq: string }[] = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/negozio', priority: '0.9', changefreq: 'daily' },
  { path: '/offerte', priority: '0.8', changefreq: 'daily' },
  { path: '/bestseller', priority: '0.7', changefreq: 'weekly' },
  { path: '/nuovi-arrivi', priority: '0.7', changefreq: 'daily' },
  { path: '/blog', priority: '0.8', changefreq: 'weekly' },
  { path: '/diventa-venditore', priority: '0.7', changefreq: 'monthly' },
  { path: '/pricing-venditori', priority: '0.6', changefreq: 'monthly' },
  { path: '/chi-siamo', priority: '0.5', changefreq: 'yearly' },
  { path: '/contatti', priority: '0.5', changefreq: 'yearly' },
  { path: '/faq', priority: '0.5', changefreq: 'monthly' },
  { path: '/info-spedizione', priority: '0.4', changefreq: 'yearly' },
  { path: '/metodi-pagamento', priority: '0.4', changefreq: 'yearly' },
  { path: '/resi', priority: '0.4', changefreq: 'yearly' },
  { path: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { path: '/cookie', priority: '0.3', changefreq: 'yearly' },
  { path: '/termini', priority: '0.3', changefreq: 'yearly' },
  { path: '/condizioni-vendita', priority: '0.3', changefreq: 'yearly' },
];

const xmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Un blocco <url> per lingua, ciascuno con gli hreflang verso tutte le altre.
 * pathFor(lang) restituisce il path (senza prefisso lingua) in quella lingua:
 * serve perché slug di articoli e categorie sono tradotti.
 */
function urlBlocks(
  pathFor: (lang: string) => string,
  opts: { priority: string; changefreq: string; lastmod?: string }
): string {
  const alternates = LANGS.map(
    l => `      <xhtml:link rel="alternate" hreflang="${l}" href="${xmlEscape(SITE + prefix(l) + pathFor(l))}" />`
  ).join('\n');
  const xDefault = `      <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(SITE + pathFor('it'))}" />`;

  return LANGS.map(lang => {
    const loc = xmlEscape(SITE + prefix(lang) + pathFor(lang));
    const lastmod = opts.lastmod ? `\n      <lastmod>${opts.lastmod}</lastmod>` : '';
    return `  <url>
      <loc>${loc}</loc>${lastmod}
      <changefreq>${opts.changefreq}</changefreq>
      <priority>${opts.priority}</priority>
${alternates}
${xDefault}
  </url>`;
  }).join('\n');
}

export function sitemapPlugin() {
  return {
    name: 'oralzon-sitemap',
    apply: 'build' as const,
    closeBundle() {
      const parts: string[] = [];

      for (const p of STATIC_PATHS) {
        parts.push(urlBlocks(() => p.path, { priority: p.priority, changefreq: p.changefreq }));
      }

      for (const cat of DENTAL_CATEGORIES) {
        parts.push(
          urlBlocks(
            lang => `/negozio/categoria/${localizeCategorySlug(cat.name, cat.slug, lang)}`,
            { priority: '0.8', changefreq: 'weekly' }
          )
        );
      }

      for (const a of BLOG_ARTICLES as { slug: string; publishedAt: string }[]) {
        parts.push(
          urlBlocks(
            lang => {
              if (lang === 'it') return `/blog/${a.slug}`;
              const t = TRANSLATIONS_BY_LANG[lang]?.[a.slug]?.title;
              return `/blog/${t ? slugify(t) : a.slug}`;
            },
            { priority: '0.6', changefreq: 'monthly', lastmod: a.publishedAt }
          )
        );
      }

      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${parts.join('\n')}
</urlset>
`;
      const outFile = resolve(__dirname, 'dist/sitemap.xml');
      writeFileSync(outFile, xml, 'utf-8');

      const urlCount = (xml.match(/<loc>/g) || []).length;
      console.log(`[sitemap] dist/sitemap.xml — ${urlCount} URL in ${LANGS.length} lingue`);
    },
  };
}
