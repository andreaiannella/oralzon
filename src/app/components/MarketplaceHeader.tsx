import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { Search, ShoppingCart, Heart, User, Menu, ChevronDown, Package, LogOut, LayoutDashboard, X, Settings, Home as HomeIcon, CircleUserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import logoDesktop from '../../imports/logo_desktop.png';
import logoHeaderApp from '../../imports/logo_header_app.svg';
import { DENTAL_CATEGORIES } from '../../constants/categories';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';

export function MarketplaceHeader() {
  const { user, profile, signOut } = useAuth();
  const { itemCount } = useCart();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showCategories, setShowCategories] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [appAccountMenuOpen, setAppAccountMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const appAccountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (appAccountMenuRef.current && !appAccountMenuRef.current.contains(e.target as Node)) setAppAccountMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/negozio?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    navigate('/');
  };

  const isVendor = profile?.user_type === 'venditore';
  const isAdmin = profile?.user_type === 'admin';
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || '';

  const quickLinks = [
    { key: 'offers', label: t('nav.offers'), slug: 'offerte' },
    { key: 'bestseller', label: t('nav.bestseller'), slug: 'bestseller' },
    { key: 'newArrivals', label: t('nav.newArrivals'), slug: 'nuovi-arrivi' },
    { key: 'disposable', label: t('nav.disposable'), slug: 'monouso' },
    { key: 'sterilization', label: t('nav.sterilization'), slug: 'sterilizzazione' },
    { key: 'implantology', label: t('nav.implantology'), slug: 'implantologia' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      {/* Main Header */}
      <div className="bg-primary text-white pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 relative">
            <Link to="/" className="flex-shrink-0 hidden lg:block">
              <img src={logoDesktop} alt="Oralzon" className="h-12 w-auto" />
            </Link>
            {/* Riga mobile/app: griglia a 3 colonne, così sinistra/centro/destra
                restano sempre nella posizione corretta qualunque sia il
                contenuto — niente più logica di centraggio assoluto fragile. */}
            <div className="lg:hidden grid grid-cols-3 items-center w-full h-16">
              {/* Sinistra: icona Home, solo dentro l'app nativa (sul sito
                  mobile via browser questa colonna resta vuota) */}
              <div className="flex items-center">
                {Capacitor.isNativePlatform() && (
                  <Link to="/" className="p-2 flex items-center justify-center hover:opacity-80" aria-label={t('nav.home') || 'Home'}>
                    <HomeIcon className="w-7 h-7" strokeWidth={2} />
                  </Link>
                )}
              </div>

              {/* Centro: logo Oralzon (mark + wordmark) */}
              <Link to="/" className="flex items-center justify-self-center">
                <img src={logoHeaderApp} alt="Oralzon" className="h-10 w-auto flex-shrink-0" />
              </Link>

              {/* Destra: dentro l'app nativa solo l'icona Account (il
                  carrello resta esclusivamente nella barra in basso, niente
                  doppioni); sul sito mobile via browser restano invece
                  carrello + menu hamburger come sempre. L'icona Account in
                  app serve principalmente per accedere/uscire — il resto
                  della navigazione (profilo, ordini, ecc.) passa dalla
                  barra in basso — quindi da loggati apre un piccolo menu
                  con "Esci" invece di portare dritti al profilo. */}
              <div className="flex items-center justify-end gap-1">
                {Capacitor.isNativePlatform() ? (
                  <div className="relative" ref={appAccountMenuRef}>
                    <button
                      onClick={() => user ? setAppAccountMenuOpen(!appAccountMenuOpen) : navigate('/login')}
                      className="p-2 flex items-center justify-center hover:opacity-80"
                      aria-label={t('nav.account') || 'Account'}
                    >
                      <CircleUserRound className="w-7 h-7" strokeWidth={2} />
                    </button>
                    {appAccountMenuOpen && user && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setAppAccountMenuOpen(false)} />
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                          <div className="px-4 py-2 border-b border-gray-100">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {`${(profile as any)?.nome || ''} ${(profile as any)?.cognome || ''}`.trim() || firstName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{user.email}</p>
                          </div>
                          <button
                            onClick={() => { setAppAccountMenuOpen(false); handleSignOut(); }}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-red-600 w-full text-left"
                          >
                            <LogOut className="w-4 h-4" /> {t('nav.logout')}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    {!isVendor && (
                      <Link to="/carrello" className="relative p-2 hover:opacity-80">
                        <ShoppingCart className="w-5 h-5" />
                        {itemCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 bg-secondary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                            {itemCount > 9 ? '9+' : itemCount}
                          </span>
                        )}
                      </Link>
                    )}
                    <button className="p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                      {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="hidden lg:flex items-center gap-3 flex-1 max-w-4xl mx-4">
              <div className="relative">
                <button type="button" onClick={() => setShowCategories(!showCategories)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors whitespace-nowrap">
                  <Menu className="w-5 h-5" />
                  <span className="text-sm">{t('nav.allCategories')}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                {showCategories && (
                  <><div className="fixed inset-0 z-40" onClick={() => setShowCategories(false)} />
                  <div className="absolute top-full left-0 mt-2 w-72 bg-white rounded-lg shadow-2xl border border-border z-50 max-h-96 overflow-y-auto">
                    {DENTAL_CATEGORIES.map(c => (
                      <Link key={c.id} to={`/negozio/categoria/${c.slug}`}
                        className="block px-4 py-3 text-foreground hover:bg-accent transition-colors border-b border-border last:border-0"
                        onClick={() => setShowCategories(false)}>{c.name}</Link>
                    ))}
                  </div></>
                )}
              </div>
              <div className="flex-1 relative">
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder={t('nav.searchPlaceholder')}
                  className="w-full px-4 py-3.5 pr-28 bg-white text-gray-900 placeholder:text-gray-600 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-secondary shadow-sm"
                  style={{ height: '48px' }} />
                <button type="submit" className="absolute right-1.5 top-1/2 -translate-y-1/2 px-7 py-2.5 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-all shadow-sm flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  <span className="hidden xl:inline text-sm">{t('nav.search')}</span>
                </button>
              </div>
            </form>

            {/* Account / Cart */}
            <div className="hidden lg:flex items-center gap-4">
              <div className="relative" ref={menuRef}>
                <button onClick={() => user ? setUserMenuOpen(!userMenuOpen) : navigate('/login')}
                  className="flex flex-col hover:opacity-80 transition-opacity text-left">
                  {user ? (
                    <><span className="text-xs opacity-90">{t('nav.hello', { name: firstName })}</span>
                    <span className="text-sm font-medium flex items-center gap-1">{t('nav.account')} <ChevronDown className="w-3 h-3" /></span></>
                  ) : (
                    <><span className="text-xs opacity-90">{t('nav.helloSignIn')}</span>
                    <span className="text-sm">{t('nav.accountOrders')}</span></>
                  )}
                </button>
                {userMenuOpen && user && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{`${(profile as any)?.nome || ''} ${(profile as any)?.cognome || ''}`.trim() || firstName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    {isVendor ? (
                      <Link to="/venditore/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-primary font-medium">
                        <LayoutDashboard className="w-4 h-4" /> {t('nav.vendorDashboard')}
                      </Link>
                    ) : (
                      <>
                        <Link to="/account/profilo" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700">
                          <User className="w-4 h-4 text-gray-400" /> {t('nav.myProfile')}
                        </Link>
                        <Link to="/account/ordini" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700">
                          <Package className="w-4 h-4 text-gray-400" /> {t('nav.myOrders')}
                        </Link>
                        <Link to="/account/preferiti" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700">
                          <Heart className="w-4 h-4 text-gray-400" /> {t('nav.wishlist')}
                        </Link>
                        <Link to="/account/impostazioni" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700">
                          <Settings className="w-4 h-4 text-gray-400" /> {t('account.settings')}
                        </Link>
                      </>
                    )}
                    {isAdmin && (
                      <Link to="/dashboard-admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-secondary font-medium">
                        <LayoutDashboard className="w-4 h-4" /> {t('nav.adminDashboard')}
                      </Link>
                    )}
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button onClick={handleSignOut} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 text-sm text-red-600 w-full text-left">
                        <LogOut className="w-4 h-4" /> {t('nav.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {!isVendor && (
                <Link to={user ? "/account/ordini" : "/login"} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Package className="w-5 h-5" />
                  <span className="text-sm">{t('nav.myOrders')}</span>
                </Link>
              )}
              {!isVendor && (
                <Link to={user ? "/account/preferiti" : "/login"} className="relative hover:opacity-80">
                  <Heart className="w-6 h-6" />
                </Link>
              )}
              {!isVendor && (
                <Link to="/carrello" className="relative hover:opacity-80">
                  <ShoppingCart className="w-6 h-6" />
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-secondary text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
                      {itemCount > 99 ? '99+' : itemCount}
                    </span>
                  )}
                </Link>
              )}
            </div>


          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="hidden lg:block bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-6 h-11 text-sm">
            {quickLinks.map(cat => (
              <Link key={cat.key} to={`/negozio/categoria/${cat.slug}`} className="text-foreground hover:text-secondary transition-colors">
                {cat.label}
              </Link>
            ))}
            <Link to="/diventa-venditore" className="ml-auto px-6 py-2 bg-secondary text-white rounded-full hover:bg-secondary/90 transition-all shadow-sm">
              {t('nav.sellOnOralzon')}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <form onSubmit={handleSearch} className="lg:hidden bg-white px-4 py-3 border-b border-border">
        <div className="relative">
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('nav.searchPlaceholder')}
            className="w-full px-4 py-3 pr-14 bg-white text-gray-900 border-2 border-gray-300 rounded-lg" />
          <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-secondary text-white rounded-md">
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-white px-4 py-4 space-y-1">
          {user ? (
            <>
              <div className="text-sm font-medium text-gray-900 py-2 mb-1">{t('nav.hello', { name: firstName })}</div>
              {isVendor ? (
                <Link to="/venditore/dashboard" className="flex items-center gap-3 py-2.5 text-sm text-primary font-medium" onClick={() => setMobileMenuOpen(false)}>
                  <LayoutDashboard className="w-4 h-4" /> {t('nav.vendorDashboard')}
                </Link>
              ) : (
                <>
                  <Link to="/account/profilo" className="flex items-center gap-3 py-2.5 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                    <User className="w-4 h-4 text-gray-400" /> {t('nav.myProfile')}
                  </Link>
                  <Link to="/account/ordini" className="flex items-center gap-3 py-2.5 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                    <Package className="w-4 h-4 text-gray-400" /> {t('nav.myOrders')}
                  </Link>
                  <Link to="/account/preferiti" className="flex items-center gap-3 py-2.5 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                    <Heart className="w-4 h-4 text-gray-400" /> {t('nav.wishlist')}
                  </Link>
                  <Link to="/account/impostazioni" className="flex items-center gap-3 py-2.5 text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>
                    <Settings className="w-4 h-4 text-gray-400" /> {t('account.settings')}
                  </Link>
                </>
              )}
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button onClick={handleSignOut} className="flex items-center gap-3 py-2.5 text-sm text-red-600 w-full text-left">
                  <LogOut className="w-4 h-4" /> {t('nav.logout')}
                </button>
              </div>
            </>
          ) : (
            <Link to="/login" className="block py-2 text-sm font-medium text-primary" onClick={() => setMobileMenuOpen(false)}>{t('auth.login')} / {t('auth.createAccountBtn')}</Link>
          )}
        </div>
      )}
    </header>
  );
}
