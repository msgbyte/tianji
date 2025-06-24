---
sidebar_position: 1
_i18n_hash: 1de8a86599061f446dd0699137a4e68c
---
# サーバーステータスレポーター

Tianjiレポーターを使えば、簡単にサーバーステータスを報告できます。

[こちらからダウンロード可能です。](https://github.com/msgbyte/tianji/releases)

## 使い方

```
tianji-reporterの使用法:
  --interval int
        INTERVALを入力してください（秒、デフォルトは5）
  --mode http
        レポートデータの送信モード。`http`または`udp`を選択できます。デフォルトは`http`です（デフォルトは「http」）
  --name string
        このマシンの識別名
  --url string
        Tianjiのhttp URL（例： https://tianji.msgbyte.com）
  --vnstat
        トラフィック統計にvnstatを使用（Linuxのみ）
  --workspace string
        TianjiのワークスペースID、UUIDである必要があります
```

**url**と**workspace**は必須です。これは、どのホストとどのワークスペースにサービスを報告するかを意味します。

デフォルトで、サーバーノード名はホスト名と同じになります。`--name`を使用して名前をカスタマイズすることで、サーバーを識別するのに役立ちます。

## 自動インストールスクリプト

自動インストールスクリプトは `Tianji` -> `Servers` -> `Add` -> `Auto` タブで取得できます。

これにより、レポーターが自動的にダウンロードされ、マシンにLinuxサービスが作成されます。ルート権限が必要です。

### アンインストール

レポータサービスをアンインストールしたい場合は、次のコマンドを使用できます：
```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
``` 

主要な変更点は、インストールコマンドの後に `-s uninstall` を追加することです。

## Q&A

### Tianjiレポータサービスのログを確認するには？

自動インストールスクリプトを使用してインストールした場合、TianjiはLinuxマシンに `tianji-reporter` という名前のサービスをインストールします。

次のコマンドを使用してTianjiレポータのログを確認できます：

```bash
journalctl -fu tianji-reporter.service
```

### サーバータブにマシンが見つからないが、報告は成功表示される

おそらく、あなたのTianjiはリバースプロキシ（例えば、`nginx`）の背後にいるためです。

リバースプロキシがWebSocketサポートを追加していることを確認してください。

## どうして私のマシンは常にオフラインなの？

サーバーの日付と時刻を確認してください。
