-- =====================================================
-- RETURNS SYSTEM: Gestione resi B2B
-- =====================================================

CREATE TABLE IF NOT EXISTS returns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  
  -- Motivo e dettagli
  reason TEXT NOT NULL CHECK (reason IN ('wrong_item', 'defective', 'damaged_shipping', 'not_as_described')),
  description TEXT NOT NULL,
  
  -- Stato del reso
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','shipped_back','received','refunded','cancelled')),
  
  -- Decisione del venditore
  vendor_notes TEXT,
  restocking_fee_pct INTEGER DEFAULT 0,  -- % trattenuta (es. 15)
  refund_amount NUMERIC(10,2),           -- importo finale rimborsato
  
  -- Logistics
  return_tracking TEXT,          -- tracking del reso
  return_label_url TEXT,         -- etichetta di spedizione
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_returns_customer ON returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_vendor ON returns(vendor_id);
CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);

ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

-- Cliente: vede solo i propri resi
DROP POLICY IF EXISTS "Customer views own returns" ON returns;
CREATE POLICY "Customer views own returns" ON returns
  FOR SELECT USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "Customer creates returns" ON returns;
CREATE POLICY "Customer creates returns" ON returns
  FOR INSERT WITH CHECK (customer_id = auth.uid());

DROP POLICY IF EXISTS "Customer cancels own returns" ON returns;
CREATE POLICY "Customer cancels own returns" ON returns
  FOR UPDATE USING (customer_id = auth.uid() AND status = 'pending');

-- Vendor: vede e gestisce i resi dei propri prodotti
DROP POLICY IF EXISTS "Vendor manages own returns" ON returns;
CREATE POLICY "Vendor manages own returns" ON returns
  FOR ALL USING (
    vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
  );

-- Aggiorna updated_at automaticamente
CREATE OR REPLACE FUNCTION update_returns_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trigger_returns_updated ON returns;
CREATE TRIGGER trigger_returns_updated BEFORE UPDATE ON returns
  FOR EACH ROW EXECUTE FUNCTION update_returns_timestamp();
