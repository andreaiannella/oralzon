import { useState, useEffect } from 'react';
import { FileText, Download, Loader2, TrendingUp, Euro, ShoppingBag, Package, Printer } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { getCurrentVendor } from '../../../lib/vendor';

interface SalesRow {
  periodo: string;
  num_ordini: number;
  num_items: number;
  fatturato: number;
}

export function VendorFiscale() {
  const [vendor, setVendor] = useState<any>(null);
  const [rows, setRows] = useState<SalesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => { load(); }, [selectedYear]);

  const load = async () => {
    setLoading(true);
    try {
      const v = await getCurrentVendor();
      setVendor(v);
      if (!v) return;

      // Riepilogo mensile
      const { data: summary } = await supabase
        .from('vendor_fiscal_summary')
        .select('*')
        .eq('vendor_id', v.id)
        .order('periodo', { ascending: false });

      const filtered = (summary || []).filter((r: any) =>
        new Date(r.periodo).getFullYear() === selectedYear
      );
      setRows(filtered as any);
    } finally {
      setLoading(false);
    }
  };

  const totals = rows.reduce((acc, r) => ({
    fatturato: acc.fatturato + Number(r.fatturato || 0),
    ordini: acc.ordini + Number(r.num_ordini || 0),
    items: acc.items + Number(r.num_items || 0),
  }), { fatturato: 0, ordini: 0, items: 0 });

  const avgOrderValue = totals.ordini > 0 ? totals.fatturato / totals.ordini : 0;
  const avgItemsPerOrder = totals.ordini > 0 ? totals.items / totals.ordini : 0;

  const monthName = (iso: string) =>
    new Date(iso).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  const printReport = () => {
    const content = document.getElementById('fiscal-report');
    if (!content) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>Report Vendite ${selectedYear}</title>
      <style>body{font-family:Arial,sans-serif;font-size:12px;padding:20px}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      th,td{border:1px solid #ddd;padding:8px;text-align:left}
      th{background:#f3f4f6;font-weight:600}
      .text-right{text-align:right}.total{background:#eafbf6;font-weight:700}
      h1{color:#0F7A68}h2{margin-top:24px;border-bottom:2px solid #e5e7eb;padding-bottom:8px}</style>
    </head><body>${content.innerHTML}</body></html>`);
    w.document.close();
    w.print();
  };

  const downloadCSV = () => {
    const headers = ['Periodo', 'Ordini', 'Articoli venduti', 'Fatturato'];
    const csvRows = rows.map(r => [
      monthName(r.periodo),
      r.num_ordini,
      r.num_items,
      Number(r.fatturato).toFixed(2),
    ]);
    csvRows.push(['TOTALE', totals.ordini, totals.items, totals.fatturato.toFixed(2)]);
    const csv = [headers, ...csvRows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `Oralzon_Report_Vendite_${selectedYear}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const years = [2024, 2025, 2026, 2027].filter(y => y <= new Date().getFullYear() + 1);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Report Vendite</h1>
          <p className="text-gray-600 mt-1">Riepilogo vendite per {vendor?.business_name}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary">
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
            <Download className="w-4 h-4" /> CSV
          </button>
          <button onClick={printReport} className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-semibold hover:bg-gray-800">
            <Printer className="w-4 h-4" /> Stampa
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Fatturato', value: `€${totals.fatturato.toFixed(2)}`, icon: Euro, color: 'bg-green-50 text-green-700 border-green-200' },
          { label: 'Ordini totali', value: totals.ordini, icon: ShoppingBag, color: 'bg-accent text-primary border-oralzon-mint-fresh/30' },
          { label: 'Scontrino medio', value: `€${avgOrderValue.toFixed(2)}`, icon: TrendingUp, color: 'bg-accent text-primary border-oralzon-mint-fresh/30' },
          { label: 'Articoli medi per ordine', value: avgItemsPerOrder.toFixed(1), icon: Package, color: 'bg-accent text-primary border-oralzon-mint-fresh/30' },
        ].map(k => (
          <div key={k.label} className={`rounded-xl border p-4 ${k.color}`}>
            <div className="flex items-center gap-2 mb-1">
              <k.icon className="w-4 h-4" />
              <p className="text-xs font-medium opacity-80">{k.label}</p>
            </div>
            <p className="text-2xl font-black">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="bg-accent border border-oralzon-mint-fresh/30 rounded-xl p-4 text-sm text-oralzon-steel-ink flex gap-3">
        <FileText className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">Note</p>
          <p>I valori mostrati sono calcolati su tutti gli ordini. Questo report è indicativo — consulta il tuo commercialista per la dichiarazione fiscale ufficiale.</p>
        </div>
      </div>

      <div id="fiscal-report">
        <div className="mb-4 hidden">
          <h1>Report Vendite {selectedYear} — {vendor?.business_name}</h1>
          <p>Generato il {new Date().toLocaleDateString('it-IT')} da Oralzon Marketplace</p>
        </div>

        {rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 text-center py-12">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Nessun dato per il {selectedYear}</p>
            <p className="text-gray-400 text-sm mt-1">I dati appariranno quando avrai ordini completati</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Periodo', 'Ordini', 'Articoli venduti', 'Fatturato'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900 capitalize">{monthName(r.periodo)}</td>
                    <td className="px-4 py-3 text-gray-600">{r.num_ordini}</td>
                    <td className="px-4 py-3 text-gray-600">{r.num_items}</td>
                    <td className="px-4 py-3 font-bold text-green-700">€{Number(r.fatturato).toFixed(2)}</td>
                  </tr>
                ))}
                {/* Totale */}
                <tr className="bg-accent font-bold border-t-2 border-oralzon-mint-fresh/30">
                  <td className="px-4 py-3 text-oralzon-steel-ink">TOTALE {selectedYear}</td>
                  <td className="px-4 py-3 text-oralzon-steel-ink">{totals.ordini}</td>
                  <td className="px-4 py-3 text-oralzon-steel-ink">{totals.items}</td>
                  <td className="px-4 py-3 text-green-800 text-base">€{totals.fatturato.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
