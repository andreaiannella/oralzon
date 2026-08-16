import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Info, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ── Scheda strutturata del prodotto ─────────────────────────────────────
//
// COSA FA. Al posto della casella "nome prodotto" il venditore sceglie un
// TIPO fra quelli previsti per la categoria e ne compila le
// caratteristiche. Il nome non lo scrive: viene composto dal database in
// tutte e 8 le lingue a partire da modelli di frase scritti nativamente
// per ciascuna.
//
// PERCHE'. Con il nome libero lo stesso prodotto diventa "Guanti nitrile L",
// "GUANTI IN NITRILE TAGLIA L 100PZ" e "Guanti monouso nitrile - L": per il
// sistema sono tre articoli scollegati. Non si possono filtrare per taglia,
// non si può confrontare il prezzo dello stesso articolo fra fornitori, e
// la ricerca dipende da come ciascuno ha battuto il testo. Con la scheda
// strutturata quei tre diventano lo stesso prodotto con lo stesso nome in
// ogni lingua.
//
// LA TASSONOMIA NON COPRE TUTTO, ED E' VOLUTO. Se per la categoria scelta
// non esistono tipi, il componente non compare e il venditore continua a
// scrivere il nome liberamente. Obbligare dove non c'è struttura
// significherebbe bloccare prodotti legittimi.

interface ValoreAttributo { key: string; etichetta: string }
interface Attributo {
  key: string;
  etichetta: string;
  tipo_input: 'opzione' | 'numero' | 'testo';
  unita: string | null;
  obbligatorio: boolean;
  valori: ValoreAttributo[];
}
interface TipoProdotto {
  id: string;
  key: string;
  nome: string;
  attributi: Attributo[];
}

interface Props {
  categoria: string;
  typeId: string | null;
  attributi: Record<string, any>;
  onChange: (typeId: string | null, attributi: Record<string, any>) => void;
  /** Chiamata quando il venditore segnala che il suo tipo non è in elenco. */
  onRichiediTipo?: () => void;
}

export function ProductTypePicker({ categoria, typeId, attributi, onChange, onRichiediTipo }: Props) {
  const { t, i18n } = useTranslation();
  const [tipi, setTipi] = useState<TipoProdotto[]>([]);
  const [caricamento, setCaricamento] = useState(false);
  const [anteprima, setAnteprima] = useState<Record<string, string> | null>(null);

  const lingua = (i18n.language || 'it').split('-')[0];

  useEffect(() => {
    if (!categoria) { setTipi([]); return; }
    let annullato = false;
    setCaricamento(true);
    supabase
      .rpc('taxonomy_for_category', { p_categoria: categoria, p_lang: lingua })
      .then(({ data, error }) => {
        if (annullato) return;
        if (error) {
          // Se la tassonomia non si carica il venditore non deve restare
          // bloccato: si torna al nome libero, che funziona sempre.
          console.error('Tassonomia non caricata:', error.message);
          setTipi([]);
        } else {
          setTipi((data as TipoProdotto[]) || []);
        }
        setCaricamento(false);
      });
    return () => { annullato = true; };
  }, [categoria, lingua]);

  const tipoScelto = tipi.find(t2 => t2.id === typeId) || null;

  // Anteprima del nome in tutte le lingue, ricalcolata a ogni modifica.
  // Usa la STESSA funzione che comporrà il nome al salvataggio: se fossero
  // due strade diverse, l'anteprima e il risultato divergerebbero.
  useEffect(() => {
    if (!typeId) { setAnteprima(null); return; }
    let annullato = false;
    const timer = setTimeout(() => {
      supabase.rpc('preview_product_name', { p_type_id: typeId, p_attributi: attributi })
        .then(({ data }) => { if (!annullato) setAnteprima((data as any) || null); });
    }, 250);
    return () => { annullato = true; clearTimeout(timer); };
  }, [typeId, JSON.stringify(attributi)]);

  if (!categoria) return null;
  if (caricamento) {
    return <p className="text-sm text-gray-500">{t('taxonomy.loading')}</p>;
  }
  // Categoria non ancora coperta: nessun ingombro, si usa il nome libero.
  if (tipi.length === 0) return null;

  const impostaAttributo = (key: string, valore: any) => {
    const nuovi = { ...attributi };
    if (valore === '' || valore === null || valore === undefined) delete nuovi[key];
    else nuovi[key] = valore;
    onChange(typeId, nuovi);
  };

  return (
    <div className="rounded-xl border border-[#2FBFA0] bg-[#EAFBF6] p-4 space-y-4">
      <div className="flex items-start gap-2">
        <Sparkles className="w-5 h-5 text-[#0F7A68] flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-[#1E2E31]">{t('taxonomy.title')}</h3>
          <p className="text-sm text-[#44585B] mt-0.5">{t('taxonomy.subtitle')}</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('taxonomy.productType')} <span className="text-red-500">*</span>
        </label>
        <select
          value={typeId || ''}
          onChange={(e) => onChange(e.target.value || null, {})}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-secondary"
        >
          <option value="">{t('taxonomy.selectType')}</option>
          {tipi.map(tp => <option key={tp.id} value={tp.id}>{tp.nome}</option>)}
        </select>
        {onRichiediTipo && (
          <button type="button" onClick={onRichiediTipo}
            className="mt-2 text-sm text-[#0F7A68] underline underline-offset-2">
            {t('taxonomy.typeNotListed')}
          </button>
        )}
      </div>

      {tipoScelto && tipoScelto.attributi.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tipoScelto.attributi.map(attr => (
            <div key={attr.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {attr.etichetta}
                {attr.unita ? <span className="text-gray-400"> ({attr.unita})</span> : null}
                {attr.obbligatorio && <span className="text-red-500"> *</span>}
              </label>

              {attr.tipo_input === 'opzione' ? (
                <select
                  value={attributi[attr.key] ?? ''}
                  onChange={(e) => impostaAttributo(attr.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
                >
                  <option value="">—</option>
                  {attr.valori.map(v => <option key={v.key} value={v.key}>{v.etichetta}</option>)}
                </select>
              ) : (
                <input
                  type={attr.tipo_input === 'numero' ? 'number' : 'text'}
                  value={attributi[attr.key] ?? ''}
                  onChange={(e) => impostaAttributo(
                    attr.key,
                    attr.tipo_input === 'numero'
                      ? (e.target.value === '' ? '' : Number(e.target.value))
                      : e.target.value,
                  )}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* L'anteprima non è un vezzo: mostra al venditore che sta creando un
          prodotto in otto lingue, cosa che altrimenti non avrebbe modo di
          sapere — e rende evidente il vantaggio di compilare i campi. */}
      {anteprima && anteprima[lingua] && (
        <div className="rounded-lg bg-white border border-[#AAB8BA] p-3">
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">{t('taxonomy.previewLabel')}</p>
          <p className="font-semibold text-[#1E2E31]">{anteprima[lingua]}</p>
          <details className="mt-2">
            <summary className="text-xs text-[#0F7A68] cursor-pointer">{t('taxonomy.otherLanguages')}</summary>
            <ul className="mt-2 space-y-1">
              {Object.entries(anteprima)
                .filter(([l]) => l !== lingua)
                .map(([l, nome]) => (
                  <li key={l} className="text-sm text-[#44585B]">
                    <span className="uppercase text-xs text-gray-400 mr-2">{l}</span>{nome}
                  </li>
                ))}
            </ul>
          </details>
        </div>
      )}

      <div className="flex items-start gap-2 text-xs text-[#44585B]">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#0F7A68]" />
        <p>{t('taxonomy.whyNote')}</p>
      </div>
    </div>
  );
}
