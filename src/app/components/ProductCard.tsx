import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, CheckCircle, Trash2 } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

export interface ProductCardData {
  id: string;
  vendor_id?: string;
  name: string;
  price: number;
  discount_price?: number | null;
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
  const { t } = useTranslation();
  const isBuyer = (profile as any)?.user_type !== 'venditore' && (profile as any)?.user_type !== 'admin';
  const [added, setAdded] = useState(false);
  const image = product.images?.[0] || FALLBACK_IMG;
  // Il prezzo scontato conta solo se valorizzato e realmente inferiore al
  // prezzo pieno — stessa validazione applicata lato server al checkout.
  const hasDiscount = !!product.discount_price && product.discount_price > 0 && product.discount_price < product.price;
  const effectivePrice = hasDiscount ? product.discount_price! : product.price;
  const discountPct = hasDiscount ? Math.round((1 - product.discount_price! / product.price) * 100) : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isBuyer) return;
    addItem({ productId: product.id, vendorId: product.vendors?.id || product.vendor_id || '', name: product.name, price: effectivePrice, quantity: 1, image });
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
        {!badge && hasDiscount && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-red-500 text-white text-[10px] rounded-full font-bold border border-black/5">-{discountPct}%</span>
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
        <p className="text-[10px] sm:text-xs text-gray-400 mb-1.5 truncate">{product.vendors?.business_name || t('common.vendorBadge')}</p>
        <div className="mt-auto">
          {hasDiscount ? (
            <div className="flex items-baseline gap-1.5 mb-2">
              <span className="text-base sm:text-lg font-black text-red-600">€{Number(effectivePrice).toFixed(2)}</span>
              <span className="text-xs text-gray-400 line-through">€{Number(product.price).toFixed(2)}</span>
            </div>
          ) : (
            <span className="text-base sm:text-lg font-black text-primary block mb-2">€{Number(product.price).toFixed(2)}</span>
          )}
          {isBuyer && (
            <button onClick={handleAdd}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs sm:text-sm font-medium transition-all ${
                added ? 'bg-green-600' : 'bg-secondary hover:bg-primary active:scale-[0.97]'
              }`}>
              {added ? <><CheckCircle className="w-3.5 h-3.5" /> {t('product.added')}</> : <><ShoppingCart className="w-3.5 h-3.5" /> {t('product.addToCart')}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
