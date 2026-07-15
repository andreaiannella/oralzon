-- =====================================================
-- AGGIUNGI COLONNE MANCANTI A PROFILES
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cognome TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS telefono TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ragione_sociale TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS partita_iva TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS codice_fiscale TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pec TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS codice_sdi TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS indirizzo_spedizione_via TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS indirizzo_spedizione_citta TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS indirizzo_spedizione_provincia TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS indirizzo_spedizione_cap TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS indirizzo_fatturazione_via TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS indirizzo_fatturazione_citta TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS indirizzo_fatturazione_provincia TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS indirizzo_fatturazione_cap TEXT;

-- Aggiorna profili esistenti con nome/cognome da email se vuoti
UPDATE profiles 
SET nome = SPLIT_PART(email, '@', 1), cognome = '-'
WHERE (nome IS NULL OR nome = '') AND email IS NOT NULL;

-- RLS: utenti possono aggiornare il proprio profilo
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS: utenti possono leggere il proprio profilo  
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
