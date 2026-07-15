-- =====================================================
-- FIX: Messaggistica - policy RLS mancanti + fix vendor INSERT
-- =====================================================

-- Aggiungi policy mancante: vendor può aggiornare conversazione (segnare come letta)
DROP POLICY IF EXISTS "Vendor aggiorna proprie conversazioni" ON conversations;
CREATE POLICY "Vendor aggiorna proprie conversazioni" ON conversations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM vendors v WHERE v.id = vendor_id AND v.profile_id = auth.uid())
  );

-- Fix: vendor può inserire messaggi nelle proprie conversazioni
-- (la policy attuale blocca i vendor perché sender_id = auth.uid() ma la conversazione appartiene al vendor via vendors.profile_id)
DROP POLICY IF EXISTS "Utenti inviano messaggi proprie conversazioni" ON messages;
CREATE POLICY "Utenti inviano messaggi proprie conversazioni" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (
          c.customer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM vendors v 
            WHERE v.id = c.vendor_id 
            AND v.profile_id = auth.uid()
          )
        )
    )
  );

-- Fix: vendor può leggere messaggi delle proprie conversazioni
DROP POLICY IF EXISTS "Utenti vedono messaggi proprie conversazioni" ON messages;
CREATE POLICY "Utenti vedono messaggi proprie conversazioni" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
        AND (
          c.customer_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM vendors v 
            WHERE v.id = c.vendor_id 
            AND v.profile_id = auth.uid()
          )
        )
    )
  );

-- Fix: clienti possono aggiornare le conversazioni (per incrementare vendor_unread)
DROP POLICY IF EXISTS "Clienti aggiornano proprie conversazioni" ON conversations;
CREATE POLICY "Clienti aggiornano proprie conversazioni" ON conversations
  FOR UPDATE USING (customer_id = auth.uid());

-- Fix: assicura che vendor possa leggere messaggi via service role nelle query join
ALTER TABLE conversations REPLICA IDENTITY FULL;
