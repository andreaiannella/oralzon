import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Loader2 } from 'lucide-react';
import { SearchSuggestion } from '../../lib/useSearchSuggestions';

const FALLBACK_IMG = '/images/product-placeholder.svg';

/**
 * Dropdown dei suggerimenti sotto il campo ricerca — miniatura + nome +
 * prezzo per ogni prodotto, aggiornato mentre si digita. In fondo un link
 * per vedere tutti i risultati completi (comportamento identico a prima,
 * l'anteprima è un'aggiunta, non una sostituzione della ricerca completa).
 */
export function SearchSuggestionsDropdown({ query, suggestions, loading, onSelect }: {
  query: string;
  suggestions: SearchSuggestion[];
  loading: boolean;
  onSelect: () => void;
}) {
  const { t } = useTranslation();
  const trimmed = query.trim();
  if (trimmed.length < 2) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-2xl border border-border z-50 overflow-hidden">
      {loading && suggestions.length === 0 ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-gray-300" />
        </div>
      ) : suggestions.length === 0 ? (
        <p className="px-4 py-4 text-sm text-gray-500">{t('nav.noSuggestions', { query: trimmed })}</p>
      ) : (
        <>
          <div className="max-h-96 overflow-y-auto">
            {suggestions.map(s => (
              <Link
                key={s.id}
                to={`/negozio/prodotto/${s.id}`}
                onClick={onSelect}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors border-b border-border last:border-0"
              >
                <div className="w-11 h-11 bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden">
                  <img src={s.image || FALLBACK_IMG} alt="" className="w-full h-full object-contain p-1"
                    onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{s.name}</p>
                </div>
                <span className="text-sm font-semibold text-primary flex-shrink-0">€{Number(s.price).toFixed(2)}</span>
              </Link>
            ))}
          </div>
          <Link
            to={`/negozio?q=${encodeURIComponent(trimmed)}`}
            onClick={onSelect}
            className="flex items-center gap-2 px-4 py-3 bg-gray-50 hover:bg-accent text-sm font-medium text-primary transition-colors"
          >
            <Search className="w-4 h-4" /> {t('nav.seeAllResultsFor', { query: trimmed })}
          </Link>
        </>
      )}
    </div>
  );
}
