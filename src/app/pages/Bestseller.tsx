import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Loader2 } from 'lucide-react';
import { callEdge } from '../../lib/edgeApi';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/ProductCardSkeleton';
import { useInfiniteScroll } from '../../lib/useInfiniteScroll';

const PAGE_SIZE = 24;

export function Bestseller() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const loadProducts = async (offsetArg: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    // Endpoint pubblico: aggrega le quantità vendute per prodotto tra gli
    // ordini pagati su tutta la piattaforma — richiede il service client
    // lato server, non è una query diretta che un cliente può fare con RLS.
    const result = await callEdge(`/products/bestsellers?limit=${PAGE_SIZE}&offset=${offsetArg}`, { method: 'GET' });
    const batch = result.success ? (result.products || []) : [];
    setProducts(prev => {
      if (!append) return batch;
      const existingIds = new Set(prev.map((p: any) => p.id));
      return [...prev, ...batch.filter((p: any) => !existingIds.has(p.id))];
    });
    setHasMore(!!result.hasMore);
    setLoading(false);
    setLoadingMore(false);
  };

  useEffect(() => { loadProducts(0, false); }, []);

  const sentinelRef = useInfiniteScroll(() => {
    const next = offset + PAGE_SIZE;
    setOffset(next);
    loadProducts(next, true);
  }, hasMore && !loading && !loadingMore);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Award className="w-8 h-8 text-yellow-600" />
          <h1 className="text-4xl font-bold text-gray-900">{t('productLists.bestsellerTitle')}</h1>
        </div>
        <p className="text-gray-600 text-lg">
          {t('productLists.bestsellerSubtitle')}
        </p>
      </div>

      {loading ? (
        <ProductGridSkeleton count={12} />
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('productLists.noProductsYet')}</h3>
          <p className="text-gray-600">{t('productLists.checkBackSoon')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} badge={i < 3 ? `#${i + 1}` : undefined} badgeColor="bg-yellow-500" />
          ))}
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
