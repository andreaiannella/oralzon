-- =====================================================
-- COMMISSIONE REALE 7% + FIX FEE STRIPE + CODICI PROMO VENDITORI
-- =====================================================

-- Commissione configurabile per vendor (default 7%, permette accordi futuri su misura)
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS commission_pct NUMERIC(5,2) DEFAULT 7.00;
UPDATE vendors SET commission_pct = 7.00 WHERE commission_pct IS NULL;

-- Ricrea la vista fiscale con la commissione reale per vendor (non più hardcoded al 5%)
-- NB: DROP prima di CREATE perché CREATE OR REPLACE VIEW non permette di inserire
-- una colonna nuova in mezzo a quelle esistenti (solo in fondo) — droppare evita l'errore.
DROP VIEW IF EXISTS vendor_fiscal_summary;
CREATE VIEW vendor_fiscal_summary AS
SELECT
  oi.vendor_id,
  DATE_TRUNC('month', o.created_at) AS periodo,
  COUNT(DISTINCT o.id)              AS num_ordini,
  COUNT(oi.id)                      AS num_items,
  SUM(oi.price * oi.quantity)       AS imponibile,
  ROUND(SUM(oi.price * oi.quantity) * 0.22, 2) AS iva_22,
  ROUND(SUM(oi.price * oi.quantity) * 1.22, 2) AS totale_ivato,
  v.commission_pct                             AS commission_pct,
  ROUND(SUM(oi.price * oi.quantity) * (v.commission_pct / 100.0), 2) AS commissione_piattaforma,
  ROUND(SUM(oi.price * oi.quantity) * (1 - v.commission_pct / 100.0), 2) AS netto_vendor
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
JOIN vendors v ON v.id = oi.vendor_id
WHERE o.status IN ('processing', 'shipped', 'delivered')
GROUP BY oi.vendor_id, DATE_TRUNC('month', o.created_at), v.commission_pct;

-- =====================================================
-- CODICI PROMO VENDITORI — es. "6 mesi di abbonamento gratis"
-- =====================================================
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

-- Traccia quali vendor hanno usato quale codice (evita riutilizzi multipli dallo stesso account)
CREATE TABLE IF NOT EXISTS vendor_promo_redemptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  promo_code_id UUID REFERENCES vendor_promo_codes(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id)  -- un vendor può riscattare un solo codice promo, mai due volte
);

ALTER TABLE vendor_promo_codes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promo_codes_select" ON vendor_promo_codes;
CREATE POLICY "promo_codes_select" ON vendor_promo_codes FOR SELECT USING (true);

-- RLS su vendor_promo_redemptions: scritta solo dall'edge function (service role,
-- che bypassa sempre RLS). Da client, un vendor può solo vedere la propria riga.
ALTER TABLE vendor_promo_redemptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "promo_redemptions_select_own" ON vendor_promo_redemptions;
CREATE POLICY "promo_redemptions_select_own" ON vendor_promo_redemptions
  FOR SELECT USING (
    vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
  );

-- Codice di lancio d'esempio — 6 mesi (180 giorni) gratis, uso illimitato per ora
INSERT INTO vendor_promo_codes (code, description, extends_trial_days, active)
VALUES ('LANCIO6MESI', 'Promo lancio: 6 mesi di abbonamento gratuito per i primi venditori', 180, true)
ON CONFLICT (code) DO NOTHING;
