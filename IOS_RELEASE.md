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

Scheda **Actions** → **Build iOS App** → **Run workflow**. Alla fine otterrai un file `.ipa` scaricabile.

## 7. Carica su App Store Connect

Il modo più semplice senza Mac: usa lo strumento **Transporter** — esiste solo per Mac, quindi se proprio non hai accesso a nessun Mac nemmeno in prestito, dimmelo e aggiungo alla build automatica anche il caricamento diretto su App Store Connect mancante ora (richiede una API Key App Store Connect, altro Secret da configurare) invece di scaricare e caricare manualmente il file.
