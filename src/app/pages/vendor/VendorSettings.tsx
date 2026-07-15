import { useState, useEffect } from 'react';
import { Truck, Save, Loader2, CheckCircle, Package, AlertCircle, Store, Lock, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { getCurrentVendor } from '../../../lib/vendor';
import { ImageUploader } from '../../components/ImageUploader';
import { DENTAL_CATEGORIES } from '../../../constants/categories';

export function VendorSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  const [logoUrl, setLogoUrl] = useState<string[]>([]);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ newPass: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success'|'error'; text: string }|null>(null);
  const [form, setForm] = useState({
    business_name: '',
    shipping_cost: '0',
    free_shipping_threshold: '0',
    shipping_notes: '',
    phone: '',
    website: '',
    store_description: '',
    main_category: '',
    contact_email: '',
  });

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

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setLoading(true);
    const vendor = await getCurrentVendor();
    if (!vendor) { setLoading(false); return; }
    setVendorId(vendor.id);
    setLogoUrl((vendor as any).logo_url ? [(vendor as any).logo_url] : []);
    setForm({
      business_name: (vendor as any).business_name || '',
      shipping_cost: String((vendor as any).shipping_cost ?? 0),
      free_shipping_threshold: String((vendor as any).free_shipping_threshold ?? 0),
      shipping_notes: (vendor as any).shipping_notes || '',
      phone: (vendor as any).phone || '',
      website: (vendor as any).website || '',
      store_description: (vendor as any).store_description || '',
      main_category: (vendor as any).main_category || '',
      contact_email: (vendor as any).contact_email || '',
    });
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) return;
    // Validazione esplicita, non ci si affida solo al type="email" del browser
    // (bypassabile, e non applicato a dati impostati programmaticamente) —
    // un'email malformata qui blocca in modo silenzioso il collegamento Stripe
    // più avanti nel flusso pagamenti.
    if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)) {
      alert('L\'indirizzo email di contatto non è valido. Controlla il formato (es. nome@dominio.it).');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('vendors').update({
        business_name: form.business_name,
        shipping_cost: parseFloat(form.shipping_cost) || 0,
        free_shipping_threshold: parseFloat(form.free_shipping_threshold) || 0,
        shipping_notes: form.shipping_notes,
        store_description: form.store_description,
        main_category: form.main_category || null,
        contact_email: form.contact_email || null,
        logo_url: logoUrl[0] || null,
      }).eq('id', vendorId);
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { alert('Errore: ' + e.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Impostazioni Store</h1>

      <form id="vendor-settings-form" onSubmit={handleSave} className="space-y-6">

        {/* Info Store */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Informazioni Store
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome Store / Ragione Sociale</label>
              <input value={form.business_name} onChange={e => setForm({...form, business_name: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>

        {/* Vetrina Pubblica */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" /> Vetrina Pubblica
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Queste informazioni appaiono sulla tua pagina store pubblica, visibile a tutti i clienti che cliccano sul tuo nome.
          </p>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo Store</label>
            {vendorId && (
              <ImageUploader vendorId={vendorId} existingUrls={logoUrl} onChange={setLogoUrl} maxImages={1} />
            )}
            <p className="text-xs text-gray-400 mt-1">Se non carichi un logo, mostreremo le iniziali del nome store.</p>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email di Contatto Pubblica</label>
            <input type="email" value={form.contact_email} onChange={e => setForm({...form, contact_email: e.target.value})}
              placeholder="info@tuostore.it"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            <p className="text-xs text-gray-400 mt-1">I clienti useranno questa email per contattarti dalla tua pagina store. Può essere diversa dalla tua email di accesso.</p>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria Principale</label>
            <select value={form.main_category} onChange={e => setForm({...form, main_category: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary bg-white">
              <option value="">Nessuna categoria specifica</option>
              {DENTAL_CATEGORIES.map(cat => (
                <option key={cat.slug} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione Store</label>
            <textarea value={form.store_description} onChange={e => setForm({...form, store_description: e.target.value})}
              placeholder="Racconta ai clienti chi sei: esperienza, specializzazioni, garanzie che offri..."
              rows={3} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary resize-none" />
          </div>
        </div>

        {/* Configurazione Spedizioni */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" /> Configurazione Spedizioni
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            Imposta le spese di spedizione che i clienti vedranno al checkout quando acquistano i tuoi prodotti.
          </p>

          <div className="grid sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo Spedizione Standard (€)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                <input type="number" step="0.01" min="0" value={form.shipping_cost}
                  onChange={e => setForm({...form, shipping_cost: e.target.value})}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
              </div>
              <p className="text-xs text-gray-400 mt-1">Imposta 0 per spedizione sempre gratuita</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soglia Spedizione Gratis (€)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                <input type="number" step="0.01" min="0" value={form.free_shipping_threshold}
                  onChange={e => setForm({...form, free_shipping_threshold: e.target.value})}
                  className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
              </div>
              <p className="text-xs text-gray-400 mt-1">0 = nessuna soglia (niente gratis automatico)</p>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Note Spedizione (visibile ai clienti)</label>
            <textarea value={form.shipping_notes} onChange={e => setForm({...form, shipping_notes: e.target.value})}
              placeholder="Es. Spedizione con BRT, consegna in 48h lavorative. Tutta Italia."
              rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary resize-none" />
          </div>

          {/* Preview */}
          <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-2">ANTEPRIMA — Come appare al checkout:</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Spedizione</span>
              <span className={parseFloat(form.shipping_cost) === 0 ? 'text-green-600 font-medium' : 'font-medium'}>
                {parseFloat(form.shipping_cost) === 0 ? 'Gratis' : `€${parseFloat(form.shipping_cost).toFixed(2)}`}
              </span>
            </div>
            {parseFloat(form.free_shipping_threshold) > 0 && (
              <p className="text-xs text-green-600 mt-1">
                Gratis sopra €{parseFloat(form.free_shipping_threshold).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </form>

      {/* Sicurezza — separata dal form sopra: è un'azione indipendente (cambio
          password dell'account di login), non un campo del negozio. Ora è
          posizionata PRIMA del pulsante Salva, come richiesto — il pulsante
          resta comunque collegato al form principale tramite l'attributo
          form="vendor-settings-form", nonostante sia fuori dal tag <form>
          (non si possono annidare due <form> uno dentro l'altro in HTML). */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
        <div className="flex items-center gap-3 mb-5">
          <Lock className="w-5 h-5 text-green-600" /><h2 className="text-lg font-bold">Sicurezza</h2>
        </div>
        {!showPasswordForm ? (
          <button onClick={() => setShowPasswordForm(true)} className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <p className="font-medium text-sm">Cambia Password</p>
            <p className="text-xs text-gray-500">Aggiorna la password di accesso al tuo account venditore</p>
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

      {saved && (
        <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm mt-6">
          <CheckCircle className="w-4 h-4" /> Impostazioni salvate con successo!
        </div>
      )}

      <button type="submit" form="vendor-settings-form" disabled={saving}
        className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 w-full mt-6">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Salva Impostazioni
      </button>
    </div>
  );
}
