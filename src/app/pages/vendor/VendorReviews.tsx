import { useState, useEffect } from 'react';
import { Star, MessageCircleQuestion, Loader2, Send, AlertCircle } from 'lucide-react';
import { callEdge } from '../../../lib/edgeApi';

interface Review {
  id: string; product_id: string; user_name: string; rating: number; comment: string;
  created_at: string; vendor_reply: string | null; vendor_reply_at: string | null;
  products: { name: string; images: string[] } | null;
}
interface Question {
  id: string; product_id: string; user_name: string; question: string; answer: string | null;
  created_at: string; answered_at: string | null;
  products: { name: string; images: string[] } | null;
}

const FALLBACK = '/images/product-placeholder.svg';

export function VendorReviews() {
  const [tab, setTab] = useState<'reviews' | 'questions'>('reviews');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    setLoadError('');
    const [rRes, qRes] = await Promise.all([
      callEdge('/vendor/reviews', { method: 'GET' }),
      callEdge('/vendor/questions', { method: 'GET' }),
    ]);
    if (rRes.success) setReviews(rRes.reviews || []);
    else setLoadError(rRes.error || 'Errore caricamento recensioni.');
    if (qRes.success) setQuestions(qRes.questions || []);
    else setLoadError(prev => prev || qRes.error || 'Errore caricamento domande.');
    setLoading(false);
  };

  const submitReply = async (kind: 'review' | 'question', id: string) => {
    if (!replyText.trim()) return;
    setSaving(true);
    try {
      const result = kind === 'review'
        ? await callEdge('/vendor/reply-review', { body: { reviewId: id, reply: replyText.trim() } })
        : await callEdge('/vendor/answer-question', { body: { questionId: id, answer: replyText.trim() } });
      if (!result.success) throw new Error(result.error);
      setReplyingTo(null); setReplyText('');
      loadAll();
    } catch (e: any) { alert('Errore: ' + e.message); }
    finally { setSaving(false); }
  };

  const pendingQuestions = questions.filter(q => !q.answer).length;
  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recensioni & Domande</h1>
        <p className="text-gray-600 mt-1">Gestisci il feedback dei clienti sui tuoi prodotti</p>
      </div>

      {loadError && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Impossibile caricare i dati</p>
            <p className="text-xs text-red-600 mt-0.5">{loadError}</p>
          </div>
        </div>
      )}

      {/* Stats rapide */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Valutazione Media</p>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-black text-gray-900">{avgRating > 0 ? avgRating.toFixed(1) : '—'}</span>
            {avgRating > 0 && <Star className="w-5 h-5 fill-amber-400 text-amber-400" />}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Recensioni Totali</p>
          <span className="text-2xl font-black text-gray-900">{reviews.length}</span>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 col-span-2 sm:col-span-1">
          <p className="text-xs text-gray-400 uppercase font-semibold mb-1">Domande in Attesa</p>
          <span className={`text-2xl font-black ${pendingQuestions > 0 ? 'text-amber-500' : 'text-gray-900'}`}>{pendingQuestions}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setTab('reviews')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${tab === 'reviews' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
          <Star className="w-4 h-4 inline mr-1.5" /> Recensioni ({reviews.length})
        </button>
        <button onClick={() => setTab('questions')}
          className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors relative ${tab === 'questions' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
          <MessageCircleQuestion className="w-4 h-4 inline mr-1.5" /> Domande Clienti ({questions.length})
          {pendingQuestions > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-amber-500 text-white text-[10px] rounded-full font-bold">{pendingQuestions}</span>
          )}
        </button>
      </div>

      {/* TAB RECENSIONI */}
      {tab === 'reviews' && (
        reviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Star className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-1">Nessuna recensione ancora</p>
            <p className="text-gray-400 text-sm">Le recensioni dei clienti sui tuoi prodotti appariranno qui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={r.products?.images?.[0] || FALLBACK} alt="" className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary font-semibold truncate">{r.products?.name || 'Prodotto'}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{r.user_name}</span>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                    </div>
                    {r.comment && <p className="text-sm text-gray-700 mt-1.5">{r.comment}</p>}
                  </div>
                </div>

                {r.vendor_reply ? (
                  <div className="mt-3 sm:ml-14 bg-primary/5 border-l-2 border-primary rounded-r-lg p-3">
                    <p className="text-xs font-semibold text-primary mb-1">La tua risposta · {r.vendor_reply_at && formatDate(r.vendor_reply_at)}</p>
                    <p className="text-sm text-gray-700">{r.vendor_reply}</p>
                  </div>
                ) : replyingTo === r.id ? (
                  <div className="mt-3 sm:ml-14 flex flex-col sm:flex-row gap-2">
                    <input value={replyText} onChange={e => setReplyText(e.target.value)}
                      placeholder="Scrivi una risposta pubblica..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" autoFocus />
                    <div className="flex gap-2">
                      <button onClick={() => submitReply('review', r.id)} disabled={saving}
                        className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600">Annulla</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setReplyingTo(r.id); setReplyText(''); }}
                    className="mt-3 sm:ml-14 text-xs text-primary hover:underline font-medium">
                    Rispondi pubblicamente
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* TAB DOMANDE */}
      {tab === 'questions' && (
        questions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MessageCircleQuestion className="w-14 h-14 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-1">Nessuna domanda ancora</p>
            <p className="text-gray-400 text-sm">Le domande dei clienti sui tuoi prodotti appariranno qui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map(q => (
              <div key={q.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    <img src={q.products?.images?.[0] || FALLBACK} alt="" className="w-full h-full object-cover"
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-primary font-semibold truncate">{q.products?.name || 'Prodotto'}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-sm font-semibold text-gray-900">{q.user_name}</span>
                      <span className="text-xs text-gray-400">{formatDate(q.created_at)}</span>
                      {!q.answer && <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">DA RISPONDERE</span>}
                    </div>
                    <p className="text-sm text-gray-700 mt-1.5">{q.question}</p>
                  </div>
                </div>

                {q.answer ? (
                  <div className="mt-3 sm:ml-14 bg-primary/5 border-l-2 border-primary rounded-r-lg p-3">
                    <p className="text-xs font-semibold text-primary mb-1">La tua risposta · {q.answered_at && formatDate(q.answered_at)}</p>
                    <p className="text-sm text-gray-700">{q.answer}</p>
                  </div>
                ) : replyingTo === q.id ? (
                  <div className="mt-3 sm:ml-14 flex flex-col sm:flex-row gap-2">
                    <input value={replyText} onChange={e => setReplyText(e.target.value)}
                      placeholder="Scrivi la risposta..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm" autoFocus />
                    <div className="flex gap-2">
                      <button onClick={() => submitReply('question', q.id)} disabled={saving}
                        className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-semibold disabled:opacity-50 flex items-center gap-1">
                        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => { setReplyingTo(null); setReplyText(''); }}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-600">Annulla</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setReplyingTo(q.id); setReplyText(''); }}
                    className="mt-3 sm:ml-14 text-xs text-primary hover:underline font-medium flex items-center gap-1">
                    <MessageCircleQuestion className="w-3.5 h-3.5" /> Rispondi ora
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
