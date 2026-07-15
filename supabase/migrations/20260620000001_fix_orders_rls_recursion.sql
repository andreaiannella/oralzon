-- =====================================================
-- FIX: ricorsione infinita nelle policy RLS di orders/order_items
-- =====================================================
-- Bug reale: la policy "vendor può vedere gli ordini con i suoi articoli" su
-- orders interroga order_items; la policy "cliente può vedere i propri
-- articoli d'ordine" su order_items interroga orders. Quando Postgres valuta
-- l'una, attiva l'altra, che riattiva la prima, all'infinito — errore 42P17
-- "infinite recursion detected in policy for relation orders".
--
-- La maggior parte dell'app non lo notava perché passa dalle Edge Function
-- (service_role, bypassa le RLS). Solo le query dirette dal browser — come la
-- vecchia dashboard admin — ci sbattevano contro.
--
-- Soluzione: le condizioni che attraversano le due tabelle non fanno più una
-- subquery diretta (che riattiva le RLS della tabella di destinazione), ma
-- passano da funzioni SECURITY DEFINER — esattamente lo stesso principio già
-- usato per is_admin(). Una funzione SECURITY DEFINER esegue le sue query
-- interne bypassando le RLS, spezzando il ciclo.
-- =====================================================

CREATE OR REPLACE FUNCTION is_vendor_of_order(check_order_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM order_items oi
    JOIN vendors v ON v.id = oi.vendor_id
    WHERE oi.order_id = check_order_id AND v.profile_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION is_customer_of_order(check_order_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM orders WHERE id = check_order_id AND customer_id = auth.uid()
  );
$$;

-- --- orders: ripulisce i doppioni e usa la funzione al posto della subquery ---
DROP POLICY IF EXISTS "Vendors can view orders with their items" ON orders;
DROP POLICY IF EXISTS "vendor_select_orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "customer_select_own_orders" ON orders;
DROP POLICY IF EXISTS "Customers can view their own orders" ON orders;
DROP POLICY IF EXISTS "Service role can insert orders" ON orders;
DROP POLICY IF EXISTS "service_insert_orders" ON orders;
DROP POLICY IF EXISTS "Customers can create orders" ON orders;
DROP POLICY IF EXISTS "Service role can update orders" ON orders;
DROP POLICY IF EXISTS "service_update_orders" ON orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON orders;

CREATE POLICY "orders_select" ON orders
  FOR SELECT USING (
    customer_id = auth.uid()
    OR is_admin()
    OR is_vendor_of_order(id)
  );
CREATE POLICY "orders_insert_service" ON orders
  FOR INSERT WITH CHECK (is_service_role());
CREATE POLICY "orders_update_service" ON orders
  FOR UPDATE USING (is_service_role() OR is_admin());

-- --- order_items: stessa pulizia, usa is_customer_of_order() invece della
-- subquery diretta su orders ---
DROP POLICY IF EXISTS "Vendor can view own order items" ON order_items;
DROP POLICY IF EXISTS "Service role can insert order items" ON order_items;
DROP POLICY IF EXISTS "Insert order items" ON order_items;
DROP POLICY IF EXISTS "Vendor can update own order items" ON order_items;
DROP POLICY IF EXISTS "Service can delete order items" ON order_items;

CREATE POLICY "order_items_select" ON order_items
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
    OR is_customer_of_order(order_id)
    OR is_admin()
  );
CREATE POLICY "order_items_insert_service" ON order_items
  FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_update" ON order_items
  FOR UPDATE USING (
    is_service_role()
    OR is_admin()
    OR vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
  );
CREATE POLICY "order_items_delete_service" ON order_items
  FOR DELETE USING (is_service_role());

NOTIFY pgrst, 'reload schema';
