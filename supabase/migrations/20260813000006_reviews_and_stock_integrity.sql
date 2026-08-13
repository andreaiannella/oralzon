-- Applicata in produzione il 13/08/2026. Due problemi di integrita'
-- trovati durante l'audit dei flussi non-spedizione.

-- 1) RECENSIONI SOLO DA ACQUIRENTI VERIFICATI
-- La policy di INSERT verificava solo auth.uid() = user_id, cioe' soltanto
-- che l'utente non recensisse a nome di altri. Nessun controllo
-- sull'acquisto, ne' in DB ne' nel frontend: qualsiasi account registrato
-- poteva recensire qualsiasi prodotto. In un marketplace e' integrita',
-- non forma: un concorrente puo' affossare i prodotti altrui, un venditore
-- gonfiare i propri. Il controllo va in RLS perche' l'insert parte dal
-- client via supabase-js: in React sarebbe aggirabile con una chiamata
-- diretta, cioe' inutile contro chi ha interesse a barare.
DROP POLICY IF EXISTS "Utenti possono inserire recensioni" ON product_reviews;
CREATE POLICY "Recensioni solo da acquirenti verificati" ON product_reviews
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM order_items oi
      JOIN orders o ON o.id = oi.order_id
      WHERE oi.product_id = product_reviews.product_id
        AND o.customer_id = auth.uid()
        AND o.status IN ('processing','shipped','delivered','refunded','partially_refunded')
    )
  );
-- I rimborsati restano ammessi: chi ha ricevuto un prodotto difettoso e
-- l'ha reso e' spesso il recensore piu' utile, ed escluderlo darebbe ai
-- venditori un modo per cancellare le critiche rimborsando.

DROP POLICY IF EXISTS "Utenti possono aggiornare proprie recensioni" ON product_reviews;
CREATE POLICY "Utenti possono aggiornare proprie recensioni" ON product_reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2) VENDITA IN ECCESSO RESA VISIBILE
-- La disponibilita' e' verificata in create-checkout ma scalata solo al
-- pagamento confermato: fra i due momenti passano minuti e altri clienti
-- possono comprare le stesse unita'. Due clienti sull'ultimo pezzo pagano
-- entrambi e uno non ricevera' mai la merce. Il vecchio GREATEST(0,...)
-- rendeva la cosa invisibile: stock a zero e avanti, nessun avviso.
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS stock_shortfall integer NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_order_items_stock_shortfall
  ON order_items(stock_shortfall) WHERE stock_shortfall > 0;

CREATE OR REPLACE FUNCTION decrement_stock_on_order_confirmed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE item RECORD; available integer; shortfall integer;
BEGIN
  IF NEW.status = 'processing' AND OLD.status = 'pending' THEN
    FOR item IN SELECT id, product_id, quantity FROM order_items WHERE order_id = NEW.id LOOP
      -- FOR UPDATE serializza i decrementi concorrenti sulla stessa riga:
      -- il secondo ordine aspetta il primo e legge il valore aggiornato.
      SELECT stock INTO available FROM products WHERE id = item.product_id FOR UPDATE;
      IF available IS NULL THEN CONTINUE; END IF;
      shortfall := GREATEST(0, item.quantity - available);
      UPDATE products SET stock = GREATEST(0, available - item.quantity) WHERE id = item.product_id;
      IF shortfall > 0 THEN
        UPDATE order_items SET stock_shortfall = shortfall WHERE id = item.id;
        RAISE WARNING 'Vendita in eccesso: order_item % richiede % unita, disponibili % (prodotto %)',
          item.id, item.quantity, available, item.product_id;
      END IF;
    END LOOP;
    UPDATE order_items SET shipping_status = 'confirmed'
      WHERE order_id = NEW.id AND shipping_status = 'pending';
  END IF;
  RETURN NEW;
END;
$function$;
