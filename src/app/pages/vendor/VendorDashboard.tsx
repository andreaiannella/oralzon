import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  Euro,
  ArrowRight,
  BarChart3,
  Star,
  FileSpreadsheet,
  Plus,
  Megaphone
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../contexts/AuthContext';
import { getCurrentVendor, ensureVendorExists } from '../../../lib/vendor';

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  monthlyRevenue: number;
  pendingOrders: number;
  averageRating: number;
}

export function VendorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalOrders: 0,
    monthlyRevenue: 0,
    pendingOrders: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      // Prima assicurati che il vendor esista
      let vendor = await ensureVendorExists();

      if (!vendor) {
        // Se ancora non c'è, prova a caricarlo
        vendor = await getCurrentVendor();
      }

      if (!vendor) {
        console.error('Vendor not found and could not be created');
        setLoading(false);
        return;
      }

      // Carica statistiche prodotti
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, status, stock')
        .eq('vendor_id', vendor.id);

      if (productsError) {
        console.error('Error fetching products:', productsError);
      }

      const totalProducts = productsData?.length || 0;
      const activeProducts = productsData?.filter(p => p.status === 'published' && p.stock > 0).length || 0;

      // Carica statistiche ordini (se esistono order_items per questo venditore)
      // NOTA: evitiamo il join incorporato "orders!inner(...)" — con RLS attive
      // su entrambe le tabelle, un embedded join può restituire silenziosamente
      // zero righe in certe combinazioni di policy, senza dare errore. Due
      // query separate sono più lente di una frazione di secondo ma eliminano
      // completamente quell'ambiguità.
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('id, order_id, shipping_status, price, quantity')
        .eq('vendor_id', vendor.id);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
      }

      const orderIds = [...new Set((itemsData || []).map((i: any) => i.order_id))];
      let ordersById: Record<string, { status: string; created_at: string }> = {};
      if (orderIds.length > 0) {
        const { data: ordersLookup, error: ordersLookupError } = await supabase
          .from('orders')
          .select('id, status, created_at')
          .in('id', orderIds);
        if (ordersLookupError) console.error('Error fetching orders:', ordersLookupError);
        (ordersLookup || []).forEach((o: any) => { ordersById[o.id] = o; });
      }

      const ordersData = (itemsData || []).map((i: any) => ({ ...i, orders: ordersById[i.order_id] }));

      // Ordini distinti (non righe prodotto) tra quelli effettivamente pagati
      const paidRows = ordersData.filter((o: any) => o.orders && ['processing', 'shipped', 'delivered'].includes(o.orders.status));
      const totalOrders = new Set(paidRows.map((o: any) => o.order_id)).size;
      // shipping_status valori reali: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
      // ('processing' è uno stato dell'ORDINE, non della spedizione — non esiste su shipping_status)
      const pendingOrders = paidRows.filter((o: any) => o.shipping_status === 'pending' || o.shipping_status === 'confirmed').length;

      // Calcola fatturato mensile (ultimo mese) — SOLO ordini effettivamente
      // pagati, filtrando su orders.created_at (order_items non ha una propria
      // colonna created_at: filtrarci sopra falliva silenziosamente e il
      // fatturato restava sempre a zero, indipendentemente dalle vendite reali).
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const monthlyRevenue = paidRows
        .filter((o: any) => o.orders?.created_at && new Date(o.orders.created_at) >= oneMonthAgo)
        .reduce((sum: number, item: any) => sum + (parseFloat(item.price.toString()) * item.quantity), 0);

      // Valutazione media reale dalle recensioni sui prodotti del venditore
      let averageRating = 0;
      const productIds = (productsData || []).map(p => p.id);
      if (productIds.length > 0) {
        const { data: reviewsData } = await supabase
          .from('product_reviews')
          .select('rating')
          .in('product_id', productIds);
        if (reviewsData && reviewsData.length > 0) {
          averageRating = reviewsData.reduce((s, r: any) => s + r.rating, 0) / reviewsData.length;
        }
      }

      setStats({
        totalProducts,
        activeProducts,
        totalOrders,
        monthlyRevenue,
        pendingOrders,
        averageRating
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      icon: Package,
      label: 'Prodotti Attivi',
      value: stats.activeProducts,
      total: stats.totalProducts,
      color: 'blue',
      link: '/venditore/prodotti'
    },
    {
      icon: ShoppingCart,
      label: 'Ordini da Evadere',
      value: stats.pendingOrders,
      total: stats.totalOrders,
      color: 'orange',
      link: '/venditore/ordini'
    },
    {
      icon: Euro,
      label: 'Fatturato Mensile',
      value: `€${stats.monthlyRevenue.toFixed(2)}`,
      color: 'green',
      link: '/venditore/statistiche'
    },
    {
      icon: Star,
      label: 'Valutazione Media',
      value: stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A',
      color: 'yellow',
      link: '/venditore/recensioni'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Panoramica</h1>
        <p className="text-gray-600 mt-2">Benvenuto nella tua dashboard venditore</p>
      </div>

      {/* Banner Promozione */}
      <div className="bg-gradient-to-r from-primary to-primary rounded-xl p-8 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-4 rounded-lg">
            <Megaphone className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Promuovi i Tuoi Prodotti</h2>
            <p className="text-oralzon-pale-mint mt-1">Metti in evidenza i tuoi prodotti per aumentare le vendite</p>
          </div>
        </div>
        <Link
          to="/venditore/promozioni"
          className="bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-accent transition-colors flex items-center gap-2"
        >
          Scopri le Promozioni
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'bg-accent text-primary',
            orange: 'bg-orange-100 text-orange-600',
            green: 'bg-green-100 text-green-600',
            yellow: 'bg-yellow-100 text-yellow-600'
          };

          return (
            <Link
              key={stat.label}
              to={stat.link}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold text-gray-900">
                {stat.value}
                {stat.total !== undefined && <span className="text-lg text-gray-400 ml-2">/ {stat.total}</span>}
              </p>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Vendi i tuoi prodotti</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link
            to="/venditore/prodotti/nuovo"
            className="flex items-center justify-between p-4 bg-accent rounded-lg hover:bg-accent transition-colors"
          >
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5 text-primary" />
              <span className="font-medium text-gray-900">Aggiungi prodotto</span>
            </div>
            <ArrowRight className="w-5 h-5 text-primary" />
          </Link>
          <Link
            to="/venditore/import-excel"
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-900">Importa catalogo da Excel</span>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-600" />
          </Link>
        </div>
      </div>
    </div>
  );
}
