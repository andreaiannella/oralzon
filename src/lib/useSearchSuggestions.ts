import { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

export interface SearchSuggestion {
  id: string;
  name: string;
  price: number;
  image: string | null;
}

// Numero minimo di caratteri prima di interrogare il database — sotto
// questa soglia i risultati sarebbero troppo generici per essere utili
// e si spreca solo una chiamata di rete ad ogni tasto premuto.
const MIN_CHARS = 2;
const DEBOUNCE_MS = 250;
const MAX_RESULTS = 6;

/**
 * Ricerca prodotti "mentre digiti", stile Amazon: aspetta una breve pausa
 * nella digitazione (debounce) prima di interrogare il database, così non
 * si lancia una query ad ogni singolo tasto premuto. Ritorna al massimo
 * MAX_RESULTS prodotti con nome localizzato, prezzo e miniatura.
 */
export function useSearchSuggestions(query: string, language: string) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_CHARS) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const currentRequest = ++requestId.current;

    const timer = setTimeout(async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, price, images, images_thumb, translations')
        .eq('status', 'published')
        .ilike('name', `%${trimmed}%`)
        .limit(MAX_RESULTS);

      // Se nel frattempo l'utente ha continuato a digitare, questa risposta
      // è già superata — non sovrascrivere risultati più recenti con uno
      // arrivato in ritardo dal server (le risposte di rete non sono
      // garantite arrivare nello stesso ordine in cui sono partite).
      if (currentRequest !== requestId.current) return;

      const results: SearchSuggestion[] = (data || []).map((p: any) => {
        const t = language !== 'it' ? p.translations?.[language] : null;
        return {
          id: p.id,
          name: t?.name || p.name,
          price: p.price,
          image: p.images_thumb?.[0] || p.images?.[0] || null,
        };
      });
      setSuggestions(results);
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, language]);

  return { suggestions, loading };
}
