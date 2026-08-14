import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Gavel, CreditCard, Package, ClipboardList, Tag, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { callEdge } from '../../lib/edgeApi';

/**
 * Deve restare allineata a VENDOR_RULES_VERSION nel server
 * (supabase/functions/server/index.tsx). Se cambia il testo delle regole —
 * soprattutto le conseguenze previste — si incrementa in ENTRAMBI i punti:
 * ai venditori verrà richiesta una nuova accettazione, invece di dare per
 * valida quella prestata su un testo diverso.
 */
const VENDOR_RULES_VERSION = '2026-08';

/**
 * Rende in grassetto le porzioni marcate con **doppio asterisco**, come già
 * si fa nei documenti legali. Serve a far risaltare la parte che conta
 * davvero di ogni regola senza spezzarla in due frasi separate.
 */
function withBold(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
    chunk.startsWith('**') && chunk.endsWith('**')
      ? <strong key={i} className="font-semibold text-gray-900">{chunk.slice(2, -2)}</strong>
      : <span key={i}>{chunk}</span>
  );
}

interface Props {
  vendorId: string;
}

/**
 * Onboarding del venditore al primo accesso alla dashboard.
 *
 * Il primo passo NON è saltabile: contiene le regole della piattaforma, la
 * cui violazione può portare a limitazione o sospensione dell'account, e
 * richiede quindi un'accettazione esplicita registrata a database. I passi
 * successivi sono un walkthrough informativo e si possono saltare in
 * qualsiasi momento.
 *
 * Perché la distinzione conta: saltare un tour non deve mai equivalere ad
 * aver accettato delle condizioni. Le due cose sono tracciate su colonne
 * separate proprio per questo.
 */
export function VendorOnboardingTour({ vendorId }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [rulesAlreadyAccepted, setRulesAlreadyAccepted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('vendors')
        .select('rules_accepted_at, rules_accepted_version, onboarding_tour_completed_at')
        .eq('id', vendorId).maybeSingle();
      if (cancelled || !data) return;

      const rulesOk = !!data.rules_accepted_at && data.rules_accepted_version === VENDOR_RULES_VERSION;
      const tourDone = !!data.onboarding_tour_completed_at;
      setRulesAlreadyAccepted(rulesOk);

      // Se le regole sono già state accettate nella versione corrente e il
      // tour è stato visto o saltato, non mostriamo nulla. Se invece le
      // regole sono cambiate, il tour ricompare partendo dalle regole —
      // anche a chi aveva già completato il walkthrough.
      if (rulesOk && tourDone) return;
      setStep(rulesOk ? 2 : 0);
      setVisible(true);
    })();
    return () => { cancelled = true; };
  }, [vendorId]);

  const steps = [
    {
      icon: ShieldAlert,
      title: t('vendorTour.rulesTitle'),
      body: t('vendorTour.rulesBody'),
      intro: t('vendorTour.ruleExIntro'),
      points: [
        t('vendorTour.ruleEx1'),
        t('vendorTour.ruleEx2'),
        t('vendorTour.ruleEx3'),
      ],
      // Ogni schermata di regole ha la SUA spunta: due atti deliberati su
      // una cosa per volta, invece di uno solo su tre cose insieme.
      acceptLabel: t('vendorTour.rulesAcceptA'),
    },
    {
      icon: Gavel,
      title: t('vendorTour.consequencesTitle'),
      body: t('vendorTour.consequencesBody'),
      points: [
        t('vendorTour.consPoint1'),
        t('vendorTour.consPoint2'),
        t('vendorTour.consPoint3'),
      ],
      acceptLabel: t('vendorTour.rulesAcceptB'),
    },
    {
      icon: CreditCard,
      title: t('vendorTour.payoutsTitle'),
      body: t('vendorTour.payoutsBody'),
      points: [t('vendorTour.payoutPoint1'), t('vendorTour.payoutPoint2')],
    },
    {
      icon: Package,
      title: t('vendorTour.productsTitle'),
      body: t('vendorTour.productsBody'),
      points: [t('vendorTour.productPoint1'), t('vendorTour.productPoint2')],
    },
    {
      icon: ClipboardList,
      title: t('vendorTour.ordersTitle'),
      body: t('vendorTour.ordersBody'),
      points: [t('vendorTour.orderPoint1'), t('vendorTour.orderPoint2')],
    },
    {
      icon: Tag,
      title: t('vendorTour.promoTitle'),
      body: t('vendorTour.promoBody'),
      points: [t('vendorTour.promoPoint1'), t('vendorTour.promoPoint2')],
    },
  ];

  // Le prime due schermate sono regole: non si saltano e ognuna richiede
  // la propria spunta. Dalla terza in poi il tour e' informativo.
  const RULE_STEPS = 2;
  const isRulesStep = step < RULE_STEPS;
  const isLastStep = step === steps.length - 1;
  const current = steps[step];
  const Icon = current.icon;

  const finish = async () => {
    setSaving(true);
    try {
      await callEdge('/vendor/complete-tour', { method: 'POST', body: {} });
    } catch {
      // Il tour è informativo: se la registrazione fallisce non ha senso
      // trattenere il venditore sulla dashboard. Al massimo lo rivedrà.
    } finally {
      setSaving(false);
      setVisible(false);
    }
  };

  const acceptRules = async () => {
    if (!accepted) return;
    // Prima schermata: avanza soltanto. L'accettazione viene registrata a
    // database solo dopo la seconda spunta, cosi' la data corrisponde ad
    // aver visto sia la regola sia le conseguenze — non solo la prima.
    if (step < RULE_STEPS - 1) {
      setAccepted(false);
      setStep(s => s + 1);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await callEdge('/vendor/accept-rules', { method: 'POST', body: {} });
      if (!res?.success) {
        setError(res?.error || t('vendorTour.acceptError'));
        return;
      }
      setRulesAlreadyAccepted(true);
      setStep(RULE_STEPS);
    } catch {
      setError(t('vendorTour.acceptError'));
    } finally {
      setSaving(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="w-full sm:max-w-lg max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl">
        {/* Intestazione fissa: chiarisce cosa sono queste schermate e quante
            sono. Resta identica per tutto il percorso, cosi' il venditore ha
            sempre il contesto di dove si trova. */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 sm:px-6">
          <span className="text-sm font-semibold text-gray-900">{t('vendorTour.headerTitle')}</span>
          <span className="text-xs text-gray-500">
            {t('vendorTour.stepCounter', { current: step + 1, total: steps.length })}
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-gray-900">{current.title}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{current.body}</p>
            </div>
          </div>

          {(current as any).intro && (
            <p className="mt-4 text-sm font-medium text-gray-800">{(current as any).intro}</p>
          )}

          <ul className="mt-3 space-y-2">
            {current.points.map((point, i) => (
              <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-gray-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                <span>{withBold(point)}</span>
              </li>
            ))}
          </ul>

          {isRulesStep && (
            <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <label className="flex cursor-pointer gap-2.5">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={e => setAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm leading-relaxed text-gray-700">{(current as any).acceptLabel}</span>
              </label>
              <button
                type="button"
                onClick={() => navigate('/termini')}
                className="mt-2 ml-6.5 text-xs text-primary underline underline-offset-2">
                {t('vendorTour.readFullTerms')}
              </button>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          {/* Indicatore di avanzamento */}
          <div className="mt-5 flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-primary' : 'bg-gray-200'}`}
                aria-hidden="true"
              />
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            {/* Indietro: mai fino alle regole già accettate, per non
                rimettere in discussione un consenso già registrato. */}
            {step > RULE_STEPS || (step > 0 && step < RULE_STEPS && !rulesAlreadyAccepted) ? (
              <button
                type="button"
                onClick={() => setStep(s => Math.max(rulesAlreadyAccepted ? RULE_STEPS : 0, s - 1))}
                className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                {t('vendorTour.back')}
              </button>
            ) : <span />}

            <div className="flex items-center gap-3">
              {/* Il salto è disponibile solo dopo le regole: quelle non si
                  saltano, si accettano. */}
              {!isRulesStep && (
                <button
                  type="button"
                  onClick={finish}
                  disabled={saving}
                  className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50">
                  {t('vendorTour.skip')}
                </button>
              )}

              {isRulesStep ? (
                <button
                  type="button"
                  onClick={acceptRules}
                  disabled={!accepted || saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {step < RULE_STEPS - 1 ? t('vendorTour.next') : t('vendorTour.acceptAndContinue')}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => (isLastStep ? finish() : setStep(s => s + 1))}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50">
                  {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                  {isLastStep ? t('vendorTour.done') : t('vendorTour.next')}
                  {!isLastStep && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
