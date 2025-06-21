---
sidebar_position: 1
_i18n_hash: bf0ff03e7619ebadc59e7451f16ddf69
---
# MCPとの統合

<a href="https://cursor.com/install-mcp?name=tianji&config=eyJ0eXBlIjoic3RkaW8iLCJjb21tYW5kIjoibnB4IC15IHRpYW5qaS1tY3Atc2VydmVyIiwiZW52Ijp7IlRJQU5KSV9CQVNFX1VSTCI6IiIsIlRJQU5KSV9BUElfS0VZIjoiIiwiVElBTkpJX1dPUktTUEFDRV9JRCI6IiJ9fQ%3D%3D"><em><img src="https://cursor.com/deeplink/mcp-install-light.svg" alt="Add tianji MCP server to Cursor" height="32" /></em></a>

## はじめに

Tianji MCPサーバーは、AIアシスタントとTianjiプラットフォーム間のブリッジとして機能する、モデルコンテキストプロトコル（MCP）に基づくサーバーです。このサーバーは、MCPプロトコルを通じてAIアシスタントにTianjiプラットフォームの調査機能を公開します。このサーバーは以下の主な機能を提供します：

- 調査結果の照会
- 詳細な調査情報の取得
- ワークスペース内の全調査の取得
- ウェブサイトリストの取得

## インストール方法

### NPXインストール

Tianji MCPサーバーを使用するには、AIアシスタントの構成ファイルに次の設定を追加します：

```json
{
  "mcpServers": {
    "tianji": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "tianji-mcp-server"
      ],
      "env": {
        "TIANJI_BASE_URL": "https://tianji.example.com",
        "TIANJI_API_KEY": "<your-api-key>",
        "TIANJI_WORKSPACE_ID": "<your-workspace-id>"
      }
    }
  }
}
```

### 環境変数の設定

Tianji MCPサーバーを使用する前に、次の環境変数を設定する必要があります：

```bash
# TianjiプラットフォームAPIの基礎URL
TIANJI_BASE_URL=https://tianji.example.com

# TianjiプラットフォームAPIキー
TIANJI_API_KEY=your_api_key_here

# TianjiプラットフォームワークスペースID
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

### APIキーの取得

TianjiプラットフォームのAPIキーを取得するためには、次のステップを実行してください：

1. Tianjiプラットフォームにログインした後、右上の**プロフィール画像**をクリック
2. ドロップダウンメニューから**プロフィール**を選択
3. プロフィールページで**APIキー**オプションを見つける
4. 新しいキーを作成し、プロンプトに従ってキーの作成を完了

## 使用方法

Tianji MCPサーバーは、MCPプロトコルを通じてAIアシスタントと連携できる一連のツールを提供します。それぞれのツールの詳細は以下のとおりです：

### 調査結果の照会

特定の調査結果データを照会するための`tianji_get_survey_results`ツールを使用します。

**パラメータ：**

- `workspaceId`: TianjiワークスペースID（環境変数に設定されたデフォルト値）
- `surveyId`: 調査ID
- `limit`: 戻り記録数の制限（デフォルト20）
- `cursor`: ページネーションクラサー（オプション）
- `startAt`: 開始時間、ISO形式、例: 2023-10-01T00:00:00Z
- `endAt`: 終了時間、ISO形式、例: 2023-10-31T23:59:59Z
- `filter`: フィルター条件（オプション）

### 調査情報の取得

特定の調査に関する基本情報を取得するための`tianji_get_survey_info`ツールを使用します。

**パラメータ：**

- `workspaceId`: TianjiワークスペースID（環境変数に設定されたデフォルト値）
- `surveyId`: 調査ID

### 全調査リストの取得

ワークスペース内のすべての調査リストを取得するための`tianji_get_all_survey_list`ツールを使用します。

**パラメータ：**

- `workspaceId`: TianjiワークスペースID（環境変数に設定されたデフォルト値）

### ウェブサイトリストの取得

ワークスペース内のウェブサイトリストを取得するための`tianji_get_website_list`ツールを使用します。

**パラメータ：**

- `workspaceId`: TianjiワークスペースID（環境変数に設定されたデフォルト値）

## 使用例

以下は、Tianji MCPサーバーと統合されたAIアシスタントとの自然言語のやり取りの例です：

### 例1: 全調査リストの取得

```
ユーザー: 私の調査アンケートのリストをすべて表示してください

AIアシスタント: あなたの調査アンケートリストをすべて取得します。
[AIアシスタントがMCPプロトコルを通じてtianji_get_all_survey_listを呼び出してデータを取得]
あなたのワークスペースに基づく現在の調査は以下の通りです：
1. ユーザー体験満足度調査（2023-09-15に作成）
2. 製品フィードバック調査（2023-10-01に作成）
3. ウェブサイトの使いやすさ評価（2023-10-20に作成）
```

### 例2: 特定調査の詳細の取得

```
ユーザー: "ユーザー体験満足度調査"の詳細を教えてください

AIアシスタント: その調査の詳細を照会します。
[AIアシスタントがMCPプロトコルを通じてtianji_get_survey_infoを呼び出してデータを取得]
"ユーザー体験満足度調査"の詳細：
- 作成時間: 2023-09-15
- ステータス: アクティブ
- 質問数: 10
- 収集した回答数: 128
- 最新の回答: 2023-10-25
```

### 例3: 調査結果の照会

```
ユーザー: "製品フィードバック調査"の10月の結果を分析してください

AIアシスタント: 10月の"製品フィードバック調査"を分析します。
[AIアシスタントがMCPプロトコルを通じて特定の期間のデータを取得するためにtianji_get_survey_resultsを呼び出してデータを取得]
10月の"製品フィードバック調査"結果の分析:
- 総回答数: 42
- 最も人気のある機能: 自動レポート（85%のポジティブなフィードバック）
- 改善が最も必要な機能: モバイル適応（62%が言及）
- 平均満足度評価: 4.2/5
- 主なユーザーの提案: データエクスポート機能を追加し、ページ読み込み速度を最適化する
```
