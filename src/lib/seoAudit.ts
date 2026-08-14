// ── Audit SEO della piattaforma ─────────────────────────────────────────
//
// Controlla ciò che è realmente sotto il nostro controllo e che ha un
// impatto verificabile sui risultati di ricerca. Le regole non sono
// opinioni: ognuna corrisponde a un comportamento documentato dei motori.
//
// COSA NON CONTROLLIAMO E PERCHÉ:
// - meta keywords: Google lo ignora dichiaratamente dal 2009, e Bing può
//   leggere un tag sovraccarico come segnale di spam. Non è una lacuna da
//   colmare: è un tag da non usare. Le parole chiave degli articoli stanno
//   nei dati strutturati schema.org, dove i motori le leggono davvero.
// - densità di parola chiave: non è un segnale di ranking, e ottimizzarla
//   porta a testi peggiori per chi legge.
//
// Le soglie di lunghezza sono limiti di TRONCAMENTO nella pagina dei
// risultati, non regole di ranking: un titolo più lungo non viene penalizzato,
// viene solo tagliato — e un titolo tagliato a metà converte peggio.

export type SeoSeverity = 'error' | 'warning' | 'ok';

export interface SeoIssue {
  severity: SeoSeverity;
  entity: 'prodotto' | 'articolo' | 'categoria' | 'pagina';
  entityId: string;
  entityName: string;
  rule: string;
  detail: string;
  /** Percorso interno per andare a correggere, quando esiste. */
  fixPath?: string;
}

export interface SeoReport {
  generatedAt: string;
  totals: { checked: number; errors: number; warnings: number };
  byEntity: Record<string, { checked: number; errors: number; warnings: number }>;
  issues: SeoIssue[];
}

// Limiti di troncamento osservati nella SERP di Google (in caratteri, che
// approssimano bene la larghezza in pixel realmente usata da Google).
export const TITLE_MAX = 60;
export const TITLE_MIN = 20;
export const DESC_MAX = 160;
export const DESC_MIN = 70;

const norm = (s?: string | null) => (s || '').trim();

// Il meta viene troncato in modo pulito a livello di parola da
// truncateForMeta() in usePageSEO: quindi una descrizione lunga non produce
// mai uno snippet spezzato a metà. Resta però il fatto che tutto ciò che
// sta oltre il limite non viene mai visto da chi legge il risultato — ed è
// questo che vale la pena segnalare, non la lunghezza in sé.
export const META_DESC_LIMIT = 155;

/** Prodotti: la scheda è ciò che compete nei risultati di ricerca. */
export function auditProducts(
  products: { id: string; name: string; description?: string | null; meta_title?: string | null; meta_description?: string | null; images?: string[] | null; category?: string | null; status?: string | null }[]
): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const titleSeen = new Map<string, string[]>();

  for (const p of products) {
    if (p.status && p.status !== 'published') continue;
    const name = norm(p.name);
    const push = (severity: SeoSeverity, rule: string, detail: string) =>
      issues.push({ severity, entity: 'prodotto', entityId: p.id, entityName: name || '(senza nome)', rule, detail, fixPath: `/negozio/prodotto/${p.id}` });

    const title = norm(p.meta_title) || name;
    const desc = norm(p.meta_description) || norm(p.description);

    if (!name) push('error', 'Nome mancante', 'Il prodotto non ha un nome: non può posizionarsi né essere trovato dalla ricerca interna.');
    if (title.length > TITLE_MAX) push('warning', 'Titolo troppo lungo', `${title.length} caratteri: Google lo taglierà intorno ai ${TITLE_MAX}. Accorcialo o compila meta_title.`);
    if (title && title.length < TITLE_MIN) push('warning', 'Titolo troppo corto', `${title.length} caratteri: poco descrittivo per chi legge il risultato di ricerca.`);

    if (!desc) push('error', 'Descrizione mancante', 'Senza descrizione Google costruisce lo snippet da solo, spesso pescando testo irrilevante dalla pagina.');
    else {
      if (desc.length > META_DESC_LIMIT) push('warning', 'Snippet troncato', `${desc.length} caratteri: ne vengono mostrati ~${META_DESC_LIMIT}. Verifica che i primi ${META_DESC_LIMIT} si reggano da soli — il resto non viene letto da chi sceglie su quale risultato cliccare.`);
      if (desc.length < DESC_MIN) push('warning', 'Descrizione troppo corta', `${desc.length} caratteri: uno snippet breve usa meno spazio di quello disponibile.`);
    }

    if (!p.images || p.images.length === 0) push('error', 'Nessuna immagine', 'Un prodotto senza immagini non può comparire in Google Immagini né nei rich result Shopping.');
    if (!norm(p.category)) push('warning', 'Categoria mancante', 'Senza categoria il prodotto resta fuori dalle pagine categoria, che sono le pagine con più autorità del catalogo.');

    const key = title.toLowerCase();
    if (key) titleSeen.set(key, [...(titleSeen.get(key) || []), p.id]);
  }

  for (const [title, ids] of titleSeen) {
    if (ids.length > 1) {
      for (const id of ids) {
        issues.push({
          severity: 'warning', entity: 'prodotto', entityId: id, entityName: title,
          rule: 'Titolo duplicato',
          detail: `${ids.length} prodotti condividono lo stesso titolo. Google ne sceglie uno solo e considera gli altri duplicati.`,
          fixPath: `/negozio/prodotto/${id}`,
        });
      }
    }
  }
  return issues;
}

/** Articoli del blog: contenuto statico, controllabile interamente a build time. */
export function auditArticles(
  articles: { slug: string; title: string; description: string; content: string[]; keywords?: string[]; category?: string }[],
  translationCoverage?: Record<string, Set<string>>
): SeoIssue[] {
  const issues: SeoIssue[] = [];
  const titleSeen = new Map<string, string[]>();
  const descSeen = new Map<string, string[]>();

  for (const a of articles) {
    const push = (severity: SeoSeverity, rule: string, detail: string) =>
      issues.push({ severity, entity: 'articolo', entityId: a.slug, entityName: a.title, rule, detail, fixPath: `/blog/${a.slug}` });

    const title = norm(a.title);
    const desc = norm(a.description);

    if (!title) push('error', 'Titolo mancante', 'Articolo senza titolo.');
    else if (title.length > TITLE_MAX) push('warning', 'Titolo troppo lungo', `${title.length} caratteri, verrà troncato intorno ai ${TITLE_MAX} nella SERP.`);

    if (!desc) push('error', 'Descrizione mancante', 'Senza descrizione lo snippet viene generato automaticamente da Google.');
    else {
      if (desc.length > META_DESC_LIMIT) push('warning', 'Snippet troncato', `${desc.length} caratteri: ne vengono mostrati ~${META_DESC_LIMIT}. La prima frase deve reggersi da sola.`);
      if (desc.length < DESC_MIN) push('warning', 'Descrizione troppo corta', `${desc.length} caratteri.`);
    }

    if (!a.keywords || a.keywords.length === 0)
      push('warning', 'Keywords assenti', 'Non finiscono in un meta tag (Google lo ignora) ma nei dati strutturati schema.org, dove vengono lette.');

    const words = a.content.reduce((n, p) => n + p.split(/\s+/).filter(Boolean).length, 0);
    if (words < 300) push('warning', 'Contenuto molto breve', `${words} parole: difficile competere su query informative con testi così corti.`);

    if (translationCoverage) {
      const missing = Object.entries(translationCoverage)
        .filter(([, slugs]) => !slugs.has(a.slug))
        .map(([lang]) => lang);
      if (missing.length)
        push('error', 'Traduzioni mancanti', `Non tradotto in: ${missing.join(', ')}. Quelle versioni mostrano testo italiano su una URL dichiarata in un'altra lingua — hreflang e contenuto si contraddicono.`);
    }

    if (title) titleSeen.set(title.toLowerCase(), [...(titleSeen.get(title.toLowerCase()) || []), a.slug]);
    if (desc) descSeen.set(desc.toLowerCase(), [...(descSeen.get(desc.toLowerCase()) || []), a.slug]);
  }

  const dupes = (m: Map<string, string[]>, rule: string, what: string) => {
    for (const [, slugs] of m) {
      if (slugs.length > 1) {
        for (const slug of slugs) {
          issues.push({
            severity: 'warning', entity: 'articolo', entityId: slug, entityName: slug,
            rule, detail: `${slugs.length} articoli hanno ${what} identico: ${slugs.join(', ')}.`,
            fixPath: `/blog/${slug}`,
          });
        }
      }
    }
  };
  dupes(titleSeen, 'Titolo duplicato', 'lo stesso titolo');
  dupes(descSeen, 'Descrizione duplicata', 'la stessa descrizione');

  return issues;
}

/** Categorie: pagine con la maggiore autorità del catalogo, spesso trascurate. */
export function auditCategories(
  categories: { id: string; name: string; slug: string; description?: string }[],
  productCountByCategory: Record<string, number>
): SeoIssue[] {
  const issues: SeoIssue[] = [];
  for (const c of categories) {
    const push = (severity: SeoSeverity, rule: string, detail: string) =>
      issues.push({ severity, entity: 'categoria', entityId: c.slug, entityName: c.name, rule, detail, fixPath: `/negozio/categoria/${c.slug}` });

    if (!norm(c.description)) push('warning', 'Descrizione mancante', 'La pagina categoria resta un elenco di prodotti senza testo proprio da indicizzare.');
    const count = productCountByCategory[c.name] ?? productCountByCategory[c.slug] ?? 0;
    if (count === 0) push('error', 'Categoria vuota', 'Nessun prodotto pubblicato: è una pagina senza contenuto, che Google può classificare come soft 404.');
    else if (count < 3) push('warning', 'Pochi prodotti', `Solo ${count} prodotti pubblicati: la pagina ha poco da mostrare a chi arriva dalla ricerca.`);
  }
  return issues;
}

export function buildReport(issues: SeoIssue[], checked: Record<string, number>): SeoReport {
  const byEntity: SeoReport['byEntity'] = {};
  for (const [k, v] of Object.entries(checked)) byEntity[k] = { checked: v, errors: 0, warnings: 0 };
  for (const i of issues) {
    if (!byEntity[i.entity]) byEntity[i.entity] = { checked: 0, errors: 0, warnings: 0 };
    if (i.severity === 'error') byEntity[i.entity].errors++;
    else if (i.severity === 'warning') byEntity[i.entity].warnings++;
  }
  return {
    generatedAt: new Date().toISOString(),
    totals: {
      checked: Object.values(checked).reduce((a, b) => a + b, 0),
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
    },
    byEntity,
    issues,
  };
}

/** Esportazione CSV per lavorarci fuori dalla dashboard. */
export function issuesToCsv(issues: SeoIssue[]): string {
  const esc = (v: string) => `"${(v || '').replace(/"/g, '""')}"`;
  const head = ['Gravità', 'Tipo', 'Nome', 'ID', 'Regola', 'Dettaglio'].map(esc).join(',');
  const rows = issues.map(i =>
    [i.severity === 'error' ? 'Errore' : 'Avviso', i.entity, i.entityName, i.entityId, i.rule, i.detail].map(esc).join(',')
  );
  return [head, ...rows].join('\n');
}
