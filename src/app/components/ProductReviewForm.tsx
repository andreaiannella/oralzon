import { useState, useEffect } from 'react';
import { Star, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Props {
  productId: string;
  productName: string;
}

export function ProductReviewForm({ productId, productName }: Props) {
  const [checking, setChecking] = useState(true);
  const [existingReview, setExistingReview] = useState<{ rating: number; comment: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { checkExisting(); }, [productId]);

  const checkExisting = async () => {
    setChecking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setChecking(false); return; }
      const { data } = await supabase.from('product_reviews')
        .select('rating, comment').eq('product_id', productId).eq('user_id', user.id).maybeSingle();
      if (data) setExistingReview(data as any);
    } finally { setChecking(false); }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { setError('Seleziona una valutazione.'); return; }
    setSubmitting(true); setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Devi essere loggato.');
      const { data: profile } = await supabase.from('profiles').select('nome, cognome').eq('id', user.id).single();
      const userName = profile ? `${(profile as any).nome || ''} ${(profile as any).cognome || ''}`.trim() || user.email!.split('@')[0] : user.email!.split('@')[0];
      const { error: insertErr } = await supabase.from('product_reviews').insert([{
        product_id: productId, user_id: user.id, user_name: userName, rating, comment: comment.trim(),
      }]);
      if (insertErr) throw insertErr;
      setSubmitted(true);
      setTimeout(() => { setExistingReview({ rating, comment: comment.trim() }); setShowForm(false); }, 1500);
    } catch (err: any) {
      setError(err.message?.includes('duplicate') ? 'Hai già recensito questo prodotto.' : 'Errore. Riprova.');
    } finally { setSubmitting(false); }
  };

  if (checking) return null;

  // Già recensito
  if (existingReview) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mt-2">
        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
        <span>La tua recensione su questo prodotto:</span>
        <div className="flex gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className={`w-3.5 h-3.5 ${i < existingReview.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
          ))}
        </div>
      </div>
    );
  }

  // CTA per aprire il form
  if (!showForm) {
    return (
      <button onClick={() => setShowForm(true)}
        className="flex items-center gap-1.5 text-xs px-2.5 py-2 sm:py-1.5 border border-amber-300 text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors font-medium">
        <Star className="w-3.5 h-3.5" /> Scrivi una recensione
      </button>
    );
  }

  // Form inline
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2 space-y-2">
      {submitted ? (
        <div className="flex items-center gap-2 text-green-600 text-sm py-1">
          <CheckCircle className="w-4 h-4" /> Grazie per la tua recensione!
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-2">
          <p className="text-xs font-semibold text-gray-700">Come valuti "{productName}"?</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} type="button" onClick={() => setRating(n)}>
                <Star className={`w-6 h-6 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300 fill-gray-100'}`} />
              </button>
            ))}
          </div>
          <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2}
            placeholder="La tua esperienza con questo prodotto (opzionale)..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-primary" />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={submitting}
              className="px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 disabled:opacity-50 flex items-center gap-1.5">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {submitting ? 'Invio...' : 'Pubblica Recensione'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-600 hover:bg-gray-100">
              Annulla
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
