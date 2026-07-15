-- =====================================================
-- FIX DEFINITIVO: righe vendor duplicate per lo stesso profile_id
-- =====================================================
-- Causa: race condition tra registrazione diretta e fallback edge function
-- Effetto: .maybeSingle() falliva silenziosamente → messaggi/resi "invisibili"
--          anche se creati correttamente nel DB
-- =====================================================

DO $$
DECLARE
  dup_profile RECORD;
  canonical_id UUID;
  dup_id UUID;
BEGIN
  -- Per ogni profile_id con più di 1 riga vendor...
  FOR dup_profile IN
    SELECT profile_id FROM vendors GROUP BY profile_id HAVING COUNT(*) > 1
  LOOP
    -- La riga "canonica" è la più vecchia (created_at asc)
    SELECT id INTO canonical_id FROM vendors
      WHERE profile_id = dup_profile.profile_id
      ORDER BY created_at ASC LIMIT 1;

    -- Per ogni riga duplicata (tutte tranne la canonica)...
    FOR dup_id IN
      SELECT id FROM vendors
        WHERE profile_id = dup_profile.profile_id AND id != canonical_id
    LOOP
      -- Ricollega tutti i dati che puntano al vendor duplicato verso il canonico
      UPDATE products SET vendor_id = canonical_id WHERE vendor_id = dup_id;
      UPDATE order_items SET vendor_id = canonical_id WHERE vendor_id = dup_id;
      UPDATE conversations SET vendor_id = canonical_id WHERE vendor_id = dup_id;
      UPDATE returns SET vendor_id = canonical_id WHERE vendor_id = dup_id;
      UPDATE vendor_ratings SET vendor_id = canonical_id WHERE vendor_id = dup_id;

      -- Elimina la riga vendor duplicata (ora orfana)
      DELETE FROM vendors WHERE id = dup_id;

      RAISE NOTICE 'Vendor duplicato % ricollegato e rimosso, canonico: %', dup_id, canonical_id;
    END LOOP;
  END LOOP;
END $$;

-- Impedisce che il problema si ripresenti in futuro: un solo vendor per profilo
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_profile_id_unique;
ALTER TABLE vendors ADD CONSTRAINT vendors_profile_id_unique UNIQUE (profile_id);
