-- =====================================================
-- AZIONI ADMIN: rimborso manuale ordini + sospensione clienti
-- =====================================================

-- 1. SOSPENSIONE CLIENTI — flag rapido per la UI (il blocco vero e proprio
--    del login avviene lato Supabase Auth via service role, non con RLS)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_reason TEXT;

-- 2. RIMBORSO MANUALE ORDINI — tracciamento
--    Rimuove eventuali vincoli CHECK preesistenti su orders.status che non
--    includano 'refunded'/'partially_refunded' (stessa causa dell'errore
--    già visto su order_items.shipping_status).
DO $$
DECLARE
  constraint_name TEXT;
BEGIN
  SELECT con.conname INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'orders' AND con.contype = 'c' AND con.conname LIKE '%status%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE orders DROP CONSTRAINT %I', constraint_name);
  END IF;
END $$;

ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'partially_refunded'));

ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_amount NUMERIC(10,2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refund_reason TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT;
