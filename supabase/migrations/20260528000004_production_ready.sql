-- =====================================================
-- PRODUCTION READY: Tutte le colonne e policy mancanti
-- =====================================================

-- Products: colonne mancanti
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications TEXT;

-- Order items: tracking spedizione
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Orders: campi Stripe (se non esistono)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;

-- Index
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor ON order_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- =====================================================
-- POLICY: Vendors
-- =====================================================
DROP POLICY IF EXISTS "Users can read own vendor" ON vendors;
CREATE POLICY "Users can read own vendor" ON vendors FOR SELECT USING (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own vendor" ON vendors;
CREATE POLICY "Users can insert own vendor" ON vendors FOR INSERT WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own vendor" ON vendors;
CREATE POLICY "Users can update own vendor" ON vendors FOR UPDATE USING (profile_id = auth.uid());

-- =====================================================
-- POLICY: Products
-- =====================================================
DROP POLICY IF EXISTS "Vendors can manage own products" ON products;
CREATE POLICY "Vendors can manage own products" ON products FOR ALL USING (
  vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
);

DROP POLICY IF EXISTS "Public can read published products" ON products;
CREATE POLICY "Public can read published products" ON products FOR SELECT USING (true);

-- =====================================================
-- POLICY: Orders
-- =====================================================
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders FOR SELECT USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Service role can insert orders" ON orders;
CREATE POLICY "Service role can insert orders" ON orders FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update orders" ON orders;
CREATE POLICY "Service role can update orders" ON orders FOR UPDATE USING (true);

-- =====================================================
-- POLICY: Order Items
-- =====================================================
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
DROP POLICY IF EXISTS "Service role can insert order items" ON order_items;
DROP POLICY IF EXISTS "Insert order items" ON order_items;
CREATE POLICY "Insert order items" ON order_items FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Vendor can view own order items" ON order_items;
DROP POLICY IF EXISTS "Vendor can view own order items" ON order_items;
CREATE POLICY "Vendor can view own order items" ON order_items FOR SELECT USING (
  vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
  OR order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
);

DROP POLICY IF EXISTS "Vendor can update own order items" ON order_items;
DROP POLICY IF EXISTS "Vendor can update own order items" ON order_items;
CREATE POLICY "Vendor can update own order items" ON order_items FOR UPDATE USING (
  vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
);

-- Wishlists table
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlists;
CREATE POLICY "Users can manage own wishlist" ON wishlists FOR ALL USING (user_id = auth.uid());
