import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Search, Edit, Trash2, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { getCurrentVendor, ensureVendorExists } from '../../../lib/vendor';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'published' | 'draft' | 'out_of_stock';
}

export function VendorProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

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

      // Carica prodotti del venditore — solo i campi mostrati in tabella:
      // niente 'translations' (JSONB con 7 lingue), 'description', 'specifications'
      // o 'images', che appesantiscono il payload senza essere usati in questa vista
      // e diventano il vero collo di bottiglia quando il catalogo cresce a migliaia di articoli.
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('id, name, category, price, stock, status')
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

  const handleDeleteProduct = (productId: string, productName: string) => {
    setDeleteTarget({ id: productId, name: productName });
  };

  const confirmDeleteProduct = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      setError('');
      // BUG TROVATO: prima si controllava solo 'deleteError', ma Supabase
      // non restituisce un errore se RLS (o qualunque altro filtro) blocca
      // silenziosamente l'operazione — semplicemente non tocca nessuna
      // riga, senza avvisare. Il messaggio "eliminato con successo"
      // comparira comunque, anche a fronte di un nulla di fatto. Aggiungendo
      // .select() la risposta include le righe REALMENTE eliminate: se
      // l'array è vuoto, sappiamo con certezza che non è successo nulla.
      const { data: deletedRows, error: deleteError } = await supabase
        .from('products')
        .delete()
        .eq('id', deleteTarget.id)
        .select('id');

      if (deleteError) {
        // Un prodotto che ha già ordini reali collegati (specialmente se il
        // pagamento è già stato trasferito al venditore) non può essere
        // eliminato fisicamente — cancellarlo romperebbe lo storico ordini
        // e i report di fatturazione già emessi. È un vincolo del database
        // corretto e voluto, non un errore: va solo spiegato in modo chiaro
        // invece di mostrare il testo tecnico grezzo di Postgres.
        if (deleteError.code === '23503' || deleteError.message.includes('foreign key constraint')) {
          throw new Error('Questo prodotto ha già ordini associati e non può essere eliminato definitivamente, per non perdere lo storico degli ordini passati. Impostalo su "Bozza" o "Esaurito" dalla modifica prodotto invece di eliminarlo.');
        }
        throw new Error(`Errore nell'eliminazione: ${deleteError.message}`);
      }
      if (!deletedRows || deletedRows.length === 0) {
        throw new Error('Il prodotto non è stato eliminato: potrebbe non appartenerti più, o non esistere già. Ricarica la pagina e riprova.');
      }

      setSuccess(`Prodotto "${deleteTarget.name}" eliminato con successo`);
      setDeleteTarget(null);
      loadProducts(); // Ricarica lista

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Error deleting product:', err);
      setError(err.message);
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
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

      {/* Modal conferma eliminazione — sostituisce il dialogo del browser */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Eliminare il prodotto?</h3>
              <button onClick={() => !deleting && setDeleteTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-5">
              Stai per eliminare <strong>"{deleteTarget.name}"</strong>. L'operazione non può essere annullata.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Annulla
              </button>
              <button
                onClick={confirmDeleteProduct}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {deleting ? 'Eliminazione...' : 'Elimina'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { Package } from 'lucide-react';
