import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, ArrowRight, Package, TrendingUp, Shield, Zap, Truck, BarChart3, Star } from 'lucide-react';

export function BecomeVendor() {
  const { t } = useTranslation();

  const benefits = [
    { icon: Package, title: t('becomeVendor.benefit1Title'), desc: t('becomeVendor.benefit1Desc') },
    { icon: TrendingUp, title: t('becomeVendor.benefit2Title'), desc: t('becomeVendor.benefit2Desc') },
    { icon: Shield, title: t('becomeVendor.benefit3Title'), desc: t('becomeVendor.benefit3Desc') },
    { icon: Zap, title: t('becomeVendor.benefit4Title'), desc: t('becomeVendor.benefit4Desc') },
    { icon: Truck, title: t('becomeVendor.benefit5Title'), desc: t('becomeVendor.benefit5Desc') },
    { icon: BarChart3, title: t('becomeVendor.benefit6Title'), desc: t('becomeVendor.benefit6Desc') },
  ];

  const steps = [
    { step: '01', title: t('becomeVendor.step1Title'), desc: t('becomeVendor.step1Desc') },
    { step: '02', title: t('becomeVendor.step2Title'), desc: t('becomeVendor.step2Desc') },
    { step: '03', title: t('becomeVendor.step3Title'), desc: t('becomeVendor.step3Desc') },
  ];

  const features = [
    t('becomeVendor.feature1'), t('becomeVendor.feature2'), t('becomeVendor.feature3'),
    t('becomeVendor.feature4'), t('becomeVendor.feature5'), t('becomeVendor.feature6'),
    t('becomeVendor.feature7'), t('becomeVendor.feature8'), t('becomeVendor.feature9'),
    t('becomeVendor.feature10'), t('becomeVendor.feature11'), t('becomeVendor.feature12'),
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary to-primary text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>

              <h1 className="text-5xl font-bold mb-6 leading-tight">
                {t('becomeVendor.heroTitle')}
              </h1>
              <p className="text-xl text-oralzon-pale-mint mb-8 leading-relaxed">
                {t('becomeVendor.heroSubtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <Link to="/registrazione-venditore" className="px-8 py-4 bg-white text-primary rounded-xl font-bold hover:bg-gray-100 transition-colors text-center">
                  {t('becomeVendor.startFreeTrial')}
                </Link>
                <Link to="/pricing-venditori" className="px-8 py-4 border-2 border-white/60 text-white rounded-xl font-semibold hover:bg-white/10 transition-colors text-center">
                  {t('becomeVendor.viewPlans')}
                </Link>
              </div>
              <div className="flex items-center gap-2 text-oralzon-pale-mint text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>{t('becomeVendor.noActivationFee')}</span>
              </div>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=800&q=80"
                alt="Fornitore prodotti odontoiatrici professionale"
                className="rounded-2xl shadow-2xl w-full object-cover max-h-96"
                onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=800&q=80'; }}
              />
              <div className="absolute -bottom-4 -left-4 bg-white rounded-xl p-4 shadow-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">{t('becomeVendor.newOrderReceived')}</p>
                    <p className="text-xs text-gray-500">Studio Dr. Bianchi · €234,00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">{t('becomeVendor.whyTitle')}</h2>
            <p className="text-xl text-gray-500">{t('becomeVendor.whySubtitle')}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="bg-white rounded-xl p-8 border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-5">
                  <benefit.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Come funziona */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">{t('becomeVendor.howItWorksTitle')}</h2>
            <p className="text-gray-500">{t('becomeVendor.howItWorksSubtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-5">
                  {step.step}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 -right-4">
                    <ArrowRight className="w-8 h-8 text-primary/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-4">{t('becomeVendor.featuresTitle')}</h2>
              <p className="text-xl text-gray-500 mb-8">{t('becomeVendor.featuresSubtitle')}</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-700 text-sm">{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1629909615184-74f495363b67?w=800&q=80"
                alt="Strumenti odontoiatrici professionali"
                className="rounded-2xl shadow-xl w-full object-cover max-h-96"
                onError={e => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800'; }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Pricing preview */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">{t('becomeVendor.planSectionTitle')}</h2>
            <p className="text-gray-500">{t('becomeVendor.planSectionSubtitle')}</p>
          </div>
          <div className="max-w-md mx-auto">
            {/* Piano unico */}
            <div className="bg-primary text-white rounded-2xl p-8 shadow-2xl shadow-primary/30 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">{t('becomeVendor.launchBadge')}</div>
              <h3 className="text-2xl font-bold mb-2">{t('becomeVendor.vendorPlanTitle')}</h3>
              <div className="text-4xl font-bold mb-1">€129<span className="text-lg opacity-80 font-normal">{t('becomeVendor.perMonth')}</span></div>
              <p className="text-sm text-oralzon-pale-mint font-medium mb-6">{t('becomeVendor.unlimitedProducts')}</p>
              <ul className="space-y-2 mb-8 text-sm">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {t('becomeVendor.unlimitedProducts')}</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {t('becomeVendor.bulkUploadExcel')}</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {t('becomeVendor.verifiedBadgeFeature')}</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {t('becomeVendor.advancedStats')}</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {t('becomeVendor.prioritySupport')}</li>
              </ul>
              <Link to="/pricing-venditori" className="block w-full px-6 py-3 bg-white text-primary rounded-xl hover:bg-gray-100 transition-colors text-center font-bold">
                {t('becomeVendor.buyNow')}
              </Link>
            </div>
          </div>
          <p className="text-center text-gray-500 text-sm mt-8">
            {t('becomeVendor.allPlansInclude')}
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary to-primary text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">{t('becomeVendor.finalCtaTitle')}</h2>
          <p className="text-xl mb-8 text-oralzon-pale-mint">{t('becomeVendor.finalCtaSubtitle')}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/registrazione-venditore" className="px-8 py-4 bg-white text-primary rounded-xl font-bold hover:bg-gray-100 transition-colors">
              {t('becomeVendor.registerFree')}
            </Link>
            <Link to="/contatti" className="px-8 py-4 border-2 border-white/60 text-white rounded-xl hover:bg-white/10 transition-colors">
              {t('becomeVendor.talkToTeam')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
