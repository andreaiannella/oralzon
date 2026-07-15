import { Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Wallet, ArrowRight } from 'lucide-react';
import { VendorSidebar } from './VendorSidebar';
import { MarketplaceHeader } from './MarketplaceHeader';
import { TrialBanner } from './TrialBanner';
import { getCurrentVendor, getTrialStatus, TrialStatus } from '../../lib/vendor';
import { useAuth } from '../../contexts/AuthContext';

export function VendorLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null);
  const [payoutsEnabled, setPayoutsEnabled] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    getCurrentVendor().then(vendor => {
      setTrialStatus(getTrialStatus(vendor));
      setPayoutsEnabled(vendor ? !!(vendor as any).stripe_payouts_enabled : null);
    });
  }, [user]);

  if (loading) return null;
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  const showPayoutsBanner = payoutsEnabled === false && location.pathname !== '/venditore/pagamenti';

  return (
    <div className="min-h-screen bg-gray-50">
      <MarketplaceHeader />
      {trialStatus && <TrialBanner status={trialStatus} />}
      {showPayoutsBanner && (
        <div className="bg-oralzon-steel-ink text-white px-6 py-2.5 flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 flex-shrink-0 text-oralzon-pale-mint" />
            <span>Collega il tuo conto Stripe per ricevere i pagamenti delle vendite.</span>
          </div>
          <Link to="/venditore/pagamenti" className="flex items-center gap-1 text-oralzon-pale-mint hover:text-white font-medium whitespace-nowrap flex-shrink-0">
            Collega ora <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
      <div className="flex flex-col md:flex-row">
        <VendorSidebar />
        <main className="flex-1 px-4 py-4 md:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
