-- =====================================================
-- DISCOUNT CODES: Codici sconto admin
-- =====================================================

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

CREATE TABLE IF NOT EXISTS discount_code_uses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code_id UUID REFERENCES discount_codes(id),
  user_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  discount_amount NUMERIC(10,2),
  used_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_uses ENABLE ROW LEVEL SECURITY;

-- Solo admin può gestire i codici
CREATE POLICY "Admin manages discount codes" ON discount_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

-- Tutti possono leggere i codici attivi (per validarli al checkout)
DROP POLICY IF EXISTS "Public can read active codes" ON discount_codes;
CREATE POLICY "Public can read active codes" ON discount_codes
  FOR SELECT USING (is_active = true);

-- Tracciamento usi
CREATE POLICY "Users can view own code uses" ON discount_code_uses
  FOR SELECT USING (user_id = auth.uid());

-- Indici
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active, expires_at);

-- Aggiungi colonna discount a orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
