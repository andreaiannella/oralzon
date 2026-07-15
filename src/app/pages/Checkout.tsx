import { useState, useEffect } from 'react';
import { Truck, Lock, ShieldCheck, Loader2, AlertCircle, Package } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { AddressBook } from '../components/AddressBook';

const SUPABASE_URL = 'https://ckslkfshimzuujtpboui.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrc2xrZnNoaW16dXVqdHBib3VpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3NTIwODIsImV4cCI6MjA5NDMyODA4Mn0.vhwaSLVWzVC9OGK7I4hE5V2P5H3A9V690YE9ELM-2eY';
const EDGE_URL = `${SUPABASE_URL}/functions/v1/make-server-000b3cfb`;

interface ShippingData {
  firstName: string; lastName: string; email: string; phone: string;
  address: string; zipCode: string; city: string; province: string;
}

export function Checkout() {
  const { t } = useTranslation();
  const { items, total, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const isVendor = (profile as any)?.user_type === 'venditore';
  const isAdmin = (profile as any)?.user_type === 'admin';

  useEffect(() => {
    if (isVendor) { navigate('/venditore/dashboard'); return; }
    if (isAdmin) { navigate('/dashboard-admin'); return; }
  }, [isVendor, isAdmin]);

  const [step, setStep] = useState<'shipping' | 'redirecting'>('shipping');
  const [error, setError] = useState('');
  const [shippingData, setShippingData] = useState<ShippingData>({
    firstName: '', lastName: '', email: user?.email || '', phone: '',
    address: '', zipCode: '', city: '', province: '',
  });
  const [vendorShipping, setVendorShipping] = useState<Record<string, number>>({});
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (items.length === 0) { navigate('/carrello'); return; }
    loadVendorShipping();
    loadUserProfile();
  }, [user, items]);

  // Pre-popola i dati di spedizione dal profilo utente
  const loadUserProfile = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('nome, cognome, telefono, indirizzo_spedizione_via, indirizzo_spedizione_cap, indirizzo_spedizione_citta, indirizzo_spedizione_provincia')
        .eq('id', user.id)
        .single();
      if (profile) {
        setShippingData(prev => ({
          firstName: (profile as any).nome || prev.firstName,
          lastName: (profile as any).cognome || prev.lastName,
          email: user.email || prev.email,
          phone: (profile as any).telefono || prev.phone,
          address: (profile as any).indirizzo_spedizione_via || prev.address,
          zipCode: (profile as any).indirizzo_spedizione_cap || prev.zipCode,
          city: (profile as any).indirizzo_spedizione_citta || prev.city,
          province: (profile as any).indirizzo_spedizione_provincia || prev.province,
        }));
      }
    } catch {}
  };

  // Carica le spese di spedizione configurate da ogni vendor, incluse le
  // eventuali eccezioni per prodotto (es. articoli pesanti/ingombranti)
  const loadVendorShipping = async () => {
    const vendorIds = [...new Set(items.map(i => i.vendorId).filter(Boolean))];
    const productIds = [...new Set(items.map(i => i.productId).filter(Boolean))];
    if (vendorIds.length === 0) return;
    const [{ data: vendorsData }, { data: productsData }] = await Promise.all([
      supabase.from('vendors').select('id, shipping_cost, free_shipping_threshold').in('id', vendorIds),
      supabase.from('products').select('id, shipping_cost_override').in('id', productIds),
    ]);
    const overrideMap: Record<string, number | null> = {};
    (productsData || []).forEach((p: any) => {
      overrideMap[p.id] = p.shipping_cost_override !== null && p.shipping_cost_override !== undefined ? Number(p.shipping_cost_override) : null;
    });
    if (vendorsData) {
      const shippingMap: Record<string, number> = {};
      vendorsData.forEach((v: any) => {
        const vendorItems = items.filter(i => i.vendorId === v.id);
        const standardItems = vendorItems.filter(i => overrideMap[i.productId] === null || overrideMap[i.productId] === undefined);
        const overrideItems = vendorItems.filter(i => overrideMap[i.productId] !== null && overrideMap[i.productId] !== undefined);

        let cost = 0;
        if (standardItems.length > 0) {
          const standardSubtotal = standardItems.reduce((s, i) => s + i.price * i.quantity, 0);
          const freeThreshold = Number(v.free_shipping_threshold || 0);
          const isFree = freeThreshold > 0 && standardSubtotal >= freeThreshold;
          cost += isFree ? 0 : Number(v.shipping_cost || 0);
        }
        if (overrideItems.length > 0) {
          cost += Math.max(...overrideItems.map(i => overrideMap[i.productId] as number));
        }
        shippingMap[v.id] = cost;
      });
      setVendorShipping(shippingMap);
    }
  };

  // Totale spedizione aggregato
  const totalShipping = Object.values(vendorShipping).reduce((s, c) => s + c, 0);
  const discountAmount = couponApplied?.discount || 0;
  const grandTotal = Math.max(0, total + totalShipping - discountAmount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const { data: coupon } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('code', couponCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (!coupon) { setCouponError(t('checkout.invalidOrExpiredCode')); return; }
      if (coupon.applies_to === 'subscription') { setCouponError(t('checkout.codeSubscriptionOnly')); return; }
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) { setCouponError(t('checkout.codeExpired')); return; }
      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) { setCouponError(t('checkout.codeUsedUp')); return; }
      if (coupon.min_order_amount && total < coupon.min_order_amount) {
        setCouponError(t('checkout.minOrderForCode', { amount: coupon.min_order_amount })); return;
      }

      let discount = 0;
      if (coupon.type === 'percentage') discount = total * (coupon.value / 100);
      else if (coupon.type === 'fixed') discount = Math.min(coupon.value, total);
      discount = Math.round(discount * 100) / 100;

      setCouponApplied({ code: coupon.code, discount });
      setCouponError('');
    } catch {
      setCouponError(t('checkout.codeCheckError'));
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCouponCode('');
    setCouponError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStep('redirecting');

    try {
      // Recupera la sessione auth corrente
      const { data: { session } } = await supabase.auth.getSession();
      const authToken = session?.access_token || SUPABASE_ANON_KEY;

      const res = await fetch(`${EDGE_URL}/stripe/create-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          items: items.map(item => ({
            productId: item.productId,
            vendorId: item.vendorId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
          })),
          shippingData,
          customerId: user!.id,
          appOrigin: window.location.origin,
          shippingCost: totalShipping,
          discountCode: couponApplied?.code || null,
          discountAmount: discountAmount,
        }),
      });

      const data = await res.json();

      if (!data.success || !data.sessionUrl) {
        // Se la key Stripe non è configurata, mostra messaggio chiaro
        if (data.error?.includes('STRIPE') || data.error?.includes('Stripe')) {
          throw new Error('La chiave Stripe non è configurata. Vai su Supabase → Edge Functions → Secrets e aggiungi STRIPE_SECRET_KEY.');
        }
        throw new Error(data.error || 'Errore nella creazione del pagamento. Verifica che la chiave Stripe sia configurata in Supabase.');
      }

      clearCart();
      window.location.href = data.sessionUrl;

    } catch (err: any) {
      setError(err.message || t('checkout.unexpectedError'));
      setStep('shipping');
    }
  };

  const handleChange = (field: keyof ShippingData) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setShippingData(prev => ({ ...prev, [field]: e.target.value }));

  if (isVendor || isAdmin) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (step === 'redirecting') return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700">{t('checkout.preparingPayment')}</p>
        <p className="text-sm text-gray-400 mt-1">{t('checkout.redirectingToStripe')}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link to="/carrello" className="text-gray-400 hover:text-gray-600"><span>←</span></Link>
        <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-800">{t('checkout.paymentError')}</p>
            <p className="text-sm text-red-600 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form spedizione */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">{t('checkout.shippingAddress')}</h2>
                <p className="text-sm text-gray-500">{t('checkout.whereDeliver')}</p>
              </div>
            </div>

            {/* Rubrica indirizzi salvati */}
            <AddressBook onSelect={(addr) => setShippingData(prev => ({
              ...prev,
              firstName: addr.firstName,
              lastName: addr.lastName,
              address: addr.address,
              zipCode: addr.zipCode,
              city: addr.city,
              province: addr.province,
              phone: addr.phone,
            }))} />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.firstName')} <span className="text-red-500">*</span></label>
                <input required value={shippingData.firstName} onChange={handleChange('firstName')} placeholder="Mario" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.lastName')} <span className="text-red-500">*</span></label>
                <input required value={shippingData.lastName} onChange={handleChange('lastName')} placeholder="Rossi" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.email')} <span className="text-red-500">*</span></label>
                <input type="email" required value={shippingData.email} onChange={handleChange('email')} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.phone')} <span className="text-red-500">*</span></label>
                <input type="tel" required value={shippingData.phone} onChange={handleChange('phone')} placeholder="+39 333 1234567" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary" />
              </div>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.address')} <span className="text-red-500">*</span></label>
              <input required value={shippingData.address} onChange={handleChange('address')} placeholder="Via Roma 1" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary" />
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.zipCode')} <span className="text-red-500">*</span></label>
                <input required maxLength={5} value={shippingData.zipCode} onChange={handleChange('zipCode')} placeholder="00100" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.city')} <span className="text-red-500">*</span></label>
                <input required value={shippingData.city} onChange={handleChange('city')} placeholder="Roma" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('checkout.province')} <span className="text-red-500">*</span></label>
                <input required maxLength={2} value={shippingData.province} onChange={e => setShippingData(p => ({...p, province: e.target.value.toUpperCase()}))} placeholder="RM" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary uppercase" />
              </div>
            </div>

            <div className="flex items-center gap-2 p-4 bg-green-50 rounded-xl border border-green-200 mb-6">
              <ShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700">{t('checkout.securePayment')} <strong>Stripe</strong>. {t('checkout.paymentNotTransmitted')}</p>
            </div>

            <button type="submit" className="w-full py-3.5 bg-primary text-white rounded-xl font-bold text-sm sm:text-base hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
              <Lock className="w-4 h-4 flex-shrink-0" />
              <span>{t('checkout.proceedSecurePayment')}</span>
            </button>
          </form>
        </div>

        {/* Riepilogo */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 sticky top-24">
            <h3 className="font-bold text-gray-900 mb-4">{t('checkout.summary')} ({items.length} {items.length === 1 ? t('checkout.product') : t('checkout.products')})</h3>
            <div className="space-y-3 mb-4">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-5 h-5 text-gray-300" /></div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                    <p className="text-xs text-gray-500">{t('common.quantity')}: {item.quantity}</p>
                  </div>
                  <span className="text-sm font-bold">€{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-2 mb-4">
              <div className="flex justify-between text-sm"><span className="text-gray-600">{t('checkout.subtotal')}</span><span>€{total.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t('checkout.shipping')}</span>
                <span className={totalShipping === 0 ? 'text-green-600 font-medium' : ''}>
                  {totalShipping === 0 ? t('checkout.free') : `€${totalShipping.toFixed(2)}`}
                </span>
              </div>
              {totalShipping === 0 && items.length > 0 && <p className="text-xs text-green-600">{t('checkout.freeShippingOffer')}</p>}
              {couponApplied && (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>{t('checkout.discountLabel')} ({couponApplied.code})</span>
                  <span>-€{discountAmount.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Coupon */}
            <div className="border-t border-gray-100 pt-4 mb-4">
              {couponApplied ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <span className="text-sm text-green-700 font-medium">{couponApplied.code} {t('checkout.codeApplied')}</span>
                  <button onClick={removeCoupon} className="text-xs text-red-500 hover:underline">{t('checkout.remove')}</button>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('checkout.haveDiscountCode')}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(''); }}
                      placeholder={t('checkout.enterCode')}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary uppercase font-mono"
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={!couponCode.trim() || couponLoading}
                      className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-semibold hover:bg-gray-900 disabled:opacity-40 transition-colors">
                      {couponLoading ? '...' : t('checkout.apply')}
                    </button>
                  </div>
                  {couponError && <p className="text-xs text-red-500 mt-1">{couponError}</p>}
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between font-bold text-lg"><span>{t('checkout.total')}</span><span className="text-primary">€{grandTotal.toFixed(2)}</span></div>
              <p className="text-xs text-gray-400 mt-1">{t('checkout.vatIncluded')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
