-- =====================================================
-- HARDENING RLS — Audit punto 3
-- =====================================================
-- Problema: molte policy di SCRITTURA usavano USING (true) / WITH CHECK (true)
-- con la motivazione "tanto scrive solo il service_role dall'edge function".
-- Ma il service_role BYPASSA comunque RLS: quindi queste policy non servivano
-- a proteggere il service_role, servivano solo ad aprire la scrittura a
-- CHIUNQUE possieda la chiave anon (che è pubblica per design).
--
-- Questa migration ridefinisce quelle policy in modo che le scritture "di
-- sistema" (ordini, order_items, profili, fatture) siano riservate al
-- service_role reale, mentre gli utenti normali mantengono solo i permessi
-- legittimi sui propri dati. È idempotente: si può rieseguire senza danni.
-- =====================================================

-- ── Helper: sei il service_role? ─────────────────────────────────────────────
-- Il JWT del service_role ha il claim role='service_role'. Le policy che
-- rappresentano "azioni di sistema eseguite dall'edge function" devono
-- verificare QUESTO, non fidarsi di chiunque.
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::jsonb ->> 'role',
    ''
  ) = 'service_role';
$$;

-- =====================================================
-- ORDERS — le scritture avvengono SOLO via edge function (service_role).
-- Un utente normale non deve poter inserire o modificare ordini a mano.
-- La LETTURA resta governata dalle policy esistenti (cliente vede i propri,
-- vendor vede quelli con i propri item, admin vede tutto).
-- =====================================================
DROP POLICY IF EXISTS "Service role can insert orders" ON orders;
CREATE POLICY "Service role can insert orders" ON orders
  FOR INSERT WITH CHECK (is_service_role());

DROP POLICY IF EXISTS "Service role can update orders" ON orders;
CREATE POLICY "Service role can update orders" ON orders
  FOR UPDATE USING (is_service_role());

-- =====================================================
-- ORDER_ITEMS — inserimento solo di sistema (service_role).
-- Il vendor può aggiornare SOLO le righe dei propri prodotti (es. tracking /
-- shipping_status), non quelle altrui. La cancellazione è solo di sistema.
-- =====================================================
DROP POLICY IF EXISTS "Insert order items" ON order_items;
DROP POLICY IF EXISTS "Service role can insert order items" ON order_items;
CREATE POLICY "Service role can insert order items" ON order_items
  FOR INSERT WITH CHECK (is_service_role());

DROP POLICY IF EXISTS "Service can delete order items" ON order_items;
CREATE POLICY "Service can delete order items" ON order_items
  FOR DELETE USING (is_service_role());

-- Vendor aggiorna solo le righe dei propri prodotti (o service_role / admin)
DROP POLICY IF EXISTS "Vendor can update own order items" ON order_items;
CREATE POLICY "Vendor can update own order items" ON order_items
  FOR UPDATE USING (
    is_service_role()
    OR is_admin()
    OR vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
  );

-- =====================================================
-- PROFILES — l'inserimento profilo è un'azione di sistema (trigger/edge).
-- Un utente non deve poter creare profili arbitrari. L'aggiornamento del
-- proprio profilo resta permesso dalla policy esistente "Users can update
-- own profile" (auth.uid() = id), che NON tocchiamo.
-- =====================================================
DROP POLICY IF EXISTS "Service can insert profiles" ON profiles;
CREATE POLICY "Service can insert profiles" ON profiles
  FOR INSERT WITH CHECK (is_service_role() OR auth.uid() = id);

-- =====================================================
-- INVOICES — creazione solo di sistema (service_role).
-- =====================================================
DROP POLICY IF EXISTS "inv_insert" ON invoices;
CREATE POLICY "inv_insert" ON invoices
  FOR INSERT WITH CHECK (is_service_role());

-- =====================================================
-- PRODUCT_QUESTIONS — la risposta (update) deve poterla dare SOLO il vendor
-- proprietario del prodotto o un admin, non "chiunque" (era USING true).
-- L'inserimento della domanda resta legato all'utente (già corretto altrove).
-- =====================================================
DROP POLICY IF EXISTS "qa_update" ON product_questions;
CREATE POLICY "qa_update" ON product_questions
  FOR UPDATE USING (
    is_service_role()
    OR is_admin()
    OR product_id IN (
      SELECT p.id FROM products p
      JOIN vendors v ON v.id = p.vendor_id
      WHERE v.profile_id = auth.uid()
    )
  );

-- =====================================================
-- VENDORS — l'inserimento era WITH CHECK (true) per "qualsiasi autenticato".
-- Lo leghiamo al proprio profilo: puoi creare solo il TUO record vendor.
-- (L'edge function usa comunque il service_role, che passa sempre.)
-- =====================================================
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON vendors;
DROP POLICY IF EXISTS "Users can insert own vendor" ON vendors;
CREATE POLICY "Users can insert own vendor" ON vendors
  FOR INSERT TO authenticated
  WITH CHECK (is_service_role() OR profile_id = auth.uid());

-- =====================================================
-- NOTE
-- - Le policy di sola LETTURA con USING(true) su cataloghi pubblici
--   (products SELECT, product_reviews SELECT, vendors storefront SELECT, ecc.)
--   sono INTENZIONALI: quei dati sono pubblici. Non le tocchiamo.
-- - Le tabelle messaging (messages/conversations) e vendor_ratings sono state
--   eliminate in una migration precedente: nessuna policy da correggere lì.
-- =====================================================

-- Forza PostgREST a ricaricare lo schema (le policy hanno effetto immediato)
NOTIFY pgrst, 'reload schema';
