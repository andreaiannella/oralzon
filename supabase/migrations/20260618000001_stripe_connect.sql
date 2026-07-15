-- =====================================================
-- STRIPE CONNECT — Automazione pagamenti marketplace
-- =====================================================
-- Architettura: Express accounts + Separate Charges and Transfers.
-- Il cliente paga SEMPRE Oralzon (un unico addebito, anche con più
-- venditori nel carrello). Dopo la conferma di consegna, Oralzon trasferisce
-- a ciascun venditore la sua quota (al netto della commissione) sul suo
-- conto Stripe Express collegato.
-- =====================================================

-- ── Vendors: stato del collegamento Stripe Connect ──────────────────────────
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS stripe_account_id TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS stripe_charges_enabled BOOLEAN DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS stripe_payouts_enabled BOOLEAN DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS stripe_details_submitted BOOLEAN DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS stripe_onboarding_completed_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_vendors_stripe_account_id ON vendors(stripe_account_id) WHERE stripe_account_id IS NOT NULL;

-- ── Order items: tracciamento del trasferimento al venditore ───────────────
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS transfer_id TEXT;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMPTZ;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- ── Ledger dei trasferimenti (fonte di verità locale, riconciliabile col
-- report fiscale — Stripe è la fonte di verità sui soldi, questa tabella
-- sulla loro storia) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vendor_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendors(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  order_item_id UUID REFERENCES order_items(id),
  gross_amount NUMERIC(10,2) NOT NULL,
  commission_amount NUMERIC(10,2) NOT NULL,
  net_amount NUMERIC(10,2) NOT NULL,
  stripe_transfer_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'reversed', 'partially_reversed', 'failed')),
  reversed_amount NUMERIC(10,2) DEFAULT 0,
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_transfers_vendor ON vendor_transfers(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vendor_transfers_order ON vendor_transfers(order_id);

ALTER TABLE vendor_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendor can view own transfers" ON vendor_transfers;
CREATE POLICY "Vendor can view own transfers" ON vendor_transfers
  FOR SELECT USING (
    is_admin()
    OR vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service manages transfers" ON vendor_transfers;
CREATE POLICY "Service manages transfers" ON vendor_transfers
  FOR ALL USING (is_service_role()) WITH CHECK (is_service_role());

NOTIFY pgrst, 'reload schema';
