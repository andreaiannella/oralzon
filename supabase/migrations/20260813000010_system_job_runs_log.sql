-- Registro delle esecuzioni dei job automatici.
-- Applicata in produzione il 13/08/2026.
--
-- PROBLEMA: il job notturno e' l'automazione piu' critica della piattaforma
-- (trasferisce i soldi ai venditori, conferma consegne, applica scadenze,
-- manda preavvisi) e non c'era alcun modo di sapere se funzionasse:
--  - cron.job_run_details riporta "succeeded" dopo 11 millisecondi, ma
--    misura solo l'ACCODAMENTO della richiesta HTTP (pg_net e' asincrono):
--    un 401 per secret sbagliato risulterebbe comunque "succeeded";
--  - net._http_response contiene la risposta vera ma viene ripulito dopo
--    poche ore, quindi al mattino non resta nulla da leggere.
-- Se il job si fosse rotto, l'unico segnale sarebbero stati i venditori che
-- reclamano soldi non ricevuti, giorni o settimane dopo.
CREATE TABLE IF NOT EXISTS system_job_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  ok boolean NOT NULL DEFAULT false,
  result jsonb,
  error text,
  duration_ms integer
);
CREATE INDEX IF NOT EXISTS idx_system_job_runs_recent ON system_job_runs(job_name, started_at DESC);

ALTER TABLE system_job_runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "system_job_runs_no_client_access" ON system_job_runs;
CREATE POLICY "system_job_runs_no_client_access" ON system_job_runs
  FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);

-- Controllo rapido: se "da_quanto" supera la frequenza prevista, e' fermo.
CREATE OR REPLACE VIEW system_job_health AS
SELECT job_name,
       max(started_at) AS ultima_esecuzione,
       (now() - max(started_at)) AS da_quanto,
       bool_or(ok) FILTER (WHERE started_at > now() - interval '48 hours') AS ok_nelle_ultime_48h,
       count(*) FILTER (WHERE NOT ok AND started_at > now() - interval '7 days') AS fallimenti_7gg
FROM system_job_runs GROUP BY job_name;
