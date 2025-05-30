---
sidebar_position: 7
_i18n_hash: f6c7dbe145cf9dcabd803f4db67fbe69
---
# OpenAPI SDK使用ガイド

このドキュメントは、Tianji SDKを使用してOpenAPIインターフェースを呼び出し、Tianjiサービスに完全にプログラムでアクセスする方法についての詳細な手順を提供します。

## 概要

Tianji OpenAPI SDKは、自動生成されたTypeScriptクライアントを基にしており、型安全なAPI呼び出しメソッドを提供します。SDKを通じて、以下のことが可能です：

- ワークスペースとウェブサイトの管理
- 分析データと統計の取得
- 監視プロジェクトの操作
- 調査の管理
- フィードチャンネルとイベントの処理
- ...

[完全なAPIドキュメント](/api)

## インストールと初期化

### SDKのインストール

```bash
npm install tianji-client-sdk
# または
yarn add tianji-client-sdk
# または
pnpm add tianji-client-sdk
```

### OpenAPIクライアントの初期化

```javascript
import { initOpenapiSDK } from 'tianji-client-sdk';

initOpenapiSDK('https://your-tianji-domain.com', {
  apiKey: 'your-api-key'
});
```

## グローバル設定API

### システム設定の取得

```javascript
import { openApiClient } from 'tianji-client-sdk';

async function getSystemConfig() {
  try {
    const config = await openApiClient.GlobalService.globalConfig();
    
    console.log('登録許可:', config.allowRegister);
    console.log('AI機能有効化:', config.enableAI);
    console.log('課金有効化:', config.enableBilling);
    
    return config;
  } catch (error) {
    console.error('システム設定の取得に失敗しました:', error);
  }
}
```
