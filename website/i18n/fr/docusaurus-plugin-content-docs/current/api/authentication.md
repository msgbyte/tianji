---
sidebar_position: 2
_i18n_hash: f7563684ea7eed2924aecf5898530c93
---
# Authentification

Ce document fournit des instructions détaillées sur la façon de s'authentifier avec l'API Tianji, y compris l'obtention, l'utilisation et la gestion des clés API.

## Méthode d'authentification

L'API Tianji utilise l'authentification par **jeton Bearer**. Vous devez inclure votre clé API dans l'en-tête HTTP de chaque requête API.

### Format d'en-tête HTTP

```http
Authorization: Bearer VOTRE_CLÉ_API
```

## Obtention des clés API

1. Connectez-vous à votre instance Tianji
2. Cliquez sur votre avatar en haut à droite
4. Trouvez la section **Clés API**
5. Cliquez sur le bouton + pour créer une nouvelle clé API
6. Nommez votre clé API et enregistrez-la

## Gestion des clés API

### Voir les clés existantes

Dans la section **Clés API**, vous pouvez voir :
- Nom/description de la clé API
- Date de création
- Dernière utilisation
- Statistiques de compte d'utilisation

### Supprimer des clés API

Si vous devez révoquer une clé API :
1. Trouvez la clé API que vous souhaitez supprimer
2. Cliquez sur le bouton **Supprimer**
3. Confirmez l'opération de suppression

:::warning Note
Après la suppression d'une clé API, toutes les applications utilisant cette clé ne pourront plus accéder à l'API.
:::

## Utilisation des clés API

### Exemple cURL

```bash
curl -X GET "https://votre-domaine-tianji.com/open/global/config" \
  -H "Authorization: Bearer <votre_clé_api_ici>" \
  -H "Content-Type: application/json"
```

### Exemple JavaScript/Node.js

```javascript
const apiKey = '<votre_clé_api_ici>';
const baseUrl = 'https://votre-domaine-tianji.com/open';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

// Utilisation de fetch
const response = await fetch(`${baseUrl}/global/config`, {
  method: 'GET',
  headers: headers
});

// Utilisation de axios
const axios = require('axios');
const response = await axios.get(`${baseUrl}/global/config`, {
  headers: headers
});
```

### Exemple Python

```python
import requests

api_key = '<votre_clé_api_ici>'
base_url = 'https://votre-domaine-tianji.com/open'

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

# Utilisation de la bibliothèque requests
response = requests.get(f'{base_url}/global/config', headers=headers)
data = response.json()
```

### Exemple PHP

```php
<?php
$apiKey = '<votre_clé_api_ici>';
$baseUrl = 'https://votre-domaine-tianji.com/open';

$headers = [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/global/config');
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
?>
```

## Permissions et Champ d'application

### Permissions des clés API

Les clés API héritent de toutes les permissions de leur créateur, y compris :
- Accès à toutes les données des espaces de travail de l'utilisateur
- Exécuter toutes les opérations pour lesquelles l'utilisateur a la permission
- Gérer les ressources créées par cet utilisateur

### Accès à l'espace de travail

Les clés API ne peuvent accéder qu'aux espaces de travail auxquels l'utilisateur appartient. Si vous devez accéder à plusieurs espaces de travail, assurez-vous que votre compte utilisateur dispose des autorisations appropriées pour ces espaces de travail.

## Gestion des erreurs

### Erreurs d'authentification courantes

#### 401 Non autorisé

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authorization not provided"
  }
}
```

**Causes** :
- Aucun en-tête d'autorisation fourni
- Format de clé API incorrect

#### 403 Interdit

```json
{
  "error": {
    "code": "FORBIDDEN", 
    "message": "Insufficient access"
  }
}
```

**Causes** :
- Clé API invalide ou supprimée
- L'utilisateur n'a pas la permission d'accéder à la ressource demandée

### Débogage des problèmes d'authentification

1. **Vérifiez le format de la clé API** : Assurez-vous d'utiliser le format `Bearer token_ici`
2. **Vérifiez la validité de la clé** : Confirmez que la clé existe toujours dans l'interface Tianji
3. **Vérifiez les permissions** : Assurez-vous que le compte utilisateur a l'autorisation d'accéder à la ressource cible
4. **Testez des points de terminaison simples** : Commencez par tester des points de terminaison publics comme `/global/config`
