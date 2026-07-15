import { Tag } from 'lucide-react';

export function Offers() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Tag className="w-8 h-8 text-red-600" />
          <h1 className="text-4xl font-bold text-gray-900">Offerte Speciali</h1>
        </div>
        <p className="text-gray-600 text-lg">
          Approfitta degli sconti sui prodotti odontoiatrici più richiesti
        </p>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <Tag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Pagina Offerte
        </h3>
        <p className="text-gray-600">
          Qui verranno mostrati i prodotti in offerta
        </p>
      </div>
    </div>
  );
}
