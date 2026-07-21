import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { AuthProvider } from '../contexts/AuthContext';
import { CartProvider } from '../contexts/CartContext';
import { MarketplaceHeader } from './components/MarketplaceHeader';
import { Footer } from './components/Footer';
import { VendorLayout } from './components/VendorLayout';
import { AccountLayout } from './components/AccountLayout';
import { CookieBanner } from './components/CookieBanner';
import { usePushNotifications } from '../lib/usePushNotifications';
import { MobileBottomNav } from './components/MobileBottomNav';

// Attiva le notifiche push solo dentro l'app nativa (l'hook stesso non fa
// nulla sul sito web) — va montato dentro AuthProvider perché ha bisogno di
// sapere chi è l'utente loggato per registrare il token al profilo giusto.
function NativeAppBootstrap() {
  usePushNotifications();
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    document.body.classList.add('native-app');

    // Blocca pinch-zoom e doppio-tap-zoom SOLO dentro l'app nativa — sul
    // sito web il tag statico in index.html resta invariato, zoomabile per
    // accessibilità. Qui sostituiamo il contenuto del tag a runtime.
    const viewportTag = document.querySelector('meta[name="viewport"]');
    if (viewportTag) {
      viewportTag.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover');
    }

    (async () => {
      const { SplashScreen } = await import('@capacitor/splash-screen');
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await SplashScreen.hide();
      try { await StatusBar.setStyle({ style: Style.Light }); } catch { /* non disponibile su alcuni dispositivi, non bloccante */ }
    })();
  }, []);
  return <MobileBottomNav />;
}

// PERFORMANCE: ogni pagina viene caricata solo quando serve (code-splitting per
// rotta), invece che tutte insieme in un unico file JS scaricato da ogni
// visitatore fin dal primo caricamento — anche solo per vedere la home.
// I soli componenti "di cornice" (header, footer, layout, ScrollToTop) restano
// import diretti perché servono su ogni pagina comunque.
const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const Shop = lazy(() => import('./pages/Shop').then(m => ({ default: m.Shop })));
const VendorStore = lazy(() => import('./pages/VendorStore').then(m => ({ default: m.VendorStore })));
const Product = lazy(() => import('./pages/Product').then(m => ({ default: m.Product })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const Offers = lazy(() => import('./pages/Offers').then(m => ({ default: m.Offers })));
const Bestseller = lazy(() => import('./pages/Bestseller').then(m => ({ default: m.Bestseller })));
const NewArrivals = lazy(() => import('./pages/NewArrivals').then(m => ({ default: m.NewArrivals })));
const Cart = lazy(() => import('./pages/Cart').then(m => ({ default: m.Cart })));
const Checkout = lazy(() => import('./pages/Checkout').then(m => ({ default: m.Checkout })));
const Wishlist = lazy(() => import('./pages/Wishlist').then(m => ({ default: m.Wishlist })));
const UserProfile = lazy(() => import('./pages/UserProfile').then(m => ({ default: m.UserProfile })));
const AccountSettings = lazy(() => import('./pages/AccountSettings').then(m => ({ default: m.AccountSettings })));
const BecomeVendor = lazy(() => import('./pages/BecomeVendor').then(m => ({ default: m.BecomeVendor })));
const VendorPricing = lazy(() => import('./pages/VendorPricing').then(m => ({ default: m.VendorPricing })));
const OldVendorDashboard = lazy(() => import('./pages/VendorDashboard').then(m => ({ default: m.VendorDashboard })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const CustomerOrders = lazy(() => import('./pages/CustomerOrders').then(m => ({ default: m.CustomerOrders })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const RegisterVendor = lazy(() => import('./pages/RegisterVendor').then(m => ({ default: m.RegisterVendor })));
const VendorDashboard = lazy(() => import('./pages/vendor/VendorDashboard').then(m => ({ default: m.VendorDashboard })));
const VendorProducts = lazy(() => import('./pages/vendor/VendorProducts').then(m => ({ default: m.VendorProducts })));
const VendorAddProduct = lazy(() => import('./pages/vendor/VendorAddProduct').then(m => ({ default: m.VendorAddProduct })));
const VendorEditProduct = lazy(() => import('./pages/vendor/VendorEditProduct').then(m => ({ default: m.VendorEditProduct })));
const VendorImportExcel = lazy(() => import('./pages/vendor/VendorImportExcel').then(m => ({ default: m.VendorImportExcel })));
const VendorPromoSuccess = lazy(() => import('./pages/vendor/VendorPromoSuccess').then(m => ({ default: m.VendorPromoSuccess })));
const VendorOrders = lazy(() => import('./pages/vendor/VendorOrders').then(m => ({ default: m.VendorOrders })));
const VendorReviews = lazy(() => import('./pages/vendor/VendorReviews').then(m => ({ default: m.VendorReviews })));
const VendorPromotions = lazy(() => import('./pages/vendor/VendorPromotions').then(m => ({ default: m.VendorPromotions })));
const VendorStats = lazy(() => import('./pages/vendor/VendorStats').then(m => ({ default: m.VendorStats })));
const VendorPayments = lazy(() => import('./pages/vendor/VendorPayments').then(m => ({ default: m.VendorPayments })));
const VendorSettings = lazy(() => import('./pages/vendor/VendorSettings').then(m => ({ default: m.VendorSettings })));
const VendorFiscale = lazy(() => import('./pages/vendor/VendorFiscale').then(m => ({ default: m.VendorFiscale })));
const DatabaseSetup = lazy(() => import('./pages/DatabaseSetup').then(m => ({ default: m.DatabaseSetup })));
const SetupRequired = lazy(() => import('./pages/SetupRequired').then(m => ({ default: m.SetupRequired })));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess').then(m => ({ default: m.OrderSuccess })));
const FAQ = lazy(() => import('./pages/FAQ').then(m => ({ default: m.FAQ })));
const ChiSiamo = lazy(() => import('./pages/ChiSiamo').then(m => ({ default: m.ChiSiamo })));
const CondizioniVendita = lazy(() => import('./pages/CondizioniVendita').then(m => ({ default: m.CondizioniVendita })));
const VendorPlanSuccess = lazy(() => import('./pages/vendor/VendorPlanSuccess').then(m => ({ default: m.VendorPlanSuccess })));
const MetodiPagamento = lazy(() => import('./pages/MetodiPagamento').then(m => ({ default: m.MetodiPagamento })));
const InfoSpedizione = lazy(() => import('./pages/InfoSpedizione').then(m => ({ default: m.InfoSpedizione })));
const ResiRimborsi = lazy(() => import('./pages/ResiRimborsi').then(m => ({ default: m.ResiRimborsi })));
const VendorReturns = lazy(() => import('./pages/vendor/VendorReturns').then(m => ({ default: m.VendorReturns })));
const Privacy = lazy(() => import('./pages/Privacy').then(m => ({ default: m.Privacy })));
const Cookie = lazy(() => import('./pages/Cookie').then(m => ({ default: m.Cookie })));
const Terms = lazy(() => import('./pages/Terms').then(m => ({ default: m.Terms })));
const Blog = lazy(() => import('./pages/Blog').then(m => ({ default: m.Blog })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));
const BlogArticle = lazy(() => import('./pages/BlogArticle').then(m => ({ default: m.BlogArticle })));

// Scroll to top ad ogni cambio di pagina
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

// Fallback minimale durante il caricamento del chunk di una rotta — dura
// tipicamente pochi millisecondi su una connessione normale dopo il primo
// caricamento (i chunk restano in cache del browser tra una navigazione e l'altra).
function RouteLoading() {
  return (
    <div className="flex items-center justify-center py-24">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
        <NativeAppBootstrap />
        <ScrollToTop />
        <Suspense fallback={<RouteLoading />}>
        <Routes>
          {/* Public routes with marketplace header/footer */}
          <Route path="/*" element={
            <div className="min-h-screen flex flex-col">
              <MarketplaceHeader />
              <main className="flex-1">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/negozio" element={<Shop />} />
                  <Route path="/negozio/prodotto/:id" element={<Product />} />
                  <Route path="/negozio/venditore/:vendorId" element={<VendorStore />} />
                  <Route path="/negozio/categoria/:category" element={<Shop />} />
                  <Route path="/offerte" element={<Offers />} />
                  <Route path="/bestseller" element={<Bestseller />} />
                  <Route path="/nuovi-arrivi" element={<NewArrivals />} />
                  <Route path="/carrello" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/contatti" element={<Contact />} />
                  <Route path="/diventa-venditore" element={<BecomeVendor />} />
                  <Route path="/pricing-venditori" element={<VendorPricing />} />
                  <Route path="/registrazione-venditore" element={<RegisterVendor />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/registrazione" element={<Register />} />
                  <Route path="/database-setup" element={<DatabaseSetup />} />
                  <Route path="/setup" element={<SetupRequired />} />
                  <Route path="/ordine-completato" element={<OrderSuccess />} />
                  <Route path="/venditore/promozione-attivata" element={<VendorPromoSuccess />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:slug" element={<BlogArticle />} />
                  <Route path="/password-dimenticata" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="*" element={<NotFound />} />
                  <Route path="/faq" element={<FAQ />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/cookie" element={<Cookie />} />
                  <Route path="/termini" element={<Terms />} />
                  <Route path="/chi-siamo" element={<ChiSiamo />} />
                  <Route path="/condizioni-vendita" element={<CondizioniVendita />} />
                  <Route path="/metodi-pagamento" element={<MetodiPagamento />} />
                  <Route path="/info-spedizione" element={<InfoSpedizione />} />
                  <Route path="/resi" element={<ResiRimborsi />} />
                  <Route path="/venditore/piano-attivato" element={<VendorPlanSuccess />} />
                </Routes>

              </main>
              <CookieBanner />
              <Footer />
            </div>
          } />

          {/* Account routes with sidebar */}
          <Route path="/account" element={<AccountLayout />}>
            <Route path="profilo" element={<UserProfile />} />
            <Route path="ordini" element={<CustomerOrders />} />
            <Route path="ordini/:id" element={<CustomerOrders />} />
            <Route path="preferiti" element={<Wishlist />} />
            <Route path="impostazioni" element={<AccountSettings />} />
          </Route>

          {/* Vendor routes with sidebar */}
          <Route path="/venditore" element={<VendorLayout />}>
            <Route path="dashboard" element={<VendorDashboard />} />
            <Route path="prodotti" element={<VendorProducts />} />
            <Route path="prodotti/nuovo" element={<VendorAddProduct />} />
            <Route path="prodotti/:id/modifica" element={<VendorEditProduct />} />
            <Route path="import-excel" element={<VendorImportExcel />} />
            <Route path="resi" element={<VendorReturns />} />
            <Route path="ordini" element={<VendorOrders />} />
            <Route path="recensioni" element={<VendorReviews />} />
            <Route path="promozioni" element={<VendorPromotions />} />
            <Route path="statistiche" element={<VendorStats />} />
            <Route path="pagamenti" element={<VendorPayments />} />
            <Route path="impostazioni" element={<VendorSettings />} />
            <Route path="fiscale" element={<VendorFiscale />} />
          </Route>

          {/* Old Dashboard routes without header/footer */}
          <Route path="/dashboard-venditore" element={<OldVendorDashboard />} />
          <Route path="/dashboard-admin" element={<AdminDashboard />} />
        </Routes>
        </Suspense>
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
