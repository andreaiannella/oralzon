# Pubblicare l'app iOS — guida passo passo (senza Mac fisico)

Hai già l'account Apple Developer / App Store Connect pagato: il resto si fa tramite il sito Apple Developer (che funziona anche da Windows/Linux) più la build automatica su GitHub Actions, che include un Mac vero nel cloud.

## 1. Registra l'app su App Store Connect

1. Vai su [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **App** → **+** → **Nuova App**
2. Bundle ID: `com.oralzon.app` (deve combaciare esattamente con quello in `capacitor.config.ts`)
3. Nome: Oralzon

## 2. Crea il certificato di distribuzione

Su [developer.apple.com/account/resources/certificates](https://developer.apple.com/account/resources/certificates):
1. **+** → **Apple Distribution**
2. Ti chiederà un file CSR (Certificate Signing Request) — su Windows/Linux puoi generarlo con OpenSSL:
   ```bash
   openssl req -new -newkey rsa:2048 -nodes -keyout oralzon.key -out oralzon.csr -subj "/CN=Oralzon/O=Oralzon/C=IT"
   ```
3. Carica il `.csr`, scarica il certificato generato (`.cer`)
4. Converti certificato + chiave privata in un unico file `.p12` (il formato che serve per firmare):
   ```bash
   openssl x509 -in distribution.cer -inform DER -out distribution.pem -outform PEM
   openssl pkcs12 -export -out oralzon-certificate.p12 -inkey oralzon.key -in distribution.pem -password pass:UNA_PASSWORD_A_TUA_SCELTA
   ```

## 3. Crea il Provisioning Profile

Su [developer.apple.com/account/resources/profiles](https://developer.apple.com/account/resources/profiles):
1. **+** → **App Store** (tipo di distribuzione)
2. Seleziona l'App ID `com.oralzon.app` (va creato prima in **Identifiers** se non esiste ancora)
3. Seleziona il certificato creato al punto 2
4. Scarica il file `.mobileprovision`

## 4. Carica tutto su GitHub come Secret

Nel repository → **Settings → Secrets and variables → Actions → New repository secret**:

- `IOS_CERTIFICATE_BASE64` — `base64 -w0 oralzon-certificate.p12` (Linux/Windows) o `base64 -i oralzon-certificate.p12 | pbcopy` (Mac)
- `IOS_CERTIFICATE_PASSWORD` — la password scelta al punto 2
- `IOS_PROVISIONING_PROFILE_BASE64` — `base64 -w0 nomefile.mobileprovision`

## 5. Aggiungi il file ExportOptions.plist

Nel repository, dentro `ios/App/`, crea un file `ExportOptions.plist` (dimmi quando sei arrivato qui e te lo preparo con i valori esatti — serve il tuo Team ID Apple, visibile in alto a destra su developer.apple.com).

## 6. Lancia la build

Scheda **Actions** → **Build iOS App** → **Run workflow**. Alla fine, se hai completato anche il punto 7 sotto, l'app verrà caricata automaticamente su App Store Connect — nessun Mac necessario in nessun momento.

## 7. Caricamento automatico su App Store Connect (sostituisce Transporter)

Dato che non hai accesso a nessun Mac, la build carica l'app da sola tramite una chiave API — non serve Transporter né nessun passaggio manuale da Mac.

1. Vai su [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Users and Access** → scheda **Integrations** → **Keys** (a volte indicata come "App Store Connect API")
2. **+** per generare una nuova chiave → ruolo **App Manager** (sufficiente per caricare build) → Genera
3. **Scarica subito il file `.p8`** — Apple te lo mostra **una sola volta**, se lo perdi devi generarne un'altra
4. Annota anche i due codici mostrati nella stessa pagina: **Key ID** e **Issuer ID** (quest'ultimo è lo stesso per tutte le chiavi del tuo account, lo vedi in cima alla pagina)
5. Carica come Secret su GitHub (stesso posto dei precedenti):
   - `APP_STORE_CONNECT_KEY_ID` → il Key ID del punto 4
   - `APP_STORE_CONNECT_ISSUER_ID` → l'Issuer ID del punto 4
   - `APP_STORE_CONNECT_API_KEY_BASE64` → il contenuto del file `.p8` convertito in base64 (`base64 -w0 AuthKey_XXXXX.p8` su Linux/Windows)

Da questo momento, ogni volta che lanci la build iOS, l'app arriva automaticamente su App Store Connect, pronta per essere sottomessa in revisione dalla dashboard web (quella parte, compilare descrizione/screenshot/invio in revisione, si fa dal sito, non serve un Mac nemmeno lì).
