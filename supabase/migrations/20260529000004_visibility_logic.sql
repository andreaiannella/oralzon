-- =====================================================
-- VISIBILITY: Logica completa sponsorizzazioni
-- =====================================================

-- Aggiungi campi alla tabella promotions per gestire la selezione
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS sponsored_category TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS selected_product_ids UUID[];

-- Aggiungi indice per ricerche veloci
CREATE INDEX IF NOT EXISTS idx_promotions_active_vendor ON promotions(vendor_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_products_sponsored ON products(is_sponsored, promo_expires_at);
CREATE INDEX IF NOT EXISTS idx_vendors_homepage ON vendors(homepage_sponsored, homepage_expires_at);

-- ==================================================
-- QUERY RAPIDA: trova il vendor ID dall'email auth
-- Usa questa per sistemare manualmente i vendor:
-- 
-- SELECT au.id, au.email, p.user_type, v.id as vendor_id
-- FROM auth.users au
-- LEFT JOIN profiles p ON p.id = au.id
-- LEFT JOIN vendors v ON v.profile_id = au.id
-- WHERE au.email = 'TUA_EMAIL@gmail.com';
-- ==================================================

-- Crea vendor per utente esistente (se manca il record vendor)
-- Sostituisci 'TUA_EMAIL@gmail.com' con la tua email
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Trova l'ID utente
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'andreaiannella5@gmail.com' LIMIT 1;
  
  IF v_user_id IS NOT NULL THEN
    -- Aggiorna il profilo
    UPDATE profiles SET user_type = 'venditore' WHERE id = v_user_id;
    
    -- Crea vendor se non esiste
    INSERT INTO vendors (profile_id, business_name, plan_type, plan_status, product_limit, verified_badge, trial_ends_at)
    VALUES (v_user_id, 'Il mio Store DentalClean', 'trial', 'active', 999999, false, NOW() + INTERVAL '7 days')
    ON CONFLICT (profile_id) DO UPDATE SET 
      plan_status = 'active',
      user_type = NULL; -- questo non fa niente, è solo per il conflict
    
    RAISE NOTICE 'Vendor creato/aggiornato per utente %', v_user_id;
  ELSE
    RAISE NOTICE 'Utente non trovato';
  END IF;
END $$;
