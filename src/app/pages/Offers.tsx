import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ProductCard } from '../components/ProductCard';
import { useInfiniteScroll } from '../../lib/useInfiniteScroll';

const PAGE_SIZE = 24;

export function Offers() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loadProducts = async (pageArg: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    // "In offerta" = discount_price valorizzato e inferiore al prezzo pieno.
    // Il filtro sul confronto tra le due colonne non è esprimibile in una
    // singola query PostgREST, quindi filtriamo lato client dopo aver
    // scaricato una pagina alla volta. NOTA: una pagina "grezza" da DB può
    // contenere meno offerte valide di quante richieste (alcune righe con
    // discount_price valorizzato ma non effettivamente convenienti vengono
    // scartate qui) — per questo hasMore si basa sulla dimensione della
    // pagina grezza, non su quella filtrata: potrebbero esserci altre
    // offerte più avanti anche se questa pagina ne ha rese poche.
    const { data } = await supabase
      .from('products')
      .select('id, name, price, discount_price, images, images_thumb, vendor_id, stock, translations, vendors(id, business_name, verified_badge)')
      .eq('status', 'published')
      .not('discount_price', 'is', null)
      .order('created_at', { ascending: false })
      .range((pageArg - 1) * PAGE_SIZE, pageArg * PAGE_SIZE - 1);
    const rawBatch = data || [];
    const onSale = rawBatch.filter((p: any) => Number(p.discount_price) > 0 && Number(p.discount_price) < Number(p.price));
    setProducts(prev => {
      if (!append) return onSale;
      const existingIds = new Set(prev.map((p: any) => p.id));
      return [...prev, ...onSale.filter((p: any) => !existingIds.has(p.id))];
    });
    setHasMore(rawBatch.length === PAGE_SIZE);
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
          <Tag className="w-8 h-8 text-red-600" />
          <h1 className="text-4xl font-bold text-gray-900">{t('productLists.offersTitle')}</h1>
        </div>
        <p className="text-gray-600 text-lg">
          {t('productLists.offersSubtitle')}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('productLists.noOffersYet')}</h3>
          <p className="text-gray-600">{t('productLists.checkBackForOffers')}</p>
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
