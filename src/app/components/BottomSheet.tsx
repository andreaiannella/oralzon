import { ReactNode, useEffect } from 'react';

/**
 * Involucro responsive per contenuto modale: su mobile scorre dal basso
 * come un vero bottom sheet (angoli superiori arrotondati, maniglia
 * visiva, pollice-friendly); su desktop resta un modale centrato
 * classico con dissolvenza. Il CONTENUTO interno (header, corpo,
 * pulsanti) resta quello già esistente in ogni pagina — questo
 * componente si occupa solo del posizionamento, dell'overlay, delle
 * animazioni e del blocco dello scroll dietro, non della UI interna.
 */
export function BottomSheet({ open, onClose, children, maxWidthClass = 'sm:max-w-md' }: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  maxWidthClass?: string;
}) {
  // Impedisce lo scroll della pagina sotto mentre il pannello è aperto —
  // altrimenti su mobile si può trascinare involontariamente il contenuto
  // di sfondo mentre si interagisce col pannello sopra.
  useEffect(() => {
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = original; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center sheet-overlay"
      onClick={onClose}
    >
      <div
        className={`bg-white w-full ${maxWidthClass} rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-y-auto sheet-panel`}
        onClick={e => e.stopPropagation()}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Maniglia visiva — segnale universale "questo si trascina/chiude", solo su mobile */}
        <div className="sm:hidden flex justify-center pt-2.5 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>
        {children}
      </div>
    </div>
  );
}
