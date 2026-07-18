-- =====================================================
-- TOKEN NOTIFICHE PUSH (APP NATIVE iOS/ANDROID)
-- =====================================================
-- Un utente può avere più dispositivi (telefono + tablet), quindi tabella
-- separata invece di un singolo campo su profiles.
-- =====================================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  device_token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, device_token)
);

ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "push_tokens_own" ON push_tokens;
CREATE POLICY "push_tokens_own" ON push_tokens
  FOR ALL USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "push_tokens_service" ON push_tokens;
CREATE POLICY "push_tokens_service" ON push_tokens
  FOR ALL USING (is_service_role());

NOTIFY pgrst, 'reload schema';
