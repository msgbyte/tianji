---
sidebar_position: 7
_i18n_hash: 31c4981c02a399801d9f7185e51b5e44
---
# OpenAPI SDK使用ガイド

このドキュメントは、天基SDKを使用してOpenAPIインターフェイスを呼び出し、天基サービスに完全にプログラムでアクセスする方法についての詳細な手順を提供します。

## 概要

天基OpenAPI SDKは、型安全なAPI呼び出し方法を提供する自動生成されたTypeScriptクライアントに基づいています。SDKを通じて以下が可能です：

- ワークスペースとウェブサイトの管理
- 分析データと統計情報の取得
- 監視プロジェクトの運用
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
    console.log('AI機能有効化:', config.ai.enable);
    console.log('課金機能有効化:', config.enableBilling);
    
    return config;
  } catch (error) {
    console.error('システム設定の取得に失敗しました:', error);
  }
}
```
