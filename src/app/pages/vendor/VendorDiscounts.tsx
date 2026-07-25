import { useState, useEffect } from 'react';
import { Percent, Tag, Search, Check, X, Trash2, Loader2, AlertCircle, CheckCircle, Plus, Copy } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { getCurrentVendor } from '../../../lib/vendor';

interface Product {
  id: string;
  name: string;
  price: number;
  discount_price: number | null;
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
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [tab, setTab] = useState<'catalogo' | 'codici'>('catalogo');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const vendor = await getCurrentVendor();
    if (!vendor) { setError('Non sei autorizzato come venditore'); setLoading(false); return; }
    setVendorId(vendor.id);
    const { data } = await supabase.from('products')
      .select('id, name, price, discount_price, images, stock')
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
        <h1 className="text-3xl font-bold text-gray-900">Sconti</h1>
        <p className="text-gray-600 mt-2">Applica ribassi sul catalogo o crea codici sconto per il tuo store.</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg p-3 flex items-center gap-2"><CheckCircle className="w-4 h-4 flex-shrink-0" />{success}</div>}

      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setTab('catalogo')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'catalogo' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Sconti sul catalogo
        </button>
        <button onClick={() => setTab('codici')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === 'codici' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
          Codici sconto
        </button>
      </div>

      {tab === 'catalogo'
        ? <CatalogDiscountTab products={products} onReload={load} flash={flash} />
        : <DiscountCodesTab vendorId={vendorId!} products={products} flash={flash} />}
    </div>
  );
}

// ── Tab 1: sconto massivo o su singolo prodotto (imposta discount_price) ──
function CatalogDiscountTab({ products, onReload, flash }: { products: Product[]; onReload: () => void; flash: (m: string, e?: boolean) => void }) {
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
    if (selected.size === 0) { flash('Seleziona almeno un prodotto.', true); return; }
    if (!numValue || numValue <= 0) { flash('Inserisci un valore di sconto valido.', true); return; }
    if (discountType === 'percentage' && numValue >= 100) { flash('Lo sconto percentuale deve essere inferiore al 100%.', true); return; }

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
    if (failed > 0) flash(`${failed} prodotti non aggiornati per un errore. Riprova.`, true);
    else flash(`Sconto applicato a ${targets.length} ${targets.length === 1 ? 'prodotto' : 'prodotti'}.`);
    setSelected(new Set()); setValue('');
    onReload();
  };

  const removeDiscount = async () => {
    if (selected.size === 0) { flash('Seleziona almeno un prodotto.', true); return; }
    setApplying(true);
    const ids = Array.from(selected);
    const { error: err } = await supabase.from('products').update({ discount_price: null }).in('id', ids);
    setApplying(false);
    if (err) { flash('Errore durante la rimozione dello sconto.', true); return; }
    flash(`Sconto rimosso da ${ids.length} ${ids.length === 1 ? 'prodotto' : 'prodotti'}.`);
    setSelected(new Set());
    onReload();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca un prodotto..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
          </div>
          <button onClick={toggleAllVisible} className="text-xs font-medium text-primary whitespace-nowrap hover:underline">
            {allVisibleSelected ? 'Deseleziona tutti' : 'Seleziona tutti'}
          </button>
        </div>
        <div className="max-h-[520px] overflow-y-auto divide-y divide-gray-100">
          {filtered.length === 0 && <p className="p-6 text-sm text-gray-400 text-center">Nessun prodotto trovato.</p>}
          {filtered.map(p => (
            <label key={p.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer">
              <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0" />
              <img src={Array.isArray(p.images) ? p.images[0] : undefined} alt="" className="w-10 h-10 rounded object-contain bg-gray-50 border border-gray-100 flex-shrink-0"
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
          <Percent className="w-4 h-4 text-primary" /> Applica sconto
        </div>
        <p className="text-xs text-gray-500">{selected.size} {selected.size === 1 ? 'prodotto selezionato' : 'prodotti selezionati'} — seleziona un solo prodotto per uno sconto singolo, o più per uno sconto massivo.</p>

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => setDiscountType('percentage')}
            className={`py-2 rounded-lg text-sm font-medium border ${discountType === 'percentage' ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600'}`}>
            % Percentuale
          </button>
          <button type="button" onClick={() => setDiscountType('fixed')}
            className={`py-2 rounded-lg text-sm font-medium border ${discountType === 'fixed' ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600'}`}>
            € Importo fisso
          </button>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">{discountType === 'percentage' ? 'Percentuale di sconto' : 'Importo da sottrarre'}</label>
          <div className="relative">
            <input type="number" min="0" step="0.01" value={value} onChange={e => setValue(e.target.value)}
              placeholder={discountType === 'percentage' ? 'es. 15' : 'es. 5.00'}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">{discountType === 'percentage' ? '%' : '€'}</span>
          </div>
        </div>

        <button onClick={applyDiscount} disabled={applying}
          className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
          {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Applica sconto
        </button>
        <button onClick={removeDiscount} disabled={applying}
          className="w-full py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
          Rimuovi sconto dai selezionati
        </button>
      </div>
    </div>
  );
}

// ── Tab 2: codici sconto del venditore, applicabili a tutto il catalogo o a prodotti scelti ──
function DiscountCodesTab({ vendorId, products, flash }: { vendorId: string; products: Product[]; flash: (m: string, e?: boolean) => void }) {
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
    if (!code.trim()) { flash('Inserisci un codice.', true); return; }
    if (!numValue || numValue <= 0) { flash('Inserisci un valore di sconto valido.', true); return; }
    if (scope === 'select' && selectedProducts.size === 0) { flash('Seleziona almeno un prodotto, oppure scegli "Tutto il catalogo".', true); return; }

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
      flash(err.code === '23505' ? 'Questo codice esiste già — scegline un altro.' : 'Errore durante la creazione del codice.', true);
      return;
    }
    flash('Codice sconto creato.');
    resetForm();
    loadCodes();
  };

  const toggleActive = async (c: DiscountCode) => {
    await supabase.from('discount_codes').update({ is_active: !c.is_active }).eq('id', c.id);
    loadCodes();
  };

  const remove = async (id: string) => {
    if (!confirm('Eliminare questo codice sconto?')) return;
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
          <Plus className="w-4 h-4" /> Nuovo codice sconto
        </button>
      )}

      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Codice</label>
              <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="es. BENVENUTO10"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Sconto</label>
              <div className="flex gap-2">
                <select value={type} onChange={e => setType(e.target.value as any)}
                  className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary">
                  <option value="percentage">%</option>
                  <option value="fixed">€</option>
                </select>
                <input type="number" min="0" step="0.01" value={value} onChange={e => setValue(e.target.value)} placeholder="Valore"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">A quali prodotti si applica</label>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button type="button" onClick={() => setScope('all')}
                className={`py-2 rounded-lg text-sm font-medium border ${scope === 'all' ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600'}`}>
                Tutto il catalogo
              </button>
              <button type="button" onClick={() => setScope('select')}
                className={`py-2 rounded-lg text-sm font-medium border ${scope === 'select' ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600'}`}>
                Prodotti selezionati
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
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Utilizzi massimi (opzionale)</label>
              <input type="number" min="1" value={maxUses} onChange={e => setMaxUses(e.target.value)} placeholder="Illimitati"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Scadenza (opzionale)</label>
              <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Ordine minimo € (opzionale)</label>
              <input type="number" min="0" step="0.01" value={minOrder} onChange={e => setMinOrder(e.target.value)} placeholder="Nessuno"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={createCode} disabled={saving}
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Crea codice
            </button>
            <button onClick={resetForm} className="px-5 py-2.5 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50">
              Annulla
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {codes.length === 0 ? (
          <div className="p-12 text-center">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Non hai ancora creato nessun codice sconto.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-3 text-left">Codice</th>
                <th className="px-4 py-3 text-left">Sconto</th>
                <th className="px-4 py-3 text-left">Ambito</th>
                <th className="px-4 py-3 text-left">Utilizzi</th>
                <th className="px-4 py-3 text-left">Stato</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {codes.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-mono font-semibold text-gray-800 flex items-center gap-1.5">
                    {c.code}
                    <button onClick={() => { navigator.clipboard.writeText(c.code); flash('Codice copiato.'); }} className="text-gray-300 hover:text-gray-500">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.type === 'percentage' ? `${c.value}%` : `€${Number(c.value).toFixed(2)}`}</td>
                  <td className="px-4 py-3 text-gray-600">{c.product_ids && c.product_ids.length > 0 ? `${c.product_ids.length} prodotti` : 'Tutto il catalogo'}</td>
                  <td className="px-4 py-3 text-gray-600">{c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(c)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${c.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.is_active ? 'Attivo' : 'Disattivato'}
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
