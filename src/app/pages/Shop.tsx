import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, Grid, List, ShoppingCart, Loader2, SearchX, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { SponsoredHeroCard } from '../components/SponsoredHeroCard';
import { DENTAL_CATEGORIES } from '../../constants/categories';
import { localizeCategoryName } from '../../lib/categoryTranslations';
import { delocalizeCategorySlug } from '../../lib/categorySlugs';
import { ProductCard } from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/ProductCardSkeleton';
import { useInfiniteScroll } from '../../lib/useInfiniteScroll';
import { usePageSEO } from '../../lib/usePageSEO';
import { useAuth } from '../../contexts/AuthContext';
import { getInterestCategories } from '../../lib/interestInference';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  images_thumb?: string[] | null;
  is_sponsored: boolean;
  stock: number;
  vendors: { business_name: string; verified_badge: boolean } | null;
}

// Mappa slug italiano -> nome, per risalire dallo slug (in QUALSIASI lingua,
// incluso italiano) al nome categoria canonico — costruita una sola volta,
// fuori dal componente, non serve ricalcolarla ad ogni render.
const ITALIAN_SLUG_TO_NAME: Record<string, string> = Object.fromEntries(DENTAL_CATEGORIES.map(c => [c.slug, c.name]));

/** Converte lo slug in arrivo dall'URL (in qualunque lingua) allo slug italiano usato internamente. */
function resolveCategoryParam(param: string | undefined): string {
  if (!param) return 'all';
  const canonicalName = delocalizeCategorySlug(param, ITALIAN_SLUG_TO_NAME);
  if (!canonicalName) return 'all'; // slug sconosciuto: mostra il catalogo intero invece di un errore
  return DENTAL_CATEGORIES.find(c => c.name === canonicalName)?.slug || 'all';
}

export function Shop() {
  const { category: categoryParam } = useParams<{ category?: string }>();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState(() => resolveCategoryParam(categoryParam));
  const [sortBy, setSortBy] = useState('featured');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [products, setProducts] = useState<Product[]>([]);
  const [interestCategories, setInterestCategories] = useState<string[]>([]);
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 24;

  const categories = [
    { id: 'all', name: t('shop.allProducts') },
    ...DENTAL_CATEGORIES.map(c => ({ id: c.slug, name: localizeCategoryName(c.name, i18n.language) }))
  ];

  // BUG TROVATO: il parametro ?q= nell'URL (usato dai link "vedi tutti i
  // risultati" della ricerca in header) non veniva mai letto — chi ci
  // arrivava si trovava il campo ricerca vuoto e il catalogo intero, non
  // filtrato. Ora si aggiorna anche se si arriva di nuovo su /negozio?q=...
  // da un'altra ricerca mentre si è già su questa pagina.
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null) setSearchQuery(q);
  }, [searchParams]);

  // SEO: titolo/descrizione riflettono la categoria o la ricerca attuale,
  // invece del titolo generico della home su ogni pagina del catalogo.
  const activeCategory = categories.find(c => c.id === selectedCategory);
  const pageTitle = searchQuery
    ? `${t('shop.searchResultsFor', { query: searchQuery })} — Oralzon`
    : selectedCategory !== 'all' && activeCategory
      ? `${activeCategory.name} — Oralzon`
      : `${t('shop.allProducts')} — Oralzon`;
  usePageSEO({ title: pageTitle, language: i18n.language });

  // Ricarica dal server a ogni cambio di categoria, ordinamento o RICERCA.
  // searchQuery è stato aggiunto qui insieme al passaggio della ricerca
  // lato database: prima il filtro era in memoria sui prodotti già
  // caricati, quindi bastava che React ricalcolasse la lista e non serviva
  // nessuna nuova query. Ora che filtra il database, senza questa
  // dipendenza digitare nella barra non ricaricherebbe nulla.
  // Debounce di 300ms: senza, ogni singolo tasto premuto lancerebbe una
  // query — con traffico reale sono migliaia di richieste inutili, e
  // l'ultima risposta ad arrivare potrebbe non essere quella dell'ultimo
  // testo digitato (risultati che "ballano" mentre si scrive).
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1); loadProducts(1, false);
    }, searchQuery ? 300 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, sortBy, searchQuery]);

  // Interessi inferiti dal comportamento — usati solo in vista "tutte le
  // categorie" con ordinamento default, per non scavalcare mai una scelta
  // esplicita dell'utente (prezzo, più recenti) né chi ha pagato per la
  // sponsorizzazione della categoria.
  useEffect(() => {
    getInterestCategories(user?.id || null).then(setInterestCategories);
  }, [user?.id]);

  // Il calcolo interessi è asincrono e può arrivare DOPO il primo batch già
  // caricato e visibile: qui lo riapplichiamo sul batch esistente (nessuna
  // nuova query, solo un riordino locale) così l'utente vede comunque il
  // risultato, senza aspettare un ricaricamento completo della pagina.
  useEffect(() => {
    if (interestCategories.length === 0 || selectedCategory !== 'all' || sortBy !== 'featured') return;
    const interest = new Set(interestCategories);
    setProducts(prev => [...prev].sort((a, b) => {
      const aIn = interest.has(a.category) ? 1 : 0;
      const bIn = interest.has(b.category) ? 1 : 0;
      return bIn - aIn;
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interestCategories]);

  const loadProducts = async (pageArg: number, append: boolean) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const categoryName = selectedCategory !== 'all' ? DENTAL_CATEGORIES.find(c => c.slug === selectedCategory)?.name : null;
      
      // Controlla sponsorizzazioni categoria attive (vista pubblica, bypassa RLS di promotions)
      let sponsoredVendorIds: string[] = [];
      if (categoryName) {
        const { data: activeSponsors } = await supabase
          .from('public_active_category_sponsors')
          .select('vendor_id')
          .like('sponsored_category', `%${categoryName}%`);
        sponsoredVendorIds = (activeSponsors || []).map((s: any) => s.vendor_id);
      }

      let query = supabase
        .from('products')
        .select('id, name, description, price, discount_price, discount_starts_at, discount_ends_at, category, images, images_thumb, is_sponsored, stock, vendor_id, translations, vendors(id, business_name, verified_badge)')
        .eq('status', 'published');

      if (categoryName) query = query.eq('category', categoryName);

      // RICERCA SERVER-SIDE. BUG GRAVE CORRETTO: prima la ricerca non
      // esisteva lato database — si filtrava in JavaScript i soli 24
      // prodotti della pagina già caricata (`products.filter(...)` più
      // sotto). Con un catalogo di poche centinaia di articoli quasi non si
      // notava; a migliaia diventava rotta: cercando "curette" il sistema
      // guardava solo i 24 prodotti che per caso erano visibili e
      // rispondeva "nessun risultato" anche con decine di curette a
      // catalogo. Peggio ancora, i suggerimenti nella barra di ricerca
      // interrogavano già il database davvero: il cliente vedeva il
      // prodotto suggerito mentre digitava e poi zero risultati premendo
      // Invio.
      //
      // Cerchiamo su products.search_text, colonna generata da Postgres che
      // concatena nome + marca + SKU (un venditore cerca spesso per codice
      // articolo), indicizzata con GIN trigram — vedi migrazione
      // products_search_text_column. Una colonna sola invece di un OR su
      // tre significa piano di esecuzione sempre indicizzato, e nessuna
      // sintassi .or() da sanificare: un utente che cerca "pinza, 13cm"
      // non spezza più la query.
      // RICERCA PER PAROLE. Prima qui si faceva ILIKE sull'intera frase, che
      // trovava un prodotto solo se le parole comparivano nell'ordine esatto
      // e adiacenti: su dieci ricerche realistiche provate sul catalogo vero
      // otto davano zero risultati pur essendoci il prodotto — "mascherine
      // monouso" non trovava "Mascherina Monouso" (plurale), "pinza how" non
      // trovava "Pinza Ortodontica How" (parola in mezzo), "lampada led
      // polimerizzazione" falliva sull'ordine.
      //
      // Ora la selezione la fa search_product_ids in SQL (migrazioni
      // product_search_by_words e product_search_synonyms): ogni parola deve
      // corrispondere per somiglianza trigram o come sottostringa senza
      // spazi, e la frase viene espansa con i sinonimi di settore presenti
      // nella tabella search_synonyms — "boticone" trova le pinze da
      // estrazione, "carta occlusale" trova la carta articolare.
      // Restituisce
      // identificativi, che qui diventano un semplice filtro: così restano
      // intatti categoria, ordinamento, sponsorizzazioni, conteggio e
      // paginazione della query esistente.
      const q = searchQuery.trim();
      if (q) {
        const { data: matches, error: searchErr } = await supabase.rpc('search_product_ids', { q });
        if (searchErr) {
          console.error('Ricerca prodotti fallita:', searchErr.message);
          // Ripiego sul metodo precedente: meglio una ricerca rigida che
          // una pagina catalogo vuota se la funzione non risponde.
          query = query.ilike('search_text', `%${q}%`);
        } else {
          const ids = (matches || []).map((m: any) => m.id);
          // Nessuna corrispondenza: filtro impossibile, così la pagina mostra
          // "nessun risultato" invece dell'intero catalogo.
          query = query.in('id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
        }
      }

      if (sortBy === 'price-asc') query = query.order('price', { ascending: true });
      else if (sortBy === 'price-desc') query = query.order('price', { ascending: false });
      else if (sortBy === 'newest') query = query.order('created_at', { ascending: false });
      else {
        // I prodotti sponsorizzati vanno in cima SOLO se la sponsorizzazione
        // e' ancora pagata: is_sponsored da solo restava true per sempre,
        // quindi chi aveva pagato una volta continuava a stare primo
        // all'infinito. Il job di manutenzione ora spegne i flag scaduti,
        // ma filtriamo anche qui perche' gira periodicamente e nel
        // frattempo passerebbero comunque.
        query = query
          .or(`promo_expires_at.is.null,promo_expires_at.gt.${new Date().toISOString()}`)
          .order('is_sponsored', { ascending: false });
      }

      const { data, error } = await query.range((pageArg - 1) * PAGE_SIZE, pageArg * PAGE_SIZE - 1);
      if (error) throw error;

      // REGISTRO RICERCHE. Serve a far crescere il dizionario dei sinonimi
      // sui termini che la gente digita davvero, invece che su quelli che
      // vengono in mente a noi: una ricerca a vuoto su un prodotto che
      // esiste e' un sinonimo mancante, una ricerca a vuoto su un prodotto
      // che non esiste e' una domanda scoperta (quindi un fornitore da
      // cercare). Vedi vista search_gaps nel pannello admin.
      //
      // Solo alla PRIMA pagina: paginazione, cambio ordinamento e "carica
      // altri" rieseguono questa funzione con la stessa ricerca, e
      // conteggiarli gonfierebbe le statistiche facendo sembrare popolari
      // ricerche fatte una volta sola da un utente che scorre.
      //
      // Non blocca nulla e non mostra errori: se la registrazione fallisce,
      // il cliente non deve accorgersene.
      if (q && pageArg === 1) {
        supabase.from('search_log').insert([{
          query: q,
          results_count: (data || []).length,
          lang: i18n.language?.split('-')[0] || 'it',
        }]).then(() => {}, () => {});
      }
      
      // Ordina: sponsor categoria prima, poi sponsored, poi (solo in vista
      // "tutte le categorie" con ordinamento default) i prodotti nelle
      // categorie di interesse dell'utente, poi il resto — solo all'interno
      // del batch appena arrivato, per non "rimescolare" i prodotti già visibili
      // quando si aggiungono nuove pagine con "carica altri".
      let sorted = (data as any) || [];
      if (sponsoredVendorIds.length > 0) {
        sorted = [
          ...sorted.filter((p: any) => sponsoredVendorIds.includes(p.vendor_id)),
          ...sorted.filter((p: any) => !sponsoredVendorIds.includes(p.vendor_id)),
        ];
      }
      if (!categoryName && sortBy === 'featured' && interestCategories.length > 0) {
        const interest = new Set(interestCategories);
        sorted = [...sorted].sort((a: any, b: any) => {
          const aIn = interest.has(a.category) ? 1 : 0;
          const bIn = interest.has(b.category) ? 1 : 0;
          return bIn - aIn;
        });
      }
      setProducts(prev => {
        if (!append) return sorted;
        // Rete di sicurezza aggiuntiva: anche con la causa principale già
        // corretta nell'hook useInfiniteScroll, filtriamo comunque per ID
        // già presenti prima di aggiungere — un prodotto non deve mai
        // comparire due volte in griglia, qualunque sia la causa.
        const existingIds = new Set(prev.map((p: any) => p.id));
        const deduped = sorted.filter((p: any) => !existingIds.has(p.id));
        return [...prev, ...deduped];
      });
      // C'erano ancora prodotti quanti richiesti in questa pagina → probabile che ce ne siano altri.
      setHasMore(sorted.length === PAGE_SIZE);
    } catch (err) {
      console.error('Errore caricamento prodotti:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Il filtro per testo è ora applicato dal database dentro loadProducts()
  // (vedi commento lì): qui non va più rifiltrato nulla, altrimenti si
  // riscarterebbero risultati validi già selezionati dal server — es. un
  // prodotto trovato per SKU o marca, il cui nome non contiene il termine
  // cercato, sparirebbe di nuovo.
  const filtered = products;

  // Carica automaticamente la pagina successiva quando l'utente si avvicina
  // al fondo, al posto del pulsante "carica altri". Disattivo l'osservatore
  // mentre un caricamento è già in corso, per non accodare richieste doppie
  // se l'utente scrolla velocemente.
  const sentinelRef = useInfiniteScroll(() => {
    const next = page + 1;
    setPage(next);
    loadProducts(next, true);
  }, hasMore && !loading && !loadingMore);

  const getImage = (p: Product) =>
    p.images?.[0] || '/images/product-placeholder.svg';

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <div className="bg-white border-b border-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl mb-2">{t('shop.catalogTitle')}</h1>
          <p className="text-muted-foreground">
            {loading ? t('common.loading') : t('shop.productsAvailable', { count: filtered.length })}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">

          {/* Sidebar filtri */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-xl border border-border p-6 sticky top-4">
              <div className="flex items-center gap-2 mb-4">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">{t('shop.filterByCategory')}</h2>
              </div>
              <div className="space-y-1">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === cat.id
                        ? 'bg-primary text-white'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Prodotti */}
          <div className="flex-1 min-w-0">
            {/* Barra controlli */}
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <input
                type="text"
                placeholder={t('shop.searchCatalog')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 min-w-48 px-4 py-2 border border-border rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <div className="flex items-center gap-3">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg bg-white text-sm"
                >
                  <option value="featured">{t('shop.sortFeatured')}</option>
                  <option value="price-asc">{t('shop.sortPriceAsc')}</option>
                  <option value="price-desc">{t('shop.sortPriceDesc')}</option>
                  <option value="newest">{t('shop.sortNewest')}</option>
                </select>
                <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-primary text-white' : 'bg-white border border-border'}`}>
                  <Grid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-white border border-border'}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Loading */}
            {loading && (
              <ProductGridSkeleton count={12} />
            )}

            {/* Nessun prodotto */}
            {!loading && filtered.length === 0 && (
              <div className="bg-white rounded-xl border border-border p-12 text-center">
                <SearchX className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">{t('shop.noProducts')}</p>
                <p className="text-gray-500 text-sm">
                  {products.length === 0
                    ? t('shop.noProductsInCategory')
                    : t('shop.tryDifferentFilters')}
                </p>
              </div>
            )}

            {/* Sponsorizzato hero, contestuale alla categoria filtrata (se
                presente). Qui sopra ai risultati e non in fondo pagina come
                in Home: con l'infinite scroll di questa pagina un vero
                "fondo" non è mai raggiungibile in modo affidabile. */}
            {!loading && <SponsoredHeroCard contextCategory={selectedCategory !== 'all' ? DENTAL_CATEGORIES.find(c => c.slug === selectedCategory)?.name : undefined} interestCategories={interestCategories} noContainer className="mb-6" />}

            {/* Griglia prodotti — modalità griglia usa la stessa identica
                card di Home (componente condiviso ProductCard): stesse
                dimensioni ovunque nell'app, come richiesto. La modalità
                elenco resta un layout a righe volutamente diverso. */}
            {!loading && filtered.length > 0 && viewMode === 'grid' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
                {filtered.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    badge={product.is_sponsored ? t('product.sponsored') : undefined}
                    badgeColor="bg-amber-500"
                    badgeTextColor="text-white"
                  />
                ))}
              </div>
            )}
            {!loading && filtered.length > 0 && viewMode === 'list' && (
              <div className="space-y-4">
                {filtered.map(product => (
                  <Link
                    key={product.id}
                    to={`/negozio/prodotto/${product.id}`}
                    className="group bg-white rounded-xl overflow-hidden border border-border hover:shadow-xl transition-all flex"
                  >
                    <div className="relative overflow-hidden bg-muted w-48 flex-shrink-0" style={{ aspectRatio: '1/1' }}>
                      <img
                        src={getImage(product)}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                        className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${product.stock !== undefined && product.stock <= 0 ? 'opacity-50 grayscale-[30%]' : ''}`}
                        onError={e => { (e.target as HTMLImageElement).src = '/images/product-placeholder.svg'; }}
                      />
                      {product.stock !== undefined && product.stock <= 0 ? (
                        <span className="absolute top-3 right-3 px-2 py-1 bg-gray-700 text-white text-xs rounded-full font-semibold">
                          {t('product.outOfStock')}
                        </span>
                      ) : product.is_sponsored && (
                        <span className="absolute top-3 right-3 px-2 py-1 bg-amber-500 text-white text-xs rounded-full font-medium">
                          {t('product.sponsored')}
                        </span>
                      )}
                    </div>

                    <div className="p-5 flex-1">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-muted-foreground">{product.vendors?.business_name || t('common.vendorBadge')}</span>
                        {product.vendors?.verified_badge && (
                          <CheckCircle className="w-3.5 h-3.5 text-primary" />
                        )}
                      </div>
                      <h3 className="font-medium mb-2 line-clamp-2 group-hover:text-primary transition-colors text-sm">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-primary">€{Number(product.price).toFixed(2)}</span>
                        {product.stock !== undefined && product.stock <= 0 ? (
                          <span className="text-xs text-gray-400 font-medium">{t('product.outOfStock')}</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ShoppingCart className="w-3 h-3" /> {t('product.add')}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Caricamento automatico al fondo pagina (infinite scroll): la
          sentinella è invisibile, l'osservatore in useInfiniteScroll fa
          scattare il caricamento della pagina successiva quando entra
          nel viewport, senza bisogno di alcun click. */}
      {hasMore && (
        <div ref={sentinelRef} className="h-1" />
      )}
      {loadingMore && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}