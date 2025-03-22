---
sidebar_position: 1
_i18n_hash: ae151f338aa838eaab15a19bfea78d7f
---
# Suivi des Applications

Tianji fournit un SDK puissant pour suivre les événements et le comportement des utilisateurs dans vos applications. Ce guide explique comment intégrer et utiliser le SDK de Suivi d'Applications dans vos projets.

## Installation

Installez le SDK react native de Tianji dans votre projet :

```bash
npm install tianji-react-native
# ou
yarn add tianji-react-native
# ou
pnpm add tianji-react-native
```

## Initialisation

Avant d'utiliser les fonctionnalités de suivi, vous devez initialiser le SDK d'Application avec l'URL de votre serveur Tianji et l'ID de votre application :

```ts
import { initApplication } from 'tianji-react-native';

initApplication({
  serverUrl: 'https://tianji.example.com',  // Votre URL de serveur Tianji
  applicationId: 'votre-id-application'     // Votre identifiant d'application
});
```

## Suivi des Événements

Vous pouvez suivre des événements personnalisés dans votre application pour surveiller les actions et comportements des utilisateurs :

```ts
import { reportApplicationEvent } from 'tianji-react-native';

// Suivre un événement simple
reportApplicationEvent('Clic sur le bouton');

// Suivre un événement avec des données supplémentaires
reportApplicationEvent('Achat complété', {
  productId: 'produit-123',
  price: 29.99,
  currency: 'USD'
});
```

## Suivi des Écrans

Suivez les vues des écrans dans votre application pour comprendre les schémas de navigation des utilisateurs :

### Définir l'Écran Actuel

Vous pouvez définir l'information de l'écran actuel qui sera incluse dans les événements suivants :

```ts
import { updateCurrentApplicationScreen } from 'tianji-react-native';

// Mettre à jour l'écran actuel lorsque l'utilisateur navigue
updateCurrentApplicationScreen('DétailsDuProduit', { productId: 'produit-123' });
```

### Reporting des Vues d'Écran

Rapportez explicitement les événements de vue d'écran :

```ts
import { reportApplicationScreenView } from 'tianji-react-native';

// Rapporter la vue de l'écran actuel
reportApplicationScreenView();

// Ou rapporter une vue d'écran spécifique
reportApplicationScreenView('Commande', { cartItems: 3 });
```

## Identification des Utilisateurs

Identifiez les utilisateurs dans votre application pour suivre leur comportement à travers les sessions :

```ts
import { identifyApplicationUser } from 'tianji-react-native';

// Identifier un utilisateur avec leurs informations
identifyApplicationUser({
  id: 'utilisateur-123',    // Identifiant unique de l'utilisateur
  email: 'utilisateur@exemple.com',
  name: 'John Doe',
  // Ajouter d'autres propriétés utilisateur
  plan: 'premium',
  signupDate: '2023-01-15'
});
```

## Référence API

### `initApplication(options)`

Initialise le SDK de suivi d'application.

**Paramètres :**

- `options`: ApplicationTrackingOptions
  - `serverUrl`: URL de votre serveur Tianji (ex. 'https://tianji.example.com')
  - `applicationId`: Identifiant de votre application

### `reportApplicationEvent(eventName, eventData?, screenName?, screenParams?)`

Envoie un événement d'application au serveur Tianji.

**Paramètres :**

- `eventName`: Nom de l'événement (max 50 caractères)
- `eventData`: (Optionnel) Objet de données d'événement
- `screenName`: (Optionnel) Nom de l'écran pour remplacer l'écran actuel
- `screenParams`: (Optionnel) Paramètres de l'écran pour remplacer les paramètres d'écran actuels

### `updateCurrentApplicationScreen(name, params)`

Met à jour l'information de l'écran d'application actuel.

**Paramètres :**

- `name`: Nom de l'écran
- `params`: Objet des paramètres de l'écran

### `reportApplicationScreenView(screenName?, screenParams?)`

Envoie un événement de vue d'écran au serveur Tianji.

**Paramètres :**

- `screenName`: (Optionnel) Nom de l'écran pour remplacer l'écran actuel
- `screenParams`: (Optionnel) Paramètres de l'écran pour remplacer les paramètres d'écran actuels

### `identifyApplicationUser(userInfo)`

Identifie un utilisateur dans l'application.

**Paramètres :**

- `userInfo`: Objet de données d'identification utilisateur

## Limites de Chargement

- Information de langue : max 35 caractères
- Information du système d'exploitation : max 20 caractères
- Information URL : max 500 caractères
- Nom de l'événement : max 50 caractères
