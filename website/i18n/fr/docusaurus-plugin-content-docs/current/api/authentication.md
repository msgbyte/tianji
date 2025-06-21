---
sidebar_position: 2
_i18n_hash: a82bcf148feb70ec31d10a96cffc2795
---
# Authentification

Ce document fournit des instructions détaillées sur la manière de s'authentifier avec l'API Tianji, y compris l'obtention, l'utilisation et la gestion des clés API.

## Méthode d'authentification

L'API Tianji utilise l'authentification **Bearer Token**. Vous devez inclure votre clé API dans l'en-tête HTTP de chaque requête API.

### Format de l'en-tête HTTP

```http
Authorization: Bearer <VOTRE_CLÉ_API>
```

## Obtention des clés API

1. Connectez-vous à votre instance Tianji
2. Cliquez sur votre avatar dans le coin supérieur droit
3. Trouvez la section **Clés API**
4. Cliquez sur le bouton + pour créer une nouvelle clé API
5. Nommez votre clé API et enregistrez-la

## Gestion des clés API

### Voir les clés existantes

Dans la section **Clés API**, vous pouvez voir :
- Nom/description de la clé API
- Date de création
- Dernière utilisation
- Statistiques du nombre d'utilisations

### Supprimer des clés API

Si vous devez révoquer une clé API :
1. Trouvez la clé API que vous souhaitez supprimer
2. Cliquez sur le bouton **Supprimer**
3. Confirmez l'opération de suppression

:::warning Note
Après suppression d'une clé API, toutes les applications utilisant cette clé ne pourront plus accéder à l'API.
:::

## Utilisation des clés API

### Exemple cURL

```bash
curl -X GET "https://your-tianji-domain.com/open/global/config" \
  -H "Authorization: Bearer <your_api_key_here>" \
  -H "Content-Type: application/json"
```

### Exemple JavaScript/Node.js

```javascript
const apiKey = '<your_api_key_here>';
const baseUrl = 'https://your-tianji-domain.com/open';

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

api_key = '<your_api_key_here>'
base_url = 'https://your-tianji-domain.com/open'

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
$apiKey = '<your_api_key_here>';
$baseUrl = 'https://your-tianji-domain.com/open';

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

## Permissions et portée

### Permissions des clés API

Les clés API héritent de toutes les permissions de leur créateur, y compris :
- Accès à toutes les données dans les espaces de travail de l'utilisateur
- Exécuter toutes les opérations pour lesquelles l'utilisateur a la permission
- Gérer les ressources créées par cet utilisateur

### Accès aux espaces de travail

Les clés API ne peuvent accéder qu'aux espaces de travail auxquels l'utilisateur appartient. Si vous devez accéder à plusieurs espaces de travail, assurez-vous que votre compte utilisateur a les autorisations appropriées pour ces espaces.

## Gestion des erreurs

### Erreurs d'authentification courantes

#### 401 Non autorisé

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Autorisation non fournie"
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
    "message": "Accès insuffisant"
  }
}
```

**Causes** :
- Clé API invalide ou supprimée
- L'utilisateur n'a pas la permission d'accéder à la ressource demandée

### Débogage des problèmes d'authentification

1. **Vérifiez le format de la clé API** : Assurez-vous d'utiliser le format `Bearer token_ici`
2. **Vérifiez la validité de la clé** : Confirmez que la clé existe toujours dans l'interface Tianji
3. **Vérifiez les permissions** : Assurez-vous que le compte utilisateur a la permission d'accéder à la ressource cible
4. **Testez des points d'extrémité simples** : Commencez par tester des points d'extrémité publics comme `/global/config`
