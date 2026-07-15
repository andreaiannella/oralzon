import { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export function SetupBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Controlla se il setup è richiesto
    const setupRequired = localStorage.getItem('oralzon_setup_required') === 'true';
    setShow(setupRequired);
  }, []);

  if (!show) {
    return null;
  }

  return (
    <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertCircle className="h-5 w-5 text-orange-400" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-orange-800">
            Setup Database Richiesto
          </h3>
          <div className="mt-2 text-sm text-orange-700">
            <p>
              Per creare prodotti devi configurare il database (richiede 2 minuti, una sola volta).
            </p>
          </div>
          <div className="mt-4">
            <Link
              to="/setup"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              Configura Ora (2 minuti)
            </Link>
          </div>
        </div>
        <div className="ml-auto pl-3">
          <button
            onClick={() => setShow(false)}
            className="inline-flex text-orange-400 hover:text-orange-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
