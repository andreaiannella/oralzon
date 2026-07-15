import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { code: 'it', label: 'Italiano',   flag: '🇮🇹' },
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'pt', label: 'Português',  flag: '🇧🇷' },
  { code: 'ar', label: 'العربية',    flag: '🇸🇦' },
  { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
  { code: 'tr', label: 'Türkçe',     flag: '🇹🇷' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find(l => l.code === i18n.language?.slice(0, 2)) || LANGUAGES[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    document.documentElement.dir = i18n.language?.startsWith('ar') ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language?.slice(0, 2) || 'it';
  }, [i18n.language]);

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('dc_language', code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white border border-white/20"
        title="Change language"
        aria-label="Select language"
      >
        {/* Icona globo SVG custom */}
        <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4 flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
          <circle cx="10" cy="10" r="8.5" stroke="currentColor" strokeWidth="1.4"/>
          <ellipse cx="10" cy="10" rx="3.5" ry="8.5" stroke="currentColor" strokeWidth="1.4"/>
          <path d="M1.5 10h17M2.5 6.5h15M2.5 13.5h15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span className="text-sm font-medium">{current.flag}</span>
        <span className="hidden sm:inline text-xs font-semibold tracking-wide opacity-90">{current.code.toUpperCase()}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 opacity-80 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden py-1.5">
            <p className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Lingua / Language
            </p>
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => handleChange(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                  current.code === lang.code
                    ? 'bg-primary/8 text-primary font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl w-7 text-center leading-none">{lang.flag}</span>
                <span className="flex-1">{lang.label}</span>
                {current.code === lang.code && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
