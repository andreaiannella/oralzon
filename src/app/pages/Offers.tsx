import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ProductCard } from '../components/ProductCard';

export function Offers() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // "In offerta" = discount_price valorizzato e inferiore al prezzo pieno.
      // Il filtro sul confronto tra le due colonne non è esprimibile in una
      // singola query PostgREST, quindi filtriamo lato client dopo aver
      // escluso i prodotti senza alcun discount_price.
      const { data } = await supabase
        .from('products')
        .select('id, name, price, discount_price, images, vendor_id, stock, vendors(id, business_name, verified_badge)')
        .eq('status', 'published')
        .not('discount_price', 'is', null)
        .order('created_at', { ascending: false })
        .limit(200);
      const onSale = (data || []).filter((p: any) => Number(p.discount_price) > 0 && Number(p.discount_price) < Number(p.price));
      setProducts(onSale);
      setLoading(false);
    })();
  }, []);

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
    </div>
  );
}
