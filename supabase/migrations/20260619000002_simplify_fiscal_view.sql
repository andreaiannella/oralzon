-- =====================================================
-- SEMPLIFICAZIONE REPORT VENDITE VENDITORE
-- =====================================================
-- Il marketplace è ormai internazionale: applicare un'IVA fissa al 22% (regime
-- italiano) a venditori con aliquote diverse nel proprio paese produce numeri
-- sbagliati, non solo incompleti. Rimuoviamo il calcolo IVA dalla vista.
--
-- Rimuoviamo anche la commissione piattaforma dalle colonne esposte: il
-- venditore deve vedere solo quanto vende e quanto riceve (fatturato), non il
-- margine trattenuto da Oralzon — stessa logica di Amazon Seller Central.
-- Il calcolo della commissione resta interno alla formula del fatturato
-- netto, semplicemente non viene più mostrato come voce separata.
--
-- CREATE OR REPLACE VIEW non permette di rimuovere colonne esistenti, serve
-- DROP + CREATE.
-- =====================================================

DROP VIEW IF EXISTS vendor_fiscal_summary;

CREATE VIEW vendor_fiscal_summary AS
SELECT
  oi.vendor_id,
  DATE_TRUNC('month', o.created_at) AS periodo,
  COUNT(DISTINCT o.id) AS num_ordini,
  COUNT(oi.id)         AS num_items,
  ROUND(SUM(oi.price * oi.quantity) * (1 - v.commission_pct / 100.0), 2) AS fatturato
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN vendors v ON v.id = oi.vendor_id
WHERE o.status IN ('processing', 'shipped', 'delivered')
GROUP BY oi.vendor_id, DATE_TRUNC('month', o.created_at), v.commission_pct;

NOTIFY pgrst, 'reload schema';
