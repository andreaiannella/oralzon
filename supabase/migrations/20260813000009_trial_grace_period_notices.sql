-- Periodo di tolleranza e preavvisi sulla scadenza della prova.
-- Applicata in produzione il 13/08/2026.
--
-- Il blocco immediato alla scadenza era troppo brusco: un venditore che
-- trova il negozio spento senza preavviso spesso non torna. La sospensione
-- arriva ora 7 giorni DOPO la scadenza, preceduta da tre comunicazioni:
--   -7 giorni -> promemoria prima della scadenza
--   +2 giorni -> prova finita, negozio ancora attivo
--   +7 giorni -> sospensione applicata
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS trial_notice_stage smallint NOT NULL DEFAULT 0;
COMMENT ON COLUMN vendors.trial_notice_stage IS '0 = nessun avviso | 1 = preavviso -7gg | 2 = avviso +2gg | 3 = avviso finale +7gg, account sospeso';

CREATE INDEX IF NOT EXISTS idx_vendors_trial_notices
  ON vendors(trial_notice_stage, trial_ends_at) WHERE plan_type = 'trial';

-- La sospensione ora richiede sia i 7 giorni di tolleranza sia che il terzo
-- avviso sia gia' partito: non si blocca mai nessuno che non sia stato
-- avvisato tre volte.
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
  WITH upd AS (
    UPDATE vendors SET plan_status = 'expired'
    WHERE plan_type = 'trial' AND plan_status = 'active'
      AND trial_ends_at IS NOT NULL AND trial_ends_at < now() - interval '7 days'
      AND trial_notice_stage >= 3
    RETURNING id) SELECT count(*) INTO v_trials FROM upd;
  RETURN QUERY SELECT v_products, v_vendors, v_promos, v_trials;
END; $$;
