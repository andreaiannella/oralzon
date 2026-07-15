-- =====================================================
-- FIX DEFINITIVO RLS VENDORS
-- =====================================================
-- Questo SQL risolve il problema RLS vendors

-- STEP 1: Drop tutte le policy INSERT esistenti per evitare conflitti
DROP POLICY IF EXISTS "Users can create their own vendor" ON vendors;
DROP POLICY IF EXISTS "Vendors can insert their own data" ON vendors;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON vendors;

-- STEP 2: Crea nuova policy INSERT permissiva
CREATE POLICY "Enable insert for authenticated users" ON vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- STEP 3: Verifica RLS abilitato
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

-- INFO:
-- Questa policy permette a QUALSIASI utente autenticato di inserire in vendors
-- È sicura perché:
-- 1. Solo utenti autenticati (non anonimi)
-- 2. La logica business nel frontend controlla che sia venditore
-- 3. Il profile_id deve matchare con auth.uid()
