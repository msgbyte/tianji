---
sidebar_position: 2
_i18n_hash: a82bcf148feb70ec31d10a96cffc2795
---
# 認証

このドキュメントは、Tianji APIとの認証方法について、APIキーの取得、使用、管理を含めて詳細に説明します。

## 認証方法

Tianji APIは**Bearer Token**認証を使用します。各APIリクエストのHTTPヘッダーにAPIキーを含める必要があります。

### HTTPヘッダーフォーマット

```http
Authorization: Bearer <YOUR_API_KEY>
```

## APIキーの取得

1. Tianjiインスタンスにログイン
2. 右上のアバターをクリック
4. **APIキー**セクションを見つける
5. +ボタンをクリックして新しいAPIキーを作成
6. APIキーに名前を付けて保存

## APIキー管理

### 既存のキーの表示

**APIキー**セクションでは以下が表示されます：
- APIキーの名前/説明
- 作成日
- 最終使用時間
- 使用回数の統計

### APIキーの削除

APIキーを無効にする場合：
1. 削除したいAPIキーを見つける
2. **削除**ボタンをクリック
3. 削除操作を確認

:::警告 注意
APIキーを削除すると、そのキーを使用しているすべてのアプリケーションはAPIにアクセスできなくなります。
:::

## APIキーの使用

### cURL例

```bash
curl -X GET "https://your-tianji-domain.com/open/global/config" \
  -H "Authorization: Bearer <your_api_key_here>" \
  -H "Content-Type: application/json"
```

### JavaScript/Node.js例

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

### Python例

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

### PHP例

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

APIキーはその作成者のすべての権限を継承します。これには以下が含まれます：
- ユーザーのワークスペース内のすべてのデータへのアクセス
- ユーザーが許可されたすべての操作の実行
- ユーザーが作成したリソースの管理

### ワークスペースアクセス

APIキーはユーザーが所属するワークスペースにのみアクセスできます。複数のワークスペースにアクセスする必要がある場合、ユーザーアカウントにそのワークスペースに対する適切な権限があることを確認してください。

## エラーハンドリング

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
- Authorizationヘッダーが提供されていない
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
- ユーザーがリクエストされたリソースにアクセスする権限がない

### 認証問題のデバッグ

1. **APIキーのフォーマットを確認**：`Bearer token_here`形式を使用していることを確認
2. **キーの有効性を確認**：キーがまだTianjiのインターフェースに存在することを確認
3. **権限を確認**：ユーザーアカウントがターゲットリソースにアクセスする権限を持っていることを確認
4. **単純なエンドポイントをテスト**：まず`/global/config`のような公開エンドポイントをテストしてください
