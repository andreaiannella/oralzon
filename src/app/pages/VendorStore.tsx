import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, MapPin, ShieldCheck, Loader2, ChevronRight, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ProductCard } from '../components/ProductCard';

interface Vendor {
  id: string;
  business_name: string;
  logo_url: string | null;
  store_description: string | null;
  main_category: string | null;
  verified_badge: boolean;
  contact_email: string | null;
  created_at: string;
}

interface Product {
  id: string; name: string; price: number; discount_price: number | null; images: string[]; stock: number;
}



export function VendorStore() {
  const { t } = useTranslation();
  const { vendorId } = useParams<{ vendorId: string }>();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  useEffect(() => { if (vendorId) loadStore(); }, [vendorId, sort]);

  const loadStore = async () => {
    setLoading(true);
    try {
      const { data: v } = await supabase.from('vendors').select('*').eq('id', vendorId).single();
      setVendor(v as any);

      let query = supabase.from('products').select('id, name, price, discount_price, images, stock')
        .eq('vendor_id', vendorId).eq('status', 'published').gt('stock', 0);

      if (sort === 'price_asc') query = query.order('price', { ascending: true });
      else if (sort === 'price_desc') query = query.order('price', { ascending: false });
      else query = query.order('created_at', { ascending: false });

      const { data: p } = await query;
      setProducts((p as any) || []);
    } finally { setLoading(false); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-96"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (!vendor) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-gray-900 mb-2">{t('vendorStore.storeNotFound')}</h2>
      <Link to="/negozio" className="px-6 py-3 bg-primary text-white rounded-lg inline-block">{t('product.backToShop')}</Link>
    </div>
  );

  const memberSince = new Date(vendor.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link to="/" className="hover:text-primary">{t('common.home')}</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/negozio" className="hover:text-primary">{t('common.shopBreadcrumb')}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-800">{vendor.business_name}</span>
          </nav>
        </div>
      </div>

      {/* Header vetrina */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {vendor.logo_url
                ? <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-cover" />
                : <span className="text-3xl sm:text-4xl font-black text-primary">{vendor.business_name.charAt(0)}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{vendor.business_name}</h1>
                {vendor.verified_badge && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" /> {t('vendorStore.verifiedSeller')}
                  </span>
                )}
              </div>
              {vendor.main_category && <p className="text-sm text-gray-500 mt-1">{vendor.main_category}</p>}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {vendor.contact_email && (
                  <a href={`mailto:${vendor.contact_email}`}
                    className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium">
                    <Mail className="w-3.5 h-3.5" /> {vendor.contact_email}
                  </a>
                )}
                <span className="text-sm text-gray-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {t('vendorStore.onOralzonSince')} {memberSince}</span>
              </div>
            </div>
          </div>
          {vendor.store_description && (
            <p className="text-sm text-gray-600 mt-4 max-w-3xl leading-relaxed">{vendor.store_description}</p>
          )}
        </div>
      </div>

      {/* Prodotti dello store */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{t('vendorStore.productsOf')} {vendor.business_name} <span className="text-gray-400 font-normal">({products.length})</span></h2>
          <select value={sort} onChange={e => setSort(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white">
            <option value="newest">{t('vendorStore.sortNewest')}</option>
            <option value="price_asc">{t('vendorStore.sortPriceAsc')}</option>
            <option value="price_desc">{t('vendorStore.sortPriceDesc')}</option>
          </select>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">{t('vendorStore.noProductsAvailable')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {products.map(p => (
              <ProductCard
                key={p.id}
                product={{ ...p, vendors: { id: vendor.id, business_name: vendor.business_name, verified_badge: vendor.verified_badge } }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
