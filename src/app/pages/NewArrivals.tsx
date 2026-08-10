import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PackagePlus, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/ProductCardSkeleton';
import { useInfiniteScroll } from '../../lib/useInfiniteScroll';
import { usePageSEO } from '../../lib/usePageSEO';

const PAGE_SIZE = 24;

export function NewArrivals() {
  const { t, i18n } = useTranslation();
  usePageSEO({ title: `${t('productLists.newArrivalsTitle')} — Oralzon`, language: i18n.language });
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadProducts = async (pageArg: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('id, name, price, discount_price, discount_starts_at, discount_ends_at, images, images_thumb, vendor_id, stock, translations, vendors(id, business_name, verified_badge)')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .range((pageArg - 1) * PAGE_SIZE, pageArg * PAGE_SIZE - 1);
    const batch = data || [];
    setProducts(prev => {
      if (!append) return batch;
      const existingIds = new Set(prev.map((p: any) => p.id));
      return [...prev, ...batch.filter((p: any) => !existingIds.has(p.id))];
    });
    setHasMore(batch.length === PAGE_SIZE);
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => { loadProducts(1, false); }, []);

  const sentinelRef = useInfiniteScroll(() => {
    const next = page + 1;
    setPage(next);
    loadProducts(next, true);
  }, hasMore && !loading && !loadingMore);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <PackagePlus className="w-8 h-8 text-secondary" />
          <h1 className="text-4xl font-bold text-gray-900">{t('productLists.newArrivalsTitle')}</h1>
        </div>
        <p className="text-gray-600 text-lg">
          {t('productLists.newArrivalsSubtitle')}
        </p>
      </div>

      {loading ? (
        <ProductGridSkeleton count={12} />
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <PackagePlus className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('productLists.noProductsYet')}</h3>
          <p className="text-gray-600">{t('productLists.checkBackSoon')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}

      {hasMore && <div ref={sentinelRef} className="h-1" />}
      {loadingMore && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}
