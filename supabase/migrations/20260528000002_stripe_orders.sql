-- =====================================================
-- STRIPE: Campi aggiuntivi per orders
-- =====================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS shipping_name      TEXT,
  ADD COLUMN IF NOT EXISTS shipping_email     TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address   JSONB;

-- Index per lookup veloce dal webhook/verify
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);

-- Policy: i vendor possono vedere gli ordini dei loro prodotti
DROP POLICY IF EXISTS "Vendors can view orders with their items" ON orders;
CREATE POLICY "Vendors can view orders with their items" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM order_items oi
      JOIN vendors v ON v.id = oi.vendor_id
      WHERE oi.order_id = orders.id
        AND v.profile_id = auth.uid()
    )
  );

-- Policy: order_items INSERT aperta al service_role (gestita dall'edge function)
DROP POLICY IF EXISTS "Service role can insert order items" ON order_items;
CREATE POLICY "Service role can insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- Policy: order INSERT aperta (l'edge function usa service_role_key)
DROP POLICY IF EXISTS "Service role can insert orders" ON orders;
CREATE POLICY "Service role can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Policy: aggiornamento ordine (status, stripe_session_id)
DROP POLICY IF EXISTS "Service role can update orders" ON orders;
CREATE POLICY "Service role can update orders" ON orders
  FOR UPDATE USING (true);
