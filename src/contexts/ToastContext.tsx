import { createContext, useContext, useState, useCallback, useRef } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
  exiting?: boolean;
}

interface ToastContextValue {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
  /** Conferma con pulsanti Sì/No al posto di confirm() bloccante — ritorna una Promise<boolean>. */
  confirm: (message: string, options?: { confirmLabel?: string; cancelLabel?: string; danger?: boolean }) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextValue | null>(null);

// Ogni notifica sparisce da sola dopo questo tempo, tranne se l'utente ci
// passa sopra col mouse (vedi onMouseEnter/onMouseLeave nel componente) —
// per non far sparire un errore importante mentre lo si sta ancora leggendo.
const AUTO_DISMISS_MS = 4500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmState, setConfirmState] = useState<{ message: string; confirmLabel: string; cancelLabel: string; danger: boolean; resolve: (v: boolean) => void } | null>(null);
  const nextId = useRef(0);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.map(t => (t.id === id ? { ...t, exiting: true } : t)));
    // Il tempo qui deve combaciare con la durata dell'animazione toast-out in index.css
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 200);
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const push = useCallback((type: ToastType, message: string) => {
    const id = nextId.current++;
    setToasts(prev => [...prev, { id, type, message }]);
    const timer = setTimeout(() => remove(id), AUTO_DISMISS_MS);
    timers.current.set(id, timer);
  }, [remove]);

  const pauseTimer = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) { clearTimeout(timer); timers.current.delete(id); }
  }, []);

  const resumeTimer = useCallback((id: number) => {
    const timer = setTimeout(() => remove(id), AUTO_DISMISS_MS);
    timers.current.set(id, timer);
  }, [remove]);

  const confirm = useCallback((message: string, options?: { confirmLabel?: string; cancelLabel?: string; danger?: boolean }) => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        message,
        confirmLabel: options?.confirmLabel || 'Conferma',
        cancelLabel: options?.cancelLabel || 'Annulla',
        danger: options?.danger ?? false,
        resolve,
      });
    });
  }, []);

  const closeConfirm = (result: boolean) => {
    confirmState?.resolve(result);
    setConfirmState(null);
  };

  const value: ToastContextValue = {
    success: (m) => push('success', m),
    error: (m) => push('error', m),
    info: (m) => push('info', m),
    warning: (m) => push('warning', m),
    confirm,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onRemove={remove} onPause={pauseTimer} onResume={resumeTimer} />
      {confirmState && <ConfirmDialog {...confirmState} onClose={closeConfirm} />}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast deve essere usato dentro <ToastProvider>');
  return ctx;
}

// ── Rendering ────────────────────────────────────────────────────────

const TYPE_STYLES: Record<ToastType, { bg: string; border: string; iconBg: string; iconColor: string }> = {
  success: { bg: 'bg-white', border: 'border-l-4 border-l-primary', iconBg: 'bg-accent', iconColor: 'text-primary' },
  error:   { bg: 'bg-white', border: 'border-l-4 border-l-red-500', iconBg: 'bg-red-50', iconColor: 'text-red-600' },
  warning: { bg: 'bg-white', border: 'border-l-4 border-l-amber-500', iconBg: 'bg-amber-50', iconColor: 'text-amber-600' },
  info:    { bg: 'bg-white', border: 'border-l-4 border-l-oralzon-chrome-silver', iconBg: 'bg-gray-100', iconColor: 'text-gray-600' },
};

function ToastIcon({ type }: { type: ToastType }) {
  // SVG inline invece di lucide-react per non appesantire con un altro
  // import in un file caricato da ogni pagina — quattro forme semplici bastano.
  if (type === 'success') return <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5"><path d="M5 10.5l3 3 7-7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (type === 'error') return <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" /><path d="M10 6v5M10 14v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
  if (type === 'warning') return <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5"><path d="M10 3l8.5 14.5H1.5L10 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M10 8v4M10 15v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
  return <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5"><circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" /><path d="M10 9v5M10 6v.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

function ToastViewport({ toasts, onRemove, onPause, onResume }: {
  toasts: ToastItem[];
  onRemove: (id: number) => void;
  onPause: (id: number) => void;
  onResume: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div
      className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[100] flex flex-col gap-2 pointer-events-none"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
      aria-live="polite"
      role="status"
    >
      {toasts.map(toast => {
        const style = TYPE_STYLES[toast.type];
        return (
          <div
            key={toast.id}
            onMouseEnter={() => onPause(toast.id)}
            onMouseLeave={() => onResume(toast.id)}
            className={`pointer-events-auto flex items-start gap-3 ${style.bg} ${style.border} rounded-lg shadow-lg px-4 py-3 ${toast.exiting ? 'toast-exit' : 'toast-enter'}`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${style.iconBg} ${style.iconColor}`}>
              <ToastIcon type={toast.type} />
            </div>
            <p className="text-sm text-gray-800 flex-1 pt-0.5 leading-snug">{toast.message}</p>
            <button
              onClick={() => onRemove(toast.id)}
              aria-label="Chiudi notifica"
              className="text-gray-300 hover:text-gray-500 flex-shrink-0 -mr-1 -mt-0.5 p-1"
            >
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4"><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// Sostituisce confirm() bloccante del browser con un dialogo coerente col
// resto del sito — usato ovunque prima si chiedeva conferma prima di
// un'azione distruttiva (elimina, annulla, ecc.).
function ConfirmDialog({ message, confirmLabel, cancelLabel, danger, onClose }: {
  message: string; confirmLabel: string; cancelLabel: string; danger: boolean; onClose: (v: boolean) => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/40 z-[110] flex items-center justify-center p-4" onClick={() => onClose(false)}>
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl toast-enter" onClick={e => e.stopPropagation()}>
        <p className="text-sm text-gray-800 leading-relaxed mb-5">{message}</p>
        <div className="flex gap-3">
          <button onClick={() => onClose(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            {cancelLabel}
          </button>
          <button
            onClick={() => onClose(true)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium text-white ${danger ? 'bg-red-600 hover:bg-red-700' : 'bg-primary hover:bg-primary/90'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
