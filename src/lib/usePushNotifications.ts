import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
import { callEdge } from '../lib/edgeApi';

// Attivo solo dentro l'app nativa (iOS/Android via Capacitor). Sul sito web
// normale questo hook non fa assolutamente nulla — nessun impatto, nessuna
// richiesta di permesso, nessun errore per chi naviga da browser.
export function usePushNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !Capacitor.isNativePlatform()) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }
      if (permStatus.receive !== 'granted') return; // l'utente ha rifiutato, rispettiamo la scelta

      await PushNotifications.register();

      const onRegistration = PushNotifications.addListener('registration', async (token) => {
        try {
          await callEdge('/push/register-token', {
            body: { deviceToken: token.value, platform: Capacitor.getPlatform() },
          });
        } catch (e) {
          console.error('Impossibile registrare il token per le notifiche push:', e);
        }
      });

      const onError = PushNotifications.addListener('registrationError', (err) => {
        console.error('Errore registrazione notifiche push:', err);
      });

      cleanup = () => {
        onRegistration.remove();
        onError.remove();
      };
    })();

    return () => { cleanup?.(); };
  }, [user]);
}
