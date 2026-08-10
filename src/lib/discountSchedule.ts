// Uno sconto (discount_price) può ora essere programmato: valido solo tra
// discount_starts_at e discount_ends_at, entrambi opzionali. Un prodotto può
// avere discount_price valorizzato ma NON essere ancora/più in sconto
// visibile — questo helper è l'UNICA fonte di verità su "è attivo ORA",
// usato identicamente in ogni punto del sito (card prodotto, pagina
// prodotto, checkout) per evitare che un punto dica sì e un altro no.
export interface DiscountFields {
  discount_price?: number | string | null;
  discount_starts_at?: string | null;
  discount_ends_at?: string | null;
}

export function isDiscountActive(p: DiscountFields, now: Date = new Date()): boolean {
  if (p.discount_price === null || p.discount_price === undefined) return false;
  const price = Number(p.discount_price);
  if (!price || price <= 0) return false;
  if (p.discount_starts_at && now < new Date(p.discount_starts_at)) return false;
  if (p.discount_ends_at && now > new Date(p.discount_ends_at)) return false;
  return true;
}

/** Stato leggibile per l'interfaccia venditore: attivo ora / programmato per il futuro / scaduto. */
export function getDiscountStatus(p: DiscountFields, now: Date = new Date()): 'active' | 'scheduled' | 'expired' | 'none' {
  if (p.discount_price === null || p.discount_price === undefined || !Number(p.discount_price)) return 'none';
  if (p.discount_starts_at && now < new Date(p.discount_starts_at)) return 'scheduled';
  if (p.discount_ends_at && now > new Date(p.discount_ends_at)) return 'expired';
  return 'active';
}
