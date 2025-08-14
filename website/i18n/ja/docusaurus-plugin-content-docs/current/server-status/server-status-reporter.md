---
sidebar_position: 1
_i18n_hash: 21a5dc8265605536c8c328c551abdcc9
---
# サーバーステータスレポーター

Tianji レポーターを使うと、サーバーステータスを簡単に報告できます。

[https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases) からダウンロードしてください。

## 使用法

```
tianji-reporter の使用法:
  --interval int
        INTERVAL を秒で入力します (デフォルトは 5)
  --mode http
        レポートデータの送信モードを設定します。`http` または `udp` を選択可能です。デフォルトは `http` です (デフォルト "http")
  --name string
        このマシンの識別名
  --url string
        Tianji の http URL 例: https://tianji.msgbyte.com
  --vnstat
        トラフィック統計に vnstat を使用。Linux のみ
  --workspace string
        Tianji のワークスペース ID、UUID である必要があります
```

**url** と **workspace** は必須項目です。サービスを報告するホストとワークスペースを指定します。

サーバーノード名はデフォルトでホスト名と同じになりますが、`--name` オプションを使って自分で名前をカスタマイズでき、サーバーを特定するのに役立ちます。

## 自動インストールスクリプト

`Tianji` -> `Servers` -> `Add` -> `Auto` タブで自動インストールスクリプトを取得できます。

これにより、自動的にレポーターをダウンロードし、マシンに Linux サービスを作成します。そのため、root 権限が必要です。

### アンインストール

レポーターサービスをアンインストールしたい場合、以下のコマンドを使用します:

```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
``` 

主な変更点は、インストールコマンドに `-s uninstall` を追加することです。

## Kubernetes

サーバーが Kubernetes クラスターで動作している場合、レポーターを DaemonSet としてデプロイすることで、各ノードが自動的にメトリクスを報告するようにできます。詳細は [Deploy Reporter as DaemonSet](./kubernetes/reporter-daemonset.md) をご覧ください。

## Q&A

### Tianji レポーターサービスのログを確認するには？

自動インストールスクリプトでインストールした場合、Tianji は `tianji-reporter` という名前のサービスを Linux マシンにインストールします。

以下のコマンドで Tianji レポーターログを確認できます:

```bash
journalctl -fu tianji-reporter.service
```

### レポートが成功してもサーバータブにマシンが見つからない

もしかすると、Tianji がリバースプロキシ（例えば `nginx`）の背後にあるかもしれません。

リバースプロキシにウェブソケット対応がされているか確認してください。

## なぜ私のマシンは常にオフラインなのか？

サーバーの日時を確認してください。
