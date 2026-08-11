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
    title: "Le marketing sur Oralzon",
    description: "Ce qui influence vraiment la façon dont les clients vous trouvent et vous font confiance sur la plateforme.",
    sections: [
      {
        heading: "Le nom de votre boutique et le badge vérifié sont votre identité",
        paragraphs: [
          "Sur Oralzon, il n'y a pas de logo ni de description de boutique à afficher — ce qu'un client voit, sur votre page boutique et à côté de vos produits, c'est le nom de l'entreprise et l'éventuel badge de vendeur vérifié. Il vaut la peine de choisir un nom de boutique clair et reconnaissable dès l'inscription : c'est le seul élément d'identité qui vous représente partout sur la plateforme."
        ],
      },
      {
        heading: "Les avis, c'est du marketing, pas seulement du feedback",
        paragraphs: [
          "Les avis que les clients laissent sur vos produits sont visibles par quiconque visite votre page boutique ou vos fiches produit — ce sont en pratique des supports générés par vos propres clients, souvent plus convaincants que n'importe quelle description que vous pourriez écrire. Il vaut la peine, après une expédition qui s'est bien passée, de demander gentiment au client de laisser un avis, plutôt que d'attendre que cela arrive tout seul."
        ],
      },
      {
        heading: "La page boutique rassemble tout votre catalogue",
        paragraphs: [
          "De nombreux visiteurs arrivent sur un produit via la recherche, puis cliquent sur le nom du vendeur pour voir le reste du catalogue — la page boutique (à /negozio/venditore/[id]) est souvent le moment où se décide si un client devient fidèle ou reste un achat ponctuel. Un catalogue organisé par catégories, avec des fiches produit complètes, aide à retenir ce visiteur."
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
        heading: "Trois types de visibilité, trois objectifs différents",
        paragraphs: [
          "Produits en Vedette met en avant jusqu'à 5 de vos produits sur la page d'accueil et dans les résultats de recherche — le bon choix quand vous voulez donner un coup de pouce à des produits spécifiques, peut-être des nouveautés ou des articles à meilleure marge. Sponsorisation Page d'Accueil vous donne une position en rotation ou fixe dans la section sponsorisée de la page d'accueil — plus adaptée pour construire la notoriété de votre boutique dans son ensemble, pas d'un seul produit. Sponsorisation Catégorie vous donne une visibilité privilégiée dans une ou plusieurs catégories au choix — utile si vous voulez être repéré par ceux qui recherchent déjà précisément le type de produit que vous vendez."
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