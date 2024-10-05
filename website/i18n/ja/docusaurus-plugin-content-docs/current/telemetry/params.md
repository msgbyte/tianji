---
sidebar_position: 2
_i18n_hash: ca2b25a29f0f1a82407be367a1d03553
---
# パラメータ

ここでは、テレメトリイメージを使用して設定する方法の例を示します。

すべてオプションです。異なる場所での使用を改善します。

| 名前 | 説明 |
| -------- | --------- |
| url | デフォルトでは、ブラウザによって自動生成されるリファラーURLを取得しますが、一部のウェブサイトではこのヘッダーを持ち込むことが許可されていません。そのため、自分で持ち込む必要があります。天機がどこにもURLを取得できない場合、システムは無視し、この訪問を記録しません。 |
| name | テレメトリイベント名を定義します。同じテレメトリレコード内の異なるイベントを区別するために使用できます。 |
| title | **[バッジのみ]**、バッジのタイトルを定義します。 |
| start | **[バッジのみ]**、バッジの開始カウント数を定義します。 |
| fullNum | **[バッジのみ]**、バッジが完全な数値を表示するかどうかを定義します。デフォルトでは省略形の桁数です（例：`12345` と `12.3k`）。 |

## 使用方法

URLにパラメータを簡単に持ち込むことができます。

例えば：

```
https://tianji.example.com/telemetry/<workspaceId>/<telemetryId>/badge.svg?name=myEvent&url=https://google.com&title=My+Counter&start=100000&fullNum=true
```

これに慣れていない場合は、このページに関するWikiページを確認できます：[https://en.wikipedia.org/wiki/Query_string](https://en.wikipedia.org/wiki/Query_string)
