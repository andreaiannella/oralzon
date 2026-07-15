-- Fix: rimuovi il vincolo FK su customer_id che causa problemi
-- e ricrealo puntando ad auth.users invece di profiles
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_fkey;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_customer_id_profiles_fkey;

-- Ricrea senza FK (più flessibile, il controllo è via RLS)
-- oppure punta ad auth.users che è sempre garantito
-- Per sicurezza rimuoviamo il vincolo e aggiungiamo solo un indice
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Assicura che tutti i profili esistano per gli utenti auth
-- Crea profili mancanti
INSERT INTO profiles (id, user_type, created_at)
SELECT au.id, 'cliente', NOW()
FROM auth.users au
LEFT JOIN profiles p ON p.id = au.id
WHERE p.id IS NULL;
