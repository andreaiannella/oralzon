import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FileText, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Avviso di dati fiscali incompleti.
 *
 * Oralzon è un marketplace B2B e il server rifiuta il checkout senza partita
 * IVA a profilo. Il problema non è il controllo — è giusto e non aggirabile —
 * ma il MOMENTO in cui l'utente lo scopre: chi si è registrato prima che il
 * campo diventasse obbligatorio riempie il carrello, arriva al pagamento e
 * solo lì viene bloccato, con il lavoro già fatto.
 *
 * Questo componente sposta la scoperta il più indietro possibile: area
 * account e carrello, cioè prima che il cliente investa tempo. È volutamente
 * informativo e non bloccante — spiega a cosa serve il dato (la fattura)
 * invece di presentarlo come un errore, perché a questo punto l'utente non ha
 * ancora sbagliato niente.
 */
export function FiscalDataNotice({ compact = false }: { compact?: boolean }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!user) { setMissing(false); return; }
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from('profiles')
        .select('user_type, partita_iva')
        .eq('id', user.id).maybeSingle();
      if (cancelled || !data) return;
      // Solo i clienti: venditori e admin non acquistano.
      if (data.user_type !== 'cliente') return;
      setMissing(!data.partita_iva?.trim());
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (!missing) return null;

  return (
    <div className={`rounded-lg border border-amber-200 bg-amber-50 ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex gap-2.5">
        <FileText className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} shrink-0 text-amber-600`} aria-hidden="true" />
        <div className="min-w-0">
          <p className={`font-semibold text-amber-900 ${compact ? 'text-xs' : 'text-sm'}`}>
            {t('fiscalNotice.title')}
          </p>
          <p className={`mt-1 leading-relaxed text-amber-800 ${compact ? 'text-xs' : 'text-sm'}`}>
            {t('fiscalNotice.body')}
          </p>
          <Link
            to="/account/profilo"
            className={`mt-2 inline-flex items-center gap-1 font-semibold text-amber-900 underline underline-offset-2 ${compact ? 'text-xs' : 'text-sm'}`}>
            {t('fiscalNotice.cta')}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
