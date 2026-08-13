-- Spedizione per venditore sulla riga d'ordine. Applicata in produzione
-- il 13/08/2026.
--
-- BUG FINANZIARIO REALE: il costo di spedizione pagato dal cliente
-- confluiva in orders.total_amount ma non veniva mai salvato per
-- venditore, e il trasferimento (createTransferForOrderItem) e' calcolato
-- su price*quantity, cioe' solo la merce. Quei soldi non raggiungevano
-- nessuno e restavano nel saldo Stripe di Oralzon mentre il venditore
-- pagava il corriere di tasca sua:
--   cliente paga 107 (100 merce + 7 spedizione)
--   venditore riceve 93, paga corriere -6 -> incassa 87
--   commissione EFFETTIVA 13% invece del 7% dichiarato
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS shipping_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS shipping_paid_by text NOT NULL DEFAULT 'vendor';

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_shipping_paid_by_valid;
ALTER TABLE order_items ADD CONSTRAINT order_items_shipping_paid_by_valid
  CHECK (shipping_paid_by IN ('vendor', 'platform'));

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_shipping_amount_positive;
ALTER TABLE order_items ADD CONSTRAINT order_items_shipping_amount_positive
  CHECK (shipping_amount >= 0);

COMMENT ON COLUMN order_items.shipping_amount IS 'Quota di spedizione del venditore su questo ordine, valorizzata su una sola riga per venditore. Girata al venditore se shipping_paid_by = vendor.';
COMMENT ON COLUMN order_items.shipping_paid_by IS 'vendor = spedisce in autonomia e paga il corriere | platform = Oralzon compra l''etichetta via aggregatore e trattiene l''importo';

-- Interruttore per venditore: diventera' true man mano che passano
-- all'aggregatore, senza migrare gli ordini storici.
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS uses_platform_shipping boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN vendors.uses_platform_shipping IS 'true = le etichette le compra Oralzon tramite l''aggregatore; false = il venditore spedisce in autonomia';
