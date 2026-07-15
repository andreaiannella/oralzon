import { supabase } from './supabase';

const BUCKET = 'product-images';

/**
 * Carica un'immagine prodotto su Supabase Storage.
 * Il path è: {vendorId}/{timestamp}-{sanitizedFilename}
 * Ritorna la URL pubblica dell'immagine.
 */
export async function uploadProductImage(
  file: File,
  vendorId: string
): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${vendorId}/${safeName}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
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
