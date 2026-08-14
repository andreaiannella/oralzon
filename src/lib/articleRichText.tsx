// ── Link interni dentro i paragrafi degli articoli del blog ─────────────
//
// I paragrafi degli articoli sono stringhe semplici (string[]) e finora
// venivano stampati così com'erano dentro un <p>. Questo componente aggiunge
// una sola cosa: la sintassi in stile markdown [testo](/percorso), che viene
// convertita in un <Link> di React Router.
//
// Serve per il linking interno verso il catalogo: un articolo su un tipo di
// prodotto rimanda alla ricerca che elenca TUTTI i prodotti di quel tipo
// presenti sul marketplace (es. /negozio?q=how%20diritta), non a un singolo
// prodotto — così il link resta valido anche quando il prodotto di oggi non
// c'è più e altri venditori ne hanno caricati di nuovi.
//
// Sicurezza: si accettano SOLO percorsi interni che iniziano con "/". Un URL
// esterno (http://, //, javascript:) non viene mai trasformato in link e
// resta testo inerte. Il prefisso lingua non va scritto nel percorso: il
// <BrowserRouter basename={...}> lo aggiunge da solo, quindi lo stesso
// "/negozio?q=..." funziona identico su /en, /pl e sull'italiano.

import { Link } from 'react-router-dom';
import { ReactNode } from 'react';

const LINK_PATTERN = /\[([^\]]+)\]\((\/[^)\s]*)\)/g;

export function isInternalPath(href: string): boolean {
  return href.startsWith('/') && !href.startsWith('//');
}

/**
 * Trasforma "testo con [link](/percorso) dentro" in nodi React.
 * Se non c'è nessun link, restituisce la stringa invariata — nessun costo.
 */
export function renderArticleText(text: string): ReactNode {
  LINK_PATTERN.lastIndex = 0;
  if (!LINK_PATTERN.test(text)) return text;

  LINK_PATTERN.lastIndex = 0;
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = LINK_PATTERN.exec(text)) !== null) {
    const [full, label, href] = match;
    if (match.index > cursor) nodes.push(text.slice(cursor, match.index));

    if (isInternalPath(href)) {
      nodes.push(
        <Link
          key={key++}
          to={href}
          className="text-primary font-medium underline underline-offset-2 hover:no-underline"
        >
          {label}
        </Link>
      );
    } else {
      // Percorso non interno: nessun link, si stampa il solo testo.
      nodes.push(label);
    }
    cursor = match.index + full.length;
  }

  if (cursor < text.length) nodes.push(text.slice(cursor));
  return nodes;
}

/**
 * Versione in testo puro, per meta description e dati strutturati: rimuove
 * la sintassi dei link lasciando solo l'etichetta. Senza questo, un
 * [testo](/percorso) finirebbe letteralmente dentro il tag <meta>.
 */
export function stripArticleLinks(text: string): string {
  return text.replace(LINK_PATTERN, '$1');
}
