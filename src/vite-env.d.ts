/// <reference types="vite/client" />

// Senza questa riga TypeScript non sa che Vite trasforma un import di
// immagine in una stringa (l'URL dell'asset), e segnala "Cannot find module"
// su ogni logo o banner importato — errori che non corrispondono ad alcun
// problema reale, perché i file esistono e la build li risolve. Il rumore
// che ne deriva è il motivo per cui i controlli dei tipi vengono spenti:
// meglio toglierlo alla radice.
