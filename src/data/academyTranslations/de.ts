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
          "Bevor Sie Produkte hochladen, lohnt es sich, das Shop-Profil in den Einstellungen zu vervollständigen: Name, Beschreibung, Logo und Versandinformationen. Ein unvollständiges Shop-Profil ist oft der Hauptgrund, warum ein potenzieller Kunde zögert, bei einem neuen Verkäufer zu kaufen — er findet das richtige Produkt, aber nicht genug Informationen über den Shop, um Vertrauen zu fassen."
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
          "Eine negative Bewertung ohne öffentliche Antwort des Verkäufers wiegt schwerer als die Bewertung selbst: Sie signalisiert, dass das Problem nicht angegangen wurde. Eine öffentliche Antwort, auch eine kurze, die das Problem anerkennt und erklärt, was unternommen wurde, gewinnt den Großteil des verlorenen Vertrauens zurück — oft mehr, als es dieselbe Bewertung getan hätte, wäre sie von Anfang an positiv gewesen."
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
    description: "Die Werkzeuge, die Ihnen zur Verfügung stehen, um sich auf der Plattform bekannt zu machen, über die reine Präsenz im Katalog hinaus.",
    sections: [
      {
        heading: "Ihr persönlicher Empfehlungscode",
        paragraphs: [
          "Jeder Verkäufer hat seinen eigenen Empfehlungscode, sichtbar im Bereich, den man mit anderen Praxen oder Händlern teilen kann, die daran interessiert sind, Verkäufer auf Oralzon zu werden. Wer sich mit Ihrem Code registriert, erhält eine verlängerte Testphase, und Sie erhalten als Dankeschön zusätzliche kostenlose Testtage — eine einfache Möglichkeit, die Plattform in Ihrer eigenen Branche wachsen zu lassen und gleichzeitig persönlich davon zu profitieren."
        ],
      },
      {
        heading: "Bewertungen sind Marketing, nicht nur Feedback",
        paragraphs: [
          "Die Bewertungen, die Kunden zu Ihren Produkten hinterlassen, sind für jeden sichtbar, der Ihre Shop-Seite oder die Produkteinträge besucht — sie sind faktisch von Ihren eigenen Kunden erzeugtes Marketingmaterial, oft überzeugender als jede Beschreibung, die Sie selbst schreiben könnten. Es lohnt sich, nach einer gut verlaufenen Lieferung den Kunden freundlich zu bitten, eine Bewertung zu hinterlassen, anstatt darauf zu warten, dass es von selbst geschieht."
        ],
      },
      {
        heading: "Ihre Shop-Seite ist Ihre Visitenkarte",
        paragraphs: [
          "Viele Besucher gelangen über die Suche zu einem Produkt, klicken dann aber auf den Namen des Verkäufers, um den Rest des Katalogs zu sehen — die Shop-Seite ist oft der Punkt, an dem entschieden wird, ob ein Kunde zum Stammkunden wird oder bei einem Einzelkauf bleibt. Eine sorgfältig verfasste Shop-Beschreibung und ein nach Kategorien geordneter Katalog helfen, diesen Besucher zu halten."
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
        heading: "Drei Arten von Sichtbarkeit, drei unterschiedliche Ziele",
        paragraphs: [
          "Hervorgehobene Produkte platziert bis zu 5 Ihrer Produkte auf der Startseite und in den Suchergebnissen — die richtige Wahl, wenn Sie bestimmten Produkten einen Schub geben möchten, etwa Neuheiten oder Artikeln mit besserer Marge. Startseiten-Sponsoring gibt Ihnen eine feste oder rotierende Position im gesponserten Bereich der Startseite — besser geeignet, um die Bekanntheit Ihres Shops insgesamt aufzubauen, nicht eines einzelnen Produkts. Kategorie-Sponsoring gibt Ihnen bevorzugte Sichtbarkeit in einer oder mehreren gewählten Kategorien — nützlich, wenn Sie von denjenigen bemerkt werden möchten, die bereits genau nach der Art von Produkt suchen, die Sie verkaufen."
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