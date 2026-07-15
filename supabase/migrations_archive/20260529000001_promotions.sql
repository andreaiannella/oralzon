-- =====================================================
-- PROMOTIONS: Visibilità a pagamento
-- =====================================================

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

CREATE INDEX IF NOT EXISTS idx_promotions_vendor ON promotions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status_expires ON promotions(status, expires_at);

ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vendors can view own promotions" ON promotions
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
  );

-- Aggiorna prodotti scaduti ogni notte (opzionale, via cron)
-- Per ora l'app controlla expires_at in tempo reale

-- Prodotti sponsorizzati: aggiunge colonna promo_expires
ALTER TABLE products ADD COLUMN IF NOT EXISTS promo_expires_at TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS homepage_sponsored BOOLEAN DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS homepage_expires_at TIMESTAMPTZ;

-- Profili: aggiungi campi mancanti per UserProfile
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS province TEXT;
