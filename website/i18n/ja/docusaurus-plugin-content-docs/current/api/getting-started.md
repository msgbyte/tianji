---
sidebar_position: 1
_i18n_hash: a144af118d2aa2c5e95b1cee1897ae7a
---
# API 入門

Tianji は、すべての機能にプログラムでアクセスし操作できる完全な REST API を提供しています。このガイドでは、Tianji API の利用をすばやく開始する手順を説明します。

## 概要

Tianji API は REST アーキテクチャに基づいており、データ交換には JSON 形式を使用します。すべての API リクエストは HTTPS を介して行う必要があり、適切な認証が必要です。

### API 基本 URL

```bash
https://your-tianji-domain.com/open
```

### 対応機能

Tianji API を通じて、以下の操作が可能です：

- ウェブサイト分析データの管理
- モニタリングプロジェクトの作成と管理
- サーバーステータス情報の取得
- 調査の管理
- テレメトリーデータの操作
- ワークスペースの作成と管理

## クイックスタート

### 1. API キーを取得

API を使用する前に、API キーを取得する必要があります：

1. Tianji インスタンスにログインします
2. 右上のアバターをクリックします
3. **API キー** セクションを探します
4. + ボタンをクリックして新しい API キーを作成します
5. API キーに名前を付けて保存します

### 2. OpenAPI を有効化

Tianji インスタンスで OpenAPI アクセスが有効になっていることを確認します：

環境変数に以下を設定します：
```bash
ALLOW_OPENAPI=true
```

### 3. 最初の API コール

curl を使用して API 接続をテストします：

```bash
curl -X GET "https://your-tianji-domain.com/open/global/config" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

## 次のステップ

- 詳細な認証方法については、[認証ドキュメント](./authentication.md) を確認してください
- 利用可能なすべてのエンドポイントについては、[API リファレンスドキュメント](/api) を参照してください
- 型安全な API コールには、[OpenAPI SDK](./openapi-sdk.md) を使用してください
