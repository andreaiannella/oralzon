import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Clock, Tag, ChevronRight, BookOpen } from 'lucide-react';
import { BLOG_ARTICLES } from '../../data/articles';
import { useEffect } from 'react';

export function BlogArticle() {
  const { slug } = useParams<{ slug: string }>();
  const article = BLOG_ARTICLES.find(a => a.slug === slug);

  useEffect(() => {
    if (article) {
      document.title = `${article.title} — Oralzon Blog`;
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', article.description);
      else {
        const m = document.createElement('meta');
        m.name = 'description';
        m.content = article.description;
        document.head.appendChild(m);
      }
    }
    window.scrollTo(0, 0);
  }, [article]);

  if (!article) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold mb-4">Articolo non trovato</h2>
        <Link to="/blog" className="text-primary hover:underline">Torna al Blog</Link>
      </div>
    );
  }

  const related = BLOG_ARTICLES.filter(a => a.category === article.category && a.id !== article.id).slice(0, 3);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-muted border-b py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-primary">Home</Link><ChevronRight className="w-3 h-3" />
          <Link to="/blog" className="hover:text-primary">Blog</Link><ChevronRight className="w-3 h-3" />
          <span className="text-gray-900 truncate">{article.title}</span>
        </div>
      </div>
      <article className="max-w-4xl mx-auto px-4 py-10">
        <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Torna al Blog
        </Link>
        <span className="block text-sm text-primary font-medium mb-2">{article.categoryName}</span>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">{article.title}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b">
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{article.readTime} min di lettura</span>
          <span>{new Date(article.publishedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
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
            <h2 className="text-2xl font-bold mb-6">Articoli correlati</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {related.map(r => (
                <Link key={r.id} to={`/blog/${r.slug}`} className="p-5 border rounded-xl hover:shadow-md transition-all group">
                  <span className="text-xs text-primary">{r.categoryName}</span>
                  <h3 className="font-medium mt-1 text-sm group-hover:text-primary line-clamp-2">{r.title}</h3>
                  <span className="text-xs text-gray-400 mt-2 block">{r.readTime} min</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </article>
    </div>
  );
}
