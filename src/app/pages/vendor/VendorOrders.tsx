import { useState, useEffect } from 'react';
import { Package, Truck, CheckCircle, Loader2, ChevronDown, ChevronUp, MapPin, Hash, Calendar, Euro, AlertCircle, AlertTriangle } from 'lucide-react';
import { callEdge } from '../../../lib/edgeApi';
import { useTranslation } from 'react-i18next';
import { useToast } from '../../../contexts/ToastContext';

interface OrderItem {
  id: string; order_id: string; product_id: string; quantity: number; price: number;
  shipping_status: string; tracking_number: string | null; carrier: string | null;
  stock_shortfall: number;
  products: { name: string; images: string[] } | null;
  orders: { order_number: string; status: string; created_at: string; shipping_name: string; shipping_address: any; total_amount: number; } | null;
}

// Solo 2 stati reali: "confirmed" (automatico al pagamento) e "shipped" (manuale, con tracking)
function useStatusLabels(t: (key: string) => string): Record<string, { label: string; color: string }> {
  return {
    pending:   { label: t('orders.statusPending'),   color: 'bg-gray-100 text-gray-600' },
    confirmed: { label: t('orders.statusConfirmed'), color: 'bg-accent text-oralzon-steel-ink' },
    shipped:   { label: t('orders.statusShipped'),   color: 'bg-accent text-oralzon-steel-ink' },
    delivered: { label: t('vendor.statusDelivered'), color: 'bg-green-100 text-green-800' },
  };
}

// Marketplace globale: lista corrieri internazionali oltre a quelli italiani.
// Sono nomi propri di aziende, non si traducono in nessuna lingua.
// OTHER_CARRIER è un valore sentinella fisso (mai mostrato all'utente,
// mai tradotto) usato solo per il confronto nel codice — separato
// dall'etichetta "Altro"/"Other"/ecc. mostrata nel menu, così tradurre
// l'etichetta non rompe la logica del campo di testo libero.
const OTHER_CARRIER = '__other__';
const CARRIERS = [
  // Italia
  'BRT Bartolini', 'GLS', 'SDA', 'Poste Italiane', 'Poste Italiane SDA International',
  // Internazionali / corrieri espresso globali
  'DHL Express', 'UPS', 'FedEx', 'TNT / Nexive',
  // Europa
  'DPD', 'Hermes', 'Chronopost', 'InPost', 'Correos Express', 'PostNL',
  // USA
  'USPS',
];

export function VendorOrders() {
  const { t } = useTranslation();
  const toast = useToast();
  const statusLabels = useStatusLabels(t);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [trackingInputs, setTrackingInputs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [notifySuccess, setNotifySuccess] = useState<string | null>(null);

  const [carrierInputs, setCarrierInputs] = useState<Record<string, string>>({});
  const [otherCarrierInputs, setOtherCarrierInputs] = useState<Record<string, string>>({});

  useEffect(() => { loadOrders(); }, []);

  const loadOrders = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const result = await callEdge('/vendor/orders', { method: 'GET' });
      if (!result.success) throw new Error(result.error || t('vendor.loadOrdersError'));
      setItems(result.items || []);
    } catch (err: any) {
      console.error('Errore caricamento ordini:', err.message);
      setLoadError(err.message || t('vendor.connectionError'));
    } finally {
      setLoading(false);
    }
  };

  const markAsShipped = async (itemId: string) => {
    const tracking = trackingInputs[itemId];
    const selected = carrierInputs[itemId];
    const carrier = selected === OTHER_CARRIER ? (otherCarrierInputs[itemId] || '').trim() : selected;
    if (!tracking?.trim()) { toast.error(t('vendor.enterTrackingNumber')); return; }
    if (!selected) { toast.error(t('vendor.selectCarrierAlert')); return; }
    if (selected === OTHER_CARRIER && !carrier) { toast.error(t('vendor.enterCarrierName')); return; }

    setSaving(itemId);
    try {
      const result = await callEdge('/vendor/update-shipping', {
        body: { itemId, status: 'shipped', trackingNumber: tracking.trim(), carrier },
      });
      if (!result.success) throw new Error(result.error || t('vendor.updateFailed'));

      setItems(prev => prev.map(i => i.id === itemId
        ? { ...i, shipping_status: 'shipped', tracking_number: tracking.trim(), carrier } : i));

      setNotifySuccess(itemId);
      setTimeout(() => setNotifySuccess(null), 3000);
    } catch (err: any) {
      toast.error(t('vendor.genericErrorPrefix', { message: err.message }));
    } finally {
      setSaving(null);
    }
  };

  const filtered = items.filter(i => filter === 'all' || i.shipping_status === filter);
  const counts = {
    all: items.length,
    confirmed: items.filter(i => i.shipping_status === 'confirmed' || i.shipping_status === 'pending').length,
    shipped: items.filter(i => i.shipping_status === 'shipped').length,
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{t('vendor.ordersReceived')}</h1>
        <p className="text-gray-600 mt-1">{t('vendor.manageShipments')}</p>
      </div>

      {loadError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">{t('vendor.cannotLoadOrders')}</p>
            <p className="text-xs text-red-600 mt-0.5">{loadError}</p>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all',       label: `${t('vendor.all')} (${counts.all})` },
          { key: 'confirmed', label: t('vendor.toShipCount', { count: counts.confirmed }) },
          { key: 'shipped',   label: t('vendor.shippedCount', { count: counts.shipped }) },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Package className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-medium mb-1">{t('vendor.noOrders')}</p>
          <p className="text-gray-400 text-sm">{t('vendor.noOrdersDesc')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const st = statusLabels[item.shipping_status] || statusLabels.pending;
            const isExpanded = expandedItem === item.id;
            const order = item.orders;
            const addr = order?.shipping_address;
            const date = order?.created_at
              ? new Date(order.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              : '—';

            return (
              <div key={item.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 sm:py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {item.products?.images?.[0]
                        ? <img src={item.products.images[0]} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-gray-300" /></div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.products?.name || item.product_name || t('orders.productFallback')}</p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {t('orders.orderNumber')} <span className="font-mono font-semibold text-gray-700">{order?.order_number || '—'}</span>
                        {' · '}{date}{' · '}{t('cart.quantity')}: <strong>{item.quantity}</strong>
                      </p>
                      {/* Vendita in eccesso: il pagamento e' andato a buon fine
                          ma al momento della conferma non c'erano abbastanza
                          pezzi. Va detto al venditore SUBITO e in modo
                          evidente: e' l'unico che puo' rifornire o avvisare il
                          cliente, e finora il dato restava invisibile nel
                          database mentre il cliente aspettava una merce che
                          non sarebbe mai partita. */}
                      {item.stock_shortfall > 0 && (
                        <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-md bg-red-50 border border-red-200 px-2 py-1 text-xs font-medium text-red-700">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          {t('vendor.stockShortfallWarning', { count: item.stock_shortfall })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 sm:flex-shrink-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-gray-900">€{(item.price * item.quantity).toFixed(2)}</span>
                      <span className={`text-xs font-medium px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full whitespace-nowrap ${st.color}`}>{st.label}</span>
                      {notifySuccess === item.id && (
                        <span className="text-xs text-green-600 font-medium flex items-center gap-1 whitespace-nowrap">
                          <CheckCircle className="w-3 h-3" /> {t('vendor.emailSent')}
                        </span>
                      )}
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50">
                    <div className="px-5 py-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" /> {t('vendor.orderDetails')}</p>
                        <p className="font-mono font-bold text-gray-900 text-sm">{order?.order_number || '—'}</p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> {date}</p>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1"><Euro className="w-3 h-3" /> {t('common.total')}: <strong>€{Number(order?.total_amount || 0).toFixed(2)}</strong></p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Package className="w-3.5 h-3.5" /> {t('vendor.recipient')}</p>
                        <p className="font-semibold text-gray-900 text-sm">{order?.shipping_name || '—'}</p>
                        <p className="text-xs text-gray-400 mt-1 italic">{t('vendor.customerPrivacyNote')}</p>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {t('vendor.shippingAddressLabel')}</p>
                        {addr ? (
                          <><p className="text-sm font-medium text-gray-900">{addr.address || '—'}</p><p className="text-xs text-gray-500 mt-1">{addr.zipCode} {addr.city} {addr.province ? `(${addr.province})` : ''}</p></>
                        ) : <p className="text-sm text-gray-400 italic">{t('vendor.notAvailable')}</p>}
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-gray-200">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5"><Truck className="w-3.5 h-3.5" /> {t('vendor.productDetail')}</p>
                        <p className="font-semibold text-gray-900 text-sm truncate">{item.products?.name || item.product_name || '—'}</p>
                        <p className="text-xs text-gray-500 mt-1">{t('cart.quantity')}: <strong>{item.quantity}</strong> · €{Number(item.price).toFixed(2)}</p>
                        <p className="text-xs font-semibold text-primary mt-1">{t('common.total')}: €{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="px-5 pb-5">
                      <div className="bg-white rounded-xl border border-gray-200 p-4">
                        {item.shipping_status === 'shipped' ? (
                          <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl p-4">
                            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-semibold text-green-800">{t('vendor.orderShipped')}</p>
                              <p className="text-xs text-green-700 mt-0.5">
                                {item.carrier && <>{t('orders.carrier')}: <strong>{item.carrier}</strong> · </>}
                                {t('orders.tracking')}: <span className="font-mono">{item.tracking_number}</span>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-accent border border-oralzon-mint-fresh/30 rounded-xl p-4">
                            <label className="block text-xs font-semibold text-gray-600 mb-2">
                              {t('vendor.markAsShipped')}
                            </label>
                            <div className="grid sm:grid-cols-2 gap-2 mb-2">
                              <select
                                value={carrierInputs[item.id] || ''}
                                onChange={e => setCarrierInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-primary">
                                <option value="">{t('vendor.selectCarrierPlaceholder')}</option>
                                {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                                <option value={OTHER_CARRIER}>{t('vendor.otherCarrier')}</option>
                              </select>
                              <input
                                type="text"
                                placeholder={t('vendor.trackingNumberFieldPlaceholder')}
                                value={trackingInputs[item.id] ?? ''}
                                onChange={e => setTrackingInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                                className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-primary bg-white"
                              />
                            </div>
                            {carrierInputs[item.id] === OTHER_CARRIER && (
                              <input
                                type="text"
                                placeholder={t('vendor.otherCarrierPlaceholder')}
                                value={otherCarrierInputs[item.id] ?? ''}
                                onChange={e => setOtherCarrierInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary bg-white mb-2"
                              />
                            )}
                            <button
                              onClick={() => markAsShipped(item.id)}
                              disabled={saving === item.id}
                              className="w-full px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-1.5">
                              {saving === item.id
                                ? <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                : <Truck className="w-4 h-4" />}
                              {t('vendor.confirmShipment')}
                            </button>
                            <p className="text-xs text-primary mt-2">
                              {t('vendor.autoEmailNote')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
