# Pubblicare un aggiornamento Capgo senza terminale

Tutto dal sito di GitHub, nessun comando da digitare.

## Passaggio unico (una volta sola)

1. Vai su [capgo.app](https://capgo.app), accedi, e nella sezione del tuo account trova la voce **API key** — copiala.
2. Vai sulla pagina del repository su GitHub → **Settings** (in alto) → nel menu a sinistra **Secrets and variables** → **Actions**.
3. Clicca **New repository secret**.
4. Nome: `CAPGO_API_KEY`
5. Valore: incolla la chiave copiata al punto 1.
6. Salva.

Fatto questo una volta, non va rifatto mai più.

## Ogni volta che vuoi pubblicare un aggiornamento pulito

1. Vai sulla pagina del repository su GitHub → scheda **Actions** (in alto).
2. Nella lista a sinistra clicca **Pubblica Aggiornamento Capgo**.
3. Clicca il bottone **Run workflow** (a destra, sopra la lista delle esecuzioni).
4. Nel campo che compare, scrivi un numero di versione **mai usato prima e più alto dell'ultimo pubblicato** — es. se prima non hai mai pubblicato nulla con questo sistema, scrivi `1.0.0`; la volta dopo `1.0.1`, e così via.
5. Clicca il bottone verde **Run workflow**.
6. Aspetta un paio di minuti (si aggiorna da solo, puoi seguirlo cliccando sull'esecuzione appena partita) — quando diventa verde con la spunta, il bundle pulito è pubblicato.

Da quel momento, chiudendo e riaprendo l'app sul telefono, dovrebbe scaricare il bundle nuovo e il banner di test sparire definitivamente.

## Se qualcosa va storto

Clicca sull'esecuzione del workflow (anche se fallita, in rosso) per vedere il log — di solito l'errore più comune è aver scritto un numero di versione già usato in precedenza: in quel caso riprova con un numero più alto.
