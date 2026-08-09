import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wallet, CheckCircle2, AlertCircle, Loader2, ExternalLink, Clock, ArrowDownToLine } from 'lucide-react';
import { callEdge } from '../../../lib/edgeApi';

interface ConnectStatus {
  vendor: {
    stripe_account_id: string | null;
    stripe_charges_enabled: boolean;
    stripe_payouts_enabled: boolean;
    stripe_details_submitted: boolean;
    commission_pct: number;
  };
  transfers: Array<{
    id: string;
    gross_amount: number;
    commission_amount: number;
    net_amount: number;
    status: string;
    reversed_amount: number;
    created_at: string;
  }>;
  pendingNet: number;
}

export function VendorPayments() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [params] = useSearchParams();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const json = await callEdge('/stripe/connect/status', { method: 'GET' });
      if (json.success) setStatus(json as any);
      else setError(json.error || t('vendor.loadPaymentStatusError'));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError('');
    try {
      const json = await callEdge('/stripe/connect/onboard', { method: 'POST' });
      if (json.success && json.url) {
        window.location.href = json.url; // redirect all'onboarding ospitato da Stripe
      } else {
        setError(json.error || t('vendor.cannotStartStripeConnection'));
        setConnecting(false);
      }
    } catch (e: any) {
      setError(e.message);
      setConnecting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const v = status?.vendor;
  const isFullyActive = v?.stripe_charges_enabled && v?.stripe_payouts_enabled;
  const isPending = v?.stripe_account_id && v?.stripe_details_submitted && !isFullyActive;
  const notStarted = !v?.stripe_account_id;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Wallet className="w-6 h-6 text-primary" /> {t('vendor.payments')}</h1>
        <p className="text-muted-foreground mt-1">{t('vendor.paymentsSubtitle')}</p>
      </div>

      {params.get('onboarding') === 'complete' && (
        <div className="bg-accent border border-primary/20 rounded-xl p-4 text-sm text-oralzon-steel-ink">
          {t('vendor.onboardingCompleteMsg')}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Stato collegamento */}
      <div className="bg-white rounded-xl border border-border p-6">
        {isFullyActive ? (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">{t('vendor.accountConnectedActive')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('vendor.accountConnectedActiveDesc')}</p>
            </div>
          </div>
        ) : isPending ? (
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">{t('vendor.stripeVerifying')}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('vendor.stripeVerifyingDesc')}</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">{t('vendor.connectAccountTitle')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {notStarted
                    ? t('vendor.connectAccountDescNotStarted')
                    : t('vendor.connectAccountDescResume')}
                </p>
              </div>
            </div>
            <button onClick={handleConnect} disabled={connecting}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60">
              {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              {notStarted ? t('vendor.connectStripeBtn') : t('vendor.resumeConnectionBtn')}
            </button>
          </div>
        )}
      </div>

      {/* Fondi in sospeso */}
      {(status?.pendingNet ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <ArrowDownToLine className="w-5 h-5 text-oralzon-chrome-silver flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">{t('vendor.pendingTransferAmount', { amount: status!.pendingNet.toFixed(2) })}</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {notStarted || isPending
                  ? t('vendor.pendingTransferDescNotActive')
                  : t('vendor.pendingTransferDescConfirmed')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Aiuto — via d'uscita per chi si blocca nell'onboarding, invece di abbandonare in silenzio */}
      <div className="bg-accent/50 border border-primary/10 rounded-xl p-4 text-sm text-oralzon-steel-ink">
        <p className="font-medium mb-1">{t('vendor.stuckHelpTitle')}</p>
        <p className="text-muted-foreground">
          {t('vendor.stuckHelpDesc')} <a href="mailto:support@oralzon.com" className="text-primary hover:underline font-medium">support@oralzon.com</a>.
        </p>
      </div>
    </div>
  );
}
