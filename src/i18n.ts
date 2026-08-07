import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { Capacitor } from '@capacitor/core';

// Sul WEB la lingua è determinata dal prefisso URL (vedi lib/urlLanguage.ts
// e App.tsx), non più dal rilevamento automatico del browser — necessario
// perché un URL debba mostrare sempre lo stesso contenuto a chiunque lo
// apra, incluso Google: se la lingua dipendesse dalle impostazioni del
// browser di chi visita, la stessa pagina "cambierebbe" senza cambiare
// indirizzo, rendendo inutile l'intera struttura hreflang.
// Sull'APP NATIVA invece non esiste concetto di URL/indicizzazione — lì
// resta corretto rilevare la lingua di sistema del dispositivo, come prima.
const isNative = Capacitor.isNativePlatform();

const plugins = isNative ? [Backend, LanguageDetector, initReactI18next] : [Backend, initReactI18next];

let instance = i18n;
plugins.forEach(p => { instance = instance.use(p); });

instance.init({
    fallbackLng: 'en',
    lng: isNative ? undefined : 'it', // sul web parte sempre da italiano; App.tsx corregge subito se l'URL indica un'altra lingua
    supportedLngs: ['it', 'en', 'es', 'fr', 'de', 'pt', 'nl', 'tr'],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    detection: isNative ? {
      // Solo app nativa: la lingua si rileva dal sistema operativo del
      // dispositivo (Capacitor riflette la lingua di sistema in navigator.language).
      order: ['navigator', 'htmlTag'],
      caches: [],
    } : undefined,
    react: {
      useSuspense: false,
    },
  });

export default i18n;
