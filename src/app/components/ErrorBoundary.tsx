import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

// Rete di sicurezza per tutta l'app: senza questo, un errore imprevisto in
// QUALUNQUE componente (un dato nullo non gestito, un bug, una risposta API
// inattesa) manda l'intera app su schermo bianco, senza nessun modo per
// l'utente di recuperare se non chiudere e riaprire alla cieca. Con questo,
// mostriamo una schermata comprensibile con un modo per uscirne.
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In produzione qui si potrebbe agganciare un servizio di error
    // tracking (Sentry, ecc.) — per ora almeno finisce nei log della
    // console/del provider di hosting, invece di sparire nel nulla.
    console.error('Errore non gestito catturato da ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
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
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
