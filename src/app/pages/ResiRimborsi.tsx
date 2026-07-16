import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export function ResiRimborsi() {
  const { t } = useTranslation();

  const whenItems = [
    { ok: true, title: t('resiRimborsi.ok1Title'), desc: t('resiRimborsi.ok1Desc') },
    { ok: true, title: t('resiRimborsi.ok2Title'), desc: t('resiRimborsi.ok2Desc') },
    { ok: true, title: t('resiRimborsi.ok3Title'), desc: t('resiRimborsi.ok3Desc') },
    { ok: true, title: t('resiRimborsi.ok4Title'), desc: t('resiRimborsi.ok4Desc') },
    { ok: false, title: t('resiRimborsi.no1Title'), desc: t('resiRimborsi.no1Desc') },
    { ok: false, title: t('resiRimborsi.no2Title'), desc: t('resiRimborsi.no2Desc') },
    { ok: false, title: t('resiRimborsi.no3Title'), desc: t('resiRimborsi.no3Desc') },
    { ok: false, title: t('resiRimborsi.no4Title'), desc: t('resiRimborsi.no4Desc') },
  ];

  const steps = [
    { step: '1', title: t('resiRimborsi.rma1Title'), desc: t('resiRimborsi.rma1Desc') },
    { step: '2', title: t('resiRimborsi.rma2Title'), desc: t('resiRimborsi.rma2Desc') },
    { step: '3', title: t('resiRimborsi.rma3Title'), desc: t('resiRimborsi.rma3Desc') },
    { step: '4', title: t('resiRimborsi.rma4Title'), desc: t('resiRimborsi.rma4Desc') },
  ];

  const costRows = [
    [t('resiRimborsi.rt1Reason'), t('resiRimborsi.sellerPays'), t('resiRimborsi.none'), t('resiRimborsi.total')],
    [t('resiRimborsi.rt2Reason'), t('resiRimborsi.sellerPays'), t('resiRimborsi.none'), t('resiRimborsi.total')],
    [t('resiRimborsi.rt3Reason'), t('resiRimborsi.sellerPays'), t('resiRimborsi.none'), t('resiRimborsi.total')],
    [t('resiRimborsi.rt4Reason'), t('resiRimborsi.toBeAgreed'), t('resiRimborsi.toBeAgreed'), t('resiRimborsi.totalOrPartial')],
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">{t('resiRimborsi.pageTitle')}</h1>
      <p className="text-gray-500 text-sm mb-8">{t('resiRimborsi.pageSubtitle')}</p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8">
        <h2 className="font-bold text-amber-900 mb-2 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {t('resiRimborsi.b2bNoticeTitle')}</h2>
        <p className="text-sm text-amber-800">{t('resiRimborsi.b2bNoticeDesc')}</p>
      </div>

      <div className="space-y-6 text-sm text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('resiRimborsi.whenTitle')}</h2>
          <div className="grid gap-3">
            {whenItems.map(item => (
              <div key={item.title} className={`flex items-start gap-3 p-4 rounded-xl border ${item.ok ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                {item.ok ? <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" /> : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />}
                <div>
                  <p className={`font-semibold ${item.ok ? 'text-green-800' : 'text-red-800'}`}>{item.title}</p>
                  <p className={`text-xs mt-0.5 ${item.ok ? 'text-green-700' : 'text-red-700'}`}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('resiRimborsi.proceduresTitle')}</h2>
          <div className="space-y-3">
            {steps.map(s => (
              <div key={s.step} className="flex gap-4 p-4 border border-gray-200 rounded-xl">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">{s.step}</div>
                <div><p className="font-semibold text-gray-900">{s.title}</p><p className="text-xs text-gray-600 mt-1">{s.desc}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('resiRimborsi.costsWhoPaysTitle')}</h2>
          <div className="overflow-hidden border border-gray-200 rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">{t('resiRimborsi.colReason')}</th>
                  <th className="text-left px-4 py-3 font-semibold">{t('resiRimborsi.colReturnShipping')}</th>
                  <th className="text-left px-4 py-3 font-semibold">{t('resiRimborsi.colRestockingFee')}</th>
                  <th className="text-left px-4 py-3 font-semibold">{t('resiRimborsi.colRefund')}</th>
                </tr>
              </thead>
              <tbody>
                {costRows.map(([motivo, spedizione, spese, rimborso]) => (
                  <tr key={motivo} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium">{motivo}</td>
                    <td className="px-4 py-3 text-green-700 font-medium">{spedizione}</td>
                    <td className="px-4 py-3">{spese}</td>
                    <td className="px-4 py-3 font-medium">{rimborso}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 mt-2">{t('resiRimborsi.restockingFeeNote')}</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">{t('resiRimborsi.mediationTitle')}</h2>
          <p>{t('resiRimborsi.mediationDesc')}</p>
          <ul className="mt-2 space-y-1 list-disc pl-5">
            <li>{t('resiRimborsi.medLi1')}</li>
            <li>{t('resiRimborsi.medLi2')}</li>
            <li>{t('resiRimborsi.medLi3')}</li>
          </ul>
          <p className="mt-3">{t('resiRimborsi.openMediation')} <strong>support@oralzon.com</strong></p>
        </section>

        <section className="bg-gray-50 rounded-xl p-5">
          <h2 className="font-bold text-gray-900 mb-2">{t('resiRimborsi.complianceTitle')}</h2>
          <p className="text-xs text-gray-600">{t('resiRimborsi.complianceDesc')}</p>
        </section>

        <div className="text-center pt-4">
          <Link to="/account/ordini" className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">
            {t('resiRimborsi.goToOrdersReturn')}
          </Link>
        </div>

      </div>
    </div>
  );
}
