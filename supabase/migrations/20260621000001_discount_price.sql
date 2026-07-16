-- =====================================================
-- PREZZO SCONTATO PRODOTTO (per la pagina Offerte)
-- =====================================================
-- Campo opzionale: se valorizzato e inferiore al prezzo pieno, il prodotto
-- compare nella pagina Offerte e il prezzo scontato diventa quello
-- effettivamente addebitato al checkout (calcolato lato server, non fidato
-- dal client — stesso principio già applicato a prezzo e spedizione).
-- =====================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_price NUMERIC(10,2);

COMMENT ON COLUMN products.discount_price IS 'Se valorizzato e < price, il prodotto è in offerta. Il prezzo effettivo (addebitato e mostrato) diventa questo, non price.';

NOTIFY pgrst, 'reload schema';
