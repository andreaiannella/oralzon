-- =====================================================
-- FIX CRITICO: colonne mancanti su promotions
-- =====================================================
-- La migration 20260529000004_visibility_logic.sql non era mai stata eseguita
-- sul database live: mancavano sponsored_category e selected_product_ids,
-- causando il fallimento di OGNI insert di promozione con errore PostgREST
-- "Could not find the 'selected_product_ids' column of 'promotions' in the
-- schema cache".
-- =====================================================

ALTER TABLE promotions ADD COLUMN IF NOT EXISTS sponsored_category TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS selected_product_ids UUID[];

CREATE INDEX IF NOT EXISTS idx_promotions_active_vendor ON promotions(vendor_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_products_sponsored ON products(is_sponsored, promo_expires_at);
CREATE INDEX IF NOT EXISTS idx_vendors_homepage ON vendors(homepage_sponsored, homepage_expires_at);

-- Forza PostgREST a ricaricare la cache dello schema: dopo un ALTER TABLE la
-- cache può restare vecchia per qualche minuto e continuare a dare lo stesso
-- errore anche se la colonna esiste già. Questo lo evita immediatamente.
NOTIFY pgrst, 'reload schema';
