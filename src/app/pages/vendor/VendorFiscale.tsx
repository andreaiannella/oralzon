import { useState, useEffect } from 'react';
import { FileText, Download, Loader2, TrendingUp, Euro, ShoppingBag, Package, Printer, Receipt, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../../lib/supabase';
import { getCurrentVendor } from '../../../lib/vendor';
import { callEdge } from '../../../lib/edgeApi';

// Formattazione date coerente con la lingua selezionata, non sempre it-IT.
const DATE_LOCALE: Record<string, string> = { it: 'it-IT', en: 'en-GB', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-PT', nl: 'nl-NL', pl: 'pl-PL' };

interface SalesRow {
  periodo: string;
  num_ordini: number;
  num_items: number;
  fatturato: number;
}

interface FiscalOrderItem {
  name: string;
  quantity: number;
  unitPrice: number;
  net: number;
  vat: number;
  vatRate: number;
  reverseCharge: boolean;
}

interface FiscalOrder {
  orderId: string;
  orderNumber: string;
  date: string;
  status: string;
  customerName: string;
  customerVat: string | null;
  customerCodiceFiscale: string | null;
  customerPec: string | null;
  customerCodiceSdi: string | null;
  customerAddress: any;
  taxNeedsReview: boolean;
  taxReviewNote: string | null;
  items: FiscalOrderItem[];
  netTotal: number;
  vatTotal: number;
  grossTotal: number;
}

export function VendorFiscale() {
  const { t, i18n } = useTranslation();
  const dateLocale = DATE_LOCALE[i18n.language] || 'en-GB';
  const [vendor, setVendor] = useState<any>(null);
  const [rows, setRows] = useState<SalesRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<'mensile' | 'fatturazione'>('mensile');
  const [fiscalOrders, setFiscalOrders] = useState<FiscalOrder[]>([]);
  const [fiscalLoading, setFiscalLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => { load(); }, [selectedYear]);
  useEffect(() => { if (activeTab === 'fatturazione' && fiscalOrders.length === 0) loadFiscalSummary(); }, [activeTab]);

  const loadFiscalSummary = async () => {
    setFiscalLoading(true);
    try {
      const result = await callEdge('/vendor/fiscal-summary', { method: 'GET' });
      if (result.success) setFiscalOrders(result.orders || []);
    } finally {
      setFiscalLoading(false);
    }
  };

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
    new Date(iso).toLocaleDateString(dateLocale, { month: 'long', year: 'numeric' });

  const printReport = () => {
    const content = document.getElementById('fiscal-report');
    if (!content) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<html><head><title>${t('vendor.printReportTitle', { year: selectedYear })}</title>
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
    const headers = [t('vendor.periodColumn'), t('vendor.ordersColumn'), t('vendor.itemsSoldColumn'), t('vendor.revenueColumn')];
    const csvRows = rows.map(r => [
      monthName(r.periodo),
      r.num_ordini,
      r.num_items,
      Number(r.fatturato).toFixed(2),
    ]);
    csvRows.push([t('vendor.totalRow', { year: '' }).trim(), totals.ordini, totals.items, totals.fatturato.toFixed(2)]);
    const csv = [headers, ...csvRows].map(r => r.join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `Oralzon_Report_Vendite_${selectedYear}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const years = [2024, 2025, 2026, 2027].filter(y => y <= new Date().getFullYear() + 1);

  // Un rigo per ogni prodotto di ogni ordine — è il livello di dettaglio che
  // serve davvero per compilare una fattura, non un aggregato mensile.
  const downloadFiscalCSV = () => {
    const headers = [t('vendor.orderColumnCsv'), t('vendor.dateColumn'), t('vendor.customerColumn'), `${t('vendor.vatAbbreviation')} ${t('common.clientBadge')}`, t('vendor.tableProduct'), t('cart.quantity'), t('vendor.unitPriceColumn'), t('vendor.taxableColumn'), `${t('vendor.rateColumn')} ${t('vendor.vatColumn')}`, t('vendor.vatColumn'), t('vendor.reverseChargeColumn'), t('vendor.toReviewColumn')];
    const csvRows: (string | number)[][] = [];
    fiscalOrders.forEach(o => {
      o.items.forEach(it => {
        csvRows.push([
          o.orderNumber, new Date(o.date).toLocaleDateString(dateLocale), o.customerName, o.customerVat || '',
          it.name, it.quantity, it.unitPrice.toFixed(2), it.net.toFixed(2),
          `${(it.vatRate * 100).toFixed(1)}%`, it.vat.toFixed(2),
          it.reverseCharge ? t('vendor.yesLabel') : t('vendor.noLabel'), o.taxNeedsReview ? t('vendor.yesLabel') : '',
        ]);
      });
    });
    const csv = [headers, ...csvRows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `Oralzon_Dati_Fatturazione_${vendor?.business_name || 'venditore'}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('vendor.salesReport')}</h1>
          <p className="text-gray-600 mt-1">{t('vendor.salesSummaryFor', { name: vendor?.business_name })}</p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button onClick={() => setActiveTab('mensile')}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${activeTab === 'mensile' ? 'bg-white text-oralzon-steel-ink shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          {t('vendor.monthlySummaryTab')}
        </button>
        <button onClick={() => setActiveTab('fatturazione')}
          className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center gap-1.5 ${activeTab === 'fatturazione' ? 'bg-white text-oralzon-steel-ink shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Receipt className="w-4 h-4" /> {t('vendor.billingDataTab')}
        </button>
      </div>

      {activeTab === 'mensile' && (
        <>
          <div className="flex justify-end gap-2 flex-wrap">
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button onClick={downloadCSV} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700">
              <Download className="w-4 h-4" /> {t('vendor.csvBtn')}
            </button>
            <button onClick={printReport} className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg text-sm font-semibold hover:bg-gray-800">
              <Printer className="w-4 h-4" /> {t('vendor.printBtn')}
            </button>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: t('vendor.kpiRevenue'), value: `€${totals.fatturato.toFixed(2)}`, icon: Euro, color: 'bg-green-50 text-green-700 border-green-200' },
              { label: t('vendor.kpiTotalOrders'), value: totals.ordini, icon: ShoppingBag, color: 'bg-accent text-primary border-oralzon-mint-fresh/30' },
              { label: t('vendor.kpiAvgOrderValue'), value: `€${avgOrderValue.toFixed(2)}`, icon: TrendingUp, color: 'bg-accent text-primary border-oralzon-mint-fresh/30' },
              { label: t('vendor.kpiAvgItemsPerOrder'), value: avgItemsPerOrder.toFixed(1), icon: Package, color: 'bg-accent text-primary border-oralzon-mint-fresh/30' },
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
              <p className="font-semibold mb-1">{t('vendor.notesTitle')}</p>
              <p>{t('vendor.notesText')}</p>
            </div>
          </div>

          <div id="fiscal-report">
            <div className="mb-4 hidden">
              <h1>{t('vendor.printReportTitle', { year: selectedYear })} — {vendor?.business_name}</h1>
              <p>{t('vendor.generatedOn', { date: new Date().toLocaleDateString(dateLocale) })}</p>
            </div>

            {rows.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 text-center py-12">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">{t('vendor.noDataForYear', { year: selectedYear })}</p>
                <p className="text-gray-400 text-sm mt-1">{t('vendor.dataWillAppear')}</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {[t('vendor.periodColumn'), t('vendor.ordersColumn'), t('vendor.itemsSoldColumn'), t('vendor.revenueColumn')].map(h => (
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
                      <td className="px-4 py-3 text-oralzon-steel-ink">{t('vendor.totalRow', { year: selectedYear })}</td>
                      <td className="px-4 py-3 text-oralzon-steel-ink">{totals.ordini}</td>
                      <td className="px-4 py-3 text-oralzon-steel-ink">{totals.items}</td>
                      <td className="px-4 py-3 text-green-800 text-base">€{totals.fatturato.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'fatturazione' && (
        <>
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div className="bg-accent border border-oralzon-mint-fresh/30 rounded-xl p-4 text-sm text-oralzon-steel-ink flex gap-3 flex-1 min-w-[280px]">
              <Receipt className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">{t('vendor.billingDataInfoTitle')}</p>
                <p>{t('vendor.billingDataInfoText')}</p>
              </div>
            </div>
            <button onClick={downloadFiscalCSV} disabled={fiscalOrders.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed h-fit">
              <Download className="w-4 h-4" /> {t('vendor.exportCsvBtn')}
            </button>
          </div>

          {fiscalLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : fiscalOrders.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 text-center py-12">
              <Receipt className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">{t('vendor.noPaidOrdersYet')}</p>
              <p className="text-gray-400 text-sm mt-1">{t('vendor.dataWillAppearHere')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {fiscalOrders.map(o => (
                <div key={o.orderId} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <button onClick={() => setExpandedOrder(expandedOrder === o.orderId ? null : o.orderId)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors text-left">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-gray-900">{o.orderNumber}</span>
                      <span className="text-xs text-gray-500">{new Date(o.date).toLocaleDateString(dateLocale)}</span>
                      <span className="text-sm text-gray-600">{o.customerName}</span>
                      {o.customerVat && <span className="text-xs text-gray-400 font-mono">{t('vendor.vatAbbreviation')} {o.customerVat}</span>}
                      {o.taxNeedsReview && (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                          <AlertTriangle className="w-3 h-3" /> {t('vendor.needsReview')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">€{o.grossTotal.toFixed(2)}</span>
                      {expandedOrder === o.orderId ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </div>
                  </button>
                  {expandedOrder === o.orderId && (
                    <div className="border-t border-gray-100 px-4 py-3">
                      {o.taxNeedsReview && o.taxReviewNote && (
                        <div className="mb-3 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{o.taxReviewNote}</span>
                        </div>
                      )}
                      <table className="w-full text-xs mb-3">
                        <thead>
                          <tr className="text-gray-400 uppercase tracking-wide">
                            <th className="text-left py-1.5">{t('vendor.tableProduct')}</th>
                            <th className="text-right py-1.5">{t('cart.quantity')}</th>
                            <th className="text-right py-1.5">{t('vendor.taxableColumn')}</th>
                            <th className="text-right py-1.5">{t('vendor.rateColumn')}</th>
                            <th className="text-right py-1.5">{t('vendor.vatColumn')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {o.items.map((it, i) => (
                            <tr key={i} className="border-t border-gray-50">
                              <td className="py-1.5 text-gray-700">{it.name}</td>
                              <td className="py-1.5 text-right text-gray-500">×{it.quantity}</td>
                              <td className="py-1.5 text-right text-gray-700">€{it.net.toFixed(2)}</td>
                              <td className="py-1.5 text-right text-gray-500">{it.reverseCharge ? t('vendor.reverseChargeColumn') : `${(it.vatRate * 100).toFixed(0)}%`}</td>
                              <td className="py-1.5 text-right text-gray-700">€{it.vat.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="flex justify-end gap-6 text-sm border-t border-gray-100 pt-2">
                        <span className="text-gray-500">{t('vendor.taxableLabel')}: <strong className="text-gray-800">€{o.netTotal.toFixed(2)}</strong></span>
                        <span className="text-gray-500">{t('vendor.vatLabel')}: <strong className="text-gray-800">€{o.vatTotal.toFixed(2)}</strong></span>
                        <span className="text-gray-500">{t('common.total')}: <strong className="text-gray-900">€{o.grossTotal.toFixed(2)}</strong></span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
