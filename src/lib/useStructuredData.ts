import { useEffect } from 'react';

// Nessuna pagina — a parte la home, con lo schema WebSite statico in
// index.html — aveva dati strutturati (schema.org). Significa niente rich
// snippet su Google: prezzo, disponibilità, valutazioni mostrate
// direttamente nel risultato di ricerca invece che solo titolo+descrizione.
// È una delle leve a più alto impatto sul click-through rate per il minor
// sforzo che esista in SEO, ed era completamente assente.
//
// key distingue lo script iniettato da questo hook da quello statico della
// home (mai toccato) e permette a pagine diverse di sostituire il proprio
// senza interferire con altre.
export function useStructuredData(data: object | null, key: string = 'page-schema') {
  useEffect(() => {
    if (!data) return;
    let script = document.querySelector(`script[data-schema-key="${key}"]`) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-schema-key', key);
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);

    return () => { script?.remove(); };
  }, [JSON.stringify(data), key]);
}
