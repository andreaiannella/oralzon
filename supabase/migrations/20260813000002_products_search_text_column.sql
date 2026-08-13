-- Colonna di ricerca unificata per i prodotti (nome + marca + SKU).
-- Applicata al database di produzione il 13/08/2026 via Supabase MCP.
--
-- Una colonna sola con un solo indice GIN trigram, invece di un OR su tre
-- colonne: il piano di esecuzione resta sempre indicizzato (il BitmapOr su
-- tre indici il planner lo sceglie in modo poco prevedibile), e il client
-- non deve costruire la sintassi .or() di PostgREST separata da virgole —
-- che si spezzava se l'utente cercava "pinza, 13cm".
--
-- GENERATED ... STORED: la mantiene aggiornata Postgres a ogni scrittura,
-- nessun trigger da mantenere e nessun rischio di disallineamento.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS search_text text
  GENERATED ALWAYS AS (
    coalesce(name, '') || ' ' || coalesce(brand, '') || ' ' || coalesce(sku, '')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_products_search_text_trgm ON products USING gin (search_text gin_trgm_ops);

-- Sostituiti dalla colonna unificata: toglierli libera spazio e velocizza
-- ogni scrittura di prodotto.
DROP INDEX IF EXISTS idx_products_name_trgm;
DROP INDEX IF EXISTS idx_products_brand_trgm;
DROP INDEX IF EXISTS idx_products_sku_trgm;
