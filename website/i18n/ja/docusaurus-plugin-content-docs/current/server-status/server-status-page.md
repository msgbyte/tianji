---
sidebar_position: 2
_i18n_hash: cecc3b1b7eb92c03797671e2ab259486
---
# サーバーステータスページ

サーバーステータスページを作成して、ユーザーにサーバーステータスを公開し、他の人々に知らせることができます。

## カスタムドメインの設定

ステータスページを自分のドメインで設定できます。例えば: `status.example.com`

ページ設定でこれを設定し、DNSダッシュボードで`CNAME`レコードを作成します。

```
CNAME status.example.com tianji.example.com
```

その後、カスタムドメイン `status.example.com` でページにアクセスできます。

### トラブルシューティング

500エラーが発生する場合、リバースプロキシが正しく構成されていない可能性があります。

リバースプロキシに新しいステータスルートが含まれていることを確認してください。

例:
```
server {
  listen 80;
  server_name tianji.example.com status.example.com;
  listen 443 ssl;
}
```
