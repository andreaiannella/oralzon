import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import {
  User, Package, ShoppingCart, Heart, Settings, RefreshCw, Megaphone,
  MoreHorizontal, X, LayoutDashboard, Plus, FileSpreadsheet, Star, BarChart3, Wallet, FileText,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { callEdge } from '../../lib/edgeApi';

// La barra sostituisce, dentro l'app nativa, la navigazione che sul sito
// web sta nell'header — su schermi piccoli e senza il mouse, avere le voci
// principali sempre raggiungibili col pollice è lo standard di qualunque
// app mobile seria (Amazon, eBay, ecc.). Sul sito web via browser questo
// componente non renderizza nulla.
export function MobileBottomNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { itemCount } = useCart();
  const [moreOpen, setMoreOpen] = useState(false);
  const [counts, setCounts] = useState({ pendingOrders: 0, pendingReturns: 0 });

  const isVendorArea = location.pathname.startsWith('/venditore');
  const isVendorAccount = (profile as any)?.user_type === 'venditore';

  useEffect(() => {
    if (!isVendorArea || !isVendorAccount) return;
    const load = async () => {
      const result = await callEdge('/vendor/notification-counts', { method: 'GET' });
      if (result.success) setCounts({ pendingOrders: result.pendingOrders, pendingReturns: result.pendingReturns });
    };
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [isVendorArea, isVendorAccount, location.pathname]);

  // Fuori dall'app nativa questo componente non esiste — niente spazio
  // occupato, niente rendering, zero impatto sul sito web normale.
  if (!Capacitor.isNativePlatform()) return null;

  const goToAccount = (path: string) => {
    if (!user) { navigate('/login', { state: { from: path } }); return; }
    navigate(path);
  };

  const customerTabs = [
    { icon: User, label: t('nav.myProfile') || 'Profilo', onClick: () => goToAccount('/account/profilo') },
    { icon: Package, label: t('orders.myOrdersTitle') || 'Ordini', onClick: () => goToAccount('/account/ordini') },
    { icon: ShoppingCart, label: t('nav.cart') || 'Carrello', onClick: () => navigate('/carrello'), badge: itemCount },
    { icon: Heart, label: t('wishlist.title') || 'Preferiti', onClick: () => goToAccount('/account/preferiti') },
    { icon: Settings, label: t('account.settings') || 'Impostazioni', onClick: () => goToAccount('/account/impostazioni') },
  ];

  const vendorTabs = [
    { icon: Package, label: 'Prodotti', path: '/venditore/prodotti' },
    { icon: ShoppingCart, label: 'Ordini', path: '/venditore/ordini', badge: counts.pendingOrders },
    { icon: RefreshCw, label: 'Resi', path: '/venditore/resi', badge: counts.pendingReturns },
    { icon: Megaphone, label: 'Promozioni', path: '/venditore/promozioni' },
  ];

  const vendorMoreItems = [
    { icon: LayoutDashboard, label: 'Panoramica', path: '/venditore/dashboard' },
    { icon: Plus, label: 'Aggiungi Prodotto', path: '/venditore/prodotti/nuovo' },
    { icon: FileSpreadsheet, label: 'Import Excel', path: '/venditore/import-excel' },
    { icon: Star, label: 'Recensioni', path: '/venditore/recensioni' },
    { icon: BarChart3, label: 'Statistiche', path: '/venditore/statistiche' },
    { icon: Wallet, label: 'Pagamenti', path: '/venditore/pagamenti' },
    { icon: FileText, label: 'Report Vendite', path: '/venditore/fiscale' },
    { icon: Settings, label: 'Impostazioni', path: '/venditore/impostazioni' },
  ];

  const showVendorNav = isVendorArea && isVendorAccount;
  const tabs = showVendorNav ? vendorTabs : customerTabs;

  return (
    <>
      {/* Overlay "Altro" — solo lato venditore, le voci restanti della dashboard */}
      {moreOpen && (
        <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setMoreOpen(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900">Altre sezioni</h3>
              <button onClick={() => setMoreOpen(false)} className="p-1.5 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {vendorMoreItems.map(item => {
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setMoreOpen(false)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-gray-50 text-center">
                    <div className="w-11 h-11 bg-accent rounded-full flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-[11px] text-gray-600 leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="grid grid-cols-5 h-16">
          {tabs.map((tabItem: any) => {
            const Icon = tabItem.icon;
            const isPath = 'path' in tabItem;
            const isActive = isPath && location.pathname === tabItem.path;
            const content = (
              <>
                <div className="relative">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                  {!!tabItem.badge && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                      {tabItem.badge > 9 ? '9+' : tabItem.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] leading-tight ${isActive ? 'text-primary font-medium' : 'text-gray-500'}`}>{tabItem.label}</span>
              </>
            );
            return isPath ? (
              <Link key={tabItem.path} to={tabItem.path} className="flex flex-col items-center justify-center gap-1">
                {content}
              </Link>
            ) : (
              <button key={tabItem.label} onClick={tabItem.onClick} className="flex flex-col items-center justify-center gap-1">
                {content}
              </button>
            );
          })}
          {showVendorNav && (
            <button onClick={() => setMoreOpen(true)} className="flex flex-col items-center justify-center gap-1">
              <MoreHorizontal className="w-5 h-5 text-gray-400" />
              <span className="text-[10px] text-gray-500 leading-tight">Altro</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
