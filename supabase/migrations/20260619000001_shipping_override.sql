-- =====================================================
-- SPEDIZIONE PERSONALIZZATA PER PRODOTTO
-- =====================================================
-- Oggi ogni venditore ha un solo costo di spedizione fisso (vendors.shipping_cost).
-- Aggiunge la possibilità di sovrascriverlo per singoli prodotti (es. un prodotto
-- pesante/ingombrante come una poltrona da studio) senza dover creare un secondo
-- account venditore o forzare tutti gli altri prodotti allo stesso costo maggiorato.
-- =====================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_cost_override NUMERIC(10,2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS shipping_weight_kg NUMERIC(10,2);

COMMENT ON COLUMN products.shipping_cost_override IS 'Se valorizzato, sostituisce vendors.shipping_cost per QUESTO prodotto. NULL = usa il costo standard del venditore.';
COMMENT ON COLUMN products.shipping_weight_kg IS 'Peso di riferimento del pacco, informativo per ora (non usato in calcoli automatici di peso volumetrico).';

NOTIFY pgrst, 'reload schema';
