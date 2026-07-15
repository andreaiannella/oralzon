-- =====================================================
-- MESSAGGISTICA VENDOR-CLIENTE
-- =====================================================

-- Conversazioni (una per ordine-vendor-cliente)
CREATE TABLE IF NOT EXISTS conversations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID REFERENCES orders(id) ON DELETE SET NULL,
  customer_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id     UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  subject       TEXT NOT NULL DEFAULT 'Messaggio ordine',
  last_message  TEXT,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  customer_unread INTEGER DEFAULT 0,
  vendor_unread   INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Messaggi
CREATE TABLE IF NOT EXISTS messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_type     TEXT NOT NULL CHECK (sender_type IN ('customer', 'vendor')),
  content         TEXT NOT NULL,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_vendor   ON conversations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv          ON messages(conversation_id);

-- RLS conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clienti vedono proprie conversazioni"  ON conversations;
DROP POLICY IF EXISTS "Vendor vedono proprie conversazioni"   ON conversations;
DROP POLICY IF EXISTS "Clienti creano conversazioni"          ON conversations;
DROP POLICY IF EXISTS "Tutti aggiornano proprie conversazioni" ON conversations;

CREATE POLICY "Clienti vedono proprie conversazioni" ON conversations
  FOR SELECT USING (customer_id = auth.uid());

CREATE POLICY "Vendor vedono proprie conversazioni" ON conversations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_id AND v.profile_id = auth.uid())
  );

CREATE POLICY "Clienti creano conversazioni" ON conversations
  FOR INSERT WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Tutti aggiornano proprie conversazioni" ON conversations
  FOR UPDATE USING (
    customer_id = auth.uid() OR
    EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_id AND v.profile_id = auth.uid())
  );

-- RLS messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Utenti vedono messaggi proprie conversazioni" ON messages;
DROP POLICY IF EXISTS "Utenti inviano messaggi proprie conversazioni" ON messages;

CREATE POLICY "Utenti vedono messaggi proprie conversazioni" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.customer_id = auth.uid()
          OR EXISTS (SELECT 1 FROM vendors v WHERE v.id = c.vendor_id AND v.profile_id = auth.uid()))
    )
  );

CREATE POLICY "Utenti inviano messaggi proprie conversazioni" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (c.customer_id = auth.uid()
          OR EXISTS (SELECT 1 FROM vendors v WHERE v.id = c.vendor_id AND v.profile_id = auth.uid()))
    )
  );

-- =====================================================
-- REPORT FISCALI: vista aggregata ordini per vendor
-- =====================================================

-- Vista fatturabile per vendor (usata dai report)
CREATE OR REPLACE VIEW vendor_fiscal_summary AS
SELECT
  oi.vendor_id,
  DATE_TRUNC('month', o.created_at) AS periodo,
  COUNT(DISTINCT o.id)              AS num_ordini,
  COUNT(oi.id)                      AS num_items,
  SUM(oi.price * oi.quantity)       AS imponibile,
  ROUND(SUM(oi.price * oi.quantity) * 0.22, 2) AS iva_22,
  ROUND(SUM(oi.price * oi.quantity) * 1.22, 2) AS totale_ivato,
  -- commissione piattaforma (5%)
  ROUND(SUM(oi.price * oi.quantity) * 0.05, 2) AS commissione_piattaforma,
  ROUND(SUM(oi.price * oi.quantity) * 0.95, 2) AS netto_vendor
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.status IN ('processing', 'shipped', 'delivered')
GROUP BY oi.vendor_id, DATE_TRUNC('month', o.created_at);
