---
sidebar_position: 2
_i18n_hash: 7ce5eca3bf7af802db48c3db37d996f5
---
# サーバーステータスページ

ユーザーがサーバーのステータスを公開したい場合、サーバーステータスページを作成できます。

## カスタムドメインの設定

ステータスページを独自のドメインで設定できます。例えば、`status.example.com` のように設定します。

ページ設定で設定し、DNSダッシュボードで `CNAME` レコードを作成します。

```
CNAME status.example.com tianji.example.com
```

その後、カスタムドメイン `status.example.com` でページにアクセスできます。
