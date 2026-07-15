-- =====================================================
-- FIX CRITICO: il vincolo CHECK su promotions.status non includeva 'pending'
-- =====================================================
-- Causa: la tabella è stata creata con CHECK (status IN ('active','expired','cancelled')),
-- ma il codice applicativo salva sempre 'pending' al momento del checkout (prima che
-- il pagamento sia confermato). Il DB rifiutava quindi OGNI insert, il pagamento su
-- Stripe andava comunque a buon fine, e la pagina di conferma non trovava mai il
-- record -> "Pagamento ricevuto ma la promozione non risulta registrata".
-- =====================================================

ALTER TABLE promotions DROP CONSTRAINT IF EXISTS promotions_status_check;
ALTER TABLE promotions ADD CONSTRAINT promotions_status_check
  CHECK (status IN ('pending', 'active', 'expired', 'cancelled'));

-- Ripara eventuali sessioni pagate su Stripe ma mai registrate: non possiamo recuperarle
-- automaticamente da qui (il DB non ha mai avuto la riga), ma questo indice aiuta a
-- ritrovarle velocemente incrociando i log Stripe con created_at se serve un fix manuale.
CREATE INDEX IF NOT EXISTS idx_promotions_created_at ON promotions(created_at);
