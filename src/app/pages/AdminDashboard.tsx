import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Users, Package, ShoppingBag, TrendingUp,
  Sparkles, Loader2, RefreshCw, Trash2, Tag, Plus, Euro,
  CheckCircle, XCircle, Calendar, BarChart3, Ban, UserCheck,
  Wallet, PiggyBank, AlertTriangle, Award
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../../lib/supabase';
import { callEdge } from '../../lib/edgeApi';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

type Section = 'overview' | 'finance' | 'vendors' | 'products' | 'orders' | 'promotions' | 'discounts' | 'users';

export function AdminDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState<Section>('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ vendors: 0, products: 0, orders: 0, users: 0, gmv: 0, mrr: 0 });
  const [data, setData] = useState<any[]>([]);
  const [finance, setFinance] = useState<any>(null);
  const [financeLoading, setFinanceLoading] = useState(false);

  // Discount code form
  const [newCode, setNewCode] = useState({ code: '', description: '', type: 'percentage', value: '', applies_to: 'order', min_order: '', max_uses: '', expires_at: '' });
  const [codeMsg, setCodeMsg] = useState('');

  useEffect(() => {
    if (profile?.user_type !== 'admin') { navigate('/'); return; }
    loadStats();
  }, [profile]);

  useEffect(() => {
    if (active === 'finance') loadFinance();
    else loadSection(active);
  }, [active]);

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

  // Report finanziario completo: incrocia ordini, commissioni sulle vendite
  // (vendor_transfers, calcolate per singolo order_item con la % del
  // venditore), abbonamenti venditori attivi e pacchetti promo pagati —
  // tutto quello che serve per capire quanto guadagna davvero Oralzon,
  // non solo il fatturato che passa sulla piattaforma (GMV).
  const loadFinance = async () => {
    setFinanceLoading(true);
    try {
      const [ordersR, transfersR, promosR, vendorsR] = await Promise.all([
        supabase.from('orders').select('id, total_amount, status, created_at'),
        supabase.from('vendor_transfers').select('vendor_id, gross_amount, commission_amount, net_amount, status, created_at, vendors(business_name)'),
        supabase.from('promotions').select('vendor_id, package_id, package_name, amount_paid, status, created_at, vendors(business_name)'),
        supabase.from('vendors').select('plan_type, plan_status'),
      ]);

      const orders = ordersR.data || [];
      const transfers = transfersR.data || [];
      const promos = promosR.data || [];
      const vendors = vendorsR.data || [];

      // GMV: valore totale transato sulla piattaforma, ordini non annullati
      const validOrders = orders.filter((o: any) => o.status !== 'cancelled');
      const gmv = validOrders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0);
      const ordersCount = validOrders.length;
      const aov = ordersCount > 0 ? gmv / ordersCount : 0;

      // Commissioni sulle vendite: sono guadagno reale solo se il transfer
      // non è fallito. "partially_reversed" conta comunque la commissione
      // trattenuta sulla parte non rimborsata.
      const validTransfers = transfers.filter((t: any) => t.status !== 'failed');
      const commissionRevenue = validTransfers.reduce((s: number, t: any) => s + Number(t.commission_amount || 0), 0);
      const vendorPayoutsNet = validTransfers.reduce((s: number, t: any) => s + Number(t.net_amount || 0), 0);
      const transfersGross = validTransfers.reduce((s: number, t: any) => s + Number(t.gross_amount || 0), 0);

      // Abbonamenti venditori: unico piano a pagamento oggi è "professional"
      // a 129€/mese — ricorrente, quindi lo teniamo separato dagli incassi
      // una tantum (commissioni e promo) invece di sommarlo ciecamente.
      const activeProPlans = vendors.filter((v: any) => v.plan_type === 'professional' && v.plan_status === 'active').length;
      const subscriptionMRR = activeProPlans * 129;

      // Promozioni: solo quelle realmente pagate (status 'active', anche se
      // nel frattempo scadute) contano come incasso — 'pending' vuol dire
      // checkout iniziato ma pagamento non confermato, non è un ricavo.
      const paidPromos = promos.filter((p: any) => p.status === 'active');
      const promoRevenue = paidPromos.reduce((s: number, p: any) => s + Number(p.amount_paid || 0), 0);
      const refundedPromos = promos.filter((p: any) => p.status === 'cancelled');
      const promoRefunded = refundedPromos.reduce((s: number, p: any) => s + Number(p.amount_paid || 0), 0);

      // Ricavi totali piattaforma: somma di tutto ciò che entra davvero
      // nelle casse di Oralzon (non il GMV, che è dei venditori).
      const totalPlatformRevenue = commissionRevenue + subscriptionMRR + promoRevenue;

      // Top venditori per commissioni generate (cioè quelli che fanno
      // guadagnare di più la piattaforma, non necessariamente quelli con
      // più fatturato lordo)
      const vendorMap = new Map<string, { name: string; gross: number; commission: number; net: number; orders: number }>();
      for (const t of validTransfers) {
        const key = t.vendor_id;
        const name = (t as any).vendors?.business_name || 'Venditore';
        const prev = vendorMap.get(key) || { name, gross: 0, commission: 0, net: 0, orders: 0 };
        prev.gross += Number(t.gross_amount || 0);
        prev.commission += Number(t.commission_amount || 0);
        prev.net += Number(t.net_amount || 0);
        prev.orders += 1;
        vendorMap.set(key, prev);
      }
      const topVendors = Array.from(vendorMap.values()).sort((a, b) => b.commission - a.commission).slice(0, 10);

      // Pacchetti promo per tipo (quali vendono di più)
      const promoPackageMap = new Map<string, { name: string; count: number; revenue: number }>();
      for (const p of paidPromos) {
        const key = p.package_id || p.package_name || 'altro';
        const prev = promoPackageMap.get(key) || { name: p.package_name || key, count: 0, revenue: 0 };
        prev.count += 1;
        prev.revenue += Number(p.amount_paid || 0);
        promoPackageMap.set(key, prev);
      }
      const promoPackages = Array.from(promoPackageMap.values()).sort((a, b) => b.revenue - a.revenue);

      // Andamento mensile (ultimi 6 mesi): ordini, GMV e commissioni per mese,
      // per capire il trend invece del solo totale cumulativo.
      const now = new Date();
      const months: { key: string; label: string; orders: number; gmv: number; commission: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString('it-IT', { month: 'short', year: '2-digit' }), orders: 0, gmv: 0, commission: 0 });
      }
      const monthKey = (dateStr: string) => { const d = new Date(dateStr); return `${d.getFullYear()}-${d.getMonth()}`; };
      for (const o of validOrders) {
        const m = months.find(m => m.key === monthKey(o.created_at));
        if (m) { m.orders += 1; m.gmv += Number(o.total_amount || 0); }
      }
      for (const t of validTransfers) {
        const m = months.find(m => m.key === monthKey(t.created_at));
        if (m) m.commission += Number(t.commission_amount || 0);
      }

      // Stato dei transfer (utile per capire se ci sono pagamenti falliti
      // da controllare manualmente)
      const transfersByStatus = ['completed', 'pending', 'partially_reversed', 'failed'].map(status => {
        const list = transfers.filter((t: any) => t.status === status);
        return { status, count: list.length, amount: list.reduce((s: number, t: any) => s + Number(t.gross_amount || 0), 0) };
      }).filter(x => x.count > 0);

      setFinance({
        gmv, ordersCount, aov,
        commissionRevenue, vendorPayoutsNet, transfersGross,
        subscriptionMRR, activeProPlans,
        promoRevenue, promoRefunded, paidPromosCount: paidPromos.length,
        totalPlatformRevenue,
        topVendors, promoPackages, months, transfersByStatus,
      });
    } catch (e) {
      console.error('Errore caricamento report finanziario:', e);
    } finally {
      setFinanceLoading(false);
    }
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
    { id: 'finance', icon: Euro, label: 'Finanze' },
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

        {/* FINANZE */}
        {active === 'finance' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Finanze</h1>
                <p className="text-sm text-gray-500 mt-0.5">Quanto guadagna davvero Oralzon — non il fatturato dei venditori, ma i ricavi della piattaforma</p>
              </div>
              <button onClick={() => loadFinance()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                <RefreshCw className="w-4 h-4" /> Aggiorna
              </button>
            </div>

            {financeLoading || !finance ? (
              <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : (
              <>
                {/* Ricavi piattaforma — la card che conta davvero */}
                <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 text-white">
                  <p className="text-sm text-white/80 mb-1">Ricavi totali piattaforma (commissioni + abbonamenti + promo)</p>
                  <p className="text-4xl font-bold">€{finance.totalPlatformRevenue.toFixed(2)}</p>
                  <div className="flex flex-wrap gap-4 mt-4 text-sm text-white/90">
                    <span>Commissioni vendite: <strong>€{finance.commissionRevenue.toFixed(2)}</strong></span>
                    <span>MRR abbonamenti: <strong>€{finance.subscriptionMRR.toFixed(2)}/mese</strong></span>
                    <span>Incassi promo: <strong>€{finance.promoRevenue.toFixed(2)}</strong></span>
                  </div>
                </div>

                {/* KPI dettagliati */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'GMV (fatturato transato)', value: `€${finance.gmv.toFixed(0)}`, sub: `${finance.ordersCount} ordini`, icon: TrendingUp, color: 'bg-green-500' },
                    { label: 'Valore medio ordine', value: `€${finance.aov.toFixed(2)}`, sub: 'AOV', icon: BarChart3, color: 'bg-accent0' },
                    { label: 'Commissioni guadagnate', value: `€${finance.commissionRevenue.toFixed(2)}`, sub: `su €${finance.transfersGross.toFixed(0)} venduto`, icon: PiggyBank, color: 'bg-secondary' },
                    { label: 'Netto pagato ai venditori', value: `€${finance.vendorPayoutsNet.toFixed(2)}`, sub: 'payout', icon: Wallet, color: 'bg-amber-500' },
                    { label: 'Abbonamenti attivi', value: finance.activeProPlans, sub: `€${finance.subscriptionMRR}/mese`, icon: Award, color: 'bg-accent0' },
                    { label: 'Promo pagate', value: finance.paidPromosCount, sub: `€${finance.promoRevenue.toFixed(2)} incassati`, icon: Sparkles, color: 'bg-secondary' },
                    { label: 'Promo rimborsate', value: `€${finance.promoRefunded.toFixed(2)}`, sub: 'annullate da admin', icon: XCircle, color: 'bg-red-400' },
                    { label: 'Transfer da controllare', value: finance.transfersByStatus.find((t:any)=>t.status==='failed')?.count || 0, sub: 'falliti', icon: AlertTriangle, color: 'bg-red-500' },
                  ].map(kpi => (
                    <div key={kpi.label} className="bg-white rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className={`${kpi.color} w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <kpi.icon className="w-4 h-4 text-white" />
                        </div>
                        <p className="text-xs text-gray-500 leading-tight">{kpi.label}</p>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{kpi.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Andamento mensile */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="font-semibold text-gray-900 mb-4">Andamento ultimi 6 mesi</h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={finance.months}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v: number) => `€${v.toFixed(2)}`} />
                      <Bar dataKey="gmv" name="GMV" fill="#9CA3AF" radius={[4,4,0,0]} />
                      <Bar dataKey="commission" name="Commissioni" fill="#0F7A68" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                  {/* Top venditori per commissioni generate */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-5 border-b border-gray-100">
                      <h2 className="font-semibold text-gray-900">Top venditori per commissioni generate</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Chi fa guadagnare di più Oralzon, non solo chi vende di più</p>
                    </div>
                    {finance.topVendors.length === 0 ? (
                      <p className="text-sm text-gray-400 p-5">Nessuna vendita ancora completata.</p>
                    ) : (
                      <div className="overflow-x-auto"><table className="w-full text-sm">
                        <thead className="bg-gray-50"><tr>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Venditore</th>
                          <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Lordo</th>
                          <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Commissione</th>
                          <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Vendite</th>
                        </tr></thead>
                        <tbody>
                          {finance.topVendors.map((v: any, i: number) => (
                            <tr key={i} className="border-t border-gray-100">
                              <td className="px-4 py-2.5 font-medium text-gray-800">{v.name}</td>
                              <td className="px-4 py-2.5 text-right text-gray-500">€{v.gross.toFixed(2)}</td>
                              <td className="px-4 py-2.5 text-right font-semibold text-primary">€{v.commission.toFixed(2)}</td>
                              <td className="px-4 py-2.5 text-right text-gray-500">{v.orders}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table></div>
                    )}
                  </div>

                  {/* Pacchetti promo più venduti */}
                  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="p-5 border-b border-gray-100">
                      <h2 className="font-semibold text-gray-900">Pacchetti promozione più venduti</h2>
                      <p className="text-xs text-gray-400 mt-0.5">Solo pacchetti effettivamente pagati</p>
                    </div>
                    {finance.promoPackages.length === 0 ? (
                      <p className="text-sm text-gray-400 p-5">Nessuna promozione venduta ancora.</p>
                    ) : (
                      <div className="overflow-x-auto"><table className="w-full text-sm">
                        <thead className="bg-gray-50"><tr>
                          <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Pacchetto</th>
                          <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Venduti</th>
                          <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Incasso</th>
                        </tr></thead>
                        <tbody>
                          {finance.promoPackages.map((p: any, i: number) => (
                            <tr key={i} className="border-t border-gray-100">
                              <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                              <td className="px-4 py-2.5 text-right text-gray-500">{p.count}</td>
                              <td className="px-4 py-2.5 text-right font-semibold text-primary">€{p.revenue.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table></div>
                    )}
                  </div>
                </div>

                {/* Stato transfer commissioni */}
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h2 className="font-semibold text-gray-900 mb-1">Stato trasferimenti ai venditori</h2>
                  <p className="text-xs text-gray-400 mb-4">Se ci sono "falliti", vanno controllati manualmente — quei fondi non sono stati ancora girati al venditore</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {finance.transfersByStatus.map((t: any) => (
                      <div key={t.status} className={`rounded-lg p-3 border ${t.status === 'failed' ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                        <p className="text-xs text-gray-500 capitalize">{t.status.replace('_', ' ')}</p>
                        <p className="text-lg font-bold text-gray-900">{t.count}</p>
                        <p className="text-xs text-gray-400">€{t.amount.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
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
