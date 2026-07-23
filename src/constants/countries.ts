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

// Da quando ogni paese richiede l'EMISSIONE di fatture elettroniche
// strutturate per le vendite B2B (non solo la ricezione) — stessa lista
// usata lato server in supabase/functions/server/index.tsx, tenerle
// allineate se questi obblighi cambiano.
export const EINVOICING_MANDATE_SINCE: Record<string, string | null> = {
  IT: '2019-01-01',
  BE: '2026-01-01',
  PL: '2026-04-01',
  FR: '2026-09-01',
  DE: null,
  RO: '2024-01-01',
  HR: '2026-01-01',
  HU: '2021-01-01',
  GR: '2024-01-01',
};

export const isEinvoicingMandatory = (country: string | null | undefined, atDate: Date = new Date()) => {
  const since = EINVOICING_MANDATE_SINCE[String(country || '').toUpperCase()];
  if (!since) return false;
  return atDate >= new Date(since);
};
