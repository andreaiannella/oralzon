import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { callEdge } from '../../lib/edgeApi';
import {
  GDashboard, GProducts, GAddProduct, GImportExcel, GOrders, GReturns,
  GReviews, GDiscounts, GPromotions, GStatistics, GPayments, GBilling, GSettings, GAcademy,
} from '../../lib/googleIcons';

// Icone Google Material (outlined, licenza Apache 2.0) per tutta la sidebar
// venditore — sostituiscono sia le Lucide generiche usate prima per le voci
// senza corrispondenza nel set brand, sia le icone PNG del set brand
// illustrato usate per le altre. Uniformi tutte allo stesso trattamento
// (fill="currentColor", stesso principio di Lucide) elimina la necessità
// del doppio binario icona-componente/immagine-PNG che c'era prima.
// La voce Academy ha in più il campo webOnly: true — l'Academy è pensata
// solo per il sito (desktop o mobile via browser), mai per l'app nativa;
// il filtro vero e proprio avviene nel componente sotto, così vale sia per
// la barra mobile sia per la sidebar desktop, indipendentemente dalla
// larghezza schermo (un controllo CSS da solo non basterebbe a coprire
// entrambi i casi in modo affidabile).
function useMenuItems(t: (key: string) => string) {
  return [
    { icon: GDashboard, label: t('vendor.dashboard'), path: '/venditore/dashboard' },
    { icon: GProducts, label: t('vendor.products'), path: '/venditore/prodotti' },
    { icon: GAddProduct, label: t('vendor.addProduct'), path: '/venditore/prodotti/nuovo' },
    { icon: GImportExcel, label: t('vendor.importExcel'), path: '/venditore/import-excel' },
    { icon: GOrders, label: t('vendor.orders'), path: '/venditore/ordini', badgeKey: 'pendingOrders' },
    { icon: GReturns, label: t('vendor.returns'), path: '/venditore/resi', badgeKey: 'pendingReturns' },
    { icon: GReviews, label: t('vendor.reviews'), path: '/venditore/recensioni' },
    { icon: GDiscounts, label: t('vendor.discounts'), path: '/venditore/sconti' },
    { icon: GPromotions, label: t('vendor.promotions'), path: '/venditore/promozioni' },
    { icon: GStatistics, label: t('vendor.statistics'), path: '/venditore/statistiche' },
    { icon: GPayments, label: t('vendor.payments'), path: '/venditore/pagamenti' },
    { icon: GBilling, label: t('vendor.salesReport'), path: '/venditore/fiscale' },
    { icon: GAcademy, label: 'Academy', path: '/venditore/academy', webOnly: true },
    { icon: GSettings, label: t('vendor.settings'), path: '/venditore/impostazioni' },
  ];
}

// Pallino rosso: segnala ordini da spedire o resi da valutare, in attesa da
// parte del venditore. Si aggiorna al caricamento della pagina e ogni 60s —
// non serve real-time vero per questo caso d'uso, un piccolo ritardo va bene.
function NotificationDot() {
  return <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />;
}

export function VendorSidebar() {
  const location = useLocation();
  const { t } = useTranslation();
  const isNative = Capacitor.isNativePlatform();
  const menuItems = useMenuItems(t).filter(item => !item.webOnly || !isNative);
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
      {/* Mobile: scroll orizzontale — nascosto nell'app nativa, dove la
          stessa navigazione è già coperta dalla barra fissa in basso
          (MobileBottomNav): tenerle entrambe sarebbe una ripetizione
          confusa per l'utente. Resta visibile solo sul sito web mobile. */}
      {!Capacitor.isNativePlatform() && (
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
                <Icon className="w-3.5 h-3.5" />
                {item.label}
                {badgeCount > 0 && <NotificationDot />}
              </Link>
            );
          })}
        </div>
      </div>
      )}

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
