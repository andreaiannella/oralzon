import type { AcademyGuideSection } from '../academyGuides';
import type { AcademyGuideTranslation } from './en';

export const DE_ACADEMY_TRANSLATIONS: Record<string, AcademyGuideTranslation> = {
  "come-iniziare-su-oralzon": {
    title: "Erste Schritte auf Oralzon",
    description: "Der wesentliche Weg der ersten Tage: was vor der eigentlichen Eröffnung für die Öffentlichkeit erledigt werden sollte, und in welcher Reihenfolge.",
    sections: [
      {
        heading: "Zuerst das Shop-Profil",
        paragraphs: [
          "Bevor Sie Produkte hochladen, lohnt es sich, das Profil in den Einstellungen zu vervollständigen: Shopname, Telefonnummer, Website (falls vorhanden), und die steuerlichen Angaben (USt-IdNr., PEC oder SDI-Code), die für die Rechnungsstellung benötigt werden. Es gibt kein Logo und keine Beschreibung zum Hochladen — auf Oralzon besteht die Identität eines Verkäufers aus dem Shopnamen plus dem eventuellen Verifiziert-Badge, nicht aus einem Bild."
        ],
      },
      {
        heading: "Stripe verbinden, bevor Produkte veröffentlicht werden",
        paragraphs: [
          "Das verbundene Stripe-Konto ist es, das die Zahlungen aus Verkäufen tatsächlich erhält — ohne dieses kann ein Produkt veröffentlicht und sogar gekauft werden, aber die Gelder bleiben auf Oralzon in der Schwebe, bis die Verbindung abgeschlossen ist. Die Seite Zahlungen zeigt immer den aktuellen Verbindungsstatus, und ein Banner oben im Bereich erinnert daran, solange sie nicht aktiv ist."
        ],
      },
      {
        heading: "Die ersten Produkte: Qualität vor Quantität",
        paragraphs: [
          "Besser 10-15 Produkte mit vollständigen Einträgen (mehrere Fotos, ausführliche Beschreibung, korrekte Kategorie) als 50 minimale Einträge. Unvollständige Einträge werden in der internen Suche schlechter platziert und konvertieren weniger — ein Kunde, der ein bestimmtes Werkzeug sucht und eine vage Beschreibung findet, geht fast immer zum nächsten Ergebnis über.",
          "Der Excel-Import (Bereich Import Excel) ist nützlich, wenn man von einem bereits in einer Tabelle vorhandenen Katalog ausgeht, aber es lohnt sich trotzdem, die ersten importierten Einträge vor der Veröffentlichung von Hand zu überprüfen: Insbesondere die Fotoqualität lässt sich nicht automatisieren."
        ],
      },
      {
        heading: "Was in den ersten 6 Monaten passiert",
        paragraphs: [
          "Die kostenlose Testphase dauert 180 Tage ab der Registrierung — in diesem Zeitraum wird keine Gebühr für den Verkäuferplan berechnet, die Provision auf Verkäufe ist jedoch bereits ab der ersten Bestellung aktiv. Es lohnt sich, diese Monate zu nutzen, um zu testen, was funktioniert (Kategorien, Preise, Sponsoring), bevor die Gebühr beginnt."
        ],
      },
    ],
  },
  "migliorare-le-vendite": {
    title: "Verkäufe verbessern: was die Zahlen wirklich bewegt",
    description: "Die Hebel mit echtem Einfluss auf den Umsatz, in praktischer Prioritätsreihenfolge — nicht alles ist den gleichen Aufwand wert.",
    sections: [
      {
        heading: "Fotos zählen mehr als die Beschreibung",
        paragraphs: [
          "In einem B2B-Marktplatz besteht die Versuchung, sehr lange technische Beschreibungen zu schreiben und die Fotos zu vernachlässigen, in der Annahme, dass Käufer bereits wissen, wonach sie suchen. In der Praxis ist es umgekehrt: Fotos sind der erste Filter, mit dem ein Käufer ein Produkt verwirft oder in Betracht zieht, die Beschreibung kommt erst danach ins Spiel. Scharfe Fotos vor neutralem Hintergrund, die das Produkt aus mehreren Blickwinkeln zeigen, machen einen messbaren Unterschied bei der Konversionsrate."
        ],
      },
      {
        heading: "Der Preis ist nicht der einzige Wettbewerbshebel",
        paragraphs: [
          "Auf einem Marktplatz mit mehreren Verkäufern in derselben Produktkategorie besteht die Versuchung, nur über den niedrigsten Preis zu konkurrieren — aber ehrlich angegebene Lieferzeiten, ein vollständiger Produkteintrag und im Laufe der Zeit gesammelte positive Bewertungen wiegen für einen professionellen Käufer, der die Zuverlässigkeit des Anbieters bewertet und nicht nur die Bestellkosten, genauso viel oder mehr als der Preis."
        ],
      },
      {
        heading: "Auf Bewertungen antworten, auch auf negative",
        paragraphs: [
          "Im Bereich Bewertungen können Sie auf jede Bewertung öffentlich antworten — Ihre Antwort bleibt unter der des Kunden sichtbar. Eine negative Bewertung ohne Antwort wiegt schwerer als die Bewertung selbst: Sie signalisiert, dass das Problem nicht angegangen wurde. Eine öffentliche Antwort, auch eine kurze, die das Problem anerkennt und erklärt, was unternommen wurde, gewinnt den Großteil des verlorenen Vertrauens zurück."
        ],
      },
      {
        heading: "Sponsoring funktioniert am besten bei bereits bewährten Produkten",
        paragraphs: [
          "Ein Produkt zu sponsern, das noch nichts verkauft hat, um zu testen, ob es funktioniert, ist fast immer weniger effizient, als ein Produkt zu sponsern, das bereits organisch gut verkauft wird — Sponsoring verstärkt die Sichtbarkeit, es gleicht keinen schwachen Eintrag oder marktfremden Preis aus. Es lohnt sich, vor der Wahl, was gesponsert werden soll, die Statistiken anzusehen, nicht danach."
        ],
      },
    ],
  },
  "fatturazione-e-dati-fiscali": {
    title: "Rechnungsstellung: was Oralzon übernimmt und was beim Verkäufer bleibt",
    description: "Wie die zeilenweise Umsatzsteuerberechnung wirklich funktioniert, was Sie im Verkaufsbericht finden, und was Sie selbst noch erledigen müssen.",
    sections: [
      {
        heading: "Oralzon stellt keine Rechnungen in Ihrem Namen aus",
        paragraphs: [
          "Ein wichtiger Punkt, der von Anfang an klar sein sollte: Oralzon ist nicht für die Ausstellung der tatsächlichen steuerlichen Rechnungen verantwortlich. Jeder Verkäufer bleibt ein eigenständiges Steuersubjekt und muss für jede Bestellung seine eigenen elektronischen Rechnungen ausstellen (oder über seinen Steuerberater ausstellen lassen). Was Oralzon im Bereich Verkaufsbericht → Daten für die Rechnungsstellung bereitstellt, ist die bereits fertige Berechnung — Bemessungsgrundlage, Satz, Umsatzsteuer, eventueller Befreiungsgrund —, damit Sie sie nicht von Hand neu berechnen müssen."
        ],
      },
      {
        heading: "Wie die Umsatzsteuer bei jeder Bestellung berechnet wird",
        paragraphs: [
          "Die Berechnung folgt der EU-Standardregel für B2B-Warenlieferungen: Inlandsverkauf (gleiches Land von Verkäufer und Kunde) wendet den vollen Umsatzsteuersatz des Verkäuferlandes an; innergemeinschaftlicher Verkauf mit beiden auf VIES verifizierten Parteien wendet das Reverse-Charge-Verfahren an (Umsatzsteuer null, der Kunde führt die Steuer selbst ab); innergemeinschaftlicher Verkauf ohne VIES-Verifizierung wendet vorsichtshalber trotzdem die volle Umsatzsteuer an; Verkauf außerhalb der EU ist als Export steuerfrei.",
          "Diese Berechnung erfolgt automatisch für jede Bestellzeile, zum Zeitpunkt des Kaufs — es muss nichts konfiguriert werden, damit sie funktioniert."
        ],
      },
      {
        heading: "Daten für den Steuerberater exportieren",
        paragraphs: [
          "Die Schaltfläche CSV exportieren im Bereich Daten für die Rechnungsstellung erzeugt eine Datei mit einer Zeile für jedes Produkt jeder Bestellung — genau die Detailtiefe, die für die Erstellung einer Rechnung wirklich benötigt wird, kein monatlicher Sammelwert. Es ist die praktischste Datei, um sie Ihrem Steuerberater zu übergeben oder als Grundlage für die Ausstellung elektronischer Rechnungen zu verwenden."
        ],
      },
    ],
  },
  "marketing-su-oralzon": {
    title: "Marketing auf Oralzon",
    description: "Wie Kunden Sie finden, warum sie Sie anfangs nicht finden und was Sie dagegen tun können.",
    sections: [
      {
        heading: "Das Problem am Anfang: Vorhandensein reicht nicht, um gefunden zu werden",
        paragraphs: [
          "Ein hochgeladener Katalog ist kein sichtbarer Katalog. Auf jedem Marktplatz erscheinen jene Produkte weit oben, die bereits verkauft wurden, bereits Bewertungen erhalten und bereits eine Historie aufgebaut haben. Für Käufer ist das sinnvoll — es zeigt, was für andere funktioniert hat — doch für Neueinsteiger entsteht ein Teufelskreis: Sie verkaufen nicht, weil man Sie nicht sieht, und man sieht Sie nicht, weil Sie noch nicht verkauft haben.",
          "Deshalb kann ein seriöser Lieferant mit hervorragenden Produkten und fairen Preisen monatelang ohne Bestellung bleiben, während weniger wettbewerbsfähige Konkurrenten täglich verkaufen. Es ist keine Frage der Qualität, sondern der Position. Wer nach \\\"Gracey-Küretten\\\" sucht, schaut sich die ersten Ergebnisse an und erreicht selten die dritte Bildschirmseite.",
          "Genau dafür gibt es Sponsoring: Sie kaufen die Position, die Sie sich noch nicht verdient haben, für die Zeit, die Sie brauchen, um sie sich wirklich zu verdienen. Ein Startbeschleuniger, keine Dauerabgabe."
        ],
      },
      {
        heading: "Was sich konkret ändert, wenn ein Produkt gesponsert ist",
        paragraphs: [
          "Ein gesponsertes Produkt wird nicht \\\"etwas weiter oben\\\" angezeigt: Es gelangt in Bereiche, in denen normale Produkte überhaupt nicht erscheinen. Die Hero-Sponsoring-Karte etwa ist eine einzelne Karte mit Ihrem Produkt allein, ohne Konkurrenz daneben, und erscheint auf der Startseite, im Katalog und auf Produktseiten — dort, wo ein Kunde bereits ähnliche Artikel betrachtet.",
          "Der Unterschied zu guter organischer Platzierung: Sponsoring wirkt sofort und planbar. Sie wissen, wo Sie erscheinen und wie lange. Die organische Platzierung kommt danach, als Folge der Verkäufe, die das Sponsoring ermöglicht hat.",
          "Und genau das übersehen viele Verkäufer: Die Verkäufe, die während des Sponsorings entstehen, verschwinden nicht, wenn es endet. Sie bleiben als Bestellhistorie und als Bewertungen — genau die Zutaten, die Sie auch danach in den Ergebnissen nach oben bringen. Ein Monat bezahlter Sichtbarkeit kann Sie in eine Position bringen, für die Sie allein sehr viel länger gebraucht hätten."
        ],
      },
      {
        heading: "Wann es sich wirklich lohnt und wann nicht",
        paragraphs: [
          "Sponsoring lohnt sich, wenn das Produkt bereits verkaufsbereit ist: vollständige Beschreibung, scharfe Fotos, marktgerechter Preis, echter Lagerbestand. Traffic auf eine leere Produktseite oder einen ausverkauften Artikel zu lenken ist der schnellste Weg, Budget zu verschwenden — der Kunde kommt, findet nicht, was er sucht, und kehrt nicht zurück.",
          "Besonders sinnvoll ist es in drei Momenten: wenn Sie Ihren Shop eröffnen und Sie noch niemand kennt; wenn Sie ein neues Produkt ohne Historie einführen; wenn Sie eine Kategorie verteidigen wollen, in der ein Wettbewerber Boden gutmacht.",
          "Weniger sinnvoll ist es bei Produkten, die sich ohnehin gut verkaufen — dort zahlen Sie für Sichtbarkeit, die Sie sowieso gehabt hätten — und bei Artikeln mit zu geringer Marge, wo die Sponsoringkosten den Gewinn aufzehren. Rechnen Sie vor dem Kauf einfach nach: Wie viele zusätzliche Einheiten müssen Sie verkaufen, um das Paket zu amortisieren? Erscheint die Zahl vernünftig, legen Sie los; erscheint sie hoch, wählen Sie ein Produkt mit besserer Marge.",
          "Sponsoring garantiert keine Verkäufe: Es kauft Sichtbarkeit, eine notwendige, aber nicht hinreichende Bedingung. Was nach dem Klick geschieht, hängt von Ihrer Produktbeschreibung, Ihrem Preis und Ihrer Zuverlässigkeit ab."
        ],
      },
      {
        heading: "Messen Sie die Ergebnisse, verlassen Sie sich nicht auf den Eindruck",
        paragraphs: [
          "Notieren Sie vor dem Start eines Sponsorings Ihren Ausgangspunkt: wie viele Bestellungen und welchen Umsatz dieses Produkt im letzten Monat erzielt hat. Sie finden beides im Bereich Statistiken im Dashboard. Vergleichen Sie bei Ablauf des Pakets dieselben Zahlen — nur so wissen Sie, ob es wirklich gewirkt hat, statt nach Gefühl zu urteilen.",
          "Hat sich ein Paket gelohnt, verlängern Sie es. Hat es sich nicht gelohnt, wechseln Sie zunächst Produkt oder Sichtbarkeitsart, bevor Sie schließen, dass Sponsoring nicht funktioniert: Oft liegt das Problem nicht am Werkzeug, sondern an der Kombination aus Werkzeug und gewähltem Produkt."
        ],
      },
      {
        heading: "Shopname und Verifizierungsabzeichen sind Ihre Identität",
        paragraphs: [
          "Auf Oralzon gibt es weder ein Logo noch eine Shopbeschreibung zum Anpassen: Was ein Kunde auf Ihrer Shopseite und neben Ihren Produkten sieht, ist der Firmenname und gegebenenfalls das Abzeichen für verifizierte Verkäufer. Das ist eine bewusste Entscheidung der Plattform — Logo und Freitextbeschreibung sind die Stellen, an denen am häufigsten versucht wird, direkte Kontaktdaten einzuschleusen, um Kunden vom Marktplatz wegzuführen. Sie zu entfernen schützt alle Verkäufer gleichermaßen und verhindert, dass regelkonforme Anbieter gegen regelwidrige antreten müssen.",
          "Deshalb lohnt es sich, schon bei der Registrierung einen klaren, einprägsamen Shopnamen zu wählen: Er ist das einzige Identitätselement, das Sie überall auf der Plattform vertritt — auch in gesponserten Bereichen, wo der Wettbewerb am direktesten ist.",
          "Das Abzeichen für verifizierte Verkäufer lässt sich nicht kaufen: Sie erhalten es, indem Sie die Identitätsprüfung bei Stripe abschließen, dieselbe, die für den Zahlungsempfang nötig ist. Es ist Ihr stärkstes Vertrauenssignal, und in gesponserten Bereichen macht es den Unterschied: Bei gleichem Produkt und Preis wird fast immer der verifizierte Verkäufer gewählt."
        ],
      },
      {
        heading: "Bewertungen sind Marketing, nicht nur Feedback",
        paragraphs: [
          "Die Bewertungen, die Kunden zu Ihren Produkten hinterlassen, sind für jeden sichtbar, der Ihre Shopseite oder Ihre Produktseiten besucht — es ist in jeder Hinsicht Material Ihrer eigenen Kunden, oft überzeugender als jede Beschreibung, die Sie selbst schreiben könnten. Nach einer gut verlaufenen Lieferung lohnt es sich, den Kunden höflich um eine Bewertung zu bitten, statt darauf zu warten, dass es von selbst geschieht.",
          "Bewertungen zählen doppelt, wenn Sie sponsern: Sichtbarkeit bringt den Kunden auf die Produktseite, aber der soziale Beweis bringt ihn dazu, \\\"in den Warenkorb\\\" zu klicken. Ein Produkt ohne Bewertungen zu sponsern funktioniert; eines mit positiven Bewertungen zu sponsern funktioniert bei gleichem Einsatz deutlich besser."
        ],
      },
      {
        heading: "Die Shopseite bündelt Ihren gesamten Katalog",
        paragraphs: [
          "Viele Besucher gelangen über die Suche zu einem Produkt und klicken dann auf den Verkäufernamen, um den Rest des Katalogs zu sehen — auf der Shopseite entscheidet sich oft, ob ein Kunde zum Stammkunden wird oder es bei einem Einzelkauf bleibt. Ein nach Kategorien geordneter Katalog mit vollständigen Produktseiten hilft, diesen Besucher zu halten.",
          "Auch deshalb lohnt es sich, das richtige Produkt zu sponsern und nicht zwangsläufig das günstigste: Sponsoring bringt Traffic auf eine Seite, von dort erkundet der Kunde alles Weitere. Ein Produkt, das repräsentativ für Ihr Sortiment ist, bringt nützlichere Besuche als ein Lockangebot ohne Bezug zu Ihrem Katalog."
        ],
      },
    ],
  },
  "sconti-e-codici-sconto": {
    title: "Rabatte und Rabattcodes",
    description: "Wie man einen wirksamen Rabattcode erstellt, und ein wichtiger Punkt, den man kennen sollte, wenn man in einem mit anderen Verkäufern geteilten Warenkorb verkauft.",
    sections: [
      {
        heading: "Wie man einen Rabattcode erstellt",
        paragraphs: [
          "Im Bereich Rabatte können Sie einen individuellen Code erstellen, prozentual oder als fester Betrag, mit optionaler Nutzungsbegrenzung und Ablaufdatum, und ihn — falls gewünscht — auf bestimmte Produkte statt auf den gesamten Katalog beschränken. Den Code teilen Sie den Kunden selbst mit (E-Mail, soziale Medien, Visitenkarte) — Oralzon bewirbt ihn nirgendwo automatisch."
        ],
      },
      {
        heading: "Wichtig: Ihr Code gilt nur für Ihre eigenen Produkte",
        paragraphs: [
          "Oralzon ist ein Multi-Vendor-Marktplatz: Ein Kunde kann in seinem Warenkorb Ihre Produkte zusammen mit Produkten anderer Verkäufer in derselben Bestellung haben. Ein grundlegender Punkt, den man im Kopf behalten sollte: Ein von Ihnen erstellter Rabattcode gilt ausschließlich für die Positionen Ihres Shops in diesem Warenkorb, niemals für Produkte eines anderen Verkäufers. Kein Verkäufer kann, auch nicht versehentlich, über seinen eigenen Rabattcode unbeabsichtigt die Marge eines anderen schmälern."
        ],
      },
      {
        heading: "Eine vernünftige Mindestschwelle",
        paragraphs: [
          "Einen Mindestbestellwert für die Nutzung des Codes festzulegen (z. B. „gültig ab 50 €“) ist oft wirksamer als ein kleiner Rabatt ohne Schwelle: Es ermutigt den Kunden, dem Warenkorb noch etwas hinzuzufügen, um die Schwelle zu erreichen, statt sich auf den ursprünglich geplanten Mindesteinkauf zu beschränken."
        ],
      },
    ],
  },
  "come-usare-le-sponsorizzazioni": {
    title: "Wie man Sponsoring nutzt",
    description: "Die in Promotionen verfügbaren Optionen, und wie man je nach Ziel die richtige auswählt.",
    sections: [
      {
        heading: "Vier Arten von Sichtbarkeit, vier unterschiedliche Ziele",
        paragraphs: [
          "Hervorgehobene Produkte platziert bis zu 5 Ihrer Produkte auf der Startseite und in den Suchergebnissen — die richtige Wahl, wenn Sie bestimmten Produkten einen Schub geben möchten, etwa Neuheiten oder Artikeln mit besserer Marge. Startseiten-Sponsoring gibt Ihnen eine rotierende oder feste Position im gesponserten Bereich der Startseite — besser geeignet, um die Bekanntheit Ihres Shops insgesamt aufzubauen, nicht eines einzelnen Produkts. Kategorie-Sponsoring gibt Ihnen bevorzugte Sichtbarkeit in einer oder mehreren gewählten Kategorien — nützlich, wenn Sie von denjenigen bemerkt werden möchten, die bereits genau nach der Art von Produkt suchen, die Sie verkaufen. Hero-Sponsoring platziert Sie allein, ohne andere Produkte drumherum, in einer hervorgehobenen Karte, die zur Kategorie passt, die der Kunde gerade ansieht — es erscheint an mehreren Stellen zwischen Startseite, Katalog und Produktseite."
        ],
      },
      {
        heading: "Hero-Sponsoring: nie mehr als eines von Ihnen gleichzeitig",
        paragraphs: [
          "Sie können dieses Paket für so viele Produkte kaufen, wie Sie möchten — es gibt keine Grenze, wie viele Sie gesponsert haben können. Die Begrenzung betrifft das, was der einzelne Kunde in einem bestimmten Moment sieht: Auf derselben Seite erscheint nie mehr als eines Ihrer Produkte gleichzeitig, auch wenn Sie mehrere gesponsert haben — das System wechselt ab, welches Ihrer Produkte angezeigt wird, sowohl im Zeitverlauf als auch zwischen den verschiedenen Stellen der Startseite, an denen dieses Format erscheint. So bleibt der Platz fair unter allen Sponsoren aufgeteilt, statt von demjenigen monopolisiert zu werden, der am meisten kauft."
        ],
      },
      {
        heading: "Vor der Wahl, was gesponsert werden soll, die Statistiken ansehen",
        paragraphs: [
          "Der Bereich Statistiken zeigt, welche Produkte bereits Aufrufe und organische Verkäufe generieren — das sind in der Regel die besten Kandidaten für Sponsoring, weil Sponsoring ein bereits vorhandenes Interesse verstärkt, statt es von Grund auf schaffen zu müssen. Ein Produkt zu sponsern, das sich überhaupt nicht verkauft, kehrt den Trend nur selten von allein um."
        ],
      },
      {
        heading: "Der Rabattcode im Sponsoring-Checkout",
        paragraphs: [
          "Wenn Sie einen gültigen Rabattcode für Sichtbarkeitspakete haben, geben Sie ihn im Bestätigungsschritt ein, der sich beim Klick auf „Kaufen“ bei einem bestimmten Paket öffnet — nicht vorher. Der Endpreis mit angewendetem Rabatt ist der, den Sie unmittelbar vor der Zahlung sehen, nie eine Überraschung danach."
        ],
      },
    ],
  },
};