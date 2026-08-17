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
      // FUNZIONE DEDICATA AI SUGGERIMENTI.
      //
      // Prima si chiamava search_product_ids, che restituisce fino a 2.000
      // identificativi: se ne tenevano 6 e si faceva una SECONDA query per
      // caricarli. Due viaggi di rete e duemila identificativi trasferiti
      // per mostrare sei righe.
      //
      // Misurato su un catalogo di prova da 50.000 prodotti: 168 ms contro
      // 16 della funzione dedicata, un solo viaggio di rete. Conta più di
      // quanto sembri perché questa è la query a frequenza più alta della
      // piattaforma — parte mentre l'utente digita, quindi molte volte per
      // ogni singola ricerca.
      //
      // I suggerimenti NON espandono i sinonimi, di proposito: chi digita
      // vede comparire il prodotto e si ferma, gli serve velocità e
      // prevedibilità su ciò che ha scritto. L'espansione resta nella
      // ricerca completa, che parte premendo Invio ed è il momento in cui
      // vale la pena cercare più a fondo.
      const { data: suggeriti } = await supabase.rpc('search_suggestions', {
        p_query: trimmed,
        p_lang: language,
        p_limite: MAX_RESULTS,
      });
      const data = (suggeriti as any[]) || [];

      // Se nel frattempo l'utente ha continuato a digitare, questa risposta
      // è già superata — non sovrascrivere risultati più recenti con uno
      // arrivato in ritardo dal server (le risposte di rete non sono
      // garantite arrivare nello stesso ordine in cui sono partite).
      if (currentRequest !== requestId.current) return;

      // La funzione restituisce già il nome nella lingua richiesta e la sola
      // immagine che serve: non si trasferisce più l'intero oggetto delle
      // traduzioni per ogni riga, né si estrae il nome nel browser.
      const results: SearchSuggestion[] = (data || []).map((p: any) => {
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image || null,
        };
      });
      setSuggestions(results);
      setLoading(false);
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, language]);

  return { suggestions, loading };
}
