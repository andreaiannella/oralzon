-- =====================================================
-- RESO PARZIALE PER QUANTITÀ
-- =====================================================
-- Finora un reso riguardava sempre l'intera riga d'ordine (order_item),
-- anche se il cliente aveva comprato più pezzi e voleva restituirne solo
-- una parte. Aggiunge la quantità resa, così il rimborso proposto è
-- proporzionato a quanti pezzi vengono davvero restituiti.
-- =====================================================

ALTER TABLE returns ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;
COMMENT ON COLUMN returns.quantity IS 'Numero di pezzi resi su questa riga d''ordine (può essere inferiore alla quantità totale acquistata in quella riga).';

NOTIFY pgrst, 'reload schema';
