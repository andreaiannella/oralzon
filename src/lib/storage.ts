import { supabase } from './supabase';

const BUCKET = 'product-images';

// PERFORMANCE: le foto prodotto arrivano spesso direttamente dalla fotocamera
// di un telefono (3-8MB, 4000px+ di lato) — caricarle così com'è significa
// servire quel peso a OGNI visitatore che vede quel prodotto, anche solo
// come piccola miniatura nella griglia. Ridimensioniamo e comprimiamo qui,
// prima dell'upload, così ogni foto futura parte già in un formato
// ragionevole per il web — senza bisogno di funzionalità di trasformazione
// immagini lato Supabase (che dipendono dal piano attivo).
const MAX_DIMENSION = 1600; // sufficiente anche per lo zoom sulla pagina prodotto
const JPEG_QUALITY = 0.82;

async function compressImage(file: File): Promise<File> {
  // I file non-immagine (non dovrebbero arrivare qui, ma per sicurezza) o
  // già molto leggeri passano invariati — comprimere un file già piccolo
  // non porta benefici e rischia solo di introdurre artefatti inutili.
  if (!file.type.startsWith('image/') || file.size < 300 * 1024) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
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
      canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file; // se non ha davvero ridotto il peso, tieni l'originale

    const newName = file.name.replace(/\.[^.]+$/, '.jpg');
    return new File([blob], newName, { type: 'image/jpeg' });
  } catch (e) {
    // Se la compressione fallisce per qualunque motivo (formato non supportato
    // dal browser, canvas bloccato, ecc.), non blocchiamo mai il caricamento
    // del venditore — meglio una foto pesante che nessuna foto.
    console.warn('Compressione immagine non riuscita, carico il file originale:', e);
    return file;
  }
}

/**
 * Carica un'immagine prodotto su Supabase Storage.
 * Il path è: {vendorId}/{timestamp}-{sanitizedFilename}
 * Ritorna la URL pubblica dell'immagine.
 */
export async function uploadProductImage(
  file: File,
  vendorId: string
): Promise<string> {
  const compressed = await compressImage(file);
  const ext = compressed.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${vendorId}/${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, {
      cacheControl: '3600',
      upsert: false,
      contentType: compressed.type,
    });

  if (error) throw new Error(`Upload fallito: ${error.message}`);

  return getPublicUrl(path);
}

/**
 * Carica più immagini in parallelo e ritorna tutte le URL pubbliche.
 * Se un file fallisce, lancia errore con il nome del file.
 */
export async function uploadProductImages(
  files: File[],
  vendorId: string,
  onProgress?: (done: number, total: number) => void
): Promise<string[]> {
  const urls: string[] = [];

  for (let i = 0; i < files.length; i++) {
    const url = await uploadProductImage(files[i], vendorId);
    urls.push(url);
    onProgress?.(i + 1, files.length);
  }

  return urls;
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
