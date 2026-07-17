import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FileText, LayoutDashboard, Package, Plus, FileSpreadsheet, ShoppingCart, Star, Megaphone, BarChart3, Settings, RefreshCw, Wallet } from 'lucide-react';
import { callEdge } from '../../lib/edgeApi';

const menuItems = [
  { icon: LayoutDashboard, label: 'Panoramica', path: '/venditore/dashboard' },
  { icon: Package, label: 'Prodotti', path: '/venditore/prodotti' },
  { icon: Plus, label: 'Aggiungi Prodotto', path: '/venditore/prodotti/nuovo' },
  { icon: FileSpreadsheet, label: 'Import Excel', path: '/venditore/import-excel' },
  { icon: ShoppingCart, label: 'Ordini', path: '/venditore/ordini', badgeKey: 'pendingOrders' },
  { icon: RefreshCw, label: 'Resi', path: '/venditore/resi', badgeKey: 'pendingReturns' },
  { icon: Star, label: 'Recensioni', path: '/venditore/recensioni' },
  { icon: Megaphone, label: 'Promozioni', path: '/venditore/promozioni' },
  { icon: BarChart3, label: 'Statistiche', path: '/venditore/statistiche' },
  { icon: Wallet, label: 'Pagamenti', path: '/venditore/pagamenti' },
  { icon: FileText, label: 'Report Vendite', path: '/venditore/fiscale' },
  { icon: Settings, label: 'Impostazioni', path: '/venditore/impostazioni' },
];

// Pallino rosso: segnala ordini da spedire o resi da valutare, in attesa da
// parte del venditore. Si aggiorna al caricamento della pagina e ogni 60s —
// non serve real-time vero per questo caso d'uso, un piccolo ritardo va bene.
function NotificationDot() {
  return <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />;
}

export function VendorSidebar() {
  const location = useLocation();
  const [counts, setCounts] = useState<{ pendingOrders: number; pendingReturns: number }>({ pendingOrders: 0, pendingReturns: 0 });

  useEffect(() => {
    const loadCounts = async () => {
      const result = await callEdge('/vendor/notification-counts', { method: 'GET' });
      if (result.success) setCounts({ pendingOrders: result.pendingOrders, pendingReturns: result.pendingReturns });
    };
    loadCounts();
    const interval = setInterval(loadCounts, 60_000);
    return () => clearInterval(interval);
  }, [location.pathname]); // ricontrolla anche quando si cambia pagina (es. dopo aver gestito un ordine)

  return (
    <>
      {/* Mobile: scroll orizzontale */}
      <div className="md:hidden bg-white border-b border-gray-200 px-2 py-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 w-max">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const badgeCount = item.badgeKey ? (counts as any)[item.badgeKey] : 0;
            return (
              <Link key={item.path} to={item.path}
                className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                <Icon className="w-3.5 h-3.5" />{item.label}
                {badgeCount > 0 && <NotificationDot />}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Desktop: sidebar */}
      <aside className="hidden md:block w-52 bg-white border-r border-gray-200 min-h-screen flex-shrink-0">
        <nav className="p-3 space-y-0.5">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const badgeCount = item.badgeKey ? (counts as any)[item.badgeKey] : 0;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}>
                <Icon className="w-4 h-4" />
                <span className="font-medium flex-1">{item.label}</span>
                {badgeCount > 0 && <NotificationDot />}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
