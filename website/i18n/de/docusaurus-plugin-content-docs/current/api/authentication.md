---
sidebar_position: 2
_i18n_hash: a82bcf148feb70ec31d10a96cffc2795
---
# Authentifizierung

Dieses Dokument bietet detaillierte Anweisungen, wie Sie sich mit der Tianji API authentifizieren, einschließlich des Erhaltens, Verwaltens und Verwendens von API-Schlüsseln.

## Authentifizierungsmethode

Die Tianji API verwendet die **Bearer Token**-Authentifizierung. Sie müssen Ihren API-Schlüssel im HTTP-Header jeder API-Anfrage einfügen.

### HTTP-Header-Format

```http
Authorization: Bearer <YOUR_API_KEY>
```

## Erhalt von API-Schlüsseln

1. Melden Sie sich bei Ihrem Tianji-Instanz an
2. Klicken Sie in der oberen rechten Ecke auf Ihr Avatar
3. Finden Sie den Abschnitt **API-Schlüssel**
4. Klicken Sie auf die Schaltfläche +, um einen neuen API-Schlüssel zu erstellen
5. Benennen Sie Ihren API-Schlüssel und speichern Sie ihn

## Verwaltung von API-Schlüsseln

### Vorhandene Schlüssel ansehen

Im Abschnitt **API-Schlüssel** können Sie Folgendes sehen:
- Name/Beschreibung des API-Schlüssels
- Erstellungsdatum
- Zeitpunkt der letzten Verwendung
- Nutzungshäufigkeitsstatistiken

### API-Schlüssel löschen

Wenn Sie einen API-Schlüssel widerrufen müssen:
1. Finden Sie den API-Schlüssel, den Sie löschen möchten
2. Klicken Sie auf die Schaltfläche **Löschen**
3. Bestätigen Sie den Löschvorgang

:::Warnung Hinweis
Nach dem Löschen eines API-Schlüssels können alle Anwendungen, die diesen Schlüssel verwenden, nicht mehr auf die API zugreifen.
:::

## Verwendung von API-Schlüsseln

### cURL Beispiel

```bash
curl -X GET "https://your-tianji-domain.com/open/global/config" \
  -H "Authorization: Bearer <your_api_key_here>" \
  -H "Content-Type: application/json"
```

### JavaScript/Node.js Beispiel

```javascript
const apiKey = '<your_api_key_here>';
const baseUrl = 'https://your-tianji-domain.com/open';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

// Verwendung von fetch
const response = await fetch(`${baseUrl}/global/config`, {
  method: 'GET',
  headers: headers
});

// Verwendung von axios
const axios = require('axios');
const response = await axios.get(`${baseUrl}/global/config`, {
  headers: headers
});
```

### Python Beispiel

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

### PHP Beispiel

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
- Ausführung aller Operationen, für die der Benutzer berechtigt ist
- Verwaltung der vom Benutzer erstellten Ressourcen

### Zugang zu Arbeitsbereichen

API-Schlüssel können nur auf Arbeitsbereiche zugreifen, denen der Benutzer angehört. Wenn Sie Zugriff auf mehrere Arbeitsbereiche benötigen, stellen Sie sicher, dass Ihr Benutzerkonto die entsprechenden Berechtigungen für diese Arbeitsbereiche hat.

## Fehlerbehandlung

### Häufige Authentifizierungsfehler

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authorization not provided"
  }
}
```

**Ursachen**:
- Kein Authorization-Header bereitgestellt
- Falsches API-Schlüsselformat

#### 403 Forbidden

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
- Der Benutzer hat keine Berechtigung, auf die angeforderte Ressource zuzugreifen

### Debugging von Authentifizierungsproblemen

1. **Überprüfen Sie das API-Schlüsselformat**: Stellen Sie sicher, dass Sie das Format `Bearer token_here` verwenden
2. **Schlüsselgültigkeit überprüfen**: Bestätigen Sie, dass der Schlüssel in der Tianji-Schnittstelle noch vorhanden ist
3. **Berechtigungen überprüfen**: Stellen Sie sicher, dass das Benutzerkonto berechtigt ist, auf die Zielressource zuzugreifen
4. **Einfache Endpunkte testen**: Beginnen Sie mit dem Testen öffentlicher Endpunkte wie `/global/config`
