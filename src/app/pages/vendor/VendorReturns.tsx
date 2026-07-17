import { useState, useEffect } from 'react';
import { Package, Loader2, ChevronDown, ChevronUp, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { callEdge } from '../../../lib/edgeApi';

const REASON_LABELS: Record<string, string> = {
  wrong_item: 'Prodotto sbagliato inviato',
  defective: 'Prodotto difettoso',
  damaged_shipping: 'Danno durante trasporto',
  not_as_described: 'Non conforme a scheda tecnica',
};

export function VendorReturns() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState('pending');
  const [actionModal, setActionModal] = useState<any | null>(null);
  const [decision, setDecision] = useState({ accepted: true, vendor_notes: '', refund_amount: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadReturns(); }, []);

  const loadReturns = async () => {
    setLoading(true);
    const result = await callEdge('/vendor/returns', { method: 'GET' });
    if (result.success) setReturns(result.returns || []);
    setLoading(false);
  };

  const handleDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    setSaving(true); setMsg('');
    try {
      const newStatus = decision.accepted ? 'approved' : 'rejected';
      const maxAmount = (actionModal.order_items?.price || 0) * (actionModal.quantity || actionModal.order_items?.quantity || 1);
      let finalRefund = 0;
      if (decision.accepted) {
        finalRefund = parseFloat(decision.refund_amount);
        if (isNaN(finalRefund) || finalRefund < 0) {
          setMsg('Inserisci un importo di rimborso valido.');
          setSaving(false);
          return;
        }
        if (finalRefund > maxAmount) {
          setMsg(`L'importo non può superare €${maxAmount.toFixed(2)} (il totale pagato per questo reso).`);
          setSaving(false);
          return;
        }
      }

      const result = await callEdge('/returns/decision', {
        body: {
          returnId: actionModal.id,
          status: newStatus,
          vendorNotes: decision.vendor_notes,
          refundAmount: finalRefund,
        },
      });
      if (!result.success) throw new Error(result.error || 'Aggiornamento fallito');

      setMsg(decision.accepted ? 'Reso approvato. Il cliente riceverà le istruzioni.' : 'Reso rifiutato. Il cliente verrà notificato.');
      setTimeout(() => { setActionModal(null); setMsg(''); loadReturns(); }, 2000);
    } catch (e: any) { setMsg('Errore: ' + e.message); }
    finally { setSaving(false); }
  };

  const markRefunded = async (returnId: string) => {
    if (!confirm('Confermi di aver ricevuto il prodotto reso? Verrà avviato il rimborso automatico al cliente tramite Stripe.')) return;
    setSaving(true);
    try {
      const result = await callEdge('/returns/decision', { body: { returnId, status: 'refunded' } });
      if (!result.success) throw new Error(result.error || 'Rimborso non riuscito');
      loadReturns();
    } catch (e: any) {
      alert('Errore rimborso: ' + e.message);
    } finally { setSaving(false); }
  };

  const filtered = filter === 'all' ? returns : returns.filter(r => r.status === filter);
  const counts = {
    pending: returns.filter(r => r.status === 'pending').length,
    approved: returns.filter(r => r.status === 'approved').length,
    all: returns.length,
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Resi</h1>
          <p className="text-gray-500 text-sm mt-1">Esamina e gestisci le richieste di reso dei clienti</p>
        </div>
        <button onClick={loadReturns} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {/* Filtri */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'pending', label: `Da gestire (${counts.pending})` },
          { key: 'approved', label: `Approvati (${counts.approved})` },
          { key: 'all', label: `Tutti (${counts.all})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f.key ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <CheckCircle className="w-12 h-12 text-green-200 mx-auto mb-3" />
          <p className="text-gray-500">Nessuna richiesta di reso in questa categoria</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ret => {
            const isOpen = expanded === ret.id;
            const item = ret.order_items;
            const product = item?.products;
            const order = ret.orders;
            const statusColors: Record<string, string> = {
              pending: 'bg-yellow-100 text-yellow-800',
              approved: 'bg-accent text-oralzon-steel-ink',
              rejected: 'bg-red-100 text-red-700',
              refunded: 'bg-green-100 text-green-700',
              shipped_back: 'bg-accent text-primary',
            };

            return (
              <div key={ret.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50" onClick={() => setExpanded(isOpen ? null : ret.id)}>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{product?.name || 'Prodotto'}</p>
                    <p className="text-xs text-gray-500">Ordine {order?.order_number} · {order?.shipping_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{REASON_LABELS[ret.reason] || ret.reason}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[ret.status] || 'bg-gray-100 text-gray-600'}`}>{ret.status}</span>
                    <span className="text-sm font-bold">€{Number(ret.refund_amount || item?.price * item?.quantity || 0).toFixed(2)}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-gray-100 p-5 bg-gray-50 space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Cliente</p>
                        <p className="font-medium">{order?.shipping_name}</p>
                        <p className="text-gray-500 text-xs">{order?.shipping_email}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Prodotto richiesto</p>
                        <p className="font-medium">{product?.name}</p>
                        <p className="text-gray-500 text-xs">Qtà: {item?.quantity} · Valore: €{(item?.price * item?.quantity).toFixed(2)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Descrizione problema</p>
                      <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">{ret.description}</p>
                    </div>

                    {ret.vendor_notes && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">La tua risposta</p>
                        <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-200">{ret.vendor_notes}</p>
                      </div>
                    )}

                    <div className="flex gap-3 flex-wrap">
                      {ret.status === 'pending' && (
                        <button onClick={() => {
                          const fullAmount = (ret.order_items?.price || 0) * (ret.quantity || ret.order_items?.quantity || 1);
                          setActionModal(ret);
                          setDecision({ accepted: true, vendor_notes: '', refund_amount: fullAmount.toFixed(2) });
                        }}
                          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
                          Gestisci Richiesta
                        </button>
                      )}
                      {ret.status === 'approved' && (
                        <button onClick={() => markRefunded(ret.id)} disabled={saving}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50">
                          {saving ? 'Rimborso in corso...' : 'Confermo Ricezione → Rimborsa'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal decisione reso */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Gestisci Richiesta di Reso</h3>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Prodotto:</strong> {actionModal.order_items?.products?.name}
              {(actionModal.quantity || 1) > 1 || (actionModal.order_items?.quantity || 1) > 1 ? (
                <> · <strong>Quantità resa:</strong> {actionModal.quantity || 1} di {actionModal.order_items?.quantity || 1}</>
              ) : null}
              <br /><strong>Motivo:</strong> {REASON_LABELS[actionModal.reason]}
            </p>

            {msg && <p className="text-sm mb-4">{msg}</p>}

            <form onSubmit={handleDecision} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Decisione</label>
                <div className="flex gap-3">
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer flex-1 ${decision.accepted ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <input type="radio" checked={decision.accepted} onChange={() => setDecision({...decision, accepted: true})} />
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Approva</span>
                  </label>
                  <label className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border cursor-pointer flex-1 ${!decision.accepted ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}>
                    <input type="radio" checked={!decision.accepted} onChange={() => setDecision({...decision, accepted: false})} />
                    <XCircle className="w-4 h-4 text-red-500" />
                    <span className="text-sm font-medium">Rifiuta</span>
                  </label>
                </div>
              </div>

              {decision.accepted && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Importo da rimborsare (€) — massimo €{((actionModal.order_items?.price || 0) * (actionModal.quantity || actionModal.order_items?.quantity || 1)).toFixed(2)}
                  </label>
                  <input type="number" min={0} step="0.01" max={(actionModal.order_items?.price || 0) * (actionModal.quantity || actionModal.order_items?.quantity || 1)}
                    value={decision.refund_amount}
                    onChange={e => setDecision({...decision, refund_amount: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                  <p className="text-xs text-gray-400 mt-1">Precompilato con l'importo pieno per la quantità resa. Riducilo se vuoi trattenere una quota (es. per un piccolo danno alla confezione).</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Note per il cliente *</label>
                <textarea required rows={3} value={decision.vendor_notes}
                  onChange={e => setDecision({...decision, vendor_notes: e.target.value})}
                  placeholder={decision.accepted ? 'Es. Accettiamo il reso. Spedire a: Via Roma 1, 00100 Roma.' : 'Es. Il reso non è accettabile perché il prodotto risulta aperto.'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setActionModal(null)} className="flex-1 py-2.5 border border-gray-300 rounded-xl text-sm">Annulla</button>
                <button type="submit" disabled={saving}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${decision.accepted ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}>
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {decision.accepted ? 'Approva Reso' : 'Rifiuta Reso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
