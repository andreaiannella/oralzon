import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Filter, Search, Edit, Trash2, X, Loader2 } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { getCurrentVendor, ensureVendorExists } from '../../../lib/vendor';
import { localizeCategoryName } from '../../../lib/categoryTranslations';
import { localizeProduct } from '../../../lib/productTranslations';
import { BottomSheet } from '../../components/BottomSheet';
import { useToast } from '../../../contexts/ToastContext';

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: 'published' | 'draft' | 'out_of_stock';
  translations?: Record<string, { name?: string; description?: string; specifications?: string }> | null;
}

export function VendorProducts() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const toast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; hasOrders: boolean } | null>(null);
  const [checkingOrders, setCheckingOrders] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, [user]);

  const loadProducts = async () => {
    try {
      setLoading(true);

      // Prima assicurati che il vendor esista
      let vendor = await ensureVendorExists();

      if (!vendor) {
        vendor = await getCurrentVendor();
      }

      if (!vendor) {
        toast.error(t('vendor.notAuthorized'));
        setLoading(false);
        return;
      }

      // Carica prodotti del venditore — solo i campi mostrati in tabella:
      // niente 'translations' (JSONB con 8 lingue), 'description', 'specifications'
      // o 'images', che appesantiscono il payload senza essere usati in questa vista
      // e diventano il vero collo di bottiglia quando il catalogo cresce a migliaia di articoli.
      const { data, error: fetchError } = await supabase
        .from('products')
        .select('id, name, category, price, stock, status, translations')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching products:', fetchError);
        throw new Error(t('vendor.loadProductsError', { message: fetchError.message }));
      }

      // Aggiorna status automaticamente se stock = 0
      const productsWithStatus = (data || []).map(product => ({
        ...product,
        status: product.stock === 0 ? 'out_of_stock' as const : product.status
      }));

      setProducts(productsWithStatus);
    } catch (err: any) {
      console.error('Error loading products:', err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products
    .map(product => localizeProduct(product, i18n.language))
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || product.status === filterStatus;
      return matchesSearch && matchesStatus;
    });

  const getStatusLabel = (status: string) => {
    const labels = {
      published: { text: t('vendor.statusPublished'), class: 'bg-green-100 text-green-800' },
      draft: { text: t('vendor.statusDraft'), class: 'bg-gray-100 text-gray-800' },
      out_of_stock: { text: t('product.outOfStock'), class: 'bg-red-100 text-red-800' }
    };
    return labels[status as keyof typeof labels] || labels.draft;
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    setCheckingOrders(true);
    // Query di sola lettura, veloce (head:true = conta senza scaricare le
    // righe) — determina quale delle due conferme mostrare, prima di
    // aprire il pannello. Un prodotto mai venduto non ha bisogno della
    // stessa cautela di uno con storico vendite reale.
    const { count } = await supabase
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId);
    setCheckingOrders(false);
    setConfirmText('');
    setDeleteTarget({ id: productId, name: productName, hasOrders: (count || 0) > 0 });
  };

  const confirmDeleteProduct = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
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
        // Con la migrazione a ON DELETE SET NULL (order_items.product_id),
        // questo ramo non dovrebbe più scattare in condizioni normali — un
        // prodotto con ordini associati ora si scollega invece di bloccare
        // l'eliminazione, lo storico resta leggibile grazie a product_name
        // "fotografato" su ogni riga ordine. Lo teniamo comunque come rete
        // di sicurezza, nel caso emerga un altro vincolo non previsto qui.
        if (deleteError.code === '23503' || deleteError.message.includes('foreign key constraint')) {
          throw new Error(t('vendor.deleteBlockedByOrders'));
        }
        throw new Error(t('vendor.deleteError', { message: deleteError.message }));
      }
      if (!deletedRows || deletedRows.length === 0) {
        throw new Error(t('vendor.deleteNoRowsError'));
      }

      // BUG TROVATO: il messaggio di esito (errore o successo) usava uno
      // stato locale mostrato in un banner in cima alla pagina — se si
      // elimina un prodotto in fondo a una lista lunga, il banner resta
      // fuori dallo schermo e sembra che "non succeda nulla", anche quando
      // in realtà un messaggio chiaro (incluso il motivo del blocco) era
      // stato mostrato. Il toast è sempre visibile indipendentemente dalla
      // posizione di scroll, coerente col resto del sito.
      toast.success(t('vendor.deleteSuccess', { name: deleteTarget.name }));
      setDeleteTarget(null);
      loadProducts(); // Ricarica lista
    } catch (err: any) {
      console.error('Error deleting product:', err);
      toast.error(err.message);
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
          <h1 className="text-3xl font-bold text-gray-900">{t('vendor.products')}</h1>
          <p className="text-gray-600 mt-1">{t('vendor.manageCatalog')}</p>
        </div>
        <Link
          to="/venditore/prodotti/nuovo"
          className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary transition-colors flex items-center gap-2 font-semibold"
        >
          <Plus className="w-5 h-5" />
          {t('vendor.addProduct')}
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('vendor.searchProducts')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-secondary focus:border-secondary"
            />
          </div>

          {/* Status Filter */}
          <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Filter className="w-5 h-5" />
            <span>{t('vendor.filters')}</span>
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
              {status === 'all' ? t('vendor.all') :
               status === 'published' ? t('vendor.filterPublished') :
               status === 'draft' ? t('vendor.filterDrafts') : t('vendor.filterOutOfStock')}
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
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('vendor.tableProduct')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('vendor.tableCategory')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('common.price')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('vendor.tableStock')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('vendor.tableStatus')}</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">{t('vendor.tableActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Package className="w-12 h-12 text-gray-300" />
                      <p className="text-gray-600">{t('shop.noProducts')}</p>
                      <Link
                        to="/venditore/prodotti/nuovo"
                        className="text-primary hover:text-primary font-medium"
                      >
                        {t('vendor.addFirstProduct')}
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
                      <td className="px-6 py-4 text-gray-600">{localizeCategoryName(product.category, i18n.language)}</td>
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
                            {t('common.edit')}
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            disabled={checkingOrders}
                            className="text-red-600 hover:text-red-700 disabled:opacity-40"
                            title={t('vendor.deleteProductTitle')}
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
      <BottomSheet open={true} onClose={() => !deleting && setDeleteTarget(null)} maxWidthClass="sm:max-w-sm">
          <div className="p-6 pt-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">{t('vendor.confirmDeleteTitle')}</h3>
              <button onClick={() => !deleting && setDeleteTarget(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {deleteTarget.hasOrders ? (
              // Prodotto con storico ordini reale: conferma rafforzata,
              // richiede di riscrivere il nome esatto — un click accidentale
              // qui avrebbe conseguenze più serie di un prodotto mai
              // venduto, va reso più difficile farlo per sbaglio.
              <>
                <p className="text-sm text-gray-600 mb-3">
                  {t('vendor.confirmDeleteWithOrdersWarning', { name: deleteTarget.name })}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  {t('vendor.confirmDeleteHistoryPreserved')}
                </p>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">
                  {t('vendor.confirmDeleteTypeNameLabel')}
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder={deleteTarget.name}
                  disabled={deleting}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-5 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  autoFocus
                />
              </>
            ) : (
              <p className="text-sm text-gray-600 mb-5">
                {t('vendor.confirmDeletePrefix')} <strong>"{deleteTarget.name}"</strong>. {t('vendor.confirmDeleteSuffix')}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={confirmDeleteProduct}
                disabled={deleting || (deleteTarget.hasOrders && confirmText !== deleteTarget.name)}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {deleting ? t('vendor.deleting') : t('common.delete')}
              </button>
            </div>
          </div>
      </BottomSheet>
      )}
    </div>
  );
}

import { Package } from 'lucide-react';
