-- Indici di performance mancanti + ricerca prodotti server-side.
-- Applicata al database di produzione il 13/08/2026 via Supabase MCP.
-- Vedi audit scalabilità: la piattaforma deve reggere ~100k prodotti e
-- migliaia di transazioni/giorno con venditori in tutta l'UE-27.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_products_published ON products(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_category_created ON products(category, created_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_products_hero_sponsored ON products(is_hero_sponsored, promo_expires_at) WHERE is_hero_sponsored = true;
CREATE INDEX IF NOT EXISTS idx_products_discounted ON products(discount_price) WHERE discount_price IS NOT NULL AND discount_price > 0;

-- getVendorByProfileId() gira su OGNI richiesta autenticata di un venditore
CREATE INDEX IF NOT EXISTS idx_vendors_profile_id ON vendors(profile_id, created_at);
CREATE INDEX IF NOT EXISTS idx_vendors_plan_status ON vendors(plan_status);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_shipping_status ON order_items(shipping_status);
CREATE INDEX IF NOT EXISTS idx_order_items_pending_transfer ON order_items(shipping_status, transfer_id) WHERE transfer_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_vendor_created ON order_items(vendor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_customer_created ON orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_questions_product ON product_questions(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_returns_order_item ON returns(order_item_id);
CREATE INDEX IF NOT EXISTS idx_vendor_shipping_zones_lookup ON vendor_shipping_zones(vendor_id, zone);
CREATE INDEX IF NOT EXISTS idx_vendor_transfers_order_item ON vendor_transfers(order_item_id, status);
