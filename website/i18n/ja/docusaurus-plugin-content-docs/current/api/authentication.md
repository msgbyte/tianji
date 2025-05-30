---
sidebar_position: 2
_i18n_hash: f7563684ea7eed2924aecf5898530c93
---
# 認証

このドキュメントは、Tianji APIへの認証方法について、APIキーの取得、使用、管理を含めた詳細な手順を提供します。

## 認証方法

Tianji APIは**Bearer Token**認証を使用します。各APIリクエストのHTTPヘッダーにAPIキーを含める必要があります。

### HTTPヘッダーフォーマット

```http
Authorization: Bearer YOUR_API_KEY
```

## APIキーの取得

1. Tianjiインスタンスにログインします
2. 右上隅のアバターをクリックします
3. **APIキー**セクションを見つけます
4. 新しいAPIキーを作成するために+ボタンをクリックします
5. APIキーに名前を付けて保存します

## APIキー管理

### 既存のキーを表示

**APIキー**セクションで以下を確認できます：
- APIキー名/説明
- 作成日
- 最終使用時間
- 使用回数の統計

### APIキーの削除

APIキーを取り消す必要がある場合：
1. 削除したいAPIキーを見つけます
2. **削除**ボタンをクリックします
3. 削除操作を確認します

:::警告 注意
APIキーを削除すると、そのキーを使用している全てのアプリケーションはAPIにアクセスできなくなります。
:::

## APIキーの使用

### cURLの例

```bash
curl -X GET "https://your-tianji-domain.com/open/global/config" \
  -H "Authorization: Bearer <your_api_key_here>" \
  -H "Content-Type: application/json"
```

### JavaScript/Node.jsの例

```javascript
const apiKey = '<your_api_key_here>';
const baseUrl = 'https://your-tianji-domain.com/open';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

// fetchを使用
const response = await fetch(`${baseUrl}/global/config`, {
  method: 'GET',
  headers: headers
});

// axiosを使用
const axios = require('axios');
const response = await axios.get(`${baseUrl}/global/config`, {
  headers: headers
});
```

### Pythonの例

```python
import requests

api_key = '<your_api_key_here>'
base_url = 'https://your-tianji-domain.com/open'

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

# requestsライブラリを使用
response = requests.get(f'{base_url}/global/config', headers=headers)
data = response.json()
```

### PHPの例

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

## 権限とスコープ

### APIキーの権限

APIキーは作成者のすべての権限を継承します。以下が含まれます：
- ユーザーのワークスペース内のすべてのデータへのアクセス
- ユーザーが許可されたすべての操作の実行
- そのユーザーによって作成されたリソースの管理

### ワークスペースへのアクセス

APIキーは、ユーザーが所属するワークスペースにのみアクセスできます。複数のワークスペースにアクセスする必要がある場合、ユーザーアカウントがそれらのワークスペースの適切な権限を持っていることを確認してください。

## エラー処理

### 一般的な認証エラー

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authorization not provided"
  }
}
```

**原因**：
- Authorizationヘッダーが提供されていません
- 不正なAPIキー形式

#### 403 Forbidden

```json
{
  "error": {
    "code": "FORBIDDEN", 
    "message": "Insufficient access"
  }
}
```

**原因**：
- 無効または削除されたAPIキー
- ユーザーが要求されたリソースにアクセスする権限を持っていません

### 認証問題のデバッグ

1. **APIキー形式を確認**：`Bearer token_here`形式を使用していることを確認する
2. **キーの有効性を検証**：キーがTianjiインターフェースにまだ存在していることを確認する
3. **権限を確認**：ターゲットリソースにアクセスするためのユーザーアカウント権限があることを確認する
4. **簡単なエンドポイントをテスト**：まず、`/global/config`のようなパブリックエンドポイントをテストすることから始める
