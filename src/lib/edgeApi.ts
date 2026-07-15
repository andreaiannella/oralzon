import { supabase } from './supabase';

const SUPABASE_URL = 'https://ckslkfshimzuujtpboui.supabase.co';
export const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrc2xrZnNoaW16dXVqdHBib3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTIwODIsImV4cCI6MjA5NDMyODA4Mn0.vhwaSLVWzVC9OGK7I4hE5V2P5H3A9V690YE9ELM-2eY';
export const EDGE_URL = `${SUPABASE_URL}/functions/v1/make-server-000b3cfb`;

/**
 * Chiama un endpoint dell'edge function con parsing sicuro della risposta.
 * Se il server risponde con qualcosa che non è JSON (es. una pagina 404 perché
 * l'edge function non è stata rideployata), restituisce un errore chiaro invece
 * di far esplodere res.json() con un cryptico "SyntaxError" (specialmente su Safari/iOS,
 * dove l'errore nativo è "The string did not match the expected pattern").
 */
export async function callEdge<T = any>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: any; requireAuth?: boolean } = {}
): Promise<{ success: boolean; error?: string; [key: string]: any }> {
  const { method = 'POST', body, requireAuth = true } = options;

  let token = ANON_KEY;
  if (requireAuth) {
    const { data: { session } } = await supabase.auth.getSession();
    token = session?.access_token || ANON_KEY;
  }

  let res: Response;
  try {
    res = await fetch(`${EDGE_URL}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    return { success: false, error: 'Impossibile contattare il server. Controlla la connessione.' };
  }

  const rawText = await res.text();
  let parsed: any;
  try {
    parsed = rawText ? JSON.parse(rawText) : {};
  } catch {
    // La risposta non è JSON valido — quasi sempre significa che l'edge function
    // non è stata rideployata (endpoint mancante → Hono risponde con 404 testuale)
    console.error(`Risposta non-JSON da ${path} (status ${res.status}):`, rawText.slice(0, 200));
    return {
      success: false,
      error: res.status === 404
        ? 'Funzionalità non disponibile: il server non è aggiornato. Riprova più tardi o contatta l\'assistenza.'
        : `Errore del server (${res.status}). Riprova.`,
    };
  }

  if (!res.ok && parsed.success === undefined) {
    return { success: false, error: parsed.error || parsed.message || `Errore del server (${res.status})` };
  }

  return parsed;
}
