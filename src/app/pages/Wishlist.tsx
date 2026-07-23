import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ProductCard } from '../components/ProductCard';

interface WishlistItem {
  id: string;
  product_id: string;
  products: { id: string; name: string; price: number; images: string[]; vendor_id: string } | null;
}

export function Wishlist() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadWishlist();
    else setLoading(false);
  }, [user]);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('wishlists')
        .select('id, product_id, products(id, name, price, images, vendor_id, stock)')
        .eq('user_id', user!.id);
      setItems((data as any) || []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  const removeItem = async (id: string) => {
    await supabase.from('wishlists').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  if (!user) return (
    <div className="text-center py-16">
      <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-600 mb-4">{t('wishlist.loginToView')}</p>
      <Link to="/login" className="px-6 py-3 bg-primary text-white rounded-xl font-medium">{t('auth.login')}</Link>
    </div>
  );

  if (loading) return <div className="text-center py-16 text-gray-400">{t('common.loading')}</div>;

  if (items.length === 0) return (
    <div className="text-center py-16">
      <Heart className="w-14 h-14 text-gray-200 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-gray-900 mb-2">{t('wishlist.emptyTitle')}</h3>
      <p className="text-gray-500 mb-6 text-sm">{t('wishlist.emptyDesc')}</p>
      <Link to="/negozio" className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90">{t('wishlist.exploreShop')}</Link>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">{t('wishlist.title')} ({items.length})</h1>
      </div>
      {/* Stessa griglia e stessa card usate ovunque nel sito: 2 colonne già da mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
        {items.map(item => {
          const p = item.products;
          if (!p) return null;
          return (
            <ProductCard
              key={item.id}
              product={{ id: p.id, name: p.name, price: p.price, images: p.images, vendor_id: p.vendor_id, stock: p.stock }}
              onRemove={() => removeItem(item.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
