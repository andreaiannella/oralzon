import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { getCurrentVendor, canAddProduct, ensureVendorExists, getTrialStatus } from '../../../lib/vendor';
import { callEdge } from '../../../lib/edgeApi';
import { ImageUploader } from '../../components/ImageUploader';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import { localizeCategoryName } from '../../../lib/categoryTranslations';

const CATEGORIES = [
  'Monouso',
  'Sterilizzazione',
  'Strumenti Odontoiatrici',
  'Implantologia',
  'Ortodonzia',
  'Endodonzia',
  'Materiali da Impronta',
  'Protesica',
  'Radiologia',
  'Arredi Studio',
  'Abbigliamento e Divise',
  'Disinfezione',
  'Consumabili',
  'Igiene Orale Professionale',
];

export function VendorAddProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [productLimit, setProductLimit] = useState({ canAdd: true, currentCount: 0, limit: 0 });

  // URL immagini già caricate su Supabase Storage (aggiornate dall'ImageUploader in tempo reale)
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageThumbUrls, setImageThumbUrls] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    sku: '',
    brand: '',
    specifications: '',
    status: 'published' as 'published' | 'draft',
  });
  const [customShipping, setCustomShipping] = useState(false);
  const [shippingCostOverride, setShippingCostOverride] = useState('');
  const [shippingWeightKg, setShippingWeightKg] = useState('');
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountPrice, setDiscountPrice] = useState('');

  useEffect(() => {
    loadVendorData();
  }, [user]);

  const loadVendorData = async () => {
    try {
      // Primo tentativo: crea o recupera vendor
      let vendor = await ensureVendorExists();
      
      // Se fallisce, aspetta 1 secondo e riprova (edge function può essere lenta)
      if (!vendor) {
        await new Promise(r => setTimeout(r, 1000));
        vendor = await getCurrentVendor();
      }

      // Terzo tentativo: crea direttamente via Supabase
      if (!vendor && user) {
        const trialEnd = new Date();
        trialEnd.setDate(trialEnd.getDate() + 180); // 6 mesi di prova gratuita
        const { data, error } = await supabase.from('vendors').insert([{
          profile_id: user.id,
          business_name: t('vendor.defaultStoreName'),
          plan_type: 'trial',
          plan_status: 'active',
          product_limit: 999999,
          verified_badge: false,
          trial_ends_at: trialEnd.toISOString(),
        }]).select().single();
        if (!error && data) vendor = data;
        else vendor = await getCurrentVendor(); // potrebbe già esistere
      }

      if (!vendor) {
        setError('VENDOR_NOT_FOUND');
        return;
      }

      setVendorId(vendor.id);

      const limit = await canAddProduct();
      setProductLimit(limit);

      const trialStatus = getTrialStatus(vendor);
      if (!trialStatus.isActive) {
        setError(t('vendor.trialExpired'));
        return;
      }
      if (!limit.canAdd) {
        setError(limit.reason || t('vendor.planLimitReached', { limit: limit.limit }));
      }
    } catch (err) {
      console.error('loadVendorData error:', err);
      setError(t('vendor.loadVendorDataError'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.name || !formData.category || !formData.price || !formData.stock) {
        throw new Error(t('vendor.fillRequiredFields'));
      }
      if (!shippingWeightKg || parseFloat(shippingWeightKg) <= 0) {
        throw new Error(t('vendor.weightMustBePositive'));
      }
      if (!vendorId) {
        throw new Error(t('vendor.mustBeRegisteredVendor'));
      }
      if (!productLimit.canAdd) {
        throw new Error(t('vendor.planLimitReached', { limit: productLimit.limit }));
      }
      if (hasDiscount) {
        const dp = parseFloat(discountPrice);
        if (!discountPrice || isNaN(dp) || dp <= 0 || dp >= parseFloat(formData.price)) {
          throw new Error(t('vendor.discountPriceInvalid'));
        }
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        sku: formData.sku || null,
        brand: formData.brand || null,
        specifications: formData.specifications || null,
        status: formData.status,
        images: imageUrls,           // ← URL reali da Supabase Storage
        images_thumb: imageThumbUrls, // ← miniature per le griglie, stesso ordine di images
        shipping_cost_override: customShipping && shippingCostOverride ? parseFloat(shippingCostOverride) : null,
        shipping_weight_kg: shippingWeightKg ? parseFloat(shippingWeightKg) : null,
        discount_price: hasDiscount && discountPrice ? parseFloat(discountPrice) : null,
      };

      // Passa dal server (non pi\u00f9 insert diretto): serve a generare qui la
      // traduzione automatica del prodotto in tutte le lingue supportate
      // prima di salvarlo, cosa che il client non pu\u00f2 fare da solo.
      const result = await callEdge('/vendor/save-product', { body: productData });
      if (!result.success) throw new Error(result.error || t('vendor.saveError'));

      setSuccess(t('vendor.productSavedSuccess'));
      setTimeout(() => navigate('/venditore/prodotti'), 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/venditore/prodotti"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('vendor.addProduct')}</h1>
          <p className="text-gray-600 mt-1">{t('vendor.createNewProductSubtitle')}</p>
        </div>
      </div>

      {error === 'VENDOR_NOT_FOUND' ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-bold text-amber-900 mb-2">{t('vendor.vendorNotActivatedTitle')}</h3>
          <p className="text-sm text-amber-700 mb-4">{t('vendor.vendorNotActivatedDesc')}</p>
          <button onClick={async () => {
            setError('');
            if (!user) return;
            const trialEnd = new Date(); trialEnd.setDate(trialEnd.getDate() + 180); // 6 mesi di prova gratuita
            // Verifica prima se esiste già
            const { data: existing } = await supabase.from('vendors').select('id').eq('profile_id', user.id).maybeSingle();
            if (existing) { loadVendorData(); return; }
            const { error: e } = await supabase.from('vendors').insert([{
              profile_id: user.id, business_name: t('vendor.defaultStoreName'), plan_type: 'trial',
              plan_status: 'active', product_limit: 999999, verified_badge: false,
              trial_ends_at: trialEnd.toISOString(),
            }]);
            if (!e) { loadVendorData(); }
            else { setError(t('vendor.genericErrorPrefix', { message: e.message })); }
          }} className="px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors">
            {t('vendor.activateVendorAccount')}
          </button>
        </div>
      ) : error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informazioni principali */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('vendor.mainInfo')}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('vendor.productNameLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                placeholder={t('vendor.productNamePlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('product.description')} <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                placeholder={t('vendor.descriptionPlaceholder')}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('vendor.tableCategory')} <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
              >
                <option value="">{t('vendor.selectCategory')}</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{localizeCategoryName(cat, i18n.language)}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('product.brand')}</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                  placeholder={t('vendor.brandPlaceholder')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('vendor.priceLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Box offerta: elemento a sé, FUORI da qualsiasi grid — prima
                stava dentro lo stesso grid a 5 figli di Brand/Prezzo/
                Quantità/Peso con un col-span-2 in mezzo agli altri, una
                combinazione nota per causare calcoli di riga/colonna
                imprevedibili in alcuni motori di rendering mobile
                (sovrapposizione di label riportata su iOS). Separato per
                eliminare la causa alla radice, non solo mascherarla. */}
            <div className="border border-border rounded-lg p-4 bg-accent/30">
              <label className="flex items-center gap-2 cursor-pointer mb-1">
                <input
                  type="checkbox"
                  checked={hasDiscount}
                  onChange={(e) => setHasDiscount(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-secondary"
                />
                <span className="text-sm font-medium text-gray-700">{t('vendor.putOnOffer')}</span>
              </label>
              <p className="text-xs text-muted-foreground mb-3 ml-6">{t('vendor.offerDesc')}</p>
              {hasDiscount && (
                <div className="ml-6 max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('vendor.discountedPriceLabel')} *</label>
                  <input
                    type="number" step="0.01" min="0" required={hasDiscount}
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                    placeholder={t('vendor.discountedPricePlaceholder')}
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('vendor.stockQuantityLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('vendor.productWeightLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  value={shippingWeightKg}
                  onChange={(e) => setShippingWeightKg(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                  placeholder={t('vendor.productWeightPlaceholder')}
                />
                <p className="text-xs text-muted-foreground mt-1">{t('vendor.productWeightHelper')}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('vendor.skuLabel')}
              </label>
              <input
                type="text"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                placeholder={t('vendor.skuPlaceholder')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('product.technicalSpecs')}
              </label>
              <textarea
                value={formData.specifications}
                onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                placeholder={t('vendor.specsPlaceholder')}
              />
            </div>

            {/* Costo di spedizione personalizzato — il peso ora è sempre
                richiesto sopra; qui resta solo l'eventuale sovrapprezzo per
                prodotti che costano di più da spedire rispetto al resto del
                catalogo (es. per ingombro, non solo per peso). */}
            <div className="border border-border rounded-lg p-4 bg-accent/30">
              <label className="flex items-center gap-2 cursor-pointer mb-1">
                <input
                  type="checkbox"
                  checked={customShipping}
                  onChange={(e) => setCustomShipping(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-secondary"
                />
                <span className="text-sm font-medium text-gray-700">{t('vendor.customShippingLabel')}</span>
              </label>
              <p className="text-xs text-muted-foreground mb-3 ml-6">{t('vendor.customShippingDesc')}</p>
              {customShipping && (
                <div className="ml-6 max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('vendor.shippingCostLabel')}</label>
                  <input
                    type="number" step="0.01" min="0" required={customShipping}
                    value={shippingCostOverride}
                    onChange={(e) => setShippingCostOverride(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                    placeholder={t('vendor.shippingCostPlaceholder')}
                  />
                  <p className="text-xs text-muted-foreground mt-1">{t('vendor.shippingCostDesc')}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Immagini — usa il componente reale con upload su Supabase */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{t('vendor.productImages')}</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {t('vendor.imagesAutoUpload')}
              </p>
            </div>
            {imageUrls.length > 0 && (
              <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                {t('vendor.imagesUploaded', { count: imageUrls.length })}
              </span>
            )}
          </div>

          {vendorId ? (
            <ErrorBoundary fallback={
              <div className="border border-red-200 bg-red-50 rounded-xl p-6 text-center text-sm text-red-600">
                {t('vendor.imageComponentError')}
              </div>
            }>
              <ImageUploader
                vendorId={vendorId}
                onChange={(urls, thumbUrls) => { setImageUrls(urls); setImageThumbUrls(thumbUrls); }}
                maxImages={8}
                disabled={loading}
              />
            </ErrorBoundary>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
              {t('vendor.loadingVendorData')}
            </div>
          )}
        </div>

        {/* Pubblicazione */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('vendor.publicationSection')}</h2>
          <div className="flex gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="published"
                checked={formData.status === 'published'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-4 h-4 text-primary"
              />
              <div>
                <span className="text-gray-700 font-medium">{t('vendor.publishNow')}</span>
                <p className="text-xs text-gray-500">{t('vendor.publishNowDesc')}</p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="draft"
                checked={formData.status === 'draft'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-4 h-4 text-primary"
              />
              <div>
                <span className="text-gray-700 font-medium">{t('vendor.saveDraftOption')}</span>
                <p className="text-xs text-gray-500">{t('vendor.saveDraftDesc')}</p>
              </div>
            </label>
          </div>
        </div>

        {/* Azioni */}
        <div className="flex justify-end gap-4">
          <Link
            to="/venditore/prodotti"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {t('common.cancel')}
          </Link>
          <button
            type="submit"
            disabled={loading || !vendorId}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary transition-colors font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t('vendor.translatingAndSaving')}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {t('vendor.saveProductBtn')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
