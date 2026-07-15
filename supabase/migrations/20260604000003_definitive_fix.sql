-- =====================================================
-- MIGRATION DEFINITIVA - Esegui questa su Supabase SQL Editor
-- Risolve: profili vuoti, ordini invisibili, vendor_id mancante
-- =====================================================

-- 1. TRIGGER Supabase per creare profilo automaticamente su nuova registrazione
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, user_type, nome, cognome, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'cliente'),
    COALESCE(NEW.raw_user_meta_data->>'nome', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'cognome', ''),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nome = CASE WHEN profiles.nome IS NULL OR profiles.nome = '' THEN EXCLUDED.nome ELSE profiles.nome END,
    cognome = CASE WHEN profiles.cognome IS NULL OR profiles.cognome = '' THEN EXCLUDED.cognome ELSE profiles.cognome END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Assicura che tutti gli utenti esistenti abbiano un profilo con email
INSERT INTO profiles (id, email, user_type, nome, cognome, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'user_type', 'cliente'),
  COALESCE(au.raw_user_meta_data->>'nome', SPLIT_PART(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'cognome', ''),
  NOW()
FROM auth.users au
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  nome = CASE WHEN profiles.nome IS NULL OR profiles.nome = '' THEN EXCLUDED.nome ELSE profiles.nome END,
  cognome = CASE WHEN profiles.cognome IS NULL OR profiles.cognome = '' THEN EXCLUDED.cognome ELSE profiles.cognome END;

-- 3. Aggiunge colonne mancanti a profiles (idempotente)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cognome TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ragione_sociale TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS partita_iva TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS codice_fiscale TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pec TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS codice_sdi TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS indirizzo_spedizione_via TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS indirizzo_spedizione_citta TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS indirizzo_spedizione_provincia TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS indirizzo_spedizione_cap TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS indirizzo_fatturazione_via TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS indirizzo_fatturazione_citta TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS indirizzo_fatturazione_provincia TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS indirizzo_fatturazione_cap TEXT;

-- 4. RLS profiles: utenti possono leggere e aggiornare il proprio profilo
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Service can insert profiles" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service can insert profiles" ON profiles FOR INSERT WITH CHECK (true);

-- 5. FIX CRITICO: Aggiorna order_items con vendor_id NULL
UPDATE order_items oi
SET vendor_id = p.vendor_id
FROM products p
WHERE oi.product_id = p.id
  AND (oi.vendor_id IS NULL OR oi.vendor_id = '00000000-0000-0000-0000-000000000000');

-- 6. RLS orders - completamente pulita
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Vendors can view orders with their items" ON orders;
DROP POLICY IF EXISTS "Service role can insert orders" ON orders;
DROP POLICY IF EXISTS "Service role can update orders" ON orders;

-- Clienti vedono i propri ordini
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (customer_id = auth.uid());

-- Vendor vedono ordini con loro prodotti
CREATE POLICY "Vendors can view orders with their items" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN vendors v ON v.id = oi.vendor_id
      WHERE oi.order_id = orders.id
        AND v.profile_id = auth.uid()
    )
  );

-- Admin vede tutto
CREATE POLICY "Admin can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

CREATE POLICY "Service role can insert orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update orders" ON orders FOR UPDATE USING (true);

-- 7. RLS order_items - completamente pulita
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Vendor can view own order items" ON order_items;
DROP POLICY IF EXISTS "Vendor can update own order items" ON order_items;
DROP POLICY IF EXISTS "Insert order items" ON order_items;

CREATE POLICY "Vendor can view own order items" ON order_items
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
    OR order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

CREATE POLICY "Vendor can update own order items" ON order_items
  FOR UPDATE USING (
    vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
  );

CREATE POLICY "Insert order items" ON order_items FOR INSERT WITH CHECK (true);

-- 8. Trigger per decrementare stock DOPO pagamento confermato
CREATE OR REPLACE FUNCTION decrement_stock_on_order_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'processing' AND OLD.status = 'pending' THEN
    UPDATE products p
    SET stock = GREATEST(0, p.stock - oi.quantity)
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND p.id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_decrement_stock ON orders;
CREATE TRIGGER trigger_decrement_stock
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_order_confirmed();

-- 9. Pulisci ordini pending orfani (senza stripe_session_id e più vecchi di 1 ora)
DELETE FROM order_items WHERE order_id IN (
  SELECT id FROM orders
  WHERE status = 'pending'
    AND stripe_session_id IS NULL
    AND created_at < NOW() - INTERVAL '1 hour'
);
DELETE FROM orders
WHERE status = 'pending'
  AND stripe_session_id IS NULL
  AND created_at < NOW() - INTERVAL '1 hour';

-- Aggiungi indirizzo mittente ai vendors (per etichette di spedizione)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sender_address TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sender_city TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sender_zip TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sender_province TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sender_phone TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS preferred_carrier TEXT DEFAULT 'brt';

-- =====================================================
-- FIX MESSAGGISTICA: RLS conversations e messages
-- =====================================================
ALTER TABLE conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Clienti vedono proprie conversazioni" ON conversations;
DROP POLICY IF EXISTS "Vendor vedono proprie conversazioni" ON conversations;
DROP POLICY IF EXISTS "Clienti creano conversazioni" ON conversations;
DROP POLICY IF EXISTS "Tutti aggiornano proprie conversazioni" ON conversations;

-- Clienti
CREATE POLICY "conv_customer_select" ON conversations
  FOR SELECT USING (customer_id = auth.uid());
CREATE POLICY "conv_customer_insert" ON conversations
  FOR INSERT WITH CHECK (customer_id = auth.uid());
CREATE POLICY "conv_customer_update" ON conversations
  FOR UPDATE USING (customer_id = auth.uid());

-- Vendor (tramite vendors.profile_id)
CREATE POLICY "conv_vendor_select" ON conversations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_id AND v.profile_id = auth.uid())
  );
CREATE POLICY "conv_vendor_update" ON conversations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_id AND v.profile_id = auth.uid())
  );

-- Service role per insert da edge function
CREATE POLICY "conv_service_insert" ON conversations FOR INSERT WITH CHECK (true);

-- Messages RLS
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utenti vedono messaggi proprie conversazioni" ON messages;
DROP POLICY IF EXISTS "Utenti inviano messaggi proprie conversazioni" ON messages;

CREATE POLICY "msg_select" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM conversations c WHERE c.id = conversation_id
    AND (c.customer_id = auth.uid()
      OR EXISTS (SELECT 1 FROM vendors v WHERE v.id = c.vendor_id AND v.profile_id = auth.uid()))
  )
);
CREATE POLICY "msg_insert" ON messages FOR INSERT WITH CHECK (true);
