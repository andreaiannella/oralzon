// ═══════════════════════════════════════════════════════════════════
// TRANSLATION WORKER — Oralzon Translation Engine
// ═══════════════════════════════════════════════════════════════════
// Funzione separata (non dentro make-server-000b3cfb) apposta: è invocata
// da pg_cron ogni minuto via pg_net, non da richieste utente, e tenerla
// isolata dal server principale permette di modificarla/ridistribuirla
// senza mai toccare il file grande che gestisce checkout, Stripe, ordini.
//
// Cosa fa a ogni invocazione:
// 1. Prende fino a BATCH_SIZE job "pending" (o "failed" con next_retry_at
//    passato), in ordine di priorità e poi di data creazione.
// 2. Per ciascuno: marca "processing", carica il prodotto e il glossario
//    attivo, chiama Claude con output JSON strutturato, valida la
//    risposta, scrive in product_translations (mai sovrascrivendo righe
//    con locked=true), marca il job "completed".
// 3. Se qualcosa fallisce: incrementa "attempts", se sotto max_attempts
//    rimette lo status a "pending" con next_retry_at posticipato
//    (backoff esponenziale: 1min, 5min, 30min, 2h, 12h), altrimenti
//    marca "failed" definitivamente e registra last_error.
//
// Non blocca mai il salvataggio di un prodotto: gira in background,
// letto/scritto solo da questa funzione con la service role key.
import { createClient } from "npm:@supabase/supabase-js@2";

const BATCH_SIZE = 5; // prodotti per invocazione — tiene ogni run breve e sotto i limiti di tempo dell'edge function
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 12 * 60 * 60_000];

const TARGET_LANGUAGES: Record<string, string> = {
  en: "inglese", es: "spagnolo", fr: "francese", de: "tedesco",
  pt: "portoghese", nl: "olandese", pl: "polacco",
};

function getServiceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

interface GlossaryEntry {
  source_term: string;
  target_language: string | null;
  preferred_translation: string | null;
  preserve_exact: boolean;
  notes: string | null;
}

function buildGlossaryBlock(glossary: GlossaryEntry[]): string {
  if (!glossary.length) return "";
  const lines = glossary.map((g) => {
    if (g.preserve_exact) return `- "${g.source_term}": non tradurre, lasciare esattamente invariato in ogni lingua.`;
    if (g.preferred_translation) return `- "${g.source_term}" → "${g.preferred_translation}"${g.target_language ? ` (solo per ${g.target_language})` : " (in tutte le lingue target)"}`;
    return `- "${g.source_term}": ${g.notes || "termine tecnico, tradurre con equivalente locale corretto"}`;
  });
  return `\n\nGlossario terminologico da rispettare rigorosamente:\n${lines.join("\n")}`;
}

async function translateEntity(
  name: string, description: string, specifications: string | null,
  metaTitle: string | null, metaDescription: string | null,
  glossaryBlock: string
): Promise<Record<string, { name: string; description: string; specifications: string; meta_title: string; meta_description: string }> | null> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) { console.warn("⚠️ ANTHROPIC_API_KEY non configurata"); return null; }

  const langList = Object.entries(TARGET_LANGUAGES).map(([code, label]) => `"${code}" (${label})`).join(", ");
  const prompt = `Sei il motore di localizzazione di Oralzon, marketplace odontoiatrico B2B europeo. Traduci con terminologia odontoiatrica professionale. Non modificare marchi, codici SKU, riferimenti ISO, numeri di modello, unità di misura e nomenclature tecniche protette. Non aggiungere informazioni non presenti nel testo originale.

Traduci la seguente scheda prodotto dall'italiano nelle lingue: ${langList}.

Nome prodotto: ${name}
Descrizione: ${description || "(nessuna)"}
Scheda tecnica: ${specifications || "(nessuna)"}
Meta title SEO: ${metaTitle || "(nessuno)"}
Meta description SEO: ${metaDescription || "(nessuna)"}${glossaryBlock}

Regole:
- Traduzione professionale e naturale, tono B2B, terminologia odontoiatrica/medicale corretta in ogni lingua.
- Se un campo è vuoto ("(nessuno/a)"), restituiscilo come stringa vuota "" in tutte le lingue, non inventare contenuto.
- Il meta title tradotto deve restare entro 60 caratteri circa, la meta description entro 155 circa (limiti SEO standard) — se il campo sorgente è vuoto, genera un meta title/description brevi e pertinenti a partire da nome e categoria del prodotto invece di lasciarli vuoti.
- Rispondi SOLO con un oggetto JSON valido, nessun testo prima o dopo, in questo formato esatto:
{"en":{"name":"...","description":"...","specifications":"...","meta_title":"...","meta_description":"..."},"es":{...},"fr":{...},"de":{...},"pt":{...},"nl":{...},"pl":{...}}`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 3072, messages: [{ role: "user", content: prompt }] }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
  const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim();
  const parsed = JSON.parse(cleaned);

  const missing = Object.keys(TARGET_LANGUAGES).filter((l) => !parsed[l]?.name);
  if (missing.length > 0) throw new Error(`Lingue mancanti nella risposta: ${missing.join(", ")}`);

  return parsed;
}

Deno.serve(async (req: Request) => {
  // Stesso pattern già in uso per system/process-pending-transfers: un
  // secret dedicato (CRON_SECRET), non la service_role key — se dovesse
  // trapelare, il danno massimo è forzare il job in anticipo, non
  // accesso completo al database.
  const auth = req.headers.get("Authorization") || "";
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ success: false, error: "Non autorizzato" }), { status: 401 });
  }

  const supabase = getServiceClient();
  const now = new Date().toISOString();

  const { data: jobs, error: jobsErr } = await supabase
    .from("translation_jobs")
    .select("*")
    .in("status", ["pending", "failed"])
    .lte("next_retry_at", now)
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (jobsErr) return new Response(JSON.stringify({ success: false, error: jobsErr.message }), { status: 500 });
  if (!jobs || jobs.length === 0) return new Response(JSON.stringify({ success: true, processed: 0 }), { status: 200 });

  const { data: glossary } = await supabase.from("translation_glossary").select("source_term, target_language, preferred_translation, preserve_exact, notes").eq("active", true);
  const glossaryBlock = buildGlossaryBlock(glossary || []);

  let processed = 0, failed = 0;

  for (const job of jobs) {
    await supabase.from("translation_jobs").update({ status: "processing", started_at: now, attempts: job.attempts + 1 }).eq("id", job.id);

    try {
      const { data: product, error: prodErr } = await supabase
        .from("products")
        .select("id, name, description, specifications, meta_title, meta_description")
        .eq("id", job.entity_id)
        .maybeSingle();
      if (prodErr) throw new Error(prodErr.message);
      if (!product) throw new Error("Prodotto non trovato (eliminato?)");

      // Se nel frattempo il prodotto è stato modificato di nuovo, questo job
      // è ormai obsoleto: lo saltiamo, il trigger ne avrà già creato uno nuovo.
      const { data: currentHash } = await supabase.rpc("compute_product_source_hash", {
        p_name: product.name, p_description: product.description, p_specifications: product.specifications,
        p_meta_title: product.meta_title, p_meta_description: product.meta_description,
      });
      if (currentHash && currentHash !== job.source_hash) {
        await supabase.from("translation_jobs").update({ status: "cancelled", completed_at: new Date().toISOString(), last_error: "Superato da una modifica più recente del prodotto" }).eq("id", job.id);
        continue;
      }

      const translations = await translateEntity(
        product.name, product.description || "", product.specifications || null,
        product.meta_title || null, product.meta_description || null, glossaryBlock
      );
      if (!translations) throw new Error("ANTHROPIC_API_KEY non configurata");

      for (const lang of job.target_languages as string[]) {
        const t = translations[lang];
        if (!t) continue;
        // Non sovrascrivere mai una riga che un admin ha corretto a mano e
        // bloccato (locked=true) — controllo esplicito perché .upsert() di
        // supabase-js non supporta una clausola WHERE condizionale come fa
        // il trigger SQL lato database.
        const { data: existing } = await supabase
          .from("product_translations")
          .select("locked")
          .eq("product_id", job.entity_id)
          .eq("language_code", lang)
          .maybeSingle();
        if (existing?.locked) continue;

        await supabase.from("product_translations").upsert(
          {
            product_id: job.entity_id, language_code: lang,
            translated_name: t.name, translated_description: t.description, translated_specifications: t.specifications,
            translated_meta_title: t.meta_title, translated_meta_description: t.meta_description,
            source_hash: job.source_hash, translation_status: "completed",
            translation_provider: "anthropic", translated_at: new Date().toISOString(),
          },
          { onConflict: "product_id,language_code" }
        );
      }

      await supabase.from("translation_jobs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", job.id);
      processed++;
    } catch (e: any) {
      failed++;
      const attempts = job.attempts + 1;
      const delay = RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)];
      const nextRetry = new Date(Date.now() + delay).toISOString();
      const giveUp = attempts >= job.max_attempts;
      await supabase.from("translation_jobs").update({
        status: giveUp ? "failed" : "pending",
        next_retry_at: nextRetry,
        last_error: String(e?.message || e).slice(0, 500),
      }).eq("id", job.id);
      console.error(`❌ translation-worker job ${job.id} (prodotto ${job.entity_id}):`, e?.message || e);
    }
  }

  return new Response(JSON.stringify({ success: true, processed, failed, total: jobs.length }), { status: 200, headers: { "Content-Type": "application/json" } });
});
