# Schema Reference — Stato finale del database

> **Scopo**: questo documento è la **fonte unica di verità** sullo stato atteso del database dopo l'esecuzione di tutte le migration. Serve per l'audit punto 7: invece di leggere 30+ file di migration (molti dei quali si sovrascrivono a vicenda), qui trovi la fotografia finale di cosa deve esistere e perché.
>
> Le migration restano lo storico "come ci siamo arrivati"; questo file è "dove siamo adesso".

Ultimo aggiornamento: migration `20260617000001_fix_recursive_admin_profile_policy`.

---

## File di riferimento in questa cartella

- **`schema_baseline_consolidated.sql`** — l'intero storico delle 34 migration incrementali, consolidato in un unico file organizzato per argomento (colonne core, vincoli, tabelle secondarie, indici, funzioni, trigger, viste, RLS, storage). **Non eseguirlo sul database live attuale** — è già in questo stato. Serve per ambienti nuovi (staging, disaster recovery) e come fotografia definitiva dello schema.
- **`migrations/`** — le migration numerate, da eseguire in ordine su un database che non le ha ancora tutte applicate (incluso il database live attuale, per quelle più recenti non ancora eseguite).
- **`migrations_archive/`** — copia di sicurezza dello storico completo delle migration al momento del consolidamento, per riferimento storico.

---

## Come leggere questo documento

Il progetto è cresciuto con molte migration incrementali, incluse diverse "fix di fix" (`fix_all_critical`, `definitive_fix`, `fix_rls_recursion`, ecc.). Alcune policy sono state ridefinite 2-3 volte in file diversi. **Vince sempre l'ultima eseguita in ordine cronologico.** Questo documento riflette quelle versioni finali.

Per un ambiente nuovo: esegui `schema_baseline_consolidated.sql` (dopo aver ricreato le tabelle core, vedi sotto). Per capire lo stato attuale: leggi questo file.

---

## 🔴 Bug trovato durante il consolidamento (corretto in `20260617000001`)

La policy **`"Admin can update any profile"`** su `profiles` (creata in `20260611000001_admin_management_actions`) usava una subquery che interroga `profiles` dall'interno di una policy sulla stessa tabella — lo stesso identico bug di ricorsione infinita che `20260612000001_fix_rls_recursion` aveva risolto il giorno dopo per altre 5 policy admin, ma questa era sfuggita al fix. Effetto pratico: un admin che modifica il profilo di un utente dalla dashboard molto probabilmente falliva silenziosamente. Corretto usando `is_admin()` come le altre.

---

## Come leggere questo documento

Il progetto è cresciuto con molte migration incrementali, incluse diverse "fix di fix" (`fix_all_critical`, `definitive_fix`, `fix_rls_recursion`, ecc.). Alcune policy sono state ridefinite 2-3 volte in file diversi. **Vince sempre l'ultima eseguita in ordine cronologico.** Questo documento riflette quelle versioni finali.

Per un ambiente nuovo: esegui tutte le migration in ordine di nome file (sono datate `YYYYMMDD`). Per capire lo stato attuale: leggi questo file.

---

## Tabelle

### Core (create dallo schema base Supabase, prima delle migration)
- **profiles** — anagrafica utenti. Colonne chiave: `id` (= auth.uid), `user_type` (`cliente` | `venditore` | `admin`), `email`, `nome`, `cognome`, dati fiscali/spedizione, `is_suspended`, `suspended_at`, `suspended_reason`.
- **vendors** — negozi. Colonne chiave: `id`, `profile_id` (→ profiles.id), `business_name`, `plan_type`, `plan_status`, `product_limit`, `verified_badge`, `trial_ends_at`, `contact_email`, `homepage_sponsored`, `homepage_expires_at`, `main_category`, `logo_url`, `store_description`.
- **products** — catalogo. Colonne chiave: `id`, `vendor_id` (→ vendors.id), `name`, `price`, `stock`, `status` (`published` | altro), `images` (array/jsonb), `is_sponsored`, `promo_expires_at`, `category`.
- **orders** — ordini. Colonne chiave: `id`, `customer_id` (→ profiles.id), `order_number`, `total_amount`, `status` (`pending` | `processing` | `shipped` | `delivered` | `cancelled` | `refunded` | `partially_refunded`), `stripe_session_id` (UNIQUE), `shipping_name/email/address`, `refunded_amount`, `admin_refund_id`, `admin_refunded_at`.
- **order_items** — righe ordine. Colonne chiave: `id`, `order_id`, `product_id`, `vendor_id`, `quantity`, `price` (IVA inclusa, prezzo pagato), `shipping_status`, `tracking_number`.

### Aggiunte da migration
- **promotions** — acquisti pacchetti visibilità. `status` ammette: `pending`, `active`, `expired`, `cancelled` (fix in `20260614000001`). Colonne: `vendor_id`, `package_id`, `package_name`, `amount_paid`, `stripe_session_id`, `expires_at`, `sponsored_category`, `selected_product_ids` (UUID[], aggiunta in `20260615000001`), `admin_refund_id`, `admin_refunded_at`.
- **returns** — richieste di reso. Trigger `update_returns_timestamp` aggiorna `updated_at`.
- **product_reviews** — recensioni prodotto (solo utenti autenticati, una per `user_id`).
- **product_questions** — Q&A prodotto. Domanda inserita dall'utente; risposta (update) solo dal vendor proprietario/admin (fix in hardening).
- **customer_addresses** — rubrica indirizzi cliente (accesso solo al proprietario).
- **wishlists** — preferiti (accesso solo al proprietario).
- **discount_codes**, **discount_code_uses** — codici sconto e utilizzi.
- **vendor_promo_codes**, **vendor_promo_redemptions** — codici promozionali per venditore.
- **invoices** — fatture (creazione solo di sistema/service_role).

### Tabelle RIMOSSE (non devono esistere)
Eliminate in `20260607000001_remove_messaging_add_contact`:
- ~~messages~~ · ~~conversations~~ (sistema messaggistica sostituito da email di contatto pubblica sulla vetrina)
- ~~vendor_ratings~~ (si recensiscono solo i prodotti, non i venditori)

Se una di queste esiste ancora nel tuo DB, la migration di rimozione non è stata eseguita.

---

## Funzioni e trigger

- **is_admin()** — `SECURITY DEFINER`, ritorna true se l'utente corrente è admin. Definita così per **evitare la ricorsione infinita** sulle policy di `profiles` (vedi `20260612000001`). Usare SEMPRE questa nelle policy admin, mai una subquery diretta su profiles.
- **is_service_role()** — `STABLE`, ritorna true se il JWT ha `role = 'service_role'`. Usata dalle policy che rappresentano azioni di sistema eseguite dall'edge function (aggiunta in hardening `20260616000001`).
- **create_vendor_for_user(...)** — `SECURITY DEFINER`, crea il vendor bypassando RLS (fallback all'edge function).
- **trigger_decrement_stock** / **decrement_stock_on_order_confirmed** — decrementa lo stock quando un ordine passa a `processing` (dopo pagamento confermato). Lo stock NON viene toccato alla creazione dell'ordine.
- **on_auth_user_created** — crea automaticamente il profilo alla registrazione.
- **update_returns_timestamp** / **trigger_returns_updated** — mantiene `updated_at` sui resi.

---

## Viste (pubbliche, bypassano RLS in lettura)

- **public_product_sales_stats** — `product_id`, `total_sold`. Alimenta la sezione "Più Acquistati" in home senza esporre `order_items`.
- **public_active_category_sponsors** — sponsor di categoria attivi.
- **vendor_fiscal_summary** — riepilogo fiscale mensile per venditore (`periodo`, `num_ordini`, `imponibile`, `iva_22`, `totale_ivato`, `commissione_piattaforma`, `netto_vendor`).

---

## Politica RLS — principi finali (dopo hardening `20260616000001`)

Regola generale da tenere a mente:

> Il **service_role bypassa sempre RLS**. Quindi una policy `USING (true)` NON "lascia lavorare solo l'edge function" — apre la porta a **chiunque** abbia la chiave anon (pubblica). Le azioni di sistema vanno protette con `is_service_role()`, non con `true`.

### Letture pubbliche INTENZIONALI (USING true corretto)
Questi dati sono pubblici per design, `USING (true)` è giusto:
- `products` SELECT (catalogo)
- `product_reviews` SELECT, `product_questions` SELECT
- `vendors` SELECT (vetrine store)
- viste `public_*`

### Scritture di SISTEMA (solo service_role)
Ristrette a `is_service_role()` in hardening:
- `orders` INSERT/UPDATE
- `order_items` INSERT/DELETE
- `invoices` INSERT
- `profiles` INSERT (o il proprio `auth.uid() = id`)

### Scritture UTENTE (legate all'ownership)
- `products` — il vendor gestisce solo i propri (`vendor_id IN (SELECT id FROM vendors WHERE profile_id = auth.uid())`); admin tutto via `is_admin()`.
- `order_items` UPDATE — il vendor aggiorna solo le righe dei propri prodotti (tracking/shipping); admin e service_role tutto.
- `product_questions` UPDATE (risposta) — solo vendor proprietario del prodotto / admin / service_role.
- `vendors` INSERT — solo il proprio record (`profile_id = auth.uid()`).
- `product_reviews`, `vendor_promo_*`, `customer_addresses`, `wishlists` — solo il proprietario (`user_id = auth.uid()`).
- `profiles` UPDATE — solo il proprio (`auth.uid() = id`).

### Accesso ADMIN
Sempre tramite `is_admin()` (mai subquery diretta su profiles, per evitare ricorsione).

---

## Stripe Connect — pagamenti automatizzati ai venditori

Architettura: **Express accounts + Separate Charges and Transfers**, fondi trattenuti fino a consegna confermata.

- Il cliente paga **sempre** Oralzon in un'unica transazione (anche con più venditori nello stesso carrello) — questo non cambia rispetto a prima.
- Ogni venditore ha un **conto Stripe Express** collegato (`vendors.stripe_account_id`), creato al primo accesso a "Pagamenti" nella dashboard. L'onboarding (dati aziendali, IBAN, documento) è ospitato interamente da Stripe.
- **Il trasferimento al venditore avviene solo alla consegna confermata**, non al pagamento: o il cliente clicca "Confermo la ricezione" nei suoi ordini, o scatta automaticamente dopo 7 giorni dalla spedizione (se non c'è un reso aperto) tramite il job schedulato in `CRON_SETUP.sql`.
- Il trasferimento è sempre al **netto della commissione** (`vendors.commission_pct`), calcolata al momento del trasferimento, non al momento dell'ordine.
- **Rimborsi**: sia il rimborso admin (`admin/refund-order`, intero ordine) sia quello venditore via reso (`returns/decision`, singola riga) recuperano automaticamente la quota già trasferita al venditore (`stripe.transfers.createReversal`) prima di considerarsi completati. Se il recupero fallisce (es. il venditore ha già ritirato i fondi sul proprio conto bancario), l'operazione non si blocca ma restituisce un warning da verificare manualmente.
- **`vendor_transfers`** è il registro locale di tutti i trasferimenti (completati, falliti, recuperati in tutto o in parte) — usalo per riconciliare col report fiscale; Stripe resta comunque la fonte di verità sui soldi.

**Endpoint principali**: `POST /stripe/connect/onboard` (avvia/riprende l'onboarding), `GET /stripe/connect/status` (stato + storico trasferimenti + fondi in sospeso), `POST /customer/confirm-delivery` (cliente conferma ricezione), `POST /system/process-pending-transfers` (job schedulato, richiede la service_role key).

**Da fare una tantum su Supabase** (non automatizzabile da qui): abilitare le estensioni `pg_cron` e `pg_net`, poi eseguire `CRON_SETUP.sql` con i tuoi valori di progetto — vedi le istruzioni nel file.

## Spedizione personalizzata per prodotto

`products.shipping_cost_override` (nullable): se valorizzato, sostituisce `vendors.shipping_cost` solo per quel prodotto — pensato per articoli pesanti/ingombranti (es. poltrone da studio) che costano di più da spedire del resto del catalogo. `products.shipping_weight_kg` è puramente informativo per ora, non alimenta calcoli automatici.

Al checkout, per ogni venditore nel carrello: gli articoli senza override si sommano e si confrontano con `free_shipping_threshold` come sempre; gli articoli con override si aggiungono a parte, al **massimo** tra quelli presenti (non sommati — viaggiano comunque in un unico pacco). Il calcolo è autoritativo lato server (`stripe/create-checkout`), il client non è mai attendibile per l'importo della spedizione — stesso principio già applicato al prezzo prodotto.

## Report vendite venditore (ex "Report Fiscale")

La vista `vendor_fiscal_summary` non calcola più IVA (aliquota fissa al 22% era sbagliata per venditori esteri con regimi diversi) né espone la commissione piattaforma come voce separata — il venditore vede solo `num_ordini`, `num_items` e `fatturato` (netto, la commissione è già sottratta nel calcolo ma non mostrata come riga a parte), stessa filosofia di Amazon Seller Central.

## Performance

- **Code-splitting per rotta**: ogni pagina si carica solo quando serve (React.lazy), invece di un unico bundle da 2,26 MB scaricato da ogni visitatore. La home ora scarica ~536 KB invece di 2.262 KB (~75% in meno).
- **Chunk vendor separato** (`vendor-react`): React/Router isolati in un chunk stabile, cachabile dal browser tra un deploy e l'altro.
- **`netlify.toml`**: cache lunga e immutabile sugli asset con hash (`/assets/*`), sempre fresco su `index.html`, header di sicurezza di base.
- **`loading="lazy"`** sulle immagini prodotto nelle liste/griglie (ProductCard, VendorStore, CustomerOrders) — non si scaricano più le immagini fuori schermo.

## Sicurezza — audit e correzioni

- **CORS ristretto**: da `origin: "*"` (qualsiasi sito) a una whitelist dei domini reali di Oralzon + anteprime Netlify.
- **Rate limiting di base** su checkout, invio email (welcome-customer, notify-shipping), richieste di reso — protezione in-memory per istanza, non distribuita: da rafforzare con uno store condiviso (es. Redis) se il traffico cresce molto.
- **Dipendenze**: `vite` aggiornato a 6.4.3 (corregge 3 vulnerabilità alte, impatto comunque limitato al solo server di sviluppo, mai eseguito in produzione). `xlsx` (SheetJS, usato per l'import Excel venditori) ha 2 vulnerabilità note senza fix disponibile su npm — rischio basso perché il file processato è sempre quello caricato volontariamente dal venditore nel proprio browser, non input di terzi; da tenere d'occhio, valutare una libreria alternativa se SheetJS non rilascia una patch.
- **Verificato, già a posto**: upload immagini validato anche lato server (bucket Supabase con limite 5MB e tipi ammessi, non solo controllo client), nessun rischio XSS reale nel codice, nessuna assegnazione di massa nelle scritture al database, tutti gli endpoint admin controllano correttamente l'autorizzazione.
- **Non corretto in questo giro, noto**: molti endpoint restituiscono `error.message` grezzo al client nei blocchi catch — può occasionalmente esporre dettagli interni (es. nomi di colonne del database) a chi intercetta la risposta. Rischio basso ma da ripulire in una prossima sessione dedicata, dato il numero di punti coinvolti nel codice.

## Debito tecnico noto (non bloccante)

1. **32 migration, molte "fix di fix"** — consolidabili in un unico schema base pulito prima di un eventuale reset dell'ambiente. Non urgente finché il DB attuale è coerente con questo documento.
2. **Branding "DentalClean" hardcoded** — presente in ~25 file frontend + email backend. Da centralizzare in un'unica costante quando si finalizza il nuovo nome.
3. **`product_limit` sempre 999999** — nessun piano impone davvero un limite prodotti al momento.
