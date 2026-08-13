-- Dimensioni collo per prodotto (cm) — prerequisito per l'integrazione
-- con l'aggregatore di spedizioni. Applicata in produzione il 13/08/2026.
--
-- Il peso da solo non basta: i corrieri fatturano sul PESO VOLUMETRICO
-- quando il collo e' leggero ma ingombrante. Nel dentale e' il caso
-- normale (scatoloni di guanti, camici, mascherine). Senza dimensioni il
-- preventivo mostrato al cliente sarebbe sistematicamente piu' basso di
-- quanto il corriere ci fattura, e la differenza la paghiamo noi.
--
-- NULLABLE di proposito: i prodotti gia' a catalogo non devono rompersi.
-- L'obbligatorieta' e' imposta nel form di inserimento, cosi' i prodotti
-- NUOVI nascono completi.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS shipping_length_cm numeric,
  ADD COLUMN IF NOT EXISTS shipping_width_cm  numeric,
  ADD COLUMN IF NOT EXISTS shipping_height_cm numeric;

COMMENT ON COLUMN products.shipping_length_cm IS 'Lunghezza del collo imballato in cm — usata per il calcolo del peso volumetrico';
COMMENT ON COLUMN products.shipping_width_cm  IS 'Larghezza del collo imballato in cm';
COMMENT ON COLUMN products.shipping_height_cm IS 'Altezza del collo imballato in cm';

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_dimensions_positive;
ALTER TABLE products ADD CONSTRAINT products_dimensions_positive CHECK (
  (shipping_length_cm IS NULL OR shipping_length_cm > 0) AND
  (shipping_width_cm  IS NULL OR shipping_width_cm  > 0) AND
  (shipping_height_cm IS NULL OR shipping_height_cm > 0)
);
