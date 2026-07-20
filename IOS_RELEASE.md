# Pubblicare l'app iOS — guida passo passo (senza Mac fisico)

Hai già l'account Apple Developer / App Store Connect pagato: il resto si fa tramite il sito Apple Developer (che funziona anche da Windows/Linux) più la build automatica su GitHub Actions, che include un Mac vero nel cloud.

## 1. Registra l'app su App Store Connect

1. Vai su [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **App** → **+** → **Nuova App**
2. Bundle ID: `com.oralzon.myapp` (deve combaciare esattamente con quello nel progetto — stesso nome usato per Android)
3. Nome: Oralzon

## 2. Crea il certificato di distribuzione

Su [developer.apple.com/account/resources/certificates](https://developer.apple.com/account/resources/certificates):
1. **+** → **Apple Distribution**
2. Ti chiederà un file CSR (Certificate Signing Request) — su Windows/Linux puoi generarlo con OpenSSL (lo stesso tipo di terminale già usato per Android):
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
2. Prima serve creare l'**App ID** in **Identifiers** (se non esiste ancora): `com.oralzon.myapp`
3. Seleziona quell'App ID
4. Seleziona il certificato creato al punto 2
5. Scarica il file `.mobileprovision`

## 4. Trova il tuo Team ID

Su [developer.apple.com/account](https://developer.apple.com/account), in alto a destra sotto il tuo nome — un codice di 10 caratteri.

## 5. Crea la chiave API per il caricamento automatico

Su [appstoreconnect.apple.com](https://appstoreconnect.apple.com) → **Users and Access** → scheda **Integrations** → **Keys**:
1. **+** → ruolo **App Manager** → Genera
2. **Scarica subito il file `.p8`** (Apple lo mostra una sola volta)
3. Annota **Key ID** e **Issuer ID** mostrati nella stessa pagina

## 6. Carica tutto su GitHub come Secret

Repository → **Settings → Secrets and variables → Actions → New repository secret**:

| Nome | Valore |
|---|---|
| `IOS_CERTIFICATE_BASE64` | `base64 -w0 oralzon-certificate.p12` (Linux/Windows) del file creato al punto 2 |
| `IOS_CERTIFICATE_PASSWORD` | La password scelta al punto 2 |
| `IOS_PROVISIONING_PROFILE_BASE64` | `base64 -w0 nomefile.mobileprovision` del file scaricato al punto 3 |
| `APPLE_TEAM_ID` | Il Team ID del punto 4 |
| `APP_STORE_CONNECT_KEY_ID` | Il Key ID del punto 5 |
| `APP_STORE_CONNECT_ISSUER_ID` | L'Issuer ID del punto 5 |
| `APP_STORE_CONNECT_API_KEY_BASE64` | `base64 -w0 AuthKey_XXXXX.p8` del file scaricato al punto 5 |

Su Windows PowerShell, per convertire un file in base64 puoi usare lo stesso comando già usato per Android:
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("percorso\del\file")) | Set-Clipboard
```
(copia il risultato direttamente negli appunti, pronto per essere incollato nel campo Value di GitHub)

## 7. Lancia la build

Scheda **Actions** → **Build iOS App** → **Run workflow**. Il file `ExportOptions.plist` viene generato automaticamente durante la build usando i Secret sopra — non serve crearlo a mano.

Se tutti i Secret sono corretti, l'app viene caricata automaticamente su App Store Connect al termine della build — nessun Mac necessario in nessun momento. Da lì, la sottomissione in revisione (descrizione, screenshot, ecc.) si fa dalla dashboard web di App Store Connect.
