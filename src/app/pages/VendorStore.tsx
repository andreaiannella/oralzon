import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Package, MapPin, ShieldCheck, Loader2, ChevronRight, Mail, Flag, X } from 'lucide-react';
import { BRAND_ICONS } from '../../lib/brandIcons';
import { supabase } from '../../lib/supabase';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/ProductCardSkeleton';
import { useInfiniteScroll } from '../../lib/useInfiniteScroll';
import { useAuth } from '../../contexts/AuthContext';
import { callEdge } from '../../lib/edgeApi';

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
  id: string; name: string; price: number; discount_price: number | null; images: string[]; images_thumb?: string[] | null; stock: number;
}

interface SimilarProduct extends Product {
  vendors?: { id: string; business_name: string; verified_badge?: boolean } | null;
}

export function VendorStore() {
  const { t } = useTranslation();
  const { vendorId } = useParams<{ vendorId: string }>();
  const { user } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSending, setReportSending] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [reportError, setReportError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sort, setSort] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const PAGE_SIZE = 30;

  useEffect(() => { if (vendorId) { setPage(1); setSimilarProducts([]); loadStore(1, false); } }, [vendorId, sort]);

  // Una volta esauriti i prodotti di QUESTO venditore (fine paginazione,
  // niente altro da caricare), proponiamo prodotti simili di ALTRI
  // venditori nella stessa categoria — così chi ha finito di sfogliare
  // questo store non si trova davanti a un vicolo cieco, ma continua a
  // scoprire prodotti pertinenti invece di dover tornare indietro.
  useEffect(() => {
    if (loading || hasMore || !vendor?.main_category || similarProducts.length > 0) return;
    loadSimilarProducts();
  }, [loading, hasMore, vendor?.main_category]);

  const loadSimilarProducts = async () => {
    if (!vendor?.main_category) return;
    setLoadingSimilar(true);
    try {
      const { data } = await supabase.from('products')
        .select('id, name, price, discount_price, images, images_thumb, stock, translations, vendor_id, vendors(id, business_name, verified_badge)')
        .eq('category', vendor.main_category)
        .eq('status', 'published')
        .neq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
        .limit(12);
      setSimilarProducts((data as any) || []);
    } finally { setLoadingSimilar(false); }
  };

  const loadStore = async (pageArg: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      // Il profilo del venditore serve solo al primo caricamento, non quando
      // si aggiungono altre pagine di prodotti con "carica altri".
      if (!append) {
        const { data: v } = await supabase.from('vendors').select('*').eq('id', vendorId).single();
        setVendor(v as any);
      }

      // PERFORMANCE: paginato (PAGE_SIZE alla volta) invece di caricare tutto
      // il catalogo del venditore in un solo colpo — con migliaia di prodotti
      // pubblicati, la versione precedente sarebbe diventata sempre più lenta
      // ad ogni prodotto aggiunto. { count: 'exact' } sulla query dà il totale
      // reale dei prodotti pubblicati, da mostrare in UI senza doverli scaricare tutti.
      let query = supabase.from('products')
        .select('id, name, price, discount_price, images, images_thumb, stock, translations', { count: 'exact' })
        .eq('vendor_id', vendorId).eq('status', 'published');

      if (sort === 'price_asc') query = query.order('price', { ascending: true });
      else if (sort === 'price_desc') query = query.order('price', { ascending: false });
      else query = query.order('created_at', { ascending: false });

      const { data: p, count } = await query.range((pageArg - 1) * PAGE_SIZE, pageArg * PAGE_SIZE - 1);
      const batch = (p as any) || [];
      setProducts(prev => {
        if (!append) return batch;
        const existingIds = new Set(prev.map((p: any) => p.id));
        return [...prev, ...batch.filter((p: any) => !existingIds.has(p.id))];
      });
      if (typeof count === 'number') setTotalCount(count);
      setHasMore(batch.length === PAGE_SIZE);
    } finally { setLoading(false); setLoadingMore(false); }
  };

  // Carica automaticamente la pagina successiva quando l'utente si avvicina
  // al fondo, al posto del pulsante "carica altri".
  const sentinelRef = useInfiniteScroll(() => {
    const next = page + 1;
    setPage(next);
    loadStore(next, true);
  }, hasMore && !loading && !loadingMore);

  const submitReport = async () => {
    if (!reportReason) { setReportError('Seleziona un motivo.'); return; }
    setReportError(''); setReportSending(true);
    const result = await callEdge('/vendor/report', { body: { vendorId: vendor?.id, reason: reportReason, description: reportDescription } });
    setReportSending(false);
    if (!result.success) { setReportError(result.error || 'Invio non riuscito, riprova.'); return; }
    setReportSent(true);
  };

  if (loading) return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
          <div className="h-7 bg-gray-100 rounded w-64 mb-3" />
          <div className="h-4 bg-gray-100 rounded w-40" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ProductGridSkeleton count={12} />
      </div>
    </div>
  );
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
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <img src={BRAND_ICONS.shop} alt="" className="w-7 h-7 object-contain flex-shrink-0" />
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{vendor.business_name}</h1>
                {vendor.verified_badge && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5" /> {t('vendorStore.verifiedSeller')}
                  </span>
                )}
              </div>
              {vendor.main_category && <p className="text-sm text-gray-500 mt-1">{vendor.main_category}</p>}
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <span className="text-sm text-gray-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {t('vendorStore.onOralzonSince')} {memberSince}</span>
                {user && (
                  <button
                    type="button"
                    onClick={() => { setReportOpen(true); setReportSent(false); setReportError(''); setReportReason(''); setReportDescription(''); }}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5" /> Segnala questo venditore
                  </button>
                )}
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
          <h2 className="text-lg font-bold text-gray-900">{t('vendorStore.productsOf')} {vendor.business_name} <span className="text-gray-400 font-normal">({totalCount ?? products.length})</span></h2>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {products.map(p => (
              <ProductCard
                key={p.id}
                product={{ ...p, vendors: { id: vendor.id, business_name: vendor.business_name, verified_badge: vendor.verified_badge } }}
              />
            ))}
          </div>
        )}

        {hasMore && (
          <div ref={sentinelRef} className="h-1" />
        )}
        {loadingMore && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        {/* Prodotti simili da altri venditori — una volta esauriti quelli di questo store */}
        {!hasMore && !loading && (loadingSimilar || similarProducts.length > 0) && (
          <div className="mt-10 pt-8 border-t border-gray-200">
            <h2 className="text-lg font-bold text-gray-900 mb-4">{t('vendorStore.similarProducts')}</h2>
            {loadingSimilar ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {similarProducts.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal segnalazione venditore */}
      {reportOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setReportOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            {reportSent ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Flag className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Segnalazione inviata</h3>
                <p className="text-sm text-gray-500 mb-4">Il nostro team la esaminerà a breve. Grazie per averci avvisato.</p>
                <button onClick={() => setReportOpen(false)} className="text-sm text-primary font-medium">Chiudi</button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Segnala {vendor.business_name}</h3>
                  <button onClick={() => setReportOpen(false)} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Motivo</label>
                <select value={reportReason} onChange={e => setReportReason(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3">
                  <option value="">Seleziona un motivo</option>
                  <option value="fuori_piattaforma">Mi ha chiesto di comprare/pagare fuori da Oralzon</option>
                  <option value="prodotto_non_conforme">Prodotto ricevuto non conforme alla descrizione</option>
                  <option value="comportamento_scorretto">Comportamento scorretto o comunicazioni inappropriate</option>
                  <option value="altro">Altro</option>
                </select>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Dettagli (facoltativo)</label>
                <textarea value={reportDescription} onChange={e => setReportDescription(e.target.value)}
                  rows={4} placeholder="Racconta cosa è successo..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-y mb-3" />
                {reportError && <p className="text-xs text-red-600 mb-3">{reportError}</p>}
                <button
                  onClick={submitReport}
                  disabled={reportSending}
                  className="w-full bg-primary text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {reportSending ? 'Invio...' : 'Invia segnalazione'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
