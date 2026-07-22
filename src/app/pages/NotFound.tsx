import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Search, ShoppingBag } from 'lucide-react';
import logo from '../../imports/logo_login.svg';

export function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-lg">
        <img src={logo} alt="Oralzon" className="h-12 w-auto mx-auto mb-8 opacity-60" />
        <div className="text-8xl font-black text-primary/20 mb-4 select-none">404</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">{t('notFound.title')}</h1>
        <p className="text-gray-500 mb-8">{t('notFound.desc')}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors">
            <Home className="w-4 h-4" />{t('notFound.backHome')}
          </Link>
          <Link to="/negozio" className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
            <ShoppingBag className="w-4 h-4" />{t('notFound.goToShop')}
          </Link>
        </div>
      </div>
    </div>
  );
}
