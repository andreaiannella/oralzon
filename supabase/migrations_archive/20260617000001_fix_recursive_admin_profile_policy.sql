-- =====================================================
-- FIX: policy "Admin can update any profile" ricorsiva
-- =====================================================
-- Scoperta durante il consolidamento delle migration (punto 7 dell'audit).
-- Questa policy, creata in 20260611000001_admin_management_actions, usa una
-- subquery che interroga "profiles" DALL'INTERNO di una policy su "profiles"
-- stessa — esattamente il bug di ricorsione infinita risolto il giorno dopo
-- in 20260612000001_fix_rls_recursion per le altre 5 policy admin. Questa è
-- sfuggita al fix. Effetto pratico: un admin che prova a modificare il
-- profilo di un utente (es. dalla dashboard admin) molto probabilmente
-- fallisce silenziosamente.
-- =====================================================

DROP POLICY IF EXISTS "Admin can update any profile" ON profiles;
CREATE POLICY "Admin can update any profile" ON profiles
  FOR UPDATE USING (is_admin());

NOTIFY pgrst, 'reload schema';
