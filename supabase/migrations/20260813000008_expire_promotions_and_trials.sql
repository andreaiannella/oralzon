-- Scadenze: sponsorizzazioni e periodo di prova.
-- Applicata in produzione il 13/08/2026.
--
-- PROBLEMA 1 - LE SPONSORIZZAZIONI NON SCADEVANO MAI DAVVERO. Al pagamento
-- vengono impostati is_sponsored/is_hero_sponsored = true e
-- promo_expires_at, ma nessuno rimetteva quei flag a false alla scadenza:
-- l'unico posto che li spegneva era il rimborso manuale da pannello admin.
-- La home filtrava per data, ma il catalogo ordinava per is_sponsored senza
-- guardarla: si pagava 29 euro una volta e si restava primi per sempre.
--
-- PROBLEMA 2 - IL PERIODO DI PROVA NON SCADEVA MAI. trial_ends_at veniva
-- impostato alla registrazione ma nessun controllo lato server lo leggeva:
-- il checkout verificava solo plan_status 'suspended'. Un venditore con
-- prova scaduta vendeva all'infinito senza pagare l'abbonamento.
CREATE OR REPLACE FUNCTION expire_promotions_and_trials()
RETURNS TABLE (promo_products integer, promo_vendors integer, promotions_closed integer, trials_expired integer)
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_products integer := 0; v_vendors integer := 0; v_promos integer := 0; v_trials integer := 0;
BEGIN
  WITH upd AS (
    UPDATE products SET is_sponsored = false, is_hero_sponsored = false, promo_expires_at = NULL
    WHERE promo_expires_at IS NOT NULL AND promo_expires_at < now() AND (is_sponsored OR is_hero_sponsored)
    RETURNING id) SELECT count(*) INTO v_products FROM upd;

  WITH upd AS (
    UPDATE vendors SET homepage_sponsored = false, homepage_expires_at = NULL
    WHERE homepage_expires_at IS NOT NULL AND homepage_expires_at < now() AND homepage_sponsored
    RETURNING id) SELECT count(*) INTO v_vendors FROM upd;

  WITH upd AS (
    UPDATE promotions SET status = 'expired'
    WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < now()
    RETURNING id) SELECT count(*) INTO v_promos FROM upd;

  -- NON tocca chi ha gia' un piano a pagamento attivo: paga, quindi
  -- trial_ends_at per lui e' solo un residuo storico senza significato.
  WITH upd AS (
    UPDATE vendors SET plan_status = 'expired'
    WHERE plan_type = 'trial' AND plan_status = 'active'
      AND trial_ends_at IS NOT NULL AND trial_ends_at < now()
    RETURNING id) SELECT count(*) INTO v_trials FROM upd;

  RETURN QUERY SELECT v_products, v_vendors, v_promos, v_trials;
END; $$;

CREATE INDEX IF NOT EXISTS idx_products_promo_expiring ON products(promo_expires_at) WHERE promo_expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vendors_trial_expiring ON vendors(trial_ends_at) WHERE plan_type = 'trial';
