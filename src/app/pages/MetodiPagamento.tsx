import { useTranslation } from 'react-i18next';
import { CreditCard, Smartphone, Landmark, Lock, CheckCircle } from 'lucide-react';

// Le stringhe tradotte usano **testo** per indicare il grassetto (evita di
// dover duplicare markup JSX identico in 10 lingue diverse).
function Bold({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return <>{parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}</>;
}

export function MetodiPagamento() {
  const { t } = useTranslation();

  const methods = [
    { icon: CreditCard, title: t('metodiPagamento.m1Title'), desc: t('metodiPagamento.m1Desc') },
    { icon: Smartphone, title: t('metodiPagamento.m2Title'), desc: t('metodiPagamento.m2Desc') },
    { icon: Landmark, title: t('metodiPagamento.m3Title'), desc: t('metodiPagamento.m3Desc') },
    { icon: Lock, title: t('metodiPagamento.m4Title'), desc: t('metodiPagamento.m4Desc') },
  ];

  const secItems = [
    t('metodiPagamento.sec1'), t('metodiPagamento.sec2'), t('metodiPagamento.sec3'),
    t('metodiPagamento.sec4'), t('metodiPagamento.sec5'),
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{t('metodiPagamento.pageTitle')}</h1>
      <p className="text-gray-500 text-sm mb-8">{t('metodiPagamento.pageSubtitle')}</p>
      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">

        <section className="bg-accent border border-oralzon-mint-fresh/30 rounded-xl p-6">
          <h2 className="text-lg font-bold text-oralzon-steel-ink mb-3">{t('metodiPagamento.secureTitle')}</h2>
          <p><Bold text={t('metodiPagamento.secureP1')} /></p>
          <p className="mt-2"><Bold text={t('metodiPagamento.secureP2')} /></p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('metodiPagamento.acceptedMethods')}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {methods.map(m => (
              <div key={m.title} className="border border-gray-200 rounded-xl p-4">
                <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center mb-2"><m.icon className="w-5 h-5 text-primary" /></div>
                <h3 className="font-bold text-gray-900 mb-1">{m.title}</h3>
                <p className="text-xs text-gray-500">{m.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('metodiPagamento.securityTitle')}</h2>
          <ul className="space-y-2">
            {secItems.map((s, i) => (
              <li key={i} className="flex items-start gap-3"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /><span>{s}</span></li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('metodiPagamento.timingTitle')}</h2>
          <div className="space-y-3">
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg"><span className="font-medium text-gray-700 w-32 flex-shrink-0">{t('metodiPagamento.chargeLabel')}</span><span>{t('metodiPagamento.chargeDesc')}</span></div>
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg"><span className="font-medium text-gray-700 w-32 flex-shrink-0">{t('metodiPagamento.refundLabel')}</span><span>{t('metodiPagamento.refundDesc')}</span></div>
            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg"><span className="font-medium text-gray-700 w-32 flex-shrink-0">{t('metodiPagamento.subscriptionsLabel')}</span><span>{t('metodiPagamento.subscriptionsDesc')}</span></div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('metodiPagamento.billingTitle')}</h2>
          <p>{t('metodiPagamento.billingP1')}</p>
          <p className="mt-2">{t('metodiPagamento.billingContact')} <strong>support@oralzon.com</strong></p>
        </section>

      </div>
    </div>
  );
}
