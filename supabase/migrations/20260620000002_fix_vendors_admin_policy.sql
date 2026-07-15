-- =====================================================
-- FIX: l'admin non può modificare i venditori
-- =====================================================
-- Bug reale: la tabella vendors non aveva NESSUNA policy che permettesse
-- all'admin di scrivere. "Approva" e "Sospendi" venditore dal pannello admin
-- venivano bloccati in silenzio dalle RLS — nessun errore visibile, la
-- scrittura semplicemente non aveva effetto (0 righe modificate).
-- =====================================================

DROP POLICY IF EXISTS "Admin can update any vendor" ON vendors;
CREATE POLICY "Admin can update any vendor" ON vendors
  FOR UPDATE USING (is_admin());

NOTIFY pgrst, 'reload schema';
