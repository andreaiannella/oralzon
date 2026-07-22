import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import logo from '../../imports/logo_login.svg';

export function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (err) throw err;
      setSent(true);
    } catch (err: any) {
      setError(err.message || t('auth.sendError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-white to-accent/50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
          <div className="text-center mb-8">
            <img src={logo} alt="Oralzon" className="h-12 w-auto mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">{t('auth.forgotTitle')}</h2>
            <p className="text-muted-foreground text-sm">{t('auth.forgotSubtitle')}</p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900">{t('auth.emailSent')}</h3>
              <p className="text-sm text-gray-600">
                {t('auth.emailSentDesc', { email })}
              </p>
              <Link to="/login" className="inline-flex items-center gap-2 text-primary hover:underline text-sm mt-4">
                <ArrowLeft className="w-4 h-4" /> {t('auth.backToLogin')}
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('auth.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email" required value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="nome@studio.it"
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={loading}
                    />
                  </div>
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50">
                  {loading ? t('auth.sending') : t('auth.sendResetLink')}
                </button>
              </form>
              <div className="text-center mt-6">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                  <ArrowLeft className="w-4 h-4" /> {t('auth.backToLogin')}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
