-- =====================================================================
-- SCHEMA BASELINE CONSOLIDATO — Oralzon (ex DentalClean)
-- =====================================================================
-- Sostituisce, come RIFERIMENTO, le 32 migration incrementali eseguite
-- tra il 2026-05-14 e il 2026-06-15 (conservate in supabase/migrations_archive/
-- per lo storico completo).
--
-- COME USARLO
-- - Ambiente NUOVO (staging, disaster recovery, sviluppo locale): esegui
--   questo file per portare il database allo stato finale in un colpo solo.
--   NOTA: presuppone che le tabelle core (profiles, vendors, products,
--   orders, order_items) esistano già con lo schema base — non sono qui
--   perché create fuori dallo storico migration (setup iniziale progetto).
--   Per un ambiente davvero da zero, esporta prima lo schema base con
--   `supabase db dump` dal progetto live.
-- - Database LIVE attuale: NON ESEGUIRE QUESTO FILE — è già in questo stato
--   tramite le 32 migration originali. Rieseguirlo è innocuo (tutto
--   idempotente) ma inutile.
--
-- Vedi anche supabase/SCHEMA_REFERENCE.md per la documentazione discorsiva.
-- =====================================================================

-- =====================================================
-- ESTENSIONI
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- COLONNE — TABELLE CORE
-- (profiles, vendors, products, orders, order_items)
-- =====================================================

-- --- profiles ---
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS province TEXT;
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
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- --- vendors ---
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS homepage_sponsored BOOLEAN DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS homepage_expires_at TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10,2) DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS free_shipping_threshold NUMERIC(10,2) DEFAULT 0; -- 0 = sempre a pagamento;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS shipping_notes TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sender_name TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sender_address TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sender_city TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sender_zip TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sender_province TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sender_phone TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS sender_email TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS preferred_carrier TEXT DEFAULT 'brt';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS store_description TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS main_category TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS commission_pct NUMERIC(5,2) DEFAULT 7.00;

-- --- products ---
ALTER TABLE products ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'published';
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS specifications TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS promo_expires_at TIMESTAMPTZ;

-- --- orders ---
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_name TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address JSONB;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_refund_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_refunded_at TIMESTAMPTZ;

-- --- order_items ---
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS carrier TEXT;

-- =====================================================
-- VINCOLI — TABELLE CORE
-- =====================================================

-- vendors_profile_id_key e vendors_profile_id_unique erano due UNIQUE
-- ridondanti sulla stessa colonna (create per errore in migration diverse).
-- Consolidati in un solo vincolo canonico:
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_profile_id_key;
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_profile_id_unique;
ALTER TABLE vendors ADD CONSTRAINT vendors_profile_id_unique UNIQUE (profile_id);

ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_plan_type_check;
ALTER TABLE vendors ADD CONSTRAINT vendors_plan_type_check    CHECK (plan_type IN ('trial', 'professional', 'enterprise'));

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_shipping_status_check;
ALTER TABLE order_items ADD CONSTRAINT order_items_shipping_status_check   CHECK (shipping_status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'));

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check   CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'partially_refunded'));

-- orders.customer_id NON ha una FK verso profiles: rimossa intenzionalmente
-- in 20260601000003_fix_orders_fk per evitare problemi di join in alcuni
-- flussi. Resta comunque indicizzata per le query.
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
-- =====================================================
-- TABELLE SECONDARIE
-- =====================================================

-- --- wishlists ---
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- --- promotions ---
CREATE TABLE IF NOT EXISTS promotions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL,
  package_name TEXT NOT NULL,
  amount_paid NUMERIC(10,2) NOT NULL,
  stripe_session_id TEXT UNIQUE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active','expired','cancelled')),
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --- discount_codes ---
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_months')),
  value NUMERIC(10,2) NOT NULL,
  applies_to TEXT NOT NULL CHECK (applies_to IN ('order', 'subscription', 'both')),
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER,
  used_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --- discount_code_uses ---
CREATE TABLE IF NOT EXISTS discount_code_uses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code_id UUID REFERENCES discount_codes(id),
  user_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  discount_amount NUMERIC(10,2),
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- --- returns ---
CREATE TABLE IF NOT EXISTS returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  
  reason TEXT NOT NULL CHECK (reason IN ('wrong_item', 'defective', 'damaged_shipping', 'not_as_described')),
  description TEXT NOT NULL,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','shipped_back','received','refunded','cancelled')),
  
  vendor_notes TEXT,
  restocking_fee_pct INTEGER DEFAULT 0,  -- % trattenuta (es. 15)
  refund_amount NUMERIC(10,2),           -- importo finale rimborsato
  
  return_tracking TEXT,          -- tracking del reso
  return_label_url TEXT,         -- etichetta di spedizione
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

-- --- product_reviews ---
CREATE TABLE IF NOT EXISTS product_reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name   TEXT NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)  -- un utente = una recensione per prodotto
);

-- --- product_questions ---
CREATE TABLE IF NOT EXISTS product_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  user_name TEXT,
  question TEXT NOT NULL,
  answer TEXT,
  answered_by UUID REFERENCES auth.users(id),
  answered_at TIMESTAMPTZ,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --- customer_addresses ---
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Indirizzo',
  full_name TEXT NOT NULL,
  address TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT,
  phone TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --- invoices ---
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  vendor_id UUID REFERENCES vendors(id),
  customer_id UUID REFERENCES auth.users(id),
  total_amount NUMERIC(10,2),
  vat_amount NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --- vendor_promo_codes ---
CREATE TABLE IF NOT EXISTS vendor_promo_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  extends_trial_days INTEGER NOT NULL DEFAULT 180,
  max_uses INTEGER DEFAULT NULL,        -- NULL = illimitato
  used_count INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ,               -- NULL = non scade mai
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --- vendor_promo_redemptions ---
CREATE TABLE IF NOT EXISTS vendor_promo_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID REFERENCES vendor_promo_codes(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id)  -- un vendor può riscattare un solo codice promo, mai due volte
);

-- Tabelle RIMOSSE dal progetto (non ricreare): messages, conversations,
-- vendor_ratings — sostituite da email di contatto pubblica sulla vetrina
-- venditore e da recensioni-solo-prodotto.

-- =====================================================
-- INDICI
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor ON order_items(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_promotions_vendor ON promotions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status_expires ON promotions(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_promotions_active_vendor ON promotions(vendor_id, status, expires_at);
CREATE INDEX IF NOT EXISTS idx_products_sponsored ON products(is_sponsored, promo_expires_at);
CREATE INDEX IF NOT EXISTS idx_vendors_homepage ON vendors(homepage_sponsored, homepage_expires_at);
CREATE INDEX IF NOT EXISTS idx_returns_customer ON returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_vendor ON returns(vendor_id);
CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user    ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_homepage_active ON vendors(homepage_sponsored, homepage_expires_at) WHERE homepage_sponsored = true;
CREATE INDEX IF NOT EXISTS idx_promotions_created_at ON promotions(created_at);

-- =====================================================
-- FUNZIONI
-- =====================================================

-- --- is_admin ---
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

-- --- is_service_role ---
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

-- --- create_vendor_for_user ---
CREATE OR REPLACE FUNCTION create_vendor_for_user(
  p_business_name TEXT,
  p_plan_type TEXT,
  p_product_limit INTEGER
)
RETURNS vendors
LANGUAGE plpgsql
SECURITY DEFINER -- ✅ Bypassa RLS
SET search_path = public
AS $$
DECLARE
  v_vendor vendors;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non autenticato';
  END IF;

  SELECT * INTO v_vendor
  FROM vendors
  WHERE profile_id = auth.uid();

  IF v_vendor.id IS NOT NULL THEN
    RETURN v_vendor;
  END IF;

  INSERT INTO vendors (
    profile_id,
    business_name,
    plan_type,
    plan_status,
    product_limit,
    verified_badge
  ) VALUES (
    auth.uid(),
    p_business_name,
    p_plan_type,
    'active',
    p_product_limit,
    false
  )
  RETURNING * INTO v_vendor;

  RETURN v_vendor;
END;
$$;

-- --- vendor_is_active ---
CREATE OR REPLACE FUNCTION vendor_is_active(vendor_profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_record RECORD;
BEGIN
  SELECT plan_type, plan_status, trial_ends_at 
  INTO v_record
  FROM vendors 
  WHERE profile_id = vendor_profile_id;
  
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF v_record.plan_status = 'suspended' THEN RETURN FALSE; END IF;
  IF v_record.plan_type IN ('professional', 'enterprise') 
     AND v_record.plan_status = 'active' THEN RETURN TRUE; END IF;
  IF v_record.plan_type = 'trial' 
     AND v_record.trial_ends_at > NOW() THEN RETURN TRUE; END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- --- update_returns_timestamp ---
CREATE OR REPLACE FUNCTION update_returns_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

-- --- decrement_stock_on_order_confirmed ---
CREATE OR REPLACE FUNCTION decrement_stock_on_order_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'processing' AND OLD.status = 'pending' THEN
    UPDATE products p
    SET stock = GREATEST(0, p.stock - oi.quantity)
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND p.id = oi.product_id;

    UPDATE order_items
    SET shipping_status = 'confirmed'
    WHERE order_id = NEW.id
      AND shipping_status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --- handle_new_user (schema-qualified: public.handle_new_user) ---
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

-- NOTA: update_vendor_rating() esclusa intenzionalmente — operava solo sulla
-- tabella vendor_ratings e sulle colonne vendors.avg_rating/rating_count,
-- tutte rimosse. Funzione orfana, non più necessaria.

-- =====================================================
-- TRIGGER
-- =====================================================

DROP TRIGGER IF EXISTS trigger_returns_updated ON returns;
CREATE TRIGGER trigger_returns_updated BEFORE UPDATE ON returns
  FOR EACH ROW EXECUTE FUNCTION update_returns_timestamp();

DROP TRIGGER IF EXISTS trigger_decrement_stock ON orders;
CREATE TRIGGER trigger_decrement_stock
  AFTER UPDATE OF status ON orders
  FOR EACH ROW EXECUTE FUNCTION decrement_stock_on_order_confirmed();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- VISTE
-- =====================================================

CREATE VIEW vendor_fiscal_summary AS
SELECT
  oi.vendor_id,
  DATE_TRUNC('month', o.created_at) AS periodo,
  COUNT(DISTINCT o.id)              AS num_ordini,
  COUNT(oi.id)                      AS num_items,
  ROUND(SUM(oi.price * oi.quantity), 2)                         AS totale_ivato,
  ROUND(SUM(oi.price * oi.quantity) / 1.22, 2)                  AS imponibile,
  ROUND(SUM(oi.price * oi.quantity) - SUM(oi.price * oi.quantity) / 1.22, 2) AS iva_22,
  v.commission_pct                             AS commission_pct,
  ROUND(SUM(oi.price * oi.quantity) * (v.commission_pct / 100.0), 2) AS commissione_piattaforma,
  ROUND(SUM(oi.price * oi.quantity) * (1 - v.commission_pct / 100.0), 2) AS netto_vendor
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN vendors v ON v.id = oi.vendor_id
WHERE o.status IN ('processing', 'shipped', 'delivered')
GROUP BY oi.vendor_id, DATE_TRUNC('month', o.created_at), v.commission_pct;

CREATE VIEW public_product_sales_stats AS
SELECT
  oi.product_id,
  SUM(oi.quantity) AS total_sold
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.status IN ('processing', 'shipped', 'delivered')
GROUP BY oi.product_id;

CREATE VIEW public_active_category_sponsors AS
SELECT vendor_id, sponsored_category, expires_at
FROM promotions
WHERE package_id LIKE 'category_%'
  AND status = 'active'
  AND expires_at > NOW();
-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_uses ENABLE ROW LEVEL SECURITY;
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_promo_redemptions ENABLE ROW LEVEL SECURITY;

-- --- Policy: vendors ---
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON vendors;
CREATE POLICY "Enable insert for authenticated users" ON vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
DROP POLICY IF EXISTS "Users can read own vendor" ON vendors;
CREATE POLICY "Users can read own vendor" ON vendors FOR SELECT USING (profile_id = auth.uid());
DROP POLICY IF EXISTS "Users can insert own vendor" ON vendors;
CREATE POLICY "Users can insert own vendor" ON vendors
  FOR INSERT TO authenticated
  WITH CHECK (is_service_role() OR profile_id = auth.uid());
DROP POLICY IF EXISTS "Users can update own vendor" ON vendors;
CREATE POLICY "Users can update own vendor" ON vendors FOR UPDATE USING (profile_id = auth.uid());
DROP POLICY IF EXISTS "Public can view vendor storefronts" ON vendors;
CREATE POLICY "Public can view vendor storefronts" ON vendors
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can update any vendor" ON vendors;
CREATE POLICY "Admin can update any vendor" ON vendors
  FOR UPDATE USING (is_admin());

-- --- Policy: storage ---
DROP POLICY IF EXISTS "Public read product images" ON storage;
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
DROP POLICY IF EXISTS "Vendors can upload their product images" ON storage;
CREATE POLICY "Vendors can upload their product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.profile_id = auth.uid()
        AND vendors.id::text = (storage.foldername(name))[1]
    )
  );
DROP POLICY IF EXISTS "Vendors can delete their product images" ON storage;
CREATE POLICY "Vendors can delete their product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.profile_id = auth.uid()
        AND vendors.id::text = (storage.foldername(name))[1]
    )
  );
DROP POLICY IF EXISTS "Vendors can update their product images" ON storage;
CREATE POLICY "Vendors can update their product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.profile_id = auth.uid()
        AND vendors.id::text = (storage.foldername(name))[1]
    )
  );

-- --- Policy: orders ---
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
DROP POLICY IF EXISTS "Service role can insert orders" ON orders;
CREATE POLICY "Service role can insert orders" ON orders
  FOR INSERT WITH CHECK (is_service_role());
DROP POLICY IF EXISTS "Service role can update orders" ON orders;
CREATE POLICY "Service role can update orders" ON orders
  FOR UPDATE USING (is_service_role());
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (customer_id = auth.uid());
DROP POLICY IF EXISTS "Admin can view all orders" ON orders;
CREATE POLICY "Admin can view all orders" ON orders
  FOR SELECT USING (is_admin());

-- --- Policy: order_items ---
DROP POLICY IF EXISTS "Service role can insert order items" ON order_items;
CREATE POLICY "Service role can insert order items" ON order_items
  FOR INSERT WITH CHECK (is_service_role());
DROP POLICY IF EXISTS "Insert order items" ON order_items;
CREATE POLICY "Insert order items" ON order_items FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Vendor can view own order items" ON order_items;
CREATE POLICY "Vendor can view own order items" ON order_items
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
    OR order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );
DROP POLICY IF EXISTS "Vendor can update own order items" ON order_items;
CREATE POLICY "Vendor can update own order items" ON order_items
  FOR UPDATE USING (
    is_service_role()
    OR is_admin()
    OR vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
  );
DROP POLICY IF EXISTS "Service can delete order items" ON order_items;
CREATE POLICY "Service can delete order items" ON order_items
  FOR DELETE USING (is_service_role());

-- --- Policy: products ---
DROP POLICY IF EXISTS "Vendors can manage own products" ON products;
CREATE POLICY "Vendors can manage own products" ON products FOR ALL USING (
  vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
);
DROP POLICY IF EXISTS "Public can read published products" ON products;
CREATE POLICY "Public can read published products" ON products FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admin can manage any product" ON products;
CREATE POLICY "Admin can manage any product" ON products
  FOR ALL USING (is_admin());

-- --- Policy: wishlists ---
DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlists;
CREATE POLICY "Users can manage own wishlist" ON wishlists FOR ALL USING (user_id = auth.uid());

-- --- Policy: promotions ---
DROP POLICY IF EXISTS "Vendors can view own promotions" ON promotions;
CREATE POLICY "Vendors can view own promotions" ON promotions
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
  );
DROP POLICY IF EXISTS "Admin can view all promotions" ON promotions;
CREATE POLICY "Admin can view all promotions" ON promotions
  FOR SELECT USING (is_admin());

-- --- Policy: discount_codes ---
DROP POLICY IF EXISTS "Admin manages discount codes" ON discount_codes;
CREATE POLICY "Admin manages discount codes" ON discount_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );
DROP POLICY IF EXISTS "Public can read active codes" ON discount_codes;
CREATE POLICY "Public can read active codes" ON discount_codes
  FOR SELECT USING (is_active = true);

-- --- Policy: discount_code_uses ---
DROP POLICY IF EXISTS "Users can view own code uses" ON discount_code_uses;
CREATE POLICY "Users can view own code uses" ON discount_code_uses
  FOR SELECT USING (user_id = auth.uid());

-- --- Policy: returns ---
DROP POLICY IF EXISTS "Customer views own returns" ON returns;
CREATE POLICY "Customer views own returns" ON returns
  FOR SELECT USING (customer_id = auth.uid());
DROP POLICY IF EXISTS "Customer creates returns" ON returns;
CREATE POLICY "Customer creates returns" ON returns
  FOR INSERT WITH CHECK (customer_id = auth.uid());
DROP POLICY IF EXISTS "Customer cancels own returns" ON returns;
CREATE POLICY "Customer cancels own returns" ON returns
  FOR UPDATE USING (customer_id = auth.uid() AND status = 'pending');
DROP POLICY IF EXISTS "Vendor manages own returns" ON returns;
CREATE POLICY "Vendor manages own returns" ON returns
  FOR ALL USING (
    vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
  );

-- --- Policy: product_reviews ---
DROP POLICY IF EXISTS "Reviews visibili a tutti" ON product_reviews;
CREATE POLICY "Reviews visibili a tutti" ON product_reviews
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Utenti possono inserire recensioni" ON product_reviews;
CREATE POLICY "Utenti possono inserire recensioni" ON product_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Utenti possono eliminare proprie recensioni" ON product_reviews;
CREATE POLICY "Utenti possono eliminare proprie recensioni" ON product_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- --- Policy: profiles ---
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Service can insert profiles" ON profiles;
CREATE POLICY "Service can insert profiles" ON profiles
  FOR INSERT WITH CHECK (is_service_role() OR auth.uid() = id);
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (is_admin());
DROP POLICY IF EXISTS "Admin can update any profile" ON profiles;
CREATE POLICY "Admin can update any profile" ON profiles
  FOR UPDATE USING (is_admin());  -- corretto durante il consolidamento: usava una subquery
  -- ricorsiva su profiles invece di is_admin(), stesso bug di ricorsione infinita
  -- risolto altrove in 20260612000001_fix_rls_recursion (questa policy era sfuggita)

-- --- Policy: product_questions ---
DROP POLICY IF EXISTS "qa_select" ON product_questions;
CREATE POLICY "qa_select" ON product_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "qa_insert" ON product_questions;
CREATE POLICY "qa_insert" ON product_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
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

-- --- Policy: customer_addresses ---
DROP POLICY IF EXISTS "addr_all" ON customer_addresses;
CREATE POLICY "addr_all" ON customer_addresses FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- --- Policy: invoices ---
DROP POLICY IF EXISTS "inv_select" ON invoices;
CREATE POLICY "inv_select" ON invoices FOR SELECT USING (
  customer_id = auth.uid()
  OR vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
);
DROP POLICY IF EXISTS "inv_insert" ON invoices;
CREATE POLICY "inv_insert" ON invoices
  FOR INSERT WITH CHECK (is_service_role());

-- --- Policy: vendor_promo_codes ---
DROP POLICY IF EXISTS "promo_codes_select" ON vendor_promo_codes;
CREATE POLICY "promo_codes_select" ON vendor_promo_codes FOR SELECT USING (true);

-- --- Policy: vendor_promo_redemptions ---
DROP POLICY IF EXISTS "promo_redemptions_select_own" ON vendor_promo_redemptions;
CREATE POLICY "promo_redemptions_select_own" ON vendor_promo_redemptions
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
  );

-- =====================================================
-- STORAGE — bucket product-images
-- =====================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-images', 'product-images', true, 5242880,
        ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Vendors can upload their product images" ON storage.objects;
CREATE POLICY "Vendors can upload their product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.profile_id = auth.uid()
        AND vendors.id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Vendors can delete their product images" ON storage.objects;
CREATE POLICY "Vendors can delete their product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.profile_id = auth.uid()
        AND vendors.id::text = (storage.foldername(name))[1]
    )
  );

DROP POLICY IF EXISTS "Vendors can update their product images" ON storage.objects;
CREATE POLICY "Vendors can update their product images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'product-images'
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.vendors
      WHERE vendors.profile_id = auth.uid()
        AND vendors.id::text = (storage.foldername(name))[1]
    )
  );

-- Forza PostgREST a ricaricare lo schema
NOTIFY pgrst, 'reload schema';
