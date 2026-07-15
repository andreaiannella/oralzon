import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../imports/logo_on_light.png';

export function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, profile } = useAuth();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Se siamo arrivati qui perché una pagina protetta ci ha rimandato al login
  // (es. cliccato "Account" o "I miei ordini" da sloggati), dopo l'accesso
  // torniamo esattamente lì invece che su una destinazione fissa.
  const returnTo = (location.state as { from?: string } | null)?.from;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);

      if (returnTo) { navigate(returnTo); return; }

      // Redirect based on user type after successful login
      // Fetch profile directly to get user_type reliably
      const { data: { user: loggedUser } } = await (await import('../../lib/supabase')).supabase.auth.getUser();
      if (loggedUser) {
        const { data: profileData } = await (await import('../../lib/supabase')).supabase
          .from('profiles').select('user_type').eq('id', loggedUser.id).single();
        if (profileData?.user_type === 'venditore') navigate('/venditore/dashboard');
        else if (profileData?.user_type === 'admin') navigate('/dashboard-admin');
        else navigate('/account/ordini');
      } else {
        navigate('/account/ordini');
      }
    } catch (err: any) {
      setError(err.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-white to-accent/50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
          {/* Logo */}
          <div className="text-center mb-8">
            <img src={logo} alt="Oralzon" className="h-12 mx-auto mb-4" />
            <h2 className="text-3xl mb-2">{t('auth.loginTitle')}</h2>
            <p className="text-muted-foreground">{t('auth.loginSubtitle')}</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm mb-2">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nome@studio.it"
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-12 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" disabled={loading} />
                <span className="text-sm">{t('auth.rememberMe')}</span>
              </label>
              <Link to="/password-dimenticata" className="text-sm text-primary hover:underline">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('auth.loggingIn') : t('auth.login')}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-muted-foreground">{t('auth.or')}</span>
            </div>
          </div>

          {/* Register Links */}
          <div className="text-center space-y-3">
            <Link
              to="/registrazione"
              className="block w-full px-6 py-3 border-2 border-primary text-primary rounded-lg hover:bg-accent transition-colors"
            >
              {t('auth.createAccount')}
            </Link>
            <Link
              to="/registrazione-venditore"
              className="block text-sm text-primary hover:underline"
            >
              {t('auth.areYouVendor')}
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            ← {t('auth.backToHome')}
          </Link>
        </div>
      </div>
    </div>
  );
}
