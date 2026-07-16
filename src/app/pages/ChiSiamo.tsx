import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Users, Zap, TrendingUp, Star, ArrowRight } from 'lucide-react';

export function ChiSiamo() {
  const { t } = useTranslation();

  const features = [
    { icon: Shield, title: t('chiSiamo.feat1Title'), desc: t('chiSiamo.feat1Desc') },
    { icon: Zap, title: t('chiSiamo.feat2Title'), desc: t('chiSiamo.feat2Desc') },
    { icon: Users, title: t('chiSiamo.feat3Title'), desc: t('chiSiamo.feat3Desc') },
    { icon: TrendingUp, title: t('chiSiamo.feat4Title'), desc: t('chiSiamo.feat4Desc') },
  ];

  const stats = [
    { num: '100%', label: t('chiSiamo.stat1Label'), text: t('chiSiamo.stat1Text') },
    { num: 'B2B', label: t('chiSiamo.stat2Label'), text: t('chiSiamo.stat2Text') },
    { num: '24/7', label: t('chiSiamo.stat3Label'), text: t('chiSiamo.stat3Text') },
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#003366] via-[#0055AA] to-[#0077CC] text-white py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-oralzon-pale-mint uppercase tracking-widest text-sm font-medium mb-4">{t('chiSiamo.kicker')}</p>
          <h1 className="text-5xl font-bold mb-6 leading-tight">
            {t('chiSiamo.heroTitle')}
          </h1>
          <p className="text-xl text-oralzon-pale-mint max-w-2xl mx-auto leading-relaxed">
            {t('chiSiamo.heroSubtitle')}
          </p>
        </div>
      </section>

      {/* Missione */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-primary font-semibold uppercase tracking-wide text-sm mb-3">{t('chiSiamo.missionKicker')}</p>
              <h2 className="text-4xl font-bold text-gray-900 mb-6 leading-tight">
                {t('chiSiamo.missionTitle')}
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                {t('chiSiamo.missionP1')}
              </p>
              <p className="text-gray-600 leading-relaxed mb-6">
                {t('chiSiamo.missionP2')}
              </p>
              <Link to="/negozio" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">
                {t('chiSiamo.exploreCatalog')} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {features.map(item => (
                <div key={item.title} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-3">
                    <item.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Perché sceglierci */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-primary font-semibold uppercase tracking-wide text-sm mb-3">{t('chiSiamo.whyKicker')}</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('chiSiamo.whyTitle')}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-14 leading-relaxed">
            {t('chiSiamo.whyDesc')}
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-left">
            {stats.map(item => (
              <div key={item.num} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                <div className="text-4xl font-bold text-primary mb-2">{item.num}</div>
                <div className="font-bold text-gray-900 mb-3">{item.label}</div>
                <p className="text-gray-500 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Per i venditori */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-primary to-primary rounded-3xl p-12 text-white">
            <div className="max-w-2xl">
              <p className="text-oralzon-pale-mint uppercase tracking-wide text-sm font-medium mb-3">{t('chiSiamo.vendorsKicker')}</p>
              <h2 className="text-3xl font-bold mb-4">{t('chiSiamo.vendorsTitle')}</h2>
              <p className="text-oralzon-pale-mint leading-relaxed mb-6">
                {t('chiSiamo.vendorsDesc')}
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link to="/diventa-venditore" className="px-6 py-3 bg-white text-primary rounded-xl font-semibold hover:bg-gray-100 transition-colors">
                  {t('chiSiamo.sellOnOralzon')}
                </Link>
                <Link to="/pricing-venditori" className="px-6 py-3 border-2 border-white/50 text-white rounded-xl hover:bg-white/10 transition-colors">
                  {t('chiSiamo.discoverPlans')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Per gli acquirenti */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-primary font-semibold uppercase tracking-wide text-sm mb-3">{t('chiSiamo.buyersKicker')}</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('chiSiamo.buyersTitle')}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            {t('chiSiamo.buyersDesc')}
          </p>
          <div className="flex items-center justify-center gap-2 mb-8">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
            <span className="text-gray-600 text-sm ml-2">{t('chiSiamo.chosenBy')}</span>
          </div>
          <Link to="/negozio" className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors text-lg">
            {t('chiSiamo.startBuying')} <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

    </div>
  );
}
