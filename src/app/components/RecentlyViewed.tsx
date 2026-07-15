import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';

const STORAGE_KEY = 'dc_recently_viewed';
const MAX_ITEMS = 12;

export interface RecentProduct {
  id: string; name: string; price: number; image: string; vendor: string;
}

export function addToRecentlyViewed(product: RecentProduct) {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const filtered = existing.filter((p: RecentProduct) => p.id !== product.id);
    filtered.unshift(product);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {}
}

export function RecentlyViewed() {
  const [products, setProducts] = useState<RecentProduct[]>([]);

  useEffect(() => {
    try {
      setProducts(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
    } catch {}
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-8 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-gray-400" />
          <h2 className="text-lg sm:text-xl font-bold text-gray-900">Visti di recente</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {products.map(p => (
            <Link key={p.id} to={`/negozio/prodotto/${p.id}`}
              className="flex-shrink-0 w-32 sm:w-36 bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-primary/30 transition-all">
              <div className="aspect-square bg-gray-50 overflow-hidden">
                <img src={p.image} alt={p.name} className="w-full h-full object-contain p-1"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
              <div className="p-2">
                <p className="text-[10px] text-gray-400 truncate">{p.vendor}</p>
                <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">{p.name}</p>
                <p className="text-sm font-bold text-primary mt-1">€{Number(p.price).toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
