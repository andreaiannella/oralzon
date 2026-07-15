-- =====================================================
-- FIX CRITICO: visibilità pubblica venditori + bestseller
-- =====================================================
-- Causa: le tabelle vendors e order_items avevano RLS che permetteva
-- la lettura solo al proprietario (venditore/cliente stesso), bloccando
-- qualsiasi visitatore pubblico dal vedere store in evidenza o bestseller.
-- =====================================================

-- 1. VENDORS: aggiunge lettura pubblica (necessaria per vetrina store,
--    "Store in Evidenza" in home, e il nome venditore sulle schede prodotto).
--    Le policy RLS sono in OR tra loro: questa si aggiunge a quella esistente,
--    non la sostituisce — un venditore continua a poter modificare solo il proprio.
DROP POLICY IF EXISTS "Public can view vendor storefronts" ON vendors;
CREATE POLICY "Public can view vendor storefronts" ON vendors
  FOR SELECT USING (true);

-- 2. BESTSELLER: vista pubblica con SOLO i dati aggregati (product_id + quantità
--    totale venduta). Non espone mai dettagli di ordini/clienti — nessun rischio privacy.
--    Le viste in Postgres girano con i permessi di chi le crea (bypassano RLS della
--    tabella sottostante), quindi questa vista è leggibile pubblicamente anche se
--    order_items resta privata riga per riga.
DROP VIEW IF EXISTS public_product_sales_stats;
CREATE VIEW public_product_sales_stats AS
SELECT
  oi.product_id,
  SUM(oi.quantity) AS total_sold
FROM order_items oi
JOIN orders o ON o.id = oi.order_id
WHERE o.status IN ('processing', 'shipped', 'delivered')
GROUP BY oi.product_id;

GRANT SELECT ON public_product_sales_stats TO anon, authenticated;

-- =====================================================
-- FIX 3: sponsorizzazione categoria — stesso problema di RLS, PIÙ una colonna
-- mai esistita realmente nel database (solo nel codice applicativo). Questo
-- significa che gli acquisti di sponsorizzazione categoria sono sempre falliti
-- silenziosamente anche in scrittura, non solo in lettura.
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS sponsored_category TEXT;

-- Vista pubblica con SOLO i dati necessari per lo Shop (nessun importo pagato,
-- nessun session_id Stripe esposto).
-- =====================================================
DROP VIEW IF EXISTS public_active_category_sponsors;
CREATE VIEW public_active_category_sponsors AS
SELECT vendor_id, sponsored_category, expires_at
FROM promotions
WHERE package_id LIKE 'category_%'
  AND status = 'active'
  AND expires_at > NOW();

GRANT SELECT ON public_active_category_sponsors TO anon, authenticated;
