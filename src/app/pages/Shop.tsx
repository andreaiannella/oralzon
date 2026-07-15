import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { SlidersHorizontal, Grid, List, Star, ShoppingCart, Loader2, SearchX, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DENTAL_CATEGORIES } from '../../constants/categories';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  is_sponsored: boolean;
  stock: number;
  vendors: { business_name: string; verified_badge: boolean } | null;
}

export function Shop() {
  const { category: categoryParam } = useParams<{ category?: string }>();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all');
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 24;

  const categories = [
    { id: 'all', name: t('shop.allProducts') },
    ...DENTAL_CATEGORIES.map(c => ({ id: c.slug, name: c.name }))
  ];

  useEffect(() => {
    setPage(1); loadProducts();
  }, [selectedCategory, sortBy]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const categoryName = selectedCategory !== 'all' ? DENTAL_CATEGORIES.find(c => c.slug === selectedCategory)?.name : null;
      
      // Controlla sponsorizzazioni categoria attive (vista pubblica, bypassa RLS di promotions)
      let sponsoredVendorIds: string[] = [];
      if (categoryName) {
        const { data: activeSponsors } = await supabase
          .from('public_active_category_sponsors')
          .select('vendor_id')
          .like('sponsored_category', `%${categoryName}%`);
        sponsoredVendorIds = (activeSponsors || []).map((s: any) => s.vendor_id);
      }

      let query = supabase
        .from('products')
        .select('id, name, description, price, category, images, is_sponsored, stock, vendor_id, vendors(id, business_name, verified_badge)')
        .gt('stock', 0);

      if (categoryName) query = query.eq('category', categoryName);

      if (sortBy === 'price-asc') query = query.order('price', { ascending: true });
      else if (sortBy === 'price-desc') query = query.order('price', { ascending: false });
      else if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
      else query = query.order('is_sponsored', { ascending: false });

      const { data, error } = await query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
      if (error) throw error;
      
      // Ordina: sponsor categoria prima, poi sponsored, poi resto
      let sorted = (data as any) || [];
      if (sponsoredVendorIds.length > 0) {
        sorted = [
          ...sorted.filter((p: any) => sponsoredVendorIds.includes(p.vendor_id)),
          ...sorted.filter((p: any) => !sponsoredVendorIds.includes(p.vendor_id)),
        ];
      }
      setProducts(sorted);
    } catch (err) {
      console.error('Errore caricamento prodotti:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p =>
    !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getImage = (p: Product) =>
    p.images?.[0] || '/images/product-placeholder.svg';

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-white border-b border-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl mb-2">{t('shop.catalogTitle')}</h1>
          <p className="text-muted-foreground">
            {loading ? t('common.loading') : t('shop.productsAvailable', { count: filtered.length })}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* Sidebar filtri */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-xl border border-border p-6 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">{t('shop.filterByCategory')}</h2>
              </div>
              <div className="space-y-1">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-white'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Prodotti */}
          <div className="flex-1 min-w-0">
            {/* Barra controlli */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <input
                type="text"
                placeholder={t('shop.searchCatalog')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 min-w-48 px-4 py-2 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg bg-white text-sm"
                >
                  <option value="featured">{t('shop.sortFeatured')}</option>
                  <option value="price-asc">{t('shop.sortPriceAsc')}</option>
                  <option value="price-desc">{t('shop.sortPriceDesc')}</option>
                  <option value="newest">{t('shop.sortNewest')}</option>
                </select>
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white border border-border'}`}>
                  <Grid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white border border-border'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}

            {/* Nessun prodotto */}
            {!loading && filtered.length === 0 && (
              <div className="bg-white rounded-xl border border-border p-12 text-center">
                <SearchX className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">{t('shop.noProducts')}</p>
                <p className="text-gray-500 text-sm">
                  {products.length === 0
                    ? t('shop.noProductsInCategory')
                    : t('shop.tryDifferentFilters')}
                </p>
              </div>
            )}

            {/* Griglia prodotti */}
            {!loading && filtered.length > 0 && (
              <div className={viewMode === 'grid' ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                {filtered.map(product => (
                  <Link
                    key={product.id}
                    to={`/negozio/prodotto/${product.id}`}
                    className={`group bg-white rounded-xl overflow-hidden border border-border hover:shadow-xl transition-all ${viewMode === 'list' ? 'flex' : ''}`}
                  >
                    <div className={`relative overflow-hidden bg-muted ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'aspect-square'}`}>
                      <img
                        src={getImage(product)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={e => { (e.target as HTMLImageElement).src = '/images/product-placeholder.svg'; }}
                      />
                      {product.is_sponsored && (
                        <span className="absolute top-3 right-3 px-2 py-1 bg-amber-500 text-white text-xs rounded-full font-medium">
                          {t('product.sponsored')}
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-muted-foreground">{product.vendors?.business_name || t('common.vendorBadge')}</span>
                        {product.vendors?.verified_badge && (
                          <CheckCircle className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>
                      <h3 className="font-medium mb-2 line-clamp-2 group-hover:text-primary transition-colors text-sm">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-3">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">€{Number(product.price).toFixed(2)}</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ShoppingCart className="w-3 h-3" /> {t('product.add')}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Paginazione */}
      {hasMore && (
        <div className="text-center py-8">
          <button
            onClick={() => { setPage(p => p + 1); loadProducts(); }}
            disabled={loading}
            className="px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('shop.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}