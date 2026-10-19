---
sidebar_position: 1
_i18n_hash: 1eae5f5894f7cbf4de993993feab86a5
---
# Introduction

## Contexte

En tant que créateurs de contenu, nous publions souvent nos articles sur diverses plateformes tierces. Cependant, pour ceux d'entre nous qui sont sérieux concernant notre contenu, la publication n'est que le début. Nous devons continuellement surveiller le lectorat de nos articles au fil du temps. Malheureusement, nos capacités de collecte de données sont limitées à ce que chaque plateforme offre, ce qui dépend fortement des capacités propres de la plateforme. De plus, lorsque nous distribuons le même contenu sur différentes plateformes, les données de lectorat et de fréquentation sont complètement isolées.

En tant que développeur, je crée de nombreuses applications logicielles. Cependant, une fois que je publie ces applications, je perds souvent le contrôle sur elles. Par exemple, après avoir publié un programme en ligne de commande, je n'ai aucun moyen de savoir comment les utilisateurs interagissent avec celui-ci, ni même combien d'utilisateurs l'utilisent. De même, lors du développement d'une application open-source, dans le passé, je ne pouvais évaluer l'intérêt que par le biais des étoiles sur GitHub, me laissant dans le flou concernant l'utilisation réelle.

Par conséquent, nous avons besoin d'une solution simple qui collecte des informations minimales, tout en respectant la vie privée personnelle et d'autres restrictions. Cette solution est la télémétrie.

## Télémétrie

Dans le domaine de l'informatique, la télémétrie est une technologie courante qui implique la transmission minimale et anonyme d'informations pour répondre aux préoccupations de confidentialité tout en répondant aux besoins analytiques de base des créateurs de contenu.

Par exemple, le cadre Next.js de React collecte des informations à l'aide de la télémétrie : [Référence de l'API : Next.js CLI | Next.js (nextjs.org)](https://nextjs.org/docs/app/api-reference/next-cli#telemetry)

Alternativement, en intégrant une image pixel transparente blanche de taille 1px dans un article, il est possible de collecter des données de visiteurs sur des sites Web sur lesquels nous n'avons aucun contrôle. Les navigateurs modernes et la plupart des sites Web bloquent l'insertion de scripts personnalisés en raison des risques potentiels pour la sécurité. Cependant, une image semble beaucoup plus inoffensive en comparaison. Presque tous les sites Web autorisent le chargement d'images tierces, rendant la télémétrie réalisable.

## Quelles informations pouvons-nous collecter via une image ?

Étonnamment, recevoir une seule demande d'image nous permet de collecter plus d'informations qu'on pourrait l'imaginer.

En analysant les demandes réseau, nous pouvons obtenir l'adresse IP de l'utilisateur, le moment de la visite, le référent et le type d'appareil. Cela nous permet d’analyser les schémas de trafic, tels que les pics de temps de lecture et les tendances, la distribution démographique et la granularité du trafic sur différentes plateformes. Cette information est particulièrement précieuse pour les activités de marketing et de promotion.

![](/img/telemetry/1.png)

## Comment pouvons-nous mettre en œuvre la télémétrie ?

La télémétrie est une technologie simple qui nécessite essentiellement un point d'extrémité pour recevoir les demandes Internet. En raison de sa simplicité, il existe peu d'outils dédiés à cette fin. Beaucoup ne considèrent pas l'analyse comme importante, ou ils peuvent être découragés par les barrières initiales. Toutefois, la demande pour une telle fonctionnalité est claire.

Développer une solution de télémétrie est simple. Vous devez juste créer un projet, configurer une route, collecter des informations à partir du corps de la requête et renvoyer une image vide.

Voici un exemple utilisant Node.js :

```javascript
router.get(
  '/telemetry.gif',
  async (req, res) => {
    const ip = req.ip;
    const referer = req.header['referer'];
    const userAgent = req.headers['user-agent'];
    
    // Stockez-le dans votre base de données
    
    const blankGifBuffer = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    
    res.header('Content-Type', 'image/gif').send(blankGifBuffer);
  }
);
```

Si vous préférez ne pas développer votre propre solution, je recommande Tianji. En tant que projet open-source offrant **Analyse de site web**, **Surveillance de temps de fonctionnement**, et **État du serveur**, Tianji a récemment introduit une fonctionnalité de télémétrie pour aider les créateurs de contenu à signaler la télémétrie, facilitant ainsi une meilleure collecte de données. Surtout, être open-source vous donne le contrôle sur vos données et vous permet d'agréger le trafic de plusieurs plateformes en un seul endroit, évitant ainsi la fragmentation d'afficher les mêmes informations à différents endroits.

![](/img/telemetry/2.png)

GitHub : [https://github.com/msgbyte/tianji](https://github.com/msgbyte/tianji) 

Site officiel : [https://tianji.dev/](https://tianji.dev/)
