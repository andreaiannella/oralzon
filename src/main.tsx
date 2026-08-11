import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import "./i18n";
import { attemptStaleChunkReload } from "./lib/staleChunkRecovery";

// Dopo ogni deploy, i file JS delle varie sezioni cambiano nome (hash nel
// nome del file, vedi netlify.toml). Chi ha già il sito aperto in una scheda
// e naviga verso una sezione non ancora caricata può ricevere un errore
// "Failed to fetch dynamically imported module" — il file richiesto non
// esiste più sul server. Senza questo, l'utente vede un errore secco senza
// sapere cosa fare. attemptStaleChunkReload() (condivisa con
// ErrorBoundary.tsx, stesso contatore) ricarica automaticamente entro un
// budget a finestra temporale, non più un flag "una volta sola per sempre".
window.addEventListener("vite:preloadError", () => {
  attemptStaleChunkReload();
});

createRoot(document.getElementById("root")!).render(<App />);
