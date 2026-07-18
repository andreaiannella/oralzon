import type { CapacitorConfig } from '@capacitor/cli';

// L'app nativa non incorpora una copia statica del sito: punta al sito reale
// in produzione (server.url). Questo significa che aggiornamenti al
// catalogo, prezzi, funzionalità del sito sono immediati anche dentro l'app,
// senza dover ricompilare e ripassare la revisione di App Store/Play Store
// ogni volta — esattamente come funzionano le app di Amazon, eBay, ecc.
// Serve una nuova build e sottomissione solo quando cambia qualcosa di
// "nativo" vero e proprio (icona, notifiche push, permessi, plugin nuovi).
const config: CapacitorConfig = {
  appId: 'com.oralzon.app',
  appName: 'Oralzon',
  webDir: 'dist',
  server: {
    url: 'https://oralzon.netlify.app',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0F7A68', // Deep Mint, colore Oralzon
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
