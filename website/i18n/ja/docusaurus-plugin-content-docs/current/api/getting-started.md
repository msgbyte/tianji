---
sidebar_position: 1
_i18n_hash: 2a8dfc997c42846304cde1b51f4d6145
---
# API はじめに

Tianji は、Tianji のすべての機能にプログラムでアクセスして操作できる包括的な REST API を提供しています。このガイドでは、Tianji API を迅速に開始するための手助けをします。

## 概要

Tianji API は REST アーキテクチャに基づいており、データ交換には JSON フォーマットを使用します。すべての API リクエストは HTTPS 経由で行われ、適切な認証が必要です。

### API ベース URL

```bash
https://your-tianji-domain.com/open
```

### サポートされている機能

Tianji API を通じて、次のことができます：

- ウェブサイトの分析データを管理
- モニタリングプロジェクトを作成および管理
- サーバーのステータス情報を取得
- 調査を管理
- テレメトリーデータを操作
- ワークスペースの作成と管理

## クイックスタート

### 1. API キーの取得

API を使用する前に、API キーを取得する必要があります：

1. Tianji インスタンスにログイン
2. 右上のアバターをクリック
3. **API キー**セクションを見つける
4. 新しい API キーを作成するために + ボタンをクリック
5. API キーに名前を付けて保存

### 2. OpenAPI の有効化

Tianji インスタンスで OpenAPI アクセスが有効であることを確認します：

環境変数で次を設定してください：
```bash
ALLOW_OPENAPI=true
```

### 3. 最初の API コール

curl を使用して API 接続をテストします：

```bash
curl -X GET "https://your-tianji-domain.com/open/global/config" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "Content-Type: application/json"
```

## 次のステップ

- 詳細な認証方法は[認証ドキュメント](./authentication.md)をご覧ください
- すべての利用可能なエンドポイントについては[API リファレンスドキュメント](/api)を参照してください
- 型安全な API コールを行うために [OpenAPI SDK](./openapi-sdk.md) を使用してください
