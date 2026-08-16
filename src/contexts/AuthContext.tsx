import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { EDGE_URL } from '../lib/edgeApi';

interface Profile {
  id: string;
  email: string;
  user_type: 'cliente' | 'venditore' | 'admin';
  nome: string;
  cognome: string;
  telefono?: string | null;
  ragione_sociale?: string | null;
  partita_iva?: string | null;
  codice_fiscale?: string | null;
  pec?: string | null;
  codice_sdi?: string | null;
  indirizzo_spedizione_via?: string | null;
  indirizzo_spedizione_citta?: string | null;
  indirizzo_spedizione_provincia?: string | null;
  indirizzo_spedizione_cap?: string | null;
  indirizzo_fatturazione_via?: string | null;
  indirizzo_fatturazione_citta?: string | null;
  indirizzo_fatturazione_provincia?: string | null;
  indirizzo_fatturazione_cap?: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: Partial<Profile> & Record<string, any>) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);


// ── Verifica VIES di recupero al primo accesso ──────────────────────────
//
// PERCHE' ESISTE. La registrazione lanciava la verifica VIES subito dopo il
// signUp, ma solo se la risposta conteneva gia' una sessione. Da quando e'
// attiva la conferma email obbligatoria, al signUp la sessione NON c'e' —
// l'utente deve prima cliccare il link ricevuto per email — quindi quel ramo
// non veniva mai eseguito e nessun nuovo cliente veniva piu' verificato.
//
// Non e' un problema estetico: un cliente UE con partita IVA non verificata
// arriva al checkout senza diritto all'inversione contabile e paga un'IVA
// che avrebbe potuto non pagare. Il danno e' silenzioso — nessun errore,
// solo un conto piu' alto.
//
// La verifica viene quindi spostata al primo momento in cui una sessione
// esiste davvero, cioe' al caricamento del profilo dopo il login. E'
// autoriparante per costruzione: vale per chi si registra oggi, per chi
// aveva gia' un profilo non verificato, e per chi la volta scorsa non e'
// stato verificato perche' il VIES non rispondeva. Se il profilo risulta
// gia' verificato non parte nulla.
//
// Il Paese usato e' quello di FATTURAZIONE, non di spedizione: la partita
// IVA e' legata alla sede fiscale dell'impresa.
const PAESI_UE_VIES = ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE'];
let viesAttemptedForProfile: string | null = null;

async function maybeValidateViesOnce(profile: any) {
  try {
    if (!profile?.id || !profile.partita_iva || profile.vies_validated) return;
    // una sola volta per sessione: evita di richiamare il VIES a ogni
    // ricaricamento del profilo se il servizio e' momentaneamente giu'
    if (viesAttemptedForProfile === profile.id) return;
    viesAttemptedForProfile = profile.id;

    const country = profile.indirizzo_fatturazione_paese || profile.indirizzo_spedizione_paese || 'IT';
    if (!PAESI_UE_VIES.includes(country)) return;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    await fetch(`${EDGE_URL}/vies/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ country, vatNumber: profile.partita_iva, target: 'profile' }),
    });
  } catch {
    // fire-and-forget: un VIES irraggiungibile non deve impedire il login.
    // Al prossimo accesso si riprova.
  }
}


// ── Email di benvenuto al primo accesso ─────────────────────────────────
//
// PERCHE' QUI E NON ALLA REGISTRAZIONE. Prima il benvenuto partiva subito
// dopo il signup, ma solo se la risposta conteneva gia' una sessione. Da
// quando la conferma email e' obbligatoria quella sessione non c'e' — arriva
// solo dopo il clic sul link — quindi nessun nuovo iscritto riceveva piu'
// nulla. Stessa causa e stessa cura della verifica VIES qui sopra.
//
// Il controllo sul flag serve solo a evitare una chiamata inutile a ogni
// accesso: la garanzia vera che l'email parta UNA volta sola sta nel
// server, che rivendica il campo con una scrittura atomica prima di
// inviare. Non ci si affida al client per una cosa del genere: due schede
// aperte contemporaneamente lo aggirerebbero senza sforzo.
let welcomeAttemptedForProfile: string | null = null;

async function maybeSendWelcomeOnce(profile: any) {
  try {
    if (!profile?.id || profile.welcome_email_sent_at) return;
    if (welcomeAttemptedForProfile === profile.id) return;
    welcomeAttemptedForProfile = profile.id;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) return;

    await fetch(`${EDGE_URL}/welcome-customer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: profile.nome || '' }),
    });
  } catch {
    // Un benvenuto non recapitato non deve impedire l'accesso. Al prossimo
    // login si riprova, perche' il flag lato server e' ancora vuoto.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        setLoading(false);
        return;
      }

      if (!data) {
        // Profile non esiste ancora - aspetta che il trigger lo crei
        console.log('Profile not found yet, waiting for trigger...');

        // Riprova dopo 2 secondi
        setTimeout(() => {
          loadProfile(userId);
        }, 2000);
        return;
      }

      // I dati che arrivano da Supabase sono ora tipizzati come oggetti
      // generici, perche' i tipi dello schema non sono piu' descritti a mano
      // (vedi src/lib/database.types.ts). Qui il dato attraversa il confine
      // fra "risposta del database" e "oggetto dell'applicazione": la
      // conversione esplicita dichiara che ce ne assumiamo la forma.
      // Sparira' da sola quando i tipi verranno rigenerati con types:gen.
      setProfile(data as Profile);
      // Verifica VIES di recupero e benvenuto di recupero — vedi note sotto.
      maybeValidateViesOnce(data);
      maybeSendWelcomeOnce(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<Profile> & Record<string, any>) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nome: userData.nome,
          cognome: userData.cognome,
          user_type: userData.user_type || 'cliente',
          telefono: userData.telefono,
          ragione_sociale: userData.ragione_sociale,
          partita_iva: userData.partita_iva,
          fiscal_country: userData.fiscal_country,
          codice_fiscale: userData.codice_fiscale,
          pec: userData.pec,
          codice_sdi: userData.codice_sdi,
          address_street: userData.address_street,
          address_city: userData.address_city,
          address_region: userData.address_region,
          address_postal_code: userData.address_postal_code,
          indirizzo_spedizione_paese: (userData as any).indirizzo_spedizione_paese,
          indirizzo_fatturazione_paese: (userData as any).indirizzo_fatturazione_paese,
        },
      },
    });

    if (error) {
      return { data: null, error };
    }

    // UPSERT profile - crea o aggiorna (gestisce sia il caso con che senza trigger Supabase)
    if (data.user) {
      // Piccolo delay per permettere al trigger Supabase di creare il profilo
      await new Promise(resolve => setTimeout(resolve, 800));

      const profileData = {
        id: data.user.id,
        email: email,
        user_type: (userData.user_type || 'cliente') as 'cliente' | 'venditore' | 'admin',
        nome: userData.nome || '',
        cognome: userData.cognome || '',
        telefono: userData.telefono || null,
        ragione_sociale: userData.ragione_sociale || null,
        partita_iva: userData.partita_iva || null,
        codice_fiscale: (userData as any).codice_fiscale || null,
        pec: (userData as any).pec || null,
        codice_sdi: (userData as any).codice_sdi || null,
        indirizzo_spedizione_via: (userData as any).indirizzo_spedizione_via || null,
        indirizzo_spedizione_citta: (userData as any).indirizzo_spedizione_citta || null,
        indirizzo_spedizione_provincia: (userData as any).indirizzo_spedizione_provincia || null,
        indirizzo_spedizione_cap: (userData as any).indirizzo_spedizione_cap || null,
        indirizzo_spedizione_paese: (userData as any).indirizzo_spedizione_paese || 'IT',
        indirizzo_fatturazione_via: (userData as any).indirizzo_fatturazione_via || null,
        indirizzo_fatturazione_citta: (userData as any).indirizzo_fatturazione_citta || null,
        indirizzo_fatturazione_provincia: (userData as any).indirizzo_fatturazione_provincia || null,
        indirizzo_fatturazione_cap: (userData as any).indirizzo_fatturazione_cap || null,
        indirizzo_fatturazione_paese: (userData as any).indirizzo_fatturazione_paese || 'IT',
      };

      // Prima prova UPDATE (se il profilo esiste già grazie al trigger Supabase)
      const { error: updateErr } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', data.user.id);

      // Se il profilo non esiste ancora, usa INSERT (upsert manuale)
      if (updateErr && updateErr.code === 'PGRST116') {
        const { error: insertErr } = await supabase
          .from('profiles')
          .insert(profileData);
        if (insertErr) {
          console.error('Profile insert error:', insertErr.message);
        }
      } else if (updateErr) {
        // Se l'update fallisce per altri motivi, prova upsert diretto
        await supabase
          .from('profiles')
          .upsert(profileData, { onConflict: 'id' });
      }
    }

    return { data, error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
