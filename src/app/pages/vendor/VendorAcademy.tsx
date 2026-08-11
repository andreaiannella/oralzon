import { Link } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Laptop } from 'lucide-react';
import { getLocalizedGuides } from '../../../lib/academyLocalization';
import {
  GDashboard, GStatistics, GBilling, GPromotions, GDiscounts, GRocket,
} from '../../../lib/googleIcons';

// Un'icona per guida — riusa le stesse icone Google già ufficiali nel resto
// del pannello, così l'Academy non introduce un nuovo linguaggio visivo.
const GUIDE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  iniziare: GDashboard,
  vendite: GStatistics,
  fatturazione: GBilling,
  marketing: GPromotions,
  sconti: GDiscounts,
  sponsorizzazioni: GRocket,
};

// L'Academy vive solo sul sito web (desktop o mobile via browser) — mai
// nell'app nativa. Non è una limitazione tecnica del contenuto in sé (sono
// solo pagine di testo, funzionerebbero benissimo anche nell'app), ma una
// scelta esplicita: tenere l'app nativa concentrata sulle operazioni
// quotidiane (ordini, prodotti, resi), senza appesantirla con contenuti
// editoriali che si leggono meglio con più spazio e senza fretta.
export function AcademyWebOnlyNotice() {
  const { t } = useTranslation();
  return (
    <div className="max-w-md mx-auto text-center py-16 px-4">
      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
        <Laptop className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">{t('vendor.academyWebOnlyTitle')}</h1>
      <p className="text-gray-500 text-sm">{t('vendor.academyWebOnlyDesc')}</p>
    </div>
  );
}

export function VendorAcademy() {
  const { t, i18n } = useTranslation();
  if (Capacitor.isNativePlatform()) return <AcademyWebOnlyNotice />;
  const guides = getLocalizedGuides(i18n.language);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Oralzon Academy</h1>
        <p className="text-gray-500 mt-1">{t('vendor.academySubtitle')}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {guides.map(guide => {
          const Icon = GUIDE_ICONS[guide.id];
          return (
            <Link key={guide.slug} to={`/venditore/academy/${guide.slug}`}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md hover:border-primary/30 transition-all flex flex-col">
              <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="font-bold text-gray-900 mb-1.5">{guide.title}</h2>
              <p className="text-sm text-gray-500 flex-1">{guide.description}</p>
              <span className="flex items-center gap-1 text-sm text-primary font-medium mt-4">
                {t('vendor.academyReadGuide')} <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
