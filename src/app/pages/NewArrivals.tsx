import { Sparkles } from 'lucide-react';

export function NewArrivals() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Sparkles className="w-8 h-8 text-secondary" />
          <h1 className="text-4xl font-bold text-gray-900">Nuovi Arrivi</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Le ultime novità per il tuo studio odontoiatrico
        </p>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Pagina Nuovi Arrivi
        </h3>
        <p className="text-gray-600">
          Qui verranno mostrati i prodotti più recenti
        </p>
      </div>
    </div>
  );
}
