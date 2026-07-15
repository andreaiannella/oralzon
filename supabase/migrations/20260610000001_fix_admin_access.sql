-- =====================================================
-- FIX: l'admin non aveva accesso reale a Promozioni, Utenti,
-- e non poteva approvare/sospendere venditori né eliminare prodotti.
-- Stesso identico problema di oggi: RLS senza eccezione per l'admin.
-- =====================================================

-- 1. PROMOTIONS: admin deve vedere tutte le promozioni acquistate (tab "Promozioni")
DROP POLICY IF EXISTS "Admin can view all promotions" ON promotions;
CREATE POLICY "Admin can view all promotions" ON promotions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- 2. PROFILES: admin deve vedere tutti gli utenti (tab "Utenti")
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.user_type = 'admin')
  );

-- 3. VENDORS: admin deve poter approvare/sospendere qualsiasi venditore
DROP POLICY IF EXISTS "Admin can update any vendor" ON vendors;
CREATE POLICY "Admin can update any vendor" ON vendors
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- 4. PRODUCTS: admin deve poter modificare/eliminare qualsiasi prodotto (moderazione)
DROP POLICY IF EXISTS "Admin can manage any product" ON products;
CREATE POLICY "Admin can manage any product" ON products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );
