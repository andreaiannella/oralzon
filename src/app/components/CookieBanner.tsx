import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Cookie, X, Check } from 'lucide-react';

const COOKIE_KEY = 'dc_cookie_consent';

export function CookieBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_KEY);
    if (!consent) setVisible(true);
  }, []);

  const accept = () => { localStorage.setItem(COOKIE_KEY, 'accepted'); setVisible(false); };
  const decline = () => { localStorage.setItem(COOKIE_KEY, 'declined'); setVisible(false); };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto bg-gray-900 text-white rounded-2xl shadow-2xl p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Cookie className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-white mb-1">{t('cookie.title')}</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              {t('cookie.desc')} Puoi gestire le preferenze in qualsiasi momento.{' '}
              <Link to="/cookie" className="text-primary hover:underline">Cookie Policy</Link> ·{' '}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
            </p>
          </div>
          <button onClick={decline} className="text-gray-400 hover:text-white flex-shrink-0 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex gap-3 mt-4 justify-end">
          <button onClick={decline}
            className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:border-gray-400 transition-colors">
            {t('cookie.essentialOnly')}
          </button>
          <button onClick={accept}
            className="px-5 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />{t('cookie.acceptAll')}
          </button>
        </div>
      </div>
    </div>
  );
}
