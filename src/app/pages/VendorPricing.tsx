import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Check, X, Sparkles, Loader2, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const EDGE_URL = 'https://ckslkfshimzuujtpboui.supabase.co/functions/v1/make-server-000b3cfb';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrc2xrZnNoaW16dXVqdHBib3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTIwODIsImV4cCI6MjA5NDMyODA4Mn0.vhwaSLVWzVC9OGK7I4hE5V2P5H3A9V690YE9ELM-2eY';

export function VendorPricing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [loadingPromo, setLoadingPromo] = useState<string | null>(null);

  const handlePlanCheckout = async (planId: string) => {
    if (!user) { navigate('/login'); return; }
    setLoadingPlan(planId);
    try {
      const res = await fetch(`${EDGE_URL}/stripe/create-plan-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
        body: JSON.stringify({ planId, userId: user.id, appOrigin: window.location.origin }),
      });
      const data = await res.json();
      if (data.success && data.sessionUrl) window.location.href = data.sessionUrl;
      else alert(data.error || t('vendorPricing.genericError'));
    } catch { alert(t('vendorPricing.connectionError')); }
    finally { setLoadingPlan(null); }
  };

  const handlePromoCheckout = async (pkg: any) => {
    if (!user) { navigate('/login'); return; }
    setLoadingPromo(pkg.id);
    try {
      const res = await fetch(`${EDGE_URL}/stripe/create-promo-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${ANON_KEY}` },
        body: JSON.stringify({ packageId: pkg.id, packageTitle: pkg.title, price: pkg.price, vendorId: user.id, appOrigin: window.location.origin }),
      });
      const data = await res.json();
      if (data.success && data.sessionUrl) window.location.href = data.sessionUrl;
      else alert(data.error || t('vendorPricing.genericError'));
    } catch { alert(t('vendorPricing.connectionError')); }
    finally { setLoadingPromo(null); }
  };

  const plans = [
    {
      id: 'professional', name: t('vendorPricing.vendorPlanName'), price: '129', period: t('vendorPricing.perMonth'),
      description: t('vendorPricing.planDescription'), badge: t('vendorPricing.launchBadge'),
      badgeColor: 'bg-secondary', icon: Shield, popular: true,
      cta: t('vendorPricing.buyNow'), ctaStyle: 'bg-primary text-white hover:bg-primary/90',
      products: '∞',
      features: [
        { name: t('vendorPricing.unlimitedProducts'), ok: true },
        { name: t('vendorPricing.advancedVendorDashboard'), ok: true },
        { name: t('vendorPricing.fullOrderManagement'), ok: true },
        { name: t('vendorPricing.bulkUploadExcel'), ok: true },
        { name: t('vendorPricing.verifiedBadgeFeature'), ok: true },
        { name: t('vendorPricing.advancedStats'), ok: true },
        { name: t('vendorPricing.prioritySupport'), ok: true },
      ]
    }
  ];

  const promoPackages = [
    { id: 'featured_monthly', title: t('vendorPricing.featuredMonthlyTitle'), desc: t('vendorPricing.featuredMonthlyDesc'), price: 99, period: t('vendorPricing.perMonth') },
    { id: 'featured_quarterly', title: t('vendorPricing.featuredQuarterlyTitle'), desc: t('vendorPricing.featuredQuarterlyDesc'), price: 249, period: t('vendorPricing.perThreeMonths'), badge: t('vendorPricing.save15') },
    { id: 'homepage_monthly', title: t('vendorPricing.homepageWeeklyTitle'), desc: t('vendorPricing.homepageWeeklyDesc'), price: 199, period: t('vendorPricing.perWeek') },
    { id: 'homepage_fixed', title: t('vendorPricing.homepageFixedTitle'), desc: t('vendorPricing.homepageFixedDesc'), price: 699, period: t('vendorPricing.perMonth'), badge: t('vendorPricing.save12') },
    { id: 'category_single', title: t('vendorPricing.categorySingleTitle'), desc: t('vendorPricing.categorySingleDesc'), price: 149, period: t('vendorPricing.perMonth') },
    { id: 'category_multi', title: t('vendorPricing.categoryMultiTitle'), desc: t('vendorPricing.categoryMultiDesc'), price: 399, period: t('vendorPricing.perMonth'), badge: t('vendorPricing.save10') },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white py-16 text-center px-4">
        <h1 className="text-4xl font-bold mb-3">{t('vendorPricing.chooseYourPlan')}</h1>
        <p className="text-lg opacity-90 max-w-2xl mx-auto">{t('vendorPricing.plansSubtitle')}</p>
        <div className="inline-flex items-center gap-2 mt-4 bg-white/20 px-4 py-2 rounded-full text-sm">
          <Check className="w-4 h-4" /> {t('vendorPricing.sixMonthsFreeLaunch')}
        </div>
      </div>

      <section className="py-16 px-4">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-1 gap-8">
            {plans.map(plan => {
              const Icon = plan.icon;
              const isPayable = plan.id === 'professional';
              return (
                <div key={plan.id} className={`relative rounded-2xl border-2 p-8 flex flex-col ${plan.popular ? 'border-primary shadow-2xl shadow-primary/20 scale-105' : 'border-gray-200'}`}>
                  {plan.badge && (
                    <div className={`absolute -top-4 left-1/2 -translate-x-1/2 ${plan.badgeColor} text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap`}>{plan.badge}</div>
                  )}
                  <div className="mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${plan.popular ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{plan.description}</p>
                  </div>
                  <div className="mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-gray-900">€{plan.price}</span>
                      <span className="text-gray-500">{plan.period}</span>
                    </div>
                    <p className="text-sm text-primary font-medium mt-1">
                      {t('vendorPricing.unlimitedProducts')}
                    </p>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f.name} className="flex items-start gap-3 text-sm">
                        {f.ok ? <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> : <X className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />}
                        <span className={f.ok ? 'text-gray-700' : 'text-gray-400'}>{f.name}</span>
                      </li>
                    ))}
                  </ul>
                  {isPayable ? (
                    <button onClick={() => handlePlanCheckout(plan.id)} disabled={loadingPlan === plan.id}
                      className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${plan.ctaStyle}`}>
                      {loadingPlan === plan.id ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('vendorPricing.preparing')}</> : plan.cta}
                    </button>
                  ) : (
                    <Link to="/registrazione-venditore" className={`block text-center w-full py-3 rounded-xl font-semibold transition-colors ${plan.ctaStyle}`}>{plan.cta}</Link>
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-10 p-6 bg-green-50 border border-green-200 rounded-2xl text-center">
            <p className="font-bold text-green-800 text-lg mb-1">{t('vendorPricing.sixMonthsGiftTitle')}</p>
            <p className="text-green-700 text-sm">{t('vendorPricing.sixMonthsGiftDesc')}</p>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold">{t('vendorPricing.increaseVisibility')}</h2>
            <p className="text-gray-500 mt-2">{t('vendorPricing.visibilitySubtitle')}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {promoPackages.map(pkg => (
              <div key={pkg.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-all flex flex-col">
                {(pkg as any).badge && <span className="self-start text-xs bg-green-100 text-green-700 font-medium px-2.5 py-1 rounded-full mb-3">{(pkg as any).badge}</span>}
                <h3 className="font-bold text-gray-900 text-sm mb-1">{pkg.title}</h3>
                <p className="text-xs text-gray-500 mb-4 flex-1">{pkg.desc}</p>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-2xl font-bold text-primary">€{pkg.price}</span>
                  <span className="text-gray-400 text-sm">{pkg.period}</span>
                </div>
                <button onClick={() => handlePromoCheckout(pkg)} disabled={loadingPromo === pkg.id}
                  className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                  {loadingPromo === pkg.id ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('vendorPricing.preparing')}</> : t('vendorPricing.buyNow')}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
