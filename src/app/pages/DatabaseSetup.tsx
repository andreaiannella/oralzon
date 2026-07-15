import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, Loader2, AlertCircle, Database } from 'lucide-react';

export function DatabaseSetup() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ step: string; status: 'success' | 'error' | 'pending'; message: string }>>([]);

  const executeSetup = async () => {
    setLoading(true);
    setResults([]);

    const steps: Array<{ step: string; status: 'success' | 'error' | 'pending'; message: string }> = [];

    // Step 1: Verifica colonne products
    steps.push({ step: 'Verifica schema products', status: 'pending', message: 'Controllo colonne...' });
    setResults([...steps]);

    try {
      // Prova a query un prodotto per vedere se le colonne esistono
      const { error: checkError } = await supabase
        .from('products')
        .select('id, sku, brand, specifications, status')
        .limit(1);

      if (checkError && checkError.message.includes('column')) {
        steps[steps.length - 1] = {
          step: 'Verifica schema products',
          status: 'error',
          message: 'Alcune colonne mancano. Esegui il file supabase_products_update.sql manualmente in Supabase SQL Editor.'
        };
      } else {
        steps[steps.length - 1] = {
          step: 'Verifica schema products',
          status: 'success',
          message: 'Schema aggiornato correttamente'
        };
      }
    } catch (err) {
      steps[steps.length - 1] = {
        step: 'Verifica schema products',
        status: 'error',
        message: 'Errore verifica schema'
      };
    }

    setResults([...steps]);

    // Step 2: Verifica tabelle esistenti
    steps.push({ step: 'Verifica tabelle database', status: 'pending', message: 'Controllo tabelle...' });
    setResults([...steps]);

    try {
      const tables = ['profiles', 'vendors', 'products', 'orders', 'order_items'];
      let allExist = true;

      for (const table of tables) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (error) {
          allExist = false;
          break;
        }
      }

      if (allExist) {
        steps[steps.length - 1] = {
          step: 'Verifica tabelle database',
          status: 'success',
          message: 'Tutte le tabelle esistono'
        };
      } else {
        steps[steps.length - 1] = {
          step: 'Verifica tabelle database',
          status: 'error',
          message: 'Alcune tabelle mancano. Esegui supabase_schema_clean.sql in Supabase SQL Editor.'
        };
      }
    } catch (err) {
      steps[steps.length - 1] = {
        step: 'Verifica tabelle database',
        status: 'error',
        message: 'Errore verifica tabelle'
      };
    }

    setResults([...steps]);

    // Step 3: Crea prodotti di esempio SE non esistono
    steps.push({ step: 'Crea prodotti di esempio', status: 'pending', message: 'Creazione prodotti test...' });
    setResults([...steps]);

    try {
      // Verifica se l'utente è un venditore
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        steps[steps.length - 1] = {
          step: 'Crea prodotti di esempio',
          status: 'error',
          message: 'Devi essere loggato come venditore'
        };
        setResults([...steps]);
        setLoading(false);
        return;
      }

      // Ottieni vendor
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('profile_id', user.id)
        .single();

      if (vendorError || !vendor) {
        steps[steps.length - 1] = {
          step: 'Crea prodotti di esempio',
          status: 'error',
          message: 'Nessun venditore trovato per questo utente. Registrati come venditore prima.'
        };
        setResults([...steps]);
        setLoading(false);
        return;
      }

      // Verifica se esistono già prodotti
      const { data: existingProducts } = await supabase
        .from('products')
        .select('id')
        .eq('vendor_id', vendor.id)
        .limit(1);

      if (existingProducts && existingProducts.length > 0) {
        steps[steps.length - 1] = {
          step: 'Crea prodotti di esempio',
          status: 'success',
          message: 'Prodotti già esistenti, skip creazione'
        };
      } else {
        // Crea prodotti di esempio
        const sampleProducts = [
          {
            vendor_id: vendor.id,
            name: 'Guanti in Nitrile Professional Box 100pz',
            description: 'Guanti monouso in nitrile blu, resistenti e anallergici. Certificati CE. Perfetti per uso dentale.',
            category: 'Monouso',
            brand: 'MediGlove',
            price: 19.90,
            stock: 150,
            sku: 'GLV-NIT-100',
            status: 'published',
            images: [],
            is_sponsored: false
          },
          {
            vendor_id: vendor.id,
            name: 'Mascherine FFP2 Certificate CE - Box 50pz',
            description: 'Mascherine FFP2 certificate, protezione elevata. Conformi normativa europea.',
            category: 'Monouso',
            brand: 'SafeMed',
            price: 29.90,
            stock: 200,
            sku: 'MASK-FFP2-50',
            status: 'published',
            images: [],
            is_sponsored: true
          },
          {
            vendor_id: vendor.id,
            name: 'Disinfettante Superfici Spray 750ml',
            description: 'Spray disinfettante per superfici professionali. Azione rapida, virucida e battericida.',
            category: 'Disinfezione',
            brand: 'CleanPro',
            price: 12.50,
            stock: 80,
            sku: 'DIS-SPR-750',
            status: 'published',
            images: [],
            is_sponsored: false
          },
          {
            vendor_id: vendor.id,
            name: 'Bavagli Monouso Premium - Pack 500pz',
            description: 'Bavagli monouso triplo strato, impermeabili. Alta qualità professionale.',
            category: 'Monouso',
            brand: 'DentalCare',
            price: 42.00,
            stock: 50,
            sku: 'BAV-PREM-500',
            status: 'published',
            images: [],
            is_sponsored: false
          },
          {
            vendor_id: vendor.id,
            name: 'Set Frese Diamantate Assortite - 10pz',
            description: 'Set di frese diamantate per turbina. Varie granulometrie. Made in Germany.',
            category: 'Strumenti Odontoiatrici',
            brand: 'GermanDental',
            price: 89.90,
            stock: 25,
            sku: 'FRS-DIA-10',
            status: 'published',
            images: [],
            is_sponsored: false
          }
        ];

        const { error: insertError } = await supabase
          .from('products')
          .insert(sampleProducts);

        if (insertError) {
          steps[steps.length - 1] = {
            step: 'Crea prodotti di esempio',
            status: 'error',
            message: `Errore creazione prodotti: ${insertError.message}`
          };
        } else {
          steps[steps.length - 1] = {
            step: 'Crea prodotti di esempio',
            status: 'success',
            message: `5 prodotti di esempio creati con successo`
          };
        }
      }
    } catch (err: any) {
      steps[steps.length - 1] = {
        step: 'Crea prodotti di esempio',
        status: 'error',
        message: `Errore: ${err.message}`
      };
    }

    setResults([...steps]);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-accent p-4 rounded-lg">
              <Database className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Setup Database</h1>
              <p className="text-gray-600">Verifica e inizializza il database automaticamente</p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800">
                <p className="font-medium mb-1">Importante:</p>
                <p>Prima di eseguire questo setup, assicurati di aver eseguito questi SQL file in Supabase SQL Editor:</p>
                <ul className="list-disc ml-5 mt-2 space-y-1">
                  <li><code className="bg-amber-100 px-1 rounded">supabase_schema_clean.sql</code> - Crea le tabelle</li>
                  <li><code className="bg-amber-100 px-1 rounded">supabase_products_update.sql</code> - Aggiorna schema products</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="mb-8">
            <button
              onClick={executeSetup}
              disabled={loading}
              className="w-full px-6 py-4 bg-primary text-white rounded-lg hover:bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Setup in corso...
                </>
              ) : (
                <>
                  <Database className="w-6 h-6" />
                  Avvia Setup Automatico
                </>
              )}
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Risultati Setup:</h3>
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : result.status === 'error'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.status === 'success' && (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    {result.status === 'error' && (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    {result.status === 'pending' && (
                      <Loader2 className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5 animate-spin" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{result.step}</p>
                      <p className={`text-sm ${
                        result.status === 'success'
                          ? 'text-green-700'
                          : result.status === 'error'
                          ? 'text-red-700'
                          : 'text-gray-600'
                      }`}>
                        {result.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Instructions */}
          {results.length === 0 && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Cosa farà questo setup?</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">1.</span>
                  <span>Verificherà che lo schema del database sia corretto</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">2.</span>
                  <span>Controllerà che tutte le tabelle necessarie esistano</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold">3.</span>
                  <span>Creerà 5 prodotti di esempio nel tuo catalogo (se non esistono già)</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
