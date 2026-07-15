import { supabase } from './supabase';

const SUPABASE_URL = 'https://ckslkfshimzuujtpboui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrc2xrZnNoaW16dXVqdHBib3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTIwODIsImV4cCI6MjA5NDMyODA4Mn0.vhwaSLVWzVC9OGK7I4hE5V2P5H3A9V690YE9ELM-2eY';
const EDGE_URL = `${SUPABASE_URL}/functions/v1/make-server-000b3cfb`;

export interface Vendor {
  id: string;
  profile_id: string;
  business_name: string;
  plan_type: 'trial' | 'professional' | 'enterprise';
  plan_status: 'active' | 'suspended' | 'cancelled';
  product_limit: number;
  verified_badge: boolean;
  trial_ends_at: string | null;
  created_at: string;
}

export interface TrialStatus {
  isActive: boolean;
  isTrial: boolean;
  isExpired: boolean;
  isPaid: boolean;
  daysLeft: number | null;
  plan: string;
}

export async function getCurrentVendor(): Promise<Vendor | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    // Query robusta: non usa maybeSingle() perché fallirebbe silenziosamente
    // se esistessero più righe vendor per lo stesso profile_id (può succedere
    // per race condition tra registrazione diretta e fallback edge function).
    // Prendiamo sempre la riga più vecchia, in modo deterministico.
    const { data: rows, error } = await supabase.from('vendors').select('*')
      .eq('profile_id', user.id).order('created_at', { ascending: true }).limit(1);
    if (error) { console.error('getCurrentVendor error:', error.message); return null; }
    if (rows && rows.length > 0) return rows[0];

    // AUTO-RECOVERY: se l'utente è un venditore ma il record vendor manca
    // (registrazione interrotta), lo creiamo ora che l'utente è autenticato
    const { data: profile } = await supabase.from('profiles')
      .select('user_type, ragione_sociale, nome, cognome')
      .eq('id', user.id).maybeSingle();
    if (profile?.user_type === 'venditore') {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 180); // 6 mesi di prova gratuita
      const { data: newVendor } = await supabase.from('vendors').insert([{
        profile_id: user.id,
        business_name: (profile as any).ragione_sociale || `${(profile as any).nome || ''} ${(profile as any).cognome || ''}`.trim() || 'Il mio Store',
        plan_type: 'trial',
        plan_status: 'active',
        product_limit: 999999,
        verified_badge: false,
        trial_ends_at: trialEnd.toISOString(),
      }]).select().single();
      if (newVendor) {
        console.log('✅ Vendor record creato automaticamente al primo accesso');
        return newVendor;
      }
    }
    return null;
  } catch (e) { console.error('getCurrentVendor exception:', e); return null; }
}

export function getTrialStatus(vendor: Vendor | null): TrialStatus {
  if (!vendor) return { isActive: false, isTrial: false, isExpired: false, isPaid: false, daysLeft: null, plan: 'none' };
  const isPaid = ['professional', 'enterprise'].includes(vendor.plan_type) && vendor.plan_status === 'active';
  if (isPaid) return { isActive: true, isTrial: false, isExpired: false, isPaid: true, daysLeft: null, plan: vendor.plan_type };
  if (vendor.plan_type === 'trial' && vendor.trial_ends_at) {
    const msLeft = new Date(vendor.trial_ends_at).getTime() - Date.now();
    const daysLeft = Math.ceil(msLeft / 86400000);
    if (msLeft > 0) return { isActive: true, isTrial: true, isExpired: false, isPaid: false, daysLeft, plan: 'trial' };
    return { isActive: false, isTrial: true, isExpired: true, isPaid: false, daysLeft: 0, plan: 'trial' };
  }
  return { isActive: false, isTrial: false, isExpired: true, isPaid: false, daysLeft: null, plan: vendor.plan_type };
}

/**
 * Crea il vendor con trial se non esiste.
 * Prima prova via edge function, poi fallback diretto su Supabase.
 */
export async function ensureVendorExists(businessName?: string): Promise<Vendor | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Vendor già esistente?
    const existing = await getCurrentVendor();
    if (existing) return existing;

    // Nome business
    let finalName = businessName || 'Il mio Store Oralzon';
    const { data: profile } = await supabase.from('profiles').select('ragione_sociale, nome, cognome').eq('id', user.id).maybeSingle();
    if (profile?.ragione_sociale) finalName = profile.ragione_sociale;
    else if (!businessName && (profile?.nome || profile?.cognome)) finalName = `${profile.nome || ''} ${profile.cognome || ''}`.trim();

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 180); // 6 mesi di prova gratuita

    // --- METODO 1: Edge function ---
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || SUPABASE_ANON_KEY;
      const res = await fetch(`${EDGE_URL}/create-vendor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ business_name: finalName, plan_type: 'trial', product_limit: 999999, trial_ends_at: trialEndsAt.toISOString() }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.vendor) { console.log('✅ Vendor creato via edge fn'); return json.vendor; }
      }
    } catch (edgeError) { console.warn('Edge fn fallita, provo diretto:', edgeError); }

    // --- METODO 2: Inserimento diretto Supabase (fallback) ---
    const { data: newVendor, error } = await supabase.from('vendors').insert([{
      profile_id: user.id,
      business_name: finalName,
      plan_type: 'trial',
      plan_status: 'active',
      product_limit: 999999,
      verified_badge: false,
      trial_ends_at: trialEndsAt.toISOString(),
    }]).select().single();

    if (error) {
      // Se il conflict significa che nel frattempo è stato creato, rileggi
      if (error.code === '23505') { return await getCurrentVendor(); }
      console.error('Inserimento diretto vendor fallito:', error.message);
      return null;
    }

    // Aggiorna anche il profilo
    await supabase.from('profiles').update({ user_type: 'venditore' }).eq('id', user.id);
    console.log('✅ Vendor creato direttamente:', newVendor.id);
    return newVendor;
  } catch (e) { console.error('ensureVendorExists exception:', e); return null; }
}

export async function canAddProduct(): Promise<{ canAdd: boolean; currentCount: number; limit: number; reason?: string }> {
  const vendor = await getCurrentVendor();
  if (!vendor) return { canAdd: false, currentCount: 0, limit: 0, reason: 'Non sei registrato come venditore' };
  const status = getTrialStatus(vendor);
  if (!status.isActive) return { canAdd: false, currentCount: 0, limit: vendor.product_limit, reason: 'Trial scaduto — acquista un piano per continuare' };
  const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('vendor_id', vendor.id);
  if (error) return { canAdd: false, currentCount: 0, limit: vendor.product_limit };
  const currentCount = count || 0;
  return currentCount >= vendor.product_limit
    ? { canAdd: false, currentCount, limit: vendor.product_limit, reason: `Limite di ${vendor.product_limit} prodotti raggiunto` }
    : { canAdd: true, currentCount, limit: vendor.product_limit };
}
