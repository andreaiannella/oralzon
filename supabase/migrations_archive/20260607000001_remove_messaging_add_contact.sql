-- =====================================================
-- RIMOZIONE SISTEMA MESSAGGISTICA (per ridurre carico DB)
-- Sostituito da: email di contatto pubblica sulla scheda venditore
-- =====================================================

DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;

-- Email di contatto pubblica del venditore (mostrata sulla vetrina store)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contact_email TEXT;

-- =====================================================
-- RIMOZIONE RECENSIONI VENDITORE (si recensiscono solo i prodotti)
-- =====================================================
DROP TABLE IF EXISTS vendor_ratings CASCADE;
ALTER TABLE vendors DROP COLUMN IF EXISTS avg_rating;
ALTER TABLE vendors DROP COLUMN IF EXISTS rating_count;

-- =====================================================
-- RIMBORSO RESI VIA STRIPE — traccia l'ID rimborso reale
-- =====================================================
ALTER TABLE returns ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT;
