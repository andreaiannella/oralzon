import { FileText } from 'lucide-react';
import { PAESI_COMUNI } from '../../constants/countries';

interface VendorInfo {
  id?: string;
  business_name: string;
  vat_id?: string | null;
  fiscal_country?: string | null;
  address_street?: string | null;
  address_city?: string | null;
  address_region?: string | null;
  address_postal_code?: string | null;
}

interface BuyerProfile {
  ragione_sociale?: string | null;
  partita_iva?: string | null;
  indirizzo_fatturazione_via?: string | null;
  indirizzo_fatturazione_citta?: string | null;
  indirizzo_fatturazione_provincia?: string | null;
  indirizzo_fatturazione_cap?: string | null;
  indirizzo_fatturazione_paese?: string | null;
}

interface Props {
  order: {
    order_number: string; created_at: string; total_amount: number; tax_amount?: number;
    shipping_name: string; shipping_email: string; shipping_address: any;
    stripe_session_id?: string;
  };
  items: { products: { name: string } | null; quantity: number; price: number }[];
  vendor: VendorInfo | null;
  buyerProfile?: BuyerProfile | null;
}

const paeseLabel = (code?: string | null) => PAESI_COMUNI.find(p => p.code === code)?.label || code || '';

// Genera la fattura per UN SOLO venditore (mai per l'intero ordine): un
// ordine Oralzon può contenere prodotti di più venditori diversi, e ognuno
// è legalmente un soggetto emittente distinto — un solo documento con "un"
// venditore per un ordine multi-venditore sarebbe semplicemente sbagliato.
// Oralzon non è mai il venditore: è la piattaforma attraverso cui la
// vendita è stata effettuata e il pagamento processato, un ruolo di
// intermediario che va indicato come tale, non spacciato per emittente.
export function InvoiceButton({ order, items, vendor, buyerProfile }: Props) {
  const generate = () => {
    const orderDate = new Date(order.created_at).toLocaleDateString('it-IT');
    const shipAddr = order.shipping_address || {};
    const vendorName = vendor?.business_name || 'Venditore';

    // Indirizzo legale/fatturazione dell'acquirente: usa il profilo salvato
    // se completo, altrimenti ripiega sull'indirizzo di spedizione inserito
    // al checkout (meglio un dato reale disponibile che un campo vuoto).
    const buyerHasBillingAddr = !!(buyerProfile?.indirizzo_fatturazione_via && buyerProfile?.indirizzo_fatturazione_citta);
    const buyerLegalName = buyerProfile?.ragione_sociale || order.shipping_name;
    const buyerVat = buyerProfile?.partita_iva || null;
    const buyerBillingLines = buyerHasBillingAddr
      ? {
          via: buyerProfile!.indirizzo_fatturazione_via, citta: buyerProfile!.indirizzo_fatturazione_citta,
          prov: buyerProfile!.indirizzo_fatturazione_provincia, cap: buyerProfile!.indirizzo_fatturazione_cap,
          paese: paeseLabel(buyerProfile!.indirizzo_fatturazione_paese),
        }
      : { via: shipAddr.address, citta: shipAddr.city, prov: shipAddr.province, cap: shipAddr.zipCode, paese: 'Italia' };

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

    // IVA REALE: calcolata da Stripe Tax al momento del pagamento (0 se non
    // attiva per questo ordine — es. venditore senza registrazione fiscale
    // configurata). Non si inventa mai un'aliquota fissa: se Stripe non ha
    // calcolato imposta, il documento lo dichiara esplicitamente invece di
    // presumere un 22% che potrebbe essere sbagliato o non dovuto.
    const taxAmount = Number(order.tax_amount || 0);
    const hasRealTax = taxAmount > 0.001;
    const taxableBase = hasRealTax ? subtotal - taxAmount : subtotal;
    const effectiveRatePct = hasRealTax ? Math.round((taxAmount / taxableBase) * 100) : 0;

    const rows = items.map(i => {
      const lineTotal = i.price * i.quantity;
      const lineTaxable = hasRealTax ? lineTotal / (1 + effectiveRatePct / 100) : lineTotal;
      return `<tr>
        <td>${i.products?.name || 'Prodotto'}</td>
        <td style="text-align:center">${i.quantity}</td>
        <td style="text-align:right">€${(lineTaxable / i.quantity).toFixed(2)}</td>
        <td style="text-align:center">${hasRealTax ? effectiveRatePct + '%' : '—'}</td>
        <td style="text-align:right">€${lineTotal.toFixed(2)}</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Fattura ${order.order_number} — ${vendorName}</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:Arial,Helvetica,sans-serif;padding:40px;color:#1a1a1a;font-size:13px;line-height:1.5}
        .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
        .brand{font-size:22px;font-weight:900;color:#0F7A68}
        .brand span{color:#2FBFA0}
        .doc-title{font-size:26px;font-weight:400;color:#1a1a1a}
        .payment-box{background:#EAFBF6;border:1px solid #B8E8DC;border-radius:8px;padding:20px 24px;margin-bottom:28px}
        .payment-box h3{font-size:16px;margin-bottom:10px}
        .payment-box p{font-size:12px;color:#374151;margin:2px 0}
        .payment-meta{display:flex;justify-content:space-between;margin-top:14px;padding-top:14px;border-top:1px solid #B8E8DC;font-size:12px}
        .payment-meta div{flex:1}
        .payment-meta .label{color:#6b7280}
        .payment-meta .value{font-weight:700}
        .buyer-box{margin-bottom:16px;font-size:12px;color:#374151}
        .cols{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;margin-bottom:24px;padding-bottom:20px;border-bottom:1px solid #e5e7eb}
        .cols h4{font-size:13px;margin-bottom:8px}
        .cols p{font-size:12px;color:#374151;line-height:1.6}
        .order-info{display:flex;gap:40px;margin-bottom:24px;font-size:12px}
        .order-info .label{color:#6b7280;display:inline-block;min-width:90px}
        table{width:100%;border-collapse:collapse;margin-bottom:20px}
        th{background:#f9fafb;padding:8px;text-align:left;font-size:10px;text-transform:uppercase;color:#6b7280;border-bottom:1px solid #e5e7eb}
        td{padding:10px 8px;border-bottom:1px solid #f0f1f3;font-size:12px}
        .totals-row{display:flex;justify-content:flex-end;gap:24px;font-size:13px;margin:6px 0}
        .totals-row.grand{font-size:18px;font-weight:800;margin-top:12px;padding-top:12px;border-top:2px solid #1a1a1a}
        .vat-table{margin-top:20px;width:60%;margin-left:auto}
        .vat-table th, .vat-table td{font-size:11px}
        .note{font-size:10px;color:#9ca3af;margin-top:24px;line-height:1.5}
        .footer{margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:9px;color:#9ca3af;text-align:center;line-height:1.6}
        @media print{@page{margin:15mm}body{padding:0}}
      </style></head><body>

      <div class="header">
        <div class="brand">oral<span>zon</span></div>
        <div class="doc-title">Fattura</div>
      </div>

      <div class="payment-box">
        <h3>Pagato</h3>
        ${order.stripe_session_id ? `<p>Numero di riferimento del pagamento</p><p style="font-family:monospace">${order.stripe_session_id}</p>` : ''}
        <p style="margin-top:8px">Venduto da <strong>${vendorName}</strong>${vendor?.vat_id ? `, P. IVA ${vendor.vat_id}` : ''}</p>
        <div class="payment-meta">
          <div><p class="label">Data di fatturazione</p><p class="value">${orderDate}</p></div>
          <div><p class="label">Numero fattura</p><p class="value">${order.order_number}${vendor?.id ? '-' + vendor.id.slice(0, 6).toUpperCase() : ''}</p></div>
          <div><p class="label">Totale da pagare</p><p class="value">€${subtotal.toFixed(2)}</p></div>
        </div>
      </div>

      <div class="cols">
        <div>
          <h4>Indirizzo di fatturazione</h4>
          <p><strong>${buyerLegalName}</strong><br>
          ${buyerBillingLines.via || '—'}<br>
          ${buyerBillingLines.cap || ''} ${buyerBillingLines.citta || ''}${buyerBillingLines.prov ? ', ' + buyerBillingLines.prov : ''}<br>
          ${buyerBillingLines.paese}
          ${buyerVat ? `<br>P. IVA ${buyerVat}` : ''}</p>
        </div>
        <div>
          <h4>Indirizzo di spedizione</h4>
          <p><strong>${order.shipping_name}</strong><br>
          ${shipAddr.address || '—'}<br>
          ${shipAddr.zipCode || ''} ${shipAddr.city || ''}${shipAddr.province ? ', ' + shipAddr.province : ''}<br>
          ${paeseLabel(shipAddr.country) || 'Italia'}</p>
        </div>
        <div>
          <h4>Venduto da</h4>
          <p><strong>${vendorName}</strong><br>
          ${vendor?.address_street || '—'}<br>
          ${vendor?.address_postal_code || ''} ${vendor?.address_city || ''}${vendor?.address_region ? ', ' + vendor.address_region : ''}<br>
          ${paeseLabel(vendor?.fiscal_country) || 'Italia'}
          ${vendor?.vat_id ? `<br>P. IVA ${vendor.vat_id}` : '<br><em style="color:#9ca3af">P. IVA non ancora registrata</em>'}</p>
        </div>
      </div>

      <div class="order-info">
        <p><span class="label">Data ordine</span> ${orderDate}</p>
        <p><span class="label">Numero ordine</span> ${order.order_number}</p>
        <p><span class="label">Ordinato da</span> ${buyerLegalName}</p>
      </div>

      <table>
        <thead><tr><th>Descrizione</th><th style="text-align:center">Quant.</th><th style="text-align:right">P. Unitario${hasRealTax ? ' (IVA esclusa)' : ''}</th><th style="text-align:center">IVA %</th><th style="text-align:right">Prezzo Totale${hasRealTax ? ' (IVA inclusa)' : ''}</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="totals-row grand"><span>Totale fattura</span><span>€${subtotal.toFixed(2)}</span></div>

      ${hasRealTax ? `
      <table class="vat-table">
        <thead><tr><th>IVA %</th><th style="text-align:right">Imponibile</th><th style="text-align:right">Totale IVA</th></tr></thead>
        <tbody><tr><td>${effectiveRatePct}%</td><td style="text-align:right">€${taxableBase.toFixed(2)}</td><td style="text-align:right">€${taxAmount.toFixed(2)}</td></tr></tbody>
      </table>` : `
      <p class="note">Questa vendita non riporta un'IVA calcolata separatamente da Stripe Tax per questo ordine — il regime fiscale applicabile dipende dalla registrazione fiscale del venditore. Per l'esatto trattamento IVA di questa fattura, contatta direttamente ${vendorName}.</p>`}

      <p class="note">Questo documento è stato generato da Oralzon in qualità di piattaforma marketplace attraverso cui la vendita è stata effettuata e il pagamento processato per conto del venditore. Oralzon non è il venditore di questi prodotti: la responsabilità fiscale e commerciale della vendita è di ${vendorName}.</p>

      <div class="footer">
        Oralzon — Marketplace B2B odontoiatrico · www.oralzon.com<br>
        Documento generato automaticamente il ${new Date().toLocaleDateString('it-IT')}
      </div>

      <script>window.onload=function(){window.print()}</script>
      </body></html>`;
    const win = window.open('', '_blank', 'width=850,height=1100');
    if (win) { win.document.write(html); win.document.close(); }
  };

  return (
    <button onClick={generate}
      className="flex items-center justify-center gap-1.5 px-2.5 py-2 sm:py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors text-center">
      <FileText className="w-3.5 h-3.5 flex-shrink-0" /> Fattura PDF
    </button>
  );
}
