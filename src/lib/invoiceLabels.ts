// ── Etichette della fattura, native in 8 lingue ─────────────────────────
//
// PROBLEMA CORRETTO. La fattura era interamente in italiano, scritta fissa
// nel generatore, e non riceveva nemmeno un parametro lingua. Un dentista
// polacco che compra da un venditore olandese scaricava un documento
// intitolato "Fattura", con "Data di fatturazione" e "Imponibile", e la
// data nel formato italiano. Fra tutti i punti italocentrici della
// piattaforma questo era il piu' grave, perche' e' l'unico che il cliente
// riceve come DOCUMENTO: lo conserva, lo archivia, lo passa al proprio
// commercialista.
//
// SCRITTE, NON TRADOTTE. Ogni lingua e' redatta con la terminologia
// contabile che si usa davvero in quel Paese, non ricalcando l'italiano.
// "Imponibile" in tedesco e' "Nettobetrag", non una traduzione letterale;
// la fattura in polacco si intitola "Faktura", in olandese "Factuur". Sono
// termini che un professionista si aspetta di leggere sul proprio
// documento fiscale, e sbagliarli fa sembrare la piattaforma straniera
// proprio nel momento in cui deve sembrare affidabile.
//
// COSA RESTA IN INGLESE E PERCHE'. La dicitura del reverse charge riporta
// SEMPRE anche la formula inglese accanto a quella locale: e' prassi
// consolidata nelle cessioni intracomunitarie, perche' il documento deve
// essere comprensibile all'amministrazione fiscale di un Paese che non
// parla la lingua dell'emittente.

export type InvoiceLang = 'it' | 'en' | 'es' | 'fr' | 'de' | 'pt' | 'nl' | 'pl';

export const INVOICE_DATE_LOCALE: Record<InvoiceLang, string> = {
  it: 'it-IT', en: 'en-GB', es: 'es-ES', fr: 'fr-FR',
  de: 'de-DE', pt: 'pt-PT', nl: 'nl-NL', pl: 'pl-PL',
};

export interface InvoiceLabels {
  docTitle: string;
  paid: string;
  paymentRef: string;
  soldBy: string;
  vatNo: string;
  invoiceDate: string;
  invoiceNumber: string;
  totalDue: string;
  billingAddress: string;
  shippingAddress: string;
  sellerAddress: string;
  orderDate: string;
  orderNumber: string;
  orderedBy: string;
  colDescription: string;
  colQty: string;
  colUnitPrice: string;
  colVatPct: string;
  colLineTotal: string;
  exclVat: string;
  inclVat: string;
  invoiceTotal: string;
  taxableBase: string;
  vatTotal: string;
  vatNotRegistered: string;
  productFallback: string;
  vendorFallback: string;
  reverseChargeTitle: string;
  reverseChargeBody: string;
  noTaxNote: string;
  marketplaceNote: string;
  /** Avvertenza in evidenza: questo documento NON e' una fattura. */
  notInvoiceNotice: string;
  footerTagline: string;
  generatedOn: string;
  buttonLabel: string;
}

const L: Record<InvoiceLang, InvoiceLabels> = {
  it: {
    docTitle: 'Riepilogo ordine', paid: 'Pagato', paymentRef: 'Numero di riferimento del pagamento',
    soldBy: 'Venduto da', vatNo: 'P. IVA', invoiceDate: 'Data ordine',
    invoiceNumber: 'Numero ordine', totalDue: 'Totale da pagare',
    billingAddress: 'Indirizzo di fatturazione', shippingAddress: 'Indirizzo di spedizione',
    sellerAddress: 'Venduto da', orderDate: 'Data ordine', orderNumber: 'Numero ordine',
    orderedBy: 'Ordinato da', colDescription: 'Descrizione', colQty: 'Quant.',
    colUnitPrice: 'P. unitario', colVatPct: 'IVA %', colLineTotal: 'Prezzo totale',
    exclVat: 'IVA esclusa', inclVat: 'IVA inclusa', invoiceTotal: 'Totale ordine',
    taxableBase: 'Imponibile', vatTotal: 'Totale IVA',
    vatNotRegistered: 'P. IVA non ancora registrata', productFallback: 'Prodotto',
    vendorFallback: 'Venditore',
    reverseChargeTitle: 'IVA non addebitata — operazione soggetta a inversione contabile (reverse charge).',
    reverseChargeBody: "Cessione intracomunitaria esente ai sensi dell'art. 138 della Direttiva 2006/112/CE. Il cliente è tenuto ad assolvere l'imposta nel proprio paese secondo il meccanismo del reverse charge.",
    noTaxNote: "Questa vendita non riporta un'IVA calcolata separatamente per questo ordine — il regime fiscale applicabile dipende dalla registrazione fiscale del venditore. Per l'esatto trattamento IVA di questa fattura, contatta direttamente {v}.",
    notInvoiceNotice: 'Questo documento non è una fattura.',
    marketplaceNote: "Riepilogo dell'ordine emesso da Oralzon in qualità di piattaforma attraverso cui la vendita è stata effettuata e il pagamento processato per conto del venditore. La fattura sarà emessa da {v}, che è il venditore dei prodotti e il soggetto responsabile degli obblighi fiscali della vendita.",
    footerTagline: 'Marketplace B2B odontoiatrico', generatedOn: 'Documento generato automaticamente il',
    buttonLabel: 'Riepilogo PDF',
  },
  en: {
    docTitle: 'Order summary', paid: 'Paid', paymentRef: 'Payment reference number',
    soldBy: 'Sold by', vatNo: 'VAT no.', invoiceDate: 'Order date',
    invoiceNumber: 'Order number', totalDue: 'Total due',
    billingAddress: 'Billing address', shippingAddress: 'Shipping address',
    sellerAddress: 'Sold by', orderDate: 'Order date', orderNumber: 'Order number',
    orderedBy: 'Ordered by', colDescription: 'Description', colQty: 'Qty',
    colUnitPrice: 'Unit price', colVatPct: 'VAT %', colLineTotal: 'Line total',
    exclVat: 'excl. VAT', inclVat: 'incl. VAT', invoiceTotal: 'Order total',
    taxableBase: 'Net amount', vatTotal: 'VAT total',
    vatNotRegistered: 'VAT number not yet registered', productFallback: 'Product',
    vendorFallback: 'Seller',
    reverseChargeTitle: 'VAT not charged — reverse charge applies.',
    reverseChargeBody: 'VAT exempt intra-Community supply under Article 138 of Council Directive 2006/112/EC. The customer must account for VAT in their own country under the reverse charge mechanism.',
    noTaxNote: 'No VAT was calculated separately for this order — the applicable tax regime depends on the seller\u2019s tax registration. For the exact VAT treatment of this invoice, please contact {v} directly.',
    notInvoiceNotice: 'This document is not an invoice.',
    marketplaceNote: "Order summary issued by Oralzon as the platform through which the sale was made and the payment processed on behalf of the seller. The invoice will be issued by {v}, who is the seller of the goods and responsible for the tax obligations of the sale.",
    footerTagline: 'B2B dental marketplace', generatedOn: 'Document generated automatically on',
    buttonLabel: 'Order summary PDF',
  },
  de: {
    docTitle: 'Bestellübersicht', paid: 'Bezahlt', paymentRef: 'Zahlungsreferenznummer',
    soldBy: 'Verkauft von', vatNo: 'USt-IdNr.', invoiceDate: 'Bestelldatum',
    invoiceNumber: 'Bestellnummer', totalDue: 'Gesamtbetrag',
    billingAddress: 'Rechnungsadresse', shippingAddress: 'Lieferadresse',
    sellerAddress: 'Verkauft von', orderDate: 'Bestelldatum', orderNumber: 'Bestellnummer',
    orderedBy: 'Bestellt von', colDescription: 'Bezeichnung', colQty: 'Menge',
    colUnitPrice: 'Einzelpreis', colVatPct: 'USt %', colLineTotal: 'Gesamtpreis',
    exclVat: 'zzgl. USt', inclVat: 'inkl. USt', invoiceTotal: 'Bestellsumme',
    taxableBase: 'Nettobetrag', vatTotal: 'USt-Betrag',
    vatNotRegistered: 'USt-IdNr. noch nicht hinterlegt', productFallback: 'Produkt',
    vendorFallback: 'Verkäufer',
    reverseChargeTitle: 'Keine Umsatzsteuer berechnet — Steuerschuldnerschaft des Leistungsempfängers (Reverse Charge).',
    reverseChargeBody: 'Steuerfreie innergemeinschaftliche Lieferung gemäß Artikel 138 der Richtlinie 2006/112/EG. Der Kunde schuldet die Umsatzsteuer im eigenen Land nach dem Reverse-Charge-Verfahren.',
    noTaxNote: 'Für diese Bestellung wurde keine Umsatzsteuer gesondert ausgewiesen — die anwendbare Steuerregelung hängt von der steuerlichen Registrierung des Verkäufers ab. Für die genaue umsatzsteuerliche Behandlung wenden Sie sich bitte direkt an {v}.',
    notInvoiceNotice: 'Dieses Dokument ist keine Rechnung.',
    marketplaceNote: "Bestellübersicht, ausgestellt von Oralzon als Plattform, über die der Verkauf erfolgte und die Zahlung im Namen des Verkäufers abgewickelt wurde. Die Rechnung wird von {v} ausgestellt, dem Verkäufer der Waren und Verantwortlichen für die steuerlichen Pflichten des Verkaufs.",
    footerTagline: 'B2B-Marktplatz für Dentalbedarf', generatedOn: 'Dokument automatisch erstellt am',
    buttonLabel: 'Bestellübersicht als PDF',
  },
  fr: {
    docTitle: 'Récapitulatif de commande', paid: 'Payé', paymentRef: 'Numéro de référence du paiement',
    soldBy: 'Vendu par', vatNo: 'N° TVA', invoiceDate: 'Date de commande',
    invoiceNumber: 'Numéro de commande', totalDue: 'Montant total',
    billingAddress: 'Adresse de facturation', shippingAddress: 'Adresse de livraison',
    sellerAddress: 'Vendu par', orderDate: 'Date de commande', orderNumber: 'Numéro de commande',
    orderedBy: 'Commandé par', colDescription: 'Désignation', colQty: 'Qté',
    colUnitPrice: 'Prix unitaire', colVatPct: 'TVA %', colLineTotal: 'Prix total',
    exclVat: 'HT', inclVat: 'TTC', invoiceTotal: 'Total de la commande',
    taxableBase: 'Base HT', vatTotal: 'Total TVA',
    vatNotRegistered: 'N° TVA non encore enregistré', productFallback: 'Produit',
    vendorFallback: 'Vendeur',
    reverseChargeTitle: 'TVA non facturée — autoliquidation.',
    reverseChargeBody: "Livraison intracommunautaire exonérée en application de l'article 138 de la directive 2006/112/CE. Le client est redevable de la TVA dans son pays selon le mécanisme d'autoliquidation.",
    noTaxNote: "Aucune TVA n'a été calculée séparément pour cette commande — le régime fiscal applicable dépend de l'immatriculation fiscale du vendeur. Pour le traitement exact de la TVA, veuillez contacter directement {v}.",
    notInvoiceNotice: "Ce document n'est pas une facture.",
    marketplaceNote: "Récapitulatif de commande émis par Oralzon en tant que plateforme par laquelle la vente a été réalisée et le paiement traité pour le compte du vendeur. La facture sera émise par {v}, vendeur des produits et responsable des obligations fiscales de la vente.",
        footerTagline: 'Marketplace B2B dentaire', generatedOn: 'Document généré automatiquement le',
    buttonLabel: 'Récapitulatif PDF',
  },
  es: {
    docTitle: 'Resumen del pedido', paid: 'Pagado', paymentRef: 'Número de referencia del pago',
    soldBy: 'Vendido por', vatNo: 'NIF/IVA', invoiceDate: 'Fecha del pedido',
    invoiceNumber: 'Número de pedido', totalDue: 'Total a pagar',
    billingAddress: 'Dirección de facturación', shippingAddress: 'Dirección de envío',
    sellerAddress: 'Vendido por', orderDate: 'Fecha del pedido', orderNumber: 'Número de pedido',
    orderedBy: 'Pedido por', colDescription: 'Descripción', colQty: 'Cant.',
    colUnitPrice: 'Precio unitario', colVatPct: 'IVA %', colLineTotal: 'Precio total',
    exclVat: 'sin IVA', inclVat: 'IVA incluido', invoiceTotal: 'Total del pedido',
    taxableBase: 'Base imponible', vatTotal: 'Total IVA',
    vatNotRegistered: 'NIF/IVA aún no registrado', productFallback: 'Producto',
    vendorFallback: 'Vendedor',
    reverseChargeTitle: 'IVA no repercutido — operación con inversión del sujeto pasivo.',
    reverseChargeBody: 'Entrega intracomunitaria exenta conforme al artículo 138 de la Directiva 2006/112/CE. El cliente debe autoliquidar el IVA en su país mediante el mecanismo de inversión del sujeto pasivo.',
    noTaxNote: 'En este pedido no se ha calculado el IVA por separado — el régimen fiscal aplicable depende del registro fiscal del vendedor. Para el tratamiento exacto del IVA, contacte directamente con {v}.',
    notInvoiceNotice: 'Este documento no es una factura.',
    marketplaceNote: "Resumen del pedido emitido por Oralzon como plataforma a través de la cual se realizó la venta y se procesó el pago por cuenta del vendedor. La factura será emitida por {v}, que es el vendedor de los productos y el responsable de las obligaciones fiscales de la venta.",
    footerTagline: 'Marketplace B2B dental', generatedOn: 'Documento generado automáticamente el',
    buttonLabel: 'Resumen PDF',
  },
  pt: {
    docTitle: 'Resumo da encomenda', paid: 'Pago', paymentRef: 'Número de referência do pagamento',
    soldBy: 'Vendido por', vatNo: 'NIF/IVA', invoiceDate: 'Data da encomenda',
    invoiceNumber: 'Número da encomenda', totalDue: 'Total a pagar',
    billingAddress: 'Morada de faturação', shippingAddress: 'Morada de entrega',
    sellerAddress: 'Vendido por', orderDate: 'Data da encomenda', orderNumber: 'Número da encomenda',
    orderedBy: 'Encomendado por', colDescription: 'Descrição', colQty: 'Qtd.',
    colUnitPrice: 'Preço unitário', colVatPct: 'IVA %', colLineTotal: 'Preço total',
    exclVat: 'sem IVA', inclVat: 'com IVA', invoiceTotal: 'Total da encomenda',
    taxableBase: 'Base tributável', vatTotal: 'Total IVA',
    vatNotRegistered: 'NIF/IVA ainda não registado', productFallback: 'Produto',
    vendorFallback: 'Vendedor',
    reverseChargeTitle: 'IVA não liquidado — autoliquidação (reverse charge).',
    reverseChargeBody: 'Transmissão intracomunitária isenta ao abrigo do artigo 138.º da Diretiva 2006/112/CE. O cliente deve liquidar o IVA no seu país através do mecanismo de autoliquidação.',
    noTaxNote: 'Nesta encomenda não foi calculado IVA em separado — o regime fiscal aplicável depende do registo fiscal do vendedor. Para o tratamento exato do IVA, contacte diretamente {v}.',
    notInvoiceNotice: 'Este documento no es una factura.',
    marketplaceNote: "Resumen del pedido emitido por Oralzon como plataforma a través de la cual se realizó la venta y se procesó el pago por cuenta del vendedor. La factura será emitida por {v}, que es el vendedor de los productos y el responsable de las obligaciones fiscales de la venta.",
    footerTagline: 'Marketplace B2B dentário', generatedOn: 'Documento gerado automaticamente em',
    buttonLabel: 'Resumo PDF',
  },
  nl: {
    docTitle: 'Besteloverzicht', paid: 'Betaald', paymentRef: 'Betalingsreferentie',
    soldBy: 'Verkocht door', vatNo: 'Btw-nummer', invoiceDate: 'Besteldatum',
    invoiceNumber: 'Bestelnummer', totalDue: 'Totaalbedrag',
    billingAddress: 'Factuuradres', shippingAddress: 'Afleveradres',
    sellerAddress: 'Verkocht door', orderDate: 'Besteldatum', orderNumber: 'Bestelnummer',
    orderedBy: 'Besteld door', colDescription: 'Omschrijving', colQty: 'Aantal',
    colUnitPrice: 'Stukprijs', colVatPct: 'Btw %', colLineTotal: 'Totaalprijs',
    exclVat: 'excl. btw', inclVat: 'incl. btw', invoiceTotal: 'Besteltotaal',
    taxableBase: 'Nettobedrag', vatTotal: 'Totaal btw',
    vatNotRegistered: 'Btw-nummer nog niet geregistreerd', productFallback: 'Product',
    vendorFallback: 'Verkoper',
    reverseChargeTitle: 'Geen btw in rekening gebracht — btw verlegd.',
    reverseChargeBody: 'Vrijgestelde intracommunautaire levering op grond van artikel 138 van Richtlijn 2006/112/EG. De afnemer moet de btw in het eigen land voldoen volgens de verleggingsregeling.',
    noTaxNote: 'Voor deze bestelling is geen btw afzonderlijk berekend — het toepasselijke belastingregime hangt af van de fiscale registratie van de verkoper. Neem voor de exacte btw-behandeling rechtstreeks contact op met {v}.',
    notInvoiceNotice: 'Este documento não é uma fatura.',
    marketplaceNote: "Resumo da encomenda emitido pela Oralzon enquanto plataforma através da qual a venda foi efetuada e o pagamento processado por conta do vendedor. A fatura será emitida por {v}, que é o vendedor dos produtos e o responsável pelas obrigações fiscais da venda.",
    footerTagline: 'B2B-marktplaats voor tandheelkundige benodigdheden', generatedOn: 'Document automatisch gegenereerd op',
    buttonLabel: 'Besteloverzicht pdf',
  },
  pl: {
    docTitle: 'Podsumowanie zamówienia', paid: 'Opłacono', paymentRef: 'Numer referencyjny płatności',
    soldBy: 'Sprzedawca', vatNo: 'NIP', invoiceDate: 'Data zamówienia',
    invoiceNumber: 'Numer zamówienia', totalDue: 'Do zapłaty',
    billingAddress: 'Adres rozliczeniowy', shippingAddress: 'Adres dostawy',
    sellerAddress: 'Sprzedawca', orderDate: 'Data zamówienia', orderNumber: 'Numer zamówienia',
    orderedBy: 'Zamawiający', colDescription: 'Nazwa towaru', colQty: 'Ilość',
    colUnitPrice: 'Cena jedn.', colVatPct: 'VAT %', colLineTotal: 'Wartość',
    exclVat: 'netto', inclVat: 'brutto', invoiceTotal: 'Razem zamówienie',
    taxableBase: 'Wartość netto', vatTotal: 'Kwota VAT',
    vatNotRegistered: 'NIP jeszcze niezarejestrowany', productFallback: 'Produkt',
    vendorFallback: 'Sprzedawca',
    reverseChargeTitle: 'VAT nie został naliczony — odwrotne obciążenie.',
    reverseChargeBody: 'Wewnątrzwspólnotowa dostawa towarów zwolniona z VAT na podstawie art. 138 dyrektywy 2006/112/WE. Nabywca jest zobowiązany do rozliczenia podatku w swoim kraju w ramach mechanizmu odwrotnego obciążenia.',
    noTaxNote: 'Dla tego zamówienia nie wyliczono VAT osobno — właściwy reżim podatkowy zależy od rejestracji podatkowej sprzedawcy. W sprawie dokładnego rozliczenia VAT skontaktuj się bezpośrednio z {v}.',
    notInvoiceNotice: 'Ten dokument nie jest fakturą.',
    marketplaceNote: "Podsumowanie zamówienia wystawione przez Oralzon jako platformę, za pośrednictwem której doszło do sprzedaży, a płatność została obsłużona w imieniu sprzedawcy. Fakturę wystawi {v}, który jest sprzedawcą towarów i odpowiada za obowiązki podatkowe związane ze sprzedażą.",
    footerTagline: 'Marketplace B2B dla stomatologii', generatedOn: 'Dokument wygenerowany automatycznie dnia',
    buttonLabel: 'Podsumowanie PDF',
  },
};

export function invoiceLabels(lang?: string): InvoiceLabels {
  const code = (lang || 'it').split('-')[0] as InvoiceLang;
  return L[code] || L.it;
}

export function invoiceDateLocale(lang?: string): string {
  const code = (lang || 'it').split('-')[0] as InvoiceLang;
  return INVOICE_DATE_LOCALE[code] || INVOICE_DATE_LOCALE.it;
}

/**
 * Importo formattato secondo le convenzioni del lettore: in Germania
 * "1.234,56 €", nel Regno Unito "€1,234.56". La valuta resta l'euro — e'
 * quella in cui Stripe addebita — ma separatore e posizione del simbolo
 * seguono la lingua del documento.
 */
export function invoiceMoney(amount: number, lang?: string): string {
  try {
    return new Intl.NumberFormat(invoiceDateLocale(lang), { style: 'currency', currency: 'EUR' }).format(amount);
  } catch {
    return `€${amount.toFixed(2)}`;
  }
}
