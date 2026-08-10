import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode; // se presente, sostituisce lo schermo a pagina intera — per uso locale attorno a un singolo componente
}

interface State {
  hasError: boolean;
  errorMessage?: string;
  errorStack?: string;
}

// Rete di sicurezza per tutta l'app: senza questo, un errore imprevisto in
// QUALUNQUE componente (un dato nullo non gestito, un bug, una risposta API
// inattesa) manda l'intera app su schermo bianco, senza nessun modo per
// l'utente di recuperare se non chiudere e riaprire alla cieca. Con questo,
// mostriamo una schermata comprensibile con un modo per uscirne.
//
// Oltre all'uso a livello di intera app (vedi App.tsx), può essere montato
// localmente attorno a un componente specifico e rischioso (es. upload
// immagini) passando una prop `fallback` più piccola — così un errore lì
// dentro non spegne l'intera pagina/form, solo quel widget.
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error?.message, errorStack: error?.stack };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In produzione qui si potrebbe agganciare un servizio di error
    // tracking (Sentry, ecc.) — per ora almeno finisce nei log della
    // console/del provider di hosting, invece di sparire nel nulla.
    console.error('Errore non gestito catturato da ErrorBoundary:', error, errorInfo);

    // Dopo un nuovo deploy, i file JS delle varie sezioni cambiano nome
    // (hash nel nome file). Chi ha già il sito aperto in una scheda e
    // naviga verso una sezione non ancora caricata in quella sessione può
    // ricevere un errore di import fallito — il messaggio varia da browser
    // a browser, main.tsx intercetta già l'evento "vite:preloadError" per
    // il caso più comune, ma non tutte le varianti passano da lì. Qui
    // controlliamo il messaggio stesso come rete di sicurezza aggiuntiva:
    // se sembra proprio un chunk non trovato, ricarichiamo una sola volta
    // in automatico invece di mostrare "Qualcosa è andato storto" per
    // quello che in realtà è solo un problema di cache del browser.
    const msg = error?.message || '';
    const looksLikeStaleChunk = /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|dynamically imported module/i.test(msg);
    if (looksLikeStaleChunk) {
      const key = 'oralzon-reload-on-chunk-error';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
      }
    }
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Qualcosa è andato storto</h1>
            <p className="text-sm text-gray-500 mb-6">
              Si è verificato un errore imprevisto. Prova a tornare alla home — se il problema continua, contattaci.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <Home className="w-4 h-4" /> Torna alla Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Riprova
              </button>
            </div>
            {this.state.errorMessage && (
              <details className="mt-6 text-left">
                <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">Dettaglio tecnico (per il supporto)</summary>
                <div className="mt-2 p-3 bg-gray-100 rounded-lg text-xs text-gray-600 font-mono break-all whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {this.state.errorMessage}
                  {this.state.errorStack && `\n\n${this.state.errorStack}`}
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
