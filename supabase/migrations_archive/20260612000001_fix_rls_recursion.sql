-- =====================================================
-- FIX URGENTE: ricorsione infinita nella policy RLS su profiles
-- =====================================================
-- Causa: la policy "Admin can view all profiles" era definita SULLA tabella
-- profiles e, per capire se sei admin, interrogava di nuovo profiles.
-- Postgres blocca questo come ricorsione infinita — il risultato è che
-- QUALSIASI lettura del profilo (per chiunque, non solo admin) può fallire
-- silenziosamente. Effetto a catena: l'app non riesce più a capire se sei
-- venditore o admin, e torna sempre al comportamento cliente di default.
-- =====================================================

-- 1. Rimuove la policy rotta
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

-- 2. Funzione helper SICURA: SECURITY DEFINER esegue con permessi elevati
--    che bypassano RLS internamente, spezzando la catena di ricorsione.
--    Questo è il pattern standard e corretto per "l'admin vede tutto" quando
--    la tabella coinvolta è la stessa che contiene il ruolo admin.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin'
  );
$$;

-- 3. Ricrea la policy su profiles usando la funzione sicura (nessuna ricorsione)
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- 4. Aggiorna anche le altre policy admin create nella stessa sessione,
--    per usare lo stesso pattern sicuro in modo coerente (difesa in profondità)
DROP POLICY IF EXISTS "Admin can view all promotions" ON promotions;
CREATE POLICY "Admin can view all promotions" ON promotions
  FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "Admin can update any vendor" ON vendors;
CREATE POLICY "Admin can update any vendor" ON vendors
  FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "Admin can manage any product" ON products;
CREATE POLICY "Admin can manage any product" ON products
  FOR ALL USING (is_admin());

-- 5. Aggiorna anche le policy admin preesistenti su orders (stesso pattern,
--    stessa causa potenziale se profiles era rotta)
DROP POLICY IF EXISTS "Admin can view all orders" ON orders;
CREATE POLICY "Admin can view all orders" ON orders
  FOR SELECT USING (is_admin());
