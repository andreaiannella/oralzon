import { useState } from 'react';
import { CheckCircle, Copy, ExternalLink, AlertCircle, Loader2 } from 'lucide-react';
import logo from '../../imports/logo_login.svg';

const SQL_SETUP = `-- =====================================================
-- SETUP COMPLETO DATABASE (ESEGUIRE UNA SOLA VOLTA)
-- =====================================================
-- Dopo aver eseguito questo SQL, tutto funziona automaticamente per sempre.
-- Non dovrai più tornare su Supabase SQL Editor.

-- STEP 1: Crea la funzione per creare vendor (SECURITY DEFINER bypassa RLS)
DROP FUNCTION IF EXISTS auto_create_vendor CASCADE;

CREATE OR REPLACE FUNCTION auto_create_vendor()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_type = 'venditore' THEN
    IF NOT EXISTS (
      SELECT 1 FROM vendors WHERE profile_id = NEW.id
    ) THEN
      INSERT INTO vendors (
        profile_id,
        business_name,
        plan_type,
        plan_status,
        product_limit,
        verified_badge
      ) VALUES (
        NEW.id,
        COALESCE(NEW.ragione_sociale, 'Negozio Oralzon'),
        'professional',
        'active',
        999999,
        false
      );

      RAISE NOTICE 'Vendor created automatically for user %', NEW.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- STEP 2: Crea il trigger
DROP TRIGGER IF EXISTS trigger_auto_create_vendor ON profiles;

CREATE TRIGGER trigger_auto_create_vendor
  AFTER INSERT OR UPDATE OF user_type ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_vendor();

-- STEP 3: Fix RLS policy
DROP POLICY IF EXISTS "Users can create their own vendor" ON vendors;
DROP POLICY IF EXISTS "Vendors can insert their own data" ON vendors;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON vendors;

CREATE POLICY "Enable insert for authenticated users" ON vendors
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;`;

const PROJECT_REF = 'ckslkfshimzuujtpboui';
const SQL_EDITOR_URL = `https://supabase.com/dashboard/project/${PROJECT_REF}/sql/new`;

export function SetupRequired() {
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SETUP);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestSetup = async () => {
    setTesting(true);

    // Aspetta un secondo per dare tempo all'utente
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Salva in localStorage che il setup è completato
    localStorage.setItem('oralzon_db_setup', 'true');
    setSetupComplete(true);

    // Ricarica la pagina dopo 2 secondi
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  if (setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Setup Completato!
          </h2>
          <p className="text-gray-600 mb-4">
            Il database è configurato. La pagina si ricaricherà automaticamente...
          </p>
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img src={logo} alt="Oralzon" className="h-16 w-auto mx-auto mb-6" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Setup Database Richiesto
          </h1>
          <p className="text-gray-600">
            Configurazione una tantum - 2 minuti
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          {/* Alert */}
          <div className="mb-6 p-4 bg-accent border border-oralzon-mint-fresh/30 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-primary">
              <strong>Devi eseguire questo setup UNA SOLA VOLTA.</strong>
              <br />
              Dopo, il sistema funzionerà automaticamente per sempre, senza bisogno di tornare su Supabase.
            </div>
          </div>

          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Segui questi 3 passaggi:
          </h2>

          {/* Step 1 */}
          <div className="mb-6">
            <div className="flex items-start mb-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold mr-3">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Copia il codice SQL
                </h3>
                <button
                  onClick={handleCopy}
                  className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Copiato!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Copia SQL
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="mb-6">
            <div className="flex items-start mb-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold mr-3">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Apri Supabase SQL Editor
                </h3>
                <a
                  href={SQL_EDITOR_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  Apri SQL Editor
                </a>
                <p className="text-sm text-gray-600 mt-2">
                  • Si aprirà una nuova scheda con Supabase
                  <br />
                  • Incolla il SQL copiato
                  <br />
                  • Click su <strong>Run</strong> (o premi F5)
                  <br />
                  • Output atteso: "Success. No rows returned"
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold mr-3">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Conferma completamento
                </h3>
                <button
                  onClick={handleTestSetup}
                  disabled={testing}
                  className="w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center font-semibold"
                >
                  {testing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Ho Eseguito il SQL - Continua
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-secondary" /> Cosa fa questo SQL?
            </h4>
            <ul className="text-sm text-gray-700 space-y-1.5">
              <li className="flex items-start gap-1.5"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Crea un <strong>trigger automatico</strong> sul database</li>
              <li className="flex items-start gap-1.5"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Quando un utente si registra come venditore, il trigger crea automaticamente il vendor</li>
              <li className="flex items-start gap-1.5"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Usa <strong>SECURITY DEFINER</strong> per bypassare le policy RLS in modo sicuro</li>
              <li className="flex items-start gap-1.5"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Crea anche una policy RLS permissiva come fallback</li>
              <li className="flex items-start gap-1.5"><CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" /> Dopo questo setup, <strong>tutto funziona automaticamente</strong></li>
            </ul>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-sm text-gray-600">
          <p>
            Setup una tantum — poi mai più bisogno di tornare su Supabase
          </p>
        </div>
      </div>
    </div>
  );
}
