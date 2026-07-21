import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['it', 'en', 'es', 'fr', 'de', 'pt', 'ar', 'ru', 'tr', 'nl'],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    backend: {
      loadPath: '/locales/{{lng}}/translation.json',
    },
    detection: {
      // Nessun selettore manuale nell'interfaccia: la lingua si rileva
      // sempre dal browser (web) o dal sistema operativo del dispositivo
      // (app nativa, dove Capacitor riflette la lingua di sistema in
      // navigator.language). Se la lingua rilevata non è tra quelle
      // tradotte, fallbackLng la porta in inglese.
      order: ['navigator', 'htmlTag'],
      caches: [],
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
