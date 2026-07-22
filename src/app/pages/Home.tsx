import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RecentlyViewed } from '../components/RecentlyViewed';
import { ProductCard } from '../components/ProductCard';
import { HomeDealCards } from '../components/HomeDealCards';
import {
  ChevronRight, Beaker, Droplet, Shield as ShieldIcon, Sparkles,
  Stethoscope, Package, TrendingUp, Store, CheckCircle, Loader2
} from 'lucide-react';
import { FEATURED_CATEGORIES } from '../../constants/categories';
import catMonouso from '../../imports/cat_monouso.svg';
import catSterilizzazione from '../../imports/cat_sterilizzazione.svg';
import catImplantologia from '../../imports/cat_implantologia.svg';
import catOrtodonzia from '../../imports/cat_ortodonzia.svg';
import catEndodonzia from '../../imports/cat_endodonzia.svg';
import catDisinfezione from '../../imports/cat_disinfezione.svg';
import bannerForniture from '../../imports/banner_forniture.png';
import bannerVendiOralzon from '../../imports/banner_vendi_oralzon.png';

import { supabase } from '../../lib/supabase';

interface HomeProduct {
  id: string;
  vendor_id: string;
  name: string;
  price: number;
  images: string[];
  is_sponsored: boolean;
  vendors: { id: string; business_name: string; verified_badge: boolean } | null;
}


// Sezione prodotti con loader
function ProductSection({ title, subtitle, products, loading, badge, badgeColor, badgeTextColor, link }: {
  title: string; subtitle?: string; products: HomeProduct[];
  loading: boolean; badge?: string; badgeColor?: string; badgeTextColor?: string; link?: string;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">{title}</h2>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        {link && (
          <Link to={link} className="text-primary hover:underline flex items-center gap-1 text-sm">
            Vedi tutti <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-muted rounded-xl">
          <p className="text-muted-foreground">Nessun prodotto disponibile al momento.</p>
          <p className="text-sm text-muted-foreground mt-1">I vendor stanno caricando il catalogo.</p>
        </div>
      ) : (
        <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
          {products.slice(0, 10).map(p => (
            <div key={p.id} className="w-[42vw] sm:w-auto flex-shrink-0 snap-start">
              <ProductCard product={p} badge={badge} badgeColor={badgeColor} badgeTextColor={badgeTextColor} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function Home() {
  const { t } = useTranslation();
  const [activeBanner, setActiveBanner] = useState(0);
  const [offers, setOffers] = useState<HomeProduct[]>([]);
  const [sponsored, setSponsored] = useState<HomeProduct[]>([]);
  const [bestsellers, setBestsellers] = useState<HomeProduct[]>([]);
  const [featuredStores, setFeaturedStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Auto-rotate banner ogni 5 secondi — solo desktop, dove il banner grande
  // è visibile (su mobile/app usiamo le card compatte, niente rotazione).
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveBanner(prev => (prev + 1) % 2);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const banners = [
    {
      title: t('home.banner1Title'),
      subtitle: t('home.banner1Sub'),
      cta: t('home.browseCatalog'),
      link: '/negozio',
      img: bannerForniture,
      imgAlt: 'Forniture odontoiatriche professionali',
    },
    {
      title: t('home.banner2Title'),
      subtitle: t('home.banner2Sub'),
      cta: t('home.becomeVendor'),
      link: '/diventa-venditore',
      img: bannerVendiOralzon,
      imgAlt: 'Vendi su Oralzon — spedizione e gestione ordini',
    },
  ];

  // Tile della griglia 2x2 per la card "Forniture Odontoiatriche Professionali":
  // appena i prodotti sono caricati usiamo foto vere del catalogo (sponsorizzati
  // prima, poi novità), finché non arrivano mostriamo le icone di categoria
  // come segnaposto coerente col mondo dentale, mai un riquadro vuoto.
  const supplyProducts = [...sponsored, ...offers].filter(p => p.images?.[0]).slice(0, 4);
  const supplyTiles = supplyProducts.length > 0
    ? supplyProducts.map(p => ({ img: p.images[0], alt: p.name }))
    : [
        { img: catMonouso, alt: 'Materiali monouso' },
        { img: catSterilizzazione, alt: 'Sterilizzazione' },
        { img: catImplantologia, alt: 'Implantologia' },
        { img: catOrtodonzia, alt: 'Ortodonzia' },
      ];

  // Tile per la card "Vendi su Oralzon": non essendo prodotti dell'utente ma
  // un invito a diventare venditore, mostriamo le categorie principali del
  // marketplace per far capire subito cosa si può vendere.
  const sellTiles = [
    { img: catImplantologia, alt: 'Implantologia' },
    { img: catOrtodonzia, alt: 'Ortodonzia' },
    { img: catEndodonzia, alt: 'Endodonzia' },
    { img: catDisinfezione, alt: 'Disinfezione' },
  ];

  const dealCards = [
    {
      title: t('home.banner1Title') || 'Forniture Odontoiatriche Professionali',
      link: '/negozio',
      bg: 'bg-oralzon-pale-mint',
      titleColor: 'text-oralzon-steel-ink',
      tiles: supplyTiles,
      loading: loading && supplyProducts.length === 0,
    },
    {
      title: t('home.banner2Title') || 'Vendi su Oralzon',
      link: '/diventa-venditore',
      bg: 'bg-oralzon-deep-mint',
      titleColor: 'text-white',
      tiles: sellTiles,
    },
  ];

  const categories = [
    { name: 'Monouso', img: catMonouso, slug: 'monouso', desc: 'Guanti, mascherine, camici' },
    { name: 'Sterilizzazione', img: catSterilizzazione, slug: 'sterilizzazione', desc: 'Autoclavi, accessori, test' },
    { name: 'Implantologia', img: catImplantologia, slug: 'implantologia', desc: 'Impianti e componenti' },
    { name: 'Ortodonzia', img: catOrtodonzia, slug: 'ortodonzia', desc: 'Bracket, fili, elastici' },
    { name: 'Endodonzia', img: catEndodonzia, slug: 'endodonzia', desc: 'Lime, otturazioni' },
    { name: 'Disinfezione', img: catDisinfezione, slug: 'disinfezione', desc: 'Spray, salviette, detergenti' },
  ];

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const select = 'id, vendor_id, name, price, images, is_sponsored, vendors(id, business_name, verified_badge)';

      // Query parallele: sponsorizzati, ultimi aggiunti, più venduti
      const [sponsoredRes, newestRes, bestsellerRes, storesRes] = await Promise.all([
        // Prodotti sponsorizzati (con controllo scadenza)
        supabase.from('products').select(select)
          .eq('is_sponsored', true)
          .gt('stock', 0)
          .or(`promo_expires_at.is.null,promo_expires_at.gt.${new Date().toISOString()}`)
          .limit(10),
        // Ultimi aggiunti
        supabase.from('products').select(select)
          .eq('is_sponsored', false).gt('stock', 0)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(10),
        // Più acquistati: statistiche aggregate pubbliche (bypassano RLS di order_items)
        supabase.from('public_product_sales_stats')
          .select('product_id, total_sold')
          .order('total_sold', { ascending: false })
          .limit(50),
        // Store in evidenza (sponsorizzazione homepage attiva)
        supabase.from('vendors')
          .select('id, business_name, logo_url, store_description, main_category, verified_badge')
          .eq('homepage_sponsored', true)
          .or(`homepage_expires_at.is.null,homepage_expires_at.gt.${new Date().toISOString()}`)
          .limit(10),
      ]);

      const sponsoredData = (sponsoredRes.data || []) as any;
      const newestData = (newestRes.data || []) as any;

      // I dati arrivano già aggregati dalla vista pubblica, ordinati per venduto
      const salesMap: Record<string, number> = {};
      (bestsellerRes.data || []).forEach((row: any) => {
        salesMap[row.product_id] = row.total_sold;
      });
      const topProductIds = (bestsellerRes.data || [])
        .slice(0, 10)
        .map((row: any) => row.product_id);

      let bestsellersData: any[] = [];
      if (topProductIds.length > 0) {
        const { data: bsProducts } = await supabase
          .from('products')
          .select(select)
          .in('id', topProductIds)
          .gt('stock', 0)
          .eq('status', 'published');
        // Riordina per numero di vendite
        bestsellersData = (bsProducts || []).sort((a: any, b: any) =>
          (salesMap[b.id] || 0) - (salesMap[a.id] || 0)
        );
      }

      setSponsored(sponsoredData);
      setOffers(newestData);
      setBestsellers(bestsellersData);
      setFeaturedStores((storesRes.data || []) as any);
    } catch (err) {
      console.error('Errore caricamento homepage:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Banner grande — SOLO desktop web. Su mobile/app usiamo le card
          compatte stile Amazon qui sotto: sono due varianti pensate per
          due formati diversi, non la stessa cosa a due dimensioni. */}
      <section className="hidden lg:block bg-gradient-to-br from-accent to-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="rounded-2xl overflow-hidden transition-all duration-700">
            <div className="relative overflow-hidden rounded-2xl" style={{minHeight: '280px'}}>
              <img
                src={banners[activeBanner].img}
                alt={banners[activeBanner].imgAlt}
                className="absolute inset-0 w-full h-full object-cover transition-all duration-700"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-white/92 via-white/75 to-white/10" />
              <div className="relative z-10 px-8 md:px-14 py-12 max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground leading-tight drop-shadow-sm">
                  {banners[activeBanner].title}
                </h2>
                <p className="text-base text-gray-700 mb-8 max-w-lg leading-relaxed">
                  {banners[activeBanner].subtitle}
                </p>
                <Link to={banners[activeBanner].link}
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-secondary text-white rounded-xl hover:bg-secondary/90 transition-all font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  {banners[activeBanner].cta} <ChevronRight className="w-5 h-5" />
                </Link>
                <div className="flex gap-2 mt-8">
                  {banners.map((_, idx) => (
                    <button key={idx} onClick={() => setActiveBanner(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${idx === activeBanner ? 'bg-secondary w-8' : 'bg-oralzon-chrome-silver/60 w-2 hover:bg-oralzon-chrome-silver'}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Card in evidenza stile Amazon — SOLO mobile/app, griglia 2x2 di
          prodotti dentro pannelli compatti. Nascoste su desktop web, dove
          resta il banner grande sopra. */}
      <section className="lg:hidden bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <HomeDealCards cards={dealCards} />
        </div>
      </section>

      {/* Nav categorie */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-8 overflow-x-auto py-4">
            {FEATURED_CATEGORIES.map(cat => (
              <Link key={cat} to={`/negozio/categoria/${cat.toLowerCase()}`}
                className="text-gray-700 hover:text-primary whitespace-nowrap font-medium transition-colors text-sm">
                {cat}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Categorie */}
      <section className="py-12 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl">{t('home.categories')}</h2>
            <Link to="/negozio" className="text-primary hover:underline flex items-center gap-1 text-sm">
              Vedi tutte <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.slice(0, 4).map(cat => (
              <Link key={cat.slug} to={`/negozio/categoria/${cat.slug}`}
                className="group bg-white rounded-xl p-5 hover:shadow-lg transition-all border border-border hover:border-primary text-center">
                <div className="bg-accent border-2 border-primary w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                  <img src={(cat as any).img} alt={cat.name} className="w-7 h-7 object-contain" />
                </div>
                <h3 className="text-sm font-medium mb-1 group-hover:text-primary transition-colors">{cat.name}</h3>
                <p className="text-xs text-oralzon-chrome-silver">{cat.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Prodotti sponsorizzati */}
      {(loading || sponsored.length > 0) && (
        <section className="py-12 bg-muted/60">
          <ProductSection
            title={t('home.sponsored')}
            subtitle={t('home.sponsoredDesc')}
            products={sponsored}
            loading={loading}
            badge="Sponsorizzato"
            badgeColor="bg-white"
            badgeTextColor="text-oralzon-steel-ink"
            link="/negozio"
          />
        </section>
      )}

      {/* Prodotti visti di recente */}
      <RecentlyViewed />

      {/* Nuovi arrivi / Offerte */}
      <section className="py-12">
        <ProductSection
          title={t('home.latestProducts')}
          subtitle={t('home.latestProductsDesc')}
          products={offers}
          loading={loading}
          badge="Nuovo"
          badgeColor="bg-secondary"
          link="/negozio"
        />
      </section>

      {/* Bestseller */}
      <section className="py-12 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">Più Acquistati</h2>
              <p className="text-muted-foreground mt-1">I prodotti più popolari sul marketplace</p>
            </div>
            <Link to="/negozio" className="text-primary hover:underline flex items-center gap-1 text-sm flex-shrink-0">
              Vedi tutti <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : bestsellers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-border">
              <p className="text-muted-foreground">Presto disponibili i bestseller.</p>
            </div>
          ) : (
            <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {bestsellers.slice(0, 10).map(p => (
                <div key={p.id} className="w-[42vw] sm:w-auto flex-shrink-0 snap-start">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Store in Evidenza */}
      {featuredStores.length > 0 && (
        <section className="py-12 bg-white border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">Store in Evidenza</h2>
                <p className="text-sm text-muted-foreground">Fornitori selezionati e affidabili sul marketplace</p>
              </div>
              <Link to="/negozio" className="text-primary hover:underline flex items-center gap-1 text-sm flex-shrink-0">
                Vedi tutti <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {featuredStores.slice(0, 10).map(store => (
                <Link key={store.id} to={`/negozio/venditore/${store.id}`}
                  className="w-[80vw] sm:w-auto flex-shrink-0 snap-start flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all group">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {store.logo_url
                      ? <img src={store.logo_url} alt={store.business_name} className="w-full h-full object-cover" />
                      : <span className="text-xl font-black text-primary">{store.business_name.charAt(0)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-gray-900 text-sm truncate group-hover:text-primary transition-colors">{store.business_name}</p>
                      {store.verified_badge && <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                    </div>
                    {store.main_category && <p className="text-xs text-gray-500 truncate">{store.main_category}</p>}
                    {store.verified_badge && <span className="text-xs text-primary font-medium">Venditore verificato</span>}
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Vendor CTA */}
      <section className="py-16 bg-gradient-to-br from-primary to-secondary text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-8">
            <Store className="w-20 h-20 opacity-80 hidden md:block" />
            <div className="flex-1">
              <h2 className="text-3xl mb-3">Sei un Produttore o Fornitore Odontoiatrico?</h2>
              <p className="text-lg opacity-90 mb-6">Apri il tuo store su Oralzon e raggiungi studi dentistici in tutta Italia.</p>
              <div className="flex gap-4 flex-wrap">
                <Link to="/diventa-venditore" className="px-8 py-3 bg-white text-primary rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  Vendi su Oralzon
                </Link>
                <Link to="/pricing-venditori" className="px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white/10 transition-colors">
                  Vedi i Piani
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div><div className="text-4xl mb-2 text-primary">100%</div><p className="text-muted-foreground">Fornitori Verificati</p></div>
            <div><CheckCircle className="w-9 h-9 mb-2 text-primary mx-auto" /><p className="text-muted-foreground">Pagamenti Sicuri</p></div>
            <div><div className="text-4xl mb-2 text-primary">24-48h</div><p className="text-muted-foreground">Spedizione Media</p></div>
            <div><div className="text-4xl mb-2 text-primary">24/7</div><p className="text-muted-foreground">Supporto Disponibile</p></div>
          </div>
        </div>
      </section>
    </div>
  );
}
