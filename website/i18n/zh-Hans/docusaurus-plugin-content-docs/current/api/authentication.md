---
sidebar_position: 2
_i18n_hash: a82bcf148feb70ec31d10a96cffc2795
---
# 身份验证

本文档提供了如何通过天际 API 进行身份验证的详细说明，包括如何获取、使用和管理 API 密钥。

## 身份验证方法

天际 API 使用 **Bearer Token** 身份验证。您需要在每次 API 请求的 HTTP 头中包含您的 API 密钥。

### HTTP 头格式

```http
Authorization: Bearer <YOUR_API_KEY>
```

## 获取 API 密钥

1. 登录到您的天际实例
2. 点击右上角的头像
3. 找到 **API 密钥** 部分
4. 点击 + 按钮创建一个新的 API 密钥
5. 为您的 API 密钥命名并保存

## API 密钥管理

### 查看现有密钥

在 **API 密钥** 部分，您可以看到：
- API 密钥名称/描述
- 创建日期
- 上次使用时间
- 使用次数统计

### 删除 API 密钥

如需撤销 API 密钥：
1. 找到您想要删除的 API 密钥
2. 点击 **删除** 按钮
3. 确认删除操作

:::warning 注意
删除 API 密钥后，所有使用该密钥的应用程序将无法访问 API。
:::

## 使用 API 密钥

### cURL 示例

```bash
curl -X GET "https://your-tianji-domain.com/open/global/config" \
  -H "Authorization: Bearer <your_api_key_here>" \
  -H "Content-Type: application/json"
```

### JavaScript/Node.js 示例

```javascript
const apiKey = '<your_api_key_here>';
const baseUrl = 'https://your-tianji-domain.com/open';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

// 使用 fetch
const response = await fetch(`${baseUrl}/global/config`, {
  method: 'GET',
  headers: headers
});

// 使用 axios
const axios = require('axios');
const response = await axios.get(`${baseUrl}/global/config`, {
  headers: headers
});
```

### Python 示例

```python
import requests

api_key = '<your_api_key_here>'
base_url = 'https://your-tianji-domain.com/open'

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

# 使用 requests 库
response = requests.get(f'{base_url}/global/config', headers=headers)
data = response.json()
```

### PHP 示例

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

## 权限和范围

### API 密钥权限

API 密钥继承其创建者的所有权限，包括：
- 访问用户工作空间中的所有数据
- 执行用户有权限进行的所有操作
- 管理该用户创建的资源

### 工作空间访问

API 密钥只能访问用户所属的工作空间。如果您需要访问多个工作空间，请确保您的用户帐户对这些工作空间具有适当权限。

## 错误处理

### 常见身份验证错误

#### 401 未授权

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authorization not provided"
  }
}
```

**原因**：
- 未提供授权头
- API 密钥格式错误

#### 403 禁止访问

```json
{
  "error": {
    "code": "FORBIDDEN", 
    "message": "Insufficient access"
  }
}
```

**原因**：
- 无效或已删除的 API 密钥
- 用户无权访问请求的资源

### 调试身份验证问题

1. **检查 API 密钥格式**：确保您使用的是 `Bearer token_here` 格式
2. **验证密钥有效性**：确认密钥仍然存在于天际界面中
3. **检查权限**：确保用户帐户有权限访问目标资源
4. **测试简单端点**：从测试公共端点如 `/global/config` 开始
