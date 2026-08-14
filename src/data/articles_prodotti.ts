// ── Guide ai tipi di prodotto del marketplace ───────────────────────────
// Serie distinta dagli articoli clinici: ogni articolo copre UN tipo di
// prodotto realmente presente su Oralzon e contiene un link interno verso
// la ricerca che elenca tutti i prodotti di quel tipo — mai verso un
// singolo prodotto, che domani potrebbe essere esaurito o rimosso.
//
// Il link usa la sintassi [testo](/negozio?q=termine), interpretata da
// src/lib/articleRichText.tsx. Il termine di ricerca deve essere una
// sottostringa contigua del NOME prodotto, perché la ricerca del catalogo
// fa ILIKE '%termine%' sulla colonna generata products.search_text
// (name + brand + sku). Gli spazi vanno scritti come %20.
//
// Tradotto in src/data/articleTranslations/{lang}.ts come tutti gli altri
// articoli. I termini di ricerca NON si traducono: puntano al nome italiano
// del prodotto a catalogo, che è lo stesso in tutte le lingue.

export const PRODOTTI_ARTICLES = [
  {
    id: 251,
    slug: "pinza-ortodontica-how-diritta-guida-uso-scelta",
    title: "Pinza ortodontica How diritta: a cosa serve davvero e come sceglierla",
    description: "Perché la How è la pinza più usata alla poltrona ortodontica, cosa distingue la versione diritta da quella curva, e quali dettagli costruttivi separano uno strumento che dura anni da uno che gioca dopo pochi mesi.",
    content: [
      "Perché la How è la pinza più usata alla poltrona ortodontica, cosa distingue la versione diritta da quella curva, e quali dettagli costruttivi separano uno strumento che dura anni da uno che gioca dopo pochi mesi.",
      "La pinza How si riconosce dai becchi tondeggianti e zigrinati, corti e piatti sulla superficie di presa. È lo strumento che si usa per afferrare e posizionare l'arco durante il legaggio, per inserire e rimuovere legature metalliche, per manovrare elastici e ausiliari e per piccoli aggiustamenti di posizione. La zigrinatura è la caratteristica che conta: serve a trattenere un filo sottile e scivoloso senza doverlo stringere fino a deformarlo. Rispetto a una pinza di uso generico, la How è progettata per una presa sicura a bassa forza, ed è questo che la rende lo strumento che si prende in mano più spesso durante una seduta.",
      "La differenza tra versione diritta e versione curva è pratica, non gerarchica: la diritta lavora bene sui settori anteriori e in tutte le manovre frontali, dove l'accesso è libero e la visuale diretta; la curva raggiunge più comodamente i settori posteriori, dove l'angolazione dei becchi evita di dover ruotare il polso in posizioni scomode. Chi lavora molto sui frontali tende a consumare la diritta; chi tratta soprattutto casi con bande sui molari usa di più la curva. La maggior parte degli studi tiene entrambe, e la diritta è quasi sempre la prima che si acquista.",
      "Nella scelta, tre dettagli fanno la differenza sulla durata. Il primo è l'acciaio: un inox chirurgico di qualità mantiene la zigrinatura e resiste ai cicli di autoclave senza puntinature di corrosione, mentre un acciaio scadente si opacizza e perde mordente dopo poche decine di sterilizzazioni. Il secondo è lo snodo: una pinza ben costruita apre e chiude senza gioco laterale, e il gioco è il difetto che compromette per primo la precisione della presa. Il terzo è l'allineamento dei becchi: guardati in controluce a pinza chiusa, devono combaciare su tutta la superficie, senza fessure. Sul piano della manutenzione, la regola che allunga di più la vita dello strumento è banale ma spesso disattesa: sciacquare e asciugare prima del ciclo, perché è il residuo di disinfettante lasciato ad asciugare a contatto con l'acciaio a innescare la corrosione, non l'autoclave in sé.",
      "Su Oralzon puoi vedere [tutte le pinze How diritte disponibili sul marketplace](/negozio?q=how%20diritta), confrontando materiali, dimensioni e prezzi dei diversi venditori, e trovi anche [le pinze ortodontiche a tre beccucci Aderer](/negozio?q=aderer) e [le pinze Cinch Back per il ripiegamento dei terminali](/negozio?q=cinch%20back) per completare il set alla poltrona."
    ],
    category: "ortodonzia",
    categoryName: "Ortodonzia",
    keywords: [
      "pinza ortodontica How diritta",
      "pinza How zigrinata",
      "strumenti ortodontici acciaio inox",
      "pinza per legature ortodontiche",
      "manutenzione pinze ortodontiche"
    ],
    publishedAt: "2026-03-23",
    readTime: 6
  },
  {
    id: 252,
    slug: "pinza-cinch-back-hammerhead-niti-ripiegamento-terminali",
    title: "Pinza Cinch Back Hammerhead: perché serve una pinza dedicata per ripiegare i terminali dell'arco",
    description: "Cosa fa concretamente una Cinch Back, perché su arco in NiTi il ripiegamento richiede una geometria diversa da quella di una pinza comune, e come si evita il taglio accidentale del filo.",
    content: [
      "Cosa fa concretamente una Cinch Back, perché su arco in NiTi il ripiegamento richiede una geometria diversa da quella di una pinza comune, e come si evita il taglio accidentale del filo.",
      "Il ripiegamento del terminale dell'arco distalmente all'ultimo tubo è una manovra di routine con due scopi ben precisi: impedire che il filo scivoli in avanti pungendo la mucosa, e mantenere la lunghezza dell'arco stabile fra un controllo e l'altro. La pinza Cinch Back nasce per fare esattamente questo in bocca, con becchi sagomati che piegano il terminale verso il basso senza schiacciarlo e senza richiedere di rimuovere l'arco. La testa a martello, da cui prende il nome hammerhead, offre la superficie di appoggio che rende il gesto controllato in uno spazio dove la visuale è scarsa e il margine di manovra minimo.",
      "Il motivo per cui non si usa una pinza qualsiasi ha a che fare con il materiale. Il nitinolo ha memoria di forma e alta elasticità: piegato con becchi troppo taglienti o con un raggio troppo stretto, tende a incidersi sul lato in tensione, e l'incisione diventa il punto da cui il filo si rompe nelle settimane successive, spesso lontano dalla poltrona. Una Cinch Back progettata per il NiTi lavora con un raggio di curvatura più ampio e superfici di presa lisce, in modo da ottenere la piega senza creare intaglio. È la ragione per cui vale la pena tenerla separata dalle pinze da taglio e non usarla per manovre che non le competono.",
      "Nella pratica, tre accortezze riducono i problemi. Il terminale va tagliato prima con un distal end cutter che trattiene lo spezzone, così il frammento non finisce in gola; la piega si esegue con un movimento unico e deciso, perché piegare, raddrizzare e ripiegare nello stesso punto affatica il filo molto più della piega singola; e la lunghezza lasciata distalmente al tubo dev'essere sufficiente a impedire lo scivolamento ma non tale da irritare il trigono retromolare. Sul piano della manutenzione, valgono le regole di ogni strumento di precisione: risciacquo, asciugatura, controllo periodico dello snodo e del combaciamento dei becchi in controluce.",
      "Su Oralzon trovi [le pinze Cinch Back disponibili sul marketplace](/negozio?q=cinch%20back), utili da valutare insieme alle [pinze ortodontiche How diritte](/negozio?q=how%20diritta) per il legaggio e alle [pinzette per tubi buccali](/negozio?q=tubi%20buccali) per il posizionamento degli attacchi sui molari."
    ],
    category: "ortodonzia",
    categoryName: "Ortodonzia",
    keywords: [
      "pinza Cinch Back",
      "hammerhead ortodonzia",
      "ripiegamento terminale arco",
      "arco NiTi frattura filo",
      "distal end cutter"
    ],
    publishedAt: "2026-03-30",
    readTime: 6
  },
  {
    id: 253,
    slug: "pinze-ortodontiche-tre-beccucci-aderer-pieghe-filo",
    title: "Pinze a tre beccucci Aderer: come si esegue una piega precisa e ripetibile",
    description: "Perché la geometria a tre becchi permette angoli netti dove una pinza a due becchi produce curve, su quali fili funziona e su quali no, e gli errori che rovinano la piega più spesso.",
    content: [
      "Perché la geometria a tre becchi permette angoli netti dove una pinza a due becchi produce curve, su quali fili funziona e su quali no, e gli errori che rovinano la piega più spesso.",
      "La pinza Aderer ha due becchi da un lato e uno dal lato opposto, che si inserisce fra i primi due quando la pinza si chiude. Questa configurazione crea un punto di appoggio centrale e due punti di contrasto laterali: il filo, stretto in questo modo, non può ruotare né scivolare, e la piega si forma esattamente nel punto scelto invece che distribuirsi lungo un tratto. È la differenza fra un angolo netto e una curva dolce, e in ortodonzia la distinzione conta, perché una piega che si distribuisce cambia l'effetto biomeccanico previsto sul dente.",
      "L'ambito naturale di impiego sono i fili di acciaio di sezione tonda e i calibri medi, con cui si costruiscono ansa, stop, offset e le pieghe di finitura. Sul nitinolo la stessa pinza va usata con cautela o non usata affatto: la memoria di forma fa sì che il filo tenda a tornare indietro, la piega netta non si mantiene e il materiale si intaglia. Analogamente, sui fili rettangolari di grosso calibro serve valutare la capienza dei becchi dichiarata dal produttore, perché forzare oltre il limite deforma prima lo strumento del filo — e una pinza con i becchi svasati non torna più precisa.",
      "Gli errori ricorrenti sono tre e si correggono facilmente. Il primo è tenere il filo troppo lontano dalla punta dei becchi: la leva aumenta, la piega si allarga e perde definizione. Il secondo è piegare tirando con la mano invece di ruotare la pinza: il gesto corretto usa la pinza come fulcro e il pollice come guida, non la trazione. Il terzo è ripassare più volte sullo stesso punto per aggiustare l'angolo, pratica che indurisce localmente l'acciaio e crea il punto di frattura. Se l'angolo non viene, conviene tagliare e ricominciare da filo integro piuttosto che insistere.",
      "Su Oralzon puoi consultare [tutte le pinze a tre beccucci Aderer presenti sul marketplace](/negozio?q=aderer) e valutarle insieme al [calibro scorrevole ortodontico](/negozio?q=calibro%20scorrevole) per il controllo dimensionale delle pieghe eseguite."
    ],
    category: "ortodonzia",
    categoryName: "Ortodonzia",
    keywords: [
      "pinza Aderer tre becchi",
      "pieghe filo ortodontico",
      "pinze per ansa ortodontica",
      "filo acciaio ortodonzia",
      "strumenti per pieghe di finitura"
    ],
    publishedAt: "2026-04-06",
    readTime: 6
  },
  {
    id: 254,
    slug: "calibro-scorrevole-ortodontico-misurazione-acciaio-inox",
    title: "Calibro scorrevole ortodontico: dove la misura cambia davvero la decisione clinica",
    description: "Quali misurazioni in ortodonzia richiedono uno strumento e non una stima a occhio, perché la risoluzione dichiarata non coincide con la precisione reale, e cosa distingue un calibro da studio da uno da officina.",
    content: [
      "Quali misurazioni in ortodonzia richiedono uno strumento e non una stima a occhio, perché la risoluzione dichiarata non coincide con la precisione reale, e cosa distingue un calibro da studio da uno da officina.",
      "Il calibro scorrevole entra in gioco in tutte le situazioni in cui una differenza di pochi decimi di millimetro modifica il piano di trattamento. L'analisi dello spazio richiede la misura del diametro mesio-distale di ogni elemento, sommata e confrontata con la lunghezza d'arcada disponibile: qui un errore sistematico di mezzo millimetro per dente diventa diversi millimetri sull'arcata, cioè la differenza fra un caso da trattare con stripping e uno da trattare con estrazioni. Lo stesso strumento serve per quantificare la discrepanza di Bolton, per verificare l'altezza di posizionamento dei bracket, per misurare lo spessore dei fili e per controllare le dimensioni delle pieghe eseguite.",
      "Un punto che genera confusione è la differenza fra risoluzione e precisione. Un calibro con nonio a venti divisioni legge fino a cinque centesimi di millimetro, ma la misura reale dipende da come lo strumento viene chiuso sull'oggetto: una pressione eccessiva sui becchi comprime il tessuto o flette lo strumento, e restituisce un valore più basso del vero. Nella pratica clinica si lavora con una tolleranza realistica di circa un decimo di millimetro, ed è più utile essere ripetibili — stessa presa, stessa pressione, stesso punto di misura — che inseguire l'ultima cifra decimale.",
      "Nella scelta, un calibro destinato all'uso in bocca ha requisiti che uno da officina non ha: punte sottili e arrotondate per raggiungere il punto di contatto interprossimale senza traumatizzare la gengiva, acciaio inossidabile compatibile con la sterilizzazione in autoclave, e scorrimento fluido con vite di bloccaggio che tenga la posizione mentre si legge. La versione analogica con nonio ha il vantaggio di non dipendere da una batteria e di sopportare meglio i cicli termici; quella digitale è più rapida da leggere e riduce l'errore di parallasse, ma va verificata la resistenza dichiarata all'umidità e alla sterilizzazione, perché molti modelli digitali economici non sono autoclavabili e vanno solo disinfettati a freddo.",
      "Su Oralzon trovi [i calibri scorrevoli ortodontici disponibili sul marketplace](/negozio?q=calibro%20scorrevole) e, per il controllo dimensionale in fase di finitura, anche [i righelli per misurazione interdentale](/negozio?q=righello%20per%20misurazione)."
    ],
    category: "ortodonzia",
    categoryName: "Ortodonzia",
    keywords: [
      "calibro scorrevole ortodontico",
      "analisi dello spazio ortodonzia",
      "discrepanza di Bolton",
      "calibro acciaio inox autoclavabile",
      "misurazione mesio-distale"
    ],
    publishedAt: "2026-04-13",
    readTime: 6
  }
];
