-- =====================================================
-- FIX: Autorizzazione venditore + pulizia dati test
-- =====================================================
-- Esegui questo SQL su Supabase → SQL Editor
-- =====================================================

-- 1. Policy vendors: lettura per utente autenticato
DROP POLICY IF EXISTS "Users can read own vendor" ON vendors;
CREATE POLICY "Users can read own vendor" ON vendors
  FOR SELECT USING (profile_id = auth.uid());

-- 2. Policy vendors: inserimento per utente autenticato
DROP POLICY IF EXISTS "Users can insert own vendor" ON vendors;
CREATE POLICY "Users can insert own vendor" ON vendors
  FOR INSERT WITH CHECK (profile_id = auth.uid());

-- 3. Policy vendors: aggiornamento per proprietario
DROP POLICY IF EXISTS "Users can update own vendor" ON vendors;
CREATE POLICY "Users can update own vendor" ON vendors
  FOR UPDATE USING (profile_id = auth.uid());

-- 4. Policy products: vendor può gestire i propri prodotti
DROP POLICY IF EXISTS "Vendors can manage own products" ON products;
CREATE POLICY "Vendors can manage own products" ON products
  FOR ALL USING (
    vendor_id IN (
      SELECT id FROM vendors WHERE profile_id = auth.uid()
    )
  );

-- 5. Policy products: chiunque può leggere i prodotti pubblicati
DROP POLICY IF EXISTS "Public can read published products" ON products;
CREATE POLICY "Public can read published products" ON products
  FOR SELECT USING (status = 'published' OR status IS NULL);

-- 6. Aggiorna il profilo dell'utente corrente a venditore
--    SOSTITUISCI 'LA-TUA-EMAIL@email.com' con la tua email
-- UPDATE profiles SET user_type = 'venditore' WHERE email = 'LA-TUA-EMAIL@email.com';

-- 7. Crea manualmente il record vendor per l'utente corrente
--    (se non è stato creato automaticamente)
--    SOSTITUISCI 'LA-TUA-EMAIL@email.com' con la tua email
-- INSERT INTO vendors (profile_id, business_name, plan_type, plan_status, product_limit, verified_badge)
-- SELECT id, 'Il Mio Store', 'professional', 'active', 999999, false
-- FROM profiles WHERE email = 'LA-TUA-EMAIL@email.com'
-- ON CONFLICT (profile_id) DO NOTHING;
