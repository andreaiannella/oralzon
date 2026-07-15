-- =====================================================
-- TRIAL SYSTEM: 7 giorni gratuiti per i vendor
-- =====================================================

-- Aggiunge colonna trial_ends_at ai vendor
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- I vendor esistenti senza piano reale ricevono un trial retroattivo
UPDATE vendors 
SET trial_ends_at = created_at + INTERVAL '7 days',
    plan_type = 'trial'
WHERE plan_type NOT IN ('professional', 'enterprise')
  AND trial_ends_at IS NULL;

-- Funzione per verificare se il vendor può operare
CREATE OR REPLACE FUNCTION vendor_is_active(vendor_profile_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_record RECORD;
BEGIN
  SELECT plan_type, plan_status, trial_ends_at 
  INTO v_record
  FROM vendors 
  WHERE profile_id = vendor_profile_id;
  
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF v_record.plan_status = 'suspended' THEN RETURN FALSE; END IF;
  IF v_record.plan_type IN ('professional', 'enterprise') 
     AND v_record.plan_status = 'active' THEN RETURN TRUE; END IF;
  IF v_record.plan_type = 'trial' 
     AND v_record.trial_ends_at > NOW() THEN RETURN TRUE; END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;
