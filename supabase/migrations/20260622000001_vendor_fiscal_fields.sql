-- =====================================================
-- CAMPI FISCALI INTERNAZIONALI VENDITORE
-- =====================================================
-- Il form di registrazione validava P.IVA (11 cifre), CAP (5 cifre) e PEC
-- come obbligatori assumendo sempre un venditore italiano — bloccando di
-- fatto la registrazione di qualunque venditore estero. Aggiunge i campi
-- necessari per gestire venditori di qualunque paese, propedeutici anche
-- all'integrazione di Stripe Tax.
-- =====================================================

ALTER TABLE vendors ADD COLUMN IF NOT EXISTS fiscal_country TEXT DEFAULT 'IT';
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vat_id TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS codice_fiscale TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pec TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS codice_sdi TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS address_region TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS address_postal_code TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vies_validated BOOLEAN DEFAULT false;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vies_validated_at TIMESTAMPTZ;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS fiscal_regime TEXT;

COMMENT ON COLUMN vendors.fiscal_country IS 'Paese di stabilimento fiscale (ISO 3166-1 alpha-2, es. IT, DE, BR) — determina formato P.IVA atteso e regole di validazione.';
COMMENT ON COLUMN vendors.vat_id IS 'Identificativo fiscale/IVA nel formato del paese di stabilimento. Per IT: partita IVA (11 cifre). Per altri paesi UE: VAT number. Per extra-UE: Tax ID locale.';
COMMENT ON COLUMN vendors.vies_validated IS 'Per venditori UE: esito dell''ultima verifica del VAT number tramite il sistema VIES della Commissione Europea.';
COMMENT ON COLUMN vendors.fiscal_regime IS 'Regime fiscale dichiarato dal venditore (es. ordinario, forfettario per l''Italia) — informativo, non validato automaticamente.';

NOTIFY pgrst, 'reload schema';
