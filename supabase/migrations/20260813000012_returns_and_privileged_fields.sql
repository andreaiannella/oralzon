-- Applicata in produzione il 13/08/2026. Due problemi dall'audit di resi e
-- pannello admin.

-- 1) RESI: nessuna scrittura diretta dai client.
-- Le policy di scrittura non limitavano QUALI colonne fossero modificabili.
--  - "Customer cancels own returns" lasciava al cliente modificare qualsiasi
--    campo della propria richiesta in attesa, incluso refund_amount, che
--    returns/decision usa come TETTO massimo rimborsabile: gonfiandolo si
--    poteva farsi autorizzare un rimborso oltre il dovuto (si fermava solo
--    perche' Stripe rifiuta di rimborsare piu' dell'incassato -- l'ultima
--    difesa era di un fornitore esterno, non nostra).
--  - "Vendor manages own returns" (ALL) lasciava al venditore portare un
--    reso a status 'refunded' senza che alcun rimborso Stripe fosse partito.
-- Nessuna pagina del frontend scrive su questa tabella (verificato): tutto
-- passa gia' da returns/request e returns/decision, che ricalcolano gli
-- importi lato server. Le policy erano solo superficie d'attacco.
DROP POLICY IF EXISTS "Customer cancels own returns" ON returns;
DROP POLICY IF EXISTS "Vendor manages own returns" ON returns;
CREATE POLICY "Vendor views own returns" ON returns FOR SELECT TO authenticated
  USING (vendor_id IN (SELECT vendors.id FROM vendors WHERE vendors.profile_id = auth.uid()));

-- 2) CAMPI PRIVILEGIATI (il problema piu' grave dell'audit).
-- Le policy di UPDATE su vendors e products autorizzavano il venditore sulla
-- PROPRIA riga senza limitare le colonne. Con una chiamata API diretta un
-- venditore poteva riscriversi commission_pct a 0, plan_type/plan_status,
-- trial_ends_at, verified_badge, homepage_sponsored, is_sponsored,
-- is_hero_sponsored: tutti e tre i pilastri di ricavo aggirabili da chi
-- avrebbe dovuto pagarli, e il badge di affidabilita' auto-attribuibile.
-- Trigger e non policy: RLS ragiona per riga, non per colonna.
CREATE OR REPLACE FUNCTION is_privileged_writer()
RETURNS boolean LANGUAGE plpgsql STABLE AS $$
DECLARE claims text;
BEGIN
  IF is_service_role() OR is_admin() THEN RETURN true; END IF;
  -- NON usare current_user: dentro un trigger SECURITY DEFINER vale sempre
  -- il proprietario (postgres), quindi tornerebbe sempre true e la
  -- protezione sarebbe spenta pur sembrando attiva (errore gia' commesso e
  -- scoperto solo simulando davvero un venditore nel test).
  claims := coalesce(current_setting('request.jwt.claims', true), '');
  IF claims = '' OR claims = 'null' THEN RETURN true; END IF; -- connessione SQL diretta
  RETURN false;
EXCEPTION WHEN OTHERS THEN RETURN false; -- nel dubbio si nega
END; $$;

CREATE OR REPLACE FUNCTION protect_vendor_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF is_privileged_writer() THEN RETURN NEW; END IF;
  IF NEW.commission_pct IS DISTINCT FROM OLD.commission_pct
     OR NEW.plan_type IS DISTINCT FROM OLD.plan_type
     OR NEW.plan_status IS DISTINCT FROM OLD.plan_status
     OR NEW.product_limit IS DISTINCT FROM OLD.product_limit
     OR NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at
     OR NEW.trial_notice_stage IS DISTINCT FROM OLD.trial_notice_stage
     OR NEW.verified_badge IS DISTINCT FROM OLD.verified_badge
     OR NEW.homepage_sponsored IS DISTINCT FROM OLD.homepage_sponsored
     OR NEW.homepage_expires_at IS DISTINCT FROM OLD.homepage_expires_at
     OR NEW.uses_platform_shipping IS DISTINCT FROM OLD.uses_platform_shipping
     OR NEW.sendcloud_sender_address_id IS DISTINCT FROM OLD.sendcloud_sender_address_id
     OR NEW.stripe_account_id IS DISTINCT FROM OLD.stripe_account_id
     OR NEW.stripe_charges_enabled IS DISTINCT FROM OLD.stripe_charges_enabled
     OR NEW.stripe_payouts_enabled IS DISTINCT FROM OLD.stripe_payouts_enabled
     OR NEW.vies_validated IS DISTINCT FROM OLD.vies_validated
  THEN RAISE EXCEPTION 'Non puoi modificare piano, commissione, badge di verifica o stato delle sponsorizzazioni: sono impostati dalla piattaforma.'
    USING ERRCODE = 'insufficient_privilege'; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_protect_vendor_privileged ON vendors;
CREATE TRIGGER trg_protect_vendor_privileged BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION protect_vendor_privileged_fields();

CREATE OR REPLACE FUNCTION protect_product_privileged_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF is_privileged_writer() THEN RETURN NEW; END IF;
  IF NEW.is_sponsored IS DISTINCT FROM OLD.is_sponsored
     OR NEW.is_hero_sponsored IS DISTINCT FROM OLD.is_hero_sponsored
     OR NEW.promo_expires_at IS DISTINCT FROM OLD.promo_expires_at
  THEN RAISE EXCEPTION 'Le sponsorizzazioni si attivano acquistando un pacchetto dalla sezione Promozioni.'
    USING ERRCODE = 'insufficient_privilege'; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_protect_product_privileged ON products;
CREATE TRIGGER trg_protect_product_privileged BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION protect_product_privileged_fields();

-- Senza questo, il blocco sull'update si aggira creando il prodotto gia'
-- sponsorizzato.
CREATE OR REPLACE FUNCTION protect_product_insert_privileged()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF is_privileged_writer() THEN RETURN NEW; END IF;
  IF coalesce(NEW.is_sponsored,false) OR coalesce(NEW.is_hero_sponsored,false)
  THEN RAISE EXCEPTION 'Le sponsorizzazioni si attivano acquistando un pacchetto dalla sezione Promozioni.'
    USING ERRCODE = 'insufficient_privilege'; END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_protect_product_insert_privileged ON products;
CREATE TRIGGER trg_protect_product_insert_privileged BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION protect_product_insert_privileged();
