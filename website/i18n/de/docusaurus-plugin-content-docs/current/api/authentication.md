---
sidebar_position: 2
_i18n_hash: f7563684ea7eed2924aecf5898530c93
---
# Authentifizierung

Dieses Dokument bietet detaillierte Anweisungen zur Authentifizierung mit der Tianji-API, einschließlich des Erhalts, der Verwendung und Verwaltung von API-Schlüsseln.

## Authentifizierungsmethode

Die Tianji-API verwendet die **Bearer-Token**-Authentifizierung. Sie müssen Ihren API-Schlüssel im HTTP-Header jeder API-Anfrage einschließen.

### HTTP-Header-Format

```http
Authorization: Bearer YOUR_API_KEY
```

## Erhalt von API-Schlüsseln

1. Melden Sie sich bei Ihrer Tianji-Instanz an
2. Klicken Sie auf Ihr Avatar in der oberen rechten Ecke
4. Suchen Sie den Abschnitt **API-Schlüssel**
5. Klicken Sie auf die + Taste, um einen neuen API-Schlüssel zu erstellen
6. Benennen Sie Ihren API-Schlüssel und speichern Sie ihn

## Verwaltung von API-Schlüsseln

### Bestehende Schlüssel anzeigen

Im Abschnitt **API-Schlüssel** können Sie sehen:
- API-Schlüsselname/Beschreibung
- Erstellungsdatum
- Zuletzt verwendete Uhrzeit
- Nutzungsstatistiken

### API-Schlüssel löschen

Wenn Sie einen API-Schlüssel widerrufen müssen:
1. Finden Sie den API-Schlüssel, den Sie löschen möchten
2. Klicken Sie auf die Schaltfläche **Löschen**
3. Bestätigen Sie den Löschvorgang

:::warnung Hinweis
Nach dem Löschen eines API-Schlüssels können alle Anwendungen, die diesen Schlüssel verwenden, nicht mehr auf die API zugreifen.
:::

## Verwendung von API-Schlüsseln

### cURL-Beispiel

```bash
curl -X GET "https://your-tianji-domain.com/open/global/config" \
  -H "Authorization: Bearer <your_api_key_here>" \
  -H "Content-Type: application/json"
```

### JavaScript/Node.js-Beispiel

```javascript
const apiKey = '<your_api_key_here>';
const baseUrl = 'https://your-tianji-domain.com/open';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

// Verwenden von fetch
const response = await fetch(`${baseUrl}/global/config`, {
  method: 'GET',
  headers: headers
});

// Verwenden von axios
const axios = require('axios');
const response = await axios.get(`${baseUrl}/global/config`, {
  headers: headers
});
```

### Python-Beispiel

```python
import requests

api_key = '<your_api_key_here>'
base_url = 'https://your-tianji-domain.com/open'

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

# Verwendung der requests-Bibliothek
response = requests.get(f'{base_url}/global/config', headers=headers)
data = response.json()
```

### PHP-Beispiel

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

## Berechtigungen und Umfang

### API-Schlüssel-Berechtigungen

API-Schlüssel erben alle Berechtigungen ihres Erstellers, einschließlich:
- Zugriff auf alle Daten in den Arbeitsbereichen des Benutzers
- Ausführung aller Operationen, für die der Benutzer Berechtigungen hat
- Verwaltung von Ressourcen, die von diesem Benutzer erstellt wurden

### Zugriff auf Arbeitsbereiche

API-Schlüssel können nur auf Arbeitsbereiche zugreifen, denen der Benutzer angehört. Wenn Sie auf mehrere Arbeitsbereiche zugreifen müssen, stellen Sie sicher, dass Ihr Benutzerkonto über die entsprechenden Berechtigungen für diese Arbeitsbereiche verfügt.

## Fehlerbehandlung

### Häufige Authentifizierungsfehler

#### 401 Unauthorisiert

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authorization not provided"
  }
}
```

**Ursachen**:
- Kein Autorisierungsheader bereitgestellt
- Falsches API-Schlüsselformat

#### 403 Verboten

```json
{
  "error": {
    "code": "FORBIDDEN", 
    "message": "Insufficient access"
  }
}
```

**Ursachen**:
- Ungültiger oder gelöschter API-Schlüssel
- Benutzer hat keine Berechtigung für den Zugriff auf die angeforderte Ressource

### Debugging von Authentifizierungsproblemen

1. **Prüfen Sie das API-Schlüsselformat**: Stellen Sie sicher, dass Sie das Format `Bearer token_here` verwenden
2. **Überprüfen Sie die Schlüsselgültigkeit**: Bestätigen Sie, dass der Schlüssel noch in der Tianji-Oberfläche vorhanden ist
3. **Überprüfen Sie die Berechtigungen**: Stellen Sie sicher, dass das Benutzerkonto Berechtigungen für den Zugriff auf die Zielressource hat
4. **Testen Sie einfache Endpunkte**: Beginnen Sie mit dem Testen öffentlicher Endpunkte wie `/global/config`
