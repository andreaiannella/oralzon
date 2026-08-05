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
 *
 * BUG TROVATO IN PRODUZIONE: senza la guardia 'firedRef' sotto, la stessa
 * pagina di prodotti poteva essere richiesta e aggiunta DUE VOLTE, causando
 * prodotti duplicati in griglia. Causa: 'enabled' diventa false solo dopo
 * che React ha rielaborato lo stato 'loadingMore' impostato dal chiamante
 * — un aggiornamento ASINCRONO. Nella breve finestra prima di quel
 * re-render, l'observer (ancora attivo) può scattare una seconda volta per
 * lo stesso ingresso in viewport, richiamando onIntersect con lo stesso
 * numero di pagina già in corso di caricamento. firedRef è un ref, quindi
 * si aggiorna in modo SINCRONO, senza aspettare un giro di render: blocca
 * il secondo trigger nello stesso istante in cui avviene il primo.
 */
export function useInfiniteScroll(onIntersect: () => void, enabled: boolean) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onIntersect);
  callbackRef.current = onIntersect;
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    firedRef.current = false; // pronto per un nuovo trigger ogni volta che l'osservazione (ri)parte
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !firedRef.current) {
          firedRef.current = true;
          callbackRef.current();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return sentinelRef;
}
