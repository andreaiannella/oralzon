import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle, Package, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { callEdge } from '../../../lib/edgeApi';
import { useToast } from '../../../contexts/ToastContext';
import { getCurrentVendor } from '../../../lib/vendor';
import { GShipping } from '../../../lib/googleIcons';
import { PAESI_COMUNI } from '../../../constants/countries';
import { localizeCountryName } from '../../../lib/countryTranslations';
import { vatFormatExample } from '../../../lib/vatFormats';

export function VendorSettings() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [vendorId, setVendorId] = useState<string | null>(null);
  // Logo store rimosso: non più mostrato da nessuna parte del sito (come
  // Amazon, l'identità del venditore è nome + badge verificato, non una foto).
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({ newPass: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ type: 'success'|'error'; text: string }|null>(null);
  const [taxSyncing, setTaxSyncing] = useState(false);
  const [taxSyncMsg, setTaxSyncMsg] = useState<{ type: 'success'|'error'; text: string }|null>(null);
  const [zones, setZones] = useState<Record<'IT'|'UE'|'EXTRA_UE', { enabled: boolean; cost: string; free_shipping_threshold: string }>>({
    IT: { enabled: true, cost: '0', free_shipping_threshold: '0' },
    UE: { enabled: false, cost: '0', free_shipping_threshold: '0' },
    EXTRA_UE: { enabled: false, cost: '0', free_shipping_threshold: '0' },
  });
  const [viesStatus, setViesStatus] = useState<{ validated: boolean; validatedAt: string | null; registeredName: string | null }>({ validated: false, validatedAt: null, registeredName: null });
  const [viesNotRegistered, setViesNotRegistered] = useState(false);
  const [viesChecking, setViesChecking] = useState(false);
  const [viesError, setViesError] = useState('');
  const [form, setForm] = useState({
    business_name: '',
    shipping_cost: '0',
    free_shipping_threshold: '0',
    shipping_notes: '',
    phone: '',
    website: '',
    fiscal_country: 'IT',
    vat_id: '',
    codice_fiscale: '',
    pec: '',
    codice_sdi: '',
    address_street: '',
    address_city: '',
    address_region: '',
    address_postal_code: '',
  });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirm) { setPwMsg({ type: 'error', text: t('vendor.passwordsDontMatch') }); return; }
    if (passwords.newPass.length < 8) { setPwMsg({ type: 'error', text: t('vendor.min8chars') }); return; }
    setPwLoading(true); setPwMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.newPass });
      if (error) throw error;
      setPwMsg({ type: 'success', text: t('vendor.passwordUpdated') });
      setPasswords({ newPass: '', confirm: '' });
      setTimeout(() => { setShowPasswordForm(false); setPwMsg(null); }, 2000);
    } catch (e: any) { setPwMsg({ type: 'error', text: e.message }); }
    finally { setPwLoading(false); }
  };

  const handleSyncTaxSettings = async () => {
    setTaxSyncing(true);
    setTaxSyncMsg(null);
    try {
      const res = await callEdge('/stripe/connect/sync-tax-settings', { method: 'POST' });
      if (!res.success) throw new Error(res.error || t('vendor.syncFailed'));
      setTaxSyncMsg({ type: 'success', text: res.message });
    } catch (e: any) {
      setTaxSyncMsg({ type: 'error', text: e.message });
    } finally {
      setTaxSyncing(false);
    }
  };

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    setLoading(true);
    const vendor = await getCurrentVendor();
    if (!vendor) { setLoading(false); return; }
    setVendorId(vendor.id);
    setForm({
      business_name: (vendor as any).business_name || '',
      shipping_cost: String((vendor as any).shipping_cost ?? 0),
      free_shipping_threshold: String((vendor as any).free_shipping_threshold ?? 0),
      shipping_notes: (vendor as any).shipping_notes || '',
      phone: (vendor as any).phone || '',
      website: (vendor as any).website || '',
      fiscal_country: (vendor as any).fiscal_country || 'IT',
      vat_id: (vendor as any).vat_id || '',
      codice_fiscale: (vendor as any).codice_fiscale || '',
      pec: (vendor as any).pec || '',
      codice_sdi: (vendor as any).codice_sdi || '',
      address_street: (vendor as any).address_street || '',
      address_city: (vendor as any).address_city || '',
      address_region: (vendor as any).address_region || '',
      address_postal_code: (vendor as any).address_postal_code || '',
    });
    setViesStatus({
      validated: !!(vendor as any).vies_validated,
      validatedAt: (vendor as any).vies_validated_at || null,
      registeredName: (vendor as any).vies_registered_name || null,
    });

    // Carica le zone di spedizione (create automaticamente alla registrazione
    // dal trigger DB — se per qualche motivo mancassero, i default restano
    // quelli già impostati nello stato iniziale)
    const { data: zonesData } = await supabase.from('vendor_shipping_zones')
      .select('zone, enabled, cost, free_shipping_threshold').eq('vendor_id', vendor.id);
    if (zonesData && zonesData.length > 0) {
      setZones(prev => {
        const next = { ...prev };
        (zonesData as any[]).forEach(z => {
          next[z.zone as 'IT'|'UE'|'EXTRA_UE'] = {
            enabled: z.enabled,
            cost: String(z.cost ?? 0),
            free_shipping_threshold: String(z.free_shipping_threshold ?? 0),
          };
        });
        return next;
      });
    }

    setLoading(false);
  };

  const checkVies = async () => {
    if (!form.vat_id.trim()) { setViesError(t('vendor.enterVatFirst')); return; }
    setViesChecking(true); setViesError(''); setViesNotRegistered(false);
    const result = await callEdge('/vies/validate', {
      body: { country: form.fiscal_country, vatNumber: form.vat_id, target: 'vendor' },
    });
    setViesChecking(false);
    if (!result.success) { setViesError(result.error || t('vendor.verificationFailedTitle')); return; }
    setViesStatus({ validated: result.valid, validatedAt: new Date().toISOString(), registeredName: result.registeredName || null });
    // Non trattarlo come un errore: significa solo che questa P.IVA non è
    // (ancora) abilitata al commercio intracomunitario UE — condizione
    // normalissima per chi vende solo in Italia, non un problema con la
    // P.IVA in sé e non impedisce in alcun modo di vendere su Oralzon.
    if (!result.valid) setViesNotRegistered(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('vendors').update({
        business_name: form.business_name,
        // I campi shipping_cost/free_shipping_threshold restano sincronizzati
        // con la zona IT per compatibilità con eventuale codice che li legga
        // ancora direttamente — la fonte di verità ora è vendor_shipping_zones.
        shipping_cost: parseFloat(zones.IT.cost) || 0,
        free_shipping_threshold: parseFloat(zones.IT.free_shipping_threshold) || 0,
        shipping_notes: form.shipping_notes,
        fiscal_country: form.fiscal_country,
        vat_id: form.vat_id || null,
        codice_fiscale: form.codice_fiscale || null,
        pec: form.pec || null,
        codice_sdi: form.codice_sdi || null,
        address_street: form.address_street || null,
        address_city: form.address_city || null,
        address_region: form.address_region || null,
        address_postal_code: form.address_postal_code || null,
      }).eq('id', vendorId);
      if (error) throw error;

      // Salva le 3 zone di spedizione
      const zoneRows = (['IT', 'UE', 'EXTRA_UE'] as const).map(zone => ({
        vendor_id: vendorId,
        zone,
        enabled: zones[zone].enabled,
        cost: parseFloat(zones[zone].cost) || 0,
        free_shipping_threshold: parseFloat(zones[zone].free_shipping_threshold) || 0,
      }));
      const { error: zonesError } = await supabase.from('vendor_shipping_zones')
        .upsert(zoneRows, { onConflict: 'vendor_id,zone' });
      if (zonesError) throw zonesError;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: any) { toast.error(t('vendor.genericErrorPrefix', { message: e.message })); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">{t('vendor.storeSettingsTitle')}</h1>

      <form id="vendor-settings-form" onSubmit={handleSave} className="space-y-6">

        {/* Info Store */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> {t('vendor.storeInfoTitle')}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('vendor.storeNameLabel')}</label>
              <input value={form.business_name} onChange={e => setForm({...form, business_name: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
          </div>
        </div>

        {/* Configurazione Spedizioni */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <GShipping className="w-5 h-5 text-primary" /> {t('vendor.shippingConfigTitle')}
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            {t('vendor.shippingConfigDesc')}
          </p>

          <div className="space-y-3">
            {([
              { key: 'IT' as const, label: t('vendor.zoneItaly'), desc: t('vendor.zoneItalyDesc') },
              { key: 'UE' as const, label: t('vendor.zoneEU'), desc: t('vendor.zoneEUDesc') },
              { key: 'EXTRA_UE' as const, label: t('vendor.zoneRestWorld'), desc: t('vendor.zoneRestWorldDesc') },
            ]).map(({ key, label, desc }) => (
              <div key={key} className={`border rounded-xl p-4 transition-colors ${zones[key].enabled ? 'border-primary/30 bg-primary/5' : 'border-gray-200'}`}>
                <label className="flex items-center justify-between cursor-pointer mb-1">
                  <div>
                    <span className="font-medium text-gray-900">{label}</span>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={zones[key].enabled}
                    onChange={e => setZones({ ...zones, [key]: { ...zones[key], enabled: e.target.checked } })}
                    className="w-5 h-5 rounded accent-primary"
                  />
                </label>
                {zones[key].enabled && (
                  <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t('vendor.shippingCostLabel2')}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                        <input type="number" step="0.01" min="0" value={zones[key].cost}
                          onChange={e => setZones({ ...zones, [key]: { ...zones[key], cost: e.target.value } })}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{t('vendor.freeThresholdLabel')}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                        <input type="number" step="0.01" min="0" value={zones[key].free_shipping_threshold}
                          onChange={e => setZones({ ...zones, [key]: { ...zones[key], free_shipping_threshold: e.target.value } })}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('vendor.shippingNotesLabel')}</label>
            <textarea value={form.shipping_notes} onChange={e => setForm({...form, shipping_notes: e.target.value})}
              placeholder={t('vendor.shippingNotesPlaceholder')}
              rows={2} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary resize-none" />
          </div>
        </div>

        {/* Dati Fiscali */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-bold mb-1">{t('vendor.fiscalDataTitle')}</h2>
          <p className="text-xs text-gray-500 mb-4">{t('vendor.fiscalDataDesc')}</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('vendor.fiscalCountryLabel')}</label>
              <select value={form.fiscal_country} onChange={e => setForm({...form, fiscal_country: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary">
                {PAESI_COMUNI.filter(p => p.code !== 'OTHER').map(p => (
                  <option key={p.code} value={p.code}>{localizeCountryName(p.code, p.label, i18n.language)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{form.fiscal_country === 'IT' ? t('vendor.vatNumberLabelIT') : t('vendor.vatNumberLabelOther')}</label>
              <div className="flex gap-2">
                <input value={form.vat_id} onChange={e => { setForm({...form, vat_id: e.target.value}); setViesStatus({ validated: false, validatedAt: null, registeredName: null }); setViesNotRegistered(false); }}
                  placeholder={vatFormatExample(form.fiscal_country)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
                <button type="button" onClick={checkVies} disabled={viesChecking}
                  className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50">
                  {viesChecking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {t('vendor.verifyOnVies')}
                </button>
              </div>
              {vatFormatExample(form.fiscal_country) && (
                <p className="text-xs text-gray-400 mt-1">{t('vendor.vatFormatHint', { format: vatFormatExample(form.fiscal_country) })}</p>
              )}
              {viesStatus.validated && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> {t('vendor.vatVerified')}{viesStatus.registeredName ? ` — ${viesStatus.registeredName}` : ''}
                </p>
              )}
              {viesError && <p className="text-xs text-red-600 mt-1.5">{viesError}</p>}
              {viesNotRegistered && !viesError && (
                <p className="text-xs text-amber-600 mt-1.5">
                  {t('vendor.vatNotEUEnabled')}
                </p>
              )}
              {!viesStatus.validated && !viesNotRegistered && !viesError && (
                <p className="text-xs text-gray-400 mt-1.5">{t('vendor.vatNeededForReverseCharge')}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('vendor.taxCodeLabel')}</label>
              <input value={form.codice_fiscale} onChange={e => setForm({...form, codice_fiscale: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
            {form.fiscal_country === 'IT' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('vendor.pecLabel')}</label>
                  <input type="email" value={form.pec} onChange={e => setForm({...form, pec: e.target.value})}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('vendor.sdiCodeLabel')}</label>
                  <input value={form.codice_sdi} onChange={e => setForm({...form, codice_sdi: e.target.value})} maxLength={7}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
                </div>
              </>
            )}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('vendor.addressLabel')}</label>
              <input value={form.address_street} onChange={e => setForm({...form, address_street: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('vendor.cityLabel')}</label>
              <input value={form.address_city} onChange={e => setForm({...form, address_city: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{form.fiscal_country === 'IT' ? t('vendor.provinceLabelIT') : t('vendor.provinceLabelOther')}</label>
              <input value={form.address_region} onChange={e => setForm({...form, address_region: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{form.fiscal_country === 'IT' ? t('vendor.capLabelIT') : t('vendor.postalCodeLabelOther')}</label>
              <input value={form.address_postal_code} onChange={e => setForm({...form, address_postal_code: e.target.value})}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          <div className="mt-5 pt-5 border-t border-gray-100">
            {taxSyncMsg && (
              <div className={`flex items-start gap-2 p-3 rounded-lg text-xs mb-3 ${taxSyncMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {taxSyncMsg.type === 'success' ? <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                {taxSyncMsg.text}
              </div>
            )}
            <button type="button" onClick={handleSyncTaxSettings} disabled={taxSyncing}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50">
              {taxSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {t('vendor.syncWithStripeTax')}
            </button>
            <p className="mt-2 text-xs text-gray-400">{t('vendor.syncStripeTaxNote')}</p>
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
          <Lock className="w-5 h-5 text-green-600" /><h2 className="text-lg font-bold">{t('vendor.securityTitle')}</h2>
        </div>
        {!showPasswordForm ? (
          <button onClick={() => setShowPasswordForm(true)} className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <p className="font-medium text-sm">{t('vendor.changePasswordBtn')}</p>
            <p className="text-xs text-gray-500">{t('vendor.changePasswordDesc')}</p>
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-3">
            {pwMsg && <div className={`p-3 rounded-lg text-sm ${pwMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{pwMsg.text}</div>}
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} placeholder={t('vendor.newPasswordPlaceholder')}
                value={passwords.newPass} onChange={e => setPasswords({ ...passwords, newPass: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm pr-10" required />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showPw ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
              </button>
            </div>
            <input type="password" placeholder={t('vendor.confirmPasswordPlaceholder')} value={passwords.confirm}
              onChange={e => setPasswords({ ...passwords, confirm: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm" required />
            <div className="flex gap-2">
              <button type="submit" disabled={pwLoading} className="flex-1 py-2.5 bg-primary text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                {pwLoading && <Loader2 className="w-4 h-4 animate-spin" />}{t('vendor.updatePasswordBtn')}
              </button>
              <button type="button" onClick={() => setShowPasswordForm(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm">{t('common.cancel')}</button>
            </div>
          </form>
        )}
      </div>

      {saved && (
        <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm mt-6">
          <CheckCircle className="w-4 h-4" /> {t('vendor.settingsSavedSuccess')}
        </div>
      )}

      <button type="submit" form="vendor-settings-form" disabled={saving}
        className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 w-full mt-6">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {t('vendor.saveSettingsBtn')}
      </button>
    </div>
  );
}
