// Elenco paesi condiviso da registrazione venditore, registrazione cliente e
// checkout — prima esisteva solo (duplicato) dentro RegisterVendor.tsx.
// SOLO UE-27: Oralzon opera esclusivamente dentro l'Unione Europea, sia lato
// venditori (obbligatorio per le regole IVA "deemed supplier", art. 14a
// Direttiva 2006/112/CE) sia lato clienti. L'opzione "Altro paese" è stata
// rimossa: apriva la porta a ordini extra-UE che non sappiamo gestire
// (documenti doganali, dazi all'importazione, tariffe corriere fuori zona)
// e che nessun venditore ha configurato per spedire davvero.
export const PAESI_COMUNI = [
  { code: 'IT', label: 'Italia' },
  { code: 'DE', label: 'Germania' },
  { code: 'FR', label: 'Francia' },
  { code: 'ES', label: 'Spagna' },
  { code: 'PT', label: 'Portogallo' },
  { code: 'NL', label: 'Paesi Bassi' },
  { code: 'BE', label: 'Belgio' },
  { code: 'AT', label: 'Austria' },
  { code: 'IE', label: 'Irlanda' },
  { code: 'PL', label: 'Polonia' },
  { code: 'SE', label: 'Svezia' },
  { code: 'DK', label: 'Danimarca' },
  { code: 'FI', label: 'Finlandia' },
  { code: 'GR', label: 'Grecia' },
  { code: 'CZ', label: 'Repubblica Ceca' },
  { code: 'RO', label: 'Romania' },
  { code: 'HU', label: 'Ungheria' },
  { code: 'HR', label: 'Croazia' },
  { code: 'SK', label: 'Slovacchia' },
  { code: 'SI', label: 'Slovenia' },
  { code: 'LT', label: 'Lituania' },
  { code: 'LV', label: 'Lettonia' },
  { code: 'EE', label: 'Estonia' },
  { code: 'LU', label: 'Lussemburgo' },
  { code: 'MT', label: 'Malta' },
  { code: 'CY', label: 'Cipro' },
  { code: 'BG', label: 'Bulgaria' },
];

export const PAESI_UE = ['IT','DE','FR','ES','PT','NL','BE','AT','IE','PL','SE','DK','FI','GR','CZ','RO','HU','BG','HR','SK','SI','LT','LV','EE','LU','MT','CY'];

export const isPaeseUE = (code: string) => PAESI_UE.includes(code);

export type ShippingZone = 'IT' | 'UE';

/**
 * Zona di spedizione tra il Paese del VENDITORE e quello del cliente.
 * DEVE restare identica a shippingZoneBetween() nell'edge function
 * (supabase/functions/server/index.tsx): se le due divergono, il cliente
 * vede a checkout un costo di spedizione diverso da quello realmente
 * addebitato da Stripe.
 *
 * Solo due zone, perché Oralzon opera esclusivamente dentro l'UE-27:
 * - 'IT' = spedizione NAZIONALE (venditore e cliente nello stesso Paese)
 * - 'UE' = intra-UE (Paesi diversi, entrambi nell'Unione)
 *
 * NOTA sul nome storico 'IT' della zona nazionale: la piattaforma è nata
 * solo con venditori italiani, quindi la zona nazionale fu chiamata 'IT'.
 * Ora i venditori possono essere di tutta l'UE-27, e "nazionale" significa
 * "stesso Paese del venditore" — un venditore tedesco che spedisce in
 * Germania fa una spedizione NAZIONALE, non internazionale. Il valore
 * 'IT' resta come chiave in database per non dover migrare i dati
 * esistenti, ma il significato è "domestico rispetto al venditore".
 *
 * Ritorna null se una delle due parti è fuori UE: non è una zona valida,
 * è un ordine che non dobbiamo accettare (nessun venditore ha tariffe
 * doganali configurate). I chiamanti devono trattare null come "blocca".
 */
export function shippingZoneBetween(originCountry: string | null | undefined, destCountry: string | null | undefined): ShippingZone | null {
  const origin = originCountry || 'IT';
  const dest = destCountry || 'IT';
  if (!isPaeseUE(origin) || !isPaeseUE(dest)) return null;
  return origin === dest ? 'IT' : 'UE';
}

/**
 * Arrotonda il costo di spedizione ai 50 centesimi superiori.
 * DEVE restare identica a roundShipping() nell'edge function: se le due
 * divergono, il cliente vede a checkout un totale diverso da quello
 * addebitato da Stripe.
 *
 * Perché per eccesso e non al più vicino: quando le etichette passeranno
 * dall'aggregatore, il prezzo preventivato può risultare più basso di
 * quello poi fatturato dal corriere — tipicamente per il peso volumetrico,
 * che nel dentale supera quasi sempre il peso reale (scatoloni di guanti,
 * camici: leggeri e ingombranti). Questi centesimi sono il cuscinetto che
 * assorbe quella differenza, non un margine: su €6,80 il cliente paga
 * €7,00, cifra che legge come prezzo pulito e non come ricarico.
 *
 * Lo zero resta zero: la spedizione gratuita non deve mai diventare €0,50.
 */
export function roundShipping(amount: number): number {
  if (!amount || amount <= 0) return 0;
  return Math.ceil(amount * 2) / 2;
}
