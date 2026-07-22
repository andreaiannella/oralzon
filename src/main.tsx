import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";
import "./i18n";

// Dopo ogni deploy, i file JS delle varie sezioni cambiano nome (hash nel
// nome del file, vedi netlify.toml). Chi ha già il sito aperto in una scheda
// e naviga verso una sezione non ancora caricata può ricevere un errore
// "Failed to fetch dynamically imported module" — il file richiesto non
// esiste più sul server. Senza questo, l'utente vede un errore secco senza
// sapere cosa fare. Qui rileviamo il caso specifico e ricarichiamo la
// pagina una sola volta in automatico (il flag in sessionStorage evita un
// loop infinito se il problema fosse un altro).
window.addEventListener("vite:preloadError", () => {
  const key = "oralzon-reload-on-chunk-error";
  if (!sessionStorage.getItem(key)) {
    sessionStorage.setItem(key, "1");
    window.location.reload();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
