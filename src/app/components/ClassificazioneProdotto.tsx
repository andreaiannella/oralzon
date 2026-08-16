import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Pencil } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// ── Classificazione riconosciuta ────────────────────────────────────────
//
// COSA FA. Mentre il venditore scrive il nome, il sistema riconosce di che
// prodotto si tratta e ne estrae le caratteristiche. Questo componente
// mostra il risultato e permette di correggerlo — non chiede di compilarlo.
//
// PERCHE' COSI' E NON UN MODULO DA RIEMPIRE. La prima versione chiedeva al
// venditore di scegliere il tipo e compilare gli attributi PRIMA di poter
// caricare. Con pochi tipi definiti su centinaia di prodotti reali il
// risultato era un modulo che blocca: chi vende qualcosa non previsto si
// ferma, e chi vende qualcosa previsto deve comunque ricompilare a mano
// informazioni che ha appena scritto nel nome.
//
// La classificazione serve al CLIENTE — per filtrare per taglia e materiale
// e per confrontare lo stesso articolo fra venditori — non al venditore
// come adempimento. Quindi la facciamo noi, e la mostriamo solo perché
// possa correggerla se abbiamo capito male.
//
// Se il prodotto non viene riconosciuto il riquadro non compare affatto:
// nessun messaggio di errore, nessun campo in più. Semplicemente quel
// prodotto non avrà i filtri, esattamente come oggi.

interface ValoreAttributo { key: string; etichetta: string }
interface Attributo {
  key: string;
  etichetta: string;
  tipo_input: 'opzione' | 'numero' | 'testo';
  unita: string | null;
  valori: ValoreAttributo[];
}
interface TipoProdotto { id: string; key: string; nome: string; attributi: Attributo[] }

interface Props {
  nome: string;
  categoria: string;
  typeId: string | null;
  attributi: Record<string, any>;
  onChange: (typeId: string | null, attributi: Record<string, any>) => void;
}

export function ClassificazioneProdotto({ nome, categoria, typeId, attributi, onChange }: Props) {
  const { t, i18n } = useTranslation();
  const [tipi, setTipi] = useState<TipoProdotto[]>([]);
  const [riconosciuto, setRiconosciuto] = useState<{ id: string; nome: string } | null>(null);
  const [inModifica, setInModifica] = useState(false);
  const lingua = (i18n.language || 'it').split('-')[0];

  // Elenco dei tipi della categoria, per la correzione manuale.
  useEffect(() => {
    if (!categoria) { setTipi([]); return; }
    let annullato = false;
    supabase.rpc('taxonomy_for_category', { p_categoria: categoria, p_lang: lingua })
      .then(({ data }) => { if (!annullato) setTipi((data as TipoProdotto[]) || []); });
    return () => { annullato = true; };
  }, [categoria, lingua]);

  // Riconoscimento dal nome, con attesa per non interrogare a ogni tasto.
  useEffect(() => {
    if (!nome || nome.trim().length < 3) { setRiconosciuto(null); return; }
    let annullato = false;
    const timer = setTimeout(async () => {
      const { data, error } = await supabase.rpc('classify_name_preview', {
        p_nome: nome, p_lang: lingua,
      });
      if (annullato || error || !data) return;
      const r = data as any;
      if (r?.type_id) {
        setRiconosciuto({ id: r.type_id, nome: r.nome });
        // Si propaga solo se il venditore non ha gia' corretto a mano.
        if (!inModifica) onChange(r.type_id, r.attributi || {});
      } else {
        setRiconosciuto(null);
        if (!inModifica) onChange(null, {});
      }
    }, 500);
    return () => { annullato = true; clearTimeout(timer); };
  }, [nome, lingua, inModifica]);

  const tipoScelto = tipi.find(tp => tp.id === typeId) || null;

  // Nessun riconoscimento e nessuna correzione in corso: niente da mostrare.
  if (!riconosciuto && !inModifica && !typeId) {
    if (tipi.length === 0) return null;
    return (
      <button type="button" onClick={() => setInModifica(true)}
        className="text-sm text-[#0F7A68] underline underline-offset-2">
        {t('taxonomy.classifyManually')}
      </button>
    );
  }

  const impostaAttributo = (key: string, valore: any) => {
    const nuovi = { ...attributi };
    if (valore === '' || valore === null || valore === undefined) delete nuovi[key];
    else nuovi[key] = valore;
    onChange(typeId, nuovi);
  };

  return (
    <div className="rounded-xl border border-[#2FBFA0] bg-[#EAFBF6] p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <Check className="w-5 h-5 text-[#0F7A68] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-[#44585B]">{t('taxonomy.recognizedAs')}</p>
            <p className="font-semibold text-[#1E2E31]">
              {tipoScelto?.nome || riconosciuto?.nome}
            </p>
          </div>
        </div>
        {!inModifica && (
          <button type="button" onClick={() => setInModifica(true)}
            className="flex items-center gap-1 text-sm text-[#0F7A68] whitespace-nowrap">
            <Pencil className="w-3.5 h-3.5" /> {t('taxonomy.correct')}
          </button>
        )}
      </div>

      {inModifica && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('taxonomy.productType')}
          </label>
          <select
            value={typeId || ''}
            onChange={(e) => onChange(e.target.value || null, {})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm"
          >
            <option value="">{t('taxonomy.noneOfThese')}</option>
            {tipi.map(tp => <option key={tp.id} value={tp.id}>{tp.nome}</option>)}
          </select>
        </div>
      )}

      {/* Le caratteristiche compaiono gia' compilate con quanto dedotto dal
          nome. Restano modificabili, ma nel caso normale il venditore non
          deve toccare nulla. */}
      {tipoScelto && tipoScelto.attributi.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {tipoScelto.attributi.map(attr => (
            <div key={attr.key}>
              <label className="block text-xs text-gray-600 mb-1">
                {attr.etichetta}{attr.unita ? ` (${attr.unita})` : ''}
              </label>
              {attr.tipo_input === 'opzione' ? (
                <select
                  value={attributi[attr.key] ?? ''}
                  onChange={(e) => impostaAttributo(attr.key, e.target.value)}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md bg-white text-sm"
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
                  className="w-full px-2 py-1.5 border border-gray-300 rounded-md text-sm"
                />
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-[#44585B]">{t('taxonomy.whyNote')}</p>
    </div>
  );
}
