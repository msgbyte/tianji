---
sidebar_position: 2
_i18n_hash: 0ab5a3f0d3e61495d00a9489e9a3f806
---
# プッシュモニター

プッシュモニターは、アプリケーションが**Tianji**にハートビート信号を能動的に送信する監視方法であり、Tianjiがあなたのサービスをチェックする代わりとなります。特に、バックグラウンドタスク、cronジョブ、またはファイアウォールの背後にあるサービスを監視するのに役立ちます。

## 仕組み

1. **Tianji**がユニークなプッシュエンドポイントURLを提供
2. 定期的にこのエンドポイントにHTTP POSTリクエストを送信
3. 設定されたタイムアウト期間内にハートビートが受信されない場合、Tianjiがアラートをトリガー

## 設定

プッシュモニターを作成する際には以下を設定します：

- **モニター名**: モニターの説明的な名前
- **タイムアウト**: ハートビート間でサービスをダウンと見なすまで待つ最大時間（秒）
- **推奨間隔**: アプリケーションがハートビートを送信する頻度（通常はタイムアウトと同じ）

## プッシュエンドポイントフォーマット

```
POST https://tianji.example.com/api/push/{pushToken}
```

### ステータスパラメータ

- **正常ステータス**: パラメータなしまたは`?status=up`付きで送信
- **ダウンステータス**: `?status=down`付きで送信して手動でアラートをトリガー
- **カスタムメッセージ**: `&msg=your-message`を追加して追加情報を含める
- **カスタム値**: `&value=123`を追加して数値をトラッキング

## 例

### 基本的なハートビート (cURL)

```bash
# 60秒ごとにハートビートを送信
while true; do
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>"
  sleep 60
done
```

### JavaScript/Node.js

```javascript
// 60秒ごとにハートビートを送信
setInterval(async () => {
  try {
    await fetch('https://tianji.example.com/api/push/<your-push-token>', { 
      method: 'POST' 
    });
    console.log('ハートビートを正常に送信しました');
  } catch (error) {
    console.error('ハートビートの送信に失敗しました:', error);
  }
}, 60000);
```

### Python

```python
import requests
import time

def send_heartbeat():
    try:
        response = requests.post('https://tianji.example.com/api/push/<your-push-token>')
        print('ハートビートを正常に送信しました')
    except Exception as e:
        print(f'ハートビートの送信に失敗しました: {e}')

# 60秒ごとにハートビートを送信
while True:
    send_heartbeat()
    time.sleep(60)
```

## ユースケース

### 1. Cronジョブ

スケジュールされたタスクの実行を監視：

```bash
#!/bin/bash
# your-cron-job.sh

# 実際のジョブロジックはこちら
./run-backup.sh

# 成功信号を送信
if [ $? -eq 0 ]; then
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>?status=up&msg=backup-completed"
else
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>?status=down&msg=backup-failed"
fi
```

### 2. バックグラウンドサービス

長時間実行するバックグラウンドプロセスを監視：

```python
import requests
import time
import threading

class ServiceMonitor:
    def __init__(self, push_url):
        self.push_url = push_url
        self.running = True
        
    def start_heartbeat(self):
        def heartbeat_loop():
            while self.running:
                try:
                    requests.post(self.push_url)
                    time.sleep(30)  # 30秒ごとに送信
                except Exception as e:
                    print(f"ハートビートに失敗しました: {e}")
        
        thread = threading.Thread(target=heartbeat_loop)
        thread.daemon = True
        thread.start()

# 使用例
monitor = ServiceMonitor('https://tianji.example.com/api/push/<your-push-token>')
monitor.start_heartbeat()

# メインサービスロジックはこちら
while True:
    # 作業を実行
    time.sleep(1)
```

### 3. データベース同期ジョブ

データ同期タスクを監視：

```python
import requests
import schedule
import time

def sync_data():
    try:
        # データ同期ロジックはこちら
        result = perform_data_sync()
        
        if result.success:
            requests.post(
                'https://tianji.example.com/api/push/<your-push-token>',
                params={'status': 'up', 'msg': f'synced-{result.records}-records'}
            )
        else:
            requests.post(
                'https://tianji.example.com/api/push/<your-push-token>',
                params={'status': 'down', 'msg': 'sync-failed'}
            )
    except Exception as e:
        requests.post(
            'https://tianji.example.com/api/push/<your-push-token>',
            params={'status': 'down', 'msg': f'error-{str(e)}'}
        )

# 毎時実行するようスケジュール
schedule.every().hour.do(sync_data)

while True:
    schedule.run_pending()
    time.sleep(1)
```

## ベストプラクティス

1. **適切なタイムアウト設定**: アプリケーションのニーズに基づいてタイムアウト値を設定します。頻繁なタスクには短いタイムアウト、周期的なジョブには長いタイムアウトを使用します。

2. **ネットワーク障害の処理**: 一時的なネットワーク問題に対処するためにハートビートコードにリトライロジックを実装します。

3. **意味のあるメッセージを使用**: ハートビートに説明的なメッセージを含め、ログを確認する際にコンテキストを提供します。

4. **重要なパスを監視**: アプリケーションフローの重要箇所にハートビートコールを配置し、開始地点だけでなく監視します。

5. **例外処理**: アプリケーションで例外が発生した場合に「ダウン」ステータスを送信します。

## トラブルシューティング

### よくある問題

**ハートビートが受信されない**:
- プッシュトークンが正しいか確認
- アプリケーションからTianjiへのネットワーク接続をチェック
- アプリケーションがハートビートコードを実際に実行していることを確認

**頻発する誤警報**:
- タイムアウト値を増やす
- アプリケーションがパフォーマンス問題を抱えていないかチェック
- アプリとTianji間のネットワーク安定性を確認

**ハートビートが欠けている**:
- ハートビートコードにエラーハンドリングとロギングを追加
- リトライロジックを失敗したリクエストに実装検討
- アプリケーションのリソース使用状況を監視

## セキュリティ考慮事項

- プッシュトークンを安全に保ち、公のリポジトリに露出させないこと
- 通信を暗号化するためにHTTPSエンドポイントを使用
- 定期的にプッシュトークンをローテーション検討
- Tianjiインスタンスをオーバーロードしないようにハートビートの頻度を制限

プッシュ監視は、従来のpingベースの監視が届かないサービスを監視する信頼性の高い方法を提供し、包括的なインフラストラクチャ監視に不可欠なツールです。
