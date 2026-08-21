import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, ChevronDown, ChevronUp, Truck, CheckCircle, Clock, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { GShipping } from '../../lib/googleIcons';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { callEdge } from '../../lib/edgeApi';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { InvoiceButton } from '../components/InvoiceGenerator';
import { ProductReviewForm } from '../components/ProductReviewForm';
import { BottomSheet } from '../components/BottomSheet';
import { useToast } from '../../contexts/ToastContext';
import { DATE_LOCALE } from '../../lib/dateLocale';
import { formatMoney } from '../../lib/money';

// Mappa condivisa: vedi src/lib/dateLocale.ts

function getStatusMap(t: (k: string) => string): Record<string, { label: string; color: string; icon: any }> {
  return {
    pending:    { label: t('orders.statusPending'), color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    processing: { label: t('orders.statusConfirmed'),  color: 'bg-accent text-oralzon-steel-ink',    icon: Package },
    shipped:    { label: t('orders.statusShipped'),     color: 'bg-accent text-oralzon-steel-ink', icon: Truck },
    // Senza queste due voci la pagina mostrerebbe un riquadro vuoto al
    // posto dello stato: deriveOrderStatus può restituirle, e una mappa
    // incompleta è il modo in cui un difetto di stato diventa invisibile.
    partially_shipped: { label: t('orders.statusPartiallyShipped'), color: 'bg-accent text-oralzon-steel-ink', icon: Truck },
    delivered:  { label: t('orders.statusDelivered'),   color: 'bg-green-100 text-green-800',   icon: CheckCircle },
    cancelled:  { label: t('orders.statusCancelled'),   color: 'bg-red-100 text-red-800',       icon: AlertCircle },
  };
}

// Deriva lo stato "reale" dell'ordine dallo shipping_status aggregato dei suoi item,
// non solo dallo stato di pagamento (che resta 'processing' per sempre dopo il pagamento)
function deriveOrderStatus(order: any): string {
  if (order.status === 'cancelled') return 'cancelled';
  if (order.status === 'pending') return 'pending';

  const items = order.order_items || [];
  if (items.length === 0) return 'processing';

  // BUG TROVATO NELL'AUDIT DEI FLUSSI: mancava il caso 'delivered'.
  // Un ordine interamente consegnato ricadeva nel ritorno finale e veniva
  // mostrato al cliente come "in lavorazione" — per sempre, perché
  // orders.status resta 'processing' dopo il pagamento e nessuno lo fa
  // avanzare. L'unico ordine reale della piattaforma era in questo stato.
  //
  // Il cliente non ha modo di distinguere un ordine consegnato da uno mai
  // partito, e chiede assistenza per merce che ha già ricevuto.
  const consegnati = items.filter((i: any) => i.shipping_status === 'delivered').length;
  const spediti = items.filter((i: any) => i.shipping_status === 'shipped').length;

  if (consegnati === items.length) return 'delivered';
  if (consegnati + spediti === items.length) return 'shipped';

  // ORDINE MULTI-VENDITORE PARZIALE. Con più venditori è normale che uno
  // spedisca prima dell'altro. Dire "spedito" sarebbe falso per la parte
  // ancora ferma, e "in lavorazione" nasconderebbe che qualcosa è già
  // partito: serve uno stato proprio, altrimenti il cliente aspetta un
  // pacco solo quando ne sta arrivando uno e l'altro no.
  if (consegnati + spediti > 0) return 'partially_shipped';

  return 'processing';
}

export function CustomerOrders() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const STATUS_MAP = getStatusMap(t);
  const { user, profile } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [returnModal, setReturnModal] = useState<{ orderId: string; itemId: string; productName: string; unitPrice: number; maxQuantity: number; vendorId: string } | null>(null);
  const [returnForm, setReturnForm] = useState({ reason: '', description: '', quantity: 1 });
  const [returnLoading, setReturnLoading] = useState(false);
  const [returnMsg, setReturnMsg] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const handleConfirmDelivery = async (itemId: string) => {
    setConfirmingId(itemId);
    try {
      const result = await callEdge('/customer/confirm-delivery', { body: { orderItemId: itemId } });
      if (result.success) {
        setOrders(prev => prev.map(o => ({
          ...o,
          order_items: (o.order_items || []).map((i: any) => i.id === itemId ? { ...i, shipping_status: 'delivered' } : i),
        })));
      } else {
        toast.error(result.error || t('orders.confirmDeliveryFailed'));
      }
    } finally {
      setConfirmingId(null);
    }
  };

  useEffect(() => { if (user) loadOrders(); }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    // Usa edge function con service role per bypassare RLS
    const result = await callEdge('/customer/orders', { method: 'GET' });

    if (result.success) {
      setOrders(result.orders || []);
    } else {
      // Fallback alla query diretta
      const { data } = await supabase.from('orders')
        .select('*, order_items(*, products(name, images), returns(id, status), vendors(id, business_name, vat_id, fiscal_country, vies_validated, address_street, address_city, address_region, address_postal_code))')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false });
      setOrders(data || []);
    }
    setLoading(false);
  };

  const submitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModal) return;
    setReturnLoading(true); setReturnMsg('');
    try {
      const result = await callEdge('/returns/request', {
        body: {
          orderId: returnModal.orderId,
          orderItemId: returnModal.itemId,
          vendorId: returnModal.vendorId,
          reason: returnForm.reason,
          description: returnForm.description,
          quantity: returnForm.quantity,
        },
      });
      if (!result.success) throw new Error(result.error || t('orders.requestFailed'));
      setReturnMsg(t('orders.returnRequestSent'));
      setReturnForm({ reason: '', description: '', quantity: 1 });
      setTimeout(() => { setReturnModal(null); setReturnMsg(''); loadOrders(); }, 2500);
    } catch (e: any) { setReturnMsg('Errore: ' + e.message); }
    finally { setReturnLoading(false); }
  };

  // Riordino di UN SOLO articolo — prima il bottone per-articolo chiamava per
  // errore handleReorder(order), che aggiungeva TUTTI gli articoli
  // dell'ordine al carrello, non solo quello su cui si era cliccato.
  const handleReorderItem = (item: any) => {
    const product = item.products;
    if (!product) { toast.error(t('orders.itemNoLongerAvailable')); return; }
    addItem({
      productId: item.product_id,
      vendorId: item.vendor_id,
      name: product.name,
      price: item.price,
      quantity: item.quantity,
      image: product.images?.[0] || '',
    });
    toast.success(t('orders.itemAddedToCart'));
  };

  const handleReorder = (order: any) => {
    const items = order.order_items || [];
    // Un prodotto eliminato dal venditore da quando è stato fatto l'ordine
    // (storico preservato apposta, vedi audit precedente) non deve bloccare
    // il riordino degli altri articoli — semplicemente si salta, e lo si
    // dice chiaramente invece di mostrare un conteggio che include anche
    // quello che in realtà non è stato aggiunto.
    let added = 0;
    items.forEach((item: any) => {
      const product = item.products;
      if (product) {
        addItem({
          productId: item.product_id,
          vendorId: item.vendor_id,
          name: product.name,
          price: item.price,
          quantity: item.quantity,
          image: product.images?.[0] || '',
        });
        added++;
      }
    });
    if (added === 0) { toast.error(t('orders.itemNoLongerAvailable')); return; }
    if (added < items.length) { toast.warning(t('orders.partialReorderAlert', { added, total: items.length })); return; }
    toast.success(t('orders.addedToCartAlert', { count: added }));
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!orders.length) return (
    <div className="text-center py-16">
      <Package className="w-14 h-14 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-gray-900 mb-2">{t('orders.noOrdersYet')}</h3>
      <p className="text-gray-500 mb-6">{t('orders.ordersWillAppearHere')}</p>
      <Link to="/negozio" className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90">{t('cart.goToShop')}</Link>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('orders.myOrdersTitle')}</h1>
        <button onClick={loadOrders} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {orders.map(order => {
        const st = STATUS_MAP[deriveOrderStatus(order)] || STATUS_MAP.pending;
        const Icon = st.icon;
        const isOpen = expanded === order.id;
        const date = new Date(order.created_at).toLocaleDateString(DATE_LOCALE[i18n.language] || 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

        return (
          <div key={order.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 sm:px-5 py-3.5 sm:py-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(isOpen ? null : order.id)}>
              <div className="min-w-0">
                <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{t('orders.orderNumber')} {order.order_number}</p>
                <p className="text-xs sm:text-sm text-gray-500">{date}</p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <span className="font-bold text-primary text-sm sm:text-base">{formatMoney(Number(order.total_amount), i18n.language)}</span>
                <span className={`text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium whitespace-nowrap ${st.color}`}><Icon className="w-3 h-3 inline mr-1" />{st.label}</span>
                <button onClick={(e) => { e.stopPropagation(); handleReorder(order); }}
                  className="flex items-center gap-1 text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 border border-primary/30 text-primary rounded-full font-medium hover:bg-accent transition-colors whitespace-nowrap">
                  <RefreshCw className="w-3 h-3" /> {t('orders.reorderWholeOrder')}
                </button>
                {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
              </div>
            </div>

            {isOpen && (
              <div className="border-t border-gray-100 p-3 sm:p-5 space-y-3 sm:space-y-4">
                {(order.order_items || []).map((item: any) => {
                  const product = item.products;
                  const hasReturn = item.returns?.length > 0;
                  const returnStatus = item.returns?.[0]?.status;
                  const canReturn = (item.shipping_status === 'shipped' || item.shipping_status === 'delivered') && !hasReturn;

                  return (
                    <div key={item.id} className="flex flex-col gap-3 p-3 bg-gray-50 rounded-xl">
                      {/* Riga prodotto: immagine + info */}
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {product?.images?.[0] ? <img src={product.images[0]} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" /> :
                            <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-gray-400" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{product?.name || item.product_name || t('orders.productFallback')}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{t('common.quantity')}: {item.quantity} · {formatMoney((item.price * item.quantity), i18n.language)}</p>
                          {item.tracking_number && (
                            <p className="text-xs text-primary mt-1 truncate flex items-center gap-1">
                              <GShipping className="w-3.5 h-3.5 flex-shrink-0" />
                              {item.carrier && <>{t('orders.carrier')}: <strong>{item.carrier}</strong> · </>}
                              {t('orders.tracking')}: <span className="font-mono">{item.tracking_number}</span>
                            </p>
                          )}
                          {hasReturn && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                              returnStatus === 'refunded' ? 'bg-green-100 text-green-700' :
                              returnStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-amber-100 text-amber-700'
                            }`}>
                              {t('orders.returnLabel')}: {returnStatus === 'pending' ? t('orders.returnStatusPending') :
                                returnStatus === 'approved' ? t('orders.returnStatusApproved') :
                                returnStatus === 'rejected' ? t('orders.returnStatusRejected') :
                                returnStatus === 'refunded' ? t('orders.returnStatusRefunded') : returnStatus}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Azioni: grid su mobile, riga su desktop */}
                      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 sm:gap-2">
                        {item.shipping_status === 'shipped' && (
                          <button onClick={() => handleConfirmDelivery(item.id)} disabled={confirmingId === item.id}
                            className="flex items-center justify-center gap-1.5 px-2.5 py-2 sm:py-1.5 bg-secondary hover:bg-primary text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-60">
                            {confirmingId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                            {t('orders.confirmReceipt')}
                          </button>
                        )}
                        {item.shipping_status === 'delivered' && (
                          <span className="flex items-center justify-center gap-1.5 px-2.5 py-2 sm:py-1.5 text-xs font-medium text-green-700">
                            <CheckCircle className="w-3.5 h-3.5" /> {t('orders.receiptConfirmed')}
                          </span>
                        )}
                        {canReturn && (
                          <button onClick={() => {
                            setReturnModal({ orderId: order.id, itemId: item.id, productName: product?.name || item.product_name || t('orders.productFallback'), unitPrice: item.price, maxQuantity: item.quantity, vendorId: item.vendor_id });
                          }} className="text-xs px-2.5 py-2 sm:py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-center">
                            {t('orders.requestReturn')}
                          </button>
                        )}
                        {product ? (
                          <button onClick={() => handleReorderItem(item)}
                            className="flex items-center justify-center gap-1.5 px-2.5 py-2 sm:py-1.5 bg-secondary hover:bg-primary text-white rounded-lg text-xs font-medium transition-colors">
                            <RefreshCw className="w-3.5 h-3.5" /> {t('orders.reorder')}
                          </button>
                        ) : (
                          <span className="flex items-center justify-center gap-1.5 px-2.5 py-2 sm:py-1.5 text-xs font-medium text-gray-400">
                            {t('orders.itemNoLongerAvailable')}
                          </span>
                        )}
                        <InvoiceButton
                          order={order}
                          items={(order.order_items || []).filter((oi: any) => oi.vendor_id === item.vendor_id)}
                          vendor={item.vendors}
                          buyerProfile={profile}
                        />
                      </div>

                      {/* Recensione prodotto — solo per ordini spediti/consegnati */}
                      {(item.shipping_status === 'shipped' || item.shipping_status === 'delivered') && item.product_id && (
                        <ProductReviewForm productId={item.product_id} productName={product?.name || t('orders.productFallback')} />
                      )}
                    </div>
                  );
                })}

                <div className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                  <p>{t('orders.shippingAddressLabel')}: {order.shipping_address?.address}, {order.shipping_address?.city} ({order.shipping_address?.province})</p>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Modal richiesta reso */}
      {returnModal && (
      <BottomSheet open={true} onClose={() => { setReturnModal(null); setReturnForm({reason:'',description:'',quantity:1}); }}>
          <div className="p-6 pt-2">
            <h3 className="text-lg font-bold mb-1">{t('orders.requestReturn')}</h3>
            <p className="text-sm text-gray-500 mb-4">{returnModal.productName}</p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 text-xs text-amber-800">
              {t('orders.returnPolicyNote')}
            </div>

            <form onSubmit={submitReturn} className="space-y-4">
              {returnMsg && <p className="text-sm font-medium">{returnMsg}</p>}

              {returnModal.maxQuantity > 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('orders.quantityToReturn')} *</label>
                  <select value={returnForm.quantity} onChange={e => setReturnForm({...returnForm, quantity: parseInt(e.target.value)})}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                    {Array.from({ length: returnModal.maxQuantity }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} {t('common.quantity').toLowerCase()} {t('orders.ofTotal')} {returnModal.maxQuantity}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {t('orders.refundPreview')}: {formatMoney((returnModal.unitPrice * returnForm.quantity), i18n.language)}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('orders.reasonLabel')} *</label>
                <select required value={returnForm.reason} onChange={e => setReturnForm({...returnForm, reason: e.target.value})}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm">
                  <option value="">{t('orders.selectReason')}</option>
                  <option value="wrong_item">{t('orders.reasonWrongItem')}</option>
                  <option value="defective">{t('orders.reasonDefective')}</option>
                  <option value="damaged_shipping">{t('orders.reasonDamaged')}</option>
                  <option value="not_as_described">{t('orders.reasonNotAsDescribed')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('orders.problemDescription')} *</label>
                <textarea required rows={4} value={returnForm.description}
                  onChange={e => setReturnForm({...returnForm, description: e.target.value})}
                  placeholder={t('orders.problemPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => { setReturnModal(null); setReturnForm({reason:'',description:'',quantity:1}); }}
                  className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm">{t('common.cancel')}</button>
                <button type="submit" disabled={returnLoading}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-2">
                  {returnLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t('orders.sendRequest')}
                </button>
              </div>
            </form>
          </div>
      </BottomSheet>
      )}
    </div>
  );
}