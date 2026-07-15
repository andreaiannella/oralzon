-- Fix 1: Aggiungi 'trial' al check constraint del plan_type
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_plan_type_check;
ALTER TABLE vendors ADD CONSTRAINT vendors_plan_type_check 
  CHECK (plan_type IN ('trial', 'professional', 'enterprise'));

-- Fix 2: Aggiungi unique constraint su profile_id (mancava)
ALTER TABLE vendors DROP CONSTRAINT IF EXISTS vendors_profile_id_key;
ALTER TABLE vendors ADD CONSTRAINT vendors_profile_id_key UNIQUE (profile_id);

-- Fix 3: Crea il vendor per test@test.test se non esiste
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'test@test.test' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET user_type = 'venditore' WHERE id = v_user_id;
    INSERT INTO vendors (profile_id, business_name, plan_type, plan_status, product_limit, verified_badge, trial_ends_at)
    VALUES (v_user_id, 'Il mio Store', 'trial', 'active', 999999, false, NOW() + INTERVAL '7 days')
    ON CONFLICT (profile_id) DO NOTHING;
    RAISE NOTICE 'OK vendor per test@test.test';
  END IF;
END $$;

-- Fix 4: Stessa cosa per andreaiannella5@gmail.com  
DO $$
DECLARE v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'andreaiannella5@gmail.com' LIMIT 1;
  IF v_user_id IS NOT NULL THEN
    UPDATE profiles SET user_type = 'venditore' WHERE id = v_user_id;
    INSERT INTO vendors (profile_id, business_name, plan_type, plan_status, product_limit, verified_badge, trial_ends_at)
    VALUES (v_user_id, 'Il mio Store Admin', 'trial', 'active', 999999, false, NOW() + INTERVAL '7 days')
    ON CONFLICT (profile_id) DO NOTHING;
    RAISE NOTICE 'OK vendor per andreaiannella5@gmail.com';
  END IF;
END $$;
