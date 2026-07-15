import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Sparkles } from 'lucide-react';

const EDGE_URL = 'https://ckslkfshimzuujtpboui.supabase.co/functions/v1/make-server-000b3cfb';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrc2xrZnNoaW16dXVqdHBib3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTIwODIsImV4cCI6MjA5NDMyODA4Mn0.vhwaSLVWzVC9OGK7I4hE5V2P5H3A9V690YE9ELM-2eY';

export function VendorPromoSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');
  const [promo, setPromo] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (sessionId) verifyAndActivate();
    else { setErrorMsg('Link non valido: manca il codice di sessione del pagamento.'); setStatus('error'); }
  }, [sessionId]);

  const verifyAndActivate = async () => {
    try {
      const res = await fetch(`${EDGE_URL}/stripe/verify-promo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ sessionId }),
      });
      let data: any = null;
      try { data = await res.json(); } catch { throw new Error(`Risposta non valida dal server (HTTP ${res.status}).`); }
      if (!res.ok || !data?.success || !data?.promo) throw new Error(data?.error || `Errore HTTP ${res.status} dal server.`);
      setPromo(data.promo);
      setStatus('ok');
    } catch (e: any) {
      console.error('❌ verify-promo fallita:', e);
      setErrorMsg(e?.message || 'Errore sconosciuto durante la verifica del pagamento.');
      setStatus('error');
    }
  };

  const expiresFormatted = promo?.expires_at
    ? new Date(promo.expires_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })
    : '';

  const getPromoDescription = (packageId: string) => {
    if (packageId?.startsWith('featured_')) return 'I tuoi prodotti sono ora contrassegnati come sponsorizzati e appariranno in cima ai risultati di ricerca e in homepage.';
    if (packageId?.startsWith('homepage_')) return 'Il tuo store appare ora nella sezione sponsorizzata della homepage, visibile a tutti i visitatori.';
    if (packageId?.startsWith('category_')) return 'I tuoi prodotti appaiono in evidenza nelle pagine di categoria selezionate.';
    return 'La tua visibilità è stata attivata sulla piattaforma.';
  };

  if (status === 'loading') return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
      <p className="text-gray-600 font-medium">Attivazione promozione in corso...</p>
      <p className="text-sm text-gray-400 mt-1">Stiamo configurando la tua visibilità</p>
    </div>
  );

  if (status === 'error') return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h2 className="text-xl font-bold mb-2">Verifica non riuscita</h2>
      <p className="text-gray-600 mb-3 text-sm bg-red-50 border border-red-200 rounded-lg p-3 text-left">{errorMsg}</p>
      <p className="text-xs text-gray-400 mb-6">Se hai completato il pagamento, contatta support@oralzon.com con questo codice: <span className="font-mono">{sessionId}</span></p>
      <Link to="/venditore/dashboard" className="px-6 py-3 bg-primary text-white rounded-xl font-semibold">Vai alla Dashboard</Link>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-2xl border border-green-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-white">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Promozione Attivata!</h1>
        </div>

        <div className="p-8 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-left">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-green-600" />
              <p className="font-semibold text-green-800 text-sm">{promo?.package_name}</p>
            </div>
            <p className="text-sm text-green-700">{getPromoDescription(promo?.package_id)}</p>
            {expiresFormatted && (
              <p className="text-xs text-green-600 mt-2 font-medium flex items-center justify-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Attiva fino al {expiresFormatted}</p>
            )}
          </div>

          <div className="text-left text-sm text-gray-600 space-y-2 bg-gray-50 rounded-xl p-4">
            <p className="font-medium text-gray-900 text-xs uppercase tracking-wide mb-2">Cosa succede adesso:</p>
            {promo?.package_id?.startsWith('homepage_') ? (
              <>
                <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> Il tuo store appare nella sezione "Store in Evidenza" in homepage</p>
                <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> Visibile a tutti i visitatori del marketplace, non solo ai clienti registrati</p>
                <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> Visibilità attiva per tutta la durata acquistata</p>
                <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> Scaduto il periodo, lo store torna alla visibilità standard</p>
              </>
            ) : promo?.package_id?.startsWith('category_') ? (
              <>
                <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> I tuoi prodotti appaiono in cima nella categoria selezionata</p>
                <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> Priorità rispetto ai prodotti non sponsorizzati nella stessa categoria</p>
                <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> Visibilità attiva per tutta la durata acquistata</p>
                <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> Scaduto il periodo, i prodotti tornano all'ordine standard</p>
              </>
            ) : (
              <>
                <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> I tuoi prodotti vengono mostrati in posizioni privilegiate</p>
                <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> Il badge "Sponsorizzato" appare sulle schede prodotto</p>
                <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> Visibilità attiva per tutta la durata acquistata</p>
                <p className="flex items-start gap-2"><CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" /> Scaduto il periodo, i prodotti tornano alla visibilità standard</p>
              </>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Link to="/venditore/prodotti" className="flex-1 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 text-sm text-center">
              Vedi i miei Prodotti
            </Link>
            <Link to="/venditore/dashboard" className="flex-1 py-3 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 text-center">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
