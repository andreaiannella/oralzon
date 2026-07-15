import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Package, ShoppingBag, TrendingUp,
  Sparkles, Loader2, RefreshCw, Trash2, Tag, Plus, Euro,
  CheckCircle, XCircle, Calendar, BarChart3, Ban, UserCheck
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { callEdge } from '../../lib/edgeApi';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type Section = 'overview' | 'vendors' | 'products' | 'orders' | 'promotions' | 'discounts' | 'users';

export function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState<Section>('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ vendors: 0, products: 0, orders: 0, users: 0, gmv: 0, mrr: 0 });
  const [data, setData] = useState<any[]>([]);

  // Discount code form
  const [newCode, setNewCode] = useState({ code: '', description: '', type: 'percentage', value: '', applies_to: 'order', min_order: '', max_uses: '', expires_at: '' });
  const [codeMsg, setCodeMsg] = useState('');

  useEffect(() => {
    if (profile?.user_type !== 'admin') { navigate('/'); return; }
    loadStats();
  }, [profile]);

  useEffect(() => { loadSection(active); }, [active]);

  const loadStats = async () => {
    const [vR, pR, oR, uR] = await Promise.all([
      supabase.from('vendors').select('*', { count: 'exact', head: true }),
      supabase.from('products').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('total_amount, status'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
    ]);
    const gmv = (oR.data || []).filter((o:any) => o.status !== 'cancelled').reduce((s:number, o:any) => s + Number(o.total_amount||0), 0);
    const { data: plans } = await supabase.from('vendors').select('plan_type');
    const mrr = (plans||[]).reduce((s:number,v:any) => s + (v.plan_type==='professional'?129:0), 0);
    setStats({ vendors: vR.count||0, products: pR.count||0, orders: oR.data?.length||0, users: uR.count||0, gmv, mrr });
  };

  const loadSection = async (section: Section) => {
    setLoading(true);
    try {
      if (section === 'vendors') {
        const { data } = await supabase.from('vendors').select('*, profiles(nome, cognome, email)').order('created_at', { ascending: false }).limit(50);
        setData(data||[]);
      } else if (section === 'products') {
        const { data } = await supabase.from('products').select('*, vendors(business_name)').order('created_at', { ascending: false }).limit(50);
        setData(data||[]);
      } else if (section === 'orders') {
        const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50);
        setData(data||[]);
      } else if (section === 'promotions') {
        const { data } = await supabase.from('promotions').select('*, vendors(business_name)').order('created_at', { ascending: false }).limit(50);
        setData(data||[]);
      } else if (section === 'discounts') {
        const { data } = await supabase.from('discount_codes').select('*').order('created_at', { ascending: false }).limit(50);
        setData(data||[]);
      } else if (section === 'users') {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(50);
        setData(data||[]);
      }
    } finally { setLoading(false); }
  };

  const approveVendor = async (id: string) => {
    if (!confirm('Confermi l\'approvazione di questo venditore? Il suo account diventerà attivo e verificato.')) return;
    await supabase.from('vendors').update({ plan_status: 'active', verified_badge: true }).eq('id', id);
    loadSection('vendors');
  };

  const suspendVendor = async (id: string) => {
    if (!confirm('Confermi la sospensione di questo venditore? Non potrà più vendere sul marketplace finché non lo riattivi.')) return;
    await supabase.from('vendors').update({ plan_status: 'suspended' }).eq('id', id);
    loadSection('vendors');
  };

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const refundOrder = async (orderId: string) => {
    if (!confirm('Confermi il rimborso completo di questo ordine? Il pagamento verrà restituito al cliente tramite Stripe.')) return;
    setActionLoading(orderId);
    const result = await callEdge('/admin/refund-order', { body: { orderId } });
    setActionLoading(null);
    if (!result.success) { alert('Errore: ' + result.error); return; }
    loadSection('orders');
  };

  const refundPromotion = async (promotionId: string) => {
    if (!confirm('Confermi il rimborso e la disattivazione immediata di questa promozione?')) return;
    setActionLoading(promotionId);
    const result = await callEdge('/admin/refund-promotion', { body: { promotionId } });
    setActionLoading(null);
    if (!result.success) { alert('Errore: ' + result.error); return; }
    loadSection('promotions');
  };

  const suspendUser = async (userId: string) => {
    if (!confirm('Confermi la sospensione di questo account? L\'utente non potrà più accedere.')) return;
    setActionLoading(userId);
    const result = await callEdge('/admin/suspend-user', { body: { userId } });
    setActionLoading(null);
    if (!result.success) { alert('Errore: ' + result.error); return; }
    loadSection('users');
  };

  const unsuspendUser = async (userId: string) => {
    setActionLoading(userId);
    const result = await callEdge('/admin/unsuspend-user', { body: { userId } });
    setActionLoading(null);
    if (!result.success) { alert('Errore: ' + result.error); return; }
    loadSection('users');
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Eliminare questo prodotto?')) return;
    await supabase.from('products').delete().eq('id', id);
    loadSection('products'); loadStats();
  };

  const createDiscountCode = async (e: React.FormEvent) => {
    e.preventDefault(); setCodeMsg('');
    try {
      const { error } = await supabase.from('discount_codes').insert([{
        code: newCode.code.toUpperCase().trim(),
        description: newCode.description,
        type: newCode.type,
        value: parseFloat(newCode.value),
        applies_to: newCode.applies_to,
        min_order_amount: parseFloat(newCode.min_order)||0,
        max_uses: newCode.max_uses ? parseInt(newCode.max_uses) : null,
        expires_at: newCode.expires_at || null,
        is_active: true,
      }]);
      if (error) throw error;
      setCodeMsg('Codice creato con successo!');
      setNewCode({ code:'',description:'',type:'percentage',value:'',applies_to:'order',min_order:'',max_uses:'',expires_at:'' });
      loadSection('discounts');
    } catch (e:any) { setCodeMsg('Errore: ' + e.message); }
  };

  const toggleCode = async (id: string, current: boolean) => {
    await supabase.from('discount_codes').update({ is_active: !current }).eq('id', id);
    loadSection('discounts');
  };

  const deleteCode = async (id: string) => {
    if (!confirm('Eliminare questo codice?')) return;
    await supabase.from('discount_codes').delete().eq('id', id);
    loadSection('discounts');
  };

  const statusBadge = (s: string) => {
    const c:Record<string,string> = { active:'bg-green-100 text-green-700', suspended:'bg-red-100 text-red-700', cancelled:'bg-red-100 text-red-700', pending:'bg-yellow-100 text-yellow-700', processing:'bg-accent text-primary', shipped:'bg-accent text-primary', delivered:'bg-green-100 text-green-700', trial:'bg-accent text-primary' };
    return <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${c[s]||'bg-gray-100 text-gray-600'}`}>{s}</span>;
  };

  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'vendors', icon: Users, label: 'Venditori' },
    { id: 'products', icon: Package, label: 'Prodotti' },
    { id: 'orders', icon: ShoppingBag, label: 'Ordini' },
    { id: 'promotions', icon: Sparkles, label: 'Promozioni' },
    { id: 'discounts', icon: Tag, label: 'Codici Sconto' },
    { id: 'users', icon: Users, label: 'Utenti' },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Mobile: tab orizzontali scrollabili */}
      <div className="md:hidden bg-gray-900 text-gray-300 px-2 py-2 overflow-x-auto">
        <div className="flex gap-1.5 w-max">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActive(item.id as Section)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${active === item.id ? 'bg-primary text-white' : 'bg-gray-800 hover:bg-gray-700'}`}>
              <item.icon className="w-3.5 h-3.5" />{item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: sidebar verticale */}
      <aside className="hidden md:block w-56 bg-gray-900 text-gray-300 flex-shrink-0">
        <div className="p-5 border-b border-gray-700">
          <p className="text-white font-bold text-sm">Oralzon Admin</p>
          <p className="text-gray-400 text-xs mt-1">Pannello di controllo</p>
        </div>
        <nav className="p-3 space-y-1">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setActive(item.id as Section)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${active === item.id ? 'bg-primary text-white' : 'hover:bg-gray-800'}`}>
              <item.icon className="w-4 h-4" />{item.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-6 overflow-auto min-w-0">

        {/* OVERVIEW */}
        {active === 'overview' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
              <button onClick={() => loadStats()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"><RefreshCw className="w-4 h-4" /> Aggiorna</button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label:'Venditori', value: stats.vendors, icon: Users, color:'bg-accent0' },
                { label:'Prodotti', value: stats.products, icon: Package, color:'bg-accent0' },
                { label:'Ordini Totali', value: stats.orders, icon: ShoppingBag, color:'bg-amber-500' },
                { label:'Utenti', value: stats.users, icon: Users, color:'bg-secondary' },
                { label:'GMV Totale', value: `€${stats.gmv.toFixed(0)}`, icon: TrendingUp, color:'bg-green-500' },
                { label:'MRR Abbonamenti', value: `€${stats.mrr}`, icon: BarChart3, color:'bg-secondary' },
              ].map(kpi => (
                <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`${kpi.color} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <kpi.icon className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-sm text-gray-500">{kpi.label}</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">{kpi.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VENDORS */}
        {active === 'vendors' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Venditori ({stats.vendors})</h1>
            {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Azienda</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Email</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Piano</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Stato</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Trial Scade</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((v:any) => (
                      <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{v.business_name}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{v.profiles?.email||'—'}</td>
                        <td className="px-4 py-3"><span className="text-xs bg-accent text-primary px-2 py-0.5 rounded">{v.plan_type}</span></td>
                        <td className="px-4 py-3">{statusBadge(v.plan_status)}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{v.trial_ends_at ? new Date(v.trial_ends_at).toLocaleDateString('it-IT') : '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => approveVendor(v.id)} className="text-xs text-green-600 hover:underline">Approva</button>
                            <button onClick={() => suspendVendor(v.id)} className="text-xs text-red-500 hover:underline">Sospendi</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            )}
          </div>
        )}

        {/* PRODUCTS */}
        {active === 'products' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Prodotti ({stats.products})</h1>
            {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Prodotto','Venditore','Categoria','Prezzo','Stato','Azioni'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((p:any) => (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium max-w-xs truncate">{p.name}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{p.vendors?.business_name||'—'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{p.category}</td>
                        <td className="px-4 py-3 font-medium">€{Number(p.price).toFixed(2)}</td>
                        <td className="px-4 py-3">{statusBadge(p.status||'published')}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => deleteProduct(p.id)} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Elimina
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            )}
          </div>
        )}

        {/* ORDERS */}
        {active === 'orders' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Ordini Marketplace ({stats.orders})</h1>
            {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Numero','Cliente','Totale','Sconto','Stato','Data','Azioni'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((o:any) => (
                      <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs font-medium">{o.order_number}</td>
                        <td className="px-4 py-3 text-xs text-gray-600">{o.shipping_name||o.shipping_email||'—'}</td>
                        <td className="px-4 py-3 font-bold">€{Number(o.total_amount).toFixed(2)}</td>
                        <td className="px-4 py-3 text-xs">{o.discount_code ? <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded">{o.discount_code}</span> : '—'}</td>
                        <td className="px-4 py-3">{statusBadge(o.status)}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('it-IT')}</td>
                        <td className="px-4 py-3">
                          {o.admin_refund_id ? (
                            <span className="text-xs text-gray-400">Rimborsato</span>
                          ) : o.status === 'cancelled' ? (
                            <span className="text-xs text-gray-400">—</span>
                          ) : (
                            <button onClick={() => refundOrder(o.id)} disabled={actionLoading === o.id}
                              className="text-xs text-red-600 hover:underline disabled:opacity-50 whitespace-nowrap">
                              {actionLoading === o.id ? '...' : 'Rimborsa'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            )}
          </div>
        )}

        {/* PROMOTIONS */}
        {active === 'promotions' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Promozioni Visibilità</h1>
            {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
              data.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center text-gray-400">
                  <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  Nessuna promozione ancora attivata
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto"><table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Venditore','Pacchetto','Pagato','Inizia','Scade','Stato','Azioni'].map(h => (
                          <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((p:any) => {
                        const isActive = new Date(p.expires_at) > new Date() && p.status === 'active';
                        return (
                        <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">{p.vendors?.business_name||'—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">{p.package_name}</td>
                          <td className="px-4 py-3 font-medium">€{Number(p.amount_paid).toFixed(2)}</td>
                          <td className="px-4 py-3 text-xs">{new Date(p.starts_at).toLocaleDateString('it-IT')}</td>
                          <td className="px-4 py-3 text-xs">{new Date(p.expires_at).toLocaleDateString('it-IT')}</td>
                          <td className="px-4 py-3">{statusBadge(isActive ? 'active' : (p.status === 'cancelled' ? 'cancelled' : 'expired'))}</td>
                          <td className="px-4 py-3">
                            {p.admin_refund_id ? (
                              <span className="text-xs text-gray-400">Rimborsata</span>
                            ) : !isActive ? (
                              <span className="text-xs text-gray-400">—</span>
                            ) : (
                              <button onClick={() => refundPromotion(p.id)} disabled={actionLoading === p.id}
                                className="text-xs text-red-600 hover:underline disabled:opacity-50 whitespace-nowrap">
                                {actionLoading === p.id ? '...' : 'Rimborsa e Annulla'}
                              </button>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table></div>
                </div>
              )
            )}
          </div>
        )}

        {/* DISCOUNT CODES */}
        {active === 'discounts' && (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold">Codici Sconto</h1>

            {/* Form crea codice */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-primary" /> Crea Nuovo Codice</h2>
              <form onSubmit={createDiscountCode} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Codice *</label>
                  <input required value={newCode.code} onChange={e => setNewCode({...newCode, code: e.target.value.toUpperCase()})}
                    placeholder="ES. SUMMER20" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm uppercase font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Descrizione</label>
                  <input value={newCode.description} onChange={e => setNewCode({...newCode, description: e.target.value})}
                    placeholder="Es. Sconto estate 2026" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                  <select value={newCode.type} onChange={e => setNewCode({...newCode, type: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="percentage">Percentuale (%)</option>
                    <option value="fixed">Fisso (€)</option>
                    <option value="free_months">Mesi gratuiti</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Valore *</label>
                  <input required type="number" step="0.01" value={newCode.value} onChange={e => setNewCode({...newCode, value: e.target.value})}
                    placeholder={newCode.type === 'percentage' ? '20' : newCode.type === 'fixed' ? '10.00' : '1'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Si applica a</label>
                  <select value={newCode.applies_to} onChange={e => setNewCode({...newCode, applies_to: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="order">Ordini prodotti</option>
                    <option value="subscription">Abbonamenti vendor</option>
                    <option value="both">Entrambi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Ordine minimo (€)</label>
                  <input type="number" step="0.01" value={newCode.min_order} onChange={e => setNewCode({...newCode, min_order: e.target.value})}
                    placeholder="0" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Usi massimi</label>
                  <input type="number" value={newCode.max_uses} onChange={e => setNewCode({...newCode, max_uses: e.target.value})}
                    placeholder="Illimitati" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Scade il</label>
                  <input type="datetime-local" value={newCode.expires_at} onChange={e => setNewCode({...newCode, expires_at: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="col-span-2">
                  {codeMsg && <p className={`text-sm mb-3 ${codeMsg.startsWith('Errore') ? 'text-red-600' : 'text-green-600'}`}>{codeMsg}</p>}
                  <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
                    Crea Codice
                  </button>
                </div>
              </form>
            </div>

            {/* Lista codici */}
            {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Codice','Tipo','Valore','Si applica a','Usi','Scadenza','Stato','Azioni'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((c:any) => (
                      <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono font-bold text-primary">{c.code}</td>
                        <td className="px-4 py-3 text-xs">{c.type}</td>
                        <td className="px-4 py-3 font-medium">{c.type==='percentage'?`${c.value}%`:c.type==='fixed'?`€${c.value}`:`${c.value} mesi`}</td>
                        <td className="px-4 py-3 text-xs">{c.applies_to}</td>
                        <td className="px-4 py-3 text-xs">{c.used_count}/{c.max_uses||'∞'}</td>
                        <td className="px-4 py-3 text-xs text-gray-400">{c.expires_at ? new Date(c.expires_at).toLocaleDateString('it-IT') : '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.is_active?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                            {c.is_active ? 'Attivo' : 'Disattivo'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => toggleCode(c.id, c.is_active)} className="text-xs text-secondary hover:underline">{c.is_active?'Disattiva':'Attiva'}</button>
                            <button onClick={() => deleteCode(c.id)} className="text-xs text-red-500 hover:underline">Elimina</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {data.length === 0 && (
                      <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Nessun codice sconto ancora creato</td></tr>
                    )}
                  </tbody>
                </table></div>
              </div>
            )}
          </div>
        )}

        {/* EARNINGS */}
        {/* USERS */}
        {active === 'users' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold">Utenti Registrati ({stats.users})</h1>
            {loading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto"><table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Nome','Tipo','Registrato il','Stato','Azioni'].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((u:any) => (
                      <tr key={u.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{`${u.nome || ''} ${u.cognome || ''}`.trim() || u.id.slice(0,8)}</td>
                        <td className="px-4 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{u.user_type||'cliente'}</span></td>
                        <td className="px-4 py-3 text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString('it-IT')}</td>
                        <td className="px-4 py-3">
                          {u.suspended_at ? (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Sospeso</span>
                          ) : (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Attivo</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {u.user_type === 'admin' ? (
                            <span className="text-xs text-gray-300">—</span>
                          ) : u.suspended_at ? (
                            <button onClick={() => unsuspendUser(u.id)} disabled={actionLoading === u.id}
                              className="flex items-center gap-1 text-xs text-green-600 hover:underline disabled:opacity-50">
                              <UserCheck className="w-3.5 h-3.5" /> {actionLoading === u.id ? '...' : 'Riattiva'}
                            </button>
                          ) : (
                            <button onClick={() => suspendUser(u.id)} disabled={actionLoading === u.id}
                              className="flex items-center gap-1 text-xs text-red-600 hover:underline disabled:opacity-50">
                              <Ban className="w-3.5 h-3.5" /> {actionLoading === u.id ? '...' : 'Sospendi'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
