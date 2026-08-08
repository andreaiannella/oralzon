// Traduzione statica dei nomi delle categorie prodotto — stesso principio
// delle traduzioni del blog: le categorie sono un elenco fisso di 14 voci
// (vedi src/constants/categories.ts), non hanno bisogno di una tabella nel
// database né di passare dal Translation Engine. Il valore salvato su
// products.category resta sempre l'italiano (usato per filtri/routing/URL
// categoria) — qui si traduce solo l'etichetta mostrata all'utente.
const CATEGORY_LABELS: Record<string, Record<string, string>> = {
  'Monouso': { en: 'Disposables', es: 'Desechables', fr: 'Jetables', de: 'Einwegartikel', pt: 'Descartáveis', nl: 'Wegwerpartikelen', pl: 'Artykuły jednorazowe' },
  'Sterilizzazione': { en: 'Sterilization', es: 'Esterilización', fr: 'Stérilisation', de: 'Sterilisation', pt: 'Esterilização', nl: 'Sterilisatie', pl: 'Sterylizacja' },
  'Strumenti Odontoiatrici': { en: 'Dental Instruments', es: 'Instrumental Dental', fr: 'Instruments Dentaires', de: 'Zahnärztliche Instrumente', pt: 'Instrumentos Odontológicos', nl: 'Tandheelkundige Instrumenten', pl: 'Instrumenty Dentystyczne' },
  'Implantologia': { en: 'Implantology', es: 'Implantología', fr: 'Implantologie', de: 'Implantologie', pt: 'Implantologia', nl: 'Implantologie', pl: 'Implantologia' },
  'Ortodonzia': { en: 'Orthodontics', es: 'Ortodoncia', fr: 'Orthodontie', de: 'Kieferorthopädie', pt: 'Ortodontia', nl: 'Orthodontie', pl: 'Ortodoncja' },
  'Endodonzia': { en: 'Endodontics', es: 'Endodoncia', fr: 'Endodontie', de: 'Endodontie', pt: 'Endodontia', nl: 'Endodontie', pl: 'Endodoncja' },
  'Materiali da Impronta': { en: 'Impression Materials', es: 'Materiales de Impresión', fr: 'Matériaux d\'Empreinte', de: 'Abformmaterialien', pt: 'Materiais de Moldagem', nl: 'Afdrukmaterialen', pl: 'Materiały Wyciskowe' },
  'Protesica': { en: 'Prosthetics', es: 'Prótesis', fr: 'Prothèses', de: 'Prothetik', pt: 'Prótese', nl: 'Prothetiek', pl: 'Protetyka' },
  'Radiologia': { en: 'Radiology', es: 'Radiología', fr: 'Radiologie', de: 'Radiologie', pt: 'Radiologia', nl: 'Radiologie', pl: 'Radiologia' },
  'Arredi Studio': { en: 'Practice Furniture', es: 'Mobiliario Clínico', fr: 'Mobilier de Cabinet', de: 'Praxiseinrichtung', pt: 'Mobiliário de Consultório', nl: 'Praktijkinrichting', pl: 'Wyposażenie Gabinetu' },
  'Abbigliamento e Divise': { en: 'Clothing & Uniforms', es: 'Ropa y Uniformes', fr: 'Vêtements et Uniformes', de: 'Kleidung und Uniformen', pt: 'Vestuário e Uniformes', nl: 'Kleding en Uniformen', pl: 'Odzież i Uniformy' },
  'Disinfezione': { en: 'Disinfection', es: 'Desinfección', fr: 'Désinfection', de: 'Desinfektion', pt: 'Desinfeção', nl: 'Desinfectie', pl: 'Dezynfekcja' },
  'Consumabili': { en: 'Consumables', es: 'Consumibles', fr: 'Consommables', de: 'Verbrauchsmaterialien', pt: 'Consumíveis', nl: 'Verbruiksartikelen', pl: 'Materiały Zużywalne' },
  'Igiene Orale Professionale': { en: 'Professional Oral Hygiene', es: 'Higiene Oral Profesional', fr: 'Hygiène Bucco-Dentaire Professionnelle', de: 'Professionelle Mundhygiene', pt: 'Higiene Oral Profissional', nl: 'Professionele Mondhygiëne', pl: 'Profesjonalna Higiena Jamy Ustnej' },
};

const CATEGORY_DESCRIPTIONS: Record<string, Record<string, string>> = {
  'Monouso': { en: 'Gloves, masks, gowns and disposable materials', es: 'Guantes, mascarillas, batas y materiales desechables', fr: 'Gants, masques, blouses et matériel jetable', de: 'Handschuhe, Masken, Kittel und Einwegmaterialien', pt: 'Luvas, máscaras, aventais e materiais descartáveis', nl: 'Handschoenen, maskers, jassen en wegwerpmaterialen', pl: 'Rękawiczki, maski, fartuchy i materiały jednorazowe' },
  'Sterilizzazione': { en: 'Autoclaves, sterilization instruments and accessories', es: 'Autoclaves, instrumentos de esterilización y accesorios', fr: 'Autoclaves, instruments de stérilisation et accessoires', de: 'Autoklaven, Sterilisationsinstrumente und Zubehör', pt: 'Autoclaves, instrumentos de esterilização e acessórios', nl: 'Autoclaven, sterilisatie-instrumenten en accessoires', pl: 'Autoklawy, narzędzia do sterylizacji i akcesoria' },
  'Strumenti Odontoiatrici': { en: 'Manual and rotary instruments for dentistry', es: 'Instrumentos manuales y rotatorios para odontología', fr: 'Instruments manuels et rotatifs pour la dentisterie', de: 'Hand- und Rotationsinstrumente für die Zahnmedizin', pt: 'Instrumentos manuais e rotatórios para odontologia', nl: 'Handmatige en roterende instrumenten voor tandheelkunde', pl: 'Narzędzia ręczne i rotacyjne dla stomatologii' },
  'Implantologia': { en: 'Dental implants, surgical kits and prosthetic components', es: 'Implantes dentales, kits quirúrgicos y componentes protésicos', fr: 'Implants dentaires, kits chirurgicaux et composants prothétiques', de: 'Zahnimplantate, Chirurgie-Kits und prothetische Komponenten', pt: 'Implantes dentários, kits cirúrgicos e componentes protéticos', nl: 'Tandimplantaten, chirurgische kits en prothetische componenten', pl: 'Implanty dentystyczne, zestawy chirurgiczne i komponenty protetyczne' },
  'Ortodonzia': { en: 'Orthodontic appliances, brackets and archwires', es: 'Aparatos ortodóncicos, brackets y arcos', fr: 'Appareils orthodontiques, brackets et arcs', de: 'Kieferorthopädische Geräte, Brackets und Bögen', pt: 'Aparelhos ortodônticos, brackets e arcos', nl: 'Orthodontische apparatuur, brackets en bogen', pl: 'Aparaty ortodontyczne, zamki i łuki' },
  'Endodonzia': { en: 'Instruments for root canal therapy', es: 'Instrumentos para terapia de conducto', fr: 'Instruments pour le traitement de canal', de: 'Instrumente für die Wurzelkanalbehandlung', pt: 'Instrumentos para tratamento de canal', nl: 'Instrumenten voor wortelkanaalbehandeling', pl: 'Narzędzia do leczenia kanałowego' },
  'Materiali da Impronta': { en: 'Impression pastes, trays and materials', es: 'Pastas de impresión, cubetas y materiales', fr: 'Pâtes à empreinte, porte-empreintes et matériaux', de: 'Abformpasten, Löffel und Materialien', pt: 'Pastas de moldagem, moldeiras e materiais', nl: 'Afdrukpasta\'s, lepels en materialen', pl: 'Pasty wyciskowe, łyżki i materiały' },
  'Protesica': { en: 'Materials and equipment for dental prosthetics', es: 'Materiales y equipos para prótesis dentales', fr: 'Matériaux et équipements pour prothèses dentaires', de: 'Materialien und Geräte für Zahnprothetik', pt: 'Materiais e equipamentos para próteses dentárias', nl: 'Materialen en apparatuur voor tandprothesen', pl: 'Materiały i sprzęt do protez dentystycznych' },
  'Radiologia': { en: 'X-ray systems, digital sensors and accessories', es: 'Sistemas radiográficos, sensores digitales y accesorios', fr: 'Systèmes radiographiques, capteurs numériques et accessoires', de: 'Röntgensysteme, digitale Sensoren und Zubehör', pt: 'Sistemas radiográficos, sensores digitais e acessórios', nl: 'Röntgensystemen, digitale sensoren en accessoires', pl: 'Systemy rentgenowskie, czujniki cyfrowe i akcesoria' },
  'Arredi Studio': { en: 'Dental units, chairs, operating lights and furniture', es: 'Equipos dentales, sillones, lámparas y mobiliario', fr: 'Fauteuils, unités dentaires, scialytiques et mobilier', de: 'Behandlungseinheiten, Stühle, OP-Leuchten und Möbel', pt: 'Equipos odontológicos, cadeiras, luzes cirúrgicas e mobiliário', nl: 'Behandelunits, stoelen, operatielampen en meubilair', pl: 'Unity stomatologiczne, fotele, lampy zabiegowe i meble' },
  'Abbigliamento e Divise': { en: 'Gowns, uniforms, fabric masks and professional practice clothing', es: 'Batas, uniformes, mascarillas de tela y ropa profesional', fr: 'Blouses, uniformes, masques en tissu et vêtements professionnels', de: 'Kittel, Uniformen, Stoffmasken und Berufskleidung', pt: 'Aventais, uniformes, máscaras de tecido e vestuário profissional', nl: 'Jassen, uniformen, stoffen maskers en professionele praktijkkleding', pl: 'Fartuchy, uniformy, maski tkaninowe i odzież zawodowa' },
  'Disinfezione': { en: 'Products for surface and instrument disinfection', es: 'Productos para desinfección de superficies e instrumentos', fr: 'Produits de désinfection des surfaces et instruments', de: 'Produkte zur Flächen- und Instrumentendesinfektion', pt: 'Produtos para desinfeção de superfícies e instrumentos', nl: 'Producten voor oppervlakte- en instrumentendesinfectie', pl: 'Produkty do dezynfekcji powierzchni i narzędzi' },
  'Consumabili': { en: 'Consumable materials for the dental practice', es: 'Materiales consumibles para la clínica dental', fr: 'Matériel consommable pour le cabinet dentaire', de: 'Verbrauchsmaterialien für die Zahnarztpraxis', pt: 'Materiais consumíveis para o consultório odontológico', nl: 'Verbruiksmaterialen voor de tandartspraktijk', pl: 'Materiały zużywalne dla gabinetu stomatologicznego' },
  'Igiene Orale Professionale': { en: 'Scalers, air polishing units and oral hygiene instruments', es: 'Ablatores, air polishing e instrumentos de higiene oral', fr: 'Détartreurs, aéropolisseurs et instruments d\'hygiène bucco-dentaire', de: 'Scaler, Air-Polishing-Geräte und Mundhygiene-Instrumente', pt: 'Destartarizadores, jato de bicarbonato e instrumentos de higiene oral', nl: 'Scalers, air-polishingapparatuur en mondhygiëne-instrumenten', pl: 'Skalery, urządzenia air-polishing i narzędzia do higieny jamy ustnej' },
};

/** Etichetta categoria localizzata per la lingua corrente; ricade sull'italiano se manca la traduzione o la lingua è 'it'. */
export function localizeCategoryName(category: string, language: string): string {
  if (language === 'it') return category;
  return CATEGORY_LABELS[category]?.[language] || category;
}

/** Descrizione categoria localizzata (usata nelle tile "Esplora per categoria"); stesso fallback. */
export function localizeCategoryDescription(category: string, description: string, language: string): string {
  if (language === 'it') return description;
  return CATEGORY_DESCRIPTIONS[category]?.[language] || description;
}
