import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { getCurrentVendor, canAddProduct, ensureVendorExists, getTrialStatus } from '../../../lib/vendor';
import { ImageUploader } from '../../components/ImageUploader';

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
  'Disinfezione',
  'Consumabili',
  'Igiene Orale Professionale',
];

export function VendorAddProduct() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [productLimit, setProductLimit] = useState({ canAdd: true, currentCount: 0, limit: 0 });

  // URL immagini già caricate su Supabase Storage (aggiornate dall'ImageUploader in tempo reale)
  const [imageUrls, setImageUrls] = useState<string[]>([]);

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
          business_name: 'Il mio Store',
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
        setError('Il tuo trial di 6 mesi è scaduto. Acquista un piano per continuare ad aggiungere prodotti.');
        return;
      }
      if (!limit.canAdd) {
        setError(limit.reason || `Hai raggiunto il limite di ${limit.limit} prodotti del tuo piano.`);
      }
    } catch (err) {
      console.error('loadVendorData error:', err);
      setError('Errore nel caricamento dei dati venditore');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.name || !formData.category || !formData.price || !formData.stock) {
        throw new Error('Compila tutti i campi obbligatori');
      }
      if (!vendorId) {
        throw new Error('Devi essere registrato come venditore per aggiungere prodotti');
      }
      if (!productLimit.canAdd) {
        throw new Error(`Hai raggiunto il limite di ${productLimit.limit} prodotti del tuo piano`);
      }

      const productData = {
        vendor_id: vendorId,
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
        is_sponsored: false,
        shipping_cost_override: customShipping && shippingCostOverride ? parseFloat(shippingCostOverride) : null,
        shipping_weight_kg: shippingWeightKg ? parseFloat(shippingWeightKg) : null,
      };

      const { data, error: insertError } = await supabase
        .from('products')
        .insert([productData])
        .select()
        .single();

      if (insertError) throw new Error(`Errore nel salvataggio: ${insertError.message}`);

      setSuccess('Prodotto salvato con successo!');
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
          <h1 className="text-3xl font-bold text-gray-900">Aggiungi Prodotto</h1>
          <p className="text-gray-600 mt-1">Crea un nuovo prodotto nel tuo catalogo</p>
        </div>
      </div>

      {error === 'VENDOR_NOT_FOUND' ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-bold text-amber-900 mb-2">Profilo venditore non ancora attivato</h3>
          <p className="text-sm text-amber-700 mb-4">Il tuo profilo risulta come venditore ma il record non è ancora stato creato nel database. Clicca il pulsante per attivarlo.</p>
          <button onClick={async () => {
            setError('');
            if (!user) return;
            const trialEnd = new Date(); trialEnd.setDate(trialEnd.getDate() + 180); // 6 mesi di prova gratuita
            // Verifica prima se esiste già
            const { data: existing } = await supabase.from('vendors').select('id').eq('profile_id', user.id).maybeSingle();
            if (existing) { loadVendorData(); return; }
            const { error: e } = await supabase.from('vendors').insert([{
              profile_id: user.id, business_name: 'Il mio Store', plan_type: 'trial',
              plan_status: 'active', product_limit: 999999, verified_badge: false,
              trial_ends_at: trialEnd.toISOString(),
            }]);
            if (!e) { loadVendorData(); }
            else { setError('Errore: ' + e.message); }
          }} className="px-6 py-3 bg-amber-500 text-white rounded-xl font-semibold hover:bg-amber-600 transition-colors">
            Attiva Account Venditore
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Informazioni Principali</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Prodotto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                placeholder="Es. Guanti in Nitrile - Taglia M - Scatola 100 pz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                placeholder="Descrivi il prodotto in dettaglio..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                >
                  <option value="">Seleziona categoria</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brand</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                  placeholder="Es. 3M, Dentsply, Kerr..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prezzo (€) <span className="text-red-500">*</span>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantità in Magazzino <span className="text-red-500">*</span>
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
                  Codice SKU
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                  placeholder="Es. SKU-001"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specifiche Tecniche
              </label>
              <textarea
                value={formData.specifications}
                onChange={(e) => setFormData({ ...formData, specifications: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                placeholder="Materiale, dimensioni, certificazioni, codice REF..."
              />
            </div>

            {/* Spedizione personalizzata — per prodotti pesanti/ingombranti che
                non rientrano nella spedizione standard del negozio */}
            <div className="border border-border rounded-lg p-4 bg-accent/30">
              <label className="flex items-center gap-2 cursor-pointer mb-1">
                <input
                  type="checkbox"
                  checked={customShipping}
                  onChange={(e) => setCustomShipping(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-secondary"
                />
                <span className="text-sm font-medium text-gray-700">Questo prodotto ha un costo di spedizione diverso dallo standard</span>
              </label>
              <p className="text-xs text-muted-foreground mb-3 ml-6">Utile per prodotti pesanti o ingombranti (es. poltrone, riuniti, mobili da studio) che costano di più da spedire rispetto al resto del catalogo.</p>
              {customShipping && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Costo di spedizione (€) *</label>
                    <input
                      type="number" step="0.01" min="0" required={customShipping}
                      value={shippingCostOverride}
                      onChange={(e) => setShippingCostOverride(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                      placeholder="Es. 49.90"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Sostituisce il costo di spedizione standard del tuo negozio solo per questo prodotto.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Peso indicativo (kg)</label>
                    <input
                      type="number" step="0.1" min="0"
                      value={shippingWeightKg}
                      onChange={(e) => setShippingWeightKg(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                      placeholder="Es. 35"
                    />
                    <p className="text-xs text-muted-foreground mt-1">Facoltativo, solo a titolo informativo.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Immagini — usa il componente reale con upload su Supabase */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Immagini Prodotto</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Le immagini vengono caricate automaticamente. La prima è quella principale.
              </p>
            </div>
            {imageUrls.length > 0 && (
              <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                {imageUrls.length} caricate
              </span>
            )}
          </div>

          {vendorId ? (
            <ImageUploader
              vendorId={vendorId}
              onChange={setImageUrls}
              maxImages={8}
              disabled={loading}
            />
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
              Caricamento dati venditore...
            </div>
          )}
        </div>

        {/* Pubblicazione */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Pubblicazione</h2>
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
                <span className="text-gray-700 font-medium">Pubblica subito</span>
                <p className="text-xs text-gray-500">Visibile agli acquirenti immediatamente</p>
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
                <span className="text-gray-700 font-medium">Salva come bozza</span>
                <p className="text-xs text-gray-500">Puoi pubblicarlo in seguito</p>
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
            Annulla
          </Link>
          <button
            type="submit"
            disabled={loading || !vendorId}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary transition-colors font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salva Prodotto
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
