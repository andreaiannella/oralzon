import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { ChevronDown, Globe } from 'lucide-react';
import { getBasename, buildLocalizedPath, SUPPORTED_URL_LANGS } from '../../lib/urlLanguage';

const LANG_LABELS: Record<string, string> = {
  it: 'Italiano', en: 'English', es: 'Español', fr: 'Français',
  de: 'Deutsch', pt: 'Português', nl: 'Nederlands', pl: 'Polski',
};

// Selettore lingua manuale — prima non esisteva nessun modo per un
// visitatore di scegliere la lingua a mano (si rilevava solo dal browser).
// Ora che la lingua è nell'URL (vedi lib/urlLanguage.ts), serve un modo
// esplicito per cambiarla: il cambio avviene con una navigazione completa
// (non client-side), perché il basename di React Router è fissato
// all'avvio della pagina e non può cambiare a runtime senza ricaricare.
export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Nessun selettore dentro l'app nativa: lì la lingua segue il sistema
  // operativo del dispositivo, non ha senso un concetto di "URL in un'altra lingua".
  if (Capacitor.isNativePlatform()) return null;

  const currentLang = i18n.language || 'it';
  const allLangs = ['it', ...SUPPORTED_URL_LANGS];
  const basename = getBasename(window.location.pathname);
  const fullPathname = basename + location.pathname;

  const switchTo = (lang: string) => {
    setOpen(false);
    window.location.href = buildLocalizedPath(fullPathname, lang);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary transition-colors px-2 py-1.5 rounded-lg hover:bg-gray-50"
        aria-label="Cambia lingua"
      >
        <Globe className="w-4 h-4" />
        <span className="uppercase font-medium hidden sm:inline">{currentLang}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 min-w-[160px] z-50">
          {allLangs.map(lang => (
            <button
              key={lang}
              onClick={() => switchTo(lang)}
              className={`w-full text-left px-3.5 py-2 text-sm hover:bg-gray-50 transition-colors flex items-center justify-between ${lang === currentLang ? 'text-primary font-semibold' : 'text-gray-700'}`}
            >
              {LANG_LABELS[lang]}
              <span className="text-xs text-gray-400 uppercase">{lang}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
