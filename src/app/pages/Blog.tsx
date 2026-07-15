import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Clock, ChevronRight, BookOpen } from 'lucide-react';
import { BLOG_ARTICLES, BLOG_CATEGORIES } from '../../data/articles';

export function Blog() {
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 12;

  const filtered = BLOG_ARTICLES.filter(a => {
    if (selectedCat !== 'all' && a.category !== selectedCat) return false;
    if (searchQuery && !a.title.toLowerCase().includes(searchQuery.toLowerCase()) && !a.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-primary text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-3">Blog Oralzon</h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">Articoli, guide e approfondimenti sul mondo dell'odontoiatria professionale</p>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="sticky top-24 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
                  placeholder="Cerca articoli..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div className="space-y-1">
                <button onClick={() => { setSelectedCat('all'); setPage(1); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedCat === 'all' ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>
                  Tutti gli articoli ({BLOG_ARTICLES.length})
                </button>
                {Object.entries(BLOG_CATEGORIES).map(([slug, name]) => {
                  const count = BLOG_ARTICLES.filter(a => a.category === slug).length;
                  return (
                    <button key={slug} onClick={() => { setSelectedCat(slug); setPage(1); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm ${selectedCat === slug ? 'bg-primary text-white' : 'hover:bg-gray-100'}`}>
                      {name} ({count})
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-6">{filtered.length} articoli trovati</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {paged.map(article => (
                <Link key={article.id} to={`/blog/${article.slug}`} className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all">
                  <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-8 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-primary/40" />
                  </div>
                  <div className="p-5">
                    <span className="text-xs text-primary font-medium">{article.categoryName}</span>
                    <h3 className="font-medium mt-1 mb-2 line-clamp-2 group-hover:text-primary transition-colors text-sm">{article.title}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{article.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{article.readTime} min</span>
                      <span>{new Date(article.publishedAt).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button key={i} onClick={() => { setPage(i + 1); window.scrollTo(0, 0); }}
                    className={`w-9 h-9 rounded-lg text-sm font-medium ${page === i + 1 ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
