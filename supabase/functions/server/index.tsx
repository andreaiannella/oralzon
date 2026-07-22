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

function generateOrderNumber(): string {
  const d = new Date();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `DC-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${rand}`;
}

// ── Email via Resend ──
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const key = Deno.env.get("RESEND_API_KEY");
  if (!key) { console.log("⚠️ RESEND_API_KEY non configurata su Supabase → Edge Functions → Secrets. Email NON inviata a:", to); return false; }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        from: Deno.env.get("RESEND_FROM_EMAIL") || "Oralzon <noreply@oralzon.com>",
        to: [to], subject, html,
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

// Icone SVG inline (stile Lucide, coerenti con il resto del sito) per il badge
// in cima alle email — niente più emoji, che rendono in modo incoerente tra
// client email diversi (Gmail, Outlook, Apple Mail mostrano stili diversi).
const EMAIL_ICONS: Record<string, string> = {
  check: '<path d="M20 6L9 17l-5-5"/>',
  truck: '<path d="M2 8h11v7H2z"/><path d="M13 11h4l4 3v1h-8z"/><circle cx="6.5" cy="18" r="1.8"/><circle cx="17.5" cy="18" r="1.8"/>',
  store: '<path d="M4 8l1.5-4h13L20 8"/><path d="M4 8v10a1 1 0 001 1h14a1 1 0 001-1V8"/><path d="M9.5 19v-6h5v6"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h2l2.4 12.4a2 2 0 002 1.6h9.2a2 2 0 002-1.6L21 7H6"/>',
  undo: '<path d="M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
  money: '<circle cx="12" cy="12" r="9"/><path d="M15 8.5a3.5 3.5 0 00-3.5-2 3.7 3.7 0 000 7.4 3.5 3.5 0 003.5-2"/><path d="M7.5 10.5h5.5M7.5 13.5h5"/>',
  message: '<path d="M20 11.5a7.5 7.5 0 01-7.5 7.5 7.6 7.6 0 01-3.4-.8L4 20l1.8-4.6a7.5 7.5 0 1114.2-3.9z"/>',
  star: '<path d="M12 2.5l2.6 6.6H22l-5.4 4 2 6.6L12 15.8 5.4 19.7l2-6.6L2 9.1h7.4z"/>',
};

function emailWrapper(opts: { preheader?: string; badgeIcon: string; badgeColor: string; title: string; bodyHtml: string; ctaLabel?: string; ctaUrl?: string }): string {
  const { preheader = "", badgeIcon, badgeColor, title, bodyHtml, ctaLabel, ctaUrl } = opts;
  const iconSvg = EMAIL_ICONS[badgeIcon] || EMAIL_ICONS.check;
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

        <!-- Header brand -->
        <tr><td style="background:linear-gradient(135deg,${BRAND_BLUE},${BRAND_CYAN});padding:24px 32px;text-align:center;">
          <img src="${SITE_URL}/email-logo.png" alt="Oralzon" width="140" style="display:block;margin:0 auto;max-width:140px;height:auto;" />
          <p style="margin:8px 0 0;font-size:12px;color:rgba(255,255,255,0.85);">Marketplace B2B per prodotti odontoiatrici</p>
        </td></tr>

        <!-- Badge stato -->
        <tr><td style="padding:32px 32px 0;text-align:center;">
          <div style="width:56px;height:56px;background:${badgeColor};border-radius:50%;display:inline-flex;align-items:center;justify-content:center;">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconSvg}</svg>
          </div>
          <h1 style="margin:16px 0 0;font-size:20px;color:#111827;font-weight:800;">${title}</h1>
        </td></tr>

        <!-- Corpo -->
        <tr><td style="padding:20px 32px 8px;color:#374151;font-size:14px;line-height:1.6;">
          ${bodyHtml}
        </td></tr>

        ${ctaLabel && ctaUrl ? `
        <tr><td style="padding:8px 32px 32px;text-align:center;">
          <a href="${ctaUrl}" style="display:inline-block;background:${BRAND_BLUE};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 32px;border-radius:10px;">${ctaLabel}</a>
        </td></tr>` : `<tr><td style="padding-bottom:24px;"></td></tr>`}

        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #eef0f2;">
          <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;">Oralzon — Marketplace B2B odontoiatrico</p>
          <p style="margin:0;font-size:11px;color:#c1c6cc;">
            <a href="${SITE_URL}" style="color:#9ca3af;text-decoration:underline;">${SITE_URL.replace(/^https?:\/\//, '')}</a> ·
            Questa è una comunicazione automatica relativa al tuo account Oralzon.
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function itemsTableHtml(items: { name: string; quantity: number; price: number }[]): string {
  const rows = items.map(i =>
    `<tr>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f1f3;font-size:13px;color:#111827;">${i.name || 'Prodotto'}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f1f3;font-size:13px;color:#6b7280;text-align:center;">×${i.quantity}</td>
      <td style="padding:10px 8px;border-bottom:1px solid #f0f1f3;font-size:13px;color:#111827;text-align:right;font-weight:600;">€${(i.price * i.quantity).toFixed(2)}</td>
    </tr>`
  ).join('');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-collapse:collapse;">
    <tr style="background:#f9fafb;"><th style="padding:8px;text-align:left;font-size:11px;color:#9ca3af;text-transform:uppercase;">Prodotto</th><th style="padding:8px;font-size:11px;color:#9ca3af;text-transform:uppercase;">Qtà</th><th style="padding:8px;text-align:right;font-size:11px;color:#9ca3af;text-transform:uppercase;">Totale</th></tr>
    ${rows}
  </table>`;
}

// 1. Conferma ordine (cliente)
function orderConfirmationHtml(orderNumber: string, name: string, total: number, items: any[]): string {
  return emailWrapper({
    preheader: `Il tuo ordine ${orderNumber} è confermato — totale €${total.toFixed(2)}`,
    badgeIcon: "check", badgeColor: "#16a34a",
    title: "Ordine Confermato!",
    bodyHtml: `
      <p>Ciao <strong>${name}</strong>,</p>
      <p>Grazie per il tuo acquisto! Il tuo ordine <strong>${orderNumber}</strong> è stato confermato e i venditori sono stati notificati.</p>
      ${itemsTableHtml(items)}
      <p style="text-align:right;font-size:17px;font-weight:800;color:#111827;margin:12px 0 0;">Totale: €${total.toFixed(2)}</p>
      <p style="color:#6b7280;font-size:13px;margin-top:16px;">Ogni fornitore gestisce la spedizione dei propri prodotti in autonomia. Riceverai un'email con il numero di tracciabilità non appena il tuo pacco viene spedito.</p>
    `,
    ctaLabel: "Visualizza il tuo ordine", ctaUrl: `${SITE_URL}/account/ordini`,
  });
}

// 2. Spedizione con tracking (cliente)
function shippingNotificationHtml(orderNumber: string, name: string, trackingNumber: string, carrier?: string): string {
  return emailWrapper({
    preheader: `Il tuo ordine ${orderNumber} è stato spedito — tracking ${trackingNumber}`,
    badgeIcon: "truck", badgeColor: "#0F7A68",
    title: "Il tuo ordine è in viaggio!",
    bodyHtml: `
      <p>Ciao <strong>${name}</strong>,</p>
      <p>Buone notizie! Il tuo ordine <strong>${orderNumber}</strong> è stato spedito dal venditore${carrier ? ` tramite <strong>${carrier}</strong>` : ''}.</p>
      <div style="background:#EAFBF6;border:1px solid #7FD9C4;border-radius:12px;padding:16px;margin:16px 0;text-align:center;">
        ${carrier ? `<p style="margin:0 0 8px;font-size:13px;color:#374151;">Corriere: <strong>${carrier}</strong></p>` : ''}
        <p style="margin:0 0 4px;font-size:11px;color:#0F7A68;text-transform:uppercase;font-weight:700;letter-spacing:0.5px;">Numero di tracciabilità</p>
        <p style="margin:0;font-size:18px;font-weight:800;color:#111827;font-family:monospace;letter-spacing:1px;">${trackingNumber}</p>
      </div>
      <p style="color:#6b7280;font-size:13px;">Usa questo codice sul sito del corriere per seguire la spedizione in tempo reale.</p>
    `,
    ctaLabel: "Vedi i tuoi ordini", ctaUrl: `${SITE_URL}/account/ordini`,
  });
}

// 3. Benvenuto — nuovo cliente
function welcomeCustomerHtml(name: string): string {
  return emailWrapper({
    preheader: "Benvenuto su Oralzon, il marketplace dei professionisti odontoiatrici",
    badgeIcon: "star", badgeColor: BRAND_BLUE,
    title: `Benvenuto${name ? ', ' + name : ''}!`,
    bodyHtml: `
      <p>Il tuo account Oralzon è pronto. Ora hai accesso a migliaia di prodotti odontoiatrici professionali da fornitori verificati.</p>
      <p style="color:#6b7280;font-size:13px;">Puoi iniziare subito a sfogliare il catalogo, salvare i tuoi indirizzi preferiti e monitorare i tuoi ordini dalla tua area personale.</p>
    `,
    ctaLabel: "Sfoglia il catalogo", ctaUrl: `${SITE_URL}/negozio`,
  });
}

// 4. Benvenuto — nuovo venditore
function welcomeVendorHtml(name: string, businessName: string): string {
  return emailWrapper({
    preheader: "Il tuo store Oralzon è attivo — inizia a vendere",
    badgeIcon: "store", badgeColor: "#2FBFA0",
    title: "Il tuo Store è Attivo!",
    bodyHtml: `
      <p>Ciao <strong>${name}</strong>,</p>
      <p>Complimenti! <strong>${businessName}</strong> è ora uno store attivo su Oralzon. Hai 7 giorni di prova gratuita per pubblicare i tuoi prodotti e ricevere i primi ordini.</p>
      <p style="color:#6b7280;font-size:13px;">Dalla tua dashboard venditore puoi aggiungere prodotti, gestire ordini e spedizioni, rispondere ai clienti e monitorare le tue vendite.</p>
    `,
    ctaLabel: "Vai alla Dashboard", ctaUrl: `${SITE_URL}/venditore/dashboard`,
  });
}

// 5. Nuovo ordine ricevuto (venditore)
function newOrderVendorHtml(orderNumber: string, vendorName: string, items: any[], total: number): string {
  return emailWrapper({
    preheader: `Nuovo ordine ${orderNumber} — €${total.toFixed(2)}`,
    badgeIcon: "cart", badgeColor: "#f59e0b",
    title: "Hai ricevuto un nuovo ordine!",
    bodyHtml: `
      <p>Ciao <strong>${vendorName}</strong>,</p>
      <p>Hai ricevuto un nuovo ordine <strong>${orderNumber}</strong> su Oralzon. Preparalo per la spedizione appena possibile.</p>
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
    badgeIcon: "undo", badgeColor: "#f59e0b",
    title: "Richiesta di Reso Ricevuta",
    bodyHtml: `
      <p>Ciao <strong>${name}</strong>,</p>
      <p>Abbiamo ricevuto la tua richiesta di reso per <strong>${productName}</strong> (ordine ${orderNumber}).</p>
      <p style="color:#6b7280;font-size:13px;">Il venditore esaminerà la richiesta ed entro breve riceverai una risposta con l'esito e le istruzioni per la restituzione.</p>
    `,
    ctaLabel: "Segui lo stato del reso", ctaUrl: `${SITE_URL}/account/ordini`,
  });
}

// 7. Nuova richiesta di reso (notifica venditore)
function newReturnVendorHtml(orderNumber: string, vendorName: string, productName: string, reason: string): string {
  return emailWrapper({
    preheader: `Nuova richiesta di reso per l'ordine ${orderNumber}`,
    badgeIcon: "undo", badgeColor: "#f59e0b",
    title: "Nuova Richiesta di Reso",
    bodyHtml: `
      <p>Ciao <strong>${vendorName}</strong>,</p>
      <p>Un cliente ha richiesto il reso di <strong>${productName}</strong> dall'ordine <strong>${orderNumber}</strong>.</p>
      <div style="background:#fef3c7;border-radius:10px;padding:12px 16px;margin:14px 0;">
        <p style="margin:0;font-size:13px;color:#92400e;"><strong>Motivo:</strong> ${reason || 'Non specificato'}</p>
      </div>
      <p style="color:#6b7280;font-size:13px;">Esamina la richiesta ed accetta o rifiuta il reso dalla tua dashboard.</p>
    `,
    ctaLabel: "Gestisci la richiesta", ctaUrl: `${SITE_URL}/venditore/resi`,
  });
}

// 8. Esito reso (cliente) — approvato / rifiutato / rimborsato
function returnDecisionHtml(orderNumber: string, name: string, productName: string, status: 'approved' | 'rejected' | 'refunded', note?: string): string {
  const cfg = {
    approved: { emoji: "check", color: "#16a34a", title: "Reso Approvato", msg: `La tua richiesta di reso per <strong>${productName}</strong> è stata approvata dal venditore.` },
    rejected: { emoji: "undo", color: "#dc2626", title: "Reso Non Approvato", msg: `Purtroppo la tua richiesta di reso per <strong>${productName}</strong> non è stata approvata.` },
    refunded: { emoji: "money", color: "#16a34a", title: "Rimborso Effettuato", msg: `Il rimborso per <strong>${productName}</strong> è stato elaborato.` },
  }[status];
  return emailWrapper({
    preheader: `${cfg.title} — ordine ${orderNumber}`,
    badgeIcon: cfg.emoji, badgeColor: cfg.color,
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

// ── HEALTH ──
app.get("/make-server-000b3cfb/health", (c) => c.json({ status: "ok" }));

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
          badgeIcon: "money", badgeColor: "#16a34a",
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
            badgeIcon: "money", badgeColor: "#16a34a",
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
      date: new Date(date).toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" }),
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
      const [y, m] = key.split("-");
      const label = new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("it-IT", { month: "short" });
      return { month: label, revenue: Math.round((revenue as number) * 100) / 100 };
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
      .select("*, orders(order_number, shipping_name, shipping_email), order_items(quantity, price, products(name, images))")
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
    const supabase = getServiceClient();

    const { data: items, error } = await supabase
      .from("order_items")
      .select("product_id, quantity, orders!inner(status)")
      .in("orders.status", ["processing", "shipped", "delivered"]);
    if (error) throw new Error(error.message);

    const totals: Record<string, number> = {};
    for (const i of items || []) {
      if (!i.product_id) continue;
      totals[i.product_id] = (totals[i.product_id] || 0) + Number(i.quantity);
    }
    const topProductIds = Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    if (topProductIds.length === 0) return c.json({ success: true, products: [] });

    const { data: products } = await supabase
      .from("products")
      .select("id, name, price, discount_price, images, vendor_id, stock, status, vendors(id, business_name, verified_badge)")
      .in("id", topProductIds)
      .eq("status", "published");

    // Riordina secondo la classifica reale di vendite (la query .in non garantisce l'ordine)
    const ordered = topProductIds
      .map(id => (products || []).find((p: any) => p.id === id))
      .filter(Boolean);

    return c.json({ success: true, products: ordered });
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
    const { count: pendingOrders } = await supabase.from("order_items")
      .select("id", { count: "exact", head: true })
      .eq("vendor_id", (vendor as any).id)
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
            badgeIcon: "message", badgeColor: "#0F7A68",
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
    await sendEmail(auth.email, "Benvenuto su Oralzon!", welcomeCustomerHtml(name || ""));
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
    const { items, shippingData, customerId, appOrigin, platform } = await c.req.json();
    if (!items?.length || !shippingData || !customerId) return c.json({ success: false, error: "Dati mancanti" }, 400);

    const supabase = getServiceClient();
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });

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
      .select('id, name, price, discount_price, images, vendor_id, stock, status, shipping_cost_override')
      .in('id', productIds);
    if (prodErr) throw new Error(`Prodotti: ${prodErr.message}`);

    const productMap: Record<string, any> = {};
    (productsData || []).forEach((p: any) => { productMap[p.id] = p; });

    // Costruisce le righe usando SOLO dati dal DB; blocca prodotti mancanti,
    // non pubblicati o senza stock sufficiente.
    const secureItems: any[] = [];
    for (const r of requested) {
      const p = productMap[r.productId];
      if (!p) return c.json({ success: false, error: `Prodotto non più disponibile` }, 400);
      if (p.status && p.status !== 'published') return c.json({ success: false, error: `"${p.name}" non è più in vendita` }, 400);
      if (Number(p.stock) < r.quantity) return c.json({ success: false, error: `Scorte insufficienti per "${p.name}" (disponibili: ${p.stock})` }, 400);
      // Prezzo effettivo: se discount_price è valorizzato ed è inferiore al
      // prezzo pieno, è quello da addebitare — mai fidarsi di un prezzo
      // "scontato" calcolato lato client, stesso principio già applicato
      // altrove (spedizione, limite prodotti, ecc.).
      const hasValidDiscount = p.discount_price !== null && p.discount_price !== undefined && Number(p.discount_price) > 0 && Number(p.discount_price) < Number(p.price);
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

    const lineItems: any[] = secureItems.map((i: any) => ({
      price_data: { currency: "eur", product_data: { name: i.name, images: i.image ? [i.image] : [] }, unit_amount: Math.round(i.price * 100), tax_behavior: "inclusive" },
      quantity: i.quantity,
    }));

    // SICUREZZA: la spedizione NON si fida del valore inviato dal client (stesso
    // principio già applicato al prezzo prodotto) — la ricalcoliamo qui dal DB.
    // Per ogni venditore presente nel carrello: gli articoli con costo di
    // spedizione standard vengono sommati e confrontati con la soglia di
    // spedizione gratuita del venditore; gli articoli con un costo di spedizione
    // personalizzato (es. un prodotto pesante/ingombrante) si aggiungono a parte,
    // al MASSIMO tra quelli presenti — non sommati, perché nella realtà viaggiano
    // comunque in un unico pacco/spedizione, non uno ciascuno.
    const vendorIdsInCart = [...new Set(secureItems.map((i: any) => i.vendor_id))];
    const { data: vendorsData } = await supabase
      .from('vendors')
      .select('id, shipping_cost, free_shipping_threshold, stripe_account_id')
      .in('id', vendorIdsInCart);
    const vendorShippingMap: Record<string, { cost: number; threshold: number }> = {};
    (vendorsData || []).forEach((v: any) => {
      vendorShippingMap[v.id] = { cost: Number(v.shipping_cost || 0), threshold: Number(v.free_shipping_threshold || 0) };
    });

    let computedShipping = 0;
    for (const vendorId of vendorIdsInCart) {
      const vendorItems = secureItems.filter((i: any) => i.vendor_id === vendorId);
      const standardItems = vendorItems.filter((i: any) => i.shippingOverride === null);
      const overrideItems = vendorItems.filter((i: any) => i.shippingOverride !== null);

      if (standardItems.length > 0) {
        const vs = vendorShippingMap[vendorId] || { cost: 0, threshold: 0 };
        const standardSubtotal = standardItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0);
        const isFree = vs.threshold > 0 && standardSubtotal >= vs.threshold;
        computedShipping += isFree ? 0 : vs.cost;
      }
      if (overrideItems.length > 0) {
        computedShipping += Math.max(...overrideItems.map((i: any) => i.shippingOverride));
      }
    }

    // Aggiunge spedizione come voce separata se presente
    const parsedShipping = computedShipping;
    if (parsedShipping > 0) {
      lineItems.push({
        price_data: { currency: "eur", product_data: { name: "Spedizione" }, unit_amount: Math.round(parsedShipping * 100), tax_behavior: "inclusive" },
        quantity: 1,
      });
    }

    // Verifica importo minimo Stripe (€0.50)
    const totalCents = lineItems.reduce((s: number, i: any) => s + i.price_data.unit_amount * i.quantity, 0);
    if (totalCents < 50) return c.json({ success: false, error: "Il totale dell'ordine deve essere almeno €0.50" }, 400);

    const orderNumber = generateOrderNumber();
    const totalAmount = secureItems.reduce((s: number, i: any) => s + i.price * i.quantity, 0) + parsedShipping;

    const { data: order, error: orderErr } = await supabase.from("orders").insert([{
      customer_id: customerId, order_number: orderNumber, total_amount: totalAmount, status: "pending",
      shipping_name: `${shippingData.firstName} ${shippingData.lastName}`, shipping_email: shippingData.email, shipping_address: shippingData,
    }]).select().single();
    if (orderErr) throw new Error(`Ordine: ${orderErr.message}`);

    const orderItems = secureItems.map((i: any) => ({
      order_id: order.id,
      product_id: i.productId,
      vendor_id: i.vendor_id,
      quantity: i.quantity,
      price: i.price,
      shipping_status: "pending",
    }));
    const { error: itemsErr } = await supabase.from("order_items").insert(orderItems);
    if (itemsErr) { await supabase.from("orders").delete().eq("id", order.id); throw new Error(`Items: ${itemsErr.message}`); }

    // Stock decrementato dal trigger DB al verify-payment (dopo pagamento confermato)
    const origin = appOrigin || "http://localhost:5173";

    // Stripe Tax: la responsabilità fiscale (calcolo + rendicontazione) va
    // spostata sul conto Stripe collegato del venditore, non sulla piattaforma
    // — coerente con il principio "è il venditore a gestire l'IVA", non
    // Oralzon. Una Checkout Session supporta UN SOLO conto responsabile per
    // sessione: per i carrelli con un solo venditore lo attiviamo; per i
    // carrelli multi-venditore lo lasciamo disattivato (limite noto, non
    // esiste ancora un modo pulito per attribuire l'IVA a più venditori nella
    // stessa sessione di pagamento). In entrambi i casi, se il venditore non
    // ha una registrazione fiscale attiva su Stripe, l'imposta calcolata è
    // comunque zero — non succede nulla "di sbagliato" in automatico.
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
        const customer = await stripe.customers.create({
          email: shippingData.email,
          name: `${shippingData.firstName} ${shippingData.lastName}`,
          address: {
            line1: shippingData.address,
            city: shippingData.city,
            state: shippingData.province || undefined,
            postal_code: shippingData.zipCode,
            country: "IT", // TODO: quando il checkout supporterà clienti esteri, usare il paese reale del cliente invece di IT fisso
          },
        });
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
      metadata: { order_id: order.id, order_number: orderNumber }, locale: "it",
    };
    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    } else {
      sessionParams.customer_email = shippingData.email;
    }
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

    const { data: updatedOrder, error: updateErr } = await supabase.from("orders").update({ status: "processing" }).eq("id", order.id).select().single();
    if (updateErr) throw new Error(updateErr.message);
    order = updatedOrder;
    // Trigger DB decrementa automaticamente lo stock (trigger_decrement_stock)

    const { data: orderItems } = await supabase.from("order_items")
      .select("*, products(name, images), vendors(id, business_name, profile_id)")
      .eq("order_id", order.id);

    // Invia email conferma ordine al cliente
    const emailItems = (orderItems || []).map((i: any) => ({ name: i.products?.name, quantity: i.quantity, price: i.price }));
    await sendEmail(order.shipping_email, `Ordine ${order.order_number} confermato — Oralzon`,
      orderConfirmationHtml(order.order_number, order.shipping_name, order.total_amount, emailItems));

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

    // 2. Attiva la promozione
    await supabase.from('promotions').update({ status: 'active' }).eq('id', promo.id);

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

const DELIVERY_AUTO_CONFIRM_DAYS = 7; // stesso periodo della mediazione resi già comunicato in ResiRimborsi

// Crea il trasferimento Stripe verso il venditore per una singola riga
// d'ordine, se il venditore ha Stripe Connect attivo e il trasferimento
// non è già stato fatto. Ritorna { ok, reason? }.
async function createTransferForOrderItem(supabase: any, stripe: any, orderItemId: string): Promise<{ ok: boolean; reason?: string }> {
  const { data: item } = await supabase
    .from('order_items')
    .select('id, price, quantity, vendor_id, transfer_id, order_id, orders(stripe_session_id, status), vendors(id, commission_pct, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, business_name, profile_id)')
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

  const grossAmount = Number(item.price) * Number(item.quantity);
  const commissionPct = Number(vendor.commission_pct ?? 7);
  const commissionAmount = Math.round(grossAmount * (commissionPct / 100) * 100) / 100;
  const netAmount = Math.round((grossAmount - commissionAmount) * 100) / 100;
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
      gross_amount: grossAmount,
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
      gross_amount: grossAmount, commission_amount: commissionAmount, net_amount: netAmount,
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
    const netShareOfRefund = Math.min(itemRefundShare * (1 - (transferRow.commission_amount / itemGross)), remainingTransferred);
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

      // Aggiorna ordini prodotti
      await supabase.from("orders").update({ status: "processing" }).eq("stripe_session_id", sessionId);

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
      await supabase.from("vendors").update({
        stripe_charges_enabled: !!account.charges_enabled,
        stripe_payouts_enabled: !!account.payouts_enabled,
        stripe_details_submitted: !!account.details_submitted,
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
    const vendor = await getVendorByProfileId(supabase, auth.userId!,
      "id, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted, stripe_onboarding_completed_at, commission_pct");
    if (!vendor) return c.json({ success: false, error: "Nessun profilo venditore trovato" }, 404);

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
      .select("id, price, quantity, orders(status), returns(status)")
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
    const pendingGross = trulyPending.reduce((s: number, i: any) => s + Number(i.price) * Number(i.quantity), 0);
    const commissionPct = Number((vendor as any).commission_pct ?? 7);
    const pendingNet = Math.round(pendingGross * (1 - commissionPct / 100) * 100) / 100;

    return c.json({ success: true, vendor, transfers: transfers || [], pendingNet });
  } catch (e: any) {
    console.error("❌ stripe/connect/status:", e.message);
    return c.json({ success: false, error: e.message }, 500);
  }
});

// ── STRIPE: Acquisto piano venditore ──────────────────────────────────────────
app.post('/make-server-000b3cfb/stripe/create-plan-checkout', async (c) => {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return c.json({ success: false, error: 'Stripe non configurata' }, 500);
    const { planId, userId, appOrigin, platform } = await c.req.json();
    if (!planId || !userId) return c.json({ success: false, error: 'Dati mancanti' }, 400);

    const plans: Record<string, { name: string; price: number; productLimit: number }> = {
      professional: { name: 'Piano Venditore — Oralzon', price: 129, productLimit: 999999 },
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
          recurring: { interval: 'month' },
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
      locale: 'it',
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
    const existing = await getVendorByProfileId(supabase, userId, 'id');
    if (existing) {
      await supabase.from('vendors').update({
        plan_type: planId,
        plan_status: 'active',
        product_limit: parseInt(productLimit || '999999'),
        verified_badge: planId === 'professional',
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
        verified_badge: planId === 'professional',
      }]);
    }

    // NON modifichiamo user_type — è già impostato a 'venditore' dalla registrazione

    console.log('✅ Piano', planId, 'attivato per utente:', userId);
    return c.json({ success: true, planId });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});

// ── VENDOR: Crea vendor ──
app.post("/make-server-000b3cfb/create-vendor", async (c) => {
  try {
    const auth = await requireAuth(c);
    if (!auth.ok) return c.json({ success: false, error: auth.error }, 401);

    const { business_name, plan_type, product_limit, trial_ends_at } = await c.req.json();
    if (!business_name || !plan_type) return c.json({ success: false, error: "Dati mancanti" }, 400);

    // SICUREZZA: il vendor viene sempre creato per l'utente autenticato (dal token),
    // mai per un userId arbitrario passato nel body.
    const userId = auth.userId!;

    const supabase = getServiceClient();
    const existing = await getVendorByProfileId(supabase, userId, '*');
    if (existing) return c.json({ success: true, vendor: existing, message: 'Già esistente' });
    // SICUREZZA: come sopra, la scadenza trial non si fida mai del client.
    const computedTrialEnd = plan_type === 'trial'
      ? new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() // 6 mesi
      : null;
    const { data: vendor, error } = await supabase.from('vendors').insert([{
      profile_id: userId, 
      business_name, 
      plan_type, 
      plan_status: 'active', 
      product_limit: product_limit || 999999, 
      verified_badge: false,
      trial_ends_at: computedTrialEnd,
    }]).select().single();
    if (error) return c.json({ success: false, error: error.message }, 500);
    return c.json({ success: true, vendor });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});


// ── STRIPE: Checkout pacchetti visibilità ──
app.post('/make-server-000b3cfb/stripe/create-promo-checkout', async (c) => {
  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return c.json({ success: false, error: 'Stripe non configurata' }, 500);
    const { packageId, packageTitle, price, vendorId, appOrigin, platform, sponsoredCategory, selectedProductIds } = await c.req.json();
    if (!packageId || !price || !vendorId) return c.json({ success: false, error: 'Dati mancanti' }, 400);
    const stripe = new Stripe(stripeKey, { apiVersion: "2026-06-24.dahlia" });
    const origin = appOrigin || 'http://localhost:5173';
    // Calcola durata pacchetto
    const durationDays: Record<string, number> = {
      featured_monthly: 30, featured_quarterly: 90,
      homepage_monthly: 7, homepage_fixed: 30,
      category_single: 30, category_multi: 30,
    };
    const days = durationDays[packageId] || 30;

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
          unit_amount: Math.round(price * 100),
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
      metadata: { type: 'promo', vendorId: vendor.id, packageId, packageTitle: packageTitle || '', amountPaid: String(price), expiresAt: expiresAt.toISOString(), sponsoredCategory: sponsoredCategory || '', selectedProductIds: selectedProductIds ? JSON.stringify(selectedProductIds) : '' },
      locale: 'it',
    });

    // Salva promo record (si attiva automaticamente al verify-promo/webhook)
    const { error: insertErr } = await supabase.from('promotions').insert([{
      vendor_id: vendor.id,
      package_id: packageId,
      package_name: packageTitle || packageId,
      amount_paid: price,
      stripe_session_id: session.id,
      status: 'pending',
      expires_at: expiresAt.toISOString(),
      sponsored_category: sponsoredCategory || null,
      selected_product_ids: selectedProductIds || null,
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
      await sendEmail(order.shipping_email, `Ordine ${order.order_number} spedito — Oralzon`,
        shippingNotificationHtml(order.order_number, order.shipping_name, trackingNumber));
    }
    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
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
        id, order_id, product_id, quantity, price, shipping_status, tracking_number, carrier,
        products(name, images),
        orders(order_number, status, created_at, shipping_name, shipping_email, shipping_address, total_amount)
      `)
      .eq("vendor_id", vendor.id)
      .order("created_at", { ascending: false, foreignTable: "orders" });

    if (error) throw new Error(error.message);

    return c.json({ success: true, items: items || [], vendorId: vendor.id });
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
      .select("*, order_items(*, products(name, images), returns(id, status), vendors(business_name))")
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false });

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

    // 1. Auto-conferma consegna per articoli spediti da più di N giorni senza
    // contestazioni aperte (nessun reso in stato diverso da 'rejected').
    // In parallelo: sono aggiornamenti indipendenti riga per riga, farli in
    // sequenza sommerebbe inutilmente la latenza di rete di ciascuno.
    const cutoff = new Date(Date.now() - DELIVERY_AUTO_CONFIRM_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: toAutoConfirm } = await supabase
      .from("order_items")
      .select("id, updated_at, returns(status)")
      .eq("shipping_status", "shipped")
      .lt("updated_at", cutoff);

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

    return c.json({ success: true, autoConfirmed, transferred, stillPending });
  } catch (e: any) {
    console.error("❌ system/process-pending-transfers:", e);
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

    const { error: updateErr } = await supabase.from("order_items")
      .update(updateData).eq("id", itemId);
    if (updateErr) throw new Error(updateErr.message);

    // Invia email tracking se spedito
    if (status === "shipped" && trackingNumber) {
      try {
        const { data: orderData } = await supabase
          .from("order_items").select("orders(order_number, shipping_email, shipping_name)").eq("id", itemId).single();
        const order = (orderData as any)?.orders;
        if (order?.shipping_email) {
          await sendEmail(order.shipping_email,
            `Il tuo ordine ${order.order_number} è stato spedito — Oralzon`,
            shippingNotificationHtml(order.order_number, order.shipping_name, trackingNumber, carrier)
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
    const { error } = await supabase.from("vendors").update(body).eq("profile_id", user.id);
    if (error) throw new Error(error.message);
    return c.json({ success: true });
  } catch (e: any) { return c.json({ success: false, error: e.message }, 500); }
});

// ── REGISTER VENDOR (service role, bypassa RLS) ─────────────
app.post("/make-server-000b3cfb/register-vendor", async (c) => {
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

    // Registra il riscatto del codice promo (best-effort, non blocca la registrazione se fallisce)
    if (promoApplied && newVendor && promoCode?.trim()) {
      try {
        const { data: promo } = await supabase.from("vendor_promo_codes")
          .select("id, used_count").eq("code", promoCode.trim().toUpperCase()).single();
        if (promo) {
          await supabase.from("vendor_promo_redemptions").insert([{ promo_code_id: promo.id, vendor_id: newVendor.id }]);
          await supabase.from("vendor_promo_codes").update({ used_count: (promo.used_count || 0) + 1 }).eq("id", promo.id);
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


Deno.serve(app.fetch);
