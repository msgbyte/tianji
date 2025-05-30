---
sidebar_position: 2
_i18n_hash: 0ab5a3f0d3e61495d00a9489e9a3f806
---
# Moniteur de Push

Le moniteur de push est une méthode de surveillance où votre application envoie activement des signaux de battement de cœur à **Tianji** au lieu que Tianji vérifie votre service. Cela est particulièrement utile pour surveiller les tâches en arrière-plan, les tâches planifiées ou les services derrière des pare-feux qui ne peuvent pas être accessibles directement.

## Comment cela fonctionne

1. **Tianji** vous fournit une URL de point de terminaison de push unique
2. Votre application envoie des requêtes HTTP POST à ce point de terminaison à intervalles réguliers
3. Si aucun battement de cœur n'est reçu dans le délai d'attente configuré, Tianji déclenche une alerte

## Configuration

Lors de la création d'un moniteur de push, vous devez configurer :

- **Nom du moniteur** : Un nom descriptif pour votre moniteur
- **Délai d'attente** : Le temps maximum (en secondes) à attendre entre les battements de cœur avant de considérer le service comme étant en panne
- **Intervalle recommandé** : La fréquence à laquelle votre application doit envoyer des battements de cœur (généralement la même que le délai d'attente)

## Format du point de terminaison de push

```
POST https://tianji.example.com/api/push/{pushToken}
```

### Paramètres de statut

- **Statut normal** : Envoyer sans paramètres ou avec `?status=up`
- **Statut en panne** : Envoyer avec `?status=down` pour déclencher manuellement une alerte
- **Message personnalisé** : Ajouter `&msg=votre-message` pour inclure des informations supplémentaires
- **Valeur personnalisée** : Ajouter `&value=123` pour suivre des valeurs numériques

## Exemples

### Battement de cœur de base (cURL)

```bash
# Envoyer un battement de cœur toutes les 60 secondes
while true; do
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>"
  sleep 60
done
```

### JavaScript/Node.js

```javascript
// Envoyer un battement de cœur toutes les 60 secondes
setInterval(async () => {
  try {
    await fetch('https://tianji.example.com/api/push/<your-push-token>', { 
      method: 'POST' 
    });
    console.log('Battement de cœur envoyé avec succès');
  } catch (error) {
    console.error('Échec de l’envoi du battement de cœur :', error);
  }
}, 60000);
```

### Python

```python
import requests
import time

def send_heartbeat():
    try:
        response = requests.post('https://tianji.example.com/api/push/<your-push-token>')
        print('Battement de cœur envoyé avec succès')
    except Exception as e:
        print(f'Échec de l’envoi du battement de cœur : {e}')

# Envoyer un battement de cœur toutes les 60 secondes
while True:
    send_heartbeat()
    time.sleep(60)
```

## Cas d'utilisation

### 1. Tâches planifiées

Surveiller l'exécution des tâches planifiées :

```bash
#!/bin/bash
# your-cron-job.sh

# Votre logique de travail réelle ici
./run-backup.sh

# Envoyer un signal de succès
if [ $? -eq 0 ]; then
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>?status=up&msg=backup-completed"
else
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>?status=down&msg=backup-failed"
fi
```

### 2. Services en arrière-plan

Surveiller les processus de fond de longue durée :

```python
import requests
import time
import threading

class ServiceMonitor:
    def __init__(self, push_url):
        self.push_url = push_url
        self.running = True
        
    def start_heartbeat(self):
        def heartbeat_loop():
            while self.running:
                try:
                    requests.post(self.push_url)
                    time.sleep(30)  # Envoyer toutes les 30 secondes
                except Exception as e:
                    print(f"Échec du battement de cœur : {e}")
        
        thread = threading.Thread(target=heartbeat_loop)
        thread.daemon = True
        thread.start()

# Utilisation
monitor = ServiceMonitor('https://tianji.example.com/api/push/<your-push-token>')
monitor.start_heartbeat()

# Votre logique principale de service ici
while True:
    # Faites votre travail
    time.sleep(1)
```

### 3. Tâches de synchronisation de base de données

Surveiller les tâches de synchronisation de données :

```python
import requests
import schedule
import time

def sync_data():
    try:
        # Votre logique de synchronisation de données ici
        result = perform_data_sync()
        
        if result.success:
            requests.post(
                'https://tianji.example.com/api/push/<your-push-token>',
                params={'status': 'up', 'msg': f'synced-{result.records}-records'}
            )
        else:
            requests.post(
                'https://tianji.example.com/api/push/<your-push-token>',
                params={'status': 'down', 'msg': 'sync-failed'}
            )
    except Exception as e:
        requests.post(
            'https://tianji.example.com/api/push/<your-push-token>',
            params={'status': 'down', 'msg': f'erreur-{str(e)}'}
        )

# Programmer pour exécuter toutes les heures
schedule.every().hour.do(sync_data)

while True:
    schedule.run_pending()
    time.sleep(1)
```

## Meilleures pratiques

1. **Définir des délais d'attente appropriés** : Configurez les valeurs de délai d'attente en fonction des besoins de votre application. Pour les tâches fréquentes, utilisez des délais d'attente courts. Pour les tâches périodiques, utilisez des délais d'attente plus longs.

2. **Gérer les pannes de réseau** : Mettez en œuvre une logique de nouvelle tentative dans votre code de battement de cœur pour gérer les problèmes de réseau temporaires.

3. **Utiliser des messages significatifs** : Incluez des messages descriptifs avec vos battements de cœur pour fournir du contexte lors de l'examen des journaux.

4. **Surveiller les chemins critiques** : Placez des appels de battement de cœur à des points critiques dans le flux de votre application, pas seulement au début.

5. **Gestion des exceptions** : Envoyez un statut "en panne" lorsqu'une exception se produit dans votre application.

## Dépannage

### Problèmes courants

**Aucun battement de cœur reçu** :
- Vérifiez que le jeton de push est correct
- Vérifiez la connectivité réseau de votre application vers Tianji
- Assurez-vous que votre application exécute effectivement le code de battement de cœur

**Fausse alerte fréquente** :
- Augmentez la valeur de délai d'attente
- Vérifiez si votre application rencontre des problèmes de performance
- Vérifiez la stabilité du réseau entre votre application et Tianji

**Battements de cœur manquants** :
- Ajoutez une gestion des erreurs et des journaux à votre code de battement de cœur
- Envisagez de mettre en œuvre une logique de nouvelle tentative pour les requêtes échouées
- Surveillez l'utilisation des ressources de votre application

## Considérations de sécurité

- Gardez vos jetons de push sécurisés et ne les exposez pas dans des dépôts publics
- Utilisez des points de terminaison HTTPS pour chiffrer les données en transit
- Envisagez de faire tourner les jetons de push périodiquement
- Limitez la fréquence des battements de cœur pour éviter de surcharger votre instance Tianji

La surveillance par push offre un moyen fiable de surveiller les services que la surveillance traditionnelle basée sur le ping ne peut pas atteindre, en faisant un outil essentiel pour une surveillance d'infrastructure complète.
