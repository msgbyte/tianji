---
sidebar_position: 100
_i18n_hash: 2419750faca3b35056a24bc0a5e02a22
---
# トラブルシューティング

このドキュメントは、Tianji を使用する際に遭遇する可能性のある一般的な問題とその解決策をまとめたものです。

## WebSocket 接続問題

### 問題の説明

HTTPS サービスを使用している際、他の機能は正常に動作するが、WebSocket サービスが適切に接続できないことがあります。具体的には以下のように表れます：

- 画面左下の接続状態インジケーターが灰色を示す
- サーバーページリストが数を示すが、実際のコンテンツが表示されない

### 根本原因

この問題は通常、リバースプロキシソフトウェア内の不適切なWebSocket転送ポリシーによって引き起こされます。HTTPS環境では、WebSocket接続は正しいCookieセキュリティポリシーを必要とします。

### 解決策

次の環境変数を設定することでこの問題を解決できます：

```bash
AUTH_USE_SECURE_COOKIES=true
```

この設定は、アプリケーションがブラウザから渡されたクッキーを暗号化されたクッキーとして扱うように強制し、WebSocket接続の問題を解決します。

#### 設定方法

**Docker環境：**
```yaml
# docker-compose.yml
services:
  tianji:
    environment:
      - AUTH_USE_SECURE_COOKIES=true
```

**直接デプロイ：**
```bash
export AUTH_USE_SECURE_COOKIES=true
```

### 検証手順

設定後、サービスを再起動して以下を確認してください：

1. 左下の接続状態インジケーターが緑色を示す
2. サーバーページにリアルタイムデータが正常に表示される
3. ブラウザの開発者ツールでWebSocket接続が適切に確立される

---

*他の問題に遭遇した場合は、お気軽に [Issue](https://github.com/msgbyte/tianji/issues) を提出するか、このドキュメントへの解決策の貢献をお願いいたします。*
