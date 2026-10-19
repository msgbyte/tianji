---
sidebar_position: 1
_i18n_hash: 479219b036abf3d6006999bf96fd2ea9
---
```markdown
# サーバーステータスレポーター

tianji reporter を使ってサーバーステータスを簡単に報告できます。

[https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases) からダウンロード可能です。

## 使用法

```
tianji-reporter の使用方法:
  --interval int
        INTERVAL（秒）を入力 (デフォルトは 5)
  --mode http
        レポートデータの送信モード、選択可能: `http` または `udp`。デフォルトは `http` (デフォルト "http")
  --name string
        このマシンの識別名
  --url string
        tianji の http URL、例: https://tianji.dev
  --vnstat
        トラフィック統計に vnstat を使用、Linux のみ
  --workspace string
        tianji のワークスペース ID、UUID である必要があります
```

**url** および **workspace** は必須です。どのホストおよびどのワークスペースにサービスを報告するかを意味します。

デフォルトでサーバーノード名はホスト名と同じになりますが、`--name` を使用して名前をカスタマイズすることができ、サーバーを識別するのに役立ちます。

## 自動インストールスクリプト

`Tianji` -> `Servers` -> `Add` -> `Auto` タブで自動インストールスクリプトを取得できます。

これはリポーターを自動ダウンロードし、マシンに Linux サービスを作成します。そのため、root 権限が必要です。

### アンインストール

リポーターサービスをアンインストールしたい場合、このコマンドを使用できます:
```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
```

主な変更は、インストールコマンドに `-s uninstall` を追加することです。

## Kubernetes

サーバーが Kubernetes クラスターで実行されている場合、リポーターを DaemonSet としてデプロイし、各ノードが自動的にメトリクスを報告するようにできます。詳細は [Deploy Reporter as DaemonSet](./kubernetes/reporter-daemonset.md) を参照してください。

## Q&A

### tianji リポーターサービスのログを確認するには？

自動インストールスクリプトを用いてインストールした場合、tianji は `tianji-reporter` という名前のサービスを Linux マシンにインストールします。

このコマンドを使用して tianji リポーターのログを確認できます:

```bash
journalctl -fu tianji-reporter.service
```

### レポートが成功と表示されてもサーバータブにマシンが見つからない

例えば `nginx` のように tianji がリバースプロキシの背後にあるかもしれません。

リバースプロキシに WebSocket サポートを追加してください。

## なぜ私のマシンは常にオフラインですか？

サーバーの日付と時刻を確認してください。
```
