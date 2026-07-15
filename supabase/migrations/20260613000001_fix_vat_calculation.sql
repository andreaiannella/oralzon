-- =====================================================
-- FIX: i prezzi sono già IVA inclusa (come dichiarato nelle Condizioni di
-- Vendita: "Tutti i prezzi sono espressi in Euro IVA inclusa"), ma il Report
-- Fiscale li trattava come importo NETTO e sommava un altro 22% sopra —
-- un totale sfalsato che non corrispondeva a quanto pagato realmente dal cliente.
-- =====================================================
DROP VIEW IF EXISTS vendor_fiscal_summary;
CREATE VIEW vendor_fiscal_summary AS
SELECT
  oi.vendor_id,
  DATE_TRUNC('month', o.created_at) AS periodo,
  COUNT(DISTINCT o.id)              AS num_ordini,
  COUNT(oi.id)                      AS num_items,
  -- Il prezzo (price) è già IVA inclusa: è il totale che il cliente paga davvero
  ROUND(SUM(oi.price * oi.quantity), 2)                         AS totale_ivato,
  -- L'imponibile si ricava dividendo per 1.22, non sommando sopra
  ROUND(SUM(oi.price * oi.quantity) / 1.22, 2)                  AS imponibile,
  ROUND(SUM(oi.price * oi.quantity) - SUM(oi.price * oi.quantity) / 1.22, 2) AS iva_22,
  v.commission_pct                             AS commission_pct,
  ROUND(SUM(oi.price * oi.quantity) * (v.commission_pct / 100.0), 2) AS commissione_piattaforma,
  ROUND(SUM(oi.price * oi.quantity) * (1 - v.commission_pct / 100.0), 2) AS netto_vendor
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN vendors v ON v.id = oi.vendor_id
WHERE o.status IN ('processing', 'shipped', 'delivered')
GROUP BY oi.vendor_id, DATE_TRUNC('month', o.created_at), v.commission_pct;
