import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ShoppingCart, CheckCircle, Trash2 } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

export interface ProductCardData {
  id: string;
  vendor_id?: string;
  name: string;
  price: number;
  images: string[];
  vendors?: { id: string; business_name: string; verified_badge?: boolean } | null;
}

const FALLBACK_IMG = '/images/product-placeholder.svg';

// Card prodotto unica e riutilizzabile in tutto il sito (home, negozio, preferiti...).
// Dimensione e stile devono restare identici ovunque: se serve una modifica, va fatta
// solo qui.
export function ProductCard({ product, badge, badgeColor = 'bg-red-500', badgeTextColor = 'text-white', onRemove }: {
  product: ProductCardData;
  badge?: string;
  badgeColor?: string;
  badgeTextColor?: string;
  onRemove?: () => void;
}) {
  const { addItem } = useCart();
  const { profile } = useAuth();
  const isBuyer = (profile as any)?.user_type !== 'venditore' && (profile as any)?.user_type !== 'admin';
  const [added, setAdded] = useState(false);
  const image = product.images?.[0] || FALLBACK_IMG;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isBuyer) return;
    addItem({ productId: product.id, vendorId: product.vendors?.id || product.vendor_id || '', name: product.name, price: product.price, quantity: 1, image });
    setAdded(true); setTimeout(() => setAdded(false), 2000);
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault();
    onRemove?.();
  };

  return (
    <div className="group bg-white rounded-xl overflow-hidden border border-border hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 transition-all flex flex-col">
      <Link to={`/negozio/prodotto/${product.id}`} className="block relative overflow-hidden bg-gray-50" style={{ aspectRatio: '1/1' }}>
        <img src={image} alt={product.name} loading="lazy" decoding="async"
          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.target as HTMLImageElement).src = FALLBACK_IMG; }} />
        {badge && (
          <span className={`absolute top-2 left-2 px-2 py-0.5 ${badgeColor} ${badgeTextColor} text-[10px] rounded-full font-medium border border-black/5`}>{badge}</span>
        )}
        {onRemove && (
          <button onClick={handleRemove}
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors shadow-sm">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <Link to={`/negozio/prodotto/${product.id}`}>
          <h3 className="line-clamp-2 text-xs sm:text-sm font-medium text-gray-800 group-hover:text-primary transition-colors leading-snug mb-0.5">{product.name}</h3>
        </Link>
        <p className="text-[10px] sm:text-xs text-gray-400 mb-1.5 truncate">{product.vendors?.business_name || 'Venditore'}</p>
        <div className="mt-auto">
          <span className="text-base sm:text-lg font-black text-primary block mb-2">€{Number(product.price).toFixed(2)}</span>
          {isBuyer && (
            <button onClick={handleAdd}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs sm:text-sm font-medium transition-all ${
                added ? 'bg-green-600' : 'bg-secondary hover:bg-primary active:scale-[0.97]'
              }`}>
              {added ? <><CheckCircle className="w-3.5 h-3.5" /> Aggiunto!</> : <><ShoppingCart className="w-3.5 h-3.5" /> Aggiungi al Carrello</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
