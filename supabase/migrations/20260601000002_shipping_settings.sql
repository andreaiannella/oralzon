-- Spese di spedizione per vendor
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10,2) DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC(10,2) DEFAULT 0; -- 0 = sempre a pagamento
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS shipping_notes TEXT;

-- Aggiorna prodotti con shipping_cost ereditato dal vendor (calcolato at checkout)
COMMENT ON COLUMN vendors.shipping_cost IS 'Costo spedizione standard (0 = gratis)';
COMMENT ON COLUMN vendors.free_shipping_threshold IS 'Soglia sopra cui la spedizione è gratis (0 = mai gratis)';
