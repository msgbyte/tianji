---
sidebar_position: 100
_i18n_hash: 05e241c8bd878bb8fb511bdc81a2cee9
---
# トラブルシューティング

この文書では、Tianji を使用する際に遭遇する可能性のある一般的な問題とその解決策を集めています。

## WebSocket 接続の問題

### 問題の説明

HTTPS サービスを使用しているとき、他の機能は正常に動作するが、WebSocket サービスが適切に接続できないことがあります。現象としては次のようなものがあります:

- 左下の接続ステータスインジケーターが灰色を表示する
- サーバーページリストが件数を表示するが、実際のコンテンツが表示されない

### 根本的な原因

この問題は通常、リバースプロキシソフトウェアの不適切な WebSocket 転送ポリシーが原因です。HTTPS 環境では、WebSocket 接続は正しい Cookie セキュリティポリシーを必要とします。

### 解決策

以下の環境変数を設定することでこの問題を解決できます:

```bash
AUTH_USE_SECURE_COOKIES=true
```

この設定により、ブラウザが渡すクッキーを暗号化されたクッキーとして扱うようアプリケーションを強制し、結果として WebSocket 接続の問題を解決します。

#### 設定方法

**Docker 環境:**
```yaml
# docker-compose.yml
services:
  tianji:
    environment:
      - AUTH_USE_SECURE_COOKIES=true
```

**直接デプロイ:**
```bash
export AUTH_USE_SECURE_COOKIES=true
```

**systemd サービス:**
```ini
[Service]
Environment=AUTH_USE_SECURE_COOKIES=true
```

### 検証手順

設定後、サービスを再起動し、次のことを確認します:

1. 左下の接続ステータスインジケーターが緑色になっていること
2. サーバーページがリアルタイムデータを正常に表示すること
3. ブラウザの開発者ツールで WebSocket 接続が適切に確立されていること

---

*他の問題に遭遇した場合は、[Issue](https://github.com/msgbyte/tianji/issues)を送信するか、この文書に解決策を提供していただければと思います。*
