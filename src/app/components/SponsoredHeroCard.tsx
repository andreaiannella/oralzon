import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { localizeProduct } from '../../lib/productTranslations';

// Card sponsorizzata singola, stile "hero" (un solo prodotto in evidenza, non
// un carosello) — DIVERSA dal carosello "Prodotti Sponsorizzati" esistente:
// stesso pool di venditori paganti (is_sponsored), ma qui viene scelto UN
// prodotto per volta, contestuale alla categoria della pagina/interesse
// dell'utente, con rotazione equa nel tempo tra tutti i candidati pertinenti
// così ogni sponsor ottiene visibilità, non solo il primo caricato.
//
// contextCategory: categoria della pagina corrente (pagina categoria o
// prodotto) — priorità massima per la pertinenza.
// interestCategories: fallback quando non c'è una categoria di pagina (es.
// home) — dedotte da cronologia acquisti/visti, già disponibili lato
// chiamante senza raccogliere nuovi dati.
interface SponsoredProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  translations?: Record<string, { name?: string; description?: string; specifications?: string }> | null;
}

interface SponsoredHeroCardProps {
  contextCategory?: string;
  interestCategories?: string[];
  className?: string;
  // true nei contesti che hanno già un proprio contenitore/larghezza (es.
  // Shop.tsx, dove la colonna risultati è già ristretta da una sidebar
  // filtri) — salta il wrapper max-w-7xl interno per non doppiare il layout.
  noContainer?: boolean;
  // 'plain-card': avvolge con lo stesso stile "card bianca con bordo" delle
  // altre sezioni della pagina prodotto (Recensioni, Prodotti correlati).
  // Il wrapper è gestito QUI DENTRO, non dal chiamante: se non c'è nulla da
  // sponsorizzare l'intero componente (wrapper incluso) semplicemente non
  // compare, mai un riquadro vuoto.
  variant?: 'default' | 'plain-card';
}

// Bucket temporale di 30 minuti: la selezione tra più sponsor pertinenti
// cambia nel tempo (non a ogni singolo render/refresh) così ogni candidato
// ottiene esposizione nell'arco della giornata, senza dover introdurre un
// sistema di rotazione lato server per questa prima versione.
function timeBucket(): number {
  return Math.floor(Date.now() / (30 * 60 * 1000));
}

export function SponsoredHeroCard({ contextCategory, interestCategories, className, noContainer, variant = 'default' }: SponsoredHeroCardProps) {
  const { t, i18n } = useTranslation();
  const [product, setProduct] = useState<SponsoredProduct | null>(null);
  const [rating, setRating] = useState<{ avg: number; count: number }>({ avg: 0, count: 0 });
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    loadSponsored();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextCategory, JSON.stringify(interestCategories)]);

  const loadSponsored = async () => {
    try {
      const candidateCategories = contextCategory
        ? [contextCategory]
        : (interestCategories && interestCategories.length > 0 ? interestCategories : null);

      let rows: any[] = [];
      if (candidateCategories) {
        const { data } = await supabase.from('products')
          .select('id, name, price, images, translations')
          .eq('is_sponsored', true)
          .eq('status', 'published')
          .in('category', candidateCategories)
          .limit(20);
        rows = data || [];
      }
      // Fallback: nessun candidato pertinente alla categoria/interessi —
      // meglio mostrare uno sponsorizzato generico che non mostrare nulla,
      // la sezione resta comunque utile e lo sponsor riceve visibilità.
      if (rows.length === 0) {
        const { data } = await supabase.from('products')
          .select('id, name, price, images, translations')
          .eq('is_sponsored', true)
          .eq('status', 'published')
          .limit(20);
        rows = data || [];
      }
      if (rows.length === 0) { setProduct(null); return; }

      const idx = timeBucket() % rows.length;
      const chosen = localizeProduct(rows[idx], i18n.language);
      setProduct(chosen);

      const { data: reviews } = await supabase.from('product_reviews')
        .select('rating')
        .eq('product_id', chosen.id);
      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((s, r: any) => s + r.rating, 0) / reviews.length;
        setRating({ avg, count: reviews.length });
      } else {
        setRating({ avg: 0, count: 0 });
      }
    } catch (err) {
      console.error('Errore caricamento sponsorizzato hero:', err);
      setProduct(null);
    }
  };

  if (!product) return null;

  const content = (
    <>
      <Link to={`/negozio/prodotto/${product.id}`}
        className="group flex items-center gap-6 bg-gray-50 rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-primary/30 transition-all">
        <div className="w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 bg-white rounded-xl overflow-hidden flex items-center justify-center">
          <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-contain p-2" loading="lazy" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-2xl font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
          {rating.count > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm font-medium text-gray-700">{rating.avg.toFixed(1)}</span>
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(rating.avg) ? 'fill-secondary text-secondary' : 'text-gray-300'}`} />
                ))}
              </div>
              <span className="text-sm text-gray-500">{rating.count}</span>
            </div>
          )}
          <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-2">
            €{Number(product.price).toFixed(2)}
          </p>
        </div>
      </Link>
      <div className="flex justify-end mt-2 relative">
        <button
          onClick={e => { e.preventDefault(); setShowInfo(v => !v); }}
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
          {t('home.sponsoredLabel')} <Info className="w-3.5 h-3.5" />
        </button>
        {showInfo && (
          <div className="absolute top-6 right-0 z-10 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs text-gray-600">
            {t('home.sponsoredInfoText')}
          </div>
        )}
      </div>
    </>
  );

  if (variant === 'plain-card') {
    return <div className={`bg-white px-4 py-4 md:rounded-xl md:border md:border-gray-200 ${className || ''}`}>{content}</div>;
  }

  if (noContainer) {
    return <div className={className}>{content}</div>;
  }

  return (
    <section className={`py-8 bg-white ${className || ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {content}
      </div>
    </section>
  );
}
