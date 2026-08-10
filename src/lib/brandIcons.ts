// Set di icone illustrate brand Oralzon (non Lucide) — usate nei punti in cui
// serve più carattere visivo rispetto alle icone a linea sottile standard:
// menu principali (account, venditore), badge di stato, punti di ingresso
// chiave. Il resto del sito continua a usare Lucide per le icone inline
// generiche (frecce, chiudi, ecc.), coerente con la scelta architetturale
// di non mischiare troppi stili diversi nello stesso punto.
export const BRAND_ICONS = {
  tracking: '/images/icons/tracking.png',
  settings: '/images/icons/impostazioni.png',
  pending: '/images/icons/1.png', // storico/attività in attesa (clessidra)
  cart: '/images/icons/carrello.png',
  search: '/images/icons/cerca.png',
  support: '/images/icons/contatti.png',
  billing: '/images/icons/fatturazione.png',
  login: '/images/icons/login.png',
  logout: '/images/icons/logout.png',
  notifications: '/images/icons/notifiche.png',
  verifiedSeller: '/images/icons/oralzon_seller.png',
  orders: '/images/icons/ordini.png',
  payments: '/images/icons/pagamenti.png',
  favorites: '/images/icons/preferiti.png',
  reviews: '/images/icons/recensioni.png',
  shop: '/images/icons/shop.png',
  shipping: '/images/icons/spedizioni.png',
} as const;

export type BrandIconName = keyof typeof BRAND_ICONS;
