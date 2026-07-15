import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Package, Euro, Loader2, Truck, CheckCircle } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { callEdge } from '../../../lib/edgeApi';

interface StatsData {
  kpi: { totalRevenue: number; totalOrders: number; totalItems: number; avgOrderValue: number; avgItemsPerOrder: number };
  dailyTrend: { date: string; revenue: number }[];
  monthlyTrend: { month: string; revenue: number }[];
  topProducts: { name: string; revenue: number; quantity: number }[];
  statusBreakdown: { confirmed: number; shipped: number };
}

const COLORS = ['#1a56db', '#0891b2', '#f59e0b', '#16a34a', '#dc2626'];

export function VendorStats() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'30d' | '6m'>('30d');

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    setLoading(true);
    const result = await callEdge('/vendor/stats', { method: 'GET' });
    if (result.success) setData(result);
    setLoading(false);
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  if (!data || data.kpi.totalItems === 0) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Statistiche</h1>
          <p className="text-gray-600 mt-2">Analizza le performance del tuo negozio</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Ancora nessuna vendita</h3>
          <p className="text-gray-600">Le statistiche appariranno qui non appena riceverai i primi ordini confermati.</p>
        </div>
      </div>
    );
  }

  const { kpi, dailyTrend, monthlyTrend, topProducts, statusBreakdown } = data;
  const trendData = period === '30d' ? dailyTrend : monthlyTrend;
  const trendKey = period === '30d' ? 'date' : 'month';

  const pieData = [
    { name: 'Da spedire', value: statusBreakdown.confirmed },
    { name: 'Spediti', value: statusBreakdown.shipped },
  ].filter(d => d.value > 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Statistiche</h1>
        <p className="text-gray-600 mt-2">Analizza le performance del tuo negozio</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
            <Euro className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-black text-gray-900">€{kpi.totalRevenue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Fatturato lordo (ultimi 12 mesi)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mb-3">
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-black text-gray-900">€{kpi.avgOrderValue.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Scontrino medio (per ordine)</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center mb-3">
            <Package className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-2xl font-black text-gray-900">{kpi.totalItems}</p>
          <p className="text-xs text-gray-500 mt-0.5">Pezzi venduti</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mb-3">
            <BarChart3 className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-gray-900">{kpi.avgItemsPerOrder.toFixed(1)}</p>
          <p className="text-xs text-gray-500 mt-0.5">Articoli medi per ordine</p>
        </div>
      </div>

      {/* Trend fatturato */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Andamento Fatturato</h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            <button onClick={() => setPeriod('30d')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${period === '30d' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}>
              30 giorni
            </button>
            <button onClick={() => setPeriod('6m')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${period === '6m' ? 'bg-white shadow-sm text-primary' : 'text-gray-500'}`}>
              6 mesi
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="revGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1a56db" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#1a56db" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f1f3" />
            <XAxis dataKey={trendKey} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              interval={period === '30d' ? 4 : 0} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `€${v}`} />
            <Tooltip formatter={(v: number) => [`€${v.toFixed(2)}`, 'Fatturato']}
              contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }} />
            <Area type="monotone" dataKey="revenue" stroke="#1a56db" strokeWidth={2} fill="url(#revGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Top prodotti */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Prodotti Più Venduti</h2>
          {topProducts.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nessun dato disponibile</p>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.quantity} venduti</p>
                  </div>
                  <span className="text-sm font-bold text-gray-900 flex-shrink-0">€{p.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stato ordini */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="font-bold text-gray-900 mb-4">Stato Ordini</h2>
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nessun dato disponibile</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={160}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    {d.name === 'Spediti' ? <Truck className="w-3.5 h-3.5 text-gray-400" /> : <CheckCircle className="w-3.5 h-3.5 text-gray-400" />}
                    <span className="text-gray-600">{d.name}</span>
                    <span className="ml-auto font-bold text-gray-900">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
