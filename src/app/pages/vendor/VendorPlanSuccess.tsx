import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Loader2, AlertCircle, Shield } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const EDGE_URL = 'https://ckslkfshimzuujtpboui.supabase.co/functions/v1/make-server-000b3cfb';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrc2xrZnNoaW16dXVqdHBib3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTIwODIsImV4cCI6MjA5NDMyODA4Mn0.vhwaSLVWzVC9OGK7I4hE5V2P5H3A9V690YE9ELM-2eY';

export function VendorPlanSuccess() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const { user } = useAuth();
  const [status, setStatus] = useState<'loading'|'ok'|'error'>('loading');
  const [planId, setPlanId] = useState('');

  useEffect(() => { if (sessionId) activate(); else setStatus('error'); }, [sessionId]);

  const activate = async () => {
    try {
      const res = await fetch(`${EDGE_URL}/stripe/activate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPlanId(data.planId);
      setStatus('ok');
      // Ricarica la pagina dopo 3 secondi per aggiornare il profilo
      setTimeout(() => window.location.href = '/venditore/dashboard', 3000);
    } catch { setStatus('error'); }
  };

  if (status === 'loading') return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
      <p className="text-gray-600 font-medium">{t('vendor.activatingPlan')}</p>
    </div>
  );
  if (status === 'error') return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
      <h2 className="text-xl font-bold mb-2">{t('vendor.processingTitle')}</h2>
      <p className="text-gray-500 text-sm mb-4">{t('vendor.processingDesc')}</p>
      <Link to="/venditore/dashboard" className="px-6 py-3 bg-primary text-white rounded-xl font-semibold">{t('vendor.dashboardBtn')}</Link>
    </div>
  );

  const Icon = Shield;

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-primary p-10 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-bold">{t('vendor.sellerPlanActivated')}</h1>
        </div>
        <div className="p-8 space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
            <Icon className="w-6 h-6 text-primary flex-shrink-0" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">{t('vendor.sellerPlanLabel')}</p>
              <p className="text-sm text-gray-500">{t('vendor.unlimitedProductsMonthly')}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500">{t('vendor.redirectingIn3s')}</p>
          <Link to="/venditore/dashboard" className="block w-full py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 text-sm">
            {t('vendor.goToDashboard')}
          </Link>
        </div>
      </div>
    </div>
  );
}
