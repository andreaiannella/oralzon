import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Star, Monitor, Megaphone, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import { BottomSheet } from '../../components/BottomSheet';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { callEdge } from '../../../lib/edgeApi';
import { useToast } from '../../../contexts/ToastContext';
import { getCurrentVendor } from '../../../lib/vendor';
import { openCheckoutUrl } from '../../../lib/nativeCheckout';
import { localizeCategoryName } from '../../../lib/categoryTranslations';
import { localizeProduct } from '../../../lib/productTranslations';
import { PROMO_PACKAGE_PRICES } from '../../../constants/promoPricing';
import { DATE_LOCALE } from '../../../lib/dateLocale';

// Mappa condivisa: vedi src/lib/dateLocale.ts

// Etichette risolte con t() dentro il componente — i pacchetti restano
// definiti qui ma il testo mostrato dipende dalla lingua selezionata.
function usePackages(t: (key: string, opts?: any) => string) {
  return [
    {
      group: t('vendor.pkgFeaturedGroup'), desc: t('vendor.pkgFeaturedDesc'), icon: Star, color: 'text-amber-500',
      items: [
        { id: 'featured_monthly', label: t('vendor.labelMonthly'), price: PROMO_PACKAGE_PRICES.featured_monthly, period: t('vendor.periodMonth'), badge: t('vendor.launchPriceBadge'), note: t('vendor.note5products30days') },
        { id: 'featured_quarterly', label: t('vendor.labelQuarterly'), price: PROMO_PACKAGE_PRICES.featured_quarterly, period: t('vendor.period3Months'), badge: t('vendor.launchPriceBadge'), note: t('vendor.note5products90days') },
      ]
    },
    {
      group: t('vendor.pkgHomepageGroup'), desc: t('vendor.pkgHomepageDesc'), icon: Monitor, color: 'text-secondary',
      items: [
        { id: 'homepage_monthly', label: t('vendor.labelWeekly'), price: PROMO_PACKAGE_PRICES.homepage_monthly, period: t('vendor.periodWeek'), badge: t('vendor.launchPriceBadge'), note: t('vendor.notePositionRotation') },
        { id: 'homepage_fixed', label: t('vendor.labelMonthly'), price: PROMO_PACKAGE_PRICES.homepage_fixed, period: t('vendor.periodMonth'), badge: t('vendor.launchPriceBadge'), note: t('vendor.notePositionFixed') },
      ]
    },
    {
      group: t('vendor.pkgCategoryGroup'), desc: t('vendor.pkgCategoryDesc'), icon: Megaphone, color: 'text-secondary',
      items: [
        { id: 'category_single', label: t('vendor.labelSingleCategory'), price: PROMO_PACKAGE_PRICES.category_single, period: t('vendor.periodMonth'), badge: t('vendor.launchPriceBadge'), note: t('vendor.note1category30days') },
        { id: 'category_multi', label: t('vendor.labelMultiCategory'), price: PROMO_PACKAGE_PRICES.category_multi, period: t('vendor.periodMonth'), badge: t('vendor.launchPriceBadge'), note: t('vendor.note3categories30days') },
      ]
    },
    {
      group: t('vendor.pkgHeroGroup'), desc: t('vendor.pkgHeroDesc'), icon: Zap, color: 'text-amber-500',
      items: [
        { id: 'hero_monthly', label: t('vendor.labelMonthly'), price: PROMO_PACKAGE_PRICES.hero_monthly, period: t('vendor.periodMonth'), badge: t('vendor.launchPriceBadge'), note: t('vendor.noteHeroContextual') },
      ]
    },
  ];
}

const CATEGORIES = ['Monouso','Sterilizzazione','Strumenti Odontoiatrici','Implantologia','Ortodonzia','Endodonzia','Materiali da Impronta','Protesica','Radiologia','Arredi Studio','Abbigliamento e Divise','Disinfezione','Consumabili','Igiene Orale Professionale'];

export function VendorPromotions() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const dateLocale = DATE_LOCALE[i18n.language] || 'en-GB';
  const PACKAGES = usePackages(t);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [activePromos, setActivePromos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  // Per selezione categoria/prodotti
  const [showModal, setShowModal] = useState<{ packageId: string; packageTitle: string; price: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [discountCode, setDiscountCode] = useState('');

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    if (!user) return;
    const vendor = await getCurrentVendor();
    if (!vendor) return;

    const [promoRes, prodRes] = await Promise.all([
      supabase.from('promotions').select('*').eq('vendor_id', vendor.id).eq('status', 'active').gte('expires_at', new Date().toISOString()),
      supabase.from('products').select('id, name, images, images_thumb, translations').eq('vendor_id', vendor.id).eq('status', 'published'),
    ]);
    setActivePromos(promoRes.data || []);
    setProducts((prodRes.data || []).map(p => localizeProduct(p, i18n.language)));
  };

  const handleBuy = (pkg: { id: string; label: string; price: number; group: string }) => {
    if (!user) { navigate('/login'); return; }
    const packageTitle = `${pkg.group} — ${pkg.label}`;
    // BUG SEGNALATO: il codice sconto viveva in un campo generico sopra
    // l'intera lista pacchetti, scollegato da quale pacchetto si stesse
    // davvero per acquistare — non è un vero "checkout", solo un campo a
    // caso sulla pagina. Ora OGNI pacchetto apre un passaggio di conferma
    // dedicato (prima lo facevano solo quelli con categoria/prodotti da
    // scegliere), col codice sconto dentro, subito prima di pagare.
    setShowModal({ packageId: pkg.id, packageTitle, price: pkg.price });
  };

  const proceedToCheckout = async (packageId: string, packageTitle: string, price: number, category: string | null, productIds: string[] | null) => {
    setLoading(packageId);
    setShowModal(null);
    try {
      const result = await callEdge('/stripe/create-promo-checkout', {
        body: {
          packageId, packageTitle, price,
          vendorId: user!.id,
          appOrigin: window.location.origin,
          platform: Capacitor.isNativePlatform() ? 'app' : 'web',
          sponsoredCategory: category,
          selectedProductIds: productIds,
          discountCode: discountCode.trim() || null,
          language: i18n.language,
        },
      });
      if (result.success && result.sessionUrl) await openCheckoutUrl(result.sessionUrl);
      else toast.error(result.error || t('vendor.genericErrorRetry'));
    } catch (e: any) { toast.error(t('vendor.genericErrorPrefix', { message: e?.message || t('vendor.tryAgainLater') })); }
    finally { setLoading(null); }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('vendor.promotionsTitle')}</h1>
        <p className="text-gray-500 mt-1">{t('vendor.promotionsSubtitle')}</p>
      </div>

      {/* Promozioni attive */}
      {activePromos.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="font-semibold text-green-800 mb-3 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {t('vendor.activePromotionsTitle')}</p>
          <div className="space-y-2">
            {activePromos.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-green-700">{p.package_name}</span>
                <span className="text-green-600">{t('vendor.expiresLabel', { date: new Date(p.expires_at).toLocaleDateString(dateLocale) })}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pacchetti */}
      {PACKAGES.map(group => (
        <div key={group.group} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-3 mb-5">
            <group.icon className={`w-6 h-6 ${group.color} flex-shrink-0 mt-0.5`} />
            <div>
              <h2 className="text-lg font-bold text-gray-900">{group.group}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{group.desc}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {group.items.map(item => (
              <div key={item.id} className={`border rounded-xl p-5 ${activePromos.some(p => p.package_id === item.id) ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-primary hover:shadow-sm'} transition-all`}>
                <div className="flex items-start justify-between mb-2">
                  <p className="font-bold text-gray-900">{item.label}</p>
                  {item.badge && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{item.badge}</span>}
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-bold text-primary">€{item.price}</span>
                  <span className="text-gray-400 text-sm">{item.period}</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">{item.note}</p>
                {activePromos.some(p => p.package_id === item.id) ? (
                  <div className="w-full py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-1.5"><CheckCircle className="w-4 h-4" /> {t('vendor.active')}</div>
                ) : (
                  <button onClick={() => handleBuy({ ...item, group: group.group })} disabled={loading === item.id}
                    className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {t('vendor.buyBtn')}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modal selezione categoria/prodotti */}
      {showModal && (
      <BottomSheet open={true} onClose={() => { setShowModal(null); setSelectedCategory(''); setSelectedProducts([]); setDiscountCode(''); }} maxWidthClass="sm:max-w-lg">
          <div className="p-6 pt-2">
            <div className="flex items-baseline justify-between mb-1">
              <h3 className="text-lg font-bold">{showModal.packageTitle}</h3>
              <span className="text-xl font-bold text-primary flex-shrink-0 ml-3">€{showModal.price}</span>
            </div>

            {showModal.packageId.startsWith('category_') && (
              <div>
                <p className="text-sm text-gray-600 mb-3">{t('vendor.selectCategoryToSponsor')}</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {(showModal.packageId === 'category_multi' ? CATEGORIES : CATEGORIES).slice(0, showModal.packageId === 'category_multi' ? CATEGORIES.length : CATEGORIES.length).map(cat => (
                    <label key={cat} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      showModal.packageId === 'category_multi'
                        ? (selectedCategory.split(',').includes(cat) ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300')
                        : (selectedCategory === cat ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300')
                    }`}>
                      <input type={showModal.packageId === 'category_multi' ? 'checkbox' : 'radio'} name="category"
                        checked={showModal.packageId === 'category_multi' ? selectedCategory.split(',').filter(Boolean).includes(cat) : selectedCategory === cat}
                        onChange={() => {
                          if (showModal.packageId === 'category_multi') {
                            const current = selectedCategory.split(',').filter(Boolean);
                            const max = 3;
                            if (current.includes(cat)) setSelectedCategory(current.filter(c => c !== cat).join(','));
                            else if (current.length < max) setSelectedCategory([...current, cat].join(','));
                          } else {
                            setSelectedCategory(cat);
                          }
                        }}
                        className="text-primary" />
                      <span className="text-xs font-medium">{localizeCategoryName(cat, i18n.language)}</span>
                    </label>
                  ))}
                </div>
                {showModal.packageId === 'category_multi' && (
                  <p className="text-xs text-gray-500 mb-4">{t('vendor.selectUpTo3Categories', { count: selectedCategory.split(',').filter(Boolean).length })}</p>
                )}
              </div>
            )}

            {(showModal.packageId.startsWith('featured_') || showModal.packageId.startsWith('hero_')) && products.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-3">{t('vendor.selectUpTo5Products')}</p>
                <div className="space-y-2 mb-4">
                  {products.map(p => (
                    <label key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedProducts.includes(p.id) ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="checkbox" checked={selectedProducts.includes(p.id)}
                        onChange={() => {
                          if (selectedProducts.includes(p.id)) setSelectedProducts(prev => prev.filter(id => id !== p.id));
                          else if (selectedProducts.length < 5) setSelectedProducts(prev => [...prev, p.id]);
                        }}
                        className="text-primary" />
                      {(p.images_thumb?.[0] || p.images?.[0]) && <img src={p.images_thumb?.[0] || p.images[0]} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                      <span className="text-sm font-medium line-clamp-1">{p.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mb-4">{t('vendor.selectedProductsCount', { count: selectedProducts.length })}</p>
              </div>
            )}

            {(showModal.packageId.startsWith('featured_') || showModal.packageId.startsWith('hero_')) && products.length === 0 && (
              <p className="text-sm text-amber-600 mb-4">{t('vendor.noProductsPublishedYet')}</p>
            )}

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">{t('vendor.discountCodeLabel')}</label>
              <input
                type="text"
                value={discountCode}
                onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                placeholder={t('vendor.optionalPlaceholder')}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowModal(null); setSelectedCategory(''); setSelectedProducts([]); setDiscountCode(''); }}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-sm">{t('common.cancel')}</button>
              <button
                disabled={
                  (showModal.packageId.startsWith('category_') && !selectedCategory) ||
                  ((showModal.packageId.startsWith('featured_') || showModal.packageId.startsWith('hero_')) && selectedProducts.length === 0)
                }
                onClick={() => proceedToCheckout(showModal.packageId, showModal.packageTitle, showModal.price,
                  showModal.packageId.startsWith('category_') ? selectedCategory : null,
                  (showModal.packageId.startsWith('featured_') || showModal.packageId.startsWith('hero_')) ? selectedProducts : null
                )}
                className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                {t('vendor.continueToPaymentBtn')}
              </button>
            </div>
          </div>
      </BottomSheet>
      )}
    </div>
  );
}
