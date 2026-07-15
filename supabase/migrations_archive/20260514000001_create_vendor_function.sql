-- =====================================================
-- FUNZIONE DATABASE PER CREARE VENDOR
-- =====================================================
-- Questa funzione bypassa RLS usando SECURITY DEFINER
-- Permette creazione vendor senza problemi di policy

-- Drop funzione se esiste
DROP FUNCTION IF EXISTS create_vendor_for_user;

-- Crea funzione
CREATE OR REPLACE FUNCTION create_vendor_for_user(
  p_business_name TEXT,
  p_plan_type TEXT,
  p_product_limit INTEGER
)
RETURNS vendors
LANGUAGE plpgsql
SECURITY DEFINER -- ✅ Bypassa RLS
SET search_path = public
AS $$
DECLARE
  v_vendor vendors;
BEGIN
  -- Verifica che l'utente sia autenticato
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Non autenticato';
  END IF;

  -- Verifica che non esista già un vendor per questo utente
  SELECT * INTO v_vendor
  FROM vendors
  WHERE profile_id = auth.uid();

  IF v_vendor.id IS NOT NULL THEN
    -- Vendor già esiste, ritornalo
    RETURN v_vendor;
  END IF;

  -- Crea nuovo vendor
  INSERT INTO vendors (
    profile_id,
    business_name,
    plan_type,
    plan_status,
    product_limit,
    verified_badge
  ) VALUES (
    auth.uid(),
    p_business_name,
    p_plan_type,
    'active',
    p_product_limit,
    false
  )
  RETURNING * INTO v_vendor;

  RETURN v_vendor;
END;
$$;

-- Permetti a tutti gli utenti autenticati di chiamare questa funzione
GRANT EXECUTE ON FUNCTION create_vendor_for_user TO authenticated;
