---
sidebar_position: 1
_i18n_hash: 848acc7fae249b1c435a363e4693a5c7
---
# サーバーステータスレポーター

tianjiレポーターを使用して、サーバーのステータスを簡単に報告できます。

[https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases) からダウンロードできます。

## 使用方法

```
tianji-reporter の使用方法:
  --interval int
        間隔を秒単位で入力します (デフォルト 5)
  --mode http
        レポートデータの送信モードを選択します: `http` または `udp`、デフォルトは `http` (デフォルト "http")
  --name string
        このマシンの識別名
  --url string
        tianjiのhttp URL、例: https://tianji.msgbyte.com
  --vnstat
        トラフィック統計にvnstatを使用します、Linuxのみ
  --workspace string
        tianjiのワークスペースID、これはUUIDである必要があります
```

**url** と **workspace** は必須です。これは、サービスをどのホストとワークスペースに報告するかを意味します。

デフォルトでは、サーバーノード名はホスト名と同じになります。したがって、`--name` を使用してサーバーを識別できるようにカスタマイズできます。

## 自動インストールスクリプト

`Tianji` -> `Servers` -> `Add` -> `Auto` タブで自動インストールスクリプトを取得できます。

レポーターを自動的にダウンロードし、Linuxサービスをマシンに作成します。したがって、root権限が必要です。

### アンインストール

レポーターサービスをアンインストールしたい場合は、次のコマンドを使用できます:
```bash
curl -o- https://tianji.exmaple.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | bash -s uninstall
```

主な変更点は、インストールコマンドの後に `-s uninstall` を追加することです。

## Q&A

### tianjiレポーターサービスのログを確認するにはどうすればいいですか？

自動インストールスクリプトでインストールした場合、tianjiは `tianji-reporter` という名前のサービスをLinuxマシンにインストールします。

次のコマンドを使用してtianjiレポーターのログを確認できます:

```bash
journalctl -fu tianji-reporter.service
```

### レポートが成功しているのにサーバータブにマシンが表示されない

tianjiが `nginx` などのリバースプロキシの背後にある可能性があります。

リバースプロキシがWebSocketをサポートしていることを確認してください。

## なぜマシンが常にオフラインなのですか？

サーバーの日時を確認してください。
