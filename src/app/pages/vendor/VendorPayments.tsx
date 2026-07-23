import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Wallet, CheckCircle2, AlertCircle, Loader2, ExternalLink, Clock, ArrowDownToLine } from 'lucide-react';
import { callEdge } from '../../../lib/edgeApi';

interface ConnectStatus {
  vendor: {
    stripe_account_id: string | null;
    stripe_charges_enabled: boolean;
    stripe_payouts_enabled: boolean;
    stripe_details_submitted: boolean;
    commission_pct: number;
  };
  transfers: Array<{
    id: string;
    gross_amount: number;
    commission_amount: number;
    net_amount: number;
    status: string;
    reversed_amount: number;
    created_at: string;
  }>;
  pendingNet: number;
}

export function VendorPayments() {
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [params] = useSearchParams();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const json = await callEdge('/stripe/connect/status', { method: 'GET' });
      if (json.success) setStatus(json as any);
      else setError(json.error || 'Errore nel caricamento dello stato pagamenti');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError('');
    try {
      const json = await callEdge('/stripe/connect/onboard', { method: 'POST' });
      if (json.success && json.url) {
        window.location.href = json.url; // redirect all'onboarding ospitato da Stripe
      } else {
        setError(json.error || 'Impossibile avviare il collegamento con Stripe');
        setConnecting(false);
      }
    } catch (e: any) {
      setError(e.message);
      setConnecting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const v = status?.vendor;
  const isFullyActive = v?.stripe_charges_enabled && v?.stripe_payouts_enabled;
  const isPending = v?.stripe_account_id && v?.stripe_details_submitted && !isFullyActive;
  const notStarted = !v?.stripe_account_id;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Wallet className="w-6 h-6 text-primary" /> Pagamenti</h1>
        <p className="text-muted-foreground mt-1">Gestisci come ricevi gli incassi delle tue vendite su Oralzon.</p>
      </div>

      {params.get('onboarding') === 'complete' && (
        <div className="bg-accent border border-primary/20 rounded-xl p-4 text-sm text-oralzon-steel-ink">
          Configurazione Stripe inviata. Può volerci qualche minuto prima che risulti attiva qui sotto — se non si aggiorna, ricarica la pagina.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
        </div>
      )}

      {/* Stato collegamento */}
      <div className="bg-white rounded-xl border border-border p-6">
        {isFullyActive ? (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Il tuo conto è collegato e attivo</p>
              <p className="text-sm text-muted-foreground mt-1">Ricevi automaticamente il tuo incasso al netto della commissione marketplace non appena il cliente conferma la ricezione dell'ordine, o al massimo entro un tempo che dipende dalla destinazione: 7 giorni per l'Italia, 15 per il resto dell'UE, 21 per l'estero extra-UE.</p>
            </div>
          </div>
        ) : isPending ? (
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">Verifica in corso da parte di Stripe</p>
              <p className="text-sm text-muted-foreground mt-1">Hai inviato i tuoi dati. Stripe li sta verificando — di solito richiede pochi minuti, a volte fino a 1-2 giorni lavorativi per verifiche aggiuntive.</p>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-start gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">Collega il tuo conto per ricevere i pagamenti</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {notStarted
                    ? "Senza un conto collegato non puoi ricevere gli incassi delle vendite. Il collegamento richiede pochi minuti: dati aziendali, IBAN e un documento d'identità."
                    : "Il collegamento risulta iniziato ma non completato. Riprendi da dove avevi lasciato."}
                </p>
              </div>
            </div>
            <button onClick={handleConnect} disabled={connecting}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60">
              {connecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
              {notStarted ? 'Collega Stripe' : 'Riprendi il collegamento'}
            </button>
          </div>
        )}
      </div>

      {/* Fondi in sospeso */}
      {(status?.pendingNet ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <ArrowDownToLine className="w-5 h-5 text-oralzon-chrome-silver flex-shrink-0" />
            <div>
              <p className="font-semibold text-gray-900">€{status!.pendingNet.toFixed(2)} in attesa di trasferimento</p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {notStarted || isPending
                  ? "Verranno trasferiti automaticamente non appena il tuo conto Stripe sarà attivo."
                  : "Ordini pagati ma non ancora consegnati/confermati — verranno trasferiti alla conferma di consegna."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Aiuto — via d'uscita per chi si blocca nell'onboarding, invece di abbandonare in silenzio */}
      <div className="bg-accent/50 border border-primary/10 rounded-xl p-4 text-sm text-oralzon-steel-ink">
        <p className="font-medium mb-1">Bloccato in qualche passaggio?</p>
        <p className="text-muted-foreground">
          Capita, soprattutto la prima volta — Stripe chiede documenti e dati precisi per legge, non è un problema del tuo negozio.
          Nel frattempo puoi comunque caricare prodotti e ricevere ordini: gli incassi restano semplicemente in attesa finché non completi il collegamento.
          Se serve una mano, scrivi a <a href="mailto:support@oralzon.com" className="text-primary hover:underline font-medium">support@oralzon.com</a>.
        </p>
      </div>

      {/* Storico trasferimenti */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="font-semibold text-gray-900">Storico trasferimenti</h2>
        </div>
        {!status?.transfers || status.transfers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Nessun trasferimento ancora effettuato.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-border">
              <tr>
                {['Data', 'Lordo', 'Ricevuto (al netto di commissione)', 'Stato'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {status.transfers.map(t => {
                const reversedAmt = Number((t as any).reversed_amount || 0);
                const actuallyRetained = Number(t.net_amount) - reversedAmt;
                return (
                <tr key={t.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 text-gray-600">{new Date(t.created_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="px-4 py-3">€{Number(t.gross_amount).toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold text-green-700">
                    €{actuallyRetained.toFixed(2)}
                    {reversedAmt > 0 && (
                      <span className="block text-xs font-normal text-gray-400">
                        (€{Number(t.net_amount).toFixed(2)} − €{reversedAmt.toFixed(2)} recuperati per reso)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      t.status === 'completed' ? 'bg-accent text-oralzon-steel-ink' :
                      t.status === 'reversed' ? 'bg-red-50 text-red-700' :
                      t.status === 'partially_reversed' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {t.status === 'completed' ? 'Ricevuto' : t.status === 'reversed' ? 'Recuperato (reso)' : t.status === 'partially_reversed' ? 'Parz. recuperato' : t.status}
                    </span>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
