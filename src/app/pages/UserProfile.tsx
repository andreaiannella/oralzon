import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Loader2, CheckCircle, Building2, Mail, Phone, MapPin, CreditCard, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export function UserProfile() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [data, setData] = useState({
    nome: '', cognome: '', telefono: '',
    ragioneSociale: '', partitaIva: '', codiceFiscale: '', pec: '',
    viaSpedizione: '', cittaSpedizione: '', provSpedizione: '', capSpedizione: '',
    viaFatt: '', cittaFatt: '', provFatt: '', capFatt: '',
  });

  useEffect(() => {
    if (profile) {
      setData({
        nome: profile.nome || '',
        cognome: profile.cognome || '',
        telefono: profile.telefono || '',
        ragioneSociale: profile.ragione_sociale || '',
        partitaIva: profile.partita_iva || '',
        codiceFiscale: (profile as any).codice_fiscale || '',
        pec: (profile as any).pec || '',
        viaSpedizione: (profile as any).indirizzo_spedizione_via || '',
        cittaSpedizione: (profile as any).indirizzo_spedizione_citta || '',
        provSpedizione: (profile as any).indirizzo_spedizione_provincia || '',
        capSpedizione: (profile as any).indirizzo_spedizione_cap || '',
        viaFatt: (profile as any).indirizzo_fatturazione_via || '',
        cittaFatt: (profile as any).indirizzo_fatturazione_citta || '',
        provFatt: (profile as any).indirizzo_fatturazione_provincia || '',
        capFatt: (profile as any).indirizzo_fatturazione_cap || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').update({
        nome: data.nome,
        cognome: data.cognome,
        telefono: data.telefono,
        ragione_sociale: data.ragioneSociale,
        partita_iva: data.partitaIva,
        codice_fiscale: data.codiceFiscale,
        pec: data.pec,
        indirizzo_spedizione_via: data.viaSpedizione,
        indirizzo_spedizione_citta: data.cittaSpedizione,
        indirizzo_spedizione_provincia: data.provSpedizione,
        indirizzo_spedizione_cap: data.capSpedizione,
        indirizzo_fatturazione_via: data.viaFatt,
        indirizzo_fatturazione_citta: data.cittaFatt,
        indirizzo_fatturazione_provincia: data.provFatt,
        indirizzo_fatturazione_cap: data.capFatt,
      }).eq('id', user.id);
      if (!error) { setSaved(true); setEditing(false); setTimeout(() => setSaved(false), 3000); }
    } finally { setSaving(false); }
  };

  const initials = `${data.nome[0] || ''}${data.cognome[0] || ''}`.toUpperCase() || '?';
  const inp = (editing: boolean) =>
    `w-full px-3 py-2.5 border rounded-lg text-sm ${editing ? 'border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary' : 'border-gray-200 bg-gray-50 text-gray-500'}`;

  const Field = ({ label, value, onChange, placeholder = '', type = 'text', disabled = false }:
    { label: string; value: string; onChange?: (v: string) => void; placeholder?: string; type?: string; disabled?: boolean }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</label>
      <input type={type} value={value} disabled={disabled || !editing}
        onChange={e => onChange?.(e.target.value)}
        placeholder={placeholder}
        className={inp(editing && !disabled)} />
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('account.myProfileTitle')}</h1>

      {saved && (
        <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
          <CheckCircle className="w-4 h-4" /> {t('account.profileUpdated')}
        </div>
      )}

      {/* Avatar + email */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0">
            {initials}
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{data.nome} {data.cognome}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{user?.email}</p>
            <span className="mt-1 inline-block text-xs px-2 py-0.5 bg-accent text-primary rounded-full font-medium capitalize">
              {profile?.user_type || 'cliente'}
            </span>
          </div>
        </div>

        {/* Dati anagrafici */}
        <div className="space-y-5">
          <div className="flex items-center gap-2 mb-3">
            <Phone className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{t('account.personalData')}</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('checkout.firstName')} value={data.nome} onChange={v => setData({...data, nome: v})} />
            <Field label={t('checkout.lastName')} value={data.cognome} onChange={v => setData({...data, cognome: v})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('checkout.email')} value={user?.email || ''} disabled type="email" />
            <Field label={t('checkout.phone')} value={data.telefono} onChange={v => setData({...data, telefono: v})}
              placeholder="+39 333 1234567" type="tel" />
          </div>
        </div>
      </div>

      {/* Dati fiscali */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{t('account.fiscalData')}</h3>
        </div>
        <div className="space-y-4">
          <Field label={t('account.companyOrPractice')} value={data.ragioneSociale}
            onChange={v => setData({...data, ragioneSociale: v})} placeholder="Studio Dentistico Dr. Rossi" />
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('register.vatNumber')} value={data.partitaIva}
              onChange={v => setData({...data, partitaIva: v})} placeholder="12345678901" />
            <Field label={t('register.taxCode')} value={data.codiceFiscale}
              onChange={v => setData({...data, codiceFiscale: v})} placeholder="RSSMRI80A01H501Z" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t('register.pecLabel')} value={data.pec}
              onChange={v => setData({...data, pec: v})} placeholder="studio@pec.it" type="email" />
          </div>
        </div>
      </div>

      {/* Indirizzo spedizione */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{t('account.shippingAddress')}</h3>
        </div>
        <div className="space-y-4">
          <Field label={t('account.streetAndNumber')} value={data.viaSpedizione}
            onChange={v => setData({...data, viaSpedizione: v})} placeholder="Via Roma, 1" />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <Field label={t('checkout.zipCode')} value={data.capSpedizione}
                onChange={v => setData({...data, capSpedizione: v})} placeholder="00100" />
            </div>
            <div className="col-span-1">
              <Field label={t('checkout.city')} value={data.cittaSpedizione}
                onChange={v => setData({...data, cittaSpedizione: v})} placeholder="Roma" />
            </div>
            <div className="col-span-1">
              <Field label={t('checkout.province')} value={data.provSpedizione}
                onChange={v => setData({...data, provSpedizione: v.toUpperCase()})} placeholder="RM" />
            </div>
          </div>
        </div>
      </div>

      {/* Indirizzo fatturazione */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">{t('account.billingAddress')}</h3>
        </div>
        <div className="space-y-4">
          <Field label={t('account.streetAndNumber')} value={data.viaFatt}
            onChange={v => setData({...data, viaFatt: v})} placeholder="Via Roma, 1" />
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <Field label={t('checkout.zipCode')} value={data.capFatt}
                onChange={v => setData({...data, capFatt: v})} placeholder="00100" />
            </div>
            <div className="col-span-1">
              <Field label={t('checkout.city')} value={data.cittaFatt}
                onChange={v => setData({...data, cittaFatt: v})} placeholder="Roma" />
            </div>
            <div className="col-span-1">
              <Field label={t('checkout.province')} value={data.provFatt}
                onChange={v => setData({...data, provFatt: v.toUpperCase()})} placeholder="RM" />
            </div>
          </div>
        </div>
      </div>

      {/* Bottoni */}
      <div className="flex gap-3">
        {editing ? (
          <>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('account.saveChanges')}
            </button>
            <button onClick={() => setEditing(false)}
              className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm hover:bg-gray-50 transition-colors">
              {t('account.cancel')}
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)}
            className="px-6 py-2.5 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors text-sm">
            {t('account.editProfile')}
          </button>
        )}
      </div>
    </div>
  );
}
