import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Loader2 } from 'lucide-react';
import { callEdge } from '../../lib/edgeApi';
import { ProductCard } from '../components/ProductCard';

export function Bestseller() {
  const { t } = useTranslation();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Endpoint pubblico: aggrega le quantità vendute per prodotto tra gli
      // ordini pagati su tutta la piattaforma — richiede il service client
      // lato server, non è una query diretta che un cliente può fare con RLS.
      const result = await callEdge('/products/bestsellers?limit=48', { method: 'GET' });
      setProducts(result.success ? (result.products || []) : []);
      setLoading(false);
    })();
  }, []);

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
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
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
    </div>
  );
}
