import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingCart, ArrowRight, Package, Loader2 } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function Cart() {
  const { items, removeItem, updateQuantity, total, itemCount, clearCart } = useCart();
  const [items2Shipping, setItems2Shipping] = useState<Record<string, number | null>>({}); // productId -> override o null
  const [vendorShipping, setVendorShipping] = useState<Record<string, { cost: number; threshold: number }>>({});
  const { profile } = useAuth();
  const navigate = useNavigate();
  const isVendor = (profile as any)?.user_type === 'venditore';
  const isAdmin = (profile as any)?.user_type === 'admin';

  useEffect(() => {
    if (isVendor) { navigate('/venditore/dashboard'); return; }
    if (isAdmin) { navigate('/dashboard-admin'); return; }
  }, [isVendor, isAdmin]);

  useEffect(() => {
    if (items.length > 0) loadVendorShipping();
  }, [items]);

  const loadVendorShipping = async () => {
    const vendorIds = [...new Set(items.map(i => i.vendorId).filter(Boolean))];
    const productIds = [...new Set(items.map(i => i.productId).filter(Boolean))];
    if (!vendorIds.length) return;
    const [{ data: vendorsData }, { data: productsData }] = await Promise.all([
      supabase.from('vendors').select('id, shipping_cost, free_shipping_threshold').in('id', vendorIds),
      supabase.from('products').select('id, shipping_cost_override').in('id', productIds),
    ]);
    if (vendorsData) {
      const map: Record<string, { cost: number; threshold: number }> = {};
      vendorsData.forEach((v: any) => {
        map[v.id] = {
          cost: Number(v.shipping_cost || 0),
          threshold: Number(v.free_shipping_threshold || 0),
        };
      });
      setVendorShipping(map);
    }
    if (productsData) {
      const map: Record<string, number | null> = {};
      productsData.forEach((p: any) => {
        map[p.id] = p.shipping_cost_override !== null && p.shipping_cost_override !== undefined ? Number(p.shipping_cost_override) : null;
      });
      setItems2Shipping(map);
    }
  };

  // Calcola spedizione per vendor: articoli "standard" confrontati con la soglia
  // di spedizione gratuita, articoli con costo di spedizione personalizzato
  // (es. prodotti pesanti/ingombranti) aggiunti a parte, al massimo tra quelli
  // presenti — stessa logica applicata (in modo autoritativo) dal backend.
  const getVendorShippingCost = (vendorId: string): number => {
    const vendorItems = items.filter(i => i.vendorId === vendorId);
    const standardItems = vendorItems.filter(i => items2Shipping[i.productId] === null || items2Shipping[i.productId] === undefined);
    const overrideItems = vendorItems.filter(i => items2Shipping[i.productId] !== null && items2Shipping[i.productId] !== undefined);

    let cost = 0;
    if (standardItems.length > 0) {
      const vs = vendorShipping[vendorId];
      if (vs) {
        const standardSubtotal = standardItems.reduce((s, i) => s + i.price * i.quantity, 0);
        const isFree = vs.threshold > 0 && standardSubtotal >= vs.threshold;
        cost += isFree ? 0 : vs.cost;
      }
    }
    if (overrideItems.length > 0) {
      cost += Math.max(...overrideItems.map(i => items2Shipping[i.productId] as number));
    }
    return cost;
  };

  const vendorIds = [...new Set(items.map(i => i.vendorId).filter(Boolean))];
  const totalShipping = vendorIds.reduce((s, vid) => s + getVendorShippingCost(vid), 0);
  const grandTotal = total + totalShipping;

  if (isVendor || isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Il carrello è vuoto</h2>
        <p className="text-gray-500 mb-6">Aggiungi prodotti dal negozio per iniziare.</p>
        <Link to="/negozio" className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary/90 transition-colors">
          Vai al Negozio
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Carrello ({itemCount} {itemCount === 1 ? 'prodotto' : 'prodotti'})</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-5 flex gap-5">
              <Link to={`/negozio/prodotto/${item.productId}`} className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>
                )}
              </Link>
              <div className="flex-1 min-w-0">
                <Link to={`/negozio/prodotto/${item.productId}`} className="text-sm font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2">{item.name}</Link>
                <p className="text-lg font-bold text-primary mt-1">€{Number(item.price).toFixed(2)}</p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center border border-gray-200 rounded-lg">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="p-2 hover:bg-gray-50 disabled:opacity-30"><Minus className="w-4 h-4" /></button>
                    <span className="px-4 text-sm font-medium min-w-[2rem] text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-2 hover:bg-gray-50"><Plus className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold">Totale: €{(item.price * item.quantity).toFixed(2)}</span>
                    <button onClick={() => removeItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Riepilogo Ordine</h3>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotale</span>
                <span>€{total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Spedizione</span>
                <span className={totalShipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {totalShipping === 0 ? 'Gratis' : `€${totalShipping.toFixed(2)}`}
                </span>
              </div>
              {/* Mostra soglia spedizione gratis se applicabile */}
              {vendorIds.map(vid => {
                const vs = vendorShipping[vid];
                if (!vs || vs.threshold === 0 || vs.cost === 0) return null;
                const vendorTotal = items.filter(i => i.vendorId === vid).reduce((s, i) => s + i.price * i.quantity, 0);
                const missing = vs.threshold - vendorTotal;
                if (missing <= 0) return null;
                return (
                  <p key={vid} className="text-xs text-green-600">
                    Spedizione gratuita sopra i €{vs.threshold.toFixed(2)} (mancano €{missing.toFixed(2)})
                  </p>
                );
              })}
            </div>
            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between"><span className="font-bold text-lg">Totale</span><span className="font-bold text-lg text-primary">€{grandTotal.toFixed(2)}</span></div>
            </div>
            <Link to="/checkout" className="block w-full py-3.5 bg-primary text-white text-center rounded-xl font-semibold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              Procedi al Checkout <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/negozio" className="block w-full py-3 mt-3 text-center text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm">
              Continua lo Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
