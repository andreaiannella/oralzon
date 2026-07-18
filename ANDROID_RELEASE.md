# Pubblicare l'app Android — guida passo passo

Hai già l'account Google Play Console pagato: questi sono gli unici passaggi che restano, tutti fattibili da browser + terminale, senza bisogno di Android Studio installato.

## 1. Crea il keystore di firma (una volta sola, per sempre)

Il keystore è il "certificato" che dimostra che gli aggiornamenti futuri dell'app vengono davvero da te — va conservato con cura, se lo perdi non potrai più aggiornare l'app pubblicata (dovresti pubblicarne una nuova da zero).

Se hai accesso a un terminale con Java installato (anche non un Mac — Linux o Windows vanno bene):

```bash
keytool -genkeypair -v -keystore oralzon-release.keystore \
  -alias oralzon -keyalg RSA -keysize 2048 -validity 10000
```

Ti chiederà una password (scegline una robusta e salvala in un posto sicuro, es. un password manager) e alcuni dati anagrafici dell'azienda — rispondi pure con i dati reali di Oralzon.

## 2. Carica il keystore su GitHub come "Secret"

Nel repository GitHub, vai su **Settings → Secrets and variables → Actions → New repository secret**, e crea questi quattro segreti:

- `ANDROID_KEYSTORE_BASE64` — il contenuto del file keystore convertito in base64. Sul tuo terminale: `base64 -i oralzon-release.keystore | pbcopy` (Mac) o `base64 -w0 oralzon-release.keystore` (Linux/Windows, poi copia l'output)
- `ANDROID_KEYSTORE_PASSWORD` — la password scelta al punto 1
- `ANDROID_KEY_ALIAS` — `oralzon` (o quello che hai scelto)
- `ANDROID_KEY_PASSWORD` — di solito uguale alla password del keystore, a meno che tu non ne abbia scelta una diversa

## 3. Lancia la build

Vai sulla scheda **Actions** del repository GitHub → **Build Android App** → **Run workflow**. In pochi minuti otterrai un file `.aab` scaricabile dai risultati (Artifacts) della build.

## 4. Carica su Google Play Console

1. Vai su [play.google.com/console](https://play.google.com/console)
2. Crea una nuova app, chiamala "Oralzon"
3. Nella sezione **Release → Production** (o inizia con un canale di test interno, consigliato per il primo giro), carica il file `.aab` scaricato
4. Compila le informazioni richieste (descrizione, screenshot, categoria — "Shopping" o "Business"), politica sulla privacy (puoi linkare `oralzon.com/privacy`)
5. Invia in revisione

La prima revisione di Google richiede di solito qualche ora fino a un paio di giorni.
