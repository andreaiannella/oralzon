import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { RecentlyViewed, getRecentlyViewed, RecentProduct } from '../components/RecentlyViewed';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/ProductCardSkeleton';
import { HomeDealCards } from '../components/HomeDealCards';
import { SponsoredHeroCard } from '../components/SponsoredHeroCard';
import { getInterestCategories } from '../../lib/interestInference';
import { isDiscountActive } from '../../lib/discountSchedule';
import { localizeCategoryName, localizeCategoryDescription } from '../../lib/categoryTranslations';
import { localizeCategorySlug } from '../../lib/categorySlugs';
import {
  ChevronRight, Beaker, Droplet, Shield as ShieldIcon,
  Stethoscope, Package, TrendingUp, Store, CheckCircle,
  ShieldCheck, Truck, LifeBuoy, RotateCcw
} from 'lucide-react';
import catMonouso from '../../imports/cat_monouso.svg';
import catSterilizzazione from '../../imports/cat_sterilizzazione.svg';
import catImplantologia from '../../imports/cat_implantologia.svg';
import catOrtodonzia from '../../imports/cat_ortodonzia.svg';
import catEndodonzia from '../../imports/cat_endodonzia.svg';
import catDisinfezione from '../../imports/cat_disinfezione.svg';
import bannerForniture from '../../imports/banner_forniture.webp';
import bannerVendiOralzon from '../../imports/banner_vendi_oralzon.webp';

import { supabase } from '../../lib/supabase';
import { usePageSEO } from '../../lib/usePageSEO';
import { GShop } from '../../lib/googleIcons';
import { useAuth } from '../../contexts/AuthContext';

interface HomeProduct {
  id: string;
  vendor_id: string;
  name: string;
  category?: string;
  price: number;
  images: string[];
  images_thumb?: string[] | null;
  is_sponsored: boolean;
  vendors: { id: string; business_name: string; verified_badge: boolean } | null;
}


// Sezione prodotti con loader
function ProductSection({ title, subtitle, products, loading, badge, badgeColor, badgeTextColor, link }: {
  title: string; subtitle?: string; products: HomeProduct[];
  loading: boolean; badge?: string; badgeColor?: string; badgeTextColor?: string; link?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">{title}</h2>
          {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        </div>
        {link && (
          <Link to={link} className="text-primary hover:underline flex items-center gap-1 text-sm">
            {t('home.viewAll')} <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      {loading ? (
        <ProductGridSkeleton />
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
  const { t, i18n } = useTranslation();
  usePageSEO({ title: t('home.metaTitle'), language: i18n.language });
  const { user, profile } = useAuth();
  const [activeBanner, setActiveBanner] = useState(0);
  const [offers, setOffers] = useState<HomeProduct[]>([]);
  const [sponsored, setSponsored] = useState<HomeProduct[]>([]);
  const [bestsellers, setBestsellers] = useState<HomeProduct[]>([]);
  const [featuredStores, setFeaturedStores] = useState<any[]>([]);
  const [boughtAgain, setBoughtAgain] = useState<HomeProduct[]>([]);
  const [continueShopping, setContinueShopping] = useState<RecentProduct[]>([]);
  const [interestCategories, setInterestCategories] = useState<string[]>([]);
  const [activeDeals, setActiveDeals] = useState<HomeProduct[]>([]);
  const [recommended, setRecommended] = useState<HomeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // "Comprati di nuovo" — punto di massima visibilità per il riordino
  // rapido, zero click nello storico ordini invece dei quattro che
  // servirebbero passando da Account → Ordini. Solo per clienti loggati
  // con almeno un acquisto passato — venditori/admin e visitatori
  // anonimi non hanno storico d'acquisto, la sezione semplicemente non appare.
  useEffect(() => {
    if (!user || (profile as any)?.user_type !== 'cliente') { setBoughtAgain([]); return; }
    loadBoughtAgain();
  }, [user, (profile as any)?.user_type]);

  const loadBoughtAgain = async () => {
    try {
      // Ultimi 20 ordini (già in ordine cronologico decrescente) sono più
      // che sufficienti per trovare una dozzina di prodotti distinti —
      // evita di dover ordinare per una colonna di una tabella collegata,
      // che con il client Supabase è scomodo da esprimere in una query sola.
      const { data: orders } = await supabase
        .from('orders')
        .select('created_at, order_items(product_id)')
        .eq('customer_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(20);

      const seen = new Set<string>();
      const distinctIds: string[] = [];
      for (const order of (orders || []) as any[]) {
        for (const item of (order.order_items || [])) {
          if (item.product_id && !seen.has(item.product_id)) {
            seen.add(item.product_id);
            distinctIds.push(item.product_id);
          }
        }
        if (distinctIds.length >= 12) break;
      }
      if (distinctIds.length === 0) { setBoughtAgain([]); return; }

      const { data: products } = await supabase.from('products')
        .select('id, vendor_id, name, price, discount_price, discount_starts_at, discount_ends_at, images, images_thumb, is_sponsored, stock, translations, vendors(id, business_name, verified_badge)')
        .in('id', distinctIds)
        .eq('status', 'published');

      // .in() non garantisce l'ordine dei risultati — riordina secondo
      // distinctIds, così il prodotto comprato più di recente resta primo.
      const byId = new Map(((products as any) || []).map((p: any) => [p.id, p]));
      setBoughtAgain(distinctIds.map(id => byId.get(id)).filter(Boolean) as HomeProduct[]);
    } catch (err) {
      console.error('Errore caricamento comprati di nuovo:', err);
      setBoughtAgain([]);
    }
  };

  // "Continua ad acquistare" — prodotti visti di recente (localStorage,
  // già raccolti da RecentlyViewed su ogni pagina prodotto) ma NON ancora
  // comprati. Si aggiorna anche quando arriva boughtAgain, per escludere
  // correttamente chi nel frattempo ha completato l'acquisto.
  useEffect(() => {
    const boughtIds = new Set(boughtAgain.map(p => p.id));
    setContinueShopping(getRecentlyViewed().filter(p => !boughtIds.has(p.id)));
  }, [boughtAgain]);

  // Interessi inferiti dal comportamento (acquisti + prodotti visti) — mai
  // da dati dichiarati, mai da tracciamento cross-sito. Funziona anche per
  // visitatori anonimi (i prodotti visti sono già in localStorage), non
  // solo per clienti loggati.
  useEffect(() => {
    getInterestCategories(user?.id || null).then(setInterestCategories);
  }, [user?.id]);

  // Applica gli interessi a "ultimi arrivi" e "bestseller" — gira DOPO il
  // caricamento iniziale generico (che resta veloce, non aspetta questo
  // calcolo), poi affina il risultato se emergono interessi. Se non c'è
  // alcun segnale, non tocca nulla: mai personalizzare a vuoto.
  useEffect(() => {
    if (interestCategories.length === 0) return;
    personalizeSections();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interestCategories]);

  const personalizeSections = async () => {
    const select = 'id, vendor_id, name, category, price, discount_price, discount_starts_at, discount_ends_at, images, images_thumb, is_sponsored, stock, translations, vendors(id, business_name, verified_badge)';
    try {
      // Ultimi arrivi: query dedicata filtrata per le categorie di interesse,
      // completata con i generici se non basta a riempire la sezione.
      const { data: personalizedNewest } = await supabase.from('products').select(select)
        .eq('is_sponsored', false).eq('status', 'published')
        .in('category', interestCategories)
        .order('created_at', { ascending: false })
        .limit(10);
      const personalized = (personalizedNewest || []) as HomeProduct[];
      if (personalized.length < 10) {
        setOffers(prev => {
          const seen = new Set(personalized.map(p => p.id));
          const filler = prev.filter(p => !seen.has(p.id)).slice(0, 10 - personalized.length);
          return [...personalized, ...filler];
        });
      } else {
        setOffers(personalized);
      }
    } catch (err) {
      console.error('Errore personalizzazione ultimi arrivi:', err);
    }

    // Bestseller: nessuna nuova query, semplice riordino stabile del pool
    // già caricato dando priorità a chi è nelle categorie di interesse.
    setBestsellers(prev => {
      const interest = new Set(interestCategories);
      return [...prev].sort((a, b) => {
        const aIn = a.category && interest.has(a.category) ? 1 : 0;
        const bIn = b.category && interest.has(b.category) ? 1 : 0;
        return bIn - aIn; // stable sort: a parità, resta l'ordine originale per vendite
      });
    });

    // Consigliati per te: vetrina esplicita e dedicata, diversa da "Ultimi
    // arrivi" (ordinato per data): qui prendiamo un pool più ampio nelle
    // categorie di interesse e lo mescoliamo, per non ripetere sempre la
    // stessa selezione a ogni visita.
    try {
      const { data: recData } = await supabase.from('products').select(select)
        .eq('status', 'published')
        .in('category', interestCategories)
        .limit(30);
      const pool = (recData || []) as HomeProduct[];
      const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, 10);
      setRecommended(shuffled);
    } catch (err) {
      console.error('Errore caricamento consigliati per te:', err);
    }
  };

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
      const select = 'id, vendor_id, name, category, price, discount_price, discount_starts_at, discount_ends_at, images, images_thumb, is_sponsored, stock, translations, vendors(id, business_name, verified_badge)';

      // PERFORMANCE: prima recuperiamo solo le statistiche di vendita (tabella
      // piccola e aggregata, query veloce) — servono a sapere QUALI ID
      // prodotto interrogare per i bestseller. Prima questa dipendenza
      // veniva risolta aspettando che finissero TUTTE le altre 4 query in
      // parallelo, e SOLO DOPO si partiva con un quinto giro di rete in
      // sequenza per i prodotti bestseller — un'intera chiamata aggiuntiva
      // in coda invece che in parallelo con le altre. Ora la query stats
      // (leggera) parte da sola per prima, e il risultato viene usato per
      // lanciare la query prodotti bestseller INSIEME alle altre 3, tutte
      // in un unico Promise.all.
      const { data: statsData } = await supabase
        .from('public_product_sales_stats')
        .select('product_id, total_sold')
        .order('total_sold', { ascending: false })
        .limit(50);

      const salesMap: Record<string, number> = {};
      (statsData || []).forEach((row: any) => { salesMap[row.product_id] = row.total_sold; });
      const topProductIds = (statsData || []).slice(0, 10).map((row: any) => row.product_id);

      const [sponsoredRes, newestRes, storesRes, bsProductsRes, dealsRes] = await Promise.all([
        // Prodotti sponsorizzati (con controllo scadenza) — mostrati sempre, anche
        // se esauriti: un prodotto sponsorizzato che sparisse dalla home appena
        // finite le scorte vanificherebbe la sponsorizzazione già pagata dal venditore.
        supabase.from('products').select(select)
          .eq('is_sponsored', true)
          .or(`promo_expires_at.is.null,promo_expires_at.gt.${new Date().toISOString()}`)
          .limit(10),
        // Ultimi aggiunti
        supabase.from('products').select(select)
          .eq('is_sponsored', false)
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(10),
        // Store in evidenza (sponsorizzazione homepage attiva)
        supabase.from('vendors')
          .select('id, business_name, verified_badge')
          .eq('homepage_sponsored', true)
          .or(`homepage_expires_at.is.null,homepage_expires_at.gt.${new Date().toISOString()}`)
          .limit(10),
        // Più acquistati: prodotti veri, solo se abbiamo trovato ID nelle statistiche
        topProductIds.length > 0
          ? supabase.from('products').select(select).in('id', topProductIds).eq('status', 'published')
          : Promise.resolve({ data: [] as any[] }),
        // Offerte attive: filtro ampio in SQL (prezzo scontato valorizzato),
        // poi isDiscountActive() applica la stessa identica logica di date
        // usata ovunque nel sito, per coerenza totale con card/pagina prodotto/checkout.
        supabase.from('products').select(select)
          .eq('status', 'published')
          .not('discount_price', 'is', null)
          .gt('discount_price', 0)
          .limit(30),
      ]);

      const sponsoredData = (sponsoredRes.data || []) as any;
      const newestData = (newestRes.data || []) as any;

      // Riordina per numero di vendite (la query .in non garantisce l'ordine)
      const bestsellersData = ((bsProductsRes.data || []) as any[]).sort((a: any, b: any) =>
        (salesMap[b.id] || 0) - (salesMap[a.id] || 0)
      );

      setSponsored(sponsoredData);
      setOffers(newestData);
      setBestsellers(bestsellersData);
      setActiveDeals(((dealsRes.data || []) as HomeProduct[]).filter(p => isDiscountActive(p as any)).slice(0, 10));
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
          due formati diversi, non la stessa cosa a due dimensioni.
          PERFORMANCE: prima questa sezione era solo nascosta via CSS
          (hidden lg:block) — ma un <img> nascosto via CSS scarica comunque
          la sua immagine, sprecando dati e banda proprio nel momento in cui
          l'app sta caricando i prodotti veri. Dentro l'app nativa il
          viewport è SEMPRE mobile, quindi qui saltiamo la sezione del
          tutto: zero richieste per immagini che non verranno mai mostrate. */}
      {!Capacitor.isNativePlatform() && (
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
      )}

      {/* Card in evidenza stile Amazon — SOLO mobile/app, griglia 2x2 di
          prodotti dentro pannelli compatti. Nascoste su desktop web, dove
          resta il banner grande sopra. */}
      <section className="lg:hidden bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <HomeDealCards cards={dealCards} />
        </div>
      </section>

      {/* "Comprati di nuovo" è ora integrato come prima card del carosello
          categorie qui sotto, non più una sezione standalone separata. */}

      {/* Categorie + Acquista di nuovo — carosello orizzontale unico stile
          Amazon, senza titolo di sezione sopra: la card "Acquista di
          nuovo" (se il cliente ha già ordinato qualcosa) apre il flusso,
          seguita da tutte le categorie in card compatte scorrevoli. */}
      <section className="py-8 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            {boughtAgain.length > 0 && (
              <Link to="/account/ordini"
                className="w-[42vw] sm:w-52 flex-shrink-0 snap-start rounded-2xl p-4 pb-5 block transition-transform active:scale-[0.98] bg-oralzon-deep-mint">
                <h3 className="font-bold text-base leading-snug mb-3 text-white">{t('home.boughtAgainTitle')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {boughtAgain.slice(0, 4).map((p, idx) => (
                    <div key={idx} className="bg-white rounded-xl aspect-square overflow-hidden flex items-center justify-center p-2 shadow-sm">
                      <img src={p.images?.[0]} alt={p.name} className="w-full h-full object-contain" loading="lazy" />
                    </div>
                  ))}
                </div>
              </Link>
            )}
            {continueShopping.length > 0 && (
              <Link to={`/negozio/prodotto/${continueShopping[0].id}`}
                className="w-[42vw] sm:w-52 flex-shrink-0 snap-start rounded-2xl p-4 pb-5 block transition-transform active:scale-[0.98] bg-oralzon-pale-mint">
                <h3 className="font-bold text-base leading-snug mb-3 text-oralzon-steel-ink">{t('home.continueShopping')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {continueShopping.slice(0, 4).map((p, idx) => (
                    <div key={idx} className="bg-white rounded-xl aspect-square overflow-hidden flex items-center justify-center p-2 shadow-sm">
                      <img src={p.image} alt={p.name} className="w-full h-full object-contain" loading="lazy" />
                    </div>
                  ))}
                </div>
              </Link>
            )}
            {categories.map(cat => (
              <Link key={cat.slug} to={`/negozio/categoria/${localizeCategorySlug(cat.name, cat.slug, i18n.language)}`}
                className="group w-[42vw] sm:w-52 flex-shrink-0 snap-start bg-white rounded-2xl p-5 hover:shadow-lg transition-all border border-border hover:border-primary text-center">
                <div className="bg-accent border-2 border-primary w-12 h-12 rounded-full flex items-center justify-center mb-3 mx-auto group-hover:scale-110 transition-transform">
                  <img src={(cat as any).img} alt={localizeCategoryName(cat.name, i18n.language)} className="w-7 h-7 object-contain" />
                </div>
                <h3 className="text-sm font-medium mb-1 group-hover:text-primary transition-colors">{localizeCategoryName(cat.name, i18n.language)}</h3>
                <p className="text-xs text-oralzon-chrome-silver">{localizeCategoryDescription(cat.name, cat.desc, i18n.language)}</p>
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

      {/* Offerte attive */}
      {(loading || activeDeals.length > 0) && (
        <section className="py-12">
          <ProductSection
            title={t('home.activeDealsTitle')}
            subtitle={t('home.activeDealsDesc')}
            products={activeDeals}
            loading={loading}
            link="/negozio"
          />
        </section>
      )}

      {/* Consigliati per te — appare solo se emergono interessi reali dal
          comportamento (acquisti/visti): mai una sezione vuota o generica
          spacciata per personalizzata. */}
      {recommended.length > 0 && (
        <section className="py-12 bg-muted/60">
          <ProductSection
            title={t('home.recommendedTitle')}
            subtitle={t('home.recommendedDesc')}
            products={recommended}
            loading={false}
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

      {/* Sponsorizzato hero — tra "ultimi prodotti" e "bestseller", come
          richiesto. Sezione distinta dal carosello "Prodotti Sponsorizzati"
          più sopra: un solo prodotto in evidenza, pool sponsor diverso. */}
      <SponsoredHeroCard interestCategories={interestCategories} />

      {/* Bestseller */}
      <section className="py-12 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">{t('home.bestsellers')}</h2>
              <p className="text-muted-foreground mt-1">{t('home.bestsellersDesc')}</p>
            </div>
            <Link to="/negozio" className="text-primary hover:underline flex items-center gap-1 text-sm flex-shrink-0">
              {t('home.viewAll')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {loading ? (
            <ProductGridSkeleton />
          ) : bestsellers.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-border">
              <p className="text-muted-foreground">{t('home.soonBestsellers')}</p>
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

      {/* Vantaggi per chi compra su Oralzon */}
      <section className="py-12 bg-white border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">{t('home.whyChooseTitle')}</h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-sm text-gray-900">{t('home.feature1Title')}</p>
              <p className="text-xs text-muted-foreground">{t('home.feature1Desc')}</p>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                <RotateCcw className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-sm text-gray-900">{t('home.feature2Title')}</p>
              <p className="text-xs text-muted-foreground">{t('home.feature2Desc')}</p>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                <Truck className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-sm text-gray-900">{t('home.feature3Title')}</p>
              <p className="text-xs text-muted-foreground">{t('home.feature3Desc')}</p>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                <LifeBuoy className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-sm text-gray-900">{t('home.feature4Title')}</p>
              <p className="text-xs text-muted-foreground">{t('home.feature4Desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Store in Evidenza */}
      {featuredStores.length > 0 && (
        <section className="py-12 bg-white border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">{t('home.featuredStoresTitle')}</h2>
                <p className="text-sm text-muted-foreground">{t('home.featuredStoresSubtitle')}</p>
              </div>
              <Link to="/negozio" className="text-primary hover:underline flex items-center gap-1 text-sm flex-shrink-0">
                {t('home.viewAll')} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
              {featuredStores.slice(0, 10).map(store => (
                <Link key={store.id} to={`/negozio/venditore/${store.id}`}
                  className="w-[80vw] sm:w-auto flex-shrink-0 snap-start flex items-center gap-4 bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all group">
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <GShop className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-gray-900 text-sm truncate group-hover:text-primary transition-colors">{store.business_name}</p>
                      {store.verified_badge && <CheckCircle className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                    </div>
                    {store.verified_badge && <span className="text-xs text-primary font-medium">{t('vendorStore.verifiedSeller')}</span>}
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
              <h2 className="text-3xl mb-3">{t('home.vendorCtaTitle')}</h2>
              <p className="text-lg opacity-90 mb-6">{t('home.vendorCtaSubtitle')}</p>
              <div className="flex gap-4 flex-wrap">
                <Link to="/diventa-venditore" className="px-8 py-3 bg-white text-primary rounded-lg hover:bg-gray-100 transition-colors font-medium">
                  {t('home.banner2Title')}
                </Link>
                <Link to="/pricing-venditori" className="px-8 py-3 border-2 border-white text-white rounded-lg hover:bg-white/10 transition-colors">
                  {t('home.viewPlans')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
