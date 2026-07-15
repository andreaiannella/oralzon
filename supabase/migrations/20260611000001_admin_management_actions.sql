-- =====================================================
-- AZIONI DIRETTE ADMIN: sospensione clienti + rimborsi manuali
-- =====================================================

-- Traccia lo stato di sospensione di un account (mostrato nell'admin,
-- il blocco vero e proprio del login avviene via Supabase Auth ban)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;

-- L'admin deve poter aggiornare il flag di sospensione su qualsiasi profilo
DROP POLICY IF EXISTS "Admin can update any profile" ON profiles;
CREATE POLICY "Admin can update any profile" ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.user_type = 'admin')
  );

-- Traccia il rimborso amministrativo su un ordine (chi, quando, quanto)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_refund_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_refunded_at TIMESTAMPTZ;

-- Traccia il rimborso amministrativo su una promozione
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS admin_refund_id TEXT;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS admin_refunded_at TIMESTAMPTZ;
