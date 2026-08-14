import type { LegalDocument } from '../legalContent';

/**
 * Version française des textes juridiques.
 *
 * Deux choix de traduction délibérés :
 *
 * 1. Les espaces réservés [DENOMINAZIONE SOCIALE DA COMPLETARE],
 *    [INDIRIZZO SEDE LEGALE] et [PARTITA IVA] restent sous leur forme
 *    italienne — identiques dans toutes les versions linguistiques. Un seul
 *    rechercher-remplacer suffira ainsi pour les compléter dans les huit
 *    fichiers, au lieu de huit modifications distinctes avec le risque d'en
 *    oublier une.
 *
 * 2. Les renvois au droit italien (Code de la consommation, Code civil,
 *    tribunal de Cassino) ne sont PAS remplacés par leurs équivalents
 *    français : ils sont explicitement désignés comme relevant du droit
 *    italien. Le contrat est régi par la loi italienne (point 11) ;
 *    transposer ces renvois en droit français serait matériellement faux et
 *    créerait des attentes erronées.
 */

const TERMINI_SERVIZIO_FR: LegalDocument = {
  title: "Conditions de Service",
  lastUpdated: "Août 2026",
  sections: [
    {
      heading: "1. Qui nous sommes et ce que régissent ces conditions",
      paragraphs: [
        "Oralzon est un service d'intermédiation en ligne qui met en relation des fournisseurs de produits dentaires (**vendeurs**) avec des professionnels du secteur (**acheteurs**). Oralzon ne vend pas ses propres produits aux acheteurs par l'intermédiaire de ce service : chaque contrat de vente se conclut directement entre le vendeur et l'acheteur.",
        "L'exploitant de la plateforme est **[DENOMINAZIONE SOCIALE DA COMPLETARE]**, dont le siège est situé **[INDIRIZZO SEDE LEGALE]**, numéro de TVA **[PARTITA IVA]**, joignable à l'adresse support@oralzon.com.",
        "En utilisant la plateforme, vous acceptez ces Conditions. Si vous ne les acceptez pas, vous ne pouvez pas l'utiliser. Les Conditions de Vente, la Politique de confidentialité et la Politique en matière de cookies en font partie intégrante."
      ],
    },
    {
      heading: "2. Qui peut utiliser Oralzon",
      paragraphs: [
        "Oralzon est réservée aux personnes agissant dans le cadre de leur activité professionnelle ou entrepreneuriale et titulaires d'un numéro de TVA valide. Elle ne s'adresse pas aux consommateurs : par conséquent, **les protections du Code de la consommation italien ne s'appliquent pas** (D.Lgs. 206/2005), celles-ci ne concernant que les personnes physiques agissant à des fins étrangères à leur activité.",
        "Les vendeurs doivent être établis dans l'un des 27 États membres de l'Union européenne. Cette exigence découle des règles de TVA relatives au fournisseur présumé (art. 14 bis de la directive 2006/112/CE) et n'est pas dérogeable.",
        "Vous êtes responsable de l'exactitude des données fournies, de la conservation de vos identifiants et de tout ce qui se produit via votre compte."
      ],
    },
    {
      heading: "3. Modifications de ces conditions",
      paragraphs: [
        "Nous pouvons modifier ces Conditions. Les modifications sont communiquées aux vendeurs par e-mail et publiées sur la plateforme **au moins 15 jours avant** leur prise d'effet, conformément à l'art. 3 du règlement (UE) 2019/1150. Si la modification exige des adaptations techniques ou commerciales importantes, le préavis est proportionnellement plus long.",
        "Pendant le délai de préavis, le vendeur peut résilier sans frais. La publication de nouveaux produits ou l'absence de résiliation dans le délai valent acceptation.",
        "Le préavis ne s'applique pas lorsque la modification est imposée par une obligation légale ou vise à faire face à un danger imminent pour la sécurité de la plateforme ou de ses utilisateurs."
      ],
    },
    {
      heading: "4. Comment les produits sont classés (référencement)",
      paragraphs: [
        "En application de l'art. 5 du règlement (UE) 2019/1150, nous indiquons les principaux paramètres qui déterminent la position des produits dans les résultats de recherche et dans les rubriques de la plateforme, ainsi que leur importance relative."
      ],
      bullets: [
        "**Correspondance avec la recherche** — c'est le paramètre prépondérant : la recherche textuelle compare le terme saisi avec le nom, la marque et la référence du produit",
        "**Filtres et tri choisis par l'acheteur** — lorsque l'acheteur trie par prix ou par date, ce choix prime sur tout autre paramètre, y compris les positions payantes",
        "**Disponibilité et statut du produit** — les produits non publiés ou provenant de vendeurs suspendus n'apparaissent pas",
        "**Positionnement payant** — les vendeurs peuvent acheter des offres de visibilité (produits mis en avant, espaces en page d'accueil, espaces par catégorie, encarts contextuels). Ces contenus sont **toujours signalés comme « Sponsorisé »** et leur position dépend exclusivement de l'achat de l'offre, non d'un jugement de qualité sur le produit. Lorsqu'un espace payant est disponible mais qu'aucun vendeur ne l'a acheté, nous affichons un produit non sponsorisé portant la mention neutre « En vedette », sans lui attribuer une sponsorisation inexistante",
        "**Historique d'achat et de navigation de l'acheteur** — utilisé pour suggérer des produits pertinents, à partir de données collectées uniquement sur cette plateforme. Il n'influe ni sur les prix ni sur les conditions et ne prime jamais sur les choix explicites de l'acheteur ni sur les espaces payants",
        "**Ventes réalisées et avis reçus** — dans les rubriques consacrées aux produits les plus vendus"
      ],
    },
    {
      heading: "5. Obligations des vendeurs",
      bullets: [
        "Être des personnes morales régulièrement constituées, titulaires d'un numéro de TVA valide dans un État membre de l'Union européenne",
        "Publier des informations produit complètes, exactes et non trompeuses, y compris les mentions obligatoires prévues par la loi",
        "Garantir que les produits classés comme dispositifs médicaux respectent le règlement (UE) 2017/745 (MDR) et toute autre réglementation applicable",
        "Tenir à jour les disponibilités en stock et honorer les commandes reçues dans les délais annoncés",
        "Assurer l'expédition de leurs produits et saisir les données de suivi",
        "Utiliser les données des acheteurs exclusivement pour exécuter la commande, dans le respect du RGPD",
        "**Ne pas emmener les acheteurs hors de la plateforme** : il est interdit d'insérer des coordonnées directes (e-mail, téléphone, messagerie, sites tiers) dans les fiches produit, les réponses aux questions, les avis, les images ou les documents joints aux expéditions, dans le but de conclure hors d'Oralzon des ventes nées sur la plateforme",
        "Accomplir soi-même toutes les obligations fiscales, y compris les états récapitulatifs des livraisons intracommunautaires (Intrastat) lorsqu'ils sont dus : Oralzon ne les dépose pas pour le compte du vendeur"
      ],
    },
    {
      heading: "6. Limitation, suspension et cessation du service",
      paragraphs: [
        "En application de l'art. 4 du règlement (UE) 2019/1150, lorsque nous limitons ou suspendons les services d'un vendeur, nous lui communiquons **les motifs précis** de la décision, sur un support durable, au plus tard au moment où la mesure prend effet.",
        "Si nous décidons de cesser entièrement la fourniture des services, le préavis est d'**au moins 30 jours**, sauf obligation légale, violation grave et répétée de ces Conditions, ou risque concret pour la sécurité des utilisateurs ou l'intégrité du service.",
        "Le vendeur peut contester la décision via la procédure de réclamation du point 7. Si la contestation aboutit, la mesure est levée sans retard indu.",
        "L'expiration de la période d'essai ou de l'abonnement vendeur, lorsqu'il n'est pas renouvelé, n'est pas une sanction : elle est régie par les Conditions de Vente et précédée d'avertissements.",
        "**Les commandes déjà reçues avant une suspension restent valables** et doivent être honorées. Les montants correspondants sont versés selon les conditions ordinaires."
      ],
    },
    {
      heading: "7. Réclamations et règlement des litiges",
      paragraphs: [
        "Tout vendeur peut déposer une réclamation en écrivant à **support@oralzon.com**, en indiquant l'objet de la contestation. Nous traitons les réclamations dans des délais raisonnables et proportionnés à leur complexité, et communiquons l'issue de manière individuelle et en langage clair.",
        "L'exploitant de la plateforme est actuellement une petite entreprise au sens de l'art. 11, paragraphe 5, du règlement (UE) 2019/1150 et n'est donc pas tenu de mettre en place un système interne formalisé de traitement des réclamations. Nous maintenons néanmoins la procédure décrite ci-dessus.",
        "À défaut d'accord, les parties peuvent saisir, par voie extrajudiciaire, un organisme de médiation inscrit au registre tenu par le ministère de la Justice italien et compétent en matière commerciale. Le recours à la médiation ne préjudicie pas au droit de saisir l'autorité judiciaire.",
        "Les droits reconnus aux organisations représentatives des vendeurs par l'art. 14 du même règlement demeurent réservés."
      ],
    },
    {
      heading: "8. Accès aux données",
      paragraphs: [
        "Le vendeur a accès, depuis son espace personnel, aux données générées par son activité : commandes reçues, produits vendus, chiffre d'affaires, avis, questions des clients, virements et récapitulatifs fiscaux.",
        "Nous ne communiquons pas aux vendeurs l'e-mail ni le numéro de téléphone des acheteurs. Ils reçoivent en revanche le nom, l'adresse de livraison et les données de facturation, nécessaires pour livrer et facturer. Ce choix protège les acheteurs des sollicitations non désirées et maintient les échanges traçables en cas de contestation.",
        "Nous ne cédons pas à des tiers les données agrégées générées sur la plateforme pour leurs propres finalités commerciales."
      ],
    },
    {
      heading: "9. Propriété intellectuelle et contenus",
      paragraphs: [
        "Le vendeur conserve tous ses droits sur les contenus qu'il publie et garantit en être titulaire. Il concède à Oralzon une licence non exclusive et gratuite pour les publier, les traduire automatiquement dans les langues de la plateforme et les utiliser pour promouvoir le catalogue, pour la seule durée de la relation contractuelle.",
        "Les marques, interfaces, textes éditoriaux et logiciels de la plateforme appartiennent à l'exploitant et ne peuvent être reproduits sans autorisation.",
        "Nous retirons les contenus illicites, trompeurs ou contraires à ces Conditions, en informant leur auteur des motifs."
      ],
    },
    {
      heading: "10. Responsabilité",
      paragraphs: [
        "Oralzon répond du fonctionnement de la plateforme technologique et de l'exactitude des informations qu'elle fournit elle-même. Elle n'est pas partie au contrat de vente et ne répond ni de la qualité, de la conformité ou de la sécurité des produits, ni du comportement des vendeurs, ni des délais de livraison, qui relèvent exclusivement du vendeur.",
        "Sauf dol ou faute lourde, et sauf dommages corporels, la responsabilité globale d'Oralzon envers un vendeur est limitée aux sommes versées par celui-ci à la plateforme au cours des douze mois précédant l'événement. Envers un acheteur, elle est limitée au montant de la commande à laquelle se rapporte la contestation.",
        "Aucune clause de ces Conditions n'exclut ni ne limite une responsabilité que la loi applicable ne permet pas d'exclure ou de limiter."
      ],
    },
    {
      heading: "11. Loi applicable et juridiction compétente",
      paragraphs: [
        "Ces Conditions sont régies par la loi italienne.",
        "Le tribunal de Cassino (Italie) est seul compétent pour tout litige. S'agissant de relations entre professionnels, les parties reconnaissent que cette attribution de compétence est convenue par écrit au sens de l'art. 25 du règlement (UE) 1215/2012.",
        "La version italienne de ces Conditions fait foi en cas de divergence avec les traductions."
      ],
    },
  ],
};

const CONDIZIONI_VENDITA_FR: LegalDocument = {
  title: "Conditions de Vente",
  lastUpdated: "Août 2026",
  sections: [
    {
      heading: "1. Champ d'application",
      paragraphs: [
        "Ces Conditions régissent les achats effectués via Oralzon par des professionnels du secteur dentaire. Les produits sont vendus par les fournisseurs inscrits (vendeurs) : le contrat se conclut entre le vendeur et l'acheteur, tandis qu'Oralzon intervient comme intermédiaire technologique et mandataire à l'encaissement.",
        "L'acheteur agissant toujours dans le cadre de son activité, **les protections du Code de la consommation italien ne trouvent pas à s'appliquer** (D.Lgs. 206/2005), celles-ci étant réservées aux consommateurs."
      ],
    },
    {
      heading: "2. Commandes et confirmation",
      paragraphs: [
        "La commande est parfaite lorsque le paiement est confirmé. L'acheteur reçoit immédiatement un e-mail comportant le numéro de commande et le récapitulatif, qui vaut acceptation de l'offre du vendeur.",
        "Les paiements engagés et non finalisés ne donnent lieu à aucune commande et sont annulés automatiquement au bout de 24 heures.",
        "La disponibilité des produits est vérifiée au moment de la commande. Si, en raison d'achats concomitants, un article s'avérait indisponible après confirmation, le vendeur en informe l'acheteur et la part non livrable est remboursée."
      ],
    },
    {
      heading: "3. Prix, TVA et paiement",
      bullets: [
        "Les prix sont exprimés en euros. Pour les ventes nationales, ils comprennent la TVA au taux en vigueur dans le pays du vendeur",
        "Pour les ventes entre un vendeur et un acheteur établis dans deux États membres différents de l'Union européenne, tous deux titulaires d'un numéro de TVA validé dans le système VIES, l'autoliquidation s'applique : la contrepartie ne comprend pas la TVA et l'acheteur acquitte la taxe dans son propre pays, comme indiqué sur la facture",
        "Si la vérification VIES n'aboutit pas pour l'une des deux parties, la TVA du pays du vendeur s'applique",
        "Le paiement s'effectue par carte de crédit ou de débit et est traité par Stripe. Oralzon ne traite ni ne conserve les données de carte",
        "Le montant est dû intégralement au moment de la commande",
        "La facture est émise par le vendeur, seul redevable : Oralzon fournit les données nécessaires mais n'émet pas de facture pour son compte"
      ],
    },
    {
      heading: "4. Commission et abonnement vendeur",
      paragraphs: [
        "Sur chaque vente conclue, Oralzon retient une commission de **7 % de la valeur de la marchandise** (montant hors taxes), déduite de la somme versée au vendeur. La commission couvre les frais de traitement des paiements et les services de la plateforme.",
        "**La commission ne s'applique pas aux frais de port**, qui ne constituent pas un produit de la plateforme.",
        "L'accès à la plateforme requiert en outre un abonnement vendeur annuel, aux conditions indiquées sur la page dédiée au moment de la souscription. À l'issue de la période d'essai gratuite, l'absence de souscription entraîne la suspension des ventes, précédée d'avertissements par e-mail avant l'échéance et dans les jours qui suivent. Catalogue, commandes et statistiques restent archivés et redeviennent disponibles à l'activation de l'abonnement.",
        "Toute modification du taux de commission est communiquée par e-mail avec un préavis minimum de 30 jours et ne s'applique pas aux commandes déjà reçues."
      ],
    },
    {
      heading: "5. Expéditions",
      paragraphs: [
        "Chaque vendeur expédie lui-même ses produits. Dans les commandes impliquant plusieurs fournisseurs, les produits voyagent séparément, avec des frais et un suivi distincts pour chaque vendeur.",
        "Les frais de port sont fixés par le vendeur par zone de destination et affichés à l'acheteur avant le paiement, distinctement par fournisseur. Le vendeur peut fixer un seuil de commande au-delà duquel l'expédition est gratuite : dans ce cas, le coût du transport reste à sa charge.",
        "Les délais de livraison indiqués sur les fiches produit sont estimatifs et non contraignants. Oralzon expédie exclusivement au sein de l'Union européenne.",
        "L'acheteur reçoit par e-mail le numéro de suivi au moment de l'expédition et est invité à confirmer la réception depuis la rubrique commandes. À défaut de confirmation, la livraison est réputée effectuée à l'expiration de 7 jours à compter de l'expédition pour les envois nationaux et de 15 jours pour les envois intracommunautaires."
      ],
    },
    {
      heading: "6. Versement au vendeur",
      paragraphs: [
        "Les sommes encaissées restent chez Oralzon jusqu'à la confirmation de livraison, manuelle ou automatique selon les termes du point 5. Ce n'est qu'alors que le net est versé au vendeur sur le compte associé.",
        "Ce fonctionnement protège les deux parties : il permet de traiter un retour ou une contestation avant que les sommes ne soient transférées, et assure au vendeur un versement automatique sans relance.",
        "Une demande de retour ouverte suspend le versement afférent à l'article concerné jusqu'au règlement du dossier.",
        "Pour recevoir les versements, le vendeur doit compléter la vérification d'identité exigée par le prestataire de services de paiement. Jusque-là, les sommes restent provisionnées et ne sont pas perdues."
      ],
    },
    {
      heading: "7. Retours et remboursements",
      paragraphs: [
        "S'agissant de ventes entre professionnels, **il n'existe pas de droit de rétractation légal**. Oralzon reconnaît toutefois, au titre de sa propre politique commerciale, la possibilité de demander un retour dans les **30 jours** suivant la livraison, aux conditions ci-après.",
        "La demande s'ouvre depuis la rubrique « Mes commandes » et peut ne porter que sur une partie des quantités achetées. Le vendeur l'examine et peut l'accepter ou la refuser en motivant sa décision.",
        "Les produits doivent être restitués intacts, dans leur emballage d'origine non ouvert et complets de tous leurs éléments. **Sont exclus du retour** les dispositifs à usage unique dont l'emballage stérile est ouvert ou endommagé, les produits réalisés sur mesure, ceux susceptibles de se détériorer rapidement et ceux dont la sécurité n'est plus vérifiable une fois ouverts.",
        "Sauf accord contraire, les frais de retour sont à la charge de l'acheteur. Ils incombent en revanche au vendeur lorsque le produit est défectueux, non conforme à la commande ou endommagé pendant le transport.",
        "Le remboursement est calculé sur le prix effectivement payé pour les articles retournés et est effectué sur le même moyen de paiement dans les 14 jours suivant l'acceptation du retour. Le vendeur peut retenir une part motivée en cas de dépréciation non imputable à la vérification du produit.",
        "Cette politique ne préjudicie pas aux garanties prévues par le Code civil italien pour les vices de la chose vendue, qui demeurent réservées."
      ],
    },
    {
      heading: "8. Garantie et conformité des produits",
      paragraphs: [
        "Le vendeur garantit, sous sa seule responsabilité, que les produits publiés sont conformes aux réglementations applicables, y compris le règlement (UE) 2017/745 sur les dispositifs médicaux, et qu'il dispose des titres nécessaires pour les commercialiser.",
        "Oralzon vérifie les données d'identification et fiscales fournies lors de l'inscription, mais n'examine ni ne certifie la conformité de chaque produit, qui reste entièrement à la charge du vendeur.",
        "La garantie légale des vices prévue aux art. 1490 et suivants du Code civil italien s'applique à la vente, dans les rapports entre vendeur et acheteur."
      ],
    },
    {
      heading: "9. Avis et questions",
      paragraphs: [
        "Seuls les acheteurs ayant effectivement acheté le produit peuvent laisser un avis : la vérification est automatique et ne peut être contournée.",
        "Les avis et les questions sont publics et portent le nom de leur auteur. Il n'est pas permis d'y insérer des coordonnées directes ni des contenus diffamatoires, illicites ou étrangers au produit.",
        "Nous ne retirons pas les avis négatifs à la demande du vendeur, qui peut toutefois répondre publiquement. Nous retirons les contenus contraires à ces règles, en informant leur auteur."
      ],
    },
    {
      heading: "10. Loi applicable et juridiction compétente",
      paragraphs: [
        "Ces Conditions sont régies par la loi italienne. Le tribunal de Cassino (Italie) est seul compétent pour tout litige, au sens de l'art. 25 du règlement (UE) 1215/2012, s'agissant de relations entre professionnels.",
        "La version italienne fait foi en cas de divergence avec les traductions."
      ],
    },
    {
      heading: "11. Contacts",
      paragraphs: [
        "Pour toute information sur ces Conditions : **support@oralzon.com**"
      ],
    },
  ],
};

export const FR_LEGAL: { termini: LegalDocument; condizioni: LegalDocument } = {
  termini: TERMINI_SERVIZIO_FR,
  condizioni: CONDIZIONI_VENDITA_FR,
};
