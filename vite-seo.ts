// ── Prerendering statico + sitemap ──────────────────────────────────────
//
// IL PROBLEMA. Oralzon è una single page application: il server manda a
// tutti lo stesso index.html vuoto e il contenuto viene costruito da
// JavaScript nel browser. I meta tag corretti li imposta usePageSEO, ma solo
// DOPO che il bundle è stato scaricato ed eseguito. Googlebot sa eseguire
// JavaScript, ma lo fa in una seconda passata che può arrivare molto dopo la
// prima; e i crawler che NON eseguono JavaScript — LinkedIn, WhatsApp,
// Slack, Bing in molti casi, gli scraper degli aggregatori — vedono soltanto
// il guscio vuoto con i tag della home.
//
// LA SOLUZIONE ADOTTATA. Al termine della build scriviamo un file HTML reale
// per ogni articolo del blog, in ognuna delle 8 lingue: head già corretto e
// testo dell'articolo già dentro <div id="root">. Netlify serve il file vero
// quando esiste (le regole non forzate risolvono prima i file statici) e
// ricade sul catch-all SPA solo per i percorsi che non hanno un file. Al
// caricamento, createRoot() sostituisce quel contenuto con l'applicazione
// vera: nessuna idratazione, quindi nessun rischio di mismatch.
//
// PERCHÉ NON UN SSR VERO. Renderizzare l'albero React in Node avrebbe
// richiesto di far funzionare fuori dal browser AuthContext (che interroga
// Supabase), i18n con caricamento asincrono, localStorage e window sparsi nei
// componenti: molta superficie di rottura per un guadagno che qui non c'è,
// perché il contenuto degli articoli è dato statico già disponibile a build
// time. I prodotti restano fuori dal prerendering per il motivo opposto: i
// loro dati stanno su Supabase e la build non ha (né deve avere) credenziali
// del database — per loro la sitemap del catalogo generata a runtime
// dall'edge function resta la strada giusta.
//
// COSA VIENE PRERENDERIZZATO:
//   - i 151 articoli del blog in 8 lingue, con testo completo
//   - le pagine statiche in italiano
// Le pagine statiche nelle altre lingue non sono incluse: i loro titoli e
// descrizioni SEO esistono solo in italiano, e pubblicare meta italiani su
// /en/chi-siamo sarebbe peggio che lasciare fare al client, che già li
// imposta correttamente.

import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { BLOG_ARTICLES } from './src/data/articles';
import { DENTAL_CATEGORIES } from './src/constants/categories';
import { localizeCategorySlug } from './src/lib/categorySlugs';
import { slugify } from './src/lib/articleSlug';
import { EN_TRANSLATIONS } from './src/data/articleTranslations/en';
import { ES_TRANSLATIONS } from './src/data/articleTranslations/es';
import { FR_TRANSLATIONS } from './src/data/articleTranslations/fr';
import { DE_TRANSLATIONS } from './src/data/articleTranslations/de';
import { PT_TRANSLATIONS } from './src/data/articleTranslations/pt';
import { NL_TRANSLATIONS } from './src/data/articleTranslations/nl';
import { PL_TRANSLATIONS } from './src/data/articleTranslations/pl';

type Tr = Record<string, { title: string; description: string; content: string[] }>;

const TRANSLATIONS: Record<string, Tr> = {
  en: EN_TRANSLATIONS as Tr, es: ES_TRANSLATIONS as Tr, fr: FR_TRANSLATIONS as Tr,
  de: DE_TRANSLATIONS as Tr, pt: PT_TRANSLATIONS as Tr, nl: NL_TRANSLATIONS as Tr,
  pl: PL_TRANSLATIONS as Tr,
};

const SITE = 'https://oralzon.com';
const LANGS = ['it', 'en', 'es', 'fr', 'de', 'pt', 'nl', 'pl'] as const;
const OG_LOCALE: Record<string, string> = {
  it: 'it_IT', en: 'en_US', es: 'es_ES', fr: 'fr_FR', de: 'de_DE', pt: 'pt_PT', nl: 'nl_NL', pl: 'pl_PL',
};
const META_DESC_LIMIT = 155;

const prefix = (lang: string) => (lang === 'it' ? '' : `/${lang}`);

const STATIC_PATHS: { path: string; priority: string; changefreq: string; title?: string; description?: string }[] = [
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

const htmlEscape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function truncateForMeta(text: string, limit = META_DESC_LIMIT): string {
  const t = text.trim();
  if (t.length <= limit) return t;
  const cut = t.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut;
  return base.replace(/[\s,;:.\u2014-]+$/, '') + '\u2026';
}

/** Percorso di un articolo nella lingua richiesta (slug derivato dal titolo tradotto). */
function articlePath(italianSlug: string, lang: string): string {
  if (lang === 'it') return `/blog/${italianSlug}`;
  const t = TRANSLATIONS[lang]?.[italianSlug]?.title;
  return `/blog/${t ? slugify(t) : italianSlug}`;
}

/** Testo dell'articolo nella lingua richiesta, con fallback all'italiano. */
function articleContent(a: any, lang: string) {
  if (lang === 'it') return { title: a.title, description: a.description, content: a.content as string[] };
  const t = TRANSLATIONS[lang]?.[a.slug];
  return t ? { title: t.title, description: t.description, content: t.content } : { title: a.title, description: a.description, content: a.content as string[] };
}

/** [testo](/percorso) -> <a href="/percorso">testo</a>, coerente con articleRichText.tsx. */
function paragraphToHtml(p: string): string {
  const parts: string[] = [];
  const re = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;
  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(p)) !== null) {
    if (m.index > cursor) parts.push(htmlEscape(p.slice(cursor, m.index)));
    parts.push(`<a href="${htmlEscape(m[2])}">${htmlEscape(m[1])}</a>`);
    cursor = m.index + m[0].length;
  }
  if (cursor < p.length) parts.push(htmlEscape(p.slice(cursor)));
  return parts.join('');
}

interface HeadOpts {
  lang: string;
  title: string;
  description: string;
  path: string;                       // path nella lingua corrente, senza prefisso
  altPaths?: Record<string, string>;  // lingua -> path, per gli hreflang
  jsonLd?: object;
}

/** Riscrive il <head> del guscio con i valori reali della pagina. */
function buildHead(shell: string, o: HeadOpts): string {
  let h = shell;
  const url = `${SITE}${prefix(o.lang)}${o.path}`;
  const desc = truncateForMeta(o.description);

  h = h.replace(/<html lang="[^"]*"/, `<html lang="${o.lang}"`);
  h = h.replace(/<title>[\s\S]*?<\/title>/, `<title>${htmlEscape(o.title)}</title>`);
  h = h.replace(/<meta name="description" content="[^"]*"\s*\/>/, `<meta name="description" content="${htmlEscape(desc)}" />`);
  h = h.replace(/<link rel="canonical" href="[^"]*"\s*\/>/, `<link rel="canonical" href="${htmlEscape(url)}" />`);
  h = h.replace(/<meta property="og:title" content="[^"]*"\s*\/>/, `<meta property="og:title" content="${htmlEscape(o.title)}" />`);
  h = h.replace(/<meta property="og:description" content="[^"]*"\s*\/>/, `<meta property="og:description" content="${htmlEscape(desc)}" />`);
  h = h.replace(/<meta property="og:url" content="[^"]*"\s*\/>/, `<meta property="og:url" content="${htmlEscape(url)}" />`);
  h = h.replace(/<meta property="og:locale" content="[^"]*"\s*\/>/, `<meta property="og:locale" content="${OG_LOCALE[o.lang]}" />`);
  h = h.replace(/<meta name="twitter:title" content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${htmlEscape(o.title)}" />`);
  h = h.replace(/<meta name="twitter:description" content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${htmlEscape(desc)}" />`);

  const extra: string[] = [];
  if (o.altPaths) {
    for (const l of LANGS) {
      const p = o.altPaths[l];
      if (p) extra.push(`    <link rel="alternate" hreflang="${l}" href="${htmlEscape(SITE + prefix(l) + p)}" />`);
    }
    if (o.altPaths.it) extra.push(`    <link rel="alternate" hreflang="x-default" href="${htmlEscape(SITE + o.altPaths.it)}" />`);
  }
  if (o.jsonLd) {
    extra.push(`    <script type="application/ld+json" data-prerendered="1">${JSON.stringify(o.jsonLd)}</script>`);
  }
  if (extra.length) h = h.replace('</head>', extra.join('\n') + '\n  </head>');
  return h;
}

/**
 * Contenuto statico dell'articolo. Usa le stesse classi Tailwind del
 * componente React, così nell'istante prima che React monti la pagina è già
 * impaginata invece di comparire come testo grezzo.
 */
function articleBody(title: string, paragraphs: string[], published: string): string {
  const ps = paragraphs.map(p => `<p class="text-gray-700 leading-relaxed mb-6">${paragraphToHtml(p)}</p>`).join('\n');
  return `<div class="min-h-screen bg-white"><article class="max-w-4xl mx-auto px-4 py-10">
<h1 class="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">${htmlEscape(title)}</h1>
<time datetime="${htmlEscape(published)}" class="block text-sm text-gray-500 mb-8">${htmlEscape(published)}</time>
<div class="prose prose-lg max-w-none">
${ps}
</div>
</article></div>`;
}

function writeHtml(distDir: string, routePath: string, html: string) {
  const clean = routePath === '/' ? '/index.html' : `${routePath.replace(/\/$/, '')}/index.html`;
  const file = resolve(distDir, '.' + clean);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html, 'utf-8');
}

function sitemapUrl(loc: string, alt: Record<string, string> | null, lastmod: string | undefined, priority: string, changefreq: string): string {
  const alts = alt
    ? LANGS.filter(l => alt[l]).map(l => `      <xhtml:link rel="alternate" hreflang="${l}" href="${xmlEscape(SITE + prefix(l) + alt[l])}" />`).join('\n') +
      (alt.it ? `\n      <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(SITE + alt.it)}" />` : '')
    : '';
  return `  <url>
      <loc>${xmlEscape(loc)}</loc>${lastmod ? `\n      <lastmod>${lastmod}</lastmod>` : ''}
      <changefreq>${changefreq}</changefreq>
      <priority>${priority}</priority>${alts ? '\n' + alts : ''}
  </url>`;
}

export function seoPrerenderPlugin() {
  return {
    name: 'oralzon-seo-prerender',
    apply: 'build' as const,
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      const shell = readFileSync(resolve(distDir, 'index.html'), 'utf-8');

      const urls: string[] = [];
      let prerendered = 0;

      // ── Pagine statiche ────────────────────────────────────────────────
      for (const p of STATIC_PATHS) {
        const alt = Object.fromEntries(LANGS.map(l => [l, p.path]));
        for (const l of LANGS) {
          urls.push(sitemapUrl(SITE + prefix(l) + p.path, alt, undefined, p.priority, p.changefreq));
        }
      }

      // ── Categorie ──────────────────────────────────────────────────────
      for (const cat of DENTAL_CATEGORIES as any[]) {
        const alt = Object.fromEntries(
          LANGS.map(l => [l, `/negozio/categoria/${localizeCategorySlug(cat.name, cat.slug, l)}`])
        );
        for (const l of LANGS) urls.push(sitemapUrl(SITE + prefix(l) + alt[l], alt, undefined, '0.8', 'weekly'));
      }

      // ── Articoli: sitemap + prerendering in tutte le lingue ────────────
      for (const a of BLOG_ARTICLES as any[]) {
        const alt = Object.fromEntries(LANGS.map(l => [l, articlePath(a.slug, l)]));
        for (const l of LANGS) {
          const loc = SITE + prefix(l) + alt[l];
          urls.push(sitemapUrl(loc, alt, a.publishedAt, '0.6', 'monthly'));

          const { title, description, content } = articleContent(a, l);
          const jsonLd = {
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: title,
            description: truncateForMeta(description),
            keywords: (a.keywords || []).join(', '),
            articleSection: a.categoryName,
            inLanguage: l,
            datePublished: a.publishedAt,
            dateModified: a.publishedAt,
            author: { '@type': 'Organization', name: 'Oralzon', url: SITE },
            publisher: {
              '@type': 'Organization',
              name: 'Oralzon',
              logo: { '@type': 'ImageObject', url: `${SITE}/logo-oralzon.png` },
            },
            mainEntityOfPage: { '@type': 'WebPage', '@id': loc },
          };

          let html = buildHead(shell, {
            lang: l,
            title: `${title} — Oralzon Blog`,
            description,
            path: alt[l],
            altPaths: alt,
            jsonLd,
          });
          html = html.replace(
            '<div id="root"></div>',
            `<div id="root">${articleBody(title, content, a.publishedAt)}</div>`
          );
          writeHtml(distDir, prefix(l) + alt[l], html);
          prerendered++;
        }
      }

      // ── Sitemap dei contenuti + indice ─────────────────────────────────
      const contentXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
      writeFileSync(resolve(distDir, 'sitemap-content.xml'), contentXml, 'utf-8');

      // L'indice tiene insieme due sorgenti che sanno cose diverse: qui
      // conosciamo articoli, categorie e pagine (dati statici, noti a build
      // time); solo l'edge function conosce prodotti e store, che vivono su
      // Supabase e cambiano di continuo. sitemap-catalogo.xml è instradato
      // dal file _redirects verso quell'endpoint.
      const today = new Date().toISOString().slice(0, 10);
      const indexXml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${SITE}/sitemap-content.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${SITE}/sitemap-catalogo.xml</loc>
    <lastmod>${today}</lastmod>
  </sitemap>
</sitemapindex>
`;
      writeFileSync(resolve(distDir, 'sitemap.xml'), indexXml, 'utf-8');

      console.log(`[seo] sitemap-content.xml: ${urls.length} URL — sitemap.xml: indice a 2 sorgenti`);
      console.log(`[seo] prerender: ${prerendered} pagine articolo scritte come HTML statico`);
    },
  };
}
