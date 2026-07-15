import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Minus, Plus, Heart, Share2, Truck, RotateCcw, Shield, Star, ShoppingCart, Loader2, AlertCircle, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { addToRecentlyViewed } from '../components/RecentlyViewed';
import { ProductQA } from '../components/ProductQA';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';

interface Review { id: string; user_name: string; rating: number; comment: string; created_at: string; vendor_reply: string | null; vendor_reply_at: string | null; }
interface Product {
  id: string; vendor_id: string; name: string; description: string; price: number; stock: number;
  category: string; images: string[]; sku: string | null; brand: string | null;
  specifications: string | null; is_sponsored: boolean;
  vendors: { id: string; business_name: string; verified_badge: boolean } | null;
}
const FALLBACK = '/images/product-placeholder.svg';

export function Product() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user, profile } = useAuth();
  const isBuyer = (profile as any)?.user_type !== 'venditore' && (profile as any)?.user_type !== 'admin';
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [activeTab, setActiveTab] = useState<'desc'|'spec'>('desc');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [boughtTogether, setBoughtTogether] = useState<any[]>([]);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (id) { loadProduct(); loadReviews(); loadRelated(); } }, [id]);

  // Verifica se il prodotto è già nei preferiti dell'utente loggato
  useEffect(() => {
    const checkWishlist = async () => {
      if (!id) return;
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) return;
      const { data } = await supabase.from('wishlists')
        .select('id').eq('user_id', u.id).eq('product_id', id).maybeSingle();
      setInWishlist(!!data);
    };
    checkWishlist();
  }, [id]);

  const toggleWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    if (!id) return;
    if (inWishlist) {
      await supabase.from('wishlists').delete().eq('user_id', user.id).eq('product_id', id);
      setInWishlist(false);
    } else {
      const { error } = await supabase.from('wishlists').insert([{ user_id: user.id, product_id: id }]);
      if (!error) setInWishlist(true);
    }
  };

  // Traccia prodotto visto (localStorage)
  useEffect(() => {
    if (product) {
      addToRecentlyViewed({
        id: product.id, name: product.name, price: product.price,
        image: product.images?.[0] || '', vendor: product.vendors?.business_name || '',
      });
    }
  }, [product]);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => setShowStickyBar(!e.isIntersecting), { threshold: 0.1 });
    if (ctaRef.current) obs.observe(ctaRef.current);
    return () => obs.disconnect();
  }, [product]);

  const loadProduct = async () => {
    setLoading(true);
    try {
      const { data, error: err } = await supabase.from('products').select('*, vendors(id, business_name, verified_badge)').eq('id', id!).single();
      if (err) throw err;
      setProduct(data as any);
    } catch { setError('Prodotto non trovato.'); }
    finally { setLoading(false); }
  };

  const loadReviews = async () => {
    if (!id) return;
    setReviewLoading(true);
    try {
      const { data } = await supabase.from('product_reviews').select('id, user_name, rating, comment, created_at, vendor_reply, vendor_reply_at').eq('product_id', id).order('created_at', { ascending: false });
      setReviews((data as any) || []);
    } catch {}
    finally { setReviewLoading(false); }
  };

  const loadRelated = async () => {
    if (!id) return;
    try {
      const { data: prod } = await supabase.from('products').select('id, name, price, images, vendor_id, vendors(business_name)').eq('status', 'published').gt('stock', 0).neq('id', id).limit(20);
      if (!prod?.length) return;
      const { data: curr } = await supabase.from('products').select('category, vendor_id').eq('id', id).single();
      if (curr) {
        const same = prod.filter((p: any) => p.vendor_id === curr.vendor_id || p.category === curr.category).slice(0, 3);
        setBoughtTogether(same);
        setRelatedProducts(prod.filter((p: any) => !same.find((s: any) => s.id === p.id)).slice(0, 8));
      } else { setRelatedProducts(prod.slice(0, 8)); }
    } catch {}
  };

  const doAddToCart = () => {
    if (!product) return;
    addItem({ productId: product.id, vendorId: product.vendors?.id || product.vendor_id, name: product.name, price: product.price, quantity, image: product.images?.[0] || '' });
    setAddedToCart(true); setTimeout(() => setAddedToCart(false), 2500);
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  if (loading) return <div className="flex items-center justify-center min-h-96"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;
  if (error || !product) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h2 className="text-xl font-bold mb-2">Prodotto non trovato</h2>
      <Link to="/negozio" className="px-6 py-3 bg-primary text-white rounded-lg">Torna al Negozio</Link>
    </div>
  );

  const images = product.images?.length ? product.images : [FALLBACK];
  const inStock = product.stock > 0;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">

      {/* Breadcrumb desktop */}
      <div className="hidden md:block bg-white border-b py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-gray-500">
            <Link to="/" className="hover:text-primary">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/negozio" className="hover:text-primary">Negozio</Link>
            <ChevronRight className="w-3 h-3" />
            <Link to={`/negozio/categoria/${product.category}`} className="hover:text-primary capitalize">{product.category}</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-800 line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-0 md:px-4 lg:px-8 py-0 md:py-6">
        <div className="flex flex-col lg:flex-row gap-0 lg:gap-6">

          {/* ── Immagini ── */}
          <div className="lg:w-[45%] lg:sticky lg:top-20 lg:self-start">
            <div className="relative bg-white" style={{aspectRatio:'1/1'}}>
              <img src={images[selectedImage]} alt={product.name}
                className="w-full h-full object-contain p-4 md:p-8"
                onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
              {product.is_sponsored && (
                <span className="absolute top-3 right-3 px-2 py-1 bg-amber-500 text-white text-xs rounded-full font-medium">Sponsorizzato</span>
              )}
              {images.length > 1 && <>
                <button onClick={() => setSelectedImage(i => (i - 1 + images.length) % images.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={() => setSelectedImage(i => (i + 1) % images.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 px-4 py-3 bg-white border-t overflow-x-auto">
                {images.map((img, idx) => (
                  <button key={idx} onClick={() => setSelectedImage(idx)}
                    className={`w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === idx ? 'border-primary' : 'border-gray-200 hover:border-gray-300'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Dettagli ── */}
          <div className="flex-1 space-y-2 md:space-y-4">

            {/* Info principale */}
            <div className="bg-white px-4 py-4 md:rounded-xl md:border md:border-gray-200 md:p-6">
              <p className="text-xs text-primary font-semibold uppercase tracking-wide mb-1">{product.brand || product.category}</p>
              <h1 className="text-lg md:text-2xl font-bold text-gray-900 leading-snug mb-2">{product.name}</h1>

              {/* Rating */}
              <a href="#reviews" className="flex items-center gap-2 mb-3 w-fit">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />
                  ))}
                </div>
                <span className="text-sm text-primary hover:underline">
                  {reviews.length > 0 ? `${avgRating.toFixed(1)} (${reviews.length})` : 'Nessuna recensione'}
                </span>
              </a>

              {/* Venditore */}
              {product.vendors && (
                <Link to={`/negozio/venditore/${product.vendors.id}`}
                  className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 hover:opacity-80 transition-opacity w-fit">
                  <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xs">
                    {product.vendors.business_name.charAt(0)}
                  </div>
                  <span className="text-sm text-gray-600">
                    Venduto da <span className="font-semibold text-primary underline">{product.vendors.business_name}</span>
                    {product.vendors.verified_badge && <CheckCircle className="w-3.5 h-3.5 text-primary inline ml-1" />}
                  </span>
                </Link>
              )}

              {/* Prezzo */}
              <div className="mb-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-gray-900">€{Number(product.price).toFixed(2)}</span>
                  <span className="text-xs text-gray-500">IVA inclusa</span>
                </div>
              </div>

              {/* Disponibilità */}
              <p className={`text-sm font-semibold mb-3 ${inStock ? 'text-green-600' : 'text-red-500'}`}>
                {inStock ? `Disponibile — ${product.stock} pezzi` : 'Esaurito'}
              </p>

              {product.sku && <p className="text-xs text-gray-400 mb-3">SKU: {product.sku}</p>}

              {/* Quantità */}
              {isBuyer && (
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-sm font-medium text-gray-700">Qtà:</span>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                    <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={!inStock}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-colors">
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-semibold text-sm">{quantity}</span>
                    <button onClick={() => setQuantity(Math.min(product.stock, quantity + 1))} disabled={!inStock}
                      className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 disabled:opacity-40 transition-colors">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* CTA ref */}
              <div ref={ctaRef} className="space-y-2.5">
                {isBuyer && (
                  <>
                    <button onClick={doAddToCart} disabled={!inStock}
                      className={`w-full py-3.5 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-all text-sm active:scale-[0.98] disabled:opacity-40 ${addedToCart ? 'bg-green-600' : 'bg-amber-500 hover:bg-amber-600'}`}>
                      {addedToCart ? <><CheckCircle className="w-5 h-5" />Aggiunto al Carrello!</> : <><ShoppingCart className="w-5 h-5" />Aggiungi al Carrello</>}
                    </button>
                    <button onClick={() => { doAddToCart(); navigate('/carrello'); }} disabled={!inStock}
                      className="w-full py-3.5 rounded-xl font-semibold text-white bg-primary hover:bg-primary/90 active:scale-[0.98] transition-all text-sm disabled:opacity-40">
                      Acquista Ora
                    </button>
                  </>
                )}
                <div className="flex gap-2">
                  <button onClick={toggleWishlist}
                    className={`flex-1 py-2.5 rounded-xl border text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${inWishlist ? 'border-red-300 text-red-500 bg-red-50' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                    <Heart className={`w-4 h-4 ${inWishlist ? 'fill-red-500' : ''}`} />
                    {inWishlist ? 'Salvato' : 'Salva'}
                  </button>
                  <button className="flex-1 py-2.5 rounded-xl border border-gray-300 text-sm font-medium flex items-center justify-center gap-1.5 text-gray-600 hover:bg-gray-50 transition-colors">
                    <Share2 className="w-4 h-4" />Condividi
                  </button>
                </div>
              </div>

              {/* Garanzie */}
              <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                {[{I: Truck, l:'Spedizione', s:'dal fornitore'},{I: RotateCcw, l:'Reso', s:'entro 30 gg'},{I: Shield, l:'Pagamento', s:'sicuro'}].map(({I, l, s}) => (
                  <div key={l} className="flex flex-col items-center gap-1">
                    <I className="w-5 h-5 text-primary" />
                    <p className="text-xs font-semibold text-gray-800">{l}</p>
                    <p className="text-xs text-gray-500">{s}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Descrizione/Specifiche */}
            <div className="bg-white px-4 py-4 md:rounded-xl md:border md:border-gray-200">
              <div className="flex gap-6 border-b border-gray-200 mb-4">
                {([['desc','Descrizione'],['spec','Specifiche']] as const).map(([k, l]) => (
                  <button key={k} onClick={() => setActiveTab(k)}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === k ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>
                    {l}
                  </button>
                ))}
              </div>
              {activeTab === 'desc'
                ? <p className="text-sm text-gray-700 leading-relaxed">{product.description || 'Nessuna descrizione disponibile.'}</p>
                : product.specifications
                  ? <p className="text-sm text-gray-700 whitespace-pre-line">{product.specifications}</p>
                  : <p className="text-sm text-gray-500">Nessuna specifica disponibile.</p>
              }
            </div>

            {/* Comprato insieme */}
            {boughtTogether.length > 0 && (
              <div className="bg-white px-4 py-4 md:rounded-xl md:border md:border-gray-200">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Comprato spesso insieme</h2>
                <div className="flex items-start gap-3 overflow-x-auto pb-2">
                  <div className="flex-shrink-0 w-28 text-center border-2 border-primary/30 rounded-xl p-2.5 bg-primary/5">
                    <img src={product.images?.[0] || FALLBACK} alt={product.name} className="w-14 h-14 object-cover rounded-lg mx-auto mb-1.5"
                      onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                    <p className="text-xs font-semibold text-gray-900 line-clamp-2">{product.name}</p>
                    <p className="text-sm font-bold text-primary mt-0.5">€{Number(product.price).toFixed(2)}</p>
                  </div>
                  {boughtTogether.map((bp: any) => (
                    <div key={bp.id} className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-lg text-gray-400">+</span>
                      <a href={`/negozio/prodotto/${bp.id}`} className="w-28 text-center border border-gray-200 rounded-xl p-2.5 hover:border-primary/50 transition-colors">
                        <img src={bp.images?.[0] || FALLBACK} alt={bp.name} className="w-14 h-14 object-cover rounded-lg mx-auto mb-1.5"
                          onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                        <p className="text-xs font-semibold text-gray-900 line-clamp-2">{bp.name}</p>
                        <p className="text-sm font-bold text-primary mt-0.5">€{Number(bp.price).toFixed(2)}</p>
                      </a>
                    </div>
                  ))}
                  <div className="flex-shrink-0 flex items-center">
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center w-28">
                      <p className="text-xs text-gray-500 mb-0.5">Totale</p>
                      <p className="text-base font-black text-primary">€{(Number(product.price) + boughtTogether.reduce((s: number, p: any) => s + Number(p.price), 0)).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Prodotti correlati */}
            {relatedProducts.length > 0 && (
              <div className="bg-white px-4 py-4 md:rounded-xl md:border md:border-gray-200">
                <h2 className="text-sm font-bold text-gray-900 mb-3">Potrebbe interessarti anche</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {relatedProducts.slice(0, 8).map((rp: any) => (
                    <a key={rp.id} href={`/negozio/prodotto/${rp.id}`}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-primary/30 transition-all group">
                      <div className="aspect-square bg-gray-50 overflow-hidden">
                        <img src={rp.images?.[0] || FALLBACK} alt={rp.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={e => { (e.target as HTMLImageElement).src = FALLBACK; }} />
                      </div>
                      <div className="p-2.5">
                        <p className="text-xs text-gray-500 truncate">{(rp.vendors as any)?.business_name}</p>
                        <p className="text-xs font-semibold text-gray-900 line-clamp-2 leading-snug mt-0.5">{rp.name}</p>
                        <p className="text-sm font-bold text-primary mt-1.5">€{Number(rp.price).toFixed(2)}</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Q&A Prodotto */}
            <div className="bg-white px-4 py-4 md:rounded-xl md:border md:border-gray-200">
              <ProductQA productId={product.id} vendorProfileId={(product.vendors as any)?.profile_id} />
            </div>

            {/* Recensioni */}
            <div id="reviews" className="bg-white px-4 py-4 md:rounded-xl md:border md:border-gray-200">
              <h2 className="text-base font-bold text-gray-900 mb-1">
                Recensioni{reviews.length > 0 && <span className="text-primary ml-1">({reviews.length})</span>}
              </h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-0.5">{[...Array(5)].map((_,i) => <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />)}</div>
                  <span className="text-sm text-gray-600">{avgRating.toFixed(1)} su 5</span>
                </div>
              )}
              <div className="space-y-3 mb-5">
                {reviewLoading
                  ? <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                  : reviews.length === 0
                    ? <div className="text-center py-6 bg-gray-50 rounded-xl border border-gray-100"><Star className="w-7 h-7 text-gray-300 mx-auto mb-2" /><p className="text-sm text-gray-500">Nessuna recensione ancora. Sii il primo!</p></div>
                    : reviews.map(r => (
                      <div key={r.id} className="bg-gray-50 rounded-xl p-3.5 border border-gray-100">
                        <div className="flex items-start justify-between mb-1">
                          <div><p className="text-sm font-semibold text-gray-900">{r.user_name}</p><p className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('it-IT',{day:'2-digit',month:'short',year:'numeric'})}</p></div>
                          <div className="flex gap-0.5">{[...Array(5)].map((_,i) => <Star key={i} className={`w-3.5 h-3.5 ${i < r.rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`} />)}</div>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{r.comment}</p>
                        {r.vendor_reply && (
                          <div className="mt-2.5 ml-3 pl-3 border-l-2 border-primary/40 bg-primary/5 rounded-r-lg py-2 pr-2">
                            <p className="text-xs font-semibold text-primary mb-0.5">
                              Risposta del venditore {r.vendor_reply_at && `· ${new Date(r.vendor_reply_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                            </p>
                            <p className="text-sm text-gray-700">{r.vendor_reply}</p>
                          </div>
                        )}
                      </div>
                    ))
                }
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 text-center">
                <ShoppingCart className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-700 mb-1">Hai acquistato questo prodotto?</p>
                <p className="text-xs text-gray-500 mb-3">Le recensioni si scrivono dalla pagina "I Miei Ordini", solo per acquisti verificati.</p>
                <Link to="/account/ordini" className="inline-block px-4 py-2 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90">
                  Vai ai miei ordini
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Sticky CTA mobile */}
      {showStickyBar && isBuyer && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 shadow-2xl">
          <div className="flex gap-2 items-center">
            <div className="flex-1 min-w-0 mr-1">
              <p className="text-xs text-gray-500 truncate">{product.name}</p>
              <p className="text-lg font-black text-gray-900">€{Number(product.price).toFixed(2)}</p>
            </div>
            <button onClick={doAddToCart} disabled={!inStock}
              className={`flex-1 py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-1.5 transition-colors ${addedToCart ? 'bg-green-600' : 'bg-amber-500 hover:bg-amber-600'} disabled:opacity-40`}>
              {addedToCart ? <><CheckCircle className="w-4 h-4" />Aggiunto!</> : <><ShoppingCart className="w-4 h-4" />Aggiungi</>}
            </button>
            <button onClick={() => { doAddToCart(); navigate('/carrello'); }} disabled={!inStock}
              className="flex-1 py-3 rounded-xl font-semibold text-white bg-primary text-sm disabled:opacity-40">
              Acquista
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
