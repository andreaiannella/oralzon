import { useState, useRef } from 'react';
import { Upload, Download, CheckCircle, AlertCircle, Loader2, FileSpreadsheet, X, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { supabase } from '../../../lib/supabase';
import { getCurrentVendor, canAddProduct } from '../../../lib/vendor';

const CATEGORIES = [
  'Monouso','Sterilizzazione','Strumenti Odontoiatrici','Implantologia',
  'Ortodonzia','Endodonzia','Materiali da Impronta','Protesica',
  'Radiologia','Arredi Studio','Disinfezione','Consumabili','Igiene Orale Professionale'
];

const REQUIRED_COLS = ['Nome Prodotto','Descrizione','Categoria','Prezzo (€)','Quantità in Magazzino'];
const OPTIONAL_COLS = ['Brand','Codice SKU','Specifiche Tecniche','Stato (pubblicato/bozza)'];
const ALL_COLS = [...REQUIRED_COLS, ...OPTIONAL_COLS];

interface ParsedRow {
  row: number;
  data: Record<string, string>;
  errors: string[];
  valid: boolean;
}

export function VendorImportExcel() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [parsed, setParsed] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ ok: number; failed: number; skippedForLimit?: number } | null>(null);
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload');

  const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
      ALL_COLS,
      ['Guanti in Nitrile Taglia M', 'Guanti in nitrile monouso, ipoallergenici, ideali per uso clinico quotidiano.', 'Monouso', '19.99', '100', 'SafeMed', 'GNM-001', 'Taglia M, 100 pz/scatola, materiale nitrile', 'pubblicato'],
      ['Kit Sterilizzazione Base', 'Kit completo per sterilizzazione strumenti con buste per autoclave incluse.', 'Sterilizzazione', '89.50', '20', 'SterilPro', 'KSB-002', 'Include 200 buste, testato EN ISO 11607', 'pubblicato'],
    ]);
    ws['!cols'] = ALL_COLS.map(() => ({ wch: 22 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prodotti');
    XLSX.writeFile(wb, 'Oralzon_Template_Prodotti.xlsx');
  };

  const parseFile = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      alert('Formato non supportato. Usa .xlsx, .xls o .csv'); return;
    }
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target?.result, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (rows.length < 2) { alert('Il file deve avere almeno una riga dati oltre all\'intestazione'); return; }

        const header = (rows[0] as string[]).map(h => String(h).trim());
        const results: ParsedRow[] = [];

        for (let i = 1; i < rows.length; i++) {
          const row = rows[i] as string[];
          const data: Record<string, string> = {};
          header.forEach((col, ci) => { data[col] = String(row[ci] || '').trim(); });

          const errors: string[] = [];
          if (!data['Nome Prodotto']) errors.push('Nome Prodotto mancante');
          if (!data['Descrizione']) errors.push('Descrizione mancante');
          if (!data['Categoria']) errors.push('Categoria mancante');
          else if (!CATEGORIES.includes(data['Categoria'])) errors.push(`Categoria non valida: "${data['Categoria']}"`);
          if (!data['Prezzo (€)']) errors.push('Prezzo mancante');
          else if (isNaN(parseFloat(data['Prezzo (€)']))) errors.push('Prezzo non valido');
          if (!data['Quantità in Magazzino']) errors.push('Quantità mancante');
          else if (isNaN(parseInt(data['Quantità in Magazzino']))) errors.push('Quantità non valida');

          if (Object.keys(data).every(k => !data[k])) continue; // skip empty rows
          results.push({ row: i + 1, data, errors, valid: errors.length === 0 });
        }

        setParsed(results);
        setStep('preview');
      } catch (err) {
        alert('Errore nella lettura del file. Verifica il formato.');
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleImport = async () => {
    const validRows = parsed.filter(r => r.valid);
    if (!validRows.length) return;
    setImporting(true);

    try {
      const vendor = await getCurrentVendor();
      if (!vendor) throw new Error('Non sei autorizzato come venditore');

      // Stesso limite di piano già applicato all'aggiunta manuale di un
      // prodotto — senza questo controllo un venditore in prova potrebbe
      // caricare centinaia di prodotti in un colpo solo tramite Excel,
      // aggirando completamente il limite previsto dal suo piano.
      const limitCheck = await canAddProduct();
      if (!limitCheck.canAdd && limitCheck.currentCount >= limitCheck.limit) {
        throw new Error(limitCheck.reason || `Hai raggiunto il limite di ${limitCheck.limit} prodotti del tuo piano — non è possibile importarne altri.`);
      }
      const remainingSlots = Math.max(0, limitCheck.limit - limitCheck.currentCount);
      const rowsToImport = validRows.slice(0, remainingSlots);
      const skippedForLimit = validRows.length - rowsToImport.length;
      if (rowsToImport.length === 0) {
        throw new Error(`Hai raggiunto il limite di ${limitCheck.limit} prodotti del tuo piano — non è possibile importarne altri.`);
      }

      let ok = 0; let failed = 0;
      const batchSize = 10;

      for (let i = 0; i < rowsToImport.length; i += batchSize) {
        const batch = rowsToImport.slice(i, i + batchSize).map(r => ({
          vendor_id: vendor.id,
          name: r.data['Nome Prodotto'],
          description: r.data['Descrizione'],
          category: r.data['Categoria'],
          price: parseFloat(r.data['Prezzo (€)']),
          stock: parseInt(r.data['Quantità in Magazzino']),
          brand: r.data['Brand'] || null,
          sku: r.data['Codice SKU'] || null,
          specifications: r.data['Specifiche Tecniche'] || null,
          status: (r.data['Stato (pubblicato/bozza)'] || 'pubblicato').toLowerCase() === 'bozza' ? 'draft' : 'published',
          images: [],
          is_sponsored: false,
        }));

        const { error } = await supabase.from('products').insert(batch);
        if (error) { failed += batch.length; } else { ok += batch.length; }
      }

      setImportResult({ ok, failed, skippedForLimit });
      setStep('done');
    } catch (err: any) {
      alert('Errore: ' + err.message);
    } finally {
      setImporting(false);
    }
  };

  const reset = () => { setParsed([]); setFileName(''); setStep('upload'); setImportResult(null); };

  const valid = parsed.filter(r => r.valid).length;
  const invalid = parsed.filter(r => !r.valid).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to="/venditore/prodotti" className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Massivo Excel</h1>
          <p className="text-gray-500 text-sm">Carica più prodotti contemporaneamente con un file Excel</p>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-5">
          {/* Template download */}
          <div className="bg-accent border border-oralzon-mint-fresh/30 rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="font-medium text-oralzon-steel-ink">Prima di iniziare, scarica il template</p>
              <p className="text-sm text-primary mt-1">Il file Excel deve seguire esattamente la struttura del template</p>
            </div>
            <button onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary whitespace-nowrap">
              <Download className="w-4 h-4" /> Scarica Template
            </button>
          </div>

          {/* Colonne richieste */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-sm mb-3">Struttura del file</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-red-600 mb-2">Colonne obbligatorie</p>
                <div className="space-y-1">
                  {REQUIRED_COLS.map(c => (
                    <div key={c} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded">{c}</code>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Colonne opzionali</p>
                <div className="space-y-1">
                  {OPTIONAL_COLS.map(c => (
                    <div key={c} className="flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 bg-gray-300 rounded-full"></span>
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded">{c}</code>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-medium text-amber-700">Nota immagini</p>
              <p className="text-xs text-amber-600 mt-0.5">Le immagini non possono essere caricate via Excel. Dopo l'import, vai su ogni prodotto e carica le foto dalla pagina di modifica.</p>
            </div>
            <p className="text-xs text-gray-500 font-medium mb-1 mt-3">Categorie valide:</p>
              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map(c => <span key={c} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{c}</span>)}
              </div>
            </div>
          </div>

          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors ${dragging ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-primary hover:bg-gray-50'}`}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) parseFile(f); }}
            onClick={() => inputRef.current?.click()}>
            <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) parseFile(f); }} />
            <FileSpreadsheet className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-base font-medium text-gray-700">Trascina il file Excel o clicca per selezionarlo</p>
            <p className="text-sm text-gray-400 mt-1">Supporta .xlsx, .xls, .csv</p>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm">{fileName}</span>
            </div>
            <button onClick={reset} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
              <X className="w-4 h-4" /> Cambia file
            </button>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{parsed.length}</p>
              <p className="text-sm text-gray-500">Righe totali</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-700">{valid}</p>
              <p className="text-sm text-green-600">Pronte per l'import</p>
            </div>
            <div className={`${invalid > 0 ? 'bg-red-50' : 'bg-gray-50'} rounded-xl p-4 text-center`}>
              <p className={`text-2xl font-bold ${invalid > 0 ? 'text-red-600' : 'text-gray-400'}`}>{invalid}</p>
              <p className={`text-sm ${invalid > 0 ? 'text-red-500' : 'text-gray-400'}`}>Con errori</p>
            </div>
          </div>

          {/* Rows preview */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 w-12">Riga</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Nome Prodotto</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Categoria</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 w-20">Prezzo</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 w-8">Stato</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map(r => (
                    <tr key={r.row} className={`border-t border-gray-100 ${r.valid ? '' : 'bg-red-50'}`}>
                      <td className="px-4 py-2.5 text-gray-400 text-xs">{r.row}</td>
                      <td className="px-4 py-2.5 font-medium truncate max-w-xs">{r.data['Nome Prodotto'] || '—'}</td>
                      <td className="px-4 py-2.5 text-gray-500 text-xs">{r.data['Categoria'] || '—'}</td>
                      <td className="px-4 py-2.5">€{r.data['Prezzo'] || '—'}</td>
                      <td className="px-4 py-2.5">
                        {r.valid
                          ? <CheckCircle className="w-4 h-4 text-green-500" />
                          : <div title={r.errors.join(', ')}><AlertCircle className="w-4 h-4 text-red-500" /></div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Errors list */}
          {invalid > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="font-medium text-red-800 text-sm mb-2">Errori trovati (queste righe non verranno importate):</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {parsed.filter(r => !r.valid).map(r => (
                  <p key={r.row} className="text-xs text-red-600">Riga {r.row}: {r.errors.join(' · ')}</p>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={handleImport} disabled={importing || valid === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 disabled:opacity-50">
              {importing ? <><Loader2 className="w-5 h-5 animate-spin" /> Importazione...</> : `Importa ${valid} prodotti`}
            </button>
            <button onClick={reset} className="px-6 py-3 border border-gray-300 rounded-xl text-sm">Annulla</button>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 'done' && importResult && (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Import completato!</h2>
          <div className="flex justify-center gap-8 my-6">
            <div><p className="text-3xl font-bold text-green-600">{importResult.ok}</p><p className="text-gray-500 text-sm">Prodotti importati</p></div>
            {importResult.failed > 0 && <div><p className="text-3xl font-bold text-red-500">{importResult.failed}</p><p className="text-gray-500 text-sm">Falliti</p></div>}
            {!!importResult.skippedForLimit && (
              <div><p className="text-3xl font-bold text-amber-500">{importResult.skippedForLimit}</p><p className="text-gray-500 text-sm">Non importati — limite piano raggiunto</p></div>
            )}
          </div>
          <div className="flex justify-center gap-3">
            <Link to="/venditore/prodotti" className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90">
              Vedi i Prodotti
            </Link>
            <button onClick={reset} className="px-6 py-3 border border-gray-300 rounded-xl text-sm">
              Nuovo Import
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
