import { Link, useLocation } from 'react-router-dom';
import { FileText, LayoutDashboard, Package, Plus, FileSpreadsheet, ShoppingCart, Star, Megaphone, BarChart3, Settings, RefreshCw, Wallet } from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Panoramica', path: '/venditore/dashboard' },
  { icon: Package, label: 'Prodotti', path: '/venditore/prodotti' },
  { icon: Plus, label: 'Aggiungi Prodotto', path: '/venditore/prodotti/nuovo' },
  { icon: FileSpreadsheet, label: 'Import Excel', path: '/venditore/import-excel' },
  { icon: ShoppingCart, label: 'Ordini', path: '/venditore/ordini' },
  { icon: RefreshCw, label: 'Resi', path: '/venditore/resi' },
  { icon: Star, label: 'Recensioni', path: '/venditore/recensioni' },
  { icon: Megaphone, label: 'Promozioni', path: '/venditore/promozioni' },
  { icon: BarChart3, label: 'Statistiche', path: '/venditore/statistiche' },
  { icon: Wallet, label: 'Pagamenti', path: '/venditore/pagamenti' },
  { icon: FileText, label: 'Report Vendite', path: '/venditore/fiscale' },
  { icon: Settings, label: 'Impostazioni', path: '/venditore/impostazioni' },
];

export function VendorSidebar() {
  const location = useLocation();

  return (
    <>
      {/* Mobile: scroll orizzontale */}
      <div className="md:hidden bg-white border-b border-gray-200 px-2 py-2 overflow-x-auto scrollbar-hide">
        <div className="flex gap-1.5 w-max">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                <Icon className="w-3.5 h-3.5" />{item.label}
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
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}>
                <Icon className="w-4 h-4" /><span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
