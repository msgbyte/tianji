---
sidebar_position: 2
---

# Authentication

This document provides detailed instructions on how to authenticate with the Tianji API, including obtaining, using, and managing API keys.

## Authentication Method

The Tianji API uses **Bearer Token** authentication. You need to include your API key in the HTTP header of each API request.

### HTTP Header Format

```http
Authorization: Bearer <YOUR_API_KEY>
```

## Obtaining API Keys

1. Log in to your Tianji instance
2. Click on your avatar in the top right corner
4. Find the **API Keys** section
5. Click the + button to create a new API key
6. Name your API key and save it

## API Key Management

### View Existing Keys

In the **API Keys** section, you can see:
- API key name/description
- Creation date
- Last used time
- Usage count statistics

### Delete API Keys

If you need to revoke an API key:
1. Find the API key you want to delete
2. Click the **Delete** button
3. Confirm the deletion operation

:::warning Note
After deleting an API key, all applications using that key will no longer be able to access the API.
:::

## Using API Keys

### cURL Example

```bash
curl -X GET "https://your-tianji-domain.com/open/global/config" \
  -H "Authorization: Bearer <your_api_key_here>" \
  -H "Content-Type: application/json"
```

### JavaScript/Node.js Example

```javascript
const apiKey = '<your_api_key_here>';
const baseUrl = 'https://your-tianji-domain.com/open';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

// Using fetch
const response = await fetch(`${baseUrl}/global/config`, {
  method: 'GET',
  headers: headers
});

// Using axios
const axios = require('axios');
const response = await axios.get(`${baseUrl}/global/config`, {
  headers: headers
});
```

### Python Example

```python
import requests

api_key = '<your_api_key_here>'
base_url = 'https://your-tianji-domain.com/open'

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

# Using requests library
response = requests.get(f'{base_url}/global/config', headers=headers)
data = response.json()
```

### PHP Example

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

## Permissions and Scope

### API Key Permissions

API keys inherit all permissions of their creator, including:
- Access to all data in the user's workspaces
- Execute all operations the user has permission for
- Manage resources created by that user

### Workspace Access

API keys can only access workspaces that the user belongs to. If you need to access multiple workspaces, ensure your user account has appropriate permissions for those workspaces.

## Error Handling

### Common Authentication Errors

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authorization not provided"
  }
}
```

**Causes**:
- No Authorization header provided
- Incorrect API key format

#### 403 Forbidden

```json
{
  "error": {
    "code": "FORBIDDEN", 
    "message": "Insufficient access"
  }
}
```

**Causes**:
- Invalid or deleted API key
- User doesn't have permission to access the requested resource

### Debugging Authentication Issues

1. **Check API key format**: Ensure you're using the `Bearer token_here` format
2. **Verify key validity**: Confirm the key still exists in the Tianji interface
3. **Check permissions**: Ensure the user account has permission to access the target resource
4. **Test simple endpoints**: Start by testing public endpoints like `/global/config`
