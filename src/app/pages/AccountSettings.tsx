import { useState } from 'react';
import { Bell, Lock, Trash2, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function AccountSettings() {
  const { user, signOut } = useAuth();
  const [notifications, setNotifications] = useState({ email: true, promotions: true });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ newPass: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success'|'error'; text: string }|null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) { setPwMsg({ type: 'error', text: 'Le password non coincidono' }); return; }
    if (passwords.newPass.length < 8) { setPwMsg({ type: 'error', text: 'Minimo 8 caratteri' }); return; }
    setPwLoading(true); setPwMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
      if (error) throw error;
      setPwMsg({ type: 'success', text: 'Password aggiornata!' });
      setPasswords({ newPass: '', confirm: '' });
      setTimeout(() => { setShowPasswordForm(false); setPwMsg(null); }, 2000);
    } catch (e: any) { setPwMsg({ type: 'error', text: e.message }); }
    finally { setPwLoading(false); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Impostazioni Account</h1>

      {/* Notifiche */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold">Notifiche</h2>
        </div>
        {[
          { key: 'email', label: 'Notifiche Email', desc: 'Aggiornamenti ordini, conferme' },
          { key: 'promotions', label: 'Offerte e Promozioni', desc: 'Sconti esclusivi e novità' },
        ].map(n => (
          <div key={n.key} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div><p className="font-medium text-sm">{n.label}</p><p className="text-xs text-gray-500">{n.desc}</p></div>
            <label className="relative inline-flex cursor-pointer">
              <input type="checkbox" checked={notifications[n.key as keyof typeof notifications]}
                onChange={e => setNotifications({ ...notifications, [n.key]: e.target.checked })} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        ))}
      </div>

      {/* Sicurezza */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-5">
          <Lock className="w-5 h-5 text-green-600" /><h2 className="text-lg font-bold">Sicurezza</h2>
        </div>

        {/* Password */}
        {!showPasswordForm ? (
          <button onClick={() => setShowPasswordForm(true)} className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <p className="font-medium text-sm">Cambia Password</p>
            <p className="text-xs text-gray-500">Aggiorna la tua password di accesso</p>
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-3">
            {pwMsg && <div className={`p-3 rounded-lg text-sm ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{pwMsg.text}</div>}
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} placeholder="Nuova password (min 8 caratteri)"
                value={passwords.newPass} onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm pr-10" required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showPw ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            <input type="password" placeholder="Conferma password" value={passwords.confirm}
              onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" required />
            <div className="flex gap-2">
              <button type="submit" disabled={pwLoading} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                {pwLoading && <Loader2 className="w-4 h-4 animate-spin" />}Aggiorna Password
              </button>
              <button type="button" onClick={() => setShowPasswordForm(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">Annulla</button>
            </div>
          </form>
        )}
      </div>

      {/* Zona pericolosa */}
      <div className="bg-white rounded-xl border-2 border-red-100 p-6">
        <div className="flex items-center gap-3 mb-4"><Trash2 className="w-5 h-5 text-red-600" /><h2 className="text-lg font-bold text-red-900">Zona Pericolosa</h2></div>
        <p className="text-sm text-gray-600 mb-4">L'eliminazione è permanente e non può essere annullata.</p>
        <button onClick={() => { if(confirm('Eliminare l\'account?')) signOut(); }}
          className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700">
          Elimina Account
        </button>
      </div>
    </div>
  );
}
