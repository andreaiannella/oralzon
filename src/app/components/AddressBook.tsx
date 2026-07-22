import { useState, useEffect } from 'react';
import { MapPin, Plus, Check, Trash2, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { PAESI_COMUNI } from '../../constants/countries';

interface Address {
  id: string; label: string; full_name: string; address: string;
  zip_code: string; city: string; province: string; phone: string; is_default: boolean; country: string;
}

interface Props {
  onSelect: (addr: { firstName: string; lastName: string; address: string; zipCode: string; city: string; province: string; phone: string; country: string }) => void;
}

export function AddressBook({ onSelect }: Props) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: '', full_name: '', address: '', zip_code: '', city: '', province: '', phone: '', country: 'IT' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAddresses(); }, []);

  const loadAddresses = async () => {
    if (!user) return;
    const { data } = await supabase.from('customer_addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false });
    setAddresses((data as any) || []);
    setLoading(false);
  };

  const saveAddress = async () => {
    if (!user || !form.full_name || !form.address) return;
    setSaving(true);
    await supabase.from('customer_addresses').insert([{ ...form, user_id: user.id, is_default: addresses.length === 0 }]);
    setShowForm(false); setForm({ label: '', full_name: '', address: '', zip_code: '', city: '', province: '', phone: '', country: 'IT' });
    loadAddresses(); setSaving(false);
  };

  const selectAddr = (a: Address) => {
    const [firstName, ...rest] = a.full_name.split(' ');
    onSelect({ firstName, lastName: rest.join(' '), address: a.address, zipCode: a.zip_code, city: a.city, province: a.province, phone: a.phone, country: a.country || 'IT' });
  };

  const deleteAddr = async (id: string) => {
    await supabase.from('customer_addresses').delete().eq('id', id);
    loadAddresses();
  };

  if (loading) return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
  if (addresses.length === 0 && !showForm) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
          <MapPin className="w-3 h-3" /> Indirizzi salvati
        </p>
        <button onClick={() => setShowForm(!showForm)} className="text-xs text-primary hover:underline flex items-center gap-1">
          <Plus className="w-3 h-3" /> Nuovo
        </button>
      </div>

      {addresses.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {addresses.map(a => (
            <div key={a.id} className="flex-shrink-0 w-48 bg-gray-50 border border-gray-200 rounded-xl p-3 relative group">
              <button onClick={() => selectAddr(a)} className="text-left w-full">
                <p className="text-xs font-semibold text-gray-800 truncate">{a.label || a.full_name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">{a.address}, {a.zip_code} {a.city}{a.country && a.country !== 'IT' ? ` (${a.country})` : ''}</p>
                {a.is_default && <span className="mt-1 inline-flex items-center gap-0.5 text-[10px] text-primary font-medium"><Check className="w-2.5 h-2.5" /> Predefinito</span>}
              </button>
              <button onClick={() => deleteAddr(a.id)} className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:text-red-500 transition-opacity">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 mt-2 grid grid-cols-2 gap-2">
          <select value={form.country} onChange={e => setForm({...form, country: e.target.value})} className="col-span-2 px-2 py-1.5 border rounded-lg text-xs bg-white">
            {PAESI_COMUNI.map(p => <option key={p.code} value={p.code}>{p.label}</option>)}
          </select>
          <input placeholder="Etichetta (es. Studio)" value={form.label} onChange={e => setForm({...form, label: e.target.value})} className="px-2 py-1.5 border rounded-lg text-xs" />
          <input placeholder="Nome completo" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="px-2 py-1.5 border rounded-lg text-xs" required />
          <input placeholder="Via e numero" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="col-span-2 px-2 py-1.5 border rounded-lg text-xs" required />
          <input placeholder="CAP" value={form.zip_code} onChange={e => setForm({...form, zip_code: e.target.value})} className="px-2 py-1.5 border rounded-lg text-xs" />
          <input placeholder="Città" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="px-2 py-1.5 border rounded-lg text-xs" />
          <input placeholder="Prov." value={form.province} onChange={e => setForm({...form, province: e.target.value.toUpperCase()})} className="px-2 py-1.5 border rounded-lg text-xs" />
          <input placeholder="Telefono" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="px-2 py-1.5 border rounded-lg text-xs" />
          <div className="col-span-2 flex gap-2 mt-1">
            <button onClick={saveAddress} disabled={saving} className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold disabled:opacity-50">
              {saving ? '...' : 'Salva'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-xs">Annulla</button>
          </div>
        </div>
      )}
    </div>
  );
}
