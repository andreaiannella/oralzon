import type { AcademyGuideSection } from '../academyGuides';
import type { AcademyGuideTranslation } from './en';

export const FR_ACADEMY_TRANSLATIONS: Record<string, AcademyGuideTranslation> = {
  "come-iniziare-su-oralzon": {
    title: "Bien démarrer sur Oralzon",
    description: "Le parcours essentiel des premiers jours : ce qu'il faut compléter avant d'ouvrir vraiment au public, et dans quel ordre.",
    sections: [
      {
        heading: "Le profil boutique avant tout",
        paragraphs: [
          "Avant de mettre en ligne des produits, il est utile de compléter le profil dans Paramètres : nom de la boutique, téléphone, site web (si vous en avez un), et les informations fiscales (numéro de TVA, PEC ou code SDI) nécessaires à la facturation. Il n'y a pas de logo ni de description à charger — sur Oralzon, l'identité du vendeur est le nom de la boutique plus l'éventuel badge de vendeur vérifié, pas une image."
        ],
      },
      {
        heading: "Connecter Stripe avant de publier des produits",
        paragraphs: [
          "Le compte Stripe connecté est celui qui reçoit réellement les paiements des ventes — sans lui, un produit peut être publié et même acheté, mais les fonds restent en attente sur Oralzon jusqu'à ce que la connexion soit finalisée. La page Paiements affiche toujours l'état actualisé de la connexion, et une bannière en haut du panneau le rappelle tant qu'elle n'est pas active."
        ],
      },
      {
        heading: "Les premiers produits : la qualité avant la quantité",
        paragraphs: [
          "Mieux vaut 10-15 produits avec des fiches complètes (plusieurs photos, description détaillée, catégorie correcte) que 50 fiches minimales. Les fiches incomplètes se positionnent moins bien dans la recherche interne et convertissent moins — un client qui cherche un outil précis et tombe sur une description vague passe presque toujours au résultat suivant.",
          "L'importation depuis Excel (section Import Excel) est utile quand on part d'un catalogue déjà existant dans un tableur, mais il vaut quand même la peine de revoir à la main les premières fiches importées avant de les publier : la qualité des photos en particulier ne peut pas être automatisée."
        ],
      },
      {
        heading: "Ce qui se passe pendant les 6 premiers mois",
        paragraphs: [
          "La période d'essai gratuite dure 180 jours à partir de l'inscription — pendant cette période, l'abonnement du plan vendeur n'est pas facturé, mais la commission sur les ventes reste active dès la première commande. Il vaut la peine d'utiliser ces mois pour tester ce qui fonctionne (catégories, prix, sponsorisations) avant que l'abonnement ne débute."
        ],
      },
    ],
  },
  "migliorare-le-vendite": {
    title: "Améliorer les ventes : ce qui fait vraiment bouger les chiffres",
    description: "Les leviers qui ont un impact réel sur les ventes, par ordre de priorité pratique — tout ne mérite pas le même effort.",
    sections: [
      {
        heading: "Les photos comptent plus que la description",
        paragraphs: [
          "Sur une marketplace B2B, la tentation est d'écrire des descriptions techniques très longues et de négliger les photos, en supposant que l'acheteur sait déjà ce qu'il cherche. Dans la pratique, c'est l'inverse qui se produit : les photos sont le premier filtre par lequel un acheteur écarte ou considère un produit, la description n'intervient qu'ensuite. Des photos nettes, sur fond neutre, montrant le produit sous plusieurs angles, font une différence mesurable sur le taux de conversion."
        ],
      },
      {
        heading: "Le prix n'est pas le seul levier concurrentiel",
        paragraphs: [
          "Sur une marketplace avec plusieurs vendeurs pour la même catégorie de produit, la tentation est de ne concurrencer que sur le prix le plus bas — mais des délais de livraison annoncés honnêtement, une fiche produit complète, et des avis positifs accumulés dans le temps pèsent autant, voire plus, que le prix pour un acheteur professionnel qui évalue la fiabilité du fournisseur, pas seulement le coût de la commande."
        ],
      },
      {
        heading: "Répondre aux avis, y compris les négatifs",
        paragraphs: [
          "Depuis la section Avis, vous pouvez répondre publiquement à chaque avis — votre réponse reste visible sous celle du client. Un avis négatif sans réponse pèse plus que l'avis lui-même : il signale que le problème n'a pas été traité. Une réponse publique, même brève, qui reconnaît le problème et explique ce qui a été fait, permet de récupérer l'essentiel de la confiance perdue."
        ],
      },
      {
        heading: "Les sponsorisations fonctionnent mieux sur des produits déjà validés",
        paragraphs: [
          "Sponsoriser un produit qui n'a encore rien vendu, pour tester si cela fonctionne, est presque toujours moins efficace que sponsoriser un produit qui se vend déjà bien de façon organique — la sponsorisation amplifie la visibilité, elle ne compense pas une fiche faible ou un prix hors marché. Il vaut la peine de regarder les statistiques avant de choisir quoi sponsoriser, pas après."
        ],
      },
    ],
  },
  "fatturazione-e-dati-fiscali": {
    title: "Facturation : ce que fait Oralzon et ce qui reste au vendeur",
    description: "Comment fonctionne vraiment le calcul de la TVA ligne par ligne, ce que vous trouvez dans le rapport des ventes, et ce qu'il vous reste à faire.",
    sections: [
      {
        heading: "Oralzon n'émet pas de factures à votre place",
        paragraphs: [
          "Un point important à avoir clairement en tête dès le départ : Oralzon n'est pas responsable de l'émission des factures fiscales réelles. Chaque vendeur reste un sujet fiscal autonome, et doit émettre ses propres factures électroniques (ou via son comptable) pour chaque commande. Ce qu'Oralzon fournit, dans la section Rapport des Ventes → Données pour la facturation, c'est le calcul déjà prêt — base imposable, taux, TVA, éventuel motif d'exonération — pour ne pas avoir à le refaire à la main."
        ],
      },
      {
        heading: "Comment la TVA est calculée sur chaque commande",
        paragraphs: [
          "Le calcul suit la règle standard de l'UE pour les livraisons de biens B2B : vente nationale (même pays pour le vendeur et le client) applique la TVA pleine du pays du vendeur ; vente intracommunautaire avec les deux parties vérifiées sur VIES applique l'autoliquidation (TVA à zéro, le client autoliquide la taxe) ; vente intracommunautaire sans vérification VIES applique quand même la TVA pleine, par prudence ; vente hors UE est exonérée au titre de l'exportation.",
          "Ce calcul se fait automatiquement pour chaque ligne de commande, au moment de l'achat — rien à configurer pour que cela fonctionne."
        ],
      },
      {
        heading: "Exporter les données pour votre comptable",
        paragraphs: [
          "Le bouton Exporter en CSV dans la section Données pour la facturation génère un fichier avec une ligne pour chaque produit de chaque commande — le niveau de détail réellement nécessaire pour établir une facture, pas un agrégat mensuel. C'est le fichier le plus pratique à transmettre à votre comptable ou à utiliser comme base pour l'émission des factures électroniques."
        ],
      },
    ],
  },
  "marketing-su-oralzon": {
    title: "Marketing sur Oralzon",
    description: "Comment les clients vous trouvent, pourquoi ils ne vous trouvent pas au début, et ce que vous pouvez y faire.",
    sections: [
      {
        heading: "Le problème quand on démarre : exister ne suffit pas à être trouvé",
        paragraphs: [
          "Un catalogue chargé n'est pas un catalogue visible. Sur n'importe quelle marketplace, les produits affichés en haut sont ceux qui ont déjà vendu, déjà reçu des avis, déjà accumulé un historique. C'est logique pour l'acheteur — cela montre ce qui a fonctionné pour d'autres — mais cela crée un problème circulaire pour celui qui arrive maintenant : vous ne vendez pas parce qu'on ne vous voit pas, et on ne vous voit pas parce que vous n'avez pas encore vendu.",
          "C'est pourquoi un fournisseur sérieux, avec d'excellents produits et des prix corrects, peut rester des mois sans commande pendant que des concurrents moins compétitifs vendent chaque jour. Ce n'est pas une question de qualité : c'est une question de position. Celui qui cherche « curettes Gracey » regarde les premiers résultats et atteint rarement le troisième écran.",
          "Les sponsorisations servent exactement à cela : acheter la position que vous n'avez pas encore gagnée, le temps de la gagner vraiment. C'est un accélérateur de démarrage, pas une taxe permanente."
        ],
      },
      {
        heading: "Ce qui change concrètement quand un produit est sponsorisé",
        paragraphs: [
          "Un produit sponsorisé n'est pas montré « un peu plus haut » : il entre dans des espaces où les produits ordinaires n'apparaissent pas du tout. La carte Sponsorisé Hero, par exemple, est une fiche unique avec votre produit seul, sans concurrent à côté, qui apparaît en page d'accueil, dans le catalogue et sur les pages produit — là où un client regarde déjà des articles comme les vôtres.",
          "La différence avec un bon référencement organique est que la sponsorisation agit immédiatement et de façon prévisible : vous savez où vous apparaîtrez et pour combien de temps. Le référencement organique vient ensuite, comme conséquence des ventes que la sponsorisation vous a permis de réaliser.",
          "Et c'est le point que beaucoup de vendeurs manquent : les ventes générées pendant que vous êtes sponsorisé ne disparaissent pas à la fin de la sponsorisation. Elles restent sous forme d'historique de commandes et d'avis, et ce sont précisément les ingrédients qui vous font monter dans les résultats ensuite. Un mois de visibilité payée peut vous laisser dans une position qu'il vous aurait fallu bien plus de temps à atteindre seul."
        ],
      },
      {
        heading: "Quand cela vaut vraiment la peine, et quand non",
        paragraphs: [
          "Sponsoriser a du sens quand le produit est déjà prêt à convertir : fiche complète, photos nettes, prix aligné sur le marché, disponibilité réelle en stock. Amener du trafic sur une fiche vide ou un article épuisé est le moyen le plus rapide de gaspiller le budget — le client arrive, ne trouve pas ce qu'il cherche, et ne revient pas.",
          "Cela a surtout du sens à trois moments : à l'ouverture de votre boutique, quand personne ne vous connaît encore ; au lancement d'un nouveau produit sans historique ; quand vous voulez défendre une catégorie où un concurrent gagne du terrain.",
          "Cela a moins de sens sur des produits qui se vendent déjà bien seuls — vous payez alors une visibilité que vous auriez eue de toute façon — et sur des articles à marge trop faible, où le coût de la sponsorisation mange le gain. Avant d'acheter, faites un calcul simple : combien d'unités supplémentaires devez-vous vendre pour rentabiliser le forfait ? Si le nombre vous paraît raisonnable, lancez-vous ; s'il paraît élevé, choisissez un produit à meilleure marge.",
          "Les sponsorisations ne garantissent pas les ventes : elles achètent de la visibilité, condition nécessaire mais non suffisante. Ce qui se passe après le clic dépend de votre fiche produit, de votre prix et de votre fiabilité."
        ],
      },
      {
        heading: "Mesurez les résultats, ne vous fiez pas à l'impression",
        paragraphs: [
          "Avant d'activer une sponsorisation, notez votre point de départ : combien de commandes et quel chiffre d'affaires ce produit a généré le mois dernier. Vous les trouverez dans la section Statistiques du tableau de bord. À l'échéance du forfait, comparez les mêmes chiffres — c'est la seule façon de savoir si cela a vraiment fonctionné, au lieu de se fier à une impression.",
          "Si un forfait a rapporté, renouvelez-le. S'il n'a rien rapporté, essayez de changer de produit ou de type de visibilité avant de conclure que les sponsorisations ne fonctionnent pas : souvent le problème n'est pas l'outil mais l'association entre l'outil et le produit choisi."
        ],
      },
      {
        heading: "Le nom de la boutique et le badge vérifié sont votre identité",
        paragraphs: [
          "Sur Oralzon, il n'y a ni logo ni description de boutique à personnaliser : ce qu'un client voit, sur votre page boutique et à côté de vos produits, c'est le nom de l'entreprise et, le cas échéant, le badge de vendeur vérifié. C'est un choix délibéré de la plateforme — logo et description libre sont les endroits où l'on tente le plus souvent d'insérer des contacts directs pour sortir le client de la marketplace, et les supprimer protège tous les vendeurs de la même façon, en évitant que ceux qui respectent les règles concurrencent ceux qui ne les respectent pas.",
          "C'est pourquoi il vaut la peine de choisir un nom de boutique clair et reconnaissable dès l'inscription : c'est le seul élément d'identité qui vous représente partout sur la plateforme, y compris dans les sections sponsorisées où la concurrence est la plus directe.",
          "Le badge de vendeur vérifié ne s'achète pas : il s'obtient en complétant la vérification d'identité sur Stripe, la même qui sert à recevoir les paiements. C'est le signal de fiabilité le plus fort dont vous disposez, et dans les sections sponsorisées il fait la différence : à produit et prix égaux, on choisit presque toujours le vendeur vérifié."
        ],
      },
      {
        heading: "Les avis sont du marketing, pas seulement un retour",
        paragraphs: [
          "Les avis que les clients laissent sur vos produits sont visibles par quiconque visite votre page boutique ou vos fiches produit — ce sont, à tous égards, des contenus créés par vos propres clients, souvent plus convaincants que n'importe quelle description que vous pourriez écrire. Après une expédition qui s'est bien passée, il vaut la peine de demander poliment au client de laisser un avis plutôt que d'attendre que cela arrive tout seul.",
          "Les avis comptent double si vous sponsorisez : la visibilité amène le client sur la fiche, mais c'est la preuve sociale qui lui fait cliquer sur « ajouter au panier ». Sponsoriser un produit sans avis fonctionne ; en sponsoriser un avec des avis positifs fonctionne bien mieux — à dépense égale."
        ],
      },
      {
        heading: "La page boutique rassemble tout votre catalogue",
        paragraphs: [
          "Beaucoup de visiteurs arrivent sur un produit via la recherche, puis cliquent sur le nom du vendeur pour voir le reste du catalogue — la page boutique est souvent l'endroit où se décide si un client devient régulier ou reste un achat unique. Un catalogue organisé par catégories, avec des fiches complètes, aide à retenir ce visiteur.",
          "C'est aussi pourquoi il vaut mieux sponsoriser le bon produit et pas nécessairement le moins cher : la sponsorisation amène du trafic sur une fiche, mais de là le client explore tout le reste. Un produit représentatif de ce que vous vendez apporte des visites plus utiles qu'un produit d'appel déconnecté de votre catalogue."
        ],
      },
    ],
  },
  "sconti-e-codici-sconto": {
    title: "Remises et codes de réduction",
    description: "Comment créer un code de réduction efficace, et un point important à connaître si vous vendez dans un panier partagé avec d'autres vendeurs.",
    sections: [
      {
        heading: "Comment créer un code de réduction",
        paragraphs: [
          "Depuis la section Remises, vous pouvez créer un code personnalisé, en pourcentage ou en montant fixe, avec une limite d'utilisation et une date d'expiration facultatives, et — si vous le souhaitez — le limiter à des produits spécifiques plutôt qu'à tout le catalogue. Vous communiquez vous-même le code aux clients (email, réseaux sociaux, carte de visite) — Oralzon ne le diffuse automatiquement nulle part."
        ],
      },
      {
        heading: "Important : votre code ne s'applique qu'à vos propres produits",
        paragraphs: [
          "Oralzon est une marketplace multi-vendeurs : un client peut avoir dans son panier vos produits en même temps que ceux d'autres vendeurs, dans la même commande. Un point fondamental à garder en tête : un code de réduction que vous créez s'applique exclusivement aux lignes de votre boutique dans ce panier, jamais aux produits d'un autre vendeur. Aucun vendeur ne peut, même par erreur, réduire involontairement la marge d'un autre via son propre code de réduction."
        ],
      },
      {
        heading: "Un seuil minimum raisonnable",
        paragraphs: [
          "Définir un montant minimum de commande pour utiliser le code (par exemple « valable au-delà de 50 € ») est souvent plus efficace qu'une petite réduction sans seuil : cela incite le client à ajouter quelque chose de plus au panier pour atteindre le seuil, au lieu de se limiter à l'achat minimum qu'il avait déjà en tête."
        ],
      },
    ],
  },
  "come-usare-le-sponsorizzazioni": {
    title: "Comment utiliser les sponsorisations",
    description: "Les options disponibles dans Promotions, et comment choisir la bonne selon ce que vous voulez obtenir.",
    sections: [
      {
        heading: "Quatre types de visibilité, quatre objectifs différents",
        paragraphs: [
          "Produits en Vedette met en avant jusqu'à 5 de vos produits sur la page d'accueil et dans les résultats de recherche — le bon choix quand vous voulez donner un coup de pouce à des produits spécifiques, peut-être des nouveautés ou des articles à meilleure marge. Sponsorisation Page d'Accueil vous donne une position en rotation ou fixe dans la section sponsorisée de la page d'accueil — plus adaptée pour construire la notoriété de votre boutique dans son ensemble, pas d'un seul produit. Sponsorisation Catégorie vous donne une visibilité privilégiée dans une ou plusieurs catégories au choix — utile si vous voulez être repéré par ceux qui recherchent déjà précisément le type de produit que vous vendez. Sponsorisé Hero vous place seul, sans autres produits autour, dans une carte mise en avant contextuelle à la catégorie que le client consulte à ce moment — il apparaît à plusieurs endroits entre l'accueil, le catalogue et la page produit."
        ],
      },
      {
        heading: "Sponsorisé Hero : jamais plus d'un des vôtres à la fois",
        paragraphs: [
          "Vous pouvez acheter ce forfait pour autant de produits que vous voulez — il n'y a pas de limite au nombre que vous pouvez sponsoriser. La limite concerne ce que voit le client à un moment donné : sur la même page, jamais plus d'un de vos produits n'apparaît en même temps, même si vous en avez sponsorisé plusieurs — le système fait tourner lequel de vos produits afficher, à la fois dans le temps et entre les différents endroits de la page d'accueil où ce format apparaît. Cela garantit que l'espace reste partagé équitablement entre tous les sponsors, sans être monopolisé par celui qui achète le plus."
        ],
      },
      {
        heading: "Regardez les statistiques avant de choisir quoi sponsoriser",
        paragraphs: [
          "La section Statistiques montre quels produits génèrent déjà des vues et des ventes organiques — ce sont en général les meilleurs candidats à sponsoriser, car la sponsorisation amplifie un intérêt qui existe déjà au lieu de devoir le créer de toutes pièces. Sponsoriser un produit qui ne se vend pas du tout inverse rarement la tendance à lui seul."
        ],
      },
      {
        heading: "Le code de réduction dans le paiement de la sponsorisation",
        paragraphs: [
          "Si vous avez un code de réduction valable sur les forfaits de visibilité, vous le saisissez dans l'étape de confirmation qui s'ouvre en cliquant sur « Acheter » sur un forfait spécifique — pas avant. Le prix final avec la réduction appliquée est celui que vous voyez juste avant de procéder au paiement, jamais une surprise après coup."
        ],
      },
    ],
  },
};