import { supabase } from './supabase';
import { getRecentlyViewed } from '../app/components/RecentlyViewed';

// Inferenza delle categorie di interesse del cliente, SOLO da comportamento
// di prima parte dentro Oralzon (nessun dato dichiarato, nessun cookie di
// tracciamento cross-sito): storico acquisti (segnale forte — un cliente
// che ha comprato in una categoria è quasi certamente uno specialista di
// quella categoria, in un marketplace B2B verticale come questo) e prodotti
// visti di recente (segnale più debole, ma utile per i clienti nuovi senza
// ancora storico ordini, e per catturare interessi emergenti).
//
// Ritorna un array di nomi categoria canonici (italiano, come salvati su
// products.category), ordinati dal più al meno rilevante. Array vuoto se
// non c'è alcun segnale disponibile (cliente nuovo, mai loggato, ecc.) —
// in quel caso il chiamante deve mostrare il comportamento generico
// invariato, mai forzare una personalizzazione senza dati.
export async function getInterestCategories(userId: string | null): Promise<string[]> {
  const scores: Record<string, number> = {};

  // Storico acquisti — peso maggiore (x3): segnale comportamentale più
  // affidabile che esista, il cliente ha già speso soldi in quella categoria.
  if (userId) {
    try {
      const { data: orders } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_id', userId)
        .limit(100);
      const orderIds = (orders || []).map((o: any) => o.id);
      if (orderIds.length > 0) {
        const { data: items } = await supabase
          .from('order_items')
          .select('product_id, products(category)')
          .in('order_id', orderIds)
          .limit(300);
        for (const item of (items || []) as any[]) {
          const cat = item.products?.category;
          if (cat) scores[cat] = (scores[cat] || 0) + 3;
        }
      }
    } catch (err) {
      console.error('Errore inferenza interessi da acquisti:', err);
    }
  }

  // Prodotti visti di recente — peso minore (x1), da localStorage, sempre
  // disponibile anche per chi non ha ancora comprato nulla.
  for (const p of getRecentlyViewed()) {
    if (p.category) scores[p.category] = (scores[p.category] || 0) + 1;
  }

  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([category]) => category);
}
