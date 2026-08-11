// BUG TROVATO: questi prezzi erano duplicati "a mano" in TRE punti diversi
// — VendorPricing.tsx (pagina pubblica /pricing-venditori), VendorPromotions.tsx
// (acquisto vero, dentro il pannello venditore) e PROMO_PACKAGE_PRICES nel
// backend — con un commento nel backend che avvisava di tenerli allineati
// SOLO con VendorPromotions.tsx, ignorando che esisteva una terza copia in
// VendorPricing.tsx. Risultato: la pagina pubblica mostrava ancora i vecchi
// prezzi pieni (es. €99/mese) mentre l'acquisto vero e il backend erano già
// stati aggiornati al prezzo di lancio (es. €29/mese) — chi guardava la
// pagina pubblica vedeva un prezzo, e ne pagava uno diverso (più basso, non
// un rischio di sicurezza, ma comunque un'informazione sbagliata mostrata).
//
// Questa è ora l'UNICA fonte per il numero del prezzo, condivisa dalle due
// pagine frontend. Il backend resta necessariamente una copia separata
// (runtime Deno distinto, vedi PROMO_PACKAGE_PRICES in supabase/functions/
// server/index.tsx) — è comunque il backend a decidere cosa viene
// realmente addebitato via Stripe, mai il prezzo inviato dal client, quindi
// un disallineamento futuro lì potrebbe di nuovo creare confusione ma MAI
// un addebito sbagliato.
export const PROMO_PACKAGE_PRICES: Record<string, number> = {
  featured_monthly: 29,
  featured_quarterly: 79,
  homepage_monthly: 49,
  homepage_fixed: 199,
  category_single: 39,
  category_multi: 99,
};
