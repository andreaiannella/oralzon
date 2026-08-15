// ═══════════════════════════════════════════════════════════════════
// TRANSLATION WORKER — Oralzon Translation Engine
// ═══════════════════════════════════════════════════════════════════
// Funzione separata (non dentro make-server-000b3cfb) apposta: è invocata
// da pg_cron ogni minuto via pg_net, non da richieste utente, e tenerla
// isolata dal server principale permette di modificarla/ridistribuirla
// senza mai toccare il file grande che gestisce checkout, Stripe, ordini.
//
// PROVIDER MULTIPLI (nessuna dipendenza da un singolo servizio):
// prova i provider configurati in TRANSLATION_PROVIDER_PRIORITY, in
// ordine, finché uno non risponde correttamente. Se DeepL esaurisce la
// quota gratuita o Anthropic finisce il credito, il worker passa
// automaticamente al successivo — nessun intervento manuale necessario,
// nessun punto singolo di fallimento.
//
// Cosa fa a ogni invocazione:
// 1. Prende fino a BATCH_SIZE job "pending" (o "failed" con next_retry_at
//    passato), in ordine di priorità e poi di data creazione.
// 2. Per ciascuno, per ogni lingua target: prova i provider in ordine,
//    scrive in product_translations (mai sovrascrivendo righe con
//    locked=true) il risultato del primo che ha successo.
// 3. Se TUTTI i provider falliscono per un job: incrementa "attempts",
//    se sotto max_attempts rimette lo status a "pending" con
//    next_retry_at posticipato (backoff esponenziale: 1min, 5min, 30min,
//    2h, 12h), altrimenti marca "failed" definitivamente.
//
// Non blocca mai il salvataggio di un prodotto: gira in background,
// letto/scritto solo da questa funzione con la service role key.
import { createClient } from "npm:@supabase/supabase-js@2";

const BATCH_SIZE = 5;
const RETRY_DELAYS_MS = [60_000, 5 * 60_000, 30 * 60_000, 2 * 60 * 60_000, 12 * 60 * 60_000];

const TARGET_LANGUAGES = ["en", "es", "fr", "de", "pt", "nl", "pl"] as const;
type LangCode = typeof TARGET_LANGUAGES[number];

type Fields = { name: string; description: string; specifications: string; meta_title: string; meta_description: string };
const FIELD_KEYS: (keyof Fields)[] = ["name", "description", "specifications", "meta_title", "meta_description"];

function getServiceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

// ── Glossario: sostituzione con segnaposto, applicata PRIMA di chiamare
// qualsiasi provider e ripristinata DOPO. È deliberatamente provider-
// agnostica e deterministica — non si affida al fatto che un LLM segua
// un'istruzione nel prompt (Claude può comunque ignorarla), e funziona
// identica sia con un motore di traduzione "puro" come DeepL sia con un
// LLM. I segnosposto usano parentesi quadre doppie con un indice, un
// pattern che i motori di traduzione tendono a preservare intatto. ──
interface GlossaryEntry {
  source_term: string;
  target_language: string | null;
  preferred_translation: string | null;
  preserve_exact: boolean;
  case_sensitive: boolean;
}

function escapeRegex(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

function applyGlossaryPlaceholders(fields: Fields, glossary: GlossaryEntry[]): { fields: Fields; map: { token: string; entry: GlossaryEntry }[] } {
  const map: { token: string; entry: GlossaryEntry }[] = [];
  let counter = 0;
  const out: any = { ...fields };
  for (const entry of glossary) {
    const flags = entry.case_sensitive ? "g" : "gi";
    const re = new RegExp(escapeRegex(entry.source_term), flags);
    for (const key of FIELD_KEYS) {
      if (typeof out[key] !== "string" || !out[key]) continue;
      if (re.test(out[key])) {
        const token = `[[G${counter++}]]`;
        map.push({ token, entry });
        out[key] = out[key].replace(re, token);
      }
      re.lastIndex = 0;
    }
  }
  return { fields: out, map };
}

function restoreGlossaryPlaceholders(fields: Fields, map: { token: string; entry: GlossaryEntry }[], targetLang: string): Fields {
  const out: any = { ...fields };
  for (const key of FIELD_KEYS) {
    if (typeof out[key] !== "string") continue;
    for (const { token, entry } of map) {
      const replacement = entry.preserve_exact
        ? entry.source_term
        : (entry.target_language && entry.target_language !== targetLang ? entry.source_term : (entry.preferred_translation || entry.source_term));
      out[key] = out[key].split(token).join(replacement);
    }
  }
  return out;
}

// ── Astrazione provider ──
interface TranslationProvider {
  readonly name: string;
  isConfigured(): boolean;
  translate(fields: Fields, targetLang: LangCode): Promise<Fields>;
}

// ── Provider 1: DeepL — motore di traduzione dedicato, non un LLM
// generico. Piano gratuito reale (500.000 caratteri/mese), nessuna
// dipendenza da Anthropic. Le chiavi del piano free terminano per ":fx",
// il che determina automaticamente l'endpoint corretto da usare. ──
const DEEPL_TARGET_LANG: Record<LangCode, string> = {
  en: "EN-GB", es: "ES", fr: "FR", de: "DE", pt: "PT-PT", nl: "NL", pl: "PL",
};

class DeepLProvider implements TranslationProvider {
  readonly name = "deepl";
  private apiKey = Deno.env.get("DEEPL_API_KEY");

  isConfigured(): boolean { return !!this.apiKey; }

  async translate(fields: Fields, targetLang: LangCode): Promise<Fields> {
    const endpoint = this.apiKey!.endsWith(":fx") ? "https://api-free.deepl.com/v2/translate" : "https://api.deepl.com/v2/translate";
    const texts = FIELD_KEYS.map((k) => fields[k] || "");
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `DeepL-Auth-Key ${this.apiKey}` },
      body: JSON.stringify({
        text: texts,
        // BUG CORRETTO: qui c'era source_lang: "IT" scritto fisso. Finche' i
        // venditori erano tutti italiani non si notava, ma la piattaforma e'
        // aperta a 27 Paesi: al primo venditore tedesco che carica
        // "Nitril-Handschuhe" il sistema avrebbe detto a DeepL "questo testo
        // e' italiano, traducilo in francese", producendo traduzioni
        // sbagliate su tutto il suo catalogo — e in silenzio, perche'
        // nessun errore viene sollevato quando si forza una lingua errata.
        //
        // Omettendo il parametro DeepL riconosce da solo la lingua di
        // partenza e la restituisce in detected_source_language. Il
        // marketplace smette cosi' di avere l'italiano come lingua
        // privilegiata: ogni venditore scrive nella propria e il sistema
        // porta il prodotto nelle altre sette.
        target_lang: DEEPL_TARGET_LANG[targetLang],
        tag_handling: "xml",
        // Non tocca il contenuto dentro tag <keep> — usato per proteggere i
        // segnaposto glossario da eventuale normalizzazione/riformattazione.
        ignore_tags: ["keep"],
      }),
    });
    if (!res.ok) throw new Error(`DeepL API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    // Se la lingua di partenza rilevata coincide con quella di destinazione
    // non ha senso sovrascrivere il testo originale con una sua traduzione
    // circolare: si restituisce l'originale, che e' sempre migliore di un
    // andata e ritorno automatico.
    const detected: string | undefined = (data.translations || [])[0]?.detected_source_language;
    if (detected && detected.toUpperCase() === String(DEEPL_TARGET_LANG[targetLang]).toUpperCase().split('-')[0]) {
      const same: any = {};
      FIELD_KEYS.forEach((k) => { same[k] = fields[k] || ""; });
      return same as Fields;
    }
    const translations: string[] = (data.translations || []).map((t: any) => t.text || "");
    if (translations.length !== FIELD_KEYS.length) throw new Error("DeepL: numero di campi tradotti inatteso");
    const out: any = {};
    FIELD_KEYS.forEach((k, i) => { out[k] = translations[i]; });
    return out as Fields;
  }
}

// ── Provider 2: Anthropic Claude — usato come fallback se DeepL non è
// configurato o fallisce (quota, credito, errore di rete). Stessa logica
// di sostituzione segnaposto per il glossario, non più affidata solo
// all'istruzione nel prompt. ──
const ANTHROPIC_LANG_LABEL: Record<LangCode, string> = {
  en: "inglese", es: "spagnolo", fr: "francese", de: "tedesco", pt: "portoghese", nl: "olandese", pl: "polacco",
};

class AnthropicProvider implements TranslationProvider {
  readonly name = "anthropic";
  private apiKey = Deno.env.get("ANTHROPIC_API_KEY");

  isConfigured(): boolean { return !!this.apiKey; }

  async translate(fields: Fields, targetLang: LangCode): Promise<Fields> {
    const prompt = `Sei il motore di localizzazione di Oralzon, marketplace odontoiatrico B2B europeo. Traduci con terminologia odontoiatrica professionale verso il ${ANTHROPIC_LANG_LABEL[targetLang]}, riconoscendo da solo la lingua del testo di partenza — puo' essere una qualsiasi delle lingue europee, non necessariamente l'italiano: i venditori scrivono nella propria lingua. Non aggiungere informazioni non presenti nel testo originale. Non tradurre né modificare in alcun modo i token nella forma [[G0]], [[G1]] ecc. — sono segnaposto tecnici da lasciare identici, verranno sostituiti dopo.

Nome prodotto: ${fields.name}
Descrizione: ${fields.description || "(nessuna)"}
Scheda tecnica: ${fields.specifications || "(nessuna)"}
Meta title SEO: ${fields.meta_title || "(nessuno)"}
Meta description SEO: ${fields.meta_description || "(nessuna)"}

Regole:
- Se un campo è vuoto ("(nessuno/a)"), restituiscilo come stringa vuota "" — non inventare contenuto.
- Meta title entro ~60 caratteri, meta description entro ~155 — se il campo sorgente è vuoto, generane uno breve e pertinente da nome e contesto del prodotto invece di lasciarlo vuoto.
- Rispondi SOLO con un oggetto JSON valido, nessun testo prima o dopo, in questo formato esatto:
{"name":"...","description":"...","specifications":"...","meta_title":"...","meta_description":"..."}`;

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": this.apiKey!, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1024, messages: [{ role: "user", content: prompt }] }),
    });
    if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
    const data = await res.json();
    const text = (data.content || []).filter((b: any) => b.type === "text").map((b: any) => b.text).join("");
    const cleaned = text.replace(/^```json\s*|\s*```$/g, "").trim();
    const parsed = JSON.parse(cleaned);
    for (const k of FIELD_KEYS) if (typeof parsed[k] !== "string") throw new Error(`Anthropic: campo mancante nella risposta: ${k}`);
    return parsed as Fields;
  }
}

function buildProviders(): TranslationProvider[] {
  const all: Record<string, TranslationProvider> = { deepl: new DeepLProvider(), anthropic: new AnthropicProvider() };
  const priority = (Deno.env.get("TRANSLATION_PROVIDER_PRIORITY") || "deepl,anthropic").split(",").map((s) => s.trim()).filter(Boolean);
  const ordered = priority.map((name) => all[name]).filter(Boolean) as TranslationProvider[];
  // Qualunque provider non citato in priority viene comunque incluso in coda,
  // così un secret aggiunto in futuro senza aggiornare la env var funziona lo stesso.
  for (const p of Object.values(all)) if (!ordered.includes(p)) ordered.push(p);
  return ordered;
}

/** Traduce un prodotto in una lingua provando i provider in ordine di priorità finché uno non ha successo. Lancia un errore solo se TUTTI falliscono. */
async function translateWithFailover(fields: Fields, targetLang: LangCode, glossary: GlossaryEntry[], providers: TranslationProvider[]): Promise<{ result: Fields; providerUsed: string }> {
  const { fields: maskedFields, map } = applyGlossaryPlaceholders(fields, glossary);
  const errors: string[] = [];
  for (const provider of providers) {
    if (!provider.isConfigured()) continue;
    try {
      const translated = await provider.translate(maskedFields, targetLang);
      return { result: restoreGlossaryPlaceholders(translated, map, targetLang), providerUsed: provider.name };
    } catch (e: any) {
      errors.push(`${provider.name}: ${e?.message || e}`);
    }
  }
  throw new Error(errors.length ? errors.join(" | ") : "Nessun provider di traduzione configurato (imposta DEEPL_API_KEY o ANTHROPIC_API_KEY)");
}

Deno.serve(async (req: Request) => {
  // Stesso pattern già in uso per system/process-pending-transfers: un
  // secret dedicato (CRON_SECRET), non la service_role key.
  const auth = req.headers.get("Authorization") || "";
  const cronSecret = Deno.env.get("CRON_SECRET");
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ success: false, error: "Non autorizzato" }), { status: 401 });
  }

  // Modalità diagnostica: interroga direttamente DeepL per l'uso reale
  // dell'account (endpoint ufficiale /v2/usage), invece di fidarsi di un
  // numero pubblicato altrove — piani ed etichette cambiano nel tempo,
  // solo l'account reale sa qual è il proprio limite attuale.
  const url = new URL(req.url);
  if (url.searchParams.get("check") === "usage") {
    const deeplKey = Deno.env.get("DEEPL_API_KEY");
    if (!deeplKey) return new Response(JSON.stringify({ success: false, error: "DEEPL_API_KEY non configurata" }), { status: 200 });
    const endpoint = deeplKey.endsWith(":fx") ? "https://api-free.deepl.com/v2/usage" : "https://api.deepl.com/v2/usage";
    try {
      const res = await fetch(endpoint, { headers: { "Authorization": `DeepL-Auth-Key ${deeplKey}` } });
      const data = await res.json();
      if (url.searchParams.get("persist") === "true") {
        const supabase = getServiceClient();
        await supabase.from("translation_provider_usage_log").insert({
          provider: "deepl", character_count: data.character_count ?? null, character_limit: data.character_limit ?? null,
        });
      }
      return new Response(JSON.stringify({ success: true, deepl_account_type: deeplKey.endsWith(":fx") ? "free" : "pro", ...data }), { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (e: any) {
      return new Response(JSON.stringify({ success: false, error: String(e?.message || e) }), { status: 200 });
    }
  }

  const supabase = getServiceClient();
  const now = new Date().toISOString();
  const providers = buildProviders();

  const { data: jobs, error: jobsErr } = await supabase
    .from("translation_jobs").select("*")
    .in("status", ["pending", "failed"]).lte("next_retry_at", now)
    .order("priority", { ascending: true }).order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (jobsErr) return new Response(JSON.stringify({ success: false, error: jobsErr.message }), { status: 500 });
  if (!jobs || jobs.length === 0) return new Response(JSON.stringify({ success: true, processed: 0 }), { status: 200 });

  const { data: glossaryRaw } = await supabase.from("translation_glossary")
    .select("source_term, target_language, preferred_translation, preserve_exact, case_sensitive").eq("active", true);
  const glossary = (glossaryRaw || []) as GlossaryEntry[];

  let processed = 0, failed = 0;

  for (const job of jobs) {
    await supabase.from("translation_jobs").update({ status: "processing", started_at: now, attempts: job.attempts + 1 }).eq("id", job.id);

    try {
      const { data: product, error: prodErr } = await supabase
        .from("products").select("id, name, description, specifications, meta_title, meta_description")
        .eq("id", job.entity_id).maybeSingle();
      if (prodErr) throw new Error(prodErr.message);
      if (!product) throw new Error("Prodotto non trovato (eliminato?)");

      const { data: currentHash } = await supabase.rpc("compute_product_source_hash", {
        p_name: product.name, p_description: product.description, p_specifications: product.specifications,
        p_meta_title: product.meta_title, p_meta_description: product.meta_description,
      });
      if (currentHash && currentHash !== job.source_hash) {
        await supabase.from("translation_jobs").update({ status: "cancelled", completed_at: new Date().toISOString(), last_error: "Superato da una modifica più recente del prodotto" }).eq("id", job.id);
        continue;
      }

      const sourceFields: Fields = {
        name: product.name || "", description: product.description || "", specifications: product.specifications || "",
        meta_title: product.meta_title || "", meta_description: product.meta_description || "",
      };

      const langErrors: string[] = [];
      for (const lang of (job.target_languages as LangCode[])) {
        const { data: existing } = await supabase.from("product_translations").select("locked")
          .eq("product_id", job.entity_id).eq("language_code", lang).maybeSingle();
        if (existing?.locked) continue; // mai sovrascrivere una correzione manuale bloccata

        try {
          const { result, providerUsed } = await translateWithFailover(sourceFields, lang, glossary, providers);
          await supabase.from("product_translations").upsert({
            product_id: job.entity_id, language_code: lang,
            translated_name: result.name, translated_description: result.description, translated_specifications: result.specifications,
            translated_meta_title: result.meta_title, translated_meta_description: result.meta_description,
            source_hash: job.source_hash, translation_status: "completed",
            translation_provider: providerUsed, translated_at: new Date().toISOString(),
          }, { onConflict: "product_id,language_code" });
        } catch (langErr: any) {
          langErrors.push(`[${lang}] ${langErr?.message || langErr}`);
        }
      }

      if (langErrors.length > 0) throw new Error(langErrors.join(" ; "));

      await supabase.from("translation_jobs").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", job.id);
      processed++;
    } catch (e: any) {
      failed++;
      const attempts = job.attempts + 1;
      const delay = RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)];
      const giveUp = attempts >= job.max_attempts;
      await supabase.from("translation_jobs").update({
        status: giveUp ? "failed" : "pending",
        next_retry_at: new Date(Date.now() + delay).toISOString(),
        last_error: String(e?.message || e).slice(0, 500),
      }).eq("id", job.id);
      console.error(`❌ translation-worker job ${job.id} (prodotto ${job.entity_id}):`, e?.message || e);
    }
  }

  return new Response(JSON.stringify({ success: true, processed, failed, total: jobs.length, providers: providers.filter(p => p.isConfigured()).map(p => p.name) }), { status: 200, headers: { "Content-Type": "application/json" } });
});
