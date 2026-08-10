import { useState, useEffect } from 'react';
import { Percent, Tag, Search, Check, X, Trash2, Loader2, AlertCircle, CheckCircle, Plus, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../contexts/ToastContext';
import { supabase } from '../../../lib/supabase';
import { getCurrentVendor } from '../../../lib/vendor';
import { getDiscountStatus } from '../../../lib/discountSchedule';

interface Product {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
  discount_starts_at: string | null;
  discount_ends_at: string | null;
  images: string[];
  stock: number;
}

interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  product_ids: string[] | null;
  max_uses: number | null;
  used_count: number;
  min_order_amount: number | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export function VendorDiscounts() {
  const { t } = useTranslation();
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [tab, setTab] = useState<'catalogo' | 'gestisci' | 'codici'>('catalogo');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const vendor = await getCurrentVendor();
    if (!vendor) { setError(t('vendor.notAuthorized')); setLoading(false); return; }
    setVendorId(vendor.id);
    const { data } = await supabase.from('products')
      .select('id, name, price, discount_price, discount_starts_at, discount_ends_at, images, images_thumb, stock')
      .eq('vendor_id', vendor.id).order('name', { ascending: true });
    setProducts(data || []);
    setLoading(false);
  };

  const flash = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(''); } else { setSuccess(msg); setError(''); }
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('vendor.discounts')}</h1>
        <p className="text-gray-600 mt-2">{t('vendor.discountsSubtitle')}</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 flex-shrink-0" />{success}</div>}

      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setTab('catalogo')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'catalogo' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          {t('vendor.catalogDiscountsTab')}
        </button>
        <button onClick={() => setTab('gestisci')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'gestisci' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          {t('vendor.manageDiscountsTab')}
          {products.filter(p => p.discount_price != null).length > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
              {products.filter(p => p.discount_price != null).length}
            </span>
          )}
        </button>
        <button onClick={() => setTab('codici')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'codici' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          {t('vendor.discountCodesTab')}
        </button>
      </div>

      {tab === 'catalogo'
        ? <CatalogDiscountTab products={products} onReload={load} flash={flash} />
        : tab === 'gestisci'
        ? <ManageDiscountsTab products={products} onReload={load} flash={flash} />
        : <DiscountCodesTab vendorId={vendorId!} products={products} flash={flash} />}
    </div>
  );
}

// ── Tab 1: sconto massivo o su singolo prodotto (imposta discount_price) ──
function CatalogDiscountTab({ products, onReload, flash }: { products: Product[]; onReload: () => void; flash: (m: string, e?: boolean) => void }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [applying, setApplying] = useState(false);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const allVisibleSelected = filtered.length > 0 && filtered.every(p => selected.has(p.id));

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };
  const toggleAllVisible = () => {
    const next = new Set(selected);
    if (allVisibleSelected) filtered.forEach(p => next.delete(p.id));
    else filtered.forEach(p => next.add(p.id));
    setSelected(next);
  };

  // Selezionare 1 solo prodotto è esattamente lo "sconto su singolo prodotto"
  // richiesto — stesso strumento, nessuna schermata separata da mantenere.
  const applyDiscount = async () => {
    const numValue = parseFloat(value);
    if (selected.size === 0) { flash(t('vendor.selectAtLeastOneProduct'), true); return; }
    if (!numValue || numValue <= 0) { flash(t('vendor.enterValidDiscountValue'), true); return; }
    if (discountType === 'percentage' && numValue >= 100) { flash(t('vendor.percentageMustBeUnder100'), true); return; }

    setApplying(true);
    const targets = products.filter(p => selected.has(p.id));
    const updates = targets.map(p => {
      // Mai un prezzo scontato negativo o pari a zero, qualunque sia il tipo di sconto.
      const discounted = discountType === 'percentage'
        ? p.price * (1 - numValue / 100)
        : Math.max(0.01, p.price - numValue);
      return supabase.from('products').update({ discount_price: Math.round(discounted * 100) / 100 }).eq('id', p.id);
    });
    const results = await Promise.all(updates);
    const failed = results.filter(r => r.error).length;
    setApplying(false);
    if (failed > 0) flash(t('vendor.productsNotUpdatedError', { count: failed }), true);
    else flash(t(targets.length === 1 ? 'vendor.discountAppliedTo_one' : 'vendor.discountAppliedTo_other', { count: targets.length }));
    setSelected(new Set()); setValue('');
    onReload();
  };

  const removeDiscount = async () => {
    if (selected.size === 0) { flash(t('vendor.selectAtLeastOneProduct'), true); return; }
    setApplying(true);
    const ids = Array.from(selected);
    const { error: err } = await supabase.from('products').update({ discount_price: null }).in('id', ids);
    setApplying(false);
    if (err) { flash(t('vendor.errorRemovingDiscount'), true); return; }
    flash(t(ids.length === 1 ? 'vendor.discountRemovedFrom_one' : 'vendor.discountRemovedFrom_other', { count: ids.length }));
    setSelected(new Set());
    onReload();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('vendor.searchProduct')}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
          </div>
          <button onClick={toggleAllVisible} className="text-xs font-medium text-primary whitespace-nowrap hover:underline">
            {allVisibleSelected ? t('vendor.deselectAll') : t('vendor.selectAll')}
          </button>
        </div>
        <div className="max-h-[520px] overflow-y-auto divide-y divide-gray-100">
          {filtered.length === 0 && <p className="p-6 text-sm text-gray-400 text-center">{t('shop.noProducts')}</p>}
          {filtered.map(p => (
            <label key={p.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0" />
              <img src={Array.isArray(p.images_thumb) && p.images_thumb[0] ? p.images_thumb[0] : (Array.isArray(p.images) ? p.images[0] : undefined)} alt="" className="w-10 h-10 rounded object-contain bg-gray-50 border border-gray-100 flex-shrink-0"
                onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
              <span className="flex-1 text-sm text-gray-800 truncate">{p.name}</span>
              {p.discount_price ? (
                <span className="text-xs whitespace-nowrap">
                  <span className="line-through text-gray-400 mr-1">€{Number(p.price).toFixed(2)}</span>
                  <span className="text-red-600 font-semibold">€{Number(p.discount_price).toFixed(2)}</span>
                </span>
              ) : (
                <span className="text-xs text-gray-500 whitespace-nowrap">€{Number(p.price).toFixed(2)}</span>
              )}
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 h-fit space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          <Percent className="w-4 h-4 text-primary" /> {t('vendor.applyDiscountLabel')}
        </div>
        <p className="text-xs text-gray-500">{t(selected.size === 1 ? 'vendor.selectedCount_one' : 'vendor.selectedCount_other', { count: selected.size })} — {t('vendor.selectedCountHelp')}</p>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setDiscountType('percentage')}
            className={`py-2 rounded-lg text-sm font-medium border ${discountType === 'percentage' ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600'}`}>
            {t('vendor.percentageType')}
          </button>
          <button type="button" onClick={() => setDiscountType('fixed')}
            className={`py-2 rounded-lg text-sm font-medium border ${discountType === 'fixed' ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600'}`}>
            {t('vendor.fixedAmountType')}
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">{discountType === 'percentage' ? t('vendor.discountPercentageLabel') : t('vendor.discountAmountLabel')}</label>
          <div className="relative">
            <input type="number" min="0" step="0.01" value={value} onChange={e => setValue(e.target.value)}
              placeholder={discountType === 'percentage' ? t('vendor.percentagePlaceholder') : t('vendor.amountPlaceholder')}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{discountType === 'percentage' ? '%' : '€'}</span>
          </div>
        </div>

        <button onClick={applyDiscount} disabled={applying}
          className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
          {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {t('vendor.applyDiscountLabel')}
        </button>
        <button onClick={removeDiscount} disabled={applying}
          className="w-full py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
          {t('vendor.removeDiscountFromSelected')}
        </button>
      </div>
    </div>
  );
}

// ── Tab 2: codici sconto del venditore, applicabili a tutto il catalogo o a prodotti scelti ──
function DiscountCodesTab({ vendorId, products, flash }: { vendorId: string; products: Product[]; flash: (m: string, e?: boolean) => void }) {
  const { t } = useTranslation();
  const toast = useToast();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState('');
  const [type, setType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [scope, setScope] = useState<'all' | 'select'>('all');
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [minOrder, setMinOrder] = useState('');

  useEffect(() => { loadCodes(); }, []);

  const loadCodes = async () => {
    setLoading(true);
    const { data } = await supabase.from('discount_codes').select('*').eq('vendor_id', vendorId).order('created_at', { ascending: false });
    setCodes(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setCode(''); setType('percentage'); setValue(''); setScope('all'); setSelectedProducts(new Set());
    setMaxUses(''); setExpiresAt(''); setMinOrder(''); setShowForm(false);
  };

  const createCode = async () => {
    const numValue = parseFloat(value);
    if (!code.trim()) { flash(t('vendor.enterCode'), true); return; }
    if (!numValue || numValue <= 0) { flash(t('vendor.enterValidDiscountValue'), true); return; }
    if (scope === 'select' && selectedProducts.size === 0) { flash(t('vendor.selectProductOrWholeCatalog'), true); return; }

    setSaving(true);
    const { error: err } = await supabase.from('discount_codes').insert([{
      code: code.trim().toUpperCase(),
      type,
      value: numValue,
      applies_to: 'order',
      vendor_id: vendorId,
      product_ids: scope === 'select' ? Array.from(selectedProducts) : null,
      max_uses: maxUses ? parseInt(maxUses) : null,
      expires_at: expiresAt || null,
      min_order_amount: minOrder ? parseFloat(minOrder) : null,
      is_active: true,
    }]);
    setSaving(false);
    if (err) {
      flash(err.code === '23505' ? t('vendor.codeAlreadyExists') : t('vendor.errorCreatingCode'), true);
      return;
    }
    flash(t('vendor.discountCodeCreated'));
    resetForm();
    loadCodes();
  };

  const toggleActive = async (c: DiscountCode) => {
    await supabase.from('discount_codes').update({ is_active: !c.is_active }).eq('id', c.id);
    loadCodes();
  };

  const remove = async (id: string) => {
    if (!(await toast.confirm(t('vendor.confirmDeleteCode'), { confirmLabel: t('common.delete'), danger: true }))) return;
    await supabase.from('discount_codes').delete().eq('id', id);
    loadCodes();
  };

  const toggleProduct = (id: string) => {
    const next = new Set(selectedProducts);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedProducts(next);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-5">
      {!showForm && (
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> {t('vendor.newDiscountCode')}
        </button>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('vendor.codeLabel')}</label>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder={t('vendor.codePlaceholder')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('vendor.discountLabel')}</label>
              <div className="flex gap-2">
                <select value={type} onChange={e => setType(e.target.value as any)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary">
                  <option value="percentage">%</option>
                  <option value="fixed">€</option>
                </select>
                <input type="number" min="0" step="0.01" value={value} onChange={e => setValue(e.target.value)} placeholder={t('vendor.valuePlaceholder')}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('vendor.appliesToWhichProducts')}</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button type="button" onClick={() => setScope('all')}
                className={`py-2 rounded-lg text-sm font-medium border ${scope === 'all' ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600'}`}>
                {t('vendor.wholeCatalog')}
              </button>
              <button type="button" onClick={() => setScope('select')}
                className={`py-2 rounded-lg text-sm font-medium border ${scope === 'select' ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600'}`}>
                {t('vendor.selectedProducts')}
              </button>
            </div>
            {scope === 'select' && (
              <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                {products.map(p => (
                  <label key={p.id} className="flex items-center gap-2.5 p-2.5 hover:bg-gray-50 cursor-pointer text-sm">
                    <input type="checkbox" checked={selectedProducts.has(p.id)} onChange={() => toggleProduct(p.id)}
                      className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                    <span className="truncate">{p.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('vendor.maxUsesOptional')}</label>
              <input type="number" min="1" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder={t('vendor.unlimited')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('vendor.expirationOptional')}</label>
              <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('vendor.minOrderOptional')}</label>
              <input type="number" min="0" step="0.01" value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder={t('vendor.noneLabel')}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={createCode} disabled={saving}
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {t('vendor.createCode')}
            </button>
            <button onClick={resetForm} className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {codes.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{t('vendor.noCodesYet')}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">{t('vendor.codeLabel')}</th>
                <th className="px-4 py-3 text-left">{t('vendor.discountLabel')}</th>
                <th className="px-4 py-3 text-left">{t('vendor.scopeLabel')}</th>
                <th className="px-4 py-3 text-left">{t('vendor.usesLabel')}</th>
                <th className="px-4 py-3 text-left">{t('vendor.tableStatus')}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {codes.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800 flex items-center gap-1.5">
                    {c.code}
                    <button onClick={() => { navigator.clipboard.writeText(c.code); flash(t('vendor.codeCopied')); }} className="text-gray-300 hover:text-gray-500">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.type === 'percentage' ? `${c.value}%` : `€${Number(c.value).toFixed(2)}`}</td>
                  <td className="px-4 py-3 text-gray-600">{c.product_ids && c.product_ids.length > 0 ? t('vendor.productsCount', { count: c.product_ids.length }) : t('vendor.wholeCatalog')}</td>
                  <td className="px-4 py-3 text-gray-600">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(c)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.is_active ? t('vendor.active') : t('vendor.inactive')}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => remove(c.id)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Tab 2: gestione sconti già applicati — modifica, programma, rimuovi ──
// Diversa dalla tab "Sconti Catalogo" (che serve per APPLICARNE di nuovi in
// blocco): questa è la vista di controllo su quelli già attivi, con lo
// stato di ciascuno (attivo ora / programmato per il futuro / scaduto) e le
// azioni per intervenire senza dover ripassare dall'applicazione in blocco.
function ManageDiscountsTab({ products, onReload, flash }: { products: Product[]; onReload: () => void; flash: (m: string, e?: boolean) => void }) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [saving, setSaving] = useState(false);

  const discounted = products.filter(p => p.discount_price != null);

  // datetime-local vuole "YYYY-MM-DDTHH:mm" in ora locale, mentre il DB
  // salva ISO UTC — conversione in entrambe le direzioni.
  const toLocalInput = (iso: string | null) => {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const startEdit = (p: Product) => {
    setEditingId(p.id);
    setEditPrice(String(p.discount_price));
    setEditStart(toLocalInput(p.discount_starts_at));
    setEditEnd(toLocalInput(p.discount_ends_at));
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (p: Product) => {
    const numPrice = parseFloat(editPrice);
    if (!numPrice || numPrice <= 0) { flash(t('vendor.enterValidDiscountValue'), true); return; }
    if (numPrice >= p.price) { flash(t('vendor.discountMustBeLowerThanPrice'), true); return; }
    if (editStart && editEnd && new Date(editStart) >= new Date(editEnd)) { flash(t('vendor.endDateMustBeAfterStart'), true); return; }

    setSaving(true);
    const { error } = await supabase.from('products').update({
      discount_price: Math.round(numPrice * 100) / 100,
      discount_starts_at: editStart ? new Date(editStart).toISOString() : null,
      discount_ends_at: editEnd ? new Date(editEnd).toISOString() : null,
    }).eq('id', p.id);
    setSaving(false);
    if (error) { flash(t('vendor.errorSavingDiscount'), true); return; }
    flash(t('vendor.discountUpdated'));
    setEditingId(null);
    onReload();
  };

  const removeDiscount = async (p: Product) => {
    setSaving(true);
    const { error } = await supabase.from('products').update({
      discount_price: null, discount_starts_at: null, discount_ends_at: null,
    }).eq('id', p.id);
    setSaving(false);
    if (error) { flash(t('vendor.errorRemovingDiscount'), true); return; }
    flash(t('vendor.discountRemovedFrom_one', { count: 1 }));
    onReload();
  };

  const statusBadge = (p: Product) => {
    const status = getDiscountStatus(p);
    const map: Record<string, { label: string; className: string }> = {
      active: { label: t('vendor.discountStatusActive'), className: 'bg-green-100 text-green-700' },
      scheduled: { label: t('vendor.discountStatusScheduled'), className: 'bg-amber-100 text-amber-700' },
      expired: { label: t('vendor.discountStatusExpired'), className: 'bg-gray-100 text-gray-500' },
      none: { label: '', className: '' },
    };
    const s = map[status];
    if (!s.label) return null;
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.className}`}>{s.label}</span>;
  };

  const fmtDate = (iso: string | null) => iso ? new Date(iso).toLocaleString(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : null;

  if (discounted.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Percent className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p className="text-gray-500 text-sm">{t('vendor.noDiscountedProducts')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
      {discounted.map(p => (
        <div key={p.id} className="p-4">
          <div className="flex items-center gap-3">
            <img src={Array.isArray((p as any).images_thumb) && (p as any).images_thumb[0] ? (p as any).images_thumb[0] : (Array.isArray(p.images) ? p.images[0] : undefined)}
              alt="" className="w-12 h-12 rounded-lg object-contain bg-gray-50 border border-gray-100 flex-shrink-0"
              onError={e => { (e.target as HTMLImageElement).style.visibility = 'hidden'; }} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs">
                  <span className="line-through text-gray-400 mr-1">€{Number(p.price).toFixed(2)}</span>
                  <span className="text-red-600 font-semibold">€{Number(p.discount_price).toFixed(2)}</span>
                </span>
                {statusBadge(p)}
                {(p.discount_starts_at || p.discount_ends_at) && (
                  <span className="text-[11px] text-gray-400">
                    {p.discount_starts_at && `${t('vendor.discountFrom')} ${fmtDate(p.discount_starts_at)}`}
                    {p.discount_starts_at && p.discount_ends_at && ' · '}
                    {p.discount_ends_at && `${t('vendor.discountUntil')} ${fmtDate(p.discount_ends_at)}`}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {editingId === p.id ? (
                <button onClick={cancelEdit} className="text-xs px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50">
                  {t('common.cancel')}
                </button>
              ) : (
                <>
                  <button onClick={() => startEdit(p)} className="text-xs px-3 py-1.5 border border-primary/30 text-primary rounded-lg hover:bg-accent">
                    {t('common.edit')}
                  </button>
                  <button onClick={() => removeDiscount(p)} disabled={saving} className="text-xs px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50">
                    {t('common.remove')}
                  </button>
                </>
              )}
            </div>
          </div>

          {editingId === p.id && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 rounded-lg p-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('vendor.discountPriceLabel')}</label>
                <div className="relative">
                  <input type="number" min="0" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('vendor.discountStartLabel')}</label>
                <input type="datetime-local" value={editStart} onChange={e => setEditStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
                <p className="text-[11px] text-gray-400 mt-1">{t('vendor.discountScheduleEmptyHint')}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('vendor.discountEndLabel')}</label>
                <input type="datetime-local" value={editEnd} onChange={e => setEditEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
              </div>
              <div className="sm:col-span-3">
                <button onClick={() => saveEdit(p)} disabled={saving}
                  className="px-5 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {t('common.save')}
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
