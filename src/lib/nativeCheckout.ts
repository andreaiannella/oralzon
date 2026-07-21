import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import type { NavigateFunction } from 'react-router-dom';

// Schema custom registrato in iOS (Info.plist) e Android (AndroidManifest.xml)
// — non è un URL http, è un protocollo che il sistema operativo instrada
// direttamente alla nostra app invece che al browser.
export const APP_URL_SCHEME = 'oralzon';

/**
 * Apre l'URL di Stripe Checkout (o di un altro flusso di pagamento esterno).
 * - Sul sito web: comportamento identico a prima, stessa scheda.
 * - Nell'app nativa: usa il browser in-app di Capacitor (SFSafariViewController
 *   su iOS, Custom Tabs su Android) invece di window.location.href — che
 *   altrimenti fa uscire l'utente nel browser di sistema e non torna più
 *   automaticamente nell'app dopo il pagamento.
 */
export async function openCheckoutUrl(url: string) {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.location.href = url;
  }
}

/**
 * Da chiamare una sola volta, in alto nell'albero dei componenti (dentro
 * BrowserRouter, per avere accesso a useNavigate). Intercetta il rientro
 * nell'app dopo che Stripe ha completato il pagamento e redirige l'utente
 * sulla pagina di conferma corretta, chiudendo prima il browser in-app.
 */
export function registerCheckoutReturnListener(navigate: NavigateFunction) {
  if (!Capacitor.isNativePlatform()) return () => {};

  const handler = async (event: URLOpenListenerEvent) => {
    const url = event.url || '';
    if (!url.startsWith(`${APP_URL_SCHEME}://`)) return;

    // Chiude il browser in-app aperto per il checkout, se ancora presente.
    try { await Browser.close(); } catch { /* già chiuso, non bloccante */ }

    let path = '/';
    try {
      // new URL() non gestisce benissimo gli schemi custom su tutte le
      // piattaforme: normalizziamo sostituendo lo schema con https così
      // il parser standard legge correttamente host/path/query.
      const parsed = new URL(url.replace(`${APP_URL_SCHEME}://`, 'https://oralzon-app/'));
      const sessionId = parsed.searchParams.get('session_id');
      const type = parsed.searchParams.get('type');
      const qs = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : '';

      if (type === 'order') path = `/ordine-completato${qs}`;
      else if (type === 'vendor-plan') path = `/venditore/piano-attivato${qs}`;
      else if (type === 'vendor-promo') path = `/venditore/promozione-attivata${qs}`;
      else if (type === 'order-cancel') path = '/checkout';
      else if (type === 'vendor-cancel') path = '/pricing-venditori';
    } catch {
      path = '/';
    }

    navigate(path);
  };

  const listenerPromise = App.addListener('appUrlOpen', handler);
  return () => { listenerPromise.then(l => l.remove()); };
}
