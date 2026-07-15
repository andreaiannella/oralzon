-- =====================================================
-- STRIPE CONNECT — job automatico giornaliero
-- =====================================================
-- Chiama ogni giorno l'endpoint che:
-- 1. Conferma automaticamente la consegna degli articoli spediti da più di
--    7 giorni senza resi aperti (il cliente può sempre confermare prima a mano)
-- 2. Trasferisce ai venditori tutto ciò che risulta consegnato ma non ancora
--    trasferito (copre anche i venditori che completano Stripe Connect dopo
--    la consegna)
--
-- PREREQUISITI (da fare una tantum su Supabase, non tramite migration):
-- 1. Dashboard Supabase → Database → Extensions → abilita "pg_cron" e "pg_net"
-- 2. Dashboard Supabase → Edge Functions → Secrets → aggiungi un NUOVO secret:
--      Key:   CRON_SECRET
--      Value: una stringa a scelta tua, casuale e lunga, che NON hai scritto
--             da nessuna parte pubblicamente (chat, documenti condivisi, ecc.)
--             NON è la service_role key — è un secret dedicato solo a
--             questo job, più sicuro perché più ristretto nello scopo.
-- 3. Sostituisci i due segnaposto qui sotto prima di eseguire:
--    - <PROJECT_REF> con il riferimento del progetto (ckslkfshimzuujtpboui)
--    - <CRON_SECRET> con LO STESSO valore che hai messo nel secret al punto 2
--
-- NOTA sul timeout: pg_net di default aspetta al massimo 5 secondi una
-- risposta. Il nostro endpoint può richiedere di più quando ci sono più
-- ordini da processare (ogni trasferimento fa 2 chiamate Stripe). Per
-- questo qui sotto specifichiamo esplicitamente timeout_milliseconds più
-- alto — il codice lato server è comunque stato ottimizzato per processare
-- gli articoli in parallelo invece che uno alla volta, quindi questo è
-- principalmente un margine di sicurezza, non una necessità stretta.
-- =====================================================

SELECT cron.schedule(
  'process-pending-transfers-daily',
  '0 3 * * *',  -- ogni giorno alle 03:00 UTC (orario a basso traffico)
  $$
  SELECT net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/make-server-000b3cfb/system/process-pending-transfers',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <CRON_SECRET>'
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 30000
  );
  $$
);

-- Per verificare che sia schedulato E che i valori dentro siano quelli veri
-- (non più <PROJECT_REF>/<CRON_SECRET> letterali):
-- SELECT jobid, jobname, schedule, active, command FROM cron.job WHERE jobname = 'process-pending-transfers-daily';

-- Per correggere un job già creato con i segnaposto sbagliati, senza doverlo
-- cancellare e ricreare:
-- SELECT cron.alter_job(
--   (SELECT jobid FROM cron.job WHERE jobname = 'process-pending-transfers-daily'),
--   command := $$
--   SELECT net.http_post(
--     url := 'https://<PROJECT_REF>.supabase.co/functions/v1/make-server-000b3cfb/system/process-pending-transfers',
--     headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer <CRON_SECRET>'),
--     body := '{}'::jsonb,
--     timeout_milliseconds := 30000
--   );
--   $$
-- );

-- Per rimuoverlo:
-- SELECT cron.unschedule('process-pending-transfers-daily');

-- =====================================================
-- TEST MANUALE (senza aspettare le 3 di notte) — stessa chiamata, a mano:
-- =====================================================
-- SELECT net.http_post(
--   url := 'https://<PROJECT_REF>.supabase.co/functions/v1/make-server-000b3cfb/system/process-pending-transfers',
--   headers := jsonb_build_object('Content-Type','application/json','Authorization','Bearer <CRON_SECRET>'),
--   body := '{}'::jsonb,
--   timeout_milliseconds := 30000
-- );
--
-- Poi controlla la risposta vera usando l'id restituito dalla chiamata sopra
-- (aspetta qualche secondo prima di interrogarla, la chiamata è asincrona):
-- SELECT * FROM net._http_response WHERE id = <ID_RESTITUITO_SOPRA>;
