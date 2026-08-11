// BUG TROVATO: esistevano DUE meccanismi separati per lo stesso problema
// (chunk JS non più raggiungibile dopo un nuovo deploy — vedi commenti
// storici in main.tsx ed ErrorBoundary.tsx) con DUE contatori diversi in
// sessionStorage che non si parlavano tra loro:
// - main.tsx (evento "vite:preloadError"): un flag booleano, UN SOLO
//   tentativo per l'intera vita della scheda, mai più dopo.
// - ErrorBoundary.tsx (componentDidCatch): fino a 3 tentativi, ma un tetto
//   fisso "per sempre in questa scheda" — una volta esauriti i 3 tentativi,
//   qualunque nuovo incidente (anche completamente scollegato, ore dopo)
//   finiva dritto sulla schermata di errore invece di autoripararsi.
// In una sessione con decine di deploy consecutivi ravvicinati, entrambi i
// tetti si esauriscono rapidamente con incidenti legittimi e scollegati tra
// loro (pagine diverse, deploy diversi) — non un loop dello stesso errore
// che si ripete. Serve una finestra temporale, non un tetto fisso: se
// l'ultimo tentativo risale a più di qualche minuto fa, è ragionevole
// considerarlo un incidente nuovo e concedere di nuovo il beneficio del
// dubbio, invece di penalizzare per sempre la stessa scheda del browser.
const STORAGE_KEY = 'oralzon-chunk-reload-state';
const MAX_ATTEMPTS_IN_WINDOW = 3;
const MIN_GAP_MS = 5_000; // mai due ricariche a distanza di meno di 5s (vero loop)
const ROLLING_WINDOW_MS = 5 * 60_000; // dopo 5 minuti dall'ultimo tentativo, budget resettato

interface ReloadState {
  count: number;
  lastAttempt: number;
}

function readState(): ReloadState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { count: 0, lastAttempt: 0 };
}

function writeState(state: ReloadState) {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

// Ritorna true se ha effettivamente avviato una ricarica (il chiamante non
// deve fare altro), false se il budget è esaurito e va mostrata la
// schermata di errore con i pulsanti manuali.
export function attemptStaleChunkReload(): boolean {
  const now = Date.now();
  let state = readState();

  // Finestra scaduta: trattalo come un incidente nuovo, non collegato ai
  // tentativi precedenti.
  if (now - state.lastAttempt > ROLLING_WINDOW_MS) {
    state = { count: 0, lastAttempt: 0 };
  }

  if (state.count >= MAX_ATTEMPTS_IN_WINDOW || now - state.lastAttempt < MIN_GAP_MS) {
    return false;
  }

  writeState({ count: state.count + 1, lastAttempt: now });
  window.location.reload();
  return true;
}
