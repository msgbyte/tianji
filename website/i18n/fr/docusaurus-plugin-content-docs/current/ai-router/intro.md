---
sidebar_position: 1
_i18n_hash: be40481b428c406d4fdaf208c202a926
---
# Routeur AI

Le routeur AI offre un point de terminaison stable pour un groupe de passerelles AI. Il achemine chaque requête à travers des itinéraires de passerelles configurés, répartit le trafic par pondération au sein du même niveau, et utilise le niveau suivant en cas d'échecs rechargeables.

À utiliser lorsque vous souhaitez :

- Un point de terminaison unique pour votre application au lieu de coder en dur un fournisseur AI.
- Un partage pondéré du trafic à travers plusieurs passerelles.
- Un basculement d'un fournisseur principal vers des fournisseurs de secours lors de pannes ou limites de taux.
- Un chemin de migration où vous pouvez déplacer le trafic progressivement en modifiant les pondérations.

## Relation avec la passerelle AI

La passerelle AI reste l'unité qui stocke les identifiants des fournisseurs, les URLs de base personnalisées, la tarification des modèles, les alertes de quotas et les journaux de passerelles. Le routeur AI ne la remplace pas.

Le routeur AI décide uniquement quel itinéraire de passerelle doit recevoir la requête.

Le flux d'exécution est :

1. Votre application appelle un point de terminaison du routeur AI.
2. Le routeur AI trouve le routeur par ID d'espace de travail et ID du routeur.
3. Le routeur AI choisit un itinéraire de passerelle éligible depuis le premier niveau.
4. La passerelle AI sélectionnée envoie la requête au fournisseur AI amont.
5. Si la tentative réussit, le routeur AI renvoie cette réponse.
6. Si la tentative échoue avec une erreur rechargeable, le routeur AI essaie un autre itinéraire dans le même niveau, puis au niveau suivant.

## Prérequis

Avant d'ajouter des itinéraires, créez au moins une passerelle AI avec une clé API de modèle stockée. Les passerelles sans clé stockée ne sont pas affichées dans le sélecteur d'itinéraire du routeur AI.

Les requêtes d'exécution nécessitent toujours une clé API Tianji :

- Pour les points de terminaison compatibles OpenAI, envoyez `Authorization: Bearer <YOUR_TIANJI_API_KEY>`.
- Pour les points de terminaison d'Anthropic Messages, envoyez `x-api-key: <YOUR_TIANJI_API_KEY>`.

Tianji vérifie la clé API de l'appelant, puis utilise la clé du fournisseur de passerelle AI stockée pour la requête montante.

## Créer un routeur

1. Ouvrir **Routeur AI** dans la barre latérale Tianji.
2. Cliquez sur **Ajouter un routeur AI**.
3. Entrez un nom de routeur.
4. Gardez **Activé** si le routeur doit accepter le trafic d'exécution.
5. Enregistrez le routeur.

Une fois le routeur créé, ouvrez l'onglet **Itinéraires** pour configurer les niveaux et les itinéraires de passerelle.

## Niveaux

Un niveau est un niveau de secours.

Les requêtes commencent toujours au premier niveau. Si un échec rechargeable survient, le routeur AI continue d'essayer les itinéraires éligibles dans ce niveau. Si tous les itinéraires éligibles du niveau échouent, le routeur AI passe au niveau suivant.

Utilisez plusieurs niveaux lorsque vous souhaitez un ordre de secours strict.

Exemple :

| Niveau | Itinéraires | Signification |
| --- | --- | --- |
| Niveau 1 | OpenAI principal, OpenRouter principal | Trafic de production normal |
| Niveau 2 | DeepSeek de secours | Secours après échec des fournisseurs principaux |
| Niveau 3 | Modèle interne personnalisé | Secours de dernier recours |

Faites glisser les niveaux pour les réorganiser. Le premier niveau est essayé en premier.

## Pondérations dans un niveau

Les itinéraires au sein du même niveau n'ont pas d'ordre fixe. Ils partagent le trafic par pondération.

Exemple :

| Itinéraire | Pondération | Part approximative de la première tentative |
| --- | ---: | ---: |
| Passerelle A | 80 | 80% |
| Passerelle B | 20 | 20% |

Cela est utile pour :

- Répartition aléatoire du trafic entre les fournisseurs.
- Migration progressive d'un fournisseur à un autre.
- Test d'une nouvelle passerelle avec un petit pourcentage de trafic.

Si vous avez besoin d'un ordre strict, placez les itinéraires dans des niveaux différents au lieu du même niveau.

## Ajouter un itinéraire de passerelle

Dans l'onglet **Itinéraires** :

1. Cliquez sur **Ajouter une passerelle** à l'intérieur d'un niveau.
2. Sélectionnez une passerelle AI existante.
3. Sélectionnez le mode fournisseur pour cet itinéraire.
4. Définissez les options d'itinéraire.
5. Sauvegardez.

Vous pouvez modifier ou supprimer un itinéraire plus tard depuis la carte de l'itinéraire.

### Fournisseur

Le fournisseur contrôle comment le routeur AI appelle la passerelle AI sélectionnée pour cet itinéraire. La même passerelle AI peut être utilisée dans différents itinéraires avec différents modes de fournisseur si cela correspond à votre configuration.

Valeurs de fournisseur supportées :

- `openai`
- `deepseek`
- `anthropic`
- `openrouter`
- `custom`

Pour `custom`, le routeur AI utilise les paramètres du modèle personnalisé stockés sur la passerelle AI sélectionnée, tels que l'URL de base personnalisée et le nom du modèle personnalisé.

### Pondération

La pondération contrôle comment le trafic est réparti entre les itinéraires dans le même niveau. Une pondération plus élevée signifie que l'itinéraire est plus susceptible d'être essayé en premier.

Par défaut : `100`.

### Remplacement du modèle

Le remplacement du modèle est optionnel.

Lorsqu'il est défini, le routeur AI remplace le `model` de la requête par cette valeur avant d'envoyer la requête à l'itinéraire de passerelle sélectionné. Laissez-le vide si la requête de l'application doit décider du modèle.

### Délai d'expiration

Le délai d'expiration est le temps maximum pour une tentative de passerelle.

Par défaut : `30000ms`.

Si la tentative expire, le routeur AI la considère comme rechargeable et peut essayer l'itinéraire éligible suivant.

### Codes d'état rechargeables

Le routeur AI considère toujours comme rechargeables les erreurs réseau, les délais d'expiration, et ces codes d'état :

- `429`
- `500`
- `502`
- `503`
- `504`

Utilisez **Codes d'état rechargeables** pour ajouter plus de codes d'état pour un itinéraire. Par exemple, vous pouvez ajouter `408` si un fournisseur signale souvent une expiration de requête comme une réponse HTTP.

Soyez prudent avec les erreurs de validation telles que `400` ou `401`. Celles-ci signifient généralement que la requête ou la clé est erronée, et réessayer un autre fournisseur peut cacher le vrai problème.

## Journaux

L'onglet **Journaux** montre les tentatives d'exécution pour un routeur :

- Statut : `Succès`, `Échec`, ou `Partiel`.
- Protocole : Protocole de requête correspondant.
- Tentatives : combien d'itinéraires de passerelle ont été essayés.
- Passerelle finale : La passerelle qui a produit le résultat final.
- Journal de la passerelle finale : L'ID de journal de passerelle AI lié.
- Durée.

Utilisez les journaux du routeur pour comprendre le comportement de basculement. Utilisez les journaux de passerelle AI liés pour inspecter l'utilisation des jetons, les détails du modèle amont, le coût et les données de réponse du fournisseur.
