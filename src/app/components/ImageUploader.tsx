import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, AlertCircle, ImageIcon, GripVertical } from 'lucide-react';
import { uploadProductImages, deleteProductImage } from '../../lib/storage';

interface ImageUploaderProps {
  vendorId: string;
  existingUrls?: string[];             // URL piene già salvate (edit mode)
  existingThumbUrls?: string[];        // thumbnail corrispondenti, stesso ordine (edit mode)
  onChange: (urls: string[], thumbUrls: string[]) => void; // callback con le URL finali
  maxImages?: number;
  disabled?: boolean;
}

interface ImageItem {
  id: string;
  // Una di queste due è sempre presente:
  file?: File;          // file locale ancora da caricare
  url?: string;         // URL piena già caricata (esistente o appena uploadata)
  thumbUrl?: string;    // URL thumbnail corrispondente (esistente o appena generata)
  preview: string;      // objectURL (locale) o URL remota
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

export function ImageUploader({
  vendorId,
  existingUrls = [],
  existingThumbUrls = [],
  onChange,
  maxImages = 8,
  disabled = false,
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([]);

  // Inizializza con le immagini già esistenti. Se un prodotto è stato
  // caricato prima dell'introduzione delle thumbnail, existingThumbUrls[i]
  // può mancare: in quel caso resta undefined e il chiamante ripiegherà
  // sulla foto piena, senza errori né immagini mancanti.
  const [items, setItems] = useState<ImageItem[]>(() =>
    existingUrls.map((url, i) => ({
      id: url,
      url,
      thumbUrl: existingThumbUrls[i],
      preview: url,
      status: 'done' as const,
    }))
  );

  // Notifica parent ogni volta che items cambia
  const notifyParent = useCallback(
    (updated: ImageItem[]) => {
      const done = updated.filter((i) => i.status === 'done' && i.url);
      const urls = done.map((i) => i.url as string);
      const thumbUrls = done.map((i) => i.thumbUrl || (i.url as string));
      onChange(urls, thumbUrls);
    },
    [onChange]
  );

  const addFiles = async (files: FileList | null) => {
    if (!files || disabled) return;
    setRejectedFiles([]);

    const candidates = Array.from(files);
    const remaining = maxImages - items.length;
    const valid: File[] = [];
    const rejected: string[] = [];

    for (const f of candidates) {
      if (valid.length >= remaining) break;
      if (!f.type.startsWith('image/')) { rejected.push(`${f.name}: formato non supportato`); continue; }
      if (f.size > 5 * 1024 * 1024) { rejected.push(`${f.name}: supera 5MB`); continue; }

      // ROBUSTEZZA: verifica che il file sia davvero decodificabile come
      // immagine PRIMA di accettarlo, non solo che il browser gli abbia
      // assegnato un MIME type "image/*". File scaricati da altri siti
      // possono avere nome ed estensione plausibili ma contenere dati
      // corrotti o non-immagine (es. una pagina di errore salvata per
      // sbaglio con estensione .jpeg) — un file così, se lasciato entrare
      // nella pipeline, produce un'anteprima rotta e un comportamento
      // imprevedibile nella compressione più avanti. Meglio scartarlo qui,
      // subito, con un messaggio chiaro.
      //
      // IMPORTANTE: usiamo createImageBitmap(file), che decodifica i byte
      // del file direttamente in memoria — non un <img src="blob:...">, che
      // la Content Security Policy del sito blocca (img-src consente solo
      // 'self', data: e https:, non blob:). Con new Image()+blob URL il
      // test falliva SEMPRE, su ogni file, per via del blocco CSP, non per
      // un problema reale del file.
      let isDecodable = true;
      try {
        const bitmap = await createImageBitmap(f);
        bitmap.close();
      } catch {
        isDecodable = false;
      }
      if (!isDecodable) { rejected.push(`${f.name}: file danneggiato o non è un'immagine valida`); continue; }

      valid.push(f);
    }

    if (rejected.length > 0) setRejectedFiles(rejected);
    if (valid.length === 0) return;

    // Anteprima: data: URL invece di blob: URL — stesso motivo di sopra,
    // la CSP del sito permette esplicitamente data: ma non blob:. Ciclo
    // sequenziale con await diretto invece di Promise.all con chiusure
    // annidate: stesso risultato, ma pattern più semplice da ottimizzare
    // in modo affidabile per il minificatore in produzione.
    const previews: string[] = [];
    for (const file of valid) {
      const dataUrl: string = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => resolve(''); // anteprima vuota, ma il file resta comunque caricabile
        reader.readAsDataURL(file);
      });
      previews.push(dataUrl);
    }

    const newItems: ImageItem[] = [];
    for (let i = 0; i < valid.length; i++) {
      newItems.push({
        id: `local-${Date.now()}-${Math.random()}-${i}`,
        file: valid[i],
        preview: previews[i],
        status: 'pending',
      });
    }

    const updated = [...items, ...newItems];
    setItems(updated);

    // Avvia upload automatico
    uploadFiles(newItems, updated);
  };

  const uploadFiles = async (toUpload: ImageItem[], currentItems: ImageItem[]) => {
    setUploading(true);
    setUploadProgress({ done: 0, total: toUpload.length });

    const files = toUpload.map((i) => i.file as File);

    // Setta status uploading
    setItems((prev) =>
      prev.map((item) =>
        toUpload.find((u) => u.id === item.id)
          ? { ...item, status: 'uploading' }
          : item
      )
    );

    try {
      // NOTA: il callback di progresso riceve solo un conteggio (done/total),
      // MAI le URL dei file già caricati — uploadProductImages() non le
      // espone finché non ha finito tutti i file. Prima qui si tentava di
      // leggere 'urls'/'thumbUrls' dentro questo stesso callback, ma quelle
      // costanti vengono assegnate SOLO dopo che questo intero await si
      // risolve — lo stesso await che passa il callback come parametro.
      // Il callback può essere invocato PRIMA che l'assegnazione avvenga
      // (mentre l'upload dei primi file è ancora in corso), quindi leggere
      // 'urls'/'thumbUrls' lì dentro cade sempre nella finestra in cui non
      // sono ancora inizializzate — da qui il crash reale osservato in
      // produzione con più immagini insieme. La barra di progresso resta
      // comunque aggiornata; lo stato "done" con le URL vere viene
      // assegnato correttamente subito sotto, quando la promise è risolta.
      const { full: urls, thumb: thumbUrls } = await uploadProductImages(files, vendorId, (done, total) => {
        setUploadProgress({ done, total });
      });

      // Assicurati che tutti siano done con le URL corrette
      setItems((prev) => {
        const updated = prev.map((item) => {
          const uploadIdx = toUpload.findIndex((u) => u.id === item.id);
          if (uploadIdx !== -1) {
            return { ...item, url: urls[uploadIdx], thumbUrl: thumbUrls[uploadIdx], status: 'done' as const };
          }
          return item;
        });
        notifyParent(updated);
        return updated;
      });
    } catch (err: any) {
      // Marca tutti i file pending come errore
      setItems((prev) => {
        const updated = prev.map((item) =>
          toUpload.find((u) => u.id === item.id)
            ? { ...item, status: 'error' as const, error: err.message }
            : item
        );
        notifyParent(updated);
        return updated;
      });
    } finally {
      setUploading(false);
      setUploadProgress({ done: 0, total: 0 });
    }
  };

  const removeItem = async (item: ImageItem) => {
    if (disabled) return;
    // Se ha una URL remota, eliminala dal bucket — thumbnail inclusa, se
    // diversa dalla foto piena (per le immagini caricate prima
    // dell'introduzione delle thumbnail, thumbUrl coincide con url ed è
    // già coperta dalla prima chiamata).
    if (item.url) {
      await deleteProductImage(item.url).catch(() => {});
    }
    if (item.thumbUrl && item.thumbUrl !== item.url) {
      await deleteProductImage(item.thumbUrl).catch(() => {});
    }
    setItems((prev) => {
      const updated = prev.filter((i) => i.id !== item.id);
      notifyParent(updated);
      return updated;
    });
  };

  const retryItem = (item: ImageItem) => {
    if (!item.file) return;
    setItems((prev) => {
      const updated = prev.map((i) =>
        i.id === item.id ? { ...i, status: 'pending' as const, error: undefined } : i
      );
      uploadFiles([{ ...item, status: 'pending' }], updated);
      return updated;
    });
  };

  // Drag & drop handlers
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setDragging(true);
  };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const canAddMore = items.length < maxImages && !disabled;

  return (
    <div className="space-y-3">
      {/* Drop zone — mostrata solo se si possono ancora aggiungere immagini */}
      {canAddMore && (
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
            dragging
              ? 'border-secondary bg-accent'
              : 'border-gray-300 hover:border-oralzon-mint-fresh/50 hover:bg-gray-50'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
            disabled={disabled}
          />
          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Trascina qui le immagini oppure{' '}
                <span className="text-primary">clicca per selezionare</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG, WEBP · Max 5MB per file · Max {maxImages} immagini
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File scartati in fase di selezione (formato non valido, troppo grandi, o danneggiati) */}
      {rejectedFiles.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs text-amber-700 space-y-0.5">
          <p className="font-medium">Alcuni file non sono stati aggiunti:</p>
          {rejectedFiles.map((r, i) => <p key={i}>• {r}</p>)}
        </div>
      )}

      {/* Upload progress bar globale */}
      {uploading && uploadProgress.total > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Caricamento in corso...</span>
            <span>
              {uploadProgress.done}/{uploadProgress.total}
            </span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-accent0 rounded-full transition-all duration-300"
              style={{
                width: `${(uploadProgress.done / uploadProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Grid anteprima immagini */}
      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {items.map((item, idx) => (
            <div
              key={item.id}
              className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-50"
            >
              {/* Immagine */}
              {item.preview ? (
                <img
                  src={item.preview}
                  alt={`Prodotto ${idx + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                </div>
              )}

              {/* Overlay stato */}
              {item.status === 'uploading' && (
                <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-1">
                  <Loader2 className="w-6 h-6 text-secondary animate-spin" />
                  <span className="text-xs text-primary font-medium">Caricamento...</span>
                </div>
              )}

              {item.status === 'error' && (
                <div className="absolute inset-0 bg-red-50/90 flex flex-col items-center justify-center gap-1 p-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-xs text-red-600 text-center leading-tight">
                    {item.error || 'Errore upload'}
                  </span>
                  {item.file && (
                    <button
                      type="button"
                      onClick={() => retryItem(item)}
                      className="text-xs text-primary underline mt-1"
                    >
                      Riprova
                    </button>
                  )}
                </div>
              )}

              {/* Badge prima immagine */}
              {idx === 0 && item.status === 'done' && (
                <div className="absolute bottom-0 inset-x-0 bg-primary text-white text-xs text-center py-0.5 font-medium">
                  Principale
                </div>
              )}

              {/* Bottone rimuovi */}
              {!disabled && item.status !== 'uploading' && (
                <button
                  type="button"
                  onClick={() => removeItem(item)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-white rounded-full shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                  aria-label="Rimuovi immagine"
                >
                  <X className="w-3.5 h-3.5 text-gray-600" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contatore rimaste */}
      {items.length > 0 && (
        <p className="text-xs text-gray-400">
          {items.filter((i) => i.status === 'done').length} immagini caricate
          {canAddMore && ` · puoi aggiungerne ancora ${maxImages - items.length}`}
        </p>
      )}
    </div>
  );
}
