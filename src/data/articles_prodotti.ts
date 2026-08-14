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
  },
  {
    id: 255,
    slug: "pinze-per-estrazione-dentale-mascellari-mandibolari-universali",
    title: "Pinze per estrazione: perché la forma del becco conta più della forza applicata",
    description: "Come si legge una pinza da estrazione prima di usarla, che differenza fa davvero tra mascellari, mandibolari e universali, e perché la maggior parte delle fratture radicolari nasce da una presa sbagliata e non da un dente difficile.",
    content: [
      "Come si legge una pinza da estrazione prima di usarla, che differenza fa davvero tra mascellari, mandibolari e universali, e perché la maggior parte delle fratture radicolari nasce da una presa sbagliata e non da un dente difficile.",
      "Una pinza da estrazione è progettata attorno a un principio semplice: i becchi devono adattarsi alla superficie radicolare, non alla corona. È da qui che discende tutto il resto. Se i becchi appoggiano sullo smalto coronale, la forza si concentra su una struttura fragile e il risultato più probabile è la frattura della corona con radice ritenuta; se invece scendono sotto il margine gengivale e abbracciano il cemento radicolare, la forza si trasferisce all'osso alveolare, che è ciò che deve cedere. Per questo la prima manovra non è afferrare, ma scollare il legamento e far scivolare i becchi lungo la radice fino a trovare appoggio stabile. L'estrazione riesce quando l'alveolo si espande, non quando il dente viene tirato.",
      "La distinzione tra i tre gruppi risponde all'anatomia e all'angolo di lavoro. Le pinze mascellari hanno manico e becchi sostanzialmente sullo stesso asse, perché nell'arcata superiore l'operatore lavora dall'alto e la trazione utile è diretta verso il basso. Le mandibolari hanno i becchi ad angolo quasi retto rispetto al manico, per raggiungere l'arcata inferiore mantenendo l'avambraccio in posizione naturale invece di ruotare il polso. Le universali sono un compromesso con becchi a geometria più neutra: coprono un ventaglio ampio di situazioni e sono la scelta ragionevole per uno studio che esegue estrazioni occasionali, ma su un molare compromesso una pinza dedicata dà una presa che l'universale non riesce a dare. Il criterio pratico è la frequenza: chi estrae raramente parte dall'universale, chi estrae con regolarità tiene i set separati per arcata.",
      "Sul piano dell'uso, tre elementi riducono le complicanze più di qualunque caratteristica del prodotto. Il primo è la sindesmotomia preliminare: separare il legamento con una leva prima di applicare la pinza rende ogni movimento successivo più efficace e riduce la forza necessaria. Il secondo è il movimento, che deve essere lento e alternato in senso vestibolo-linguale per espandere l'osso, non rotatorio su denti pluriradicolati — la rotazione ha senso solo su radici singole e coniche. Il terzo è la pazienza: la forza applicata rapidamente frattura, la stessa forza applicata lentamente e mantenuta deforma l'osso e libera il dente. Un dente che non si muove dopo diversi tentativi corretti è un dente che chiede un approccio chirurgico, non più forza.",
      "Nella scelta contano l'acciaio e lo snodo, come per ogni strumento sottoposto a carico: becchi che perdono il filo del bordo scivolano sulla radice, e uno snodo con gioco disperde parte della forza applicata invece di trasmetterla. Vale la pena controllare periodicamente la zigrinatura interna dei becchi, che è ciò che impedisce alla pinza di slittare su una superficie radicolare bagnata.",
      "Su Oralzon puoi confrontare [tutte le pinze per estrazione disponibili sul marketplace](/negozio?q=pinze%20per%20estrazione), oppure andare direttamente alle [pinze per l'arcata mandibolare](/negozio?q=estrazione%20-%20mandibolari), a quelle [per l'arcata mascellare](/negozio?q=estrazione%20-%20maxillo) e alle [pinze universali](/negozio?q=estrazione%20-%20universale). Per la fase preliminare di scollamento trovi anche [le leve apricorone](/negozio?q=leva%20apricorone)."
    ],
    category: "materiali",
    categoryName: "Materiali Odontoiatrici",
    keywords: [
      "pinze per estrazione dentale",
      "pinze mascellari mandibolari",
      "estrazione dentale tecnica",
      "frattura radicolare estrazione",
      "strumenti chirurgia orale"
    ],
    publishedAt: "2026-04-20",
    readTime: 7
  },
  {
    id: 256,
    slug: "lampada-polimerizzazione-dentale-led-irradianza-tempi",
    title: "Lampada polimerizzante LED: perché i watt dichiarati dicono poco sulla qualità della polimerizzazione",
    description: "Cosa misura davvero l'irradianza, perché la distanza dalla superficie conta quanto la potenza, e quali errori di impiego producono compositi sottopolimerizzati che si degradano nei mesi successivi.",
    content: [
      "Cosa misura davvero l'irradianza, perché la distanza dalla superficie conta quanto la potenza, e quali errori di impiego producono compositi sottopolimerizzati che si degradano nei mesi successivi.",
      "Il parametro che conta non è la potenza assoluta della sorgente ma l'irradianza, cioè l'energia che arriva effettivamente per unità di superficie, e l'energia totale erogata è il prodotto di irradianza e tempo. Questo spiega perché un valore alto dichiarato in scheda tecnica non garantisce nulla da solo: la stessa lampada che a contatto eroga il valore nominale, allontanata di otto millimetri — la distanza reale quando si polimerizza il fondo di una cavità profonda di seconda classe — può erogarne una frazione. La conseguenza clinica è concreta: un composito che riceve energia insufficiente polimerizza solo in superficie, resta con monomero residuo negli strati profondi, e nei mesi successivi mostra sensibilità post-operatoria, discromia marginale e infiltrazione.",
      "La seconda variabile è lo spettro. I fotoiniziatori non sono tutti uguali: la canforochinone assorbe intorno ai 470 nanometri, ma diversi compositi estetici e alcuni cementi adesivi usano iniziatori alternativi che assorbono più in basso, verso i 400. Una lampada monopicco centrata sul blu polimerizza perfettamente i materiali a canforochinone e lascia sottopolimerizzati quelli con iniziatori alternativi, senza che nulla lo segnali all'operatore. Le lampade multipicco, o poliwave, coprono entrambe le finestre ed è questo — non il numero di watt — il motivo per cui vale la pena preferirle se in studio si usano materiali di produttori diversi.",
      "Gli errori di impiego più frequenti sono quattro e sono tutti correggibili a costo zero. Polimerizzare a distanza invece che il più vicino possibile alla superficie, senza compensare con tempo aggiuntivo. Usare la modalità rapida indiscriminatamente: i cicli brevi ad alta intensità funzionano su strati sottili e materiali compatibili, non su ogni situazione. Dimenticare gli incrementi: uno strato di composito troppo spesso non polimerizza a fondo per quanto si prolunghi l'esposizione, perché la luce si attenua attraversando il materiale. E trascurare la manutenzione della finestra di emissione, dove un residuo di adesivo indurito riduce l'uscita in modo invisibile a occhio ma misurabile con un radiometro — strumento che vale la pena usare periodicamente, perché è l'unico modo per accorgersi che una lampada sta perdendo efficienza prima che lo facciano i restauri.",
      "Su Oralzon trovi [le lampade per polimerizzazione dentale LED disponibili sul marketplace](/negozio?q=polimerizzazione%20dentale) e, per la protezione della testina durante l'uso, [le pellicole protettive monouso dedicate](/negozio?q=pellicola%20protettiva%20monouso%20per%20lampada)."
    ],
    category: "materiali",
    categoryName: "Materiali Odontoiatrici",
    keywords: [
      "lampada polimerizzante LED",
      "irradianza polimerizzazione",
      "lampada poliwave multipicco",
      "composito sottopolimerizzato",
      "radiometro dentale"
    ],
    publishedAt: "2026-04-27",
    readTime: 7
  },
  {
    id: 257,
    slug: "siringa-per-iniezione-dentale-aspirazione-tecnica-anestesia",
    title: "Siringhe per anestesia dentale: perché la punta dell'arpione determina la sicurezza dell'iniezione",
    description: "Come funziona davvero l'aspirazione in una siringa a carpule, che differenza c'è tra arpione a punta acuminata e a uncino, e perché il test di aspirazione va ripetuto e non eseguito una volta sola.",
    content: [
      "Come funziona davvero l'aspirazione in una siringa a carpule, che differenza c'è tra arpione a punta acuminata e a uncino, e perché il test di aspirazione va ripetuto e non eseguito una volta sola.",
      "L'iniezione intravascolare accidentale è la complicanza che il sistema di aspirazione esiste per prevenire: introdurre in circolo una soluzione contenente vasocostrittore produce tachicardia, cardiopalmo e, nei pazienti a rischio, conseguenze più serie, mentre l'anestesia locale semplicemente non si ottiene. Il meccanismo che lo evita è puramente meccanico: l'estremità dello stantuffo è dotata di un arpione che si ancora al tappo di gomma della carpule, così che tirando indietro il pollice si crea una pressione negativa e si osserva se nella carpule compare sangue. Senza ancoraggio efficace, tirare indietro non produce alcuna depressione e il test dà un falso negativo — cioè il risultato peggiore possibile, perché rassicura senza aver verificato nulla.",
      "Da qui la differenza fra le due geometrie più diffuse. La punta acuminata perfora il tappo e vi si infigge, ottenendo un ancoraggio immediato e molto sicuro anche su tappi duri; richiede però che il tappo sia integro e ben centrato, e ripetute perforazioni possono lasciare frammenti di gomma. L'uncino lavora invece per presa laterale sotto il bordo del tappo: è meno traumatico e più agevole da agganciare e sganciare nel cambio carpule, ma su tappi molto rigidi o carpule di lotti diversi può afferrare meno saldamente. Nessuna delle due è superiore in assoluto: la scelta dipende dalle carpule che si usano abitualmente, ed è ragionevole verificare l'accoppiamento con un test a vuoto prima di adottarla come standard.",
      "Sul piano operativo, l'aspirazione va eseguita più di una volta. Un tronculare mandibolare attraversa una regione riccamente vascolarizzata, e la punta dell'ago può entrare in un vaso durante l'avanzamento o dopo un piccolo spostamento: aspirare all'arrivo, ruotare leggermente la siringa di un quarto di giro e aspirare di nuovo riduce i falsi negativi dovuti alla parete del vaso appoggiata al lume dell'ago. L'iniezione va poi eseguita lentamente — la velocità è la variabile che più incide sul dolore percepito e sul rischio sistemico — e mai forzata contro resistenza.",
      "Nella scelta dello strumento contano il peso e la zigrinatura dell'anello per il pollice, perché l'aspirazione con una sola mano deve essere possibile senza perdere il controllo della punta, e la compatibilità dichiarata con il formato di carpule e con gli aghi in uso. Trattandosi di strumento sterilizzabile a ciclo, vale la verifica periodica dello stato dell'arpione, che è la parte che si consuma per prima.",
      "Su Oralzon trovi [le siringhe per iniezione dentale disponibili sul marketplace](/negozio?q=siringa%20per%20iniezione) nelle diverse configurazioni di arpione, e per le manovre di irrigazione e medicazione anche [le siringhe a punta curva](/negozio?q=siringa%20a%20punta%20curva)."
    ],
    category: "materiali",
    categoryName: "Materiali Odontoiatrici",
    keywords: [
      "siringa per anestesia dentale",
      "aspirazione carpule",
      "iniezione intravascolare anestesia",
      "siringa arpione dentale",
      "tronculare mandibolare"
    ],
    publishedAt: "2026-05-04",
    readTime: 7
  },
  {
    id: 258,
    slug: "lucidatrice-ad-aria-air-polishing-glicina-eritritolo",
    title: "Lucidatrice ad aria: quando l'air polishing sostituisce la coppetta e quando invece la danneggia",
    description: "Perché la scelta della polvere conta più della macchina, su quali superfici l'air polishing è indicato e su quali è controindicato, e come si imposta angolo e distanza per non provocare enfisema.",
    content: [
      "Perché la scelta della polvere conta più della macchina, su quali superfici l'air polishing è indicato e su quali è controindicato, e come si imposta angolo e distanza per non provocare enfisema.",
      "L'air polishing lavora proiettando un getto di aria, acqua e polvere abrasiva sulla superficie dentale, e la sua efficacia rispetto alla coppetta con pasta sta nel raggiungere ciò che la coppetta non raggiunge: solchi, superfici interprossimali, aree attorno a bracket e attacchi, margini di restauri complessi. Nella pratica dell'igiene professionale sostituisce vantaggiosamente la lucidatura tradizionale nella rimozione del biofilm e delle pigmentazioni estrinseche, con minor tempo di lavoro e minore abrasione se la polvere è quella giusta. Il collegamento a quattro fori è lo standard che permette di alimentare il manipolo direttamente dal riunito, senza unità autonoma.",
      "La variabile decisiva è la polvere, ed è qui che si commettono gli errori più costosi. Il bicarbonato di sodio ha granulometria e durezza elevate: rimuove efficacemente le pigmentazioni sullo smalto, ma è troppo aggressivo per la dentina esposta, per il cemento radicolare e per le superfici dei restauri estetici, che opacizza. Le polveri a base di glicina, e ancora di più quelle a base di eritritolo, hanno particelle molto più fini e sono state sviluppate proprio per lavorare in sicurezza sottogengiva, su radici esposte, attorno agli impianti e su compositi e ceramiche. La regola pratica è semplice: bicarbonato solo sopra gengiva e solo su smalto sano, glicina o eritritolo in tutti gli altri casi — comprese le sedute di mantenimento parodontale e perimplantare, dove il bicarbonato è da evitare.",
      "La tecnica riduce quasi tutti i rischi residui. Il getto va tenuto a una distanza di alcuni millimetri e inclinato rispetto alla superficie, mai perpendicolare e mai diretto verso il solco gengivale con angolazione che spinga aria nei tessuti: l'enfisema sottocutaneo, complicanza rara ma reale, nasce quasi sempre da un getto puntato nella direzione sbagliata o da un uso in prossimità di tessuto lacerato. Il movimento deve essere continuo e circolare, senza soste su un singolo punto, e l'aspirazione ad alto volume va posizionata prima di iniziare, non dopo, perché l'aerosol prodotto è abbondante. Le controindicazioni da rispettare sono note: mucose lacerate o ulcerate, pazienti con patologie respiratorie severe e, per le polveri a base di sodio, dieta iposodica e terapie che alterano l'equilibrio elettrolitico.",
      "Sul piano della manutenzione, l'ostruzione del beccuccio è il guasto più frequente ed è quasi sempre dovuto a umidità entrata nel serbatoio della polvere: svuotare il serbatoio a fine giornata e far girare aria a vuoto prima di riporre il manipolo evita la maggior parte dei fermi macchina.",
      "Su Oralzon trovi [le lucidatrici ad aria disponibili sul marketplace](/negozio?q=lucidatrice) e, per completare la seduta di igiene professionale, anche [le punte per ablatore dentale](/negozio?q=punte%20per%20ablatore) e [gli scovolini interdentali monouso](/negozio?q=scovolin)."
    ],
    category: "igiene-orale",
    categoryName: "Igiene Orale",
    keywords: [
      "lucidatrice ad aria dentale",
      "air polishing glicina",
      "polvere eritritolo air flow",
      "enfisema sottocutaneo air polishing",
      "igiene professionale bicarbonato"
    ],
    publishedAt: "2026-05-11",
    readTime: 7
  }
];
