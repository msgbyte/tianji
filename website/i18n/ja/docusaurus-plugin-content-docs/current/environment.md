---
sidebar_position: 2
_i18n_hash: c65e22ae3d729a07b0b23f525a89b8ca
---
# 環境

以下はDockerで設定できる環境変数です。

| 名前 | デフォルト値 | 説明 |
| ---- | ---- | ----- |
| JWT_SECRET | - | シークレットキーの計算に使用されるランダムな文字列 |
| ALLOW_REGISTER | false | ユーザーがアカウントを登録できるかどうか |
| ALLOW_OPENAPI | false | UIを使用してデータを取得または投稿できるOpenAPIを許可するかどうか |
| SANDBOX_MEMORY_LIMIT | 16 | カスタムスクリプトモニターのサンドボックスメモリ制限（単位：MB、最小値は8） |
| MAPBOX_TOKEN | - | デフォルトの訪問者マップを置き換えるためのMapBoxトークン |
| AMAP_TOKEN | - | デフォルトの訪問者マップを置き換えるためのAMapトークン |
| CUSTOM_TRACKER_SCRIPT_NAME | - | 広告ブロック用にデフォルトの`tracker.js`スクリプト名を変更 |
| DISABLE_ANONYMOUS_TELEMETRY | false | テレメトリレポートの送信を無効にし、最小限の匿名性で使用状況を公式サイトに報告 |
| DISABLE_AUTO_CLEAR | false | 自動データクリアを無効にする |
