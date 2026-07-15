import { useState, useEffect } from 'react';
import { MessageCircleQuestion, Send, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

interface QA { id: string; user_name: string; question: string; answer: string | null; answered_at: string | null; created_at: string; }

export function ProductQA({ productId }: { productId: string; vendorProfileId?: string }) {
  const [qas, setQAs] = useState<QA[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQ, setNewQ] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  useEffect(() => { loadQA(); }, [productId]);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setIsLoggedIn(!!data.user)); }, []);

  const loadQA = async () => {
    const { data } = await supabase.from('product_questions').select('*').eq('product_id', productId).order('created_at', { ascending: false });
    setQAs((data as any) || []);
    setLoading(false);
  };

  const askQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQ.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSending(true);
    const { data: profile } = await supabase.from('profiles').select('nome, cognome').eq('id', user.id).single();
    const name = profile ? `${(profile as any).nome || ''} ${(profile as any).cognome || ''}`.trim() || user.email!.split('@')[0] : 'Utente';
    await supabase.from('product_questions').insert([{ product_id: productId, user_id: user.id, user_name: name, question: newQ.trim() }]);
    setSent(true); setNewQ(''); loadQA();
    setTimeout(() => setSent(false), 4000);
    setSending(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircleQuestion className="w-4 h-4 text-primary" />
        <h3 className="text-base font-bold text-gray-900">Domande e Risposte {qas.length > 0 && <span className="text-primary">({qas.length})</span>}</h3>
      </div>

      {loading ? <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" /> : (
        <div className="space-y-3">
          {qas.map(qa => (
            <div key={qa.id} className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
              <div className="flex items-start gap-2 mb-1">
                <span className="text-xs font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">D</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{qa.question}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{qa.user_name} · {new Date(qa.created_at).toLocaleDateString('it-IT')}</p>
                </div>
              </div>
              {qa.answer ? (
                <div className="flex items-start gap-2 mt-2 ml-4 pt-2 border-t border-gray-200">
                  <span className="text-xs font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded flex-shrink-0">R</span>
                  <div>
                    <p className="text-sm text-gray-800">{qa.answer}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Venditore · {qa.answered_at ? new Date(qa.answered_at).toLocaleDateString('it-IT') : ''}</p>
                  </div>
                </div>
              ) : (
                <p className="mt-1 ml-4 text-xs text-gray-400 italic">In attesa di risposta dal venditore</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fai una domanda */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-3">
        <p className="text-xs font-bold text-gray-600 mb-1">Fai una domanda su questo prodotto</p>
        <p className="text-xs text-gray-400 mb-2">La tua domanda sarà visibile a tutti. Il venditore riceverà una notifica e ti risponderà via email non appena disponibile.</p>
        {sent ? (
          <div className="flex items-center gap-2 text-green-600 text-sm py-1"><CheckCircle className="w-4 h-4" /> Domanda inviata al venditore!</div>
        ) : isLoggedIn === false ? (
          <div className="text-center py-2">
            <p className="text-xs text-gray-500 mb-2">Accedi per fare una domanda</p>
            <Link to="/login" className="inline-block px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold">Accedi</Link>
          </div>
        ) : (
          <form onSubmit={askQuestion} className="flex gap-2">
            <input value={newQ} onChange={e => setNewQ(e.target.value)} placeholder="Es. Di che materiale è fatto?"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" disabled={sending} required />
            <button type="submit" disabled={sending || !newQ.trim()} className="px-3 py-2 bg-primary text-white rounded-lg disabled:opacity-40">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
