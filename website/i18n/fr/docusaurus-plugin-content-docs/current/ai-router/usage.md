---
sidebar_position: 2
_i18n_hash: c5728e8d9970ba12114c782ea0f3f562
---
# Utilisation du routeur IA

Le Routeur IA expose des points d'accès compatibles avec OpenAI et Anthropic sur votre serveur Tianji :

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/<provider>/v1/...
```

Le segment `<provider>` doit correspondre au mode fournisseur que vous avez configuré sur la route.

## Points d'accès supportés

| Segment du fournisseur | Complétions de chat | Réponses | Messages Anthropic |
| --- | --- | --- | --- |
| `openai` | `/openai/v1/chat/completions` | `/openai/v1/responses` | - |
| `deepseek` | `/deepseek/v1/chat/completions` | - | - |
| `anthropic` | `/anthropic/v1/chat/completions` | - | `/anthropic/v1/messages` |
| `openrouter` | `/openrouter/v1/chat/completions` | - | `/openrouter/v1/messages` |
| `custom` | `/custom/v1/chat/completions` | `/custom/v1/responses` | `/custom/v1/messages` |

## Complétions de Chat OpenAI

URL de base pour le SDK OpenAI :

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1
```

Node.js :

```js
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.TIANJI_API_KEY,
  baseURL:
    'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1',
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Bonjour depuis Tianji AI Router' }],
});

console.log(response.choices[0].message);
```

cURL :

```bash
curl -X POST 'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_TIANJI_API_KEY>' \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": "Bonjour depuis Tianji AI Router"
      }
    ]
  }'
```

## Réponses OpenAI

URL de base pour le SDK OpenAI :

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1
```

Node.js :

```js
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.TIANJI_API_KEY,
  baseURL:
    'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1',
});

const response = await client.responses.create({
  model: 'gpt-4o',
  input: 'Rédigez une courte liste de vérification de déploiement.',
});

console.log(response.output_text);
```

cURL :

```bash
curl -X POST 'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1/responses' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_TIANJI_API_KEY>' \
  -d '{
    "model": "gpt-4o",
    "input": "Rédigez une courte liste de vérification de déploiement."
  }'
```

## Messages Anthropic

URL de base pour le SDK Anthropic :

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/anthropic
```

Node.js :

```js
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.TIANJI_API_KEY,
  baseURL:
    'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/anthropic',
});

const message = await client.messages.create({
  model: 'claude-opus-4-20250514',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Bonjour depuis Tianji AI Router' }],
});

console.log(message.content);
```

cURL :

```bash
curl -X POST 'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/anthropic/v1/messages' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: <YOUR_TIANJI_API_KEY>' \
  -H 'anthropic-version: 2023-06-01' \
  -d '{
    "model": "claude-opus-4-20250514",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": "Bonjour depuis Tianji AI Router"
      }
    ]
  }'
```

## Routes personnalisées du fournisseur

Utilisez le segment de fournisseur `custom` lorsque la passerelle IA sélectionnée stocke une URL de base ou un nom de modèle personnalisé.

Exemples :

```bash
/api/ai-router/<workspaceId>/<routerId>/custom/v1/chat/completions
/api/ai-router/<workspaceId>/<routerId>/custom/v1/responses
/api/ai-router/<workspaceId>/<routerId>/custom/v1/messages
```

Les détails des flux personnalisés sont conservés sur la passerelle IA. Le routeur IA ne fait que sélectionner la route et transmettre la requête normalisée.

## Modèles de routage recommandés

### Sauvegarde active

Utilisez cela lorsque la disponibilité est plus importante que la distribution du trafic.

| Niveau | Route | Poids |
| --- | --- | ---: |
| 1 | Passerelle OpenAI principale | 100 |
| 2 | Passerelle OpenRouter | 100 |
| 3 | Passerelle de secours personnalisée | 100 |

Le routeur IA essaiera le niveau 2 uniquement après que le niveau 1 retourne des échecs réessayables.

### Répartition pondérée

Utilisez cela lorsque vous souhaitez partager le trafic entre les fournisseurs en fonctionnement normal.

| Niveau | Route | Poids |
| --- | --- | ---: |
| 1 | Passerelle A | 80 |
| 1 | Passerelle B | 20 |

Les deux routes sont au même niveau, il n'y a donc pas d'ordre principal/secondaire. Les poids décident quelle route est susceptible d'être essayée en premier.

### Migration Canary

Utilisez cela lors du test d'un nouveau fournisseur.

| Niveau | Route | Poids |
| --- | --- | ---: |
| 1 | Fournisseur actuel | 95 |
| 1 | Nouveau fournisseur | 5 |
| 2 | Secours stable | 100 |

Augmentez le poids du nouveau fournisseur après avoir confirmé la qualité et la fiabilité dans les journaux.

## Dépannage

### Aucun nœud de routeur IA éligible n'est disponible

Vérifiez que :

- Le routeur est activé.
- Au moins un niveau a des routes activées.
- La passerelle IA sélectionnée a toujours une clé API de modèle enregistrée.
- Le fournisseur de route prend en charge le point d'accès que vous appelez.

### Le routeur s'arrête après un échec

Le routeur IA ne continue qu'après des échecs réessayables.

Les erreurs réseau, les délais d'attente, `429`, `500`, `502`, `503` et `504` sont réessayables par défaut. Ajoutez des codes d'état réessayables spécifiques à la route si un fournisseur utilise d'autres codes de défaillance temporaires.

### Le mauvais modèle est utilisé

Vérifiez les deux endroits suivants :

- Remplacement du modèle de route. S'il est défini, il remplace le `model` de la requête.
- Nom de modèle personnalisé de la passerelle IA. Pour les routes `custom`, la passerelle peut remplacer le modèle par son nom de modèle personnalisé.

### La requête retourne 401 ou 403

Utilisez une clé API Tianji dans la requête d'exécution. Ne transmettez pas la clé du fournisseur en amont au routeur IA lorsque la passerelle stocke ses propres identifiants du fournisseur.

Pour les points d'accès compatibles OpenAI, utilisez :

```bash
Authorization: Bearer <YOUR_TIANJI_API_KEY>
```

Pour les points d'accès Messages Anthropic, utilisez :

```bash
x-api-key: <YOUR_TIANJI_API_KEY>
```
