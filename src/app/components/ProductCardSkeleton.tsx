// Segnaposto animato mostrato mentre un catalogo carica, al posto dello
// spinner centrale che oggi nasconde l'intera griglia. Stesse identiche
// dimensioni di ProductCard (bordo, padding, altezza titolo) — così quando
// i prodotti veri arrivano non c'è nessun "salto" di layout, il contenuto
// reale prende semplicemente il posto del segnaposto.
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-border flex flex-col animate-pulse" aria-hidden="true">
      <div className="bg-gray-100" style={{ aspectRatio: '1/1' }} />
      <div className="p-3 flex flex-col flex-1">
        <div className="min-h-[2.75em] mb-0.5 space-y-1.5">
          <div className="h-3 bg-gray-100 rounded w-full" />
          <div className="h-3 bg-gray-100 rounded w-2/3" />
        </div>
        <div className="h-2.5 bg-gray-100 rounded w-1/2 mb-2" />
        <div className="mt-auto">
          <div className="h-5 bg-gray-100 rounded w-1/3 mb-2" />
          <div className="h-9 bg-gray-100 rounded-lg w-full" />
        </div>
      </div>
    </div>
  );
}

/** Griglia di N skeleton, per sostituire lo spinner centrale di un catalogo intero. */
export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="w-[42vw] sm:w-auto flex-shrink-0">
          <ProductCardSkeleton />
        </div>
      ))}
    </div>
  );
}
