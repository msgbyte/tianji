---
sidebar_position: 1
_i18n_hash: fbe38264a49d1d3af45c4417fdc9a108
---
# Suivi d'Application

Tianji fournit un puissant SDK pour le suivi des événements et du comportement des utilisateurs dans vos applications. Ce guide explique comment intégrer et utiliser le SDK de suivi d'application dans vos projets.

## Installation

Installez le SDK Tianji react native dans votre projet :

```bash
npm install tianji-react-native
# ou
yarn add tianji-react-native
# ou
pnpm add tianji-react-native
```

## Initialisation

Avant d'utiliser les fonctionnalités de suivi, vous devez initialiser le SDK d'application avec l'URL de votre serveur Tianji et l'ID de votre application :

```ts
import { initApplication } from 'tianji-react-native';

initApplication({
  serverUrl: 'https://tianji.example.com',  // Votre URL du serveur Tianji
  applicationId: 'votre-id-application'     // Identifiant de votre application
});
```

## Suivi des Événements

Vous pouvez suivre des événements personnalisés dans votre application pour surveiller les actions et comportements des utilisateurs :

```ts
import { reportApplicationEvent } from 'tianji-react-native';

// Suivre un événement simple
reportApplicationEvent('Button Clicked');

// Suivre un événement avec des données supplémentaires
reportApplicationEvent('Purchase Completed', {
  productId: 'product-123',
  price: 29.99,
  currency: 'USD'
});
```

## Suivi des Écrans

Suivez les vues des écrans dans votre application pour comprendre les schémas de navigation des utilisateurs :

### Définir l'Écran Actuel

Vous pouvez définir les informations de l'écran actuel qui seront incluses dans les événements suivants :

```ts
import { updateCurrentApplicationScreen } from 'tianji-react-native';

// Mettre à jour l'écran actuel lorsque l'utilisateur navigue
updateCurrentApplicationScreen('ProductDetails', { productId: 'product-123' });
```

### Compte Rendu des Vues d'Écran

Rapportez explicitement les événements de vue d'écran :

```ts
import { reportApplicationScreenView } from 'tianji-react-native';

// Rapport sur la vue de l'écran actuel
reportApplicationScreenView();

// Ou rapport sur une vue d'écran spécifique
reportApplicationScreenView('Checkout', { cartItems: 3 });
```

#### Intégration avec expo-router

```tsx
import { useGlobalSearchParams, usePathname } from 'expo-router'
import { reportApplicationScreenView } from 'tianji-react-native'

function App() {
  const pathname = usePathname()
  const params = useGlobalSearchParams()

  useEffect(() => {
    reportApplicationScreenView(pathname, params)
  }, [pathname, params])
}
```

## Identification de l'Utilisateur

Identifiez les utilisateurs dans votre application pour suivre leur comportement à travers les sessions :

```ts
import { identifyApplicationUser } from 'tianji-react-native';

// Identifiez un utilisateur avec ses informations
identifyApplicationUser({
  id: 'user-123',          // Identifiant unique de l'utilisateur
  email: 'user@example.com',
  name: 'John Doe',
  // Ajoutez d'autres propriétés utilisateur
  plan: 'premium',
  signupDate: '2023-01-15'
});
```

## Référence API

### `initApplication(options)`

Initialise le SDK de suivi d'application.

**Paramètres :**

- `options`: ApplicationTrackingOptions
  - `serverUrl`: Votre URL du serveur Tianji (ex : 'https://tianji.example.com')
  - `applicationId`: Identifiant de votre application

### `reportApplicationEvent(eventName, eventData?, screenName?, screenParams?)`

Envoie un événement d'application au serveur Tianji.

**Paramètres :**

- `eventName`: Nom de l'événement (max 50 caractères)
- `eventData`: (Optionnel) Objet de données de l'événement
- `screenName`: (Optionnel) Nom de l'écran pour remplacer l'écran actuel
- `screenParams`: (Optionnel) Paramètres de l'écran pour remplacer les paramètres de l'écran actuel

### `updateCurrentApplicationScreen(name, params)`

Met à jour les informations de l'écran de l'application actuelle.

**Paramètres :**

- `name`: Nom de l'écran
- `params`: Objet des paramètres de l'écran

### `reportApplicationScreenView(screenName?, screenParams?)`

Envoie un événement de vue d'écran au serveur Tianji.

**Paramètres :**

- `screenName`: (Optionnel) Nom de l'écran pour remplacer l'écran actuel
- `screenParams`: (Optionnel) Paramètres de l'écran pour remplacer les paramètres de l'écran actuel

### `identifyApplicationUser(userInfo)`

Identifie un utilisateur dans l'application.

**Paramètres :**

- `userInfo`: Objet de données d'identification de l'utilisateur

## Limitations des Charges Utiles

- Informations sur la langue : max 35 caractères
- Informations sur le système d'exploitation : max 20 caractères
- Informations sur l'URL : max 500 caractères
- Nom de l'événement : max 50 caractères
