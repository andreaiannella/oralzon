import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { getCurrentVendor, ensureVendorExists } from '../../../lib/vendor';
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
  'Igiene Orale Professionale'
];

interface Product {
  id: string;
  vendor_id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  status: 'published' | 'draft' | 'out_of_stock';
  sku: string | null;
  brand: string | null;
  specifications: string | null;
  images: string[];
  shipping_cost_override: number | null;
  shipping_weight_kg: number | null;
}

export function VendorEditProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    stock: '',
    sku: '',
    brand: '',
    specifications: '',
    status: 'published' as 'published' | 'draft' | 'out_of_stock'
  });

  const [vendorId, setVendorId] = useState<string | null>(null);
  // imageUrls contiene le URL finali (esistenti + nuove) aggiornate dall'ImageUploader
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [customShipping, setCustomShipping] = useState(false);
  const [shippingCostOverride, setShippingCostOverride] = useState('');
  const [shippingWeightKg, setShippingWeightKg] = useState('');

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoadingProduct(true);
      setError('');

      // Prima assicurati che il vendor esista
      let vendor = await ensureVendorExists();

      if (!vendor) {
        vendor = await getCurrentVendor();
      }

      if (!vendor) {
        throw new Error('Non sei autorizzato come venditore');
      }

      setVendorId(vendor.id);

      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('vendor_id', vendor.id)
        .single();

      if (fetchError) {
        throw new Error(`Errore nel caricamento del prodotto: ${fetchError.message}`);
      }

      if (!data) {
        throw new Error('Prodotto non trovato');
      }

      // Popola il form con i dati esistenti
      setFormData({
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price.toString(),
        stock: data.stock.toString(),
        sku: data.sku || '',
        brand: data.brand || '',
        specifications: data.specifications || '',
        status: data.status
      });

      setExistingImages(data.images || []);
      setImageUrls(data.images || []);
      if (data.shipping_cost_override !== null && data.shipping_cost_override !== undefined) {
        setCustomShipping(true);
        setShippingCostOverride(String(data.shipping_cost_override));
      }
      if (data.shipping_weight_kg !== null && data.shipping_weight_kg !== undefined) {
        setShippingWeightKg(String(data.shipping_weight_kg));
      }
    } catch (err: any) {
      console.error('Error loading product:', err);
      setError(err.message);
    } finally {
      setLoadingProduct(false);
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

      // Prepara i dati aggiornati
      const updatedData = {
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
        shipping_cost_override: customShipping && shippingCostOverride ? parseFloat(shippingCostOverride) : null,
        shipping_weight_kg: shippingWeightKg ? parseFloat(shippingWeightKg) : null,
      };

      const { error: updateError } = await supabase
        .from('products')
        .update(updatedData)
        .eq('id', id);

      if (updateError) {
        throw new Error(`Errore nell'aggiornamento: ${updateError.message}`);
      }

      setSuccess('Prodotto aggiornato con successo!');

      setTimeout(() => {
        navigate('/venditore/prodotti');
      }, 1000);

    } catch (err: any) {
      console.error('Error updating product:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Modifica Prodotto</h1>
          <p className="text-gray-600 mt-1">Aggiorna i dettagli del prodotto</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Info Card */}
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
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Codice SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
                />
              </div>
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

        {/* Images Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Immagini Prodotto</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Puoi aggiungere o rimuovere immagini. Le modifiche sono immediate.
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
              existingUrls={imageUrls}
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

        {/* Status */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Stato Pubblicazione</h2>

          <div className="flex gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="published"
                checked={formData.status === 'published'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Pubblicato</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="draft"
                checked={formData.status === 'draft'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Bozza</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="status"
                value="out_of_stock"
                checked={formData.status === 'out_of_stock'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-4 h-4"
              />
              <span className="text-gray-700">Esaurito</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Link
            to="/venditore/prodotti"
            className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Annulla
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary transition-colors font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Salvataggio...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Salva Modifiche
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
