import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BadgeCheck, TrendingDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatMoney } from '../../lib/money';

// ── Confronto prezzi fra venditori ──────────────────────────────────────
//
// E' il motivo per cui esiste la classificazione dei prodotti. Finché i
// prodotti erano nomi liberi, gli stessi guanti caricati da tre fornitori
// erano tre articoli scollegati: il cliente non aveva modo di accorgersi di
// star pagando il 30% in più. Qui il collegamento diventa visibile.
//
// IL PREZZO UNITARIO È IL CUORE. Una scatola da 100 a 7,50 € e una da 200 a
// 14,00 € sembrano incomparabili, ma sono 7,5 centesimi contro 7 centesimi
// al pezzo. Senza quel calcolo un dentista di fretta sceglie la prima
// perché "costa meno" — ed è il conto che chi compra per uno studio rifà a
// mano ogni volta. Una piattaforma seria lo fa al posto suo.
//
// SI MOSTRA ANCHE QUANDO NON CONVIENE. Nascondere le alternative più care
// renderebbe il confronto una vetrina promozionale, e la prima volta che il
// cliente se ne accorgesse perderebbe fiducia in tutto il resto. Il
// risparmio viene evidenziato solo quando esiste davvero.

interface Alternativa {
  id: string;
  name: string;
  vendor: string;
  vendor_id: string;
  verificato: boolean;
  prezzo: number;
  pezzi: number | null;
  prezzo_unitario: number | null;
  disponibile: boolean;
  immagine: string | null;
}

interface Props {
  productId: string;
  prezzoCorrente: number;
  pezziCorrenti: number | null;
}

export function ConfrontoVenditori({ productId, prezzoCorrente, pezziCorrenti }: Props) {
  const { t, i18n } = useTranslation();
  const [alternative, setAlternative] = useState<Alternativa[]>([]);
  const [caricato, setCaricato] = useState(false);

  useEffect(() => {
    let annullato = false;
    supabase.rpc('product_alternatives', { p_product_id: productId, p_lang: i18n.language?.split('-')[0] || 'it' })
      .then(({ data }) => {
        if (annullato) return;
        setAlternative((data as Alternativa[]) || []);
        setCaricato(true);
      });
    return () => { annullato = true; };
  }, [productId, i18n.language]);

  if (!caricato || alternative.length === 0) return null;

  const unitarioCorrente = pezziCorrenti && pezziCorrenti > 0 ? prezzoCorrente / pezziCorrenti : null;

  // Il migliore è quello col prezzo unitario più basso; se le quantità non
  // sono note si ripiega sul prezzo pieno, che è l'unico confronto onesto
  // possibile in quel caso.
  const migliore = alternative.find(a => a.disponibile) || null;
  const risparmio = (migliore && unitarioCorrente && migliore.prezzo_unitario)
    ? unitarioCorrente - migliore.prezzo_unitario
    : null;

  return (
    <div className="mt-8 rounded-xl border border-border bg-white p-5">
      <div className="flex items-center gap-2 mb-1">
        <TrendingDown className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-lg">{t('compare.title')}</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-4">{t('compare.subtitle')}</p>

      {risparmio !== null && risparmio > 0 && (
        <div className="mb-4 rounded-lg bg-[#EAFBF6] border border-[#2FBFA0] px-4 py-3 text-sm text-[#1E2E31]">
          {t('compare.savingNote', {
            importo: formatMoney(risparmio * (pezziCorrenti || 1), i18n.language),
            venditore: migliore?.vendor,
          })}
        </div>
      )}

      <div className="divide-y divide-border">
        {alternative.map(a => (
          <div key={a.id} className="py-3 flex items-center gap-3">
            {a.immagine
              ? <img src={a.immagine} alt="" className="w-12 h-12 rounded object-contain bg-gray-50 border border-gray-100 flex-shrink-0" />
              : <div className="w-12 h-12 rounded bg-gray-50 border border-gray-100 flex-shrink-0" />}

            <div className="min-w-0 flex-1">
              <Link to={`/prodotto/${a.id}`} className="text-sm font-medium hover:text-primary line-clamp-1">
                {a.name}
              </Link>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Link to={`/negozio/venditore/${a.vendor_id}`} className="hover:text-primary">{a.vendor}</Link>
                {a.verificato && <BadgeCheck className="w-3.5 h-3.5 text-primary" />}
                {!a.disponibile && <span className="text-red-500">· {t('compare.outOfStock')}</span>}
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <p className="font-bold">{formatMoney(a.prezzo, i18n.language)}</p>
              {a.prezzo_unitario !== null && (
                <p className="text-xs text-muted-foreground">
                  {formatMoney(a.prezzo_unitario, i18n.language)} {t('compare.perPiece')}
                  {a.pezzi ? ` · ${a.pezzi} ${t('compare.pieces')}` : ''}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
