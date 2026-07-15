import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import logo from '../../imports/logo_on_light.png';

export function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Supabase mette i token nell'hash dell'URL al ritorno dal link email
    const hash = window.location.hash;
    if (!hash.includes('access_token')) {
      setError('Link non valido o scaduto. Richiedi un nuovo link.');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('La password deve essere di almeno 6 caratteri.'); return; }
    if (password !== confirm) { setError('Le password non coincidono.'); return; }
    setError('');
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Errore nel reset. Richiedi un nuovo link.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-white to-accent/50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-border">
          <div className="text-center mb-8">
            <img src={logo} alt="Oralzon" className="h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Nuova password</h2>
            <p className="text-muted-foreground text-sm">Scegli una nuova password sicura per il tuo account.</p>
          </div>

          {done ? (
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900">Password aggiornata!</h3>
              <p className="text-sm text-gray-600">Verrai reindirizzato al login tra pochi secondi...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nuova password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input type={showPw ? 'text' : 'password'} required value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="Minimo 6 caratteri" disabled={loading} />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Conferma password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input type="password" required value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                      placeholder="Ripeti la password" disabled={loading} />
                  </div>
                </div>
                <button type="submit" disabled={loading || !!error.includes('Link')}
                  className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-semibold disabled:opacity-50">
                  {loading ? 'Aggiornamento...' : 'Aggiorna password'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
