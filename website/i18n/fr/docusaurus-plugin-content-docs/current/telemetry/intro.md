---
sidebar_position: 1
_i18n_hash: c61b6c9968c295ffdfdc1a484f853504
---
# Introduction

## Contexte

En tant que créateurs de contenu, nous publions souvent nos articles sur diverses plateformes tierces. Cependant, pour ceux d'entre nous qui prennent leur contenu au sérieux, la publication n'est que le début. Nous devons surveiller en permanence l'audience de nos articles au fil du temps. Malheureusement, nos capacités de collecte de données sont limitées à ce que chaque plateforme offre, ce qui dépend fortement des capacités propres de la plateforme. De plus, lorsque nous distribuons le même contenu sur différentes plateformes, les données d'audience et de visite sont complètement isolées.

En tant que développeur, je crée de nombreuses applications logicielles. Cependant, une fois que je les ai publiées, je perds souvent le contrôle sur elles. Par exemple, après avoir publié un programme en ligne de commande, je n'ai aucun moyen de savoir comment les utilisateurs interagissent avec lui ou même combien d'utilisateurs utilisent mon application. De même, lors du développement d'une application open-source, par le passé, je ne pouvais mesurer l'intérêt que par le biais des étoiles GitHub, me laissant dans l'ignorance de l'utilisation réelle.

Par conséquent, nous avons besoin d'une solution simple qui collecte des informations minimales, respectant la confidentialité des individus et d'autres restrictions. Cette solution est la télémétrie.

## Télémétrie

Dans le domaine de l'informatique, la télémétrie est une technologie courante qui consiste à signaler de manière minimale et anonyme des informations pour répondre aux préoccupations en matière de confidentialité tout en répondant aux besoins analytiques de base des créateurs de contenu.

Par exemple, le framework React Next.js collecte des informations à l'aide de la télémétrie : [Référence API : Next.js CLI | Next.js (nextjs.org)](https://nextjs.org/docs/app/api-reference/next-cli#telemetry)

Alternativement, en intégrant une image transparente de 1px de taille dans un article, il est possible de collecter des données de visiteurs sur des sites web que nous ne contrôlons pas. Les navigateurs modernes et la plupart des sites web bloquent l'insertion de scripts personnalisés en raison des risques de sécurité potentiels. Cependant, une image semble beaucoup plus inoffensive par comparaison. Presque tous les sites web permettent le chargement d'images tierces, rendant la télémétrie possible.

## Quelles informations pouvons-nous collecter via une image ?

Étonnamment, recevoir une seule requête d'image nous permet de collecter plus d'informations que l'on pourrait s'y attendre.

En analysant les requêtes réseau, nous pouvons obtenir l'adresse IP de l'utilisateur, l'heure de la visite, le référent et le type d'appareil. Cela nous permet d'analyser les modèles de trafic, tels que les heures de pointe de l'audience et les tendances, la distribution démographique et la granularité du trafic sur différentes plateformes. Ces informations sont particulièrement précieuses pour les activités marketing et promotionnelles.

![](/img/telemetry/1.png)

## Comment pouvons-nous mettre en œuvre la télémétrie ?

La télémétrie est une technologie simple qui nécessite essentiellement un point de terminaison pour recevoir des requêtes Internet. En raison de sa simplicité, il existe peu d'outils dédiés à cet effet. Beaucoup peuvent ne pas considérer l'analytique comme importante, ou ils pourraient être découragés par les obstacles initiaux. Cependant, la demande de cette fonctionnalité est claire.

Développer une solution de télémétrie est simple. Il suffit de créer un projet, de configurer une route, de collecter des informations à partir du corps de la requête et de renvoyer une image vide.

Voici un exemple en utilisant Node.js :

```jsx
router.get(
  '/telemetry.gif',
  async (req, res) => {
    const ip = req.ip;
    const referer = req.header['referer'];
    const userAgent = req.headers['user-agent'];
    
    // Stocker dans votre base de données
    
    const blankGifBuffer = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.header('Content-Type', 'image/gif').send(blankGifBuffer);
  }
);
```

Si vous préférez ne pas développer votre propre solution, je recommande Tianji. En tant que projet open-source offrant **Analytique Web**, **Surveillance de l'Uptime** et **État du Serveur**, Tianji a récemment introduit une fonctionnalité de télémétrie pour aider les créateurs de contenu à signaler la télémétrie, facilitant ainsi une meilleure collecte de données. Plus important encore, étant open-source, vous avez le contrôle sur vos données et pouvez agréger le trafic de plusieurs plateformes en un seul endroit, évitant ainsi la fragmentation de l'affichage des mêmes informations à différents endroits.

![](/img/telemetry/2.png)

GitHub : [https://github.com/msgbyte/tianji](https://github.com/msgbyte/tianji) 

Site officiel : [https://tianji.msgbyte.com/](https://tianji.msgbyte.com/)
