import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
  signUp: (email: string, password: string, userData: Partial<Profile>) => Promise<{ data: any; error: any }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<Profile>) => {
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
        indirizzo_fatturazione_via: (userData as any).indirizzo_fatturazione_via || null,
        indirizzo_fatturazione_citta: (userData as any).indirizzo_fatturazione_citta || null,
        indirizzo_fatturazione_provincia: (userData as any).indirizzo_fatturazione_provincia || null,
        indirizzo_fatturazione_cap: (userData as any).indirizzo_fatturazione_cap || null,
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
