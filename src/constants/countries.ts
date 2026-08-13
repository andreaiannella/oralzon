// Elenco paesi condiviso da registrazione venditore, registrazione cliente e
// checkout — prima esisteva solo (duplicato) dentro RegisterVendor.tsx.
// Lista pensata per l'Unione Europea (dove operiamo oggi/a breve), con
// un'opzione "Altro" per non bloccare comunque chi è fuori UE.
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
  { code: 'OTHER', label: 'Altro paese' },
];

export const PAESI_UE = ['IT','DE','FR','ES','PT','NL','BE','AT','IE','PL','SE','DK','FI','GR','CZ','RO','HU','BG','HR','SK','SI','LT','LV','EE','LU','MT','CY'];

export const isPaeseUE = (code: string) => PAESI_UE.includes(code);

export type ShippingZone = 'IT' | 'UE' | 'EXTRA_UE';

/**
 * Zona di spedizione tra il Paese del VENDITORE e quello del cliente.
 * DEVE restare identica a shippingZoneBetween() nell'edge function
 * (supabase/functions/server/index.tsx): se le due divergono, il cliente
 * vede a checkout un costo di spedizione diverso da quello realmente
 * addebitato da Stripe.
 *
 * NOTA sul nome storico 'IT' della zona nazionale: la piattaforma è nata
 * solo con venditori italiani, quindi la zona nazionale fu chiamata 'IT'.
 * Ora i venditori possono essere di tutta l'UE-27, e "nazionale" significa
 * "stesso Paese del venditore" — un venditore tedesco che spedisce in
 * Germania fa una spedizione NAZIONALE, non internazionale. Il valore
 * 'IT' resta come chiave in database per non dover migrare i dati
 * esistenti, ma il significato è "domestico rispetto al venditore".
 */
export function shippingZoneBetween(originCountry: string | null | undefined, destCountry: string | null | undefined): ShippingZone {
  const origin = originCountry || 'IT';
  const dest = destCountry || 'IT';
  if (origin === dest) return 'IT';
  if (isPaeseUE(origin) && isPaeseUE(dest)) return 'UE';
  return 'EXTRA_UE';
}
