-- =====================================================
-- FEATURE AMAZON-STYLE per DentalClean
-- =====================================================

-- 1. Q&A PRODOTTO (domande e risposte pubbliche)
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
ALTER TABLE product_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qa_select" ON product_questions;
DROP POLICY IF EXISTS "qa_insert" ON product_questions;
DROP POLICY IF EXISTS "qa_update" ON product_questions;
CREATE POLICY "qa_select" ON product_questions FOR SELECT USING (true);
CREATE POLICY "qa_insert" ON product_questions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "qa_update" ON product_questions FOR UPDATE USING (true);

-- 2. MULTI-INDIRIZZO cliente
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
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "addr_all" ON customer_addresses;
CREATE POLICY "addr_all" ON customer_addresses FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. VALUTAZIONE VENDITORE (seller rating separato dal prodotto)
CREATE TABLE IF NOT EXISTS vendor_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  shipping_speed INTEGER CHECK (shipping_speed BETWEEN 1 AND 5),
  communication INTEGER CHECK (communication BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, user_id, order_id)
);
ALTER TABLE vendor_ratings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "vr_select" ON vendor_ratings;
DROP POLICY IF EXISTS "vr_insert" ON vendor_ratings;
CREATE POLICY "vr_select" ON vendor_ratings FOR SELECT USING (true);
CREATE POLICY "vr_insert" ON vendor_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Aggrega rating vendor come colonne calcolate su vendors
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS avg_rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

-- Trigger aggiorna media rating vendor
CREATE OR REPLACE FUNCTION update_vendor_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vendors SET
    avg_rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM vendor_ratings WHERE vendor_id = NEW.vendor_id),
    rating_count = (SELECT COUNT(*) FROM vendor_ratings WHERE vendor_id = NEW.vendor_id)
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS trg_vendor_rating ON vendor_ratings;
CREATE TRIGGER trg_vendor_rating AFTER INSERT ON vendor_ratings
  FOR EACH ROW EXECUTE FUNCTION update_vendor_rating();

-- 4. Aggiungi campi coupon a orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;

-- 5. Fatture (numero progressivo)
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
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inv_select" ON invoices;
CREATE POLICY "inv_select" ON invoices FOR SELECT USING (
  customer_id = auth.uid()
  OR vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
);
DROP POLICY IF EXISTS "inv_insert" ON invoices;
CREATE POLICY "inv_insert" ON invoices FOR INSERT WITH CHECK (true);

-- =====================================================
-- STORE IN EVIDENZA — campi vetrina pubblica venditore
-- =====================================================
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS store_description TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS main_category TEXT;

CREATE INDEX IF NOT EXISTS idx_vendors_homepage_active ON vendors(homepage_sponsored, homepage_expires_at) WHERE homepage_sponsored = true;

-- =====================================================
-- RISPOSTA VENDITORE ALLE RECENSIONI
-- =====================================================
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS vendor_reply TEXT;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS vendor_reply_at TIMESTAMPTZ;

-- =====================================================
-- SEMPLIFICAZIONE STATI ORDINE + CORRIERE SPEDIZIONE
-- =====================================================

-- Il vincolo CHECK esistente su shipping_status non includeva 'confirmed'.
-- Lo ricreiamo con tutti i valori usati dall'app (vecchi e nuovi, per sicurezza).
ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_shipping_status_check;
ALTER TABLE order_items ADD CONSTRAINT order_items_shipping_status_check
  CHECK (shipping_status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled'));

-- Aggiungi colonna corriere agli order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS carrier TEXT;

-- Aggiorna il trigger: quando l'ordine passa a 'processing' (pagamento confermato),
-- imposta ANCHE shipping_status='confirmed' sugli order_items (era 'pending')
CREATE OR REPLACE FUNCTION decrement_stock_on_order_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'processing' AND OLD.status = 'pending' THEN
    UPDATE products p
    SET stock = GREATEST(0, p.stock - oi.quantity)
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND p.id = oi.product_id;

    -- Conferma automaticamente tutti gli item dell'ordine (stato "Confermato")
    UPDATE order_items
    SET shipping_status = 'confirmed'
    WHERE order_id = NEW.id
      AND shipping_status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aggiorna anche gli ordini esistenti già pagati ma rimasti a 'pending' sullo shipping_status
UPDATE order_items oi
SET shipping_status = 'confirmed'
FROM orders o
WHERE oi.order_id = o.id
  AND o.status = 'processing'
  AND oi.shipping_status = 'pending';
