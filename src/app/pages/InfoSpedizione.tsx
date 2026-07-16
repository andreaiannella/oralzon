import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

function Bold({ text }: { text: string }) {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return <>{parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}</>;
}

export function InfoSpedizione() {
  const { t } = useTranslation();

  const rows = [
    [t('infoSpedizione.row1Type'), t('infoSpedizione.row1Time'), t('infoSpedizione.row1Note')],
    [t('infoSpedizione.row2Type'), t('infoSpedizione.row2Time'), t('infoSpedizione.row2Note')],
    [t('infoSpedizione.row3Type'), t('infoSpedizione.row3Time'), t('infoSpedizione.row3Note')],
    [t('infoSpedizione.row4Type'), t('infoSpedizione.row4Time'), t('infoSpedizione.row4Note')],
    [t('infoSpedizione.row5Type'), t('infoSpedizione.row5Time'), t('infoSpedizione.row5Note')],
  ];

  const steps = [
    { step: '1', title: t('infoSpedizione.s1Title'), desc: t('infoSpedizione.s1Desc') },
    { step: '2', title: t('infoSpedizione.s2Title'), desc: t('infoSpedizione.s2Desc') },
    { step: '3', title: t('infoSpedizione.s3Title'), desc: t('infoSpedizione.s3Desc') },
    { step: '4', title: t('infoSpedizione.s4Title'), desc: t('infoSpedizione.s4Desc') },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{t('infoSpedizione.pageTitle')}</h1>
      <p className="text-gray-500 text-sm mb-8">{t('infoSpedizione.pageSubtitle')}</p>
      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">

        <section className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="font-bold text-amber-900 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {t('infoSpedizione.distributedTitle')}</h2>
          <p>{t('infoSpedizione.distributedDesc')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('infoSpedizione.timingTitle')}</h2>
          <div className="overflow-hidden border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('infoSpedizione.colProductType')}</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('infoSpedizione.colEstimatedTime')}</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-700">{t('infoSpedizione.colNotes')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(([tipo, tempo, note]) => (
                  <tr key={tipo} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">{tipo}</td>
                    <td className="px-4 py-3 text-primary font-semibold">{tempo}</td>
                    <td className="px-4 py-3 text-gray-500">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">{t('infoSpedizione.tableFootnote')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('infoSpedizione.notificationsTitle')}</h2>
          <div className="space-y-3">
            {steps.map(s => (
              <div key={s.step} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                <div className="w-7 h-7 bg-primary text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{s.step}</div>
                <div><p className="font-medium text-gray-900">{s.title}</p><p className="text-xs text-gray-500">{s.desc}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('infoSpedizione.costsTitle')}</h2>
          <p>{t('infoSpedizione.costsDesc')}</p>
          <ul className="mt-2 space-y-1 list-disc pl-5">
            <li>{t('infoSpedizione.costsLi1')}</li>
            <li>{t('infoSpedizione.costsLi2')}</li>
            <li>{t('infoSpedizione.costsLi3')}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('infoSpedizione.specialTitle')}</h2>
          <p>{t('infoSpedizione.specialDesc')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('infoSpedizione.problemsTitle')}</h2>
          <p>{t('infoSpedizione.problemsDesc')}</p>
          <ol className="mt-2 space-y-1 list-decimal pl-5">
            <li><Bold text={t('infoSpedizione.problemStep1')} /></li>
            <li>{t('infoSpedizione.problemStep2')}</li>
            <li><Bold text={t('infoSpedizione.problemStep3')} /></li>
          </ol>
        </section>

      </div>
    </div>
  );
}
