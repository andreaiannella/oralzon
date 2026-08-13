-- FASE 0 dell'integrazione aggregatore spedizioni (Sendcloud).
-- Applicata in produzione il 13/08/2026.
--
-- Solo struttura dati: nessuna chiamata a Sendcloud esiste ancora. Si e'
-- potuta applicare subito perche' non dipende dall'account (che richiede
-- la P.IVA, non ancora disponibile): quando le chiavi API arriveranno, il
-- lavoro parte dal codice e non da una migrazione.

-- MITTENTE: ogni venditore va registrato come indirizzo mittente nel
-- nostro account Sendcloud. E' cio' che permette a un venditore tedesco di
-- ottenere le tariffe DOMESTICHE tedesche invece di una Italia->Germania.
ALTER TABLE vendors
  ADD COLUMN IF NOT EXISTS sendcloud_sender_address_id text;
COMMENT ON COLUMN vendors.sendcloud_sender_address_id IS 'ID dell''indirizzo mittente registrato su Sendcloud per questo venditore.';

-- SPEDIZIONE / ETICHETTA
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS sendcloud_parcel_id text,
  ADD COLUMN IF NOT EXISTS sendcloud_shipping_option_code text,
  ADD COLUMN IF NOT EXISTS label_url text,
  ADD COLUMN IF NOT EXISTS label_cost numeric,
  ADD COLUMN IF NOT EXISTS label_created_at timestamptz;

COMMENT ON COLUMN order_items.sendcloud_parcel_id IS 'ID del collo su Sendcloud: collega i webhook di tracking e impedisce di generare due volte la stessa etichetta.';
COMMENT ON COLUMN order_items.label_cost IS 'Costo REALE dell''etichetta. Confrontato con shipping_amount dice se l''arrotondamento ai 50 cent copre il peso volumetrico o se il modello a passaggio va in perdita.';

-- Unicita' = vera garanzia anti-doppione anche con richieste concorrenti.
CREATE UNIQUE INDEX IF NOT EXISTS idx_order_items_sendcloud_parcel_unique
  ON order_items(sendcloud_parcel_id) WHERE sendcloud_parcel_id IS NOT NULL;

-- CACHE PREVENTIVI: i rate limit sono 100 richieste/minuto sulle scritture
-- e un checkout multi-venditore ne farebbe una per fornitore ad ogni
-- ricalcolo. Senza cache si arriva al 429 con pochissimo traffico reale.
CREATE TABLE IF NOT EXISTS shipping_quote_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  dest_country text NOT NULL,
  weight_bucket_kg numeric NOT NULL,
  shipping_option_code text,
  carrier_name text,
  cost numeric NOT NULL,
  billed_weight_kg numeric,
  is_volumetric boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  UNIQUE (vendor_id, dest_country, weight_bucket_kg)
);
COMMENT ON COLUMN shipping_quote_cache.is_volumetric IS 'true = il corriere fattura sul peso volumetrico anziche' reale. Nel dentale e' frequente e va monitorato.';

CREATE INDEX IF NOT EXISTS idx_shipping_quote_cache_lookup
  ON shipping_quote_cache(vendor_id, dest_country, weight_bucket_kg, expires_at);

-- Dati di servizio: nessun client deve leggerli ne' scriverci un costo falso.
ALTER TABLE shipping_quote_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shipping_quote_cache_no_client_access" ON shipping_quote_cache;
CREATE POLICY "shipping_quote_cache_no_client_access" ON shipping_quote_cache
  FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);
