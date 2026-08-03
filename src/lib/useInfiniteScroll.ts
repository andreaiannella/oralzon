import { useEffect, useRef } from 'react';

/**
 * Attiva onIntersect quando l'elemento "sentinella" ritornato da questo hook
 * entra nella viewport — sostituisce un pulsante "carica altri" con un
 * caricamento automatico quando l'utente scrolla verso il fondo.
 *
 * rootMargin anticipa il trigger di 300px prima che la sentinella sia
 * realmente visibile: il prossimo blocco di risultati è così già pronto
 * quando l'utente arriva in fondo, invece di fargli vedere uno scatto a
 * schermo mentre aspetta il caricamento.
 *
 * onIntersect viene tenuto in un ref sempre aggiornato (non nelle
 * dipendenze dell'effetto) apposta: altrimenti, essendo quasi sempre una
 * funzione nuova ad ogni render del chiamante, l'observer verrebbe distrutto
 * e ricreato in continuazione invece di restare stabile.
 */
export function useInfiniteScroll(onIntersect: () => void, enabled: boolean) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onIntersect);
  callbackRef.current = onIntersect;

  useEffect(() => {
    if (!enabled) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) callbackRef.current();
      },
      { rootMargin: '300px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return sentinelRef;
}
