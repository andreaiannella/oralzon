-- =====================================================
-- SISTEMA RECENSIONI PRODOTTI
-- =====================================================

CREATE TABLE IF NOT EXISTS product_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name   TEXT NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)  -- un utente = una recensione per prodotto
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user    ON product_reviews(user_id);

-- RLS
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Tutti possono leggere
DROP POLICY IF EXISTS "Reviews visibili a tutti" ON product_reviews;
CREATE POLICY "Reviews visibili a tutti" ON product_reviews
  FOR SELECT USING (true);

-- Solo utenti autenticati possono inserire la propria recensione
DROP POLICY IF EXISTS "Utenti possono inserire recensioni" ON product_reviews;
CREATE POLICY "Utenti possono inserire recensioni" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Utenti possono eliminare la propria recensione
DROP POLICY IF EXISTS "Utenti possono eliminare proprie recensioni" ON product_reviews;
CREATE POLICY "Utenti possono eliminare proprie recensioni" ON product_reviews
  FOR DELETE USING (auth.uid() = user_id);
