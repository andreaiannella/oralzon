-- =====================================================
-- FIX CRITICO: Aggiorna order_items con vendor_id mancante
-- Risolve il problema ordini non visibili nella dashboard vendor
-- =====================================================

-- Aggiorna tutti gli order_items che hanno vendor_id NULL
-- usando il vendor_id del prodotto associato
UPDATE order_items oi
SET vendor_id = p.vendor_id
FROM products p
WHERE oi.product_id = p.id
  AND oi.vendor_id IS NULL;

-- Aggiorna anche order_items dove vendor_id non corrisponde al vendor del prodotto
-- (per sicurezza sui dati già inseriti)
UPDATE order_items oi
SET vendor_id = p.vendor_id
FROM products p
WHERE oi.product_id = p.id
  AND oi.vendor_id != p.vendor_id
  AND p.vendor_id IS NOT NULL;

-- Rimuovi ordini "pending" più vecchi di 24 ore senza pagamento completato
-- (ordini fantasma creati ma mai pagati)
DELETE FROM order_items
WHERE order_id IN (
  SELECT id FROM orders
  WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '24 hours'
    AND stripe_session_id IS NULL
);
DELETE FROM orders
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '24 hours'
  AND stripe_session_id IS NULL;

-- Assicura che RLS su order_items sia attiva
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Ricrea le policy in modo sicuro e completo
DROP POLICY IF EXISTS "Vendor can view own order items" ON order_items;
CREATE POLICY "Vendor can view own order items" ON order_items
  FOR SELECT USING (
    -- Il vendor vede i propri order_items
    vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
    -- Il cliente vede i propri order_items
    OR order_id IN (SELECT id FROM orders WHERE customer_id = auth.uid())
    -- Admin vede tutto
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

DROP POLICY IF EXISTS "Vendor can update own order items" ON order_items;
CREATE POLICY "Vendor can update own order items" ON order_items
  FOR UPDATE USING (
    vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())
  );

DROP POLICY IF EXISTS "Insert order items" ON order_items;
CREATE POLICY "Insert order items" ON order_items
  FOR INSERT WITH CHECK (true);

-- Policy DELETE per pulizia ordini fantasma via service role
DROP POLICY IF EXISTS "Service can delete order items" ON order_items;
CREATE POLICY "Service can delete order items" ON order_items
  FOR DELETE USING (true);

-- =====================================================
-- FIX: orders RLS - assicura che i vendor vedano gli ordini
-- =====================================================
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors can view orders with their items" ON orders;
CREATE POLICY "Vendors can view orders with their items" ON orders
  FOR SELECT USING (
    -- Cliente vede i propri ordini
    customer_id = auth.uid()
    -- Vendor vede ordini con suoi prodotti
    OR EXISTS (
      SELECT 1 FROM order_items oi
      JOIN vendors v ON v.id = oi.vendor_id
      WHERE oi.order_id = orders.id
        AND v.profile_id = auth.uid()
    )
    -- Admin vede tutto
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND user_type = 'admin')
  );

DROP POLICY IF EXISTS "Service role can update orders" ON orders;
CREATE POLICY "Service role can update orders" ON orders
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Service role can insert orders" ON orders;
CREATE POLICY "Service role can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

-- =====================================================
-- FIX: Sposta il decremento stock al verify-payment (dopo pagamento confermato)
-- Il trigger aggiorna lo stock solo quando l'ordine diventa 'processing'
-- =====================================================
CREATE OR REPLACE FUNCTION decrement_stock_on_order_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando un ordine passa da 'pending' a 'processing' (pagamento confermato)
  IF NEW.status = 'processing' AND OLD.status = 'pending' THEN
    UPDATE products p
    SET stock = GREATEST(0, p.stock - oi.quantity)
    FROM order_items oi
    WHERE oi.order_id = NEW.id
      AND p.id = oi.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_decrement_stock ON orders;
CREATE TRIGGER trigger_decrement_stock
  AFTER UPDATE OF status ON orders
  FOR EACH ROW
  EXECUTE FUNCTION decrement_stock_on_order_confirmed();

-- =====================================================
-- FIX: products - assicura che status='published' sia il default corretto
-- =====================================================
UPDATE products SET status = 'published' 
WHERE status IS NULL AND stock > 0;
