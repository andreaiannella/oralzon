import type { LegalDocument } from '../legalContent';

/**
 * Deutsche Fassung der Rechtstexte.
 *
 * Zwei bewusste Übersetzungsentscheidungen:
 *
 * 1. Die Angaben zum Betreiber lauten derzeit nur "Oralzon", ohne
 *    Firmenname, Sitz und USt-IdNr. Das ist eine bewusste vorläufige
 *    Entscheidung: die Daten liegen vor und müssen noch eingetragen
 *    werden. Siehe docs/dati-societari-mancanti.md.
 *
 * 2. Verweise auf italienisches Recht (Verbrauchergesetzbuch,
 *    Zivilgesetzbuch, Gerichtsstand Cassino) werden NICHT durch deutsche
 *    Entsprechungen ersetzt, sondern ausdrücklich als italienisches Recht
 *    benannt. Auf den Vertrag ist italienisches Recht anwendbar (Ziff. 11):
 *    eine Übertragung ins BGB o. Ä. wäre inhaltlich falsch und würde
 *    falsche Erwartungen wecken.
 */

const TERMINI_SERVIZIO_DE: LegalDocument = {
  title: "Nutzungsbedingungen",
  lastUpdated: "August 2026",
  sections: [
    {
      heading: "1. Wer wir sind und was diese Bedingungen regeln",
      paragraphs: [
        "Oralzon ist ein Online-Vermittlungsdienst, der Anbieter von Dentalprodukten (**Verkäufer**) mit gewerblichen Betreibern der Branche (**Käufer**) zusammenbringt. Oralzon verkauft über den Vermittlungsdienst keine eigenen Produkte an Käufer: Jeder Kaufvertrag kommt unmittelbar zwischen Verkäufer und Käufer zustande.",
        "Betreiberin der Plattform ist **Oralzon**, erreichbar unter support@oralzon.com.",
        "Mit der Nutzung der Plattform akzeptieren Sie diese Bedingungen. Wenn Sie sie nicht akzeptieren, dürfen Sie die Plattform nicht nutzen. Die Verkaufsbedingungen, die Datenschutzerklärung und die Cookie-Richtlinie sind Bestandteil dieser Bedingungen."
      ],
    },
    {
      heading: "2. Wer Oralzon nutzen darf",
      paragraphs: [
        "Oralzon ist Personen vorbehalten, die in Ausübung ihrer beruflichen oder unternehmerischen Tätigkeit handeln und über eine gültige Umsatzsteuer-Identifikationsnummer verfügen. Die Plattform richtet sich nicht an Verbraucher: Folglich **finden die Schutzvorschriften des italienischen Verbrauchergesetzbuchs keine Anwendung** (D.Lgs. 206/2005), da diese ausschließlich natürliche Personen betreffen, die zu Zwecken außerhalb ihrer Tätigkeit handeln.",
        "Verkäufer müssen ihren Sitz in einem der 27 Mitgliedstaaten der Europäischen Union haben. Dieses Erfordernis ergibt sich aus den Mehrwertsteuervorschriften zum fiktiven Lieferer (Art. 14a der Richtlinie 2006/112/EG) und ist nicht abdingbar.",
        "Sie sind für die Richtigkeit der angegebenen Daten, für die Verwahrung Ihrer Zugangsdaten und für alles verantwortlich, was über Ihr Konto geschieht."
      ],
    },
    {
      heading: "3. Änderungen dieser Bedingungen",
      paragraphs: [
        "Wir können diese Bedingungen ändern. Änderungen werden den Verkäufern per E-Mail mitgeteilt und **mindestens 15 Tage vor** ihrem Wirksamwerden auf der Plattform veröffentlicht, wie in Art. 3 der Verordnung (EU) 2019/1150 vorgesehen. Erfordert die Änderung erhebliche technische oder geschäftliche Anpassungen, verlängert sich die Frist entsprechend.",
        "Während der Ankündigungsfrist kann der Verkäufer kostenfrei kündigen. Das Einstellen neuer Produkte oder das Ausbleiben einer Kündigung innerhalb der Frist gelten als Zustimmung.",
        "Die Ankündigungsfrist gilt nicht, wenn die Änderung durch eine gesetzliche Pflicht vorgegeben ist oder einer unmittelbaren Gefahr für die Sicherheit der Plattform oder ihrer Nutzer begegnen soll."
      ],
    },
    {
      heading: "4. Wie Produkte gereiht werden (Ranking)",
      paragraphs: [
        "In Umsetzung von Art. 5 der Verordnung (EU) 2019/1150 nennen wir die Hauptparameter, die die Position der Produkte in den Suchergebnissen und in den Bereichen der Plattform bestimmen, sowie deren relative Bedeutung."
      ],
      bullets: [
        "**Übereinstimmung mit der Suchanfrage** — der maßgebliche Parameter: Die Textsuche gleicht den eingegebenen Begriff mit Name, Marke und Artikelnummer des Produkts ab",
        "**Vom Käufer gewählte Filter und Sortierung** — sortiert der Käufer nach Preis oder Datum, geht diese Wahl allen anderen Parametern vor, einschließlich bezahlter Platzierungen",
        "**Verfügbarkeit und Status des Produkts** — nicht veröffentlichte Produkte oder Produkte gesperrter Verkäufer erscheinen nicht",
        "**Bezahlte Platzierung** — Verkäufer können Sichtbarkeitspakete erwerben (hervorgehobene Produkte, Flächen auf der Startseite, Flächen je Kategorie, kontextbezogene Karten). Diese Inhalte sind **stets als „Gesponsert“ gekennzeichnet**, und ihre Position hängt ausschließlich vom Erwerb des Pakets ab, nicht von einer Qualitätsbewertung des Produkts. Ist eine bezahlte Fläche verfügbar, aber von keinem Verkäufer gebucht, zeigen wir ein nicht gesponsertes Produkt mit der neutralen Kennzeichnung „Empfohlen“ und schreiben ihm keine nicht vorhandene Sponsorschaft zu",
        "**Kauf- und Navigationsverlauf des Käufers** — genutzt, um passende Produkte vorzuschlagen, mit ausschließlich auf dieser Plattform erhobenen Daten. Er wirkt sich nicht auf Preise oder Konditionen aus und geht weder den ausdrücklichen Entscheidungen des Käufers noch bezahlten Flächen vor",
        "**Erzielte Verkäufe und erhaltene Bewertungen** — in den Bereichen für meistverkaufte Produkte"
      ],
    },
    {
      heading: "5. Pflichten der Verkäufer",
      bullets: [
        "Ordnungsgemäß errichtete Rechtssubjekte sein, mit gültiger Umsatzsteuer-Identifikationsnummer in einem Mitgliedstaat der Europäischen Union",
        "Vollständige, zutreffende und nicht irreführende Produktinformationen veröffentlichen, einschließlich der gesetzlich vorgeschriebenen Angaben",
        "Sicherstellen, dass als Medizinprodukte eingestufte Waren der Verordnung (EU) 2017/745 (MDR) und allen weiteren einschlägigen Vorschriften entsprechen",
        "Lagerbestände aktuell halten und eingegangene Bestellungen innerhalb der angegebenen Fristen ausführen",
        "Den Versand der eigenen Produkte organisieren und die Sendungsverfolgungsdaten eintragen",
        "Käuferdaten ausschließlich zur Ausführung der Bestellung verwenden, unter Beachtung der DSGVO",
        "**Käufer nicht von der Plattform wegleiten**: Es ist untersagt, direkte Kontaktdaten (E-Mail, Telefon, Messenger, Websites Dritter) in Produktbeschreibungen, Antworten auf Fragen, Bewertungen, Bildern oder in Sendungen beigefügten Materialien anzugeben, um auf Oralzon entstandene Verkäufe außerhalb der Plattform abzuschließen",
        "Sämtliche steuerlichen Pflichten selbst erfüllen, einschließlich der Zusammenfassenden Meldungen für innergemeinschaftliche Lieferungen (Intrastat), soweit geschuldet: Oralzon reicht diese nicht für den Verkäufer ein"
      ],
    },
    {
      heading: "6. Beschränkung, Aussetzung und Beendigung des Dienstes",
      paragraphs: [
        "In Umsetzung von Art. 4 der Verordnung (EU) 2019/1150 teilen wir einem Verkäufer, dessen Dienste wir beschränken oder aussetzen, **die konkreten Gründe** der Entscheidung auf einem dauerhaften Datenträger mit, spätestens zu dem Zeitpunkt, zu dem die Maßnahme wirksam wird.",
        "Entscheiden wir, die Bereitstellung der Dienste vollständig einzustellen, beträgt die Frist **mindestens 30 Tage**, es sei denn, es besteht eine gesetzliche Pflicht, ein schwerer und wiederholter Verstoß gegen diese Bedingungen oder eine konkrete Gefahr für die Sicherheit der Nutzer oder die Integrität des Dienstes.",
        "Der Verkäufer kann die Entscheidung über das Beschwerdeverfahren nach Ziff. 7 anfechten. Wird der Anfechtung stattgegeben, wird die Maßnahme unverzüglich aufgehoben.",
        "Der Ablauf des Testzeitraums oder des Verkäuferplans ohne Verlängerung ist keine Sanktion: Er richtet sich nach den Verkaufsbedingungen und wird durch entsprechende Hinweise angekündigt.",
        "**Vor einer Aussetzung eingegangene Bestellungen bleiben gültig** und sind auszuführen. Die entsprechenden Beträge werden nach den gewöhnlichen Bedingungen gutgeschrieben."
      ],
    },
    {
      heading: "7. Beschwerden und Streitbeilegung",
      paragraphs: [
        "Jeder Verkäufer kann eine Beschwerde an **support@oralzon.com** richten und dabei den Gegenstand der Beanstandung angeben. Wir bearbeiten Beschwerden in angemessener und der Komplexität entsprechender Zeit und teilen das Ergebnis individuell und in klarer Sprache mit.",
        "Die Betreiberin der Plattform ist derzeit ein Kleinunternehmen im Sinne von Art. 11 Abs. 5 der Verordnung (EU) 2019/1150 und daher nicht verpflichtet, ein formalisiertes internes Beschwerdemanagementsystem einzurichten. Das oben beschriebene Verfahren halten wir gleichwohl aufrecht.",
        "Kommt keine Einigung zustande, können sich die Parteien außergerichtlich an eine im Register des italienischen Justizministeriums eingetragene, für Handelssachen zuständige Mediationsstelle wenden. Die Inanspruchnahme der Mediation lässt das Recht unberührt, die Gerichte anzurufen.",
        "Die den Verkäufervereinigungen durch Art. 14 derselben Verordnung eingeräumten Rechte bleiben unberührt."
      ],
    },
    {
      heading: "8. Zugang zu Daten",
      paragraphs: [
        "Der Verkäufer hat über seinen geschützten Bereich Zugang zu den durch seine Tätigkeit erzeugten Daten: eingegangene Bestellungen, verkaufte Produkte, Umsatz, Bewertungen, Kundenfragen, Überweisungen und steuerliche Übersichten.",
        "E-Mail-Adresse und Telefonnummer der Käufer geben wir nicht an die Verkäufer weiter. Übermittelt werden hingegen Name, Lieferanschrift und Rechnungsdaten, die zur Lieferung und Rechnungstellung erforderlich sind. Diese Entscheidung schützt Käufer vor unerwünschter Kontaktaufnahme und hält den Austausch im Streitfall nachvollziehbar.",
        "Wir geben die auf der Plattform erzeugten aggregierten Daten nicht zu eigenen kommerziellen Zwecken Dritter weiter."
      ],
    },
    {
      heading: "9. Geistiges Eigentum und Inhalte",
      paragraphs: [
        "Der Verkäufer behält sämtliche Rechte an den von ihm veröffentlichten Inhalten und sichert zu, hierzu berechtigt zu sein. Er räumt Oralzon eine nicht ausschließliche, unentgeltliche Lizenz ein, diese zu veröffentlichen, automatisch in die Sprachen der Plattform zu übersetzen und zur Bewerbung des Katalogs zu nutzen, begrenzt auf die Dauer des Vertragsverhältnisses.",
        "Marken, Benutzeroberflächen, redaktionelle Texte und Software der Plattform stehen der Betreiberin zu und dürfen ohne Genehmigung nicht vervielfältigt werden.",
        "Wir entfernen Inhalte, die rechtswidrig oder irreführend sind oder gegen diese Bedingungen verstoßen, und informieren den Urheber unter Angabe der Gründe."
      ],
    },
    {
      heading: "10. Haftung",
      paragraphs: [
        "Oralzon haftet für das Funktionieren der technischen Plattform und für die Richtigkeit der von ihr selbst bereitgestellten Informationen. Oralzon ist nicht Partei des Kaufvertrags und haftet nicht für Qualität, Konformität oder Sicherheit der Produkte, für das Verhalten der Verkäufer oder für Lieferzeiten; dies obliegt ausschließlich dem Verkäufer.",
        "Außer bei Vorsatz oder grober Fahrlässigkeit sowie bei Personenschäden ist die Gesamthaftung von Oralzon gegenüber einem Verkäufer auf die Beträge begrenzt, die dieser in den zwölf Monaten vor dem Ereignis an die Plattform entrichtet hat. Gegenüber einem Käufer ist sie auf den Betrag der Bestellung begrenzt, auf die sich die Beanstandung bezieht.",
        "Keine Klausel dieser Bedingungen schließt eine Haftung aus oder begrenzt sie, soweit das anwendbare Recht dies nicht zulässt."
      ],
    },
    {
      heading: "11. Anwendbares Recht und Gerichtsstand",
      paragraphs: [
        "Diese Bedingungen unterliegen italienischem Recht.",
        "Für alle Streitigkeiten ist ausschließlich das Gericht von Cassino (Italien) zuständig. Da es sich um Rechtsbeziehungen zwischen Unternehmern handelt, erkennen die Parteien an, dass diese Zuständigkeit im Sinne von Art. 25 der Verordnung (EU) 1215/2012 schriftlich vereinbart ist.",
        "Bei Abweichungen zwischen den Sprachfassungen ist die italienische Fassung dieser Bedingungen maßgeblich."
      ],
    },
  ],
};

const CONDIZIONI_VENDITA_DE: LegalDocument = {
  title: "Verkaufsbedingungen",
  lastUpdated: "August 2026",
  sections: [
    {
      heading: "1. Anwendungsbereich",
      paragraphs: [
        "Diese Bedingungen regeln Käufe, die über Oralzon von gewerblichen Betreibern der Dentalbranche getätigt werden. Die Produkte werden von den registrierten Anbietern (Verkäufern) verkauft: Der Vertrag kommt zwischen Verkäufer und Käufer zustande, während Oralzon als technischer Vermittler und Inkassobeauftragter auftritt.",
        "Da der Käufer stets in Ausübung seiner Tätigkeit handelt, **finden die Schutzvorschriften des italienischen Verbrauchergesetzbuchs keine Anwendung** (D.Lgs. 206/2005), die Verbrauchern vorbehalten sind."
      ],
    },
    {
      heading: "2. Bestellungen und Bestätigung",
      paragraphs: [
        "Die Bestellung kommt zustande, wenn die Zahlung bestätigt wird. Der Käufer erhält unmittelbar eine E-Mail mit Bestellnummer und Übersicht, die als Annahme des Angebots des Verkäufers gilt.",
        "Begonnene und nicht abgeschlossene Bestellvorgänge führen zu keiner Bestellung und werden nach 24 Stunden automatisch storniert.",
        "Die Verfügbarkeit der Produkte wird zum Zeitpunkt der Bestellung geprüft. Sollte ein Artikel wegen zeitgleicher Käufe nach der Bestätigung nicht mehr verfügbar sein, teilt der Verkäufer dies mit und der nicht lieferbare Teil wird erstattet."
      ],
    },
    {
      heading: "3. Preise, Mehrwertsteuer und Zahlung",
      bullets: [
        "Die Preise verstehen sich in Euro. Bei Inlandsverkäufen enthalten sie die Mehrwertsteuer zum im Land des Verkäufers geltenden Satz",
        "Bei Verkäufen zwischen einem Verkäufer und einem Käufer, die in zwei verschiedenen Mitgliedstaaten der Europäischen Union ansässig sind und beide über eine im VIES-System bestätigte Umsatzsteuer-Identifikationsnummer verfügen, gilt das Reverse-Charge-Verfahren: Das Entgelt enthält keine Mehrwertsteuer und der Käufer versteuert den Umsatz in seinem eigenen Land, wie in der Rechnung angegeben",
        "Fällt die VIES-Prüfung für eine der beiden Parteien negativ aus, gilt die Mehrwertsteuer des Landes des Verkäufers",
        "Die Zahlung erfolgt per Kredit- oder Debitkarte und wird von Stripe abgewickelt. Oralzon verarbeitet und speichert keine Kartendaten",
        "Der Betrag ist zum Zeitpunkt der Bestellung vollständig fällig",
        "Die Rechnung stellt der Verkäufer als allein Verpflichteter aus: Oralzon stellt die erforderlichen Daten bereit, stellt aber keine Rechnung in seinem Namen aus"
      ],
    },
    {
      heading: "4. Provision und Verkäuferplan",
      paragraphs: [
        "Von jedem abgeschlossenen Verkauf behält Oralzon eine Provision von **7 % des Warenwerts** ein (Nettobetrag, ohne Mehrwertsteuer), die vom dem Verkäufer gutgeschriebenen Betrag abgezogen wird. Die Provision deckt die Kosten der Zahlungsabwicklung und die Dienstleistungen der Plattform.",
        "**Auf Versandkosten wird keine Provision erhoben**, da diese keinen Ertrag der Plattform darstellen.",
        "Der Zugang zur Plattform setzt zudem einen jährlichen Verkäuferplan zu den Bedingungen voraus, die bei Abschluss auf der entsprechenden Seite angegeben sind. Nach Ablauf des kostenlosen Testzeitraums führt das Fehlen eines Abschlusses zur Aussetzung der Verkäufe; dem gehen Hinweise per E-Mail vor Ablauf und in den Tagen danach voraus. Katalog, Bestellungen und Statistiken bleiben archiviert und stehen mit Aktivierung des Plans wieder zur Verfügung.",
        "Etwaige Änderungen des Provisionssatzes werden per E-Mail mit einer Frist von mindestens 30 Tagen mitgeteilt und gelten nicht für bereits eingegangene Bestellungen."
      ],
    },
    {
      heading: "5. Versand",
      paragraphs: [
        "Jeder Verkäufer versendet seine Produkte selbst. Bei Bestellungen mit mehreren Anbietern werden die Produkte getrennt versandt, mit gesonderten Kosten und Sendungsverfolgungen je Verkäufer.",
        "Die Versandkosten werden vom Verkäufer je Zielzone festgelegt und dem Käufer vor der Zahlung getrennt nach Anbieter angezeigt. Der Verkäufer kann einen Bestellwert festlegen, ab dem der Versand kostenfrei ist: In diesem Fall trägt er die Transportkosten.",
        "Die in den Produktbeschreibungen angegebenen Lieferzeiten sind Schätzungen und nicht verbindlich. Oralzon versendet ausschließlich innerhalb der Europäischen Union.",
        "Der Käufer erhält die Sendungsnummer bei Versand per E-Mail und wird gebeten, den Erhalt im Bestellbereich zu bestätigen. Bleibt die Bestätigung aus, gilt die Lieferung nach 7 Tagen ab Versand bei Inlandssendungen und nach 15 Tagen bei innergemeinschaftlichen Sendungen als erfolgt."
      ],
    },
    {
      heading: "6. Auszahlung an den Verkäufer",
      paragraphs: [
        "Die vereinnahmten Beträge verbleiben bei Oralzon bis zur Bestätigung der Lieferung, manuell oder automatisch nach den Bestimmungen der Ziff. 5. Erst dann wird der Nettobetrag dem Verkäufer auf das verknüpfte Konto gutgeschrieben.",
        "Diese Vorgehensweise schützt beide Seiten: Sie erlaubt es, eine Rücksendung oder Beanstandung zu klären, bevor die Beträge überwiesen sind, und sichert dem Verkäufer eine automatische Gutschrift ohne Nachfassen zu.",
        "Ein offener Rücksendeantrag setzt die Gutschrift für den betroffenen Artikel bis zum Abschluss des Vorgangs aus.",
        "Um Gutschriften zu erhalten, muss der Verkäufer die vom Zahlungsdienstleister verlangte Identitätsprüfung abschließen. Bis dahin bleiben die Beträge zurückgestellt und gehen nicht verloren."
      ],
    },
    {
      heading: "7. Rücksendungen und Erstattungen",
      paragraphs: [
        "Da es sich um Verkäufe zwischen Unternehmern handelt, **besteht kein gesetzliches Widerrufsrecht**. Oralzon räumt jedoch als eigene Geschäftspolitik die Möglichkeit ein, innerhalb von **30 Tagen** ab Lieferung eine Rücksendung zu beantragen, zu den nachstehenden Bedingungen.",
        "Der Antrag wird im Bereich „Meine Bestellungen“ gestellt und kann auch nur einen Teil der gekauften Mengen betreffen. Der Verkäufer prüft ihn und kann ihm stattgeben oder ihn unter Angabe von Gründen ablehnen.",
        "Die Produkte müssen unversehrt, in ungeöffneter Originalverpackung und vollständig zurückgesandt werden. **Von der Rücksendung ausgeschlossen** sind Einwegprodukte mit geöffneter oder beschädigter Sterilverpackung, maßgefertigte Produkte, schnell verderbliche Waren und solche, deren Sicherheit nach dem Öffnen nicht mehr überprüfbar ist.",
        "Sofern nichts anderes vereinbart ist, trägt der Käufer die Rücksendekosten. Sie gehen hingegen zulasten des Verkäufers, wenn das Produkt mangelhaft, nicht bestellungsgemäß oder auf dem Transport beschädigt ist.",
        "Die Erstattung bemisst sich nach dem für die zurückgesandten Artikel tatsächlich gezahlten Preis und erfolgt innerhalb von 14 Tagen nach Annahme der Rücksendung über dasselbe Zahlungsmittel. Der Verkäufer kann einen begründeten Anteil für eine Wertminderung einbehalten, die nicht auf die Prüfung des Produkts zurückgeht.",
        "Diese Regelung lässt die im italienischen Zivilgesetzbuch vorgesehenen Gewährleistungsrechte für Mängel der Kaufsache unberührt."
      ],
    },
    {
      heading: "8. Gewährleistung und Produktkonformität",
      paragraphs: [
        "Der Verkäufer sichert unter seiner alleinigen Verantwortung zu, dass die veröffentlichten Produkte den anwendbaren Vorschriften entsprechen, einschließlich der Verordnung (EU) 2017/745 über Medizinprodukte, und dass er über die zum Vertrieb erforderlichen Berechtigungen verfügt.",
        "Oralzon prüft die bei der Registrierung angegebenen Stamm- und Steuerdaten, untersucht oder zertifiziert jedoch nicht die Konformität der einzelnen Produkte; diese verbleibt vollständig beim Verkäufer.",
        "Auf den Verkauf findet die gesetzliche Mängelgewährleistung nach Art. 1490 ff. des italienischen Zivilgesetzbuchs im Verhältnis zwischen Verkäufer und Käufer Anwendung."
      ],
    },
    {
      heading: "9. Bewertungen und Fragen",
      paragraphs: [
        "Eine Bewertung können nur Käufer abgeben, die das Produkt tatsächlich erworben haben: Die Prüfung erfolgt automatisch und ist nicht umgehbar.",
        "Bewertungen und Fragen sind öffentlich und nennen den Namen des Verfassers. Die Angabe direkter Kontaktdaten sowie ehrverletzende, rechtswidrige oder produktfremde Inhalte sind unzulässig.",
        "Wir entfernen negative Bewertungen nicht auf Verlangen des Verkäufers; dieser kann jedoch öffentlich antworten. Inhalte, die gegen diese Regeln verstoßen, entfernen wir und informieren den Verfasser."
      ],
    },
    {
      heading: "10. Anwendbares Recht und Gerichtsstand",
      paragraphs: [
        "Diese Bedingungen unterliegen italienischem Recht. Für alle Streitigkeiten ist ausschließlich das Gericht von Cassino (Italien) im Sinne von Art. 25 der Verordnung (EU) 1215/2012 zuständig, da es sich um Rechtsbeziehungen zwischen Unternehmern handelt.",
        "Bei Abweichungen zwischen den Sprachfassungen ist die italienische Fassung maßgeblich."
      ],
    },
    {
      heading: "11. Kontakt",
      paragraphs: [
        "Für alle Fragen zu diesen Bedingungen: **support@oralzon.com**"
      ],
    },
  ],
};

export const DE_LEGAL: { termini: LegalDocument; condizioni: LegalDocument } = {
  termini: TERMINI_SERVIZIO_DE,
  condizioni: CONDIZIONI_VENDITA_DE,
};
