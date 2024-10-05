---
sidebar_position: 1
_i18n_hash: bcb6522b66b64594f82548e296f77934
---
# Script de suivi

## Installation

Pour suivre les événements du site web, il vous suffit d'injecter un simple script (< 2 Ko) dans votre site web.

Le script ressemble à ceci :

```html
<script async defer src="https://<votre-domaine-auto-hébergé>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

Vous pouvez obtenir ce code de script à partir de la liste des sites web de **Tianji**.

## Rapport d'événement

**Tianji** propose un moyen simple de signaler les événements de clic de l'utilisateur, ce qui facilite le suivi des actions que les utilisateurs apprécient et utilisent fréquemment.

Il s'agit d'une méthode très courante dans l'analyse des sites web. Vous pouvez l'obtenir rapidement en utilisant **Tianji**.

Après avoir injecté le code du script dans votre site web, il vous suffit d'ajouter un `data-tianji-event` dans l'attribut DOM.

Par exemple :

```html
<button data-tianji-event="submit-login-form">Connexion</button>
```

Maintenant, lorsque l'utilisateur clique sur ce bouton, votre tableau de bord recevra un nouvel événement.

## Modifier le nom du script par défaut

> Cette fonctionnalité est disponible à partir de la version 1.7.4

Vous pouvez utiliser l'environnement `CUSTOM_TRACKER_SCRIPT_NAME` lorsque vous le démarrez.

Par exemple :
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

Ensuite, vous pouvez accéder à votre script de suivi avec `"https://<votre-domaine-auto-hébergé>/my-tracker.js"`.

Cela permet d'éviter certains bloqueurs de publicité.

Vous n'avez pas besoin du suffixe `.js`. Il peut s'agir de n'importe quel chemin de votre choix, même vous pouvez l'utiliser comme `CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"`.

## Suivi des domaines spécifiés uniquement

En général, le suivi signalera tous les événements où que votre site soit en cours d'exécution. Mais parfois, nous devons ignorer des événements comme `localhost`.

Tianji fournit un attribut du script de suivi pour cela.

Vous pouvez ajouter `data-domains` à votre script. La valeur doit être vos domaines racines à suivre. Utilisez `,` pour séparer plusieurs domaines.

```html
<script async defer src="https://<votre-domaine-auto-hébergé>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

Ensuite, vous ne verrez que les événements provenant de ces domaines.
