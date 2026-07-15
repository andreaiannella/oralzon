import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, CheckCircle, X } from 'lucide-react';
import { TrialStatus } from '../../lib/vendor';
import { useState } from 'react';

interface Props {
  status: TrialStatus;
}

export function TrialBanner({ status }: Props) {
  const [dismissed, setDismissed] = useState(false);

  // Piano a pagamento attivo → nessun banner
  if (status.isPaid) return null;
  // Già dismisso per questa sessione
  if (dismissed && !status.isExpired) return null;

  // Trial scaduto → banner bloccante (non dismissibile)
  if (status.isExpired) {
    return (
      <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-bold text-sm">Trial scaduto — Il tuo account è in pausa</p>
            <p className="text-red-100 text-xs mt-0.5">Non puoi aggiungere o modificare prodotti. Acquista un piano per riattivare tutto.</p>
          </div>
        </div>
        <Link to="/pricing-venditori"
          className="flex-shrink-0 px-5 py-2 bg-white text-red-600 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors whitespace-nowrap">
          Acquista un Piano
        </Link>
      </div>
    );
  }

  // Trial attivo con giorni rimanenti
  if (status.isTrial && status.daysLeft !== null) {
    const isUrgent = status.daysLeft <= 2;
    return (
      <div className={`${isUrgent ? 'bg-amber-500' : 'bg-primary'} text-white px-6 py-3 flex items-center justify-between gap-4`}>
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 flex-shrink-0" />
          <p className="text-sm">
            {isUrgent
              ? <><strong>Attenzione:</strong> il tuo trial gratuito scade in {status.daysLeft === 0 ? 'meno di 24 ore' : `${status.daysLeft} giorn${status.daysLeft === 1 ? 'o' : 'i'}`}</>
              : <>Stai usando la <strong>Prova Gratuita</strong> — {status.daysLeft} giorni rimanenti</>
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/pricing-venditori"
            className="flex-shrink-0 px-4 py-1.5 bg-white text-primary rounded-lg font-semibold text-xs hover:bg-gray-100 transition-colors whitespace-nowrap">
            Scegli un Piano
          </Link>
          {!isUrgent && (
            <button onClick={() => setDismissed(true)} className="opacity-70 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
