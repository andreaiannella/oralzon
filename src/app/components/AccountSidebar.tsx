import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, ShoppingBag, Heart, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const menuItems = [
  { icon: User, label: 'Profilo', path: '/account/profilo' },
  { icon: ShoppingBag, label: 'Ordini', path: '/account/ordini' },
  { icon: Heart, label: 'Preferiti', path: '/account/preferiti' },
  { icon: Settings, label: 'Impostazioni', path: '/account/impostazioni' },
];

export function AccountSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const name = (profile as any)?.nome || user?.email?.split('@')[0] || '';
  const initials = name ? name[0].toUpperCase() : '?';

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  return (
    <>
      {/* ── MOBILE: tabs orizzontali in alto ── */}
      <div className="md:hidden bg-white border-b border-gray-200 px-2 py-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-2 flex-shrink-0 pr-3 border-r border-gray-200">
            <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
              {initials}
            </div>
            <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{name}</span>
          </div>
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                  isActive ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                <Icon className="w-3.5 h-3.5" />{item.label}
              </Link>
            );
          })}
          <button onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 whitespace-nowrap flex-shrink-0">
            <LogOut className="w-3.5 h-3.5" />Esci
          </button>
        </div>
      </div>

      {/* ── DESKTOP: sidebar classica ── */}
      <aside className="hidden md:block w-60 bg-white border-r border-gray-200 min-h-screen flex-shrink-0">
        <div className="p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold text-base">{initials}</div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">{name}</h3>
              <p className="text-xs text-gray-500">{(profile as any)?.user_type === 'venditore' ? 'Venditore' : 'Cliente'}</p>
            </div>
          </div>
        </div>
        <nav className="p-3 space-y-0.5">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                  isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}>
                <Icon className="w-4 h-4" /><span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
          <div className="border-t border-gray-200 my-3" />
          <button onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors w-full text-sm">
            <LogOut className="w-4 h-4" /><span className="font-medium">Esci</span>
          </button>
        </nav>
      </aside>
    </>
  );
}
