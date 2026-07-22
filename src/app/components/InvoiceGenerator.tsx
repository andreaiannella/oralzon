import { FileText } from 'lucide-react';

interface Props {
  order: { order_number: string; created_at: string; total_amount: number; shipping_name: string; shipping_email: string; shipping_address: any };
  items: { products: { name: string } | null; quantity: number; price: number }[];
  vendorName?: string;
}

export function InvoiceButton({ order, items, vendorName }: Props) {
  const generate = () => {
    const date = new Date(order.created_at).toLocaleDateString('it-IT');
    const addr = order.shipping_address || {};
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const vat = subtotal * 0.22;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Fattura ${order.order_number}</title>
      <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;padding:40px;color:#333}
      .header{display:flex;justify-content:space-between;border-bottom:3px solid #1a56db;padding-bottom:20px;margin-bottom:30px}
      .logo{font-size:24px;font-weight:900;color:#1a56db}
      .logo span{color:#0891b2}
      .invoice-title{font-size:28px;color:#1a56db;text-align:right}
      .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:30px}
      .info-box h3{font-size:11px;text-transform:uppercase;color:#888;margin-bottom:8px;letter-spacing:1px}
      .info-box p{font-size:13px;line-height:1.6}
      table{width:100%;border-collapse:collapse;margin-bottom:30px}
      th{background:#f0f4f8;padding:10px;text-align:left;font-size:11px;text-transform:uppercase;color:#666;border-bottom:2px solid #ddd}
      td{padding:10px;border-bottom:1px solid #eee;font-size:13px}
      .totals{text-align:right;margin-top:20px}
      .totals p{font-size:13px;margin:4px 0}
      .totals .grand{font-size:18px;font-weight:900;color:#1a56db;margin-top:8px;padding-top:8px;border-top:2px solid #1a56db}
      .footer{margin-top:40px;padding-top:20px;border-top:1px solid #ddd;font-size:10px;color:#999;text-align:center}
      @media print{@page{margin:15mm}body{padding:0}}
      </style></head><body>
      <div class="header">
        <div><div class="logo">Dental<span>Clean</span></div><p style="font-size:11px;color:#888;margin-top:4px">${vendorName || 'Oralzon Marketplace'}</p></div>
        <div><div class="invoice-title">FATTURA</div><p style="font-size:12px;color:#888;text-align:right">N. ${order.order_number}<br>${date}</p></div>
      </div>
      <div class="info-grid">
        <div class="info-box"><h3>Venditore</h3><p><strong>${vendorName || 'Oralzon Vendor'}</strong><br>Marketplace Oralzon</p></div>
        <div class="info-box"><h3>Destinatario</h3><p><strong>${order.shipping_name}</strong><br>${addr.address || '—'}<br>${addr.zipCode || ''} ${addr.city || ''} ${addr.province ? '('+addr.province+')' : ''}<br>${order.shipping_email}</p></div>
      </div>
      <table><thead><tr><th>Prodotto</th><th style="text-align:center">Qtà</th><th style="text-align:right">Prezzo</th><th style="text-align:right">Totale</th></tr></thead>
      <tbody>${items.map(i => `<tr><td>${i.products?.name || '—'}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">€${Number(i.price).toFixed(2)}</td><td style="text-align:right">€${(i.price * i.quantity).toFixed(2)}</td></tr>`).join('')}</tbody></table>
      <div class="totals">
        <p>Imponibile: <strong>€${(subtotal / 1.22).toFixed(2)}</strong></p>
        <p>IVA 22%: <strong>€${(subtotal - subtotal / 1.22).toFixed(2)}</strong></p>
        <p class="grand">Totale: €${subtotal.toFixed(2)}</p>
      </div>
      <div class="footer">Questo documento è generato automaticamente da Oralzon — Marketplace B2B Odontoiatrico<br>www.oralzon.com</div>
      <script>window.onload=function(){window.print()}</script>
      </body></html>`;
    const win = window.open('', '_blank', 'width=800,height=1100');
    if (win) { win.document.write(html); win.document.close(); }
  };

  return (
    <button onClick={generate}
      className="flex items-center justify-center gap-1.5 px-2.5 py-2 sm:py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors text-center">
      <FileText className="w-3.5 h-3.5 flex-shrink-0" /> Fattura PDF
    </button>
  );
}
