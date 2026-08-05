import { supabase } from './supabase';

const BUCKET = 'product-images';

// PERFORMANCE: le foto prodotto arrivano spesso direttamente dalla fotocamera
// di un telefono (3-8MB, 4000px+ di lato) — caricarle così com'è significa
// servire quel peso a OGNI visitatore che vede quel prodotto, anche solo
// come piccola miniatura nella griglia. Generiamo qui DUE versioni per ogni
// foto: una "piena" per la pagina prodotto e una "thumbnail" molto più
// leggera per le griglie (Shop, VendorStore, Home, ecc.) — senza bisogno di
// funzionalità di trasformazione immagini lato Supabase (che richiedono il
// piano Pro, non attivo su questo progetto).
const MAX_DIMENSION = 1600; // sufficiente anche per lo zoom sulla pagina prodotto
const JPEG_QUALITY = 0.82;
const THUMB_MAX_DIMENSION = 400; // ampiamente sufficiente per una card di griglia (150-250px)
const THUMB_JPEG_QUALITY = 0.72;

async function resizeImage(file: File, maxDimension: number, quality: number): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob: Blob | null = await new Promise(resolve =>
      canvas.toBlob(resolve, 'image/jpeg', quality)
    );
    if (!blob) return file;

    const newName = file.name.replace(/\.[^.]+$/, '.jpg');
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch (e) {
    // Se il ridimensionamento fallisce per qualunque motivo (formato non
    // supportato dal browser, canvas bloccato, ecc.), non blocchiamo mai il
    // caricamento del venditore — meglio una foto pesante che nessuna foto.
    console.warn('Ridimensionamento immagine non riuscito, uso il file originale:', e);
    return file;
  }
}

async function compressImage(file: File): Promise<File> {
  // File non-immagine (non dovrebbero arrivare qui, ma per sicurezza) o già
  // molto leggeri passano invariati — comprimere un file già piccolo non
  // porta benefici e rischia solo di introdurre artefatti inutili.
  if (!file.type.startsWith('image/') || file.size < 300 * 1024) return file;
  const resized = await resizeImage(file, MAX_DIMENSION, JPEG_QUALITY);
  return resized.size < file.size ? resized : file; // se non ha davvero ridotto il peso, tieni l'originale
}

async function makeThumbnail(file: File): Promise<File> {
  // A differenza di compressImage, qui ridimensioniamo SEMPRE, anche per
  // foto già leggere: l'obiettivo non è solo il peso ma soprattutto le
  // dimensioni in pixel (400px) — una card di griglia larga 150-250px non
  // ha mai bisogno di più di questo, indipendentemente da quanto pesasse
  // l'originale.
  if (!file.type.startsWith('image/')) return file;
  return resizeImage(file, THUMB_MAX_DIMENSION, THUMB_JPEG_QUALITY);
}

function buildPath(vendorId: string, ext: string, suffix: string = ''): string {
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${suffix}.${ext}`;
  return `${vendorId}/${safeName}`;
}

/**
 * Carica un'immagine prodotto su Supabase Storage, generando sia la
 * versione piena che la thumbnail per le griglie.
 * Ritorna le URL pubbliche di entrambe.
 */
export async function uploadProductImage(
  file: File,
  vendorId: string
): Promise<{ full: string; thumb: string }> {
  const [compressedFull, thumbFile] = await Promise.all([
    compressImage(file),
    makeThumbnail(file),
  ]);

  const fullExt = compressedFull.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fullPath = buildPath(vendorId, fullExt);
  const thumbPath = buildPath(vendorId, 'jpg', '-thumb');

  const [fullUpload, thumbUpload] = await Promise.all([
    supabase.storage.from(BUCKET).upload(fullPath, compressedFull, {
      cacheControl: '3600',
      upsert: false,
      contentType: compressedFull.type,
    }),
    supabase.storage.from(BUCKET).upload(thumbPath, thumbFile, {
      cacheControl: '3600',
      upsert: false,
      contentType: thumbFile.type || 'image/jpeg',
    }),
  ]);

  if (fullUpload.error) throw new Error(`Upload fallito: ${fullUpload.error.message}`);

  // Se solo la thumbnail fallisce, non blocchiamo il salvataggio del
  // prodotto: si ripiega sulla foto piena anche in griglia (esattamente il
  // comportamento di prima), invece di far fallire tutto per
  // un'ottimizzazione che può anche mancare.
  if (thumbUpload.error) {
    console.warn('Upload thumbnail non riuscito, la griglia userà la foto intera per questa immagine:', thumbUpload.error.message);
    return { full: getPublicUrl(fullPath), thumb: getPublicUrl(fullPath) };
  }

  return { full: getPublicUrl(fullPath), thumb: getPublicUrl(thumbPath) };
}

/**
 * Carica più immagini in parallelo (in serie, una alla volta, per non
 * saturare la connessione su mobile) e ritorna le URL pubbliche piene e
 * le relative thumbnail, nello stesso ordine dei file in ingresso.
 * Se un file fallisce, lancia errore con il nome del file.
 */
export async function uploadProductImages(
  files: File[],
  vendorId: string,
  onProgress?: (done: number, total: number) => void
): Promise<{ full: string[]; thumb: string[] }> {
  const full: string[] = new Array(files.length);
  const thumb: string[] = new Array(files.length);
  let doneCount = 0;

  // PERFORMANCE: prima ogni foto veniva compressa e caricata in sequenza,
  // una alla volta — con più foto pesanti da telefono (spesso diverse MB
  // l'una prima della compressione) i tempi si sommavano fino quasi a un
  // minuto per un caricamento multiplo, perché la seconda foto non iniziava
  // finché la prima non aveva finito del tutto (decodifica + compressione +
  // upload full e thumb). Ora fino a CONCURRENCY foto vengono elaborate
  // insieme in parallelo — un compromesso tra velocità reale e non saturare
  // una connessione mobile con troppi upload simultanei. I risultati sono
  // scritti in ordine di INDICE, non di completamento, così la prima foto
  // caricata dal venditore resta sempre la prima (quella principale) anche
  // se finisce di caricare per ultima.
  const CONCURRENCY = 3;
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const i = nextIndex++;
      if (i >= files.length) return;
      const result = await uploadProductImage(files[i], vendorId);
      full[i] = result.full;
      thumb[i] = result.thumb;
      doneCount++;
      onProgress?.(doneCount, files.length);
    }
  }

  const workerCount = Math.min(CONCURRENCY, files.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));

  return { full, thumb };
}

/**
 * Elimina un'immagine dal bucket dato il suo path o URL completa.
 */
export async function deleteProductImage(urlOrPath: string): Promise<void> {
  const path = extractPathFromUrl(urlOrPath);
  if (!path) return;

  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error('Errore eliminazione immagine:', error.message);
}

/**
 * Elimina più immagini in un'unica chiamata.
 */
export async function deleteProductImages(urlsOrPaths: string[]): Promise<void> {
  const paths = urlsOrPaths.map(extractPathFromUrl).filter(Boolean) as string[];
  if (paths.length === 0) return;

  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) console.error('Errore eliminazione immagini:', error.message);
}

/**
 * Ritorna la URL pubblica di un path nel bucket.
 */
export function getPublicUrl(path: string): string {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Estrae il path storage da una URL pubblica Supabase.
 * Es: https://xxx.supabase.co/storage/v1/object/public/product-images/abc/file.jpg
 *  → abc/file.jpg
 */
function extractPathFromUrl(urlOrPath: string): string | null {
  if (!urlOrPath) return null;

  // Se è già un path relativo (senza http), lo ritorna direttamente
  if (!urlOrPath.startsWith('http')) return urlOrPath;

  const marker = `/object/public/${BUCKET}/`;
  const idx = urlOrPath.indexOf(marker);
  if (idx === -1) return null;

  return decodeURIComponent(urlOrPath.slice(idx + marker.length));
}

/**
 * Verifica se una stringa è una URL pubblica Supabase Storage valida.
 */
export function isStorageUrl(value: string): boolean {
  return value.includes('.supabase.co/storage/');
}
