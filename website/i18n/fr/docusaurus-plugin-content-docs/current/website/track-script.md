---
sidebar_position: 1
_i18n_hash: ef9fc0eb6072a8f037b70ff2b56e12ae
---
# Script de Suivi

## Installation

Pour suivre les événements de votre site web, vous devez simplement injecter un script simple (< 2 Ko) dans votre site.

Le script ressemble à ceci :

```html
<script async defer src="https://<votre-domaine-auto-hébergé>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

Vous pouvez obtenir ce code de script à partir de votre liste de sites **Tianji**.

## Signaler un Événement

**Tianji** propose un moyen simple de signaler les événements de clic utilisateur, ce qui facilite le suivi des actions que les utilisateurs préfèrent et utilisent souvent.

C'est une méthode très courante dans l'analyse des sites web. Vous pouvez l'utiliser rapidement avec **Tianji**.

### Utilisation de Base

Après avoir injecté le code du script dans votre site web, vous devez simplement ajouter un `data-tianji-event` dans l'attribut DOM.

Par exemple :

```html
<button data-tianji-event="submit-login-form">Connexion</button>
```

Maintenant, quand un utilisateur clique sur ce bouton, votre tableau de bord recevra un nouvel événement.

### Attacher des Données d'Événement

Vous pouvez attacher des données supplémentaires à vos événements en utilisant les attributs `data-tianji-event-{clé}`. Tout attribut correspondant à ce modèle sera collecté et envoyé avec l'événement.

```html
<button 
  data-tianji-event="purchase" 
  data-tianji-event-product="Plan Premium"
  data-tianji-event-price="99"
  data-tianji-event-currency="USD">
  Acheter Maintenant
</button>
```

Cela enverra un événement nommé `purchase` avec les données suivantes :
```json
{
  "product": "Plan Premium",
  "price": "99",
  "currency": "USD"
}
```

### Suivi des Clics sur les Liens

Lorsque vous utilisez `data-tianji-event` sur des balises d'ancrage (`<a>`), **Tianji** les gère spécialement pour s'assurer que l'événement est suivi avant la navigation :

```html
<a href="/pricing" data-tianji-event="view-pricing">Voir les Prix</a>
```

Pour les liens internes (ne s'ouvrant pas dans un nouvel onglet), le tracker :

1. Empêche la navigation par défaut
2. Envoie l'événement de suivi
3. Navigue vers l'URL cible après l'achèvement du suivi

Pour les liens externes ou les liens avec `target="_blank"`, l'événement est suivi sans bloquer la navigation.

### API JavaScript

Après le chargement du script de suivi, vous pouvez également suivre des événements de manière programmée en utilisant l'objet `window.tianji`.

#### Suivi des Événements Personnalisés

```javascript
// Suivi simple d'un événement
window.tianji.track('button-clicked');

// Événement avec données personnalisées
window.tianji.track('purchase', {
  product: 'Plan Premium',
  price: 99,
  currency: 'USD'
});

// Suivi avec objet payload personnalisé
window.tianji.track({
  website: 'votre-identifiant-site',
  name: 'custom-event',
  data: { key: 'value' }
});

// Suivi utilisant une fonction (reçoit des infos sur la page actuelle)
window.tianji.track((payload) => ({
  ...payload,
  name: 'dynamic-event',
  data: { timestamp: Date.now() }
}));
```

#### Identifier les Utilisateurs

Vous pouvez attacher des informations utilisateur aux sessions de suivi :

```javascript
window.tianji.identify({
  userId: 'utilisateur-123',
  email: 'utilisateur@example.com',
  plan: 'premium'
});
```

Ces informations seront associées aux événements suivants de cet utilisateur.

## Modifier le Nom par Défaut du Script

> Cette fonctionnalité est disponible à partir de la v1.7.4+

Vous pouvez utiliser l'environnement `CUSTOM_TRACKER_SCRIPT_NAME` lors de son lancement.

Par exemple :
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

Ensuite, vous pouvez accéder à votre script de suivi avec `"https://<votre-domaine-auto-hébergé>/my-tracker.js"`

Cela vous aide à éviter certains bloqueurs de publicité.

Vous n'avez pas besoin du suffixe `.js`. Cela peut être n'importe quel chemin que vous choisissez, même vous pouvez utiliser `CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"`

## Suivi de Domaines Spécifiés Seulement

Généralement, le tracker signalera tous les événements où que votre site soit opérationnel. Mais parfois, nous devons ignorer des événements comme `localhost`.

Tianji fournit un attribut du script tracker pour le faire.

Vous pouvez ajouter `data-domains` à votre script. La valeur doit être vos domaines principaux à suivre. Utilisez `,` pour séparer plusieurs domaines.

```html
<script async defer src="https://<votre-domaine-auto-hébergé>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

Ensuite, vous pourrez voir uniquement les événements de ces domaines.
