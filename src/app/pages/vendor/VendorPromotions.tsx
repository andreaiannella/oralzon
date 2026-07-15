import { useState, useEffect } from 'react';
import { Loader2, CheckCircle, Star, Monitor, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import { callEdge } from '../../../lib/edgeApi';
import { getCurrentVendor } from '../../../lib/vendor';

const PACKAGES = [
  {
    group: 'Prodotti in Evidenza',
    desc: 'Scegli fino a 5 prodotti da mettere in evidenza in homepage e nei risultati di ricerca',
    icon: Star,
    color: 'text-amber-500',
    items: [
      { id: 'featured_monthly', label: 'Mensile', price: 99, period: '/mese', badge: '', note: '5 prodotti · 30 giorni' },
      { id: 'featured_quarterly', label: 'Trimestrale', price: 249, period: '/3 mesi', badge: 'Risparmia 15%', note: '5 prodotti · 90 giorni' },
    ]
  },
  {
    group: 'Sponsorizzazione Homepage',
    desc: 'Il tuo store appare nella sezione sponsorizzata della homepage, visibile a tutti i visitatori',
    icon: Monitor,
    color: 'text-secondary',
    items: [
      { id: 'homepage_monthly', label: 'Settimanale', price: 199, period: '/settimana', badge: '', note: 'Posizione: rotazione' },
      { id: 'homepage_fixed', label: 'Mensile', price: 699, period: '/mese', badge: 'Risparmia 12%', note: 'Posizione: fissa' },
    ]
  },
  {
    group: 'Sponsorizzazione Categoria',
    desc: 'I tuoi prodotti appaiono in cima alla pagina della categoria scelta',
    icon: Sparkles,
    color: 'text-secondary',
    items: [
      { id: 'category_single', label: 'Singola Categoria', price: 149, period: '/mese', badge: '', note: '1 categoria · 30 giorni' },
      { id: 'category_multi', label: 'Multi Categoria', price: 399, period: '/mese', badge: 'Risparmia 10%', note: '3 categorie · 30 giorni' },
    ]
  },
];

const CATEGORIES = ['Monouso','Sterilizzazione','Strumenti Odontoiatrici','Implantologia','Ortodonzia','Endodonzia','Materiali da Impronta','Protesica','Radiologia','Arredi Studio','Disinfezione','Consumabili','Igiene Orale Professionale'];

export function VendorPromotions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);
  const [activePromos, setActivePromos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  // Per selezione categoria/prodotti
  const [showModal, setShowModal] = useState<{ packageId: string; packageTitle: string; price: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  useEffect(() => { loadData(); }, [user]);

  const loadData = async () => {
    if (!user) return;
    const vendor = await getCurrentVendor();
    if (!vendor) return;

    const [promoRes, prodRes] = await Promise.all([
      supabase.from('promotions').select('*').eq('vendor_id', vendor.id).eq('status', 'active').gte('expires_at', new Date().toISOString()),
      supabase.from('products').select('id, name, images').eq('vendor_id', vendor.id).eq('status', 'published'),
    ]);
    setActivePromos(promoRes.data || []);
    setProducts(prodRes.data || []);
  };

  const handleBuy = (pkg: { id: string; label: string; price: number; group: string }) => {
    if (!user) { navigate('/login'); return; }
    const packageTitle = `${pkg.group} — ${pkg.label}`;
    // Pacchetti che richiedono selezione categoria o prodotti
    if (pkg.id.startsWith('category_') || pkg.id.startsWith('featured_')) {
      setShowModal({ packageId: pkg.id, packageTitle, price: pkg.price });
    } else {
      proceedToCheckout(pkg.id, packageTitle, pkg.price, null, null);
    }
  };

  const proceedToCheckout = async (packageId: string, packageTitle: string, price: number, category: string | null, productIds: string[] | null) => {
    setLoading(packageId);
    setShowModal(null);
    try {
      const result = await callEdge('/stripe/create-promo-checkout', {
        body: {
          packageId, packageTitle, price,
          vendorId: user!.id,
          appOrigin: window.location.origin,
          sponsoredCategory: category,
          selectedProductIds: productIds,
        },
      });
      if (result.success && result.sessionUrl) window.location.href = result.sessionUrl;
      else alert(result.error || 'Errore. Riprova.');
    } catch (e: any) { alert('Errore: ' + (e?.message || 'riprova più tardi.')); }
    finally { setLoading(null); }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Promozioni e Visibilità</h1>
        <p className="text-gray-500 mt-1">Aumenta la visibilità dei tuoi prodotti. Pagamento sicuro via Stripe.</p>
      </div>

      {/* Promozioni attive */}
      {activePromos.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <p className="font-semibold text-green-800 mb-3 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> Promozioni Attive</p>
          <div className="space-y-2">
            {activePromos.map(p => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <span className="font-medium text-green-700">{p.package_name}</span>
                <span className="text-green-600">Scade: {new Date(p.expires_at).toLocaleDateString('it-IT')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pacchetti */}
      {PACKAGES.map(group => (
        <div key={group.group} className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-start gap-3 mb-5">
            <group.icon className={`w-6 h-6 ${group.color} flex-shrink-0 mt-0.5`} />
            <div>
              <h2 className="text-lg font-bold text-gray-900">{group.group}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{group.desc}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {group.items.map(item => (
              <div key={item.id} className={`border rounded-xl p-5 ${activePromos.some(p => p.package_id === item.id) ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-primary hover:shadow-sm'} transition-all`}>
                <div className="flex items-start justify-between mb-2">
                  <p className="font-bold text-gray-900">{item.label}</p>
                  {item.badge && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{item.badge}</span>}
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-2xl font-bold text-primary">€{item.price}</span>
                  <span className="text-gray-400 text-sm">{item.period}</span>
                </div>
                <p className="text-xs text-gray-500 mb-4">{item.note}</p>
                {activePromos.some(p => p.package_id === item.id) ? (
                  <div className="w-full py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium text-center flex items-center justify-center gap-1.5"><CheckCircle className="w-4 h-4" /> Attivo</div>
                ) : (
                  <button onClick={() => handleBuy({ ...item, group: group.group })} disabled={loading === item.id}
                    className="w-full py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 flex items-center justify-center gap-2 disabled:opacity-50">
                    {loading === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Acquista
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Modal selezione categoria/prodotti */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{showModal.packageTitle}</h3>

            {showModal.packageId.startsWith('category_') && (
              <div>
                <p className="text-sm text-gray-600 mb-3">Seleziona la categoria da sponsorizzare:</p>
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {(showModal.packageId === 'category_multi' ? CATEGORIES : CATEGORIES).slice(0, showModal.packageId === 'category_multi' ? CATEGORIES.length : CATEGORIES.length).map(cat => (
                    <label key={cat} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      showModal.packageId === 'category_multi'
                        ? (selectedCategory.split(',').includes(cat) ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300')
                        : (selectedCategory === cat ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300')
                    }`}>
                      <input type={showModal.packageId === 'category_multi' ? 'checkbox' : 'radio'} name="category"
                        checked={showModal.packageId === 'category_multi' ? selectedCategory.split(',').filter(Boolean).includes(cat) : selectedCategory === cat}
                        onChange={() => {
                          if (showModal.packageId === 'category_multi') {
                            const current = selectedCategory.split(',').filter(Boolean);
                            const max = 3;
                            if (current.includes(cat)) setSelectedCategory(current.filter(c => c !== cat).join(','));
                            else if (current.length < max) setSelectedCategory([...current, cat].join(','));
                          } else {
                            setSelectedCategory(cat);
                          }
                        }}
                        className="text-primary" />
                      <span className="text-xs font-medium">{cat}</span>
                    </label>
                  ))}
                </div>
                {showModal.packageId === 'category_multi' && (
                  <p className="text-xs text-gray-500 mb-4">Seleziona fino a 3 categorie ({selectedCategory.split(',').filter(Boolean).length}/3)</p>
                )}
              </div>
            )}

            {showModal.packageId.startsWith('featured_') && products.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-3">Seleziona fino a 5 prodotti da mettere in evidenza:</p>
                <div className="space-y-2 mb-4">
                  {products.map(p => (
                    <label key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedProducts.includes(p.id) ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}>
                      <input type="checkbox" checked={selectedProducts.includes(p.id)}
                        onChange={() => {
                          if (selectedProducts.includes(p.id)) setSelectedProducts(prev => prev.filter(id => id !== p.id));
                          else if (selectedProducts.length < 5) setSelectedProducts(prev => [...prev, p.id]);
                        }}
                        className="text-primary" />
                      {p.images?.[0] && <img src={p.images[0]} alt="" className="w-10 h-10 rounded object-cover flex-shrink-0" />}
                      <span className="text-sm font-medium line-clamp-1">{p.name}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mb-4">Prodotti selezionati: {selectedProducts.length}/5</p>
              </div>
            )}

            {showModal.packageId.startsWith('featured_') && products.length === 0 && (
              <p className="text-sm text-amber-600 mb-4">Non hai ancora prodotti pubblicati. Carica almeno un prodotto prima di acquistare questo pacchetto.</p>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setShowModal(null); setSelectedCategory(''); setSelectedProducts([]); }}
                className="flex-1 py-3 border border-gray-300 rounded-xl text-sm">Annulla</button>
              <button
                disabled={
                  (showModal.packageId.startsWith('category_') && !selectedCategory) ||
                  (showModal.packageId.startsWith('featured_') && selectedProducts.length === 0)
                }
                onClick={() => proceedToCheckout(showModal.packageId, showModal.packageTitle, showModal.price,
                  showModal.packageId.startsWith('category_') ? selectedCategory : null,
                  showModal.packageId.startsWith('featured_') ? selectedProducts : null
                )}
                className="flex-1 py-3 bg-primary text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                Continua al Pagamento →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
