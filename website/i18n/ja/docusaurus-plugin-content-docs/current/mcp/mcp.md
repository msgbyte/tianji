---
sidebar_position: 1
_i18n_hash: 50d592e977b3f195d40bd2931b68269b
---
# MCPとの統合

<a href="https://cursor.com/install-mcp?name=tianji&config=eyJ0eXBlIjoic3RkaW8iLCJjb21tYW5kIjoibnB4IC15IHRpYW5qaS1tY3Atc2VydmVyIiwiZW52Ijp7IlRJQU5KSV9CQVNFX1VSTCI6IiIsIlRJQU5KSV9BUElfS0VZIjoiIiwiVElBTkpJX1dPUktTUEFDRV9JRCI6IiJ9fQ%3D%3D"><em><img src="https://cursor.com/deeplink/mcp-install-light.svg" alt="Cursorにtianji MCPサーバーを追加" height="32" /></em></a>
<br />
[![Kiroに追加](https://kiro.dev/images/add-to-kiro.svg)](https://kiro.dev/launch/mcp/add?name=tianji&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22tianji-mcp-server%22%5D%2C%22env%22%3A%7B%22TIANJI_BASE_URL%22%3A%22https%3A%2F%2Ftianji.example.com%22%2C%22TIANJI_API_KEY%22%3A%22%3Cyour-api-key%3E%22%2C%22TIANJI_WORKSPACE_ID%22%3A%22%3Cyour-workspace-id%3E%22%7D%7D)

## はじめに

Tianji MCPサーバーは、AIアシスタントとTianjiプラットフォーム間のブリッジとして機能するModel Context Protocol（MCP）に基づくサーバーです。このサーバーは、MCPプロトコルを通じてTianjiプラットフォームの調査機能をAIアシスタントに公開します。このサーバーは以下の主要機能を提供します：

- 調査結果のクエリ
- 詳細な調査情報の取得
- 作業スペース内のすべての調査を取得
- ウェブサイトリストを取得

## インストール方法

### NPXインストール

Tianji MCPサーバーをAIアシスタントの設定ファイルに以下の構成を追加して使用できます：

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

### 環境変数設定

Tianji MCPサーバーを使用する前に、以下の環境変数を設定する必要があります：

```bash
# TianjiプラットフォームAPI基本URL
TIANJI_BASE_URL=https://tianji.example.com

# TianjiプラットフォームAPIキー
TIANJI_API_KEY=your_api_key_here

# Tianjiプラットフォーム作業スペースID
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

### APIキーの取得

TianjiプラットフォームのAPIキーを取得するには、以下の手順に従ってください：

1. Tianjiプラットフォームにログインした後、右上の**プロフィール写真**をクリック
2. ドロップダウンメニューから**プロフィール**を選択
3. プロフィールページで**APIキー**オプションを見つける
4. 新しいキーを作成し、プロンプトに従ってキー作成を完了する

## 使用方法

Tianji MCPサーバーは、MCPプロトコルを通じてAIアシスタントとやり取りできる一連のツールを提供します。以下に各ツールの詳細な説明があります：

### 調査結果のクエリ

`tianji_get_survey_results`ツールを使用して、特定の調査結果データをクエリできます。

**パラメータ：**

- `workspaceId`: TianjiワークスペースID（環境変数で設定された値がデフォルト）
- `surveyId`: 調査ID
- `limit`: 返されるレコード数の制限（デフォルト20）
- `cursor`: ページネーションカーソル（オプション）
- `startAt`: 開始時間、ISO形式、例：2023-10-01T00:00:00Z
- `endAt`: 終了時間、ISO形式、例：2023-10-31T23:59:59Z
- `filter`: フィルター条件（オプション）

### 調査情報の取得

`tianji_get_survey_info`ツールを使用して、特定の調査に関する基本情報を取得できます。

**パラメータ：**

- `workspaceId`: TianjiワークスペースID（環境変数で設定された値がデフォルト）
- `surveyId`: 調査ID

### すべての調査リストを取得

`tianji_get_all_survey_list`ツールを使用して、作業スペース内のすべての調査のリストを取得できます。

**パラメータ：**

- `workspaceId`: TianjiワークスペースID（環境変数で設定された値がデフォルト）

### ウェブサイトリストを取得

`tianji_get_website_list`ツールを使用して、作業スペース内のウェブサイトリストを取得できます。

**パラメータ：**

- `workspaceId`: TianjiワークスペースID（環境変数で設定された値がデフォルト）

## 使用例

以下は、Tianji MCPサーバーと統合されたAIアシスタントとの自然言語によるやり取りの例です：

### 例1: すべての調査リストを取得

```
ユーザー: すべての調査アンケートリストを表示するのを手伝ってください

AIアシスタント: すべての調査アンケートリストを取得します。
[AIアシスタントがMCPプロトコルを通じてtianji_get_all_survey_listを呼び出し、データを取得]
お客様のワークスペースのデータに基づいて、現在以下の調査があります：
1. ユーザー経験満足度調査（2023-09-15作成）
2. 製品機能フィードバック調査（2023-10-01作成）
3. ウェブサイト使いやすさ評価（2023-10-20作成）
```

### 例2: 特定の調査詳細を取得

```
ユーザー: 「ユーザー経験満足度調査」の詳細を教えてください

AIアシスタント: その調査の詳細をクエリします。
[AIアシスタントがMCPプロトコルを通じてtianji_get_survey_infoを呼び出し、データを取得]
「ユーザー経験満足度調査」の詳細：
- 作成日時: 2023-09-15
- ステータス: アクティブ
- 質問数: 10
- 集計された回答: 128
- 最も最近の回答: 2023-10-25
```

### 例3: 調査結果をクエリ

```
ユーザー: 「製品機能フィードバック調査」の10月の結果を分析する手助けをお願いします

AIアシスタント: 「製品機能フィードバック調査」の10月の結果を分析します。
[AIアシスタントがMCPプロトコルを通じて特定の時間範囲でtianji_get_survey_resultsを呼び出し、データを取得]
「製品機能フィードバック調査」の10月の結果の分析：
- 総回答数: 42
- 最も人気のある機能: 自動レポート（85%の肯定的なフィードバック）
- 改善が最も必要な機能: モバイル対応（62%が言及）
- 平均満足度評価: 4.2/5
- 主なユーザー提案: データエクスポート機能の追加、ページ読み込み速度の最適化
```
