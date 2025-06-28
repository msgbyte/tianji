---
sidebar_position: 1
_i18n_hash: d9dd1597f6c275ebc68c7421c31b29fe
---
# サーバーステータスレポーター

tianji reporterを使えば、サーバーステータスを簡単に報告できます。

[https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases) からダウンロードできます。

## 使用法

```
tianji-reporterの使用:
  --interval int
        INTERVALを入力、秒単位 (デフォルトは5)
  --mode http
        レポートデータの送信モードを選択できます: `http` または `udp`、デフォルトは `http` (デフォルト "http")
  --name string
        このマシンの識別名
  --url string
        tianjiのhttp URL、例: https://tianji.msgbyte.com
  --vnstat
        トラフィック統計にvnstatを使用、Linuxのみ
  --workspace string
        tianjiのワークスペースID、これはUUIDである必要があります
```

**url**と**workspace**は必須であり、どのホストとどのワークスペースにサービスを報告するかを意味します。

デフォルトではサーバーノード名はホスト名と同じになりますが、`--name`を使用して名前をカスタマイズすることで、サーバーを識別しやすくなります。

## 自動インストールスクリプト

`Tianji` -> `Servers` -> `Add` -> `Auto`タブで自動インストールスクリプトを入手できます。

これにより、自動的にレポーターをダウンロードし、マシンでLinuxサービスを作成します。そのためルート権限が必要です。

### アンインストール

レポーターサービスをアンインストールしたい場合は、以下のコマンドを使用できます:
```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
```

インストールコマンドに`-s uninstall`を追加するのが主な変更点です。

## Q&A

### tianjiレポーターサービスログを確認するには？

自動インストールスクリプトでインストールした場合、tianjiはLinuxマシンに`tianji-reporter`というサービスをインストールします。

以下のコマンドでtianjiレポーターのログを確認できます:

```bash
journalctl -fu tianji-reporter.service
```

### レポートが成功したのにサーバータブにマシンがない

おそらくあなたのtianjiは逆プロキシ（例えば`nginx`）の背後にあるかもしれません。

逆プロキシがWebSocketサポートを追加していることを確認してください。

## なぜ私のマシンは常にオフラインですか？

サーバーの日時を確認してください。
