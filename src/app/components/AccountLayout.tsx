import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { AccountSidebar } from './AccountSidebar';
import { MarketplaceHeader } from './MarketplaceHeader';
import { Footer } from './Footer';
import { useAuth } from '../../contexts/AuthContext';

export function AccountLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Aspetta che AuthContext abbia verificato la sessione prima di decidere:
  // altrimenti un utente loggato vedrebbe un lampo di redirect al login al refresh.
  if (loading) return null;

  // Nessun utente autenticato: non ha senso mostrare "modifica profilo" o "i miei
  // ordini" senza un profilo/ordini a cui riferirsi. Manda al login, ricordando
  // dove voleva andare per riportarcelo dopo l'accesso.
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <MarketplaceHeader />
      {/* Mobile: tabs orizzontali; Desktop: sidebar + content */}
      <div className="flex flex-col md:flex-row flex-1">
        <AccountSidebar />
        <main className="flex-1 px-4 py-4 md:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
      {/* Il footer del sito non ha senso dentro l'app nativa (link legali,
          colonne desktop, ecc.) — stesso criterio già usato in App.tsx. */}
      {!Capacitor.isNativePlatform() && <Footer />}
    </div>
  );
}
