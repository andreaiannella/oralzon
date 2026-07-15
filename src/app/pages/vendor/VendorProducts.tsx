import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Search, Edit, Trash2, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { getCurrentVendor, ensureVendorExists } from '../../../lib/vendor';

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
  images: string[];
  is_sponsored: boolean;
  created_at: string;
  updated_at: string;
}

export function VendorProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProducts();
  }, [user]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError('');

      // Prima assicurati che il vendor esista
      let vendor = await ensureVendorExists();

      if (!vendor) {
        vendor = await getCurrentVendor();
      }

      if (!vendor) {
        setError('Non sei autorizzato come venditore');
        setLoading(false);
        return;
      }

      // Carica prodotti del venditore
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching products:', fetchError);
        throw new Error(`Errore nel caricamento prodotti: ${fetchError.message}`);
      }

      // Aggiorna status automaticamente se stock = 0
      const productsWithStatus = (data || []).map(product => ({
        ...product,
        status: product.stock === 0 ? 'out_of_stock' as const : product.status
      }));

      setProducts(productsWithStatus);
    } catch (err: any) {
      console.error('Error loading products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusLabel = (status: string) => {
    const labels = {
      published: { text: 'Pubblicato', class: 'bg-green-100 text-green-800' },
      draft: { text: 'Bozza', class: 'bg-gray-100 text-gray-800' },
      out_of_stock: { text: 'Esaurito', class: 'bg-red-100 text-red-800' }
    };
    return labels[status as keyof typeof labels] || labels.draft;
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Sei sicuro di voler eliminare "${productName}"?`)) {
      return;
    }

    try {
      setError('');
      const { error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (deleteError) {
        throw new Error(`Errore nell'eliminazione: ${deleteError.message}`);
      }

      setSuccess(`Prodotto "${productName}" eliminato con successo`);
      loadProducts(); // Ricarica lista

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prodotti</h1>
          <p className="text-gray-600 mt-1">Gestisci il tuo catalogo prodotti</p>
        </div>
        <Link
          to="/venditore/prodotti/nuovo"
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary transition-colors flex items-center gap-2 font-semibold"
        >
          <Plus className="w-5 h-5" />
          Aggiungi Prodotto
        </Link>
      </div>

      {/* Error/Success Messages */}
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cerca prodotti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
            />
          </div>

          {/* Status Filter */}
          <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <span>Filtri</span>
          </button>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 mt-4">
          {['all', 'published', 'draft', 'out_of_stock'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === status
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? 'Tutti' :
               status === 'published' ? 'Pubblicati' :
               status === 'draft' ? 'Bozze' : 'Esauriti'}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Prodotto</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Categoria</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Prezzo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Stato</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Azioni</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Caricamento...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Package className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-600">Nessun prodotto trovato</p>
                      <Link
                        to="/venditore/prodotti/nuovo"
                        className="text-primary hover:text-primary font-medium"
                      >
                        Aggiungi il primo prodotto
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const statusInfo = getStatusLabel(product.status);
                  return (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{product.name}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{product.category}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">€{product.price.toFixed(2)}</td>
                      <td className="px-6 py-4 text-gray-600">{product.stock}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${statusInfo.class}`}>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Link
                            to={`/venditore/prodotti/${product.id}/modifica`}
                            className="text-primary hover:text-primary font-medium"
                          >
                            Modifica
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="text-red-600 hover:text-red-700"
                            title="Elimina prodotto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import { Package } from 'lucide-react';
