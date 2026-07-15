import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Package, ArrowRight } from 'lucide-react';

const SUPABASE_URL = 'https://ckslkfshimzuujtpboui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrc2xrZnNoaW16dXVqdHBib3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTIwODIsImV4cCI6MjA5NDMyODA4Mn0.vhwaSLVWzVC9OGK7I4hE5V2P5H3A9V690YE9ELM-2eY';
const EDGE_URL = `${SUPABASE_URL}/functions/v1/make-server-000b3cfb`;

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  shipping_name: string;
  shipping_email: string;
  shipping_address: any;
  items?: any[];
}

export function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const { t } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      setError('Sessione non trovata.');
      setLoading(false);
      return;
    }
    verifyPayment();
  }, [sessionId]);

  const verifyPayment = async () => {
    try {
      const res = await fetch(`${EDGE_URL}/stripe/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Pagamento non verificato');
      }
      setOrder(data.order);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl border border-gray-200 p-12">
          <Loader2 className="w-14 h-14 text-primary animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Verifica pagamento...</h2>
          <p className="text-gray-500 text-sm">Un momento, stiamo confermando il tuo ordine.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-2xl border border-red-200 p-12">
          <AlertCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Problema con il pagamento</h2>
          <p className="text-gray-600 text-sm mb-6">{error}</p>
          <Link to="/negozio" className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary transition-colors">
            Torna al Negozio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

        {/* Header verde */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-8 py-10 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Ordine Confermato!</h1>
          <p className="text-green-100 text-sm">Grazie per il tuo acquisto su Oralzon</p>
        </div>

        <div className="p-8 space-y-6">
          {/* Numero ordine */}
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Numero ordine</p>
            <p className="text-2xl font-bold text-gray-900 font-mono">{order?.order_number}</p>
          </div>

          {/* Dettagli */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Intestatario</p>
              <p className="font-medium text-gray-900">{order?.shipping_name}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Email di conferma</p>
              <p className="font-medium text-gray-900">{order?.shipping_email}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Indirizzo di spedizione</p>
              <p className="font-medium text-gray-900">
                {order?.shipping_address?.address}, {order?.shipping_address?.city} ({order?.shipping_address?.province})
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Totale pagato</p>
              <p className="text-xl font-bold text-gray-900">€{order?.total_amount?.toFixed(2)}</p>
            </div>
          </div>

          {/* Info spedizione */}
          <div className="flex items-start gap-3 bg-accent rounded-xl p-4 border border-oralzon-mint-fresh/20">
            <Package className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-oralzon-steel-ink mb-1">Come funziona la spedizione</p>
              <p className="text-primary">
                Ogni fornitore gestisce la spedizione dei propri prodotti in modo indipendente.
                Riceverai un'email con il tracking non appena il pacco viene spedito.
              </p>
            </div>
          </div>

          {/* Azioni */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Link to="/account/ordini"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary transition-colors text-sm">
              I Miei Ordini <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/negozio"
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-900 rounded-xl font-semibold hover:bg-gray-200 transition-colors text-sm">
              Continua lo Shopping
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
