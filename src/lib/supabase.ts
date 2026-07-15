import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Credenziali Supabase - CONFIGURATE
const supabaseUrl = 'https://ckslkfshimzuujtpboui.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrc2xrZnNoaW16dXVqdHBib3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTIwODIsImV4cCI6MjA5NDMyODA4Mn0.vhwaSLVWzVC9OGK7I4hE5V2P5H3A9V690YE9ELM-2eY';

// Flag per indicare se Supabase è configurato
export const isSupabaseConfigured = true;

// Crea il client Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Helper per verificare autenticazione
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

// Helper per il logout
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};
