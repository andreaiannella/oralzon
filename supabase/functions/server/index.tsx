import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { createClient } from "npm:@supabase/supabase-js";
import Stripe from "npm:stripe@22";

const app = new Hono();

// SICUREZZA: CORS ristretto ai domini reali di Oralzon, non più aperto a
// qualsiasi sito ("*"). Con origin aperto, un sito terzo qualunque può
// chiamare l'API autenticata di un utente (es. se un token viene esposto per
// qualunque altro motivo, o per scraping automatizzato non autorizzato).
// Aggiungi qui eventuali nuovi domini (es. quando oralzon.it/oralzon.shop
// verranno effettivamente collegati) o sottodomini di anteprima Netlify.
const ALLOWED_ORIGINS = [
  "https://oralzon.com",
  "https://www.oralzon.com",
  "https://oralzon.it",
  "https://oralzon.shop",
  "https://oralzon.netlify.app",
  "http://localhost:5173", // sviluppo locale
  // App nativa (Capacitor): la WebView non naviga su un dominio reale, ma
  // usa uno pseudo-origin fisso per piattaforma. Senza queste due righe,
  // OGNI chiamata autenticata alla edge function fatta dall'app nativa
  // (iOS e Android) veniva bloccata silenziosamente dal browser per CORS:
  // fetch() falliva a livello di rete (nessuna risposta leggibile), quindi
  // il client mostrava solo "Impossibile contattare il server" — anche se
  // il server funzionava perfettamente. Le richieste dirette a Supabase via
  // supabase-js (lettura prodotti, login, ecc.) non passano da qui e per
  // questo continuavano a funzionare, mascherando il problema.
  "capacitor://localhost", // iOS
  "https://localhost",     // Android (androidScheme default di Capacitor)
];
app.use("/*", cors({
  origin: (origin) => {
    if (!origin) return undefined; // richieste server-to-server (es. webhook Stripe) non hanno Origin
    if (ALLOWED_ORIGINS.includes(origin)) return origin;
    // Anteprime di branch/deploy Netlify (es. https://deploy-preview-12--oralzon.netlify.app)
    if (/^https:\/\/[a-z0-9-]+--oralzon\.netlify\.app$/.test(origin)) return origin;
    return undefined; // origine non in whitelist: nessun header CORS, il browser blocca la risposta
  },
  allowHeaders: ["Content-Type", "Authorization", "stripe-signature"],
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  maxAge: 600,
}));

// SICUREZZA: rate limiting di base per gli endpoint più esposti ad abuso
// (creazione sessioni di checkout, invio email, invio recensioni/resi).
// Limite: in-memory, quindi non condiviso tra istanze diverse della Edge
// Function se ce ne fosse più di una attiva contemporaneamente — è comunque
// un freno reale contro bot/script che colpiscono ripetutamente la stessa
// istanza, non una protezione distribuita completa. Se il traffico crescerà
// molto, va sostituito con uno store condiviso (es. Upstash Redis).
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimit(maxRequests: number, windowMs: number) {
  return async (c: any, next: any) => {
    const ip = c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || c.req.header("x-real-ip") || "unknown";
    const key = `${c.req.path}:${ip}`;
    const now = Date.now();
    const bucket = rateLimitBuckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      bucket.count++;
      if (bucket.count > maxRequests) {
        return c.json({ success: false, error: "Troppe richieste. Riprova tra qualche minuto." }, 429);
      }
    }
    await next();
  };
}
// Pulizia periodica per evitare che la Map cresca indefinitamente
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets.entries()) {
    if (now > bucket.resetAt) rateLimitBuckets.delete(key);
  }
}, 5 * 60 * 1000);

function getServiceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

/**
 * Trova il vendor di un profilo in modo ROBUSTO: a differenza di .maybeSingle(),
 * non fallisce se esistono più righe vendor per lo stesso profile_id (può succedere
 * per race condition tra registrazione diretta e fallback via edge function).
 * Prende sempre la riga più vecchia (created_at asc), in modo deterministico.
 */
async function getVendorByProfileId(supabase: any, profileId: string, fields: string = "*") {
  const { data } = await supabase.from("vendors").select(fields)
    .eq("profile_id", profileId).order("created_at", { ascending: true }).limit(1);
  return data?.[0] || null;
}

/**
 * Rimuove dall'indirizzo di spedizione ogni canale di contatto diretto,
 * prima di consegnarlo a un VENDITORE.
 *
 * ANTI-DISINTERMEDIAZIONE (modello Amazon): il venditore deve poter
 * spedire, quindi nome e indirizzo restano — il corriere deve consegnare
 * a qualcuno da qualche parte, non c'e' modo di evitarlo e nemmeno Amazon
 * lo evita. Ma email e telefono NON servono a spedire: servono solo a
 * contattare il cliente fuori dalla piattaforma alla vendita successiva.
 *
 * BUG TROVATO: shipping_address non e' un indirizzo, e' l'INTERO modulo di
 * checkout salvato cosi' com'e' (`shipping_address: shippingData`), quindi
 * contiene anche email e telefono. Il codice ne rimuoveva solo il telefono
 * con un destructuring, lasciando passare l'email in chiaro — cioe'
 * esattamente il dato piu' utile per disintermediare.
 *
 * Da usare in OGNI endpoint che restituisce dati ordine a un venditore.
 */
function sanitizeAddressForVendor(address: any): any {
  if (!address || typeof address !== "object") return address;
  const { email, phone, telefono, ...safe } = address;
  return safe;
}

// Stati in cui un ordine e' stato REALMENTE pagato. Un ordine resta
// 'pending' finche' il pagamento non e' confermato: se il cliente
// abbandona il checkout, quella riga resta li' per sempre. Non deve MAI
// comparire come lavoro da fare per il venditore.
const PAID_ORDER_STATUSES = ["processing", "shipped", "delivered", "refunded", "partially_refunded"];

/**
 * Rileva contatti diretti nel testo libero scambiato fra cliente e
 * venditore (domande e risposte sui prodotti).
 *
 * ANTI-DISINTERMEDIAZIONE: dopo la rimozione di logo e descrizione
 * negozio, le domande sui prodotti sono rimaste l'ULTIMO canale di testo
 * libero visibile pubblicamente fra le due parti. Senza controllo, un
 * venditore puo' rispondere "scrivimi a mario@..." o "lo trovi a meta'
 * prezzo sul mio sito", e un cliente puo' chiedere un contatto diretto.
 * Sarebbe la porta aperta proprio dove abbiamo chiuso tutte le altre.
 *
 * Controllo con espressioni regolari e non con un modello linguistico:
 * qui serve una regola deterministica, immediata e a costo zero su ogni
 * messaggio — non un giudizio sfumato. Meglio qualche falso positivo
 * (l'utente riformula) che un canale di fuga aperto.
 */
function detectDirectContact(text: string): { found: boolean; reason?: string } {
  if (!text) return { found: false };
  const t = text.toLowerCase();

  if (/[a-z0-9._%+-]+\s*(@|\(at\)|\[at\])\s*[a-z0-9.-]+\.[a-z]{2,}/i.test(t))
    return { found: true, reason: "un indirizzo email" };

  // Numeri di telefono: almeno 8 cifre, tollerando spazi/punti/trattini
  // usati per aggirare il controllo (es. "3 3 3 1 2 3 4 5 6 7").
  const digits = t.replace(/[^\d]/g, "");
  if (digits.length >= 8 && /(\+?\d[\s.\-\/]*){8,}/.test(t))
    return { found: true, reason: "un numero di telefono" };

  if (/\b(whatsapp|telegram|wechat|viber|skype)\b/i.test(t))
    return { found: true, reason: "un contatto di messaggistica" };

  // Siti esterni. Esclusi i domini di Oralzon: un link interno e' legittimo.
  const urlMatch = t.match(/\b((https?:\/\/)?[a-z0-9-]+\.(com|it|net|org|eu|de|fr|es|shop|store|info|biz)\b)/i);
  if (urlMatch && !/oralzon\./i.test(urlMatch[0]))
    return { found: true, reason: "un sito esterno" };

  return { found: false };
}

function generateOrderNumber(): string {
  const d = new Date();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DC-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${rand}`;
}

// Stessa logica di src/lib/discountSchedule.ts sul frontend — duplicata qui
// perché questo file gira su Deno, un runtime separato senza un modo
// semplice di condividere il modulo nel flusso di incolla-manuale attuale.
// Se la logica cambia, va aggiornata in ENTRAMBI i posti.
function isDiscountActive(p: { discount_price?: number | string | null; discount_starts_at?: string | null; discount_ends_at?: string | null }, now: Date = new Date()): boolean {
  if (p.discount_price === null || p.discount_price === undefined) return false;
  const price = Number(p.discount_price);
  if (!price || price <= 0) return false;
  if (p.discount_starts_at && now < new Date(p.discount_starts_at)) return false;
  if (p.discount_ends_at && now > new Date(p.discount_ends_at)) return false;
  return true;
}

// ── Traduzione automatica contenuto prodotto ──
// NON si traduce nulla in questo file.
//
// La traduzione dei prodotti è gestita dal Translation Engine, asincrono:
//   1. un trigger su `products` accoda un job in `translation_jobs` quando
//      nome/descrizione/scheda tecnica/meta SEO cambiano davvero
//      (confronto per source_hash: nessuna ritraduzione a vuoto);
//   2. la edge function `translation-worker`, invocata da pg_cron ogni
//      minuto, consuma la coda e chiama DeepL con il glossario
//      odontoiatrico in `translation_glossary`;
//   3. il risultato finisce in `product_translations` (una riga per
//      prodotto per lingua, con manually_edited e locked a proteggere le
//      correzioni fatte a mano dalla ritraduzione automatica);
//   4. un trigger su quella tabella riversa il testo nel jsonb
//      `products.translations`, che è ciò che il frontend legge tramite
//      localizeProduct().
//
// Qui prima viveva translateProductContent(), la vecchia implementazione
// sincrona via Claude. È stata rimossa perché non era più chiamata da
// nessun endpoint: restando nel file faceva credere che vendor/save-product
// traducesse ancora — ed è esattamente l'equivoco che ha nascosto per
// settimane il vero problema (traduzioni generate ma mai lette).

// ── Email via Resend ──
async function sendEmail(to: string, subject: string, html: string, replyTo?: string): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) { console.log("⚠️ RESEND_API_KEY non configurata su Supabase → Edge Functions → Secrets. Email NON inviata a:", to); return false; }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM_EMAIL") || "Oralzon <noreply@oralzon.com>",
        to: [to], subject, html,
        // Le risposte del destinatario vanno all'alias mascherato (conv-...),
        // mai all'indirizzo reale del mittente originale — è quello che fa
        // funzionare l'intera conversazione senza mai esporre le email vere.
        ...(replyTo ? { reply_to: replyTo } : {}),
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(`❌ Resend ha rifiutato l'email a ${to}: ${res.status} ${errText}`);
      return false;
    }
    console.log(`📧 Email inviata a ${to}: ${subject}`);
    return true;
  } catch (e: any) { console.error("❌ Email error:", e.message); return false; }
}

// ══════════════════════════════════════════════════════════════
// DENTALCLEAN EMAIL SYSTEM — wrapper di brand unico per tutte le email
// ══════════════════════════════════════════════════════════════
const BRAND_BLUE = "#0F7A68"; // Deep Mint (nome storico della costante, mantenuto per non toccare ogni riferimento)
const BRAND_CYAN = "#2FBFA0"; // Mint Fresh
// Dominio del sito usato nei link delle email e nei redirect Stripe Connect
// (onboarding venditori). Configurabile via env var SITE_URL su Supabase —
// così puoi puntarlo a oralzon.netlify.app durante i test e a oralzon.com
// quando il dominio sarà collegato, senza modificare il codice.
const SITE_URL = Deno.env.get("SITE_URL") || "https://oralzon.com";

// Icone SVG inline — path reali estratti da lucide-react (la stessa libreria
// usata nel resto del sito, stessa versione), non approssimazioni disegnate
// a mano: badge/pulsanti coerenti al pixel con l'interfaccia web.
// Le icone SVG per i badge circolari sono state rimosse insieme al
// template che le usava: la decorazione automatica era il tratto che
// faceva sembrare le email generate da un sistema invece che inviate da
// un'azienda.


// ══════════════════════════════════════════════════════════════════════
//  Lingua delle email transazionali
// ══════════════════════════════════════════════════════════════════════
//
// Le email partivano tutte in italiano verso chiunque: un cliente tedesco
// navigava, comprava e pagava in tedesco, e riceveva la conferma d'ordine
// in italiano. Non era un difetto d'invio — la lingua dell'utente non
// veniva proprio registrata.
//
// Ora `profiles.preferred_language` la conserva: impostata alla
// registrazione dalla lingua attiva e aggiornata quando l'utente cambia
// lingua dal selettore.
//
// Perché un dizionario qui e non i file in public/locales: quelli servono
// il browser e questo codice gira su Deno, senza accesso al bundle del
// frontend. Duplicare i testi è il male minore rispetto a un fetch di rete
// a ogni email — che aggiungerebbe un punto di rottura su una funzione che
// deve essere il più affidabile possibile.

const EMAIL_LANGS = ['it','en','es','fr','de','pt','nl','pl'] as const;
type EmailLang = typeof EMAIL_LANGS[number];

function normalizeEmailLang(lang: string | null | undefined): EmailLang {
  const base = (lang || 'it').split('-')[0].toLowerCase();
  return (EMAIL_LANGS as readonly string[]).includes(base) ? base as EmailLang : 'it';
}

/**
 * Legge la lingua preferita di un utente dal suo profilo.
 * Non solleva mai: qualunque problema di lettura degrada a italiano,
 * perché un'email nella lingua sbagliata è comunque meglio di un'email
 * non spedita.
 */
async function getUserEmailLang(supabase: any, userId: string | null | undefined): Promise<EmailLang> {
  if (!userId) return 'it';
  try {
    const { data } = await supabase.from('profiles')
      .select('preferred_language').eq('id', userId).maybeSingle();
    return normalizeEmailLang(data?.preferred_language);
  } catch {
    return 'it';
  }
}

/**
 * Sceglie la stringa nella lingua richiesta, con l'italiano come ripiego.
 * Il ripiego è per chiave, non per blocco: se una traduzione viene aggiunta
 * a metà, il resto dell'email resta comunque nella lingua giusta invece di
 * ricadere tutta in italiano.
 */
function tr(dict: Record<string, Partial<Record<EmailLang, string>>>, key: string, lang: EmailLang, vars: Record<string, string | number> = {}): string {
  const entry = dict[key];
  let out = entry?.[lang] ?? entry?.it ?? '';
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, String(v));
  }
  return out;
}

/** Formatta un importo in euro secondo le convenzioni della lingua. */
function fmtEur(amount: number, lang: EmailLang): string {
  const locales: Record<EmailLang, string> = {
    it: 'it-IT', en: 'en-IE', es: 'es-ES', fr: 'fr-FR',
    de: 'de-DE', pt: 'pt-PT', nl: 'nl-NL', pl: 'pl-PL',
  };
  try {
    return new Intl.NumberFormat(locales[lang], { style: 'currency', currency: 'EUR' }).format(amount);
  } catch {
    return `€${amount.toFixed(2)}`;
  }
}

/** Formatta una data secondo le convenzioni della lingua. */
function fmtDate(d: Date | string, lang: EmailLang): string {
  const locales: Record<EmailLang, string> = {
    it: 'it-IT', en: 'en-IE', es: 'es-ES', fr: 'fr-FR',
    de: 'de-DE', pt: 'pt-PT', nl: 'nl-NL', pl: 'pl-PL',
  };
  const date = typeof d === 'string' ? new Date(d) : d;
  try {
    return new Intl.DateTimeFormat(locales[lang], { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
  } catch {
    return date.toLocaleDateString('it-IT');
  }
}

// Testi comuni a più email: footer, saluti, etichette ricorrenti.
const EMAIL_COMMON: Record<string, Partial<Record<EmailLang, string>>> = {
  footerTagline: {
    it: "Il marketplace B2B per l'odontoiatria",
    en: "The B2B marketplace for dentistry",
    es: "El marketplace B2B para la odontología",
    fr: "La marketplace B2B pour la dentisterie",
    de: "Der B2B-Marktplatz für die Zahnmedizin",
    pt: "O marketplace B2B para a medicina dentária",
    nl: "De B2B-marktplaats voor de tandheelkunde",
    pl: "Marketplace B2B dla stomatologii",
  },
  footerAuto: {
    it: "${tr(EMAIL_COMMON, 'footerAuto', lang)}",
    en: "Automated message regarding your account. Please do not reply to this address.",
    es: "Mensaje automático relativo a tu cuenta. No respondas a esta dirección.",
    fr: "Message automatique concernant votre compte. Merci de ne pas répondre à cette adresse.",
    de: "Automatische Nachricht zu Ihrem Konto. Bitte antworten Sie nicht auf diese Adresse.",
    pt: "Mensagem automática relativa à sua conta. Não responda a este endereço.",
    nl: "Automatisch bericht over uw account. Beantwoord dit adres niet.",
    pl: "Wiadomość automatyczna dotycząca Twojego konta. Nie odpowiadaj na ten adres.",
  },
  hello: {
    it: "Ciao {name},", en: "Hi {name},", es: "Hola {name}:", fr: "Bonjour {name},",
    de: "Hallo {name},", pt: "Olá {name},", nl: "Hallo {name},", pl: "Cześć {name},",
  },
  colProduct: { it:"Prodotto", en:"Product", es:"Producto", fr:"Produit", de:"Produkt", pt:"Produto", nl:"Product", pl:"Produkt" },
  colQty: { it:"Qtà", en:"Qty", es:"Cant.", fr:"Qté", de:"Menge", pt:"Qtd.", nl:"Aantal", pl:"Ilość" },
  colTotal: { it:"Totale", en:"Total", es:"Total", fr:"Total", de:"Gesamt", pt:"Total", nl:"Totaal", pl:"Razem" },
  alsoLike: {
    it:"Potrebbero interessarti anche", en:"You might also like", es:"También te puede interesar",
    fr:"Cela pourrait aussi vous intéresser", de:"Das könnte Sie auch interessieren",
    pt:"Também lhe pode interessar", nl:"Dit vindt u misschien ook interessant", pl:"Może Cię też zainteresować",
  },
};

function emailWrapper(opts: { preheader?: string; title: string; bodyHtml: string; ctaLabel?: string; ctaUrl?: string; extraSectionHtml?: string; lang?: EmailLang }): string {
  const { preheader = "", title, bodyHtml, ctaLabel, ctaUrl, extraSectionHtml, lang = "it" } = opts;

  // ── Perché questo template è così sobrio ──
  //
  // Il disegno precedente apriva con un cerchio colorato al centro
  // contenente un'icona (spunta, camion, stella). È un pattern che si è
  // diffuso con i generatori automatici di email e che i destinatari
  // riconoscono ormai a colpo d'occhio: comunica "automatismo", non
  // "azienda". Le email transazionali di Amazon, Stripe o PayPal non hanno
  // nulla di simile — logo, titolo, informazione, azione. La decorazione
  // sottrae spazio al contenuto e abbassa la credibilità del mittente.
  //
  // Da qui le scelte: tutto allineato a sinistra come un documento
  // (il centrato è da newsletter promozionale, non da ricevuta), nessuna
  // icona ornamentale, gerarchia affidata a peso e dimensione del testo.
  //
  // La struttura resta a tabelle con stili inline: Outlook su Windows
  // renderizza con il motore di Word e ignora flex e grid. Non è codice
  // vecchio, è l'unico che si comporta allo stesso modo ovunque.
  const S = {
    ink: "#1E2E31",      // Steel Ink — titoli e dati
    body: "#44585B",     // corpo del testo
    muted: "#8A9698",    // footer e note
    hair: "#E4EBEA",     // separatori
    canvas: "#F4F6F6",   // sfondo esterno
  };

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${title}</title>
<!--[if mso]><style>body,table,td,a{font-family:Arial,Helvetica,sans-serif !important}</style><![endif]-->
<style>
  @media only screen and (max-width:620px){
    .px{padding-left:24px !important;padding-right:24px !important}
    .h1{font-size:20px !important}
  }
</style>
</head>
<body style="margin:0;padding:0;background:${S.canvas};-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${preheader}&#8203;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;&#847;</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${S.canvas};">
    <tr><td align="center" style="padding:28px 12px 40px;">

      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${S.hair};border-radius:8px;overflow:hidden;">

        <!-- Testata: logo a sinistra, come su una comunicazione aziendale.
             Fondo Deep Mint pieno perché resti riconoscibile anche quando
             il client blocca le immagini e del logo resta solo l'alt. -->
        <tr><td class="px" style="background:${BRAND_BLUE};padding:20px 32px;">
          <img src="${SITE_URL}/logo-oralzon-white.png" alt="Oralzon" width="150" style="display:block;width:150px;height:auto;border:0;" />
        </td></tr>

        <!-- Titolo -->
        <tr><td class="px" style="padding:34px 32px 0;">
          <h1 class="h1" style="margin:0;font-size:22px;line-height:1.35;color:${S.ink};font-weight:700;letter-spacing:-0.3px;">${title}</h1>
        </td></tr>

        <!-- Corpo -->
        <tr><td class="px" style="padding:14px 32px 0;color:${S.body};font-size:15px;line-height:1.65;">
          ${bodyHtml}
        </td></tr>

        ${ctaLabel && ctaUrl ? `
        <tr><td class="px" style="padding:24px 32px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0">
            <tr><td style="background:${BRAND_BLUE};border-radius:6px;">
              <a href="${ctaUrl}" style="display:inline-block;color:#ffffff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 30px;border-radius:6px;">${ctaLabel}</a>
            </td></tr>
          </table>
        </td></tr>` : ''}

        <tr><td style="height:34px;line-height:34px;font-size:0;">&nbsp;</td></tr>

        ${extraSectionHtml || ''}

        <!-- Footer -->
        <tr><td class="px" style="padding:20px 32px 26px;border-top:1px solid ${S.hair};">
          <p style="margin:0 0 6px;font-size:12px;color:${S.body};line-height:1.6;">
            Oralzon — ${tr(EMAIL_COMMON, 'footerTagline', lang)}<br>
            <a href="${SITE_URL}" style="color:${BRAND_BLUE};text-decoration:none;">${SITE_URL.replace(/^https?:\/\//, '')}</a>
          </p>
          <p style="margin:0;font-size:11px;color:${S.muted};line-height:1.6;">
            Messaggio automatico relativo al tuo account. Non rispondere a questo indirizzo.
          </p>
        </td></tr>

      </table>

    </td></tr>
  </table>
</body>
</html>`;
}


// Testi delle email cliente. Il ripiego è per chiave (vedi tr()): se una
// traduzione manca, quella singola riga torna in italiano e il resto
// dell'email resta nella lingua giusta.
const EMAIL_TEXTS: Record<string, Partial<Record<EmailLang, string>>> = {
  subjOrderConf: {
    it:"Ordine {n} confermato — Oralzon", en:"Order {n} confirmed — Oralzon",
    es:"Pedido {n} confirmado — Oralzon", fr:"Commande {n} confirmée — Oralzon",
    de:"Bestellung {n} bestätigt — Oralzon", pt:"Encomenda {n} confirmada — Oralzon",
    nl:"Bestelling {n} bevestigd — Oralzon", pl:"Zamówienie {n} potwierdzone — Oralzon",
  },
  subjShipped: {
    it:"Ordine {n} spedito — Oralzon", en:"Order {n} shipped — Oralzon",
    es:"Pedido {n} enviado — Oralzon", fr:"Commande {n} expédiée — Oralzon",
    de:"Bestellung {n} versandt — Oralzon", pt:"Encomenda {n} expedida — Oralzon",
    nl:"Bestelling {n} verzonden — Oralzon", pl:"Zamówienie {n} wysłane — Oralzon",
  },
  subjWelcome: {
    it:"Benvenuto su Oralzon", en:"Welcome to Oralzon", es:"Bienvenido a Oralzon",
    fr:"Bienvenue sur Oralzon", de:"Willkommen bei Oralzon", pt:"Bem-vindo à Oralzon",
    nl:"Welkom bij Oralzon", pl:"Witamy w Oralzon",
  },
  // ── Conferma ordine ──
  orderConfPre: {
    it:"Il tuo ordine {n} è confermato — totale {t}", en:"Your order {n} is confirmed — total {t}",
    es:"Tu pedido {n} está confirmado — total {t}", fr:"Votre commande {n} est confirmée — total {t}",
    de:"Ihre Bestellung {n} ist bestätigt — Gesamt {t}", pt:"A sua encomenda {n} está confirmada — total {t}",
    nl:"Uw bestelling {n} is bevestigd — totaal {t}", pl:"Twoje zamówienie {n} jest potwierdzone — razem {t}",
  },
  orderConfTitle: {
    it:"Ordine confermato", en:"Order confirmed", es:"Pedido confirmado", fr:"Commande confirmée",
    de:"Bestellung bestätigt", pt:"Encomenda confirmada", nl:"Bestelling bevestigd", pl:"Zamówienie potwierdzone",
  },
  orderConfBody: {
    it:"Abbiamo ricevuto il tuo ordine <strong>{n}</strong> e lo abbiamo inoltrato ai fornitori coinvolti.",
    en:"We have received your order <strong>{n}</strong> and forwarded it to the suppliers involved.",
    es:"Hemos recibido tu pedido <strong>{n}</strong> y lo hemos enviado a los proveedores implicados.",
    fr:"Nous avons bien reçu votre commande <strong>{n}</strong> et l'avons transmise aux fournisseurs concernés.",
    de:"Wir haben Ihre Bestellung <strong>{n}</strong> erhalten und an die beteiligten Lieferanten weitergeleitet.",
    pt:"Recebemos a sua encomenda <strong>{n}</strong> e encaminhámo-la para os fornecedores envolvidos.",
    nl:"We hebben uw bestelling <strong>{n}</strong> ontvangen en doorgestuurd naar de betrokken leveranciers.",
    pl:"Otrzymaliśmy Twoje zamówienie <strong>{n}</strong> i przekazaliśmy je zaangażowanym dostawcom.",
  },
  orderConfNote: {
    it:"Ogni fornitore gestisce la spedizione dei propri prodotti in autonomia: riceverai un'email dedicata con il numero di tracciabilità non appena il pacco parte.",
    en:"Each supplier ships their own products independently: you will receive a separate email with the tracking number as soon as the parcel leaves.",
    es:"Cada proveedor gestiona el envío de sus productos de forma independiente: recibirás un correo aparte con el número de seguimiento en cuanto salga el paquete.",
    fr:"Chaque fournisseur gère l'expédition de ses produits de manière autonome : vous recevrez un e-mail dédié avec le numéro de suivi dès le départ du colis.",
    de:"Jeder Lieferant versendet seine Produkte eigenständig: Sie erhalten eine separate E-Mail mit der Sendungsnummer, sobald das Paket unterwegs ist.",
    pt:"Cada fornecedor trata do envio dos seus produtos de forma autónoma: receberá um e-mail dedicado com o número de rastreio assim que a encomenda partir.",
    nl:"Elke leverancier verzendt zijn eigen producten zelfstandig: u ontvangt een aparte e-mail met het trackingnummer zodra het pakket vertrekt.",
    pl:"Każdy dostawca wysyła swoje produkty samodzielnie: otrzymasz osobny e-mail z numerem przesyłki, gdy tylko paczka zostanie nadana.",
  },
  orderConfCta: {
    it:"Visualizza l'ordine", en:"View order", es:"Ver el pedido", fr:"Voir la commande",
    de:"Bestellung ansehen", pt:"Ver a encomenda", nl:"Bestelling bekijken", pl:"Zobacz zamówienie",
  },
  totalLabel: {
    it:"Totale", en:"Total", es:"Total", fr:"Total", de:"Gesamt", pt:"Total", nl:"Totaal", pl:"Razem",
  },

  // ── Spedizione ──
  shipPre: {
    it:"Il tuo ordine {n} è stato spedito — tracking {tr}", en:"Your order {n} has shipped — tracking {tr}",
    es:"Tu pedido {n} ha sido enviado — seguimiento {tr}", fr:"Votre commande {n} a été expédiée — suivi {tr}",
    de:"Ihre Bestellung {n} wurde versandt — Sendungsnummer {tr}", pt:"A sua encomenda {n} foi expedida — rastreio {tr}",
    nl:"Uw bestelling {n} is verzonden — tracking {tr}", pl:"Twoje zamówienie {n} zostało wysłane — numer {tr}",
  },
  shipTitle: {
    it:"Il tuo ordine è in viaggio", en:"Your order is on its way", es:"Tu pedido está en camino",
    fr:"Votre commande est en route", de:"Ihre Bestellung ist unterwegs", pt:"A sua encomenda está a caminho",
    nl:"Uw bestelling is onderweg", pl:"Twoje zamówienie jest w drodze",
  },
  shipBody: {
    it:"Il tuo ordine <strong>{n}</strong> è stato spedito{c}.", en:"Your order <strong>{n}</strong> has been shipped{c}.",
    es:"Tu pedido <strong>{n}</strong> ha sido enviado{c}.", fr:"Votre commande <strong>{n}</strong> a été expédiée{c}.",
    de:"Ihre Bestellung <strong>{n}</strong> wurde versandt{c}.", pt:"A sua encomenda <strong>{n}</strong> foi expedida{c}.",
    nl:"Uw bestelling <strong>{n}</strong> is verzonden{c}.", pl:"Twoje zamówienie <strong>{n}</strong> zostało wysłane{c}.",
  },
  shipVia: {
    it:" tramite <strong>{c}</strong>", en:" via <strong>{c}</strong>", es:" mediante <strong>{c}</strong>",
    fr:" via <strong>{c}</strong>", de:" mit <strong>{c}</strong>", pt:" através de <strong>{c}</strong>",
    nl:" via <strong>{c}</strong>", pl:" przez <strong>{c}</strong>",
  },
  shipCarrier: {
    it:"Corriere", en:"Carrier", es:"Transportista", fr:"Transporteur",
    de:"Versanddienstleister", pt:"Transportadora", nl:"Vervoerder", pl:"Przewoźnik",
  },
  shipTrackLabel: {
    it:"Numero di tracciabilità", en:"Tracking number", es:"Número de seguimiento",
    fr:"Numéro de suivi", de:"Sendungsnummer", pt:"Número de rastreio",
    nl:"Trackingnummer", pl:"Numer przesyłki",
  },
  shipNote: {
    it:"Usa questo codice sul sito del corriere per seguire la spedizione passo passo.",
    en:"Use this code on the carrier's website to follow the shipment step by step.",
    es:"Usa este código en la web del transportista para seguir el envío paso a paso.",
    fr:"Utilisez ce code sur le site du transporteur pour suivre l'expédition étape par étape.",
    de:"Verwenden Sie diesen Code auf der Website des Versanddienstleisters, um die Sendung Schritt für Schritt zu verfolgen.",
    pt:"Use este código no site da transportadora para acompanhar a expedição passo a passo.",
    nl:"Gebruik deze code op de website van de vervoerder om de zending stap voor stap te volgen.",
    pl:"Użyj tego numeru na stronie przewoźnika, aby śledzić przesyłkę krok po kroku.",
  },
  shipCta: {
    it:"Vai ai tuoi ordini", en:"Go to your orders", es:"Ir a tus pedidos", fr:"Voir vos commandes",
    de:"Zu Ihren Bestellungen", pt:"Ver as suas encomendas", nl:"Naar uw bestellingen", pl:"Przejdź do zamówień",
  },

  // ── Benvenuto cliente ──
  welcomePre: {
    it:"Il tuo account Oralzon è attivo", en:"Your Oralzon account is active",
    es:"Tu cuenta de Oralzon está activa", fr:"Votre compte Oralzon est actif",
    de:"Ihr Oralzon-Konto ist aktiv", pt:"A sua conta Oralzon está ativa",
    nl:"Uw Oralzon-account is actief", pl:"Twoje konto Oralzon jest aktywne",
  },
  welcomeTitle: {
    it:"Benvenuto su Oralzon", en:"Welcome to Oralzon", es:"Bienvenido a Oralzon",
    fr:"Bienvenue sur Oralzon", de:"Willkommen bei Oralzon", pt:"Bem-vindo à Oralzon",
    nl:"Welkom bij Oralzon", pl:"Witamy w Oralzon",
  },
  welcomeBody: {
    it:"Il tuo account Oralzon è attivo. Da qui puoi sfogliare il catalogo, confrontare i fornitori e completare i tuoi acquisti professionali in pochi passaggi.",
    en:"Your Oralzon account is active. From here you can browse the catalogue, compare suppliers and complete your professional purchases in just a few steps.",
    es:"Tu cuenta de Oralzon está activa. Desde aquí puedes explorar el catálogo, comparar proveedores y completar tus compras profesionales en pocos pasos.",
    fr:"Votre compte Oralzon est actif. Vous pouvez désormais parcourir le catalogue, comparer les fournisseurs et finaliser vos achats professionnels en quelques étapes.",
    de:"Ihr Oralzon-Konto ist aktiv. Ab sofort können Sie den Katalog durchsuchen, Lieferanten vergleichen und Ihre gewerblichen Einkäufe in wenigen Schritten abschließen.",
    pt:"A sua conta Oralzon está ativa. A partir daqui pode explorar o catálogo, comparar fornecedores e concluir as suas compras profissionais em poucos passos.",
    nl:"Uw Oralzon-account is actief. Vanaf hier kunt u de catalogus doorbladeren, leveranciers vergelijken en uw zakelijke aankopen in enkele stappen afronden.",
    pl:"Twoje konto Oralzon jest aktywne. Możesz teraz przeglądać katalog, porównywać dostawców i finalizować zakupy w kilku krokach.",
  },
  welcomeCta: {
    it:"Sfoglia il catalogo", en:"Browse the catalogue", es:"Explorar el catálogo",
    fr:"Parcourir le catalogue", de:"Katalog durchsuchen", pt:"Explorar o catálogo",
    nl:"Bekijk de catalogus", pl:"Przeglądaj katalog",
  },
};

function itemsTableHtml(items: { name: string; quantity: number; price: number }[], lang: EmailLang = 'it'): string {
  // Il nome del prodotto arriva già tradotto da chi chiama questa funzione
  // (lo legge da products.translations); qui si localizzano solo le
  // intestazioni e il formato degli importi.
  const rows = items.map(i =>
    `<tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f1f3;font-size:13px;color:#111827;">${i.name || tr(EMAIL_COMMON,'colProduct',lang)}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f1f3;font-size:13px;color:#6b7280;text-align:center;">×${i.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f1f3;font-size:13px;color:#111827;text-align:right;font-weight:600;">${fmtEur(i.price * i.quantity, lang)}</td>
    </tr>`
  ).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-collapse:collapse;">
    <tr style="background:#f9fafb;"><th style="padding:8px;text-align:left;font-size:11px;color:#9ca3af;text-transform:uppercase;">${tr(EMAIL_COMMON,'colProduct',lang)}</th><th style="padding:8px;font-size:11px;color:#9ca3af;text-transform:uppercase;">${tr(EMAIL_COMMON,'colQty',lang)}</th><th style="padding:8px;text-align:right;font-size:11px;color:#9ca3af;text-transform:uppercase;">${tr(EMAIL_COMMON,'colTotal',lang)}</th></tr>
    ${rows}
  </table>`;
}

// Recupera i prodotti più venduti su tutta la piattaforma (stessa vista
// pubblica usata dalla sezione "Più venduti" della home), per la sezione
// "Potrebbero interessarti" in fondo alle email di ordine e spedizione.
// Esclude i prodotti già presenti nell'ordine corrente (non ha senso
// consigliare qualcosa appena acquistato) e quelli non più disponibili.
async function getBestsellersForEmail(supabase: any, limit: number, excludeProductIds: string[] = []): Promise<{ id: string; name: string; image: string | null; price: number }[]> {
  try {
    const { data: stats } = await supabase
      .from('public_product_sales_stats')
      .select('product_id, total_sold')
      .order('total_sold', { ascending: false })
      .limit(limit + excludeProductIds.length + 10); // margine per compensare gli esclusi/non disponibili

    const candidateIds = (stats || [])
      .map((s: any) => s.product_id)
      .filter((id: string) => !excludeProductIds.includes(id));
    if (candidateIds.length === 0) return [];

    const { data: products } = await supabase
      .from('products')
      .select('id, name, images, price, discount_price, discount_starts_at, discount_ends_at, stock, status')
      .in('id', candidateIds)
      .eq('status', 'published')
      .gt('stock', 0); // qui, a differenza del catalogo, ha senso consigliare solo ciò che è davvero acquistabile subito

    const byId: Record<string, any> = {};
    (products || []).forEach((p: any) => { byId[p.id] = p; });

    return candidateIds
      .map((id: string) => byId[id])
      .filter(Boolean)
      .slice(0, limit)
      .map((p: any) => ({
        id: p.id,
        name: p.name,
        image: Array.isArray(p.images) ? p.images[0] : (p.images || null),
        price: isDiscountActive(p) ? Number(p.discount_price) : Number(p.price),
      }));
  } catch (e: any) {
    console.warn("Impossibile caricare i prodotti consigliati per l'email:", e.message);
    return [];
  }
}

// Blocco "Potrebbero interessarti anche" — griglia a 3 colonne compatibile
// con i client email (usa <table>, non flex/grid CSS). Ritorna stringa vuota
// se non ci sono prodotti da suggerire, così il chiamante non deve verificarlo.
function bestsellersEmailHtml(products: { id: string; name: string; image: string | null; price: number }[], lang: EmailLang = 'it'): string {
  if (!products.length) return '';
  const cells = products.slice(0, 3).map(p => `
    <td width="33%" valign="top" style="padding:0 6px;">
      <a href="${SITE_URL}/negozio/prodotto/${p.id}" style="text-decoration:none;color:inherit;display:block;">
        <div style="border:1px solid #eef0f2;border-radius:10px;overflow:hidden;">
          <div style="background:#f9fafb;aspect-ratio:1/1;">
            <img src="${p.image || SITE_URL + '/images/product-placeholder.svg'}" alt="${p.name}" width="160" style="display:block;width:100%;height:auto;aspect-ratio:1/1;object-fit:contain;" />
          </div>
          <div style="padding:8px 10px 10px;">
            <p style="margin:0 0 4px;font-size:11px;line-height:1.35;color:#374151;height:29px;overflow:hidden;">${p.name}</p>
            <p style="margin:0;font-size:13px;font-weight:800;color:${BRAND_BLUE};">${fmtEur(p.price, lang)}</p>
          </div>
        </div>
      </a>
    </td>`).join('');
  return `
  <tr><td style="padding:4px 26px 28px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="padding-bottom:14px;">
        <span style="font-size:12px;font-weight:700;color:#8A9698;text-transform:uppercase;letter-spacing:0.6px;">${tr(EMAIL_COMMON,'alsoLike',lang)}</span>
      </td>
    </tr></table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${cells}</tr></table>
  </td></tr>`;
}

// 1. Conferma ordine (cliente)
function orderConfirmationHtml(orderNumber: string, name: string, total: number, items: any[], bestsellers: { id: string; name: string; image: string | null; price: number }[] = [], lang: EmailLang = 'it'): string {
  const totalStr = fmtEur(total, lang);
  return emailWrapper({
    lang,
    preheader: tr(EMAIL_TEXTS,'orderConfPre',lang,{n:orderNumber,t:totalStr}),
    title: tr(EMAIL_TEXTS,'orderConfTitle',lang),
    bodyHtml: `
      <p>${tr(EMAIL_COMMON,'hello',lang,{name:`<strong>${name}</strong>`})}</p>
      <p>${tr(EMAIL_TEXTS,'orderConfBody',lang,{n:orderNumber})}</p>
      ${itemsTableHtml(items, lang)}
      <p style="text-align:right;font-size:17px;font-weight:800;color:#111827;margin:12px 0 0;">${tr(EMAIL_TEXTS,'totalLabel',lang)}: ${totalStr}</p>
      <p style="color:#6b7280;font-size:13px;margin-top:16px;">${tr(EMAIL_TEXTS,'orderConfNote',lang)}</p>
    `,
    ctaLabel: tr(EMAIL_TEXTS,'orderConfCta',lang), ctaUrl: `${SITE_URL}/account/ordini`,
    extraSectionHtml: bestsellersEmailHtml(bestsellers, lang),
  });
}

// 2. Spedizione con tracking (cliente)
function shippingNotificationHtml(orderNumber: string, name: string, trackingNumber: string, carrier?: string, bestsellers: { id: string; name: string; image: string | null; price: number }[] = [], lang: EmailLang = 'it'): string {
  const via = carrier ? tr(EMAIL_TEXTS,'shipVia',lang,{c:carrier}) : '';
  return emailWrapper({
    lang,
    preheader: tr(EMAIL_TEXTS,'shipPre',lang,{n:orderNumber,tr:trackingNumber}),
    title: tr(EMAIL_TEXTS,'shipTitle',lang),
    bodyHtml: `
      <p>${tr(EMAIL_COMMON,'hello',lang,{name:`<strong>${name}</strong>`})}</p>
      <p>${tr(EMAIL_TEXTS,'shipBody',lang,{n:orderNumber,c:via})}</p>
      <div style="background:#EAFBF6;border:1px solid #7FD9C4;border-radius:12px;padding:16px;margin:16px 0;text-align:center;">
        ${carrier ? `<p style="margin:0 0 8px;font-size:13px;color:#374151;">${tr(EMAIL_TEXTS,'shipCarrier',lang)}: <strong>${carrier}</strong></p>` : ''}
        <p style="margin:0 0 4px;font-size:11px;color:#0F7A68;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">${tr(EMAIL_TEXTS,'shipTrackLabel',lang)}</p>
        <p style="margin:0;font-size:18px;font-weight:800;color:#111827;font-family:monospace;letter-spacing:1px;">${trackingNumber}</p>
      </div>
      <p style="color:#6b7280;font-size:13px;">${tr(EMAIL_TEXTS,'shipNote',lang)}</p>
    `,
    ctaLabel: tr(EMAIL_TEXTS,'shipCta',lang), ctaUrl: `${SITE_URL}/account/ordini`,
    extraSectionHtml: bestsellersEmailHtml(bestsellers, lang),
  });
}

// 3. Benvenuto — nuovo cliente
function welcomeCustomerHtml(name: string, lang: EmailLang = 'it'): string {
  return emailWrapper({
    lang,
    preheader: tr(EMAIL_TEXTS,'welcomePre',lang),
    // Il titolo non concatena a mano il nome: in alcune lingue la virgola
    // e la posizione cambiano, quindi il nome va dentro la stringa tradotta.
    title: name ? `${tr(EMAIL_TEXTS,'welcomeTitle',lang)}, ${name}` : tr(EMAIL_TEXTS,'welcomeTitle',lang),
    bodyHtml: `
      <p>${tr(EMAIL_TEXTS,'welcomeBody',lang)}</p>
    `,
    ctaLabel: tr(EMAIL_TEXTS,'welcomeCta',lang), ctaUrl: `${SITE_URL}/negozio`,
  });
}

// 4. Benvenuto — nuovo venditore
function welcomeVendorHtml(name: string, businessName: string): string {
  return emailWrapper({
    preheader: "Il tuo store Oralzon è attivo — inizia a vendere",
    title: "Il tuo store è attivo",
    bodyHtml: `
      <p>Ciao <strong>${name}</strong>,</p>
      <p><strong>${businessName}</strong> è ora uno store attivo su Oralzon. Hai 6 mesi di prova gratuita per pubblicare il catalogo e ricevere i primi ordini, senza alcun costo di ingresso.</p>
      <p style="color:#6b7280;font-size:13px;">Dalla tua dashboard puoi caricare i prodotti, gestire ordini e spedizioni, rispondere ai clienti e seguire l'andamento delle vendite.</p>
    `,
    ctaLabel: "Vai alla dashboard", ctaUrl: `${SITE_URL}/venditore/dashboard`,
  });
}

// 5. Nuovo ordine ricevuto (venditore)
function newOrderVendorHtml(orderNumber: string, vendorName: string, items: any[], total: number): string {
  return emailWrapper({
    preheader: `Nuovo ordine ${orderNumber} — €${total.toFixed(2)}`,
    title: "Hai ricevuto un nuovo ordine",
    bodyHtml: `
      <p>Ciao <strong>${vendorName}</strong>,</p>
      <p>Hai ricevuto l'ordine <strong>${orderNumber}</strong> su Oralzon. Preparalo per la spedizione appena possibile.</p>
      ${itemsTableHtml(items)}
      <p style="text-align:right;font-size:17px;font-weight:800;color:#111827;margin:12px 0 0;">Totale: €${total.toFixed(2)}</p>
    `,
    ctaLabel: "Gestisci l'ordine", ctaUrl: `${SITE_URL}/venditore/ordini`,
  });
}

// 6. Richiesta di reso ricevuta (conferma al cliente)
function returnRequestReceivedHtml(orderNumber: string, name: string, productName: string): string {
  return emailWrapper({
    preheader: `Richiesta di reso ricevuta per l'ordine ${orderNumber}`,
    title: "Richiesta di reso ricevuta",
    bodyHtml: `
      <p>Ciao <strong>${name}</strong>,</p>
      <p>Abbiamo ricevuto la tua richiesta di reso per <strong>${productName}</strong>, relativa all'ordine <strong>${orderNumber}</strong>.</p>
      <p style="color:#6b7280;font-size:13px;">Il venditore la esaminerà a breve: riceverai una nuova email con l'esito e le istruzioni per la restituzione.</p>
    `,
    ctaLabel: "Segui lo stato del reso", ctaUrl: `${SITE_URL}/account/ordini`,
  });
}

// 7. Nuova richiesta di reso (notifica venditore)
function newReturnVendorHtml(orderNumber: string, vendorName: string, productName: string, reason: string): string {
  return emailWrapper({
    preheader: `Nuova richiesta di reso per l'ordine ${orderNumber}`,
    title: "Nuova richiesta di reso",
    bodyHtml: `
      <p>Ciao <strong>${vendorName}</strong>,</p>
      <p>Un cliente ha richiesto il reso di <strong>${productName}</strong> dall'ordine <strong>${orderNumber}</strong>.</p>
      <div style="background:#fef3c7;border-radius:10px;padding:12px 16px;margin:14px 0;">
        <p style="margin:0;font-size:13px;color:#92400e;"><strong>Motivo indicato:</strong> ${reason || 'Non specificato'}</p>
      </div>
      <p style="color:#6b7280;font-size:13px;">Esamina la richiesta e accettala o rifiutala dalla tua dashboard.</p>
    `,
    ctaLabel: "Gestisci la richiesta", ctaUrl: `${SITE_URL}/venditore/resi`,
  });
}

// 8. Esito reso (cliente) — approvato / rifiutato / rimborsato
function returnDecisionHtml(orderNumber: string, name: string, productName: string, status: 'approved' | 'rejected' | 'refunded', note?: string): string {
  const cfg = {
    approved: { emoji: "check", color: "#16a34a", title: "Reso approvato", msg: `La tua richiesta di reso per <strong>${productName}</strong> è stata approvata dal venditore.` },
    rejected: { emoji: "undo", color: "#dc2626", title: "Reso non approvato", msg: `La tua richiesta di reso per <strong>${productName}</strong> non è stata approvata.` },
    refunded: { emoji: "money", color: "#16a34a", title: "Rimborso effettuato", msg: `Il rimborso per <strong>${productName}</strong> è stato elaborato e tornerà sul tuo metodo di pagamento nei prossimi giorni.` },
  }[status];
  return emailWrapper({
    preheader: `${cfg.title} — ordine ${orderNumber}`,
    title: cfg.title,
    bodyHtml: `
      <p>Ciao <strong>${name}</strong>,</p>
      <p>${cfg.msg}</p>
      <p style="font-size:12px;color:#9ca3af;">Ordine di riferimento: ${orderNumber}</p>
      ${note ? `<div style="background:#f9fafb;border-radius:10px;padding:12px 16px;margin:14px 0;"><p style="margin:0;font-size:13px;color:#374151;"><strong>Nota dal venditore:</strong> ${note}</p></div>` : ''}
    `,
    ctaLabel: "Vedi i tuoi ordini", ctaUrl: `${SITE_URL}/account/ordini`,
  });
}

// ── Preavvisi di scadenza del periodo di prova ──────────────
// Tre comunicazioni prima della sospensione: -7 giorni, +2 giorni, +7
// giorni. Scritte con tono da comunicazione amministrativa reale: fatto,
// data, importo, una sola azione. Niente entusiasmo di circostanza,
// niente elenchi di benefici, niente "speriamo ti trovi bene" — un
// venditore che riceve un avviso di scadenza vuole sapere cosa scade,
// quando, quanto costa e cosa succede se non fa nulla.

function trialNoticeDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

// 1. Sette giorni prima della scadenza
function trialEndingSoonHtml(name: string, businessName: string, endDate: string): string {
  return emailWrapper({
    preheader: `Il periodo di prova di ${businessName} termina il ${endDate}`,
    title: "Il tuo periodo di prova sta per terminare",
    bodyHtml: `
      <p>Gentile ${name},</p>
      <p>il periodo di prova gratuito di <strong>${businessName}</strong> termina il <strong>${endDate}</strong>.</p>
      <p>Per continuare a vendere su Oralzon dopo tale data è necessario attivare il piano venditore, al costo di <strong>199 € all'anno</strong>. Il piano comprende prodotti illimitati, gestione ordini e spedizioni, statistiche di vendita e assistenza.</p>
      <p>Se non attivi il piano, il tuo negozio resterà comunque accessibile per una settimana dopo la scadenza. Trascorso quel periodo i tuoi prodotti non saranno più acquistabili, ma catalogo e storico ordini rimarranno salvati e torneranno disponibili non appena attiverai il piano.</p>
      <p style="color:#6b7280;font-size:13px;">Se hai già attivato il piano negli ultimi giorni, considera questo messaggio come non ricevuto.</p>
    `,
    ctaLabel: "Attiva il piano venditore", ctaUrl: `${SITE_URL}/pricing-venditori`,
  });
}

// 2. Due giorni dopo la scadenza
function trialExpiredHtml(name: string, businessName: string, endDate: string, blockDate: string): string {
  return emailWrapper({
    preheader: `Periodo di prova terminato il ${endDate} — negozio attivo fino al ${blockDate}`,
    title: "Periodo di prova terminato",
    bodyHtml: `
      <p>Gentile ${name},</p>
      <p>il periodo di prova gratuito di <strong>${businessName}</strong> si è concluso il <strong>${endDate}</strong>. Il piano venditore non risulta ancora attivo.</p>
      <p>Il tuo negozio è tuttora online e i tuoi prodotti sono regolarmente acquistabili, ma solo fino al <strong>${blockDate}</strong>. Dopo tale data le schede prodotto verranno rimosse dal catalogo pubblico.</p>
      <p>Per evitare l'interruzione è sufficiente attivare il piano venditore: <strong>199 € all'anno</strong>, attivazione immediata.</p>
      <p style="color:#6b7280;font-size:13px;">Gli ordini già ricevuti restano validi e vanno evasi normalmente, indipendentemente dallo stato del piano.</p>
    `,
    ctaLabel: "Attiva il piano venditore", ctaUrl: `${SITE_URL}/pricing-venditori`,
  });
}

// 3. Sette giorni dopo la scadenza — sospensione applicata
function trialSuspendedHtml(name: string, businessName: string, endDate: string): string {
  return emailWrapper({
    preheader: `Vendite sospese per ${businessName}`,
    title: "Vendite sospese",
    bodyHtml: `
      <p>Gentile ${name},</p>
      <p>non avendo ricevuto l'attivazione del piano venditore entro i termini indicati nelle nostre precedenti comunicazioni, da oggi i prodotti di <strong>${businessName}</strong> non sono più acquistabili su Oralzon. Il periodo di prova era terminato il ${endDate}.</p>
      <p>Nessun dato è stato eliminato: catalogo, immagini, storico ordini, recensioni e statistiche restano archiviati. Attivando il piano venditore il negozio torna online con tutti i prodotti già pubblicati, senza dover ricaricare nulla.</p>
      <p>Restano visibili in dashboard gli ordini ricevuti prima della sospensione, che vanno evasi normalmente. I relativi pagamenti ti verranno accreditati secondo le condizioni abituali.</p>
      <p style="color:#6b7280;font-size:13px;">Se ritieni che si tratti di un errore, o se hai bisogno di più tempo, scrivici a support@oralzon.com.</p>
    `,
    ctaLabel: "Riattiva il negozio", ctaUrl: `${SITE_URL}/pricing-venditori`,
  });
}

// ── HEALTH ──
app.get("/make-server-000b3cfb/health", (c) => c.json({ status: "ok" }));

// ── DIAGNOSTICA TEMPORANEA: verifica che ANTHROPIC_API_KEY sia leggibile
// dalla funzione, senza mai esporne il valore. Da rimuovere dopo il test. ──
app.get("/make-server-000b3cfb/system/check-anthropic-key", (c) => {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  return c.json({
    hasKey: !!key,
    keyLength: key?.length || 0,
    keyPrefix: key ? key.slice(0, 7) : null, // es. "sk-ant-" — conferma solo il formato, non la chiave
  });
});

// ── Helper: verifica che il chiamante sia un utente autenticato valido ──
// Restituisce l'utente (id + email) risolto dal token, senza richiedere un ruolo specifico.
async function requireAuth(c: any): Promise<{ ok: boolean; userId?: string; email?: string; error?: string }> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader) return { ok: false, error: "Non autorizzato" };
  const token = authHeader.replace("Bearer ", "");
  const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) return { ok: false, error: "Token non valido" };
  return { ok: true, userId: user.id, email: user.email };
}

// ── Helper: verifica che l'utente sia admin ──
async function requireAdmin(supabase: any, token: string): Promise<{ ok: boolean; userId?: string; error?: string }> {
  const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
  const { data: { user } } = await anonClient.auth.getUser(token);
  if (!user) return { ok: false, error: "Token non valido" };
  const { data: profile } = await supabase.from("profiles").select("user_type").eq("id", user.id).maybeSingle();
  if ((profile as any)?.user_type !== "admin") return { ok: false, error: "Accesso riservato agli amministratori" };
  return { ok: true, userId: user.id };
}

// ── ADMIN: rimborso manuale di un ordine (totale o parziale) ──
app.post("/make-server-000b3cfb/admin/refund-order", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const supabase = getServiceClient();
    const auth = await requireAdmin(supabase, authHeader.replace("Bearer ", ""));
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 403);

    const { orderId, amount, reason } = await c.req.json();
    if (!orderId) return c.json({ success: false, error: "orderId mancante" }, 400);

    const { data: order } = await supabase.from("orders")
      .select("id, order_number, stripe_session_id, total_amount, shipping_email, shipping_name, refunded_amount")
      .eq("id", orderId).single();
    if (!order) return c.json({ success: false, error: "Ordine non trovato" }, 404);
    if (!order.stripe_session_id) return c.json({ success: false, error: "Nessuna sessione di pagamento collegata a questo ordine" }, 400);

    const alreadyRefunded = Number(order.refunded_amount || 0);
    const refundAmount = amount ? Number(amount) : Number(order.total_amount) - alreadyRefunded;
    if (refundAmount <= 0) return c.json({ success: false, error: "Importo di rimborso non valido" }, 400);
    if (alreadyRefunded + refundAmount > Number(order.total_amount) + 0.01) {
      return c.json({ success: false, error: "L'importo supera il totale rimborsabile per questo ordine" }, 400);
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return c.json({ success: false, error: "Stripe non configurato sul server" }, 500);

    let refundId: string;
    try {
      const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });
      const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
      if (!session.payment_intent) throw new Error("Pagamento non trovato per questa sessione");
      const refund = await stripe.refunds.create({
        payment_intent: session.payment_intent as string,
        amount: Math.round(refundAmount * 100),
        reason: "requested_by_customer",
        metadata: { order_id: orderId, order_number: order.order_number, admin_action: "true" },
      });
      refundId = refund.id;
    } catch (stripeErr: any) {
      console.error("❌ Rimborso Stripe (admin) fallito:", stripeErr.message);
      return c.json({ success: false, error: `Rimborso non riuscito: ${stripeErr.message}` }, 500);
    }

    const newTotal = alreadyRefunded + refundAmount;
    const newStatus = newTotal >= Number(order.total_amount) - 0.01 ? "refunded" : "partially_refunded";
    await supabase.from("orders").update({
      status: newStatus,
      refunded_amount: newTotal,
      refunded_at: new Date().toISOString(),
      refund_reason: reason || null,
      stripe_refund_id: refundId,
    }).eq("id", orderId);

    // Se parte di questo ordine era già stata trasferita al/ai venditore/i
    // (consegna già confermata), recupera la quota proporzionale del
    // rimborso PRIMA di dichiarare l'operazione riuscita — altrimenti il
    // cliente viene rimborsato ma il venditore tiene comunque i soldi.
    let reversalWarnings: string[] = [];
    try {
      const stripe2 = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });
      const { warnings } = await reverseTransfersForOrder(supabase, stripe2, orderId, refundAmount, Number(order.total_amount));
      reversalWarnings = warnings;
      if (warnings.length > 0) console.error("⚠️ admin/refund-order — reversal incompleti:", warnings);
    } catch (revErr: any) {
      console.error("❌ reverseTransfersForOrder:", revErr.message);
      reversalWarnings.push(`Verifica manuale necessaria: ${revErr.message}`);
    }

    if (order.shipping_email) {
      await sendEmail(order.shipping_email, `Rimborso elaborato — ordine ${order.order_number}`,
        emailWrapper({
          preheader: `Rimborso di €${refundAmount.toFixed(2)} per l'ordine ${order.order_number}`,
          title: "Rimborso Elaborato",
          bodyHtml: `
            <p>Ciao <strong>${order.shipping_name}</strong>,</p>
            <p>Abbiamo elaborato un rimborso di <strong>€${refundAmount.toFixed(2)}</strong> per il tuo ordine <strong>${order.order_number}</strong>.</p>
            <p style="color:#6b7280;font-size:13px;">L'importo tornerà sul tuo metodo di pagamento originale entro 5-10 giorni lavorativi, a seconda della tua banca.</p>
            ${reason ? `<div style="background:#f9fafb;border-radius:10px;padding:12px 16px;margin:14px 0;"><p style="margin:0;font-size:13px;color:#374151;"><strong>Motivo:</strong> ${reason}</p></div>` : ''}
          `,
          ctaLabel: "Vedi i tuoi ordini", ctaUrl: `${SITE_URL}/account/ordini`,
        })
      );
    }

    return c.json({ success: true, refundId, refundedAmount: refundAmount, newStatus, reversalWarnings });
  } catch (e: any) {
    console.error("❌ admin/refund-order:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── ADMIN: sospendi account cliente (blocca login + segnala in UI) ──
app.post("/make-server-000b3cfb/admin/suspend-user", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const supabase = getServiceClient();
    const auth = await requireAdmin(supabase, authHeader.replace("Bearer ", ""));
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 403);

    const { userId, reason } = await c.req.json();
    if (!userId) return c.json({ success: false, error: "userId mancante" }, 400);
    if (userId === auth.userId) return c.json({ success: false, error: "Non puoi sospendere il tuo stesso account" }, 400);

    // Blocca davvero il login (non solo un flag) — ban di 10 anni
    const { error: banError } = await supabase.auth.admin.updateUserById(userId, { ban_duration: "87600h" });
    if (banError) throw new Error(banError.message);

    await supabase.from("profiles").update({
      is_suspended: true, suspended_at: new Date().toISOString(), suspended_reason: reason || null,
    }).eq("id", userId);

    return c.json({ success: true });
  } catch (e: any) {
    console.error("❌ admin/suspend-customer:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── ADMIN: riattiva account cliente sospeso ──
app.post("/make-server-000b3cfb/admin/unsuspend-user", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const supabase = getServiceClient();
    const auth = await requireAdmin(supabase, authHeader.replace("Bearer ", ""));
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 403);

    const { userId } = await c.req.json();
    if (!userId) return c.json({ success: false, error: "userId mancante" }, 400);

    const { error: unbanError } = await supabase.auth.admin.updateUserById(userId, { ban_duration: "none" });
    if (unbanError) throw new Error(unbanError.message);

    await supabase.from("profiles").update({
      is_suspended: false, suspended_at: null, suspended_reason: null,
    }).eq("id", userId);

    return c.json({ success: true });
  } catch (e: any) {
    console.error("❌ admin/reactivate-customer:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── ADMIN: annulla una promozione attiva (con rimborso opzionale) ──
app.post("/make-server-000b3cfb/admin/refund-promotion", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const supabase = getServiceClient();
    const auth = await requireAdmin(supabase, authHeader.replace("Bearer ", ""));
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 403);

    const { promotionId } = await c.req.json();
    if (!promotionId) return c.json({ success: false, error: "promotionId mancante" }, 400);

    const { data: promo } = await supabase.from("promotions").select("*, vendors(business_name, profile_id)").eq("id", promotionId).single();
    if (!promo) return c.json({ success: false, error: "Promozione non trovata" }, 404);
    if (promo.admin_refund_id) return c.json({ success: false, error: "Promozione già rimborsata" }, 400);

    // Disattiva la promo
    await supabase.from("promotions").update({ status: "cancelled" }).eq("id", promotionId);

    // Rimuove l'effetto di visibilità corrispondente
    if (promo.package_id?.startsWith("homepage_")) {
      await supabase.from("vendors").update({ homepage_sponsored: false, homepage_expires_at: null }).eq("id", promo.vendor_id);
    }
    if (promo.package_id?.startsWith("featured_")) {
      // Se la promo aveva prodotti specifici, disattiva solo quelli; altrimenti tutti quelli del vendor
      if (promo.selected_product_ids?.length > 0) {
        await supabase.from("products").update({ is_sponsored: false, promo_expires_at: null }).in("id", promo.selected_product_ids);
      } else {
        await supabase.from("products").update({ is_sponsored: false, promo_expires_at: null }).eq("vendor_id", promo.vendor_id);
      }
    }
    if (promo.package_id?.startsWith("hero_")) {
      if (promo.selected_product_ids?.length > 0) {
        await supabase.from("products").update({ is_hero_sponsored: false, promo_expires_at: null }).in("id", promo.selected_product_ids);
      } else {
        await supabase.from("products").update({ is_hero_sponsored: false, promo_expires_at: null }).eq("vendor_id", promo.vendor_id);
      }
    }

    let refundId: string | null = null;
    if (promo.stripe_session_id) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        try {
          const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });
          const session = await stripe.checkout.sessions.retrieve(promo.stripe_session_id);
          if (session.payment_intent) {
            const r = await stripe.refunds.create({
              payment_intent: session.payment_intent as string,
              amount: Math.round(Number(promo.amount_paid) * 100),
              reason: "requested_by_customer",
              metadata: { promotion_id: promotionId, refunded_by: "admin" },
            });
            refundId = r.id;
            await supabase.from("promotions").update({ admin_refund_id: r.id, admin_refunded_at: new Date().toISOString() }).eq("id", promotionId);
          }
        } catch (stripeErr: any) {
          console.warn("Rimborso promo fallito (promo comunque annullata):", stripeErr.message);
        }
      }
    }

    // Notifica il venditore
    const vendorProfileId = (promo.vendors as any)?.profile_id;
    if (vendorProfileId) {
      const { data: vendorProfile } = await supabase.from("profiles").select("email, nome").eq("id", vendorProfileId).maybeSingle();
      if (vendorProfile?.email) {
        await sendEmail(vendorProfile.email, `Promozione rimborsata — Oralzon`,
          emailWrapper({
            preheader: `La promozione "${promo.package_name}" è stata rimborsata e disattivata`,
            title: "Promozione Rimborsata",
            bodyHtml: `
              <p>Ciao <strong>${vendorProfile.nome || "Venditore"}</strong>,</p>
              <p>La promozione <strong>${promo.package_name}</strong> (€${Number(promo.amount_paid).toFixed(2)}) è stata rimborsata dal nostro team ed è stata disattivata.</p>
            `,
            ctaLabel: "Vai alle Promozioni", ctaUrl: `${SITE_URL}/venditore/promozioni`,
          })
        );
      }
    }

    return c.json({ success: true, refundId });
  } catch (e: any) {
    console.error("❌ admin/refund-promotion:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── ADMIN: invio email manuale — singolo utente o in blocco (clienti/venditori/tutti) ──
app.post("/make-server-000b3cfb/admin/send-email", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const supabase = getServiceClient();
    const auth = await requireAdmin(supabase, authHeader.replace("Bearer ", ""));
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 403);

    const { recipientType, targetEmail, subject, body } = await c.req.json();
    if (!subject?.trim() || !body?.trim()) return c.json({ success: false, error: "Oggetto e messaggio sono obbligatori" }, 400);
    if (!["single", "all_customers", "all_vendors", "all_users"].includes(recipientType)) {
      return c.json({ success: false, error: "Destinatario non valido" }, 400);
    }

    let recipients: { email: string; nome: string }[] = [];

    if (recipientType === "single") {
      if (!targetEmail?.trim()) return c.json({ success: false, error: "Indirizzo email mancante" }, 400);
      const { data: p } = await supabase.from("profiles").select("email, nome").eq("email", targetEmail.trim()).maybeSingle();
      if (!p?.email) return c.json({ success: false, error: "Nessun utente trovato con questa email" }, 404);
      recipients = [{ email: p.email, nome: p.nome || "" }];
    } else {
      let query = supabase.from("profiles").select("email, nome, user_type").not("email", "is", null);
      if (recipientType === "all_customers") query = query.eq("user_type", "cliente");
      else if (recipientType === "all_vendors") query = query.eq("user_type", "venditore");
      const { data: profiles } = await query;
      recipients = (profiles || []).filter((p: any) => !!p.email).map((p: any) => ({ email: p.email, nome: p.nome || "" }));
    }

    if (recipients.length === 0) return c.json({ success: false, error: "Nessun destinatario trovato per questa selezione" }, 404);

    // SICUREZZA: un invio massivo scelto per errore (selezione sbagliata,
    // doppio click) non deve poter generare un numero enorme di email in un
    // colpo solo. Limite alzabile in futuro se la base utenti reale lo richiede.
    const MAX_RECIPIENTS = 2000;
    if (recipients.length > MAX_RECIPIENTS) {
      return c.json({ success: false, error: `Troppi destinatari (${recipients.length}). Limite di sicurezza per invio: ${MAX_RECIPIENTS}.` }, 400);
    }

    // Invio in sequenza (non in parallelo): un invio massivo in parallelo su
    // centinaia/migliaia di destinatari rischierebbe di saturare i rate limit
    // di Resend tutti in una volta — meglio un invio più lento ma affidabile.
    // Un singolo fallimento (email inesistente, rifiutata, ecc.) non deve
    // fermare gli altri invii: si prosegue e si riepiloga alla fine.
    let sent = 0;
    let failed = 0;
    for (const r of recipients) {
      const html = emailWrapper({
        preheader: subject,
        title: subject,
        bodyHtml: `
          <p>Ciao${r.nome ? " " + r.nome : ""},</p>
          <div style="white-space:pre-wrap;">${body}</div>
        `,
      });
      const ok = await sendEmail(r.email, subject, html);
      if (ok) sent++; else failed++;
    }

    console.log(`📧 admin/send-email: ${sent}/${recipients.length} inviate (destinatario: ${recipientType}) da admin ${auth.userId}`);
    return c.json({ success: true, sent, failed, total: recipients.length });
  } catch (e: any) {
    console.error("❌ admin/send-email:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});




// ── VENDOR: statistiche aggregate reali (fatturato, top prodotti, trend) ──
app.get("/make-server-000b3cfb/vendor/stats", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) return c.json({ success: false, error: "Token non valido" }, 401);

    const supabase = getServiceClient();
    const vendor = await getVendorByProfileId(supabase, user.id, "id");
    if (!vendor) return c.json({ success: false, error: "Vendor non trovato" }, 404);

    // Tutti gli order_items del vendor con dati ordine e prodotto (ultimi 12 mesi)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const { data: items, error } = await supabase
      .from("order_items")
      .select("id, order_id, product_id, quantity, price, shipping_status, created_at, products(name), orders!inner(status, created_at)")
      .eq("vendor_id", vendor.id)
      .in("orders.status", ["processing", "shipped", "delivered"])
      .gte("orders.created_at", twelveMonthsAgo.toISOString());
    if (error) throw new Error(error.message);

    const rows = items || [];

    // KPI totali. totalOrders conta gli ORDINI distinti (order_id), non le righe
    // prodotto — prima veniva approssimato e mai nemmeno restituito al frontend.
    const totalRevenue = rows.reduce((s: number, r: any) => s + r.price * r.quantity, 0);
    const distinctOrderIds = new Set(rows.map((r: any) => r.order_id));
    const totalOrders = distinctOrderIds.size;
    const totalItems = rows.reduce((s: number, r: any) => s + r.quantity, 0);
    // Scontrino medio e articoli medi per ordine — calcolati per ORDINE reale,
    // non per riga prodotto (un ordine da 3 articoli è UN ordine, non 3).
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const avgItemsPerOrder = totalOrders > 0 ? totalItems / totalOrders : 0;

    // Trend fatturato ultimi 30 giorni (per giorno)
    const dailyMap: Record<string, number> = {};
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    for (let d = new Date(thirtyDaysAgo); d <= new Date(); d.setDate(d.getDate() + 1)) {
      dailyMap[d.toISOString().slice(0, 10)] = 0;
    }
    rows.forEach((r: any) => {
      const day = (r.orders?.created_at || r.created_at || "").slice(0, 10);
      if (day in dailyMap) dailyMap[day] += r.price * r.quantity;
    });
    const dailyTrend = Object.entries(dailyMap).map(([date, revenue]) => ({
      date, // formattata nella lingua corretta lato frontend, non qui
      revenue: Math.round((revenue as number) * 100) / 100,
    }));

    // Trend fatturato ultimi 6 mesi (per mese)
    const monthlyMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyMap[key] = 0;
    }
    rows.forEach((r: any) => {
      const day = r.orders?.created_at || r.created_at || "";
      const key = day.slice(0, 7);
      if (key in monthlyMap) monthlyMap[key] += r.price * r.quantity;
    });
    const monthlyTrend = Object.entries(monthlyMap).map(([key, revenue]) => {
      return { month: key, revenue: Math.round((revenue as number) * 100) / 100 }; // "YYYY-MM", formattato lato frontend
    });

    // Top prodotti per fatturato
    const productMap: Record<string, { name: string; revenue: number; quantity: number }> = {};
    rows.forEach((r: any) => {
      const name = (r.products as any)?.name || "Prodotto";
      if (!productMap[r.product_id]) productMap[r.product_id] = { name, revenue: 0, quantity: 0 };
      productMap[r.product_id].revenue += r.price * r.quantity;
      productMap[r.product_id].quantity += r.quantity;
    });
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(p => ({ ...p, revenue: Math.round(p.revenue * 100) / 100 }));

    // Ripartizione stato spedizione
    const statusBreakdown = {
      confirmed: rows.filter((r: any) => r.shipping_status === "confirmed" || r.shipping_status === "pending").length,
      shipped: rows.filter((r: any) => r.shipping_status === "shipped").length,
    };

    return c.json({
      success: true,
      kpi: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalOrders,
        totalItems,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        avgItemsPerOrder: Math.round(avgItemsPerOrder * 10) / 10,
      },
      dailyTrend,
      monthlyTrend,
      topProducts,
      statusBreakdown,
    });
  } catch (e: any) {
    console.error("❌ vendor/stats:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});


// ── VENDOR: lista resi sui propri prodotti (service role) ──
app.get("/make-server-000b3cfb/vendor/returns", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) return c.json({ success: false, error: "Token non valido" }, 401);

    const supabase = getServiceClient();
    const vendor = await getVendorByProfileId(supabase, user.id, "id");
    if (!vendor) return c.json({ success: false, error: "Vendor non trovato" }, 404);

    const { data: returns, error } = await supabase.from("returns")
      // shipping_email volutamente ESCLUSA: questo elenco va al venditore e
      // l'email del cliente non gli serve per gestire un reso (risponde
      // dalla dashboard, e le notifiche le manda la piattaforma).
      .select("*, orders(order_number, shipping_name), order_items(quantity, price, product_name, products(name, images))")
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return c.json({ success: true, returns: returns || [] });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});


// ── VENDOR: lista recensioni sui propri prodotti ──
app.get("/make-server-000b3cfb/vendor/reviews", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) return c.json({ success: false, error: "Token non valido" }, 401);

    const supabase = getServiceClient();
    const vendor = await getVendorByProfileId(supabase, user.id, "id");
    if (!vendor) return c.json({ success: false, error: "Vendor non trovato" }, 404);

    const { data: products } = await supabase.from("products").select("id, name, images").eq("vendor_id", vendor.id);
    const productIds = (products || []).map((p: any) => p.id);
    if (productIds.length === 0) return c.json({ success: true, reviews: [] });

    const { data: reviews } = await supabase.from("product_reviews")
      .select("*, products(name, images)")
      .in("product_id", productIds)
      .order("created_at", { ascending: false });

    return c.json({ success: true, reviews: reviews || [] });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});

// ── VENDOR: rispondi a una recensione ──
/**
 * Versione corrente delle regole della piattaforma presentate al venditore
 * nell'onboarding. Se il testo cambia in modo sostanziale — soprattutto le
 * conseguenze previste — questa costante va incrementata: ai venditori
 * verra' richiesta una nuova accettazione invece di considerare valida
 * quella prestata su un testo diverso.
 *
 * Deve restare allineata a VENDOR_RULES_VERSION in
 * src/app/components/VendorOnboardingTour.tsx.
 */
const VENDOR_RULES_VERSION = "2026-08";

/**
 * Registra l'accettazione esplicita delle regole della piattaforma.
 *
 * Perche' passa dal server e non da un update diretto del client: questa
 * data e' la prova che le regole erano state comunicate al venditore prima
 * di un'eventuale limitazione o sospensione (art. 4 Reg. UE 2019/1150), e
 * una prova non puo' dipendere da un timestamp scelto dal browser di chi
 * poi verrebbe sanzionato. La mette il server, e basta.
 */
app.post("/make-server-000b3cfb/vendor/accept-rules", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) return c.json({ success: false, error: "Token non valido" }, 401);

    const supabase = getServiceClient();
    const { data: vendor } = await supabase.from("vendors")
      .select("id, rules_accepted_at, rules_accepted_version")
      .eq("profile_id", user.id).maybeSingle();
    if (!vendor) return c.json({ success: false, error: "Venditore non trovato" }, 404);

    // Accettazione gia' valida per QUESTA versione: non la sovrascriviamo.
    // La data originale ha valore probatorio e riscriverla a ogni visita
    // farebbe sembrare recente un'accettazione vecchia di mesi.
    if (vendor.rules_accepted_at && vendor.rules_accepted_version === VENDOR_RULES_VERSION) {
      return c.json({ success: true, alreadyAccepted: true, acceptedAt: vendor.rules_accepted_at });
    }

    const acceptedAt = new Date().toISOString();
    const { error } = await supabase.from("vendors").update({
      rules_accepted_at: acceptedAt,
      rules_accepted_version: VENDOR_RULES_VERSION,
    }).eq("id", vendor.id);
    if (error) return c.json({ success: false, error: error.message }, 500);

    console.log(`✅ Regole piattaforma accettate da vendor ${vendor.id} (v${VENDOR_RULES_VERSION})`);
    return c.json({ success: true, acceptedAt, version: VENDOR_RULES_VERSION });
  } catch (e: any) {
    console.error("❌ vendor/accept-rules:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

/**
 * Segna il walkthrough informativo come visto (o saltato). Separato
 * dall'accettazione delle regole di proposito: saltare il tour non deve
 * mai equivalere ad aver accettato qualcosa.
 */
app.post("/make-server-000b3cfb/vendor/complete-tour", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) return c.json({ success: false, error: "Token non valido" }, 401);

    const supabase = getServiceClient();
    const { data: vendor } = await supabase.from("vendors").select("id").eq("profile_id", user.id).maybeSingle();
    if (!vendor) return c.json({ success: false, error: "Venditore non trovato" }, 404);

    await supabase.from("vendors")
      .update({ onboarding_tour_completed_at: new Date().toISOString() })
      .eq("id", vendor.id);
    return c.json({ success: true });
  } catch (e: any) {
    console.error("❌ vendor/complete-tour:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

app.post("/make-server-000b3cfb/vendor/reply-review", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) return c.json({ success: false, error: "Token non valido" }, 401);

    const supabase = getServiceClient();
    const { reviewId, reply } = await c.req.json();
    if (!reviewId || !reply?.trim()) return c.json({ success: false, error: "Dati mancanti" }, 400);

    // Verifica che la recensione appartenga a un prodotto del vendor
    const { data: review } = await supabase.from("product_reviews").select("id, product_id, products(vendor_id, vendors(profile_id))").eq("id", reviewId).single();
    if (!review) return c.json({ success: false, error: "Recensione non trovata" }, 404);
    const ownerProfileId = (review.products as any)?.vendors?.profile_id;
    if (ownerProfileId !== user.id) return c.json({ success: false, error: "Non autorizzato" }, 403);

    const { error } = await supabase.from("product_reviews").update({
      vendor_reply: reply.trim(), vendor_reply_at: new Date().toISOString(),
    }).eq("id", reviewId);
    if (error) throw new Error(error.message);

    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});

// ── VENDOR: lista domande sui propri prodotti ──
// ── PUBBLICO: prodotti più venduti (pagina Bestseller) ─────────────────────
// Aggrega le quantità vendute per prodotto tra gli ordini pagati. Endpoint
// pubblico (nessuna autenticazione) ma usa il service client perché deve
// leggere order_items su tutta la piattaforma, non solo i propri — un
// cliente qualunque non avrebbe i permessi RLS per farlo direttamente.
app.get("/make-server-000b3cfb/products/bestsellers", async (c) => {
  try {
    const limit = Math.min(Number(c.req.query("limit")) || 24, 60);
    const offset = Math.max(Number(c.req.query("offset")) || 0, 0);
    const supabase = getServiceClient();

    // PERFORMANCE (audit scalabilità): questo endpoint scaricava OGNI riga
    // d'ordine mai creata sulla piattaforma (nessun .limit()) e sommava le
    // quantità in JavaScript. A migliaia di transazioni al giorno sono
    // milioni di righe caricate in memoria della edge function ad ogni
    // apertura della pagina Bestseller: timeout garantito molto prima di
    // arrivare a quei volumi.
    // La stessa aggregazione esiste già come vista lato database
    // (public_product_sales_stats, product_id + total_sold) ed è quella che
    // la home usa da sempre — qui semplicemente non veniva usata. Ora
    // l'ordinamento e la paginazione li fa Postgres, e la edge function
    // riceve solo le righe che le servono davvero.
    const { data: stats, error } = await supabase
      .from("public_product_sales_stats")
      .select("product_id, total_sold")
      .order("total_sold", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);

    const topProductIds = (stats || []).map((s: any) => s.product_id).filter(Boolean);
    if (topProductIds.length === 0) return c.json({ success: true, products: [], hasMore: false });

    if (topProductIds.length === 0) return c.json({ success: true, products: [], hasMore: false });

    const { data: products } = await supabase
      .from("products")
      .select("id, name, price, discount_price, images, images_thumb, vendor_id, stock, status, translations, vendors(id, business_name, verified_badge)")
      .in("id", topProductIds)
      .eq("status", "published");

    // Riordina secondo la classifica reale di vendite (la query .in non garantisce l'ordine)
    const ordered = topProductIds
      .map(id => (products || []).find((p: any) => p.id === id))
      .filter(Boolean);

    // Non conosciamo più il totale complessivo dei prodotti venduti (prima
    // lo si sapeva solo perché si caricava tutto in memoria, che era
    // esattamente il problema). Se la pagina è arrivata piena, presumiamo
    // che ce ne sia almeno un'altra: è il comportamento standard della
    // paginazione a scorrimento e costa una query in meno.
    return c.json({ success: true, products: ordered, hasMore: (stats || []).length === limit });
  } catch (e: any) {
    console.error("❌ products/bestsellers:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── Conteggi per i pallini di notifica nella sidebar venditore ─────────────
// ── Registra il token del dispositivo per le notifiche push (app native) ───
app.post("/make-server-000b3cfb/push/register-token", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) return c.json({ success: false, error: "Token non valido" }, 401);

    const { deviceToken, platform } = await c.req.json();
    if (!deviceToken || !["ios", "android"].includes(platform)) {
      return c.json({ success: false, error: "Dati mancanti o piattaforma non valida" }, 400);
    }

    const supabase = getServiceClient();
    const { error } = await supabase.from("push_tokens").upsert(
      { profile_id: user.id, device_token: deviceToken, platform, updated_at: new Date().toISOString() },
      { onConflict: "profile_id,device_token" }
    );
    if (error) throw new Error(error.message);

    return c.json({ success: true });
  } catch (e: any) {
    console.error("❌ push/register-token:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

app.get("/make-server-000b3cfb/vendor/notification-counts", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) return c.json({ success: false, error: "Token non valido" }, 401);

    const supabase = getServiceClient();
    const vendor = await getVendorByProfileId(supabase, user.id, "id");
    if (!vendor) return c.json({ success: false, error: "Vendor non trovato" }, 404);

    // Ordini da gestire: righe con spedizione ancora in attesa/confermata (non spedite)
    // shipping_status vale 'pending' gia' alla CREAZIONE dell'ordine, prima
    // del pagamento: senza il filtro sullo stato dell'ordine il pallino di
    // notifica si accendeva anche per checkout abbandonati, mandando il
    // venditore a cercare un lavoro che non esiste.
    const { count: pendingOrders } = await supabase.from("order_items")
      .select("id, orders!inner(status)", { count: "exact", head: true })
      .eq("vendor_id", (vendor as any).id)
      .in("orders.status", PAID_ORDER_STATUSES)
      .in("shipping_status", ["pending", "confirmed"]);

    // Resi da gestire: richieste ancora non evase dal venditore
    const { count: pendingReturns } = await supabase.from("returns")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", (vendor as any).id)
      .eq("status", "pending");

    return c.json({ success: true, pendingOrders: pendingOrders || 0, pendingReturns: pendingReturns || 0 });
  } catch (e: any) {
    console.error("❌ vendor/notification-counts:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── Newsletter ───────────────────────────────────────────────────────
// Solo raccolta indirizzi (con RLS che blocca ogni accesso diretto dal
// client, vedi migrazione newsletter_subscribers) — l'invio vero e proprio
// delle campagne resta fuori da qui: per quello serve uno strumento
// dedicato (Brevo, Mailchimp, ecc.) a cui esportare questa lista, non ha
// senso ricostruire da zero gestione bounce/unsubscribe/deliverability che
// quegli strumenti già fanno bene gratis fino a un buon volume.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post("/make-server-000b3cfb/newsletter/subscribe", rateLimit(10, 60_000), async (c) => {
  try {
    const { email, language, source } = await c.req.json();
    if (!email || !EMAIL_RE.test(String(email).trim())) {
      return c.json({ success: false, error: "Email non valida" }, 400);
    }
    const cleanEmail = String(email).trim().toLowerCase();
    const supabase = getServiceClient();

    const { data: existing } = await supabase.from("newsletter_subscribers")
      .select("id, unsubscribed_at").eq("email", cleanEmail).maybeSingle();

    if (existing) {
      // Si era disiscritto in passato e si iscrive di nuovo: riattiva
      // invece di creare una riga duplicata (email è UNIQUE).
      if (existing.unsubscribed_at) {
        await supabase.from("newsletter_subscribers").update({ unsubscribed_at: null, subscribed_at: new Date().toISOString() }).eq("id", existing.id);
      }
      return c.json({ success: true, alreadySubscribed: !existing.unsubscribed_at });
    }

    const { data: created, error } = await supabase.from("newsletter_subscribers")
      .insert([{ email: cleanEmail, language: language || "it", source: source || "unknown" }])
      .select("unsubscribe_token").single();
    if (error) throw new Error(error.message);

    // Email di conferma best-effort — se fallisce l'iscrizione resta comunque valida.
    try {
      const unsubUrl = `https://oralzon.com/newsletter/disiscrivi?token=${created.unsubscribe_token}`;
      await sendEmail(cleanEmail, "Iscrizione confermata — Oralzon", emailWrapper({ title: "Iscrizione confermata",
        bodyHtml: `<p>Grazie per esserti iscritto agli aggiornamenti di Oralzon — novità sul marketplace, nuovi fornitori e offerte per il settore odontoiatrico.</p><p style="margin-top:16px;font-size:12px;color:#888;">Non vuoi più ricevere queste email? <a href="${unsubUrl}">Disiscriviti qui</a>.</p>`,
      }));
    } catch (mailErr) { console.warn("Email conferma newsletter fallita:", mailErr); }

    return c.json({ success: true, alreadySubscribed: false });
  } catch (e: any) {
    console.error("❌ newsletter/subscribe:", e);
    return c.json({ success: false, error: "Errore durante l'iscrizione" }, 500);
  }
});

app.get("/make-server-000b3cfb/newsletter/unsubscribe", async (c) => {
  try {
    const token = c.req.query("token");
    if (!token) return c.text("Link non valido", 400);
    const supabase = getServiceClient();
    await supabase.from("newsletter_subscribers").update({ unsubscribed_at: new Date().toISOString() }).eq("unsubscribe_token", token);
    // Pagina di conferma minimale — chi clicca il link da un client email
    // non è dentro l'app React, serve una risposta HTML autonoma.
    return c.html(`<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8"><title>Disiscrizione confermata</title><style>body{font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#1E2E31;padding:0 20px}h1{font-size:22px}a{color:#0F7A68}</style></head><body><h1>Disiscrizione confermata</h1><p>Non riceverai più email dagli aggiornamenti di Oralzon.</p><p><a href="https://oralzon.com">Torna al sito</a></p></body></html>`);
  } catch (e: any) {
    console.error("❌ newsletter/unsubscribe:", e);
    return c.text("Errore durante la disiscrizione", 500);
  }
});

app.get("/make-server-000b3cfb/vendor/questions", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) return c.json({ success: false, error: "Token non valido" }, 401);

    const supabase = getServiceClient();
    const vendor = await getVendorByProfileId(supabase, user.id, "id");
    if (!vendor) return c.json({ success: false, error: "Vendor non trovato" }, 404);

    const { data: products } = await supabase.from("products").select("id, name, images").eq("vendor_id", vendor.id);
    const productIds = (products || []).map((p: any) => p.id);
    if (productIds.length === 0) return c.json({ success: true, questions: [] });

    const { data: questions } = await supabase.from("product_questions")
      .select("*, products(name, images)")
      .in("product_id", productIds)
      .order("created_at", { ascending: false });

    return c.json({ success: true, questions: questions || [] });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});

// ── VENDOR: rispondi a una domanda (con notifica email al cliente) ──
app.post("/make-server-000b3cfb/vendor/answer-question", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) return c.json({ success: false, error: "Token non valido" }, 401);

    const supabase = getServiceClient();
    const { questionId, answer } = await c.req.json();
    if (!questionId || !answer?.trim()) return c.json({ success: false, error: "Dati mancanti" }, 400);

    // ANTI-DISINTERMEDIAZIONE: le risposte sono testo libero PUBBLICO
    // scritto dal venditore. Dopo la rimozione di logo e descrizione
    // negozio erano rimaste l'ultimo canale in cui infilare un contatto
    // diretto ("scrivimi a...", "lo trovi sul mio sito a meno").
    const answerCheck = detectDirectContact(answer);
    if (answerCheck.found) {
      return c.json({ success: false, error: `La risposta sembra contenere ${answerCheck.reason}. Le Condizioni di Vendita non permettono di indirizzare i clienti fuori da Oralzon: riformula senza contatti diretti.` }, 400);
    }

    const { data: question } = await supabase.from("product_questions")
      .select("id, product_id, user_id, question, products(name, vendor_id, vendors(profile_id, business_name))")
      .eq("id", questionId).single();
    if (!question) return c.json({ success: false, error: "Domanda non trovata" }, 404);
    const ownerProfileId = (question.products as any)?.vendors?.profile_id;
    if (ownerProfileId !== user.id) return c.json({ success: false, error: "Non autorizzato" }, 403);

    const { error } = await supabase.from("product_questions").update({
      answer: answer.trim(), answered_by: user.id, answered_at: new Date().toISOString(),
    }).eq("id", questionId);
    if (error) throw new Error(error.message);

    // Notifica email al cliente che ha fatto la domanda
    try {
      const { data: customerProfile } = await supabase.from("profiles").select("email, nome").eq("id", question.user_id).maybeSingle();
      const productName = (question.products as any)?.name || "il prodotto";
      const vendorName = (question.products as any)?.vendors?.business_name || "Il venditore";
      if (customerProfile?.email) {
        await sendEmail(customerProfile.email, `${vendorName} ha risposto alla tua domanda — Oralzon`,
          emailWrapper({
            preheader: `Risposta alla tua domanda su ${productName}`,
            title: "Hai ricevuto una risposta",
            bodyHtml: `
              <p>Ciao <strong>${customerProfile.nome || "Cliente"}</strong>,</p>
              <p><strong>${vendorName}</strong> ha risposto alla tua domanda su <strong>${productName}</strong>:</p>
              <div style="background:#f9fafb;border-radius:10px;padding:12px 16px;margin:10px 0;">
                <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">La tua domanda: "${question.question}"</p>
                <p style="margin:0;font-size:13px;color:#374151;">${answer.trim()}</p>
              </div>
            `,
            ctaLabel: "Vedi il prodotto", ctaUrl: `${SITE_URL}/negozio/prodotto/${question.product_id}`,
          })
        );
      }
    } catch (notifyErr) { console.warn("Notifica email risposta domanda fallita:", notifyErr); }

    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});


// ── VENDOR: crea o aggiorna un prodotto, con traduzione automatica ──
// Sostituisce l'insert/update diretto dal client (che non pu\u00f2 avere accesso
// alla chiave Anthropic) per nome/descrizione/prodotto: qui il venditore
// scrive in italiano, il server traduce nelle lingue supportate PRIMA di
// salvare, cos\u00ec il prodotto \u00e8 gi\u00e0 completo in tutte le lingue quando appare
// online. Se productId \u00e8 presente aggiorna un prodotto esistente
// (verificando che appartenga al venditore autenticato), altrimenti ne crea uno nuovo.
app.post("/make-server-000b3cfb/vendor/save-product", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) return c.json({ success: false, error: "Token non valido" }, 401);

    const supabase = getServiceClient();
    const vendor = await getVendorByProfileId(supabase, user.id, "id, product_limit, plan_type, plan_status, trial_ends_at");
    if (!vendor) return c.json({ success: false, error: "Vendor non trovato" }, 404);

    // Il controllo sul periodo di prova esisteva SOLO nel frontend
    // (VendorAddProduct), quindi era aggirabile chiamando l'API
    // direttamente. Qui e' vincolante. Verifichiamo anche la data e non
    // solo plan_status, perche' il job di manutenzione gira periodicamente
    // e nel frattempo lo stato potrebbe essere ancora 'active'.
    const v = vendor as any;
    const trialOver = v.plan_type === "trial" && v.trial_ends_at && new Date(v.trial_ends_at) < new Date();
    if (v.plan_status === "suspended") {
      return c.json({ success: false, error: "Il tuo account è sospeso. Contatta il supporto." }, 403);
    }
    if (v.plan_status === "expired" || trialOver) {
      return c.json({ success: false, error: "Il tuo periodo di prova è terminato. Attiva il piano venditore per continuare a pubblicare prodotti." }, 403);
    }

    const body = await c.req.json();
    const { productId, name, description, category, price, stock, sku, brand, specifications,
      status, images, images_thumb, shipping_cost_override, shipping_weight_kg,
      shipping_length_cm, shipping_width_cm, shipping_height_cm, discount_price,
      metaTitle, metaDescription } = body;

    if (!name?.trim() || !category || price === undefined || price === null || stock === undefined || stock === null) {
      return c.json({ success: false, error: "Compila tutti i campi obbligatori" }, 400);
    }

    // Se \u00e8 una modifica, verifica che il prodotto appartenga davvero a
    // questo venditore \u2014 mai fidarsi di un productId qualunque inviato dal client.
    if (productId) {
      const { data: existing } = await supabase.from("products").select("vendor_id").eq("id", productId).maybeSingle();
      if (!existing) return c.json({ success: false, error: "Prodotto non trovato" }, 404);
      if (existing.vendor_id !== (vendor as any).id) return c.json({ success: false, error: "Non autorizzato" }, 403);
    } else {
      // Solo alla CREAZIONE controlliamo il limite prodotti del piano \u2014 una
      // modifica di un prodotto gi\u00e0 esistente non deve mai essere bloccata da un
      // limite che riguarda quanti prodotti NUOVI si possono aggiungere.
      const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("vendor_id", (vendor as any).id);
      const limit = Number((vendor as any).product_limit ?? 999999);
      if ((count || 0) >= limit) return c.json({ success: false, error: `Hai raggiunto il limite di ${limit} prodotti del tuo piano.` }, 400);
    }

    // La traduzione multilingua è ora gestita in modo asincrono dal
    // Translation Engine: un trigger sul database (vedi migrazione
    // translation_engine_core) mette in coda un job automaticamente ogni
    // volta che nome/descrizione/scheda tecnica/meta SEO cambiano, e la
    // edge function translation-worker (invocata da pg_cron ogni minuto)
    // lo processa in background. Questo salvataggio non chiama più Claude
    // direttamente: resta rapido anche se l'API di traduzione è lenta o
    // temporaneamente non disponibile.

    const productData: any = {
      vendor_id: (vendor as any).id,
      name: name.trim(),
      description: description || null,
      category,
      price: parseFloat(price),
      stock: parseInt(stock),
      sku: sku || null,
      brand: brand || null,
      specifications: specifications || null,
      status: status || "published",
      images: images || [],
      // Fallback alle foto piene se il client non manda thumbnail (client
      // vecchio in cache, o thumbnail non generata per un errore silenzioso
      // lato browser) — la griglia mostra comunque qualcosa di corretto,
      // solo un po' più pesante, invece di restare senza immagine.
      images_thumb: (images_thumb && images_thumb.length > 0) ? images_thumb : (images || []),
      shipping_cost_override: shipping_cost_override ?? null,
      shipping_weight_kg: shipping_weight_kg ?? null,
      // Dimensioni del collo imballato: senza queste non si puo' calcolare
      // il peso volumetrico, che nel dentale e' quasi sempre superiore al
      // peso reale (scatoloni leggeri ma ingombranti). Nullable per non
      // rompere i prodotti creati prima della loro introduzione.
      shipping_length_cm: shipping_length_cm ?? null,
      shipping_width_cm: shipping_width_cm ?? null,
      shipping_height_cm: shipping_height_cm ?? null,
      discount_price: discount_price ?? null,
      meta_title: metaTitle?.trim() || null,
      meta_description: metaDescription?.trim() || null,
    };

    let saved;
    if (productId) {
      const { data, error } = await supabase.from("products").update(productData).eq("id", productId).select().single();
      if (error) throw new Error(error.message);
      saved = data;
    } else {
      productData.is_sponsored = false;
      productData.is_hero_sponsored = false;
      const { data, error } = await supabase.from("products").insert([productData]).select().single();
      if (error) throw new Error(error.message);
      saved = data;
    }

    return c.json({ success: true, product: saved });
  } catch (e: any) {
    console.error("\u274c vendor/save-product:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── EMAIL DI BENVENUTO — cliente ──
// ── FORM DI CONTATTO PUBBLICO ──────────────────────────────────────────────
app.post("/make-server-000b3cfb/contact-form", rateLimit(5, 60_000), async (c) => {
  try {
    const { firstName, lastName, email, subject, message } = await c.req.json();
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !message?.trim()) {
      return c.json({ success: false, error: "Compila tutti i campi obbligatori" }, 400);
    }
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!EMAIL_RE.test(email)) return c.json({ success: false, error: "Email non valida" }, 400);

    const subjectLabels: Record<string, string> = {
      order: "Domanda su un ordine", account: "Problema con l'account",
      vendor: "Vuole diventare venditore", technical: "Problema tecnico sul sito", other: "Altro",
    };
    const subjectLabel = subjectLabels[subject] || "Non specificato";

    const sent = await sendEmail("support@oralzon.com", `[Contatto sito] ${subjectLabel} — ${firstName} ${lastName}`, `
      <p><strong>Nome:</strong> ${firstName} ${lastName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Oggetto:</strong> ${subjectLabel}</p>
      <p><strong>Messaggio:</strong></p>
      <p style="white-space:pre-wrap;">${message}</p>
    `);
    if (!sent) return c.json({ success: false, error: "Invio non riuscito, riprova più tardi" }, 500);
    return c.json({ success: true });
  } catch (e: any) {
    console.error("❌ contact-form:", e);
    return c.json({ success: false, error: "Errore durante l'invio" }, 500);
  }
});

app.post("/make-server-000b3cfb/welcome-customer", rateLimit(5, 60_000), async (c) => {
  try {
    const auth = await requireAuth(c);
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 401);
    const { name } = await c.req.json();
    // L'email di benvenuto va SEMPRE all'indirizzo dell'utente autenticato,
    // mai a un indirizzo arbitrario passato dal client (evita spam/abuso).
    if (!auth.email) return c.json({ success: false, error: "Email utente non disponibile" }, 400);
    const welcomeLang = await getUserEmailLang(getServiceClient(), auth.userId);
    await sendEmail(auth.email, tr(EMAIL_TEXTS,'subjWelcome',welcomeLang), welcomeCustomerHtml(name || "", welcomeLang));
    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});

// ── RESI: richiesta reso (cliente) — crea record + notifica cliente e venditore ──
app.post("/make-server-000b3cfb/returns/request", rateLimit(10, 60_000), async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const userToken = authHeader.replace("Bearer ", "");
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(userToken);
    if (userError || !user) return c.json({ success: false, error: "Token non valido" }, 401);

    const supabase = getServiceClient();
    const { orderId, orderItemId, vendorId, reason, description, refundAmount, quantity } = await c.req.json();
    if (!orderId || !orderItemId || !vendorId) return c.json({ success: false, error: "Dati mancanti" }, 400);

    // Non ci si fida della quantità inviata dal client: la verifichiamo contro
    // quella realmente acquistata in questa riga d'ordine — un cliente non
    // può chiedere il reso di più pezzi di quanti ne abbia comprati.
    const { data: orderItemForReturn } = await supabase.from("order_items")
      .select("quantity, price").eq("id", orderItemId).single();
    if (!orderItemForReturn) return c.json({ success: false, error: "Articolo ordine non trovato" }, 404);

    // Somma le quantità già coperte da resi precedenti non rifiutati/annullati
    // su questa stessa riga — evita che più richieste parziali sommate
    // superino quanto realmente acquistato.
    const { data: existingReturns } = await supabase.from("returns")
      .select("quantity, status").eq("order_item_id", orderItemId)
      .not("status", "in", "(rejected,cancelled)");
    const alreadyRequestedQty = (existingReturns || []).reduce((s: number, r: any) => s + (r.quantity || 1), 0);
    const remainingQty = orderItemForReturn.quantity - alreadyRequestedQty;
    if (remainingQty <= 0) {
      return c.json({ success: false, error: "Hai già richiesto il reso per l'intera quantità di questo articolo" }, 400);
    }

    const requestedQty = Math.max(1, Math.min(Number(quantity) || 1, remainingQty));
    // L'importo di rimborso proposto è sempre ricalcolato qui in base alla
    // quantità realmente resa — non ci si fida di un importo arbitrario
    // inviato dal client, stesso principio già applicato a prezzo e spedizione.
    const computedRefundAmount = Math.round(Number(orderItemForReturn.price) * requestedQty * 100) / 100;

    const { data: returnRecord, error: insertErr } = await supabase.from("returns").insert([{
      order_id: orderId, order_item_id: orderItemId, customer_id: user.id, vendor_id: vendorId,
      reason, description, status: "pending", refund_amount: computedRefundAmount, quantity: requestedQty,
    }]).select().single();
    if (insertErr) throw new Error(insertErr.message);

    // Recupera dati per le email
    const { data: order } = await supabase.from("orders").select("order_number, shipping_name, shipping_email").eq("id", orderId).single();
    const { data: item } = await supabase.from("order_items").select("products(name)").eq("id", orderItemId).single();
    const productName = (item as any)?.products?.name || "Prodotto";

    if (order?.shipping_email) {
      await sendEmail(order.shipping_email, `Richiesta di reso ricevuta — ${order.order_number}`,
        returnRequestReceivedHtml(order.order_number, order.shipping_name, productName));
    }

    const { data: vendor } = await supabase.from("vendors").select("business_name, profile_id").eq("id", vendorId).single();
    if (vendor?.profile_id) {
      const { data: vendorProfile } = await supabase.from("profiles").select("email, nome").eq("id", vendor.profile_id).maybeSingle();
      if (vendorProfile?.email && order) {
        await sendEmail(vendorProfile.email, `Nuova richiesta di reso — ${order.order_number}`,
          newReturnVendorHtml(order.order_number, vendor.business_name || vendorProfile.nome || "Venditore", productName, reason));
      }
    }

    return c.json({ success: true, return: returnRecord });
  } catch (e: any) { console.error("❌ returns/request:", e); return c.json({ success: false, error: e.message }, 500); }
});

// ── RESI: decisione venditore (approva/rifiuta/rimborsa) — aggiorna + notifica cliente ──
app.post("/make-server-000b3cfb/returns/decision", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const userToken = authHeader.replace("Bearer ", "");
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(userToken);
    if (userError || !user) return c.json({ success: false, error: "Token non valido" }, 401);

    const supabase = getServiceClient();
    const { returnId, status, vendorNotes, restockingFeePct, refundAmount } = await c.req.json();
    if (!returnId || !status) return c.json({ success: false, error: "Dati mancanti" }, 400);
    if (!["approved", "rejected", "refunded"].includes(status)) return c.json({ success: false, error: "Stato non valido" }, 400);

    // Verifica che il reso appartenga a un vendor dell'utente
    const { data: returnRecord } = await supabase.from("returns")
      .select("id, order_id, order_item_id, customer_id, vendor_id, refund_amount, vendors(profile_id, business_name)")
      .eq("id", returnId).single();
    if (!returnRecord) return c.json({ success: false, error: "Reso non trovato" }, 404);
    if ((returnRecord.vendors as any)?.profile_id !== user.id) return c.json({ success: false, error: "Non autorizzato" }, 403);

    const updateData: any = { status };
    if (vendorNotes !== undefined) updateData.vendor_notes = vendorNotes;
    if (restockingFeePct !== undefined) updateData.restocking_fee_pct = restockingFeePct;
    if (refundAmount !== undefined) updateData.refund_amount = refundAmount;
    if (status === "approved") updateData.approved_at = new Date().toISOString();

    // Se il venditore conferma il rimborso, esegui il rimborso REALE su Stripe
    // PRIMA di aggiornare lo stato — se Stripe fallisce, non marchiamo come rimborsato
    if (status === "refunded") {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) return c.json({ success: false, error: "Stripe non configurato sul server" }, 500);

      const { data: orderForRefund } = await supabase.from("orders")
        .select("stripe_session_id, order_number").eq("id", returnRecord.order_id).single();
      if (!orderForRefund?.stripe_session_id) {
        return c.json({ success: false, error: "Sessione di pagamento non trovata per questo ordine" }, 400);
      }

      const amountToRefund = refundAmount !== undefined ? refundAmount : returnRecord.refund_amount;
      if (!amountToRefund || amountToRefund <= 0) {
        return c.json({ success: false, error: "Importo di rimborso non valido" }, 400);
      }
      // SICUREZZA: stesso principio già applicato a prezzo/spedizione/sconto in
      // create-checkout — non ci si fida MAI di un importo inviato dal client,
      // nemmeno quando a inviarlo è il venditore stesso (che qui può solo
      // ridurre l'importo per trattenere una quota, es. per danno alla
      // confezione, mai aumentarlo oltre il tetto già calcolato in modo sicuro
      // in returns/request da prezzo reale × quantità resa). Senza questo
      // controllo un venditore — per errore o in mala fede — potrebbe rimborsare
      // più di quanto realmente pagato per quella riga, attingendo dalla stessa
      // sessione di pagamento anche alla quota di altri venditori in un ordine
      // multi-vendor.
      if (amountToRefund > Number(returnRecord.refund_amount)) {
        return c.json({ success: false, error: `L'importo di rimborso non può superare €${Number(returnRecord.refund_amount).toFixed(2)}, il massimo calcolato per questo reso.` }, 400);
      }

      try {
        const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });
        const session = await stripe.checkout.sessions.retrieve(orderForRefund.stripe_session_id);
        if (!session.payment_intent) throw new Error("Pagamento non trovato per questa sessione");

        const refund = await stripe.refunds.create({
          payment_intent: session.payment_intent as string,
          amount: Math.round(amountToRefund * 100), // Stripe usa i centesimi
          reason: "requested_by_customer",
          metadata: { return_id: returnId, order_number: orderForRefund.order_number },
        });
        updateData.stripe_refund_id = refund.id;

        // Se questo articolo era già stato trasferito al venditore (consegna
        // già confermata), recupera la quota corrispondente al rimborso.
        const { reversed, warning } = await reverseTransferForOrderItem(supabase, stripe, returnRecord.order_item_id, amountToRefund);
        if (warning) console.error("⚠️ returns/decision — reversal:", warning);
        if (reversed > 0) console.log(`✅ Recuperati €${reversed} dal venditore per il reso ${returnId}`);
      } catch (stripeErr: any) {
        console.error("❌ Rimborso Stripe fallito:", stripeErr.message);
        return c.json({ success: false, error: `Rimborso non riuscito: ${stripeErr.message}` }, 500);
      }
      updateData.refunded_at = new Date().toISOString();
    }

    const { error: updateErr } = await supabase.from("returns").update(updateData).eq("id", returnId);
    if (updateErr) throw new Error(updateErr.message);

    // Notifica il cliente
    const { data: order } = await supabase.from("orders").select("order_number").eq("id", returnRecord.order_id).single();
    const { data: item } = await supabase.from("order_items").select("products(name)").eq("id", returnRecord.order_item_id).single();
    const { data: customerProfile } = await supabase.from("profiles").select("email, nome").eq("id", returnRecord.customer_id).maybeSingle();
    const productName = (item as any)?.products?.name || "Prodotto";

    if (customerProfile?.email && order) {
      const subjectMap: Record<string, string> = {
        approved: `Reso approvato — ${order.order_number}`,
        rejected: `Aggiornamento reso — ${order.order_number}`,
        refunded: `Rimborso effettuato — ${order.order_number}`,
      };
      await sendEmail(customerProfile.email, subjectMap[status],
        returnDecisionHtml(order.order_number, customerProfile.nome || "Cliente", productName, status, vendorNotes));
    }

    return c.json({ success: true });
  } catch (e: any) { console.error("❌ returns/decision:", e); return c.json({ success: false, error: e.message }, 500); }
});


// ── STRIPE: Crea Checkout Session ──
app.post("/make-server-000b3cfb/stripe/create-checkout", rateLimit(15, 60_000), async (c) => {
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return c.json({ success: false, error: "STRIPE_SECRET_KEY non configurata" }, 500);
    const { items, shippingData, customerId, appOrigin, platform, discountCode } = await c.req.json();
    if (!items?.length || !shippingData || !customerId) return c.json({ success: false, error: "Dati mancanti" }, 400);

    const supabase = getServiceClient();
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });

    // SICUREZZA/FISCALE: Oralzon è un marketplace esclusivamente B2B — nessun
    // cliente senza P.IVA può acquistare. Prima il vincolo esisteva solo nel
    // form di registrazione (bypassabile chiamando l'API direttamente); qui,
    // al momento in cui i soldi si muovono davvero, lo rendiamo una garanzia
    // reale e non aggirabile.
    const { data: buyerProfile } = await supabase.from("profiles")
      .select("partita_iva, vies_validated").eq("id", customerId).maybeSingle();
    if (!buyerProfile?.partita_iva) {
      return c.json({ success: false, error: "Il tuo account non ha una Partita IVA registrata. Oralzon è un marketplace B2B: completa i tuoi dati fiscali prima di acquistare." }, 400);
    }

    // SICUREZZA: non fidarsi MAI di prezzo/nome inviati dal client. Il browser può
    // manomettere il body della richiesta e comprare un prodotto da 500€ per 1€.
    // Rileggiamo prezzo, nome, vendor, stock e stato direttamente dal database.
    const requested = items.map((i: any) => ({
      productId: i.productId,
      quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)),
    })).filter((i: any) => i.productId);

    if (requested.length === 0) return c.json({ success: false, error: "Nessun prodotto valido nell'ordine" }, 400);

    const productIds = requested.map((i: any) => i.productId);
    const { data: productsData, error: prodErr } = await supabase
      .from('products')
      .select('id, name, price, discount_price, discount_starts_at, discount_ends_at, images, vendor_id, stock, status, shipping_cost_override')
      .in('id', productIds);
    if (prodErr) throw new Error(`Prodotti: ${prodErr.message}`);

    const productMap: Record<string, any> = {};
    (productsData || []).forEach((p: any) => { productMap[p.id] = p; });

    // BUG SERIO TROVATO IN AUDIT: "Sospendi" nel pannello admin scriveva
    // vendors.plan_status = 'suspended' ma NESSUN punto del checkout lo
    // leggeva mai — i prodotti di un venditore sospeso restavano acquistabili
    // esattamente come prima, la sospensione era puramente cosmetica.
    const vendorIds = [...new Set((productsData || []).map((p: any) => p.vendor_id).filter(Boolean))];
    const vendorStatusMap: Record<string, string> = {};
    if (vendorIds.length > 0) {
      const { data: vendorsStatusData } = await supabase.from('vendors').select('id, plan_status').in('id', vendorIds);
      (vendorsStatusData || []).forEach((v: any) => { vendorStatusMap[v.id] = v.plan_status; });
    }

    // Costruisce le righe usando SOLO dati dal DB; blocca prodotti mancanti,
    // non pubblicati o senza stock sufficiente.
    const secureItems: any[] = [];
    for (const r of requested) {
      const p = productMap[r.productId];
      if (!p) return c.json({ success: false, error: `Prodotto non più disponibile` }, 400);
      if (p.status && p.status !== 'published') return c.json({ success: false, error: `"${p.name}" non è più in vendita` }, 400);
      // 'suspended' = sospeso dall'admin. 'expired' = periodo di prova finito
      // senza sottoscrivere il piano: prima non era controllato da nessuna
      // parte lato server, quindi un venditore poteva continuare a vendere
      // all'infinito senza mai pagare l'abbonamento annuale.
      if (vendorStatusMap[p.vendor_id] === 'suspended' || vendorStatusMap[p.vendor_id] === 'expired') {
        return c.json({ success: false, error: `"${p.name}" non è al momento disponibile per l'acquisto` }, 400);
      }
      if (Number(p.stock) < r.quantity) return c.json({ success: false, error: `Scorte insufficienti per "${p.name}" (disponibili: ${p.stock})` }, 400);
      // Prezzo effettivo: se lo sconto è ATTUALMENTE attivo (valorizzato, nella
      // finestra di programmazione se impostata, e inferiore al prezzo pieno),
      // è quello da addebitare — mai fidarsi di un prezzo "scontato" calcolato
      // lato client, stesso principio già applicato altrove (spedizione,
      // limite prodotti, ecc.). Uno sconto scaduto o non ancora iniziato non
      // deve essere sfruttabile manipolando il carrello lato client.
      const hasValidDiscount = isDiscountActive(p) && Number(p.discount_price) < Number(p.price);
      const effectivePrice = hasValidDiscount ? Number(p.discount_price) : Number(p.price);
      secureItems.push({
        productId: p.id,
        name: p.name,
        price: effectivePrice,
        image: Array.isArray(p.images) ? p.images[0] : (p.images || null),
        vendor_id: p.vendor_id,
        quantity: r.quantity,
        shippingOverride: p.shipping_cost_override !== null && p.shipping_cost_override !== undefined ? Number(p.shipping_cost_override) : null,
      });
    }

    // SICUREZZA: il codice sconto, come prezzo/stock/spedizione sopra, viene
    // sempre ricalcolato qui dal DB — non ci si fida MAI di un importo di
    // sconto inviato dal client (prima il client lo calcolava da solo e lo
    // mandava al server, che però lo ignorava del tutto: lo sconto appariva
    // in checkout ma non veniva mai applicato al vero addebito Stripe).
    // Un codice può essere di piattaforma (vendor_id nullo, si applica
    // all'intero ordine) o di un singolo venditore (si applica solo alle
    // righe di QUEL venditore, ed eventualmente solo a prodotti specifici
    // che lui ha scelto tramite product_ids).
    let appliedDiscountCode: string | null = null;
    let appliedDiscountAmount = 0;
    if (discountCode && typeof discountCode === "string" && discountCode.trim()) {
      const { data: code } = await supabase.from("discount_codes")
        .select("*").eq("code", discountCode.trim().toUpperCase()).eq("is_active", true).maybeSingle();
      if (code) {
        const notExpired = !code.expires_at || new Date(code.expires_at) >= new Date();
        const usesLeft = !code.max_uses || code.used_count < code.max_uses;
        if (notExpired && usesLeft) {
          const eligibleItems = secureItems.filter((i: any) => {
            if (code.vendor_id && i.vendor_id !== code.vendor_id) return false;
            if (code.product_ids && code.product_ids.length > 0 && !code.product_ids.includes(i.productId)) return false;
            return true;
          });
          const eligibleSubtotal = eligibleItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
          // Per i codici di piattaforma, la soglia minima d'ordine guarda
          // l'intero carrello; per un codice di un venditore, guarda solo
          // la sua quota — un venditore non può imporre soglie su prodotti
          // altrui che non controlla.
          const relevantSubtotalForMin = code.vendor_id
            ? eligibleSubtotal
            : secureItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
          const minOk = !code.min_order_amount || relevantSubtotalForMin >= Number(code.min_order_amount);

          if (eligibleSubtotal > 0 && minOk) {
            let discount = code.type === "percentage" ? eligibleSubtotal * (Number(code.value) / 100) : Math.min(Number(code.value), eligibleSubtotal);
            discount = Math.round(discount * 100) / 100;
            if (discount > 0) {
              const factor = 1 - discount / eligibleSubtotal;
              for (const i of eligibleItems) i.price = Math.round(i.price * factor * 100) / 100;
              appliedDiscountCode = code.code;
              appliedDiscountAmount = discount;
            }
          }
        }
      }
      // Codice non trovato/scaduto/esaurito: nessun errore bloccante — il
      // checkout procede semplicemente senza sconto, coerente con l'idea che
      // la validazione "vera" (messaggio d'errore) resta quella già mostrata
      // al cliente in fase di digitazione del codice.
    }

    // SICUREZZA: la spedizione NON si fida del valore inviato dal client (stesso
    // principio già applicato al prezzo prodotto) — la ricalcoliamo qui dal DB,
    // usando la zona corrispondente al Paese di destinazione dichiarato dal
    // cliente. Se un venditore non ha abilitato quella zona, il suo carrello
    // non può proseguire al pagamento — meglio bloccare qui, con un errore
    // chiaro, che accettare un ordine che il venditore non può servire.
    //
    // Questi dati vanno letti PRIMA di costruire le righe per Stripe: da
    // quando i prezzi sono netti (IVA esclusa), l'importo da addebitare
    // dipende dal Paese fiscale del venditore e dal suo stato VIES, quindi
    // non si può più costruire una riga di pagamento senza conoscerli.
    const vendorIdsInCart = [...new Set(secureItems.map((i: any) => i.vendor_id))];
    const { data: vendorsData } = await supabase
      .from('vendors')
      .select('id, fiscal_country, stripe_account_id, vat_id, vies_validated, uses_platform_shipping')
      .in('id', vendorIdsInCart);

    // Stesso principio del cliente: nessun venditore senza P.IVA può vendere.
    const vendorWithoutVat = (vendorsData || []).find((v: any) => !v.vat_id);
    if (vendorWithoutVat) {
      return c.json({ success: false, error: "Uno dei venditori nel carrello non ha ancora completato la registrazione fiscale (P.IVA mancante). Contatta il supporto." }, 400);
    }

    // ── Da prezzi lordi a prezzi netti: cosa è cambiato e perché ──
    // I prezzi esposti su Oralzon sono NETTI (IVA esclusa), come su ogni
    // marketplace B2B: l'acquirente ha sempre una P.IVA (lo imponiamo poco
    // sopra) e per lui l'imposta è partita di giro, non un costo.
    // L'IVA viene quindi SOMMATA qui, al checkout, secondo il trattamento
    // fiscale applicabile a ciascun venditore.
    //
    // Il calcolo è nostro e non di Stripe Tax, per una ragione precisa: il
    // cliente deve pagare ESATTAMENTE la cifra che gli abbiamo mostrato nel
    // riepilogo. Lasciando calcolare a Stripe si rischia che l'imposta
    // effettiva differisca da quella preventivata (tipicamente perché il
    // venditore non ha configurato Stripe Tax sul proprio conto) e che il
    // cliente veda addebitato un importo diverso da quello confermato — cosa
    // che, oltre a essere scorretta, è contestabile. Passiamo quindi a Stripe
    // importi già comprensivi d'imposta (tax_behavior "inclusive" su un lordo
    // che abbiamo calcolato noi), mantenendo su ogni order_item la
    // scomposizione imponibile/IVA per la fatturazione del venditore.
    const vatTreatmentByVendor: Record<string, { rate: number; reverseCharge: boolean }> = {};
    for (const vendorId of vendorIdsInCart) {
      const v = (vendorsData || []).find((vv: any) => vv.id === vendorId);
      vatTreatmentByVendor[vendorId] = determineVatTreatment(
        v?.fiscal_country || 'IT',
        !!v?.vies_validated,
        shippingData.country || 'IT',
        !!buyerProfile.vies_validated,
      );
    }

    const lineItems: any[] = secureItems.map((i: any) => {
      const rate = vatTreatmentByVendor[i.vendor_id]?.rate ?? 0;
      const grossUnit = Math.round(i.price * (1 + rate) * 100) / 100;
      return {
        price_data: { currency: "eur", product_data: { name: i.name, images: i.image ? [i.image] : [] }, unit_amount: Math.round(grossUnit * 100), tax_behavior: "inclusive" },
        quantity: i.quantity,
      };
    });

    const { data: zonesData } = await supabase
      .from('vendor_shipping_zones')
      .select('vendor_id, zone, enabled, cost, free_shipping_threshold')
      .in('vendor_id', vendorIdsInCart);

    const vendorShippingMap: Record<string, { enabled: boolean; cost: number; threshold: number }> = {};
    for (const vendorId of vendorIdsInCart) {
      const vendorCountry = (vendorsData || []).find((v: any) => v.id === vendorId)?.fiscal_country || 'IT';
      const zone = shippingZoneBetween(vendorCountry, shippingData.country || 'IT');
      // SICUREZZA: Oralzon opera solo dentro l'UE-27. Zona nulla = una delle
      // due parti è fuori UE — blocchiamo QUI, dove i soldi si muovono
      // davvero, non solo nel selettore Paese del checkout (aggirabile
      // chiamando l'API direttamente). Accettare un ordine extra-UE
      // significherebbe promettere una consegna che nessun venditore ha
      // configurato, senza documenti doganali né dazi calcolati.
      if (!zone) {
        return c.json({ success: false, error: "Oralzon spedisce esclusivamente all'interno dell'Unione Europea. Seleziona un indirizzo di consegna in un Paese UE." }, 400);
      }
      const zoneRow = (zonesData || []).find((z: any) => z.vendor_id === vendorId && z.zone === zone);
      vendorShippingMap[vendorId] = zoneRow
        ? { enabled: zoneRow.enabled, cost: Number(zoneRow.cost || 0), threshold: Number(zoneRow.free_shipping_threshold || 0) }
        : { enabled: false, cost: 0, threshold: 0 };
    }

    // Spedizione calcolata PER VENDITORE e conservata tale: ogni quota va
    // salvata sulla riga d'ordine di quel venditore, perche' e' l'importo
    // che gli verra' girato col bonifico (vedi shipping_paid_by). Prima si
    // sommava tutto in un unico totale e la ripartizione andava persa.
    const shippingByVendor: Record<string, number> = {};
    for (const vendorId of vendorIdsInCart) {
      const vendorItems = secureItems.filter((i: any) => i.vendor_id === vendorId);
      const standardItems = vendorItems.filter((i: any) => i.shippingOverride === null);
      const overrideItems = vendorItems.filter((i: any) => i.shippingOverride !== null);

      let vendorShipping = 0;
      if (standardItems.length > 0) {
        const vs = vendorShippingMap[vendorId];
        if (!vs.enabled) {
          return c.json({ success: false, error: `Uno dei venditori nel carrello non spedisce nel Paese di destinazione selezionato (${shippingData.country || 'IT'}). Cambia Paese o rimuovi quei prodotti dal carrello.` }, 400);
        }
        const standardSubtotal = standardItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
        const isFree = vs.threshold > 0 && standardSubtotal >= vs.threshold;
        vendorShipping += isFree ? 0 : vs.cost;
      }
      if (overrideItems.length > 0) {
        vendorShipping += Math.max(...overrideItems.map((i: any) => i.shippingOverride));
      }
      shippingByVendor[vendorId] = roundShipping(vendorShipping);
    }
    const computedShipping = Object.values(shippingByVendor).reduce((s, v) => s + v, 0);

    // Aggiunge spedizione come voce separata se presente.
    // La spedizione segue il trattamento IVA del venditore che spedisce: è
    // accessoria alla cessione, non un servizio a sé (art. 12 DPR 633/72),
    // quindi sconta la stessa aliquota della merce di quel venditore — e in
    // reverse charge è esente come la merce. Con più venditori nel carrello
    // le quote possono avere aliquote diverse: le sommiamo al lordo in
    // un'unica riga per il cliente, tenendo la scomposizione sugli
    // order_items.
    const parsedShipping = computedShipping;
    let shippingVatTotal = 0;
    for (const vendorId of vendorIdsInCart) {
      const net = shippingByVendor[vendorId] || 0;
      if (net <= 0) continue;
      const rate = vatTreatmentByVendor[vendorId]?.rate ?? 0;
      shippingVatTotal = Math.round((shippingVatTotal + net * rate) * 100) / 100;
    }
    const grossShipping = Math.round((parsedShipping + shippingVatTotal) * 100) / 100;
    if (grossShipping > 0) {
      lineItems.push({
        price_data: { currency: "eur", product_data: { name: "Spedizione" }, unit_amount: Math.round(grossShipping * 100), tax_behavior: "inclusive" },
        quantity: 1,
      });
    }

    // Verifica importo minimo Stripe (€0.50)
    const totalCents = lineItems.reduce((s: number, i: any) => s + i.price_data.unit_amount * i.quantity, 0);
    if (totalCents < 50) return c.json({ success: false, error: "Il totale dell'ordine deve essere almeno €0.50" }, 400);

    const orderNumber = generateOrderNumber();
    // `total_amount` è quanto il cliente paga davvero, quindi IVA compresa —
    // deve coincidere con la somma delle righe passate a Stripe, altrimenti
    // il totale mostrato nello storico ordini non corrisponderebbe
    // all'addebito sulla carta.
    const netGoods = secureItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
    const goodsVatTotal = secureItems.reduce((s: number, i: any) => {
      const rate = vatTreatmentByVendor[i.vendor_id]?.rate ?? 0;
      return s + i.price * i.quantity * rate;
    }, 0);
    const totalAmount = Math.round((netGoods + goodsVatTotal + parsedShipping + shippingVatTotal) * 100) / 100;

    const { data: order, error: orderErr } = await supabase.from("orders").insert([{
      customer_id: customerId, order_number: orderNumber, total_amount: totalAmount, status: "pending",
      discount_code: appliedDiscountCode, discount_amount: appliedDiscountAmount || null,
      shipping_name: `${shippingData.firstName} ${shippingData.lastName}`, shipping_email: shippingData.email, shipping_address: shippingData,
    }]).select().single();
    if (orderErr) throw new Error(`Ordine: ${orderErr.message}`);

    // La quota di spedizione va su UNA sola riga per venditore: la
    // spedizione e' per collo, non per articolo. Teniamo traccia di quali
    // venditori l'hanno gia' ricevuta mentre costruiamo le righe.
    const shippingAssigned = new Set<string>();
    const orderItems = secureItems.map((i: any) => {
      const vendorRow = (vendorsData || []).find((vv: any) => vv.id === i.vendor_id);
      // Chi comprera' materialmente l'etichetta decide a chi spettano i
      // soldi della spedizione incassati dal cliente:
      //  - venditore che spedisce in autonomia -> glieli giriamo col bonifico
      //  - venditore passato all'aggregatore -> restano a Oralzon, che paga
      //    l'etichetta con quelli (modello a passaggio, ne' costo ne' ricavo)
      const paidBy = vendorRow?.uses_platform_shipping ? "platform" : "vendor";
      const firstOfVendor = !shippingAssigned.has(i.vendor_id);
      if (firstOfVendor) shippingAssigned.add(i.vendor_id);

      const item: any = {
        order_id: order.id,
        product_id: i.productId,
        product_name: i.name,
        vendor_id: i.vendor_id,
        quantity: i.quantity,
        price: i.price,
        shipping_status: "pending",
        shipping_amount: firstOfVendor ? (shippingByVendor[i.vendor_id] || 0) : 0,
        shipping_paid_by: paidBy,
      };
      // Calcoliamo qui il trattamento IVA (vedi determineVatTreatment) per
      // OGNI riga, indipendentemente dal numero di venditori nel carrello —
      // dato necessario al riepilogo fiscale che il venditore userà per
      // emettere la propria fattura. Per i carrelli mono-venditore Stripe
      // Tax calcolerà comunque l'imposta reale sulla sessione (sotto): in
      // verify-payment confrontiamo le due cifre e segnaliamo eventuali
      // discrepanze, invece di fidarci ciecamente dell'una o dell'altra.
      // `price` è ora l'IMPONIBILE (IVA esclusa), quindi l'imposta si somma
      // — non si scorpora più. Prima, con i prezzi lordi, l'IVA si estraeva
      // dal prezzo con rate/(1+rate); adesso è semplicemente imponibile ×
      // aliquota. La quota di spedizione di questa riga segue la stessa
      // aliquota della merce (accessorietà, art. 12 DPR 633/72).
      const treatment = vatTreatmentByVendor[i.vendor_id] || { rate: 0, reverseCharge: false };
      const netLine = Math.round(i.price * i.quantity * 100) / 100;
      const netShippingOnLine = item.shipping_amount || 0;
      item.vat_rate = treatment.rate;
      item.reverse_charge = treatment.reverseCharge;
      item.vat_amount = Math.round((netLine + netShippingOnLine) * treatment.rate * 100) / 100;
      return item;
    });
    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    if (itemsErr) { await supabase.from("orders").delete().eq("id", order.id); throw new Error(`Items: ${itemsErr.message}`); }

    // Stock decrementato dal trigger DB al verify-payment (dopo pagamento confermato)
    const origin = appOrigin || "http://localhost:5173";

    // Stripe Tax: la responsabilità fiscale (calcolo + rendicontazione) va
    // spostata sul conto Stripe collegato del venditore, non sulla piattaforma
    // — coerente con il principio "è il venditore a gestire l'IVA", non
    // Oralzon. Una Checkout Session supporta UN SOLO conto responsabile per
    // sessione: per i carrelli con un solo venditore lasciamo che sia Stripe
    // stesso a calcolare tutto (automatic_tax, sotto). Per i carrelli con più
    // venditori l'IVA è già stata calcolata riga per riga poco sopra (vedi
    // determineVatTreatment) e salvata su ogni order_item — qui automatic_tax
    // resta disattivato, ma il calcolo esiste comunque, solo fatto da noi
    // invece che da Stripe (stesso modello di Amazon: un pagamento unico per
    // il cliente, calcolo IVA separato per ciascun venditore dietro le quinte).
    const isSingleVendorCart = vendorIdsInCart.length === 1;
    const singleVendorStripeAccount = isSingleVendorCart
      ? (vendorsData || []).find((v: any) => v.id === vendorIdsInCart[0])?.stripe_account_id
      : null;

    // Stripe Tax calcola l'imposta in base a un indirizzo associato alla
    // sessione — l'indirizzo lo abbiamo già raccolto ed elaborato nel nostro
    // stesso form di checkout (shippingData), quindi lo passiamo qui invece
    // di far reinserire l'indirizzo al cliente sulla pagina Stripe.
    let stripeCustomerId: string | undefined;
    if (singleVendorStripeAccount) {
      try {
        const customerParams: any = {
          email: shippingData.email,
          name: `${shippingData.firstName} ${shippingData.lastName}`,
          address: {
            line1: shippingData.address,
            city: shippingData.city,
            state: shippingData.province || undefined,
            postal_code: shippingData.zipCode,
            country: shippingData.country || "IT",
          },
        };
        // Reverse charge B2B intra-UE: se il cliente ha una P.IVA UE già
        // verificata su VIES, la passiamo a Stripe Tax — è quello che gli
        // permette di riconoscere correttamente una vendita cross-border
        // B2B come esente da IVA (responsabilità sul cliente) invece di
        // applicare per errore l'aliquota italiana.
        if (buyerProfile.partita_iva && buyerProfile.vies_validated && shippingData.country && shippingData.country !== "IT") {
          customerParams.tax_id_data = [{ type: "eu_vat", value: buyerProfile.partita_iva }];
        }
        const customer = await stripe.customers.create(customerParams);
        stripeCustomerId = customer.id;
      } catch (custErr: any) {
        console.warn("Impossibile creare customer Stripe per il calcolo IVA, automatic_tax verrà disabilitato per questo ordine:", custErr.message);
      }
    }

    const sessionParams: any = {
      payment_method_types: ["card"], line_items: lineItems, mode: "payment",
      // Dall'app nativa usiamo uno schema custom (oralzon://) invece di un
      // URL https: è quello che permette al sistema operativo di ripassare
      // il controllo alla nostra app al termine del pagamento su Stripe,
      // invece di lasciare l'utente bloccato nel browser esterno.
      success_url: platform === "app"
        ? "oralzon://checkout-return?type=order&session_id={CHECKOUT_SESSION_ID}"
        : `${origin}/ordine-completato?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: platform === "app"
        ? "oralzon://checkout-return?type=order-cancel"
        : `${origin}/checkout`,
      metadata: { order_id: order.id, order_number: orderNumber }, locale: toStripeLocale(shippingData?.language),
    };
    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    } else {
      sessionParams.customer_email = shippingData.email;
    }
    // automatic_tax resta attivo sui carrelli mono-venditore, ma il suo ruolo
    // è cambiato da quando i prezzi sono netti: NON determina più quanto il
    // cliente paga. Le righe che gli passiamo sono già lorde e dichiarate
    // "inclusive", quindi Stripe si limita a scomporre un totale che abbiamo
    // fissato noi — l'addebito coincide sempre con il riepilogo mostrato al
    // cliente, qualunque cosa Stripe Tax concluda. Serve solo a produrre la
    // rendicontazione fiscale sul conto collegato del venditore che ha
    // configurato Stripe Tax; per tutti gli altri, la fonte usata dai report
    // di Oralzon resta il calcolo riga per riga salvato sugli order_items.
    if (singleVendorStripeAccount && stripeCustomerId) {
      sessionParams.automatic_tax = {
        enabled: true,
        liability: { type: "account", account: singleVendorStripeAccount },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    await supabase.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);
    return c.json({ success: true, sessionUrl: session.url, orderId: order.id, orderNumber });
  } catch (e: any) { console.error("❌ create-checkout:", e); return c.json({ success: false, error: e.message }, 500); }
});

// ── STRIPE: Verifica pagamento ──
app.post("/make-server-000b3cfb/stripe/verify-payment", async (c) => {
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return c.json({ success: false, error: "Stripe non configurata" }, 500);
    const { sessionId } = await c.req.json();
    if (!sessionId) return c.json({ success: false, error: "sessionId mancante" }, 400);

    const supabase = getServiceClient();
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") return c.json({ success: false, status: session.payment_status });

    // Prima cerca l'ordine
    const { data: existingOrder } = await supabase.from("orders").select().eq("stripe_session_id", sessionId).maybeSingle();

    // Se non trovato per stripe_session_id, prova dal metadata della sessione Stripe
    let order = existingOrder;
    if (!order && session.metadata?.order_id) {
      const { data: orderById } = await supabase.from("orders").select().eq("id", session.metadata.order_id).maybeSingle();
      if (orderById) {
        // Aggiorna anche lo stripe_session_id mancante
        await supabase.from("orders").update({ stripe_session_id: sessionId }).eq("id", orderById.id);
        order = orderById;
      }
    }

    if (!order) return c.json({ success: false, error: "Ordine non trovato per questa sessione" }, 404);

    // BUG UX TROVATO E CORRETTO: qui si confrontava l'IVA calcolata da noi
    // (determineVatTreatment, riga per riga) con quella calcolata da Stripe
    // Tax per i carrelli mono-venditore, segnalando "da verificare" quando
    // differivano — ma dato che tutti i prezzi sono già IVA inclusa
    // (tax_behavior: "inclusive"), l'eventuale disallineamento non cambia
    // MAI quanto il cliente paga: significa solo che le impostazioni di
    // Stripe Tax del venditore non sono configurate (situazione comune,
    // non un errore), e mostrarla al venditore come "avviso da verificare"
    // complica inutilmente la sua vita senza alcun beneficio pratico. Il
    // nostro calcolo riga per riga resta sempre l'unica fonte usata per il
    // report fiscale, per ogni carrello — mono o multi-venditore.
    const { data: itemsForTax } = await supabase.from("order_items").select("vendor_id, vat_amount").eq("order_id", order.id);
    const realTaxAmount = (itemsForTax || []).reduce((s: number, i: any) => s + Number(i.vat_amount || 0), 0);

    // Va letto PRIMA di sovrascrivere order con la riga aggiornata: serve a
    // capire se questa è la prima volta che l'ordine passa a "processing"
    // (verify-payment può essere richiamato più volte per lo stesso ordine —
    // dal client e dal webhook — e il contatore di utilizzo del codice sconto
    // non deve incrementarsi più di una volta per ordine).
    const wasAlreadyProcessed = order.status === "processing" || order.status === "shipped" || order.status === "delivered";

    const { data: updatedOrder, error: updateErr } = await supabase.from("orders").update({ status: "processing", tax_amount: realTaxAmount, tax_needs_review: false, tax_review_note: null }).eq("id", order.id).select().single();
    if (updateErr) throw new Error(updateErr.message);
    order = updatedOrder;
    // Trigger DB decrementa automaticamente lo stock (trigger_decrement_stock)

    if (!wasAlreadyProcessed && order.discount_code) {
      try {
        const { data: usedCode } = await supabase.from("discount_codes").select("id").eq("code", order.discount_code).maybeSingle();
        if (usedCode) await supabase.rpc("increment_discount_code_usage", { p_code_id: usedCode.id });
      } catch (discErr: any) { console.warn("Impossibile aggiornare il contatore del codice sconto:", discErr.message); }
    }

    const { data: orderItems } = await supabase.from("order_items")
      .select("*, products(name, images), vendors(id, business_name, profile_id)")
      .eq("order_id", order.id);

    // Invia email conferma ordine al cliente
    const emailItems = (orderItems || []).map((i: any) => ({ name: i.products?.name, quantity: i.quantity, price: i.price }));
    const orderedProductIds = (orderItems || []).map((i: any) => i.product_id).filter(Boolean);
    const confirmationBestsellers = await getBestsellersForEmail(supabase, 3, orderedProductIds);
    const buyerLang = await getUserEmailLang(supabase, order.customer_id);
    await sendEmail(order.shipping_email, tr(EMAIL_TEXTS,'subjOrderConf',buyerLang,{n:order.order_number}),
      orderConfirmationHtml(order.order_number, order.shipping_name, order.total_amount, emailItems, confirmationBestsellers, buyerLang));

    // Notifica ogni venditore coinvolto nell'ordine (con solo i suoi prodotti)
    try {
      const byVendor = new Map<string, any[]>();
      for (const item of orderItems || []) {
        const vId = (item.vendors as any)?.id;
        if (!vId) continue;
        if (!byVendor.has(vId)) byVendor.set(vId, []);
        byVendor.get(vId)!.push(item);
      }
      for (const [vId, vendorItems] of byVendor) {
        const vendorInfo = (vendorItems[0].vendors as any);
        const profileId = vendorInfo?.profile_id;
        if (!profileId) continue;
        const { data: vendorProfile } = await supabase.from("profiles").select("email, nome").eq("id", profileId).maybeSingle();
        if (!vendorProfile?.email) continue;
        const vTotal = vendorItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
        const vEmailItems = vendorItems.map((i: any) => ({ name: i.products?.name, quantity: i.quantity, price: i.price }));
        await sendEmail(vendorProfile.email, `Nuovo ordine ${order.order_number} — Oralzon`,
          newOrderVendorHtml(order.order_number, vendorInfo.business_name || vendorProfile.nome || "Venditore", vEmailItems, vTotal));
      }
    } catch (notifyErr) { console.warn("Notifica vendor fallita:", notifyErr); }

    return c.json({ success: true, order: { ...order, items: orderItems } });
  } catch (e: any) { console.error("❌ verify-payment:", e); return c.json({ success: false, error: e.message }, 500); }
});


// ── Helper: Attiva promozione dopo pagamento ──────────────────────────────────
async function activatePromotion(supabase: any, stripeSessionId: string) {
  try {
    // 1. Trova la promozione
    const { data: promo, error } = await supabase
      .from('promotions')
      .select('*, vendors(id)')
      .eq('stripe_session_id', stripeSessionId)
      .maybeSingle();

    if (error || !promo) { console.log('Promo non trovata per session:', stripeSessionId); return; }

    const vendorId = promo.vendor_id;
    const packageId = promo.package_id;
    const expiresAt = promo.expires_at;
    const wasAlreadyActive = promo.status === 'active';

    // 2. Attiva la promozione
    await supabase.from('promotions').update({ status: 'active' }).eq('id', promo.id);

    // Incrementa il contatore del codice sconto SOLO alla prima attivazione
    // (activatePromotion può essere richiamata più volte per la stessa
    // sessione — dal webhook e da verify-promo — stesso principio già
    // applicato al contatore sconto degli ordini prodotto).
    if (!wasAlreadyActive && promo.discount_code_id) {
      await supabase.rpc('increment_discount_code_usage', { p_code_id: promo.discount_code_id });
    }

    // 3. In base al tipo di pacchetto, attiva la visibilità
    if (packageId.startsWith('featured_')) {
      // Se ci sono prodotti specifici selezionati, sponsorizza solo quelli
      if (promo.selected_product_ids?.length > 0) {
        await supabase.from('products').update({ is_sponsored: true, promo_expires_at: expiresAt })
          .in('id', promo.selected_product_ids);
      } else {
        // Fallback: tutti i prodotti del vendor (max 5)
        const { data: vendorProducts } = await supabase.from('products')
          .select('id').eq('vendor_id', vendorId).eq('status', 'published').limit(5);
        if (vendorProducts?.length > 0) {
          await supabase.from('products').update({ is_sponsored: true, promo_expires_at: expiresAt })
            .in('id', vendorProducts.map((p: any) => p.id));
        }
      }
      console.log('✅ Prodotti in evidenza attivati per vendor:', vendorId);
    }

    if (packageId.startsWith('homepage_')) {
      await supabase.from('vendors')
        .update({ homepage_sponsored: true, homepage_expires_at: expiresAt })
        .eq('id', vendorId);
      console.log('✅ Homepage sponsored per vendor:', vendorId);
    }

    if (packageId.startsWith('category_')) {
      // Aggiorna la promo con la categoria, i prodotti del vendor in quella categoria
      // vengono mostrati in cima al Shop via query nel frontend
      await supabase.from('promotions').update({ status: 'active' }).eq('id', promo.id);
      console.log('✅ Categoria sponsorizzata:', promo.sponsored_category, 'per vendor:', vendorId);
    }

    if (packageId.startsWith('hero_')) {
      // Sponsorizzazione "hero" — card singola contestuale, colonna DISTINTA
      // (is_hero_sponsored) da is_sponsored del carosello "Prodotti
      // Sponsorizzati": stessa logica di selezione prodotti di featured_
      // (fino a 5 prodotti per acquisto).
      //
      // REGOLA "1 slot alla volta per venditore": un venditore PUÒ avere
      // più prodotti is_hero_sponsored=true contemporaneamente (ne compra
      // quanti vuole) — il limite "mai più di uno visibile insieme" è
      // applicato lato frontend (SponsoredHeroCard.tsx, deduplicazione per
      // venditore al momento della scelta di cosa mostrare in ogni slot),
      // non qui: qui semplicemente marchiamo come sponsorizzati i prodotti
      // scelti, senza spegnere quelli già attivi di altre promo.
      const heroProductIds: string[] = promo.selected_product_ids?.length > 0
        ? promo.selected_product_ids
        : (await supabase.from('products')
            .select('id').eq('vendor_id', vendorId).eq('status', 'published').limit(5)
          ).data?.map((p: any) => p.id) || [];

      if (heroProductIds.length > 0) {
        await supabase.from('products').update({ is_hero_sponsored: true, promo_expires_at: expiresAt })
          .in('id', heroProductIds);
      }
      console.log('✅ Sponsorizzato hero attivato per vendor:', vendorId, '- prodotti:', heroProductIds.length);
    }

    console.log('✅ Promozione attivata:', promo.package_name, 'per vendor:', vendorId);
  } catch (e: any) {
    console.error('❌ Errore attivazione promo:', e.message);
  }
}

// =====================================================================
// STRIPE CONNECT — trasferimento fondi ai venditori
// =====================================================================
// Architettura: Separate Charges and Transfers. Il cliente paga sempre
// Oralzon in un'unica transazione (anche con più venditori nel carrello).
// Il trasferimento a ciascun venditore avviene solo alla CONSEGNA
// confermata (manuale dal cliente, o automatica dopo N giorni), mai al
// momento del pagamento — così un reso/rimborso puo' sempre essere gestito
// prima che i soldi lascino il conto Oralzon.

// Elenco paesi UE (stessa lista di src/constants/countries.ts sul frontend —
// duplicata qui perché l'edge function Deno non condivide moduli col resto
// dell'app). Usata sia per il calcolo della spedizione per zona sia per il
// timer di conferma automatica della consegna, che si adatta alla distanza
// reale tra il paese del venditore e quello del cliente.
const PAESI_UE = ['IT','DE','FR','ES','PT','NL','BE','AT','IE','PL','SE','DK','FI','GR','CZ','RO','HU','BG','HR','SK','SI','LT','LV','EE','LU','MT','CY'];

// Determina la zona di spedizione tra un'origine (venditore) e una
// destinazione (cliente). Solo due zone, perché Oralzon opera
// esclusivamente dentro l'UE-27:
// - 'IT' = spedizione NAZIONALE (venditore e cliente nello stesso Paese)
// - 'UE' = intra-UE (Paesi diversi, entrambi nell'Unione)
// Ritorna null se una delle due parti è fuori UE: non è una zona valida, è
// un ordine da rifiutare (nessun venditore ha tariffe/documenti doganali
// configurati, e la zona EXTRA_UE è stata eliminata dalla piattaforma).
//
// BUG TROVATO E CORRETTO: la condizione nazionale era `origin === 'IT' &&
// dest === 'IT'`, scritta quando la piattaforma aveva solo venditori
// italiani. Ora i venditori possono essere di tutta l'UE-27: un venditore
// tedesco che spediva a un cliente tedesco ricadeva in 'UE' e si vedeva
// applicare la propria tariffa INTERNAZIONALE su una spedizione che per lui
// è nazionale. La chiave resta 'IT' per non migrare i dati esistenti, ma il
// significato ora è "stesso Paese del venditore".
//
// ATTENZIONE: questa funzione deve restare identica a shippingZoneBetween()
// in src/constants/countries.ts sul frontend — se divergono, il cliente vede
// a checkout un costo diverso da quello realmente addebitato da Stripe.
function shippingZoneBetween(originCountry: string | null | undefined, destCountry: string | null | undefined): 'IT' | 'UE' | null {
  const origin = originCountry || 'IT';
  const dest = destCountry || 'IT';
  if (!PAESI_UE.includes(origin) || !PAESI_UE.includes(dest)) return null;
  return origin === dest ? 'IT' : 'UE';
}

// Arrotonda il costo di spedizione ai 50 centesimi superiori.
// ATTENZIONE: deve restare identica a roundShipping() in
// src/constants/countries.ts sul frontend — se divergono, il cliente vede
// a checkout un totale diverso da quello addebitato da Stripe.
//
// Per eccesso e non al piu' vicino: quando le etichette passeranno
// dall'aggregatore, il preventivo puo' risultare piu' basso di quanto il
// corriere fattura davvero, tipicamente per il peso volumetrico (nel
// dentale supera quasi sempre il peso reale: scatoloni di guanti e camici,
// leggeri e ingombranti). Questi centesimi assorbono quella differenza,
// non sono un margine. Lo zero resta zero: la spedizione gratuita non deve
// mai diventare 0,50.
function roundShipping(amount: number): number {
  if (!amount || amount <= 0) return 0;
  return Math.ceil(amount * 2) / 2;
}

// ── IVA per i carrelli multi-venditore ──
// Stripe Tax (automatic_tax) sa gestire un solo soggetto fiscale responsabile
// per sessione di checkout — per questo, sui carrelli con UN SOLO venditore,
// lasciamo che sia Stripe a calcolare tutto (vedi singleVendorStripeAccount
// più sotto). Sui carrelli con PIÙ venditori, nessuna singola sessione può
// rappresentare correttamente più soggetti fiscali contemporaneamente, quindi
// calcoliamo l'IVA "in casa", venditore per venditore — esattamente il
// modello usato da Amazon: un solo pagamento per il cliente, ma calcolo e
// attribuzione dell'IVA separati per ciascun venditore dietro le quinte.
// Il prezzo mostrato al cliente NON cambia (i prezzi sono sempre IVA
// inclusa): questo calcolo serve solo per registrare correttamente, riga per
// riga, quanto di quel prezzo è imponibile e quanto è imposta — dato
// necessario alla contabilità/fatturazione di ciascun venditore.
//
// Aliquota IVA standard per Paese UE, verificata al 31 luglio 2026 su più
// fonti incrociate (Tax Foundation, Commissione UE). Un solo punto rimasto
// incerto tra le fonti consultate: l'Estonia, che alcune fonti riportano
// ancora al 22% e altre (più aggiornate) al 24% dopo l'aumento di luglio
// 2025 — qui si è scelto il valore più recente, ma va ri-verificato appena
// un venditore estone entra davvero in attività. Le aliquote IVA cambiano
// nel tempo (è già successo più volte solo nel 2024-2025): questa tabella
// va ricontrollata periodicamente, non è "verificata una volta per sempre".
const EU_STANDARD_VAT_RATE: Record<string, number> = {
  IT: 0.22, AT: 0.20, BE: 0.21, BG: 0.20, HR: 0.25, CY: 0.19, CZ: 0.21,
  DK: 0.25, EE: 0.24, FI: 0.255, FR: 0.20, DE: 0.19, GR: 0.24, HU: 0.27,
  IE: 0.23, LV: 0.21, LT: 0.21, LU: 0.17, MT: 0.18, NL: 0.21, PL: 0.23,
  PT: 0.23, RO: 0.19, SK: 0.20, SI: 0.22, ES: 0.21, SE: 0.25,
};
const DEFAULT_VAT_RATE_FALLBACK = 0.22; // rete di sicurezza residua, non dovrebbe più servire: copre ormai tutti e 27 i Paesi UE

interface VatTreatment { rate: number; reverseCharge: boolean; }

/**
 * Determina il trattamento IVA di una riga d'ordine in base al Paese del
 * venditore, al Paese di destinazione del cliente, e allo stato di verifica
 * VIES di entrambe le parti. Replica la regola standard UE per le cessioni
 * di beni B2B:
 * - stesso Paese (vendita nazionale) → IVA piena del Paese del venditore
 * - Paesi UE diversi, entrambe le parti con P.IVA valida su VIES → reverse
 *   charge, IVA 0% (cessione intracomunitaria esente, art. 41 DL 331/93 —
 *   il cliente si autoliquida l'imposta nel proprio Paese)
 * - Paesi UE diversi ma VIES non verificato da almeno una delle due parti →
 *   niente esenzione: si applica comunque l'IVA piena del Paese del
 *   venditore (non si può presumere un'esenzione non verificabile)
 * - fuori UE → non imponibile per esportazione (art. 8 DPR 633/72), 0%
 */
function determineVatTreatment(vendorCountry: string, vendorViesValidated: boolean, buyerCountry: string, buyerViesValidated: boolean): VatTreatment {
  const vc = vendorCountry || 'IT';
  const bc = buyerCountry || 'IT';
  const domesticRate = EU_STANDARD_VAT_RATE[vc] ?? DEFAULT_VAT_RATE_FALLBACK;

  if (vc === bc) return { rate: domesticRate, reverseCharge: false }; // vendita nazionale
  if (!PAESI_UE.includes(bc)) return { rate: 0, reverseCharge: false }; // esportazione extra-UE, non imponibile

  // Paesi UE diversi: reverse charge solo se ENTRAMBE le parti hanno la
  // P.IVA verificata su VIES — altrimenti l'esenzione non è giustificabile
  // e si applica l'IVA piena del venditore, per prudenza.
  if (vendorViesValidated && buyerViesValidated) return { rate: 0, reverseCharge: true };
  return { rate: domesticRate, reverseCharge: false };
}

// Giorni di attesa prima della conferma automatica di consegna, in base alla
// zona — una spedizione intra-UE impiega tipicamente più dei 2-5 giorni
// lavorativi di una spedizione nazionale italiana, e una extra-UE ancora di
// più (dogana inclusa). Prima era un unico valore fisso per tutti, che
// rischiava di liberare i fondi al venditore prima ancora che un pacco
// internazionale arrivasse davvero a destinazione.
// Le 8 lingue del sito sono già codici locale Stripe validi 1:1 (it, en, es,
// fr, de, pt, nl, pl) — nessuna mappatura complessa necessaria. 'auto' fa
// rilevare a Stripe stesso la lingua del browser quando non ne riceviamo una
// esplicita, invece di forzare sempre l'italiano indipendentemente da chi sta
// pagando.
const STRIPE_SUPPORTED_LOCALES = new Set(['it', 'en', 'es', 'fr', 'de', 'pt', 'nl', 'pl']);
function toStripeLocale(lang: unknown): string {
  return typeof lang === 'string' && STRIPE_SUPPORTED_LOCALES.has(lang) ? lang : 'auto';
}

const ZONE_AUTO_CONFIRM_DAYS: Record<'IT' | 'UE', number> = {
  IT: 7,
  UE: 15,
};

// Crea il trasferimento Stripe verso il venditore per una singola riga
// d'ordine, se il venditore ha Stripe Connect attivo e il trasferimento
// non è già stato fatto. Ritorna { ok, reason? }.
async function createTransferForOrderItem(supabase: any, stripe: any, orderItemId: string): Promise<{ ok: boolean; reason?: string }> {
  const { data: item } = await supabase
    .from('order_items')
    .select('id, price, quantity, vendor_id, transfer_id, order_id, shipping_amount, shipping_paid_by, vat_rate, vat_amount, orders(stripe_session_id, status), vendors(id, commission_pct, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, business_name, profile_id)')
    .eq('id', orderItemId)
    .maybeSingle();

  if (!item) return { ok: false, reason: 'Riga ordine non trovata' };
  if (item.transfer_id) return { ok: true, reason: 'Già trasferito' }; // idempotente
  const vendor = item.vendors as any;
  if (!vendor?.stripe_account_id || !vendor.stripe_payouts_enabled) {
    return { ok: false, reason: 'Venditore senza Stripe Connect attivo — fondi restano in sospeso su Oralzon' };
  }
  const order = item.orders as any;
  if (!order?.stripe_session_id) return { ok: false, reason: 'Ordine senza sessione di pagamento' };
  if (order.status === 'refunded' || order.status === 'cancelled') return { ok: false, reason: 'Ordine rimborsato o annullato' };

  // SICUREZZA: un reso in corso o già rimborsato su QUESTA riga d'ordine deve
  // sempre bloccare il trasferimento, indipendentemente da chi lo sta
  // tentando (conferma manuale del cliente, job automatico, retry) — il
  // flusso dei resi (returns/decision) aggiorna solo la tabella "returns",
  // mai orders.status, quindi il controllo sopra da solo non basta: un
  // articolo può avere un reso pending/approved/refunded mentre l'ordine
  // "genitore" resta formalmente su 'processing'. Un reso 'rejected' invece
  // non blocca: il venditore ha vinto la contestazione, la vendita resta valida.
  const { data: activeReturn } = await supabase
    .from('returns')
    .select('id, status')
    .eq('order_item_id', orderItemId)
    .in('status', ['pending', 'approved', 'refunded'])
    .maybeSingle();
  if (activeReturn) {
    return { ok: false, reason: `Reso ${activeReturn.status === 'refunded' ? 'già rimborsato' : 'in corso'} su questo articolo — trasferimento bloccato finché non si risolve` };
  }

  // ATTENZIONE — `price` è l'IMPONIBILE, non il lordo incassato.
  // La commissione si calcola qui, sull'imponibile: è esattamente ciò che
  // dichiarano le Condizioni di Vendita ("7% sul valore della merce,
  // imponibile, IVA esclusa"). Quando i prezzi erano lordi la stessa riga
  // applicava il 7% a un importo che conteneva già l'IVA, cioè un 8,54%
  // effettivo sull'imponibile: più alto di quanto scritto nel contratto.
  const netGoods = Number(item.price) * Number(item.quantity);
  const commissionPct = Number(vendor.commission_pct ?? 7);
  const commissionAmount = Math.round(netGoods * (commissionPct / 100) * 100) / 100;

  // BUG FINANZIARIO CORRETTO: la spedizione pagata dal cliente non veniva
  // mai girata a nessuno e restava ferma nel saldo Stripe di Oralzon,
  // mentre il venditore pagava il corriere di tasca sua. Su 100 EUR + 7 di
  // spedizione il venditore incassava 87 invece di 94: commissione
  // effettiva 13% invece del 7% dichiarato — proprio l'incentivo a
  // disintermediare che vogliamo eliminare.
  //
  // La spedizione gli spetta SOLO se e' lui a comprare l'etichetta
  // (shipping_paid_by = 'vendor'). Quando passera' all'aggregatore
  // l'etichetta la compra Oralzon con quegli stessi soldi, quindi restano
  // qui: modello a passaggio, per il venditore la spedizione non e' ne'
  // costo ne' ricavo e la commissione resta davvero il 7%.
  //
  // NON commissionata: il 7% e' sul venduto, non sul trasporto. Trattenere
  // una quota anche sulla spedizione renderebbe la commissione reale piu'
  // alta di quella dichiarata, che e' esattamente il problema di partenza.
  // La spedizione gratuita sopra soglia si gestisce da se': il cliente non
  // paga nulla, shipping_amount e' 0, e il venditore assorbe il costo del
  // corriere — che e' giusto, visto che e' una sua scelta commerciale.
  const shippingToVendor = item.shipping_paid_by === 'vendor' ? Number(item.shipping_amount || 0) : 0;

  // SECONDO BUG FINANZIARIO, della stessa famiglia del precedente: da
  // quando i prezzi sono netti, il cliente paga imponibile + IVA, ma qui
  // si trasferiva al venditore il solo imponibile — lasciando l'IVA ferma
  // nel saldo Stripe di Oralzon. Sarebbe stato grave: quell'imposta non e'
  // ricavo di nessuno dei due, e' denaro che il VENDITORE deve versare
  // all'erario del proprio Paese, e Oralzon la incassa solo per suo conto.
  // Trattenerla significherebbe costringerlo a versare di tasca propria
  // un'IVA che ha gia' incassato il marketplace.
  //
  // L'IVA sulla spedizione segue gli stessi soldi della spedizione: va al
  // venditore solo quando e' lui a fatturare (e quindi a incassare) quella
  // quota. Sulla merce l'IVA gli spetta sempre.
  const vatRate = Number(item.vat_rate || 0);
  const vatOnGoods = Math.round(netGoods * vatRate * 100) / 100;
  const vatOnShipping = Math.round(shippingToVendor * vatRate * 100) / 100;

  // Lordo effettivamente incassato dal cliente per questa riga: e' la cifra
  // con cui il venditore riconcilia il proprio estratto conto Stripe, quindi
  // deve comprendere l'imposta e non fermarsi all'imponibile.
  const grossCollected = Math.round((netGoods + vatOnGoods + shippingToVendor + vatOnShipping) * 100) / 100;
  const netAmount = Math.round((netGoods + vatOnGoods - commissionAmount + shippingToVendor + vatOnShipping) * 100) / 100;
  if (netAmount <= 0) return { ok: false, reason: 'Importo netto non positivo' };

  try {
    // Recupera la charge (non il payment_intent!) per collegare il trasferimento
    // alla transazione originale. source_transaction vuole l'ID di una CHARGE
    // (ch_...), non di un PaymentIntent (pi_...) — passare quest'ultimo produce
    // l'errore Stripe "No such charge". Serve espandere payment_intent per
    // arrivare al suo latest_charge.
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id, { expand: ['payment_intent'] });
    const paymentIntent = session.payment_intent as any;
    const chargeId: string | undefined = paymentIntent && typeof paymentIntent === 'object' ? paymentIntent.latest_charge : undefined;

    const transfer = await stripe.transfers.create({
      amount: Math.round(netAmount * 100),
      currency: 'eur',
      destination: vendor.stripe_account_id,
      source_transaction: chargeId || undefined,
      transfer_group: `order_${item.order_id}`,
      metadata: { order_item_id: item.id, order_id: item.order_id, vendor_id: vendor.id },
    });

    await supabase.from('order_items').update({
      transfer_id: transfer.id,
      transferred_at: new Date().toISOString(),
    }).eq('id', item.id);

    await supabase.from('vendor_transfers').insert([{
      vendor_id: vendor.id,
      order_id: item.order_id,
      order_item_id: item.id,
      gross_amount: grossCollected,
      commission_amount: commissionAmount,
      net_amount: netAmount,
      stripe_transfer_id: transfer.id,
      status: 'completed',
    }]);

    console.log(`✅ Trasferiti €${netAmount} a ${vendor.business_name} (item ${item.id})`);
    return { ok: true };
  } catch (e: any) {
    console.error('❌ Trasferimento fallito per item', orderItemId, ':', e.message);
    await supabase.from('vendor_transfers').insert([{
      vendor_id: vendor.id, order_id: item.order_id, order_item_id: item.id,
      gross_amount: grossCollected, commission_amount: commissionAmount, net_amount: netAmount,
      status: 'failed', failure_reason: e.message,
    }]);
    return { ok: false, reason: e.message };
  }
}

// Inverte (in tutto o in parte) i trasferimenti già effettuati per un ordine,
// in proporzione all'importo rimborsato — chiamata PRIMA/DOPO il rimborso al
// cliente. Best-effort per riga: un fallimento su una riga non blocca le altre
// (il rimborso al cliente è già avvenuto ed è la priorità; un mancato reversal
// va segnalato per follow-up manuale, non lasciato bloccare tutto il flusso).
async function reverseTransfersForOrder(supabase: any, stripe: any, orderId: string, refundAmount: number, orderTotal: number): Promise<{ reversedTotal: number; warnings: string[] }> {
  const warnings: string[] = [];
  let reversedTotal = 0;
  if (orderTotal <= 0) return { reversedTotal, warnings };

  const { data: items } = await supabase
    .from('order_items')
    .select('id, price, quantity, transfer_id, vendor_id')
    .eq('order_id', orderId)
    .not('transfer_id', 'is', null);

  for (const item of items || []) {
    const itemGross = Number(item.price) * Number(item.quantity);
    // Quota proporzionale di questo item nel rimborso totale dell'ordine
    const itemRefundShare = Math.round((itemGross / orderTotal) * refundAmount * 100) / 100;
    if (itemRefundShare <= 0) continue;

    const { data: transferRow } = await supabase.from('vendor_transfers')
      .select('*').eq('order_item_id', item.id).eq('status', 'completed').maybeSingle();
    if (!transferRow) continue;

    const alreadyReversed = Number(transferRow.reversed_amount || 0);
    const remainingTransferred = Number(transferRow.net_amount) - alreadyReversed;
    // Il reversal non può superare quanto ancora effettivamente trasferito;
    // scala la quota di rimborso proporzionalmente alla parte netta trasferita.
    // La quota da riprendere al venditore si calcola sul LORDO trasferito
    // (gross_amount, che comprende l'IVA girata a lui), non sull'imponibile:
    // rapportare la commissione a `itemGross`, che ora e' il solo imponibile
    // merce, sovrastimerebbe la percentuale trattenuta e lascerebbe al
    // venditore piu' soldi del dovuto dopo un reso.
    const transferGross = Number(transferRow.gross_amount) || itemGross;
    const vendorShareRatio = transferGross > 0
      ? 1 - (Number(transferRow.commission_amount) / transferGross)
      : 1;
    const netShareOfRefund = Math.min(itemRefundShare * vendorShareRatio, remainingTransferred);
    if (netShareOfRefund <= 0) continue;

    try {
      await stripe.transfers.createReversal(item.transfer_id, {
        amount: Math.round(netShareOfRefund * 100),
      });
      const newReversed = alreadyReversed + netShareOfRefund;
      const fullyReversed = newReversed >= Number(transferRow.net_amount) - 0.01;
      await supabase.from('vendor_transfers').update({
        reversed_amount: newReversed,
        status: fullyReversed ? 'reversed' : 'partially_reversed',
        updated_at: new Date().toISOString(),
      }).eq('id', transferRow.id);
      reversedTotal += netShareOfRefund;
    } catch (e: any) {
      console.error('❌ Reversal fallito per transfer', item.transfer_id, ':', e.message);
      warnings.push(`Impossibile recuperare €${netShareOfRefund.toFixed(2)} già trasferiti al venditore per la riga ${item.id}: ${e.message}. Richiede verifica manuale.`);
    }
  }
  return { reversedTotal, warnings };
}

// Come reverseTransfersForOrder, ma per un singolo order_item già noto (caso
// dei resi, dove il rimborso è sempre legato a una riga precisa — più
// semplice e preciso della versione proporzionale usata per i rimborsi
// ordine-intero dall'admin).
async function reverseTransferForOrderItem(supabase: any, stripe: any, orderItemId: string, refundAmount: number): Promise<{ reversed: number; warning?: string }> {
  const { data: transferRow } = await supabase.from('vendor_transfers')
    .select('*').eq('order_item_id', orderItemId).eq('status', 'completed').maybeSingle();
  if (!transferRow) return { reversed: 0 }; // niente da recuperare: non era ancora stato trasferito

  const alreadyReversed = Number(transferRow.reversed_amount || 0);
  const remaining = Number(transferRow.net_amount) - alreadyReversed;
  if (remaining <= 0) return { reversed: 0 };

  // Non recuperare più della quota netta corrispondente al rimborso (il
  // rimborso include la commissione trattenuta da Oralzon, che non è mai
  // stata trasferita al venditore, quindi non va richiesta indietro a lui)
  const grossFraction = refundAmount / (Number(transferRow.gross_amount) || refundAmount);
  const toReverse = Math.min(Math.round(Number(transferRow.net_amount) * grossFraction * 100) / 100, remaining);
  if (toReverse <= 0) return { reversed: 0 };

  try {
    await stripe.transfers.createReversal(transferRow.stripe_transfer_id, { amount: Math.round(toReverse * 100) });
    const newReversed = alreadyReversed + toReverse;
    const fullyReversed = newReversed >= Number(transferRow.net_amount) - 0.01;
    await supabase.from('vendor_transfers').update({
      reversed_amount: newReversed,
      status: fullyReversed ? 'reversed' : 'partially_reversed',
      updated_at: new Date().toISOString(),
    }).eq('id', transferRow.id);
    return { reversed: toReverse };
  } catch (e: any) {
    console.error('❌ Reversal fallito per transfer', transferRow.stripe_transfer_id, ':', e.message);
    return { reversed: 0, warning: `Impossibile recuperare €${toReverse.toFixed(2)} già trasferiti al venditore: ${e.message}. Richiede verifica manuale.` };
  }
}

// ── STRIPE: Webhook ──
// NOTA: servono DUE destinazioni webhook lato Stripe (due secret diversi),
// perché "Your account" (checkout.session.completed) e "Connected accounts"
// (account.updated, per gli account Express creati via API) sono due canali
// separati in Stripe — anche se puntano allo stesso URL. Configurale entrambe
// come secret separati: STRIPE_WEBHOOK_SECRET e STRIPE_WEBHOOK_SECRET_CONNECT.
app.post("/make-server-000b3cfb/stripe/webhook", async (c) => {
  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const webhookSecretConnect = Deno.env.get("STRIPE_WEBHOOK_SECRET_CONNECT");
    if (!stripeKey) return c.json({ error: "Not configured" }, 500);
    // SICUREZZA: senza almeno un secret non possiamo verificare che la
    // richiesta arrivi davvero da Stripe. Rifiutiamo invece di fidarci di un
    // payload non firmato (altrimenti chiunque potrebbe simulare un evento).
    if (!webhookSecret && !webhookSecretConnect) {
      console.error("❌ webhook: nessun secret configurato — richiesta rifiutata");
      return c.json({ error: "Webhook secret non configurato sul server" }, 500);
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });
    const body = await c.req.text();
    const sig = c.req.header("stripe-signature") || "";
    let event: any;
    let lastErr: any;
    // constructEventAsync è richiesto in ambiente Deno/Web Crypto (la variante
    // sincrona non funziona con l'implementazione async di SubtleCrypto).
    // Proviamo i secret configurati in ordine: solo uno dei due verificherà
    // correttamente la firma, a seconda di quale destinazione ha inviato
    // questo specifico evento.
    let verified = false;
    for (const secret of [webhookSecret, webhookSecretConnect].filter(Boolean) as string[]) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, sig, secret);
        verified = true;
        break;
      } catch (err: any) { lastErr = err; }
    }
    if (!verified) {
      console.error("❌ webhook: firma non valida con nessuno dei secret configurati:", lastErr?.message);
      return c.json({ error: `Firma webhook non valida: ${lastErr?.message}` }, 400);
    }
    if (event.type === "checkout.session.completed" && event.data.object.payment_status === "paid") {
      const supabase = getServiceClient();
      const sessionId = event.data.object.id;
      const metadata = event.data.object.metadata || {};

      // Importo IVA: stesso principio di /stripe/verify-payment — il calcolo
      // riga per riga (determineVatTreatment) è sempre l'unica fonte usata,
      // per ogni carrello, mono o multi-venditore. Non confrontiamo più con
      // Stripe Tax: i prezzi sono già IVA inclusa, quindi un eventuale
      // disallineamento non cambia mai quanto il cliente paga, e segnalarlo
      // come "da verificare" al venditore non aiutava — complicava solo.
      const { data: orderForTax } = await supabase.from("orders").select("id").eq("stripe_session_id", sessionId).maybeSingle();
      let realTaxAmount = 0;
      if (orderForTax) {
        const { data: itemsForTax } = await supabase.from("order_items").select("vat_amount").eq("order_id", orderForTax.id);
        realTaxAmount = (itemsForTax || []).reduce((s: number, i: any) => s + Number(i.vat_amount || 0), 0);
      }
      await supabase.from("orders").update({ status: "processing", tax_amount: realTaxAmount, tax_needs_review: false, tax_review_note: null }).eq("stripe_session_id", sessionId);

      // Attiva promozione se è un pagamento promo vendor
      if (metadata.type === "promo") {
        await activatePromotion(supabase, sessionId);
      }
      // Attiva piano vendor se è un pagamento piano
      if (metadata.type === "plan" && metadata.userId && metadata.planId) {
        const plans: Record<string, { productLimit: number }> = {
          professional: { productLimit: 999999 },
        };
        const plan = plans[metadata.planId];
        if (plan) {
          await supabase.from("vendors").update({ plan_type: metadata.planId, plan_status: 'active', product_limit: plan.productLimit }).eq("profile_id", metadata.userId);
          await supabase.from("profiles").update({ user_type: 'venditore' }).eq("id", metadata.userId);
        }
      }
    }
    if (event.type === "account.updated") {
      const account = event.data.object as any;
      const supabase = getServiceClient();
      const chargesEnabled = !!account.charges_enabled;
      const payoutsEnabled = !!account.payouts_enabled;
      await supabase.from("vendors").update({
        stripe_charges_enabled: chargesEnabled,
        stripe_payouts_enabled: payoutsEnabled,
        stripe_details_submitted: !!account.details_submitted,
        // Il badge "Oralzon Seller" riflette il KYC Stripe Connect realmente completato,
        // non il piano acquistato: entrambi i flag devono essere attivi.
        verified_badge: chargesEnabled && payoutsEnabled,
        ...(account.details_submitted && account.charges_enabled ? { stripe_onboarding_completed_at: new Date().toISOString() } : {}),
      }).eq("stripe_account_id", account.id);
      console.log(`🔄 Stripe Connect aggiornato per account ${account.id}: charges=${account.charges_enabled} payouts=${account.payouts_enabled}`);
    }
    return c.json({ received: true });
  } catch (e: any) { return c.json({ error: e.message }, 500); }
});


// =====================================================================
// STRIPE CONNECT — onboarding venditori
// =====================================================================

// Crea (se non esiste) l'account Stripe Express del venditore e genera il
// link di onboarding ospitato da Stripe. Riutilizzabile anche per
// "riprendi onboarding" se il venditore l'ha lasciato a metà.
app.post("/make-server-000b3cfb/stripe/connect/onboard", async (c) => {
  try {
    const auth = await requireAuth(c);
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 401);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return c.json({ success: false, error: "Stripe non configurato sul server" }, 500);
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });

    const supabase = getServiceClient();
    const vendor = await getVendorByProfileId(supabase, auth.userId!, "id, business_name, contact_email, stripe_account_id, fiscal_country, address_street, address_city, address_region, address_postal_code");
    if (!vendor) return c.json({ success: false, error: "Nessun profilo venditore trovato" }, 404);

    let accountId = (vendor as any).stripe_account_id as string | null;

    if (!accountId) {
      // SICUREZZA/ROBUSTEZZA: contact_email è un campo libero impostato dal
      // venditore in Impostazioni, non garantito valido (es. dati di test
      // legacy tipo "info@dentalclean" senza dominio). Stripe rifiuta la
      // creazione dell'account con un'email malformata — usiamola solo se
      // ha un formato plausibile, altrimenti ripieghiamo sull'email di
      // login, che è sempre valida perché verificata da Supabase Auth.
      const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const contactEmail = (vendor as any).contact_email as string | null;
      const accountEmail = (contactEmail && EMAIL_RE.test(contactEmail)) ? contactEmail : auth.email;
      if (!accountEmail) return c.json({ success: false, error: "Nessuna email valida disponibile per creare l'account Stripe" }, 400);

      const rawFiscalCountry = (vendor as any).fiscal_country as string | null;
      const stripeCountry = (rawFiscalCountry && rawFiscalCountry !== "OTHER") ? rawFiscalCountry : "IT";
      const account = await stripe.accounts.create({
        type: "express",
        country: stripeCountry,
        email: accountEmail,
        // NOTA: business_type volutamente NON specificato — lo chiede Stripe
        // stesso durante l'onboarding (individuale vs società). Forzarlo a
        // "company" per tutti obbligava anche i piccoli rivenditori individuali
        // al percorso di verifica più pesante (titolare effettivo, ecc.),
        // aumentando inutilmente l'attrito e il rischio di abbandono.
        business_profile: { name: (vendor as any).business_name, mcc: "8021" }, // 8021 = dentisti/forniture dentali
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
      });
      accountId = account.id;
      await supabase.from("vendors").update({ stripe_account_id: accountId }).eq("id", (vendor as any).id);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${SITE_URL}/venditore/pagamenti?refresh=true`,
      return_url: `${SITE_URL}/venditore/pagamenti?onboarding=complete`,
      type: "account_onboarding",
    });

    return c.json({ success: true, url: accountLink.url });
  } catch (e: any) {
    console.error("❌ stripe/connect/onboard:", e.message);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── Sincronizza indirizzo fiscale con le impostazioni Stripe Tax del venditore ──
// Passo preparatorio per Stripe Tax: imposta l'indirizzo di origine sul conto
// Stripe collegato del venditore. NON abilita da solo il calcolo/addebito
// automatico dell'IVA nel checkout — quello richiede anche registrazioni
// fiscali reali (OSS o equivalenti), che il venditore deve avere ottenuto
// separatamente. Senza registrazione attiva, Stripe calcolerebbe comunque
// zero imposta: questo endpoint prepara solo il terreno.
app.post("/make-server-000b3cfb/stripe/connect/sync-tax-settings", async (c) => {
  try {
    const auth = await requireAuth(c);
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 401);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return c.json({ success: false, error: "Stripe non configurato sul server" }, 500);
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });

    const supabase = getServiceClient();
    const vendor = await getVendorByProfileId(supabase, auth.userId!,
      "id, stripe_account_id, fiscal_country, address_street, address_city, address_region, address_postal_code");
    if (!vendor) return c.json({ success: false, error: "Nessun profilo venditore trovato" }, 404);

    const v = vendor as any;
    if (!v.stripe_account_id) {
      return c.json({ success: false, error: "Completa prima il collegamento con Stripe (Pagamenti → Collega Stripe)" }, 400);
    }
    if (!v.address_street || !v.address_city || !v.address_postal_code || !v.fiscal_country || v.fiscal_country === "OTHER") {
      return c.json({ success: false, error: "Completa prima l'indirizzo fiscale completo in Impostazioni (paese, via, città, CAP)" }, 400);
    }

    // La Tax Settings API va chiamata SUL conto collegato del venditore
    // (header Stripe-Account), non su quello della piattaforma — ogni
    // venditore ha impostazioni fiscali proprie e indipendenti.
    const settings = await stripe.tax.settings.update(
      {
        defaults: { tax_behavior: "inclusive" }, // coerente con "prezzi IVA inclusa" già mostrato nel checkout
        head_office: {
          address: {
            line1: v.address_street,
            city: v.address_city,
            state: v.address_region || undefined,
            postal_code: v.address_postal_code,
            country: v.fiscal_country,
          },
        },
      },
      { stripeAccount: v.stripe_account_id }
    );

    return c.json({
      success: true,
      status: settings.status, // "active" | "pending" (mancano registrazioni) | "incomplete"
      message: settings.status === "active"
        ? "Impostazioni fiscali sincronizzate e attive."
        : "Indirizzo sincronizzato. Per attivare il calcolo automatico dell'IVA serve anche una registrazione fiscale valida (es. OSS) — contattaci per completare questo passaggio.",
    });
  } catch (e: any) {
    console.error("❌ stripe/connect/sync-tax-settings:", e.message);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// Stato del collegamento Stripe Connect del venditore corrente + eventuali
// trasferimenti recenti, per la pagina "Pagamenti" della dashboard.
app.get("/make-server-000b3cfb/stripe/connect/status", async (c) => {
  try {
    const auth = await requireAuth(c);
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 401);

    const supabase = getServiceClient();
    let vendor = await getVendorByProfileId(supabase, auth.userId!,
      "id, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted, stripe_onboarding_completed_at, commission_pct");
    if (!vendor) return c.json({ success: false, error: "Nessun profilo venditore trovato" }, 404);

    // AFFIDABILITÀ: non ci fidiamo solo del webhook account.updated per sapere
    // se l'account Stripe è attivo — un webhook può arrivare in ritardo, fallire
    // la consegna, o non essere mai stato configurato correttamente lato Stripe,
    // lasciandoci bloccati su uno stato vecchio anche quando su Stripe è già
    // tutto ok (bug reale riscontrato: account verificato su Stripe, ancora
    // "da collegare" su Oralzon). Se l'account non risulta già pienamente
    // attivo nel nostro DB, controlliamo lo stato vero direttamente su Stripe
    // ad ogni caricamento di questa pagina, e aggiorniamo il DB di conseguenza.
    const v0 = vendor as any;
    if (v0.stripe_account_id && !(v0.stripe_charges_enabled && v0.stripe_payouts_enabled)) {
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeKey) {
        try {
          const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });
          const account = await stripe.accounts.retrieve(v0.stripe_account_id);
          const fresh = {
            stripe_charges_enabled: !!account.charges_enabled,
            stripe_payouts_enabled: !!account.payouts_enabled,
            stripe_details_submitted: !!account.details_submitted,
            verified_badge: !!account.charges_enabled && !!account.payouts_enabled,
            ...(account.details_submitted && account.charges_enabled ? { stripe_onboarding_completed_at: v0.stripe_onboarding_completed_at || new Date().toISOString() } : {}),
          };
          if (fresh.stripe_charges_enabled !== v0.stripe_charges_enabled || fresh.stripe_payouts_enabled !== v0.stripe_payouts_enabled || fresh.stripe_details_submitted !== v0.stripe_details_submitted) {
            await supabase.from("vendors").update(fresh).eq("id", v0.id);
            vendor = { ...v0, ...fresh };
          }
        } catch (syncErr: any) {
          // Non blocchiamo la pagina se la sincronizzazione con Stripe fallisce
          // (es. rete, rate limit) — mostriamo semplicemente l'ultimo stato noto.
          console.warn("⚠️ Impossibile sincronizzare lo stato Stripe in tempo reale:", syncErr.message);
        }
      }
    }

    const { data: transfers } = await supabase
      .from("vendor_transfers")
      .select("*")
      .eq("vendor_id", (vendor as any).id)
      .order("created_at", { ascending: false })
      .limit(20);

    // Fondi "in sospeso": ordini consegnati/pagati ma non ancora trasferiti
    // (perché il venditore non aveva ancora Stripe Connect attivo)
    const { data: pendingItems } = await supabase
      .from("order_items")
      .select("id, price, quantity, vat_amount, shipping_amount, shipping_paid_by, orders(status), returns(status)")
      .eq("vendor_id", (vendor as any).id)
      .is("transfer_id", null)
      .in("orders.status", ["processing", "shipped", "delivered"]);

    // Esclude gli articoli con un reso attivo o già rimborsato: quei soldi
    // non verranno MAI trasferiti (stesso motivo per cui createTransferForOrderItem
    // li blocca), quindi contarli come "in attesa" darebbe al venditore
    // l'impressione sbagliata che stiano per arrivare.
    const trulyPending = (pendingItems || []).filter((i: any) =>
      !(i.returns || []).some((r: any) => ['pending', 'approved', 'refunded'].includes(r.status))
    );
    // Deve corrispondere alla stessa formula di createTransferForOrderItem,
    // altrimenti il venditore vede annunciata una cifra e ne riceve un'altra.
    // In particolare l'IVA incassata dal cliente gli spetta (la versa lui
    // all'erario) e va quindi inclusa nell'atteso, mentre la commissione si
    // applica al solo imponibile della merce.
    const commissionPct = Number((vendor as any).commission_pct ?? 7);
    const pendingNet = Math.round(trulyPending.reduce((s: number, i: any) => {
      const netGoods = Number(i.price) * Number(i.quantity);
      const commission = netGoods * (commissionPct / 100);
      const shipping = i.shipping_paid_by === 'vendor' ? Number(i.shipping_amount || 0) : 0;
      // vat_amount copre merce + spedizione: se la spedizione resta a
      // Oralzon, la sua quota d'imposta non va conteggiata qui.
      const totalNetOnRow = netGoods + Number(i.shipping_amount || 0);
      const vatShare = totalNetOnRow > 0
        ? Number(i.vat_amount || 0) * ((netGoods + shipping) / totalNetOnRow)
        : 0;
      return s + netGoods - commission + shipping + vatShare;
    }, 0) * 100) / 100;

    return c.json({ success: true, vendor, transfers: transfers || [], pendingNet });
  } catch (e: any) {
    console.error("❌ stripe/connect/status:", e.message);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── STRIPE: Acquisto piano venditore ──────────────────────────────────────────
app.post('/make-server-000b3cfb/stripe/create-plan-checkout', rateLimit(10, 60_000), async (c) => {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return c.json({ success: false, error: 'Stripe non configurata' }, 500);
    const { planId, userId, appOrigin, platform, language } = await c.req.json();
    if (!planId || !userId) return c.json({ success: false, error: 'Dati mancanti' }, 400);

    const plans: Record<string, { name: string; price: number; productLimit: number }> = {
      professional: { name: 'Piano Venditore — Oralzon', price: 199, productLimit: 999999 },
    };
    const plan = plans[planId];
    if (!plan) return c.json({ success: false, error: 'Piano non valido' }, 400);

    const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });
    const origin = appOrigin || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: plan.name },
          unit_amount: plan.price * 100,
          recurring: { interval: 'year' },
        },
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: platform === 'app'
        ? 'oralzon://checkout-return?type=vendor-plan&session_id={CHECKOUT_SESSION_ID}'
        : origin + '/venditore/piano-attivato?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: platform === 'app'
        ? 'oralzon://checkout-return?type=vendor-cancel'
        : origin + '/pricing-venditori',
      metadata: { userId, planId, productLimit: String(plan.productLimit) },
      locale: toStripeLocale(language),
    });
    return c.json({ success: true, sessionUrl: session.url });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});

// ── STRIPE: Attiva piano dopo pagamento ──────────────────────────────────────
app.post('/make-server-000b3cfb/stripe/activate-plan', async (c) => {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return c.json({ success: false, error: 'Stripe non configurata' }, 500);
    const { sessionId } = await c.req.json();
    if (!sessionId) return c.json({ success: false, error: 'sessionId mancante' }, 400);

    const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.status !== 'complete') return c.json({ success: false, error: 'Pagamento non completato' });

    const { userId, planId, productLimit } = session.metadata || {};
    if (!userId || !planId) return c.json({ success: false, error: 'Metadati mancanti' });

    const supabase = getServiceClient();

    // Aggiorna o crea il record vendor
    // NOTA: verified_badge NON viene toccato qui — riflette esclusivamente il
    // completamento del KYC di Stripe Connect (charges_enabled && payouts_enabled),
    // gestito nel webhook account.updated e nel polling di /stripe/connect/status.
    // Pagare un piano non equivale a una verifica di identità/azienda.
    const existing = await getVendorByProfileId(supabase, userId, 'id');
    if (existing) {
      await supabase.from('vendors').update({
        plan_type: planId,
        plan_status: 'active',
        product_limit: parseInt(productLimit || '999999'),
      }).eq('profile_id', userId);
    } else {
      const { data: profile } = await supabase.from('profiles').select('ragione_sociale, nome, cognome').eq('id', userId).maybeSingle();
      const fallbackName = (profile as any)?.ragione_sociale
        || `${(profile as any)?.nome || ''} ${(profile as any)?.cognome || ''}`.trim()
        || 'Il mio Store';
      await supabase.from('vendors').insert([{
        profile_id: userId,
        business_name: fallbackName,
        plan_type: planId,
        plan_status: 'active',
        product_limit: parseInt(productLimit || '999999'),
        verified_badge: false,
      }]);
    }

    // NON modifichiamo user_type — è già impostato a 'venditore' dalla registrazione

    console.log('✅ Piano', planId, 'attivato per utente:', userId);
    return c.json({ success: true, planId });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});

// ── VENDOR: Crea vendor ──
app.post("/make-server-000b3cfb/create-vendor", rateLimit(5, 60_000), async (c) => {
  try {
    const auth = await requireAuth(c);
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 401);

    const { business_name } = await c.req.json();
    if (!business_name) return c.json({ success: false, error: "Dati mancanti" }, 400);

    // SICUREZZA: il vendor viene sempre creato per l'utente autenticato (dal token),
    // mai per un userId arbitrario passato nel body.
    const userId = auth.userId!;

    const supabase = getServiceClient();
    const existing = await getVendorByProfileId(supabase, userId, '*');
    if (existing) return c.json({ success: true, vendor: existing, message: 'Già esistente' });
    // SICUREZZA/BUG TROVATO IN TEST: questo endpoint (usato come rete di
    // sicurezza in caso di fallimento della registrazione principale, vedi
    // ensureVendorExists() in lib/vendor.ts) accettava plan_type e
    // product_limit direttamente dal client — chiunque avesse un token
    // valido avrebbe potuto chiamarlo a mano chiedendo un piano a pagamento
    // gratis. Qui NON deve mai succedere altro che un trial: l'attivazione
    // di un piano reale passa solo da /stripe/activate-plan, dopo un
    // pagamento Stripe confermato.
    const computedTrialEnd = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(); // 6 mesi
    const { data: vendor, error } = await supabase.from('vendors').insert([{
      profile_id: userId, 
      business_name, 
      plan_type: 'trial', 
      plan_status: 'active', 
      product_limit: 999999, 
      verified_badge: false,
      trial_ends_at: computedTrialEnd,
    }]).select().single();
    if (error) return c.json({ success: false, error: error.message }, 500);
    return c.json({ success: true, vendor });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});


// ── STRIPE: Checkout pacchetti visibilità ──
app.post('/make-server-000b3cfb/stripe/create-promo-checkout', rateLimit(10, 60_000), async (c) => {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return c.json({ success: false, error: 'Stripe non configurata' }, 500);
    const { packageId, packageTitle, vendorId, appOrigin, platform, sponsoredCategory, selectedProductIds, discountCode, language } = await c.req.json();
    if (!packageId || !vendorId) return c.json({ success: false, error: 'Dati mancanti' }, 400);
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });
    const origin = appOrigin || 'http://localhost:5173';
    // Calcola durata pacchetto
    const durationDays: Record<string, number> = {
      featured_monthly: 30, featured_quarterly: 90,
      homepage_monthly: 7, homepage_fixed: 30,
      category_single: 30, category_multi: 30,
      hero_monthly: 30,
    };
    const days = durationDays[packageId] || 30;

    // SICUREZZA: BUG TROVATO IN TEST — questo endpoint prendeva il prezzo
    // (`price`) direttamente da quello che mandava il client, esattamente
    // come i codici sconto prima del fix: chiunque poteva intercettare la
    // richiesta dal browser e pagare pochi centesimi per un pacchetto da
    // centinaia di euro. Stesso principio già applicato a prodotti,
    // spedizione e sconti — il prezzo reale vive SOLO qui, mai nel client.
    // BUG TROVATO E CORRETTO: questi prezzi erano duplicati "a mano" in TRE
    // punti — qui, VendorPricing.tsx (pagina pubblica) e VendorPromotions.tsx
    // (acquisto vero) — ma questo commento avvisava di allinearli SOLO con
    // VendorPromotions.tsx, ignorando che esisteva una terza copia dimenticata
    // in VendorPricing.tsx, rimasta ai vecchi prezzi pieni. Le due pagine
    // frontend ora condividono un'unica fonte (src/constants/promoPricing.ts) —
    // qui resta comunque una copia separata perché backend e frontend sono
    // runtime distinti (Deno vs browser), ma almeno il rischio di
    // disallineamento è dimezzato: un solo posto da tenere sincronizzato con
    // qui, non due.
    // Prezzi di lancio (introdotti in vista dell'apertura pubblica): il
    // marketplace non ha ancora traffico dimostrato, quindi i canoni fissi
    // pieni non sarebbero giustificabili per un primo venditore — vanno
    // rivisti al rialzo quando ci saranno numeri reali da mostrare.
    const PROMO_PACKAGE_PRICES: Record<string, number> = {
      featured_monthly: 29, featured_quarterly: 79,
      homepage_monthly: 49, homepage_fixed: 199,
      category_single: 39, category_multi: 99,
      hero_monthly: 39,
    };
    const price = PROMO_PACKAGE_PRICES[packageId];
    if (!price) return c.json({ success: false, error: 'Pacchetto non valido' }, 400);

    // Codice sconto sui pacchetti visibilità — ricalcolato SEMPRE qui dal
    // DB, stesso principio già applicato al prezzo prodotto/spedizione:
    // mai fidarsi di uno sconto calcolato lato client. Ambito dedicato
    // ('promotion'), separato da 'order'/'subscription'/'both' — sono
    // acquisti di natura diversa (il venditore paga la piattaforma, non
    // il cliente il venditore).
    let finalPrice = price;
    let appliedDiscountCodeId: string | null = null;
    let appliedDiscountLabel: string | null = null;
    if (discountCode && typeof discountCode === "string" && discountCode.trim()) {
      const supabaseForDiscount = getServiceClient();
      const { data: code } = await supabaseForDiscount.from("discount_codes")
        .select("*").eq("code", discountCode.trim().toUpperCase()).eq("is_active", true).maybeSingle();
      // EXPLOIT CHIUSO: qui mancava il controllo su code.vendor_id. Un
      // venditore puo' creare codici sconto propri (policy "Vendor manages
      // own discount codes"): impostando applies_to='promotion' e uno sconto
      // del 100% poteva comprarsi tutti i pacchetti visibilita' a 0,50 euro.
      // I pacchetti li vende la PIATTAFORMA al venditore, quindi solo un
      // codice creato dall'admin (vendor_id nullo) puo' scontarli.
      if (code && code.applies_to === "promotion" && !code.vendor_id) {
        const notExpired = !code.expires_at || new Date(code.expires_at) >= new Date();
        const usesLeft = !code.max_uses || code.used_count < code.max_uses;
        const minOk = !code.min_order_amount || price >= Number(code.min_order_amount);
        if (notExpired && usesLeft && minOk) {
          const discountAmount = code.type === "percentage" ? price * (Number(code.value) / 100) : Math.min(Number(code.value), price);
          finalPrice = Math.max(0.5, Math.round((price - discountAmount) * 100) / 100); // mai sotto il minimo Stripe
          appliedDiscountCodeId = code.id;
          appliedDiscountLabel = code.code;
        }
      }
      // Codice non trovato/scaduto/non applicabile ai pacchetti/esaurito:
      // nessun errore bloccante, il checkout procede semplicemente al
      // prezzo pieno — coerente con lo stesso comportamento già usato per
      // gli ordini prodotto.
    }

    // Crea record promo in DB (pending, si attiva dopo payment)
    const supabase = getServiceClient();
    const vendor = await getVendorByProfileId(supabase, vendorId, 'id');

    // CRITICO: se il vendor non viene trovato, blocchiamo PRIMA di far pagare —
    // meglio un errore chiaro ora che un pagamento andato a buon fine senza
    // che nulla venga mai registrato (bug che ha causato acquisti "fantasma").
    if (!vendor?.id) {
      return c.json({ success: false, error: 'Vendor non trovato. Ricarica la pagina e riprova, o contatta il supporto.' }, 404);
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: { name: packageTitle || 'Pacchetto Visibilità Oralzon' },
          unit_amount: Math.round(finalPrice * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: platform === 'app'
        ? 'oralzon://checkout-return?type=vendor-promo&session_id={CHECKOUT_SESSION_ID}'
        : origin + '/venditore/promozione-attivata?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: platform === 'app'
        ? 'oralzon://checkout-return?type=vendor-cancel'
        : origin + '/pricing-venditori',
      metadata: { type: 'promo', vendorId: vendor.id, packageId, packageTitle: packageTitle || '', amountPaid: String(finalPrice), expiresAt: expiresAt.toISOString(), sponsoredCategory: sponsoredCategory || '', selectedProductIds: selectedProductIds ? JSON.stringify(selectedProductIds) : '', discountCodeId: appliedDiscountCodeId || '', discountCodeLabel: appliedDiscountLabel || '' },
      locale: toStripeLocale(language),
    });

    // Salva promo record (si attiva automaticamente al verify-promo/webhook)
    const { error: insertErr } = await supabase.from('promotions').insert([{
      vendor_id: vendor.id,
      package_id: packageId,
      package_name: packageTitle || packageId,
      amount_paid: finalPrice,
      stripe_session_id: session.id,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      sponsored_category: sponsoredCategory || null,
      selected_product_ids: selectedProductIds || null,
      discount_code_id: appliedDiscountCodeId,
      discount_code_label: appliedDiscountLabel,
    }]);
    if (insertErr) {
      console.error('❌ Impossibile salvare la promozione (ma la sessione Stripe è già stata creata):', insertErr.message, insertErr.details, insertErr.hint);
      // Non blocchiamo qui: il pagamento su Stripe non è ancora avvenuto (l'utente
      // deve ancora completarlo), quindi nessun addebito è stato fatto senza record.
      // Rete di sicurezza: se il pagamento va comunque a buon fine, /stripe/verify-promo
      // ricostruisce il record dai metadati della sessione Stripe (vedi sotto).
    }

    return c.json({ success: true, sessionUrl: session.url });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});

// ── STRIPE: Verifica e attiva promozione ──
app.post('/make-server-000b3cfb/stripe/verify-promo', async (c) => {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return c.json({ success: false, error: 'Stripe non configurata' }, 500);
    const { sessionId } = await c.req.json();
    if (!sessionId) return c.json({ success: false, error: 'sessionId mancante' }, 400);

    const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });
    const supabase = getServiceClient();

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') return c.json({ success: false, error: 'Pagamento non completato' });

    // Verifica se il record esiste già; se manca (es. l'insert iniziale è fallito per
    // qualsiasi motivo: vincolo DB, errore transitorio, ecc.) lo ricostruiamo dai
    // metadati Stripe invece di limitarci a mostrare un errore — i metadati contengono
    // tutto ciò che serve, e il pagamento è già stato incassato quindi il servizio va erogato.
    let { data: promo } = await supabase.from('promotions').select('*').eq('stripe_session_id', sessionId).maybeSingle();

    if (!promo) {
      const md = session.metadata || {};
      if (!md.vendorId || !md.packageId) {
        console.error('❌ verify-promo: nessun record e metadati Stripe insufficienti per session', sessionId);
        return c.json({ success: false, error: 'Pagamento ricevuto ma la promozione non risulta registrata. Contatta il supporto con questo codice: ' + sessionId }, 500);
      }
      let selectedProductIds: string[] | null = null;
      try { selectedProductIds = md.selectedProductIds ? JSON.parse(md.selectedProductIds) : null; } catch { selectedProductIds = null; }

      const { data: rebuilt, error: rebuildErr } = await supabase.from('promotions').insert([{
        vendor_id: md.vendorId,
        package_id: md.packageId,
        package_name: md.packageTitle || md.packageId,
        amount_paid: Number(md.amountPaid) || 0,
        stripe_session_id: sessionId,
        status: 'pending',
        expires_at: md.expiresAt || new Date(Date.now() + 30 * 86400000).toISOString(),
        sponsored_category: md.sponsoredCategory || null,
        selected_product_ids: selectedProductIds,
        discount_code_id: md.discountCodeId || null,
        discount_code_label: md.discountCodeLabel || null,
      }]).select('*').maybeSingle();

      if (rebuildErr || !rebuilt) {
        console.error('❌ verify-promo: impossibile ricostruire la promozione per session', sessionId, rebuildErr?.message);
        return c.json({ success: false, error: 'Pagamento ricevuto ma non è stato possibile registrare la promozione (' + (rebuildErr?.message || 'errore sconosciuto') + '). Contatta il supporto con questo codice: ' + sessionId }, 500);
      }
      console.log('♻️ verify-promo: promozione ricostruita dai metadati Stripe per session', sessionId);
      promo = rebuilt;
    }

    // Attiva la promozione (idempotente: se era già attiva non cambia nulla)
    await activatePromotion(supabase, sessionId);

    const { data: finalPromo } = await supabase.from('promotions').select('*').eq('stripe_session_id', sessionId).maybeSingle();
    return c.json({ success: true, promo: finalPromo || promo });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});

// ── SHIPPING: Notifica spedizione al cliente ──
app.post("/make-server-000b3cfb/notify-shipping", rateLimit(20, 60_000), async (c) => {
  try {
    const auth = await requireAuth(c);
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 401);

    const { orderItemId, trackingNumber, status } = await c.req.json();
    const supabase = getServiceClient();
    const { data: item } = await supabase.from("order_items").select("*, orders(shipping_email, shipping_name, order_number), products(name), vendors(profile_id)").eq("id", orderItemId).single();
    if (!item?.orders?.shipping_email) return c.json({ success: false, error: "Ordine non trovato" });

    // Solo il venditore proprietario di questa riga d'ordine (o un admin) può notificare la spedizione
    const ownerProfileId = (item.vendors as any)?.profile_id;
    let allowed = ownerProfileId === auth.userId;
    if (!allowed) {
      const { data: prof } = await supabase.from("profiles").select("user_type").eq("id", auth.userId).maybeSingle();
      allowed = (prof as any)?.user_type === "admin";
    }
    if (!allowed) return c.json({ success: false, error: "Non autorizzato per questo ordine" }, 403);

    const order = item.orders as any;
    const product = item.products as any;

    if (status === "shipped" && trackingNumber) {
      const shippingBestsellers = await getBestsellersForEmail(supabase, 3, item.product_id ? [item.product_id] : []);
      const shipLang = await getUserEmailLang(supabase, order.customer_id);
      await sendEmail(order.shipping_email, tr(EMAIL_TEXTS,'subjShipped',shipLang,{n:order.order_number}),
        shippingNotificationHtml(order.order_number, order.shipping_name, trackingNumber, undefined, shippingBestsellers, shipLang));
    }
    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});


// ── VENDOR: riepilogo fiscale — dati pronti per emettere fattura reale ──
// Non genera una fattura fiscale vera (serve un fornitore di fatturazione
// elettronica dedicato per quello, vedi discussione) — restituisce, ordine
// per ordine, tutti i dati già calcolati e corretti (imponibile, aliquota,
// IVA, natura dell'esenzione) che il venditore o il suo commercialista
// usano per emettere la fattura vera senza dover ricalcolare nulla a mano.
app.get("/make-server-000b3cfb/vendor/fiscal-summary", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) return c.json({ success: false, error: "Token non valido" }, 401);

    const supabase = getServiceClient();
    const vendor = await getVendorByProfileId(supabase, user.id, "id, business_name, vat_id, fiscal_country");
    if (!vendor) return c.json({ success: false, error: "Vendor non trovato" }, 404);

    // Solo ordini effettivamente pagati (mai quelli ancora "pending", che
    // potrebbero non concludersi mai) — includiamo anche i rimborsati perché
    // servono comunque note di credito collegate alla fattura originale.
    // Chiediamo fiscalLimit + 1 righe: se ne torna una in più sappiamo che
    // i dati sono incompleti e possiamo dirlo esplicitamente al venditore,
    // invece di consegnargli un riepilogo parziale che sembra completo.
    const fiscalLimit = Math.min(Number(c.req.query("limit")) || 2000, 5000);
    const { data: items, error } = await supabase
      .from("order_items")
      .select(`
        id, quantity, price, vat_rate, vat_amount, reverse_charge, shipping_amount,
        products(name),
        orders!inner(id, order_number, created_at, status, shipping_name, shipping_address, customer_id)
      `)
      .eq("vendor_id", (vendor as any).id)
      .in("orders.status", ["processing", "shipped", "delivered", "refunded", "partially_refunded"])
      .order("created_at", { ascending: false, foreignTable: "orders" })
      // CORRETTEZZA FISCALE (audit scalabilità): questa query non aveva
      // limite, e PostgREST tronca a 1000 righe senza errore — su un
      // riepilogo usato per emettere fatture reali significa che alcune
      // righe d'ordine sparivano dal calcolo IVA in silenzio. Qui il
      // troncamento silenzioso non è solo un problema di prestazioni: è un
      // problema fiscale. Ora il limite è esplicito e il chiamante viene
      // avvisato (truncated, sotto) quando i dati NON sono completi, così
      // non si emette una fattura su un riepilogo parziale credendolo intero.
      .limit(fiscalLimit + 1);
    if (error) throw new Error(error.message);

    // Se è tornata la riga in più che avevamo chiesto apposta, i dati sono
    // troncati: lo diciamo al chiamante e scartiamo quella riga extra, che
    // altrimenti finirebbe nei totali senza appartenere alla pagina.
    const fiscalTruncated = (items || []).length > fiscalLimit;
    const fiscalItems = fiscalTruncated ? (items || []).slice(0, fiscalLimit) : (items || []);

    // Dati anagrafici/fiscali del cliente per ogni ordine coinvolto — servono
    // per intestare correttamente la fattura (ragione sociale + P.IVA reali,
    // non solo nome e indirizzo di spedizione).
    const customerIds = [...new Set(fiscalItems.map((i: any) => (i.orders as any)?.customer_id).filter(Boolean))];
    const { data: customerProfiles } = customerIds.length > 0
      ? await supabase.from("profiles").select("id, partita_iva, ragione_sociale, nome, cognome, codice_fiscale, pec, codice_sdi").in("id", customerIds)
      : { data: [] as any[] };
    const profileMap: Record<string, any> = {};
    (customerProfiles || []).forEach((p: any) => { profileMap[p.id] = p; });

    const byOrder: Record<string, any> = {};
    for (const item of fiscalItems) {
      const o = item.orders as any;
      if (!byOrder[o.id]) {
        const cp = profileMap[o.customer_id] || {};
        byOrder[o.id] = {
          orderId: o.id,
          orderNumber: o.order_number,
          date: o.created_at,
          status: o.status,
          customerName: cp.ragione_sociale || `${cp.nome || ""} ${cp.cognome || ""}`.trim() || o.shipping_name,
          customerVat: cp.partita_iva || null,
          customerCodiceFiscale: cp.codice_fiscale || null,
          customerPec: cp.pec || null,
          customerCodiceSdi: cp.codice_sdi || null,
          // Ripulito da email/telefono: per emettere fattura servono
          // ragione sociale, P.IVA e indirizzo, non i contatti diretti.
          customerAddress: sanitizeAddressForVendor(o.shipping_address),
          items: [] as any[],
          netTotal: 0, vatTotal: 0, grossTotal: 0,
        };
      }
      // I prezzi sono NETTI: l'imponibile è prezzo × quantità (più la quota
      // di spedizione, che è accessoria alla cessione e va in fattura con la
      // stessa aliquota della merce), e il lordo si ottiene SOMMANDO l'IVA.
      // Prima si faceva l'opposto — si scorporava l'imposta dal prezzo — e
      // lasciarlo così avrebbe prodotto imponibili sottostimati del 22% su
      // ogni fattura emessa dai venditori.
      const netGoodsLine = Math.round(Number(item.price) * Number(item.quantity) * 100) / 100;
      const netShippingLine = Math.round(Number(item.shipping_amount || 0) * 100) / 100;
      const net = Math.round((netGoodsLine + netShippingLine) * 100) / 100;
      const vat = Number(item.vat_amount || 0);
      const gross = Math.round((net + vat) * 100) / 100;
      byOrder[o.id].items.push({
        name: (item.products as any)?.name || "Prodotto",
        quantity: item.quantity,
        unitPrice: Number(item.price),
        // BUG TROVATO: qui il null veniva convertito in 0 con "|| 0",
        // rendendo indistinguibile "IVA calcolata, risultato 0% (reverse
        // charge/esportazione)" da "IVA mai calcolata per questa riga"
        // (ordini creati prima che questa logica esistesse). Il frontend
        // faceva poi lo stesso — mostrando "0%" in entrambi i casi, un dato
        // fiscale fuorviante da usare per una fattura reale. Ora passiamo il
        // dato grezzo (vatRate può essere null) più un flag esplicito.
        net, vat, vatRate: item.vat_rate === null ? null : Number(item.vat_rate),
        vatMissing: item.vat_rate === null,
        reverseCharge: !!item.reverse_charge,
      });
      byOrder[o.id].netTotal += net;
      byOrder[o.id].vatTotal += vat;
      byOrder[o.id].grossTotal += gross;
    }
    const orders = Object.values(byOrder).map((o: any) => ({
      ...o,
      netTotal: Math.round(o.netTotal * 100) / 100,
      vatTotal: Math.round(o.vatTotal * 100) / 100,
      grossTotal: Math.round(o.grossTotal * 100) / 100,
    }));

    return c.json({
      success: true,
      vendorVat: (vendor as any).vat_id,
      orders,
      // true = ci sono altre righe d'ordine oltre a queste. Il frontend DEVE
      // avvisare il venditore, altrimenti emetterebbe fatture su un
      // riepilogo parziale credendolo completo.
      truncated: fiscalTruncated,
      limit: fiscalLimit,
    });
  } catch (e: any) {
    console.error("❌ vendor/fiscal-summary:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── ADMIN: report mensile commissioni per venditore — dati pronti per
// emettere la fattura mensile di Oralzon verso ciascun venditore ──
app.get("/make-server-000b3cfb/admin/commission-report", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const supabase = getServiceClient();
    const auth = await requireAdmin(supabase, authHeader.replace("Bearer ", ""));
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 403);

    const month = c.req.query("month"); // formato "YYYY-MM", opzionale
    let query = supabase.from("vendor_transfers")
      .select("vendor_id, commission_amount, created_at, vendors(business_name, vat_id, fiscal_country, address_street, address_city, address_postal_code, pec, codice_sdi)")
      .eq("status", "completed");
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map(Number);
      const start = new Date(Date.UTC(y, m - 1, 1)).toISOString();
      const end = new Date(Date.UTC(y, m, 1)).toISOString();
      query = query.gte("created_at", start).lt("created_at", end);
    }
    const { data: transfers, error } = await query;
    if (error) throw new Error(error.message);

    const byVendor: Record<string, any> = {};
    for (const t of transfers || []) {
      const v = t.vendors as any;
      if (!byVendor[t.vendor_id]) {
        byVendor[t.vendor_id] = {
          vendorId: t.vendor_id,
          businessName: v?.business_name || "Venditore",
          vat: v?.vat_id || null,
          country: v?.fiscal_country || "IT",
          address: [v?.address_street, v?.address_city, v?.address_postal_code].filter(Boolean).join(", "),
          pec: v?.pec || null,
          codiceSdi: v?.codice_sdi || null,
          commissionTotal: 0,
          transferCount: 0,
        };
      }
      byVendor[t.vendor_id].commissionTotal += Number(t.commission_amount || 0);
      byVendor[t.vendor_id].transferCount += 1;
    }
    const rows = Object.values(byVendor).map((r: any) => ({ ...r, commissionTotal: Math.round(r.commissionTotal * 100) / 100 }));

    return c.json({ success: true, month: month || null, rows });
  } catch (e: any) {
    console.error("❌ admin/commission-report:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── GET VENDOR ORDERS (bypassa RLS usando service role) ──
app.get("/make-server-000b3cfb/vendor/orders", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);

    // Verifica il token dell'utente
    const userToken = authHeader.replace("Bearer ", "");
    const userSupabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await userSupabase.auth.getUser(userToken);
    if (userError || !user) return c.json({ success: false, error: "Token non valido" }, 401);

    // Usa service role per bypassare RLS
    const supabase = getServiceClient();

    // Trova il vendor dell'utente (query robusta, resistente a righe duplicate)
    const vendor = await getVendorByProfileId(supabase, user.id, "id, business_name");

    if (!vendor) return c.json({ success: false, error: "Vendor non trovato" }, 404);

    // Leggi gli ordini con service role (bypassa RLS)
    const { data: items, error } = await supabase
      .from("order_items")
      .select(`
        id, order_id, product_id, product_name, quantity, price, shipping_status, tracking_number, carrier, stock_shortfall,
        products(name, images),
        orders!inner(order_number, status, created_at, shipping_name, shipping_address, total_amount)
      `)
      .eq("vendor_id", vendor.id)
      // BUG GRAVE CORRETTO: mancava qualsiasi filtro sullo stato
      // dell'ordine, quindi comparivano anche gli ordini MAI PAGATI
      // (status 'pending': checkout aperto e abbandonato). Il venditore li
      // vedeva identici a quelli veri e poteva spedire merce per cui non
      // avrebbe mai ricevuto un euro. !inner perche' serve escludere la
      // riga, non solo svuotarne i dati ordine.
      .in("orders.status", PAID_ORDER_STATUSES)
      .order("created_at", { ascending: false, foreignTable: "orders" })
      // PERFORMANCE/CORRETTEZZA (audit scalabilità): questa query non aveva
      // né limite né paginazione. PostgREST tronca di default a 1000 righe
      // SENZA restituire errore: un venditore con più di 1000 righe d'ordine
      // si vedeva sparire le più vecchie dalla dashboard, in silenzio, senza
      // che né lui né noi ce ne accorgessimo. Limite esplicito e alzabile
      // via querystring, così il troncamento è una scelta nostra e
      // documentata invece di un effetto collaterale invisibile.
      .limit(Math.min(Number(c.req.query("limit")) || 500, 1000));

    if (error) throw new Error(error.message);

    // SICUREZZA/ANTI-DISINTERMEDIAZIONE: il venditore riceve nome e indirizzo
    // di spedizione (indispensabili per scrivere fisicamente il pacco — non
    // possono essere oscurati finché la spedizione è gestita direttamente da
    // lui, non da un aggregatore centralizzato), ma MAI email o telefono del
    // cliente: non servono per spedire, e sono l'unico canale rimasto per
    // contattarlo fuori piattaforma dopo l'acquisto.
    const sanitizedItems = (items || []).map((item: any) => {
      if (item.orders?.shipping_address) {
        item.orders = { ...item.orders, shipping_address: sanitizeAddressForVendor(item.orders.shipping_address) };
      }
      return item;
    });

    return c.json({ success: true, items: sanitizedItems, vendorId: vendor.id });
  } catch (e: any) {
    console.error("❌ vendor/orders:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── GET CUSTOMER ORDERS (bypassa RLS usando service role) ──
app.get("/make-server-000b3cfb/customer/orders", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);

    const userToken = authHeader.replace("Bearer ", "");
    const userSupabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await userSupabase.auth.getUser(userToken);
    if (userError || !user) return c.json({ success: false, error: "Token non valido" }, 401);

    const supabase = getServiceClient();

    const { data: orders, error } = await supabase
      .from("orders")
      .select("*, order_items(*, products(name, images), returns(id, status), vendors(id, business_name, vat_id, fiscal_country, vies_validated, address_street, address_city, address_region, address_postal_code))")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })
      // Stesso motivo di vendor/orders: senza limite esplicito PostgREST
      // troncava a 1000 in silenzio e il cliente perdeva lo storico più
      // vecchio senza alcun avviso.
      .limit(Math.min(Number(c.req.query("limit")) || 200, 500));

    if (error) throw new Error(error.message);

    return c.json({ success: true, orders: orders || [] });
  } catch (e: any) {
    console.error("❌ customer/orders:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});


// ── CLIENTE: conferma ricezione ordine → sblocca il trasferimento al venditore ──
app.post("/make-server-000b3cfb/customer/confirm-delivery", async (c) => {
  try {
    const auth = await requireAuth(c);
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 401);

    const { orderItemId } = await c.req.json();
    if (!orderItemId) return c.json({ success: false, error: "orderItemId mancante" }, 400);

    const supabase = getServiceClient();
    const { data: item } = await supabase.from("order_items")
      .select("id, shipping_status, orders(customer_id)").eq("id", orderItemId).maybeSingle();
    if (!item) return c.json({ success: false, error: "Articolo non trovato" }, 404);
    if ((item.orders as any)?.customer_id !== auth.userId) return c.json({ success: false, error: "Non autorizzato" }, 403);
    if (item.shipping_status !== "shipped") return c.json({ success: false, error: "L'articolo non risulta ancora spedito" }, 400);

    await supabase.from("order_items").update({
      shipping_status: "delivered",
      delivered_at: new Date().toISOString(),
    }).eq("id", orderItemId);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (stripeKey) {
      const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });
      const result = await createTransferForOrderItem(supabase, stripe, orderItemId);
      if (!result.ok) console.warn(`⚠️ Trasferimento in sospeso per item ${orderItemId}: ${result.reason}`);
    }

    return c.json({ success: true });
  } catch (e: any) {
    console.error("❌ customer/confirm-delivery:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── SISTEMA: conferma automatica consegna dopo N giorni + trasferimenti in
// sospeso (venditori che hanno completato Connect dopo la spedizione) ──
// Pensato per essere chiamato da un job schedulato (pg_cron), non dal
// frontend: richiede l'header Authorization con un secret DEDICATO
// (CRON_SECRET, da impostare tu stesso — vedi CRON_SETUP.sql), non la
// service_role key. Un secret a scopo unico è più sicuro (se dovesse
// trapelare, il danno massimo è "qualcuno forza il job in anticipo", non
// accesso completo al database) ed elimina ogni ambiguità tra il valore
// mostrato in dashboard e quello effettivamente iniettato a runtime.
app.post("/make-server-000b3cfb/system/process-pending-transfers", async (c) => {
  try {
    const authHeader = c.req.header("Authorization") || "";
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return c.json({ success: false, error: "Non autorizzato" }, 401);
    }

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return c.json({ success: false, error: "Stripe non configurato" }, 500);
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });
    const supabase = getServiceClient();

    // Traccia questa esecuzione. Serve perche' cron.job_run_details riporta
    // "succeeded" dopo 11ms misurando solo l'ACCODAMENTO della richiesta
    // (pg_net e' asincrono), non il suo esito: un 401 per secret sbagliato
    // risulterebbe comunque "succeeded". E net._http_response, che contiene
    // la risposta vera, viene ripulito dopo poche ore. Senza questo registro
    // un job rotto resterebbe invisibile finche' un venditore non reclama
    // soldi mai arrivati -- ed e' l'automazione che muove i pagamenti.
    const jobStart = Date.now();
    let jobRunId: string | null = null;
    try {
      const { data: runRow } = await supabase.from("system_job_runs")
        .insert([{ job_name: "process-pending-transfers" }]).select("id").single();
      jobRunId = runRow?.id || null;
    } catch { /* il registro non deve mai impedire al job di girare */ }

    // 1. Auto-conferma consegna per articoli spediti da abbastanza tempo senza
    // contestazioni aperte (nessun reso in stato diverso da 'rejected'). La
    // finestra non è più fissa per tutti: dipende dalla zona tra il paese del
    // venditore e quello del cliente (nazionale IT / UE / extra-UE) — una
    // spedizione internazionale ha bisogno di più tempo prima che sia
    // ragionevole presumere che sia arrivata, altrimenti si rischia di
    // sbloccare il pagamento al venditore prima che il pacco sia arrivato
    // davvero. Recuperiamo tutti gli articoli spediti (senza filtro data lato
    // SQL, perché la soglia varia riga per riga) e filtriamo qui.
    const { data: allShipped, error: shippedQueryError } = await supabase
      .from("order_items")
      .select("id, shipped_at, created_at, returns(status), vendors(fiscal_country), orders(shipping_address)")
      .eq("shipping_status", "shipped");
    // BUG TROVATO IN TEST: la versione precedente selezionava una colonna
    // "updated_at" che non esiste su order_items (esiste solo "shipped_at"),
    // e l'errore veniva ignorato in silenzio perché non si controllava mai
    // la variabile "error" — la richiesta falliva, l'endpoint continuava
    // comunque e rispondeva "successo" con 0 conferme fatte, senza segnalare
    // nulla per mesi. Logghiamo sempre l'errore da ora in poi.
    if (shippedQueryError) console.error("❌ process-pending-transfers — query articoli spediti fallita:", shippedQueryError.message);

    const now = Date.now();
    const toAutoConfirm = (allShipped || []).filter((item: any) => {
      const vendorCountry = (item.vendors as any)?.fiscal_country || "IT";
      const customerCountry = (item.orders as any)?.shipping_address?.country || "IT";
      const zone = shippingZoneBetween(vendorCountry, customerCountry);
      // Zona nulla (ordine storico verso l'extra-UE, prima che la piattaforma
      // diventasse solo-UE): usiamo la finestra più prudente disponibile
      // invece di far esplodere il job con un accesso undefined.
      const days = zone ? ZONE_AUTO_CONFIRM_DAYS[zone] : ZONE_AUTO_CONFIRM_DAYS.UE;
      // shipped_at non era mai stata valorizzata prima di questo fix: per le
      // righe già spedite in passato (shipped_at ancora null) usiamo
      // created_at come riferimento più prudente disponibile, così non
      // restano bloccate per sempre in attesa di un dato che non arriverà mai.
      const referenceDate = item.shipped_at || item.created_at;
      const cutoffMs = new Date(referenceDate).getTime() + days * 24 * 60 * 60 * 1000;
      return now >= cutoffMs;
    });

    // In parallelo: sono aggiornamenti indipendenti riga per riga, farli in
    // sequenza sommerebbe inutilmente la latenza di rete di ciascuno.
    const autoConfirmResults = await Promise.all((toAutoConfirm || []).map(async (item: any) => {
      const hasOpenReturn = (item.returns || []).some((r: any) => r.status && r.status !== 'rejected');
      if (hasOpenReturn) return false; // reso in corso: non sbloccare il trasferimento
      await supabase.from("order_items").update({
        shipping_status: "delivered",
        delivered_at: new Date().toISOString(),
      }).eq("id", item.id);
      return true;
    }));
    const autoConfirmed = autoConfirmResults.filter(Boolean).length;

    // 2. Prova a trasferire tutti gli articoli consegnati senza ancora un
    // transfer_id (copre sia quelli appena auto-confermati sopra, sia i
    // venditori che hanno completato l'onboarding Connect dopo la consegna).
    // Anche qui in parallelo: ogni trasferimento fa 2 chiamate Stripe in
    // sequenza (recupero pagamento + creazione transfer) — farlo articolo per
    // articolo in serie è ciò che ha causato il timeout dei 5s di pg_net con
    // anche solo un paio di elementi in coda.
    const { data: toTransfer } = await supabase
      .from("order_items")
      .select("id")
      .eq("shipping_status", "delivered")
      .is("transfer_id", null);

    const transferResults = await Promise.all(
      (toTransfer || []).map((item: any) => createTransferForOrderItem(supabase, stripe, item.id))
    );
    const transferred = transferResults.filter(r => r.ok).length;
    const stillPending = transferResults.length - transferred;

    // Ordini abbandonati: un checkout aperto e mai pagato resta 'pending'
    // per sempre. Le sessioni Stripe scadono dopo 24 ore, quindi oltre
    // quella soglia il pagamento non potra' piu' arrivare e tenerli in
    // vita significa solo sporcare storico cliente e statistiche.
    // Li marchiamo 'cancelled' invece di eliminarli: restano tracciabili
    // se un cliente chiede conto di un tentativo di acquisto, e nessun
    // dato sparisce in modo irreversibile.
    let cancelledAbandoned = 0;
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: abandoned } = await supabase.from("orders")
        .update({ status: "cancelled" })
        .eq("status", "pending")
        .lt("created_at", cutoff)
        .select("id");
      cancelledAbandoned = (abandoned || []).length;
      if (cancelledAbandoned > 0) console.log(`\u{1F9F9} Annullati ${cancelledAbandoned} ordini abbandonati (mai pagati, oltre 24h)`);
    } catch (cleanupErr: any) {
      console.error("\u274c Pulizia ordini abbandonati:", cleanupErr.message);
    }

    // Scadenze: sponsorizzazioni pagate e periodi di prova. Senza questo
    // passaggio nessuno rimetteva mai a false is_sponsored alla scadenza
    // (si pagava una volta e si restava in cima per sempre) e nessuno
    // leggeva trial_ends_at lato server (si vendeva per sempre gratis).
    // Preavvisi di scadenza prova. Inviati PRIMA di applicare le scadenze,
    // cosi' l'ultimo avviso e la sospensione avvengono nella stessa
    // esecuzione: il venditore riceve la comunicazione nel momento esatto
    // in cui il blocco diventa effettivo, non un giorno dopo.
    let trialNotices = { warned: 0, expiredNotice: 0, suspendedNotice: 0 };
    try {
      const { data: trialVendors } = await supabase.from("vendors")
        .select("id, business_name, profile_id, trial_ends_at, trial_notice_stage")
        .eq("plan_type", "trial")
        .eq("plan_status", "active")
        .not("trial_ends_at", "is", null)
        .lt("trial_notice_stage", 3)
        .lt("trial_ends_at", new Date(Date.now() + 7 * 86400000).toISOString());

      for (const tv of trialVendors || []) {
        const endsAt = new Date(tv.trial_ends_at).getTime();
        const now = Date.now();
        // Stadio spettante ADESSO. Si calcola sempre quello massimo
        // raggiunto: se il job non gira per qualche giorno non si inviano
        // tutti gli avviso arretrati in fila, si manda solo l'attuale.
        let stage = 0;
        if (now >= endsAt + 7 * 86400000) stage = 3;
        else if (now >= endsAt + 2 * 86400000) stage = 2;
        else if (now >= endsAt - 7 * 86400000) stage = 1;
        if (stage === 0 || stage <= tv.trial_notice_stage) continue;

        const { data: prof } = await supabase.from("profiles")
          .select("email, nome").eq("id", tv.profile_id).maybeSingle();
        if (!prof?.email) continue;

        const name = prof.nome || tv.business_name || "Venditore";
        const endStr = trialNoticeDate(tv.trial_ends_at);
        const blockStr = trialNoticeDate(new Date(endsAt + 7 * 86400000).toISOString());

        if (stage === 1) {
          await sendEmail(prof.email, `Il periodo di prova termina il ${endStr}`, trialEndingSoonHtml(name, tv.business_name, endStr));
          trialNotices.warned++;
        } else if (stage === 2) {
          await sendEmail(prof.email, `Periodo di prova terminato — attivo fino al ${blockStr}`, trialExpiredHtml(name, tv.business_name, endStr, blockStr));
          trialNotices.expiredNotice++;
        } else {
          await sendEmail(prof.email, `Vendite sospese — ${tv.business_name}`, trialSuspendedHtml(name, tv.business_name, endStr));
          trialNotices.suspendedNotice++;
        }
        await supabase.from("vendors").update({ trial_notice_stage: stage }).eq("id", tv.id);
      }
    } catch (noticeErr: any) {
      console.error("\u274c Invio preavvisi scadenza prova:", noticeErr.message);
    }

    let expiry = { promo_products: 0, promo_vendors: 0, promotions_closed: 0, trials_expired: 0 };
    try {
      const { data: expiryData, error: expiryErr } = await supabase.rpc("expire_promotions_and_trials");
      if (expiryErr) throw new Error(expiryErr.message);
      if (expiryData && expiryData[0]) expiry = expiryData[0];
      if (expiry.promo_products || expiry.trials_expired) {
        console.log(`\u{1F4C5} Scadenze applicate: ${expiry.promo_products} prodotti de-sponsorizzati, ${expiry.trials_expired} prove terminate`);
      }
    } catch (expErr: any) {
      console.error("\u274c Applicazione scadenze:", expErr.message);
    }

    const jobResult = { autoConfirmed, transferred, stillPending, cancelledAbandoned, expiry, trialNotices };
    if (jobRunId) {
      try {
        await supabase.from("system_job_runs").update({
          finished_at: new Date().toISOString(),
          ok: true,
          result: jobResult,
          duration_ms: Date.now() - jobStart,
        }).eq("id", jobRunId);
      } catch { /* il registro non deve mai far fallire il job */ }
    }

    return c.json({ success: true, ...jobResult });
  } catch (e: any) {
    console.error("\u274c system/process-pending-transfers:", e);
    // Registra anche il fallimento: e' proprio il caso che vogliamo vedere.
    try {
      const sb = getServiceClient();
      await sb.from("system_job_runs").insert([{
        job_name: "process-pending-transfers",
        finished_at: new Date().toISOString(),
        ok: false,
        error: e.message,
      }]);
    } catch { /* nulla da fare se nemmeno questo riesce */ }
    return c.json({ success: false, error: e.message }, 500);
  }
});

app.post("/make-server-000b3cfb/vendor/update-shipping", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const userToken = authHeader.replace("Bearer ", "");
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(userToken);
    if (userError || !user) return c.json({ success: false, error: "Token non valido" }, 401);

    const supabase = getServiceClient();
    const { itemId, status, trackingNumber, carrier } = await c.req.json();
    if (!itemId || !status) return c.json({ success: false, error: "Dati mancanti" }, 400);

    // Verifica che l'item appartenga al vendor dell'utente
    const { data: item } = await supabase.from("order_items")
      .select("id, vendor_id, vendors(profile_id)")
      .eq("id", itemId).single();
    if (!item) return c.json({ success: false, error: "Item non trovato" }, 404);
    if ((item.vendors as any)?.profile_id !== user.id)
      return c.json({ success: false, error: "Non autorizzato" }, 403);

    const updateData: any = { shipping_status: status };
    if (trackingNumber) updateData.tracking_number = trackingNumber;
    if (carrier) updateData.carrier = carrier;
    // BUG TROVATO IN TEST: shipped_at non veniva mai valorizzata da nessuna
    // parte del codice, rendendo impossibile calcolare da quando un articolo
    // è davvero in viaggio — il timer di conferma automatica (7/15/21 giorni
    // a seconda della zona) dipende esattamente da questo dato.
    if (status === "shipped") updateData.shipped_at = new Date().toISOString();

    const { error: updateErr } = await supabase.from("order_items")
      .update(updateData).eq("id", itemId);
    if (updateErr) throw new Error(updateErr.message);

    // Invia email tracking se spedito
    if (status === "shipped" && trackingNumber) {
      try {
        const { data: orderData } = await supabase
          .from("order_items").select("product_id, orders(order_number, shipping_email, shipping_name, customer_id)").eq("id", itemId).single();
        const order = (orderData as any)?.orders;
        if (order?.shipping_email) {
          const shippingBestsellers = await getBestsellersForEmail(supabase, 3, (orderData as any)?.product_id ? [(orderData as any).product_id] : []);
          const shipLang2 = await getUserEmailLang(supabase, order.customer_id);
          await sendEmail(order.shipping_email,
            tr(EMAIL_TEXTS,'subjShipped',shipLang2,{n:order.order_number}),
            shippingNotificationHtml(order.order_number, order.shipping_name, trackingNumber, carrier, shippingBestsellers, shipLang2)
          );
        }
      } catch (emailErr) { console.warn("Email tracking fallita:", emailErr); }
    }

    return c.json({ success: true });
  } catch (e: any) {
    console.error("❌ update-shipping:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});


// ── GET / UPDATE VENDOR PROFILE (per dati mittente etichette) ─
app.get("/make-server-000b3cfb/vendor/profile", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) return c.json({ success: false, error: "Token non valido" }, 401);
    const supabase = getServiceClient();
    const vendor = await getVendorByProfileId(supabase, user.id, "*");
    return c.json({ success: true, vendor });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});

// ── Moderazione automatica logo/foto profilo venditore ──
// ATTENZIONE - CODICE ATTUALMENTE NON RAGGIUNGIBILE DAL FRONTEND:
// logo e descrizione negozio sono stati RIMOSSI dalla piattaforma per
// scelta anti-disintermediazione (erano i punti in cui si tentava piu'
// spesso di inserire contatti diretti per portare il cliente fuori dal
// marketplace). Non esiste piu' alcun upload di logo nelle impostazioni
// venditore, e /vendor/check-logo non viene chiamato da nessuna pagina.
// Questa funzione e l'endpoint restano solo come rete di sicurezza nel
// caso in cui logo_url venga comunque valorizzato via API diretta, e
// pronti se un giorno la funzionalita' venisse reintrodotta.
// NON dedurre da questo codice che i venditori abbiano un logo: non ce
// l'hanno (errore in cui si e' gia' caduti scrivendo la documentazione
// Academy, poi corretto).
// Molti tentano di aggirare il divieto di contatti diretti scrivendo
// telefono/email/WhatsApp DENTRO l'immagine del logo invece che nel testo
// del profilo — un controllo puramente testuale non lo vedrebbe mai. Usiamo
// Claude in visione per leggere l'immagine prima di accettarla. Ritorna
// sempre { ok: true } in caso di errore tecnico (chiave mancante, API down,
// ecc.) — non blocchiamo mai il salvataggio del profilo per un problema
// nostro di infrastruttura, solo per un contenuto realmente rilevato.
async function moderateLogoImage(imageUrl: string): Promise<{ ok: boolean; reason?: string }> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) return { ok: true };

  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return { ok: true }; // immagine non raggiungibile: non blocchiamo per questo
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const buffer = await imgRes.arrayBuffer();
    // Limite di sicurezza: non passiamo a Claude immagini enormi (costo/tempo) —
    // il logo è comunque già compresso in upload, questo è solo un tetto residuo.
    if (buffer.byteLength > 8 * 1024 * 1024) return { ok: true };
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: contentType, data: base64 } },
            { type: "text", text: `Questa è l'immagine del logo/foto profilo di un venditore su un marketplace B2B. Verifica se l'immagine contiene, scritto visibilmente nel testo dell'immagine stessa, uno o più di questi elementi: numero di telefono, indirizzo email, handle WhatsApp/Telegram, o l'indirizzo di un altro sito web/marketplace (diverso da semplici social media come Instagram/Facebook citati come icona). Rispondi SOLO con un oggetto JSON valido, nessun testo prima o dopo: {"containsContactInfo": true/false, "reason": "breve spiegazione in italiano, o stringa vuota se non trovato"}` },
          ],
        }],
      }),
    });
    if (!res.ok) { console.warn("⚠️ Moderazione logo — API Anthropic ha risposto", res.status); return { ok: true }; }
    const data = await res.json();
    const text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (parsed.containsContactInfo) return { ok: false, reason: parsed.reason || "L'immagine sembra contenere informazioni di contatto." };
    return { ok: true };
  } catch (e: any) {
    console.warn("⚠️ Moderazione logo fallita, salvataggio consentito per non bloccare il venditore:", e.message);
    return { ok: true };
  }
}

// ── VENDOR: verifica il logo/foto profilo prima di salvarlo — vedi
// moderateLogoImage() sopra. Endpoint dedicato perché VendorSettings.tsx
// salva il resto del profilo con un update diretto a Supabase (non passa
// da /vendor/profile), quindi il controllo va richiamato esplicitamente
// da lì prima di procedere col salvataggio. ──
app.post("/make-server-000b3cfb/vendor/check-logo", async (c) => {
  try {
    const auth = await requireAuth(c);
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 401);

    const { imageUrl } = await c.req.json();
    if (!imageUrl) return c.json({ success: false, error: "imageUrl mancante" }, 400);

    const check = await moderateLogoImage(imageUrl);
    if (!check.ok) return c.json({ success: false, error: `Immagine non accettata: ${check.reason} Rimuovi contatti diretti dal logo e riprova.` });

    return c.json({ success: true });
  } catch (e: any) {
    console.error("❌ vendor/check-logo:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

app.post("/make-server-000b3cfb/vendor/profile", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const token = authHeader.replace("Bearer ", "");
    const anonClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(token);
    if (!user) return c.json({ success: false, error: "Token non valido" }, 401);
    const supabase = getServiceClient();
    const body = await c.req.json();

    // Se il venditore sta caricando un logo NUOVO (diverso da quello già
    // salvato), verifichiamolo prima di accettarlo — non ha senso ricontrollare
    // ogni volta lo stesso identico logo già approvato in precedenza.
    if (body.logo_url) {
      const { data: current } = await supabase.from("vendors").select("logo_url").eq("profile_id", user.id).maybeSingle();
      if (body.logo_url !== (current as any)?.logo_url) {
        const check = await moderateLogoImage(body.logo_url);
        if (!check.ok) {
          return c.json({ success: false, error: `Immagine non accettata: ${check.reason} Rimuovi contatti diretti dal logo e riprova.` }, 400);
        }
      }
    }

    const { error } = await supabase.from("vendors").update(body).eq("profile_id", user.id);
    if (error) throw new Error(error.message);
    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});

// ── VIES: verifica P.IVA UE (cliente o venditore) ──
// Serve PRIMA di poter applicare il reverse charge su una vendita B2B
// intra-UE: per legge, il venditore deve verificare che la P.IVA del
// cliente sia effettivamente attiva per il commercio intra-UE prima di NON
// addebitare IVA — se applica il reverse charge su una P.IVA che risulta
// poi non valida, la responsabilità del versamento IVA ricade su di lui.
// Endpoint pubblico UE della Commissione Europea, nessuna chiave richiesta.
app.post("/make-server-000b3cfb/vies/validate", rateLimit(10, 60_000), async (c) => {
  try {
    const auth = await requireAuth(c);
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 401);

    const { country, vatNumber, target } = await c.req.json();
    if (!country || !vatNumber || !["profile", "vendor"].includes(target)) {
      return c.json({ success: false, error: "Dati mancanti" }, 400);
    }
    const cleanCountry = String(country).toUpperCase().trim();
    const cleanVat = String(vatNumber).replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (!cleanVat) return c.json({ success: false, error: "Numero P.IVA non valido" }, 400);

    let viesResult: any;
    try {
      const res = await fetch(`https://ec.europa.eu/taxation_customs/vies/rest-api/ms/${cleanCountry}/vat/${cleanVat}`);
      if (!res.ok) throw new Error(`VIES ha risposto con stato ${res.status}`);
      viesResult = await res.json();
    } catch (fetchErr: any) {
      // Il servizio VIES ha downtime frequenti (aggrega 27 sistemi
      // nazionali). Non validiamo MAI per difetto in caso di errore — se
      // non possiamo verificare, meglio dirlo chiaramente che presumere
      // una P.IVA valida che potrebbe non esserlo.
      console.error("❌ vies/validate — servizio VIES non raggiungibile:", fetchErr.message);
      return c.json({ success: false, error: "Il servizio VIES non è al momento raggiungibile. Riprova tra qualche minuto." }, 503);
    }

    const isValid = !!viesResult.isValid;
    const registeredName = viesResult.name && viesResult.name !== "---" ? viesResult.name : null;

    const supabase = getServiceClient();
    if (target === "profile") {
      await supabase.from("profiles").update({
        vies_validated: isValid, vies_validated_at: new Date().toISOString(), vies_registered_name: registeredName,
      }).eq("id", auth.userId);
    } else {
      const vendor = await getVendorByProfileId(supabase, auth.userId!, "id");
      if (!vendor) return c.json({ success: false, error: "Nessun profilo venditore trovato" }, 404);
      await supabase.from("vendors").update({
        vies_validated: isValid, vies_validated_at: new Date().toISOString(), vies_registered_name: registeredName,
      }).eq("id", (vendor as any).id);
    }

    return c.json({ success: true, valid: isValid, registeredName });
  } catch (e: any) {
    console.error("❌ vies/validate:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── CLIENTE: segnala un venditore (es. sollecitazione a comprare fuori piattaforma) ──
app.post("/make-server-000b3cfb/vendor/report", rateLimit(10, 60_000), async (c) => {
  try {
    const auth = await requireAuth(c);
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 401);

    const { vendorId, reason, description, orderId } = await c.req.json();
    if (!vendorId || !reason?.trim()) return c.json({ success: false, error: "Dati mancanti" }, 400);

    const supabase = getServiceClient();
    const { data: vendor } = await supabase.from("vendors").select("id, business_name").eq("id", vendorId).maybeSingle();
    if (!vendor) return c.json({ success: false, error: "Venditore non trovato" }, 404);

    const { data: report, error } = await supabase.from("vendor_reports").insert([{
      vendor_id: vendorId,
      customer_id: auth.userId,
      reason: reason.trim(),
      description: description?.trim() || null,
      order_id: orderId || null,
    }]).select().single();
    if (error) throw new Error(error.message);

    // Notifica admin via email — stessa casella già usata per il form di contatto pubblico
    await sendEmail("support@oralzon.com", `[Segnalazione venditore] ${vendor.business_name}`, `
      <p><strong>Venditore segnalato:</strong> ${vendor.business_name} (${vendorId})</p>
      <p><strong>Motivo:</strong> ${reason}</p>
      ${description ? `<p><strong>Dettagli:</strong></p><p style="white-space:pre-wrap;">${description}</p>` : ''}
      ${orderId ? `<p><strong>Ordine collegato:</strong> ${orderId}</p>` : ''}
      <p style="color:#6b7280;font-size:12px;">Segnalato da utente: ${auth.userId} (${auth.email || 'email non disponibile'})</p>
    `);

    return c.json({ success: true, report });
  } catch (e: any) {
    console.error("❌ vendor/report:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── Validazione codice sconto ──────────────────────────────
// Sostituisce la lettura diretta della tabella dal client, che era
// possibile grazie a una policy "chiunque puo' leggere i codici attivi":
// bastava un select per scaricarli TUTTI, non solo quello digitato.
// Qui rispondiamo solo sul codice richiesto e non esponiamo mai l'elenco.
app.post("/make-server-000b3cfb/discount/validate", rateLimit(20, 60_000), async (c) => {
  try {
    const auth = await requireAuth(c);
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 401);

    const { code, appliesTo } = await c.req.json();
    if (!code?.trim()) return c.json({ success: false, error: "Codice mancante" }, 400);

    const supabase = getServiceClient();
    const { data: found } = await supabase.from("discount_codes")
      .select("id, code, type, value, applies_to, vendor_id, product_ids, min_order_amount, max_uses, used_count, expires_at")
      .eq("code", code.trim().toUpperCase()).eq("is_active", true).maybeSingle();

    // Risposta volutamente identica per "non esiste" e "non piu' valido":
    // distinguerle permetterebbe di indovinare quali codici esistono
    // provandone tanti a caso.
    const invalid = { success: true, valid: false as const };
    if (!found) return c.json(invalid);
    if (found.expires_at && new Date(found.expires_at) < new Date()) return c.json(invalid);
    if (found.max_uses && found.used_count >= found.max_uses) return c.json(invalid);
    if (appliesTo && found.applies_to !== appliesTo && found.applies_to !== "both") return c.json(invalid);

    // Solo i dati che servono ad applicare lo sconto in interfaccia. Il
    // calcolo definitivo resta comunque server-side in create-checkout:
    // questo serve all'anteprima, non a decidere quanto si paga.
    return c.json({
      success: true, valid: true,
      code: found.code, type: found.type, value: Number(found.value),
      appliesTo: found.applies_to, vendorId: found.vendor_id,
      productIds: found.product_ids, minOrderAmount: found.min_order_amount,
    });
  } catch (e: any) {
    console.error("\u274c discount/validate:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── ADMIN: stato di salute dei job automatici ──
// system_job_runs ha RLS che nega ogni accesso ai client, quindi il dato
// deve passare da qui. Serve a rispondere a una domanda sola: il job
// notturno che paga i venditori ha girato, e com'e' andato?
app.get("/make-server-000b3cfb/admin/job-health", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const supabase = getServiceClient();
    const auth = await requireAdmin(supabase, authHeader.replace("Bearer ", ""));
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 403);

    const { data: health } = await supabase.from("system_job_health").select("*");
    const { data: recent } = await supabase.from("system_job_runs")
      .select("job_name, started_at, ok, result, error, duration_ms")
      .order("started_at", { ascending: false }).limit(10);

    return c.json({ success: true, health: health || [], recent: recent || [] });
  } catch (e: any) {
    console.error("\u274c admin/job-health:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── ADMIN: lista segnalazioni venditori ──
app.get("/make-server-000b3cfb/admin/vendor-reports", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const supabase = getServiceClient();
    const auth = await requireAdmin(supabase, authHeader.replace("Bearer ", ""));
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 403);

    const { data: reports, error } = await supabase.from("vendor_reports")
      .select("*, vendors(id, business_name), orders(order_number)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    return c.json({ success: true, reports: reports || [] });
  } catch (e: any) {
    console.error("❌ admin/vendor-reports:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── ADMIN: aggiorna stato di una segnalazione (revisionata / archiviata) ──
app.post("/make-server-000b3cfb/admin/vendor-reports/update-status", async (c) => {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader) return c.json({ success: false, error: "Non autorizzato" }, 401);
    const supabase = getServiceClient();
    const auth = await requireAdmin(supabase, authHeader.replace("Bearer ", ""));
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 403);

    const { reportId, status } = await c.req.json();
    if (!reportId || !["pending", "reviewed", "dismissed"].includes(status)) {
      return c.json({ success: false, error: "Dati non validi" }, 400);
    }

    const { error } = await supabase.from("vendor_reports").update({ status }).eq("id", reportId);
    if (error) throw new Error(error.message);

    return c.json({ success: true });
  } catch (e: any) {
    console.error("❌ admin/vendor-reports/update-status:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── REGISTER VENDOR (service role, bypassa RLS) ─────────────
app.post("/make-server-000b3cfb/register-vendor", rateLimit(5, 60_000), async (c) => {
  try {
    const { userId, businessName, trialEndsAt, promoCode } = await c.req.json();
    if (!userId || !businessName) return c.json({ success: false, error: "Dati mancanti" }, 400);

    const supabase = getServiceClient();

    // Verifica che l'utente esista in auth.users
    const { data: user } = await supabase.auth.admin.getUserById(userId);
    if (!user?.user) return c.json({ success: false, error: "Utente non trovato" }, 404);

    // Crea profilo se non esiste (con tutti i metadati)
    const meta = user.user.user_metadata || {};
    await supabase.from("profiles").upsert({
      id: userId,
      email: user.user.email,
      user_type: "venditore",
      nome: meta.nome || "",
      cognome: meta.cognome || "",
      telefono: meta.telefono || null,
      ragione_sociale: meta.ragione_sociale || businessName,
      partita_iva: meta.partita_iva || null,
    }, { onConflict: "id" });

    // SICUREZZA: la scadenza del trial viene SEMPRE calcolata qui, mai presa dal
    // client — altrimenti chiunque potrebbe inviare una data arbitraria e ottenere
    // un trial infinito. Il valore di trialEndsAt inviato dal frontend viene ignorato.
    let finalTrialEndsAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(); // 6 mesi di prova gratuita
    let promoApplied = false;
    let promoError: string | null = null;

    if (promoCode?.trim()) {
      const { data: promo } = await supabase.from("vendor_promo_codes")
        .select("*").eq("code", promoCode.trim().toUpperCase()).eq("active", true).maybeSingle();
      if (!promo) {
        promoError = "Codice non valido o scaduto";
      } else if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
        promoError = "Codice scaduto";
      } else if (promo.max_uses !== null && promo.used_count >= promo.max_uses) {
        promoError = "Codice esaurito";
      } else {
        finalTrialEndsAt = new Date(Date.now() + promo.extends_trial_days * 24 * 60 * 60 * 1000).toISOString();
        promoApplied = true;
        // Segna l'uso del codice DOPO aver creato il vendor (serve il suo id)
      }
    }

    // Crea vendor record
    const { data: newVendor, error: vendorError } = await supabase.from("vendors").insert([{
      profile_id: userId,
      business_name: businessName,
      plan_type: "trial",
      plan_status: "active",
      product_limit: 999999,
      verified_badge: false,
      commission_pct: 7.00,
      trial_ends_at: finalTrialEndsAt,
      fiscal_country: meta.fiscal_country || "IT",
      vat_id: meta.partita_iva || null,
      codice_fiscale: meta.codice_fiscale || null,
      pec: meta.pec || null,
      codice_sdi: meta.codice_sdi || null,
      address_street: meta.address_street || null,
      address_city: meta.address_city || null,
      address_region: meta.address_region || null,
      address_postal_code: meta.address_postal_code || null,
    }]).select().single();

    if (vendorError && vendorError.code !== "23505") {
      console.error("Vendor insert error:", vendorError.message);
      return c.json({ success: false, error: vendorError.message }, 500);
    }

    // Registra il riscatto del codice promo (best-effort, non blocca la registrazione se fallisce).
    // I codici promozionali restano: sono quelli creati dall'admin per
    // campagne di acquisizione. E' stato RIMOSSO il programma referral fra
    // venditori (codice personale generato a ogni registrazione, +30 giorni
    // di prova a chi invitava e a chi era invitato): scelta di prodotto,
    // non un problema tecnico.
    if (promoApplied && newVendor && promoCode?.trim()) {
      try {
        const { data: promo } = await supabase.from("vendor_promo_codes")
          .select("id").eq("code", promoCode.trim().toUpperCase()).single();
        if (promo) {
          await supabase.from("vendor_promo_redemptions").insert([{ promo_code_id: promo.id, vendor_id: newVendor.id }]);
          await supabase.rpc("increment_vendor_promo_usage", { p_promo_id: promo.id });
        }
      } catch (redeemErr) { console.warn("Registrazione riscatto promo fallita:", redeemErr); }
    }

    // Email di benvenuto venditore (solo se il vendor è stato appena creato, non su duplicate)
    if (!vendorError && user.user.email) {
      const displayName = meta.nome || businessName;
      await sendEmail(user.user.email, "Il tuo store Oralzon è attivo!", welcomeVendorHtml(displayName, businessName));
    }

    // 23505 = duplicate → vendor già esiste, ok
    return c.json({ success: true, promoApplied, promoError });
  } catch (e: any) {
    console.error("❌ register-vendor:", e);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── Sitemap dinamica ────────────────────────────────────────────────────
// BUG SERIO TROVATO IN AUDIT: la sitemap.xml precedente era un file statico
// scritto a mano — 137 riferimenti a hreflang="tr" (turco, rimosso dal sito
// da tempo), zero al polacco (aggiunto dopo), e soprattutto NESSUN prodotto,
// categoria o store venditore: solo pagine statiche e articoli blog. Con un
// catalogo che cresce, ogni prodotto nuovo restava invisibile a Google finché
// non veniva scoperto per caso tramite il crawling dei link interni.
//
// Questa route genera la sitemap AL VOLO ad ogni richiesta, sempre
// aggiornata: prodotti e store letti in diretta dal database, categorie e
// pagine statiche/blog da elenchi mantenuti qui. netlify.toml/_redirects
// inoltra le richieste a /sitemap.xml verso questa route.
const SITEMAP_LANGS = ["it", "en", "es", "fr", "de", "pt", "nl"]; // pl escluso: traduzioni blog/UI ancora incomplete, meglio non indicizzare contenuto a metà

const SITEMAP_STATIC_PAGES: { path: string; priority: string; changefreq: string }[] = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/negozio", priority: "0.9", changefreq: "daily" },
  { path: "/blog", priority: "0.7", changefreq: "weekly" },
  { path: "/offerte", priority: "0.8", changefreq: "daily" },
  { path: "/bestseller", priority: "0.8", changefreq: "daily" },
  { path: "/nuovi-arrivi", priority: "0.8", changefreq: "daily" },
  { path: "/diventa-venditore", priority: "0.7", changefreq: "monthly" },
  { path: "/pricing-venditori", priority: "0.6", changefreq: "monthly" },
  { path: "/chi-siamo", priority: "0.5", changefreq: "monthly" },
  { path: "/contatti", priority: "0.5", changefreq: "monthly" },
  { path: "/faq", priority: "0.5", changefreq: "monthly" },
  { path: "/metodi-pagamento", priority: "0.4", changefreq: "monthly" },
  { path: "/info-spedizione", priority: "0.4", changefreq: "monthly" },
  { path: "/resi", priority: "0.4", changefreq: "monthly" },
  { path: "/condizioni-vendita", priority: "0.3", changefreq: "yearly" },
  { path: "/termini", priority: "0.3", changefreq: "yearly" },
  { path: "/privacy", priority: "0.3", changefreq: "yearly" },
  { path: "/cookie", priority: "0.3", changefreq: "yearly" },
];

const SITEMAP_BLOG_SLUGS: string[] = [
  "guida-completa-igiene-orale-studio-dentistico",
  "importanza-pulizia-dentale-professionale",
  "strumenti-detartrasi-ultrasuoni",
  "protocolli-igiene-post-intervento",
  "prevenzione-carie-ruolo-fluoro-profilassi",
  "igiene-orale-pazienti-apparecchi-ortodontici",
  "scaling-root-planing-tecniche-avanzate-levigatura-radicolare",
  "educazione-paziente-igiene-orale-domiciliare",
  "air-polishing-profilassi-dentale-professionale",
  "gestione-ipersensibilita-dentinale-studio",
  "strumenti-manuali-vs-ultrasonici-detartrasi",
  "protocollo-richiamo-igiene-orale",
  "guida-protesi-dentarie-fisse-mobili-impianti",
  "corone-dentali-materiali-criteri-scelta",
  "monconi-protesici-tecniche-preparazione-gestione",
  "protesi-totale-tecniche-moderne-costruzione",
  "ponti-dentali-tipologie-applicazioni-cliniche",
  "protesi-removibili-scheletrate-design-adattamento",
  "impronta-dentale-tecniche-digitali-tradizionali",
  "provvisori-protesici-realizzazione-gestione-temporanea",
  "cementazione-protesi-fisse-cementi-protocolli",
  "ribasatura-protesi-mobili-quando-come",
  "faccette-dentali-ceramica-indicazioni-procedura",
  "protesi-digitale-cadcam-futuro-odontoiatria-protesica",
  "guida-completa-impianti-dentali",
  "impianti-zigomatici-grave-atrofia-ossea",
  "all-on-4-riabilitazione-completa-quattro-impianti",
  "protocolli-mantenimento-impianti-dentali",
  "sbiancamento-dentale-professionale-guida-completa",
  "sbiancamento-domiciliare-mascherine-personalizzate",
  "perossido-idrogeno-vs-carbamide-sbiancamento",
  "gestione-sensibilita-post-sbiancamento",
  "sbiancamento-denti-devitalizzati-walking-bleach",
  "controindicazioni-sbiancamento-dentale",
  "mantenere-risultati-sbiancamento-nel-tempo",
  "sbiancamento-attivazione-luminosa-laser-led",
  "estetica-dentale-faccette-o-sbiancamento",
  "sbiancamento-dentale-sicurezza-normativa-europea",
  "terapia-canalare-guida-completa-devitalizzazione",
  "strumenti-endodontici-rotanti-evoluzione-caratteristiche",
  "irrigazione-canali-radicolari-soluzioni-tecniche",
  "ritrattamento-endodontico-quando-come-procedere",
  "endodonzia-microscopio-operatorio-vantaggi-clinici",
  "tecniche-otturazione-canalare-guttaperca-oltre",
  "emergenze-endodontiche-diagnosi-gestione-dolore",
  "apicectomia-microchirurgica-tecnica-indicazioni",
  "compositi-dentali-ultima-generazione-caratteristiche",
  "cementi-vetroionomerici-applicazioni-odontoiatria",
  "sistemi-adesivi-dentali-generazioni-confronto",
  "ceramiche-dentali-tipologie-proprieta-ottiche",
  "materiali-impronta-siliconi-polieteri-confronto",
  "leghe-metalliche-odontoiatria-utilizzo-proprieta",
  "biomateriali-rigenerazione-ossea-odontoiatria",
  "resine-acriliche-protesi-proprieta-lavorazione",
  "guttaperca-materiali-otturazione-canalare",
  "zirconia-odontoiatria-applicazioni-limiti",
  "protocollo-sterilizzazione-completo-studio-dentistico",
  "classificazione-strumenti-spaulding",
  "autoclave-classe-b-requisiti-manutenzione",
  "disinfezione-superfici-studio-dentistico",
  "tracciabilita-processo-sterilizzazione",
  "dpi-studio-dentistico-guida-completa",
  "gestione-rifiuti-studio-odontoiatrico",
  "test-biologici-chimici-controllo-sterilizzazione",
  "prevenzione-malattia-parodontale-guida-professionista",
  "carie-dentale-fisiopatologia-fattori-rischio",
  "salute-orale-gravidanza-rischi-trattamenti-sicuri",
  "correlazione-salute-orale-salute-sistemica",
  "bruxismo-diagnosi-opzioni-trattamento",
  "alimentazione-salute-denti-consigli-pazienti",
  "denti-giudizio-quando-necessaria-estrazione",
  "traumatologia-dentale-gestione-emergenze",
  "fluoroprofilassi-bambini-adulti-fasce-eta",
  "xerostomia-cause-diagnosi-trattamento-bocca-secca",
  "lesioni-mucosa-orale-diagnosi-differenziale",
  "odontoiatria-pediatrica-approccio-piccolo-paziente",
  "ergonomia-studio-dentistico-prevenzione-disturbi",
  "radiologia-odontoiatrica-digitale-tecniche-indicazioni",
  "anestesia-locale-odontoiatria-tecniche-farmaci",
  "biomeccanica-ortodontica-principi-forze-momenti-clinica",
  "allineatori-trasparenti-clear-aligner-efficacia-limitazioni",
  "mini-viti-ortodontiche-tad-protocolli-inserimento-applicazioni",
  "contenzione-ortodontica-protocolli-evidence-based-stabilita",
  "ortodonzia-pediatrica-intercettiva-timing-trattamento",
  "bracket-autoleganti-passivi-attivi-evidenze-cliniche",
  "ortodonzia-adulti-parodonto-compromesso-considerazioni",
  "chirurgia-ortognatica-pianificazione-digitale-osteotomie",
  "ortodonzia-digitale-scansione-intraorale-workflow-3d",
  "riassorbimento-radicolare-ortodontico-fattori-rischio-prevenzione",
  "impianti-zigomatici-atrofia-mascellare-severa-tecnica-indicazioni",
  "concentrati-piastrinici-prf-cgf-implantologia-rigenerazione",
  "impianti-corti-diametro-ridotto-indicazioni-evidenze-letteratura",
  "protocollo-carico-immediato-estetico-anteriore-impianto-singolo",
  "connessione-impianto-abutment-micro-gap-cono-morse-platform-switching",
  "distrazione-osteogenetica-alveolare-aumento-verticale-implantologia",
  "diagnosi-preoperatoria-implantare-cbct-analisi-rischio-nervo-alveolare",
  "overdenture-su-impianti-protocolli-attacchi-manutenzione",
  "complicanze-chirurgiche-implantari-prevenzione-gestione-emorragia-nervo",
  "protocolli-anestesia-sedazione-chirurgia-implantare-gestione-dolore",
  "trattamento-ortodontico-morso-aperto-anteriore-meccaniche-intrusione",
  "espansione-palatale-rapida-lenta-dispositivi-sutura-mediopalatina",
  "cefalometria-digitale-analisi-soft-tissue-pianificazione-ortodontica",
  "estrattivo-non-estrattivo-indicazioni-premolari-espansione-profilo",
  "disfunzioni-temporomandibolari-rapporto-ortodonzia-diagnosi-protocollo",
  "ancoraggio-scheletrico-tad-protocolli-inserimento-fallimento-clinico",
  "sorriso-gengivale-trattamento-ortodontico-chirurgico-multidisciplinare",
  "ortodonzia-adulta-movimenti-complessi-multidisciplinare-protesica",
  "allineatori-trasparenti-management-complicanze-refinement-clinico",
  "ortopanoramica-cefalometria-rx-periapicale-indicazioni-ortodonzia",
  "osseointegrazione-principi-biologici-interfaccia-implant-bone",
  "pianificazione-implantare-3d-cbct-protocolli-guided-surgery",
  "rialzo-del-seno-mascellare-tecniche-open-closed-indicazioni",
  "peri-implantite-diagnosi-trattamento-protocolli-evidence-based",
  "gestione-tessuti-molli-peri-implantari-chirurgia-plastica",
  "carico-immediato-implantare-protocolli-criteri-selezione",
  "rigenerazione-ossea-guidata-membrane-materiali-GBR-implantologia",
  "impianti-a-carico-immediato-post-estrattivo-protocollo-socket-shield",
  "implantoprotesi-workflow-digitale-cad-cam-zirconia-titanio",
  "implantologia-paziente-sistemico-diabete-osteoporosi-bifosfonati"
];

// Stesse traduzioni di src/lib/categorySlugs.ts — duplicate qui perché
// questo file gira su Deno lato server, un contesto separato dal frontend
// (nessun modo di condividere il modulo senza un passaggio di build comune).
// Se si aggiungono/modificano slug categoria, vanno aggiornati in entrambi i posti.
const SITEMAP_CATEGORY_SLUGS: Record<string, { it: string; en: string; es: string; fr: string; de: string; pt: string; nl: string }> = {
  "monouso": { it: "monouso", en: "disposables", es: "desechables", fr: "jetables", de: "einwegartikel", pt: "descartaveis", nl: "wegwerpartikelen" },
  "sterilizzazione": { it: "sterilizzazione", en: "sterilization", es: "esterilizacion", fr: "sterilisation", de: "sterilisation", pt: "esterilizacao", nl: "sterilisatie" },
  "strumenti-odontoiatrici": { it: "strumenti-odontoiatrici", en: "dental-instruments", es: "instrumental-dental", fr: "instruments-dentaires", de: "dentalinstrumente", pt: "instrumentos-dentarios", nl: "tandheelkundige-instrumenten" },
  "implantologia": { it: "implantologia", en: "implantology", es: "implantologia", fr: "implantologie", de: "implantologie", pt: "implantologia", nl: "implantologie" },
  "ortodonzia": { it: "ortodonzia", en: "orthodontics", es: "ortodoncia", fr: "orthodontie", de: "kieferorthopadie", pt: "ortodontia", nl: "orthodontie" },
  "endodonzia": { it: "endodonzia", en: "endodontics", es: "endodoncia", fr: "endodontie", de: "endodontie", pt: "endodontia", nl: "endodontie" },
  "materiali-da-impronta": { it: "materiali-da-impronta", en: "impression-materials", es: "materiales-de-impresion", fr: "materiaux-d-empreinte", de: "abformmaterialien", pt: "materiais-de-impressao", nl: "afdrukmaterialen" },
  "protesica": { it: "protesica", en: "prosthetics", es: "protesica", fr: "prothese-dentaire", de: "prothetik", pt: "protese", nl: "prothetiek" },
  "radiologia": { it: "radiologia", en: "radiology", es: "radiologia", fr: "radiologie", de: "radiologie", pt: "radiologia", nl: "radiologie" },
  "arredi-studio": { it: "arredi-studio", en: "office-furniture", es: "mobiliario-clinico", fr: "mobilier-de-cabinet", de: "praxismobiliar", pt: "mobiliario-clinico", nl: "praktijkmeubilair" },
  "abbigliamento-divise": { it: "abbigliamento-divise", en: "workwear", es: "uniformes", fr: "tenues-professionnelles", de: "berufsbekleidung", pt: "uniformes", nl: "werkkleding" },
  "disinfezione": { it: "disinfezione", en: "disinfection", es: "desinfeccion", fr: "desinfection", de: "desinfektion", pt: "desinfecao", nl: "desinfectie" },
  "consumabili": { it: "consumabili", en: "consumables", es: "consumibles", fr: "consommables", de: "verbrauchsmaterial", pt: "consumiveis", nl: "verbruiksartikelen" },
  "igiene-orale-professionale": { it: "igiene-orale-professionale", en: "professional-oral-hygiene", es: "higiene-oral-profesional", fr: "hygiene-bucco-dentaire", de: "professionelle-mundhygiene", pt: "higiene-oral-profissional", nl: "professionele-mondhygiene" },
};

function xmlEscape(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Costruisce un blocco <url> con tutte le alternative hreflang, dato un
// path SENZA prefisso lingua per l'italiano e una funzione che calcola il
// path per ogni altra lingua (utile per gli slug categoria, diversi da lingua a lingua).
function sitemapUrlBlock(pathForLang: (lang: string) => string, lastmod: string, priority: string, changefreq: string): string {
  const italianPath = pathForLang("it");
  let block = `  <url>\n    <loc>https://oralzon.com${italianPath}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n`;
  for (const lang of SITEMAP_LANGS) {
    const p = pathForLang(lang);
    const href = lang === "it" ? `https://oralzon.com${p}` : `https://oralzon.com/${lang}${p}`;
    block += `    <xhtml:link rel="alternate" hreflang="${lang}" href="${href}" />\n`;
  }
  block += `    <xhtml:link rel="alternate" hreflang="x-default" href="https://oralzon.com${italianPath}" />\n  </url>\n`;
  return block;
}

app.get("/make-server-000b3cfb/sitemap.xml", async (c) => {
  try {
    const supabase = getServiceClient();
    const today = new Date().toISOString().split("T")[0];
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n`;

    for (const p of SITEMAP_STATIC_PAGES) {
      xml += sitemapUrlBlock(() => p.path, today, p.priority, p.changefreq);
    }
    for (const slug of SITEMAP_BLOG_SLUGS) {
      xml += sitemapUrlBlock(() => `/blog/${slug}`, today, "0.6", "monthly");
    }
    for (const [itSlug, translations] of Object.entries(SITEMAP_CATEGORY_SLUGS)) {
      xml += sitemapUrlBlock((lang) => `/negozio/categoria/${(translations as any)[lang] || itSlug}`, today, "0.8", "weekly");
    }

    // Prodotti pubblicati di venditori non sospesi — stesso criterio già
    // applicato alla policy RLS pubblica sui prodotti (vedi audit precedente).
    const { data: products } = await supabase
      .from("products")
      .select("id, updated_at, vendor_id, vendors!inner(plan_status)")
      .eq("status", "published")
      .neq("vendors.plan_status", "suspended")
      .limit(50000);
    for (const p of (products || []) as any[]) {
      const lastmod = p.updated_at ? String(p.updated_at).split("T")[0] : today;
      xml += sitemapUrlBlock(() => `/negozio/prodotto/${p.id}`, lastmod, "0.7", "weekly");
    }

    const { data: vendors } = await supabase
      .from("vendors")
      .select("id, created_at")
      .neq("plan_status", "suspended")
      .limit(10000);
    for (const v of (vendors || []) as any[]) {
      const lastmod = v.created_at ? String(v.created_at).split("T")[0] : today;
      xml += sitemapUrlBlock(() => `/negozio/venditore/${v.id}`, lastmod, "0.6", "weekly");
    }

    xml += `</urlset>`;
    return c.body(xml, 200, { "Content-Type": "application/xml; charset=utf-8" });
  } catch (e: any) {
    console.error("❌ sitemap.xml:", e);
    return c.text("Errore generazione sitemap", 500);
  }
});


Deno.serve(app.fetch);