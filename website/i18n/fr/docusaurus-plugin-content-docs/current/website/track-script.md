---
sidebar_position: 1
_i18n_hash: 21ae6837de110e1b576fdf570bbbea6c
---
# Script de Suivi

## Installation

Pour suivre les événements de site web, il vous suffit d'injecter un simple script (< 2 KB) dans votre site.

Le script ressemble à ceci :

```html
<script async defer src="https://<votre-domaine-auto-hébergé>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

Vous pouvez obtenir ce code script depuis votre liste de sites **Tianji**

## Attributs du Script

Le script de suivi supporte les attributs `data-*` suivants sur la balise `<script>`:

| Attribut | Requis | Défaut | Description |
|---|---|---|---|
| `data-website-id` | **Oui** | — | L'ID unique du site web pour associer les données de suivi. Le tracker ne s'initialisera pas sans cela. |
| `data-host-url` | Non | Origine du `src` du script | URL du serveur backend. Si omis, il est automatiquement dérivé du chemin `src` du script. |
| `data-auto-track` | Non | `true` | Suivre automatiquement les vues de pages et les changements de routes. Définir sur `"false"` pour désactiver. |
| `data-do-not-track` | Non | — | Lorsqu'il est défini, respecte le paramètre Do Not Track (DNT) du navigateur et désactive le suivi si DNT est activé. |
| `data-domains` | Non | — | Une liste de domaines séparés par des virgules à suivre (par exemple, `"example.com,www.example.com"`). Le suivi est uniquement actif lorsque le nom d'hôte actuel correspond à l'un de ces domaines. |

### Exemple Complet

```html
<script
  async
  defer
  src="https://example.com/tracker.js"
  data-website-id="clxxxxxxxxxxxxxxxxxx"
  data-host-url="https://analytics.example.com"
  data-auto-track="true"
  data-do-not-track="true"
  data-domains="example.com,www.example.com"
></script>
```

### Désactiver le Suivi via localStorage

Vous pouvez également désactiver le suivi au moment de l'exécution en définissant un indicateur localStorage :

```javascript
localStorage.setItem('tianji.disabled', '1');
```

## Rapporter un Événement

**Tianji** fournit un moyen simple de signaler l'événement de clic d'utilisateur, c'est facile d'aider à suivre quelles actions les utilisateurs aiment et utilisent souvent.

C’est une méthode très courante dans l'analyse de sites web. Vous pouvez l'obtenir rapidement en utilisant **Tianji**.

### Usage de Base

Une fois que vous avez injecté le code du script dans votre site web, vous avez juste besoin d'ajouter un `data-tianji-event` dans l'attribut dom.

Par exemple :

```html
<button data-tianji-event="submit-login-form">Connexion</button>
```

Maintenant, lorsque l'utilisateur clique sur ce bouton, votre tableau de bord recevra un nouvel événement.

### Joindre des Données d'Événement

Vous pouvez joindre des données supplémentaires à vos événements en utilisant des attributs `data-tianji-event-{key}`. Tout attribut correspondant à ce motif sera collecté et envoyé avec l'événement.

```html
<button 
  data-tianji-event="purchase" 
  data-tianji-event-product="Premium Plan"
  data-tianji-event-price="99"
  data-tianji-event-currency="USD">
  Acheter Maintenant
</button>
```

Cela enverra un événement nommé `purchase` avec les données suivantes :
```json
{
  "product": "Premium Plan",
  "price": "99",
  "currency": "USD"
}
```

### Suivre les Clics de Liens

En utilisant `data-tianji-event` sur des balises d'ancrage (`<a>`), **Tianji** les gère spécialement pour s'assurer que l'événement est suivi avant la navigation :

```html
<a href="/pricing" data-tianji-event="view-pricing">Consulter les Prix</a>
```

Pour les liens internes (ne s'ouvrant pas dans un nouvel onglet), le tracker :
1. Empêche la navigation par défaut
2. Envoie l'événement de suivi
3. Navigue vers l'URL cible après la fin du suivi

Pour les liens externes ou les liens avec `target="_blank"`, l'événement est suivi sans bloquer la navigation.

### API JavaScript

Après le chargement du script de suivi, vous pouvez également suivre les événements de manière programmatique en utilisant l'objet `window.tianji`.

#### Suivre des Événements Personnalisés

```javascript
// Suivi d'événement simple
window.tianji.track('button-clicked');

// Événement avec données personnalisées
window.tianji.track('purchase', {
  product: 'Premium Plan',
  price: 99,
  currency: 'USD'
});

// Suivre avec un objet de charge utile personnalisé
window.tianji.track({
  website: 'your-website-id',
  name: 'custom-event',
  data: { key: 'value' }
});

// Suivre en utilisant une fonction (reçoit les informations de la page actuelle)
window.tianji.track((payload) => ({
  ...payload,
  name: 'dynamic-event',
  data: { timestamp: Date.now() }
}));
```

#### Identifier les Utilisateurs

Vous pouvez attacher des informations d'utilisateur aux sessions de suivi :

```javascript
window.tianji.identify({
  userId: 'user-123',
  email: 'user@example.com',
  plan: 'premium'
});
```

Ces informations seront associées aux événements suivants de cet utilisateur.


## Modifier le Nom par Défaut du Script

> Cette fonctionnalité est disponible à partir de la version v1.7.4+

Vous pouvez utiliser l'environnement `CUSTOM_TRACKER_SCRIPT_NAME` lorsque vous le démarrez.

par exemple :
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

puis vous pouvez accéder à votre script de suivi avec `"https://<votre-domaine-auto-hébergé>/my-tracker.js"`

Ceci est pour vous aider à éviter certains bloqueurs de publicités.

Vous n'avez pas besoin du suffixe `.js`. Cela peut être n'importe quel chemin que vous choisissez, vous pouvez même utiliser `CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"`

## Suivi Uniquement des Domaines Spécifiés

Généralement, le tracker signalera tous les événements où que votre site fonctionne. Mais parfois, nous devons ignorer des événements comme `localhost`.

Tianji fournit un attribut du script de suivi pour le faire.

Vous pouvez ajouter `data-domains` dans votre script. La valeur doit être vos domaines racine à suivre. Utilisez `,` pour séparer plusieurs domaines.

```html
<script async defer src="https://<votre-domaine-auto-hébergé>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

Ensuite, vous pourrez voir les événements provenant de ces domaines.
