import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock, Tag, ChevronRight, BookOpen } from 'lucide-react';
import { BLOG_ARTICLES } from '../../data/articles';
import { getLocalizedArticle } from '../../data/articleLocalization';
import { loadLanguageTranslations, LangTranslations } from '../../data/articleTranslations';
import { delocalizeArticleSlug } from '../../lib/articleSlug';
import { useEffect, useState } from 'react';
import { usePageSEO } from '../../lib/usePageSEO';
import { useStructuredData } from '../../lib/useStructuredData';
import { getBasename } from '../../lib/urlLanguage';

const CATEGORY_KEY_MAP: Record<string, string> = {
  'igiene-orale': 'blog.catIgiene',
  'protesi-dentarie': 'blog.catProtesi',
  'implantologia': 'blog.catImplantologia',
  'sbiancamento': 'blog.catSbiancamento',
  'ortodonzia': 'blog.catOrtodonzia',
  'endodonzia': 'blog.catEndodonzia',
  'materiali': 'blog.catMateriali',
  'sterilizzazione': 'blog.catSterilizzazione',
  'salute-dentale': 'blog.catSaluteDentale',
};

const ITALIAN_SLUGS = BLOG_ARTICLES.map(a => a.slug);

export function BlogArticle() {
  const { t, i18n } = useTranslation();
  const { slug } = useParams<{ slug: string }>();

  // Stesso principio di Blog.tsx: carica solo la lingua attiva, non tutte
  // e 6 insieme — chi apre un singolo articolo non deve scaricare 3MB.
  const [translations, setTranslations] = useState<LangTranslations>({});
  // BUG EVITATO: lo slug in arrivo può essere quello italiano O quello
  // derivato dal titolo tradotto (vedi lib/articleSlug.ts) — la
  // risoluzione dipende dalle traduzioni, che arrivano in modo asincrono.
  // Senza questo stato esplicito, un link con slug tradotto mostrerebbe
  // "articolo non trovato" nell'istante prima che le traduzioni finiscano
  // di caricare (l'italiano non ha questo problema, non aspetta nulla).
  const [translationsLoaded, setTranslationsLoaded] = useState(i18n.language === 'it');
  useEffect(() => {
    let cancelled = false;
    setTranslationsLoaded(i18n.language === 'it');
    loadLanguageTranslations(i18n.language).then(data => {
      if (cancelled) return;
      setTranslations(data);
      setTranslationsLoaded(true);
    });
    return () => { cancelled = true; };
  }, [i18n.language]);

  const resolvedItalianSlug = slug ? delocalizeArticleSlug(slug, ITALIAN_SLUGS, translations) : null;
  const rawArticle = resolvedItalianSlug ? BLOG_ARTICLES.find(a => a.slug === resolvedItalianSlug) : undefined;

  const article = rawArticle ? getLocalizedArticle(rawArticle, i18n.language, translations) : null;

  // SEO: consolidato nell'hook condiviso — prima qui si gestivano solo
  // titolo e descrizione a mano, canonical/Open Graph/Twitter restavano
  // quelli statici della home anche su un articolo del blog.
  usePageSEO({
    title: article ? `${article.title} — Oralzon Blog` : 'Oralzon Blog',
    description: article?.description,
    language: i18n.language,
  });

  // Dati strutturati (schema.org Article) — chiamato prima del return
  // anticipato sotto per rispettare le regole degli hook React.
  useStructuredData(article ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    author: { '@type': 'Organization', name: 'Oralzon' },
    publisher: { '@type': 'Organization', name: 'Oralzon' },
    mainEntityOfPage: `https://oralzon.com${getBasename(window.location.pathname)}/blog/${article.localizedSlug}`,
  } : null, 'article-schema');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [article]);

  if (!article) {
    // Se le traduzioni non hanno ancora finito di caricare, uno slug
    // tradotto potrebbe risolversi correttamente non appena arrivano —
    // meglio un breve caricamento silenzioso che un "non trovato" sbagliato
    // mostrato per un istante (o indicizzato da un crawler che non aspetta).
    if (!translationsLoaded) return null;
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">{t('blog.articleNotFound')}</h2>
        <Link to="/blog" className="text-primary hover:underline">{t('blog.backToBlog')}</Link>
      </div>
    );
  }

  const related = BLOG_ARTICLES.filter(a => a.category === article.category && a.id !== article.id).slice(0, 3).map(a => getLocalizedArticle(a, i18n.language, translations));
  const dateLocale = i18n.language === 'it' ? 'it-IT' : i18n.language;
  const categoryLabel = t(CATEGORY_KEY_MAP[article.category] || article.categoryName);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-muted border-b py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-primary">{t('common.home')}</Link><ChevronRight className="w-3 h-3" />
          <Link to="/blog" className="hover:text-primary">{t('blog.heroTitle')}</Link><ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 truncate">{article.title}</span>
        </div>
      </div>
      <article className="max-w-4xl mx-auto px-4 py-10">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> {t('blog.backToBlog')}
        </Link>
        <span className="block text-sm text-primary font-medium mb-2">{categoryLabel}</span>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">{article.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b">
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{article.readTime} {t('blog.minReadTime')}</span>
          <span>{new Date(article.publishedAt).toLocaleDateString(dateLocale, { day: '2-digit', month: 'long', year: 'numeric' })}</span>
        </div>
        <div className="prose prose-lg max-w-none">
          {article.content.map((p: string, i: number) => (
            <p key={i} className="text-gray-700 leading-relaxed mb-6">{p}</p>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t">
          {article.keywords.map((kw: string) => (
            <span key={kw} className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
              <Tag className="w-3 h-3" />{kw}
            </span>
          ))}
        </div>
        {related.length > 0 && (
          <div className="mt-12 pt-8 border-t">
            <h2 className="text-2xl font-bold mb-6">{t('blog.relatedArticles')}</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map(r => (
                <Link key={r.id} to={`/blog/${r.localizedSlug}`} className="p-5 border rounded-xl hover:shadow-md transition-all group">
                  <span className="text-xs text-primary">{t(CATEGORY_KEY_MAP[r.category] || r.categoryName)}</span>
                  <h3 className="font-medium mt-1 text-sm group-hover:text-primary line-clamp-2">{r.title}</h3>
                  <span className="text-xs text-gray-400 mt-2 block">{r.readTime} {t('blog.minRead')}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
