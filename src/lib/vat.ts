import { PAESI_UE } from '../constants/countries';

/**
 * ══════════════════════════════════════════════════════════════════════
 *  IVA — calcolo lato client (ANTEPRIMA)
 * ══════════════════════════════════════════════════════════════════════
 *
 * ⚠️ LA FONTE DI VERITÀ È IL SERVER, NON QUESTO FILE.
 *
 * L'IVA che il cliente paga davvero è quella calcolata da
 * `determineVatTreatment()` in `supabase/functions/server/index.tsx`, che
 * gira al momento della creazione dell'ordine con i dati reali del
 * venditore letti a database. Questo file serve solo a mostrare al
 * cliente il riepilogo IVA mentre compila il checkout — non decide nulla
 * di fiscale e non deve mai essere l'unico punto in cui un importo viene
 * calcolato.
 *
 * Vale la stessa regola già applicata a PROMO_PACKAGE_PRICES: se cambi
 * un'aliquota o una regola qui, DEVI cambiarla anche nel server, e
 * viceversa. Le due copie vanno tenute allineate a mano.
 *
 * Ultimo allineamento con il server: 13/08/2026
 */

/**
 * Aliquota IVA standard per Paese UE. Copia della tabella nel server
 * (EU_STANDARD_VAT_RATE). Verificata al 31 luglio 2026 su fonti
 * incrociate (Tax Foundation, Commissione UE).
 *
 * Nota Estonia: le fonti divergono tra 22% e 24% dopo l'aumento di luglio
 * 2025 — qui è riportato il valore più recente (24%), da ri-verificare
 * appena un venditore estone entra davvero in attività. Le aliquote
 * cambiano nel tempo: questa tabella va ricontrollata periodicamente.
 */
export const EU_STANDARD_VAT_RATE: Record<string, number> = {
  IT: 0.22, AT: 0.20, BE: 0.21, BG: 0.20, HR: 0.25, CY: 0.19, CZ: 0.21,
  DK: 0.25, EE: 0.24, FI: 0.255, FR: 0.20, DE: 0.19, GR: 0.24, HU: 0.27,
  IE: 0.23, LV: 0.21, LT: 0.21, LU: 0.17, MT: 0.18, NL: 0.21, PL: 0.23,
  PT: 0.23, RO: 0.19, SK: 0.20, SI: 0.22, ES: 0.21, SE: 0.25,
};

export const DEFAULT_VAT_RATE_FALLBACK = 0.22;

export interface VatTreatment {
  rate: number;
  reverseCharge: boolean;
}

/**
 * Determina il trattamento IVA di una riga in base al Paese del venditore,
 * al Paese di destinazione e allo stato VIES di entrambe le parti.
 * Replica esatta della funzione omonima nel server — vedi l'avvertenza in
 * cima al file.
 *
 * - stesso Paese → IVA piena del Paese del venditore
 * - Paesi UE diversi, ENTRAMBE le parti verificate VIES → reverse charge 0%
 *   (cessione intracomunitaria, art. 41 DL 331/93)
 * - Paesi UE diversi ma VIES non verificato da almeno una parte → IVA piena
 *   del venditore (non si può presumere un'esenzione non verificabile)
 * - fuori UE → non imponibile (art. 8 DPR 633/72), 0%
 */
export function determineVatTreatment(
  vendorCountry: string,
  vendorViesValidated: boolean,
  buyerCountry: string,
  buyerViesValidated: boolean,
): VatTreatment {
  const vc = vendorCountry || 'IT';
  const bc = buyerCountry || 'IT';
  const domesticRate = EU_STANDARD_VAT_RATE[vc] ?? DEFAULT_VAT_RATE_FALLBACK;

  if (vc === bc) return { rate: domesticRate, reverseCharge: false };
  if (!PAESI_UE.includes(bc)) return { rate: 0, reverseCharge: false };
  if (vendorViesValidated && buyerViesValidated) return { rate: 0, reverseCharge: true };
  return { rate: domesticRate, reverseCharge: false };
}

/** Arrotonda a 2 decimali evitando gli errori di virgola mobile (0.1+0.2). */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * ⚠️ I PREZZI SU ORALZON SONO NETTI (IVA ESCLUSA).
 *
 * Oralzon è un marketplace esclusivamente B2B: ogni acquirente ha una
 * P.IVA (il checkout la impone lato server) e per lui l'IVA è partita di
 * giro, non un costo. Come ogni marketplace B2B serio, quindi, i prezzi
 * si espongono al netto e l'imposta si somma al checkout in base al Paese
 * di destinazione e al trattamento fiscale applicabile.
 *
 * Questa scelta non è solo di presentazione: è ciò che rende REALE il
 * vantaggio del reverse charge. Con i prezzi lordi il cliente pagava lo
 * stesso importo con o senza P.IVA verificata su VIES (cambiava solo come
 * si spaccava la fattura, e il beneficio finiva al venditore). Con i
 * prezzi netti, invece, la verifica VIES toglie davvero l'IVA dal totale
 * — ed è quello che l'avviso al checkout può quindi promettere onestamente.
 */
export function grossFromNet(net: number, rate: number): number {
  return round2(net * (1 + rate));
}

export function vatFromNet(net: number, rate: number): number {
  return round2(net * rate);
}

export interface VendorTaxInfo {
  fiscal_country: string | null;
  vies_validated: boolean | null;
}

export interface VatLineInput {
  vendorId: string;
  /** Imponibile della riga, già al netto di eventuali sconti. */
  net: number;
}

export interface VatBreakdown {
  /** Somma degli imponibili. */
  taxableAmount: number;
  /** IVA totale dovuta. */
  vatAmount: number;
  /** Imponibile + IVA: quanto il cliente paga davvero. */
  grandTotal: number;
  /** IVA che il cliente si risparmierebbe verificando la P.IVA su VIES. */
  potentialViesSaving: number;
  /** Almeno un venditore è in un altro Paese UE rispetto alla destinazione. */
  hasCrossBorderVendor: boolean;
  /**
   * Il risparmio VIES è bloccato perché è il VENDITORE a non essere
   * verificato: in quel caso non serve a nulla dire al cliente di
   * verificarsi, perché l'esenzione non scatterebbe comunque.
   */
  blockedByVendorVies: boolean;
  /** Dettaglio per aliquota, per il riepilogo in fattura. */
  byRate: Array<{ rate: number; taxable: number; vat: number; reverseCharge: boolean }>;
}

/**
 * Calcola il riepilogo IVA di un carrello multi-venditore.
 *
 * `potentialViesSaving` è il cuore dell'avviso al checkout: è l'IVA che
 * sparirebbe dal totale se il cliente verificasse la propria P.IVA su
 * VIES, considerando SOLO i venditori che sono a loro volta verificati
 * (sugli altri l'esenzione non spetterebbe comunque, e prometterla
 * sarebbe scorretto).
 */
export function computeCartVat(
  lines: VatLineInput[],
  vendorsById: Record<string, VendorTaxInfo>,
  buyerCountry: string,
  buyerViesValidated: boolean,
): VatBreakdown {
  const rateMap = new Map<string, { rate: number; taxable: number; vat: number; reverseCharge: boolean }>();
  let taxableAmount = 0;
  let vatAmount = 0;
  let potentialViesSaving = 0;
  let hasCrossBorderVendor = false;
  let blockedByVendorVies = false;

  for (const line of lines) {
    const vendor = vendorsById[line.vendorId];
    const vendorCountry = vendor?.fiscal_country || 'IT';
    const vendorVies = !!vendor?.vies_validated;

    const treatment = determineVatTreatment(vendorCountry, vendorVies, buyerCountry, buyerViesValidated);
    const lineVat = vatFromNet(line.net, treatment.rate);

    taxableAmount = round2(taxableAmount + line.net);
    vatAmount = round2(vatAmount + lineVat);

    const isCrossBorderEu =
      vendorCountry !== (buyerCountry || 'IT') && PAESI_UE.includes(buyerCountry || 'IT');

    if (isCrossBorderEu) {
      hasCrossBorderVendor = true;
      if (!buyerViesValidated) {
        if (vendorVies) {
          // Il venditore è pronto: manca solo la verifica del cliente.
          // Questa IVA è recuperabile con due clic — ed è esattamente la
          // cifra da mostrargli.
          potentialViesSaving = round2(potentialViesSaving + lineVat);
        } else {
          // Qui il tappo è il venditore, non il cliente: verificarsi non
          // sbloccherebbe nulla su questa riga.
          blockedByVendorVies = true;
        }
      }
    }

    const key = `${treatment.rate}|${treatment.reverseCharge}`;
    const existing = rateMap.get(key);
    if (existing) {
      existing.taxable = round2(existing.taxable + line.net);
      existing.vat = round2(existing.vat + lineVat);
    } else {
      rateMap.set(key, {
        rate: treatment.rate,
        taxable: line.net,
        vat: lineVat,
        reverseCharge: treatment.reverseCharge,
      });
    }
  }

  return {
    taxableAmount,
    vatAmount,
    grandTotal: round2(taxableAmount + vatAmount),
    potentialViesSaving,
    hasCrossBorderVendor,
    blockedByVendorVies,
    byRate: Array.from(rateMap.values()).sort((a, b) => b.rate - a.rate),
  };
}
